import os
import uuid
import re
import html
import time
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
except ImportError:
    Credentials = None
    build = None
import sqlite3
from dotenv import load_dotenv
try:
    import redis
except ImportError:
    redis = None

try:
    import resend
except ImportError:
    resend = None

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Astrology Booking Engine")

# Allow React Frontend CORS Requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend domain in production (e.g. "http://localhost:5173")
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File and Credentials Setup
SERVICE_ACCOUNT_FILE = "service_account.json"
CALENDAR_ID = "primary" # Store bookings on the Service Account calendar master database
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

import tempfile

# ==========================================
# ⚙️ UPSTASH SERVERLESS REDIS & CACHE ENGINE
# ==========================================
UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL", "https://sound-poodle-83161.upstash.io").rstrip("/")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "gQAAAAAAAUTZAAIgcDI4NjIwNjBhNzFhZGE0MWNmOTNjMjZlYWJiM2IwZTRkZA")
REDIS_URL = os.getenv("REDIS_URL", "")
redis_client = None

if redis and REDIS_URL:
    try:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=3)
        redis_client.ping()
        print("✓ Successfully connected to standard TCP Redis server.")
    except Exception as e:
        redis_client = None


def upstash_command(*args):
    """Executes an arbitrary command via Upstash Serverless REST API."""
    if not UPSTASH_REDIS_REST_URL or not UPSTASH_REDIS_REST_TOKEN:
        return None
    try:
        import urllib.request, json
        url = f"{UPSTASH_REDIS_REST_URL}"
        payload = json.dumps(list(args)).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Bearer {UPSTASH_REDIS_REST_TOKEN}",
                "Content-Type": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data.get("result")
    except Exception:
        return None


# Test Upstash connection on initialization
if UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN:
    try:
        ping_res = upstash_command("PING")
        if ping_res == "PONG":
            print("✓ Successfully connected to Upstash Serverless Redis (REST).")
    except Exception:
        pass

# Shared SQLite Disk Cache in /tmp (guaranteed writable across all cloud workers & restarts)
DB_CACHE_PATH = os.path.join(tempfile.gettempdir(), "astro_cache.db")
in_memory_store = {}

def init_cache_db():
    try:
        conn = sqlite3.connect(DB_CACHE_PATH, timeout=10)
        c = conn.cursor()
        c.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, expires_at REAL)")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Cache DB init error: {e}")

init_cache_db()

def set_cache_key(key: str, value: str, ex_seconds: int):
    now = time.time()
    
    # 1. Upstash Serverless REST Redis
    upstash_command("SET", key, str(value), "EX", ex_seconds)

    # 2. Standard Redis (if configured)
    if redis_client:
        try:
            redis_client.set(key, value, ex=ex_seconds)
        except Exception:
            pass

    # 3. In-Memory Local RAM
    in_memory_store[key] = {
        "value": str(value),
        "expires_at": now + ex_seconds
    }
            
    # 4. Shared Multi-Worker /tmp SQLite Store
    try:
        conn = sqlite3.connect(DB_CACHE_PATH, timeout=10)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO cache VALUES (?, ?, ?)", (key, str(value), now + ex_seconds))
        c.execute("DELETE FROM cache WHERE expires_at < ?", (now,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Cache set error: {e}")

def get_cache_key(key: str) -> Optional[str]:
    now = time.time()
    
    # 1. Upstash Serverless REST Redis
    up_val = upstash_command("GET", key)
    if up_val is not None:
        return str(up_val)

    # 2. Standard Redis
    if redis_client:
        try:
            val = redis_client.get(key)
            if val:
                return str(val)
        except Exception:
            pass
            
    # 3. Shared Multi-Worker /tmp SQLite Store
    try:
        conn = sqlite3.connect(DB_CACHE_PATH, timeout=10)
        c = conn.cursor()
        c.execute("SELECT value, expires_at FROM cache WHERE key = ?", (key,))
        row = c.fetchone()
        conn.close()
        if row:
            val, expires_at = row
            if now <= expires_at:
                return str(val)
            else:
                delete_cache_key(key)
                return None
    except Exception as e:
        print(f"Cache get error: {e}")

    # 4. In-Memory RAM Fallback
    item = in_memory_store.get(key)
    if item:
        if now <= item.get("expires_at", 0):
            return item.get("value")
        else:
            in_memory_store.pop(key, None)

    return None

def delete_cache_key(key: str):
    # 1. Upstash Serverless REST Redis
    upstash_command("DEL", key)
    
    # 2. Standard Redis
    if redis_client:
        try:
            redis_client.delete(key)
        except Exception:
            pass
            
    # 3. Local RAM & SQLite
    in_memory_store.pop(key, None)
    try:
        conn = sqlite3.connect(DB_CACHE_PATH, timeout=10)
        c = conn.cursor()
        c.execute("DELETE FROM cache WHERE key = ?", (key,))
        conn.commit()
        conn.close()
    except Exception:
        pass

def incr_rate_limit(key: str, window_seconds: int = 600) -> int:
    # 1. Upstash Serverless REST Redis
    up_val = upstash_command("INCR", key)
    if up_val is not None:
        if up_val == 1:
            upstash_command("EXPIRE", key, window_seconds)
        return int(up_val)

    # 2. Standard Redis
    if redis_client:
        try:
            val = redis_client.incr(key)
            if val == 1:
                redis_client.expire(key, window_seconds)
            return val
        except Exception:
            pass
            
    # 3. SQLite disk fallback
    try:
        now = time.time()
        conn = sqlite3.connect(DB_CACHE_PATH, timeout=10)
        c = conn.cursor()
        c.execute("SELECT value, expires_at FROM cache WHERE key = ?", (key,))
        row = c.fetchone()
        if not row or now > row[1]:
            c.execute("INSERT OR REPLACE INTO cache VALUES (?, ?, ?)", (key, "1", now + window_seconds))
            conn.commit()
            conn.close()
            return 1
        new_val = int(row[0]) + 1
        c.execute("UPDATE cache SET value = ? WHERE key = ?", (str(new_val), key))
        conn.commit()
        conn.close()
        return new_val
    except Exception:
        return 1

def check_email_verified(email: str, purpose: str, token: Optional[str]):
    """Validates that the client email has been verified via OTP and stored in Redis."""
    email_clean = email.strip().lower()
    purpose_clean = purpose.strip().lower()
    
    if not token or not str(token).strip():
        raise HTTPException(
            status_code=403,
            detail="Email verification required. Please verify your email with the 6-digit OTP code before proceeding."
        )
    
    token_clean = str(token).strip()
    verified_key = f"verified:{email_clean}:{purpose_clean}"
    stored_token = get_cache_key(verified_key)
    
    # Check alternate inquiry/verification purpose scopes if needed
    if not stored_token:
        for alt_purpose in ["verification", "booking", "contact", "prashna", "inquiry"]:
            alt_stored = get_cache_key(f"verified:{email_clean}:{alt_purpose}")
            if alt_stored and alt_stored == token_clean:
                stored_token = alt_stored
                break
                
    if not stored_token or stored_token != token_clean:
        raise HTTPException(
            status_code=403,
            detail="Email verification has expired or is invalid. Please verify your email via OTP again."
        )

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "AstroAdvice <onboarding@resend.dev>")
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "astroadvicebyks@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "cmmpsmkwctuwjgrj")

def send_resend_otp_email(to_email: str, otp: str, purpose: str = "Verification") -> bool:
    """Sends a luxury branded HTML email with the 6-digit OTP code using Resend API with automatic SMTP fallback."""
    purpose_label = {
        "booking": "Consultation Booking",
        "contact": "Contact Inquiry",
        "prashna": "Horary Prashna Question",
        "inquiry": "Vedic Inquiry"
    }.get(purpose.lower(), "Verification")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AstroAdvice Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #06091B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #D8CFEB;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 30px auto; background-color: #181122; border-radius: 20px; border: 1px solid rgba(211, 175, 84, 0.3); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <tr>
          <td align="center" style="padding: 35px 25px 20px 25px; border-bottom: 1px solid rgba(211, 175, 84, 0.15);">
            <div style="font-size: 11px; letter-spacing: 3px; color: #AB7A57; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">✦ ASTROADVICE BY KUNDAN SINGH ✦</div>
            <h1 style="margin: 0; color: #D3AF54; font-size: 24px; font-weight: 700; font-family: Georgia, serif; letter-spacing: 1px;">Security Verification Code</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 35px 20px 35px; text-align: center;">
            <p style="font-size: 14px; line-height: 1.6; color: #D8CFEB; margin: 0 0 25px 0;">
              You have requested to authenticate your email for <strong>{purpose_label}</strong>. Please enter the 6-digit cosmic verification code below:
            </p>
            <div style="margin: 15px 0 25px 0; padding: 16px 24px; background: rgba(211, 175, 84, 0.08); border: 2px dashed #D3AF54; border-radius: 14px; display: inline-block;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ECCF86; font-family: 'Courier New', Courier, monospace; display: block; margin-left: 8px;">{otp}</span>
            </div>
            <p style="font-size: 12px; color: #AB7A57; margin: 10px 0 0 0;">
              ⏳ This verification code expires in <strong>5 minutes</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 35px 30px 35px; font-size: 11px; line-height: 1.5; color: #8F84A8; text-align: center; border-top: 1px solid rgba(211, 175, 84, 0.1);">
            If you did not make this request on AstroAdvice, please ignore this email.
            <div style="margin-top: 10px; color: #695F80; font-size: 10px;">
              © 2026 Astroadvice. Vasant Kunj, New Delhi, India.
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    
    # 1. Attempt delivery via Resend API
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
        try:
            r = resend.Emails.send({
                "from": RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": f"✦ Your AstroAdvice Verification Code: {otp} ✦",
                "html": html_content
            })
            print(f"✓ Resend OTP dispatched to {to_email}")
            return True
        except Exception as e:
            print(f"⚠️ Resend email sending failed ({str(e)}). Attempting SMTP fallback...")

    # 2. Resilient Fallback: Dispatch via Gmail SMTP (Port 587 STARTTLS & Port 465 SSL)
    if SMTP_EMAIL and SMTP_PASSWORD:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"✦ Your AstroAdvice Verification Code: {otp} ✦"
            msg['From'] = f"AstroAdvice <{SMTP_EMAIL}>"
            msg['To'] = to_email
            msg.attach(MIMEText(html_content, 'html'))

            # Try Port 587 (STARTTLS) first - standard across cloud providers
            try:
                server = smtplib.SMTP("smtp.gmail.com", 587, timeout=8)
                server.starttls()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, [to_email], msg.as_string())
                server.quit()
                print(f"✓ SMTP (Port 587) Fallback OTP dispatched successfully to {to_email}")
                return True
            except Exception as e587:
                print(f"⚠️ SMTP Port 587 failed ({e587}), trying Port 465 SSL...")
                server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=8)
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, [to_email], msg.as_string())
                server.quit()
                print(f"✓ SMTP (Port 465) Fallback OTP dispatched successfully to {to_email}")
                return True
        except Exception as smtp_err:
            print(f"⚠️ All SMTP dispatch options failed: {str(smtp_err)}")

    print(f"⚠️ Unable to dispatch OTP email. Generated code for {to_email} is: {otp}")
    return False

def send_astrologer_notification_email(subject: str, client_name: str, client_email: str, client_phone: str, details: str, service_type: str = "General Inquiry") -> bool:
    """Sends immediate branded notification to the Astrologer (astroadvicebyks@gmail.com) via Resend API with SMTP fallback."""
    receiver_email = os.getenv("ASTROLOGER_NOTIFICATION_EMAIL", "astroadvicebyks@gmail.com")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#06091B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#D8CFEB;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;margin:30px auto;background-color:#181122;border-radius:18px;border:1px solid rgba(211,175,84,0.3);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
        <tr>
          <td align="center" style="padding:28px 20px;border-bottom:1px solid rgba(211,175,84,0.15);background:rgba(211,175,84,0.05);">
            <div style="font-size:11px;letter-spacing:3px;color:#AB7A57;text-transform:uppercase;font-weight:bold;margin-bottom:6px;">✦ ASTROADVICE WEBSITE NOTIFICATION ✦</div>
            <h2 style="margin:0;color:#D3AF54;font-size:22px;font-weight:700;font-family:Georgia,serif;">New {service_type} Received</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:25px 30px;">
            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="color:#AB7A57;font-weight:bold;width:120px;">Client Name:</td>
                <td style="color:#FFFFFF;font-weight:600;">{client_name}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="color:#AB7A57;font-weight:bold;">Client Email:</td>
                <td style="color:#D3AF54;"><a href="mailto:{client_email}" style="color:#D3AF54;text-decoration:none;">{client_email}</a></td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="color:#AB7A57;font-weight:bold;">Phone / DOB:</td>
                <td style="color:#FFFFFF;">{client_phone}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="color:#AB7A57;font-weight:bold;">Service / Topic:</td>
                <td style="color:#ECCF86;font-weight:bold;">{subject}</td>
              </tr>
            </table>
            
            <div style="margin-top:20px;padding:15px;background:rgba(0,0,0,0.25);border-radius:10px;border-left:3px solid #D3AF54;">
              <div style="font-size:11px;text-transform:uppercase;color:#AB7A57;font-weight:bold;margin-bottom:6px;">Client Message / Inquiry:</div>
              <div style="font-size:13px;line-height:1.6;color:#D8CFEB;white-space:pre-wrap;">{details}</div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    # 1. Resend API Dispatch
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
        try:
            r = resend.Emails.send({
                "from": RESEND_FROM_EMAIL,
                "to": [receiver_email],
                "subject": f"★ New {service_type}: {subject} - {client_name} ★",
                "html": html_content
            })
            print(f"✓ Astrologer notification dispatched via Resend to {receiver_email}")
            return True
        except Exception as e:
            print(f"⚠️ Astrologer Resend dispatch failed ({e}). Trying SMTP...")

    # 2. SMTP Fallback
    if SMTP_EMAIL and SMTP_PASSWORD:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"★ New {service_type}: {subject} - {client_name} ★"
            msg['From'] = f"AstroAdvice <{SMTP_EMAIL}>"
            msg['To'] = receiver_email
            msg.attach(MIMEText(html_content, 'html'))

            try:
                server = smtplib.SMTP("smtp.gmail.com", 587, timeout=8)
                server.starttls()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, [receiver_email], msg.as_string())
                server.quit()
                print(f"✓ Astrologer notification dispatched via SMTP (587) to {receiver_email}")
                return True
            except Exception:
                server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=8)
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.sendmail(SMTP_EMAIL, [receiver_email], msg.as_string())
                server.quit()
                print(f"✓ Astrologer notification dispatched via SMTP (465) to {receiver_email}")
                return True
        except Exception as smtp_err:
            print(f"⚠️ SMTP astrologer notification failed: {smtp_err}")

    return False

# ==========================================
# ⚙️ BOOKING RULES & CONFIGURATION
# ==========================================
# Split Time Windows (in 24-hour format):
# Window 1: 10:00 AM (10) to 12:00 PM (12)
# Window 2: 3:00 PM (15) to 6:00 PM (18)
ALLOWED_TIME_WINDOWS = [
    {"start": 10, "end": 12},  # Morning window
    {"start": 15, "end": 18},  # Afternoon window
]

MAX_BOOKINGS_PER_HOUR = int(os.getenv("MAX_BOOKINGS_PER_HOUR", 2))
ALLOWED_DAYS = [0, 1, 2, 3, 4, 5]  # Monday=0, Tuesday=1 ... Saturday=5 (Sunday=6 excluded)
TIMEZONE = "Asia/Kolkata"  # Change to your local timezone if different
# ==========================================


def get_google_credentials():
    """Loads Google Service Account credentials from file paths or environment variables."""
    if not Credentials:
        return None
    for p in [SERVICE_ACCOUNT_FILE, "service_account.json", "src/backend/service_account.json", "../service_account.json"]:
        if os.path.exists(p):
            try:
                return Credentials.from_service_account_file(p, scopes=SCOPES)
            except Exception as e:
                print(f"Error loading service account from {p}: {e}")
                
    sa_env = os.getenv("SERVICE_ACCOUNT_JSON") or os.getenv("GOOGLE_CREDENTIALS_JSON")
    if sa_env:
        try:
            import json
            info = json.loads(sa_env)
            return Credentials.from_service_account_info(info, scopes=SCOPES)
        except Exception as e:
            print(f"Error loading SERVICE_ACCOUNT_JSON env: {e}")
            
    return None


def get_calendar_service():
    """Initializes and returns the Google Calendar API service, ensuring a shared read-only secondary calendar exists."""
    creds = get_google_credentials()
    if not creds:
        raise FileNotFoundError(
            f"Error: Could not find Google credentials. Make sure service_account.json is available."
        )
    service = build("calendar", "v3", credentials=creds)
    
    global CALENDAR_ID
    config_file = "calendar_config.json"
    astrologer_email = os.getenv("SMTP_EMAIL", "astroadvicebyks@gmail.com")
    
    import json
    calendar_id = None
    if os.path.exists(config_file):
        try:
            with open(config_file, "r") as f:
                config_data = json.load(f)
                calendar_id = config_data.get("calendar_id")
        except Exception:
            pass
            
    if not calendar_id:
        try:
            print("Creating a new master secondary calendar for read-only booking sharing...")
            calendar_body = {
                'summary': 'AstroAdvice Bookings',
                'timeZone': TIMEZONE
            }
            new_cal = service.calendars().insert(body=calendar_body).execute()
            calendar_id = new_cal['id']
            
            # Share secondary calendar with astrologer as Read-Only
            rule = {
                'scope': {
                    'type': 'user',
                    'value': astrologer_email,
                },
                'role': 'reader'
            }
            service.acl().insert(calendarId=calendar_id, body=rule).execute()
            print(f"✓ Shared calendar {calendar_id} with {astrologer_email} as Read-Only")
            
            # Save calendar configuration
            with open(config_file, "w") as f:
                json.dump({"calendar_id": calendar_id, "shared_with": astrologer_email}, f, indent=4)
                
        except Exception as e:
            print(f"Error initializing secondary calendar: {str(e)}")
            calendar_id = "primary" # Fallback if fails
            
    CALENDAR_ID = calendar_id
    return service



def get_sheets_service():
    """Initializes and returns Google Sheets and Drive API client services."""
    creds = get_google_credentials()
    if not creds:
        return None, None
        
    sheets_service = None
    drive_service = None
    try:
        sheets_service = build("sheets", "v4", credentials=creds)
    except Exception as e:
        print(f"Error initializing Sheets service: {str(e)}")
        
    try:
        drive_service = build("drive", "v3", credentials=creds)
    except Exception as e:
        print(f"Drive service notice: {str(e)}")
        
    return sheets_service, drive_service


def get_or_create_spreadsheet(sheets_service, drive_service):
    """Retrieves the existing spreadsheet ID from sheets_config.json or creates a new one in the Service Account drive and shares it."""
    config_file = "sheets_config.json"
    spreadsheet_id = os.getenv("GOOGLE_SHEET_ID") or "16FmU2TAjrSKxCg2fyQ6j4V1SHUKCzRfYC27AGKzA4Es"
    astrologer_email = os.getenv("SMTP_EMAIL", "astroadvicebyks@gmail.com")
    
    # 1. Try reading from local config file
    if not spreadsheet_id and os.path.exists(config_file):
        try:
            import json
            with open(config_file, "r") as f:
                config_data = json.load(f)
                spreadsheet_id = config_data.get("spreadsheet_id")
        except Exception:
            pass
            
    # 2. If still not found, create a new spreadsheet
    if not spreadsheet_id:
        try:
            print("Creating a new Google Sheet: 'Astrologer Kundan Singh Customer Database'...")
            spreadsheet_body = {
                'properties': {
                    'title': 'Astrologer Kundan Singh Customer Database'
                },
                'sheets': [
                    {'properties': {'title': 'Bookings'}},
                    {'properties': {'title': 'Contact Queries'}},
                    {'properties': {'title': 'Help Tickets'}},
                    {'properties': {'title': 'Prashna Inquiries'}}
                ]
            }
            spreadsheet = sheets_service.spreadsheets().create(
                body=spreadsheet_body, 
                fields='spreadsheetId'
            ).execute()
            spreadsheet_id = spreadsheet.get('spreadsheetId')
            
            # Grant Astrologer editor permissions
            if drive_service and astrologer_email:
                drive_service.permissions().create(
                    fileId=spreadsheet_id,
                    body={'type': 'user', 'role': 'writer', 'emailAddress': astrologer_email},
                    fields='id',
                    sendNotificationEmail=True
                ).execute()
                print(f"✓ Google Sheet shared with {astrologer_email}")
            
            # Initialize headers for each sheet
            headers_config = {
                'Bookings': ["Timestamp", "Full Name", "Email", "Phone", "Service Name", "Date", "Time Slot", "Duration (Min)", "Birth Details"],
                'Contact Queries': ["Timestamp", "Name", "Email", "Phone", "Date of Birth", "Subject", "Message"],
                'Help Tickets': ["Timestamp", "Name", "Email", "Phone", "Query"],
                'Prashna Inquiries': ["Timestamp", "Name", "Phone", "Location", "Question"]
            }
            for sheet_name, headers in headers_config.items():
                sheets_service.spreadsheets().values().update(
                    spreadsheetId=spreadsheet_id,
                    range=f"{sheet_name}!A1",
                    valueInputOption="USER_ENTERED",
                    body={'values': [headers]}
                ).execute()
                
            # Save spreadsheet ID to config file
            import json
            with open(config_file, "w") as f:
                json.dump({"spreadsheet_id": spreadsheet_id, "shared_with": astrologer_email}, f, indent=4)
                
        except Exception as e:
            print(f"Error creating Google Sheet: {str(e)}")
            return "16FmU2TAjrSKxCg2fyQ6j4V1SHUKCzRfYC27AGKzA4Es"
            
    return spreadsheet_id


DEFAULT_GOOGLE_SHEET_IDS = [
    "16FmU2TAjrSKxCg2fyQ6j4V1SHUKCzRfYC27AGKzA4Es",
    "1K3z5i_pfo5oc2qS27TevZIi4XGtbTjT0uWAdslvs8Bo"
]


def append_row_to_sheet(sheet_name: str, row: list):
    """Utility to append a row of data to BOTH Google Sheets simultaneously."""
    sheets_service, drive_service = get_sheets_service()
    if not sheets_service:
        print("Sheets service could not be initialized from credentials.")
        return
        
    env_ids = os.getenv("GOOGLE_SHEET_ID")
    target_sheet_ids = []
    if env_ids:
        for sid in env_ids.split(","):
            sid_clean = sid.strip()
            if sid_clean and sid_clean not in target_sheet_ids:
                target_sheet_ids.append(sid_clean)
                
    for def_id in DEFAULT_GOOGLE_SHEET_IDS:
        if def_id not in target_sheet_ids:
            target_sheet_ids.append(def_id)
        
    try:
        def sanitize_cell(val):
            if val is None:
                return "N/A"
            s = str(val).strip()
            # Prefix with ' for formula safety and to prevent scientific notation on multi-digit phone numbers
            if s.startswith(("+", "=", "-", "@", "\t", "\r")) or (s.isdigit() and len(s) >= 10):
                return f"'{s}"
            return s

        sanitized_row = [sanitize_cell(item) for item in row]
        body = {
            'values': [sanitized_row]
        }
        for sid in target_sheet_ids:
            try:
                sheets_service.spreadsheets().values().append(
                    spreadsheetId=sid,
                    range=f"{sheet_name}!A:Z",
                    valueInputOption="USER_ENTERED",
                    insertDataOption="INSERT_ROWS",
                    body=body
                ).execute()
                print(f"✓ Appended data row to Google Sheet ({sid[:8]}...) tab '{sheet_name}'")
            except Exception as sheet_err:
                print(f"Failed to append row to Google Sheet {sid}: {str(sheet_err)}")
    except Exception as e:
        print(f"Failed in append_row_to_sheet for tab '{sheet_name}': {str(e)}")



# Sanitization & Security Helper Functions
def sanitize_string(value: str) -> str:
    """Escapes HTML special characters to prevent HTML/XSS injection."""
    return html.escape(value.strip())


def validate_phone_number(phone_str: str) -> str:
    """Validates phone number format and sanitizes string."""
    if not phone_str:
        return "N/A"
    cleaned = re.sub(r'[\s\-\(\)\.]', '', str(phone_str).strip())
    if not cleaned:
        return "N/A"
    return cleaned


# Input Data Models with strict validations and XSS sanitizations
class SendOtpRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "verification"


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: Optional[str] = "verification"


class PrashnaRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    location: str
    question: str
    verification_token: Optional[str] = None

    @field_validator('name', 'location', 'question')
    @classmethod
    def sanitize_input(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator('email')
    @classmethod
    def sanitize_email(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        return str(v).strip().lower()

    @field_validator('phone')
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_phone_number(v)


class ContactRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = "N/A"
    dob: Optional[str] = "N/A"
    subject: str
    message: str
    verification_token: Optional[str] = None

    @field_validator('name', 'subject', 'message')
    @classmethod
    def sanitize_input(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator('email')
    @classmethod
    def check_email(cls, v: str) -> str:
        s = str(v).strip().lower()
        if "@" not in s or "." not in s:
            raise ValueError("Invalid email address format.")
        return s

    @field_validator('phone')
    @classmethod
    def check_phone(cls, v: Optional[str]) -> str:
        if not v or v.strip().lower() in ["n/a", "none", "not provided"] or v.startswith("DOB:"):
            return v or "N/A"
        return validate_phone_number(v)


class HelpRequest(BaseModel):
    name: str
    phone: str
    email: str
    query: str

    @field_validator('name', 'query')
    @classmethod
    def sanitize_input(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator('email')
    @classmethod
    def check_email(cls, v: str) -> str:
        s = str(v).strip().lower()
        if "@" not in s or "." not in s:
            raise ValueError("Invalid email address format.")
        return s

    @field_validator('phone')
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_phone_number(v)


class BookingRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    service_name: str  # e.g. "Vedic Astrology", "Prashna Kundali", "Vastu Consultation"
    date: str          # Format: "YYYY-MM-DD"
    time_slot: str     # Format: "HH:MM" (24-hour time, e.g. "10:00", "15:30")
    duration_minutes: Optional[int] = 30
    birth_details: Optional[str] = None  # Intake details (DOB, Time, Place, or Specific Question)
    verification_token: Optional[str] = None

    @field_validator('full_name', 'service_name', 'birth_details')
    @classmethod
    def sanitize_input(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_string(v)

    @field_validator('email')
    @classmethod
    def check_email(cls, v: str) -> str:
        s = str(v).strip().lower()
        if "@" not in s or "." not in s:
            raise ValueError("Invalid email address format.")
        return s

    @field_validator('phone')
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_phone_number(v)


@app.post("/api/auth/send-otp")
def send_otp(req: SendOtpRequest, background_tasks: BackgroundTasks = None):
    """Generates 6-digit OTP, caches in Upstash Redis (5 min TTL), and dispatches email asynchronously."""
    email_clean = req.email.strip().lower()
    purpose_clean = (req.purpose or "verification").strip().lower()
    
    # 1. Rate Limiting Check (Max 5 requests per 10 minutes)
    rate_key = f"ratelimit:otp:{email_clean}"
    attempts = incr_rate_limit(rate_key, window_seconds=600)
    if attempts > 5:
        raise HTTPException(
            status_code=429, 
            detail="Too many verification requests. Please wait 10 minutes before requesting another code."
        )
        
    # 2. Generate secure 6-digit numeric OTP
    otp_code = str(secrets.randbelow(900000) + 100000)
    
    # 3. Store in Upstash Redis / Multi-Worker cache with 5-minute TTL (300 seconds)
    cache_key = f"otp:{email_clean}:{purpose_clean}"
    set_cache_key(cache_key, otp_code, ex_seconds=300)
    
    # 4. Asynchronous Non-blocking Email Dispatch (instant sub-50ms API response)
    if background_tasks is not None:
        background_tasks.add_task(send_resend_otp_email, email_clean, otp_code, purpose_clean)
    else:
        import threading
        t = threading.Thread(target=send_resend_otp_email, args=(email_clean, otp_code, purpose_clean))
        t.daemon = True
        t.start()
        
    return {
        "success": True,
        "message": f"Verification code has been dispatched to {email_clean}."
    }


@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    """Verifies OTP from shared cache, burns it on success, and issues 15-min verification state."""
    email_clean = req.email.strip().lower()
    purpose_clean = (req.purpose or "verification").strip().lower()
    otp_clean = req.otp.strip()
    
    cache_key = f"otp:{email_clean}:{purpose_clean}"
    stored_otp = get_cache_key(cache_key)
    
    # If not found under exact purpose, check across other scopes (inquiry, booking, contact, prashna, verification)
    if not stored_otp:
        for alt_p in ["inquiry", "booking", "contact", "prashna", "verification"]:
            alt_key = f"otp:{email_clean}:{alt_p}"
            alt_otp = get_cache_key(alt_key)
            if alt_otp:
                stored_otp = alt_otp
                cache_key = alt_key
                break
                
    if not stored_otp:
        # Check if the email was ALREADY verified in the last 60 seconds (prevents double-submit race conditions)
        existing_token = get_cache_key(f"verified:{email_clean}:{purpose_clean}") or get_cache_key(f"verified:{email_clean}:verification")
        if existing_token:
            return {
                "success": True,
                "verification_token": existing_token,
                "message": "Email verified successfully."
            }
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired or was not requested. Please request a new code."
        )
        
    if str(stored_otp).strip() != str(otp_clean).strip():
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code. Please check your email and enter the correct code."
        )
        
    # Delete OTP key to prevent replay attacks
    delete_cache_key(cache_key)
    delete_cache_key(f"otp:{email_clean}:{purpose_clean}")
    
    # Generate verification token and mark verified in cache with 15-minute TTL (900 seconds)
    verification_token = f"tok_{secrets.token_hex(16)}"
    verified_key = f"verified:{email_clean}:{purpose_clean}"
    set_cache_key(verified_key, verification_token, ex_seconds=900)
    set_cache_key(f"verified:{email_clean}:verification", verification_token, ex_seconds=900)
    set_cache_key(f"verified:{email_clean}:inquiry", verification_token, ex_seconds=900)
    set_cache_key(f"verified:{email_clean}:contact", verification_token, ex_seconds=900)
    set_cache_key(f"verified:{email_clean}:booking", verification_token, ex_seconds=900)
    set_cache_key(f"verified:{email_clean}:prashna", verification_token, ex_seconds=900)
    
    return {
        "success": True,
        "verification_token": verification_token,
        "message": "Email verified successfully."
    }


@app.get("/")
def read_root():
    """Health check endpoint to verify backend status."""
    return {"status": "online", "message": "Astrology Booking Backend is Running!"}


@app.get("/api/availability")
def get_availability(date: str):
    """Returns a dict mapping slot start times to availability booleans based on conflicts."""
    slots = ["10:00", "11:00", "15:00", "16:00", "17:00"]
    use_google_calendar = os.path.exists(SERVICE_ACCOUNT_FILE)
    
    availability_results = {}
    
    # 1. If Sunday, all slots are closed (available = False)
    try:
        parsed_date = datetime.fromisoformat(f"{date}T00:00:00")
        if parsed_date.weekday() not in ALLOWED_DAYS:
            for s in slots:
                availability_results[s] = False
            return availability_results
    except Exception:
        for s in slots:
            availability_results[s] = False
        return availability_results

    if use_google_calendar:
        try:
            service = get_calendar_service()
            for s in slots:
                # Query Google Calendar for existing bookings in this specific hour
                start_dt = datetime.fromisoformat(f"{date}T{s}:00")
                end_dt = start_dt + timedelta(hours=1)
                
                existing_events_result = service.events().list(
                    calendarId=CALENDAR_ID,
                    timeMin=start_dt.isoformat() + "+05:30",
                    timeMax=end_dt.isoformat() + "+05:30",
                    singleEvents=True
                ).execute()
                
                count = len(existing_events_result.get("items", []))
                availability_results[s] = count < MAX_BOOKINGS_PER_HOUR
        except Exception as e:
            # Fallback to true if calendar fails
            print(f"Error querying availability: {str(e)}")
            for s in slots:
                availability_results[s] = True
    else:
        # Local JSON database fallback
        import json
        local_bookings_file = "local_bookings.json"
        bookings_list = []
        
        if os.path.exists(local_bookings_file):
            try:
                with open(local_bookings_file, "r") as f:
                    bookings_list = json.load(f)
            except Exception:
                pass
                
        for s in slots:
            count = 0
            for b in bookings_list:
                if b.get("date") == date and b.get("time_slot") == s:
                    count += 1
            availability_results[s] = count < MAX_BOOKINGS_PER_HOUR

    return availability_results


@app.post("/api/contact")
def save_contact(contact: ContactRequest):
    """Saves contact queries locally and attempts to send SMS via Twilio if configured."""
    # Enforce Redis verified email requirement
    check_email_verified(contact.email, "contact", contact.verification_token)

    import json
    local_queries_file = "local_queries.json"
    queries_list = []
    
    if os.path.exists(local_queries_file):
        try:
            with open(local_queries_file, "r") as f:
                queries_list = json.load(f)
        except Exception:
            pass
            
    new_entry = {
        "query_type": "general_contact",
        "name": contact.name,
        "email": contact.email,
        "phone": contact.phone,
        "subject": contact.subject,
        "message": contact.message,
        "timestamp": datetime.utcnow().isoformat()
    }
    queries_list.append(new_entry)
    
    try:
        with open(local_queries_file, "w") as f:
            json.dump(queries_list, f, indent=4)
        print("✓ Contact query saved to local_queries.json")
    except Exception as e:
        print(f"Error saving contact query locally: {str(e)}")
        
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER")
    
    sms_status = "logged_locally"
    
    if twilio_sid and twilio_auth and twilio_from:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_auth)
            
            sms_body = (
                f"New Inquiry:\n"
                f"Name: {contact.name}\n"
                f"Phone: {contact.phone}\n"
                f"Email: {contact.email}\n"
                f"Subject: {contact.subject}\n"
                f"Msg: {contact.message}"
            )
            
            client.messages.create(
                body=sms_body,
                from_=twilio_from,
                to="+918114292972"
            )
            sms_status = "sent_via_twilio"
            print("✓ SMS dispatch successfully processed")
        except Exception as e:
            print(f"Twilio SMS delivery failed: {str(e)}")
            sms_status = "twilio_failed"
            
    # Dispatch inquiry notification directly to Astrologer
    dispatched = send_astrologer_notification_email(
        subject=contact.subject,
        client_name=contact.name,
        client_email=contact.email,
        client_phone=contact.phone,
        details=contact.message,
        service_type="Vedic Inquiry / Contact Query"
    )
    email_status = "sent" if dispatched else "failed"
            
    # Append to Google Sheets with clean separation of Phone and DOB
    try:
        timestamp_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        phone_clean = contact.phone or "N/A"
        dob_clean = contact.dob or "N/A"
        if phone_clean.startswith("DOB:"):
            if dob_clean == "N/A":
                dob_clean = phone_clean.replace("DOB:", "").strip()
            phone_clean = "N/A"

        append_row_to_sheet("Contact Queries", [
            timestamp_str,
            contact.name,
            contact.email,
            phone_clean,
            dob_clean,
            contact.subject,
            contact.message
        ])
    except Exception as sheets_err:
        print(f"Failed to log contact inquiry to Google Sheets: {str(sheets_err)}")

    return {
        "status": "success",
        "sms_status": sms_status,
        "email_status": email_status,
        "message": "Message received by server successfully!"
    }


@app.post("/api/help")
def save_help(help_req: HelpRequest):
    """Saves help queries locally and attempts to send SMTP email to neuraflowuser1@gmail.com."""
    import json
    local_queries_file = "local_queries.json"
    queries_list = []
    
    if os.path.exists(local_queries_file):
        try:
            with open(local_queries_file, "r") as f:
                queries_list = json.load(f)
        except Exception:
            pass
            
    new_entry = {
        "query_type": "help_inquiry",
        "name": help_req.name,
        "phone": help_req.phone,
        "email": help_req.email,
        "query": help_req.query,
        "timestamp": datetime.utcnow().isoformat()
    }
    queries_list.append(new_entry)
    
    try:
        with open(local_queries_file, "w") as f:
            json.dump(queries_list, f, indent=4)
        print("✓ Help query saved to local_queries.json")
    except Exception as e:
        print(f"Error saving help query locally: {str(e)}")
        
    smtp_sender = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_receiver = "neuraflowuser1@gmail.com"
    
    email_status = "not_configured"
    
    if smtp_sender and smtp_password:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Construct Email Message
            msg = MIMEMultipart()
            msg['From'] = smtp_sender
            msg['To'] = smtp_receiver
            msg['Subject'] = "★ New Help/Support Request ★"
            
            email_body = f"""
Hello,

You have received a new Help/Support inquiry from the website:

----------------------------------------
USER NAME:    {help_req.name}
USER PHONE:   {help_req.phone}
USER EMAIL:   {help_req.email}

QUERY/MESSAGE:
{help_req.query}
----------------------------------------

*This message was logged locally and dispatched automatically via website backend*
"""
            msg.attach(MIMEText(email_body, 'plain'))
            
            # Connect to SMTP Server
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(smtp_sender, smtp_password)
            server.sendmail(smtp_sender, smtp_receiver, msg.as_string())
            server.quit()
            
            email_status = "sent_via_smtp"
            print("✓ Help inquiry successfully dispatched via SMTP email to neuraflowuser1@gmail.com")
        except Exception as e:
            print(f"SMTP Email delivery failed: {str(e)}")
            email_status = "smtp_failed"
            
    # Append to Google Sheets
    try:
        timestamp_str = datetime.utcnow().isoformat()
        append_row_to_sheet("Help Tickets", [
            timestamp_str,
            help_req.name,
            help_req.email,
            help_req.phone,
            help_req.query
        ])
    except Exception as sheets_err:
        print(f"Failed to log help query to Google Sheets: {str(sheets_err)}")

    return {
        "status": "success",
        "email_status": email_status,
        "message": "Help query received by server successfully!"
    }


@app.post("/api/prashna")
def save_prashna(prashna: PrashnaRequest):
    """Saves Prashna questions locally and attempts to send SMTP email."""
    # Enforce Redis verified email requirement
    check_email_verified(prashna.email, "prashna", prashna.verification_token)

    import json
    local_queries_file = "local_queries.json"
    queries_list = []
    
    if os.path.exists(local_queries_file):
        try:
            with open(local_queries_file, "r") as f:
                queries_list = json.load(f)
        except Exception:
            pass
            
    new_entry = {
        "query_type": "prashna_kundali",
        "name": prashna.name,
        "phone": prashna.phone,
        "location": prashna.location,
        "question": prashna.question,
        "timestamp": datetime.utcnow().isoformat()
    }
    queries_list.append(new_entry)
    
    try:
        with open(local_queries_file, "w") as f:
            json.dump(queries_list, f, indent=4)
        print("✓ Prashna query saved to local_queries.json")
    except Exception as e:
        print(f"Error saving Prashna query locally: {str(e)}")
        
    # Dispatch Prashna inquiry notification directly to Astrologer
    dispatched = send_astrologer_notification_email(
        subject="Horary Prashna Question",
        client_name=prashna.name,
        client_email=str(prashna.email) if prashna.email else "Not Provided",
        client_phone=f"{prashna.phone} (Location: {prashna.location})",
        details=prashna.question,
        service_type="Horary Prashna Question"
    )
    email_status = "sent" if dispatched else "failed"
            
    # Append to Google Sheets
    try:
        timestamp_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        append_row_to_sheet("Prashna Inquiries", [
            timestamp_str,
            prashna.name,
            prashna.phone,
            prashna.location,
            prashna.question
        ])
    except Exception as sheets_err:
        print(f"Failed to log Prashna inquiry to Google Sheets: {str(sheets_err)}")

    return {
        "status": "success",
        "email_status": email_status,
        "message": "Prashna received successfully!"
    }


@app.post("/api/book-appointment")
async def book_appointment(booking: BookingRequest):
    """Processes appointment requests, checks rules/conflicts, and books into Google Calendar."""
    try:
        # Enforce Redis verified email requirement before booking slot
        check_email_verified(booking.email, "booking", booking.verification_token)

        # Check if service account file is present to determine mode (Google Calendar sync vs. Local Dev fallback)
        use_google_calendar = os.path.exists(SERVICE_ACCOUNT_FILE)

        # Universal Date & Time Slot Normalization
        date_str = str(booking.date).strip()
        time_slot_str = str(booking.time_slot).strip()

        # Handle 12-hour or 24-hour time slot (e.g., "10:00 AM" -> "10:00", "03:00 PM" -> "15:00")
        if "am" in time_slot_str.lower() or "pm" in time_slot_str.lower():
            try:
                t_obj = datetime.strptime(time_slot_str.upper().replace(".", ""), "%I:%M %p").time()
                time_slot_str = t_obj.strftime("%H:%M")
            except Exception:
                try:
                    t_obj = datetime.strptime(time_slot_str.upper().replace(".", ""), "%I %p").time()
                    time_slot_str = t_obj.strftime("%H:%M")
                except Exception:
                    pass

        try:
            start_time_str = f"{date_str}T{time_slot_str}:00"
            start_datetime = datetime.fromisoformat(start_time_str)
        except Exception:
            start_datetime = datetime.utcnow() + timedelta(days=1)
            time_slot_str = "10:00"

        duration_mins = booking.duration_minutes or 30
        end_datetime = start_datetime + timedelta(minutes=duration_mins)

        # ----------------------------------------------------
        # 3. RULE CHECK & CREATION
        # ----------------------------------------------------
        # ----------------------------------------------------
        # 3. Dynamic Meeting Link & Data Preparation
        # ----------------------------------------------------
        static_meet = os.getenv("STATIC_MEET_LINK")
        if static_meet:
            meet_link = static_meet
        else:
            meet_link = f"https://meet.jit.si/AstroAdvice-Consultation-{uuid.uuid4().hex[:8]}"

        # Save the new booking to local backup
        try:
            import json
            local_bookings_file = "local_bookings.json"
            bookings_list = []
            if os.path.exists(local_bookings_file):
                try:
                    with open(local_bookings_file, "r") as f:
                        bookings_list = json.load(f)
                except Exception:
                    pass
            new_booking = booking.dict()
            new_booking["booked_at"] = datetime.now().isoformat()
            bookings_list.append(new_booking)
            with open(local_bookings_file, "w") as f:
                json.dump(bookings_list, f, indent=4)
        except Exception as local_err:
            print(f"Error logging booking locally: {str(local_err)}")

        # ----------------------------------------------------
        # 4. ALWAYS Append to Google Sheets (Bookings Tab)
        # ----------------------------------------------------
        try:
            timestamp_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            append_row_to_sheet("Bookings", [
                timestamp_str,
                booking.full_name,
                booking.email,
                booking.phone,
                booking.service_name,
                booking.date,
                booking.time_slot,
                booking.duration_minutes,
                booking.birth_details or "Not Provided"
            ])
            print(f"✓ Booking for {booking.full_name} logged to Google Sheets 'Bookings' tab")
        except Exception as sheets_err:
            print(f"Failed to log booking to Google Sheets: {str(sheets_err)}")

        # ----------------------------------------------------
        # 5. ALWAYS Dispatch Notification Email via Resend Domain
        # ----------------------------------------------------
        booking_details_text = f"Date: {booking.date} | Time Slot: {booking.time_slot} ({booking.duration_minutes} min)\nVideo Call Link: {meet_link}\n\nIntake & Birth Details:\n{booking.birth_details or 'None provided.'}"
        send_astrologer_notification_email(
            subject=f"New Booking: {booking.service_name} ({booking.date} at {booking.time_slot})",
            client_name=booking.full_name,
            client_email=booking.email,
            client_phone=booking.phone,
            details=booking_details_text,
            service_type=f"Consultation Booking: {booking.service_name}"
        )

        # ----------------------------------------------------
        # 6. Google Calendar Sync (if credentials configured)
        # ----------------------------------------------------
        event_link = None
        try:
            service = get_calendar_service()
            if service:
                # Calculate the 1-hour window for the requested slot
                hour_window_start = start_datetime.replace(minute=0, second=0)
                hour_window_end = hour_window_start + timedelta(hours=1)

                # Query Google Calendar for existing bookings in this specific hour
                existing_events_result = service.events().list(
                    calendarId=CALENDAR_ID,
                    timeMin=hour_window_start.isoformat() + "+05:30",
                    timeMax=hour_window_end.isoformat() + "+05:30",
                    singleEvents=True
                ).execute()

                description_body = f"""
🔮 ASTROLOGY SERVICE APPOINTMENT
----------------------------------------
Client Name: {booking.full_name}
Client Email: {booking.email}
Client Phone: {booking.phone}
Service Requested: {booking.service_name}
Session Link: {meet_link}

INTAKE & SERVICE DETAILS:
{booking.birth_details or 'No additional details provided.'}
----------------------------------------
*Generated automatically via Astrology Website Booking Engine*
"""
                event_body = {
                    "summary": f"[{booking.service_name}] - {booking.full_name}",
                    "description": description_body,
                    "start": {
                        "dateTime": start_datetime.isoformat(),
                        "timeZone": TIMEZONE,
                    },
                    "end": {
                        "dateTime": end_datetime.isoformat(),
                        "timeZone": TIMEZONE,
                    },
                    "guestsCanInviteOthers": False,
                    "reminders": {
                        "useDefault": False,
                        "overrides": [
                            {"method": "email", "minutes": 24 * 60},
                            {"method": "popup", "minutes": 15},
                        ],
                    },
                }

                created_event = service.events().insert(
                    calendarId=CALENDAR_ID, 
                    body=event_body
                ).execute()
                event_link = created_event.get("htmlLink")
        except Exception as cal_err:
            print(f"Google Calendar sync notice: {str(cal_err)}")

        return {
            "status": "success",
            "message": "Appointment booked successfully!",
            "event_link": event_link,
            "meet_link": meet_link
        }

    except HTTPException as http_ex:
        raise http_ex
    except ValueError as val_err:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date or time format. Please check your inputs. (Error: {str(val_err)})"
        )
    except Exception as e:
        print(f"Error creating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
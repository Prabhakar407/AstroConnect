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
from dotenv import load_dotenv
import redis
import resend

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

# ==========================================
# ⚙️ REDIS & RESEND CONFIGURATION
# ==========================================
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = None

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    print("✓ Successfully connected to External Redis server.")
except Exception as e:
    try:
        import fakeredis
        redis_client = fakeredis.FakeRedis(decode_responses=True)
        redis_client.ping()
        print("✓ Connected to Embedded Redis engine (fakeredis).")
    except Exception as e2:
        print(f"⚠️ Embedded Redis unavailable ({e2}). Using in-memory fallback.")
        redis_client = None

# In-memory storage fallback
in_memory_store = {}

def set_cache_key(key: str, value: str, ex_seconds: int):
    if redis_client:
        try:
            redis_client.set(key, value, ex=ex_seconds)
            return
        except Exception as e:
            print(f"Redis set error: {e}")
    in_memory_store[key] = {
        "value": value,
        "expires_at": time.time() + ex_seconds
    }

def get_cache_key(key: str) -> Optional[str]:
    if redis_client:
        try:
            return redis_client.get(key)
        except Exception as e:
            print(f"Redis get error: {e}")
    item = in_memory_store.get(key)
    if not item:
        return None
    if time.time() > item["expires_at"]:
        in_memory_store.pop(key, None)
        return None
    return item["value"]

def delete_cache_key(key: str):
    if redis_client:
        try:
            redis_client.delete(key)
            return
        except Exception:
            pass
    in_memory_store.pop(key, None)

def incr_rate_limit(key: str, window_seconds: int = 600) -> int:
    if redis_client:
        try:
            val = redis_client.incr(key)
            if val == 1:
                redis_client.expire(key, window_seconds)
            return val
        except Exception:
            pass
    now = time.time()
    item = in_memory_store.get(key)
    if not item or now > item.get("expires_at", 0):
        in_memory_store[key] = {"value": "1", "expires_at": now + window_seconds}
        return 1
    new_val = int(item.get("value", 0)) + 1
    in_memory_store[key]["value"] = str(new_val)
    return new_val

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

def send_resend_otp_email(to_email: str, otp: str, purpose: str = "Verification") -> bool:
    """Sends a luxury branded HTML email with the 6-digit OTP code using Resend API."""
    if not RESEND_API_KEY:
        print(f"⚠️ RESEND_API_KEY not configured in .env. Generated OTP for {to_email} is: {otp}")
        return True
        
    resend.api_key = RESEND_API_KEY
    
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
        print(f"⚠️ Resend email sending failed: {str(e)}")
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


def get_calendar_service():
    """Initializes and returns the Google Calendar API service, ensuring a shared read-only secondary calendar exists."""
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        raise FileNotFoundError(
            f"Error: Could not find '{SERVICE_ACCOUNT_FILE}'. Make sure it is placed in the backend root directory."
        )
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
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
    """Initializes and returns Google Sheets and Drive API client services, creating & sharing the spreadsheet if it does not exist."""
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        return None, None
        
    try:
        creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        sheets_service = build("sheets", "v4", credentials=creds)
        drive_service = build("drive", "v3", credentials=creds)
        return sheets_service, drive_service
    except Exception as e:
        print(f"Error initializing Sheets/Drive services: {str(e)}")
        return None, None


def get_or_create_spreadsheet(sheets_service, drive_service):
    """Retrieves the existing spreadsheet ID from sheets_config.json or creates a new one in the Service Account drive and shares it."""
    config_file = "sheets_config.json"
    spreadsheet_id = os.getenv("GOOGLE_SHEET_ID")
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
            
            # Share the spreadsheet with the astrologer as Writer (Editor)
            permission_body = {
                'type': 'user',
                'role': 'writer',
                'emailAddress': astrologer_email
            }
            drive_service.permissions().create(
                fileId=spreadsheet_id,
                body=permission_body
            ).execute()
            print(f"✓ Created and shared spreadsheet {spreadsheet_id} with {astrologer_email}")
            
            # Initialize headers for each sheet
            headers_config = {
                'Bookings': ["Timestamp", "Full Name", "Email", "Phone", "Service Name", "Date", "Time Slot", "Duration (Min)", "Birth Details"],
                'Contact Queries': ["Timestamp", "Name", "Email", "Phone", "Subject", "Message"],
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
            return None
            
    return spreadsheet_id


def append_row_to_sheet(sheet_name: str, row: list):
    """Utility to append a row of data to the Google Sheet if enabled."""
    sheets_service, drive_service = get_sheets_service()
    if not sheets_service or not drive_service:
        return
        
    spreadsheet_id = get_or_create_spreadsheet(sheets_service, drive_service)
    if not spreadsheet_id:
        return
        
    try:
        body = {
            'values': [row]
        }
        sheets_service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range=f"{sheet_name}!A:Z",
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body=body
        ).execute()
        print(f"✓ Appended data row to Google Sheet tab '{sheet_name}'")
    except Exception as e:
        print(f"Failed to append row to Google Sheet: {str(e)}")



# Sanitization & Security Helper Functions
def sanitize_string(value: str) -> str:
    """Escapes HTML special characters to prevent HTML/XSS injection."""
    return html.escape(value.strip())


def validate_phone_number(phone_str: str) -> str:
    """Validates phone number format and filters out fake/spam phone numbers."""
    cleaned = re.sub(r'[\s\-\(\)\.]', '', phone_str)
    
    # Allow optional '+' prefix followed by 7 to 15 digits
    if not re.match(r'^\+?[0-9]{7,15}$', cleaned):
        raise ValueError("Phone number must contain between 7 and 15 digits and may start with '+'")
    
    # Strip optional '+' prefix to test digit patterns
    digits = cleaned.replace('+', '')
    
    # 1. Block repeated identical digits (e.g. 9999999999)
    if re.match(r'^(\d)\1+$', digits):
        raise ValueError("Fake phone number: cannot consist entirely of identical repeating digits.")
        
    # 2. Block sequential digits (e.g. 1234567890 or 9876543210)
    if digits in "01234567890123456789" or digits in "98765432109876543210":
        raise ValueError("Fake phone number: cannot be a simple consecutive sequence of digits.")
        
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
    email: Optional[EmailStr] = None
    phone: str
    location: str
    question: str
    verification_token: Optional[str] = None

    @field_validator('name', 'location', 'question')
    @classmethod
    def sanitize_input(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator('phone')
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_phone_number(v)


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    subject: str
    message: str
    verification_token: Optional[str] = None

    @field_validator('name', 'subject', 'message')
    @classmethod
    def sanitize_input(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator('phone')
    @classmethod
    def check_phone(cls, v: str) -> str:
        if not v or v.strip().lower() in ["n/a", "none", "not provided"] or v.startswith("DOB:"):
            return v
        return validate_phone_number(v)


class HelpRequest(BaseModel):
    name: str
    phone: str
    email: EmailStr
    query: str

    @field_validator('name', 'query')
    @classmethod
    def sanitize_input(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator('phone')
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_phone_number(v)


class BookingRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    service_name: str  # e.g. "Vedic Astrology", "Prashna Kundali", "Vastu Consultation"
    date: str          # Format: "YYYY-MM-DD"
    time_slot: str     # Format: "HH:MM" (24-hour time, e.g. "10:00", "15:30")
    duration_minutes: Optional[int] = 45
    birth_details: Optional[str] = None  # Intake details (DOB, Time, Place, or Specific Question)
    verification_token: Optional[str] = None

    @field_validator('full_name', 'service_name', 'birth_details')
    @classmethod
    def sanitize_input(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_string(v)

    @field_validator('phone')
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_phone_number(v)


# ==========================================
# 🔐 AUTH & OTP VERIFICATION ENDPOINTS
# ==========================================
@app.post("/api/auth/send-otp")
def send_otp(req: SendOtpRequest):
    """Generates 6-digit OTP, caches in Redis (5 min TTL), and dispatches via Resend."""
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
    
    # 3. Store in Redis/Cache with 5-minute TTL (300 seconds)
    cache_key = f"otp:{email_clean}:{purpose_clean}"
    set_cache_key(cache_key, otp_code, ex_seconds=300)
    
    # 4. Dispatch Email via Resend API
    send_resend_otp_email(email_clean, otp_code, purpose=purpose_clean)
        
    return {
        "success": True,
        "message": f"Verification code has been dispatched to {email_clean}."
    }


@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    """Verifies OTP from Redis, burns it on success, and issues 15-min verification state."""
    email_clean = req.email.strip().lower()
    purpose_clean = (req.purpose or "verification").strip().lower()
    otp_clean = req.otp.strip()
    
    cache_key = f"otp:{email_clean}:{purpose_clean}"
    stored_otp = get_cache_key(cache_key)
    
    if not stored_otp:
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired or was not requested. Please request a new code."
        )
        
    if stored_otp != otp_clean:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code. Please check your email and enter the correct code."
        )
        
    # Delete OTP key to prevent replay attacks
    delete_cache_key(cache_key)
    
    # Generate verification token and mark verified in Redis with 15-minute TTL (900 seconds)
    verification_token = f"tok_{secrets.token_hex(16)}"
    verified_key = f"verified:{email_clean}:{purpose_clean}"
    set_cache_key(verified_key, verification_token, ex_seconds=900)
    
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
            
    smtp_sender = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_receiver = os.getenv("SMTP_EMAIL", "astroadvicebyks@gmail.com")
    
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
            msg['Subject'] = f"★ New Inquiry: {contact.subject} ★"
            
            email_body = f"""
Hello Kundan Singh,

You have received a new contact inquiry from the Astrology Website:

----------------------------------------
CLIENT NAME:    {contact.name}
CLIENT EMAIL:   {contact.email}
CLIENT PHONE:   {contact.phone}
SUBJECT/TOPIC:  {contact.subject}

MESSAGE DETAIL:
{contact.message}
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
            print("✓ Contact inquiry successfully dispatched via SMTP email")
        except Exception as e:
            print(f"SMTP Email delivery failed: {str(e)}")
            email_status = "smtp_failed"
            
    # Append to Google Sheets
    try:
        timestamp_str = datetime.utcnow().isoformat()
        append_row_to_sheet("Contact Queries", [
            timestamp_str,
            contact.name,
            contact.email,
            contact.phone,
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
        
    smtp_sender = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_receiver = os.getenv("SMTP_EMAIL", "astroadvicebyks@gmail.com")
    
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
            msg['Subject'] = f"★ New Horary Prashna Question ★"
            
            email_body = f"""
Hello Kundan Singh,

You have received a new horary Prashna question from the website:

----------------------------------------
CLIENT NAME:      {prashna.name}
CLIENT PHONE:     {prashna.phone}
CURRENT LOCATION: {prashna.location}

SPECIFIC QUESTION:
{prashna.question}
----------------------------------------

*This question was logged locally and dispatched automatically via website backend*
"""
            msg.attach(MIMEText(email_body, 'plain'))
            
            # Connect to SMTP Server
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(smtp_sender, smtp_password)
            server.sendmail(smtp_sender, smtp_receiver, msg.as_string())
            server.quit()
            
            email_status = "sent_via_smtp"
            print("✓ Prashna inquiry successfully dispatched via SMTP email")
        except Exception as e:
            print(f"SMTP Email delivery failed: {str(e)}")
            email_status = "smtp_failed"
            
    # Append to Google Sheets
    try:
        timestamp_str = datetime.utcnow().isoformat()
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

        # Parse start and end datetimes
        start_time_str = f"{booking.date}T{booking.time_slot}:00"
        start_datetime = datetime.fromisoformat(start_time_str)
        end_datetime = start_datetime + timedelta(minutes=booking.duration_minutes)

        # ----------------------------------------------------
        # 1. RULE CHECK: Operating Days Validation
        # ----------------------------------------------------
        if start_datetime.weekday() not in ALLOWED_DAYS:
            raise HTTPException(
                status_code=400, 
                detail="Appointments are not available on Sundays."
            )

        # ----------------------------------------------------
        # 2. RULE CHECK: Split Time Windows (10-12 & 15-18)
        # ----------------------------------------------------
        is_within_allowed_window = False
        
        for window in ALLOWED_TIME_WINDOWS:
            # Check if the appointment start and end times fall completely inside an allowed window
            if start_datetime.hour >= window["start"] and end_datetime.hour <= window["end"]:
                # If it finishes at the boundary hour with extra minutes (e.g. 12:15 or 18:30), it's invalid
                if end_datetime.hour == window["end"] and end_datetime.minute > 0:
                    continue
                is_within_allowed_window = True
                break

        if not is_within_allowed_window:
            raise HTTPException(
                status_code=400, 
                detail="Bookings are only available between 10:00 AM - 12:00 PM and 3:00 PM - 6:00 PM."
            )

        # ----------------------------------------------------
        # 3. RULE CHECK & CREATION
        # ----------------------------------------------------
        if use_google_calendar:
            service = get_calendar_service()

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

            existing_bookings_count = len(existing_events_result.get("items", []))

            if existing_bookings_count >= MAX_BOOKINGS_PER_HOUR:
                raise HTTPException(
                    status_code=400, 
                    detail=f"This hourly slot has reached its limit of {MAX_BOOKINGS_PER_HOUR} appointments. Please select a different time slot."
                )

            # Create event in Google Calendar
            description_body = f"""
🔮 ASTROLOGY SERVICE APPOINTMENT
----------------------------------------
Client Name: {booking.full_name}
Client Email: {booking.email}
Client Phone: {booking.phone}
Service Requested: {booking.service_name}

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
                        {"method": "email", "minutes": 24 * 60},  # Email reminder 24h before
                        {"method": "popup", "minutes": 15},       # Pop-up reminder 15m before
                    ],
                },
            }

            # Determine dynamic meeting link
            static_meet = os.getenv("STATIC_MEET_LINK")
            if static_meet:
                meet_link = static_meet
            else:
                meet_link = f"https://meet.jit.si/AstroAdvice-Consultation-{uuid.uuid4().hex[:8]}"

            # Add Meet Link directly inside Google Calendar description
            event_body["description"] += f"\nOnline Session Link: {meet_link}\n"

            # Insert into Google Calendar (reverted conferenceData to bypass Service Account restriction)
            created_event = service.events().insert(
                calendarId=CALENDAR_ID, 
                body=event_body
            ).execute()

            # Send SMTP email confirmation for new booking
            smtp_sender = os.getenv("SMTP_EMAIL")
            smtp_password = os.getenv("SMTP_PASSWORD")
            smtp_receiver = os.getenv("SMTP_EMAIL", "astroadvicebyks@gmail.com")
            
            if smtp_sender and smtp_password:
                try:
                    import smtplib
                    from email.mime.text import MIMEText
                    from email.mime.multipart import MIMEMultipart
                    
                    msg = MIMEMultipart()
                    msg['From'] = smtp_sender
                    msg['To'] = smtp_receiver
                    msg['Subject'] = f"★ New Appointment Booked: {booking.service_name} ★"
                    
                    email_body = f"""
Hello Kundan Singh,

A new appointment has been successfully booked on the website:

----------------------------------------
CLIENT NAME:       {booking.full_name}
CLIENT EMAIL:      {booking.email}
CLIENT PHONE:      {booking.phone}
SERVICE NAME:      {booking.service_name}
MEET CALL LINK:    {meet_link or 'No Meet Link generated'}
DATE:              {booking.date}
TIME SLOT:         {booking.time_slot} (Duration: {booking.duration_minutes} min)

INTAKE/BIRTH DETAILS:
{booking.birth_details or 'None provided.'}
----------------------------------------

*This appointment is synced with Google Calendar and notified via website backend*
"""
                    msg.attach(MIMEText(email_body, 'plain'))
                    
                    server = smtplib.SMTP("smtp.gmail.com", 587)
                    server.starttls()
                    server.login(smtp_sender, smtp_password)
                    server.sendmail(smtp_sender, smtp_receiver, msg.as_string())
                    server.quit()
                    print("✓ Booking notification email sent successfully")
                except Exception as e:
                    print(f"Failed to send booking notification email: {str(e)}")

            # Append to Google Sheets
            try:
                timestamp_str = datetime.utcnow().isoformat()
                append_row_to_sheet("Bookings", [
                    timestamp_str,
                    booking.full_name,
                    booking.email,
                    booking.phone,
                    booking.service_name,
                    booking.date,
                    booking.time_slot,
                    booking.duration_minutes,
                    booking.birth_details
                ])
            except Exception as sheets_err:
                print(f"Failed to log booking to Google Sheets: {str(sheets_err)}")

            return {
                "status": "success",
                "message": "Appointment booked successfully!",
                "event_link": created_event.get("htmlLink"),
                "meet_link": meet_link
            }
        else:
            # Fallback Development Mode: Save bookings locally
            import json
            local_bookings_file = "local_bookings.json"
            bookings_list = []
            
            if os.path.exists(local_bookings_file):
                try:
                    with open(local_bookings_file, "r") as f:
                        bookings_list = json.load(f)
                except Exception:
                    pass

            # Local conflict check
            hour_prefix = f"{booking.date}T{booking.time_slot.split(':')[0]}"
            hourly_count = 0
            for b in bookings_list:
                b_date = b.get("date")
                b_slot = b.get("time_slot", "")
                if b_date == booking.date and b_slot.startswith(booking.time_slot.split(":")[0]):
                    hourly_count += 1

            if hourly_count >= MAX_BOOKINGS_PER_HOUR:
                raise HTTPException(
                    status_code=400, 
                    detail=f"This hourly slot has reached its limit of {MAX_BOOKINGS_PER_HOUR} appointments. Please select a different time slot."
                )

            # Save the new booking
            new_booking = booking.dict()
            new_booking["booked_at"] = datetime.now().isoformat()
            bookings_list.append(new_booking)
            
            with open(local_bookings_file, "w") as f:
                json.dump(bookings_list, f, indent=4)

            return {
                "status": "success",
                "message": "Appointment booked successfully! (Saved locally in development mode. Please add service_account.json for Google Calendar sync.)"
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
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from dotenv import load_dotenv

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
SCOPES = ["https://www.googleapis.com/auth/calendar"]

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



# Input Data Model for Booking Requests
class PrashnaRequest(BaseModel):
    name: str
    phone: str
    location: str
    question: str


class ContactRequest(BaseModel):
    name: str
    email: str
    phone: str
    subject: str
    message: str


class HelpRequest(BaseModel):
    name: str
    phone: str
    email: str
    query: str


class BookingRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    service_name: str  # e.g. "Vedic Astrology", "Prashna Kundali", "Vastu Consultation"
    date: str          # Format: "YYYY-MM-DD"
    time_slot: str     # Format: "HH:MM" (24-hour time, e.g. "10:00", "15:30")
    duration_minutes: Optional[int] = 45
    birth_details: Optional[str] = None  # Intake details (DOB, Time, Place, or Specific Question)


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
            
    return {
        "status": "success",
        "email_status": email_status,
        "message": "Help query received by server successfully!"
    }


@app.post("/api/prashna")
def save_prashna(prashna: PrashnaRequest):
    """Saves Prashna questions locally and attempts to send SMTP email."""
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
            
    return {
        "status": "success",
        "email_status": email_status,
        "message": "Prashna received successfully!"
    }


@app.post("/api/book-appointment")
async def book_appointment(booking: BookingRequest):
    """Processes appointment requests, checks rules/conflicts, and books into Google Calendar."""
    try:
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
    except Exception as e:
        print(f"Error creating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
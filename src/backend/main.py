import os
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
CALENDAR_ID = os.getenv("CALENDAR_ID", "YOUR_CALENDAR_ID_HERE@group.calendar.google.com")
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
    """Authenticates using the Service Account and returns the Google Calendar API client."""
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        raise FileNotFoundError(
            f"Error: Could not find '{SERVICE_ACCOUNT_FILE}'. Make sure it is placed in the backend root directory."
        )
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build("calendar", "v3", credentials=creds)


# Input Data Model for Booking Requests
class BookingRequest(BaseModel):
    full_name: str
    email: EmailStr
    service_name: str  # e.g. "Vedic Astrology", "Prashna Kundali", "Reiki Healing"
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
                    timeMin=start_dt.isoformat() + "Z",
                    timeMax=end_dt.isoformat() + "Z",
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
                timeMin=hour_window_start.isoformat() + "Z",
                timeMax=hour_window_end.isoformat() + "Z",
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
                "guestsCanModify": False,
                "guestsCanInviteOthers": False,
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "email", "minutes": 24 * 60},  # Email reminder 24h before
                        {"method": "popup", "minutes": 30},       # Pop-up reminder 30m before
                    ],
                },
            }

            # Insert into Google Calendar (attendees removed to bypass Domain-Wide Delegation restriction)
            created_event = service.events().insert(
                calendarId=CALENDAR_ID, 
                body=event_body
            ).execute()

            return {
                "status": "success",
                "message": "Appointment booked successfully!",
                "event_link": created_event.get("htmlLink")
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
"""Validate at the API boundary; escape content when rendering, not before storage."""

import re
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StrictInt, field_validator
from .domain import parse_day


class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class EmailInput(InputModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        return value.lower()


class SendCode(EmailInput):
    purpose: Literal["booking", "contact", "prashna"]


class VerifyCode(SendCode):
    otp: str = Field(pattern=r"^[0-9]{6}$", repr=False)


class VerifiedInput(EmailInput):
    request_id: UUID
    verification_token: str = Field(min_length=30, max_length=256, repr=False)


class ContactInput(VerifiedInput):
    source: Literal['home', 'contact'] = 'contact'
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(default="", max_length=30)
    dob: str = Field(default="", max_length=30)
    subject: str = Field(min_length=2, max_length=150)
    message: str = Field(min_length=2, max_length=4000)


class PrashnaInput(VerifiedInput):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=30)
    location: str = Field(min_length=2, max_length=200)
    question: str = Field(min_length=2, max_length=4000)


class BookingDetails(EmailInput):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=30)
    service_id: str = Field(min_length=1, max_length=50)
    question_count: StrictInt = Field(default=1, ge=1, le=10)
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    time_slot: str = Field(pattern=r"^\d{2}:\d{2}$")
    duration_minutes: Literal[30] = 30
    quote_version: str = Field(pattern=r"^[a-f0-9]{64}$")
    birth_date: str = Field(pattern=r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
    birth_time: str = Field(default="", pattern=r"^(?:|(?:[01][0-9]|2[0-3]):[0-5][0-9])$")
    birth_place: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=4000)

    @field_validator("birth_date", "date")
    @classmethod
    def real_date(cls, value):
        parse_day(value)
        return value

    @field_validator("phone")
    @classmethod
    def phone_number(cls, value):
        cleaned = re.sub(r"[\s().-]", "", value)
        if not re.fullmatch(r"\+?[0-9]{7,15}", cleaned):
            raise ValueError("Please enter a valid phone number.")
        return cleaned


class BookingInput(BookingDetails, VerifiedInput):
    pass


class ReceiptInput(InputModel):
    request_id: UUID


class DeliveryInput(InputModel):
    job_id: UUID


class RecoveryInput(InputModel):
    run_id: UUID

"""Small API boundary for the approved booking foundation.

Payment HTTP actions stay closed until the verified provider flow is implemented.
Private calendar access requires configured Google sign-in and a secure
client session. Internal scheduling methods are not an alternative public checkout.
"""

import os
import hmac
from dataclasses import dataclass, field
from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .admin import admin_router
from .domain import CATALOGUE, DURATION_MINUTES, RuleViolation, quote
from .models import ContactInput, DeliveryInput, PrashnaInput, ReceiptInput, RecoveryInput, SendCode, VerifyCode
from .resend_email import send_code
from .inquiry_delivery import InquiryDelivery
from .inquiry_dispatch import APPLICATION, ENVIRONMENT, InquiryDispatch
from .storage import StorageUnavailable, Store, fingerprint, receipt_digest
from .verification import EmailVerification
from .email_events import receive_event


@dataclass(repr=False)
class Settings:
    database_url: str = field(default="", repr=False)
    otp_secret: str = field(default="", repr=False)
    resend_key: str = field(default="", repr=False)
    resend_webhook_secret: str = field(default="", repr=False)
    sender: str = ""
    delivery_secret: str = field(default="", repr=False)
    recovery_secret: str = field(default="", repr=False)
    cloudflare_account_id: str = ""
    cloudflare_queue_id: str = ""
    cloudflare_queue_token: str = field(default="", repr=False)
    google_client_id: str = ""
    google_client_secret: str = field(default="", repr=False)
    google_token_key: str = field(default="", repr=False)
    origins: tuple = ("http://localhost:5173", "http://127.0.0.1:5173")

    @classmethod
    def from_environment(cls):
        # No automatic .env discovery and no hard-coded credential defaults.
        # Existing SMTP/Redis variables cannot silently enable legacy behavior.
        origins = tuple(s.strip() for s in os.getenv("ASTRO_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if s.strip())
        for origin in origins:
            parsed = urlparse(origin)
            if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username:
                raise ValueError("ASTRO_ALLOWED_ORIGINS must contain explicit website origins, not wildcards or paths.")
            if parsed.scheme == "http" and parsed.hostname not in ("localhost", "127.0.0.1"):
                raise ValueError("Non-local website origins must use HTTPS.")
        return cls(database_url=os.getenv("ASTRO_DATABASE_URL", ""), otp_secret=os.getenv("ASTRO_OTP_SECRET", ""),
                   resend_key=os.getenv("ASTRO_RESEND_API_KEY", ""), sender=os.getenv("ASTRO_EMAIL_FROM", ""), origins=origins,
                   google_client_id=os.getenv("ASTRO_GOOGLE_CLIENT_ID", ""),
                   google_client_secret=os.getenv("ASTRO_GOOGLE_CLIENT_SECRET", ""),
                   google_token_key=os.getenv("ASTRO_GOOGLE_TOKEN_KEY", ""),
                   resend_webhook_secret=os.getenv("ASTRO_RESEND_WEBHOOK_SECRET", ""),
                   delivery_secret=os.getenv("ASTRO_DELIVERY_SECRET", ""),
                   recovery_secret=os.getenv("ASTRO_RECOVERY_SECRET", ""),
                   cloudflare_account_id=os.getenv("ASTRO_CLOUDFLARE_ACCOUNT_ID", ""),
                   cloudflare_queue_id=os.getenv("ASTRO_CLOUDFLARE_QUEUE_ID", ""),
                   cloudflare_queue_token=os.getenv("ASTRO_CLOUDFLARE_QUEUE_TOKEN", ""))


class BodyLimitMiddleware:
    """Bound JSON bodies even when content-length is absent or dishonest."""
    def __init__(self, app, limit=16384):
        self.app, self.limit = app, limit

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] not in ("POST", "PUT", "PATCH"):
            return await self.app(scope, receive, send)
        chunks, size = [], 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            size += len(chunk)
            if size > self.limit:
                return await JSONResponse({"detail": "The submitted form is too large."}, status_code=413)(scope, receive, send)
            chunks.append(chunk)
            if not message.get("more_body", False):
                break
        sent = False

        async def replay():
            nonlocal sent
            if not sent:
                sent = True
                return {"type": "http.request", "body": b"".join(chunks), "more_body": False}
            return await receive()

        await self.app(scope, replay, send)


def create_app(settings=None, *, store=None, code_sender=None, identity_verifier=None, notification_sender=None, queue_publisher=None):
    settings = settings or Settings.from_environment()
    store = store or Store(settings.database_url)
    verification = EmailVerification(store, settings.otp_secret, code_sender or (lambda *args: send_code(settings, *args)))
    delivery = InquiryDelivery(store, settings, sender=notification_sender)
    dispatch = InquiryDispatch(store, settings, publisher=queue_publisher)
    app = FastAPI(title="AstroAdvice Booking Engine", docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(BodyLimitMiddleware)
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.origins), allow_credentials=True,
                       allow_methods=["GET", "POST"], allow_headers=["Content-Type", "X-Astro-CSRF", "X-Astro-Receipt"])
    app.include_router(admin_router(settings, store, identity_verifier))

    @app.exception_handler(RuleViolation)
    async def rule_error(request, exc):
        return JSONResponse({"detail": str(exc), "code": exc.code, "fields": exc.fields}, status_code=exc.status)

    @app.exception_handler(StorageUnavailable)
    async def storage_error(request, exc):
        return JSONResponse({"detail": str(exc), "code": "storage_unavailable"}, status_code=503)

    @app.exception_handler(RequestValidationError)
    async def invalid_input(request, exc):
        # FastAPI's default includes submitted values, which could echo OTPs/tokens.
        return JSONResponse({"detail": "Please check the form fields and try again.", "code": "invalid_fields",
                             "fields": [".".join(str(part) for part in error["loc"]) for error in exc.errors()]}, status_code=422)

    @app.middleware("http")
    async def private_response_headers(request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Vercel-Enable-Rewrite-Caching"] = "0"
        return response

    @app.get("/")
    @app.get("/api/health")
    def health():
        return {"status": "online", "booking_enabled": False}

    @app.get("/api/ready")
    def readiness():
        ready = store.ready()
        return JSONResponse({"storage_ready": ready, "booking_enabled": False}, status_code=200 if ready else 503)

    @app.get("/api/services")
    def services():
        return {"services": [{**service, "currency": "INR", "duration_minutes": DURATION_MINUTES} for service in CATALOGUE]}

    @app.get("/api/quote")
    def service_quote(service_id: str, question_count: int = 1):
        return quote(service_id, question_count)

    @app.get("/api/booking-policy")
    def policy():
        return store.policy()

    @app.get("/api/availability")
    def availability(date: str):
        return store.availability(date)

    @app.post("/api/auth/send-otp")
    def issue_code(payload: SendCode, request: Request):
        if payload.purpose == "booking":
            raise StorageUnavailable("Online booking is being configured. Please call +91 85277 90801 for an appointment.")
        if code_sender is None and not (settings.resend_key and settings.sender):
            raise StorageUnavailable("Email verification is not available yet. Please contact the studio by phone.")
        verification.issue(str(payload.email), payload.purpose, request.client.host if request.client else "unknown")
        return {"success": True, "message": "The verification email has been accepted for delivery."}

    @app.post('/api/webhooks/resend')
    async def resend_event(request: Request):
        from starlette.concurrency import run_in_threadpool
        body = await request.body()
        await run_in_threadpool(receive_event, store, settings.resend_webhook_secret, body, request.headers)
        return {'received': True}

    @app.post("/api/auth/verify-otp")
    def verify_code(payload: VerifyCode, request: Request):
        token = verification.verify(str(payload.email), payload.purpose, payload.otp, request.client.host if request.client else "unknown")
        return {"success": True, "verification_token": token}

    @app.post("/api/contact")
    def contact(payload: ContactInput, request: Request):
        data = payload.model_dump(exclude={"verification_token", "request_id"})
        data["kind"] = "contact"
        inquiry_id = store.save_inquiry(data, payload.request_id, verification.digest(payload.verification_token), request.headers.get("X-Astro-Receipt"))
        dispatch.after_save(inquiry_id)
        return store.inquiry_status(payload.request_id, request.headers.get("X-Astro-Receipt"))

    def require_internal(request, secret):
        if len(secret) < 32:
            raise StorageUnavailable("The delivery connection is not configured.")
        authorization = request.headers.get('Authorization', '')
        if not hmac.compare_digest(authorization.encode(), f'Bearer {secret}'.encode()):
            raise RuleViolation("This delivery request is not authorized.", 403, "delivery_unauthorized")

    @app.post("/api/internal/delivery/inquiry")
    def deliver_inquiry(payload: DeliveryInput, request: Request):
        # This is a server-to-server credential, not a customer OTP/admin session.
        # Authenticate before touching any job or sending to the provider.
        require_internal(request, settings.delivery_secret)
        try:
            result = delivery.run(payload.job_id)
        except ValueError:
            raise RuleViolation("This delivery request is unavailable.", 404, "delivery_unavailable") from None
        return JSONResponse({'application': APPLICATION, 'environment': ENVIRONMENT, **result}, status_code=200 if result['terminal'] else 202)

    @app.post("/api/internal/recovery/inquiries")
    def recover_inquiries(payload: RecoveryInput, request: Request):
        require_internal(request, settings.recovery_secret)
        result = dispatch.run()
        store.cleanup_ephemeral()
        return {'application': APPLICATION, 'environment': ENVIRONMENT,
                'run_id': str(payload.run_id), **result}

    @app.post("/api/prashna")
    def prashna(payload: PrashnaInput, request: Request):
        data = payload.model_dump(exclude={"verification_token", "request_id", "question"})
        data.update(kind="prashna", subject="Prashna Kundali inquiry", message=payload.question)
        inquiry_id = store.save_inquiry(data, payload.request_id, verification.digest(payload.verification_token), request.headers.get("X-Astro-Receipt"))
        dispatch.after_save(inquiry_id)
        return store.inquiry_status(payload.request_id, request.headers.get("X-Astro-Receipt"))

    @app.post("/api/inquiry-status")
    def inquiry_status(payload: ReceiptInput, request: Request):
        limit_receipt_reads(payload, request, "inquiry")
        return store.inquiry_status(payload.request_id, request.headers.get("X-Astro-Receipt"))

    def limit_receipt_reads(payload, request, purpose):
        receipt_digest(request.headers.get("X-Astro-Receipt"), purpose, payload.request_id)
        with store.transaction() as conn:
            now = store.now(conn)
            key = fingerprint(["receipt-read", request.client.host if request.client else "unknown"])
            allowed = verification.bump(conn, key, now, 60, 60)
        if not allowed:
            raise RuleViolation("Please wait a minute before checking again.", 429, "rate_limited")

    @app.post("/api/booking-status")
    def booking_status(payload: ReceiptInput, request: Request):
        limit_receipt_reads(payload, request, "booking")
        return store.booking_status(payload.request_id, request.headers.get("X-Astro-Receipt"))

    @app.post("/api/help")
    def retired_help():
        return JSONResponse({"detail": "Please use the Contact page to send an inquiry."}, status_code=410)

    @app.post("/api/book-appointment")
    def booking_not_enabled():
        # There is intentionally no public direct call to Store.hold/confirm_paid.
        raise StorageUnavailable("Online payment and booking are not available yet. Please call +91 85277 90801 for an appointment.")

    return app

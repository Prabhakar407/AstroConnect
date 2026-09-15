"""API boundary for public booking and the client's private studio tools.

Checkout is available only when storage, email, queue, Google Calendar and the
matching Razorpay merchant configuration are all ready. Private operations
still require the approved Google identity and a secure client session.
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
from .models import (BookingInput, CheckoutConfirmationInput, ContactInput, DeliveryInput,
                     PrashnaInput, ReceiptInput, RecoveryInput, SendCode, VerifyCode)
from .resend_email import send_code
from .inquiry_delivery import InquiryDelivery
from .inquiry_dispatch import (APPLICATION, ENVIRONMENT, BookingDispatch, InquiryDispatch,
                               SheetDispatch, queue_configured)
from .sheet_delivery import SheetDelivery
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
    google_sheets_service_account_json: str = field(default="", repr=False)
    client_sheet_id: str = field(default="", repr=False)
    agency_sheet_id: str = field(default="", repr=False)
    razorpay_key_id: str = field(default="", repr=False)
    razorpay_key_secret: str = field(default="", repr=False)
    razorpay_webhook_secret: str = field(default="", repr=False)
    razorpay_account_id: str = ""
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
                   google_sheets_service_account_json=os.getenv("ASTRO_GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON", ""),
                   client_sheet_id=os.getenv("ASTRO_CLIENT_SHEET_ID", ""),
                   agency_sheet_id=os.getenv("ASTRO_AGENCY_SHEET_ID", ""),
                   razorpay_key_id=os.getenv("ASTRO_RAZORPAY_KEY_ID", ""),
                   razorpay_key_secret=os.getenv("ASTRO_RAZORPAY_KEY_SECRET", ""),
                   razorpay_webhook_secret=os.getenv("ASTRO_RAZORPAY_WEBHOOK_SECRET", ""),
                   razorpay_account_id=os.getenv("ASTRO_RAZORPAY_ACCOUNT_ID", ""),
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


def create_app(settings=None, *, store=None, code_sender=None, identity_verifier=None,
               notification_sender=None, queue_publisher=None, payment_provider=None):
    settings = settings or Settings.from_environment()
    store = store or Store(settings.database_url)
    verification = EmailVerification(store, settings.otp_secret, code_sender or (lambda *args: send_code(settings, *args)))
    delivery = InquiryDelivery(store, settings, sender=notification_sender)
    dispatch = InquiryDispatch(store, settings, publisher=queue_publisher)
    payment_dispatch = InquiryDispatch(store, settings, publisher=queue_publisher, kind='payment_event')
    from .booking_delivery import BookingDelivery
    booking_delivery = BookingDelivery(store, settings, sender=notification_sender)
    booking_dispatch = BookingDispatch(store, settings, publisher=queue_publisher)
    sheet_delivery = SheetDelivery(store, settings)
    sheet_dispatch = SheetDispatch(store, settings, publisher=queue_publisher)
    app = FastAPI(title="AstroAdvice Booking Engine", docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(BodyLimitMiddleware)
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.origins), allow_credentials=True,
                       allow_methods=["GET", "POST"], allow_headers=["Content-Type", "X-Astro-CSRF", "X-Astro-Receipt"])
    app.include_router(admin_router(settings, store, identity_verifier, booking_dispatch=booking_dispatch,
                                    payment_dispatch=payment_dispatch, sheet_dispatch=sheet_dispatch))

    def booking_ready():
        if payment_provider is not None:
            return True
        required = (settings.otp_secret, settings.resend_key, settings.resend_webhook_secret,
                    settings.sender, settings.delivery_secret, settings.recovery_secret,
                    settings.google_client_id, settings.google_client_secret, settings.google_token_key,
                    settings.razorpay_key_id, settings.razorpay_key_secret,
                    settings.razorpay_webhook_secret, settings.razorpay_account_id)
        if (not all(required) or len(settings.otp_secret) < 32 or
                len(settings.delivery_secret) < 32 or len(settings.recovery_secret) < 32 or
                len(settings.resend_webhook_secret) < 32 or
                len(settings.razorpay_webhook_secret) < 32 or
                'https://astroadvicebykundansingh.com' not in settings.origins or
                not queue_configured(settings)):
            return False
        from .google_connection import saved_connection_ready
        from .razorpay import Razorpay, merchant_identity
        try:
            Razorpay(settings.razorpay_key_id, settings.razorpay_key_secret)
        except RazorpayFailure:
            return False
        return bool(merchant_identity(settings.razorpay_account_id)) and saved_connection_ready(settings, store)

    def require_booking_ready():
        if not booking_ready():
            raise StorageUnavailable('Online booking is being configured. Please call +91 85277 90801 for an appointment.')

    @app.exception_handler(RuleViolation)
    async def rule_error(request, exc):
        return JSONResponse({"detail": str(exc), "code": exc.code, "fields": exc.fields}, status_code=exc.status)

    @app.exception_handler(StorageUnavailable)
    async def storage_error(request, exc):
        return JSONResponse({"detail": str(exc), "code": "storage_unavailable"}, status_code=503)

    from .razorpay import RazorpayFailure

    @app.exception_handler(RazorpayFailure)
    async def payment_provider_error(request, exc):
        messages = {
            'payment_provider_unavailable': 'The payment service did not respond. Your reserved time and details are unchanged; please try again.',
            'payment_response_invalid': 'The payment service returned an unexpected response. Please retry or contact the studio.',
            'payment_order_mismatch': 'We could not safely match this payment request. Please contact the studio before paying again.',
        }
        return JSONResponse({"detail": messages.get(exc.code, 'We could not safely confirm the payment request.'),
                             "code": exc.code}, status_code=502)

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
        # Process liveness only: monitoring this route must not keep Neon awake.
        return {"status": "online"}

    @app.get("/api/ready")
    def readiness():
        ready = store.ready()
        return JSONResponse({"storage_ready": ready, "booking_enabled": booking_ready() if ready else False},
                            status_code=200 if ready else 503)

    @app.get("/api/recovery-health")
    def recovery_health():
        healthy = store.recovery_healthy()
        return JSONResponse({"status": "healthy" if healthy else "attention_required"},
                            status_code=200 if healthy else 503)

    @app.get("/api/services")
    def services():
        return {"services": [{**service, "currency": "INR", "duration_minutes": DURATION_MINUTES} for service in CATALOGUE]}

    @app.get("/api/quote")
    def service_quote(service_id: str, question_count: int = 1):
        return quote(service_id, question_count)

    @app.get("/api/booking-policy")
    def policy():
        return {**store.policy(), 'booking_enabled': booking_ready()}

    @app.get("/api/availability")
    def availability(date: str):
        return store.availability(date)

    @app.post("/api/auth/send-otp")
    def issue_code(payload: SendCode, request: Request):
        if payload.purpose == 'booking':
            # Do not send a code that can only lead the customer to a dead end.
            require_booking_ready()
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
        sheet_dispatch.after_save(inquiry_id)
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
        results, dispatch_failure = [], None
        try:
            # One broken destination must not starve the other durable work.
            # Each dispatcher remains separately bounded to one queue batch.
            for durable_dispatch in (dispatch, booking_dispatch, sheet_dispatch):
                try:
                    results.append(durable_dispatch.run())
                except StorageUnavailable as error:
                    dispatch_failure = dispatch_failure or error
                    results.append({'selected': 0, 'published': 0})
            store.cleanup_ephemeral()
        finally:
            # A failed inquiry publication must not prevent payment recovery.
            # Reuse this scheduled request with one bounded provider fetch.
            if (settings.razorpay_key_id and settings.razorpay_key_secret and
                    settings.razorpay_webhook_secret and settings.razorpay_account_id):
                payments = payment_events_service()
                payments.checkout.reconcile_one()
                payments.process_one()
        if dispatch_failure:
            raise dispatch_failure
        from .private_attention import pending_count
        attention = pending_count(store)
        store.record_recovery_completion(payload.run_id, attention)
        return {'application': APPLICATION, 'environment': ENVIRONMENT,
                'run_id': str(payload.run_id),
                'selected': sum(result['selected'] for result in results),
                'published': sum(result['published'] for result in results),
                'needs_attention': attention}

    @app.post("/api/prashna")
    def prashna(payload: PrashnaInput, request: Request):
        data = payload.model_dump(exclude={"verification_token", "request_id", "question"})
        data.update(kind="prashna", subject="Prashna Kundali inquiry", message=payload.question)
        inquiry_id = store.save_inquiry(data, payload.request_id, verification.digest(payload.verification_token), request.headers.get("X-Astro-Receipt"))
        dispatch.after_save(inquiry_id)
        sheet_dispatch.after_save(inquiry_id)
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

    def payment_checkout_service():
        from .payment_checkout import PaymentCheckout
        if payment_provider is not None:
            return PaymentCheckout(store, payment_provider)
        from .razorpay import Razorpay
        try:
            provider = Razorpay(settings.razorpay_key_id, settings.razorpay_key_secret)
        except RazorpayFailure:
            raise StorageUnavailable('Secure payment is not configured yet.') from None
        return PaymentCheckout(store, provider)

    def checkout_response(checkout, request_id, receipt):
        booking, order = checkout.authorized(request_id, receipt)
        status = store.booking_status(request_id, receipt)
        return {**status,
            'booking_id': str(booking['id']),
            'order_id': order['order_id'],
            'payment_key_id': order['key_id'],
            'amount_paise': order['amount_paise'],
            'currency': 'INR',
            'order_state': order['state'],
        }

    @app.post('/api/checkout')
    def begin_checkout(payload: BookingInput, request: Request):
        require_booking_ready()
        checkout = payment_checkout_service()
        receipt = request.headers.get('X-Astro-Receipt')
        details = payload.model_dump(exclude={'verification_token', 'request_id'})
        checkout.start(details, payload.request_id, verification.digest(payload.verification_token), receipt)
        result = checkout_response(checkout, payload.request_id, receipt)
        return JSONResponse(result, status_code=200 if result['order_state'] == 'ready' else 202)

    @app.post('/api/checkout/resume')
    def resume_checkout(payload: ReceiptInput, request: Request):
        limit_receipt_reads(payload, request, 'booking')
        checkout = payment_checkout_service()
        return checkout_response(checkout, payload.request_id, request.headers.get('X-Astro-Receipt'))

    @app.post('/api/checkout/verify-payment')
    def verify_checkout_payment(payload: CheckoutConfirmationInput, request: Request):
        limit_receipt_reads(payload, request, 'booking')
        checkout = payment_checkout_service()
        receipt = request.headers.get('X-Astro-Receipt')
        checkout.browser_confirmation(payload.request_id, receipt, payload.payment_id, payload.signature)
        result = store.booking_status(payload.request_id, receipt)
        if result['appointment_state'] == 'confirmed':
            booking_dispatch.after_save(result['booking_id'])
            sheet_dispatch.after_save(result['booking_id'])
        return result

    @app.post("/api/book-appointment")
    def retired_booking_route():
        return JSONResponse({"detail": "Please refresh the booking page and use its secure payment button.",
                             "code": "route_retired"}, status_code=410)

    def payment_events_service():
        from .payment_events import PaymentEvents
        checkout = payment_checkout_service()
        return PaymentEvents(store, checkout,
                             settings.razorpay_webhook_secret, settings.razorpay_account_id)

    @app.post('/api/webhooks/razorpay')
    async def razorpay_webhook(request: Request):
        from starlette.concurrency import run_in_threadpool
        events = payment_events_service()
        from .payment_dispatch import dispatch_event
        # Commit the event and job together, then briefly publish to the queue.
        # Provider verification runs in the authenticated consumer, not this ACK.
        event_id = await run_in_threadpool(events.receive, await request.body(), request.headers)
        if event_id:
            record_id = await run_in_threadpool(events.record_id, event_id)
            await dispatch_event(store, settings, record_id)
        return {'received': True}

    @app.post('/api/internal/delivery/payment')
    def deliver_payment(payload: DeliveryInput, request: Request):
        require_internal(request, settings.delivery_secret)
        result = payment_events_service().deliver(payload.job_id)
        if result['state'] == 'sent':
            booking_dispatch.after_save(None)
            sheet_dispatch.after_save(None)
        return JSONResponse({'application': APPLICATION, 'environment': ENVIRONMENT, **result},
                            status_code=200 if result['terminal'] else 202)

    @app.post('/api/internal/delivery/booking')
    def deliver_booking(payload: DeliveryInput, request: Request):
        require_internal(request, settings.delivery_secret)
        try:
            result = booking_delivery.run(payload.job_id)
        except ValueError:
            raise RuleViolation('This booking task is unavailable.', 404, 'delivery_unavailable') from None
        return JSONResponse({'application': APPLICATION, 'environment': ENVIRONMENT, **result},
                            status_code=200 if result['terminal'] else 202)

    @app.post('/api/internal/delivery/sheet')
    def deliver_sheet(payload: DeliveryInput, request: Request):
        require_internal(request, settings.delivery_secret)
        try:
            result = sheet_delivery.run(payload.job_id)
        except ValueError:
            raise RuleViolation('This spreadsheet task is unavailable.', 404, 'delivery_unavailable') from None
        return JSONResponse({'application': APPLICATION, 'environment': ENVIRONMENT, **result},
                            status_code=200 if result['terminal'] else 202)

    return app

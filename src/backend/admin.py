"""Client-only Google sign-in and private calendar; no password or public signup.

Google's library checks the signed identity. A one-use, browser-bound nonce
protects login; opaque HttpOnly sessions and explicit origin/CSRF checks protect
all later writes. Production requires a same-site HTTPS website/API setup.
"""

import hashlib
import hmac
import secrets
from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Request, Response
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from pydantic import Field

from .domain import CLIENT_EMAIL, RuleViolation
from .models import InputModel, PaymentCaseResolution
from .storage import StorageUnavailable
from .verification import EmailVerification
from . import private_inquiries

SESSION_COOKIE = "__Host-astro_session"
LOGIN_COOKIE = "__Host-astro_login"


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


class LoginInput(InputModel):
    credential: str = Field(min_length=20, max_length=8192, repr=False)


class CloseInput(InputModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str | None = Field(default=None, max_length=5)
    end_time: str | None = Field(default=None, max_length=5)
    reason: str = Field(default="", max_length=200)


def google_identity(credential, audience):
    class TimedRequest(GoogleRequest):
        def __call__(self, *args, **kwargs):
            kwargs["timeout"] = 10
            return super().__call__(*args, **kwargs)

    try:
        return id_token.verify_oauth2_token(credential, TimedRequest(), audience)
    except Exception:
        # Provider exceptions can contain credential/transport details.
        raise RuleViolation("Google sign-in could not be verified. Please try again.", 401) from None


def admin_router(settings, store, identity_verifier=None, *, booking_dispatch=None, payment_dispatch=None):
    router = APIRouter(prefix="/api/admin")
    verify_identity = identity_verifier or google_identity

    def configured():
        if not settings.google_client_id:
            raise StorageUnavailable("Private calendar sign-in is not connected yet.")

    def origin(request):
        if request.headers.get("origin") not in settings.origins:
            raise RuleViolation("Please use the approved studio website.", 403)

    def cookie(response, name, token, lifetime):
        response.set_cookie(name, token, max_age=lifetime, secure=True, httponly=True, samesite="strict", path="/")

    def session(request, *, write=False):
        configured()
        token = request.cookies.get(SESSION_COOKIE, "")
        if not 40 <= len(token) <= 100:
            raise RuleViolation("Please sign in to the private calendar.", 401)
        with store.transaction() as conn:
            row = conn.execute("SELECT * FROM admin_sessions WHERE token_digest=%s AND expires_at>%s",
                               (digest(token), store.now(conn))).fetchone()
        if not row:
            raise RuleViolation("Your session has expired. Please sign in again.", 401)
        if write:
            origin(request)
            if not hmac.compare_digest(row["csrf_token"], request.headers.get("x-astro-csrf", "")):
                raise RuleViolation("Please refresh the private calendar before making changes.", 403)
        return row

    @router.get("/session")
    def current_session(request: Request):
        row = session(request)
        return {"email": CLIENT_EMAIL, "csrf_token": row["csrf_token"]}

    @router.post("/login/start")
    def login_start(request: Request, response: Response):
        configured()
        origin(request)
        token, nonce = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        with store.transaction() as conn:
            now = store.now(conn)
            permitted = EmailVerification.bump(conn, digest("admin-login:" + (request.client.host if request.client else "unknown")), now, 600, 20)
            conn.execute("DELETE FROM admin_login_challenges WHERE expires_at<=%s", (now,))
            conn.execute("DELETE FROM admin_sessions WHERE expires_at<=%s", (now,))
            if permitted:
                previous = request.cookies.get(LOGIN_COOKIE, "")
                conn.execute("DELETE FROM admin_login_challenges WHERE token_digest=%s", (digest(previous),))
                conn.execute("INSERT INTO admin_login_challenges VALUES (%s,%s,%s)", (digest(token), nonce, now + timedelta(minutes=5)))
        if not permitted:
            raise RuleViolation("Too many sign-in attempts. Please wait a few minutes.", 429)
        cookie(response, LOGIN_COOKIE, token, 300)
        return {"client_id": settings.google_client_id, "nonce": nonce}

    @router.post("/login")
    def login(payload: LoginInput, request: Request, response: Response):
        configured()
        origin(request)
        token = request.cookies.get(LOGIN_COOKIE, "")
        with store.transaction() as conn:
            challenge = conn.execute("DELETE FROM admin_login_challenges WHERE token_digest=%s AND expires_at>%s RETURNING nonce",
                                     (digest(token), store.now(conn))).fetchone()
        # A failed login burns the challenge too, limiting credential replays.
        if not challenge or not hmac.compare_digest(challenge["nonce"], request.headers.get("x-astro-csrf", "")):
            raise RuleViolation("Please start Google sign-in again.", 403)
        identity = verify_identity(payload.credential, settings.google_client_id)
        if (identity.get("email", "").lower() != CLIENT_EMAIL or identity.get("email_verified") is not True
                or not identity.get("sub") or identity.get("nonce") != challenge["nonce"]):
            raise RuleViolation("Only the authorized studio Google account can open this calendar.", 403)
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        with store.transaction() as conn:
            now = store.now(conn)
            # Pin Google's stable identifier on the first successful approved-account login.
            conn.execute("INSERT INTO admin_identity VALUES (true,%s,%s) ON CONFLICT (singleton) DO NOTHING", (identity["sub"], now))
            pinned = conn.execute("SELECT google_subject FROM admin_identity WHERE singleton=true").fetchone()
            if pinned["google_subject"] != identity["sub"]:
                raise RuleViolation("This Google account does not match the authorized studio account.", 403)
            previous = request.cookies.get(SESSION_COOKIE, "")
            conn.execute("DELETE FROM admin_sessions WHERE token_digest=%s", (digest(previous),))
            conn.execute("INSERT INTO admin_sessions VALUES (%s,%s,%s,%s)", (digest(token), identity["sub"], csrf, now + timedelta(hours=8)))
        cookie(response, SESSION_COOKIE, token, 8 * 3600)
        response.delete_cookie(LOGIN_COOKIE, secure=True, httponly=True, samesite="strict")
        return {"email": CLIENT_EMAIL, "csrf_token": csrf}

    @router.post("/logout")
    def logout(request: Request, response: Response):
        row = session(request, write=True)
        with store.transaction() as conn:
            conn.execute("DELETE FROM admin_sessions WHERE token_digest=%s", (row["token_digest"],))
        response.delete_cookie(SESSION_COOKIE, secure=True, httponly=True, samesite="strict")
        return {"success": True}

    @router.get("/day")
    def calendar_day(date: str, request: Request):
        session(request)
        return store.private_day(date)

    @router.get('/inquiries')
    def inquiries(request: Request, before: UUID | None = None, attention: bool = False):
        session(request)
        return private_inquiries.page(store, before, attention)

    @router.get('/inquiries/{inquiry_id}')
    def inquiry(inquiry_id: UUID, request: Request):
        session(request)
        return private_inquiries.detail(store, inquiry_id)

    @router.post('/inquiries/{inquiry_id}/seen')
    def seen(inquiry_id: UUID, request: Request):
        actor = session(request, write=True)['google_subject']
        private_inquiries.mark_seen(store, inquiry_id, actor)
        return {'success': True}

    @router.get('/attention')
    def attention(request: Request):
        session(request)
        from .private_attention import overview
        return overview(store)

    @router.post('/attention/payments/{case_id}/handled')
    def payment_case_handled(case_id: UUID, payload: PaymentCaseResolution, request: Request):
        actor = session(request, write=True)['google_subject']
        from .private_attention import handle_case
        handle_case(store, case_id, actor, payload.resolution, payload.note)
        return {'success': True, 'message': 'This item is marked as handled. No refund or payment change was made by the website.'}

    @router.post('/attention/delivery/{job_id}/retry')
    def retry_booking_delivery(job_id: UUID, request: Request):
        session(request, write=True)
        from .private_attention import retry_delivery
        retried = retry_delivery(store, job_id)
        dispatch = payment_dispatch if retried['kind'] == 'payment_event' else booking_dispatch
        if dispatch and retried['republish']:
            dispatch.after_save(retried['record_id'])
        return {'success': True, 'message': 'Delivery has been queued again.'}

    @router.post("/closures")
    def close(payload: CloseInput, request: Request):
        actor = session(request, write=True)["google_subject"]
        closure_id = store.close_time(payload.date, payload.start_time, payload.end_time, payload.reason, actor)
        return {"closure_id": str(closure_id)}

    @router.post("/closures/{closure_id}/reopen")
    def reopen(closure_id: UUID, request: Request):
        actor = session(request, write=True)["google_subject"]
        store.reopen(closure_id, actor)
        return {"success": True}

    @router.post("/bookings/{booking_id}/cancel")
    def cancel(booking_id: UUID, request: Request):
        actor = session(request, write=True)["google_subject"]
        store.cancel(booking_id, actor)
        if booking_dispatch:
            booking_dispatch.after_save(booking_id)
        return {"success": True, "delivery_status": "pending", "refund_issued": False}

    from .google_connection import add_routes
    add_routes(router, settings, store, session, verify_identity)

    return router

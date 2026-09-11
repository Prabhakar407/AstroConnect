"""Shared outbound email transport; no settings lookup or sends at import."""
import html
import json
import re
from http.client import HTTPException
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import UUID

from .domain import CLIENT_EMAIL
from .storage import StorageUnavailable

ENDPOINT = "https://api.resend.com/emails"
MAX_RESPONSE_BYTES = 16384
PURPOSE_LABELS = {"booking": "continue with your appointment", "contact": "send your inquiry", "prashna": "send your Prashna inquiry"}


class EmailDeliveryError(StorageUnavailable):
    """Safe machine-readable outcome; never carry provider response contents."""
    def __init__(self, code, *, retryable=False, retry_after=0, definitely_rejected=False):
        super().__init__('We could not confirm the email was sent. Please try again shortly.')
        self.code, self.retryable, self.retry_after = code, retryable, retry_after
        self.definitely_rejected = definitely_rejected


class NoEmailRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        # Never forward an API credential or message to a redirected destination.
        return None


def verification_message(sender, email, code, purpose):
    if purpose not in PURPOSE_LABELS or not isinstance(code, str) or not re.fullmatch(r"[0-9]{6}", code):
        raise StorageUnavailable("The verification email could not be prepared. Please try again.")
    if not sender or any(char in sender or char in email for char in ('\r', '\n')):
        raise StorageUnavailable("Email delivery is not configured correctly.")
    instruction = f"Use this code to {PURPOSE_LABELS[purpose]}."
    return {"from": sender, "to": [email], "reply_to": CLIENT_EMAIL,
            "subject": "Your Astro Advice verification code",
            "text": f"{instruction}\n\n{code}\n\nIt expires in five minutes. Do not share this code. If you did not request it, ignore this email.\n\nAstro Advice by Kundan Singh",
            "html": (
                '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;'
                'color:#231b2e;max-width:560px;padding:16px;margin:0 auto;">'
                f'<p>{html.escape(instruction)}</p>'
                '<p style="margin-bottom:4px;">Your verification code:</p>'
                f'<p style="margin:4px 0 20px;font-size:28px;letter-spacing:4px;"><strong>{html.escape(code)}</strong></p>'
                '<p>It expires in five minutes. Do not share this code.</p>'
                '<p>If you did not request it, ignore this email.</p>'
                '<p>Astro Advice by Kundan Singh</p></div>'
            )}


def send_code(settings, email, code, purpose, challenge_id):
    """Return Resend's accepted email reference, not a claim of inbox delivery.

    One request attempt only. An uncertain code send is never queued or blindly
    replayed later. Any repeat of this exact attempt uses the same challenge ID.
    """
    if not isinstance(challenge_id, UUID):
        raise StorageUnavailable("The verification email could not be prepared. Please try again.")
    return send_message(settings, verification_message(settings.sender, email, code, purpose), f'verification/{challenge_id}')


def send_message(settings, payload, idempotency_key):
    if not settings.resend_key or any(char in settings.resend_key for char in ('\r', '\n')):
        raise EmailDeliveryError('email_configuration')
    fields = {'from', 'to', 'reply_to', 'subject', 'text', 'html'}
    if (not isinstance(payload, dict) or set(payload) != fields or
            not isinstance(payload['to'], list) or len(payload['to']) != 1 or
            any(not isinstance(payload[key], str) or not payload[key] for key in fields - {'to'}) or
            not isinstance(payload['to'][0], str) or not payload['to'][0] or
            any(char in value for value in [payload['from'], payload['to'][0], payload['reply_to'], payload['subject']] for char in ('\r', '\n')) or
            not isinstance(idempotency_key, str) or not re.fullmatch(r'[A-Za-z0-9_/-]{1,256}', idempotency_key)):
        raise EmailDeliveryError('invalid_email_payload')
    body = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode()
    if len(body) > 16384:
        raise EmailDeliveryError('invalid_email_payload')
    request = Request(ENDPOINT, data=body, headers={
        "Authorization": f"Bearer {settings.resend_key}", "Content-Type": "application/json",
        "Accept": "application/json", "User-Agent": "AstroAdvice/1.0",
        "Idempotency-Key": idempotency_key,
    }, method="POST")
    try:
        with build_opener(NoEmailRedirects()).open(request, timeout=10) as response:
            if response.status != 200 or response.headers.get_content_type() != "application/json":
                raise ValueError("Unconfirmed provider response")
            raw = response.read(MAX_RESPONSE_BYTES + 1)
            if len(raw) > MAX_RESPONSE_BYTES:
                raise ValueError("Oversized provider response")
            result = json.loads(raw)
            if not isinstance(result, dict) or not isinstance(result.get("id"), str):
                raise ValueError("Missing accepted email reference")
            return str(UUID(result["id"]))
    except HTTPError as error:
        status = error.code
        # Retry-After is a delay, never a message/URL from the provider.
        value = error.headers.get('Retry-After', '') if error.headers else ''
        retry_after = min(86400, int(value)) if value.isascii() and value.isdigit() and len(value) <= 6 else 0
        quota = None
        if status == 429:
            try:
                raw = error.read(MAX_RESPONSE_BYTES + 1)
                data = json.loads(raw) if len(raw) <= MAX_RESPONSE_BYTES else None
                name = data.get('name') if isinstance(data, dict) else None
                if name in ('daily_quota_exceeded', 'monthly_quota_exceeded'):
                    quota = name
            except (ValueError, OSError, HTTPException):
                pass
        error.close()
        raise EmailDeliveryError(quota or ('provider_rate_limited' if status == 429 else 'provider_rejected'),
                                 retryable=status in (408, 409, 429) or status >= 500, retry_after=max(retry_after, 86400 if quota else 0),
                                 definitely_rejected=status in (400, 401, 403, 404, 422, 429)) from None
    except (URLError, TimeoutError, OSError, ValueError, HTTPException):
        # Provider error text/URLs can contain private material. Do not echo it.
        raise EmailDeliveryError('send_unconfirmed', retryable=True) from None

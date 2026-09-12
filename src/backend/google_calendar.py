"""Google Calendar provider boundary. No retries, token storage or public routes here.

The durable caller owns authorization state, token refresh serialization and saved
event IDs. In particular, an uncertain insert must be reconciled by GET using the
same saved event ID, never by inventing another meeting.
"""
import base64
import hashlib
import json
import re
from datetime import timedelta
from urllib.parse import quote, urlencode, urlsplit
from uuid import UUID

import httpx

from .domain import CLIENT_EMAIL, DURATION_MINUTES, IST, SERVICES, aware_utc

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
CALENDAR_URL = "https://www.googleapis.com/calendar/v3/calendars/"
SCOPES = ("openid", "email", "https://www.googleapis.com/auth/calendar.events.owned",
          "https://www.googleapis.com/auth/calendar.calendars.readonly")
MAX_RESPONSE = 65536


class GoogleFailure(Exception):
    """Only fixed codes cross this boundary; provider bodies can contain secrets."""
    def __init__(self, code, *, retryable=False):
        super().__init__(code)
        self.code, self.retryable = code, retryable


def authorization_url(client_id, redirect_uri, state, nonce, verifier):
    parsed = urlsplit(redirect_uri)
    if (parsed.scheme != 'https' or not parsed.netloc or parsed.username or
            parsed.fragment or parsed.query or parsed.path != '/api/admin/google/callback'):
        raise ValueError('Use the configured HTTPS backend Google callback.')
    if not client_id or any(not re.fullmatch(r'[A-Za-z0-9_-]{43,128}', v) for v in (state, nonce, verifier)):
        raise ValueError('A client ID and strong independent authorization values are required.')
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
    return AUTH_URL + '?' + urlencode({
        'client_id': client_id, 'redirect_uri': redirect_uri, 'response_type': 'code',
        'scope': ' '.join(SCOPES), 'access_type': 'offline', 'prompt': 'consent',
        'login_hint': CLIENT_EMAIL, 'state': state, 'nonce': nonce,
        'code_challenge': challenge, 'code_challenge_method': 'S256',
    })


def event_identity(booking_id):
    # UUID hex is a subset of Google's base32hex alphabet. Save before insert.
    value = UUID(str(booking_id)).hex
    return 'astro' + value, 'meet' + value


def event_body(booking_id, service_id, starts_at, customer_email):
    start = aware_utc(starts_at).astimezone(IST)
    if not isinstance(customer_email, str) or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', customer_email):
        raise ValueError('A validated customer email is required.')
    if customer_email.lower() == CLIENT_EMAIL:
        raise ValueError('The customer cannot be the calendar organizer.')
    event_id, request_id = event_identity(booking_id)
    service = SERVICES[service_id]
    return {
        'id': event_id, 'summary': 'Astro Advice — ' + service['title'],
        'description': 'Online consultation with Astro Advice by Kundan Singh. '
                       'For cancellations, please call +91 85277 90801.',
        'start': {'dateTime': start.isoformat(), 'timeZone': 'Asia/Kolkata'},
        'end': {'dateTime': (start + timedelta(minutes=DURATION_MINUTES)).isoformat(), 'timeZone': 'Asia/Kolkata'},
        'attendees': [{'email': customer_email}], 'visibility': 'private',
        'guestsCanInviteOthers': False, 'guestsCanModify': False,
        'guestsCanSeeOtherGuests': False,
        'extendedProperties': {'private': {'astroBookingId': str(UUID(str(booking_id))) }},
        'conferenceData': {'createRequest': {'requestId': request_id,
            'conferenceSolutionKey': {'type': 'hangoutsMeet'}}},
    }


def meeting_result(event, expected_event_id):
    if not isinstance(event, dict) or event.get('id') != expected_event_id:
        raise GoogleFailure('event_mismatch')
    if event.get('status') == 'cancelled':
        return {'state': 'cancelled', 'meet_url': None}
    conference = event.get('conferenceData') or {}
    if not isinstance(conference, dict):
        raise GoogleFailure('invalid_conference_response')
    request = conference.get('createRequest') or {}
    if not isinstance(request, dict) or not isinstance(request.get('status', {}), dict):
        raise GoogleFailure('invalid_conference_response')
    status = request.get('status', {}).get('statusCode')
    if status == 'failure':
        return {'state': 'failed', 'meet_url': None}
    if status != 'success':
        return {'state': 'pending', 'meet_url': None}
    solution = conference.get('conferenceSolution') or {}
    if not isinstance(solution, dict) or not isinstance(solution.get('key'), dict) or solution['key'].get('type') != 'hangoutsMeet':
        raise GoogleFailure('conference_mismatch')
    entries = conference.get('entryPoints', [])
    if not isinstance(entries, list):
        raise GoogleFailure('invalid_conference_response')
    for entry in entries:
        if not isinstance(entry, dict):
            raise GoogleFailure('invalid_conference_response')
        link = entry.get('uri', '')
        if entry.get('entryPointType') == 'video' and isinstance(link, str) and re.fullmatch(
                r'https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}', link):
            return {'state': 'ready', 'meet_url': link}
    raise GoogleFailure('conference_link_missing')


class GoogleCalendar:
    def __init__(self, client_id, client_secret, *, transport=None):
        self.client_id, self.client_secret, self.transport = client_id, client_secret, transport

    def _request(self, method, url, *, access_token=None, form=None, payload=None, params=None):
        headers = {'Accept': 'application/json'}
        if access_token:
            headers['Authorization'] = 'Bearer ' + access_token
        try:
            with httpx.Client(timeout=8, follow_redirects=False, transport=self.transport) as client:
                with client.stream(method, url, headers=headers, data=form, json=payload, params=params) as response:
                    # No automatic redirects or retries, especially for token/event writes.
                    if response.status_code == 204:
                        return {}
                    body = bytearray()
                    for chunk in response.iter_bytes():
                        body.extend(chunk)
                        if len(body) > MAX_RESPONSE:
                            raise GoogleFailure('response_too_large')
                    try:
                        data = json.loads(body)
                    except (ValueError, UnicodeError):
                        data = None
                    if response.status_code == 401 or (isinstance(data, dict) and data.get('error') == 'invalid_grant'):
                        raise GoogleFailure('reconnect_required')
                    if response.status_code == 404:
                        raise GoogleFailure('not_found')
                    if response.status_code == 409:
                        raise GoogleFailure('already_exists')
                    if response.status_code == 410:
                        raise GoogleFailure('gone')
                    if response.status_code == 429 or response.status_code >= 500:
                        raise GoogleFailure('google_unavailable', retryable=True)
                    if response.status_code != 200:
                        raise GoogleFailure('google_request_rejected')
                    if not isinstance(data, dict) or not body or not response.headers.get('content-type', '').lower().startswith('application/json'):
                        raise GoogleFailure('invalid_response')
                    return data
        except httpx.HTTPError:
            # A timeout is ambiguous: writes may already have succeeded remotely.
            raise GoogleFailure('google_unavailable', retryable=True) from None

    def tokens(self, *, code=None, redirect_uri=None, verifier=None, refresh_token=None):
        if not self.client_id or not self.client_secret:
            raise GoogleFailure('google_configuration_missing')
        if bool(code) == bool(refresh_token):
            raise ValueError('Use exactly one token exchange mode.')
        form = {'client_id': self.client_id, 'client_secret': self.client_secret}
        if code:
            if not redirect_uri or not verifier:
                raise ValueError('The original callback and PKCE verifier are required.')
            form.update(grant_type='authorization_code', code=code, redirect_uri=redirect_uri, code_verifier=verifier)
        else:
            form.update(grant_type='refresh_token', refresh_token=refresh_token)
        data = self._request('POST', TOKEN_URL, form=form)
        if (not isinstance(data.get('access_token'), str) or not data['access_token'] or
                str(data.get('token_type', '')).lower() != 'bearer' or
                type(data.get('expires_in')) is not int or not 0 < data['expires_in'] <= 86400):
            raise GoogleFailure('invalid_token_response')
        # Absence is intentional. Caller preserves the previous refresh token.
        return data

    def calendar(self, access_token, calendar_id):
        return self._request('GET', CALENDAR_URL + quote(calendar_id, safe=''), access_token=access_token)

    def event(self, access_token, calendar_id, event_id):
        return self._request('GET', self._event_url(calendar_id, event_id), access_token=access_token)

    def insert(self, access_token, calendar_id, body):
        return self._request('POST', self._event_url(calendar_id), access_token=access_token,
                             payload=body, params={'conferenceDataVersion': 1, 'sendUpdates': 'all'})

    def delete(self, access_token, calendar_id, event_id):
        return self._request('DELETE', self._event_url(calendar_id, event_id), access_token=access_token,
                             params={'sendUpdates': 'all'})

    @staticmethod
    def _event_url(calendar_id, event_id=None):
        return CALENDAR_URL + quote(calendar_id, safe='') + '/events' + ('/' + quote(event_id, safe='') if event_id else '')

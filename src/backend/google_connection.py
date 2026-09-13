"""Client-only Calendar authorization, separate from Google sign-in.

Single connection and short-lived state in the existing database. The normal
Strict session cookie is unchanged; only the callback correlation cookie is Lax.
"""
import hashlib
import hmac
import secrets
from datetime import timedelta

from cryptography.fernet import Fernet, InvalidToken
from fastapi import Request, Response
from fastapi.responses import RedirectResponse

from .domain import CLIENT_EMAIL, RuleViolation
from .google_calendar import GoogleCalendar, GoogleFailure, SCOPES, authorization_url
from .storage import StorageUnavailable

COOKIE = '__Host-astro_google'
CALLBACK = '/api/admin/google/callback'
LOCK = 83124009


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def cipher(settings):
    try:
        return Fernet(settings.google_token_key.encode())
    except (ValueError, TypeError):
        raise StorageUnavailable('Google Calendar connection needs its server configuration.') from None


def saved_connection_ready(settings, store):
    """Verify the saved client connection can be opened before taking payment."""
    try:
        crypt = cipher(settings)
        with store.transaction() as conn:
            row = conn.execute('''SELECT calendar_id,refresh_token_encrypted,scopes
                FROM google_connection WHERE singleton=true''').fetchone()
        if (not row or row['calendar_id'].lower() != CLIENT_EMAIL or
                not set(SCOPES[2:]).issubset(set(row['scopes'].split()))):
            return False
        return bool(crypt.decrypt(row['refresh_token_encrypted'].encode()).decode())
    except (InvalidToken, StorageUnavailable, UnicodeError, AttributeError):
        return False


def add_routes(router, settings, store, session, verify_identity, provider=None):
    google = provider or GoogleCalendar(settings.google_client_id, settings.google_client_secret)

    def configured():
        if not settings.google_client_id or not settings.google_client_secret:
            raise StorageUnavailable('Google Calendar connection needs its server configuration.')
        return cipher(settings)

    @router.get('/google/status')
    def status(request: Request):
        session(request)
        with store.transaction() as conn:
            row = conn.execute('SELECT calendar_id,connected_at FROM google_connection WHERE singleton=true').fetchone()
        return {'connected': bool(row), 'calendar_id': row['calendar_id'] if row else None}

    @router.post('/google/start')
    def start(request: Request, response: Response):
        actor = session(request, write=True)
        configured()
        origin = request.headers['origin']  # session(write=True) already checked exact allowlist.
        state, browser, nonce, verifier = (secrets.token_urlsafe(32) for _ in range(4))
        url = authorization_url(settings.google_client_id, origin + CALLBACK, state, nonce, verifier)
        with store.transaction() as conn:
            conn.execute('SELECT pg_advisory_xact_lock(%s)', (LOCK,))
            now = store.now(conn)
            # One in-flight connection for this client; opening a new tab replaces it.
            conn.execute('DELETE FROM google_authorizations WHERE google_subject=%s OR expires_at<=%s',
                         (actor['google_subject'], now))
            conn.execute('INSERT INTO google_authorizations VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
                         (digest(state), digest(browser), actor['token_digest'], actor['google_subject'],
                          nonce, verifier, origin, now + timedelta(minutes=10)))
        response.set_cookie(COOKIE, browser, max_age=600, secure=True, httponly=True, samesite='lax', path='/')
        return {'authorization_url': url}

    @router.post('/google/check')
    def check(request: Request):
        actor = session(request, write=True)
        crypt = configured()
        try:
            with store.transaction() as conn:
                # One client: serialize refresh with reconnection rather than adding a worker.
                conn.execute('SELECT pg_advisory_xact_lock(%s)', (LOCK,))
                row = conn.execute('SELECT * FROM google_connection WHERE singleton=true').fetchone()
                if not row or row['google_subject'] != actor['google_subject']:
                    raise GoogleFailure('reconnect_required')
                refresh = crypt.decrypt(row['refresh_token_encrypted'].encode()).decode()
                tokens = google.tokens(refresh_token=refresh)
                if tokens.get('refresh_token'):
                    conn.execute('UPDATE google_connection SET refresh_token_encrypted=%s WHERE singleton=true',
                                 (crypt.encrypt(tokens['refresh_token'].encode()).decode(),))
                calendar_id = row['calendar_id']
            metadata = google.calendar(tokens['access_token'], calendar_id)
            if metadata.get('id', '').lower() != CLIENT_EMAIL:
                raise GoogleFailure('calendar_mismatch')
            capable = 'hangoutsMeet' in metadata.get('conferenceProperties', {}).get('allowedConferenceSolutionTypes', [])
            return {'calendar_access': True, 'meet_supported': capable}
        except InvalidToken:
            raise StorageUnavailable('The saved Google connection could not be opened. Please reconnect Google Calendar.') from None
        except GoogleFailure as error:
            message = ('Please reconnect Google Calendar.' if error.code == 'reconnect_required' else
                       'Google Calendar could not be checked. Please try again or review the Google project settings.')
            raise RuleViolation(message, 503, error.code) from None

    @router.get('/google/callback')
    def callback(request: Request):
        # Query values never enter logs, error text or the frontend redirect.
        state = request.query_params.get('state', '')
        browser = request.cookies.get(COOKIE, '')
        code = request.query_params.get('code', '')
        if not 40 <= len(state) <= 100 or not 40 <= len(browser) <= 100 or len(code) > 4096:
            raise RuleViolation('Please return to the private calendar and connect Google again.', 400)
        crypt = configured()
        outcome = 'failed'
        # Serialize connect/reconnect; no schedule lock and no personal-calendar import.
        # Keep state consumption committed even if Google rejects consent.
        with store.transaction() as conn:
            conn.execute('SELECT pg_advisory_xact_lock(%s)', (LOCK,))
            row = conn.execute('SELECT * FROM google_authorizations WHERE state_digest=%s', (digest(state),)).fetchone()
            if not row or not hmac.compare_digest(row['browser_digest'], digest(browser)):
                raise RuleViolation('Please return to the private calendar and connect Google again.', 400)
            conn.execute('DELETE FROM google_authorizations WHERE state_digest=%s', (digest(state),))
            origin = row['origin']
            now = store.now(conn)
            actor = conn.execute('SELECT * FROM admin_sessions WHERE token_digest=%s AND expires_at>%s FOR SHARE',
                                 (row['session_digest'], now)).fetchone()
            valid = (origin in settings.origins and row['expires_at'] > now and actor and
                     actor['google_subject'] == row['google_subject'])
            if valid and code and not request.query_params.get('error'):
                try:
                    tokens = google.tokens(code=code, redirect_uri=origin + CALLBACK, verifier=row['verifier'])
                    identity = verify_identity(tokens.get('id_token', ''), settings.google_client_id)
                    if (identity.get('sub') != row['google_subject'] or identity.get('email', '').lower() != CLIENT_EMAIL or
                            identity.get('email_verified') is not True or identity.get('nonce') != row['nonce']):
                        raise GoogleFailure('account_mismatch')
                    scopes = set(tokens.get('scope', '').split())
                    if not set(SCOPES[2:]).issubset(scopes):
                        raise GoogleFailure('calendar_permission_missing')
                    previous = conn.execute('SELECT * FROM google_connection WHERE singleton=true').fetchone()
                    refresh = tokens.get('refresh_token')
                    if refresh:
                        encrypted = crypt.encrypt(refresh.encode()).decode()
                    elif previous and previous['google_subject'] == row['google_subject']:
                        # Ensure an old key was not lost before preserving its ciphertext.
                        crypt.decrypt(previous['refresh_token_encrypted'].encode())
                        encrypted = previous['refresh_token_encrypted']
                    else:
                        raise GoogleFailure('refresh_permission_missing')
                    # Recheck expiry after external calls; never attach a connection to a dead login.
                    if actor['expires_at'] <= store.now(conn):
                        raise GoogleFailure('session_expired')
                    conn.execute('''INSERT INTO google_connection VALUES (true,%s,%s,%s,%s,%s)
                        ON CONFLICT (singleton) DO UPDATE SET google_subject=excluded.google_subject,
                        calendar_id=excluded.calendar_id,refresh_token_encrypted=excluded.refresh_token_encrypted,
                        scopes=excluded.scopes,connected_at=excluded.connected_at''',
                        (row['google_subject'], CLIENT_EMAIL, encrypted, ' '.join(sorted(scopes)), store.now(conn)))
                    outcome = 'connected'
                except (GoogleFailure, RuleViolation, InvalidToken, ValueError, TypeError):
                    # Keep any previously working connection. No provider text or tokens returned.
                    outcome = 'failed'
            elif valid and request.query_params.get('error'):
                outcome = 'denied'
        # Only the stored, previously allowed origin is used, never callback query/Host.
        if origin not in settings.origins:
            raise RuleViolation('Please use the approved studio website.', 403)
        response = RedirectResponse(origin + '/#/studio/calendar?google=' + outcome, status_code=303)
        response.delete_cookie(COOKIE, secure=True, httponly=True, samesite='lax', path='/')
        return response

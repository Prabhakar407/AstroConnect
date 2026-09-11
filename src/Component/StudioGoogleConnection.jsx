import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminRequest } from '../lib/adminApi';

export default function StudioGoogleConnection({ user, onSessionExpired }) {
  const [connection, setConnection] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    adminRequest('/google/status').then(data => { if (active) setConnection(data); })
      .catch(err => {
        if (!active) return;
        if (err.status === 401) onSessionExpired();
        else setError(err.message);
      });
    return () => { active = false; };
  }, [user, onSessionExpired]);

  useEffect(() => {
    const outcome = new URLSearchParams(location.search).get('google');
    if (!outcome) return;
    if (outcome === 'connected') setMessage('Google permission saved. Check the connection to confirm Calendar and Meet access.');
    else setError(outcome === 'denied' ? 'Google permission was not granted. You can connect whenever you are ready.' :
      'Google could not be connected. Please try again with the studio account and allow the requested permissions.');
    navigate('/studio/calendar', { replace: true });
  }, [location.search, navigate]);

  async function run(connect) {
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await adminRequest(connect ? '/google/start' : '/google/check', { method: 'POST', csrf: user.csrf_token });
      if (connect) {
        const url = new URL(data.authorization_url);
        if (url.origin !== 'https://accounts.google.com' || url.pathname !== '/o/oauth2/v2/auth') throw new Error('Google connection address was not recognized.');
        window.location.assign(url.href);
      } else {
        setMessage(data.calendar_access && data.meet_supported ?
          'Calendar access works, and this calendar supports Google Meet.' :
          'Calendar access works, but Google Meet is not available on this calendar. Please contact the website maintainer.');
      }
    } catch (err) {
      if (err.status === 401) onSessionExpired();
      else setError(err.message);
    } finally { setBusy(false); }
  }

  return <aside className="studio-calendar__connection" aria-label="Google Calendar connection">
    <div>
      <h2>Google Calendar &amp; Meet</h2>
      <p>{connection?.connected ? 'Connected to the studio account. Website availability is still managed here.' :
        'Connect the studio account to add booked consultations and create their meeting links.'}</p>
      <details><summary>Which calendar does this use?</summary>
        <p>Consultations go into astroadvicebyks@gmail.com. Google requests permission to manage events on calendars this account owns; this website uses the studio calendar only. Personal appointments are not imported, and editing an event in Google does not change website availability.</p>
      </details>
      {message && <p role="status">{message}</p>}
      {error && <p className="studio-calendar__error" role="alert">{error}</p>}
    </div>
    <div className="studio-calendar__connection-actions">
      <button className="studio-calendar__primary" disabled={busy || !connection} onClick={() => run(true)}>
        {busy ? 'Please wait…' : connection?.connected ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
      </button>
      {connection?.connected && <button className="studio-calendar__quiet" disabled={busy} onClick={() => run(false)}>Check connection</button>}
    </div>
  </aside>;
}

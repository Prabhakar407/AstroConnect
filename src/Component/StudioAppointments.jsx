import { useEffect, useState } from 'react';
import { CalendarCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { adminRequest } from '../lib/adminApi';
import { formatFee } from '../lib/bookingPolicy';

const dateTime = value => new Date(value).toLocaleString('en-IN', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
});
const cleanPhone = value => value?.replace(/[\s().-]/g, '') || '';

function Appointment({ item, user, onExpired, afterCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canCancel = item.state === 'confirmed' && new Date(item.starts_at) > new Date();

  async function cancel() {
    if (busy || !window.confirm(`Cancel ${item.full_name}'s ${dateTime(item.starts_at)} appointment after confirming it by phone? The time will reopen. Refund to be done manually.`)) return;
    setBusy(true); setError('');
    try {
      await adminRequest(`/bookings/${item.id}/cancel`, { method: 'POST', csrf: user.csrf_token });
      afterCancel('Cancellation recorded and the time released. Refund to be done manually. Calendar and email updates are pending.');
    } catch (err) {
      if (err.status === 401) onExpired();
      else setError(err.message);
    } finally { setBusy(false); }
  }

  return <details className="studio-appointment">
    <summary>
      <span className="studio-appointment__when"><strong>{dateTime(item.starts_at)}</strong><span>Indian time (IST)</span></span>
      <span className="studio-appointment__identity"><strong>{item.full_name}</strong><span>{item.service_name}</span></span>
      <span className="studio-appointment__fee">{formatFee(item.amount_paise)}</span>
    </summary>
    <div className="studio-appointment__body">
      <div className="studio-appointment__facts">
        <div><span>Contact</span><a href={`tel:${cleanPhone(item.phone)}`}>{item.phone}</a><a href={`mailto:${item.email}`}>{item.email}</a></div>
        <div><span>Appointment</span><strong>{item.service_name}</strong>{item.service_id === 'prashna-kundali' && <p>{item.question_count} {item.question_count === 1 ? 'question' : 'questions'} paid for</p>}<p>{formatFee(item.amount_paise)} · {item.payment_state === 'received' ? 'Payment received' : 'Payment not recorded'}</p></div>
        <div><span>Meeting</span><strong>{item.calendar_state === 'ready' ? 'Calendar and Meet ready' : item.calendar_state === 'cancelled' ? 'Calendar event cancelled' : 'Calendar or Meet needs checking'}</strong>{item.meet_url && <a href={item.meet_url} target="_blank" rel="noreferrer">Open Google Meet <ExternalLink size={14} /></a>}</div>
        <div><span>References</span><p>Booking: {item.id}</p>{item.payment_reference && <p>Payment: {item.payment_reference}</p>}{item.payment_order_reference && <p>Order: {item.payment_order_reference}</p>}</div>
      </div>
      <div className="studio-appointment__private">
        <h3>Consultation details</h3>
        <dl>
          <div><dt>Birth date</dt><dd>{item.birth_date || 'Not provided'}</dd></div>
          <div><dt>Birth time</dt><dd>{item.birth_time || 'Not provided'}</dd></div>
          <div><dt>Birth place</dt><dd>{item.birth_place || 'Not provided'}</dd></div>
          <div className="studio-appointment__notes"><dt>Customer notes</dt><dd>{item.notes || 'No notes provided'}</dd></div>
        </dl>
      </div>
      {canCancel && <div className="studio-appointment__actions"><button className="studio-calendar__secondary" disabled={busy} onClick={cancel}>{busy ? 'Cancelling…' : 'Cancel after phone confirmation'}</button><p>Refund to be done manually.</p></div>}
      {error && <p className="studio-calendar__error" role="alert">{error}</p>}
    </div>
  </details>;
}

export default function StudioAppointments({ user, onExpired, onNotice }) {
  const [filter, setFilter] = useState('upcoming');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState('');
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion(value => value + 1);

  useEffect(() => {
    let active = true; setData(null); setError('');
    adminRequest(`/bookings?view=${filter}${cursor ? `&before=${encodeURIComponent(cursor)}` : ''}`)
      .then(result => { if (active) setData(result); })
      .catch(err => { if (!active) return; if (err.status === 401) onExpired(); else setError(err.message); });
    return () => { active = false; };
  }, [filter, cursor, version, onExpired]);

  function cancelled(message) { onNotice(message); setCursor(''); refresh(); }

  return <section className="studio-calendar__panel studio-appointments" aria-labelledby="studio-appointments-heading">
    <div className="studio-calendar__day-heading"><div>
      <h2 id="studio-appointments-heading"><CalendarCheck size={23} /> Appointments</h2>
      <p className="studio-calendar__small">Open an appointment for customer, payment and consultation details.</p>
    </div><button aria-label="Refresh appointments" className="studio-calendar__secondary" onClick={refresh}><RefreshCw size={18} /></button></div>
    <nav className="studio-appointments__filters" aria-label="Appointment views">
      {['upcoming', 'past', 'cancelled'].map(value => <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setCursor(''); }}>{value[0].toUpperCase() + value.slice(1)}</button>)}
    </nav>
    {error && <p className="studio-calendar__error" role="alert">{error} <button className="studio-calendar__secondary" onClick={refresh}>Try again</button></p>}
    {!data && !error && <p role="status">Loading appointments…</p>}
    {data && !data.items.length && <div className="studio-inquiries__empty"><CalendarCheck size={32} /><h3>No {filter} appointments</h3><p>{filter === 'upcoming' ? 'New paid bookings will appear here automatically.' : `There are no ${filter} appointments to show.`}</p></div>}
    {data?.items.map(item => <Appointment key={`${item.id}-${version}`} item={item} user={user} onExpired={onExpired} afterCancel={cancelled} />)}
    {(cursor || data?.next_cursor) && <nav className="studio-inquiry__actions" aria-label="Appointment pages">
      {cursor && <button className="studio-calendar__secondary" onClick={() => setCursor('')}>Newest appointments</button>}
      {data?.next_cursor && <button className="studio-calendar__secondary" onClick={() => setCursor(data.next_cursor)}>Older appointments</button>}
    </nav>}
  </section>;
}

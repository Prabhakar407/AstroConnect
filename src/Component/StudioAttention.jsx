import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { adminRequest } from '../lib/adminApi';
import { formatFee } from '../lib/bookingPolicy';
import StudioInquiries from './StudioInquiries';

const when = value => new Date(value).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
});
const caseNames = {
  late_or_mismatched_payment: 'Late or mismatched payment',
  refund: 'Refund detected',
  dispute: 'Payment dispute',
};
const deliveryNames = {
  calendar: 'Google Calendar and Meet', customer: 'Customer email', client: 'Studio email',
};
const paymentEventNames = {
  'payment.authorized': 'Authorized payment', 'payment.captured': 'Captured payment',
  'payment.failed': 'Failed payment', 'order.paid': 'Paid order',
  'refund.created': 'Refund created', 'refund.processed': 'Refund processed',
  'refund.failed': 'Refund failed',
};

function PaymentCase({ item, user, refresh, onExpired }) {
  const [resolution, setResolution] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function handled() {
    if (!resolution || busy) return;
    setBusy(true); setError('');
    try {
      await adminRequest(`/attention/payments/${item.id}/handled`, {
        method: 'POST', csrf: user.csrf_token, payload: { resolution, note },
      });
      refresh();
    } catch (err) {
      if (err.status === 401) onExpired(); else setError(err.message);
    } finally { setBusy(false); }
  }
  return <article className="studio-attention__item">
    <div className="studio-attention__heading">
      <div><h3>{caseNames[item.kind] || 'Payment needs checking'}</h3><p>{item.full_name} · {item.service_name}</p></div>
      <strong>{formatFee(item.amount_paise)}</strong>
    </div>
    <p className="studio-calendar__small">Requested for {when(item.starts_at)} IST · Booking {item.booking_id}</p>
    <div className="studio-attention__contact"><a href={`tel:${item.phone}`}>{item.phone}</a><a href={`mailto:${item.email}`}>{item.email}</a></div>
    <p className="studio-calendar__small">Check this payment in Razorpay before asking the customer to pay again. The website does not issue refunds automatically.</p>
    <div className="studio-attention__resolution">
      <label>What did you do?<select value={resolution} onChange={event => setResolution(event.target.value)}>
        <option value="">Choose one</option>
        <option value="checked_no_action">Checked — no further action needed</option>
        <option value="customer_contacted">Contacted the customer</option>
        <option value="refund_handled">Handled the refund in Razorpay</option>
      </select></label>
      <label>Private note <span>(optional)</span><input maxLength={500} value={note} onChange={event => setNote(event.target.value)} /></label>
      <button className="studio-calendar__primary" disabled={!resolution || busy} onClick={handled}>{busy ? 'Saving…' : 'Mark as handled'}</button>
    </div>
    {error && <p className="studio-calendar__error" role="alert">{error}</p>}
  </article>;
}

export default function StudioAttention({ user, onExpired }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion(value => value + 1);
  useEffect(() => {
    let active = true; setData(null); setError('');
    adminRequest('/attention').then(result => { if (active) setData(result); }).catch(err => {
      if (!active) return;
      if (err.status === 401) onExpired(); else setError(err.message);
    });
    return () => { active = false; };
  }, [version, onExpired]);

  async function retry(item) {
    const question = item.payment_id
      ? 'Check this Razorpay update again?'
      : `Try ${deliveryNames[item.recipient_role] || 'this delivery'} again?`;
    if (!window.confirm(question)) return;
    try {
      await adminRequest(`/attention/delivery/${item.id}/retry`, { method: 'POST', csrf: user.csrf_token });
      refresh();
    } catch (err) {
      if (err.status === 401) onExpired(); else setError(err.message);
    }
  }

  return <div className="studio-attention">
    <section className="studio-calendar__panel" aria-labelledby="booking-attention-heading">
      <div className="studio-calendar__day-heading"><div>
        <h2 id="booking-attention-heading"><AlertTriangle size={23} /> Booking and payment follow-up</h2>
        <p className="studio-calendar__small">Only items that need a person appear here. Payments are never changed by marking an item handled.</p>
      </div><button aria-label="Refresh booking problems" className="studio-calendar__secondary" onClick={refresh}><RefreshCw size={18} /></button></div>
      {error && <p className="studio-calendar__error" role="alert">{error}</p>}
      {!data && !error && <p role="status">Checking booking follow-up…</p>}
      {data && !data.payment_cases.length && !data.delivery_problems.length && !(data.payment_event_problems || []).length && <div className="studio-inquiries__empty">
        <h3>No booking or payment items need attention</h3><p>Refresh if you have just reconnected Google Calendar or fixed email delivery.</p>
      </div>}
      {data?.payment_cases.map(item => <PaymentCase key={item.id} item={item} user={user} refresh={refresh} onExpired={onExpired} />)}
      {data?.delivery_problems.map(item => <article className="studio-attention__item" key={item.id}>
        <div className="studio-attention__heading"><div><h3>{deliveryNames[item.recipient_role] || 'Booking update'} did not complete</h3>
          <p>{item.full_name} · {item.service_name}</p></div><span className="studio-inquiry__badge">Needs retry</span></div>
        <p className="studio-calendar__small">{item.last_error_code === 'reconnect_required' ? 'Reconnect Google Calendar above, then try again.' : 'Check the connected service, then try this delivery again.'}</p>
        <button className="studio-calendar__secondary" onClick={() => retry(item)}>Try delivery again</button>
      </article>)}
      {data?.payment_event_problems?.map(item => <article className="studio-attention__item" key={item.id}>
        <div className="studio-attention__heading"><div><h3>{paymentEventNames[item.kind] || 'Payment update'} needs checking</h3>
          <p>Razorpay reference {item.payment_id}</p></div><span className="studio-inquiry__badge">Needs retry</span></div>
        <p className="studio-calendar__small">Received {when(item.received_at)} IST. Check this payment in Razorpay before asking the customer to pay again.</p>
        <button className="studio-calendar__secondary" onClick={() => retry(item)}>Check again</button>
      </article>)}
    </section>
    <StudioInquiries user={user} attention onExpired={onExpired} />
  </div>;
}

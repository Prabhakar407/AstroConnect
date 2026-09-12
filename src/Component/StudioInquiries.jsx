/* Operate-mode extension: retained navy/gold/cream and Source Sans typography.
   Read a saved inquiry, understand email outcomes, then mark it seen or reply.
   A quiet paginated list with inline details; no analytics or new visual world. */
import { useEffect, useRef, useState } from 'react';
import { Inbox, RefreshCw } from 'lucide-react';
import { adminRequest } from '../lib/adminApi';

const sources = { home: 'Homepage request', contact: 'Contact page', prashna: 'Prashna inquiry' };
const dateLabel = value => new Date(value).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
});

function InquiryRow({ item, user, onExpired }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [seen, setSeen] = useState(Boolean(item.seen_at));
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setDetail(null);
    setError('');
    adminRequest(`/inquiries/${item.id}`).then(data => {
      if (active) { setDetail(data); setSeen(Boolean(data.seen_at)); }
    }).catch(err => {
      if (!active) return;
      if (err.status === 401) onExpired();
      else setError(err.message);
    });
    return () => { active = false; };
  }, [open, item.id, retry, onExpired]);

  async function markSeen() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await adminRequest(`/inquiries/${item.id}/seen`, { method: 'POST', csrf: user.csrf_token });
      if (mounted.current) setSeen(true);
    } catch (err) {
      if (!mounted.current) return;
      if (err.status === 401) onExpired();
      else setError('Could not confirm this was marked seen. Please try again; the inquiry is still saved.');
    } finally { if (mounted.current) setSaving(false); }
  }

  const phone = detail?.phone?.replace(/[\s().-]/g, '') || '';
  return <details className="studio-inquiry" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>
      <span className="studio-inquiry__identity"><strong>{item.name}</strong><span>{item.subject}</span></span>
      <span className="studio-inquiry__meta"><span>{sources[item.source] || 'Website inquiry'}</span><time dateTime={item.created_at}>{dateLabel(item.created_at)} IST</time></span>
      <span className={`studio-inquiry__badge ${seen ? '' : 'studio-inquiry__badge--new'}`}>{seen ? 'Seen' : 'New'}</span>
    </summary>
    {open && <div className="studio-inquiry__body">
      {error && <p role="alert" className="studio-calendar__error">{error} {!detail && <button className="studio-calendar__secondary" onClick={() => setRetry(n => n + 1)}>Try again</button>}</p>}
      {!detail && !error && <p role="status">Loading inquiry…</p>}
      {detail && <>
        <div className="studio-inquiry__content">
          <div><h3>Message</h3><p className="studio-inquiry__message">{detail.message}</p>
            {detail.location && <p className="studio-calendar__small">Location: {detail.location}</p>}
            {detail.dob && <p className="studio-calendar__small">Birth date: {detail.dob}</p>}
          </div>
          <div className="studio-inquiry__delivery"><h3>Email updates</h3>
            {detail.notifications.map((notice, index) => <p key={`${notice.recipient}-${index}`}><strong>{notice.recipient === 'client' ? 'Studio notification' : 'Customer acknowledgement'}</strong><span>{notice.status}</span></p>)}
            <p className="studio-calendar__small">Email delays do not affect this saved inquiry.</p>
          </div>
        </div>
        <div className="studio-inquiry__actions">
          <a className="studio-calendar__primary" href={`mailto:${encodeURIComponent(detail.email)}`}>Reply by email</a>
          {/^[+]?[0-9]{7,15}$/.test(phone) && <a className="studio-calendar__secondary" href={`tel:${phone}`}>Call {detail.phone}</a>}
          {!seen && <button className="studio-calendar__secondary" disabled={saving} onClick={markSeen}>{saving ? 'Saving…' : 'Mark as seen'}</button>}
        </div>
        <p className="studio-calendar__small studio-inquiry__address">{detail.email}</p>
      </>}
    </div>}
  </details>;
}

export default function StudioInquiries({ user, attention, onExpired }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError('');
    adminRequest(`/inquiries?attention=${attention}&${cursor ? `before=${encodeURIComponent(cursor)}` : ''}`)
      .then(result => { if (active) setData(result); })
      .catch(err => {
        if (!active) return;
        if (err.status === 401) onExpired(); else setError(err.message);
      });
    return () => { active = false; };
  }, [attention, cursor, refresh, onExpired]);

  return <section className="studio-calendar__panel studio-inquiries" aria-label={attention ? 'Inquiry email problems' : 'Saved inquiries'}>
    <div className="studio-calendar__day-heading">
      <div><h2><Inbox size={23} />{attention ? 'Inquiry email follow-up' : 'Saved inquiries'}</h2>
        <p className="studio-calendar__small">{attention ? 'Delayed or unsuccessful inquiry emails appear here. Open the saved inquiry to contact the customer.' : 'Read requests from your website and reply directly. These are inquiries, not confirmed appointments.'}</p>
      </div>
      <button aria-label="Refresh inquiries" className="studio-calendar__secondary" onClick={() => setRefresh(n => n + 1)}><RefreshCw size={18} /></button>
    </div>
    {error && <p role="alert" className="studio-calendar__error">{error} <button className="studio-calendar__secondary" onClick={() => setRefresh(n => n + 1)}>Try again</button></p>}
    {!data && !error && <p role="status">Loading saved inquiries…</p>}
    {data && !data.items.length && <div className="studio-inquiries__empty"><Inbox size={32} /><h3>{attention ? 'No inquiry emails need attention' : 'No inquiries here yet'}</h3><p>{attention ? 'Refresh to check for updates. You can still read every request in Inquiries.' : 'Requests will appear here after someone submits an inquiry on your website.'}</p></div>}
    {data?.items.map(item => <InquiryRow key={`${item.id}-${refresh}`} item={item} user={user} onExpired={onExpired} />)}
    {(cursor || data?.next_cursor) && <nav className="studio-inquiry__actions" aria-label="Inquiry pages">
      {cursor && <button className="studio-calendar__secondary" onClick={() => setCursor('')}>Newest inquiries</button>}
      {data?.next_cursor && <button className="studio-calendar__secondary" onClick={() => setCursor(data.next_cursor)}>Older inquiries</button>}
    </nav>}
  </section>;
}

import { useCallback, useEffect, useRef, useState } from "react";
import StudioInquiries from './StudioInquiries';
import StudioGoogleConnection from './StudioGoogleConnection';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { adminRequest, loadGoogleSignIn } from "../lib/adminApi";
import {
  formatFee,
  slotLabel,
  todayInIndia,
  slotTimes,
} from "../lib/bookingPolicy";
import "./PrivateCalendar.css";

const dayName = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
const states = {
  open: "Open",
  booked: "Booked",
  held: "Payment in progress",
  closed: "Closed",
  unavailable: "Not available",
};
const dateKey = (date) => date.toISOString().slice(0, 10);

export default function PrivateCalendar() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('calendar');
  const sessionExpired = useCallback(() => {
    setUser(null); setDay(null); setNotice('');
    setError('Your session has expired. Please sign in again.');
  }, []);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [date, setDate] = useState(todayInIndia());
  const [month, setMonth] = useState(todayInIndia().slice(0, 7));
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("12:00");
  const [reason, setReason] = useState("");
  const googleButton = useRef(null);
  const mounted = useRef(false);
  const loginAttempt = useRef(0);

  useEffect(() => {
    mounted.current = true;
    adminRequest("/session")
      .then((data) => {
        if (mounted.current) setUser(data);
      })
      .catch((err) => {
        if (mounted.current && err.status !== 401) setError(err.message);
      })
      .finally(() => {
        if (mounted.current) setChecking(false);
      });
    return () => {
      mounted.current = false;
      loginAttempt.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setDay(null);
    setLoading(true);
    adminRequest(`/day?date=${encodeURIComponent(date)}`)
      .then((data) => {
        if (active) setDay(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        if (err.status === 401) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date, user, refresh]);

  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      if (!busy) setRefresh((value) => value + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, [user, busy]);

  async function signIn() {
    const attempt = ++loginAttempt.current;
    setBusy(true);
    setError("");
    googleButton.current?.replaceChildren();
    try {
      const challenge = await adminRequest("/login/start", { method: "POST" });
      const google = await loadGoogleSignIn();
      if (!mounted.current || attempt !== loginAttempt.current) return;
      google.initialize({
        client_id: challenge.client_id,
        nonce: challenge.nonce,
        auto_select: false,
        callback: async (response) => {
          if (!mounted.current || attempt !== loginAttempt.current) return;
          setBusy(true);
          try {
            const session = await adminRequest("/login", {
              method: "POST",
              csrf: challenge.nonce,
              payload: { credential: response.credential },
            });
            if (mounted.current && attempt === loginAttempt.current) {
              setUser(session);
              setError("");
            }
          } catch (err) {
            if (mounted.current && attempt === loginAttempt.current) {
              setError(err.message);
              googleButton.current?.replaceChildren();
            }
          } finally {
            if (mounted.current && attempt === loginAttempt.current)
              setBusy(false);
          }
        },
      });
      google.renderButton(googleButton.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: 260,
      });
    } catch (err) {
      if (mounted.current && attempt === loginAttempt.current)
        setError(err.message);
    } finally {
      if (mounted.current && attempt === loginAttempt.current) setBusy(false);
    }
  }

  async function change(path, payload, message) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminRequest(path, {
        payload,
        method: "POST",
        csrf: user.csrf_token,
      });
      if (!mounted.current) return;
      setNotice(message);
      setRefresh((value) => value + 1);
    } catch (err) {
      if (!mounted.current) return;
      setError(err.message);
      // Even an uncertain response must reload occupancy before another action.
      setRefresh((value) => value + 1);
      if (err.status === 401) {
        setUser(null);
        setDay(null);
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await adminRequest("/logout", { method: "POST", csrf: user.csrf_token });
      setUser(null);
      setDay(null);
      setNotice("");
      loginAttempt.current += 1;
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        setDay(null);
      } else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function close(allDay) {
    if (
      !window.confirm(
        `Close ${allDay ? "all consultation times" : `${start}–${end}`} on ${dayName(date)}? Existing bookings and payment holds will be protected.`,
      )
    )
      return;
    change(
      "/closures",
      {
        date,
        reason,
        start_time: allDay ? null : start,
        end_time: allDay ? null : end,
      },
      "Availability closed. Existing appointments have not been changed.",
    );
  }

  const first = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const moveMonth = (delta) =>
    setMonth(
      dateKey(
        new Date(
          Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + delta, 1, 12),
        ),
      ).slice(0, 7),
    );
  const controlsDisabled = busy || loading || !day;

  return (
    <section className="studio-calendar">
      <div className="studio-calendar__wrap">
        <header className="studio-calendar__heading">
          <div>
            <p className="studio-calendar__eyebrow">
              <LockKeyhole size={17} /> Private studio calendar
            </p>
            <h1>{view === 'calendar' ? 'Your availability' : view === 'inquiries' ? 'Your inquiries' : 'Needs attention'}</h1>
            <p>
              {view === 'calendar' ? 'Keep your consultation times up to date. All times are in India Standard Time.' : 'Your website requests, saved privately and ready for follow-up.'}
            </p>
          </div>
          {user && (
            <button
              className="studio-calendar__quiet"
              onClick={signOut}
              disabled={busy}
            >
              <LogOut size={18} /> Sign out
            </button>
          )}
        </header>
        {user && <div className="studio-calendar__toolbar"><nav className="studio-calendar__tabs" aria-label="Studio views">
          {[['calendar', 'Calendar'], ['inquiries', 'Inquiries'], ['attention', 'Needs attention']].map(([key, label]) =>
            <button key={key} aria-pressed={view === key} disabled={busy} onClick={() => { setView(key); setError(''); setNotice(''); }}>{label}</button>)}
        </nav>
        {view === 'calendar' && <StudioGoogleConnection user={user} onSessionExpired={sessionExpired} />}
        </div>}
        {error && (
          <p className="studio-calendar__error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="studio-calendar__notice" role="status">
            {notice}
          </p>
        )}
        {!user ? (
          <div className="studio-calendar__login">
            <LockKeyhole size={36} />
            <h2>For the studio, only.</h2>
            <p>
              Use the authorized Google account to view appointments and close
              or reopen consultation times.
            </p>
            <p className="studio-calendar__account">
              astroadvicebyks@gmail.com
            </p>
            <button
              className="studio-calendar__primary"
              onClick={signIn}
              disabled={busy || checking}
            >
              {checking
                ? "Checking sign-in…"
                : busy
                  ? "Preparing sign-in…"
                  : "Connect with Google"}
            </button>
            <div ref={googleButton} className="studio-calendar__google" />
            <p className="studio-calendar__small">
              Signing in does not give this website access to your personal
              calendar.
            </p>
          </div>
        ) : view !== 'calendar' ? (
          <StudioInquiries key={view} user={user} attention={view === 'attention'} onExpired={sessionExpired} />
        ) : (
          <div className="studio-calendar__layout">
            <aside className="studio-calendar__panel">
              <h2>
                <CalendarDays size={23} /> Choose a day
              </h2>
              <div className="studio-calendar__month">
                <button
                  aria-label="Previous month"
                  disabled={busy || month <= todayInIndia().slice(0, 7)}
                  onClick={() => moveMonth(-1)}
                >
                  <ChevronLeft size={20} />
                </button>
                <strong>
                  {first.toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </strong>
                <button
                  aria-label="Next month"
                  disabled={busy}
                  onClick={() => moveMonth(1)}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="studio-calendar__grid">
                {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
                  <span key={`weekday-${index}`} aria-hidden="true">
                    {label}
                  </span>
                ))}
                {Array.from({ length: offset }, (_, index) => (
                  <span key={`blank-${index}`} />
                ))}
                {Array.from({ length: count }, (_, index) => {
                  const key = `${month}-${String(index + 1).padStart(2, "0")}`;
                  return (
                    <button
                      key={key}
                      aria-label={dayName(key)}
                      aria-pressed={date === key}
                      disabled={busy || key < todayInIndia()}
                      onClick={() => {
                        setDate(key);
                        setError("");
                        setNotice("");
                      }}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <p className="studio-calendar__small">
                Customers can book up to 10 days ahead. You can close dates
                further ahead for holidays.
              </p>
              <div className="studio-calendar__closure">
                <h3>Close availability</h3>
                <p className="studio-calendar__small">
                  A range containing a booking or a payment in progress cannot
                  be closed.
                </p>
                <div className="studio-calendar__range">
                  <div>
                    <label htmlFor="closure-from">From</label>
                    <select
                      id="closure-from"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      disabled={controlsDisabled}
                    >
                      {slotTimes.map((time) => (
                        <option key={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="closure-until">Until</label>
                    <select
                      id="closure-until"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      disabled={controlsDisabled}
                    >
                      {[
                        "10:30",
                        "11:00",
                        "11:30",
                        "12:00",
                        "15:30",
                        "16:00",
                        "16:30",
                        "17:00",
                        "17:30",
                        "18:00",
                      ].map((time) => (
                        <option key={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label>
                  Note <span>(optional)</span>
                  <input
                    value={reason}
                    maxLength={200}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="For example, travelling"
                    disabled={controlsDisabled}
                  />
                </label>
                <button
                  className="studio-calendar__primary"
                  disabled={controlsDisabled || start >= end}
                  onClick={() => close(false)}
                >
                  Close selected times
                </button>
                <button
                  className="studio-calendar__secondary"
                  disabled={controlsDisabled}
                  onClick={() => close(true)}
                >
                  Close the whole day
                </button>
              </div>
            </aside>
            <div className="studio-calendar__panel studio-calendar__day">
              <div className="studio-calendar__day-heading">
                <div>
                  <h2>{dayName(date)}</h2>
                  <p className="studio-calendar__small">
                    30-minute consultations · IST
                  </p>
                </div>
                <button
                  aria-label="Refresh calendar"
                  className="studio-calendar__secondary"
                  onClick={() => {
                    setError("");
                    setRefresh((value) => value + 1);
                  }}
                  disabled={busy || loading}
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              {loading && (
                <p role="status">Checking the latest availability…</p>
              )}
              {!loading && !day && (
                <p>
                  Availability could not be loaded. No changes can be made until
                  it is checked.
                </p>
              )}
              {day && (
                <>
                  <div className="studio-calendar__slots">
                    {day.slots.map((slot) => (
                      <div
                        className={`studio-calendar__slot studio-calendar__slot--${slot.state}`}
                        key={slot.time}
                      >
                        <div className="studio-calendar__slot-line">
                          <strong>{slotLabel(slot.time)}</strong>
                          <span className="studio-calendar__state">
                            {states[slot.state]}
                          </span>
                        </div>
                        {slot.booking_id && (
                          <details>
                            <summary>
                              {slot.full_name} · {slot.service_name}
                            </summary>
                            <div className="studio-calendar__booking">
                              <p>
                                {formatFee(slot.amount_paise)}
                                {slot.question_count > 1
                                  ? ` · ${slot.question_count} questions`
                                  : ""}
                              </p>
                              <a href={`tel:${slot.phone}`}>{slot.phone}</a>
                              <a href={`mailto:${slot.email}`}>{slot.email}</a>
                              {slot.can_cancel && (
                                <button
                                  disabled={controlsDisabled}
                                  className="studio-calendar__secondary"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Has this cancellation been agreed by phone? This releases the appointment and records the cancellation. No refund is issued automatically.",
                                      )
                                    )
                                      change(
                                        `/bookings/${slot.booking_id}/cancel`,
                                        undefined,
                                        "Cancellation recorded and time released. No refund has been issued; calendar and email updates are pending.",
                                      );
                                  }}
                                >
                                  Mark cancelled after phone call
                                </button>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                  {day.closures.length > 0 && (
                    <div className="studio-calendar__existing">
                      <h3>Closed times</h3>
                      {day.closures.map((closure) => (
                        <div key={closure.id}>
                          <p>
                            <strong>
                              {closure.start_time
                                ? `${closure.start_time}–${closure.end_time}`
                                : "Whole day"}
                            </strong>
                            {closure.reason && <span>{closure.reason}</span>}
                          </p>
                          <button
                            className="studio-calendar__secondary"
                            disabled={controlsDisabled}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Reopen these consultation times for booking?",
                                )
                              )
                                change(
                                  `/closures/${closure.id}/reopen`,
                                  undefined,
                                  "These times are open again, subject to the normal booking hours and 10-day limit.",
                                );
                            }}
                          >
                            Reopen
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

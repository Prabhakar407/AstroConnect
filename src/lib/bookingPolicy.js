export const slotTimes = ['10:00', '10:30', '11:00', '11:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
export const formatFee = amountPaise => `₹${(amountPaise / 100).toLocaleString('en-IN')}`

export function todayInIndia(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function canSelectDate(value, now = new Date()) {
  const today = todayInIndia(now)
  const last = new Date(`${today}T00:00:00Z`)
  last.setUTCDate(last.getUTCDate() + 10)
  const candidate = new Date(`${value}T00:00:00Z`)
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(candidate.valueOf()) && candidate.toISOString().slice(0, 10) === value && value >= today && value <= last.toISOString().slice(0, 10) && candidate.getUTCDay() !== 0
}

export function dateInPolicy(value, policy) {
  if (!policy || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const day = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(day.valueOf()) && day.toISOString().slice(0, 10) === value &&
    value >= policy.first_date && value <= policy.last_date && day.getUTCDay() !== 0
}

export function validatePolicy(policy) {
  if (!policy || policy.timezone !== 'Asia/Kolkata' || policy.duration_minutes !== 30 ||
      !Number.isFinite(Date.parse(policy.server_now)) || !/^\d{4}-\d{2}-\d{2}$/.test(policy.first_date) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(policy.last_date) || policy.last_date < policy.first_date ||
      !Array.isArray(policy.slot_times) || policy.slot_times.join() !== slotTimes.join()) {
    throw new Error('We could not confirm the booking dates. Please try again.')
  }
  return policy
}

export function slotLabel(value) {
  const [hour, minute] = value.split(':').map(Number)
  const display = (h, m) => `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  const endMinutes = hour * 60 + minute + 30
  return `${display(hour, minute)} – ${display(Math.floor(endMinutes / 60), endMinutes % 60)}`
}

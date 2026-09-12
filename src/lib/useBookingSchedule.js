import { useEffect, useRef, useState } from 'react'
import { requestJson } from './formApi'
import { dateInPolicy, validatePolicy } from './bookingPolicy'

export default function useBookingSchedule(date) {
  const [schedule, setSchedule] = useState({ policy: null, slots: {}, loading: true, error: '' })
  const [refresh, setRefresh] = useState(0)
  const lastActivity = useRef(performance.now())
  useEffect(() => {
    let active = true, running = false
    const load = async () => {
      if (running || document.hidden) return
      running = true
      setSchedule(previous => ({ ...previous, loading: true, error: '', slots: {} }))
      try {
        let data = await requestJson('/api/booking-policy')
        validatePolicy(data)
        if (!active) return
        if (date && dateInPolicy(date, data)) {
          data = await requestJson(`/api/availability?date=${date}`)
          validatePolicy(data)
          if (data.date !== date || !data.slots || data.slot_times.some(slot => typeof data.slots[slot] !== 'boolean')) {
            throw new Error('We could not confirm these times. Please try again.')
          }
        }
        if (active) setSchedule({ policy: data, slots: data.slots || {}, loading: false, error: '' })
      } catch (error) {
        if (active) setSchedule(previous => ({ ...previous, slots: {}, loading: false, error: error.message }))
      } finally { running = false }
    }
    const resume = () => { lastActivity.current = performance.now(); load() }
    const activity = () => {
      const wasIdle = performance.now() - lastActivity.current >= 300000
      lastActivity.current = performance.now()
      if (wasIdle) load()
    }
    load()
    const timer = setInterval(() => {
      if (performance.now() - lastActivity.current < 300000) load()
    }, 60000)
    window.addEventListener('focus', resume)
    window.addEventListener('pointerdown', activity)
    window.addEventListener('keydown', activity)
    document.addEventListener('visibilitychange', resume)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('focus', resume)
      window.removeEventListener('pointerdown', activity)
      window.removeEventListener('keydown', activity)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [date, refresh])
  return { ...schedule, retry: () => setRefresh(value => value + 1) }
}

import { useEffect, useRef, useState } from 'react'
import { requestJson } from './formApi'
import { dateInPolicy, validatePolicy } from './bookingPolicy'

export default function useBookingSchedule(date) {
  const [schedule, setSchedule] = useState({ policy: null, slots: {}, loading: true, error: '' })
  const [refresh, setRefresh] = useState(0)
  const lastActivity = useRef(performance.now())
  const loadedDate = useRef('')
  useEffect(() => {
    let active = true, running = false
    const load = async () => {
      if (running || document.hidden) return
      running = true
      const dateChanged = loadedDate.current !== date
      setSchedule(previous => ({ ...previous, loading: true, error: '', slots: dateChanged ? {} : previous.slots }))
      try {
        const policy = await requestJson('/api/booking-policy')
        validatePolicy(policy)
        if (!active) return
        let slots = {}
        if (date && dateInPolicy(date, policy)) {
          const availability = await requestJson(`/api/availability?date=${date}`)
          validatePolicy(availability)
          if (availability.date !== date || !availability.slots || availability.slot_times.some(slot => typeof availability.slots[slot] !== 'boolean')) {
            throw new Error('We could not confirm these times. Please try again.')
          }
          slots = availability.slots
        }
        if (active) {
          loadedDate.current = date
          setSchedule({ policy, slots, loading: false, error: '' })
        }
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

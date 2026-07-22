import React, { useState } from 'react'

/**
 * Appointment_Booking Component
 * Interactive form to schedule and book personal readings.
 */
function Appointment_Booking() {
  const [submitted, setSubmitted] = useState(false)

  const handleBooking = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="booking" className="w-full max-w-2xl mx-auto py-16 px-6">
      {/* Section Header */}
      <div className="text-center mb-8">
        <span className="text-amber-400 text-xs tracking-widest uppercase font-semibold">Reserve Your Spot</span>
        <h2 className="text-3xl font-serif text-amber-100 mt-2">Book An Appointment</h2>
      </div>

      {/* Booking Form Section */}
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl">
        {!submitted ? (
          <form onSubmit={handleBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Preferred Date</label>
                <input type="date" required className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Time Slot</label>
                <select className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-400">
                  <option>Morning (10:00 AM - 12:00 PM)</option>
                  <option>Afternoon (2:00 PM - 5:00 PM)</option>
                  <option>Evening (6:00 PM - 9:00 PM)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Reading Type</label>
              <select className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-400">
                <option>Natal Chart Reading (60 min)</option>
                <option>Relationship Synastry (90 min)</option>
                <option>Transit & Transit Forecast (45 min)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-[#060713] py-2.5 rounded-xl font-semibold tracking-wide transition-colors">
              Request Appointment
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">🌌</span>
            <h3 className="text-lg font-serif text-amber-200 mb-1">Booking Request Received</h3>
            <p className="text-sm text-slate-400">The stars are aligning. We will email confirmation details shortly.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Appointment_Booking

import React, { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Calendar, Clock, Sparkles, Send, MapPin, User, Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * CelestialDivider Component
 * Elegant visual separator designed with gold gradient lines and a central star symbol.
 */
function CelestialDivider() {
  return (
    <div className="w-full flex items-center justify-center py-6 gap-4">
      <div className="h-[1px] flex-grow max-w-[150px] bg-gradient-to-r from-transparent to-[#D3AF54]/40"></div>
      <div className="text-[#D3AF54]/50 text-xs tracking-widest select-none">✦ ❖ ✦</div>
      <div className="h-[1px] flex-grow max-w-[150px] bg-gradient-to-l from-transparent to-[#D3AF54]/40"></div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18
    }
  }
};

/**
 * Appointment_Booking Component
 * Interactive form to schedule and book personal readings.
 * Rebuilt with a luxury light palette, scroll parallax drift, glowing focus states,
 * and detailed birth chart details fields.
 */
function Appointment_Booking() {
  const { scrollY } = useScroll()
  const yZodiac = useTransform(scrollY, [0, 1000], [0, -80])
  const rZodiac = useTransform(scrollY, [0, 1000], [0, 35])
  const yHeader = useTransform(scrollY, [0, 1000], [0, -30])

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    readingType: "Vedic Astrology (60 min)",
    bookingDate: "",
    bookingSlot: "Morning (10:00 AM - 12:00 PM)",
    notes: ""
  })
  
  const [submitted, setSubmitted] = useState(false)

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay()

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  const selectDate = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0')
    const formattedDay = String(day).padStart(2, '0')
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`
    setFormData(prev => ({
      ...prev,
      bookingDate: dateStr
    }))
  }

  const isToday = (day) => {
    const today = new Date()
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear
  }

  const isDateSelected = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0')
    const formattedDay = String(day).padStart(2, '0')
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`
    return formData.bookingDate === dateStr
  }

  const isPastDay = (day) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const cellDate = new Date(currentYear, currentMonth, day)
    return cellDate < today
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBookingSubmit = (e) => {
    e.preventDefault()
    console.log("Appointment Booking Details Submitted:", formData)
    setSubmitted(true)
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center font-sans text-[#181122]">
      
      {/* ========================================================= */}
      {/* 1. HEADER SECTION (Warm Ivory bg-[#F4F1E3])               */}
      {/* ========================================================= */}
      <div className="w-full bg-[#F4F1E3] pt-12 pb-6 px-6 flex flex-col items-center relative z-10 border-b border-[#AB7A57]/10">
        
        {/* Decorative backgrounds & rotating zodiac inside header wrapper */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ y: yHeader }}
          className="text-center max-w-2xl relative z-10"
        >
          <span className="text-[#AB7A57] text-xs tracking-[0.25em] font-bold uppercase block mb-3 font-sans">
            ✦ RESERVE YOUR SPOT ✦
          </span>
          <h1 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-[#181122] tracking-wide leading-tight">
            Schedule A Consultation
          </h1>
          <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-4 mb-2"></div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* 2. BOOKING FORM CONTAINER (Pure White bg-white)           */}
      {/* ========================================================= */}
      <div className="w-full bg-white py-8 px-4 flex flex-col items-center relative z-10 overflow-hidden">
        
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.04),transparent_70%)] rounded-full -z-10 pointer-events-none"></div>

        {/* Rotating Background Zodiac Motif */}
        <motion.div 
          style={{ y: yZodiac, rotate: rZodiac }}
          className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02] flex justify-center items-center -z-10"
        >
          <svg className="w-[600px] h-[600px] text-[#AB7A57]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
            <circle cx="100" cy="100" r="95" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="75" />
            <circle cx="100" cy="100" r="55" strokeDasharray="2 2" />
            <line x1="100" y1="5" x2="100" y2="195" />
            <line x1="5" y1="100" x2="195" y2="100" />
          </svg>
        </motion.div>

        <div className="w-full max-w-3xl bg-[#181122] border border-[#AB7A57]/20 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl relative text-white">
          
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-16 space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-900/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-4xl shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
                ✓
              </div>
              <h4 className="font-serif text-white font-bold text-2xl md:text-3xl">Booking Request Received!</h4>
              <p className="text-sm md:text-base text-[#D8CFEB] max-w-md font-sans leading-relaxed">
                Thank you. Astrologer Kundan Singh will review your credentials and confirm your selected slot. An email and WhatsApp confirmation will be sent shortly.
              </p>
              <CelestialDivider />
              <button 
                onClick={() => {
                  setSubmitted(false)
                  setFormData({
                    name: "",
                    phone: "",
                    email: "",
                    birthDate: "",
                    birthTime: "",
                    birthPlace: "",
                    readingType: "Natal Chart Reading (60 min)",
                    bookingDate: "",
                    bookingSlot: "Morning (10:00 AM - 12:00 PM)",
                    notes: ""
                  })
                }}
                className="bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] border border-[#D3AF54] px-6 py-2.5 rounded-xl transition duration-300 font-semibold text-sm cursor-pointer shadow-md shadow-[#D3AF54]/10"
              >
                Book Another Session
              </button>
            </motion.div>
          ) : (
            <motion.form 
              onSubmit={handleBookingSubmit} 
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-4"
            >
              
              {/* 1. Contact Details */}
              <motion.div variants={itemVariants} className="space-y-3 text-left">
                <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-2">
                  1. Personal Contact Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                      Full Name <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-3.5 text-[#D3AF54]/60" />
                      <input 
                        type="text" 
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                      Email Address <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-[#D3AF54]/60" />
                      <input 
                        type="email" 
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your email"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                      Mobile Number <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3.5 text-[#D3AF54]/60" />
                      <input 
                        type="tel" 
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Your phone"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 2. Birth Credentials */}
              <motion.div variants={itemVariants} className="space-y-3 text-left">
                <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-2">
                  2. Cosmic Birth Credentials
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="birthDate" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                      Date of Birth <span className="text-[#D3AF54]">*</span>
                    </label>
                    <input 
                      type="date" 
                      id="birthDate"
                      name="birthDate"
                      required
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="birthTime" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                      Exact Time of Birth <span className="text-[#D3AF54]">*</span>
                    </label>
                    <input 
                      type="time" 
                      id="birthTime"
                      name="birthTime"
                      required
                      value={formData.birthTime}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="birthPlace" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                      Place of Birth (City/State) <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3.5 text-[#D3AF54]/60" />
                      <input 
                        type="text" 
                        id="birthPlace"
                        name="birthPlace"
                        required
                        value={formData.birthPlace}
                        onChange={handleInputChange}
                        placeholder="City, State, Country"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 3. Session Selection */}
              <motion.div variants={itemVariants} className="space-y-3 text-left">
                <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-2">
                  3. Session Specifics
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Visual Calendar Column */}
                  <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative z-20">
                    
                    {/* Calendar Nav Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <h4 className="font-serif text-sm sm:text-base font-bold text-white tracking-wide">
                        {monthNames[currentMonth]} {currentYear}
                      </h4>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={handlePrevMonth}
                          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-[#D3AF54] hover:bg-white/5 cursor-pointer active:scale-95 transition-all"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={handleNextMonth}
                          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-[#D3AF54] hover:bg-white/5 cursor-pointer active:scale-95 transition-all"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-[#D3AF54] uppercase tracking-wider py-1">
                      {daysOfWeek.map((day, idx) => (
                        <div key={idx} className="py-0.5">{day}</div>
                      ))}
                    </div>

                    {/* Calendar Grid Cells */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mt-1">
                      {/* Empty padding offsets before first day of month */}
                      {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, idx) => (
                        <div key={`offset-${idx}`} className="aspect-square" />
                      ))}

                      {/* Day cells */}
                      {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }).map((_, idx) => {
                        const day = idx + 1
                        const isPast = isPastDay(day)
                        const isSelected = isDateSelected(day)
                        const isTodayDay = isToday(day)

                        return (
                          <button
                            key={`day-${day}`}
                            type="button"
                            disabled={isPast}
                            onClick={() => selectDate(day)}
                            className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all cursor-pointer relative ${
                              isPast
                                ? "text-white/20 bg-transparent cursor-not-allowed"
                                : isSelected
                                ? "bg-[#D3AF54] text-[#181122] font-bold shadow-[0_0_10px_rgba(211,175,84,0.3)] scale-[1.05]"
                                : isTodayDay
                                ? "border border-[#D3AF54] text-[#D3AF54] hover:bg-[#D3AF54]/10"
                                : "text-slate-300 hover:bg-white/5 hover:border-white/20 border border-transparent"
                            }`}
                          >
                            <span>{day}</span>
                            {isTodayDay && !isSelected && (
                              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#D3AF54] left-1/2 -translate-x-1/2" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Booking Fields & Selected Date Summary */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    
                    {/* Selected Date Summary Display */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 text-left relative overflow-hidden">
                      <span className="text-[10px] font-semibold text-[#D3AF54] uppercase tracking-wider block">
                        ✦ YOUR SELECTED DATE
                      </span>
                      {formData.bookingDate ? (
                        <div className="text-sm sm:text-base font-serif font-bold text-white mt-1 tracking-wide">
                          {new Date(formData.bookingDate + "T00:00:00").toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      ) : (
                        <div className="text-sm font-sans italic text-[#D8CFEB]/60 mt-1">
                          Please select a date from the calendar grid*
                        </div>
                      )}
                      <input type="hidden" name="bookingDate" required value={formData.bookingDate} />
                    </div>

                    {/* Consultation Type Selector */}
                    <div className="space-y-1.5 text-left">
                      <label htmlFor="readingType" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                        Consultation Type
                      </label>
                      <select 
                        id="readingType"
                        name="readingType"
                        value={formData.readingType}
                        onChange={handleInputChange}
                        className="w-full bg-[#181122] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300 cursor-pointer"
                      >
                        <option value="Vedic Astrology (60 min)">Vedic Astrology (60 min)</option>
                        <option value="Numerology Reading (45 min)">Numerology Reading (45 min)</option>
                        <option value="Vastu Consultation (Site/Home)">Vastu Consultation (Site/Home)</option>
                        <option value="Laal Kitaab Remedies (45 min)">Laal Kitaab Remedies (45 min)</option>
                        <option value="Prashna Kundali (Horary - 30 min)">Prashna Kundali (Horary - 30 min)</option>
                        <option value="Reiki Energy Healing (60 min)">Reiki Energy Healing (60 min)</option>
                      </select>
                    </div>

                    {/* Preferred Time Slot Selector */}
                    <div className="space-y-1.5 text-left">
                      <label htmlFor="bookingSlot" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                        Preferred Time Slot
                      </label>
                      <select 
                        id="bookingSlot"
                        name="bookingSlot"
                        value={formData.bookingSlot}
                        onChange={handleInputChange}
                        className="w-full bg-[#181122] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300 cursor-pointer"
                      >
                        <option value="Morning (10:00 AM - 12:00 PM)">Morning (10:00 AM - 12:00 PM)</option>
                        <option value="Afternoon (12:00 PM - 3:00 PM)">Afternoon (12:00 PM - 3:00 PM)</option>
                        <option value="Evening (3:00 PM - 6:00 PM)">Evening (3:00 PM - 6:00 PM)</option>
                      </select>
                    </div>

                  </div>
                </div>
              </motion.div>

              {/* Notes */}
              <motion.div variants={itemVariants} className="space-y-1.5 text-left">
                <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                  Additional Concerns or Questions
                </label>
                <textarea 
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Is there anything specific you would like Kundan Singh to focus on during your session?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300 placeholder-white/40 resize-none min-h-[100px]"
                />
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <motion.button 
                  type="submit"
                  whileHover={{ scale: 1.02, y: -1, boxShadow: "0 10px 20px rgba(211, 175, 84, 0.15), 0 0 15px rgba(211, 175, 84, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-full bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] border border-[#D3AF54] font-semibold py-3.5 rounded-xl transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4 text-sm"
                >
                  <Send size={16} />
                  <span>Submit Appointment Request</span>
                </motion.button>
              </motion.div>

            </motion.form>
          )}
        </div>
      </div>

    </div>
  )
}

export default Appointment_Booking

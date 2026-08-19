import React, { useState, useEffect } from 'react'
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
    readingType: "Vedic Astrology",
    bookingDate: "",
    bookingSlot: "10:00",
    notes: ""
  })

  const [slotAvailability, setSlotAvailability] = useState({
    "10:00": true,
    "11:00": true,
    "15:00": true,
    "16:00": true,
    "17:00": true
  })
  
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [eventLink, setEventLink] = useState("")
  const [meetLink, setMeetLink] = useState("")
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

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

  useEffect(() => {
    if (!formData.bookingDate) return;
    
    const fetchAvailability = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/availability?date=${formData.bookingDate}`)
        if (response.ok) {
          const data = await response.json()
          setSlotAvailability(data)
        }
      } catch (err) {
        console.warn("Failed to fetch slot availability, using fallback:", err)
      }
    }
    
    fetchAvailability()
  }, [formData.bookingDate])

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

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Please enter your Full Name.";
    }
    if (!formData.email.trim()) {
      return "Please enter your Email Address.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return "Please enter a valid email address (e.g. name@example.com). Check if '@' or '.' is missing.";
    }
    if (!formData.phone.trim()) {
      return "Please enter your Mobile Number.";
    }
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(formData.phone.trim().replace(/[\s\-]/g, ''))) {
      return "Please enter a valid mobile number (digits only, e.g. +1234567890).";
    }
    if (!formData.bookingDate) {
      return "Please select a date from the calendar grid.";
    }
    if (!formData.bookingSlot) {
      return "Please select a time slot.";
    }
    return null;
  }

  useEffect(() => {
    if (attemptedSubmit) {
      const err = validateForm()
      setErrorMsg(err || "")
    }
  }, [formData, attemptedSubmit])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    
    const validationError = validateForm()
    if (validationError) {
      setErrorMsg(validationError)
      const formElement = document.getElementById("booking-form")
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }

    setLoading(true)
    setErrorMsg("")
    setEventLink("")

    // Use the selected hourly slot directly
    const timeSlot = formData.bookingSlot || "10:00"

    // Determine the appointment duration from selected reading type
    let duration = 30

    // Pack intake questions into service details description
    const birthDetails = `Phone: ${formData.phone}\nBirth Date: ${formData.birthDate}\nBirth Time: ${formData.birthTime || 'Not Provided'}\nBirth Place: ${formData.birthPlace || 'Not Provided'}\nClient Notes: ${formData.notes || 'None'}`

    try {
      const response = await fetch("http://localhost:8000/api/book-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service_name: formData.readingType,
          date: formData.bookingDate,
          time_slot: timeSlot,
          duration_minutes: duration,
          birth_details: birthDetails,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong while booking your appointment.")
      }

      if (data.event_link) {
        setEventLink(data.event_link)
      }
      setSubmitted(true)
    } catch (err) {
      setErrorMsg(err.message || "Failed to connect to the booking server. Please verify that the FastAPI backend is running.")
    } finally {
      setLoading(false)
    }
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

        <div className="w-full max-w-5xl bg-[#181122] border border-[#AB7A57]/20 rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl relative text-white">
          
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
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {eventLink && (
                  <a 
                    href={eventLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 bg-[#D3AF54]/15 hover:bg-[#D3AF54]/25 text-[#D3AF54] border border-[#D3AF54]/45 px-5 py-2 rounded-xl transition duration-300 font-semibold text-xs tracking-wider uppercase cursor-pointer"
                  >
                    <span>View In Google Calendar</span>
                  </a>
                )}
                {meetLink && (
                  <a 
                    href={meetLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl transition duration-300 font-semibold text-xs tracking-wider uppercase cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <span>Join Google Meet Session</span>
                  </a>
                )}
              </div>
              <CelestialDivider />
              <button 
                onClick={() => {
                  setSubmitted(false)
                  setMeetLink("")
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
              id="booking-form"
              onSubmit={handleBookingSubmit} 
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-20"
            >
              {/* Error Message Display (Real-time Validation Alert) */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-1 lg:col-span-12 p-4 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs md:text-sm text-center font-sans tracking-wide leading-relaxed shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                >
                  ⚠️ {errorMsg}
                </motion.div>
              )}
              
              {/* LEFT COLUMN: All Inputs, Selectors & Submit Button */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1 & 2. Contact Details & Birth Credentials Sub-grid (2 cols, 3 rows) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  
                  {/* Column 1: Personal Contact Details */}
                  <motion.div variants={itemVariants} className="space-y-4 text-left">
                    <h3 className="font-serif text-base font-bold !text-[#D3AF54] border-b border-[#AB7A57]/20 pb-2">
                      1. Personal Contact Details
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
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
                        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
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
                        <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
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

                  {/* Column 2: Cosmic Birth Credentials */}
                  <motion.div variants={itemVariants} className="space-y-4 text-left">
                    <h3 className="font-serif text-base font-bold !text-[#D3AF54] border-b border-[#AB7A57]/20 pb-2">
                      2. Cosmic Birth Credentials
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="birthDate" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
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
                        <label htmlFor="birthTime" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                          Exact Time of Birth <span className="text-white/50 text-[10px] normal-case font-normal italic">(Optional)</span>
                        </label>
                        <input 
                          type="time" 
                          id="birthTime"
                          name="birthTime"
                          value={formData.birthTime}
                          onChange={handleInputChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="birthPlace" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                          Place of Birth (City/State) <span className="text-white/50 text-[10px] normal-case font-normal italic">(Optional)</span>
                        </label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3.5 top-3.5 text-[#D3AF54]/60" />
                          <input 
                            type="text" 
                            id="birthPlace"
                            name="birthPlace"
                            value={formData.birthPlace}
                            onChange={handleInputChange}
                            placeholder="City, State, Country"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                </div>
              </div>

              {/* RIGHT COLUMN: Calendar (Shifted above Consultation details in Mobile) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 3. Date Selection Calendar */}
                <motion.div variants={itemVariants} className="space-y-3 text-left">
                  <h3 className="font-serif text-base font-bold !text-[#D3AF54] border-b border-white/10 pb-2">
                    3. Select Date
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    
                    {/* Visual Calendar taking full width of column */}
                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative z-20">
                      
                      {/* Calendar Nav Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <h4 className="font-serif text-sm sm:text-base font-bold !text-[#D3AF54] tracking-wide">
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

                      {/* Calendar Day Cells */}
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

                    <input type="hidden" name="bookingDate" required value={formData.bookingDate} />
                  </div>
                </motion.div>

              </div>

              {/* LEFT COLUMN PART 2: Consultation Details & Submit */}
              <div className="lg:col-span-7 space-y-6">

                {/* 3. Session Selection Fields (Placed directly below birth credentials) */}
                <motion.div variants={itemVariants} className="space-y-4 text-left border-t border-[#AB7A57]/20 pt-4">
                  <h3 className="font-serif text-base font-bold !text-[#D3AF54] pb-1">
                    4. Consultation Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Consultation Type Selector */}
                    <div className="space-y-1.5">
                      <label htmlFor="readingType" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                        Consultation Type
                      </label>
                      <select 
                        id="readingType"
                        name="readingType"
                        value={formData.readingType}
                        onChange={handleInputChange}
                        className="w-full bg-[#181122] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300 cursor-pointer"
                      >
                        <option value="Vedic Astrology">Vedic Astrology (₹2,100)</option>
                        <option value="Numerology Reading">Numerology Reading (₹1,100)</option>
                        <option value="Vastu Consultation">Vastu Consultation (₹5,100)</option>
                        <option value="Laal Kitaab Remedies">Laal Kitaab Remedies (₹1,100)</option>
                        <option value="Prashna Kundali (Horary)">Prashna Kundali (Horary) (₹1,100)</option>

                      </select>
                    </div>

                    {/* Choose Time Slot Button Grid */}
                    <div className="space-y-2 text-left md:col-span-2 mt-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                        Choose Time Slot
                      </label>
                      
                      {!formData.bookingDate ? (
                        <div className="text-xs text-white/50 italic border border-white/5 bg-white/5 rounded-xl p-3 text-center">
                          ✦ Please select a date on the calendar first to view hourly slot availability.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { value: "10:00", label: "10:00 AM - 11:00 AM", period: "Morning" },
                            { value: "11:00", label: "11:00 AM - 12:00 PM", period: "Morning" },
                            { value: "15:00", label: "03:00 PM - 04:00 PM", period: "Evening" },
                            { value: "16:00", label: "04:00 PM - 05:00 PM", period: "Evening" },
                            { value: "17:00", label: "05:00 PM - 06:00 PM", period: "Evening" },
                          ].map((slot) => {
                            const isAvailable = slotAvailability[slot.value] !== false;
                            const isSelected = formData.bookingSlot === slot.value;
                            
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => setFormData(prev => ({ ...prev, bookingSlot: slot.value }))}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all duration-300 ${
                                  !isAvailable
                                    ? "bg-red-950/20 border-red-900/30 text-red-400/40 cursor-not-allowed opacity-50"
                                    : isSelected
                                      ? "bg-[#D3AF54] border-[#D3AF54] text-[#181122] shadow-[0_0_12px_rgba(211,175,84,0.3)] font-bold scale-[1.02]"
                                      : "bg-white/5 border-white/10 hover:border-[#D3AF54] text-white cursor-pointer hover:bg-white/10"
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold tracking-wide">{slot.label}</span>
                                  <span className={`text-[8px] uppercase tracking-wider mt-0.5 ${
                                    isSelected ? "text-[#181122]/70" : "text-[#D8CFEB]/60"
                                  }`}>{slot.period}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    !isAvailable 
                                      ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                                      : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                  }`} />
                                  <span className="text-[9px] uppercase font-bold tracking-wider">
                                    {isAvailable ? "Open" : "Full"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Notes / Concerns / Comments */}
                  <div className="space-y-1.5 text-left mt-2">
                    <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Additional Concerns or Questions
                    </label>
                    <textarea 
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Is there anything specific you would like Kundan Singh to focus on during your session?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300 placeholder-white/40 resize-none min-h-[80px]"
                    />
                  </div>
                </motion.div>



                {/* Submit Button */}
                <motion.div variants={itemVariants}>
                  <motion.button 
                    type="submit"
                    disabled={loading}
                    whileHover={loading ? {} : { scale: 1.02, y: -1, boxShadow: "0 10px 20px rgba(211, 175, 84, 0.15), 0 0 15px rgba(211, 175, 84, 0.3)" }}
                    whileTap={loading ? {} : { scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className={`w-full bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] border border-[#D3AF54] font-semibold py-3.5 rounded-xl transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4 text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#181122]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing Booking Request...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Appointment Request</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>

              </div>


            </motion.form>
          )}
        </div>
      </div>

    </div>
  )
}

export default Appointment_Booking

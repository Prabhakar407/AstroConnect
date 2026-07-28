import React, { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Calendar, Clock, Sparkles, Send, MapPin, User, Mail, Phone } from 'lucide-react'

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
    <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center px-6 py-12 font-sans text-[#181122]">
      
      {/* ========================================================= */}
      {/* DECORATIVE BACKGROUNDS & PARALLAX                         */}
      {/* ========================================================= */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
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

      {/* ========================================================= */}
      {/* PAGE HEADER                                               */}
      {/* ========================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ y: yHeader }}
        className="text-center max-w-2xl mb-12 relative z-10"
      >
        <span className="text-[#AB7A57] text-xs tracking-[0.25em] font-bold uppercase block mb-3 font-sans">
          ✦ RESERVE YOUR SPOT ✦
        </span>
        <h1 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-[#181122] tracking-wide leading-tight">
          Schedule A Consultation
        </h1>
        <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-4 mb-4"></div>
        <p className="text-sm md:text-base text-[#181122]/90 leading-relaxed max-w-xl mx-auto">
          Secure your session with Astrologer Kundan Singh. Please provide your birth credentials to facilitate exact transit and chart calculations.
        </p>
      </motion.div>

      {/* ========================================================= */}
      {/* BOOKING FORM CONTAINER                                    */}
      {/* ========================================================= */}
      <div className="w-full max-w-3xl bg-[#181122] border border-[#AB7A57]/20 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10 text-white">
        
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
            className="space-y-6"
          >
            
            {/* 1. Contact Details */}
            <motion.div variants={itemVariants} className="space-y-4 text-left">
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Phone / WhatsApp <span className="text-[#D3AF54]">*</span>
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
                      placeholder="WhatsApp number"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Email Address <span className="text-xs text-[#D8CFEB]/70 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-[#D3AF54]/60" />
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Birth Credentials */}
            <motion.div variants={itemVariants} className="space-y-4 text-left">
              <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-2">
                2. Birth Chart Credentials
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 color-scheme-dark"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="birthTime" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Time of Birth <span className="text-[#D3AF54]">*</span>
                  </label>
                  <input 
                    type="time" 
                    id="birthTime"
                    name="birthTime"
                    required
                    value={formData.birthTime}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 color-scheme-dark"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="birthPlace" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Place of Birth <span className="text-[#D3AF54]">*</span>
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. Session Selection */}
            <motion.div variants={itemVariants} className="space-y-4 text-left">
              <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-2">
                3. Consultation Scheduling
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="readingType" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Reading Type <span className="text-[#D3AF54]">*</span>
                  </label>
                  <select 
                    id="readingType"
                    name="readingType"
                    value={formData.readingType}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300"
                  >
                    <option className="bg-[#181122] text-white">Vedic Astrology (60 min)</option>
                    <option className="bg-[#181122] text-white">Numerologist (45 min)</option>
                    <option className="bg-[#181122] text-white">Vastu Consultant (Site Specific)</option>
                    <option className="bg-[#181122] text-white">Laal Kitaab Remedies (45 min)</option>
                    <option className="bg-[#181122] text-white">Expertise in Prashna Kundali (45 min)</option>
                    <option className="bg-[#181122] text-white">Reiki Healer (30 min)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bookingDate" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Preferred Date <span className="text-[#D3AF54]">*</span>
                  </label>
                  <input 
                    type="date" 
                    id="bookingDate"
                    name="bookingDate"
                    required
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 color-scheme-dark"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bookingSlot" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Preferred Slot <span className="text-[#D3AF54]">*</span>
                  </label>
                  <select 
                    id="bookingSlot"
                    name="bookingSlot"
                    value={formData.bookingSlot}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300"
                  >
                    <option className="bg-[#181122] text-white">Morning (10:00 AM - 12:00 PM)</option>
                    <option className="bg-[#181122] text-white">Afternoon (2:00 PM - 5:00 PM)</option>
                    <option className="bg-[#181122] text-white">Evening (6:00 PM - 9:00 PM)</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* 4. Notes Section */}
            <motion.div variants={itemVariants} className="space-y-1.5 text-left">
              <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                Specific Questions / Notes <span className="text-xs text-[#D8CFEB]/70 font-normal lowercase">(optional)</span>
              </label>
              <textarea 
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Enter details of current situations or specific queries you want analyzed..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 resize-none placeholder-white/40"
              ></textarea>
            </motion.div>

            {/* Submit button */}
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
  )
}

export default Appointment_Booking

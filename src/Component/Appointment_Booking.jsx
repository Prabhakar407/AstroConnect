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
      <div className="h-[1px] flex-grow max-w-[150px] bg-gradient-to-r from-transparent to-[#fcb900]/40"></div>
      <div className="text-[#fcb900]/50 text-xs tracking-widest select-none">✦ ❖ ✦</div>
      <div className="h-[1px] flex-grow max-w-[150px] bg-gradient-to-l from-transparent to-[#fcb900]/40"></div>
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
    readingType: "Natal Chart Reading (60 min)",
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
    <div className="w-full min-h-screen bg-[#FDF9F7] relative overflow-hidden flex flex-col items-center px-6 py-12 font-sans">
      
      {/* ========================================================= */}
      {/* DECORATIVE BACKGROUNDS & PARALLAX                         */}
      {/* ========================================================= */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(221,177,149,0.08),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(42,19,46,0.05),transparent_70%)] rounded-full -z-10 pointer-events-none"></div>

      {/* Rotating Background Zodiac Motif */}
      <motion.div 
        style={{ y: yZodiac, rotate: rZodiac }}
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] flex justify-center items-center -z-10"
      >
        <svg className="w-[600px] h-[600px] text-[#A6755D]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
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
        <span className="text-[#fcb900] text-xs tracking-[0.25em] font-bold uppercase block mb-3 font-sans">
          ✦ RESERVE YOUR SPOT ✦
        </span>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#2A132E] tracking-wide">
          Schedule A Consultation
        </h1>
        <div className="w-12 h-[1px] bg-[#fcb900] mx-auto mt-4 mb-4"></div>
        <p className="text-sm md:text-base text-[#55393F]/90 leading-relaxed max-w-xl mx-auto">
          Secure your session with Astrologer Kundan Singh. Please provide your birth credentials to facilitate exact transit and chart calculations.
        </p>
      </motion.div>

      {/* ========================================================= */}
      {/* BOOKING FORM CONTAINER                                    */}
      {/* ========================================================= */}
      <div className="w-full max-w-3xl bg-white border border-[#BDA9A8]/20 rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_rgba(85,57,63,0.08),_0_0_20px_rgba(252,185,0,0.05)] hover:shadow-[0_25px_60px_rgba(85,57,63,0.12),_0_0_30px_rgba(252,185,0,0.15)] transition-all duration-500 relative z-10">
        
        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-16 space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-4xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              ✓
            </div>
            <h4 className="font-serif text-[#2A132E] font-bold text-2xl md:text-3xl">Booking Request Received!</h4>
            <p className="text-sm md:text-base text-[#55393F]/90 max-w-md">
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
              className="bg-[#2A132E] hover:bg-[#fcb900] text-white hover:text-[#2A132E] border border-[#2A132E] hover:border-[#fcb900] px-6 py-2.5 rounded-xl transition duration-300 font-semibold text-sm cursor-pointer shadow-md"
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
              <h3 className="font-serif text-lg font-bold text-[#2A132E] border-b border-[#BDA9A8]/20 pb-2">
                1. Personal Contact Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Full Name <span className="text-[#fcb900]">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-[#A6755D]/70" />
                    <input 
                      type="text" 
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl pl-10 pr-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Phone / WhatsApp <span className="text-[#fcb900]">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-[#A6755D]/70" />
                    <input 
                      type="tel" 
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="WhatsApp number"
                      className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl pl-10 pr-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Email Address <span className="text-xs text-[#A6755D]/70 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-[#A6755D]/70" />
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your email"
                      className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl pl-10 pr-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Birth Credentials */}
            <motion.div variants={itemVariants} className="space-y-4 text-left">
              <h3 className="font-serif text-lg font-bold text-[#2A132E] border-b border-[#BDA9A8]/20 pb-2">
                2. Birth Chart Credentials
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="birthDate" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Date of Birth <span className="text-[#fcb900]">*</span>
                  </label>
                  <input 
                    type="date" 
                    id="birthDate"
                    name="birthDate"
                    required
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="birthTime" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Time of Birth <span className="text-[#fcb900]">*</span>
                  </label>
                  <input 
                    type="time" 
                    id="birthTime"
                    name="birthTime"
                    required
                    value={formData.birthTime}
                    onChange={handleInputChange}
                    className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="birthPlace" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Place of Birth <span className="text-[#fcb900]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-[#A6755D]/70" />
                    <input 
                      type="text" 
                      id="birthPlace"
                      name="birthPlace"
                      required
                      value={formData.birthPlace}
                      onChange={handleInputChange}
                      placeholder="City, State, Country"
                      className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl pl-10 pr-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. Session Selection */}
            <motion.div variants={itemVariants} className="space-y-4 text-left">
              <h3 className="font-serif text-lg font-bold text-[#2A132E] border-b border-[#BDA9A8]/20 pb-2">
                3. Consultation Scheduling
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="readingType" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Reading Type <span className="text-[#fcb900]">*</span>
                  </label>
                  <select 
                    id="readingType"
                    name="readingType"
                    value={formData.readingType}
                    onChange={handleInputChange}
                    className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 transition-all duration-300"
                  >
                    <option>Natal Chart Reading (60 min)</option>
                    <option>Relationship Synastry (90 min)</option>
                    <option>Transit & Forecast (45 min)</option>
                    <option>Vastu Consultation (Site Specific)</option>
                    <option>Numerology Alignment (45 min)</option>
                    <option>Gemstone Recommendation (30 min)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bookingDate" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Preferred Date <span className="text-[#fcb900]">*</span>
                  </label>
                  <input 
                    type="date" 
                    id="bookingDate"
                    name="bookingDate"
                    required
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bookingSlot" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Preferred Slot <span className="text-[#fcb900]">*</span>
                  </label>
                  <select 
                    id="bookingSlot"
                    name="bookingSlot"
                    value={formData.bookingSlot}
                    onChange={handleInputChange}
                    className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 transition-all duration-300"
                  >
                    <option>Morning (10:00 AM - 12:00 PM)</option>
                    <option>Afternoon (2:00 PM - 5:00 PM)</option>
                    <option>Evening (6:00 PM - 9:00 PM)</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* 4. Notes Section */}
            <motion.div variants={itemVariants} className="space-y-1.5 text-left">
              <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                Specific Questions / Notes <span className="text-xs text-[#A6755D]/70 font-normal lowercase">(optional)</span>
              </label>
              <textarea 
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Enter details of current situations or specific queries you want analyzed..."
                className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300 resize-none"
              ></textarea>
            </motion.div>

            {/* Submit button */}
            <motion.div variants={itemVariants}>
              <motion.button 
                type="submit"
                whileHover={{ scale: 1.02, y: -1, boxShadow: "0 10px 20px rgba(42, 19, 46, 0.15), 0 0 15px rgba(252, 185, 0, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-full bg-[#2A132E] hover:bg-[#fcb900] text-white hover:text-[#2A132E] border border-[#2A132E] hover:border-[#fcb900] font-semibold py-3.5 rounded-xl transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
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

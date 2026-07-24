import React, { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, User, Sparkles } from 'lucide-react'

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
      staggerChildren: 0.12
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
 * Contact Component
 * General inquiries and contact details section.
 * Rebuilt with a luxury light palette, dual-column structure,
 * scroll parallax, glowing interactive fields, and spring hovers.
 */
function Contact() {
  const { scrollY } = useScroll()
  const yZodiac = useTransform(scrollY, [0, 1000], [0, -70])
  const rZodiac = useTransform(scrollY, [0, 1000], [0, 30])
  const yHeader = useTransform(scrollY, [0, 1000], [0, -30])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: ""
  })
  
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleContactSubmit = (e) => {
    e.preventDefault()
    console.log("Contact Message Submitted:", formData)
    setSubmitted(true)
  }

  const contactDetails = [
    {
      icon: <Phone size={20} className="text-[#fcb900]" />,
      title: "Telephone / Call",
      val: "+91 9999999999",
      sub: "Mon - Sat: 9:00 AM - 7:00 PM"
    },
    {
      icon: <Mail size={20} className="text-[#fcb900]" />,
      title: "Email Queries",
      val: "contact@kundanastrology.com",
      sub: "Response within 24 hours"
    },
    {
      icon: <MapPin size={20} className="text-[#fcb900]" />,
      title: "Main Office",
      val: "New Delhi, India",
      sub: "Consultation by Appointment Only"
    },
    {
      icon: <MessageCircle size={20} className="text-[#fcb900]" />,
      title: "WhatsApp Chat",
      val: "WhatsApp Live Support",
      sub: "Instantly chat with us",
      link: "https://wa.me/919999999999"
    }
  ]

  return (
    <div className="w-full min-h-screen bg-[#FDF9F7] relative overflow-hidden flex flex-col items-center px-6 py-12 font-sans">
      
      {/* ========================================================= */}
      {/* DECORATIVE BACKGROUNDS & PARALLAX                         */}
      {/* ========================================================= */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(85,57,63,0.04),transparent_70%)] rounded-full -z-10 pointer-events-none"></div>

      {/* Rotating Background Zodiac Motif */}
      <motion.div 
        style={{ y: yZodiac, rotate: rZodiac }}
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] flex justify-center items-center -z-10"
      >
        <svg className="w-[580px] h-[580px] text-[#A6755D]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
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
          ✦ GET IN TOUCH ✦
        </span>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#2A132E] tracking-wide">
          Connect Personally
        </h1>
        <div className="w-12 h-[1px] bg-[#fcb900] mx-auto mt-4 mb-4"></div>
        <p className="text-sm md:text-base text-[#55393F]/90 leading-relaxed max-w-xl mx-auto">
          Need a private session layout, customized gemstone guidance, or business expansion advice? Speak directly with us and align your future timeline.
        </p>
      </motion.div>

      {/* ========================================================= */}
      {/* DUAL-COLUMN CONTENT LAYOUT                                */}
      {/* ========================================================= */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch relative z-10"
      >
        
        {/* Left Column - Contact Information */}
        <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="space-y-6 text-left">
            <h3 className="font-serif text-xl font-bold text-[#2A132E] border-b border-[#BDA9A8]/20 pb-3">
              Office Details & Support
            </h3>
            
            <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4">
              {contactDetails.map((item, idx) => {
                const CardWrapper = item.link ? 'a' : 'div'
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ x: 6, borderColor: "#fcb900" }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="bg-white border border-[#BDA9A8]/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm group"
                  >
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer" className="flex items-start gap-4 w-full">
                        <div className="w-10 h-10 rounded-xl bg-[#2A132E] border border-[#4A2A50] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-[#2A132E] group-hover:text-[#A6755D] transition-colors">{item.title}</h4>
                          <p className="text-sm font-bold text-[#fcb900] mt-0.5 hover:underline">{item.val}</p>
                          <p className="text-[11px] text-[#55393F]/80 mt-1 font-sans">{item.sub}</p>
                        </div>
                      </a>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-[#2A132E] border border-[#4A2A50] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-[#2A132E] group-hover:text-[#A6755D] transition-colors">{item.title}</h4>
                          <p className="text-sm font-bold text-[#2A132E] mt-0.5 font-sans">{item.val}</p>
                          <p className="text-[11px] text-[#55393F]/80 mt-1 font-sans">{item.sub}</p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          <div className="p-6 bg-gradient-to-tr from-[#2A132E] to-[#55393F] rounded-2xl text-left text-white shadow-lg space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#fcb900]/10 rounded-full blur-xl"></div>
            <Sparkles size={20} className="text-[#fcb900]/80 animate-pulse" />
            <h4 className="font-serif font-bold text-base text-[#fcb900]">Vedic Wisdom Guarantee</h4>
            <p className="text-xs text-[#EBDCD4] leading-relaxed">
              We guarantee 100% data confidentiality. None of your chart inputs, birth credentials, or planetary readings are ever shared with third parties.
            </p>
          </div>
        </motion.div>

        {/* Right Column - Message Form Card */}
        <motion.div variants={itemVariants} className="lg:col-span-7 bg-white border border-[#BDA9A8]/20 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(85,57,63,0.08),_0_0_20px_rgba(252,185,0,0.05)] hover:shadow-[0_25px_60px_rgba(85,57,63,0.12),_0_0_30px_rgba(252,185,0,0.15)] transition-all duration-500 flex flex-col justify-center">
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-12 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-3xl shadow-sm">
                ✓
              </div>
              <h4 className="font-serif text-[#2A132E] font-bold text-2xl">Message Dispatched!</h4>
              <p className="text-sm text-[#55393F]/90 max-w-sm mx-auto">
                Thank you for your message. We will review your query and connect with you via email or phone within 24 hours.
              </p>
              <CelestialDivider />
              <button 
                onClick={() => {
                  setSubmitted(false)
                  setFormData({ name: "", email: "", subject: "General Inquiry", message: "" })
                }}
                className="bg-[#2A132E] text-white hover:bg-[#fcb900] hover:text-[#2A132E] border border-[#2A132E] hover:border-[#fcb900] px-5 py-2 rounded-xl transition duration-300 font-semibold text-xs cursor-pointer"
              >
                Send Another Message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-5 text-left">
              <h3 className="font-serif text-xl font-bold text-[#2A132E] border-b border-[#BDA9A8]/20 pb-3">
                Send Direct Message
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Full Name <span className="text-[#fcb900]">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3.5 text-[#A6755D]/75" />
                    <input 
                      type="text" 
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                    Email Address <span className="text-[#fcb900]">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3.5 text-[#A6755D]/75" />
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your email"
                      className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                  Subject of Inquiry <span className="text-[#fcb900]">*</span>
                </label>
                <select 
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-2.5 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 transition-all duration-300"
                >
                  <option>General Inquiry</option>
                  <option>Birth Chart / Janam Kundli Readings</option>
                  <option>Love & Marriage Synastry Reading</option>
                  <option>Vastu Shastra Site Consultation</option>
                  <option>Gemstone Advice Query</option>
                  <option>Numerology Spill Check</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-[#55393F]">
                  Your Message <span className="text-[#fcb900]">*</span>
                </label>
                <textarea 
                  id="message"
                  name="message"
                  required
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Ask your question or detail your consultation request..."
                  className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-2.5 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-4 focus:ring-[#fcb900]/15 focus:shadow-[0_0_15px_rgba(252,185,0,0.15)] transition-all duration-300 resize-none"
                ></textarea>
              </div>

              <motion.button 
                type="submit"
                whileHover={{ scale: 1.02, y: -1, boxShadow: "0 10px 20px rgba(42, 19, 46, 0.15), 0 0 15px rgba(252, 185, 0, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-full bg-[#2A132E] hover:bg-[#fcb900] text-white hover:text-[#2A132E] border border-[#2A132E] hover:border-[#fcb900] font-semibold py-3 rounded-xl transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4 text-sm"
              >
                <Send size={14} />
                <span>Send Message</span>
              </motion.button>
            </form>
          )}
        </motion.div>

      </motion.div>

    </div>
  )
}

export default Contact

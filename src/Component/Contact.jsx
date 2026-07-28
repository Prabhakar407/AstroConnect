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
      icon: <Phone size={20} className="text-[#D3AF54]" />,
      title: "Telephone / Call",
      val: "+91 94520 62153",
      sub: "Mon - Sat: 9:00 AM - 7:00 PM"
    },
    {
      icon: <Mail size={20} className="text-[#D3AF54]" />,
      title: "Email Queries",
      val: "astrologerkundan@gmail.com",
      sub: "Response within 24 hours"
    },
    {
      icon: <MapPin size={20} className="text-[#D3AF54]" />,
      title: "Main Office",
      val: "Varanasi, Uttar Pradesh, India",
      sub: "Consultation by Appointment Only"
    },
    {
      icon: <MessageCircle size={20} className="text-[#D3AF54]" />,
      title: "WhatsApp Chat",
      val: "WhatsApp Live Support",
      sub: "Instantly chat with us",
      link: "https://wa.me/919452062153"
    }
  ]

  return (
    <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center px-6 py-12 font-sans text-[#181122]">
      
      {/* ========================================================= */}
      {/* DECORATIVE BACKGROUNDS & PARALLAX                         */}
      {/* ========================================================= */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.04),transparent_70%)] rounded-full -z-10 pointer-events-none"></div>

      {/* Rotating Background Zodiac Motif */}
      <motion.div 
        style={{ y: yZodiac, rotate: rZodiac }}
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02] flex justify-center items-center -z-10"
      >
        <svg className="w-[580px] h-[580px] text-[#AB7A57]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
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
          ✦ GET IN TOUCH ✦
        </span>
        <h1 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-[#181122] tracking-wide leading-tight">
          Connect Personally
        </h1>
        <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-4 mb-4"></div>
        <p className="text-sm md:text-base text-[#181122]/90 leading-relaxed font-sans max-w-xl mx-auto">
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
            <h3 className="font-serif text-xl font-bold text-[#181122] border-b border-[#AB7A57]/20 pb-3">
              Office Details & Support
            </h3>
            
            <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4">
              {contactDetails.map((item, idx) => {
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ x: 6, borderColor: "#D3AF54" }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="bg-[#181122] border border-[#AB7A57]/20 rounded-2xl p-5 flex items-start gap-4 shadow-lg group text-white"
                  >
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer" className="flex items-start gap-4 w-full">
                        <div className="w-10 h-10 rounded-xl bg-[#FFFDEE] border border-[#BDBDBD] text-[#D3AF54] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-white group-hover:text-[#D3AF54] transition-colors">{item.title}</h4>
                          <p className="text-sm font-bold text-[#D3AF54] mt-0.5 hover:underline font-sans">{item.val}</p>
                          <p className="text-[11px] text-[#D8CFEB]/80 mt-1 font-sans">{item.sub}</p>
                        </div>
                      </a>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-[#FFFDEE] border border-[#BDBDBD] text-[#D3AF54] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-white group-hover:text-[#D3AF54] transition-colors">{item.title}</h4>
                          <p className="text-sm font-bold text-white mt-0.5 font-sans">{item.val}</p>
                          <p className="text-[11px] text-[#D8CFEB]/80 mt-1 font-sans">{item.sub}</p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          <div className="p-6 bg-[#06091B] border border-[#AB7A57]/20 rounded-2xl text-left text-white shadow-xl space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#D3AF54]/10 rounded-full blur-xl"></div>
            <Sparkles size={20} className="text-[#D3AF54]/85 animate-pulse" />
            <h4 className="font-serif font-bold text-base text-[#D3AF54]">Vedic Wisdom Guarantee</h4>
            <p className="text-xs text-[#D8CFEB] leading-relaxed font-sans">
              We guarantee 100% data confidentiality. None of your chart inputs, birth credentials, or planetary readings are ever shared with third parties.
            </p>
          </div>
        </motion.div>

        {/* Right Column - Message Form Card */}
        <motion.div variants={itemVariants} className="lg:col-span-7 bg-[#181122] border border-[#AB7A57]/20 rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-500 flex flex-col justify-center text-white">
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-12 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-900/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-3xl shadow-sm animate-pulse">
                ✓
              </div>
              <h4 className="font-serif text-white font-bold text-2xl">Message Dispatched!</h4>
              <p className="text-sm text-[#D8CFEB] max-w-sm mx-auto font-sans leading-relaxed">
                Thank you for your message. We will review your query and connect with you via email or phone within 24 hours.
              </p>
              <CelestialDivider />
              <button 
                onClick={() => {
                  setSubmitted(false)
                  setFormData({ name: "", email: "", subject: "General Inquiry", message: "" })
                }}
                className="bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] border border-[#D3AF54] px-5 py-2 rounded-xl transition duration-300 font-semibold text-xs cursor-pointer shadow-md shadow-[#D3AF54]/10"
              >
                Send Another Message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-5 text-left">
              <h3 className="font-serif text-xl font-bold text-white border-b border-white/10 pb-3">
                Send Direct Message
              </h3>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Full Name <span className="text-[#D3AF54]">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3.5 text-[#D3AF54]/60" />
                    <input 
                      type="text" 
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                    />
                  </div>
                </div>
 
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                    Email Address <span className="text-[#D3AF54]">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3.5 text-[#D3AF54]/60" />
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 placeholder-white/40"
                    />
                  </div>
                </div>
              </div>
 
              <div className="space-y-1.5">
                <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                  Subject of Inquiry <span className="text-[#D3AF54]">*</span>
                </label>
                <select 
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300"
                >
                  <option className="bg-[#181122] text-white">General Inquiry</option>
                  <option className="bg-[#181122] text-white">Vedic Astrology Reading</option>
                  <option className="bg-[#181122] text-white">Numerologist Inquiry</option>
                  <option className="bg-[#181122] text-white">Vastu Consultant Site Audit</option>
                  <option className="bg-[#181122] text-white">Laal Kitaab Remedies Consultation</option>
                  <option className="bg-[#181122] text-white">Expertise in Prashna Kundali</option>
                  <option className="bg-[#181122] text-white">Reiki Healer Session</option>
                </select>
              </div>
 
              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-[#D3AF54]">
                  Your Message <span className="text-[#D3AF54]">*</span>
                </label>
                <textarea 
                  id="message"
                  name="message"
                  required
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Ask your question or detail your consultation request..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 focus:shadow-[0_0_15px_rgba(211,175,84,0.15)] transition-all duration-300 resize-none placeholder-white/40"
                ></textarea>
              </div>
 
              <motion.button 
                type="submit"
                whileHover={{ scale: 1.02, y: -1, boxShadow: "0 10px 20px rgba(211, 175, 84, 0.15), 0 0 15px rgba(211, 175, 84, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-full bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] border border-[#D3AF54] font-semibold py-3 rounded-xl transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4 text-sm"
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

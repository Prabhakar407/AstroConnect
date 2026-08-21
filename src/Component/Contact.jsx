import React, { useState, useEffect } from 'react'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  User, 
  Check, 
  Copy,
  ChevronDown,
  MessageSquare,
  HelpCircle
} from 'lucide-react'
import callLogo from "../assets/logos/Call.png"
import gmailLogo from "../assets/logos/gmail.png"
import mapsLogo from "../assets/logos/google-maps.png"
import waLogo from "../assets/logos/whatsapp.png"

const API_BASE_URL = import.meta.env.DEV 
  ? "http://localhost:8000" 
  : "https://astrologer-kundan-singh.onrender.com"

const faqs = [
  {
    q: "What birth details are required?",
    a: "We need your exact Date of Birth, exact Time of Birth (within a few minutes), and Place of Birth (city and state/country) for precise chart calculations."
  },
  {
    q: "Are consultations online or offline?",
    a: "Both! Online sessions are held via Zoom or Google Meet. In-person consultations are available at Vasant Kunj, Delhi by prior appointment only."
  },
  {
    q: "How long does a session last?",
    a: "Standard readings last between 45 to 60 minutes, which includes chart details analysis and a dedicated Q&A session."
  }
];

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: ""
  })
  
  const [submitted, setSubmitted] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [serverError, setServerError] = useState("")
  const [currentWhatsappUrl, setCurrentWhatsappUrl] = useState("")
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  })
  const [copiedType, setCopiedType] = useState(null)
  const [showFaq, setShowFaq] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  // Help Support form state hooks
  const [showHelpForm, setShowHelpForm] = useState(false)
  const [helpFormData, setHelpFormData] = useState({
    name: "",
    phone: "",
    email: "",
    query: ""
  })
  const [helpSubmitted, setHelpSubmitted] = useState(false)
  const [helpAttemptedSubmit, setHelpAttemptedSubmit] = useState(false)
  const [helpServerError, setHelpServerError] = useState("")
  const [helpErrors, setHelpErrors] = useState({
    name: "",
    phone: "",
    email: "",
    query: ""
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev };
      updated[name] = value;
      return updated;
    })
  }

  const validateContactForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    }
    let isValid = true

    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required."
      isValid = false
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Full Name must be at least 2 characters."
      isValid = false
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required."
      isValid = false
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address (e.g. name@example.com)."
        isValid = false
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile Number is required."
      isValid = false
    } else {
      const cleanPhone = formData.phone.trim().replace(/[\s\-]/g, '')
      let phoneBody = cleanPhone
      if (cleanPhone.startsWith('+91')) {
        phoneBody = cleanPhone.slice(3)
      } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        phoneBody = cleanPhone.slice(2)
      }
      
      const isTenDigits = /^[0-9]{10}$/.test(phoneBody)
      if (!isTenDigits) {
        newErrors.phone = "Mobile number must be exactly 10 digits (excluding +91 country code)."
        isValid = false
      }
    }

    if (!formData.subject) {
      newErrors.subject = "Inquiry Topic is required."
      isValid = false
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required."
      isValid = false
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters."
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  useEffect(() => {
    if (attemptedSubmit) {
      validateContactForm()
    }
  }, [formData, attemptedSubmit])

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    setServerError("")
    
    if (!validateContactForm()) {
      return
    }

    console.log("Submitting Contact Message to Server:", formData)

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Failed to deliver contact message to the server.")
      }

      // Build fallback WhatsApp url
      const messageText = `✦ New Inquiry from Astrology Website ✦\n\n` +
        `👤 Name: ${formData.name.trim()}\n` +
        `📧 Email: ${formData.email.trim()}\n` +
        `📱 Phone: ${formData.phone.trim()}\n` +
        `📌 Subject: ${formData.subject}\n` +
        `💬 Message: ${formData.message.trim()}`

      const encodedText = encodeURIComponent(messageText)
      const whatsappUrl = `https://wa.me/918114292972?text=${encodedText}`
      setCurrentWhatsappUrl(whatsappUrl)

      setSubmitted(true)
    } catch (err) {
      setServerError(err.message || "Failed to connect to the backend server. Please verify that the FastAPI backend is running.")
    }
  }

  const handleCopyText = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const validateHelpForm = () => {
    let isValid = true
    const newErrors = { name: "", phone: "", email: "", query: "" }

    if (!helpFormData.name.trim()) {
      newErrors.name = "Name is required."
      isValid = false
    }
    if (!helpFormData.phone.trim()) {
      newErrors.phone = "Mobile number is required."
      isValid = false
    } else if (!/^\+?[0-9\s\-]{8,20}$/.test(helpFormData.phone)) {
      newErrors.phone = "Please enter a valid mobile number."
      isValid = false
    }
    if (!helpFormData.email.trim()) {
      newErrors.email = "Email is required."
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(helpFormData.email)) {
      newErrors.email = "Please enter a valid email address."
      isValid = false
    }
    if (!helpFormData.query.trim()) {
      newErrors.query = "Query is required."
      isValid = false
    }

    setHelpErrors(newErrors)
    return isValid
  }

  const handleHelpSubmit = async (e) => {
    e.preventDefault()
    setHelpAttemptedSubmit(true)
    setHelpServerError("")

    if (!validateHelpForm()) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/help`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(helpFormData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit support request.")
      }

      setHelpSubmitted(true)
    } catch (err) {
      setHelpServerError(err.message || "Failed to connect to the server.")
    }
  }

  const handleHelpInputChange = (e) => {
    const { name, value } = e.target
    setHelpFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center justify-start font-sans text-[#181122]">
      
      {/* ========================================================= */}
      {/* 2. CONTACT DETAILS & FORM                                 */}
      {/* ========================================================= */}
      <div className="w-full bg-[#FDFCF5] pt-4 sm:pt-6 pb-16 px-4 flex flex-col items-center relative z-10 overflow-hidden">
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.03),transparent_70%)] rounded-full -z-10 pointer-events-none"></div>

        {/* Header Area directly above the box */}
        <div className="text-center max-w-xl relative flex flex-col items-center mb-4">
          <span className="text-[#AB7A57] text-xs sm:text-sm tracking-[0.25em] font-bold uppercase mb-2">
            ✦ CONNECT WITH THE STARS ✦
          </span>
          <div className="w-12 h-[2px] bg-[#D3AF54] mt-2"></div>
        </div>

        {/* Main Split Panel Card */}
        <div className="w-full max-w-4xl bg-white border border-[#AB7A57]/15 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Side: Clean Brand Info Panel */}
          <div className="md:col-span-5 bg-[#181122] text-white p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle Zodiac pattern background overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
              <svg className="w-80 h-80 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
                <circle cx="50" cy="50" r="45" strokeDasharray="2 2" />
                <line x1="50" y1="5" x2="50" y2="95" />
                <line x1="5" y1="50" x2="95" y2="50" />
              </svg>
            </div>

            <div className="space-y-6 relative z-10 text-left">
              <div>
                {/* Styled div overrides default h2 color of var(--color-plum-plate) in index.css */}
                <div className="font-serif font-bold text-2xl" style={{ color: '#D3AF54' }}>
                  Astroadvice Studio
                </div>
                <p className="text-sm text-[#D8CFEB] mt-2 leading-relaxed">
                  Guiding seekers with authentic Vedic forecasts and planetary transits support.
                </p>
              </div>

              {/* Compact Details Rows */}
              <div className="space-y-4 pt-2">
                {/* WhatsApp Row */}
                <a 
                  href="https://wa.me/918527790801" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 group hover:text-[#D3AF54] transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <img src={waLogo} alt="WhatsApp" className="w-5.5 h-5.5 object-contain" />
                  </div>
                  <div>
                    <div className="text-xs uppercase font-serif font-bold tracking-wider leading-none" style={{ color: '#AB7A57' }}>
                      WhatsApp Support
                    </div>
                    <p className="text-sm font-semibold text-[#D8CFEB] mt-1 group-hover:text-white transition-colors">Start Live Chat</p>
                  </div>
                </a>

                {/* Call Rows */}
                <div className="flex flex-col gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 w-full">
                  <div className="flex items-center justify-between group">
                    <a href="tel:+918130808758" className="flex items-center gap-3 hover:text-[#D3AF54] transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <img src={callLogo} alt="Call" className="w-4.5 h-4.5 object-contain" />
                      </div>
                      <div>
                        <div className="text-xs uppercase font-serif font-bold tracking-wider leading-none" style={{ color: '#AB7A57' }}>
                          Call Helpline 1
                        </div>
                        <p className="text-sm font-semibold text-[#D8CFEB] mt-1">+91 8130808758</p>
                      </div>
                    </a>
                    <button 
                      type="button"
                      onClick={() => handleCopyText("+918130808758", "phone")}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#D8CFEB] hover:text-[#D3AF54] transition cursor-pointer relative shrink-0"
                    >
                      {copiedType === "phone" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copiedType === "phone" && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow">Copied</span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between group border-t border-white/5 pt-3">
                    <a href="tel:+918527790801" className="flex items-center gap-3 hover:text-[#D3AF54] transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <img src={callLogo} alt="Call" className="w-4.5 h-4.5 object-contain" />
                      </div>
                      <div>
                        <div className="text-xs uppercase font-serif font-bold tracking-wider leading-none" style={{ color: '#AB7A57' }}>
                          Call Helpline 2
                        </div>
                        <p className="text-sm font-semibold text-[#D8CFEB] mt-1">+91 8527790801</p>
                      </div>
                    </a>
                    <button 
                      type="button"
                      onClick={() => handleCopyText("+918527790801", "phone2")}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#D8CFEB] hover:text-[#D3AF54] transition cursor-pointer relative shrink-0"
                    >
                      {copiedType === "phone2" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copiedType === "phone2" && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow">Copied</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Email Row */}
                <div className="flex items-center justify-between group">
                  <a href="mailto:astroadvicebyks@gmail.com" className="flex items-center gap-3 hover:text-[#D3AF54] transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <img src={gmailLogo} alt="Email" className="w-4.5 h-4.5 object-contain" />
                    </div>
                    <div>
                      <div className="text-xs uppercase font-serif font-bold tracking-wider leading-none" style={{ color: '#AB7A57' }}>
                        Email Helpline
                      </div>
                      <p className="text-sm font-semibold text-[#D8CFEB] mt-1 truncate max-w-[140px] sm:max-w-none">astroadvicebyks@gmail.com</p>
                    </div>
                  </a>
                  <button 
                    type="button"
                    onClick={() => handleCopyText("astroadvicebyks@gmail.com", "email")}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#D8CFEB] hover:text-[#D3AF54] transition cursor-pointer relative shrink-0"
                  >
                    {copiedType === "email" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedType === "email" && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow">Copied</span>
                    )}
                  </button>
                </div>

                {/* Office Location */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#D3AF54] shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="text-xs uppercase font-serif font-bold tracking-wider leading-none" style={{ color: '#AB7A57' }}>
                      Main Office
                    </div>
                    <p className="text-sm text-[#D8CFEB] mt-1">Vasant Kunj, Delhi, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Hours / Map Button */}
            <div className="pt-6 border-t border-white/10 mt-6 relative z-10 text-left">
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <Clock size={13} />
                <span>Mon - Sat: 10:00 AM - 12:00 PM & 3:00 PM - 6:00 PM</span>
              </p>
              <a 
                href="https://www.google.com/maps/place/Varanasi,+Uttar+Pradesh/@25.3216181,82.9087063" 
                target="_blank" 
                rel="noreferrer"
                className="mt-4 w-full bg-white/5 border border-white/10 hover:bg-[#D3AF54] text-[#D8CFEB] hover:text-[#181122] text-xs uppercase font-bold py-2.5 rounded-xl transition duration-300 flex items-center justify-center gap-1.5 shadow"
              >
                <img src={mapsLogo} alt="Maps" className="w-4.5 h-4.5 object-contain" />
                <span>Open Google Directions</span>
              </a>
            </div>
          </div>

          {/* Right Side: Clean Compact Form Panel */}
          <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-center">
            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-emerald-600 text-xl mx-auto shadow-sm">
                  ✓
                </div>
                <h4 className="font-serif font-bold text-[#181122] text-lg tracking-wide">Message Submitted!</h4>
                <p className="text-[11px] text-slate-500 font-sans max-w-xs mx-auto leading-relaxed">
                  Thank you. Your inquiry has been received by our server and saved locally in `local_contacts.json`. If SMS credentials are set, it has been sent directly to +91 8114292972.
                </p>
                
                <div className="max-w-xs mx-auto pt-2 flex flex-col gap-2.5">
                  {/* WhatsApp backup live-chat direct link */}
                  <a 
                    href={currentWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 text-xs shadow w-full uppercase tracking-wider font-sans cursor-pointer hover:scale-[1.02]"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.022-.079-.186-.208-.432-.332-.246-.125-1.453-.717-1.677-.799-.224-.083-.388-.124-.552.124-.164.248-.636.799-.78 1.002-.144.202-.288.227-.534.103-.247-.124-.967-.356-1.842-1.139-.68-.606-1.138-1.353-1.272-1.584-.134-.23-.014-.354.11-.478.11-.112.247-.29.37-.435.124-.144.164-.247.247-.413.082-.164.041-.309-.02-.433-.062-.124-.552-1.332-.756-1.823-.198-.477-.399-.413-.55-.413-.142-.002-.306-.002-.471-.002-.165 0-.435.062-.662.309-.227.247-.866.845-.866 2.062 0 1.218.887 2.395.986 2.548.099.15 1.745 2.664 4.228 3.733.59.255 1.05.408 1.408.522.593.189 1.133.162 1.558.1.474-.071 1.453-.593 1.657-1.137.204-.544.204-1.01.144-1.107L17.472 14.382zM12 2C6.478 2 2 6.478 2 12c0 1.91.536 3.693 1.464 5.228L2 22l4.908-1.294C8.36 21.572 10.106 22 12 22c5.522 0 10-4.478 10-10S17.522 2 12 2zm0 18c-1.634 0-3.15-.472-4.436-1.282l-.318-.202-2.923.77.784-2.85-.22-.352C3.968 14.86 3.5 13.5 3.5 12c0-4.687 3.813-8.5 8.5-8.5s8.5 3.813 8.5 8.5-3.813 8.5-8.5 8.5z"/>
                    </svg>
                    <span>Chat on WhatsApp (Backup)</span>
                  </a>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => {
                    setSubmitted(false)
                    setAttemptedSubmit(false)
                    setCurrentWhatsappUrl("")
                    setFormData({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" })
                  }}
                  className="text-slate-400 hover:text-slate-600 transition text-[11px] underline mt-3 block mx-auto cursor-pointer font-sans"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                {serverError && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs text-center font-sans tracking-wide">
                    ⚠️ {serverError}
                  </div>
                )}
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-[11px] font-bold text-[#AB7A57] uppercase tracking-wider">
                    Full Name <span className="text-[#D3AF54]">*</span>
                  </label>
                  <div className="relative">
                    <User size={13} className="absolute left-3.5 top-3.5 text-[#AB7A57]" />
                    <input 
                      type="text" 
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#FDFCF5] border border-[#AB7A57]/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#181122] focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition font-sans"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-[10px] font-sans font-medium mt-1">⚠️ {errors.name}</p>
                  )}
                </div>

                {/* Email and Phone row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[11px] font-bold text-[#AB7A57] uppercase tracking-wider">
                      Email Address <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3.5 top-3.5 text-[#AB7A57]" />
                      <input 
                        type="text" 
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. john@example.com"
                        className="w-full bg-[#FDFCF5] border border-[#AB7A57]/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#181122] focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition font-sans"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-[10px] font-sans font-medium mt-1">⚠️ {errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-[11px] font-bold text-[#AB7A57] uppercase tracking-wider">
                      Mobile Number <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3.5 top-3.5 text-[#AB7A57]" />
                      <input 
                        type="tel" 
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-[#FDFCF5] border border-[#AB7A57]/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#181122] focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition font-sans"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-[10px] font-sans font-medium mt-1">⚠️ {errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Subject Selector dropdown */}
                <div className="space-y-1.5 relative">
                  <label htmlFor="subject" className="block text-[11px] font-bold text-[#AB7A57] uppercase tracking-wider">
                    Inquiry Topic
                  </label>
                  <div className="relative">
                    <MessageSquare size={13} className="absolute left-3.5 top-3.5 text-[#AB7A57]" />
                    <select 
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full bg-[#FDFCF5] border border-[#AB7A57]/30 rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#181122] focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition appearance-none cursor-pointer font-serif font-bold"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Birth Chart Reading">Birth Chart Reading</option>
                      <option value="Match Making (Kundli Milan)">Match Making (Kundli Milan)</option>
                      <option value="Vastu Consultation">Vastu Consultation</option>

                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-3.5 text-[#AB7A57] pointer-events-none" />
                  </div>
                </div>

                {/* Message Box */}
                <div className="space-y-1.5">
                  <label htmlFor="message" className="block text-[11px] font-bold text-[#AB7A57] uppercase tracking-wider">
                    Your Message / Question <span className="text-[#D3AF54]">*</span>
                  </label>
                  <textarea 
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Describe your situation or list any key questions you want answered..."
                    className="w-full bg-[#FDFCF5] border border-[#AB7A57]/30 rounded-xl px-4 py-2.5 text-xs text-[#181122] focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition min-h-[100px] resize-none font-sans"
                  />
                  {errors.message && (
                    <p className="text-red-500 text-[10px] font-sans font-medium mt-1">⚠️ {errors.message}</p>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#181122] hover:bg-[#D3AF54] text-white hover:text-[#181122] font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-1.5 text-sm uppercase tracking-wider cursor-pointer shadow"
                >
                  <Send size={12} />
                  <span>Submit Message</span>
                </button>

              </form>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. FAQ ACCORDION SECTION (Warm Sand bg-[#EDE9D7])          */}
      {/* ========================================================= */}
      <div className="w-full bg-[#EDE9D7] py-16 px-4 flex flex-col items-center relative z-10">
        <div className="w-full max-w-4xl px-4">
          
          {/* Toggle Bar */}
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="mx-auto flex items-center justify-center gap-1.5 text-sm font-serif font-bold text-[#AB7A57] hover:text-[#181122] transition-colors focus:outline-none cursor-pointer"
          >
            <HelpCircle size={15} />
            <span>{showFaq ? "Hide Frequently Asked Questions" : "Show Frequently Asked Questions"}</span>
            <ChevronDown size={15} className={`transform transition-transform duration-300 ${showFaq ? "rotate-180" : ""}`} />
          </button>

          {showFaq && (
            <div className="mt-4 space-y-2.5 max-w-2xl mx-auto transition-all duration-300">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="border border-slate-200 rounded-xl bg-white text-left overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-5 py-3 flex items-center justify-between text-left text-sm font-serif font-bold text-[#181122] hover:text-[#AB7A57] focus:outline-none cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={13} className={`text-[#D3AF54] transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1.5 text-sm text-slate-600 border-t border-slate-100 leading-relaxed font-sans">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>


      {/* ========================================================= */}
      {/* 4. HELP / SUPPORT POINT SECTION                            */}
      {/* ========================================================= */}
      <div className="w-full bg-[#181122] py-16 px-4 flex flex-col items-center border-t border-white/5 relative z-10 text-white">
        <div className="w-full max-w-md mx-auto text-center space-y-6">
          {!showHelpForm ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => setShowHelpForm(true)}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-[#D3AF54]/40 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group shadow-xl flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#D3AF54]/10 border border-[#D3AF54]/30 flex items-center justify-center text-[#D3AF54] group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <HelpCircle size={28} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#D3AF54] transition-colors">Need Help or Support?</h4>
                <p className="text-xs text-[#D8CFEB] max-w-sm mx-auto leading-relaxed">
                  Have questions about our platform or need assistance? Click here to raise a support query directly.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-6 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D3AF54]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#D3AF54]/10 border border-[#D3AF54]/25 flex items-center justify-center text-[#D3AF54]">
                    <HelpCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white">Submit Help Ticket</h4>
                    <p className="text-[10px] text-slate-400">Response will be sent to your email</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowHelpForm(false)
                    setHelpSubmitted(false)
                    setHelpAttemptedSubmit(false)
                    setHelpFormData({ name: "", phone: "", email: "", query: "" })
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {helpSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-8 flex flex-col items-center justify-center text-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Check size={24} />
                  </div>
                  <h5 className="font-serif font-bold text-base text-white">Query Submitted</h5>
                  <p className="text-xs text-[#D8CFEB] max-w-xs leading-relaxed">
                    Your request has been successfully dispatched to support. We will get back to you shortly at the email address provided.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleHelpSubmit} className="space-y-4">
                  {helpServerError && (
                    <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs text-center font-sans tracking-wide">
                      ⚠️ {helpServerError}
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#D3AF54] uppercase tracking-wider">Your Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={helpFormData.name}
                      onChange={handleHelpInputChange}
                      placeholder="Enter your name"
                      className="w-full bg-[#181122] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#D3AF54] transition"
                    />
                    {helpAttemptedSubmit && helpErrors.name && <p className="text-red-500 text-[10px] mt-1">⚠️ {helpErrors.name}</p>}
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#D3AF54] uppercase tracking-wider">Mobile Number</label>
                    <input 
                      type="text" 
                      name="phone"
                      value={helpFormData.phone}
                      onChange={handleHelpInputChange}
                      placeholder="Enter mobile number"
                      className="w-full bg-[#181122] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#D3AF54] transition"
                    />
                    {helpAttemptedSubmit && helpErrors.phone && <p className="text-red-500 text-[10px] mt-1">⚠️ {helpErrors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#D3AF54] uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={helpFormData.email}
                      onChange={handleHelpInputChange}
                      placeholder="Enter email address"
                      className="w-full bg-[#181122] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#D3AF54] transition"
                    />
                    {helpAttemptedSubmit && helpErrors.email && <p className="text-red-500 text-[10px] mt-1">⚠️ {helpErrors.email}</p>}
                  </div>

                  {/* Query */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#D3AF54] uppercase tracking-wider">Describe Your Query</label>
                    <textarea 
                      name="query"
                      rows={3}
                      value={helpFormData.query}
                      onChange={handleHelpInputChange}
                      placeholder="What do you need help with?"
                      className="w-full bg-[#181122] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#D3AF54] transition resize-none"
                    />
                    {helpAttemptedSubmit && helpErrors.query && <p className="text-red-500 text-[10px] mt-1">⚠️ {helpErrors.query}</p>}
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-semibold py-2.5 rounded-xl transition text-xs uppercase tracking-wider cursor-pointer shadow-md font-sans"
                  >
                    Submit Query
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </div>


    </div>
  )
}

export default Contact

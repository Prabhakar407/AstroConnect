import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Send, MapPin, User, Mail, Phone, ChevronLeft, ChevronRight, ShieldCheck, RefreshCw } from 'lucide-react'
import EmailOtpModal from './EmailOtpModal'
import { useSearchParams } from 'react-router-dom'
import catalogue from '../data/consultationCatalogue.json'
import { requestJson, sendVerification } from '../lib/formApi'
import { dateInPolicy, todayInIndia, slotTimes, slotLabel, formatFee } from '../lib/bookingPolicy'
import useBookingSchedule from '../lib/useBookingSchedule'
import { createReceipt, forgetReceipt, readReceipt, rememberReceipt } from '../lib/requestReceipt'

let razorpayLoader

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (razorpayLoader) return razorpayLoader
  razorpayLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-astro-razorpay]')
    const script = existing || document.createElement('script')
    const failed = () => reject(new Error('The secure payment window could not load. Check your connection and try again.'))
    script.addEventListener('load', () => window.Razorpay ? resolve(window.Razorpay) : failed(), { once: true })
    script.addEventListener('error', failed, { once: true })
    if (!existing) {
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.dataset.astroRazorpay = 'true'
      document.head.appendChild(script)
    }
  }).catch(error => {
    razorpayLoader = null
    throw error
  })
  return razorpayLoader
}

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
  const [searchParams] = useSearchParams()
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
    readingType: catalogue.some(service => service.id === searchParams.get('service')) ? searchParams.get('service') : 'vedic-astrology',
    questionCount: 1,
    bookingDate: "",
    bookingSlot: "",
    notes: ""
  })

  const { policy, slots: slotAvailability, error: availabilityError, loading: availabilityLoading, retry } = useBookingSchedule(formData.bookingDate)
  const bookingEnabled = policy?.booking_enabled === true
  const today = policy?.first_date || todayInIndia()
  const [serverQuote, setServerQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [quoteRetry, setQuoteRetry] = useState(0)
  const verifiedDraft = useRef(null)
  const receipt = useRef(null)
  const selectedService = catalogue.find(service => service.id === formData.readingType) || catalogue[0]
  const currentQuote = serverQuote?.service_id === formData.readingType && serverQuote?.question_count === formData.questionCount ? serverQuote : null
  const totalFee = currentQuote?.amount_paise ?? selectedService.amount_paise * (selectedService.per_question ? formData.questionCount : 1)
  
  const [submitted, setSubmitted] = useState(false)
  const [checkout, setCheckout] = useState(null)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [recoveryChecking, setRecoveryChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [noticeMsg, setNoticeMsg] = useState("")
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const bookingBlocked = loading || !bookingEnabled || !currentQuote || Boolean(quoteError) || availabilityLoading || Boolean(availabilityError) || slotAvailability[formData.bookingSlot] !== true

  const [currentYear, setCurrentYear] = useState(Number(today.slice(0, 4)))
  const [currentMonth, setCurrentMonth] = useState(Number(today.slice(5, 7)) - 1)

  const receiptOptions = () => ({ headers: { 'X-Astro-Receipt': receipt.current.secret } })

  const acceptBookingStatus = (data) => {
    if (!data || typeof data.booking_id !== 'string') throw new Error('We could not confirm the appointment status.')
    if (data.appointment_state === 'expired' && data.payment_state === 'not_received') {
      forgetReceipt('booking')
      receipt.current = null
      verifiedDraft.current = null
      setCheckout(null)
      setSubmitted(false)
      setRemainingSeconds(0)
      setPaymentMessage('')
      setNoticeMsg('Your previous reservation expired. Please choose a new available time.')
      return data
    }
    if (data.appointment_state === 'confirmed' && data.payment_state === 'received') {
      setCheckout(data)
      setSubmitted(true)
      return data
    }
    setCheckout(data)
    if (data.hold_expires_at && data.server_now) {
      setRemainingSeconds(Math.max(0, Math.ceil((Date.parse(data.hold_expires_at) - Date.parse(data.server_now)) / 1000)))
    }
    return data
  }

  const checkBookingStatus = async () => {
    if (!receipt.current) return
    setLoading(true)
    setPaymentMessage('')
    try {
      const data = await requestJson('/api/checkout/resume', { request_id: receipt.current.id }, 'POST', receiptOptions())
      acceptBookingStatus(data)
    } catch (error) {
      setPaymentMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = readReceipt('booking')
    if (!saved) {
      setRecoveryChecking(false)
      return
    }
    receipt.current = saved
    requestJson('/api/checkout/resume', { request_id: saved.id }, 'POST', { headers: { 'X-Astro-Receipt': saved.secret } })
      .then(acceptBookingStatus)
      .catch(error => {
        if (error.status === 403 || error.status === 404) {
          forgetReceipt('booking')
          receipt.current = null
        } else {
          setPaymentMessage(error.message)
        }
      })
      .finally(() => setRecoveryChecking(false))
  }, [])

  useEffect(() => {
    if (!checkout || submitted || checkout.appointment_state !== 'held' || remainingSeconds <= 0) return
    const timer = window.setInterval(() => setRemainingSeconds(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [checkout, submitted, remainingSeconds])

  useEffect(() => {
    let active = true
    setQuoteError('')
    setServerQuote(null)
    requestJson(`/api/quote?service_id=${formData.readingType}&question_count=${formData.questionCount}`)
      .then(data => {
        if (data.service_id !== formData.readingType || data.question_count !== formData.questionCount ||
            !Number.isSafeInteger(data.amount_paise) || data.amount_paise <= 0 || data.currency !== 'INR' ||
            data.duration_minutes !== 30 || !/^[a-f0-9]{64}$/.test(data.quote_version)) throw new Error('We could not confirm the fee. Please try again.')
        if (active) setServerQuote(data)
      }).catch(error => { if (active) { setServerQuote(null); setQuoteError(error.message) } })
    return () => { active = false }
  }, [formData.readingType, formData.questionCount, quoteRetry])

  useEffect(() => {
    if (!policy) return
    const month = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    if (month < policy.first_date.slice(0, 7) || month > policy.last_date.slice(0, 7)) {
      setCurrentYear(Number(policy.first_date.slice(0, 4)))
      setCurrentMonth(Number(policy.first_date.slice(5, 7)) - 1)
    }
    setFormData(previous => previous.bookingDate && !dateInPolicy(previous.bookingDate, policy)
      ? { ...previous, bookingDate: '', bookingSlot: '' } : previous)
  }, [policy, currentYear, currentMonth])

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay()

  const handlePrevMonth = () => {
    if (!policy || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}` <= policy.first_date.slice(0, 7)) return
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (!policy || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}` >= policy.last_date.slice(0, 7)) return
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
      bookingDate: dateStr,
      bookingSlot: ''
    }))
  }

  const isToday = (day) => {
    return today === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isDateSelected = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0')
    const formattedDay = String(day).padStart(2, '0')
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`
    return formData.bookingDate === dateStr
  }

  const isPastDay = (day) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return availabilityLoading || Boolean(availabilityError) || !dateInPolicy(date, policy)
  }

  const validateForm = useCallback(() => {
    if (formData.name.trim().length < 2 || formData.name.trim().length > 100) {
      return "Please enter your full name, between 2 and 100 characters.";
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
    const cleanPhone = formData.phone.trim().replace(/[\s().-]/g, '')
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return "Please enter a valid mobile number (e.g. 9876543210).";
    }
    if (!formData.birthDate || formData.birthDate > today) {
      return "Please enter a birth date that is not in the future.";
    }
    if (formData.birthPlace.trim().length > 200 || formData.notes.trim().length > 4000) {
      return "Please keep the birth place under 200 characters and notes under 4,000 characters.";
    }
    if (!dateInPolicy(formData.bookingDate, policy)) {
      return "Please select a date from the calendar grid.";
    }
    if (!formData.bookingSlot || slotAvailability[formData.bookingSlot] !== true) {
      return "Please select a time slot.";
    }
    return null;
  }, [formData, policy, slotAvailability, today])

  useEffect(() => {
    if (attemptedSubmit) {
      const err = validateForm()
      setErrorMsg(err || "")
    }
  }, [attemptedSubmit, validateForm])

  const handleInputChange = (e) => {
    if (loading || showOtpModal) return
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'questionCount' ? Number(value) : value,
      ...(name === 'readingType' ? { questionCount: 1 } : {})
    }))
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    setNoticeMsg('')
    
    const validationError = validateForm()
    if (validationError) {
      setErrorMsg(validationError)
      const formElement = document.getElementById("booking-form")
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }

    // Payment readiness and accepted email dispatch both precede verification.
    if (bookingBlocked) return
    setLoading(true)
    setErrorMsg("")

    // A rejected email request must remain an error, never a success state.
    try {
      const freshQuote = await requestJson(`/api/quote?service_id=${formData.readingType}&question_count=${formData.questionCount}`)
      if (freshQuote.quote_version !== currentQuote.quote_version) {
        setServerQuote(null)
        setQuoteError('The fee has changed. Please reselect your consultation and review the updated total.')
        return
      }
      verifiedDraft.current = { ...formData, quoteVersion: currentQuote.quote_version }
      await sendVerification(verifiedDraft.current.email, 'booking')
      setShowOtpModal(true)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const executeBooking = async (verificationToken) => {
    // Email verification alone is not a booking confirmation.
    setShowOtpModal(false)
    setLoading(true)
    setErrorMsg("")

    const draft = verifiedDraft.current
    if (!draft) { setLoading(false); return }
    if (!receipt.current) receipt.current = createReceipt()
    rememberReceipt('booking', receipt.current)

    try {
      const data = await requestJson('/api/checkout', {
        request_id: receipt.current.id,
        full_name: draft.name,
        email: draft.email,
        phone: draft.phone,
        service_id: draft.readingType,
        question_count: draft.questionCount,
        date: draft.bookingDate,
        time_slot: draft.bookingSlot,
        duration_minutes: 30,
        birth_date: draft.birthDate,
        birth_time: draft.birthTime,
        birth_place: draft.birthPlace,
        notes: draft.notes,
        quote_version: draft.quoteVersion,
        verification_token: verificationToken,
      }, 'POST', { headers: { 'X-Astro-Receipt': receipt.current.secret } })
      acceptBookingStatus(data)
      if (data.order_state !== 'ready' || !data.order_id) {
        setPaymentMessage('Your time is reserved, but secure payment is still being prepared. Check again in a moment; do not start another booking.')
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openPayment = async () => {
    if (!checkout || checkout.order_state !== 'ready' || checkout.appointment_state !== 'held' || remainingSeconds <= 0) return
    setLoading(true)
    setPaymentMessage('')
    try {
      const Razorpay = await loadRazorpayCheckout()
      const draft = verifiedDraft.current || formData
      const payment = new Razorpay({
        key: checkout.payment_key_id,
        amount: checkout.amount_paise,
        currency: checkout.currency,
        name: 'AstroAdvice by Kundan Singh',
        description: checkout.service_name,
        order_id: checkout.order_id,
        prefill: { name: draft.name, email: draft.email, contact: draft.phone },
        theme: { color: '#D3AF54' },
        modal: {
          ondismiss: () => setPaymentMessage('Payment was not completed. Your time remains reserved until the timer ends, and you can safely try the same payment again.'),
        },
        handler: async response => {
          setLoading(true)
          setPaymentMessage('Confirming the payment securely…')
          try {
            const data = await requestJson('/api/checkout/verify-payment', {
              request_id: receipt.current.id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }, 'POST', receiptOptions())
            acceptBookingStatus(data)
            if (data.appointment_state !== 'confirmed') {
              setPaymentMessage(data.payment_state === 'needs_attention'
                ? 'Your payment needs a manual check. Please do not pay again; the studio will review it.'
                : 'Razorpay is still confirming the payment. Please check the status again in a moment.')
            }
          } catch (error) {
            setPaymentMessage(`${error.message} Please do not start another payment; use “Check payment status” first.`)
          } finally {
            setLoading(false)
          }
        },
      })
      payment.on('payment.failed', () => {
        setPaymentMessage('The payment did not go through. No appointment has been confirmed; you can retry while the timer is running.')
      })
      payment.open()
    } catch (error) {
      setPaymentMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetBooking = () => {
    forgetReceipt('booking')
    receipt.current = null
    verifiedDraft.current = null
    setSubmitted(false)
    setCheckout(null)
    setPaymentMessage('')
    setNoticeMsg('')
    setErrorMsg('')
    setAttemptedSubmit(false)
    setRemainingSeconds(0)
    setFormData({
      name: '', phone: '', email: '', birthDate: '', birthTime: '', birthPlace: '',
      readingType: 'vedic-astrology', bookingDate: '', bookingSlot: '', questionCount: 1, notes: '',
    })
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center font-sans text-[#181122]">
      
      {/* ========================================================= */}
      {/* 1. HEADER SECTION (Warm Ivory bg-[#F4F1E3])               */}
      {/* ========================================================= */}
      <div className="w-full bg-[#F4F1E3] px-6 pt-7 pb-3 lg:pt-4 lg:pb-2 flex flex-col items-center relative z-10 border-b border-[#AB7A57]/10">
        
        {/* Decorative backgrounds & rotating zodiac inside header wrapper */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ y: yHeader }}
          className="text-center max-w-2xl relative z-10"
        >
          <span className="text-[#AB7A57] text-xs tracking-[0.25em] font-bold uppercase block mb-2 font-sans">
            ✦ RESERVE YOUR SPOT ✦
          </span>
          <h1 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-[#181122] tracking-wide leading-tight">
            Schedule A Consultation
          </h1>
          <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-3 mb-1"></div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* 2. BOOKING FORM CONTAINER (Pure White bg-white)           */}
      {/* ========================================================= */}
      <div className="w-full bg-white py-5 px-4 flex flex-col items-center relative z-10 overflow-hidden">
        
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

        <div className="w-full max-w-[1600px] lg:w-[88vw] bg-[#181122] border border-[#AB7A57]/20 rounded-2xl p-4 shadow-xl relative text-white">
          
          {recoveryChecking ? (
            <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#F4E6BE]">
              <RefreshCw size={18} className="animate-spin" /> Checking for an appointment already in progress…
            </div>
          ) : submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-12 space-y-3"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-900/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-3xl shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
                ✓
              </div>
              <h4 className="font-serif text-white font-bold text-xl md:text-2xl">Your appointment is confirmed</h4>
              <p className="text-sm text-[#D8CFEB] max-w-lg font-sans leading-relaxed">
                {checkout?.meeting_state === 'ready'
                  ? 'Payment, appointment and Google Meet are ready. Your calendar invitation is being delivered separately.'
                  : checkout?.meeting_state === 'needs_attention'
                    ? 'Payment is confirmed, but the studio needs to finish the Google Meet invitation. You do not need to pay again.'
                    : 'Payment has been received. We are preparing the calendar invitation and Google Meet link for both you and the studio.'}
              </p>
              {checkout?.meet_url && <a href={checkout.meet_url} target="_blank" rel="noreferrer"
                className="min-h-11 rounded-xl bg-[#D3AF54] px-6 py-2.5 text-sm font-semibold text-[#181122]">Open Google Meet</a>}
              {checkout?.booking_id && <p className="max-w-full break-all text-xs text-white/65">Reference: {checkout.booking_id}</p>}
              <CelestialDivider />
              {checkout?.meeting_state !== 'ready' && <button type="button" onClick={checkBookingStatus} disabled={loading}
                className="min-h-11 rounded-xl border border-[#D3AF54]/65 px-5 py-2.5 text-sm font-semibold text-[#F4E6BE] disabled:opacity-60">
                {loading ? 'Checking…' : 'Check invitation status'}
              </button>}
              <button 
                onClick={resetBooking}
                className="bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] border border-[#D3AF54] px-5 py-2 rounded-xl transition duration-300 font-semibold text-xs sm:text-sm cursor-pointer shadow-md shadow-[#D3AF54]/10"
              >
                Book Another Session
              </button>
            </motion.div>
          ) : checkout ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              aria-labelledby="payment-heading"
              className="mx-auto flex max-w-2xl flex-col gap-5 py-7 sm:py-10"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D3AF54]/15 text-[#D3AF54]">
                  <ShieldCheck size={22} />
                </span>
                <div className="min-w-0">
                  <h2 id="payment-heading" className="font-serif text-xl font-semibold text-white sm:text-2xl">
                    {checkout.appointment_state === 'payment_review' ? 'Your payment is being checked' :
                      checkout.appointment_state === 'cancelled' ? 'This appointment was cancelled' :
                        checkout.appointment_state === 'expired' ? 'This reservation has ended' : 'Your time is reserved'}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">
                    {checkout.appointment_state === 'held'
                      ? `${checkout.service_name} · ${formatFee(checkout.amount_paise)} · 30 minutes`
                      : checkout.appointment_state === 'payment_review'
                        ? 'Please do not pay again. The studio can see this exception and will check it.'
                        : checkout.appointment_state === 'cancelled'
                          ? 'This appointment is no longer active. Cancellation does not automatically issue a refund; please call the studio with any payment question.'
                          : 'No payment should be made against this expired reservation. Choose a fresh available time.'}
                  </p>
                </div>
              </div>

              {checkout.appointment_state === 'held' && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D3AF54]">Reservation time left</p>
                    <p aria-live="polite" className="mt-1 font-serif text-2xl font-semibold text-white">
                      {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')}
                    </p>
                  </div>
                  {checkout.payment_key_id?.startsWith('rzp_test_') && (
                    <p className="max-w-xs text-sm leading-relaxed text-amber-200">Test Mode is active. This checkout cannot collect real money.</p>
                  )}
                </div>
              )}

              {paymentMessage && <p role="status" className="rounded-xl bg-white/7 px-4 py-3 text-sm leading-relaxed text-[#F4E6BE]">{paymentMessage}</p>}

              <div className="flex flex-wrap gap-3">
                {checkout.appointment_state === 'held' && checkout.order_state === 'ready' && remainingSeconds > 0 && (
                  <button type="button" onClick={openPayment} disabled={loading}
                    className="min-h-11 rounded-xl bg-[#D3AF54] px-6 py-2.5 text-sm font-semibold text-[#181122] transition hover:bg-[#E1BE65] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4E6BE] disabled:cursor-wait disabled:opacity-60">
                    {loading ? 'Preparing secure payment…' : `Pay ${formatFee(checkout.amount_paise)} securely`}
                  </button>
                )}
                {(checkout.appointment_state === 'held' || checkout.appointment_state === 'payment_review') && (
                  <button type="button" onClick={checkBookingStatus} disabled={loading}
                    className="min-h-11 rounded-xl border border-[#D3AF54]/65 px-5 py-2.5 text-sm font-semibold text-[#F4E6BE] transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4E6BE] disabled:cursor-wait disabled:opacity-60">
                    Check payment status
                  </button>
                )}
                {(checkout.appointment_state === 'expired' || checkout.appointment_state === 'cancelled' ||
                  (checkout.appointment_state === 'held' && remainingSeconds === 0)) && (
                  <button type="button" onClick={resetBooking}
                    className="min-h-11 rounded-xl bg-[#D3AF54] px-6 py-2.5 text-sm font-semibold text-[#181122]">
                    Choose another time
                  </button>
                )}
              </div>
              <p className="break-all text-xs leading-relaxed text-white/55">Booking reference: {checkout.booking_id}</p>
            </motion.section>
          ) : (
            <motion.form 
              id="booking-form"
              onSubmit={handleBookingSubmit} 
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 xl:gap-3 items-start scroll-mt-20 w-full"
            >
              {noticeMsg && <p role="status" className="col-span-1 lg:col-span-2 xl:col-span-3 rounded-xl border border-[#D3AF54]/30 bg-[#D3AF54]/10 px-4 py-3 text-sm leading-relaxed text-[#F4E6BE]">
                {noticeMsg}
              </p>}
              {!bookingEnabled && <p role="status" className="col-span-1 lg:col-span-2 xl:col-span-3 rounded-xl border border-[#D3AF54]/30 bg-[#D3AF54]/10 px-4 py-3 text-sm leading-relaxed text-[#F4E6BE]">
                Online booking is being configured. To arrange an appointment, please call <a href="tel:+918527790801" className="font-semibold underline">+91 85277 90801</a>.
              </p>}
              {/* Error Message Display (Real-time Validation Alert) */}
              {errorMsg && !availabilityError && (
                <motion.div 
                  role="alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-1 lg:col-span-2 xl:col-span-3 p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs md:text-sm text-center font-sans tracking-wide leading-relaxed shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                >
                  ⚠️ {errorMsg}
                </motion.div>
              )}

              <div className="contents xl:flex xl:flex-col xl:gap-3">
                {/* Step 1: Personal Contact Details Card */}
                <motion.div variants={itemVariants} className="space-y-3 text-left bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col justify-start">
                <h3 className="font-serif text-sm sm:text-base font-bold !text-[#D3AF54] border-b border-[#AB7A57]/20 pb-1.5">
                  Personal Contact Details
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Full Name <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-2.5 text-[#D3AF54]/60" />
                      <input 
                        type="text" 
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition-all duration-300 placeholder-white/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Email Address <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-2.5 text-[#D3AF54]/60" />
                      <input 
                        type="email" 
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your email"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition-all duration-300 placeholder-white/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Mobile Number <span className="text-[#D3AF54]">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-2.5 text-[#D3AF54]/60" />
                      <input 
                        type="tel" 
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition-all duration-300 placeholder-white/40"
                      />
                    </div>
                  </div>
                </div>
                </motion.div>

                {/* Step 2: Cosmic Birth Credentials Card */}
                <motion.div variants={itemVariants} className="space-y-3 text-left bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col justify-start">
                <h3 className="font-serif text-sm sm:text-base font-bold !text-[#D3AF54] border-b border-[#AB7A57]/20 pb-1.5">
                  Birth Details
                </h3>
                    
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="birthDate" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Date of Birth <span className="text-[#D3AF54]">*</span>
                    </label>
                    <input 
                      type="date" 
                      id="birthDate"
                      name="birthDate"
                      max={today}
                      required
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition-all duration-300 color-scheme-dark"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="birthTime" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Exact Time of Birth <span className="text-white/50 text-[10px] normal-case font-normal italic">(Optional)</span>
                    </label>
                    <input 
                      type="time" 
                      id="birthTime"
                      name="birthTime"
                      value={formData.birthTime}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition-all duration-300 color-scheme-dark"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="birthPlace" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Place of Birth (City/State) <span className="text-white/50 text-[10px] normal-case font-normal italic">(Optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-2.5 text-[#D3AF54]/60" />
                      <input 
                        type="text" 
                        id="birthPlace"
                        name="birthPlace"
                        value={formData.birthPlace}
                        onChange={handleInputChange}
                        placeholder="City, State, Country"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition-all duration-300 placeholder-white/40"
                      />
                    </div>
                  </div>
                </div>
                </motion.div>
              </div>

              {/* Step 3: Date Selection Calendar Card */}
              <motion.div variants={itemVariants} className="space-y-3 text-left bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col justify-start">
                <h3 className="font-serif text-sm sm:text-base font-bold !text-[#D3AF54] border-b border-[#AB7A57]/20 pb-1.5">
                  Select Date
                </h3>
                <p className="text-sm leading-relaxed text-white/80">All times are in India Standard Time. Book up to 10 days ahead, Monday–Saturday.</p>
                {policy && <p className="text-xs leading-relaxed text-white/70">{new Date(`${policy.first_date}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} – {new Date(`${policy.last_date}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</p>}
                
                <div className="flex flex-col gap-2">
                  
                  {/* Visual Calendar taking full width of column */}
                  <div className="w-full flex flex-col gap-2 relative z-20">
                      
                      {/* Calendar Nav Header */}
                      <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                        <h4 className="font-serif text-xs sm:text-sm font-bold !text-[#D3AF54] tracking-wide">
                          {monthNames[currentMonth]} {currentYear}
                        </h4>
                        <div className="flex gap-1.5">
                          <button 
                            type="button"
                            onClick={handlePrevMonth}
                            aria-label="Previous month"
                            disabled={!policy || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}` <= policy.first_date.slice(0, 7)}
                            className="w-11 h-11 rounded-lg border border-white/10 flex items-center justify-center text-[#D3AF54] hover:bg-white/5 cursor-pointer active:scale-95 transition-all"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={handleNextMonth}
                            aria-label="Next month"
                            disabled={!policy || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}` >= policy.last_date.slice(0, 7)}
                            className="w-11 h-11 rounded-lg border border-white/10 flex items-center justify-center text-[#D3AF54] hover:bg-white/5 cursor-pointer active:scale-95 transition-all"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Days of Week Header */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[11px] sm:text-xs font-bold text-[#D3AF54] uppercase py-0.5">
                        {daysOfWeek.map((day, idx) => (
                          <div key={idx} className="py-0.5">{day}</div>
                        ))}
                      </div>

                      {/* Calendar Day Cells */}
                      <div className="grid grid-cols-7 gap-1 text-center mt-0.5">
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
                              className={`min-h-11 lg:min-h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer relative ${
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
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D3AF54] left-1/2 -translate-x-1/2" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                  </div>

                  <input type="hidden" name="bookingDate" required value={formData.bookingDate} />
                </div>
              </motion.div>

              {/* Step 4: Consultation Details Card */}
              <motion.div variants={itemVariants} className="space-y-3 text-left bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg h-full flex flex-col justify-start">
                <h3 className="font-serif text-sm sm:text-base font-bold !text-[#D3AF54] border-b border-[#AB7A57]/20 pb-1.5">
                  Consultation Details
                </h3>
                  
                <div className="space-y-3">
                  {/* Consultation Type Selector */}
                  <div className="space-y-1">
                    <label htmlFor="readingType" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Consultation Type
                    </label>
                    <select 
                      id="readingType"
                      name="readingType"
                      value={formData.readingType}
                      onChange={handleInputChange}
                      className="w-full bg-[#181122] border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition-all duration-300 cursor-pointer"
                    >
                      {catalogue.map(service => <option key={service.id} value={service.id}>{service.title} ({formatFee(service.amount_paise)}{service.per_question ? ' per question' : ''})</option>)}
                    </select>
                  </div>

                  {selectedService.per_question && <div className="space-y-2">
                    <label htmlFor="questionCount" className="block text-sm font-semibold text-[#D3AF54]">Number of questions</label>
                    <select id="questionCount" name="questionCount" value={formData.questionCount} onChange={handleInputChange} className="w-full rounded-xl border border-white/20 bg-[#181122] px-3 py-2 text-sm text-white">
                      {Array.from({ length: 10 }, (_, index) => index + 1).map(count => <option key={count} value={count}>{count} {count === 1 ? 'question' : 'questions'}</option>)}
                    </select>
                    <p className="text-sm leading-relaxed text-white/80">Additional questions during the consultation are charged at ₹1,100 each, payable at that time.</p>
                  </div>}
                  <p aria-live="polite" className="text-sm font-semibold text-[#D3AF54]">Total: {formatFee(totalFee)} <span className="font-normal text-white/80">· 30-minute session</span></p>
                  {quoteError && !availabilityError && <p role="alert" className="text-sm text-amber-200">{quoteError} <button type="button" className="underline underline-offset-4" onClick={() => setQuoteRetry(value => value + 1)}>Check fee again</button></p>}

                  {/* Choose Time Slot Button Grid */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Choose Time Slot · Indian time (IST)
                    </label>
                    
                    {availabilityError && <div role="alert" className="text-sm leading-relaxed text-amber-200"><p>{availabilityError}</p><button type="button" onClick={retry} className="mt-2 min-h-11 underline underline-offset-4">Try again</button></div>}
                    {availabilityLoading && formData.bookingDate && <p role="status" className="text-sm text-white/80">
                      {Object.keys(slotAvailability).length ? 'Refreshing available times…' : 'Checking available times…'}
                    </p>}
                    {!formData.bookingDate ? (
                      <div className="text-sm leading-relaxed text-white/80 border border-white/10 bg-white/5 rounded-xl p-3 text-center">
                        ✦ Please select a date on the calendar first to view slot availability.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-2 gap-2">
                        {slotTimes.map(value => ({ value, label: slotLabel(value), period: Number(value.slice(0, 2)) < 12 ? 'Morning' : 'Evening' })).map((slot) => {
                          const isAvailable = slotAvailability[slot.value] === true;
                          const isSelected = formData.bookingSlot === slot.value;
                          
                          return (
                            <button
                              key={slot.value}
                              type="button"
                              disabled={!isAvailable}
                              aria-label={`${slot.label}, ${isAvailable ? 'open' : 'unavailable'}`}
                              onClick={() => setFormData(prev => ({ ...prev, bookingSlot: slot.value }))}
                              className={`flex min-h-11 items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-left transition-all duration-300 ${
                                !isAvailable
                                  ? "bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-[#D3AF54] border-[#D3AF54] text-[#181122] shadow-[0_0_12px_rgba(211,175,84,0.3)] font-bold scale-[1.02]"
                                    : "bg-white/5 border-white/10 hover:border-[#D3AF54] text-white cursor-pointer hover:bg-white/10"
                              }`}
                            >
                              <span className="text-sm font-semibold whitespace-nowrap">{slot.label.split(' – ')[0]}</span>
                              
                              <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  !isAvailable 
                                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                                    : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                }`} />
                                <span className="text-[10px] font-semibold">
                                  {isAvailable ? "Open" : "Closed"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Additional Notes / Concerns / Comments */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="notes" className="block text-[11px] font-semibold uppercase tracking-wider text-[#D3AF54]/95">
                      Additional Concerns or Questions
                    </label>
                    <textarea 
                      id="notes"
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any specific questions for Kundan Singh?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/15 transition-all duration-300 placeholder-white/40 resize-none min-h-[55px]"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Submit Button - Width strictly spans text */}
              <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 xl:col-span-3 flex justify-center pt-2">
                <motion.button 
                  type="submit"
                  disabled={bookingBlocked}
                  whileHover={bookingBlocked ? {} : { scale: 1.02, y: -1, boxShadow: "0 8px 18px rgba(211, 175, 84, 0.15), 0 0 15px rgba(211, 175, 84, 0.3)" }}
                  whileTap={bookingBlocked ? {} : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className={`w-auto px-8 sm:px-10 bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] border border-[#D3AF54] font-semibold py-3 rounded-xl transition duration-300 shadow-md cursor-pointer inline-flex items-center justify-center gap-2 text-xs sm:text-sm ${bookingBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                      <Send size={15} />
                      <span>Submit Appointment Request</span>
                    </>
                  )}
                </motion.button>
              </motion.div>

            </motion.form>
          )}
        </div>

        {/* Cancellation Notice */}
        <div className="mt-5 mb-8 max-w-4xl w-full px-4 flex justify-center">
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-center gap-3 w-auto">
            <span className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-[#AB7A57] shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <p className="text-xs text-slate-600 font-sans text-center leading-relaxed whitespace-normal sm:whitespace-nowrap">
              <strong>Need to cancel your session?</strong> Please call <a href="tel:+918527790801" className="text-[#AB7A57] hover:underline font-bold">+91 85277 90801</a>.
            </p>
          </div>
        </div>

      </div>

      {/* Email OTP Verification Modal */}
      <EmailOtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={verifiedDraft.current?.email || formData.email}
        purpose="booking"
        onVerified={executeBooking}
      />

    </div>
  )
}

export default Appointment_Booking

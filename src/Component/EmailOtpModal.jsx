import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Mail, RefreshCw, X, ArrowRight } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://astrologer-kundan-singh.onrender.com"

/**
 * EmailOtpModal Component
 * Luxury celestial modal for 6-digit Email OTP Verification powered by Resend & Redis.
 */
export default function EmailOtpModal({
  isOpen,
  onClose,
  email,
  purpose = "verification",
  onVerified
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const inputRefs = useRef([])

  // Reset & start countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""])
      setError("")
      setSuccessMsg("Verification code sent to your email.")
      setCountdown(60)
      setCanResend(false)
      
      // Auto-focus first input after animation
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 200)
    }
  }, [isOpen, email])

  // Countdown timer
  useEffect(() => {
    let interval = null
    if (isOpen && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [isOpen, countdown])

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Take only the last character
    setOtp(newOtp)
    setError("")

    // Auto move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // If all 6 digits filled, auto-verify
    const fullCode = newOtp.join("")
    if (fullCode.length === 6) {
      handleVerify(fullCode)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").trim()
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("")
      setOtp(digits)
      handleVerify(pastedData)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend || loading) return
    setLoading(true)
    setError("")
    setSuccessMsg("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Failed to resend code.")
      }

      setSuccessMsg("A new verification code has been dispatched to your email.")
      setCountdown(60)
      setCanResend(false)
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || "Failed to resend code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const verifyingRef = useRef(false)

  const handleVerify = async (codeToVerify = null) => {
    if (verifyingRef.current) return
    const fullCode = codeToVerify || otp.join("")
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits of the verification code.")
      return
    }

    verifyingRef.current = true
    setVerifying(true)
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: (email || "").trim().toLowerCase(),
          otp: (fullCode || "").trim(),
          purpose: (purpose || "verification").trim().toLowerCase()
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Invalid or expired verification code.")
      }

      setSuccessMsg("Email verified successfully!")
      setTimeout(() => {
        onVerified(data.verification_token)
      }, 100)
    } catch (err) {
      setError(err.message || "Invalid or expired code. Please try again.")
    } finally {
      verifyingRef.current = false
      setVerifying(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md bg-[#181122] border border-[#D3AF54]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white text-center z-10 overflow-hidden font-sans"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#D3AF54]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#AB7A57]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Icon Header */}
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-[#D3AF54]/40 flex items-center justify-center mx-auto text-[#D3AF54] mb-4 shadow-inner">
              <ShieldCheck size={28} />
            </div>

            {/* Title & Subtext */}
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#D3AF54] tracking-wide mb-2">
              Verify Your Email
            </h3>
            <p className="text-xs sm:text-sm text-[#D8CFEB] leading-relaxed mb-1">
              We sent a 6-digit cosmic verification code to:
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white mb-6">
              <Mail size={12} className="text-[#D3AF54]" />
              <span>{email}</span>
            </div>

            {/* 6 Digit Input Boxes */}
            <div className="flex justify-center gap-2 sm:gap-2.5 mb-5" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={verifying}
                  className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl text-center font-serif text-xl sm:text-2xl font-bold bg-[#241B33] border text-[#ECCF86] transition-all focus:outline-none ${
                    digit 
                      ? "border-[#D3AF54] shadow-[0_0_12px_rgba(211,175,84,0.3)]" 
                      : "border-white/15 focus:border-[#D3AF54] focus:ring-2 focus:ring-[#D3AF54]/20"
                  }`}
                />
              ))}
            </div>

            {/* Error or Success Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs text-center leading-tight font-sans"
              >
                ⚠️ {error}
              </motion.div>
            )}

            {successMsg && !error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-2 bg-[#D3AF54]/10 border border-[#D3AF54]/30 rounded-xl text-[#ECCF86] text-xs text-center font-sans"
              >
                ✓ {successMsg}
              </motion.div>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerify()}
              disabled={verifying || otp.join("").length !== 6}
              className={`w-full bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-sans cursor-pointer ${
                verifying || otp.join("").length !== 6 ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.01]"
              }`}
            >
              {verifying ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#181122]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Resend OTP Section */}
            <div className="mt-5 text-xs text-[#D8CFEB]/75 flex items-center justify-center gap-1.5">
              <span>Didn't receive the code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-[#D3AF54] hover:underline font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                  <span>Resend Code</span>
                </button>
              ) : (
                <span className="text-[#AB7A57] font-semibold">Resend in {countdown}s</span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

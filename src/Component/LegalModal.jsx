import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ShieldCheck, 
  FileText, 
  RotateCcw, 
  Lock, 
  Eye, 
  Database, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Scale, 
  Mail, 
  Phone, 
  MapPin,
  Clock
} from 'lucide-react'

/**
 * LegalModal Component
 * Professional popup modal for Privacy Policy, Terms & Conditions, and Refund Policy.
 * Matches modern enterprise & luxury website modal standards with tab switching,
 * smooth animations, and scrollable content.
 */
export default function LegalModal({ isOpen, onClose, activeTab = 'privacy', onTabChange }) {
  // Close on Escape key press & prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getPolicyInfo = () => {
    switch (activeTab) {
      case 'terms':
        return {
          title: 'Terms & Conditions',
          subtitle: '✦ ASTROADVICE LEGAL AGREEMENT ✦',
          icon: FileText
        }
      case 'refund':
        return {
          title: 'Refund & Cancellation Policy',
          subtitle: '✦ TRANSPARENT BILLING & RESCHEDULING ✦',
          icon: RotateCcw
        }
      case 'privacy':
      default:
        return {
          title: 'Privacy Policy',
          subtitle: '✦ ASTROADVICE PRIVACY & CONFIDENTIALITY ✦',
          icon: ShieldCheck
        }
    }
  }

  const currentPolicy = getPolicyInfo()
  const HeaderIcon = currentPolicy.icon

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-3xl max-h-[88vh] bg-[#181122] border border-[#D3AF54]/35 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-[#D8CFEB] flex flex-col z-10 overflow-hidden font-sans"
        >
          {/* Subtle Ambient Golden Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D3AF54]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#AB7A57]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-[#AB7A57]/20 flex items-center justify-between shrink-0 bg-[#140e1d]/95 relative z-10">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-[#D3AF54]/30 flex items-center justify-center text-[#D3AF54] shrink-0">
                <HeaderIcon size={20} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] tracking-[0.25em] font-bold text-[#D3AF54] uppercase font-sans block">
                  {currentPolicy.subtitle}
                </span>
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-wide">
                  {currentPolicy.title}
                </h2>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-left relative z-10 text-xs sm:text-sm leading-relaxed text-[#D8CFEB]/90">
            
            {/* ========================================================= */}
            {/* TAB 1: PRIVACY POLICY                                    */}
            {/* ========================================================= */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#D3AF54]/25 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#D3AF54] tracking-wider block">
                    Our Sacred Commitment
                  </span>
                  <p className="text-white/90">
                    At <strong>Astroadvice by Kundan Singh</strong> (Vasant Kunj, New Delhi), we hold your personal credentials, birth details, and horary questions with the utmost sanctity and confidentiality.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54] flex items-center gap-2">
                    <Database size={16} />
                    <span>1. Information We Collect</span>
                  </h3>
                  <p className="text-slate-300">
                    To compute accurate astrological charts (Kundali), planetary dashas, and schedule readings, we collect:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li><strong>Personal Contact Data:</strong> Full Name, Email Address, and Phone/WhatsApp Number.</li>
                    <li><strong>Birth Credentials:</strong> Exact Date of Birth, Time of Birth, and Place of Birth (City/State/Country).</li>
                    <li><strong>Consultation Inquiries:</strong> Specific questions submitted for Horary Astrology (Prashna Kundali), Vastu layouts, or Numerology.</li>
                    <li><strong>Verification Data:</strong> Security OTP verification status managed via Resend and Redis to eliminate spam.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54] flex items-center gap-2">
                    <Lock size={16} />
                    <span>2. Strict Astrological Confidentiality Guarantee</span>
                  </h3>
                  <div className="p-3.5 rounded-xl bg-[#D3AF54]/10 border border-[#D3AF54]/30 text-white space-y-1">
                    <p className="font-semibold text-[#ECCF86]">
                      ✦ We NEVER sell, rent, lease, or distribute your personal information or birth charts to third parties or marketing brokers.
                    </p>
                    <p className="text-xs text-slate-300">
                      All consultation recordings, discussions, and remedial guidance remain strictly confidential between you and Astrologer Kundan Singh.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54] flex items-center gap-2">
                    <Eye size={16} />
                    <span>3. How Your Information Is Used</span>
                  </h3>
                  <p className="text-slate-300">
                    Your details are used solely for: (a) casting planetary positions and analyzing astrological charts; (b) scheduling your consultation session; (c) dispatching meeting links (Zoom/Google Meet) and OTP authentication codes via Resend.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54]">
                    4. Grievance & Data Inquiries
                  </h3>
                  <p className="text-slate-300">
                    To request correction or deletion of your birth records, contact our studio:
                  </p>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1 text-xs">
                    <p>📧 Email: <a href="mailto:astroadvicebyks@gmail.com" className="text-[#D3AF54] hover:underline">astroadvicebyks@gmail.com</a></p>
                    <p>📞 Phone: <a href="tel:+918130808758" className="text-[#D3AF54] hover:underline">+91 8130808758</a> / <a href="tel:+918527790801" className="text-[#D3AF54] hover:underline">+91 8527790801</a></p>
                    <p>📍 Studio: B-23 Shantikunj, B-Block, Avenue-9, Church Road, Vasant Kunj, New Delhi-110070</p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: TERMS & CONDITIONS                                */}
            {/* ========================================================= */}
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>1. Acceptance of Terms</span>
                  </h3>
                  <p className="text-slate-300">
                    By booking a session, submitting an inquiry, or consulting with <strong>Astrologer Kundan Singh</strong>, you confirm you are at least 18 years of age and agree to these terms.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#D3AF54]/10 border border-[#D3AF54]/30 space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#ECCF86] flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>2. Astrological Advisory Disclaimer</span>
                  </h3>
                  <p className="text-white text-xs sm:text-sm">
                    Vedic Astrology, Numerology, Prashna Kundali, Laal Kitaab Remedies, and Vastu Shastra are traditional spiritual sciences based on symbolic interpretation and planetary cycles.
                  </p>
                  <p className="text-[#ECCF86] text-xs font-semibold">
                    ✦ Consultations are intended solely for personal guidance and spiritual insight. They do NOT substitute for licensed medical treatment, legal representation, or certified financial advisory.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54]">
                    3. Client Responsibility for Birth Data
                  </h3>
                  <p className="text-slate-300">
                    Planetary calculations (Lagna, Navamsha, and Dashas) depend on exact minutes. The client assumes responsibility for providing accurate Date, Time, and Place of Birth. Astroadvice is not liable for misinterpretations resulting from incorrect client-supplied birth credentials.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54] flex items-center gap-2">
                    <Clock size={16} />
                    <span>4. Studio Schedule & Timings</span>
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li><strong>Working Days:</strong> Monday to Saturday (Sundays Closed).</li>
                    <li><strong>Operating Windows:</strong> 10:00 AM - 12:00 PM & 3:00 PM - 6:00 PM IST.</li>
                    <li><strong>Modes:</strong> Online video consultations (Google Meet) or In-person sessions at our Vasant Kunj Studio by prior appointment.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54] flex items-center gap-2">
                    <Scale size={16} />
                    <span>5. Governing Law</span>
                  </h3>
                  <p className="text-slate-300">
                    These Terms are governed by the laws of India. Any disputes shall be subject exclusively to the jurisdiction of the courts in New Delhi, India.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: REFUND POLICY                                     */}
            {/* ========================================================= */}
            {activeTab === 'refund' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>1. Nature of Advisory Services</span>
                  </h3>
                  <p className="text-slate-300">
                    Consultations involve dedicated mathematical chart calculations, planetary transit analysis, and scheduled professional time reserved exclusively for you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      ✓ 100% Full Refund
                    </span>
                    <p className="text-xs text-slate-300">
                      Cancellations made with at least <strong>24 hours advance notice</strong> prior to your scheduled consultation slot.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#D3AF54]/40 bg-[#D3AF54]/10 space-y-1">
                    <span className="text-xs font-bold text-[#ECCF86] uppercase tracking-wider block">
                      ✦ Free Rescheduling
                    </span>
                    <p className="text-xs text-slate-300">
                      You may reschedule your session up to <strong>12 hours prior</strong> at zero extra charge by calling our helpline.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54]">
                    2. Non-Refundable Scenarios
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li><strong>Completed Consultations:</strong> Once a live reading session has taken place, fees are non-refundable.</li>
                    <li><strong>Delivered Prashna Answers:</strong> Horary Prashna charts that have already been cast and dispatched via email/WhatsApp cannot be refunded.</li>
                    <li><strong>Last-Minute Cancellations (Under 12 Hours):</strong> Eligible for a one-time complimentary reschedule within 14 days rather than a cash refund.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#D3AF54] flex items-center gap-2">
                    <Clock size={16} />
                    <span>3. Refund Processing Timeline</span>
                  </h3>
                  <p className="text-slate-300">
                    Approved refunds are credited directly back to the original payment source (UPI, Bank Account, Card) within <strong>5 to 7 business days</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1 text-xs">
                  <p className="font-bold text-[#D3AF54]">Rescheduling & Billing Helpline:</p>
                  <p>📞 Phone / WhatsApp: <a href="tel:+918796191327" className="text-white font-bold hover:underline">+91 8796191327</a></p>
                  <p>📧 Email: <a href="mailto:astroadvicebyks@gmail.com" className="text-white hover:underline">astroadvicebyks@gmail.com</a></p>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer Action */}
          <div className="p-4 sm:p-5 border-t border-[#AB7A57]/20 bg-[#140e1d]/90 flex items-center justify-between shrink-0 relative z-10">
            <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
              © 2026 Astroadvice by Kundan Singh
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-[#D3AF54] hover:bg-[#D3AF54]/90 text-[#181122] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              I Understand & Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  )
}

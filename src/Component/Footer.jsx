import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Phone, Mail, MapPin, Clock } from "lucide-react";
import { motion } from 'framer-motion'
import LegalModal from './LegalModal'
import logoImg from "../assets/logos/Nav-Logo.png";
import fbLogo from "../assets/logos/facebook.png";
import instaLogo from "../assets/logos/Instagram.png";
import ytLogo from "../assets/logos/Youtube.png";
import waLogo from "../assets/logos/whatsapp.png";
import logo2Img from "../assets/logos/logo2.png";
import gmailLogo from "../assets/logos/gmail.png";
import mapsLogo from "../assets/logos/google-maps.png";
import clockLogo from "../assets/logos/clock.png";
import callLogo from "../assets/logos/Call.png";
 
/**
 * Footer Component
 * Full-width luxury footer designed with a deep purple gradient and gold accents.
 * Displays brand info, social channels, routing shortcuts, contact links, and decorative art.
 */
export default function Footer() {
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [activeLegalTab, setActiveLegalTab] = useState('privacy')

  const openLegalModal = (tab) => {
    setActiveLegalTab(tab)
    setLegalModalOpen(true)
  }
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full bg-[#06091B] text-[#D8CFEB] border-t border-[#AB7A57]/20 relative overflow-hidden pt-10 pb-6"
    >
      
      {/* Decorative Golden Stars Background */}
      <div className="absolute top-10 right-10 text-[#D3AF54]/10 text-3xl select-none pointer-events-none">✦</div>
      <div className="absolute bottom-20 left-10 text-[#D3AF54]/15 text-2xl select-none pointer-events-none">✨</div>
 
      {/* Main Footer Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-[#AB7A57]/10">
        
        {/* Column 1 — Brand Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Kundan Singh Logo"
              className="w-20 h-20 sm:w-22 sm:h-22 object-contain shrink-0"
            />
            <div className="flex flex-col text-left">
              <span className="text-[9px] sm:text-[10px] text-[#D8CFEB] tracking-widest uppercase font-medium leading-none">
                Astroadvice by
              </span>
              <span className="text-base sm:text-lg font-bold text-[#D3AF54] font-serif tracking-wide mt-1 leading-tight block">
                Kundan Singh
              </span>
            </div>
          </div>
          <p className="text-xs text-[#D8CFEB] leading-relaxed text-left">
            Guiding you towards a better tomorrow with the wisdom of Vedic Astrology.
          </p>
          
          {/* Social Channels Icons (WhatsApp only) */}
          <div className="flex gap-4 pt-2">
            {/* WhatsApp */}
            <a href="https://wa.me/918527790801" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#D3AF54]/15 border border-[#D3AF54]/30 hover:border-[#D3AF54] flex items-center justify-center transition-all duration-300 overflow-hidden shadow-sm">
              <img src={waLogo} alt="WhatsApp" className="w-8 h-8 object-contain hover:scale-125 transition-transform duration-300" />
            </a>
          </div>
        </div>

        {/* Column 2 — Quick Links */}
        <div className="space-y-4 text-left">
          <h4 className="font-serif font-bold !text-[#D3AF54] text-sm uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Home</Link></li>
            <li><Link to="/about" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">About</Link></li>
            <li><Link to="/testimonials" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Testimonials</Link></li>
            <li><Link to="/contact" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Contact</Link></li>
            <li><Link to="/booking" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Book Consultation</Link></li>
          </ul>
        </div>
 
        {/* Column 3 — Astrological Services */}
        <div className="space-y-4 text-left">
          <h4 className="font-serif font-bold !text-[#D3AF54] text-sm uppercase tracking-wider">Services</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/services/vedic-astrology" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Vedic Astrology</Link></li>
            <li><Link to="/services/numerology" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Numerology</Link></li>
            <li><Link to="/services/vastu" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Vastu Consultation</Link></li>
            <li><Link to="/services/laal-kitaab" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Laal Kitaab Remedies</Link></li>
            <li><Link to="/services/prashna-kundali" className="text-[#D8CFEB] hover:text-[#D3AF54] transition">Expertise in Prashna Kundli</Link></li>

          </ul>
        </div>
 
        {/* Column 4 — Contact Details */}
        <div className="space-y-4 text-left">
          <h4 className="font-serif font-bold !text-[#D3AF54] text-sm uppercase tracking-wider">Contact Info</h4>
          <ul className="space-y-2.5 text-xs text-[#D8CFEB]">
            <li className="flex items-start gap-2.5">
              <div className="w-5.5 h-5.5 rounded-full bg-[#D3AF54] text-[#181122] flex items-center justify-center shadow-[0_0_8px_rgba(211,175,84,0.3)] shrink-0 mt-0.5">
                <Phone size={11} className="fill-[#181122] text-[#181122]" />
              </div>
              <div className="flex flex-col space-y-0.5">
                <a href="tel:+918130808758" className="hover:text-[#D3AF54] transition font-medium">+91 8130808758</a>
                <a href="tel:+918527790801" className="hover:text-[#D3AF54] transition font-medium">+91 8527790801</a>
              </div>
            </li>
            <li className="flex items-center gap-2.5">
              <img src={gmailLogo} alt="Email" className="w-5.5 h-5.5 object-contain hover:scale-125 transition-transform duration-300 shadow-sm shrink-0" />
              <span>astroadvicebyks@gmail.com</span>
            </li>
            <li className="flex items-start gap-2.5">
              <img src={mapsLogo} alt="Map" className="w-5.5 h-5.5 object-contain hover:scale-125 transition-transform duration-300 shadow-sm shrink-0 mt-0.5" />
              <a 
                href="https://www.google.com/maps/search/?api=1&query=B-23+Shantikunj+B-Block+Avenue-9+Church+Road+Vasant+Kunj+New+Delhi-110070" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-[#D3AF54] transition leading-snug"
              >
                B-23 Shantikunj, Church Rd, Vasant Kunj, New Delhi-110070
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <img src={clockLogo} alt="Clock" className="w-5.5 h-5.5 object-contain hover:scale-125 transition-transform duration-300 shadow-sm shrink-0 bg-white rounded-full p-0.5" />
              <span>Mon - Sat: 10:00 AM - 12:00 PM & 3:00 PM - 6:00 PM</span>
            </li>
            <li className="flex items-center gap-2.5">
              <img src={waLogo} alt="WhatsApp" className="w-5.5 h-5.5 object-contain hover:scale-125 transition-transform duration-300 shadow-sm shrink-0" />
              <a href="https://wa.me/918527790801" target="_blank" rel="noreferrer" className="text-[#D8CFEB] hover:underline hover:text-[#D3AF54]">WhatsApp Live Chat</a>
            </li>
          </ul>
        </div>
 
        {/* Column 5 — Decorative Art */}
        <div className="hidden lg:flex flex-col items-center justify-center relative w-full h-full">
          <div className="w-32 h-32 flex items-center justify-center relative">
            
            {/* Rotating Decorative Outer Circle */}
            <div className="absolute inset-0 rounded-full border border-[#D3AF54]/20 animate-[spin_120s_linear_infinite] pointer-events-none">
              <div className="absolute inset-1 rounded-full border border-dashed border-[#AB7A57]/30"></div>
              <div className="absolute inset-3 rounded-full border border-[#D3AF54]/20"></div>
              <div className="text-[7px] text-[#D3AF54]/40 font-serif absolute inset-0 flex justify-center items-center">
                <span className="absolute top-1">♈</span>
                <span className="absolute right-1">♋</span>
                <span className="absolute bottom-1">♎</span>
                <span className="absolute left-1">♑</span>
              </div>
            </div>

            {/* Static Centered Logo2 Image */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#181122]/90 flex items-center justify-center relative z-10 shadow-lg border border-[#D3AF54]/30">
              <img 
                src={logo2Img} 
                alt="Astroadvice Mark Logo" 
                className="w-full h-full object-contain p-1 rounded-full scale-125 transform"
              />
            </div>
            
          </div>
        </div>
 
      </div>
 
      {/* Footer Bottom Metadata Bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#D8CFEB]/85 gap-4">
        <div>
          <span>© 2026 Astroadvice. All Rights Reserved.</span>
        </div>
        
        {/* Policies Popup Modal Triggers */}
        <div className="flex flex-wrap justify-center gap-6">
          <button 
            type="button" 
            onClick={() => openLegalModal('privacy')} 
            className="text-[#D8CFEB] hover:text-[#D3AF54] transition cursor-pointer text-xs focus:outline-none"
          >
            Privacy Policy
          </button>
          <button 
            type="button" 
            onClick={() => openLegalModal('terms')} 
            className="text-[#D8CFEB] hover:text-[#D3AF54] transition cursor-pointer text-xs focus:outline-none"
          >
            Terms & Conditions
          </button>
          <button 
            type="button" 
            onClick={() => openLegalModal('refund')} 
            className="text-[#D8CFEB] hover:text-[#D3AF54] transition cursor-pointer text-xs focus:outline-none"
          >
            Refund Policy
          </button>
        </div>
      </div>

      {/* Global Interactive Legal Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        activeTab={activeLegalTab}
        onTabChange={setActiveLegalTab}
      />

    </motion.footer>
  )
}

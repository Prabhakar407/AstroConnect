import React from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Phone, Mail, MapPin, Clock } from "lucide-react";
import logoImg from "../assets/logos/Logo.png";

/**
 * Footer Component
 * Full-width luxury footer designed with a deep purple gradient and gold accents.
 * Displays brand info, social channels, routing shortcuts, contact links, and decorative art.
 */
export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-[#1c0e2d] via-[#090b1c] to-[#250d1d] text-[#EBDCD4] border-t border-white/5 relative overflow-hidden pt-10 pb-6">
      
      {/* Decorative Golden Stars Background */}
      <div className="absolute top-10 right-10 text-[#fcb900]/10 text-3xl select-none pointer-events-none">✦</div>
      <div className="absolute bottom-20 left-10 text-[#fcb900]/15 text-2xl select-none pointer-events-none">✨</div>

      {/* Main Footer Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-white/5">
        
        {/* Column 1 — Brand Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Kundan Singh Logo"
              className="w-12 h-12 object-contain"
            />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-[#F4EAE3] tracking-widest uppercase font-medium leading-none">
                Astroadvice by
              </span>
              <span className="text-base font-bold text-[#fcb900] font-serif tracking-wide mt-0.5 leading-none block">
                Kundan Singh
              </span>
            </div>
          </div>
          <p className="text-xs text-[#EBDCD4] leading-relaxed text-left">
            Guiding you towards a better tomorrow with the wisdom of Vedic Astrology.
          </p>
          
          {/* Social Channels Icons (Inline SVGs to prevent dependency issues) */}
          <div className="flex gap-4 pt-2">
            {/* Facebook */}
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#fcb900] text-[#fcb900] hover:text-[#2A132E] border border-[#fcb900]/30 hover:border-[#fcb900] flex items-center justify-center transition-all duration-300">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            
            {/* Instagram */}
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#fcb900] text-[#fcb900] hover:text-[#2A132E] border border-[#fcb900]/30 hover:border-[#fcb900] flex items-center justify-center transition-all duration-300">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            
            {/* YouTube */}
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#fcb900] text-[#fcb900] hover:text-[#2A132E] border border-[#fcb900]/30 hover:border-[#fcb900] flex items-center justify-center transition-all duration-300">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
            
            {/* WhatsApp */}
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#fcb900] text-[#fcb900] hover:text-[#2A132E] border border-[#fcb900]/30 hover:border-[#fcb900] flex items-center justify-center transition-all duration-300">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2 — Quick Links */}
        <div className="space-y-4 text-left">
          <h4 className="font-serif font-bold text-[#fcb900] text-sm uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2 text-xs text-[#EBDCD4]">
            <li><Link to="/" className="hover:text-[#fcb900] transition">Home</Link></li>
            <li><Link to="/about" className="hover:text-[#fcb900] transition">About</Link></li>
            <li><Link to="/services" className="hover:text-[#fcb900] transition">Services</Link></li>
            <li><Link to="/testimonials" className="hover:text-[#fcb900] transition">Testimonials</Link></li>
            <li><Link to="/contact" className="hover:text-[#fcb900] transition">Contact</Link></li>
          </ul>
        </div>

        {/* Column 3 — Astrological Services */}
        <div className="space-y-4 text-left">
          <h4 className="font-serif font-bold text-[#fcb900] text-sm uppercase tracking-wider">Services</h4>
          <ul className="space-y-2 text-xs text-[#EBDCD4]">
            <li><Link to="/services" className="hover:text-[#fcb900] transition">Kundli Analysis</Link></li>
            <li><Link to="/services" className="hover:text-[#fcb900] transition">Career Guidance</Link></li>
            <li><Link to="/services" className="hover:text-[#fcb900] transition">Love & Marriage Consultation</Link></li>
            <li><Link to="/services" className="hover:text-[#fcb900] transition">Vastu Consultation</Link></li>
            <li><Link to="/services" className="hover:text-[#fcb900] transition">Numerology Reading</Link></li>
            <li><Link to="/services" className="hover:text-[#fcb900] transition">Gemstone Recommendation</Link></li>
          </ul>
        </div>

        {/* Column 4 — Contact Details */}
        <div className="space-y-4 text-left">
          <h4 className="font-serif font-bold text-[#fcb900] text-sm uppercase tracking-wider">Contact Info</h4>
          <ul className="space-y-2.5 text-xs text-[#EBDCD4]">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-[#fcb900]" />
              <span>☎ 9999999999</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-[#fcb900]" />
              <span>contact@kundanastrology.com</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-[#fcb900]" />
              <span>New Delhi, India</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock size={14} className="text-[#fcb900]" />
              <span>Mon - Sat: 9:00 AM - 7:00 PM</span>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle size={14} className="text-[#fcb900]" />
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="hover:underline hover:text-[#fcb900]">WhatsApp Live Chat</a>
            </li>
          </ul>
        </div>

        {/* Column 5 — Decorative Art (Rotating Zodiac wheel gold line art) */}
        <div className="hidden lg:flex flex-col items-center justify-center relative w-full h-full">
          <div className="w-32 h-32 rounded-full border border-[#fcb900]/20 flex items-center justify-center animate-[spin_120s_linear_infinite]">
            <div className="absolute inset-1 rounded-full border border-dashed border-[#A6755D]/30"></div>
            <div className="absolute inset-3 rounded-full border border-[#fcb900]/20"></div>
            <div className="text-[7px] text-[#fcb900]/40 font-serif absolute inset-0 flex justify-center items-center">
              <span className="absolute top-1">♈</span>
              <span className="absolute right-1">♋</span>
              <span className="absolute bottom-1">♎</span>
              <span className="absolute left-1">♑</span>
            </div>
            <span className="text-[#fcb900]/40 text-xl">✨</span>
          </div>
        </div>

      </div>

      {/* Footer Bottom Metadata Bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#EBDCD4]/85 gap-4">
        <div>
          <span>© 2025 Astroadvice. All Rights Reserved.</span>
        </div>
        
        {/* Policies Links */}
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#fcb900] transition">Privacy Policy</a>
          <a href="#" className="hover:text-[#fcb900] transition">Terms & Conditions</a>
          <a href="#" className="hover:text-[#fcb900] transition">Refund Policy</a>
        </div>
      </div>

    </footer>
  )
}

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import astrologerPortrait from '../assets/images/astrologer_portrait.jpg'
import { 
  Award, 
  Users, 
  Globe, 
  Star, 
  Sparkles, 
  Calendar, 
  Phone, 
  FileText, 
  Heart, 
  Briefcase, 
  Gem, 
  Hash, 
  Home as HomeIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const MotionLink = motion.create ? motion.create(Link) : motion(Link);

/**
 * CelestialDivider Component
 * Elegant visual separator designed with gold gradient lines and a central star symbol.
 */
function CelestialDivider() {
  return (
    <div className="w-full flex items-center justify-center py-10 gap-4">
      <div className="h-[1px] flex-grow max-w-[150px] bg-gradient-to-r from-transparent to-[#fcb900]/40"></div>
      <div className="text-[#fcb900]/50 text-xs tracking-widest select-none">✦ ❖ ✦</div>
      <div className="h-[1px] flex-grow max-w-[150px] bg-gradient-to-l from-transparent to-[#fcb900]/40"></div>
    </div>
  )
}




/**
 * About Component
 * Premium luxury About page for Astrologer Kundan Singh.
 */
function About() {
  const { scrollY } = useScroll()
  const yLeft = useTransform(scrollY, [0, 1000], [0, -30])
  const yRight = useTransform(scrollY, [0, 1000], [0, -70])
  const yZodiac = useTransform(scrollY, [0, 1000], [0, -90])
  const rZodiac = useTransform(scrollY, [0, 1000], [0, 45])

  // Expertise Section Grid Data (6 premium cards)
  const expertiseData = [
    {
      title: "Kundli Analysis",
      description: "In-depth evaluation of planetary combinations, aspects, and houses to uncover your soul's life path, potentials, and destiny timelines.",
      icon: FileText
    },
    {
      title: "Marriage & Relationship Guidance",
      description: "Detailed compatibility testing (Kundli matching/Gun Milan), resolving delays or friction in partnerships, and promoting lasting marital harmony.",
      icon: Heart
    },
    {
      title: "Career Consultation",
      description: "Strategic timing for job changes, promotions, business expansions, and matching your natal strengths with the perfect industries.",
      icon: Briefcase
    },
    {
      title: "Business Astrology",
      description: "Identifying planetary triggers for financial growth, choosing auspicious venture names, and selecting successful business incorporation timelines.",
      icon: Gem
    },
    {
      title: "Numerology Reading",
      description: "Harmonizing the numerical vibrations of your name and birth date with cosmic energies to remove structural obstacles and unlock opportunities.",
      icon: Hash
    },
    {
      title: "Vastu Consultation",
      description: "Aligning home and workplace layouts with directional energies to eliminate negative flows and invite health, peace, and wealth.",
      icon: HomeIcon
    }
  ]



  // Certificates Data (Marquee)
  const certificatesData = [
    { name: "Gold Medalist in Vedic Astrology" },
    { name: "Acharya of Jyotish Shastra" },
    { name: "Advanced Horoscopy & Transit Specialist" },
    { name: "Vastu Shastra Visharad Certification" },
    { name: "Spiritual Counseling Diplomate" },
    { name: "Certified Numerologist (SICA)" }
  ]

  const [certIndex, setCertIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCertIndex((prev) => (prev + 1) % certificatesData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [certificatesData.length]);

  return (
    <div className="w-full bg-[#FDFCF5] relative overflow-hidden flex flex-col items-center font-sans">
      
      {/* ========================================================= */}
      {/* 1. INTRO / BIOGRAPHY DEEP SPACE BAND SECTION (Navy: #06091B) */}
      {/* ========================================================= */}
      <div className="w-full bg-[#06091B] relative overflow-hidden flex flex-col items-center border-b border-[#AB7A57]/20 text-white z-10">
        
        {/* Glow & Luxury SVG Decor Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.1),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
        <motion.div style={{ y: yZodiac, rotate: rZodiac }} className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04] flex justify-center items-center">
          <svg className="w-[500px] h-[500px] text-[#AB7A57] animate-[spin_200s_linear_infinite]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
            <circle cx="100" cy="100" r="90" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="70" />
            <circle cx="100" cy="100" r="50" strokeDasharray="2 2" />
            <line x1="100" y1="10" x2="100" y2="190" />
            <line x1="10" y1="100" x2="190" y2="100" />
          </svg>
        </motion.div>

        {/* Capped layout wrapper inside band */}
        <div className="w-full max-w-[1920px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)] pt-8 lg:pt-12 pb-[clamp(3.5rem,6vw,7.5rem)] flex flex-col items-center">
          


          {/* Main Asymmetric Board */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center w-full relative z-10">
            
            {/* Left Column: Bio Content cards (reversing typical positions) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="lg:col-span-7 lg:order-1 order-2 flex flex-col text-left justify-start gap-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                
                {/* Legacy Card */}
                <div className="bg-[#181122]/90 border border-[#AB7A57]/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative group hover:border-[#D3AF54]/40 transition-colors duration-300">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#D3AF54] text-[#181122] flex items-center justify-center font-serif text-xs font-bold shadow-md shadow-[#D3AF54]/20">
                    01
                  </div>
                  <h3 className="font-serif text-[#D3AF54] font-bold text-base mt-2 tracking-wide">VEDIC BACKGROUND</h3>
                  <p className="text-xs sm:text-sm text-[#D8CFEB] leading-relaxed font-sans">
                    I am a qualified Vedic astrologer with over 15 years of experience. I help individuals gain clarity and guidance in areas such as career, relationships, marriage, health, finance, and personal growth.
                  </p>
                </div>

                {/* Approach Card */}
                <div className="bg-[#181122]/90 border border-[#AB7A57]/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative group hover:border-[#D3AF54]/40 transition-colors duration-300">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#D3AF54] text-[#181122] flex items-center justify-center font-serif text-xs font-bold shadow-md shadow-[#D3AF54]/20">
                    02
                  </div>
                  <h3 className="font-serif text-[#D3AF54] font-bold text-base mt-2 tracking-wide">MY APPROACH & EDUCATION</h3>
                  <p className="text-xs sm:text-sm text-[#D8CFEB] leading-relaxed font-sans">
                    My approach combines traditional knowledge with practical insights to provide accurate and personalized guidance tailored to each individual's unique birth chart. I studied Astrology and Alankar at Bharatiya Vidya Bhavan College, starting my astrology journey in 2003.
                  </p>
                </div>

              </div>

              {/* Quote Block or callout */}
              <div className="bg-white/5 border-l-2 border-[#D3AF54] rounded-r-2xl p-5 text-xs sm:text-sm text-[#D8CFEB] leading-relaxed font-sans italic bg-gradient-to-r from-white/5 to-transparent">
                "Our readings are not just predictions; they are strategic pathways designed to empower you with choices that align with your ultimate strengths."
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <MotionLink 
                  to="/booking" 
                  whileHover={{ scale: 1.03, y: -2, boxShadow: "0 10px 25px rgba(211, 175, 84, 0.25)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  className="bg-[#D3AF54] hover:bg-[#D3AF54]/90 text-[#181122] font-semibold px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-lg cursor-pointer text-sm"
                >
                  <Calendar size={18} />
                  <span>Book Consultation</span>
                </MotionLink>

                <MotionLink 
                  to="/contact" 
                  whileHover={{ scale: 1.03, y: -2, boxShadow: "0 10px 20px rgba(211, 175, 84, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  className="border border-[#AB7A57] hover:border-[#D3AF54] text-white hover:text-[#D3AF54] font-semibold px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer text-sm bg-white/[0.02]"
                >
                  <Phone size={18} className="text-[#D3AF54]" />
                  <span>Call Now</span>
                </MotionLink>
              </div>

            </motion.div>

            {/* Right Column: Portal-framed Portrait (reversing typical positions) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-5 lg:order-2 order-1 flex justify-center relative w-full pt-2 lg:pt-4"
            >
              {/* Elegant Archway/Temple Portal Frame */}
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] rounded-t-full border-2 border-[#D3AF54] bg-[#181122] shadow-[0_20px_50px_rgba(211,175,84,0.25)] overflow-hidden flex items-center justify-center group z-10">
                <img 
                  src={astrologerPortrait} 
                  alt="Astrologer Kundan Singh" 
                  className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 absolute inset-0"
                />
                
                {/* Subtle internal gold gradient frame overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#181122]/70 via-transparent to-transparent pointer-events-none"></div>
              </div>

              {/* Decorative celestial background rings behind the archway */}
              <div className="absolute w-[112%] h-[112%] top-[6%] border border-dashed border-[#AB7A57]/20 rounded-t-full pointer-events-none animate-[spin_320s_linear_infinite]"></div>
              <div className="absolute w-[104%] h-[104%] top-[2%] border border-[#D3AF54]/10 rounded-t-full pointer-events-none"></div>
              
              {/* Constellation sparkle overlays */}
              <div className="absolute top-0 right-4 text-[#D3AF54]/50 animate-pulse"><Sparkles size={20} /></div>
              <div className="absolute bottom-20 left-4 text-[#AB7A57]/40"><Sparkles size={16} /></div>
            </motion.div>

          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. EXPERTISE SECTION (Cream background: #FDFCF5)           */}
      {/* ========================================================= */}
      <div className="w-full bg-[#FDFCF5] flex flex-col items-center relative">
        
        {/* Floating Glassmorphic Stat bar sitting exactly at the boundary */}
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 relative z-30 -translate-y-1/2">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full bg-[#FDFCF5] border border-[#AB7A57]/30 rounded-3xl p-2 sm:p-5 shadow-2xl relative overflow-hidden grid grid-cols-4 gap-1.5 sm:gap-4 text-center z-30"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.04),transparent_70%)] pointer-events-none"></div>
            
            {/* Box 1: Experience */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 p-1.5 sm:p-2 lg:p-3 bg-[#06091B] border border-[#AB7A57]/30 rounded-xl w-full text-center lg:text-left shadow-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#AB7A57]/45 flex items-center justify-center text-[#D3AF54] bg-white/[0.03] shrink-0">
                <Award size={12} className="lg:w-3.5 lg:h-3.5" />
              </div>
              <div className="flex flex-col items-center lg:items-start min-w-0 w-full">
                <span className="text-[7px] sm:text-[9px] lg:text-xs uppercase text-[#D3AF54] tracking-wider font-semibold truncate w-full">Experience</span>
                <span className="text-[8px] sm:text-[10px] lg:text-sm font-bold text-white font-serif mt-0.5 lg:mt-0.5 whitespace-nowrap w-full truncate text-center lg:text-left">10+ Years</span>
              </div>
            </div>

            {/* Box 2: Consultations */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 p-1.5 sm:p-2 lg:p-3 bg-[#06091B] border border-[#AB7A57]/30 rounded-xl w-full text-center lg:text-left shadow-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#AB7A57]/45 flex items-center justify-center text-[#D3AF54] bg-white/[0.03] shrink-0">
                <Users size={12} className="lg:w-3.5 lg:h-3.5" />
              </div>
              <div className="flex flex-col items-center lg:items-start min-w-0 w-full">
                <span className="text-[7px] sm:text-[9px] lg:text-xs uppercase text-[#D3AF54] tracking-wider font-semibold truncate w-full">Consultations</span>
                <span className="text-[8px] sm:text-[10px] lg:text-sm font-bold text-white font-serif mt-0.5 lg:mt-0.5 whitespace-nowrap w-full truncate text-center lg:text-left">10,000+</span>
              </div>
            </div>

            {/* Box 3: Clients Served */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 p-1.5 sm:p-2 lg:p-3 bg-[#06091B] border border-[#AB7A57]/30 rounded-xl w-full text-center lg:text-left shadow-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#AB7A57]/45 flex items-center justify-center text-[#D3AF54] bg-white/[0.03] shrink-0">
                <Globe size={12} className="lg:w-3.5 lg:h-3.5" />
              </div>
              <div className="flex flex-col items-center lg:items-start min-w-0 w-full">
                <span className="text-[7px] sm:text-[9px] lg:text-xs uppercase text-[#D3AF54] tracking-wider font-semibold truncate w-full">Clients Served</span>
                <span className="text-[8px] sm:text-[10px] lg:text-sm font-bold text-white font-serif mt-0.5 lg:mt-0.5 whitespace-nowrap w-full truncate text-center lg:text-left">Indian</span>
              </div>
            </div>

            {/* Box 4: Rating */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 p-1.5 sm:p-2 lg:p-3 bg-[#06091B] border border-[#AB7A57]/30 rounded-xl w-full text-center lg:text-left shadow-md">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#AB7A57]/45 flex items-center justify-center text-[#D3AF54] bg-white/[0.03] shrink-0">
                <Star size={12} className="fill-[#D3AF54] text-[#D3AF54] lg:w-3.5 lg:h-3.5" />
              </div>
              <div className="flex flex-col items-center lg:items-start min-w-0 w-full">
                <span className="text-[7px] sm:text-[9px] lg:text-xs uppercase text-[#D3AF54] tracking-wider font-semibold truncate w-full">Rating</span>
                <span className="text-[8px] sm:text-[10px] lg:text-sm font-bold text-white font-serif mt-0.5 lg:mt-0.5 whitespace-nowrap w-full truncate text-center lg:text-left">4.9 / 5.0</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute top-1/3 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.04),transparent_70%)] rounded-full pointer-events-none animate-pulse"></div>
        
        <div className="w-full max-w-[1920px] px-6 lg:px-8 flex flex-col items-center pt-8 sm:pt-10 pb-8 sm:pb-12">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mb-6 md:mb-8 relative z-10">
            <span className="text-[#AB7A57] text-xs tracking-[0.25em] uppercase font-bold block mb-3 font-sans">
              AREAS OF EXPERTISE
            </span>
            <h2 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif text-[#181122] font-bold mb-3 tracking-wide leading-tight">
              Areas of Expertise
            </h2>
            <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-3 mb-3"></div>
            <p className="text-xs md:text-sm text-[#181122]/80 font-sans leading-relaxed italic">
              "Comprehensive guidance for every important aspect of life."
            </p>
          </div>

          {/* 3x2 Grid layout on desktop */}
          <div className="w-full max-w-5xl z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {expertiseData.map((item, idx) => (
              <FeatureCard key={idx} feature={item} />
            ))}
          </div>

        </div>
      </div>



      {/* ========================================================= */}
      {/* 4. PROFESSIONAL CERTIFICATES (Cream background: #FDFCF5)   */}
      {/* ========================================================= */}
      <div className="w-full bg-[#FDFCF5] flex justify-center py-16 overflow-hidden relative border-t border-[#AB7A57]/10">
        <div className="w-full max-w-[1920px]">
          
          <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 mb-10 text-center">
            <span className="text-[#AB7A57] text-xs tracking-[0.25em] uppercase font-bold block mb-3 font-sans">
              QUALIFICATIONS & ACCREDITATIONS
            </span>
            <h2 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif text-[#181122] font-bold">
              Certificates
            </h2>
            <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-3"></div>
          </div>

          {/* Single-Card Slide Viewer */}
          <div className="w-full max-w-[620px] mx-auto px-6 relative z-10 flex flex-col items-center">
            <div className="w-full min-h-[385px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={certIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="w-full bg-[#181122] border border-[#D3AF54]/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-2xl relative justify-center"
                >
                  {/* Left Column: Big Image Frame Placeholder (Narrower & Taller) */}
                  <div className="w-full md:w-[220px] h-[280px] bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center items-center relative overflow-hidden shrink-0 group hover:border-[#D3AF54]/40 transition-colors duration-300">
                    {/* Celestial corner frames inside image placeholder */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#D3AF54]/30"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#D3AF54]/30"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#D3AF54]/30"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#D3AF54]/30"></div>
                    
                    <span className="text-5xl mb-3 filter drop-shadow-[0_0_10px_rgba(211,175,84,0.4)]">📜</span>
                    <span className="text-[10px] text-[#D8CFEB]/60 font-sans tracking-widest uppercase text-center px-4">CERTIFICATE IMAGE</span>
                  </div>

                  {/* Right Column: Details (Narrower) */}
                  <div className="flex-grow text-left flex flex-col justify-center py-2 max-w-[280px] w-full">
                    <span className="text-[9px] tracking-widest text-[#D3AF54] font-sans font-bold uppercase block mb-3 border border-[#D3AF54]/30 bg-white/5 px-3 py-1 rounded-full w-fit">
                      VERIFIED ACCREDITATION
                    </span>
                    <h3 className="font-serif text-white font-bold text-lg leading-tight mb-3 tracking-wide group-hover:text-[#D3AF54] transition-colors duration-300">
                      {certificatesData[certIndex].name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#D8CFEB] leading-relaxed font-sans max-w-[280px]">
                      This verified credential stands as a testament to the rigorous studies and complete mastery in Vedic sciences, birth charts mathematical calculations, and ancient energetic remedies.
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slider Dots Navigation */}
            <div className="flex gap-2.5 mt-8 justify-center items-center">
              {certificatesData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCertIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    certIndex === idx 
                      ? "bg-[#D3AF54] scale-125 shadow-[0_0_8px_rgba(211,175,84,0.8)]" 
                      : "bg-[#D3AF54]/20 hover:bg-[#D3AF54]/45"
                  }`}
                  aria-label={`Go to certificate ${idx + 1}`}
                />
              ))}
            </div>

          </div>

        </div>
      </div>

      <div className="py-6"></div>

    </div>
  )
}

// Helper cn function since tailwind-merge is not imported
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}) {
  const patternId = React.useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y], index) => (
            <rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
          ))}
        </svg>
      )}
    </svg>
  );
}

function genRandomPattern(length) {
  length = length ?? 5;
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
    Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
  ]);
}

function FeatureCard({ feature, className, ...props }) {
  const p = genRandomPattern();
  const Icon = feature.icon;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-[#AB7A57]/30 shadow-lg group cursor-pointer w-full h-[160px] sm:h-[180px] lg:h-[200px]', className)} {...props}>
      {/* Background color/gradient placeholder (to be replaced by images later) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#181122] via-[#2A183A] to-[#06091B] z-0"></div>
      
      {/* Dynamic GridPattern SVG overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-30 group-hover:opacity-55 transition-opacity duration-300">
        <GridPattern
          width={20}
          height={20}
          x="-12"
          y="4"
          squares={p}
          className="fill-white/5 stroke-[#AB7A57]/20 absolute inset-0 h-full w-full mix-blend-overlay"
        />
      </div>

      {/* Dark overlay gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 transition-opacity duration-300 group-hover:from-black/95"></div>

      {/* Content overlay */}
      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-left z-20">
        {/* Icon Badge */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#D3AF54]/10 border border-[#D3AF54]/20 flex items-center justify-center mb-2.5 text-[#D3AF54] backdrop-blur-sm shrink-0 group-hover:bg-[#D3AF54]/20 group-hover:scale-105 transition-all duration-300">
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={1.5} aria-hidden />
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide group-hover:text-[#D3AF54] transition-colors duration-300">{feature.title}</h3>
      </div>
    </div>
  );
}

export default About

import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FileText, Heart, Briefcase, Home as HomeIcon, Hash, Gem, Sparkles, Calendar } from 'lucide-react'

const MotionLink = motion.create ? motion.create(Link) : motion(Link);

/**
 * CelestialDivider Component
 * Elegant visual separator designed with gold gradient lines and a central star symbol.
 */
function CelestialDivider() {
  return (
    <div className="w-full flex items-center justify-center py-8 gap-4">
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
 * Service Component
 * Displays available astrological services with luxury light styling,
 * spring-based hover effects, glowing drop-shadows, and scroll parallax decors.
 */
function Service() {
  const { scrollY } = useScroll()
  const yZodiac = useTransform(scrollY, [0, 1000], [0, -100])
  const rZodiac = useTransform(scrollY, [0, 1000], [0, 50])
  const yDrift = useTransform(scrollY, [0, 1000], [0, -40])

  const serviceOfferings = [
    {
      title: 'Natal Chart Reading',
      price: '$120 / ₹9,999',
      duration: '60 mins',
      desc: 'A comprehensive Janam Kundli analysis mapping planetary alignments at birth. Gain clarity on life path, talents, potential career blocks, and spiritual growth.',
      icon: <FileText size={22} className="text-[#fcb900]" />
    },
    {
      title: 'Relationship Synastry',
      price: '$150 / ₹11,999',
      duration: '90 mins',
      desc: 'Detailed compatibility evaluation (Gun Milan) comparing two birth charts. Resolves partner friction, identifies timing blocks, and builds marital harmony.',
      icon: <Heart size={22} className="text-[#fcb900]" />
    },
    {
      title: 'Transit Forecast',
      price: '$90 / ₹7,499',
      duration: '45 mins',
      desc: 'Predictive cycles forecasting how ongoing celestial transits (Gochar) interact with your chart. Essential guidance for timing major life transitions.',
      icon: <Briefcase size={22} className="text-[#fcb900]" />
    },
    {
      title: 'Vastu Consultation',
      price: '$200 / ₹15,999',
      duration: 'Site Specific',
      desc: 'Aligning home or office layout to optimize flow energy. Eliminates structural elements that block personal growth, wealth luck, and good wellness vibes.',
      icon: <HomeIcon size={22} className="text-[#fcb900]" />
    },
    {
      title: 'Numerology Frequency',
      price: '$80 / ₹6,499',
      duration: '45 mins',
      desc: 'Harmonize your name spelling and birth date vibrations to dissolve chronic career delays, attract matching fortune paths, and restore energy balance.',
      icon: <Hash size={22} className="text-[#fcb900]" />
    },
    {
      title: 'Gemstone Recommendation',
      price: '$75 / ₹5,999',
      duration: '30 mins',
      desc: 'Vedic-based recommendation of planetary gemstones (e.g. Ruby, Yellow Sapphire) to strengthen weak beneficial planets and boost mental focus and energy.',
      icon: <Gem size={22} className="text-[#fcb900]" />
    }
  ]

  return (
    <div className="w-full min-h-screen bg-transparent relative overflow-hidden flex flex-col items-center px-6 py-12 font-sans">
      
      {/* ========================================================= */}
      {/* DECORATIVE BACKGROUNDS & PARALLAX                         */}
      {/* ========================================================= */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(85,57,63,0.04),transparent_70%)] rounded-full -z-10 pointer-events-none"></div>

      {/* Rotating Background Zodiac Motif */}
      <motion.div 
        style={{ y: yZodiac, rotate: rZodiac }}
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04] flex justify-center items-center -z-10"
      >
        <svg className="w-[550px] h-[550px] text-[#A6755D]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
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
        style={{ y: yDrift }}
        className="text-center max-w-2xl mb-12 relative z-10"
      >
        <span className="text-[#fcb900] text-xs tracking-[0.25em] font-bold uppercase block mb-3 font-sans">
          ✦ CELESTIAL SERVICES ✦
        </span>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-wide">
          Guidance & Remedial Consultation
        </h1>
        <div className="w-12 h-[1px] bg-[#fcb900] mx-auto mt-4 mb-4"></div>
        <p className="text-sm md:text-base text-[#EBDCD4]/85 leading-relaxed font-sans max-w-xl mx-auto">
          Embark on your personal path to alignment. Explore our premium consultations structured to address every key sector of life with accuracy and confidentiality.
        </p>
      </motion.div>

      {/* ========================================================= */}
      {/* SERVICES GRID SECTION                                     */}
      {/* ========================================================= */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10"
      >
        {serviceOfferings.map((item, index) => (
          <motion.div 
            key={index} 
            variants={itemVariants}
            whileHover={{ 
              y: -8, 
              borderColor: "#fcb900", 
              boxShadow: "0 25px 40px -15px rgba(252, 185, 0, 0.05), 0 0 25px rgba(252, 185, 0, 0.2)" 
            }}
            className="bg-[#0b0f19]/35 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between text-left gap-6 transition-all duration-300 shadow-sm cursor-pointer relative group"
          >
            {/* Top row elements */}
            <div className="space-y-4">
              {/* Header block with icon and price tag */}
              <div className="flex items-center justify-between w-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2A132E] to-[#55393F] border border-[#fcb900]/40 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(252,185,0,0.3)] transition-all duration-300 shrink-0">
                  {item.icon}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#fcb900]/80 uppercase tracking-wider block font-semibold leading-none">{item.duration}</span>
                  <span className="text-sm font-bold text-[#fcb900] bg-white/[0.04] border border-[#fcb900]/25 px-2.5 py-1 rounded-full mt-1.5 inline-block font-sans">{item.price}</span>
                </div>
              </div>

              {/* Title & Divider */}
              <div className="space-y-1">
                <h3 className="font-serif text-white font-bold text-lg group-hover:text-[#fcb900] transition-colors duration-300">
                  {item.title}
                </h3>
                <div className="w-8 h-[1.5px] bg-[#fcb900]/30 group-hover:w-16 transition-all duration-500 rounded-full"></div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-[#EBDCD4]/85 leading-relaxed font-sans mt-0.5">
                {item.desc}
              </p>
            </div>

            {/* Bottom Row action link */}
            <div className="border-t border-white/5 pt-4 mt-auto flex justify-between items-center w-full">
              <span className="text-[11px] font-semibold tracking-wider text-[#fcb900]/80 uppercase font-sans">Vedic Alignment</span>
              <MotionLink 
                to="/booking"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#fcb900]/10 hover:bg-[#fcb900] text-[#fcb900] hover:text-[#2A132E] border border-[#fcb900]/40 text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-lg transition-colors duration-300"
              >
                Book Now
              </MotionLink>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* BOTTOM CTA SECTION                                        */}
      {/* ========================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full max-w-4xl mx-auto mt-6"
      >
        <div className="bg-gradient-to-r from-[#0b0c16] via-[#121324] to-[#0b0c16] border border-[#fcb900]/25 rounded-3xl p-8 relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#fcb900]/5 rounded-full blur-2xl"></div>
          
          <div className="space-y-2 text-left">
            <span className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide block">
              Not Sure Which Consultation Suits You?
            </span>
            <p className="text-xs text-[#EBDCD4]/85 leading-relaxed max-w-lg">
              Reach out to us directly. We will review your birth credentials and suggest the ideal reading structure.
            </p>
          </div>

          <MotionLink 
            to="/contact"
            whileHover={{ scale: 1.05, y: -2, boxShadow: "0 10px 20px rgba(252, 185, 0, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="bg-[#fcb900] hover:bg-[#e0a600] text-[#2A132E] font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 tracking-wide text-xs w-full md:w-auto shrink-0"
          >
            <Calendar size={14} />
            <span>Connect Personally</span>
          </MotionLink>
        </div>
      </motion.div>

    </div>
  )
}

export default Service

import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FileText, Heart, Briefcase, Home as HomeIcon, Hash, Gem, Sparkles, Calendar, BookOpen, HelpCircle } from 'lucide-react'

import vedicAstrologyImg from '../assets/images/Vedic Astrology.png'
import numerologyImg from '../assets/images/Numerology.png'
import vastuConsultationImg from '../assets/images/Vastu Consultation.png'
import laalKitaabImg from '../assets/images/Laal Kitaab Remedies.png'
import prashnaKundliImg from '../assets/images/Prashna Kundli.png'
import reikiHealerImg from '../assets/images/Reiki Healer.png'

const MotionLink = motion.create ? motion.create(Link) : motion(Link);

/**
 * CelestialDivider Component
 * Elegant visual separator designed with gold gradient lines and a central star symbol.
 */
function CelestialDivider() {
  return (
    <div className="w-full flex items-center justify-center py-8 gap-4">
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
      id: 'vedic-astrology',
      title: 'Vedic Astrology',
      price: '$120 / ₹9,999',
      duration: '60 mins',
      desc: 'Comprehensive evaluation of planetary positions, houses, and transits (Janam Kundli) to clarify your destiny, strengths, weaknesses, and future timelines.',
      icon: <FileText size={20} className="text-[#D3AF54]" />,
      image: vedicAstrologyImg,
      points: [
        'Detailed Janam Kundli analysis mapping life path cycles.',
        'Planetary transit and major Dasha period breakdowns.',
        'Precise career, relationships, and health timelines.'
      ],
      impact: 'Rohan Sharma aligned his career during a Saturn transition, securing promotion within 3 months.'
    },
    {
      id: 'numerology',
      title: 'Numerology Reading',
      price: '$80 / ₹6,499',
      duration: '45 mins',
      desc: 'Uncover the hidden patterns of your life path, destiny, and name frequencies. Align your personal vibrations to unlock career opportunities and wealth luck.',
      icon: <Hash size={20} className="text-[#D3AF54]" />,
      image: numerologyImg,
      points: [
        'Destiny and Life Path number vibration matching.',
        'Personalized business and name spelling correction.',
        'Identifying luck periods for career launch & investment.'
      ],
      impact: 'Vikram Aditya adjusted his startup name spelling and witnessed a 40% surge in user conversions.'
    },
    {
      id: 'vastu',
      title: 'Vastu Consultation',
      price: '$200 / ₹15,999',
      duration: 'Site Specific',
      desc: 'Optimize the flow of energy at home or work. Align rooms, elements, and layouts to clear blocking influences and invite growth, harmony, and prosperity.',
      icon: <HomeIcon size={20} className="text-[#D3AF54]" />,
      image: vastuConsultationImg,
      points: [
        'On-site or digital energy balance mapping.',
        'Directional layout and element alignment advice.',
        'Non-destructive, quick placement remedies.'
      ],
      impact: 'Priya Kapoor resolved main entrance energy blockages and brought immediate harmony into her household.'
    },
    {
      id: 'laal-kitaab',
      title: 'Laal Kitaab Remedies',
      price: '$90 / ₹7,499',
      duration: '45 mins',
      desc: 'Simple, practical, and highly effective remedial measures for planetary afflictions, debts, obstacles in career/marriage, and negative influences without complex rituals.',
      icon: <BookOpen size={20} className="text-[#D3AF54]" />,
      image: laalKitaabImg,
      points: [
        'Instant-action planetary affliction antidotes.',
        'Practical household and daily routine modifications.',
        'Zero complex or expensive ritual requirements.'
      ],
      impact: 'Dr. Aarav Mehta applied simple copper coin remedies to resolve stagnant pending litigation.'
    },
    {
      id: 'prashna-kundali',
      title: 'Expertise in Prashna Kundali',
      price: '$110 / ₹8,999',
      duration: '45 mins',
      desc: 'Get instant, precise answers to specific questions (concerning career, finance, marriage, missing items, etc.) based on the exact moment the question is asked.',
      icon: <HelpCircle size={20} className="text-[#D3AF54]" />,
      image: prashnaKundliImg,
      points: [
        'Specific query horoscope mapping (real-time).',
        'Direct "Yes/No" answers with timeline guides.',
        'Locating missing assets and timing career shifts.'
      ],
      impact: 'Amit Patel obtained clear directions on his business transition timeline during a critical trade block.'
    },
    {
      id: 'reiki-healing',
      title: 'Reiki Healer',
      price: '$75 / ₹5,999',
      duration: '30 mins',
      desc: 'Harmonize and channel life force energy to clear spiritual blocks, reduce stress, accelerate physical healing, and restore deep emotional balance.',
      icon: <Heart size={20} className="text-[#D3AF54]" />,
      image: reikiHealerImg,
      points: [
        'Distant and personal chakra energy healing.',
        'Stagnant aura clearance and stress reduction.',
        'Accelerating emotional and physical wellness.'
      ],
      impact: 'Neha Gupta resolved chronic fatigue and restored peace through remote chakra healing sessions.'
    }
  ]

  return (
    <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center px-6 py-12 font-sans">
      
      {/* ========================================================= */}
      {/* DECORATIVE BACKGROUNDS & PARALLAX                         */}
      {/* ========================================================= */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.04),transparent_70%)] rounded-full -z-10 pointer-events-none"></div>

      {/* Rotating Background Zodiac Motif */}
      <motion.div 
        style={{ y: yZodiac, rotate: rZodiac }}
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] flex justify-center items-center -z-10"
      >
        <svg className="w-[550px] h-[550px] text-[#AB7A57]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
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
        <span className="text-[#AB7A57] text-xs tracking-[0.25em] font-bold uppercase block mb-3 font-sans">
          ✦ CELESTIAL SERVICES ✦
        </span>
        <h1 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-[#181122] tracking-wide leading-tight">
          Guidance & Remedial Consultation
        </h1>
        <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-4 mb-4"></div>
        <p className="text-sm md:text-base text-[#181122]/90 leading-relaxed font-sans max-w-xl mx-auto">
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
              borderColor: "#D3AF54", 
              boxShadow: "0 25px 40px -15px rgba(211,175,84,0.1), 0 0 25px rgba(211, 175, 84, 0.25)" 
            }}
            className="bg-[#181122] border border-[#AB7A57]/20 rounded-3xl overflow-hidden flex flex-col justify-between text-left transition-all duration-300 shadow-lg cursor-pointer relative group text-white"
          >
            {/* Header Image banner */}
            <div className="w-full h-44 overflow-hidden relative border-b border-white/5">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181122] via-[#181122]/30 to-transparent pointer-events-none" />
              
              {/* Header block icon overlay */}
              <div className="absolute bottom-3 left-4 w-10 h-10 rounded-xl bg-[#FFFDEE] border border-[#BDBDBD]/40 flex items-center justify-center text-[#D3AF54]">
                {item.icon}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 flex flex-col flex-grow gap-4">
              {/* Title & Price info */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="font-serif text-white font-bold text-base sm:text-lg group-hover:text-[#D3AF54] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <div className="w-8 h-[1.5px] bg-[#D3AF54]/30 group-hover:w-16 transition-all duration-500 rounded-full"></div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] text-[#D8CFEB]/85 uppercase tracking-wider block font-semibold leading-none">{item.duration}</span>
                  <span className="text-xs font-bold text-[#D3AF54] bg-white/5 border border-[#D3AF54]/25 px-2 py-0.5 rounded-full mt-1 inline-block font-sans">{item.price}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#D8CFEB] leading-relaxed font-sans mt-0.5">
                {item.desc}
              </p>

              {/* Key Deliverables points */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D3AF54]">✦ What It Covers ✦</span>
                <ul className="space-y-1 text-xs text-[#D8CFEB]/85">
                  {item.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-1.5">
                      <span className="text-[#D3AF54] text-[9px] mt-0.5">✦</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Life Transformation Story */}
              <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 italic text-xs text-[#D3AF54]/95">
                <span className="font-sans font-semibold not-italic block text-[10px] text-[#D8CFEB]/60 uppercase tracking-widest mb-1">Impact Story</span>
                "{item.impact}"
              </div>
            </div>

            {/* Bottom Row action link */}
            <div className="border-t border-white/5 p-4 sm:p-5 flex justify-between items-center w-full bg-white/[0.01] gap-3">
              <MotionLink 
                to={`/services/${item.id}`}
                className="bg-[#D3AF54]/10 hover:bg-[#D3AF54] text-[#D3AF54] hover:text-[#181122] border border-[#D3AF54]/40 text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg transition-colors duration-300 flex-1 text-center"
              >
                Learn More
              </MotionLink>
              <MotionLink 
                to="/booking"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg transition-all duration-300 flex-1 text-center"
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
        className="w-full max-w-4xl mx-auto mt-6 z-10"
      >
        <div className="bg-[#181122] border border-[#D3AF54]/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 group text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D3AF54]/5 rounded-full blur-2xl"></div>
          
          <div className="space-y-2 text-left">
            <span className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide block">
              Not Sure Which Consultation Suits You?
            </span>
            <p className="text-xs text-[#D8CFEB] leading-relaxed max-w-lg font-sans">
              Reach out to us directly. We will review your birth credentials and suggest the ideal reading structure.
            </p>
          </div>

          <MotionLink 
            to="/contact"
            whileHover={{ scale: 1.05, y: -2, boxShadow: "0 10px 20px rgba(211, 175, 84, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 tracking-wide text-xs w-full md:w-auto shrink-0"
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

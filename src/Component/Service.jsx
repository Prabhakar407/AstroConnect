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
    <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center font-sans overflow-x-hidden">
      
      {/* ========================================================= */}
      {/* 1. HEADER SECTION (Warm Ivory bg-[#F4F1E3])               */}
      {/* ========================================================= */}
      <div className="w-full bg-[#F4F1E3] pt-12 pb-6 px-6 flex flex-col items-center border-b border-[#AB7A57]/10 relative z-10">
        
        {/* Decorative backgrounds & rotating zodiac inside header wrapper */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ y: yDrift }}
          className="text-center max-w-2xl relative z-10"
        >
          <span className="text-[#AB7A57] text-xs tracking-[0.25em] font-bold uppercase block mb-3 font-sans">
            ✦ CELESTIAL SERVICES ✦
          </span>
          <h1 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-[#181122] tracking-wide leading-tight">
            Guidance & Remedial Consultation
          </h1>
          <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-4 mb-2"></div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* 2. SERVICES GRID SECTION (Pure White bg-white)            */}
      {/* ========================================================= */}
      <div className="w-full bg-white pt-6 pb-16 px-6 flex flex-col items-center relative z-10 overflow-hidden">
        
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.04),transparent_70%)] rounded-full -z-10 pointer-events-none"></div>

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
                y: -6,
                borderColor: "#D3AF54",
                boxShadow: "0 25px 50px -12px rgba(24,17,34,0.5), 0 0 30px rgba(211,175,84,0.3)"
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative h-[310px] sm:h-[330px] rounded-3xl overflow-hidden border border-[#AB7A57]/30 bg-[#181122] group shadow-xl transition-all duration-500 cursor-pointer flex flex-col justify-end text-white text-left"
            >
              {/* Full Bleed Background Image with Scale Transition */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
              
              {/* Radial gradient overlay vignettes for high-contrast and depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#181122] via-[#181122]/75 to-black/30 z-10 transition-colors duration-500 group-hover:from-[#181122]/98 group-hover:via-[#181122]/90"></div>
              
              {/* Category Icon Badge (Top Left) */}
              <div className="absolute top-4 left-4 p-2 rounded-xl bg-[#181122]/90 border border-white/10 text-[#D3AF54] z-20 shadow-md">
                {item.icon}
              </div>

              {/* Price/Duration Badge (Top Right) */}
              <div className="absolute top-4 right-4 bg-[#D3AF54]/15 border border-[#D3AF54]/40 backdrop-blur-md px-3 py-1 rounded-lg z-20 text-[10px] uppercase font-bold tracking-widest text-[#D3AF54]">
                {item.duration}
              </div>

              {/* Card Contents Area (Slides up slightly on hover) */}
              <div className="p-6 relative z-20 flex flex-col gap-2 translate-y-0 lg:translate-y-12 lg:group-hover:translate-y-0 transition-transform duration-500 ease-out">
                
                <h3 style={{ color: '#D3AF54' }} className="font-serif font-bold text-xl transition-colors leading-tight">
                  {item.title}
                </h3>
                
                <p className="text-xs text-[#D8CFEB] leading-relaxed font-sans font-light line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300 mb-2">
                  {item.desc}
                </p>

                {/* Action Buttons (Fades and translates up on hover) */}
                <div className="flex gap-2.5 pt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 transition-all duration-500 ease-out delay-75">
                  <Link 
                    to={`/services/${item.id}`}
                    className="flex-1 border border-[#D3AF54]/30 hover:border-[#D3AF54] hover:bg-[#D3AF54]/10 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl text-center transition-all duration-300"
                  >
                    Details
                  </Link>
                  <Link 
                    to="/booking"
                    className="flex-1 bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl text-center transition-all duration-300 shadow-md shadow-[#D3AF54]/10"
                  >
                    Book Now
                  </Link>
                </div>

              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Custom Unsure CTA container block */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-5xl mt-12 bg-[#EDE9D7] border border-[#AB7A57]/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-xl relative justify-between text-[#181122] text-left animate-none"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.04),transparent_70%)] pointer-events-none"></div>
          <div className="space-y-2 z-10 max-w-2xl">
            <h3 className="font-serif font-bold text-xl text-[#181122]">Unsure which reading fits?</h3>
            <p className="text-xs text-[#181122]/90 font-sans font-medium leading-relaxed">
              Reach out to us directly. We will review your birth credentials and suggest the ideal reading structure.
            </p>
          </div>

          <MotionLink 
            to="/contact"
            whileHover={{ scale: 1.05, y: -2, boxShadow: "0 10px 20px rgba(24, 17, 34, 0.15)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="bg-[#181122] hover:bg-[#181122]/90 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 tracking-wide text-xs w-full md:w-auto shrink-0 z-10"
          >
            <Calendar size={14} />
            <span>Connect Personally</span>
          </MotionLink>
        </motion.div>
      </div>

    </div>
  )
}

export default Service

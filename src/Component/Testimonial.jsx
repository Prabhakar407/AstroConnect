import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

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
 * Testimonial Component
 * Premium luxury astrology website Testimonial Section.
 * Implements an open, spacious editorial layout with smooth 3-second automatic cycling,
 * pagination dot controls, and minimal circular navigation buttons.
 * Optimized with compact vertical spacing to load completely above the fold.
 */
function Testimonial() {
  const { scrollY } = useScroll()
  const yZodiac = useTransform(scrollY, [0, 1000], [0, -80])
  const rZodiac = useTransform(scrollY, [0, 1000], [0, 30])
  const yStage = useTransform(scrollY, [0, 1000], [0, -35])

  const reviews = [
    {
      name: "ANU",
      rating: 5,
      date: "December 2021",
      service: "Kundli Consultation",
      text: "Very knowledgeable and professional astrologer. The consultation was detailed and the guidance provided was extremely helpful. I would highly recommend their services to anyone seeking clarity and direction in life."
    },
    {
      name: "ELENA R.",
      rating: 5,
      date: "July 2024",
      service: "Kundli Analysis",
      text: "The guidance I received brought clarity and confidence to my life. The remedies were practical and the predictions were remarkably accurate."
    },
    {
      name: "MARCUS T.",
      rating: 5,
      date: "September 2024",
      service: "Career Guidance",
      text: "Understanding my transits and Saturn cycle through Kundan's counseling helped me navigate my career transition successfully."
    },
    {
      name: "PRIYA K.",
      rating: 5,
      date: "October 2024",
      service: "Vastu Consultation",
      text: "Amazing Vastu advice! Making small changes at our entrance brought positive vibes and progress within weeks."
    },
    {
      name: "DR. AARAV MEHTA",
      rating: 5,
      date: "November 2024",
      service: "Gemstone Advice",
      text: "Wearing the recommended Yellow Sapphire has brought immense mental clarity and improved my focus in my clinical work."
    },
    {
      name: "SARAH JENKINS",
      rating: 5,
      date: "January 2025",
      service: "Love & Marriage",
      text: "The compatibility reading was spot on. Kundan suggested simple mantra remedies that helped ease the relationship friction."
    }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto transition every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [reviews.length])

  // Manual navigation handlers
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length)
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length)
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFCF5] relative overflow-hidden flex flex-col items-center justify-start px-6 pt-6 md:pt-8 pb-12 font-sans text-[#181122]">
      
      {/* ========================================================= */}
      {/* DECORATIVE BACKGROUND ELEMENTS                            */}
      {/* ========================================================= */}
      
      {/* Subtle mandala patterns in corners */}
      <div className="absolute -top-20 -left-20 w-80 h-80 text-[#AB7A57]/8 pointer-events-none select-none opacity-30">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="40" strokeDasharray="1,1" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="20" strokeDasharray="2,2" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      <div className="absolute -bottom-20 -right-20 w-80 h-80 text-[#AB7A57]/8 pointer-events-none select-none opacity-30">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="40" strokeDasharray="1,1" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="20" strokeDasharray="2,2" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      {/* Faint gold decorative glow in the center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.04),transparent_70%)] rounded-full pointer-events-none -z-10"></div>

      {/* Rotating Background Zodiac Motif */}
      <motion.div 
        style={{ y: yZodiac, rotate: rZodiac }}
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02] flex justify-center items-center"
      >
        <svg className="w-[550px] h-[550px] text-[#AB7A57] animate-[spin_260s_linear_infinite]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
          <circle cx="100" cy="100" r="95" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="75" />
          <circle cx="100" cy="100" r="55" strokeDasharray="2 2" />
          <line x1="100" y1="5" x2="100" y2="195" />
          <line x1="5" y1="100" x2="195" y2="100" />
        </svg>
      </motion.div>

      {/* ========================================================= */}
      {/* SECTION HEADER                                            */}
      {/* ========================================================= */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-4xl relative z-10 flex flex-col items-center"
      >
        <motion.div variants={itemVariants} className="text-center max-w-2xl mb-4 relative z-10 flex flex-col items-center">
          {/* Large Heading */}
          <h1 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif text-[#181122] font-bold tracking-wide leading-tight">
            Client Testimonials
          </h1>

          {/* Small decorative divider */}
          <div className="w-12 h-[1px] bg-[#D3AF54] mx-auto mt-2 mb-2 rounded-full"></div>

          {/* Rating Summary */}
          <div className="flex items-center justify-center gap-1.5 mt-1 bg-[#181122] px-3.5 py-1.5 rounded-full border border-[#D3AF54]/30 shadow-md">
            <Star size={12} className="fill-[#D3AF54] text-[#D3AF54]" />
            <span className="font-sans text-[11px] sm:text-xs font-semibold text-[#D3AF54] tracking-wide">
              4.9 Rating from 150+ Reviews
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* ========================================================= */}
      {/* TESTIMONIAL DISPLAY STAGE (No borders, open & spacious)    */}
      {/* ========================================================= */}
      <motion.div variants={itemVariants} style={{ y: yStage }} className="w-full max-w-4xl relative z-10 min-h-[220px] flex items-center justify-center px-4">
        
        {/* Decorative Quote Icon behind/beside the quote */}
        <span className="absolute top-2 left-4 text-[#D3AF54]/10 text-[10rem] font-serif leading-none select-none pointer-events-none">
          “
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full flex flex-col items-center text-center px-2 py-2 sm:px-12 relative"
          >
            {/* Client Image Placeholder */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-dashed border-[#AB7A57]/45 bg-white flex items-center justify-center shadow-inner mb-3 overflow-hidden relative shrink-0 text-2xl">
              <span>👤</span>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-1 mb-3.5">
              {[...Array(reviews[currentIndex].rating)].map((_, i) => (
                <Star key={i} size={15} className="fill-[#D3AF54] text-[#D3AF54]" />
              ))}
            </div>

            {/* Review Text */}
            <blockquote className="max-w-3xl">
              <p className="font-serif italic text-[#181122]/90 text-base md:text-lg lg:text-xl leading-relaxed tracking-wide mb-5 font-medium">
                "{reviews[currentIndex].text}"
              </p>
            </blockquote>

            {/* Client Information */}
            <div className="mt-1 flex flex-col items-center">
              <span className="font-serif font-bold uppercase tracking-widest text-[#181122] text-sm md:text-base block">
                {reviews[currentIndex].name}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#AB7A57] font-sans font-semibold tracking-widest block mt-1 uppercase">
                {reviews[currentIndex].date} • {reviews[currentIndex].service}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

      </motion.div>

      {/* ========================================================= */}
      {/* INTERACTIVE CONTROLS & NAVIGATION                         */}
      {/* ========================================================= */}
      <motion.div variants={itemVariants} className="flex items-center gap-6 mt-6 relative z-10">
        
        {/* Previous Button */}
        <motion.button 
          onClick={handlePrev}
          whileHover={{ scale: 1.1, borderColor: "#D3AF54", boxShadow: "0 0 10px rgba(211, 175, 84, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-full border border-[#AB7A57]/30 bg-white flex items-center justify-center text-[#181122] hover:bg-[#D3AF54] hover:text-[#181122] hover:border-[#D3AF54] transition-all duration-300 cursor-pointer shadow-sm shrink-0"
          aria-label="Previous Testimonial"
        >
          <ChevronLeft size={16} />
        </motion.button>

        {/* Bullet Dot Indicators */}
        <div className="flex items-center gap-2">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'bg-[#D3AF54] scale-110 shadow-[0_0_6px_rgba(211,175,84,0.5)]' 
                  : 'bg-[#AB7A57]/25 hover:bg-[#AB7A57]/60'
              }`}
              aria-label={`Go to testimonial ${idx + 1}`}
            ></button>
          ))}
        </div>

        {/* Next Button */}
        <motion.button 
          onClick={handleNext}
          whileHover={{ scale: 1.1, borderColor: "#D3AF54", boxShadow: "0 0 10px rgba(211, 175, 84, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-full border border-[#AB7A57]/30 bg-white flex items-center justify-center text-[#181122] hover:bg-[#D3AF54] hover:text-[#181122] hover:border-[#D3AF54] transition-all duration-300 cursor-pointer shadow-sm shrink-0"
          aria-label="Next Testimonial"
        >
          <ChevronRight size={16} />
        </motion.button>
      </motion.div>
 
    </div>
  )
}

export default Testimonial

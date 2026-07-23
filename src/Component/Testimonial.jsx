import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Testimonial Component
 * Premium luxury astrology website Testimonial Section.
 * Implements an open, spacious editorial layout with smooth 3-second automatic cycling,
 * pagination dot controls, and minimal circular navigation buttons.
 * Optimized with compact vertical spacing to load completely above the fold.
 */
function Testimonial() {
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
    <div className="w-full min-h-screen bg-[#FCF3ED] relative overflow-hidden flex flex-col items-center justify-start px-6 pt-6 md:pt-8 pb-12 font-sans">
      
      {/* ========================================================= */}
      {/* DECORATIVE BACKGROUND ELEMENTS                            */}
      {/* ========================================================= */}
      
      {/* Subtle mandala patterns in corners */}
      <div className="absolute -top-20 -left-20 w-80 h-80 text-[#fcb900]/8 pointer-events-none select-none opacity-30">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="40" strokeDasharray="1,1" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="20" strokeDasharray="2,2" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      <div className="absolute -bottom-20 -right-20 w-80 h-80 text-[#fcb900]/8 pointer-events-none select-none opacity-30">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="40" strokeDasharray="1,1" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="20" strokeDasharray="2,2" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      {/* Faint gold decorative glow in the center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.06),transparent_70%)] rounded-full pointer-events-none -z-10"></div>

      {/* Rotating Background Zodiac Motif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04] flex justify-center items-center">
        <svg className="w-[550px] h-[550px] text-[#A6755D] animate-[spin_260s_linear_infinite]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
          <circle cx="100" cy="100" r="95" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="75" />
          <circle cx="100" cy="100" r="55" strokeDasharray="2 2" />
          <line x1="100" y1="5" x2="100" y2="195" />
          <line x1="5" y1="100" x2="195" y2="100" />
        </svg>
      </div>

      {/* ========================================================= */}
      {/* SECTION HEADER                                            */}
      {/* ========================================================= */}
      <div className="text-center max-w-2xl mb-4 relative z-10 flex flex-col items-center">
        {/* Large Heading */}
        <h1 className="text-2xl md:text-4xl font-serif text-[#55393F] font-bold tracking-wide">
          Client Testimonials
        </h1>

        {/* Small decorative divider */}
        <div className="w-12 h-[1px] bg-[#fcb900] shadow-[0_0_8px_#fcb900] mx-auto mt-2 mb-2 rounded-full"></div>

        {/* Rating Summary */}
        <div className="flex items-center justify-center gap-1.5 mt-1 bg-[#2A132E]/3 px-3.5 py-1 rounded-full border border-[#fcb900]/20">
          <Star size={12} className="fill-[#fcb900] text-[#fcb900]" />
          <span className="font-sans text-[11px] sm:text-xs font-semibold text-[#55393F] tracking-wide">
            4.9 Rating from 150+ Reviews
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TESTIMONIAL DISPLAY STAGE (No borders, open & spacious)    */}
      {/* ========================================================= */}
      <div className="w-full max-w-4xl relative z-10 min-h-[220px] flex items-center justify-center px-4">
        
        {/* Decorative Quote Icon behind/beside the quote */}
        <span className="absolute top-2 left-4 text-[#fcb900]/6 text-[10rem] font-serif leading-none select-none pointer-events-none">
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
            {/* Client Image Placeholder (Blank as requested) */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-dashed border-[#fcb900]/50 bg-white/30 backdrop-blur-sm shadow-inner mb-3 overflow-hidden relative shrink-0">
              <img 
                src="" 
                alt={reviews[currentIndex].name} 
                className="w-full h-full object-cover absolute inset-0 z-10"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-1 mb-3.5">
              {[...Array(reviews[currentIndex].rating)].map((_, i) => (
                <Star key={i} size={15} className="fill-[#fcb900] text-[#fcb900]" />
              ))}
            </div>

            {/* Review Text */}
            <blockquote className="max-w-3xl">
              <p className="font-serif italic text-[#55393F] text-base md:text-lg lg:text-xl leading-relaxed tracking-wide mb-5 font-medium">
                "{reviews[currentIndex].text}"
              </p>
            </blockquote>

            {/* Client Information */}
            <div className="mt-1 flex flex-col items-center">
              <span className="font-serif font-bold uppercase tracking-widest text-[#55393F] text-sm md:text-base block">
                {reviews[currentIndex].name}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#A6755D] font-sans font-semibold tracking-widest block mt-1 uppercase">
                {reviews[currentIndex].date} • {reviews[currentIndex].service}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE CONTROLS & NAVIGATION                         */}
      {/* ========================================================= */}
      <div className="flex items-center gap-6 mt-6 relative z-10">
        
        {/* Previous Button */}
        <button 
          onClick={handlePrev}
          className="w-9 h-9 rounded-full border border-[#fcb900] bg-white flex items-center justify-center text-[#A6755D] hover:bg-[#FCF3ED] hover:text-[#55393F] transition duration-300 cursor-pointer shadow-sm active:scale-95 shrink-0"
          aria-label="Previous Testimonial"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Bullet Dot Indicators */}
        <div className="flex items-center gap-2">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'bg-[#fcb900] scale-110 shadow-[0_0_6px_rgba(252,185,0,0.5)]' 
                  : 'bg-[#fcb900]/25 hover:bg-[#fcb900]/60'
              }`}
              aria-label={`Go to testimonial ${idx + 1}`}
            ></button>
          ))}
        </div>

        {/* Next Button */}
        <button 
          onClick={handleNext}
          className="w-9 h-9 rounded-full border border-[#fcb900] bg-white flex items-center justify-center text-[#A6755D] hover:bg-[#FCF3ED] hover:text-[#55393F] transition duration-300 cursor-pointer shadow-sm active:scale-95 shrink-0"
          aria-label="Next Testimonial"
        >
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  )
}

export default Testimonial

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
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


const ExpertiseSlider = ({ expertiseData }) => {
  const [visibleCount, setVisibleCount] = useState(5)
  const [startIndex, setStartIndex] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1200) {
        setVisibleCount(3);
      } else {
        setVisibleCount(5);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const centerIndex = Math.floor(visibleCount / 2);

  const getVisibleItems = () => {
    const items = [];
    for (let i = 0; i < visibleCount; i++) {
      items.push(expertiseData[(startIndex + i) % expertiseData.length]);
    }
    return items;
  };

  const handleNext = () => {
    setStartIndex((prevIndex) => (prevIndex + 1) % expertiseData.length);
  };

  const handlePrev = () => {
    setStartIndex((prevIndex) => (prevIndex - 1 + expertiseData.length) % expertiseData.length);
  };

  // 4-second auto-slide interval that resets when manually navigated
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [startIndex, expertiseData.length]);

  const visibleExpertise = getVisibleItems();

  const getCardStyles = (index) => {
    if (visibleCount === 5) {
      if (index < 2) return 'navy';
      if (index === 2) return 'holo';
      return 'burgundy';
    } else if (visibleCount === 3) {
      if (index === 0) return 'navy';
      if (index === 1) return 'holo';
      return 'burgundy';
    } else {
      return 'holo';
    }
  };

  return (
    <div className="w-full relative max-w-7xl mx-auto px-12 sm:px-16 md:px-24 py-6 overflow-visible select-none">
      {/* Left Navigation Button */}
      <button 
        onClick={handlePrev} 
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-md border border-gray-200 z-20 hover:scale-105 active:scale-95 transition-all text-[#2A132E] cursor-pointer"
        aria-label="Previous Expertise"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Slider Container */}
      <div className="relative w-full">
        <div className="flex justify-center items-center gap-4 overflow-visible relative min-h-[380px]">
          <AnimatePresence initial={false} mode="popLayout">
            {visibleExpertise.map((item, index) => {
              const isCenter = index === centerIndex;
              const cardStyle = getCardStyles(index);

              // Determine classes & styles based on computed card layout position
              let bgClass = "";
              let titleClass = "";
              let textClass = "";
              let borderStyle = {};
              let iconContainerClass = "";

              if (cardStyle === 'navy') {
                bgClass = "bg-[#131F37] text-white";
                borderStyle = { border: '1px solid rgba(252, 185, 0, 0.35)' };
                titleClass = "text-[#fcb900]";
                textClass = "text-[#E7D3CE]/90";
                iconContainerClass = "border border-[#fcb900]/40";
              } else if (cardStyle === 'holo') {
                bgClass = "text-[#2A132E]";
                borderStyle = { 
                  background: 'linear-gradient(135deg, #FFF5EC 0%, #F5E6FF 30%, #E6F0FF 70%, #FFF5EC 100%)',
                  border: '1px solid #fcb900'
                };
                titleClass = "text-[#2A132E]";
                textClass = "text-[#55393F] font-semibold";
                iconContainerClass = "bg-gradient-to-b from-[#e6c07b] to-[#bfa054] shadow-sm";
              } else { // burgundy
                bgClass = "bg-[#4A121A] text-white";
                borderStyle = { border: '1px solid rgba(252, 185, 0, 0.35)' };
                titleClass = "text-[#fcb900]";
                textClass = "text-[#E7D3CE]/90";
                iconContainerClass = "bg-gradient-to-b from-[#e6c07b] to-[#bfa054] shadow-sm";
              }

              // Calculate 3D z-axis depth values dynamically based on distance from center card
              const distance = Math.abs(index - centerIndex);
              let scale = 1.0;
              let y = 0;
              let x = 0;
              let zIndex = 1;
              let opacity = 1;
              let boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";

              if (distance === 0) {
                scale = 1.1;
                y = -10;
                zIndex = 10;
                opacity = 1;
                boxShadow = '0 25px 50px -12px rgba(252, 185, 0, 0.4), 0 12px 24px -10px rgba(252, 185, 0, 0.25)';
              } else if (distance === 1) {
                scale = 0.95;
                y = 0;
                zIndex = 5;
                opacity = 0.85;
                boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              } else { // distance === 2
                scale = 0.8;
                y = 10;
                zIndex = 1;
                opacity = 0.6;
                boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
              }

              // Apply translation x to bring outer cards closer to adjacent cards
              if (visibleCount === 5) {
                if (index === 0) x = 32;
                else if (index === 4) x = -32;
              } else if (visibleCount === 3) {
                if (index === 0) x = 16;
                else if (index === 2) x = -16;
              }

              // Helper to clone icon dynamically
              const renderClonedIcon = () => {
                if (!item.icon) return null;
                let colorClass = "text-[#fcb900]";
                if (cardStyle === 'holo' || cardStyle === 'burgundy') {
                  colorClass = "text-white";
                }
                return React.cloneElement(item.icon, {
                  className: `${colorClass} shrink-0`,
                  size: 20
                });
              };

              return (
                <motion.div
                  key={item.title}
                  layout
                  animate={{
                    scale,
                    y,
                    x,
                    zIndex,
                    opacity,
                    boxShadow
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={borderStyle}
                  className={`
                    flex-none w-[195px] h-[320px] rounded-2xl p-6 flex flex-col justify-between 
                    cursor-pointer transition-colors duration-300 text-center items-center relative
                    ${bgClass}
                  `}
                >
                  {/* Pearlescent Active Glow Blast */}
                  {isCenter && (
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.3)_0%,transparent_60%)] blur-3xl scale-[1.7] animate-pulse pointer-events-none" />
                  )}

                  <div className="flex flex-col gap-4 text-center items-center">
                    {/* Circle Icon Badge */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${iconContainerClass}`}>
                      {renderClonedIcon()}
                    </div>
                    <div className={`text-sm font-bold tracking-wide font-serif leading-tight ${titleClass}`}>
                      {item.title}
                    </div>
                    <p className={`text-[11px] leading-relaxed font-sans line-clamp-6 ${textClass}`}>
                      {item.desc}
                    </p>
                  </div>

                  <div className={`text-[9px] font-bold tracking-wider uppercase mt-2 ${isCenter ? 'text-[#2A132E]' : 'text-[#fcb900]/80'}`}>
                    {isCenter ? 'ACTIVE ✦' : 'EXPLORE'}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Navigation Button */}
      <button 
        onClick={handleNext} 
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-md border border-gray-200 z-20 hover:scale-105 active:scale-95 transition-all text-[#2A132E] cursor-pointer"
        aria-label="Next Expertise"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

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
      desc: "In-depth evaluation of planetary combinations, aspects, and houses to uncover your soul's life path, potentials, and destiny timelines.",
      icon: <FileText size={20} className="text-[#fcb900]" />
    },
    {
      title: "Marriage & Relationship Guidance",
      desc: "Detailed compatibility testing (Kundli matching/Gun Milan), resolving delays or friction in partnerships, and promoting lasting marital harmony.",
      icon: <Heart size={20} className="text-[#fcb900]" />
    },
    {
      title: "Career Consultation",
      desc: "Strategic timing for job changes, promotions, business expansions, and matching your natal strengths with the perfect industries.",
      icon: <Briefcase size={20} className="text-[#fcb900]" />
    },
    {
      title: "Business Astrology",
      desc: "Identifying planetary triggers for financial growth, choosing auspicious venture names, and selecting successful business incorporation timelines.",
      icon: <Gem size={20} className="text-[#fcb900]" />
    },
    {
      title: "Numerology Reading",
      desc: "Harmonizing the numerical vibrations of your name and birth date with cosmic energies to remove structural obstacles and unlock opportunities.",
      icon: <Hash size={20} className="text-[#fcb900]" />
    },
    {
      title: "Vastu Consultation",
      desc: "Aligning home and workplace layouts with directional energies to eliminate negative flows and invite health, peace, and wealth.",
      icon: <HomeIcon size={20} className="text-[#fcb900]" />
    }
  ]

  // Awards & Recognition Data (Marquee)
  const awardsData = [
    {
      title: "Vedic Jyotish Shiromani",
      desc: "Presented by the Astro Council for excellence in astrological research."
    },
    {
      title: "Excellence in Vastu Shastra",
      desc: "Recognized for transforming spaces to maximize positive energy flow."
    },
    {
      title: "National Astro Science Award 2024",
      desc: "Awarded for significant contributions to preserving Vedic wisdom."
    },
    {
      title: "Best Relationship Counselor",
      desc: "Honored for guiding over 10,000 couples to marital harmony."
    },
    {
      title: "Global Spiritual Leadership",
      desc: "Awarded by the Spiritual Harmony Trust for international guidance."
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

  return (
    <div className="w-full bg-[#FDF9F7] relative overflow-hidden flex flex-col items-center font-sans">
      
      {/* ========================================================= */}
      {/* 1. INTRO / BIOGRAPHY SECTION (Highly visible on load)      */}
      {/* ========================================================= */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-8 pt-4 md:pt-6 pb-12 relative z-10">
        
        {/* Glow & Luxury SVG Decor Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.08),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
        <motion.div style={{ y: yZodiac, rotate: rZodiac }} className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.05] flex justify-center items-center">
          <svg className="w-[500px] h-[500px] text-[#A6755D] animate-[spin_200s_linear_infinite]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
            <circle cx="100" cy="100" r="90" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="70" />
            <circle cx="100" cy="100" r="50" strokeDasharray="2 2" />
            <line x1="100" y1="10" x2="100" y2="190" />
            <line x1="10" y1="100" x2="190" y2="100" />
          </svg>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Portrait Image Frame (Shifted upward, compact responsive sizing) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ y: yLeft }}
            className="lg:col-span-5 flex justify-center relative w-full pt-2 lg:pt-4"
          >
            {/* Elegant outer frames */}
            <div className="absolute w-[110%] h-[110%] -top-[5%] -left-[5%] border border-[#fcb900]/10 rounded-full animate-[spin_240s_linear_infinite] pointer-events-none"></div>
            <div className="absolute w-[104%] h-[104%] -top-[2%] -left-[2%] border border-dashed border-[#A6755D]/10 rounded-full pointer-events-none"></div>
            
            {/* Sparkles & soft glow */}
            <div className="absolute top-2 right-2 text-[#fcb900]/45 animate-pulse"><Sparkles size={20} /></div>
            <div className="absolute bottom-6 left-2 text-[#A6755D]/40"><Sparkles size={16} /></div>

            {/* Premium Compact Frame */}
            <div className="relative w-full max-w-[230px] sm:max-w-[280px] md:max-w-[300px] lg:max-w-[340px] aspect-[4/5] rounded-[20px] overflow-hidden border border-[#fcb900]/50 bg-gradient-to-tr from-[#2A132E] to-[#55393F] shadow-[0_20px_50px_rgba(42,19,46,0.3),_0_0_20px_rgba(252,185,0,0.2)] hover:shadow-[0_25px_60px_rgba(42,19,46,0.35),_0_0_35px_rgba(252,185,0,0.45)] transition-all duration-500 flex items-center justify-center group">
              {/* Actual Image Tag */}
              <img 
                src="" 
                alt="Astrologer Kundan Singh" 
                className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              
              {/* Luxury Frame Overlay */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-10 bg-[#2A132E]/35 backdrop-blur-[1px]">
                {/* Subtle Inner Gold Border */}
                <div className="absolute inset-3.5 border border-[#fcb900]/25 rounded-xl pointer-events-none"></div>
                
                {/* Corner Accents */}
                <div className="absolute top-5 left-5 text-[#fcb900]/45 text-[10px]">✦</div>
                <div className="absolute top-5 right-5 text-[#fcb900]/45 text-[10px]">✦</div>
                <div className="absolute bottom-5 left-5 text-[#fcb900]/45 text-[10px]">✦</div>
                <div className="absolute bottom-5 right-5 text-[#fcb900]/45 text-[10px]">✦</div>
                
                {/* Placeholder Typography */}
                <span className="text-4xl mb-3 text-[#fcb900] filter drop-shadow-[0_0_6px_rgba(252,185,0,0.35)]">✨</span>
                <h3 className="font-serif text-xl tracking-widest text-[#FDF9F7] uppercase font-bold">Kundan Singh</h3>
                <span className="text-[10px] text-[#EBDCD4] mt-1.5 font-sans tracking-widest uppercase font-semibold">Vedic Astrology Expert</span>
                <span className="text-[9px] text-[#fcb900]/80 mt-4 uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-full border border-white/10">Portrait Frame</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Bio Content + Booking Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            style={{ y: yRight }}
            className="lg:col-span-7 flex flex-col text-left justify-start pt-2"
          >
            {/* Small decorative label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2A132E]/5 border border-[#fcb900]/30 rounded-full w-fit mb-4">
              <span className="w-1.5 h-1.5 bg-[#fcb900] rounded-full animate-pulse"></span>
              <span className="text-[9px] tracking-[0.2em] font-semibold text-[#55393F] uppercase font-sans">
                ABOUT THE ASTROLOGER
              </span>
            </div>

            {/* Large Heading */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-[#2A132E] font-bold leading-tight mb-5">
              A Renowned Vedic Astrologer <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#fcb900] via-[#A6755D] to-[#fcb900] bg-clip-text text-transparent drop-shadow-sm">
                Dedicated to Your Success
              </span>
            </h1>

            {/* Biography paragraphs */}
            <div className="space-y-4 text-sm md:text-base text-[#55393F] leading-relaxed font-sans opacity-95">
              <p>
                Astrologer Kundan Singh is a distinguished Vedic Astrology consultant with over 25 years of experience. Combining traditional Vedic wisdom with modern analytical insights, he has guided thousands of seekers worldwide to find clarity, direction, and practical solutions in career, relationships, and health.
              </p>
              <p>
                Known for his high accuracy and absolute confidentiality, Kundan offers personalized horoscope evaluations, career planning, and space alignments (Vastu). His goal is to empower you to make informed decisions and align with your true cosmic purpose.
              </p>
            </div>

            {/* CTA Buttons Row - Styled exactly like the homepage */}
            <div className="flex flex-wrap gap-4 pt-6">
              <MotionLink 
                to="/booking" 
                whileHover={{ scale: 1.05, y: -2, boxShadow: "0 10px 25px rgba(42, 19, 46, 0.2), 0 0 20px rgba(252, 185, 0, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 450, damping: 15 }}
                className="bg-[#2A132E] hover:bg-[#fcb900] text-white hover:text-[#2A132E] border border-[#2A132E] hover:border-[#fcb900] font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-md cursor-pointer group text-sm"
              >
                <Calendar size={18} className="text-[#fcb900] group-hover:text-[#2A132E] transition-colors" />
                <span>Book Consultation</span>
              </MotionLink>

              <MotionLink 
                to="/contact" 
                whileHover={{ scale: 1.05, y: -2, boxShadow: "0 10px 20px rgba(42, 19, 46, 0.1), 0 0 15px rgba(166, 117, 93, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 450, damping: 15 }}
                className="bg-white hover:bg-[#FCF3ED] text-[#55393F] border border-[#fcb900] hover:border-[#A6755D] font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-sm cursor-pointer text-sm"
              >
                <Phone size={18} className="text-[#A6755D]" />
                <span>Call Now</span>
              </MotionLink>
            </div>

            {/* 4 Premium Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-[#BDA9A8]/30">
              <div className="flex flex-col items-start gap-1 p-3 bg-[#FCF3ED]/80 border border-[#E7D3CE]/60 rounded-xl">
                <div className="w-7 h-7 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white/80 shrink-0">
                  <Award size={12} />
                </div>
                <span className="text-sm font-bold text-[#2A132E] mt-1 font-serif">25+ Years</span>
                <span className="text-[9px] uppercase text-[#55393F]/90 tracking-wider font-semibold">Experience</span>
              </div>

              <div className="flex flex-col items-start gap-1 p-3 bg-[#FCF3ED]/80 border border-[#E7D3CE]/60 rounded-xl">
                <div className="w-7 h-7 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white/80 shrink-0">
                  <Users size={12} />
                </div>
                <span className="text-sm font-bold text-[#2A132E] mt-1 font-serif">50,000+</span>
                <span className="text-[9px] uppercase text-[#55393F]/90 tracking-wider font-semibold">Consults</span>
              </div>

              <div className="flex flex-col items-start gap-1 p-3 bg-[#FCF3ED]/80 border border-[#E7D3CE]/60 rounded-xl">
                <div className="w-7 h-7 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white/80 shrink-0">
                  <Globe size={12} />
                </div>
                <span className="text-sm font-bold text-[#2A132E] mt-1 font-serif">Global</span>
                <span className="text-[9px] uppercase text-[#55393F]/90 tracking-wider font-semibold">Clients</span>
              </div>

              <div className="flex flex-col items-start gap-1 p-3 bg-[#FCF3ED]/80 border border-[#E7D3CE]/60 rounded-xl">
                <div className="w-7 h-7 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white/80 shrink-0">
                  <Star size={12} className="fill-[#fcb900] text-[#fcb900]" />
                </div>
                <span className="text-sm font-bold text-[#2A132E] mt-1 font-serif">4.9 / 5</span>
                <span className="text-[9px] uppercase text-[#55393F]/90 tracking-wider font-semibold">Rating</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* 2. EXPERTISE SECTION (Professional, Modern & Beautiful)   */}
      {/* ========================================================= */}
      <section className="w-full bg-gradient-to-b from-[#FCF3ED]/30 via-[#F5E6DD]/40 to-[#FCF3ED]/30 border-y border-[#E7D3CE]/45 py-12 md:py-16 relative overflow-hidden">
        {/* Glowing visual background highlights */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.08),transparent_70%)] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(166,117,93,0.06),transparent_70%)] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center">
          {/* Section Header */}
          <div className="text-center max-w-2xl mb-10 md:mb-12 relative z-10">
            <span className="text-[#A6755D] text-xs tracking-[0.25em] uppercase font-bold block mb-3 font-sans">
              AREAS OF EXPERTISE
            </span>
            <h2 className="text-2xl md:text-3xl font-serif text-[#2A132E] font-bold mb-3 tracking-wide leading-tight">
              Areas of Expertise
            </h2>
            <div className="w-12 h-[1px] bg-[#fcb900] mx-auto mt-3 mb-3"></div>
            <p className="text-xs md:text-sm text-[#55393F] font-sans leading-relaxed italic opacity-90">
              "Comprehensive guidance for every important aspect of life."
            </p>
          </div>

          {/* Areas of Expertise Carousel Slider */}
          <div className="w-full z-10">
            <ExpertiseSlider expertiseData={expertiseData} />
          </div>
        </div>
      </section>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* 3. AWARDS & RECOGNITION (Snug card sizes, blank image div) */}
      {/* ========================================================= */}
      <section className="w-full py-16 bg-[#FCF3ED]/30 border-y border-[#E7D3CE]/40 overflow-hidden relative">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 mb-10 text-center">
          <span className="text-[#A6755D] text-xs tracking-[0.25em] uppercase font-bold block mb-3 font-sans">
            HONORS & DISTINCTIONS
          </span>
          <h2 className="text-2xl md:text-3xl font-serif text-[#2A132E] font-bold">
            Awards & Recognition
          </h2>
          <div className="w-12 h-[1px] bg-[#fcb900] mx-auto mt-3"></div>
        </div>

        {/* Snug marquee cards with large blank image slots, items-start alignment */}
        <div className="relative w-full flex overflow-x-hidden">
          {/* Row 1 of cards */}
          <div className="flex gap-6 animate-marquee whitespace-nowrap py-4 shrink-0">
            {awardsData.map((item, idx) => (
              <div 
                key={idx} 
                className="w-[450px] sm:w-[500px] bg-white border border-[#E7D3CE]/60 rounded-3xl p-6 flex items-start gap-6 shadow-sm shrink-0 whitespace-normal hover:border-[#fcb900]/60 transition-colors cursor-pointer group"
              >
                {/* Large Square Image Frame (Completely Blank/Empty) */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-tr from-[#FCF3ED] to-[#F7F0EE] border border-[#fcb900]/30 shrink-0 overflow-hidden relative shadow-inner">
                  <img 
                    src="" 
                    alt={item.title} 
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="flex-grow pt-1">
                  <h4 className="font-serif text-[#2A132E] font-bold text-sm sm:text-base leading-snug">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-[#55393F] mt-2.5 font-sans leading-relaxed opacity-90">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Duplicate Row 1 for seamless loop */}
          <div className="flex gap-6 animate-marquee whitespace-nowrap py-4 shrink-0" aria-hidden="true">
            {awardsData.map((item, idx) => (
              <div 
                key={`dup-${idx}`} 
                className="w-[450px] sm:w-[500px] bg-white border border-[#E7D3CE]/60 rounded-3xl p-6 flex items-start gap-6 shadow-sm shrink-0 whitespace-normal hover:border-[#fcb900]/60 transition-colors cursor-pointer group"
              >
                {/* Large Square Image Frame (Completely Blank/Empty) */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-tr from-[#FCF3ED] to-[#F7F0EE] border border-[#fcb900]/30 shrink-0 overflow-hidden relative shadow-inner">
                  <img 
                    src="" 
                    alt={item.title} 
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="flex-grow pt-1">
                  <h4 className="font-serif text-[#2A132E] font-bold text-sm sm:text-base leading-snug">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-[#55393F] mt-2.5 font-sans leading-relaxed opacity-90">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* 4. PROFESSIONAL CERTIFICATES (Snug card sizes, blank image div) */}
      {/* ========================================================= */}
      <section className="w-full py-16 bg-[#FDF9F7] overflow-hidden relative">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 mb-10 text-center">
          <span className="text-[#A6755D] text-xs tracking-[0.25em] uppercase font-bold block mb-3 font-sans">
            QUALIFICATIONS & ACCREDITATIONS
          </span>
          <h2 className="text-2xl md:text-3xl font-serif text-[#2A132E] font-bold">
            Certificates
          </h2>
          <div className="w-12 h-[1px] bg-[#fcb900] mx-auto mt-3"></div>
        </div>

        {/* Snug marquee cards reverse with large blank image slots, items-start alignment */}
        <div className="relative w-full flex overflow-x-hidden">
          {/* Row 2 of cards */}
          <div className="flex gap-6 animate-marquee-reverse whitespace-nowrap py-4 shrink-0">
            {certificatesData.map((item, idx) => (
              <div 
                key={idx} 
                className="w-[450px] sm:w-[500px] bg-white border border-[#E7D3CE]/60 rounded-3xl p-6 flex items-start gap-6 shadow-sm shrink-0 whitespace-normal hover:border-[#fcb900]/60 transition-colors cursor-pointer group"
              >
                {/* Large Square Image Frame (Completely Blank/Empty, width and height same) */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-tr from-[#FCF3ED] to-[#F7F0EE] border border-[#fcb900]/30 shrink-0 overflow-hidden relative shadow-inner">
                  <img 
                    src="" 
                    alt={item.name} 
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="flex-grow pt-1">
                  <h4 className="font-serif text-[#2A132E] font-bold text-sm sm:text-base leading-snug">{item.name}</h4>
                  <span className="text-[9px] text-[#A6755D] font-sans font-bold tracking-widest block mt-2.5 bg-[#FCF3ED] border border-[#E7D3CE]/60 px-3 py-1 rounded-full w-fit">VERIFIED ACCREDITATION</span>
                </div>
              </div>
            ))}
          </div>

          {/* Duplicate Row 2 for seamless loop */}
          <div className="flex gap-6 animate-marquee-reverse whitespace-nowrap py-4 shrink-0" aria-hidden="true">
            {certificatesData.map((item, idx) => (
              <div 
                key={`dup-${idx}`} 
                className="w-[450px] sm:w-[500px] bg-white border border-[#E7D3CE]/60 rounded-3xl p-6 flex items-start gap-6 shadow-sm shrink-0 whitespace-normal hover:border-[#fcb900]/60 transition-colors cursor-pointer group"
              >
                {/* Large Square Image Frame (Completely Blank/Empty) */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-tr from-[#FCF3ED] to-[#F7F0EE] border border-[#fcb900]/30 shrink-0 overflow-hidden relative shadow-inner">
                  <img 
                    src="" 
                    alt={item.name} 
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="flex-grow pt-1">
                  <h4 className="font-serif text-[#2A132E] font-bold text-sm sm:text-base leading-snug">{item.name}</h4>
                  <span className="text-[9px] text-[#A6755D] font-sans font-bold tracking-widest block mt-2.5 bg-[#FCF3ED] border border-[#E7D3CE]/60 px-3 py-1 rounded-full w-fit">VERIFIED ACCREDITATION</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacing at bottom before footer */}
      <div className="py-6"></div>

    </div>
  )
}

export default About

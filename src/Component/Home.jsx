import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Phone, Award, Users, Globe, Star, Shield, Sparkles, FileText, Briefcase, Heart, Home as HomeIcon, Hash, Gem, Moon, ChevronLeft, ChevronRight, BookOpen, ShieldCheck, LineChart, Flower2, UserCheck, Send, Mail, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "../assets/logos/Logo.png";
import featureBg from "../assets/images/Feature.png";
import astrologerPortrait from "../assets/images/astrologer_portrait.jpg";
import zodiacWheel from "../assets/images/zodiac_wheel.jpg";

/**
 * CelestialDivider Component
 * Redefined to return null per user request to remove section divider lines.
 */
function CelestialDivider() {
  return null;
}

// Service Carousel Slider Data - Ordered to match the mockup exactly on initial load
const allServices = [
  { 
    id: 1, 
    title: 'LOVE & MARRIAGE CONSULTATION', 
    text: 'Detailed kundli matching (Gun Milan), relationship compatibility analysis, resolving delays in marriage, and practical remedies for peace in personal connections.', 
    iconKey: 'heart' 
  },
  { 
    id: 2, 
    title: 'GEMSTONE RECOMMENDATION', 
    text: 'Identify auspicious stones (like Yellow Sapphire or Ruby) that strengthen beneficial planets in your chart to enhance health, focus, and overall career success.', 
    iconKey: 'gem' 
  },
  { 
    id: 3, 
    title: 'KUNDLI ANALYSIS', 
    text: 'Comprehensive evaluation of planetary positions, houses, and transits (Janam Kundli) to clarify your destiny, strengths, weaknesses, and future timelines.', 
    iconKey: 'file' 
  },
  { 
    id: 4, 
    title: 'VASTU CONSULTATION', 
    text: 'Optimize the flow of energy at home or work. Align rooms, elements, and layouts to clear blocking influences and invite growth, harmony, and prosperity.', 
    iconKey: 'home' 
  },
  { 
    id: 5, 
    title: 'CAREER GUIDANCE', 
    text: 'Navigate job transitions, promotion cycles, new business ventures, or study paths by identifying favorable dashas and suitable industries based on your 10th house.', 
    iconKey: 'briefcase' 
  },
  { 
    id: 6, 
    title: 'NUMEROLOGY READING', 
    text: 'Uncover the hidden patterns of your life path, destiny, and name frequencies. Align your personal vibrations to unlock career opportunities and wealth luck.', 
    iconKey: 'hash' 
  }
];

// Helper to render gold vector icons based on index mapping
const renderServiceIcon = (iconKey, isOutline) => {
  const iconClass = isOutline ? "text-[#fcb900]" : "text-[#2A132E]";
  switch (iconKey) {
    case 'heart':
      return <Heart className={iconClass} size={24} />;
    case 'gem':
      return <Gem className={iconClass} size={24} />;
    case 'file':
      return <FileText className={iconClass} size={24} />;
    case 'home':
      return <HomeIcon className={iconClass} size={24} />;
    case 'hash':
      return <Hash className={iconClass} size={24} />;
    case 'briefcase':
      return <Briefcase className={iconClass} size={24} />;
    default:
      return <Sparkles className={iconClass} size={24} />;
  }
};


const ServiceSlider = () => {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);

  // Resize listener for responsive visible count
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
      items.push(allServices[(startIndex + i) % allServices.length]);
    }
    return items;
  };

  const handleNext = () => {
    setStartIndex((prevIndex) => (prevIndex + 1) % allServices.length);
  };

  const handlePrev = () => {
    setStartIndex((prevIndex) => (prevIndex - 1 + allServices.length) % allServices.length);
  };

  // 4-second auto-slide interval that resets when manually navigated
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [startIndex]);

  const visibleServices = getVisibleItems();

  // Helper to determine color layout dynamically
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
    <div className="w-full relative py-6 overflow-hidden select-none px-[clamp(2rem,6vw,6rem)]">
      {/* Left Navigation Button - positioned outside of the content row inside container padding */}
      <button 
        onClick={handlePrev} 
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-2.5 rounded-full shadow-md border border-gray-200 z-30 hover:scale-105 active:scale-95 transition-all text-[#2A132E] cursor-pointer"
        aria-label="Previous Service"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Left & Right fading overlays for smooth cinematic masking */}
      <div className="absolute inset-y-0 left-0 w-[clamp(2rem,6vw,6rem)] bg-gradient-to-r from-[#090b1c] to-transparent z-20 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-[clamp(2rem,6vw,6rem)] bg-gradient-to-l from-[#090b1c] to-transparent z-20 pointer-events-none"></div>

      {/* Slider Container */}
      <div className="relative w-full overflow-hidden">
        <div className="flex justify-center items-center gap-[clamp(1rem,2vw,2.5rem)] overflow-visible relative min-h-[400px] py-4">
          {visibleServices.map((service, index) => {
            const isCenter = index === centerIndex;
            const cardStyle = getCardStyles(index);

            // Determine classes & styles based on computed card layout position
            let bgClass = "";
            let titleClass = "";
            let textClass = "";
            let borderStyle = {};
            let iconContainerClass = "";
            let isOutlineIcon = false;

            if (cardStyle === 'navy') {
              bgClass = "bg-[#131F37] text-white";
              borderStyle = { border: '1px solid rgba(252, 185, 0, 0.35)' };
              titleClass = "text-[#fcb900]";
              textClass = "text-[#E7D3CE]/90";
              iconContainerClass = "border border-[#fcb900]/40";
              isOutlineIcon = true;
            } else if (cardStyle === 'holo') {
              bgClass = "text-[#2A132E]";
              borderStyle = { 
                background: 'linear-gradient(135deg, #FFF5EC 0%, #F5E6FF 30%, #E6F0FF 70%, #FFF5EC 100%)',
                border: '1px solid #fcb900'
              };
              titleClass = "text-[#2A132E]";
              textClass = "text-[#55393F] font-semibold";
              iconContainerClass = "bg-gradient-to-b from-[#e6c07b] to-[#bfa054] shadow-sm";
              isOutlineIcon = false;
            } else { // burgundy
              bgClass = "bg-[#4A121A] text-white";
              borderStyle = { border: '1px solid rgba(252, 185, 0, 0.35)' };
              titleClass = "text-[#fcb900]";
              textClass = "text-[#E7D3CE]/90";
              iconContainerClass = "bg-gradient-to-b from-[#e6c07b] to-[#bfa054] shadow-sm";
              isOutlineIcon = false;
            }

            // Calculate 3D z-axis depth values dynamically based on distance from center card
            const distance = Math.abs(index - centerIndex);
            let scale = 1.0;
            let y = 0;
            let x = 0;
            let zIndex = 1;
            let opacity = 1;

            if (distance === 0) {
              scale = 1.12;
              y = -10;
              zIndex = 10;
              opacity = 1;
            } else if (distance === 1) {
              scale = 0.95;
              y = 0;
              zIndex = 5;
              opacity = 0.85;
            } else { // distance === 2 (outer-most cards scaled down and faded to appear deep in z-axis)
              scale = 0.82;
              y = 10;
              zIndex = 1;
              opacity = 0.65;
            }

            // Apply translation x to bring outer cards closer to adjacent cards
            if (visibleCount === 5) {
              if (index === 0) x = 32;       // Shift card 1 right, closer to card 2
              else if (index === 4) x = -32;  // Shift card 5 left, closer to card 4
            } else if (visibleCount === 3) {
              if (index === 0) x = 16;        // Shift card 1 right, closer to card 2
              else if (index === 2) x = -16;  // Shift card 3 left, closer to card 2
            }

            return (
              <motion.div
                key={service.id}
                layout
                animate={{
                  scale,
                  y,
                  x,
                  zIndex,
                  opacity
                }}
                transition={{ 
                  layout: { type: 'spring', stiffness: 220, damping: 24 },
                  default: { type: 'spring', stiffness: 300, damping: 26 }
                }}
                style={borderStyle}
                className={`
                  flex-none w-[clamp(11.5rem,15vw,14rem)] h-[clamp(20rem,25vw,22.5rem)] rounded-2xl p-[clamp(1rem,1.5vw,1.75rem)] flex flex-col justify-between 
                  cursor-pointer transition-all duration-500 text-center items-center relative select-none
                  ${bgClass}
                  ${isCenter ? 'shadow-[0_20px_50px_rgba(252,185,0,0.3)]' : 'shadow-md'}
                `}
              >
                {/* Pearlescent Active Glow Blast */}
                {isCenter && (
                  <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.25)_0%,transparent_60%)] blur-3xl scale-[1.7] animate-pulse pointer-events-none" />
                )}

                <div className="flex flex-col gap-[clamp(0.75rem,1.5vw,1.25rem)] text-center items-center">
                  {/* Circle Icon Badge */}
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 ${iconContainerClass}`}>
                    {renderServiceIcon(service.iconKey, isOutlineIcon)}
                  </div>
                  <div className={`text-[clamp(0.75rem,1vw,0.875rem)] font-bold tracking-wide font-serif leading-tight ${titleClass}`}>
                    {service.title}
                  </div>
                  <p className={`text-[clamp(0.6rem,0.8vw,0.725rem)] leading-relaxed font-sans line-clamp-6 ${textClass}`}>
                    {service.text}
                  </p>
                </div>

                <div className={`text-[9px] font-bold tracking-wider uppercase mt-2 ${isCenter ? 'text-[#2A132E]' : 'text-[#fcb900]/80'}`}>
                  {isCenter ? 'ACTIVE ✦' : 'EXPLORE'}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right Navigation Button - positioned outside of the content row inside container padding */}
      <button 
        onClick={handleNext} 
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-2.5 rounded-full shadow-md border border-gray-200 z-30 hover:scale-105 active:scale-95 transition-all text-[#2A132E] cursor-pointer"
        aria-label="Next Service"
      >
        <ChevronRight size={18} />
      </button>

      {/* Slide Navigation Link */}
      <div className="text-center mt-6 text-xs text-gray-500">
        <button 
          onClick={handleNext} 
          className="underline text-[#fcb900] hover:text-[#fcb900]/80 font-medium cursor-pointer"
        >
          Slide Next ✦
        </button>
      </div>
    </div>
  );
};


/**
 * Home Component
 * Features a luxury Vedic astrology landing page.
 * Implements smooth Framer Motion viewport entrance animations for all sections
 * and custom gold dividers.
 */
export default function Home() {
  // Features Data (Luxury Vedic dark-purple section specs - Option 2 layout)
  const featuresData = [
    {
      title: "TRUSTED & CONFIDENTIAL",
      desc: "Your birth charts and consultation details are kept completely private.",
      icon: <ShieldCheck size={18} className="text-[#fcb900]" />
    },
    {
      title: "ACCURATE PREDICTIONS",
      desc: "High precision mathematics calculating planetary alignment and transits.",
      icon: <LineChart size={18} className="text-[#fcb900]" />
    },
    {
      title: "PERSONALIZED SOLUTIONS",
      desc: "Tailored remedial measures including gemstone advice, mantras, and pujas.",
      icon: <UserCheck size={18} className="text-[#fcb900]" />
    },
    {
      title: "POSITIVE TRANSFORMATION",
      desc: "Bring focus, wealth, wellness, and alignment back into your personal life.",
      icon: <Flower2 size={18} className="text-[#fcb900]" />
    }
  ]

  // Testimonials Data
  const testimonials = [
    {
      name: "Elena R.",
      rating: 5,
      text: "The guidance I received brought clarity and confidence to my life. The remedies were practical and the predictions were remarkably accurate.",
      service: "Kundli Analysis",
      image: ""
    },
    {
      name: "Marcus T.",
      rating: 5,
      text: "Understanding my transits and Saturn cycle through Kundan's counseling helped me navigate my career transition successfully.",
      service: "Career Guidance",
      image: ""
    },
    {
      name: "Priya K.",
      rating: 5,
      text: "Amazing Vastu advice! Making small changes at our entrance brought positive vibes and progress within weeks.",
      service: "Vastu Consultation",
      image: ""
    },
    {
      name: "Dr. Aarav Mehta",
      rating: 5,
      text: "Wearing the recommended Yellow Sapphire has brought immense mental clarity and improved my focus in my clinical work.",
      service: "Gemstone Advice",
      image: ""
    },
    {
      name: "Sarah Jenkins",
      rating: 5,
      text: "The compatibility reading was spot on. Kundan suggested simple mantra remedies that helped ease the relationship friction.",
      service: "Love & Marriage",
      image: ""
    },
    {
      name: "Vikram Aditya",
      rating: 5,
      text: "Changing my business name spelling as suggested by Kundan Singh did wonders for our customer outreach and conversion rate.",
      service: "Numerology Reading",
      image: ""
    }
  ]

  // Services Grid Data
  const services = [
    {
      title: 'Kundli Analysis',
      desc: 'Comprehensive evaluation of planetary positions, houses, and transits (Janam Kundli) to clarify your destiny, strengths, weaknesses, and future timelines.',
      icon: <FileText size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Career Guidance',
      desc: 'Navigate job transitions, promotion cycles, new business ventures, or study paths by identifying favorable dashas and suitable industries based on your 10th house.',
      icon: <Briefcase size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Love & Marriage Consultation',
      desc: 'Detailed kundli matching (Gun Milan), relationship compatibility analysis, resolving delays in marriage, and practical remedies for peace in personal connections.',
      icon: <Heart size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Vastu Consultation',
      desc: 'Optimize the flow of energy at home or work. Align rooms, elements, and layouts to clear blocking influences and invite growth, harmony, and prosperity.',
      icon: <HomeIcon size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Numerology Reading',
      desc: 'Uncover the hidden patterns of your life path, destiny, and name frequencies. Align your personal vibrations to unlock career opportunities and wealth luck.',
      icon: <Hash size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Gemstone Recommendation',
      desc: 'Identify auspicious stones (like Yellow Sapphire or Ruby) that strengthen beneficial planets in your chart to enhance health, focus, and overall career success.',
      icon: <Gem size={20} className="text-[#fcb900]" />
    }
  ]

  // Contact Form State
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    email: "",
    selectedService: "",
    comment: ""
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!formData.selectedService) {
      alert("Please select a service of interest.")
      return
    }
    console.log("Contact Form Submitted Data:", formData)
    setIsSubmitted(true)
    setTimeout(() => {
      setFormData({
        name: "",
        dob: "",
        email: "",
        selectedService: "",
        comment: ""
      })
      setIsSubmitted(false)
    }, 5000)
  }

  return (
    <div className="w-full bg-[#090b1c] bg-gradient-to-br from-[#1c0e2d] via-[#090b1c] to-[#250d1d] relative overflow-hidden flex flex-col items-center">
      
      {/* Global Custom SVG Clip Paths */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="arch-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0 1 L 0 0.35 C 0 0, 1 0, 1 0.35 L 1 1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* ========================================================= */}
      {/* 1. HERO SECTION BACKGROUND DECORS                         */}
      {/* ========================================================= */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)] rounded-full -z-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.05),transparent_70%)] rounded-full -z-10"></div>

      {/* Hybrid Fluid Layout Container Wrapper */}
      <div className="w-full max-w-[1920px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)] flex flex-col items-center">

        {/* ========================================================= */}
        {/* 2. HERO CONTENT LAYOUT (Smooth entrance on page load)     */}
        {/* ========================================================= */}
        <section className="w-full flex flex-col lg:flex-row items-center justify-between min-h-[700px] py-[clamp(2.5rem,5vw,6rem)] gap-[clamp(2.5rem,5vw,6rem)] bg-transparent">
          
          {/* Left Side Content Column (Slides in from the left) */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 space-y-6 text-left z-10"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-[#fcb900]/30 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#fcb900] rounded-full animate-pulse"></span>
              <span className="text-[10px] tracking-[0.2em] font-semibold text-[#fcb900] uppercase font-sans">
                GUIDANCE • CLARITY • POSITIVITY
              </span>
            </div>

            {/* Large Headline */}
            <h2 className="text-[clamp(2.25rem,4.8vw,5.5rem)] font-serif text-white leading-tight font-bold tracking-wide">
              Discover Your{" "}
              <span className="bg-gradient-to-r from-[#fcb900] via-[#A6755D] to-[#fcb900] bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap">
                True Destiny
              </span>{" "}
              <span className="sm:whitespace-nowrap">with Expert Guidance</span>
            </h2>

            {/* Subheading */}
            <p className="text-[clamp(0.875rem,1.1vw,1.15rem)] text-[#EBDCD4]/85 leading-relaxed max-w-xl font-sans">
              Get accurate predictions, personalized solutions and bring positive changes in your life with the power of Vedic Astrology.
            </p>

            {/* CTA Buttons Row */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/booking" className="bg-[#fcb900] hover:bg-[#e0a600] text-[#2A132E] border border-[#fcb900] hover:border-[#e0a600] font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition duration-300 shadow-md cursor-pointer group">
                <Calendar size={18} className="text-[#2A132E]" />
                <span>Consultation & Services</span>
              </Link>

              <Link to="/contact" className="bg-white/[0.04] hover:bg-white/[0.08] text-white border border-[#fcb900]/60 hover:border-[#fcb900] font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition duration-300 shadow-sm cursor-pointer">
                <Phone size={18} className="text-[#fcb900]" />
                <span>Call Now</span>
              </Link>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4 pt-6 border-t border-white/5">
              <div className="flex flex-col items-start gap-1.5 p-3 bg-[#0b0f19]/35 border border-white/5 rounded-xl w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-[#fcb900]/40 flex items-center justify-center text-[#fcb900] bg-white/[0.04] shrink-0">
                    <Award size={14} />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white font-serif whitespace-nowrap">10+ Years</span>
                </div>
                <span className="text-[10px] sm:text-xs uppercase text-[#fcb900]/85 tracking-wider font-semibold">Experience</span>
              </div>

              <div className="flex flex-col items-start gap-1.5 p-3 bg-[#0b0f19]/35 border border-white/5 rounded-xl w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-[#fcb900]/40 flex items-center justify-center text-[#fcb900] bg-white/[0.04] shrink-0">
                    <Users size={14} />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white font-serif whitespace-nowrap">25,000+</span>
                </div>
                <span className="text-[10px] sm:text-xs uppercase text-[#fcb900]/85 tracking-wider font-semibold">Happy Clients</span>
              </div>

              <div className="flex flex-col items-start gap-1.5 p-3 bg-[#0b0f19]/35 border border-white/5 rounded-xl w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-[#fcb900]/40 flex items-center justify-center text-[#fcb900] bg-white/[0.04] shrink-0">
                    <Globe size={14} />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white font-serif whitespace-nowrap">20+ Countries</span>
                </div>
                <span className="text-[10px] sm:text-xs uppercase text-[#fcb900]/85 tracking-wider font-semibold">Served</span>
              </div>

              <div className="flex flex-col items-start gap-1.5 p-3 bg-[#0b0f19]/35 border border-white/5 rounded-xl w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-[#fcb900]/40 flex items-center justify-center text-[#fcb900] bg-white/[0.04] shrink-0">
                    <Star size={14} className="fill-[#fcb900] text-[#fcb900]" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white font-serif whitespace-nowrap">4.8 / 5</span>
                </div>
                <span className="text-[10px] sm:text-xs uppercase text-[#fcb900]/85 tracking-wider font-semibold">Client Rating</span>
              </div>
            </div>
        </motion.div>

        {/* Right Side Portrait Image Column (Fades in and scales slightly) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex-1 flex justify-center items-center relative w-full min-h-[400px]"
        >
          <div className="absolute w-[clamp(16rem,22vw,24rem)] h-[clamp(16rem,22vw,24rem)] bg-[#fcb900]/20 rounded-full blur-3xl -z-10 animate-pulse"></div>

          <Sparkles className="absolute top-10 right-10 text-[#fcb900]/60 animate-bounce" size={24} />
          <Sparkles className="absolute bottom-20 left-10 text-[#A6755D]/40" size={18} />

          <div className="relative w-[clamp(18rem,25vw,26rem)] h-[clamp(18rem,25vw,26rem)] rounded-full border-2 border-dashed border-[#fcb900]/50 flex items-center justify-center animate-[spin_100s_linear_infinite] overflow-hidden">
            <img 
              src={zodiacWheel} 
              alt="Zodiac Wheel Layout" 
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 flex justify-center items-center text-[10px] text-[#A6755D]/40 font-serif">
              <span className="absolute top-2">♈</span>
              <span className="absolute right-2">♋</span>
              <span className="absolute bottom-2">♎</span>
              <span className="absolute left-2">♑</span>
            </div>
          </div>

          <div className="absolute w-[clamp(15rem,21vw,22rem)] h-[clamp(15rem,21vw,22rem)] rounded-full overflow-hidden border-4 border-[#fcb900] bg-gradient-to-tr from-[#2A132E] to-[#55393F] shadow-2xl flex items-center justify-center group hover:scale-[1.02] transition-all duration-500 hover:shadow-[0_20px_45px_rgba(252,185,0,0.3)]">
            <img 
              src={astrologerPortrait} 
              alt="Astrologer Kundan Singh at work" 
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
          </div>
        </motion.div>

      </section>

      {/* ========================================================= */}
      {/* 3. LUXURY FEATURE STRIP SECTION                           */}
      {/* ========================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full border-t border-white/5 py-[clamp(3rem,6vw,7rem)] relative overflow-hidden z-10 shadow-xl flex justify-center items-center"
      >
        {/* Radiating Light Flare Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.12)_0%,transparent_65%)] mix-blend-screen pointer-events-none z-0 animate-pulse" style={{ animationDuration: '4s' }} />
        {/* Dark Starry Overlay to blend background */}
        <div className="absolute inset-0 bg-black/15 pointer-events-none z-0" />

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[clamp(1rem,2vw,2.5rem)] relative z-10">
          {featuresData.map((item, index) => (
            <motion.div 
              key={index} 
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 3 + index * 0.4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="bg-[#060814]/55 backdrop-blur-md border border-[#fcb900]/25 hover:border-[#fcb900]/80 rounded-2xl p-6 md:p-8 flex flex-col items-start text-left gap-4 transition-all duration-300 shadow-lg hover:shadow-[0_15px_30px_rgba(252,185,0,0.15)] group cursor-pointer"
            >
              {/* Top Row: Icon and Title on same line */}
              <div className="flex items-center gap-3 w-full">
                {/* Gold Circular Outlined Icon Container */}
                <div className="w-10 h-10 rounded-full border border-[#fcb900]/60 group-hover:border-[#fcb900] flex items-center justify-center text-[#fcb900] bg-[#060814]/65 shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(252,185,0,0.3)] transition-all duration-300">
                  {item.icon}
                </div>
                {/* Title */}
                <span className="font-serif text-[#fcb900] group-hover:text-white font-bold text-xs md:text-sm uppercase tracking-wider transition-colors duration-300">
                  {item.title}
                </span>
              </div>

              {/* Subtext below */}
              <p className="text-[13px] md:text-sm text-[#EBDCD4]/85 leading-relaxed font-sans w-full">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* 4. PREMIUM ASTROLOGY SERVICES GRID (Scroll Entry Animation)*/}
      {/* ========================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full bg-transparent py-[clamp(2rem,4vw,5rem)] relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute top-2 left-2 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_60%)] rounded-full -z-10 animate-pulse"></div>
        <div className="absolute bottom-2 right-2 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.05),transparent_60%)] rounded-full -z-10"></div>

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs tracking-[0.25em] font-bold text-[#fcb900] uppercase font-sans flex items-center justify-center gap-1.5">
              ✦ Our Services ✦
            </span>
            <h3 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-white tracking-wide">
              Guidance for Every Aspect of Life
            </h3>
          </div>

          {/* Responsive Carousel Slider */}
          <ServiceSlider />

        </div>
      </motion.section>

      {/* ========================================================= */}
      {/* 5. LUXURIOUS CALL-TO-ACTION (CTA) BANNER STRIP            */}
      {/* ========================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-[clamp(2rem,4vw,5rem)]"
      >
        <div className="bg-gradient-to-r from-[#0b0c16] via-[#121324] to-[#0b0c16] border border-[#fcb900]/25 rounded-3xl p-[clamp(1.5rem,4vw,3.5rem)] relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-[clamp(1.5rem,3vw,3.5rem)] w-full">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#fcb900]/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

          <div className="flex items-center gap-6 text-left">
            <div className="hidden sm:flex w-16 h-16 rounded-full border border-[#fcb900]/30 bg-white/5 items-center justify-center text-[#fcb900] shrink-0">
              <Moon size={32} className="fill-[#fcb900]/10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="block text-[clamp(1.5rem,2.8vw,3rem)] font-serif font-bold text-white tracking-wide">
                Ready to Transform Your Life?
              </span>
              <p className="text-xs md:text-sm text-[#EBDCD4]/85 leading-relaxed max-w-xl">
                Book your consultation today and take the first step toward a better tomorrow.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex justify-center shrink-0">
            <Link 
              to="/booking"
              className="bg-[#fcb900] hover:bg-[#e0a600] text-[#2A132E] font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-lg tracking-wide text-sm w-full md:w-auto"
            >
              <Calendar size={18} />
              <span>Book Consultation</span>
            </Link>
          </div>

        </div>
      </motion.section>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* 6. INFINITE SLIDING MARQUEE TESTIMONIALS SECTION          */}
      {/* ========================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full bg-transparent py-[clamp(2.5rem,5vw,6rem)] relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute top-10 left-10 w-48 h-48 bg-[#fcb900]/5 rounded-full blur-2xl -z-10"></div>
        <div className="absolute top-12 right-12 text-[#fcb900]/50 animate-pulse">✦</div>

        <div className="w-full flex flex-col items-center">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs tracking-[0.25em] font-bold text-[#fcb900] uppercase font-sans block">
              ✦ WHAT OUR CLIENTS SAY ✦
            </span>
            <h3 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-white tracking-wide">
              Trusted By Thousands
            </h3>
          </div>

          {/* Sliding Marquee Track */}
          <div className="w-full overflow-hidden flex relative py-4">
            {/* Left & Right fading overlays */}
            <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-[#090b1c] to-transparent z-20 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-[#090b1c] to-transparent z-20 pointer-events-none"></div>
            
            <motion.div
              className="flex gap-6 shrink-0"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                ease: "linear",
                duration: 25,
                repeat: Infinity
              }}
            >
              {[...testimonials, ...testimonials].map((item, index) => (
                <div 
                  key={index} 
                  className="bg-[#0b0f19]/35 border border-white/5 hover:border-[#fcb900]/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative select-none w-[clamp(17rem,24vw,25rem)] shrink-0 gap-4"
                >
                  <div>
                    {/* Stars row */}
                    <div className="flex gap-1 text-[#fcb900] mb-3">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-[#fcb900] text-[#fcb900]" />
                      ))}
                    </div>

                    {/* Review text */}
                    <p className="text-xs md:text-sm text-white font-serif italic leading-relaxed text-left">
                      "{item.text}"
                    </p>
                  </div>

                  {/* Client identity row */}
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5 w-full">
                    {/* Avatar frame */}
                    <div className="w-10 h-10 rounded-full border border-[#fcb900]/40 bg-gradient-to-tr from-[#2A132E] to-[#55393F] flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
                      <span className="text-xs text-[#fcb900] font-semibold">{item.name.split(" ")[0][0]}{item.name.split(" ").length > 1 ? item.name.split(" ")[1][0] : ""}</span>
                    </div>
                    {/* Name & service */}
                    <div className="flex flex-col text-left">
                      <span className="font-serif text-white font-bold text-sm leading-tight">{item.name}</span>
                      <span className="text-[10px] text-[#fcb900]/80 uppercase tracking-wider font-semibold mt-0.5">{item.service}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

        </div>
      </motion.section>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* 7. SECTION 2 — ABOUT THE ASTROLOGER                       */}
      {/* ========================================================= */}
      <section className="w-full bg-transparent py-[clamp(3rem,6vw,7rem)] relative overflow-hidden flex flex-col items-center">
        
        <div className="absolute bottom-4 left-4 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.03),transparent_70%)] rounded-full -z-10 animate-pulse"></div>

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,5vw,6rem)] items-center">
          
          {/* Left Column Astrologer Portrait (Slides in from the left) */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center items-center relative w-full min-h-[400px]"
          >
            <div className="absolute -inset-2 border-2 border-dashed border-[#fcb900]/40 rounded-3xl -z-10"></div>
            
            <div className="w-full max-w-[clamp(18rem,26vw,28rem)] aspect-[4/5] rounded-3xl overflow-hidden border-4 border-[#fcb900] bg-gradient-to-tr from-[#2A132E] to-[#55393F] shadow-xl hover:shadow-[0_20px_45px_rgba(252,185,0,0.35)] flex items-center justify-center relative group hover:scale-[1.03] transition-all duration-500">
              <img 
                src={astrologerPortrait} 
                alt="Astrologer Kundan Singh at work" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              />
            </div>
          </motion.div>

          {/* Right Column Profile Details (Slides in from the right) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 text-left"
          >
            <span className="text-xs tracking-[0.25em] font-bold text-[#fcb900] uppercase font-sans">
              ✦ ABOUT ME ✦
            </span>
            
            <h3 className="text-[clamp(1.75rem,3.2vw,3.5rem)] font-serif font-bold text-white tracking-wide">
              Your Guide to a Brighter Future
            </h3>

            <p className="text-[clamp(1rem,1.2vw,1.25rem)] text-[#EBDCD4] leading-relaxed">
              With years of experience in Vedic Astrology, Numerology, and Spiritual Guidance, I help individuals gain clarity, confidence, and direction in life. My approach combines traditional wisdom with practical solutions for modern challenges.
            </p>

            {/* Achievement Cards Grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[clamp(1rem,2vw,2.5rem)] pt-4">
              
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full border border-[#fcb900]/40 flex items-center justify-center text-[#fcb900] bg-white/[0.04] shrink-0 shadow-sm">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-white font-bold text-sm sm:text-base">Years of Experience</h4>
                  <p className="text-xs sm:text-sm text-[#EBDCD4] mt-1 leading-relaxed">Over a decade mapping transit cycles & natal stars.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full border border-[#fcb900]/40 flex items-center justify-center text-[#fcb900] bg-white/[0.04] shrink-0 shadow-sm">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-white font-bold text-sm sm:text-base">Satisfied Clients</h4>
                  <p className="text-xs sm:text-sm text-[#EBDCD4] mt-1 leading-relaxed">Thousands helped globally with practical remedial measures.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full border border-[#fcb900]/40 flex items-center justify-center text-[#fcb900] bg-white/[0.04] shrink-0 shadow-sm">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-white font-bold text-sm sm:text-base">Vedic Expertise</h4>
                  <p className="text-xs sm:text-sm text-[#EBDCD4] mt-1 leading-relaxed">Deep classical understanding of birth charts & Vastu Shastra.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full border border-[#fcb900]/40 flex items-center justify-center text-[#fcb900] bg-white/[0.04] shrink-0 shadow-sm">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-white font-bold text-sm sm:text-base">Honest Guidance</h4>
                  <p className="text-xs sm:text-sm text-[#EBDCD4] mt-1 leading-relaxed">Compassionate counseling focused entirely on your spiritual growth.</p>
                </div>
              </div>

            </div>

          </motion.div>

        </div>
      </section>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* 8. DYNAMIC COSMIC CONTACT / QUICK CONNECT SECTION         */}
      {/* ========================================================= */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="w-full bg-transparent py-[clamp(2.5rem,5vw,6rem)] relative overflow-hidden flex flex-col items-center border-t border-white/5"
      >
        {/* Exact Nebula Overlays Matching Contact_Form.png */}
        <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.16)_0%,transparent_70%)] rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-[radial-gradient(circle_at_bottom_left,rgba(219,39,119,0.08)_0%,transparent_70%)] rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_65%)] rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Scattered SVG Stars backdrop */}
        <div className="absolute inset-0 opacity-40 pointer-events-none -z-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10%" cy="15%" r="1" fill="#fff" />
            <circle cx="30%" cy="80%" r="1" fill="#fff" />
            <circle cx="55%" cy="25%" r="0.75" fill="#fff" />
            <circle cx="75%" cy="60%" r="1.25" fill="#fcb900" className="animate-pulse" />
            <circle cx="85%" cy="15%" r="1" fill="#fff" />
            <circle cx="95%" cy="75%" r="0.5" fill="#fff" />
            <circle cx="15%" cy="65%" r="1" fill="#fcb900" />
            <circle cx="45%" cy="85%" r="0.75" fill="#fff" />
          </svg>
        </div>

        <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-[clamp(2rem,4vw,5rem)] items-stretch relative z-10">
          
          {/* Left Panel: Services Selection Section (Hidden on mobile <768px per user request) */}
          <div
            className="hidden md:flex flex-col justify-between bg-[#0b0f19]/35 backdrop-blur-md border border-white/5 rounded-2xl p-5 lg:p-6 text-left shadow-lg hover:border-[#fcb900]/85 transition-all duration-300 relative group overflow-hidden"
          >
            {/* Soft highlight sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none" />

            <div className="space-y-3">
              {/* Header Title */}
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.2em] font-bold text-[#fcb900] uppercase font-sans block">
                  ✦ TRUSTED & CONFIDENTIAL ✦
                </span>
                <h3 className="text-[clamp(1.1rem,1.5vw,1.5rem)] font-serif font-bold text-white tracking-wide">
                  Select Vedic Service*
                </h3>
                <p className="text-[clamp(0.8rem,1vw,1.1rem)] text-[#EBDCD4] leading-relaxed font-sans">
                  Select a service below to request your consultation. Selection is compulsory.
                </p>
              </div>

              {/* Services Selector Grid */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 py-1">
                {services.map((item, idx) => {
                  const isSelected = formData.selectedService === item.title;
                  return (
                    <button 
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          selectedService: item.title,
                          comment: prev.comment || `I am requesting a consultation for ${item.title}.`
                        }));
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? "bg-[#fcb900]/15 border-[#fcb900] text-white shadow-[0_0_10px_rgba(252,185,0,0.2)]" 
                          : "bg-white/[0.02] border-white/5 text-white/90 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="text-sm shrink-0">{item.icon}</div>
                      <span className="font-semibold tracking-wide truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Astrologer Details & Links (reduced sizing) */}
            <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#fcb900]/80 font-bold uppercase tracking-widest font-sans block">
                  ASTROLOGER
                </span>
                <span className="text-sm sm:text-base font-serif font-bold text-white tracking-wide">
                  Astrologer Kundan Singh
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-white font-sans">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-[#fcb900] shrink-0" />
                  <span className="truncate">astrologerkundan@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#fcb900] shrink-0" />
                  <span>+91 94520 62153</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#fcb900] shrink-0" />
                  <span>Varanasi, Uttar Pradesh, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Contact Form */}
          <div
            className="flex flex-col justify-between bg-[#0b0f19]/35 backdrop-blur-md border border-white/5 rounded-2xl p-5 lg:p-6 text-left shadow-lg hover:border-[#fcb900]/85 transition-all duration-300 relative overflow-hidden"
          >
            {/* Live Orbiting Planetary Decor */}
            <div className="absolute top-3 right-3 w-20 h-20 pointer-events-none select-none opacity-40 z-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="7" className="fill-[#fcb900] animate-pulse" />
                <circle cx="50" cy="50" r="20" className="stroke-white/10 stroke-[0.5] fill-none" />
                <circle cx="50" cy="50" r="35" className="stroke-white/10 stroke-[0.5] fill-none" strokeDasharray="3,3" />
                
                {/* Orbiting Planet 1 */}
                <motion.circle 
                  cx="50" cy="50" r="2" className="fill-[#a78bfa]"
                  animate={{
                    cx: [50 + 20 * Math.cos(0), 50 + 20 * Math.cos(2*Math.PI)],
                    cy: [50 + 20 * Math.sin(0), 50 + 20 * Math.sin(2*Math.PI)],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                {/* Orbiting Planet 2 */}
                <motion.circle 
                  cx="50" cy="50" r="2.5" className="fill-[#f472b6]"
                  animate={{
                    cx: [50 + 35 * Math.cos(0), 50 + 35 * Math.cos(2*Math.PI)],
                    cy: [50 + 35 * Math.sin(0), 50 + 35 * Math.sin(2*Math.PI)],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
              </svg>
            </div>

            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-16 space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#fcb900]/10 border-2 border-[#fcb900] flex items-center justify-center text-[#fcb900] text-xl shadow-[0_0_12px_rgba(252,185,0,0.3)] animate-pulse">
                  ✓
                </div>
                <h4 className="font-serif text-white font-bold text-xl">Request Dispatched</h4>
                <p className="text-xs sm:text-sm text-white max-w-xs leading-relaxed">
                  Your cosmic chart request has been sent successfully. Astrologer Kundan Singh will analyze your alignments and contact you soon.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4 z-10 relative">
                {/* Header info */}
                <div className="space-y-1">
                  <span className="text-xs tracking-[0.25em] font-bold text-[#fcb900] uppercase font-sans block">
                    ✦ ACCURATE PREDICTIONS ✦
                  </span>
                  <p className="text-xs sm:text-sm text-[#EBDCD4] leading-relaxed font-sans">
                    Fill in your details below. Fields marked with * are required.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Name field */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="form-name" className="block text-xs sm:text-sm font-semibold text-[#fcb900] uppercase tracking-wide">
                      Your Name*
                    </label>
                    <input 
                      type="text" 
                      id="form-name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#fcb900]/80 focus:bg-white/[0.06] transition-all duration-300"
                    />
                  </div>

                  {/* DOB field */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="form-dob" className="block text-xs sm:text-sm font-semibold text-[#fcb900] uppercase tracking-wide">
                      Date of Birth (YYYY-MM-DD)*
                    </label>
                    <input 
                      type="date" 
                      id="form-dob"
                      name="dob"
                      required
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#fcb900]/80 focus:bg-white/[0.06] transition-all duration-300 color-scheme-dark"
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="form-email" className="block text-xs sm:text-sm font-semibold text-[#fcb900] uppercase tracking-wide">
                      Email Address*
                    </label>
                    <input 
                      type="email" 
                      id="form-email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#fcb900]/80 focus:bg-white/[0.06] transition-all duration-300"
                    />
                  </div>

                  {/* Services selector visible only on mobile (<768px) */}
                  <div className="block md:hidden space-y-1.5 text-left">
                    <label className="block text-xs sm:text-sm font-semibold text-[#fcb900] uppercase tracking-wider">
                      Select Service of Interest (Required)*
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {services.map((item, idx) => {
                        const isSelected = formData.selectedService === item.title;
                        return (
                          <button 
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                selectedService: item.title,
                                comment: prev.comment || `I am requesting a consultation for ${item.title}.`
                              }));
                            }}
                            className={`flex items-center gap-2 px-2.5 py-3 border rounded-xl text-[10px] transition-all duration-300 shadow-sm cursor-pointer ${
                              isSelected 
                                ? "bg-[#fcb900]/15 border-[#fcb900] text-white shadow-[0_0_10px_rgba(252,185,0,0.2)]" 
                                : "bg-white/[0.02] border-white/5 text-white/90 hover:bg-white/10 hover:border-white/20"
                            }`}
                          >
                            <span className="text-[10px] shrink-0">{item.icon}</span>
                            <span className="font-semibold tracking-wide truncate">{item.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cosmic Comment */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="form-comment" className="block text-xs sm:text-sm font-semibold text-[#fcb900] uppercase tracking-wide">
                      Cosmic Comment / Vedic Inquiry
                    </label>
                    <textarea 
                      id="form-comment"
                      name="comment"
                      rows="2.5"
                      value={formData.comment}
                      onChange={handleInputChange}
                      placeholder="Describe your query, focus area, or gemstones interest details..."
                      className="w-full bg-[#05060f]/20 border border-[#fcb900]/25 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#fcb900] focus:ring-1 focus:ring-[#fcb900]/30 transition-all duration-300 resize-none font-sans"
                    ></textarea>
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  className="w-full bg-[#fcb900] hover:bg-[#e0a600] text-[#2A132E] font-bold py-3.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(252,185,0,0.3)] cursor-pointer flex items-center justify-center gap-2 mt-4 text-xs sm:text-sm tracking-wider uppercase"
                >
                  <Send size={12} />
                  <span>Send Vedic Inquiry Request</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </motion.section>

      </div>
    </div>
  )
}


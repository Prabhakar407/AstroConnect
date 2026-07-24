import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Phone, Award, Users, Globe, Star, Shield, Sparkles, FileText, Briefcase, Heart, Home as HomeIcon, Hash, Gem, Moon, ChevronLeft, ChevronRight, BookOpen, ShieldCheck, LineChart, Flower2, UserCheck, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "../assets/logos/Logo.png";
import featureBg from "../assets/images/Feature.png";

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
    <div className="w-full relative max-w-7xl mx-auto px-12 sm:px-16 md:px-24 py-6 overflow-visible select-none">
      {/* Left Navigation Button - positioned outside of the content row inside container padding */}
      <button 
        onClick={handlePrev} 
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-md border border-gray-200 z-20 hover:scale-105 active:scale-95 transition-all text-[#2A132E] cursor-pointer animate-fade-in"
        aria-label="Previous Service"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Slider Container */}
      <div className="relative w-full">
        <div className="flex justify-center items-center gap-4 overflow-visible relative min-h-[380px]">
          <AnimatePresence initial={false} mode="popLayout">
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
              } else { // distance === 2 (outer-most cards scaled down and faded to appear deep in z-axis)
                scale = 0.8;
                y = 10;
                zIndex = 1;
                opacity = 0.6;
                boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
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
                      {renderServiceIcon(service.iconKey, isOutlineIcon)}
                    </div>
                    <div className={`text-sm font-bold tracking-wide font-serif leading-tight ${titleClass}`}>
                      {service.title}
                    </div>
                    <p className={`text-[11px] leading-relaxed font-sans line-clamp-6 ${textClass}`}>
                      {service.text}
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

      {/* Right Navigation Button - positioned outside of the content row inside container padding */}
      <button 
        onClick={handleNext} 
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-md border border-gray-200 z-20 hover:scale-105 active:scale-95 transition-all text-[#2A132E] cursor-pointer animate-fade-in"
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
    phone: "",
    email: "",
    selectedServices: [],
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

  const handleServiceCheckboxChange = (serviceTitle) => {
    setFormData((prev) => {
      const alreadySelected = prev.selectedServices.includes(serviceTitle)
      if (alreadySelected) {
        return {
          ...prev,
          selectedServices: prev.selectedServices.filter((s) => s !== serviceTitle)
        }
      } else {
        return {
          ...prev,
          selectedServices: [...prev.selectedServices, serviceTitle]
        }
      }
    })
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    console.log("Contact Form Submitted Data:", formData)
    setIsSubmitted(true)
    setTimeout(() => {
      setFormData({
        name: "",
        phone: "",
        email: "",
        selectedServices: [],
        comment: ""
      })
      setIsSubmitted(false)
    }, 5000)
  }

  return (
    <div className="w-full bg-[#FDF9F7] relative overflow-hidden flex flex-col items-center">
      
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
      <div className="absolute top-10 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(221,177,149,0.1),transparent_70%)] rounded-full -z-10"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(42,19,46,0.05),transparent_70%)] rounded-full -z-10"></div>

      {/* ========================================================= */}
      {/* 2. HERO CONTENT LAYOUT (Smooth entrance on page load)     */}
      {/* ========================================================= */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between min-h-[700px] py-12 gap-12 bg-gradient-to-b from-[#FDF9F7] via-[#FCF3ED] to-[#F0E4E3]">
        
        {/* Left Side Content Column (Slides in from the left) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 space-y-6 text-left z-10"
        >
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2A132E]/5 border border-[#fcb900]/30 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#fcb900] rounded-full animate-pulse"></span>
            <span className="text-[10px] tracking-[0.2em] font-semibold text-[#55393F] uppercase font-sans">
              GUIDANCE • CLARITY • POSITIVITY
            </span>
          </div>

          {/* Large Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#2A132E] leading-tight font-bold tracking-wide">
            Discover Your{" "}
            <span className="bg-gradient-to-r from-[#fcb900] via-[#A6755D] to-[#fcb900] bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap">
              True Destiny
            </span>{" "}
            <span className="sm:whitespace-nowrap">with Expert Guidance</span>
          </h2>

          {/* Subheading */}
          <p className="text-sm md:text-base text-[#55393F] leading-relaxed max-w-xl font-sans">
            Get accurate predictions, personalized solutions and bring positive changes in your life with the power of Vedic Astrology.
          </p>

          {/* CTA Buttons Row */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/booking" className="bg-[#2A132E] hover:bg-[#fcb900] text-white hover:text-[#2A132E] border border-[#2A132E] hover:border-[#fcb900] font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition duration-300 shadow-md cursor-pointer group">
              <Calendar size={18} className="text-[#fcb900] group-hover:text-[#2A132E] transition-colors" />
              <span>Consultation & Services</span>
            </Link>

            <Link to="/contact" className="bg-white hover:bg-[#FCF3ED] text-[#55393F] border border-[#fcb900] hover:border-[#A6755D] font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition duration-300 shadow-sm cursor-pointer">
              <Phone size={18} className="text-[#A6755D]" />
              <span>Call Now</span>
            </Link>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#BDA9A8]/30">
            <div className="flex flex-col items-start gap-1 p-3 bg-white/40 border border-[#BDA9A8]/20 rounded-xl">
              <div className="w-8 h-8 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white/80">
                <Award size={14} />
              </div>
              <span className="text-base font-bold text-[#2A132E] mt-1 font-serif">10+ Years</span>
              <span className="text-[10px] uppercase text-[#55393F]/80 tracking-wider">Experience</span>
            </div>

            <div className="flex flex-col items-start gap-1 p-3 bg-white/40 border border-[#BDA9A8]/20 rounded-xl">
              <div className="w-8 h-8 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white/80">
                <Users size={14} />
              </div>
              <span className="text-base font-bold text-[#2A132E] mt-1 font-serif">25,000+</span>
              <span className="text-[10px] uppercase text-[#55393F]/80 tracking-wider">Happy Clients</span>
            </div>

            <div className="flex flex-col items-start gap-1 p-3 bg-white/40 border border-[#BDA9A8]/20 rounded-xl">
              <div className="w-8 h-8 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white/80">
                <Globe size={14} />
              </div>
              <span className="text-base font-bold text-[#2A132E] mt-1 font-serif">20+ Countries</span>
              <span className="text-[10px] uppercase text-[#55393F]/80 tracking-wider">Served</span>
            </div>

            <div className="flex flex-col items-start gap-1 p-3 bg-white/40 border border-[#BDA9A8]/20 rounded-xl">
              <div className="w-8 h-8 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white/80">
                <Star size={14} className="fill-[#fcb900] text-[#fcb900]" />
              </div>
              <span className="text-base font-bold text-[#2A132E] mt-1 font-serif">4.8 / 5</span>
              <span className="text-[10px] uppercase text-[#55393F]/80 tracking-wider">Client Rating</span>
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
          <div className="absolute w-72 h-72 sm:w-80 sm:h-80 bg-[#fcb900]/20 rounded-full blur-3xl -z-10 animate-pulse"></div>

          <Sparkles className="absolute top-10 right-10 text-[#fcb900]/60 animate-bounce" size={24} />
          <Sparkles className="absolute bottom-20 left-10 text-[#A6755D]/40" size={18} />

          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-dashed border-[#fcb900]/50 flex items-center justify-center animate-[spin_100s_linear_infinite]">
            <div className="absolute inset-4 rounded-full border border-[#fcb900]/30"></div>
            <div className="absolute inset-8 rounded-full border border-dashed border-[#A6755D]/20"></div>
            <div className="absolute inset-0 flex justify-center items-center text-[10px] text-[#A6755D]/40 font-serif">
              <span className="absolute top-2">♈</span>
              <span className="absolute right-2">♋</span>
              <span className="absolute bottom-2">♎</span>
              <span className="absolute left-2">♑</span>
            </div>
          </div>

          <div className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-[#fcb900] bg-gradient-to-tr from-[#2A132E] to-[#55393F] shadow-2xl flex items-center justify-center group">
            <img 
              src="" 
              alt="Astrologer Kundan Singh" 
              className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
              <span className="text-4xl mb-2 text-[#fcb900]">✨</span>
              <span className="font-serif text-sm tracking-widest text-[#FDF9F7] uppercase font-semibold">Astrologer Portrait</span>
              <span className="text-[10px] text-[#EBDCD4] mt-1">(Image Space Reserved)</span>
            </div>
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
        style={{ backgroundImage: `url(${featureBg})` }}
        className="w-full bg-cover bg-center bg-no-repeat border-t border-[#4A2A50] py-20 md:py-28 relative overflow-hidden z-10 shadow-xl flex justify-center items-center"
      >
        {/* Radiating Light Flare Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.22)_0%,transparent_65%)] mix-blend-screen pointer-events-none z-0 animate-pulse" style={{ animationDuration: '4s' }} />
        {/* Dark Starry Overlay to blend background */}
        <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
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
              <p className="text-[13px] md:text-sm text-[#FDF9F7]/95 leading-relaxed font-sans w-full">
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
        className="w-full bg-[#FDF9F7] py-10 relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute top-2 left-2 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(221,177,149,0.05),transparent_60%)] rounded-full -z-10"></div>
        <div className="absolute bottom-2 right-2 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(85,57,63,0.05),transparent_60%)] rounded-full -z-10"></div>

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs tracking-[0.25em] font-bold text-[#fcb900] uppercase font-sans flex items-center justify-center gap-1.5">
              ✦ Our Services ✦
            </span>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#2A132E] tracking-wide">
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
        className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-10"
      >
        <div className="bg-gradient-to-r from-[#2A132E] to-[#55393F] border border-[#4A2A50] rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#fcb900]/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

          <div className="flex items-center gap-6 text-left">
            <div className="hidden sm:flex w-16 h-16 rounded-full border border-[#fcb900]/30 bg-white/5 items-center justify-center text-[#fcb900] shrink-0">
              <Moon size={32} className="fill-[#fcb900]/10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="block text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
                Ready to Transform Your Life?
              </span>
              <p className="text-xs md:text-sm text-[#EBDCD4] leading-relaxed max-w-xl">
                Book your consultation today and take the first step toward a better tomorrow.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex justify-center shrink-0">
            <Link 
              to="/booking"
              className="bg-[#fcb900] hover:bg-[#cfa181] text-[#2A132E] font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-lg tracking-wide text-sm w-full md:w-auto"
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
      {/* 6. SECTION 1 — TESTIMONIALS SLIDER (Scroll Entry)         */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* 6. INFINITE SLIDING MARQUEE TESTIMONIALS SECTION          */}
      {/* ========================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full bg-[#FDF9F7] py-16 relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute top-10 left-10 w-48 h-48 bg-[#fcb900]/5 rounded-full blur-2xl -z-10"></div>
        <div className="absolute top-12 right-12 text-[#fcb900]/50 animate-pulse">✦</div>

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs tracking-[0.25em] font-bold text-[#fcb900] uppercase font-sans block">
              ✦ WHAT OUR CLIENTS SAY ✦
            </span>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#2A132E] tracking-wide">
              Trusted By Thousands
            </h3>
          </div>

          {/* Sliding Marquee Track */}
          <div className="w-full overflow-hidden flex relative py-4">
            {/* Left & Right fading overlays */}
            <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-[#FDF9F7] to-transparent z-20 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-[#FDF9F7] to-transparent z-20 pointer-events-none"></div>
            
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
                  className="bg-white border border-[#BDA9A8]/20 hover:border-[#fcb900]/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative select-none w-[290px] sm:w-[360px] md:w-[400px] shrink-0 gap-4"
                >
                  <div>
                    {/* Stars row */}
                    <div className="flex gap-1 text-[#fcb900] mb-3">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-[#fcb900] text-[#fcb900]" />
                      ))}
                    </div>

                    {/* Review text */}
                    <p className="text-xs md:text-sm text-[#55393F] font-serif italic leading-relaxed text-left">
                      "{item.text}"
                    </p>
                  </div>

                  {/* Client identity row */}
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-[#BDA9A8]/10 w-full">
                    {/* Avatar frame */}
                    <div className="w-10 h-10 rounded-full border border-[#fcb900] bg-gradient-to-tr from-[#2A132E] to-[#55393F] flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
                      <span className="text-xs text-[#fcb900] font-semibold">{item.name.split(" ")[0][0]}{item.name.split(" ").length > 1 ? item.name.split(" ")[1][0] : ""}</span>
                    </div>
                    {/* Name & service */}
                    <div className="flex flex-col text-left">
                      <span className="font-serif text-[#2A132E] font-bold text-sm leading-tight">{item.name}</span>
                      <span className="text-[10px] text-[#A6755D] uppercase tracking-wider font-semibold mt-0.5">{item.service}</span>
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
      <section className="w-full bg-[#FCF3ED] py-20 relative overflow-hidden flex flex-col items-center">
        
        <div className="absolute bottom-4 left-4 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.03),transparent_70%)] rounded-full -z-10"></div>

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column Astrologer Portrait (Slides in from the left) */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center items-center relative w-full min-h-[400px]"
          >
            <div className="absolute -inset-2 border-2 border-dashed border-[#fcb900]/40 rounded-3xl -z-10"></div>
            
            <div className="w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden border-4 border-[#fcb900] bg-gradient-to-tr from-[#2A132E] to-[#55393F] shadow-2xl flex items-center justify-center relative group">
              <img 
                src="" 
                alt="Astrologer Kundan Singh at work" 
                className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8">
                <span className="text-5xl mb-4 text-[#fcb900]">🔮</span>
                <span className="font-serif text-lg tracking-widest text-[#FDF9F7] uppercase font-semibold">Kundan Singh</span>
                <span className="text-xs text-[#EBDCD4] tracking-wider mt-1">Vedic Astrologer Profile</span>
                <span className="text-[10px] text-[#fcb900]/80 mt-6">(Portrait Image Space Reserved)</span>
              </div>
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
            
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#2A132E] tracking-wide">
              Your Guide to a Brighter Future
            </h3>

            <p className="text-sm md:text-base text-[#55393F] leading-relaxed">
              With years of experience in Vedic Astrology, Numerology, and Spiritual Guidance, I help individuals gain clarity, confidence, and direction in life. My approach combines traditional wisdom with practical solutions for modern challenges.
            </p>

            {/* Achievement Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white shrink-0 shadow-sm">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-[#2A132E] font-bold text-sm">Years of Experience</h4>
                  <p className="text-[11px] text-[#55393F] mt-0.5 leading-relaxed">Over a decade mapping transit cycles & natal stars.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white shrink-0 shadow-sm">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-[#2A132E] font-bold text-sm">Satisfied Clients</h4>
                  <p className="text-[11px] text-[#55393F] mt-0.5 leading-relaxed">Thousands helped globally with practical remedial measures.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white shrink-0 shadow-sm">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-[#2A132E] font-bold text-sm">Vedic Expertise</h4>
                  <p className="text-[11px] text-[#55393F] mt-0.5 leading-relaxed">Deep classical understanding of birth charts & Vastu Shastra.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full border border-[#fcb900] flex items-center justify-center text-[#A6755D] bg-white shrink-0 shadow-sm">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-[#2A132E] font-bold text-sm">Honest Guidance</h4>
                  <p className="text-[11px] text-[#55393F] mt-0.5 leading-relaxed">Compassionate counseling focused entirely on your spiritual growth.</p>
                </div>
              </div>

            </div>

          </motion.div>

        </div>
      </section>

      {/* Visual Celestial Separator */}
      <CelestialDivider />

      {/* ========================================================= */}
      {/* 8. QUICK CONNECT / CONTACT FORM SECTION                   */}
      {/* ========================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full bg-gradient-to-b from-[#FCF3ED] to-[#FDF9F7] py-20 relative overflow-hidden flex flex-col items-center border-t border-[#BDA9A8]/10"
      >
        {/* Decorative backdrop elements */}
        <div className="absolute top-20 right-[-100px] w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(252,185,0,0.06),transparent_70%)] rounded-full -z-10 animate-pulse"></div>
        <div className="absolute bottom-10 left-[-100px] w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(85,57,63,0.04),transparent_70%)] rounded-full -z-10"></div>

        <div className="w-full max-w-4xl mx-auto px-6 lg:px-8 flex flex-col items-center">
          
          {/* Section Header */}
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs tracking-[0.25em] font-bold text-[#fcb900] uppercase font-sans block">
              ✦ QUICK CONNECT ✦
            </span>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#2A132E] tracking-wide">
              Start Your Astrology Journey
            </h3>
            <p className="text-sm text-[#55393F]/80 max-w-md mx-auto">
              Have a question or looking to schedule a private reading? Fill out the details below.
            </p>
          </div>

          {/* Form Card */}
          <div className="w-full max-w-2xl bg-white border border-[#BDA9A8]/20 rounded-3xl p-6 md:p-10 shadow-xl relative z-10">
            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-12 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-3xl">
                  ✓
                </div>
                <h4 className="font-serif text-[#2A132E] font-bold text-2xl">Message Sent Successfully!</h4>
                <p className="text-sm text-[#55393F]/90 max-w-sm">
                  Thank you for reaching out. Astrologer Kundan Singh will review your request and get back to you shortly via phone or WhatsApp.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label htmlFor="form-name" className="block text-sm font-semibold text-[#55393F] text-left">
                      Full Name <span className="text-[#fcb900]">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="form-name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-1 focus:ring-[#fcb900] transition"
                    />
                  </div>

                  {/* Phone/WhatsApp field */}
                  <div className="space-y-2">
                    <label htmlFor="form-phone" className="block text-sm font-semibold text-[#55393F] text-left">
                      Phone / WhatsApp <span className="text-[#fcb900]">*</span>
                    </label>
                    <input 
                      type="tel" 
                      id="form-phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone or WhatsApp number"
                      className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-1 focus:ring-[#fcb900] transition"
                    />
                  </div>
                </div>

                {/* Email field (Optional) */}
                <div className="space-y-2">
                  <label htmlFor="form-email" className="block text-sm font-semibold text-[#55393F] text-left">
                    Email Address <span className="text-xs text-[#A6755D]/75 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="email" 
                    id="form-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email address"
                    className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-1 focus:ring-[#fcb900] transition"
                  />
                </div>

                {/* Services interested in (Multiple choice check buttons) */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-[#55393F] text-left">
                    Services of Interest <span className="text-xs text-[#A6755D]/75 font-normal">(Select multiple option checks)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    {services.map((item, idx) => {
                      const isChecked = formData.selectedServices.includes(item.title)
                      return (
                        <label 
                          key={idx} 
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked 
                              ? "bg-[#fcb900]/10 border-[#fcb900] text-[#2A132E] font-semibold" 
                              : "bg-[#FDF9F7]/70 border-[#BDA9A8]/20 text-[#55393F] hover:bg-[#FCF3ED]/40"
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleServiceCheckboxChange(item.title)}
                            className="w-4 h-4 rounded text-[#fcb900] focus:ring-[#fcb900] border-[#BDA9A8]/40 accent-[#2A132E] cursor-pointer"
                          />
                          <span className="text-xs md:text-sm">{item.title}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Comment section */}
                <div className="space-y-2">
                  <label htmlFor="form-comment" className="block text-sm font-semibold text-[#55393F] text-left">
                    Your Question / Message <span className="text-xs text-[#A6755D]/75 font-normal">(Free text field)</span>
                  </label>
                  <textarea 
                    id="form-comment"
                    name="comment"
                    rows="4"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="Enter details of your query, birth details, or preferred consultation dates..."
                    className="w-full bg-[#FDF9F7] border border-[#BDA9A8]/30 rounded-xl px-4 py-3 text-sm text-[#2A132E] focus:outline-none focus:border-[#fcb900] focus:ring-1 focus:ring-[#fcb900] transition resize-none"
                  ></textarea>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  className="w-full bg-[#2A132E] hover:bg-[#fcb900] text-white hover:text-[#2A132E] border border-[#2A132E] hover:border-[#fcb900] font-semibold py-3.5 rounded-xl transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  <Send size={16} />
                  <span>Send Consultation Request</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </motion.section>

    </div>
  )
}

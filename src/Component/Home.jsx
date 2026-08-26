import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Phone, Award, Users, Globe, Star, Shield, Sparkles, FileText, Briefcase, Heart, Home as HomeIcon, Hash, Gem, Moon, ChevronLeft, ChevronRight, ChevronDown, BookOpen, ShieldCheck, LineChart, Flower2, UserCheck, Send, Mail, MapPin, HelpCircle } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
const API_BASE_URL = import.meta.env.DEV 
  ? "http://localhost:8000" 
  : "https://astrologer-kundan-singh.onrender.com"

import logoImg from "../assets/logos/Nav-Logo.png";
import featureBg from "../assets/images/Feature.png";
import astrologerPortrait from "../assets/images/astrologer_portrait.jpg";
import zodiacWheel from "../assets/images/zodiac_wheel.jpg";
import vedicAstrologyImg from '../assets/images/Vedic Astrology.png'
import numerologyImg from '../assets/images/Numerology.png'
import vastuConsultationImg from '../assets/images/Vastu Consultation.png'
import laalKitaabImg from '../assets/images/Laal Kitaab Remedies.png'
import prashnaKundliImg from '../assets/images/Prashna Kundli.png'
import people1 from '../assets/images/people1.jpg'
import people2 from '../assets/images/people2.jpg'
import people3 from '../assets/images/people3.jpg'
import people4 from '../assets/images/people4.jpg'
import people5 from '../assets/images/people5.jpg'
import people6 from '../assets/images/people6.jpg'
import confidentialityLogo from '../assets/logos/confidentiality.png'
import accuracyLogo from '../assets/logos/accuracy.png'
import solutionsLogo from '../assets/logos/solutions.png'
import transformationLogo from '../assets/logos/transformation.png'
import callLogo from "../assets/logos/Call.png"
import gmailLogo from "../assets/logos/gmail.png"
import mapsLogo from "../assets/logos/google-maps.png"
import waLogo from "../assets/logos/whatsapp.png"
import experienceLogo from '../assets/logos/experience.png'
import clientsLogo from '../assets/logos/clients.png'
import expertiseLogo from '../assets/logos/expertise.png'
import guidanceLogo from '../assets/logos/guidance.png'

import { VscWorkspaceTrusted } from "react-icons/vsc"
import { BsFillPersonFill, BsBullseye } from "react-icons/bs"
import { PiFlowerLotusLight } from "react-icons/pi"

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
    title: 'VEDIC ASTROLOGY', 
    price: '₹2,100',
    duration: '30 min',
    text: 'Comprehensive evaluation of planetary positions, houses, and transits (Janam Kundli) to clarify your destiny, strengths, weaknesses, and future timelines.', 
    iconKey: 'file' 
  },
  { 
    id: 2, 
    title: 'NUMEROLOGY', 
    price: '₹1,100',
    duration: '30 min',
    text: 'Uncover the hidden patterns of your life path, destiny, and name frequencies. Align your personal vibrations to unlock career opportunities and wealth luck.', 
    iconKey: 'hash' 
  },
  { 
    id: 3, 
    title: 'VASTU CONSULTANT', 
    price: '₹5,100',
    duration: '30 min',
    text: 'Optimize the flow of energy at home or work. Align rooms, elements, and layouts to clear blocking influences and invite growth, harmony, and prosperity.', 
    iconKey: 'home' 
  },
  { 
    id: 4, 
    title: 'LAAL KITAAB REMEDIES', 
    price: '₹1,100',
    duration: '30 min',
    text: 'Simple, practical, and highly effective remedial measures for planetary afflictions, debts, obstacles in career/marriage, and negative influences without complex rituals.', 
    iconKey: 'book' 
  },
  { 
    id: 5, 
    title: 'EXPERTISE IN PRASHNA KUNDALI', 
    price: '₹1,100',
    duration: '30 min',
    text: 'Get instant, precise answers to specific questions (concerning career, finance, marriage, missing items, etc.) based on the exact moment the question is asked.', 
    iconKey: 'help' 
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
    case 'book':
      return <BookOpen className={iconClass} size={24} />;
    case 'help':
      return <HelpCircle className={iconClass} size={24} />;
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
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-2.5 rounded-full shadow-md border border-[#AB7A57]/20 z-30 hover:scale-105 active:scale-95 transition-all text-[#181122] cursor-pointer"
        aria-label="Previous Service"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Left & Right fading overlays for smooth cinematic masking */}
      <div className="absolute inset-y-0 left-0 w-[clamp(2rem,6vw,6rem)] bg-gradient-to-r from-white to-transparent z-20 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-[clamp(2rem,6vw,6rem)] bg-gradient-to-l from-white to-transparent z-20 pointer-events-none"></div>

      {/* Slider Container */}
      <div className="relative w-full overflow-hidden">
        <div className="flex justify-center items-center gap-[clamp(1rem,2vw,2.5rem)] overflow-visible relative min-h-[480px] py-12">
          {visibleServices.map((service, index) => {
            const isCenter = index === centerIndex;
            const cardStyle = getCardStyles(index);

            // Determine classes & styles based on computed card layout position
            let bgClass = "";
            let titleClass = "";
            let textClass = "";
            let borderStyle = {};
            let iconContainerClass = "";
            let isOutlineIcon = true;

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
  const timelineRef = useRef(null);
  const [dotStep, setDotStep] = useState(0);
  const [visibleCardsCount, setVisibleCardsCount] = useState(0);
  const [isTimelineStarted, setIsTimelineStarted] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const startTimelineSequence = () => {
    if (isTimelineStarted) return;
    setIsTimelineStarted(true);
    setDotStep(0);
    setVisibleCardsCount(1);
    
    setTimeout(() => {
      setDotStep(1);
      setVisibleCardsCount(2);
    }, 400);

    setTimeout(() => {
      setDotStep(2);
      setVisibleCardsCount(3);
    }, 800);

    setTimeout(() => {
      setDotStep(3);
      setVisibleCardsCount(4);
    }, 1200);
  };

  const getDotXPosition = () => {
    if (dotStep === 0) return "0%";
    if (dotStep === 1) return "33.33%";
    if (dotStep === 2) return "66.66%";
    return "100%";
  };

  const getDotYPosition = () => {
    if (dotStep === 0) return "0%";
    if (dotStep === 1) return "33.33%";
    if (dotStep === 2) return "66.66%";
    return "100%";
  };
 
  // Features Data (Luxury Vedic dark-purple section specs - Option 2 layout)
  const featuresData = [
    {
      title: "TRUSTED & CONFIDENTIAL",
      desc: "Your birth charts and consultation details are kept completely private.",
      icon: <VscWorkspaceTrusted size={22} className="text-[#D3AF54]" />
    },
    {
      title: "ACCURATE PREDICTIONS",
      desc: "High precision mathematics calculating planetary alignment and transits.",
      icon: <BsBullseye size={22} className="text-[#D3AF54]" />
    },
    {
      title: "PERSONALIZED SOLUTIONS",
      desc: "Tailored remedial measures including gemstone advice, mantras, and pujas.",
      icon: <BsFillPersonFill size={22} className="text-[#D3AF54]" />
    },
    {
      title: "POSITIVE TRANSFORMATION",
      desc: "Bring focus, wealth, wellness, and alignment back into your personal life.",
      icon: <PiFlowerLotusLight size={22} className="text-[#D3AF54]" />
    }
  ]

  // Testimonials Data
  const testimonials = [
    {
      name: "Rohan Sharma",
      rating: 5,
      text: "The guidance I received brought clarity and confidence to my life. The remedies were practical and the predictions were remarkably accurate.",
      service: "Vedic Astrology",
      image: people1
    },
    {
      name: "Amit Patel",
      rating: 5,
      text: "Understanding my transits and Saturn cycle through Kundan's counseling helped me navigate my career transition successfully.",
      service: "Expertise in Prashna Kundali",
      image: people2
    },
    {
      name: "Priya Kapoor",
      rating: 5,
      text: "Amazing Vastu advice! Making small changes at our entrance brought positive vibes and progress within weeks.",
      service: "Vastu Consultant",
      image: people3
    },
    {
      name: "Dr. Aarav Mehta",
      rating: 5,
      text: "Wearing the recommended Yellow Sapphire has brought immense mental clarity and improved my focus in my clinical work.",
      service: "Laal Kitaab Remedies",
      image: people4
    },
    {
      name: "Neha Gupta",
      rating: 5,
      text: "The compatibility reading was spot on. Kundan suggested simple mantra remedies that helped ease the relationship friction.",
      service: "Vedic Astrology",
      image: people5
    },
    {
      name: "Vikram Aditya",
      rating: 5,
      text: "Changing my business name spelling as suggested by Kundan Singh did wonders for our customer outreach and conversion rate.",
      service: "Numerology",
      image: people6
    }
  ]

  // Services Grid Data
  const services = [
    {
      title: 'Vedic Astrology',
      price: '₹2,100',
      duration: '30 min',
      desc: 'Comprehensive evaluation of planetary positions, houses, and transits (Janam Kundli) to clarify your destiny, strengths, weaknesses, and future timelines.',
      icon: <FileText size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Numerology',
      price: '₹1,100',
      duration: '30 min',
      desc: 'Uncover the hidden patterns of your life path, destiny, and name frequencies. Align your personal vibrations to unlock career opportunities and wealth luck.',
      icon: <Hash size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Vastu Consultant',
      price: '₹5,100',
      duration: '30 min',
      desc: 'Optimize the flow of energy at home or work. Align rooms, elements, and layouts to clear blocking influences and invite growth, harmony, and prosperity.',
      icon: <HomeIcon size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Laal Kitaab Remedies',
      price: '₹1,100',
      duration: '30 min',
      desc: 'Simple, practical, and highly effective remedial measures for planetary afflictions, debts, obstacles in career/marriage, and negative influences without complex rituals.',
      icon: <BookOpen size={20} className="text-[#fcb900]" />
    },
    {
      title: 'Expertise in Prashna Kundali',
      price: '₹1,100',
      duration: '30 min',
      desc: 'Get instant, precise answers to specific questions (concerning career, finance, marriage, missing items, etc.) based on the exact moment the question is asked.',
      icon: <HelpCircle size={20} className="text-[#fcb900]" />
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
  const [serverError, setServerError] = useState("")
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setServerError("")
    
    if (!formData.name.trim()) {
      alert("Please enter your Name.")
      return
    }
    if (formData.name.trim().length < 2) {
      alert("Name must be at least 2 characters.")
      return
    }
    if (!formData.email.trim()) {
      alert("Please enter your Email Address.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      alert("Please enter a valid email address.")
      return
    }
    if (!formData.selectedService) {
      alert("Please select a service of interest.")
      return
    }
    console.log("Contact Form Submitted Data:", formData)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.dob ? `DOB: ${formData.dob}` : "N/A",
          subject: formData.selectedService,
          message: formData.comment || "No message comment provided.",
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit contact query.")
      }

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
    } catch (err) {
      setServerError(err.message || "Failed to connect to backend server. Please verify that the backend is running.")
    }
  }

   return (
    <div className="w-full bg-[#FDFCF5] relative flex flex-col items-center">
      
      {/* Global Custom SVG Clip Paths */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="arch-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0 1 L 0 0.35 C 0 0, 1 0, 1 0.35 L 1 1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* ========================================================= */}
      {/* 2. HERO DEEP SPACE BAND SECTION (Navy: #06091B)            */}
      {/* ========================================================= */}
      <div className="w-full bg-[#06091B] relative overflow-hidden flex flex-col items-center border-b border-[#AB7A57]/20 text-white">
        
        {/* Background decors for Hero */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.1),transparent_70%)] rounded-full -z-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.06),transparent_70%)] rounded-full -z-10"></div>
        
        {/* Capped layout wrapper inside band */}
        <div className="w-full max-w-[2400px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)] flex flex-col items-center">
          
          <section className="w-full flex flex-col lg:flex-row items-center justify-between min-h-[600px] pt-4 pb-20 lg:pt-6 lg:pb-28 gap-[clamp(2rem,4vw,4rem)] bg-transparent">
            
            {/* Left Side Content Column (Slides in from the left) */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 space-y-6 text-left z-10"
            >
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-[#D3AF54]/30 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#D3AF54] rounded-full animate-pulse"></span>
                <span className="text-[10px] tracking-[0.2em] font-semibold text-[#D3AF54] uppercase font-sans">
                  GUIDANCE • CLARITY • POSITIVITY
                </span>
              </div>

              {/* Large Headline */}
              <h1 className="text-[clamp(2.25rem,4.8vw,5.5rem)] font-serif !text-[#FDFCF5] leading-tight font-bold tracking-wide">
                Discover Your{" "}
                <span className="bg-gradient-to-r from-[#D3AF54] via-[#AB7A57] to-[#D3AF54] bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap">
                  True Destiny
                </span>{" "}
                <span className="sm:whitespace-nowrap">with Expert Guidance</span>
              </h1>

              {/* Subheading */}
              <p className="text-[clamp(0.875rem,1.1vw,1.15rem)] text-[#D8CFEB] leading-relaxed max-w-xl font-sans">
                Astrologer Kundan Singh offers precise birth chart analysis, Vedic predictions, gemstones recommendation, and Vastu consultations. Over a decade of cosmic map readings.
              </p>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link 
                  to="/booking"
                  className="bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(211,175,84,0.3)] cursor-pointer text-sm tracking-wide"
                >
                  <Calendar size={18} />
                  <span>Book Consultation</span>
                </Link>

                <a 
                  href="#quick-connect"
                  className="border border-[#AB7A57] hover:border-[#D3AF54] text-white hover:text-[#D3AF54] font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 backdrop-blur-md cursor-pointer text-sm tracking-wide bg-white/[0.02]"
                >
                  <span>Quick Inquiry</span>
                </a>
              </div>
            </motion.div>

            {/* Right Side Portrait Image Column */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="flex-1 flex justify-center items-center relative w-full min-h-[400px]"
            >
              <div className="absolute w-[clamp(16rem,22vw,24rem)] h-[clamp(16rem,22vw,24rem)] bg-[#D3AF54]/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

              <Sparkles className="absolute top-10 right-10 text-[#D3AF54]/60 animate-bounce" size={24} />
              <Sparkles className="absolute bottom-20 left-10 text-[#AB7A57]/40" size={18} />

              <div className="relative w-[clamp(18rem,25vw,26rem)] h-[clamp(18rem,25vw,26rem)] rounded-full border-2 border-dashed border-[#D3AF54]/50 flex items-center justify-center animate-[spin_100s_linear_infinite] overflow-hidden">
                <img 
                  src={zodiacWheel} 
                  alt="Zodiac Wheel Layout" 
                  className="w-full h-full object-cover opacity-20 filter invert"
                />
                <div className="absolute inset-0 flex justify-center items-center text-[10px] text-[#AB7A57]/60 font-serif">
                  <span className="absolute top-2">♈</span>
                  <span className="absolute right-2">♋</span>
                  <span className="absolute bottom-2">♎</span>
                  <span className="absolute left-2">♑</span>
                </div>
              </div>

              <div className="absolute w-[clamp(15rem,21vw,22rem)] h-[clamp(15rem,21vw,22rem)] rounded-full overflow-hidden border-4 border-[#D3AF54] bg-[#06091B] shadow-2xl flex items-center justify-center group hover:scale-[1.02] transition-all duration-500 hover:shadow-[0_20px_45px_rgba(211,175,84,0.3)]">
                <img 
                  src={astrologerPortrait} 
                  alt="Astrologer Kundan Singh at work" 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
              </div>
            </motion.div>

          </section>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. LUXURY FEATURE STRIP SECTION                           */}
      {/* ========================================================= */}
      <div ref={timelineRef} className="w-full bg-[#FDFCF5] flex flex-col items-center border-b border-[#AB7A57]/10 relative">
        
        {/* Floating Glassmorphic Stat bar sitting exactly at the boundary */}
        {/* Floating Glassmorphic Stat bar sitting exactly at the boundary */}
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 relative z-30 -translate-y-1/2">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full bg-[#FDFCF5] border border-[#AB7A57]/30 rounded-3xl p-1.5 py-2 sm:p-3 sm:py-3 shadow-2xl relative overflow-hidden grid grid-cols-3 gap-1.5 sm:gap-4 text-center z-30"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.04),transparent_70%)] pointer-events-none"></div>
            
            {/* Box 1: Experience */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 pt-1 pb-0.5 px-1 sm:pt-1.5 sm:pb-1 sm:px-2 lg:pt-2 lg:pb-1.5 lg:px-3 bg-[#06091B] border border-[#AB7A57]/30 rounded-xl w-full text-center lg:text-left shadow-md animate-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#AB7A57]/45 flex items-center justify-center text-[#D3AF54] bg-white/[0.03] shrink-0">
                <Award size={12} className="lg:w-3.5 lg:h-3.5" />
              </div>
              <div className="flex flex-col items-center lg:items-start min-w-0 w-full">
                <span className="text-[8px] sm:text-[10px] lg:text-xs uppercase text-[#D3AF54] tracking-wider font-semibold w-full text-center lg:text-left lg:whitespace-nowrap">Experience</span>
                <span className="text-[9px] sm:text-[11px] lg:text-sm font-bold text-white font-serif mt-0.5 lg:mt-0.5 w-full text-center lg:text-left lg:whitespace-nowrap">10+ Years</span>
              </div>
            </div>

            {/* Box 2: Consultations */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 pt-1 pb-0.5 px-1 sm:pt-1.5 sm:pb-1 sm:px-2 lg:pt-2 lg:pb-1.5 lg:px-3 bg-[#06091B] border border-[#AB7A57]/30 rounded-xl w-full text-center lg:text-left shadow-md animate-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#AB7A57]/45 flex items-center justify-center text-[#D3AF54] bg-white/[0.03] shrink-0">
                <Users size={12} className="lg:w-3.5 lg:h-3.5" />
              </div>
              <div className="flex flex-col items-center lg:items-start min-w-0 w-full">
                <span className="text-[8px] sm:text-[10px] lg:text-xs uppercase text-[#D3AF54] tracking-wider font-semibold w-full text-center lg:text-left lg:whitespace-nowrap">Consultations</span>
                <span className="text-[9px] sm:text-[11px] lg:text-sm font-bold text-white font-serif mt-0.5 lg:mt-0.5 w-full text-center lg:text-left lg:whitespace-nowrap">10,000+</span>
              </div>
            </div>

            {/* Box 4: Rating */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-3 pt-1 pb-0.5 px-1 sm:pt-1.5 sm:pb-1 sm:px-2 lg:pt-2 lg:pb-1.5 lg:px-3 bg-[#06091B] border border-[#AB7A57]/30 rounded-xl w-full text-center lg:text-left shadow-md animate-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#AB7A57]/45 flex items-center justify-center text-[#D3AF54] bg-white/[0.03] shrink-0">
                <Star size={12} className="fill-[#D3AF54] text-[#D3AF54] lg:w-3.5 lg:h-3.5" />
              </div>
              <div className="flex flex-col items-center lg:items-start min-w-0 w-full">
                <span className="text-[8px] sm:text-[10px] lg:text-xs uppercase text-[#D3AF54] tracking-wider font-semibold w-full text-center lg:text-left lg:whitespace-nowrap">Rating</span>
                <span className="text-[9px] sm:text-[11px] lg:text-sm font-bold text-white font-serif mt-0.5 lg:mt-0.5 w-full text-center lg:text-left lg:whitespace-nowrap">4.9 / 5.0</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="w-full max-w-[2400px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)] pt-8 sm:pt-12">
          
          <motion.section 
            onViewportEnter={startTimelineSequence}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full pb-[clamp(3.5rem,6vw,7.5rem)] relative overflow-hidden z-10 flex flex-col items-center"
          >
            {/* Section Header */}
            <div className="text-center mb-10 space-y-2">
              <span className="text-sm sm:text-base tracking-[0.3em] font-bold text-[#AB7A57] uppercase font-sans flex items-center justify-center gap-1.5">
                ✦ Our Features ✦
              </span>
            </div>
            
            {/* Desktop View (Large Screens: lg breakpoint) */}
            <div className="hidden lg:flex flex-col items-center w-full relative">
              
              {/* Grid of 4 horizontal feature cards */}
              <div className="grid grid-cols-4 gap-6 w-full relative z-10">
                {featuresData.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ 
                      opacity: visibleCardsCount > index ? 1 : 0, 
                      y: visibleCardsCount > index ? 0 : 30 
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-[#181122] border border-[#AB7A57]/20 hover:border-[#D3AF54] rounded-2xl p-6 flex flex-col items-start text-left gap-4 transition-all duration-300 shadow-lg hover:shadow-[0_15px_30px_rgba(211,175,84,0.15)] group cursor-pointer hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3 w-full">
                      {/* Gold Circular Outlined Icon Container */}
                      <div className="w-10 h-10 rounded-full border border-[#BDBDBD] group-hover:border-[#D3AF54] flex items-center justify-center text-[#D3AF54] bg-[#FFFDEE] shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,175,84,0.3)] transition-all duration-300">
                        {item.icon}
                      </div>
                      {/* Title */}
                      <span className="font-serif text-[#D3AF54] group-hover:text-white font-bold text-xs md:text-sm uppercase tracking-wider transition-colors duration-300">
                        {item.title}
                      </span>
                    </div>
                    {/* Subtext */}
                    <p className="text-[13px] md:text-sm text-[#D8CFEB] leading-relaxed font-sans w-full">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>

            </div>

            {/* Mobile/Tablet View (Small Screens: below lg breakpoint) */}
            <div className="flex lg:hidden flex-col items-start w-full relative">
              
              {/* Grid Layout of cards on the right side */}
              <div className="w-full grid grid-cols-1 gap-6 sm:gap-8 relative z-10">
                {featuresData.map((item, index) => (
                  <div key={index} className="w-full min-h-[140px] flex items-center relative">
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ 
                        opacity: visibleCardsCount > index ? 1 : 0, 
                        x: visibleCardsCount > index ? 0 : 30 
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="bg-[#181122] border border-[#AB7A57]/20 hover:border-[#D3AF54] rounded-2xl p-5 shadow-lg max-w-2xl w-full flex flex-col items-start gap-3 group cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-[#BDBDBD] flex items-center justify-center text-[#D3AF54] bg-[#FFFDEE] shrink-0 group-hover:scale-115 transition-transform duration-300">
                          {item.icon}
                        </div>
                        <span className="font-serif text-[#D3AF54] font-bold text-xs uppercase tracking-wider">{item.title}</span>
                      </div>
                      <p className="text-xs text-[#D8CFEB] leading-relaxed font-sans">{item.desc}</p>
                    </motion.div>
                  </div>
                ))}
              </div>

            </div>

          </motion.section>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PREMIUM ASTROLOGY SERVICES GRID                        */}
      {/* ========================================================= */}
      <div className="w-full bg-[#EDE9D7] flex justify-center border-b border-[#AB7A57]/10 rounded-t-[2.5rem] -mt-10 shadow-[0_-20px_40px_-15px_rgba(24,17,34,0.12)] z-10">
        <div className="w-full max-w-[2400px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)]">

          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full bg-transparent py-[clamp(2.5rem,5vw,6rem)] relative overflow-hidden flex flex-col items-center"
          >
            <div className="absolute top-2 left-2 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.04),transparent_60%)] rounded-full -z-10 animate-pulse"></div>

            <div className="w-full">
              
              {/* Section Header */}
              <div className="text-center mb-10 space-y-2">
                <span className="text-sm sm:text-base tracking-[0.3em] font-bold text-[#AB7A57] uppercase font-sans flex items-center justify-center gap-1.5">
                  ✦ Our Services ✦
                </span>
                <h3 className="text-[clamp(1.4rem,2.2vw,2.4rem)] font-serif font-bold text-[#181122] tracking-wide mt-1">
                  Guidance for Every Aspect of Life
                </h3>
              </div>

              {/* Mobile & Tablet Services Grid (3 rows, 2 columns - Text only, updates active tab) */}
              <div className="grid lg:hidden grid-cols-2 gap-3 sm:gap-4 mt-6 text-[#181122] max-w-2xl mx-auto w-full">
                {allServices.map((item, idx) => {
                  const isActive = activeServiceTab === idx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveServiceTab(idx)}
                      className={`border rounded-2xl p-3 sm:p-4 flex items-center justify-center text-center transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer min-h-[52px] h-full p-2 sm:p-3 ${
                        isActive 
                          ? "bg-[#FFFDEE] border-[#D3AF54] text-[#181122] font-bold shadow-md" 
                          : "bg-white border-[#AB7A57]/15 text-[#181122]/70 hover:bg-[#181122]/5"
                      }`}
                    >
                      <span className="font-serif font-bold text-[10px] sm:text-xs tracking-wide leading-tight">
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile & Tablet Service Details Card */}
              <div className="block lg:hidden mt-6 w-full text-white max-w-2xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeServiceTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="bg-[#181122] border border-[#AB7A57]/20 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden text-white text-left"
                  >
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.3),transparent_70%)] pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D3AF54]/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="space-y-4">
                      {/* Service Image banner */}
                      <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-white/10 relative">
                        <img 
                          src={
                            activeServiceTab === 0 ? vedicAstrologyImg :
                            activeServiceTab === 1 ? numerologyImg :
                            activeServiceTab === 2 ? vastuConsultationImg :
                            activeServiceTab === 3 ? laalKitaabImg :
                            prashnaKundliImg
                          }
                          alt={allServices[activeServiceTab].title}
                          className="w-full h-full object-cover opacity-80"
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <span className="text-[9px] tracking-[0.2em] font-bold text-[#D3AF54] uppercase font-sans block">
                          ✦ CELESTIAL ALIGNMENT ✦
                        </span>
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
                            {allServices[activeServiceTab].title}
                          </h3>
                          <div className="text-right">
                            <span className="text-sm font-bold text-[#D3AF54] font-sans block whitespace-nowrap">
                              {allServices[activeServiceTab].price}
                            </span>
                            <span className="text-[10px] text-[#D8CFEB] font-sans block whitespace-nowrap">
                              {allServices[activeServiceTab].duration}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-[#D8CFEB] leading-relaxed font-sans">
                          {allServices[activeServiceTab].text}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-start w-full">
                      <Link 
                        to="/booking"
                        className="bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-semibold px-5 py-2 rounded-xl transition duration-300 shadow-md shadow-[#D3AF54]/10 cursor-pointer text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                        <Calendar size={14} />
                        <span>Book Consultation</span>
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Desktop Showcase Dashboard (lg screens only) */}
              <div className="hidden lg:grid lg:grid-cols-10 gap-12 lg:gap-14 items-stretch mt-6 text-[#181122] max-w-4xl mx-auto">
                {/* Left Column - Service tabs list */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  {/* Mobile Horizontal Scroll Tab Row */}
                  <div className="flex md:hidden overflow-x-auto gap-3 pb-2 scrollbar-none w-full">
                    {allServices.map((item, idx) => {
                      const isActive = activeServiceTab === idx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveServiceTab(idx)}
                          className={`flex-shrink-0 w-[180px] flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                            isActive 
                              ? "bg-[#FFFDEE] border-[#D3AF54] text-[#181122] shadow-md" 
                              : "bg-white border-[#AB7A57]/15 text-[#181122]/70 hover:bg-[#181122]/5"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? "bg-[#181122] border border-[#D3AF54] text-white" : "bg-[#FFFDEE] border border-[#AB7A57]/20 text-[#181122]"
                          }`}>
                            {renderServiceIcon(item.iconKey, isActive)}
                          </div>
                          <span className={`font-semibold tracking-wide text-xs truncate ${
                            isActive ? "text-[#181122] font-bold" : "text-[#181122]/70"
                          }`}>
                            {item.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Desktop Vertical Tab List */}
                  <div className="hidden md:flex flex-col gap-3">
                    {allServices.map((item, idx) => {
                      const isActive = activeServiceTab === idx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveServiceTab(idx)}
                          className={`flex items-center gap-4 p-3.5 rounded-2xl border text-left transition-all duration-300 w-full cursor-pointer relative overflow-hidden group ${
                            isActive 
                              ? "bg-[#FFFDEE] border-[#D3AF54] text-[#181122] shadow-xl hover:border-[#D3AF54]" 
                              : "bg-white border-[#AB7A57]/15 text-[#181122]/70 hover:bg-[#181122]/5 hover:border-[#AB7A57]/30"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#D3AF54]" />
                          )}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105 ${
                            isActive 
                              ? "bg-[#181122] border border-[#D3AF54] text-white" 
                              : "bg-[#FFFDEE] border border-[#AB7A57]/20 text-[#181122]"
                          }`}>
                            {renderServiceIcon(item.iconKey, isActive)}
                          </div>
                          <div>
                            <h4 className={`font-serif text-sm font-bold tracking-wide transition-colors ${
                              isActive ? "text-[#181122]" : "text-[#181122]/80 group-hover:text-[#AB7A57]"
                            }`}>
                              {item.title}
                            </h4>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column - Service Details Panel */}
                <div className="lg:col-span-6">
                  <AnimatePresence mode="wait">
                     <motion.div
                       key={activeServiceTab}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       transition={{ duration: 0.3 }}
                       className="bg-[#181122] border border-[#AB7A57]/20 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden text-white min-h-[440px] h-full text-left"
                     >
                       <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.3),transparent_70%)] pointer-events-none" />
                       <div className="absolute top-0 right-0 w-48 h-48 bg-[#D3AF54]/5 rounded-full blur-3xl pointer-events-none" />

                       <div className="space-y-6">
                         {/* Service Image banner */}
                         <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-white/10 relative group">
                           <img 
                             src={
                               activeServiceTab === 0 ? vedicAstrologyImg :
                               activeServiceTab === 1 ? numerologyImg :
                               activeServiceTab === 2 ? vastuConsultationImg :
                               activeServiceTab === 3 ? laalKitaabImg :
                               prashnaKundliImg
                             }
                             alt={allServices[activeServiceTab].title}
                             className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-102 transition-all duration-500"
                           />
                         </div>

                         <div className="space-y-3 text-left">
                           <span className="text-[10px] tracking-[0.25em] font-bold text-[#D3AF54] uppercase font-sans block">
                             ✦ CELESTIAL ALIGNMENT ✦
                           </span>
                           <div className="flex items-center justify-between gap-4">
                              <h3 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
                                {allServices[activeServiceTab].title}
                              </h3>
                              <div className="text-right">
                                <span className="text-base font-bold text-[#D3AF54] font-sans block whitespace-nowrap">
                                  {allServices[activeServiceTab].price}
                                </span>
                                <span className="text-xs text-[#D8CFEB] font-sans block whitespace-nowrap">
                                  {allServices[activeServiceTab].duration}
                                </span>
                              </div>
                            </div>
                           <p className="text-xs sm:text-sm text-[#D8CFEB] leading-relaxed font-sans">
                             {allServices[activeServiceTab].text}
                           </p>
                         </div>
                       </div>

                       <div className="mt-6 flex justify-start w-full">
                         <Link 
                           to="/booking"
                           className="bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-semibold px-5 py-2.5 rounded-xl transition duration-300 shadow-md shadow-[#D3AF54]/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider flex items-center gap-2"
                         >
                           <Calendar size={14} />
                           <span>Book Consultation</span>
                         </Link>
                       </div>
                     </motion.div>
                   </AnimatePresence>
                </div>
              </div>

            </div>
          </motion.section>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. LUXURIOUS CALL-TO-ACTION (CTA) BANNER STRIP            */}
      {/* ========================================================= */}
      <div className="w-full bg-[#F4F1E3] flex justify-center border-b border-[#AB7A57]/10 rounded-t-[2.5rem] mt-0 lg:-mt-10 py-8 lg:py-0 shadow-[0_-20px_40px_-15px_rgba(24,17,34,0.12)] z-10">
        <div className="w-full max-w-[2400px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)] pb-4 sm:pb-6">

          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full"
          >
            <div className="bg-[#181122] border border-[#D3AF54]/30 rounded-3xl p-4 sm:p-5 md:p-6 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 w-full">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D3AF54]/5 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

              <div className="flex items-center gap-6 text-left">
                <div className="hidden sm:flex w-16 h-16 rounded-full border border-[#D3AF54]/30 bg-white/5 items-center justify-center text-[#D3AF54] shrink-0">
                  <Moon size={32} className="fill-[#D3AF54]/10 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <span className="block text-[clamp(1.5rem,2.8vw,3rem)] font-serif font-bold text-white tracking-wide">
                    Ready to Transform Your Life?
                  </span>
                  <p className="text-xs md:text-sm text-[#D8CFEB] leading-relaxed max-w-xl font-sans">
                    Book your consultation today and take the first step toward a better tomorrow.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto flex justify-center shrink-0">
                <Link 
                  to="/booking"
                  className="bg-[#D3AF54] hover:bg-[#D3AF54]/90 text-[#181122] font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-[#D3AF54]/20 tracking-wide text-sm w-full md:w-auto"
                >
                  <Calendar size={18} />
                  <span>Book Consultation</span>
                </Link>
              </div>

            </div>
          </motion.section>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. INFINITE SLIDING MARQUEE TESTIMONIALS SECTION          */}
      {/* ========================================================= */}
      <div className="w-full bg-white flex justify-center border-b border-[#AB7A57]/10 rounded-t-[2.5rem] mt-0 lg:-mt-10 py-8 lg:py-0 shadow-[0_-20px_40px_-15px_rgba(24,17,34,0.12)] z-10">
        <div className="w-full max-w-[2400px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)]">

          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full bg-transparent py-[clamp(2.5rem,5vw,6rem)] relative overflow-hidden flex flex-col items-center"
          >
            <div className="absolute top-10 left-10 w-48 h-48 bg-[#D3AF54]/5 rounded-full blur-2xl -z-10"></div>
            <div className="absolute top-12 right-12 text-[#D3AF54]/50 animate-pulse">✦</div>

            <div className="w-full flex flex-col items-center">
              
              {/* Header */}
              <div className="text-center mb-10 space-y-2">
                <span className="text-sm sm:text-base tracking-[0.3em] font-bold text-[#AB7A57] font-sans block">
                  ✦ WHAT OUR CLIENTS SAY ✦
                </span>
                <h3 className="text-[clamp(1.4rem,2.2vw,2.4rem)] font-serif font-bold text-[#181122] tracking-wide mt-1">
                  Trusted By Thousands
                </h3>
              </div>

              {/* Sliding Marquee Track */}
              <div className="w-full overflow-hidden flex relative py-4">
                {/* Left & Right fading overlays */}
                <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none"></div>
                
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
                      className="bg-[#181122] border border-[#AB7A57]/20 hover:border-[#D3AF54] rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-lg hover:shadow-[0_12px_24px_rgba(211,175,84,0.1)] transition-all duration-300 relative select-none w-[clamp(17rem,24vw,32rem)] shrink-0 gap-4"
                    >
                      <div>
                        {/* Stars row */}
                        <div className="flex gap-1 text-[#D3AF54] mb-3">
                          {[...Array(item.rating)].map((_, i) => (
                            <Star key={i} size={14} className="fill-[#D3AF54] text-[#D3AF54]" />
                          ))}
                        </div>

                        {/* Review text */}
                        <p className="text-xs md:text-sm text-white font-sans italic leading-relaxed text-left">
                          "{item.text}"
                        </p>
                      </div>

                      {/* Client identity row */}
                      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5 w-full">
                        {/* Avatar frame */}
                        <div className="w-10 h-10 rounded-full border border-[#AB7A57]/30 bg-[#FFFDEE] flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-[#D3AF54] font-semibold">
                              {item.name.split(" ")[0][0]}
                              {item.name.split(" ").length > 1 ? item.name.split(" ")[1][0] : ""}
                            </span>
                          )}
                        </div>
                        {/* Name & service */}
                        <div className="flex flex-col text-left">
                          <span className="font-sans text-white font-bold text-sm leading-tight">{item.name}</span>
                          <span className="text-[10px] text-[#D3AF54] tracking-wider font-semibold mt-0.5">{item.service}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

            </div>
          </motion.section>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. SECTION 2 — ABOUT THE ASTROLOGER                       */}
      {/* ========================================================= */}
      <div className="w-full bg-[#EDE9D7] flex justify-center border-b border-[#AB7A57]/10 rounded-t-[2.5rem] -mt-10 shadow-[0_-20px_40px_-15px_rgba(24,17,34,0.12)] z-10">
        <div className="w-full max-w-[2400px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)]">

          <section className="w-full bg-transparent py-[clamp(3rem,6vw,7rem)] relative overflow-hidden flex flex-col items-center">
            
            <div className="absolute bottom-4 left-4 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.03),transparent_70%)] rounded-full -z-10 animate-pulse"></div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column Astrologer Portrait (Slides in from the bottom - Desktop only) */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex lg:col-span-5 justify-center items-center relative w-full min-h-[400px]"
              >
                <div className="absolute -inset-2 border-2 border-dashed border-[#AB7A57]/40 rounded-3xl -z-10"></div>
                
                <div className="w-full max-w-[clamp(18rem,26vw,28rem)] aspect-[4/5] rounded-3xl overflow-hidden border-4 border-[#D3AF54] bg-[#181122] shadow-xl hover:shadow-[0_20px_45px_rgba(211,175,84,0.25)] flex items-center justify-center relative group hover:scale-[1.03] transition-all duration-500">
                  <img 
                    src={astrologerPortrait} 
                    alt="Astrologer Kundan Singh at work" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  />
                </div>
              </motion.div>

              {/* Right Column Profile Details (Slides in from the bottom) */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="lg:col-span-7 space-y-6 text-left"
              >
                <span className="text-sm sm:text-base tracking-[0.3em] font-bold text-[#AB7A57] uppercase font-sans text-left block">
                  ✦ ABOUT ME ✦
                </span>
                
                <h3 className="text-[clamp(1.4rem,2.2vw,2.4rem)] font-serif font-bold text-[#181122] tracking-wide mt-1 text-left">
                  Your Guide to a Brighter Future
                </h3>

                {/* Mobile/Tablet Image - visible only on screens smaller than lg */}
                <div className="block lg:hidden w-full my-4 flex justify-center items-center relative min-h-[260px] z-10">
                  <div className="absolute -inset-1 border-2 border-dashed border-[#AB7A57]/30 rounded-3xl -z-10"></div>
                  <div className="w-full max-w-[14rem] aspect-[4/5] rounded-3xl overflow-hidden border-4 border-[#D3AF54] bg-[#181122] shadow-lg flex items-center justify-center relative">
                    <img 
                      src={astrologerPortrait} 
                      alt="Astrologer Kundan Singh" 
                      className="w-full h-full object-cover opacity-90"
                    />
                  </div>
                </div>

                <div className="relative p-5 rounded-2xl bg-white/40 border border-[#AB7A57]/15 shadow-sm text-left backdrop-blur-xs">
                  <div className="absolute top-0 left-0 w-2 h-full bg-[#D3AF54] rounded-l-2xl" />
                  <p className="text-xs sm:text-sm text-[#181122]/90 leading-relaxed font-sans pl-2">
                    I am a qualified Vedic astrologer with over 15 years of experience, specializing in Janam Kundli analysis, Vastu Shastra, and Numerology. My approach combines traditional planetary wisdom—honed through rigorous education in Astrology and Alankar at Bharatiya Vidya Bhavan—with practical remedial insights to help you navigate modern life's career, relationship, and financial pathways.
                  </p>
                </div>

                {/* Achievement Cards Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 text-left max-w-md md:max-w-lg">
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-[#AB7A57]/10 hover:border-[#D3AF54] hover:bg-white hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 shadow-md cursor-default group">
                    <div className="w-9 h-9 rounded-full border border-[#AB7A57]/30 flex items-center justify-center bg-[#FFFDEE] shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                      <img src={experienceLogo} alt="Experience" className="w-5 h-5 object-contain" />
                    </div>
                    <h4 className="font-serif text-[#181122] font-bold text-xs sm:text-sm tracking-wide">10+ Years of Experience</h4>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-[#AB7A57]/10 hover:border-[#D3AF54] hover:bg-white hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 shadow-md cursor-default group">
                    <div className="w-9 h-9 rounded-full border border-[#AB7A57]/30 flex items-center justify-center bg-[#FFFDEE] shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                      <img src={clientsLogo} alt="Clients" className="w-5 h-5 object-contain" />
                    </div>
                    <h4 className="font-serif text-[#181122] font-bold text-xs sm:text-sm tracking-wide">Satisfied Clients</h4>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-[#AB7A57]/10 hover:border-[#D3AF54] hover:bg-white hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 shadow-md cursor-default group">
                    <div className="w-9 h-9 rounded-full border border-[#AB7A57]/30 flex items-center justify-center bg-[#FFFDEE] shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                      <img src={expertiseLogo} alt="Expertise" className="w-5 h-5 object-contain" />
                    </div>
                    <h4 className="font-serif text-[#181122] font-bold text-xs sm:text-sm tracking-wide">Vedic Expertise</h4>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-[#AB7A57]/10 hover:border-[#D3AF54] hover:bg-white hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 shadow-md cursor-default group">
                    <div className="w-9 h-9 rounded-full border border-[#AB7A57]/30 flex items-center justify-center bg-[#FFFDEE] shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                      <img src={guidanceLogo} alt="Guidance" className="w-5 h-5 object-contain" />
                    </div>
                    <h4 className="font-serif text-[#181122] font-bold text-xs sm:text-sm tracking-wide">Honest Guidance</h4>
                  </div>

                </div>
              </motion.div>

            </div>
          </section>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 8. DYNAMIC COSMIC CONTACT / DEEP SPACE BAND SECTION        */}
      {/* ========================================================= */}
      <div id="quick-connect" className="w-full bg-[#06091B] flex justify-center border-t border-[#AB7A57]/20 text-white">
        <div className="w-full max-w-[2400px] mx-auto px-[clamp(1.5rem,4vw,4.5rem)]">

          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full bg-transparent py-[clamp(2.5rem,5vw,6rem)] relative overflow-hidden flex flex-col items-center"
          >
            {/* Nebula Overlays */}
            <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(circle_at_top_right,rgba(171,122,87,0.12)_0%,transparent_70%)] rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-[radial-gradient(circle_at_bottom_left,rgba(211,175,84,0.06)_0%,transparent_70%)] rounded-full blur-3xl pointer-events-none -z-10" />
            
            {/* Scattered SVG Stars backdrop */}
            <div className="absolute inset-0 opacity-40 pointer-events-none -z-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10%" cy="15%" r="1" fill="#fff" />
                <circle cx="30%" cy="80%" r="1" fill="#fff" />
                <circle cx="55%" cy="25%" r="0.75" fill="#fff" />
                <circle cx="75%" cy="60%" r="1.25" fill="#D3AF54" className="animate-pulse" />
                <circle cx="85%" cy="15%" r="1" fill="#fff" />
                <circle cx="95%" cy="75%" r="0.5" fill="#fff" />
                <circle cx="15%" cy="65%" r="1" fill="#D3AF54" />
                <circle cx="45%" cy="85%" r="0.75" fill="#fff" />
              </svg>
            </div>

            <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-[clamp(2rem,4vw,5rem)] items-stretch relative z-10">
              
              {/* Left Panel: Services Selection Section */}
              <div
                className="hidden lg:flex flex-col justify-between bg-[#181122] border border-[#AB7A57]/20 rounded-2xl p-5 lg:p-6 text-left shadow-lg hover:border-[#D3AF54] transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none" />

                <div className="space-y-3">
                  {/* Header Title */}
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-[0.2em] font-bold text-[#D3AF54] uppercase font-sans block">
                      ✦ TRUSTED & CONFIDENTIAL ✦
                    </span>
                    <h3 className="text-[clamp(1.1rem,1.5vw,1.5rem)] font-serif font-bold text-white tracking-wide">
                      Select Vedic Service*
                    </h3>
                    <p className="text-[clamp(0.8rem,1vw,1.1rem)] text-[#D8CFEB] leading-relaxed font-sans">
                      Select a service below to request your consultation. Selection is compulsory.
                    </p>
                  </div>

                  {/* Services Selector Grid */}
                  <div className="grid grid-cols-2 gap-2 py-1">
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
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
                            isSelected 
                              ? "bg-[#D3AF54]/15 border-[#D3AF54] text-white shadow-[0_0_10px_rgba(211,175,84,0.2)]" 
                              : "bg-white/[0.02] border-white/5 text-[#D8CFEB]/95 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="text-sm shrink-0">{item.icon}</div>
                          <span className="font-semibold tracking-wide text-left text-[10px] sm:text-xs leading-tight">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Astrologer Details & Links */}
                <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#D3AF54]/80 font-bold uppercase tracking-widest font-sans block">
                      ASTROLOGER
                    </span>
                    <span className="text-sm sm:text-base font-serif font-bold text-white tracking-wide">
                      Astrologer Kundan Singh
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs sm:text-sm text-white font-sans">
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <img src={gmailLogo} alt="Gmail" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="truncate">astroadvicebyks@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <img src={callLogo} alt="Call" className="w-5 h-5 object-contain" />
                      </div>
                      <span>+91 8130808758, +91 8527790801</span>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <img src={mapsLogo} alt="Maps" className="w-5 h-5 object-contain" />
                      </div>
                      <span>Vasant Kunj, Delhi, India</span>
                    </div>
                    <a 
                      href="https://wa.me/918527790801" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3.5 hover:text-[#D3AF54] transition-colors group/wa"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover/wa:border-[#D3AF54] transition-colors">
                        <img src={waLogo} alt="WhatsApp" className="w-5 h-5 object-contain" />
                      </div>
                      <span>WhatsApp Live Support</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Panel: Contact Form */}
              <div
                className="flex flex-col justify-between bg-[#181122] border border-[#AB7A57]/20 rounded-2xl p-5 lg:p-6 text-left shadow-lg hover:border-[#D3AF54] transition-all duration-300 relative overflow-hidden"
              >
                {/* Orbiting Planetary Decor */}
                <div className="absolute top-3 right-3 w-20 h-20 pointer-events-none select-none opacity-40 z-0">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="7" className="fill-[#D3AF54] animate-pulse" />
                    <circle cx="50" cy="50" r="20" className="stroke-white/10 stroke-[0.5] fill-none" />
                    <circle cx="50" cy="50" r="35" className="stroke-white/10 stroke-[0.5] fill-none" strokeDasharray="3,3" />
                    <motion.circle 
                      cx="50" cy="50" r="2" className="fill-[#D8CFEB]"
                      animate={{
                        cx: [50 + 20 * Math.cos(0), 50 + 20 * Math.cos(2*Math.PI)],
                        cy: [50 + 20 * Math.sin(0), 50 + 20 * Math.sin(2*Math.PI)],
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />
                  </svg>
                </div>

                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-16 space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#D3AF54]/10 border-2 border-[#D3AF54] flex items-center justify-center text-[#D3AF54] text-xl shadow-[0_0_12px_rgba(211,175,84,0.3)] animate-pulse">
                      ✓
                    </div>
                    <h4 className="font-serif text-white font-bold text-xl">Request Dispatched</h4>
                    <p className="text-xs sm:text-sm text-white max-w-xs leading-relaxed font-sans">
                      Your cosmic chart request has been sent successfully. Astrologer Kundan Singh will analyze your alignments and contact you soon.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4 z-10 relative">
                    {serverError && (
                      <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs text-center font-sans tracking-wide">
                        ⚠️ {serverError}
                      </div>
                    )}
                    {/* Header info */}
                    <div className="space-y-1">
                      <span className="text-xs tracking-[0.25em] font-bold text-[#D3AF54] uppercase font-sans block">
                        ✦ ACCURATE PREDICTIONS ✦
                      </span>
                      <p className="text-xs sm:text-sm text-[#D8CFEB] leading-relaxed font-sans">
                        Fill in your details below. Fields marked with * are required.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Name field */}
                      <div className="space-y-1 text-left">
                        <label htmlFor="form-name" className="block text-xs sm:text-sm font-semibold text-[#D3AF54] uppercase tracking-wide">
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
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D3AF54]/80 focus:bg-white/[0.06] transition-all duration-300"
                        />
                      </div>

                      {/* DOB field */}
                      <div className="space-y-1 text-left">
                        <label htmlFor="form-dob" className="block text-xs sm:text-sm font-semibold text-[#D3AF54] uppercase tracking-wide">
                          Date of Birth (YYYY-MM-DD)*
                        </label>
                        <input 
                          type="date" 
                          id="form-dob"
                          name="dob"
                          required
                          value={formData.dob}
                          onChange={handleInputChange}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54]/80 focus:bg-white/[0.06] transition-all duration-300 color-scheme-dark"
                        />
                      </div>

                      {/* Email field */}
                      <div className="space-y-1 text-left">
                        <label htmlFor="form-email" className="block text-xs sm:text-sm font-semibold text-[#D3AF54] uppercase tracking-wide">
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
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D3AF54]/80 focus:bg-white/[0.06] transition-all duration-300"
                        />
                      </div>

                      {/* Custom In-Screen Dropdown Selector visible only on mobile/tablets */}
                      <div className="block lg:hidden space-y-1.5 text-left relative z-30">
                        <label className="block text-xs sm:text-sm font-semibold text-[#D3AF54] uppercase tracking-wider">
                          Select Service of Interest (Required)*
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                            className="w-full bg-[#181122] border border-white/10 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D3AF54] focus:ring-4 focus:ring-[#D3AF54]/15 transition-all duration-300 cursor-pointer flex justify-between items-center text-left"
                          >
                            <span>{formData.selectedService || "-- Select a service --"}</span>
                            <ChevronDown size={16} className={`text-[#D3AF54]/80 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 bg-[#181122] border border-[#AB7A57]/30 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col py-1">
                              {services.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedService: item.title,
                                      comment: prev.comment || `I am requesting a consultation for ${item.title}.`
                                    }));
                                    setIsDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs sm:text-sm text-[#D8CFEB] hover:bg-[#D3AF54]/15 hover:text-white transition-colors cursor-pointer border-b border-white/5 last:border-0"
                                >
                                  {item.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cosmic Comment */}
                      <div className="space-y-1 text-left">
                        <label htmlFor="form-comment" className="block text-xs sm:text-sm font-semibold text-[#D3AF54] uppercase tracking-wide">
                          Cosmic Comment / Vedic Inquiry
                        </label>
                        <textarea 
                          id="form-comment"
                          name="comment"
                          rows="2.5"
                          value={formData.comment}
                          onChange={handleInputChange}
                          placeholder="Describe your query, focus area, or gemstones interest details..."
                          className="w-full bg-[#05060f]/20 border border-[#D3AF54]/25 rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D3AF54] focus:ring-1 focus:ring-[#D3AF54]/30 transition-all duration-300 resize-none font-sans"
                        ></textarea>
                      </div>
                    </div>

                    {/* Submit button */}
                    <button 
                      type="submit"
                      className="w-full bg-[#D3AF54] hover:bg-[#D3AF54]/90 text-[#181122] font-bold py-3.5 rounded-lg hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(211,175,84,0.3)] cursor-pointer flex items-center justify-center gap-2 mt-4 text-xs sm:text-sm tracking-wider uppercase"
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
    </div>
  )
}

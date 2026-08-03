import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Shield, Sparkles, ArrowLeft, Star, Gem, CheckCircle, ArrowRight, Home, Sofa, Bed, Utensils, Bath, Briefcase, Heart, RefreshCw, Globe, User } from 'lucide-react'

import sunIcon from '../assets/planets/sun.jpg'
import moonIcon from '../assets/planets/moon.jpg'
import jupiterIcon from '../assets/planets/jupiter.jpg'
import rahuIcon from '../assets/planets/rahu.jpg'
import mercuryIcon from '../assets/planets/mercury.jpg'
import venusIcon from '../assets/planets/venus.jpg'
import ketuIcon from '../assets/planets/ketu.jpg'
import saturnIcon from '../assets/planets/saturn.jpg'
import marsIcon from '../assets/planets/mars.jpg'

import earthImg from '../assets/elements/earth.png'
import waterImg from '../assets/elements/water.png'
import fireImg from '../assets/elements/fire.png'
import airImg from '../assets/elements/air.png'
import spaceImg from '../assets/elements/space.png'

import vedicAstrologyImg from '../assets/images/Vedic Astrology.png'
import numerologyImg from '../assets/images/Numerology.png'
import vastuConsultationImg from '../assets/images/Vastu Consultation.png'
import laalKitaabImg from '../assets/images/Laal Kitaab Remedies.png'
import prashnaKundliImg from '../assets/images/Prashna Kundli.png'
import reikiHealerImg from '../assets/images/Reiki Healer.png'
import reikiChakrasImg from '../assets/images/reiki_chakras.jpg'

import solutionsLogo from '../assets/logos/solutions.png'
import guidanceLogo from '../assets/logos/guidance.png'
import accuracyLogo from '../assets/logos/accuracy.png'
import transformationLogo from '../assets/logos/transformation.png'
import clockLogo from '../assets/logos/clock.png'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 18 }
  }
};

const serviceDetails = {
  'vedic-astrology': {
    title: 'Vedic Astrology (Janam Kundli)',
    subtitle: 'Celestial Map of Your Life\'s Journey',
    image: vedicAstrologyImg,
    price: '$120 / ₹9,999',
    duration: '60 mins',
    desc: 'Vedic Astrology is an ancient science that maps the exact positions of stars and planets at the time of your birth to read your life\'s blueprint. Through rigorous mathematics and classical scriptures, this reading decodes your natural strengths, karmic challenges, and the optimal timing for critical life choices.',
    process: [
      'Submit exact birth details (date, time, and city of birth).',
      'Calculations of planetary positions, Dasha cycles, and divisional charts.',
      'A 60-minute interactive live video/audio consultation session.',
      'Final customized remedial report detailing Mantras, Vratas, and Gemstone suggestions.'
    ],
    benefits: [
      {
        title: 'Karmic Insights',
        desc: 'Understand why certain patterns repeat in your career or relationships and how to break them.'
      },
      {
        title: 'Perfect Timing',
        desc: 'Know when to take major risks in business, invest, buy property, or switch career fields.'
      },
      {
        title: 'Remedial Shielding',
        desc: 'Apply traditional planetary remedies to neutralize negative transits and Saturn cycles.'
      }
    ],
    story: {
      client: 'Rohan Sharma',
      text: 'I was stuck in a stagnant job during my Sade Sati period. Astrologer Kundan calculated my transits and suggested simple daily mantras. Within 3 months, my career direction cleared and I got a major promotion.',
      timeline: 'Career aligned in 90 Days'
    }
  },
  'numerology': {
    title: 'Numerology Reading',
    subtitle: 'Aligning Your Personal Vibrations',
    image: numerologyImg,
    price: '$80 / ₹6,499',
    duration: '45 mins',
    desc: 'Numbers are the fundamental frequencies of the universe. Numerology decodes the vibration of your date of birth and name spelling. By aligning these numbers, you can open doors to wealth, improve relationships, and remove hidden blockages from your daily path.',
    process: [
      'Provide current full name, signature details, and birth date.',
      'Analysis of core numbers: Life Path, Destiny, Soul Urge, and Personality.',
      'Verification of name spelling frequencies against birth chart.',
      'Correction suggestion for name spellings or brand names.'
    ],
    benefits: [
      {
        title: 'Name Spelling Alignment',
        desc: 'Align name spellings with birth numbers to attract natural success and lock-spelling benefits.'
      },
      {
        title: 'Vibrational Sync',
        desc: 'Find lucky dates for signing business contracts, launching products, or buying a home.'
      },
      {
        title: 'Life Path Clarity',
        desc: 'Discover your hidden talents, core motivations, and relationship compatibility levels.'
      }
    ],
    story: {
      client: 'Vikram Aditya',
      text: 'After changing my brand name spelling slightly based on Kundan\'s numerology calculations, our website conversion rate jumped by 40% and our customer trust increased.',
      timeline: '40% Growth in 2 Months'
    }
  },
  'vastu': {
    title: 'Vastu Consultation',
    subtitle: 'Harmonizing Elements in Your Living Space',
    image: vastuConsultationImg,
    price: '$200 / ₹15,999',
    duration: 'Site Specific',
    desc: 'Vastu Shastra is the ancient Indian science of architecture and spatial harmony. Every building has energy fields. By aligning rooms, entrances, and colors with elemental forces (Water, Fire, Earth, Space, Air), Vastu attracts positive energy, prosperity, and mental peace.',
    process: [
      'Provide layout blueprint or digital floor plan of the residential/commercial property.',
      'Elemental mapping and direction verification via compass directions.',
      'Custom spatial adjustment report highlighting imbalances.',
      'Practical, non-demolition remedies like mirrors, colors, metals, and object shifts.'
    ],
    benefits: [
      {
        title: 'Wealth Flow Enhancement',
        desc: 'Open up energy pathways to attract financial stability, credit clearing, and sales growth.'
      },
      {
        title: 'Health & Peace',
        desc: 'Clear stagnant elements that cause chronic stress, family disputes, or sleeplessness.'
      },
      {
        title: 'Business Growth',
        desc: 'Align commercial entrance, staff seating, and cash counter to maximize transaction rates.'
      }
    ],
    story: {
      client: 'Priya Kapoor',
      text: 'We had constant disputes and lack of energy in our new home. Kundan identified elemental imbalances in our north-east kitchen and entrance. Applying simple color corrections worked like magic.',
      timeline: 'Harmony restored in 15 Days'
    }
  },
  'laal-kitaab': {
    title: 'Laal Kitaab Remedies',
    subtitle: 'Simple & Practical Karmic Antidotes',
    image: laalKitaabImg,
    price: '$90 / ₹7,499',
    duration: '45 mins',
    desc: 'Laal Kitaab is a unique branch of Vedic astrology famous for its simple, practical, and highly direct remedial measures. Instead of costly rituals or complex pujas, Laal Kitaab focuses on daily habit adjustments, food charity, and metal placements to ease planetary debts.',
    process: [
      'Chart analysis specifically focused on planetary debts (Rin).',
      'Identifying active house afflictions and adverse planetary aspects.',
      'Custom 43-day simple remedy sequence recommendation.',
      'Simple instructions (e.g., offering water, feeding birds, copper coin placements).'
    ],
    benefits: [
      {
        title: 'Direct Solutions',
        desc: 'Practical remedies that can be done easily at home or on-the-go.'
      },
      {
        title: 'Karmic Debt Relief',
        desc: 'Eases family debts, ancestral blockages, obstacles in marriage, and health issues.'
      },
      {
        title: 'Cost-Effective Measures',
        desc: 'No expensive rituals; uses basic natural elements and charity to restore peace.'
      }
    ],
    story: {
      client: 'Dr. Aarav Mehta',
      text: 'We had a long-standing property dispute. Kundan calculated my charts and suggested a simple 43-day copper coin remedy. The dispute settled amicably out of court.',
      timeline: 'Dispute Resolved in 43 Days'
    }
  },
  'prashna-kundali': {
    title: 'Prashna Kundali (Horary Astrology)',
    subtitle: 'Real-time Answers to Stagnant Questions',
    image: prashnaKundliImg,
    price: '$110 / ₹8,999',
    duration: '45 mins',
    desc: 'Horary astrology is used when exact birth details are unavailable, or when a quick answer is needed for a single, pressing question. The chart is cast for the exact second you ask the question, giving incredibly precise outcomes.',
    process: [
      'Formulate a single, sincere, and direct question in mind.',
      'Planetary map cast for the exact moment of inquiry and location.',
      'Immediate "Yes/No" analysis with timeline predictions.',
      'Advice on action steps based on planetary strength.'
    ],
    benefits: [
      {
        title: 'No Birth Details Needed',
        desc: 'Highly accurate even if you do not know your birth time or place.'
      },
      {
        title: 'Direct Answers',
        desc: 'Ideal for queries like \'Will I get this job?\', \'Should I travel?\', or \'Will my lost items return?\'.'
      },
      {
        title: 'Immediate Direction',
        desc: 'Get clear direction in times of confusion, deadlock, or rapid business decisions.'
      }
    ],
    story: {
      client: 'Amit Patel',
      text: 'I had to decide between two business partnerships immediately. Kundan used Prashna Kundali to tell me which partnership would be profitable. It saved me from a major financial trap.',
      timeline: 'Immediate decision clarity'
    }
  },
  'reiki-healing': {
    title: 'Reiki Healing & Alignment',
    subtitle: 'Restoring Vital Life Force Energy',
    image: reikiHealerImg,
    price: '$75 / ₹5,999',
    duration: '30 mins',
    desc: 'Reiki is a Japanese form of energy healing. By channeling universal life force energy, this session clears emotional blocks, relieves stress, aligns your chakras, and accelerates physical and spiritual healing.',
    process: [
      'Initial discussion to identify physical/emotional stress areas and blocks.',
      'Distant or personal energy transmission session.',
      'Chakra alignment assessment and balance check.',
      'Post-healing integration guidance and home tips.'
    ],
    benefits: [
      {
        title: 'Emotional Release',
        desc: 'Dissolve deep-rooted stress, anxiety, fear, and emotional blockages.'
      },
      {
        title: 'Chakra Alignment',
        desc: 'Rebalance the body\'s major energy centers for physical and mental wellness.'
      },
      {
        title: 'Spiritual Strength',
        desc: 'Connect with higher consciousness and feel deep inner peace and light.'
      }
    ],
    story: {
      client: 'Neha Gupta',
      text: 'I suffered from chronic fatigue and sleep issues for months. Just three remote Reiki sessions with Kundan brought back my sleep cycle and filled me with positive energy.',
      timeline: 'Fatigue cleared in 3 Sessions'
    }
  }
};

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [flippedCards, setFlippedCards] = useState({});
  const [activeAstrologyBenefit, setActiveAstrologyBenefit] = useState(0);
  const [activeLalKitaabTab, setActiveLalKitaabTab] = useState(0);

  const handleCardClick = (idx) => {
    setFlippedCards(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const details = serviceDetails[serviceId];

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [serviceId]);

  if (!details) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#FDFCF5] px-6 text-[#181122]">
        <h2 className="text-2xl font-serif font-bold mb-4">Service Not Found</h2>
        <Link to="/" className="bg-[#D3AF54] text-[#181122] font-semibold px-6 py-2.5 rounded-xl text-sm uppercase">
          Back to Services
        </Link>
      </div>
    );
  }

  if (serviceId === 'numerology') {
    return (
      <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center font-sans text-[#181122] pb-16 overflow-x-hidden">
        {/* Decorative pattern */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>

        {/* Banner / Header Image Container */}
        <div className="w-full h-[clamp(200px,35vh,400px)] relative overflow-hidden flex items-center justify-center">
          <img 
            src={numerologyImg} 
            alt="Vedic Numerology" 
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCF5] via-[#FDFCF5]/10 to-[#181122]/40" />
          
          {/* Back Link Overlay */}
          <button 
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 md:left-12 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181122] hover:bg-[#D3AF54] text-white hover:text-[#181122] transition-colors shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>
        </div>

        {/* Main Content Area */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] px-6 md:px-12 -mt-16 sm:-mt-24 relative z-10 space-y-10 text-left"
        >
          {/* Vedic Numerology Card */}
          <motion.div 
            variants={itemVariants} 
            className="bg-[#181122] border border-[#AB7A57]/20 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden text-white"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D3AF54]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1 text-left">
              <span className="text-sm sm:text-base tracking-[0.3em] font-bold text-[#D3AF54] uppercase font-sans block">
                ✦ VEDIC NUMEROLOGY ✦
              </span>
              <p className="text-xs sm:text-sm text-[#D8CFEB] leading-relaxed font-sans font-medium">
                Unlock the hidden meanings in numbers. Discover how the vibrations of numbers influence your personality, destiny, and life path.
              </p>
            </div>

            <div className="pt-1">
              <Link 
                to="/booking"
                className="inline-flex items-center gap-2 bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold px-6 py-2.5 rounded-xl shadow-md transition-all duration-300 text-xs uppercase tracking-wider"
              >
                <Calendar size={14} />
                <span>Book Appointment</span>
              </Link>
            </div>
          </motion.div>

          {/* The Power of Numbers Section */}
          <motion.div 
            variants={itemVariants} 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="bg-white border border-[#AB7A57]/15 rounded-3xl p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
          >
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#181122]">
                The Power of Numbers
              </h3>
              <p className="text-xs sm:text-sm text-[#181122]/90 leading-relaxed font-sans">
                Numerology is an ancient science that studies the mystical relationship between numbers and life events. Every number carries a specific vibration that influences various aspects of our existence.
              </p>
              <p className="text-xs sm:text-sm text-[#181122]/80 leading-relaxed font-sans">
                In Vedic numerology, numbers 1-9 are associated with the nine planets, each carrying unique energies and characteristics. Your birth date and name convert into numbers that reveal insights about your personality, strengths, challenges, and destiny.
              </p>
            </div>
            
            <div className="bg-[#FFFDEE] border-2 border-[#D3AF54]/30 rounded-2xl p-5 sm:p-6 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D3AF54]/5 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#AB7A57] uppercase block font-sans">
                ✦ EXPERT CONSULTATION ✦
              </span>
              <p className="text-xs sm:text-sm text-[#181122] font-sans leading-relaxed">
                <strong>Astrologer Kapil Tyagi</strong> provides comprehensive numerology consultations, including life path analysis, name corrections, and lucky number identification to help you align with positive vibrations.
              </p>
              <div className="flex items-center gap-1.5 text-[#D3AF54] pt-1">
                <Star size={12} className="fill-[#D3AF54]" />
                <Star size={12} className="fill-[#D3AF54]" />
                <Star size={12} className="fill-[#D3AF54]" />
                <Star size={12} className="fill-[#D3AF54]" />
                <Star size={12} className="fill-[#D3AF54]" />
                <span className="text-[10px] text-[#AB7A57] font-semibold font-sans ml-1">Trusted Expert</span>
              </div>
            </div>
          </motion.div>

          {/* Planetary Associations Strip */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-4"
          >
            <h3 className="text-center text-sm font-bold tracking-[0.25em] text-[#D3AF54] uppercase">
              ✦ Planetary Associations ✦
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
              {[
                { n: '1', p: 'Sun' },
                { n: '2', p: 'Moon' },
                { n: '3', p: 'Jupiter' },
                { n: '4', p: 'Rahu' },
                { n: '5', p: 'Mercury' },
                { n: '6', p: 'Venus' },
                { n: '7', p: 'Ketu' },
                { n: '8', p: 'Saturn' },
                { n: '9', p: 'Mars' }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#181122] text-white border border-[#D3AF54]/25 rounded-2xl p-3 flex flex-col items-center justify-center shadow-md hover:border-[#D3AF54] transition-all duration-300">
                  <span className="text-xl sm:text-2xl font-bold font-serif text-[#D3AF54]">{item.n}</span>
                  <span className="text-[10px] font-sans font-semibold tracking-wide text-white/80 mt-0.5">{item.p}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Understanding Each Number (1-9 Grid Cards) */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-6"
          >
            <div className="text-center md:text-left space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#181122]">
                Understanding Each Number
              </h3>
              <p className="text-sm sm:text-base text-[#181122] font-semibold font-sans">
                Each number from 1 to 9 carries unique vibrations and meanings (Tap cards on mobile or hover on desktop to flip)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  num: '1',
                  name: 'Number 1',
                  planet: 'Sun',
                  icon: sunIcon,
                  desc: 'Natural leaders with strong willpower and determination. Creative and innovative.',
                  tags: 'Leadership, independence, ambition'
                },
                {
                  num: '2',
                  name: 'Number 2',
                  planet: 'Moon',
                  icon: moonIcon,
                  desc: 'Peacemakers who value harmony and partnerships. Intuitive and empathetic.',
                  tags: 'Cooperation, sensitivity, diplomacy'
                },
                {
                  num: '3',
                  name: 'Number 3',
                  planet: 'Jupiter',
                  icon: jupiterIcon,
                  desc: 'Creative communicators with charm and enthusiasm. Artistic and social.',
                  tags: 'Creativity, expression, optimism'
                },
                {
                  num: '4',
                  name: 'Number 4',
                  planet: 'Rahu',
                  icon: rahuIcon,
                  desc: 'Builders and organizers who value structure. Reliable and disciplined.',
                  tags: 'Stability, hard work, practicality'
                },
                {
                  num: '5',
                  name: 'Number 5',
                  planet: 'Mercury',
                  icon: mercuryIcon,
                  desc: 'Dynamic individuals who love change and variety. Curious and adaptable.',
                  tags: 'Freedom, versatility, adventure'
                },
                {
                  num: '6',
                  name: 'Number 6',
                  planet: 'Venus',
                  icon: venusIcon,
                  desc: 'Nurturing souls focused on family and beauty. Caring and artistic.',
                  tags: 'Love, harmony, responsibility'
                },
                {
                  num: '7',
                  name: 'Number 7',
                  planet: 'Ketu',
                  icon: ketuIcon,
                  desc: 'Deep thinkers and seekers of truth. Analytical and mysterious.',
                  tags: 'Spirituality, wisdom, introspection'
                },
                {
                  num: '8',
                  name: 'Number 8',
                  planet: 'Saturn',
                  icon: saturnIcon,
                  desc: 'Business-minded individuals with strong ambition. Karmic lessons in focus.',
                  tags: 'Power, success, material wealth'
                },
                {
                  num: '9',
                  name: 'Number 9',
                  planet: 'Mars',
                  icon: marsIcon,
                  desc: 'Old souls with universal love. Selfless and spiritually advanced.',
                  tags: 'Compassion, completion, humanitarianism'
                }
              ].map((item, idx) => {
                const isFlipped = !!flippedCards[idx];
                return (
                  <div 
                    key={idx} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(idx);
                    }}
                    className="group relative w-full h-48 [perspective:1000px] cursor-pointer"
                  >
                    <div 
                      className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
                        isFlipped ? '[transform:rotateY(180deg)]' : ''
                      } lg:group-hover:[transform:rotateY(180deg)]`}
                    >
                      {/* FRONT SIDE: Elegant Small Number Title & Large Realistic 3D Planet Image */}
                      <div className="absolute inset-0 w-full h-full rounded-3xl bg-[#181122] border border-[#D3AF54]/30 flex flex-col items-center justify-between p-3.5 [backface-visibility:hidden] text-white overflow-hidden shadow-lg">
                        {/* Top Row */}
                        <div className="w-full flex justify-between items-center text-white/40 text-[9px] font-sans font-bold uppercase tracking-wider">
                          <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#D3AF54]/60">Vedic Planet</span>
                          <div className="text-[10px] font-serif font-bold text-[#D3AF54] border border-[#D3AF54]/25 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            No. {item.num}
                          </div>
                        </div>
                        
                        {/* Center Section: Big realistic planet image */}
                        <div className="flex flex-col items-center justify-center -translate-y-1">
                          <img 
                            src={item.icon} 
                            alt={item.planet} 
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full shadow-md transition-transform duration-500 group-hover:scale-110" 
                          />
                        </div>

                        {/* Bottom Section */}
                        <div className="w-full text-center flex flex-col items-center gap-0.5">
                          <span className="font-serif text-xs sm:text-sm font-bold text-white tracking-wide">{item.planet}</span>
                          <span className="text-[8px] font-semibold text-[#D3AF54]/85 uppercase tracking-widest animate-pulse lg:hidden">Tap to Reveal</span>
                        </div>
                      </div>

                      {/* BACK SIDE: Descriptive Details (Revealed on flip) */}
                      <div className="absolute inset-0 w-full h-full rounded-3xl bg-[#FFFDEE] border-2 border-[#D3AF54]/40 flex flex-col justify-between p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] text-[#181122] shadow-lg">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center border-b border-[#AB7A57]/20 pb-1">
                            <span className="font-serif font-bold text-xs sm:text-sm text-[#181122]">{item.name}</span>
                            <div className="flex items-center gap-1.5 bg-[#181122] text-[#D3AF54] border border-[#D3AF54]/25 px-2 py-0.5 rounded-full">
                              <img src={item.icon} alt={item.planet} className="w-3 h-3 object-cover rounded-full" />
                              <span className="text-[8px] font-bold uppercase tracking-wider">{item.planet}</span>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-xs text-[#181122]/95 leading-relaxed font-sans font-semibold">
                            {item.desc}
                          </p>
                        </div>

                        <div className="border-t border-[#AB7A57]/15 pt-1.5">
                          <span className="text-[10px] sm:text-xs font-sans font-bold text-[#AB7A57] uppercase tracking-wide block">
                            ✦ {item.tags}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Numerology Services Section */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-6"
          >
            <div className="text-center md:text-left space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#181122]">
                Numerology Services
              </h3>
              <p className="text-xs sm:text-sm text-[#181122]/70 font-sans">
                Align your celestial numbers to maximize success, growth, and destiny
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Life Path Number',
                  desc: 'Derived from your birth date, reveals your life purpose and the path you\'re meant to walk.'
                },
                {
                  title: 'Destiny Number',
                  desc: 'Calculated from your full name, shows your life\'s goals and what you\'re destined to achieve.'
                },
                {
                  title: 'Name Numerology',
                  desc: 'Analysis and correction of names to align with favorable vibrations for success.'
                },
                {
                  title: 'Business Name Analysis',
                  desc: 'Select or modify business names for better luck, growth, and prosperity.'
                },
                {
                  title: 'Mobile Number Selection',
                  desc: 'Choose lucky mobile numbers that resonate with your personal vibrations.'
                },
                {
                  title: 'Lucky Numbers',
                  desc: 'Identify your lucky numbers for important dates, decisions, and opportunities.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#FFF9E6] border border-[#D3AF54]/40 shadow-xs hover:scale-[1.01] hover:border-[#D3AF54] transition-all duration-300 flex flex-col gap-2">
                  <h4 className="font-serif font-bold text-[#181122] text-sm sm:text-base flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D3AF54]" />
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[#181122]/90 leading-relaxed font-sans font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Book Appointment CTA Button strip */}
          <motion.div variants={itemVariants} className="flex justify-center pt-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:text-[#D3AF54] text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft size={12} />
              <span>Back to Home</span>
            </Link>
          </motion.div>

        </motion.div>
      </div>
    );
  }

  if (serviceId === 'vedic-astrology') {
    return (
      <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center font-sans text-[#181122] pb-16 overflow-x-hidden">
        {/* Decorative patterns */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
        
        {/* Banner / Header Image Container (Reduced Height) */}
        <div className="w-full h-[clamp(120px,20vh,250px)] relative overflow-hidden flex items-center justify-center">
          <img 
            src={details.image} 
            alt={details.title} 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCF5] via-[#FDFCF5]/10 to-[#181122]/40" />
          
          {/* Back Link Overlay */}
          <button 
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 md:left-12 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181122] hover:bg-[#D3AF54] text-white hover:text-[#181122] transition-colors shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>
        </div>

        {/* Main Content Area */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] px-6 md:px-12 -mt-10 sm:-mt-16 relative z-10 space-y-10 text-left"
        >
          {/* Intro Card - Light Theme for Perfect Readability */}
          <motion.div 
            variants={itemVariants} 
            className="bg-[#FFFDEE] border border-[#AB7A57]/20 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 relative overflow-hidden text-[#181122]"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D3AF54]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1.5 text-left">
              <span className="text-xs sm:text-sm tracking-[0.25em] font-bold text-[#AB7A57] uppercase font-sans block">
                ✦ CELESTIAL ALIGNMENT ✦
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#181122] tracking-wide">
                Vedic Astrology (Janam Kundli)
              </h1>
            </div>

            <div className="pt-1">
              <Link 
                to="/booking"
                className="inline-flex items-center gap-2 bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold px-6 py-2.5 rounded-xl shadow-md transition-all duration-300 text-xs uppercase tracking-wider"
              >
                <Calendar size={14} />
                <span>Book Appointment</span>
              </Link>
            </div>
          </motion.div>

          {/* What is Janam Kundli & Benefits Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* What is Janam Kundli? (Slightly Lighter Gold bg-[#ECCF86]) */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="lg:col-span-4 bg-[#ECCF86] border border-[#AB7A57]/20 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3 text-left">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#181122]">
                  What is Janam Kundli?
                </h3>
                <p className="text-xs sm:text-sm text-[#181122] leading-relaxed font-sans font-semibold">
                  A Janam Kundli (Birth Chart) is an astronomical snapshot of the cosmos at the exact second you took your first breath. It maps the celestial positions of the Sun, Moon, and planets relative to your birth location.
                </p>
                <p className="text-xs sm:text-sm text-[#181122]/90 leading-relaxed font-sans font-medium">
                  Through classical Vedic formulas, this chart acts as a cosmic blueprint of your life—revealing your innate patterns, planetary blockages, and the structural paths of your destiny.
                </p>
              </div>

              <div className="pt-4 mt-auto text-left">
                <Link 
                  to="/booking"
                  className="inline-flex items-center gap-2 bg-[#181122] hover:bg-[#181122]/90 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 text-xs uppercase tracking-wider"
                >
                  <Calendar size={13} style={{ color: '#ECCF86' }} />
                  <span>Book Appointment</span>
                </Link>
              </div>
            </motion.div>

            {/* Why Get a Vedic Reading? (Interactive Selector - Light Gold bg-[#ECCF86]) */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="lg:col-span-8 bg-[#ECCF86] border border-[#AB7A57]/20 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 text-[#181122] flex flex-col justify-between"
            >
              <div className="space-y-1.5 text-left">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#181122]">
                  Why Get a Vedic Reading?
                </h3>
                <p className="text-xs sm:text-sm text-[#181122]/90 font-sans font-medium">
                  Select a category to explore how cosmic alignment directly shifts your pathways:
                </p>
              </div>

              {/* Interactive Selector Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-grow">
                {/* Left Side: Buttons */}
                <div className="md:col-span-5 flex flex-col gap-2">
                  {[
                    { label: 'Natural Talents & Strengths', sub: 'Discover hidden gifts' },
                    { label: 'Karmic Roadblocks & Obstacles', sub: 'Map your Saturn tests' },
                    { label: 'Career Alignment', sub: 'Maximize business growth' },
                    { label: 'Timeline & Dasha Cycles', sub: 'Decide optimal timings' },
                    { label: 'Relationship Compatibility', sub: 'Build marital harmony' },
                    { label: 'Remedial Shielding', sub: 'Neutralize heavy transits' }
                  ].map((benefit, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveAstrologyBenefit(idx)}
                      className={`p-2.5 px-3.5 rounded-xl text-left border transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                        activeAstrologyBenefit === idx
                          ? 'bg-[#181122] text-white border-transparent shadow-md translate-x-1.5'
                          : 'bg-white/80 hover:bg-white text-[#181122] border-[#AB7A57]/20'
                      }`}
                    >
                      <div className="space-y-0.5 text-left flex-grow">
                        <p className={`text-xs sm:text-sm font-bold font-sans ${activeAstrologyBenefit === idx ? 'text-[#D3AF54]' : 'text-[#181122]'}`}>
                          {benefit.label}
                        </p>
                        <p className={`text-[11px] ${activeAstrologyBenefit === idx ? 'text-[#D8CFEB]' : 'text-[#181122]/60'}`}>
                          {benefit.sub}
                        </p>
                      </div>
                      <ArrowRight size={14} className={`shrink-0 transition-transform ${
                        activeAstrologyBenefit === idx ? 'text-[#D3AF54] translate-x-0.5' : 'text-[#AB7A57] opacity-60'
                      }`} />
                    </button>
                  ))}
                </div>

                {/* Right Side: Detailed Highlight Box */}
                <div className="md:col-span-7 bg-[#181122] text-white rounded-2xl p-5 sm:p-6 flex flex-col justify-start border border-[#AB7A57]/20 relative overflow-hidden shadow-inner min-h-[235px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D3AF54]/5 rounded-full blur-3xl pointer-events-none" />
                  
                  {[
                    {
                      title: 'Natural Talents & Strengths',
                      text: 'Reveal your baseline personality, temperament, and soul orientation. By analyzing the positions of Jupiter and Mercury in your chart, we decode your intellectual capacity, creative streaks, and inner callings.',
                      action: '✦ Helps align studies, hobbies, and core life choices.'
                    },
                    {
                      title: 'Karmic Roadblocks & Obstacles',
                      text: 'Locate heavy planetary blockages, Sade Sati triggers, and Rahu/Ketu configurations. Understanding these karmic blocks helps you handle challenges with calm patience rather than confusion.',
                      action: '✦ Identifies when to pause, pivot, or seek energetic protection.'
                    },
                    {
                      title: 'Career Alignment',
                      text: 'Decodes your tenth house (Karma Bhava) and D10 Dashamsha chart. We outline which industries suit you best, whether to choose employment or business, and who your ideal partners are.',
                      action: '✦ Avoid stagnation by choosing cosmically supported roles.'
                    },
                    {
                      title: 'Timeline & Dasha Cycles',
                      text: 'Vimshottari Dasha acts as your personal life timeline. Map the planetary lords running your current years so you know when to expand, when to invest, and when to lie low.',
                      action: '✦ Accurate timing is the secret to successful ventures.'
                    },
                    {
                      title: 'Relationship Compatibility',
                      text: 'Detailed Gun Milan compatibility verification. We analyze Seventh House elements, Venus alignments, and Mars (Mangal) configurations to evaluate longevity, support, and peace in your union.',
                      action: '✦ Resolve relationship blocks before they manifest as disputes.'
                    },
                    {
                      title: 'Remedial Shielding',
                      text: 'Receive simple, practical, and highly direct Vedic remedies. These include wearing compatible gemstones, specific fasting programs, daily mantra chanting, and charity targets to absorb heavy transits.',
                      action: '✦ Shield your energy fields against malefic aspects.'
                    }
                  ].map((detail, idx) => (
                    activeAstrologyBenefit === idx && (
                      <div key={idx} className="flex flex-col h-full text-left">
                        <div className="space-y-1.5 text-left mb-3">
                          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider" style={{ color: '#ECCF86' }}>
                            <Sparkles size={14} />
                            <span>Insight Module</span>
                          </div>
                          <h4 className="text-lg sm:text-xl font-serif font-bold leading-tight" style={{ color: '#ECCF86' }}>
                            {detail.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-[#D8CFEB] leading-relaxed font-sans font-medium">
                            {detail.text}
                          </p>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl mt-auto text-left">
                          <p className="text-xs font-serif font-bold leading-relaxed" style={{ color: '#ECCF86' }}>
                            {detail.action}
                          </p>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Key Areas of Chart Analysis (Wrapper Panel with Gold Tint bg-[#ECCF86]/20) */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="p-6 sm:p-8 rounded-3xl bg-[#ECCF86]/20 border border-[#ECCF86]/45 space-y-6"
          >
            <div className="text-center md:text-left space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-gold-aura">
                Key Areas of Chart Analysis
              </h3>
              <p className="text-xs sm:text-sm text-[#181122]/70 font-sans font-medium">
                We perform an exhaustive analysis of your astrological configurations:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {[
                { title: 'Lagna & Rashi', desc: 'Ascendant and Moon sign analysis to decode your core physical attributes, temperament, and emotional mind.' },
                { title: 'Kendra Houses', desc: 'Detailed look at the pillars of your life: 1st (self), 4th (home), 7th (spouse), and 10th (career).' },
                { title: 'Vimshottari Dasha', desc: 'Timeline mapping of your planetary cycles to identify major shifts, opportunities, and karmic checkpoints.' },
                { title: 'Divisional Charts', desc: 'Analysis of fine divisional charts (Vargas) like D9 Navamsha for marriage and D10 Dashamsha for career.' }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white border border-[#AB7A57]/15 hover:border-gold-aura rounded-2xl p-6 flex flex-col items-start text-left gap-4 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer text-[#181122]"
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Gold Circular Outlined Container */}
                    <div className="w-10 h-10 rounded-full border border-[#BDBDBD] group-hover:border-gold-aura flex items-center justify-center text-gold-aura bg-[#FFFDEE] shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,175,84,0.3)] transition-all duration-300 font-serif font-bold text-xs sm:text-sm font-sans">
                      {idx + 1}
                    </div>
                    {/* Title */}
                    <span className="font-serif text-gold-aura group-hover:text-[#181122] font-bold text-xs md:text-sm uppercase tracking-wider transition-colors duration-300">
                      {item.title}
                    </span>
                  </div>
                  {/* Subtext */}
                  <p className="text-[13px] md:text-sm text-[#181122]/80 leading-relaxed font-sans w-full">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Core Life Pathways Explored (Dark Gold bg-[#B8963C]) */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-6"
          >
            <div className="text-center md:text-left space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-gold-aura">
                Core Life Pathways Explored
              </h3>
              <p className="text-xs sm:text-sm text-[#181122]/70 font-sans font-medium">
                Guidance for navigating key decisions and milestones
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Career & Financial Growth',
                  tip: 'Discover the most suitable industries, wealth generation windows, business partnerships, and timing for career shifts.',
                  icon: Briefcase,
                  direction: 'Karma'
                },
                {
                  title: 'Marriage & Relationship',
                  tip: 'Understand compatibility profiles, marital timelines, partnership dynamics, and energetic matches for relationship harmony.',
                  icon: Home,
                  direction: 'Vivaha'
                },
                {
                  title: 'Remedial Shielding',
                  tip: 'Identify planetary blocks in your chart and apply structured, traditional remedies like gemstone, mantra, or fasting suggestions.',
                  icon: Shield,
                  direction: 'Upaya'
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-[#ECCF86] border border-[#AB7A57]/55 hover:border-gold-aura hover:bg-[#ECCF86]/95 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex items-start gap-4 cursor-pointer group text-left text-[#181122] shadow-md"
                >
                  {/* Badge */}
                  <div className="w-12 h-12 rounded-xl border border-gold-aura/40 bg-[#FFFDEE] flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all duration-300 text-center">
                    <span className="text-[8px] uppercase tracking-wider text-[#AB7A57] font-bold leading-none">Focus</span>
                    <span className="text-[11px] font-serif font-black text-gold-aura leading-none mt-0.5">{item.direction}</span>
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1.5 text-left flex-grow">
                    <div className="flex items-center gap-2">
                      <item.icon size={15} className="text-[#181122] shrink-0" />
                      <h4 className="font-serif font-bold text-[#181122] text-sm sm:text-base leading-tight">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-[#181122]/90 leading-relaxed font-sans font-medium">
                      {item.tip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Back Link bottom */}
          <motion.div variants={itemVariants} className="flex justify-center pt-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:text-[#D3AF54] text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft size={12} />
              <span>Back to Home</span>
            </Link>
          </motion.div>

        </motion.div>
      </div>
    );
  }
  if (serviceId === 'laal-kitaab') {
    return (
      <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center font-sans text-[#181122] pb-20 overflow-x-hidden">
        {/* Elegant Gold & Indigo background aura */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(211,175,84,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(24,17,34,0.04),transparent_70%)] rounded-full -z-10 pointer-events-none" />
        
        {/* Banner / Header Image Container (Reduced Height with Centered Heading) */}
        <div className="w-full h-[clamp(110px,18vh,200px)] relative overflow-hidden flex items-center justify-center border-b border-[#AB7A57]/20 shadow-xs">
          <img 
            src={details.image} 
            alt={details.title} 
            className="w-full h-full object-cover opacity-40"
          />
          {/* Dark gradient backdrop to make the title pop */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#181122]/75 via-[#181122]/45 to-[#FDFCF5]" />
          
          {/* Centered Heading inside Hero Image */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-wide text-center drop-shadow-md" style={{ color: '#D3AF54' }}>
              Lal Kitaab Remedies
            </h1>
            <div className="w-16 h-0.5 mt-2 bg-[#D3AF54] rounded-full" />
          </div>

          {/* Back Link Overlay */}
          <button 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 md:left-12 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#181122] hover:bg-[#D3AF54] text-white hover:text-[#181122] transition-all duration-300 shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer border border-[#D3AF54]/20 z-20"
          >
            <ArrowLeft size={13} />
            <span>Home</span>
          </button>
        </div>

        {/* Main Content Area */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] px-6 md:px-12 -mt-6 sm:-mt-10 relative z-10 space-y-6 text-left"
        >
          {/* Interactive Navigation Tab Bar */}
          <motion.div variants={itemVariants} className="flex justify-center border-b border-[#AB7A57]/20 pb-1 overflow-x-auto w-full scrollbar-none">
            <div className="flex gap-2 sm:gap-6 min-w-max px-4">
              {[
                { title: 'Overview & Philosophy', icon: Sparkles },
                { title: 'Diagnostic Areas (Rinas)', icon: Star },
                { title: 'Practical Remedies (Upayas)', icon: Shield }
              ].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveLalKitaabTab(idx)}
                  className={`flex items-center gap-2 pb-2 px-3 text-xs sm:text-sm font-serif font-bold uppercase tracking-wider relative transition-colors duration-300 cursor-pointer ${
                    activeLalKitaabTab === idx ? 'text-[#181122]' : 'text-[#181122]/70 hover:text-[#181122]'
                  }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.title}</span>
                  {activeLalKitaabTab === idx && (
                    <motion.div 
                      layoutId="lalKitaabTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#D3AF54]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Dynamic Swapped Content Area with slide-and-fade Framer Motion transitions */}
          <motion.div
            key={activeLalKitaabTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
          >
            {activeLalKitaabTab === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* What is Lal Kitaab? (Left Page) */}
                <div className="bg-[#ECCF86] border border-[#AB7A57]/20 rounded-3xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 relative flex flex-col justify-between border-l-8 border-l-[#181122]">
                  <div className="space-y-3">
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#181122] flex items-center gap-2">
                      <span>What is Lal Kitaab?</span>
                      <span className="text-[#D3AF54] text-xs">✦</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#181122] leading-relaxed font-sans font-semibold">
                      Lal Kitaab (literally "Red Book") is a highly revered, legendary branch of Vedic astrology. It is globally famous for its incredibly simple, practical, and highly direct remedial measures (Upayas) that require no expensive sacrifices, pujas, or gemstone investments.
                    </p>
                    <p className="text-xs sm:text-sm text-[#181122]/95 leading-relaxed font-sans font-medium">
                      It operates on a symptom-based diagnostic method, converting complex cosmic calculations into intuitive daily exercises—such as offering grains to birds, feeding cows, or keeping specific natural metals inside your home.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#AB7A57]/20 mt-3 flex items-center gap-2 text-xs font-serif font-bold text-[#181122]/90 italic">
                    <span>✦ Directly balances ancestral planetary debts (Rinas)</span>
                  </div>
                </div>

                {/* Why Choose Lal Kitaab Remedies? (Right Page) */}
                <div className="bg-[#ECCF86] border border-[#AB7A57]/20 rounded-3xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 relative flex flex-col justify-between border-l-8 border-l-[#181122]">
                  <div className="space-y-3">
                    <div className="space-y-1 text-left">
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-[#181122] flex items-center gap-2">
                        <span>Why Choose Lal Kitaab?</span>
                        <span className="text-[#D3AF54] text-xs">✦</span>
                      </h3>
                      <p className="text-xs text-[#181122]/85 font-sans font-semibold">
                        Neutralize negative transits and ease karmic weights with ease:
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      {[
                        'Household task-based actions',
                        'Remedies ancestral debts',
                        'Symptom-based diagnostic method',
                        'No complex charts calculations',
                        'Extremely direct & immediate results',
                        'Balances home energetic flow'
                      ].map((benefit, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-white border border-[#AB7A57]/15 flex items-start gap-2 shadow-2xs hover:scale-[1.01] transition-transform duration-300">
                          {/* Custom Gold Seal Dot */}
                          <div className="w-4 h-4 rounded-full bg-[#FFFDEE] border border-[#D3AF54]/50 flex items-center justify-center shrink-0 mt-0.5 text-gold-aura font-bold text-[9px]">
                            ✓
                          </div>
                          <span className="text-[11px] sm:text-xs text-[#181122] font-semibold font-sans leading-tight text-left">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Embedded Action Button to balance with Left Page footer */}
                  <div className="pt-3 border-t border-[#AB7A57]/20 mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-sans font-bold text-[#181122]/70 uppercase tracking-wider">Ready for a reading?</span>
                    <Link 
                      to="/booking"
                      className="inline-flex items-center gap-1.5 bg-[#181122] hover:bg-[#181122]/90 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-md transition-all duration-300 text-[9px] uppercase tracking-wider cursor-pointer"
                    >
                      <Calendar size={10} style={{ color: '#ECCF86' }} />
                      <span>Book Appointment</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeLalKitaabTab === 1 && (
              <div className="space-y-6">
                <div className="text-center md:text-left space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#181122]">
                    Key Diagnostic Areas
                  </h3>
                  <p className="text-xs sm:text-sm text-[#181122]/70 font-sans font-medium">
                    Lal Kitaab isolates and addresses specific planetary blockages (Rinas):
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                  {[
                    { title: 'Pitru Rina', desc: 'Ancestral debt indicators that manifest as sudden obstacles in career growth, progeny issues, or mental restlessness.' },
                    { title: 'Dharma Rina', desc: 'Religious debts resulting from breaking spiritual commitments, resolved through temples and public charity.' },
                    { title: 'Deva Rina', desc: 'Planetary debts causing sudden health troubles or structural blockages in properties and houses.' },
                    { title: 'Matru Rina', desc: 'Maternal debt indicating emotional instability, obstacles in savings, and domestic disputes.' }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 25 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      whileHover={{ scale: 1.03, y: -6 }}
                      className="bg-[#ECCF86] border-t-4 border-t-[#D3AF54] border-x border-b border-[#AB7A57]/20 rounded-2xl p-6 flex flex-col items-start text-left gap-4 transition-all duration-300 shadow-md hover:shadow-xl group cursor-pointer text-[#181122]"
                    >
                      <div className="flex items-center gap-3 w-full">
                        {/* Indigo/Gold Circular Container */}
                        <div className="w-10 h-10 rounded-full border border-[#D3AF54]/40 bg-[#181122] text-[#ECCF86] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(24,17,34,0.3)] transition-all duration-300 font-serif font-bold text-xs sm:text-sm">
                          {idx + 1}
                        </div>
                        {/* Title */}
                        <span className="font-serif text-[#181122] group-hover:text-gold-aura font-bold text-xs md:text-sm uppercase tracking-wider transition-colors duration-300">
                          {item.title}
                        </span>
                      </div>
                      {/* Subtext */}
                      <p className="text-[13px] md:text-sm text-[#181122]/90 leading-relaxed font-sans w-full font-semibold">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeLalKitaabTab === 2 && (
              <div className="space-y-6">
                <div className="text-center md:text-left space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#181122]">
                    Core Remedy Areas Explored
                  </h3>
                  <p className="text-xs sm:text-sm text-[#181122]/70 font-sans font-medium">
                    Standard, practical remedies suggested in consultations
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'Animal & Bird Service',
                      tip: 'Feeding black dogs for Rahu/Ketu balance, green fodder to cows for Venus, or bird grains for Mercury to open financial gates.',
                      icon: Heart,
                      direction: 'Seva'
                    },
                    {
                      title: 'Water Flowing Upaya',
                      tip: 'Floating organic materials, coconut, or copper coins in active running streams to neutralize severe transit blockages.',
                      icon: RefreshCw,
                      direction: 'Flow'
                    },
                    {
                      title: 'Metal & Sand Placements',
                      tip: 'Placing square copper pieces, solid silver balls, or river sand in specific cupboards to clear negative energies.',
                      icon: Shield,
                      direction: 'Placement'
                    }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 25 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="p-5 rounded-2xl bg-[#ECCF86] border border-[#AB7A57]/20 border-l-8 border-l-[#D3AF54] hover:border-l-[#181122] hover:shadow-xl transition-all duration-300 flex items-start gap-4 cursor-pointer group text-left shadow-md"
                    >
                      {/* Badge */}
                      <div className="w-12 h-12 rounded-xl border border-[#D3AF54]/40 bg-[#181122] flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all duration-300 text-center">
                        <span className="text-[8px] uppercase tracking-wider text-[#ECCF86] font-bold leading-none">Focus</span>
                        <span className="text-[10px] font-serif font-black text-white leading-none mt-0.5">{item.direction}</span>
                      </div>

                      {/* Text Details */}
                      <div className="space-y-1.5 text-left flex-grow">
                        <div className="flex items-center gap-2">
                          <item.icon size={15} className="text-[#181122] shrink-0" />
                          <h4 className="font-serif font-bold text-[#181122] text-sm sm:text-base leading-tight">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-[#181122]/95 leading-relaxed font-sans font-medium">
                          {item.tip}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Back Link bottom */}
          <motion.div variants={itemVariants} className="flex justify-center pt-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:text-[#D3AF54] text-xs font-semibold uppercase tracking-wider transition-colors text-[#181122]"
            >
              <ArrowLeft size={12} />
              <span>Back to Home</span>
            </Link>
          </motion.div>

        </motion.div>
      </div>
    );
  }

  if (serviceId === 'vastu') {
    return (
      <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center font-sans text-[#181122] pb-16 overflow-x-hidden">
        {/* Decorative patterns */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
        
        {/* Banner / Header Image Container */}
        <div className="w-full h-[clamp(200px,35vh,400px)] relative overflow-hidden flex items-center justify-center">
          <img 
            src={details.image} 
            alt={details.title} 
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCF5] via-[#FDFCF5]/10 to-[#181122]/40" />
          
          {/* Back Link Overlay */}
          <button 
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 md:left-12 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181122] hover:bg-[#D3AF54] text-white hover:text-[#181122] transition-colors shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>
        </div>

        {/* Main Content Area */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] px-6 md:px-12 -mt-16 sm:-mt-24 relative z-10 space-y-10 text-left"
        >
          {/* Intro Service Card (Significantly Shrunk height & content removed) */}
          <motion.div 
            variants={itemVariants} 
            className="bg-[#181122] border border-[#AB7A57]/20 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden text-white"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D3AF54]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1 text-left">
              <span className="text-sm sm:text-base tracking-[0.3em] font-bold text-[#D3AF54] uppercase font-sans block">
                ✦ VASTU CONSULTATION ✦
              </span>
            </div>

            <div className="pt-1">
              <Link 
                to="/booking"
                className="inline-flex items-center gap-2 bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold px-6 py-2.5 rounded-xl shadow-md transition-all duration-300 text-xs uppercase tracking-wider"
              >
                <Calendar size={14} />
                <span>Book Appointment</span>
              </Link>
            </div>
          </motion.div>

          {/* What is Vastu & Benefits Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* What is Vastu Shastra? */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="bg-white border border-[#AB7A57]/15 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4"
            >
              <h3 className="text-xl sm:text-2xl font-serif font-bold" style={{ color: '#D3AF54' }}>
                What is Vastu Shastra?
              </h3>
              <p className="text-xs sm:text-sm text-[#181122]/90 leading-relaxed font-sans font-medium">
                Vastu Shastra is an ancient Indian science that harmonizes architecture with nature's five elements—Earth, Water, Fire, Air, and Space. As the best Vastu consultant in Delhi, we provide guidelines for designing spaces that promote positive energy flow.
              </p>
              <p className="text-xs sm:text-sm text-[#181122]/80 leading-relaxed font-sans font-medium">
                The fundamental principle of Vastu is that the directions and placement of rooms, furniture, and objects affect the energy of a space, which in turn influences the health, prosperity, and happiness of its occupants.
              </p>
            </motion.div>

            {/* Benefits of Vastu */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="bg-[#FFFDEE] border border-gold-aura/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-1.5 text-left">
                <h3 className="text-xl sm:text-2xl font-serif font-bold" style={{ color: '#D3AF54' }}>
                  Benefits of Vastu
                </h3>
                <p className="text-xs sm:text-sm text-[#181122]/70 font-sans font-medium">
                  Harmonizing structural energy yields multiple benefits for daily life.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {[
                  'Improved health and well-being',
                  'Enhanced prosperity and wealth',
                  'Better relationships and harmony',
                  'Career growth and success',
                  'Mental peace and positivity',
                  'Protection from negative energies'
                ].map((benefit, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-gold-aura/20 flex items-start gap-2.5 shadow-2xs hover:scale-[1.02] transition-transform duration-300">
                    <CheckCircle size={16} className="text-gold-aura shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-[#181122] font-semibold font-sans leading-tight">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* The Five Elements Section */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-6"
          >
            <div className="text-center md:text-left space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-serif font-bold" style={{ color: '#D3AF54' }}>
                The Five Elements
              </h3>
              <p className="text-xs sm:text-sm text-[#181122]/70 font-sans font-medium">
                Vastu is based on the balance of Pancha Mahabhuta (Five Great Elements)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { name: 'Earth', sanskrit: 'Prithvi', dir: 'SW', icon: earthImg },
                { name: 'Water', sanskrit: 'Jal', dir: 'NE', icon: waterImg },
                { name: 'Fire', sanskrit: 'Agni', dir: 'SE', icon: fireImg },
                { name: 'Air', sanskrit: 'Vayu', dir: 'NW', icon: airImg },
                { name: 'Space', sanskrit: 'Akash', dir: 'Center', icon: spaceImg }
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-[#AB7A57]/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs hover:scale-[1.02] hover:border-gold-aura transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-[#FFF9E6] border border-gold-aura/30 flex items-center justify-center mb-2 overflow-hidden p-1.5 shadow-xs">
                    <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-serif font-bold text-[#181122] text-sm sm:text-base">{item.name}</span>
                  <span className="text-[10px] font-sans font-bold text-[#AB7A57] uppercase tracking-wide mt-0.5">{item.sanskrit}</span>
                  <div className="mt-3 px-3 py-0.5 bg-[#181122] text-gold-aura rounded-full border border-gold-aura/25 text-[10px] font-bold uppercase tracking-wider">
                    Direction: {item.dir}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Essential Vastu Tips Section */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-6"
          >
            <div className="text-center md:text-left space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-serif font-bold" style={{ color: '#D3AF54' }}>
                Essential Vastu Tips
              </h3>
              <p className="text-xs sm:text-sm text-[#181122]/70 font-sans font-medium">
                Simple guidelines to bring positive energy into your home
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Main Entrance',
                  tip: 'The main entrance should ideally face North, East, or Northeast for maximum positive energy flow. Avoid South-West entrances.',
                  icon: Home,
                  direction: 'N/NE'
                },
                {
                  title: 'Living Room',
                  tip: 'Place the living room in the North or East direction. Ensure good natural light and ventilation for positive vibrations.',
                  icon: Sofa,
                  direction: 'N/E'
                },
                {
                  title: 'Master Bedroom',
                  tip: 'The master bedroom should be in the South-West corner. Place the bed so you sleep with your head towards South.',
                  icon: Bed,
                  direction: 'SW'
                },
                {
                  title: 'Kitchen',
                  tip: 'The kitchen should be in the South-East corner (Agni corner). The cook should face East while cooking.',
                  icon: Utensils,
                  direction: 'SE'
                },
                {
                  title: 'Bathroom',
                  tip: 'Bathrooms should be in the West or North-West direction. Avoid placing them in the North-East corner.',
                  icon: Bath,
                  direction: 'W/NW'
                },
                {
                  title: 'Office/Study',
                  tip: 'Home office or study room should be in the West or South-West. Face North or East while working for better concentration.',
                  icon: Briefcase,
                  direction: 'W/SW'
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-white border border-[#AB7A57]/15 border-l-4 border-l-[#AB7A57]/30 hover:border-l-gold-aura hover:bg-[#FFFDEE] hover:shadow-xs transition-all duration-300 flex items-start gap-4 cursor-pointer group text-left"
                >
                  {/* Direction Badge */}
                  <div className="w-12 h-12 rounded-xl border border-gold-aura/40 bg-[#FFFDEE] flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all duration-300 text-center">
                    <span className="text-[8px] uppercase tracking-wider text-[#AB7A57] font-bold leading-none">Dir</span>
                    <span className="text-[11px] font-serif font-black text-gold-aura leading-none mt-0.5">{item.direction}</span>
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1.5 text-left flex-grow">
                    <div className="flex items-center gap-2">
                      <item.icon size={15} className="text-[#AB7A57] group-hover:text-gold-aura transition-colors shrink-0" />
                      <h4 className="font-serif font-bold text-[#181122] text-sm sm:text-base leading-tight">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-[#181122]/80 leading-relaxed font-sans font-medium">
                      {item.tip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Back Link bottom */}
          <motion.div variants={itemVariants} className="flex justify-center pt-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:text-[#D3AF54] text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft size={12} />
              <span>Back to Home</span>
            </Link>
          </motion.div>

        </motion.div>
      </div>
    );
  }

  if (serviceId === 'reiki-healing') {
    return (
      <ReikiHealingDetail details={details} navigate={navigate} />
    );
  }

  if (serviceId === 'prashna-kundali') {
    return (
      <PrashnaKundaliDetail details={details} navigate={navigate} />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFCF5] relative flex flex-col items-center font-sans text-[#181122] pb-16 overflow-x-hidden">
      
      {/* Decorative patterns */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(171,122,87,0.06),transparent_70%)] rounded-full -z-10 pointer-events-none animate-pulse"></div>
      
      {/* Banner / Header Image Container */}
      <div className="w-full h-[clamp(200px,35vh,400px)] relative overflow-hidden flex items-center justify-center">
        <img 
          src={details.image} 
          alt={details.title} 
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCF5] via-[#FDFCF5]/10 to-[#181122]/40" />
        
        {/* Back Link Overlay */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 md:left-12 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181122] hover:bg-[#D3AF54] text-white hover:text-[#181122] transition-colors shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Home</span>
        </button>
      </div>

      {/* Main Content Area */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-5xl px-6 md:px-12 -mt-16 sm:-mt-24 relative z-10 space-y-10 text-left"
      >
        
        {/* Intro Service Card */}
        <motion.div 
          variants={itemVariants} 
          className="bg-[#181122] text-white border border-[#AB7A57]/20 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D3AF54]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-[#D3AF54] uppercase block">
              ✦ CELESTIAL CONSULTATION ✦
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white tracking-wide">
              {details.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#D8CFEB] italic font-serif">
              {details.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-y border-white/5 py-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#D3AF54]" />
              <span className="text-xs text-[#D8CFEB] font-semibold">{details.duration} Duration</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem size={16} className="text-[#D3AF54]" />
              <span className="text-xs font-bold text-[#D3AF54] bg-white/5 border border-[#D3AF54]/25 px-3 py-1 rounded-full">
                {details.price}
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#D8CFEB] leading-relaxed font-sans">
            {details.desc}
          </p>

          <div className="pt-2">
            <Link 
              to="/booking"
              className="inline-flex items-center gap-2.5 bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-[#D3AF54]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs sm:text-sm uppercase tracking-wider"
            >
              <Calendar size={16} />
              <span>Book Appointment</span>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Process & Benefits */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Step-by-Step Process */}
            <motion.div 
              variants={itemVariants} 
              className="bg-white border border-[#AB7A57]/15 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#181122] flex items-center gap-2">
                <Sparkles size={20} className="text-[#D3AF54]" />
                <span>Consultation Process</span>
              </h3>
              
              <div className="space-y-4">
                {details.process.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#181122] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-[#D3AF54]/50">
                      {idx + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-[#181122]/90 leading-relaxed font-sans pt-0.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Core Benefits */}
            <motion.div 
              variants={itemVariants} 
              className="bg-white border border-[#AB7A57]/15 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#181122] flex items-center gap-2">
                <Shield size={20} className="text-[#D3AF54]" />
                <span>Core Consultation Benefits</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {details.benefits.map((benefit, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#FFFDEE]/60 border border-[#AB7A57]/10 flex flex-col gap-1.5 text-left">
                    <h4 className="font-serif font-bold text-sm text-[#181122] flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-[#D3AF54] shrink-0" />
                      <span>{benefit.title}</span>
                    </h4>
                    <p className="text-xs text-[#181122]/80 leading-relaxed font-sans">
                      {benefit.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* Right Column: Success Story / Testimonial card */}
          <div className="lg:col-span-4 h-full">
            <motion.div 
              variants={itemVariants} 
              className="bg-[#FFFDEE] border-2 border-[#D3AF54]/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            >
              <span className="absolute top-2 right-4 text-[#D3AF54]/10 text-9xl font-serif select-none pointer-events-none leading-none">“</span>
              
              <div className="space-y-4">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#AB7A57] uppercase block font-sans">
                  ✦ LIFE TRANSFORMATION ✦
                </span>
                
                <blockquote className="relative z-10">
                  <p className="text-xs sm:text-sm text-[#181122]/90 leading-relaxed font-sans italic">
                    "{details.story.text}"
                  </p>
                </blockquote>
              </div>

              <div className="border-t border-[#AB7A57]/15 pt-4 mt-6">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Star size={12} className="fill-[#D3AF54] text-[#D3AF54]" />
                  <Star size={12} className="fill-[#D3AF54] text-[#D3AF54]" />
                  <Star size={12} className="fill-[#D3AF54] text-[#D3AF54]" />
                  <Star size={12} className="fill-[#D3AF54] text-[#D3AF54]" />
                  <Star size={12} className="fill-[#D3AF54] text-[#D3AF54]" />
                </div>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-[#181122]">
                  {details.story.client}
                </h4>
                <span className="text-[10px] font-bold text-[#D3AF54] uppercase tracking-wider block mt-0.5">
                  {details.story.timeline}
                </span>
              </div>
            </motion.div>
          </div>

        </div>

        {/* Back Link bottom */}
        <motion.div variants={itemVariants} className="flex justify-center pt-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 hover:text-[#D3AF54] text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={12} />
            <span>Back to Home</span>
          </Link>
        </motion.div>

      </motion.div>

    </div>
  )
}

function ReikiHealingDetail({ details, navigate }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const modalities = [
    {
      title: "Chakra Balancing",
      desc: "Clearing and aligning the 7 primary energy centers.",
      icon: <RefreshCw size={18} />
    },
    {
      title: "Aura Cleansing",
      desc: "Purifying your energetic field from external stress and negativity.",
      icon: <Sparkles size={18} />
    },
    {
      title: "Distance Healing",
      desc: "Remote energy transmissions that cross boundaries seamlessly.",
      icon: <Globe size={18} />
    },
    {
      title: "Emotional Release",
      desc: "Dissolving chronic mental blocks and suppressed tension.",
      icon: <Heart size={18} />
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F4F1E3] relative flex flex-col items-center overflow-hidden font-sans">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION (Warm Ivory bg-[#F4F1E3])                  */}
      {/* ========================================================= */}
      <div className="w-full py-16 md:py-20 flex flex-col items-center relative z-10 px-6">
        {/* Ambient glowing energy fields */}
        <div className="absolute top-10 left-1/4 w-[350px] h-[350px] bg-[#D3AF54]/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />

        {/* Back button link */}
        <div className="w-full max-w-5xl mb-10 text-left">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181122] hover:bg-[#D3AF54] text-white hover:text-[#181122] transition-colors shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>
        </div>

        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-4xl text-center flex flex-col items-center space-y-6"
        >
          {/* Rounded Pill Badge with Gold Glow */}
          <div className="px-4 py-1.5 rounded-full text-[#AB7A57] bg-[#FFFDEE] border border-[#D3AF54]/30 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(211,175,84,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D3AF54] animate-pulse"></span>
            <span>Energy Alignment • Deep Restoration</span>
          </div>

          {/* Main Headline with Gold Gradient text style matching True Destiny */}
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#181122] tracking-wide leading-tight max-w-3xl">
            <span className="text-xl md:text-2xl font-sans font-medium text-slate-500 block mb-2 tracking-normal">
              Restore Inner Peace & Align Your Energy:
            </span>
            <span className="bg-gradient-to-r from-[#D3AF54] via-[#AB7A57] to-[#D3AF54] bg-clip-text text-transparent drop-shadow-sm">
              Professional Reiki Healing
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl font-sans font-medium">
            Reiki is a natural, non-invasive Japanese energy healing technique that promotes deep relaxation, dissolves energetic blocks, and accelerates your body's natural ability to heal physically, emotionally, and spiritually.
          </p>

          {/* Book Appointment CTA Button with lighter gold styling */}
          <div className="pt-2">
            <Link 
              to="/booking"
              className="inline-flex items-center gap-2.5 bg-[#F1E4C3] hover:bg-[#EAD18D] text-[#181122] font-bold px-8 py-3.5 rounded-xl border border-[#D3AF54]/30 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs sm:text-sm uppercase tracking-wider cursor-pointer font-sans"
            >
              <Calendar size={16} />
              <span>Book Appointment</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* 2. CORE OFFERINGS SECTION (Pure White bg-white)           */}
      {/* ========================================================= */}
      <div className="w-full bg-white border-y border-[#AB7A57]/10 py-16 md:py-20 flex flex-col items-center relative z-10 px-6">
        
        <div className="w-full max-w-5xl mb-10 text-left">
          <span className="text-[#AB7A57] text-xs font-bold uppercase tracking-widest block mb-2">✦ CORE OFFERINGS ✦</span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#181122]">Channeled Healing Modalities</h2>
        </div>

        {/* Minimalist interactive card grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modalities.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const isAnyHovered = hoveredIdx !== null;
            return (
              <motion.div 
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                whileHover={{ y: -8 }}
                className={`border rounded-2xl p-6 text-left transition-all duration-300 flex flex-col justify-between group min-h-[190px] shadow-xs relative overflow-hidden cursor-pointer ${
                  isHovered 
                    ? 'bg-white border-[#D3AF54] shadow-[0_4px_20px_rgba(211,175,84,0.15)] scale-[1.02]' 
                    : isAnyHovered 
                      ? 'bg-[#F6F3E6]/30 border-[#AB7A57]/10 opacity-50' 
                      : 'bg-[#F6F3E6]/60 border-[#AB7A57]/15'
                }`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 shrink-0 shadow-inner transition-all duration-300 ${
                    isHovered 
                      ? 'bg-[#181122] text-white border-[#181122] scale-105' 
                      : 'bg-[#FFFDEE] border-[#D3AF54]/30 text-[#D3AF54]'
                  }`}>
                    {item.icon}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#181122] mb-2">{item.title}</h3>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. TRANSFORMATIONS SECTION (Distinct Warm Sand bg-[#EDE9D7])*/}
      {/* ========================================================= */}
      <div className="w-full bg-[#EDE9D7] py-16 md:py-20 flex flex-col items-center relative z-10 px-6">
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#D3AF54]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Side: Illustrative Chakra Axis Image */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-2 bg-white border border-[#AB7A57]/15 rounded-3xl overflow-hidden shadow-xs h-[380px]">
            <img 
              src={reikiChakrasImg} 
              alt="Chakra Energy Axis" 
              className="w-full h-full object-cover rounded-2xl hover:scale-[1.02] transition-transform duration-500" 
            />
          </div>

          {/* Right Side: Benefits Grid */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-[#AB7A57] text-xs font-bold uppercase tracking-widest block">✦ TRANSFORMATIONS ✦</span>
              <h3 className="font-serif font-bold text-2xl md:text-3xl text-[#181122]">The Path to Energy Balance</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans font-medium max-w-md">
                Reiki healing changes how energy flows in your body, leading to deep, measurable improvements in your physical and emotional wellbeing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Anxiety & Stress Relief */}
              <div className="p-4 rounded-xl bg-white border border-[#AB7A57]/20 flex items-center gap-3 shadow-2xs">
                <CheckCircle size={18} className="text-[#D3AF54] shrink-0" />
                <span className="font-serif font-bold text-sm text-[#181122]">Anxiety & Stress Relief</span>
              </div>

              {/* Better Sleep & Fatigue Recovery */}
              <div className="p-4 rounded-xl bg-white border border-[#AB7A57]/20 flex items-center gap-3 shadow-2xs">
                <CheckCircle size={18} className="text-[#D3AF54] shrink-0" />
                <span className="font-serif font-bold text-sm text-[#181122]">Better Sleep & Fatigue Recovery</span>
              </div>

              {/* Sharp Mental Clarity */}
              <div className="p-4 rounded-xl bg-white border border-[#AB7A57]/20 flex items-center gap-3 shadow-2xs">
                <CheckCircle size={18} className="text-[#D3AF54] shrink-0" />
                <span className="font-serif font-bold text-sm text-[#181122]">Sharp Mental Clarity</span>
              </div>

              {/* Accelerated Biological Healing */}
              <div className="p-4 rounded-xl bg-white border border-[#AB7A57]/20 flex items-center gap-3 shadow-2xs">
                <CheckCircle size={18} className="text-[#D3AF54] shrink-0" />
                <span className="font-serif font-bold text-sm text-[#181122]">Accelerated Biological Healing</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. FOOTER RETURN LINK SECTION (Warm Ivory bg-[#F4F1E3])    */}
      {/* ========================================================= */}
      <div className="w-full bg-[#F4F1E3] py-10 flex justify-center z-10 px-6">
        <Link 
          to="/" 
          className="flex items-center gap-2 hover:text-[#D3AF54] text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={12} />
          <span>Back to Home</span>
        </Link>
      </div>

    </div>
  );
}

function PrashnaKundaliDetail({ details, navigate }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    question: ''
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.phone && formData.location && formData.question) {
      setSubmitted(true);
    }
  };

  const pillars = [
    {
      title: "No Birth Time Required",
      desc: "Perfect if you don't know your exact date, time, or city of birth.",
      icon: <User size={18} />
    },
    {
      title: "Hyper-Focused Precision",
      desc: "Analyzes the exact energy of one specific question rather than a broad lifetime overview.",
      icon: <Sparkles size={18} />
    },
    {
      title: "Rapid Turnaround",
      desc: "Designed for urgent situations where you cannot wait weeks for a full birth chart reading.",
      icon: <Clock size={18} />
    },
    {
      title: "Event-Based Timing",
      desc: "Pinpoints when a specific event will manifest (e.g., job offer arrival, missing item recovery, or deal closure).",
      icon: <Gem size={18} />
    }
  ];

  const categories = [
    {
      title: "Career & Business",
      logo: solutionsLogo,
      queries: [
        "\"Will I get the job offer this week?\"",
        "\"Is this business partnership safe to sign?\""
      ]
    },
    {
      title: "Relationships & Intentions",
      logo: guidanceLogo,
      queries: [
        "\"Is my partner being genuine?\"",
        "\"Will my ex reconnect with me?\""
      ]
    },
    {
      title: "Property & Finance",
      logo: accuracyLogo,
      queries: [
        "\"Should I purchase this house right now?\"",
        "\"Will I recover my lost money?\""
      ]
    },
    {
      title: "Travel & Relocation",
      logo: transformationLogo,
      queries: [
        "\"Will my visa approval go through smoothly?\"",
        "\"Is moving abroad favorable right now?\""
      ]
    },
    {
      title: "Missing Items & Diagnostics",
      logo: clockLogo,
      queries: [
        "\"Where is my lost document/item?\"",
        "\"When will my health recover from this phase?\""
      ]
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F4F1E3] relative flex flex-col items-center overflow-hidden font-sans">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION (Warm Ivory bg-[#F4F1E3])                  */}
      {/* ========================================================= */}
      <div className="w-full py-16 md:py-20 flex flex-col items-center relative z-10 px-6">
        {/* Ambient glowing energy fields */}
        <div className="absolute top-10 left-1/4 w-[350px] h-[350px] bg-[#D3AF54]/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />

        {/* Back button link */}
        <div className="w-full max-w-5xl mb-10 text-left">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181122] hover:bg-[#D3AF54] text-white hover:text-[#181122] transition-colors shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>
        </div>

        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-4xl text-center flex flex-col items-center space-y-6"
        >
          {/* Rounded Pill Badge with Purple Glow */}
          <div className="px-4 py-1.5 rounded-full text-purple-700 bg-purple-50 border border-purple-500/20 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(124,93,248,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            <span>Instant Clarity • Horary Precision</span>
          </div>

          {/* Main Headline with Gold Gradient text style matching True Destiny */}
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#181122] tracking-wide leading-tight max-w-3xl">
            <span className="text-xl md:text-2xl font-sans font-medium text-slate-500 block mb-2 tracking-normal">
              Instant Answers to Urgent Life Questions:
            </span>
            <span className="bg-gradient-to-r from-[#D3AF54] via-[#AB7A57] to-[#D3AF54] bg-clip-text text-transparent drop-shadow-sm">
              Expert Prashna Kundali Analysis
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl font-sans font-medium">
            When time is critical or birth details are unknown, Prashna Kundali (Horary Astrology) constructs a precise cosmic map for the exact second your question is asked—providing immediate, hyper-focused clarity to help you make confident decisions.
          </p>

          {/* Scroll Button */}
          <div className="pt-2">
            <button 
              onClick={() => document.getElementById('questionForm')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2.5 bg-[#F1E4C3] hover:bg-[#EAD18D] text-[#181122] font-bold px-8 py-3.5 rounded-xl border border-[#D3AF54]/30 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs sm:text-sm uppercase tracking-wider cursor-pointer font-sans"
            >
              <Calendar size={16} />
              <span>Ask a Question</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* 2. CORE PILLARS SECTION (Pure White bg-white)             */}
      {/* ========================================================= */}
      <div className="w-full bg-white border-y border-[#AB7A57]/10 py-16 md:py-20 flex flex-col items-center relative z-10 px-6">
        
        <div className="w-full max-w-5xl mb-10 text-left">
          <span className="text-[#AB7A57] text-xs font-bold uppercase tracking-widest block mb-2">✦ UNIQUE ADVANTAGES ✦</span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#181122]">Horary Astrology Pillars</h2>
        </div>

        {/* Minimalist interactive card grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const isAnyHovered = hoveredIdx !== null;
            return (
              <motion.div 
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                whileHover={{ y: -6 }}
                className={`border rounded-2xl p-6 text-left transition-all duration-300 flex flex-col justify-between group min-h-[190px] shadow-xs relative overflow-hidden cursor-pointer ${
                  isHovered 
                    ? 'bg-white border-[#D3AF54] shadow-[0_4px_20px_rgba(211,175,84,0.15)] scale-[1.02]' 
                    : isAnyHovered 
                      ? 'bg-[#F6F3E6]/30 border-[#AB7A57]/10 opacity-50' 
                      : 'bg-[#F6F3E6]/60 border-[#AB7A57]/15'
                }`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 shrink-0 shadow-inner transition-all duration-300 ${
                    isHovered 
                      ? 'bg-[#181122] text-white border-[#181122] scale-105' 
                      : 'bg-[#FFFDEE] border-[#D3AF54]/30 text-[#D3AF54]'
                  }`}>
                    {item.icon}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#181122] mb-2">{item.title}</h3>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. TYPES OF QUESTIONS SECTION (Warm Sand bg-[#EDE9D7])     */}
      {/* ========================================================= */}
      <div className="w-full bg-[#EDE9D7] py-16 md:py-20 flex flex-col items-center relative z-10 px-6">
        
        <div className="w-full max-w-5xl mb-10 text-left">
          <span className="text-[#AB7A57] text-xs font-bold uppercase tracking-widest block mb-2">✦ CHANNELS OF INQUIRY ✦</span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#181122]">Types of Questions You Can Ask</h2>
        </div>

        {/* 5-tile responsive grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white border border-[#AB7A57]/20 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#FFFDEE] border border-[#D3AF54]/20 flex items-center justify-center mb-4 shrink-0 overflow-hidden shadow-inner">
                  <img src={item.logo} alt={item.title} className="w-6 h-6 object-contain" />
                </div>
                <h4 className="font-serif font-bold text-sm text-[#181122] mb-3">{item.title}</h4>
                <div className="space-y-2 mt-2">
                  {item.queries.map((q, qidx) => (
                    <p key={qidx} className="text-xs sm:text-sm text-slate-700 font-sans italic leading-relaxed font-semibold">
                      {q}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. INTERACTIVE CTA FORM SECTION (Pure White bg-white)     */}
      {/* ========================================================= */}
      <div id="questionForm" className="w-full bg-white border-t border-[#AB7A57]/10 py-16 md:py-20 flex flex-col items-center relative z-10 px-6">
        
        <div className="w-full max-w-md mb-8 text-center">
          <span className="text-[#AB7A57] text-xs font-bold uppercase tracking-widest block mb-2">✦ GET INSTANT CLARITY ✦</span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#181122]">Submit Your Prashna</h2>
          <p className="text-xs text-slate-500 font-sans mt-2">
            Fill in your details below. Astrologer Kundan Singh will construct your horary chart for the exact second of submission.
          </p>
        </div>

        {/* Themed with Navbar dark color #181122 */}
        <div className="w-full max-w-2xl bg-[#181122] border border-[#AB7A57]/30 rounded-3xl p-6 md:p-8 shadow-xl relative">
          
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-16 h-16 bg-[#241B33] border border-[#D3AF54]/30 rounded-full flex items-center justify-center mx-auto text-[#D3AF54] shadow-inner">
                <CheckCircle size={32} />
              </div>
              <h3 className="font-serif font-bold text-xl text-[#FDFCF5]">Question Submitted Successfully!</h3>
              <p className="text-xs text-[#D8CFEB] max-w-md mx-auto leading-relaxed">
                Thank you, {formData.name}. Your Prashna chart has been cast for this exact location and time. We will reach out to you within 24 hours with your horary reading.
              </p>
              <button 
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', phone: '', location: '', question: '' });
                }}
                className="mt-4 text-xs font-bold text-[#D3AF54] hover:text-[#EAD18D] underline cursor-pointer"
              >
                Submit another question
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#D3AF54] uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#241B33] text-[#FDFCF5] border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D3AF54] transition placeholder-slate-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#D3AF54] uppercase tracking-wider mb-2">Mobile Number</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="e.g. +1 555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#241B33] text-[#FDFCF5] border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D3AF54] transition placeholder-slate-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#D3AF54] uppercase tracking-wider mb-2">Current Location (City, Country)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. London, UK"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-[#241B33] text-[#FDFCF5] border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D3AF54] transition placeholder-slate-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#D3AF54] uppercase tracking-wider mb-2">Your Specific Question</label>
                <textarea 
                  required
                  placeholder="e.g. Will my visa application be approved this month?"
                  rows={4}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full bg-[#241B33] text-[#FDFCF5] border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D3AF54] transition placeholder-slate-500 min-h-[120px] resize-none font-sans"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#D3AF54] hover:bg-[#D3AF54]/95 text-[#181122] font-bold px-8 py-4 rounded-xl shadow-lg shadow-[#D3AF54]/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-xs sm:text-sm uppercase tracking-wider cursor-pointer font-sans"
                >
                  <span>Analyze My Question Now</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

      {/* ========================================================= */}
      {/* 5. FOOTER RETURN LINK SECTION (Warm Ivory bg-[#F4F1E3])    */}
      {/* ========================================================= */}
      <div className="w-full bg-[#F4F1E3] py-10 flex justify-center z-10 px-6">
        <Link 
          to="/" 
          className="flex items-center gap-2 hover:text-[#D3AF54] text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={12} />
          <span>Back to Home</span>
        </Link>
      </div>

    </div>
  );
}

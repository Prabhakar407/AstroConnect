import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import logoImg from "../assets/logos/Logo.png";

const MotionLink = motion.create ? motion.create(Link) : motion(Link);

/**
 * Navbar Component
 * Rebuilt with a premium Cyberpunk/Dark Mode glassmorphism theme
 * featuring a "Neon Underline Sliding Tab" capsule indicator using Framer Motion.
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleServices = () => setServicesOpen(!servicesOpen);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services", isDropdown: true },
    { name: "Testimonial", path: "/testimonials" },
    { name: "Contact", path: "/contact" }
  ];

  const getActiveIdx = () => {
    if (location.pathname === "/") return 0;
    if (location.pathname === "/about") return 1;
    if (location.pathname === "/services" || location.pathname.startsWith("/services")) return 2;
    if (location.pathname === "/testimonials") return 3;
    if (location.pathname === "/contact") return 4;
    return 0;
  };

  const activeIdx = getActiveIdx();
  const currentIndicatorIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;

  // Custom CSS variables for cyberpunk glassmorphic styling
  const navStyles = {
    "--nav-bg": "linear-gradient(to right, rgba(24, 17, 34, 0.95), rgba(6, 9, 27, 0.95))",
    "--nav-border": "rgba(171, 122, 87, 0.15)",
    "--pill-bg-start": "rgba(211, 175, 84, 0.12)",
    "--pill-bg-end": "rgba(211, 175, 84, 0.02)",
    "--pill-border": "rgba(211, 175, 84, 0.5)",
    "--pill-glow": "rgba(211, 175, 84, 0.2)"
  };

  return (
    <header 
      style={{
        backgroundColor: "var(--nav-bg)",
        borderColor: "var(--nav-border)",
        backdropFilter: "blur(12px)",
        ...navStyles
      }}
      className="w-full text-white border-b sticky top-0 z-50 shadow-[0_4px_30px_rgba(211,175,84,0.06)] transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-21">

          {/* Logo Section */}
          <div className="flex items-center gap-1 pt-3">
            <img
              src={logoImg}
              alt="Kundan Singh Logo"
              className="w-28 h-28 object-contain"
            />

            {/* Vertical Alignment: Astroadvice by (above), Kundan Singh (below) */}
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-[#D8CFEB] tracking-widest uppercase font-medium leading-none">
                Astroadvice by
              </span>
              <span className="text-lg md:text-xl font-bold text-[#D3AF54] font-serif tracking-wide mt-1 leading-none block">
                Kundan Singh
              </span>
            </div>
          </div>

          {/* Desktop Navigation Menu (Horizontal Neon sliding pill indicator) */}
          <nav className="hidden lg:flex items-center gap-1.5 translate-y-1 relative">
            {navItems.map((item, idx) => {
              const isIndicatorActive = currentIndicatorIdx === idx;
              
              if (item.isDropdown) {
                return (
                  <div
                    key={idx}
                    className="relative group"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {isIndicatorActive && (
                      <motion.div
                        layoutId="active-pill"
                        style={{
                          background: "linear-gradient(135deg, var(--pill-bg-start), var(--pill-bg-end))",
                          borderColor: "var(--pill-border)",
                          boxShadow: "0 0 20px var(--pill-glow)",
                        }}
                        className="absolute inset-0 border rounded-full pointer-events-none"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <button
                      onClick={toggleServices}
                      className="relative z-10 px-4 py-2 flex items-center gap-1 text-sm font-medium transition-colors text-slate-300 hover:text-white cursor-pointer focus:outline-none"
                    >
                      Services
                      <ChevronDown size={14} />
                    </button>
                    
                    {/* Dropdown Options */}
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#181122]/95 border border-[#AB7A57]/20 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 backdrop-blur-md">
                      <div className="py-2">
                        <Link
                          to="/services/vedic-astrology"
                          className="block px-5 py-2 text-sm text-[#D8CFEB] hover:text-[#D3AF54] hover:bg-white/5 transition-colors"
                        >
                          Vedic Astrology
                        </Link>
                        <Link
                          to="/services/numerology"
                          className="block px-5 py-2 text-sm text-[#D8CFEB] hover:text-[#D3AF54] hover:bg-white/5 transition-colors"
                        >
                          Numerology
                        </Link>
                        <Link
                          to="/services/vastu"
                          className="block px-5 py-2 text-sm text-[#D8CFEB] hover:text-[#D3AF54] hover:bg-white/5 transition-colors"
                        >
                          Vastu Consultation
                        </Link>
                        <Link
                          to="/services/laal-kitaab"
                          className="block px-5 py-2 text-sm text-[#D8CFEB] hover:text-[#D3AF54] hover:bg-white/5 transition-colors"
                        >
                          Laal Kitaab Remedies
                        </Link>
                        <Link
                          to="/services/prashna-kundali"
                          className="block px-5 py-2 text-sm text-[#D8CFEB] hover:text-[#D3AF54] hover:bg-white/5 transition-colors"
                        >
                          Expertise in Prashna Kundli
                        </Link>
                        <Link
                          to="/services/reiki-healing"
                          className="block px-5 py-2 text-sm text-[#D8CFEB] hover:text-[#D3AF54] hover:bg-white/5 transition-colors"
                        >
                          Reiki Healer
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="relative"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isIndicatorActive && (
                    <motion.div
                      layoutId="active-pill"
                      style={{
                        background: "linear-gradient(135deg, var(--pill-bg-start), var(--pill-bg-end))",
                        borderColor: "var(--pill-border)",
                        boxShadow: "0 0 20px var(--pill-glow)",
                      }}
                      className="absolute inset-0 border rounded-full pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Link
                    to={item.path}
                    className="relative z-10 px-4 py-2 block text-sm font-medium transition-colors text-slate-300 hover:text-white"
                  >
                    {item.name}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Desktop Right Action Panel */}
          <div className="hidden lg:flex flex-col items-end gap-1">
            {/* Contact Phone */}
            <div className="flex items-center gap-1.5 text-[#D3AF54] text-xs font-semibold">
              <span>☎</span>
              <span>9999999999</span>
            </div>

            {/* Booking Options CTA */}
            <MotionLink 
              to="/booking"
              whileHover={{ scale: 1.05, y: -1, boxShadow: "0 0 15px rgba(211, 175, 84, 0.45)" }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#D3AF54] text-[#181122] font-semibold px-4 py-1.5 rounded-lg flex items-center gap-2 transition text-xs cursor-pointer shadow-[0_0_15px_rgba(211, 175, 84, 0.25)]"
            >
              <Calendar size={14} />
              Book Appointment
            </MotionLink>
          </div>

          {/* Responsive Hamburger Toggle for Mobile/Tablet */}
          <button 
            onClick={toggleMenu} 
            className="lg:hidden text-[#D3AF54] hover:text-[#D3AF54]/80 focus:outline-none p-1 cursor-pointer"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>
      </div>

      {/* Mobile/Tablet Dropdown Drawer Panel */}
      {isOpen && (
        <div 
          style={{
            backgroundColor: "rgba(24, 17, 34, 0.97)",
            borderColor: "var(--nav-border)",
            backdropFilter: "blur(12px)",
          }}
          className="lg:hidden border-t py-4 px-6 space-y-4 shadow-inner"
        >
          <div className="flex flex-col gap-2 relative">
            {navItems.map((item, idx) => {
              const isIndicatorActive = currentIndicatorIdx === idx;

              if (item.isDropdown) {
                return (
                  <div
                    key={idx}
                    className="relative w-full"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {isIndicatorActive && (
                      <motion.div
                        layoutId="active-pill-mobile"
                        style={{
                          background: "linear-gradient(135deg, var(--pill-bg-start), var(--pill-bg-end))",
                          borderColor: "var(--pill-border)",
                          boxShadow: "0 0 20px var(--pill-glow)",
                        }}
                        className="absolute inset-0 border rounded-xl pointer-events-none"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    
                    <button
                      onClick={toggleServices}
                      className="relative z-10 w-full px-4 py-2.5 flex justify-between items-center text-sm font-medium transition-colors text-slate-300 hover:text-white cursor-pointer focus:outline-none"
                    >
                      <span>Services</span>
                      <ChevronDown size={16} className={`transform transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {servicesOpen && (
                      <div className="pl-6 mt-1 border-l border-white/10 space-y-2 py-1 relative z-10">
                        <Link
                          to="/services/vedic-astrology"
                          onClick={() => setIsOpen(false)}
                          className="block text-xs text-slate-400 hover:text-white py-1.5 transition-colors"
                        >
                          Vedic Astrology
                        </Link>
                        <Link
                          to="/services/numerology"
                          onClick={() => setIsOpen(false)}
                          className="block text-xs text-slate-400 hover:text-white py-1.5 transition-colors"
                        >
                          Numerology
                        </Link>
                        <Link
                          to="/services/vastu"
                          onClick={() => setIsOpen(false)}
                          className="block text-xs text-slate-400 hover:text-white py-1.5 transition-colors"
                        >
                          Vastu Consultation
                        </Link>
                        <Link
                          to="/services/laal-kitaab"
                          onClick={() => setIsOpen(false)}
                          className="block text-xs text-slate-400 hover:text-white py-1.5 transition-colors"
                        >
                          Laal Kitaab Remedies
                        </Link>
                        <Link
                          to="/services/prashna-kundali"
                          onClick={() => setIsOpen(false)}
                          className="block text-xs text-slate-400 hover:text-white py-1.5 transition-colors"
                        >
                          Expertise in Prashna Kundli
                        </Link>
                        <Link
                          to="/services/reiki-healing"
                          onClick={() => setIsOpen(false)}
                          className="block text-xs text-[#D8CFEB] hover:text-white py-1.5 transition-colors"
                        >
                          Reiki Healer
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="relative w-full"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isIndicatorActive && (
                    <motion.div
                      layoutId="active-pill-mobile"
                      style={{
                        background: "linear-gradient(135deg, var(--pill-bg-start), var(--pill-bg-end))",
                        borderColor: "var(--pill-border)",
                        boxShadow: "0 0 20px var(--pill-glow)",
                      }}
                      className="absolute inset-0 border rounded-xl pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="relative z-10 px-4 py-2.5 block text-sm font-medium transition-colors text-slate-300 hover:text-white"
                  >
                    {item.name}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Drawer Call Actions Footer */}
          <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-2">
            {/* Phone */}
            <div className="flex items-center gap-1.5 text-[#D3AF54] text-sm font-medium">
              <span>☎</span>
              <span>9999999999</span>
            </div>

            {/* CTA Button */}
            <Link 
              to="/booking"
              onClick={() => setIsOpen(false)}
              className="bg-[#D3AF54] hover:bg-[#D3AF54]/90 text-[#181122] font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm w-full shadow-[0_0_15px_rgba(211,175,84,0.25)]"
            >
              <Calendar size={16} />
              Booking Options
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

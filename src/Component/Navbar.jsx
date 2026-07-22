import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ChevronDown, Calendar } from "lucide-react";
import logoImg from "../assets/logos/Logo.png";

/**
 * Navbar Component
 * Features brand identity with assets logo, tagline-name vertical alignment,
 * custom visibility configurations, and telephone details positioned directly above
 * the booking buttons for both desktop and mobile layouts.
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleServices = () => setServicesOpen(!servicesOpen);

  return (
    <header className="bg-[#2A132E] text-white border-b border-[#4A2A50] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navbar height expanded to h-28 to fit the larger logo (w-24 h-24) */}
        <div className="flex items-center justify-between h-21">

          {/* Logo Section (doubled logo size w-24 h-24 with gap-1) */}
          <div className="flex items-center gap-1 pt-3">
            <img
              src={logoImg}
              alt="Kundan Singh Logo"
              className="w-24 h-24 object-contain"
            />

            {/* Vertical Alignment: Astroadvice by (above), Kundan Singh (below) */}
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-[#F4EAE3] tracking-widest uppercase font-medium leading-none">
                Astroadvice by
              </span>
              <span className="text-lg md:text-xl font-bold text-[#fcb900] font-serif tracking-wide mt-1 leading-none block">
                Kundan Singh
              </span>
            </div>
          </div>

          {/* Desktop Navigation Menu (shifted slightly lower using translate-y-1) */}
          <nav className="hidden lg:flex items-center gap-8 translate-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-base font-medium transition pb-1 border-b-2 ${
                  isActive ? "border-[#fcb900] text-[#fcb900]" : "border-transparent hover:text-[#fcb900]"
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-base font-medium transition pb-1 border-b-2 ${
                  isActive ? "border-[#fcb900] text-[#fcb900]" : "border-transparent hover:text-[#fcb900]"
                }`
              }
            >
              About
            </NavLink>

            {/* Desktop Services Dropdown (aligned identically with pb-1 border-b-2) */}
            <div className="relative group">
              <button 
                onClick={toggleServices}
                className="flex items-center gap-1 text-base font-medium hover:text-[#fcb900] transition pb-1 border-b-2 border-transparent focus:outline-none cursor-pointer"
              >
                Services
                <ChevronDown size={14} />
              </button>

              <div className="absolute top-full left-0 mt-2 w-56 bg-[#2A132E] border border-[#4A2A50] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link
                    to="/services"
                    className="block px-5 py-2 text-sm text-slate-200 hover:text-[#fcb900] hover:bg-[#4A2A50]/50"
                  >
                    Kundli Analysis
                  </Link>
                  <Link
                    to="/services"
                    className="block px-5 py-2 text-sm text-slate-200 hover:text-[#fcb900] hover:bg-[#4A2A50]/50"
                  >
                    Career Guidance
                  </Link>
                  <Link
                    to="/services"
                    className="block px-5 py-2 text-sm text-slate-200 hover:text-[#fcb900] hover:bg-[#4A2A50]/50"
                  >
                    Love & Marriage
                  </Link>
                  <Link
                    to="/services"
                    className="block px-5 py-2 text-sm text-slate-200 hover:text-[#fcb900] hover:bg-[#4A2A50]/50"
                  >
                    Vastu Consultation
                  </Link>
                </div>
              </div>
            </div>

            <NavLink
              to="/testimonials"
              className={({ isActive }) =>
                `text-base font-medium transition pb-1 border-b-2 ${
                  isActive ? "border-[#fcb900] text-[#fcb900]" : "border-transparent hover:text-[#fcb900]"
                }`
              }
            >
              Testimonial
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `text-base font-medium transition pb-1 border-b-2 ${
                  isActive ? "border-[#fcb900] text-[#fcb900]" : "border-transparent hover:text-[#fcb900]"
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          {/* Desktop Right Action Panel (Vertical layout: Phone above Booking Options) */}
          <div className="hidden lg:flex flex-col items-end gap-1">
            {/* Contact Phone */}
            <div className="flex items-center gap-1.5 text-[#fcb900] text-xs font-semibold">
              <span>☎</span>
              <span>9999999999</span>
            </div>

            {/* Booking Options CTA */}
            <Link 
              to="/booking"
              className="bg-[#fcb900] hover:bg-[#e0a500] text-[#2A132E] font-semibold px-4 py-1.5 rounded-lg flex items-center gap-2 transition text-xs"
            >
              <Calendar size={14} />
              Book Appointment
            </Link>
          </div>

          {/* Responsive Hamburger Toggle for Mobile/Tablet */}
          <button 
            onClick={toggleMenu} 
            className="lg:hidden text-[#fcb900] hover:text-[#e0a500] focus:outline-none p-1 cursor-pointer"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>
      </div>

      {/* Mobile/Tablet Dropdown Drawer Panel */}
      {isOpen && (
        <div className="lg:hidden border-t border-[#4A2A50] bg-[#2A132E] py-4 px-6 space-y-4 shadow-inner">
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium hover:text-[#fcb900] transition py-1.5"
            >
              Home
            </Link>

            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium hover:text-[#fcb900] transition py-1.5"
            >
              About
            </Link>

            {/* Mobile/Tablet Collapse services */}
            <div>
              <button 
                onClick={toggleServices} 
                className="w-full flex justify-between items-center text-base font-medium hover:text-[#fcb900] transition py-1.5 cursor-pointer"
              >
                <span>Services</span>
                <ChevronDown size={16} className={`transform transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
              </button>
              {servicesOpen && (
                <div className="pl-4 mt-1 border-l border-[#4A2A50] space-y-2 py-1">
                  <Link
                    to="/services"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm text-slate-300 hover:text-[#fcb900] py-1"
                  >
                    Kundli Analysis
                  </Link>
                  <Link
                    to="/services"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm text-slate-300 hover:text-[#fcb900] py-1"
                  >
                    Career Guidance
                  </Link>
                  <Link
                    to="/services"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm text-slate-300 hover:text-[#fcb900] py-1"
                  >
                    Love & Marriage
                  </Link>
                  <Link
                    to="/services"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm text-slate-300 hover:text-[#fcb900] py-1"
                  >
                    Vastu Consultation
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/testimonials"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium hover:text-[#fcb900] transition py-1.5"
            >
              Testimonial
            </Link>

            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium hover:text-[#fcb900] transition py-1.5"
            >
              Contact
            </Link>
          </div>

          {/* Drawer Call Actions Footer (Vertical layout: Phone above Booking Options) */}
          <div className="border-t border-[#4A2A50] pt-4 flex flex-col items-center gap-2">
            {/* Phone */}
            <div className="flex items-center gap-1.5 text-[#fcb900] text-sm font-medium">
              <span>☎</span>
              <span>9999999999</span>
            </div>

            {/* CTA Button */}
            <Link 
              to="/booking"
              onClick={() => setIsOpen(false)}
              className="bg-[#fcb900] hover:bg-[#e0a500] text-[#2A132E] font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm w-full"
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

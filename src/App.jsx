// AstroAdvice Client Routing Engine
import { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './Component/Navbar'
import Home from './Component/Home'
import About from './Component/About'
import ServiceDetail from './Component/ServiceDetail'
import Service from './Component/Service'
import Testimonial from './Component/Testimonial'
import Contact from './Component/Contact'
import Appointment_Booking from './Component/Appointment_Booking'
import Footer from './Component/Footer'
import './App.css'

/**
 * ScrollToTop Component
 * Resets window scroll position to (0, 0) upon route navigation transitions.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/**
 * App Component
 * Root component that defines the routing layout and links components.
 */
function App() {
  // Pre-warm backend container on mount so there is zero cold-start delay for forms
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "https://astrologer-kundan-singh.onrender.com";
    fetch(`${API_BASE_URL}/`, { method: "GET", mode: "cors" }).catch(() => {});
  }, []);

  return (
    <Router>
      <ScrollToTop />
      {/* Set app background to luxury brand Warm Ivory (#FDF9F7) and body text to Plum (#55393F) */}
      <div className="min-h-screen bg-[#090b1c] text-[#EBDCD4] flex flex-col font-sans">
        
        {/* Navigation Section */}
        <Navbar />

        {/* Dynamic Route Content Section */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Service />} />
            <Route path="/services/:serviceId" element={<ServiceDetail />} />
            <Route path="/testimonials" element={<Testimonial />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booking" element={<Appointment_Booking />} />
          </Routes>
        </main>

        {/* Global Luxury Footer Section */}
        <Footer />

      </div>
    </Router>
  )
}

export default App

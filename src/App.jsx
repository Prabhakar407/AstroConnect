import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './Component/Navbar'
import Home from './Component/Home'
import About from './Component/About'
import Service from './Component/Service'
import Testimonial from './Component/Testimonial'
import Contact from './Component/Contact'
import Appointment_Booking from './Component/Appointment_Booking'
import Footer from './Component/Footer'
import './App.css'

/**
 * App Component
 * Root component that defines the routing layout and links components.
 */
function App() {
  return (
    <Router>
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

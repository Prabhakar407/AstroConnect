import React from 'react'

/**
 * About Component
 * Introduces the astrologer, background, and spiritual philosophy.
 */
function About() {
  return (
    <section id="about" className="w-full max-w-4xl mx-auto py-16 px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      {/* Astrologer Image / Graphic Placeholder Section */}
      <div className="aspect-square bg-slate-900/60 border border-white/5 rounded-3xl flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)]"></div>
        <div className="text-center z-10">
          <span className="text-6xl mb-4 block">🔮</span>
          <span className="font-serif text-sm tracking-widest text-amber-400 uppercase">Astraea C.</span>
        </div>
      </div>

      {/* Profile Bio Section */}
      <div className="space-y-4">
        <span className="text-amber-400 text-xs tracking-widest uppercase font-semibold">The Astrologer</span>
        <h2 className="text-3xl font-serif text-amber-100">Meet Astraea</h2>
        <p className="text-slate-400 leading-relaxed">
          With over a decade of dedication mapping celestial cycles, Astraea bridges the ancient science of astrology with modern counseling. Every birth chart is approached as a sacred cosmic map showing your potential and growth paths.
        </p>
        <p className="text-slate-400 leading-relaxed">
          Our readings explore natal positions, planetary transits, and compatibility profiles to illuminate your life's higher purpose.
        </p>
      </div>
    </section>
  )
}

export default About

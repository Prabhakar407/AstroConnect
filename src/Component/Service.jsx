import React from 'react'

/**
 * Service Component
 * Displays available astrological services (Horoscopes, Birth Charts, Compatibility, etc.)
 */
function Service() {
  const services = [
    { title: 'Natal Chart Reading', price: '$120', desc: 'A complete mapping of the planetary positions at the precise second of your birth.' },
    { title: 'Relationship Synastry', price: '$150', desc: 'An in-depth compatibility analysis comparing two birth charts for partnership harmony.' },
    { title: 'Transit Forecast', price: '$90', desc: 'Predictive reading outlining how upcoming planetary transits will influence your cycles.' }
  ]

  return (
    <section id="services" className="w-full max-w-4xl mx-auto py-16 px-6">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="text-amber-400 text-xs tracking-widest uppercase font-semibold">Our Offerings</span>
        <h2 className="text-3xl font-serif text-amber-100 mt-2">Celestial Services</h2>
      </div>

      {/* Services Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((item, index) => (
          <div key={index} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-amber-400/30 transition-all duration-300">
            <div>
              <h3 className="font-serif text-lg text-amber-200 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{item.desc}</p>
            </div>
            <div className="border-t border-white/5 pt-4 flex justify-between items-center">
              <span className="text-slate-500 text-xs uppercase tracking-wider">Price</span>
              <span className="text-amber-400 font-semibold">{item.price}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Service

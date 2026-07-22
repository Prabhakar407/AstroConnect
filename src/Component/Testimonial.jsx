import React from 'react'

/**
 * Testimonial Component
 * Highlights reviews and feedback from past clients.
 */
function Testimonial() {
  const reviews = [
    { client: 'Elena R.', quote: 'The synastry reading brought so much clarity and peace to my relationship. Unbelievably accurate.' },
    { client: 'Marcus T.', quote: 'Understanding my Saturn Return through Astraea\'s guidance helped me successfully navigate my career transition.' }
  ]

  return (
    <section id="testimonials" className="w-full max-w-4xl mx-auto py-16 px-6">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="text-amber-400 text-xs tracking-widest uppercase font-semibold">Client Stories</span>
        <h2 className="text-3xl font-serif text-amber-100 mt-2">Spiritual Testimonials</h2>
      </div>

      {/* Reviews Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.map((item, index) => (
          <div key={index} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl relative">
            <span className="text-4xl text-amber-500/20 absolute top-4 left-4 font-serif">“</span>
            <p className="text-slate-300 font-serif italic leading-relaxed pl-6 mb-4">
              {item.quote}
            </p>
            <div className="text-right">
              <span className="text-xs text-amber-400 uppercase tracking-widest font-semibold">— {item.client}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Testimonial

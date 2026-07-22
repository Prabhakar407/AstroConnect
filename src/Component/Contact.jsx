import React from 'react'

/**
 * Contact Component
 * General inquiries and contact details section.
 */
function Contact() {
  return (
    <section id="contact" className="w-full max-w-2xl mx-auto py-16 px-6">
      {/* Section Header */}
      <div className="text-center mb-8">
        <span className="text-amber-400 text-xs tracking-widest uppercase font-semibold">Get In Touch</span>
        <h2 className="text-3xl font-serif text-amber-100 mt-2">Contact Astraea</h2>
      </div>

      {/* Contact Form Section */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 bg-slate-900/40 border border-white/5 p-6 rounded-2xl">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Name</label>
          <input type="text" placeholder="Enter your name" className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Email</label>
          <input type="email" placeholder="Enter your email" className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Message</label>
          <textarea rows="4" placeholder="How can we align today?" className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-400 transition-colors"></textarea>
        </div>
        <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-[#060713] py-2.5 rounded-xl font-semibold tracking-wide transition-colors">
          Send Message
        </button>
      </form>
    </section>
  )
}

export default Contact

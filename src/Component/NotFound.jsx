import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-[#F4F1E3] px-6 py-16 text-center text-[#181122]">
      <div className="max-w-xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#8F5F3E]">Page not found</p>
        <h1 className="font-serif text-4xl font-bold sm:text-5xl">This page isn’t here.</h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[#594C45]">
          The address may have changed, or the link may be incomplete. You can return to the homepage and continue from there.
        </p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#181122] px-6 py-3 font-semibold text-white transition hover:bg-[#30263c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8F5F3E]">
          <ArrowLeft aria-hidden="true" size={18} />Return home
        </Link>
      </div>
    </section>
  )
}

import { Calendar, Phone } from 'lucide-react'

export default function FinalCtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8" aria-label="Final appointment call to action">
      <div
        className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-2xl sm:px-10 lg:px-14"
        style={{ background: 'linear-gradient(135deg, var(--medical-blue), oklch(0.30 0.15 245))' }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white/90">
              Ready to Visit?
            </span>
            <h2 className="text-balance text-3xl font-bold sm:text-4xl">
              Book a consultation for speech, voice or hearing care today.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              For the fastest response, call the clinic directly. You can also submit the appointment
              form and the clinic team will confirm availability.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <a
              href="tel:9755018656"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg transition hover:scale-105"
            >
              <Phone size={17} /> Call Now
            </a>
            <a
              href="#appointment"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/50 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
            >
              <Calendar size={17} /> Book Online
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}




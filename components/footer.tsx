'use client'

import { Clock, MapPin, Phone } from 'lucide-react'

const quickLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About Doctor', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Hearing Aids', href: '#hearing-aids' },
  { label: 'Book Appointment', href: '#appointment' },
  { label: 'Contact', href: '#contact' },
]

const services = [
  'Speech Therapy',
  'Hearing Aid Consultation',
  'Digital & Bluetooth Aids',
  'Child Speech Development',
  'Voice Therapy',
  'Audiometry Testing',
]

export default function Footer() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="text-white" style={{ background: 'oklch(0.20 0.06 245)' }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--warm-orange)' }}>
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white">Arogya</div>
                <div className="text-xs uppercase tracking-wide text-white/60">Speech Therapy</div>
              </div>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-white/65">
              Expert speech therapy and hearing care  in Vidisha, M.P. Built for appointment leads, online support and patient trust.
            </p>
            <div className="flex items-start gap-2 text-sm text-white/65">
              <MapPin size={15} className="mt-0.5 flex-shrink-0 text-white/40" />
              <span>Sanchi Road, Vidisha, PIN 464001, India</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button onClick={() => scrollTo(link.href)} className="inline-flex items-center gap-1 text-sm text-white/65 transition-colors hover:text-white">
                    {link.label}
                  </button>
                </li>
              ))}
              <li><a href="/portal" className="text-sm text-white/65 transition-colors hover:text-white">Portal Login</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Our Services</h4>
            <ul className="space-y-2">
              {services.map((service) => <li key={service} className="text-sm text-white/65">{service}</li>)}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Phone size={15} className="mt-0.5 flex-shrink-0 text-white/40" />
                <div>
                  <a href="tel:9755018656" className="block text-sm text-white/65 hover:text-white">9755018656</a>
                  <a href="tel:9755018656" className="block text-sm text-white/65 hover:text-white">9755018656</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={15} className="mt-0.5 flex-shrink-0 text-white/40" />
                <div className="text-sm text-white/65">
                  <p>Mon – Sat: 11 AM – 8 PM</p>
                  <p>Sun: By Appointment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-center text-xs text-white/45 sm:text-left">&copy; {new Date().getFullYear()} Arogya Speech Therapy & Hearing Care. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/45">
            <a href="/privacy-policy" className="hover:text-white">Privacy Policy</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <span>Clinic Specialist</span>
          </div>
        </div>
      </div></footer>
  )
}




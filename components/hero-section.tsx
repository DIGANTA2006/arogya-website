'use client'

import Image from 'next/image'
import { Calendar, CheckCircle2, ChevronDown, Phone, ShieldCheck, Star } from 'lucide-react'

export default function HeroSection() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="home" className="relative flex min-h-[88vh] items-center overflow-hidden sm:min-h-screen" aria-label="Hero section">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-banner.jpg"
          alt="Professional speech therapy and hearing care clinic"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-primary/75" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, oklch(0.32 0.17 245 / 0.95) 0%, oklch(0.40 0.16 235 / 0.82) 50%, oklch(0.18 0.08 245 / 0.92) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-18 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 lg:pt-36">
        <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Speech Therapy • Audiology • Hearing Aids
            </div>

            <h1 className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Expert Speech Therapy & Hearing Care in Vidisha
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/85 sm:text-xl">
              Consult <strong className="font-semibold text-white">Clinic Specialist</strong> for
              child speech delay, voice concerns, audiometry testing, and digital hearing aid
              consultation in a calm, patient-first clinic environment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => scrollTo('#appointment')}
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-xl transition-all duration-200 hover:scale-105"
                style={{ background: 'var(--warm-orange)' }}
              >
                <Calendar size={18} /> Book Appointment
              </button>
              <a
                href="tel:9755018656"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/55 px-7 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-white/15"
              >
                <Phone size={18} /> Call 9755018656
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
              {[
                { value: '1000+', label: 'Patients Helped' },
                { value: '5+', label: 'Years Experience' },
                { value: '6+', label: 'Care Services' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
                  <div className="text-xl font-extrabold text-white sm:text-2xl">{stat.value}</div>
                  <div className="mt-1 text-[10px] font-medium text-white/70 sm:text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-[2rem] border border-white/20 bg-white/12 p-6 shadow-2xl backdrop-blur-md">
              <div className="rounded-[1.5rem] bg-white p-6 text-foreground shadow-xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Clinic Highlight</p>
                    <h2 className="mt-1 text-2xl font-bold">Arogya Speech Therapy</h2>
                  </div>
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--medical-blue-bg)' }}
                  >
                    <ShieldCheck size={25} className="text-primary" />
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    'Personalized assessment and therapy planning',
                    'Audiometry testing and hearing aid fitting support',
                    'Care for children, adults and senior patients',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-4">
                      <CheckCircle2 size={19} className="mt-0.5 flex-shrink-0 text-primary" />
                      <span className="text-sm font-medium leading-relaxed text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl p-4" style={{ background: 'oklch(0.97 0.04 55)' }}>
                  <div className="mb-2 flex items-center gap-1 text-sm font-bold text-foreground">
                    <Star size={17} style={{ color: 'var(--warm-orange-dark)' }} /> Patient-first care
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Clear communication, practical guidance, and follow-up support for every
                    appointment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollTo('#about')}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/60 transition-colors hover:text-white"
        aria-label="Scroll down"
      >
        <ChevronDown size={30} />
      </button>
    </section>
  )
}




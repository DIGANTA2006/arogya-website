import Image from 'next/image'
import { Award, CheckCircle2, HeartPulse, Stethoscope, Users } from 'lucide-react'

const highlights = [
  'Certified speech-language pathology care',
  'Audiometry and hearing assessment',
  'Child speech and language development',
  'Digital and Bluetooth hearing aid fitting',
  'Voice therapy and communication disorders',
  'Compassionate, patient-first consultation',
]

const stats = [
  { icon: Award, value: '5+', label: 'Years Expertise' },
  { icon: Users, value: '1000+', label: 'Patients Helped' },
  { icon: Stethoscope, value: '6+', label: 'Care Areas' },
]

export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-20 lg:py-28"
      style={{ background: 'var(--section-bg)' }}
      aria-label="About Clinic Specialist"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span
            className="mb-3 inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground"
            style={{ background: 'var(--medical-blue)' }}
          >
            About the Doctor
          </span>
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Meet Clinic Specialist
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Professional speech therapy and hearing care for children, adults and senior patients in
            Vidisha.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl lg:mx-0">
              <Image
                src="/images/doctor.jpg"
                alt="Clinic Specialist - Speech-Language Pathologist and Audiologist"
                fill
                sizes="(min-width: 1024px) 384px, 90vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--medical-blue-bg)' }}
                  >
                    <HeartPulse size={21} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Clinic Specialist</div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Speech-Language Pathologist & Audiologist
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3 lg:mx-0">
              {stats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <Icon size={20} className="mx-auto mb-2 text-primary" />
                  <div className="text-xl font-bold text-foreground">{value}</div>
                  <div className="text-[11px] leading-tight text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--medical-blue-bg)', color: 'var(--medical-blue)' }}
            >
              <Stethoscope size={17} /> Evidence-based therapy with personal attention
            </div>

            <p className="mb-5 text-base leading-relaxed text-muted-foreground">
              Clinic Specialist is a dedicated Speech-Language Pathologist and Audiologist with
              hands-on clinical experience in diagnosing and treating speech, language, voice and
              hearing disorders across all age groups — from infants to elderly patients.
            </p>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground">
              At Arogya Speech Therapy & Hearing Care, every patient receives careful evaluation, clear
              guidance and a practical treatment plan designed around their communication goals,
              lifestyle and comfort.
            </p>

            <ul className="grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 rounded-2xl bg-white p-3 shadow-sm">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--warm-orange-dark)' }}
                  />
                  <span className="text-sm leading-relaxed text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}




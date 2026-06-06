import { CalendarCheck2, ClipboardCheck, HeartHandshake, LineChart } from 'lucide-react'

const steps = [
  {
    icon: CalendarCheck2,
    title: 'Book a Visit',
    description: 'Call, WhatsApp, or submit the appointment form with your preferred date and concern.',
  },
  {
    icon: ClipboardCheck,
    title: 'Detailed Assessment',
    description: 'The doctor evaluates speech, language, voice, or hearing needs with patient-friendly guidance.',
  },
  {
    icon: HeartHandshake,
    title: 'Personal Care Plan',
    description: 'You receive a practical therapy or hearing-care plan based on age, condition, lifestyle, and goals.',
  },
  {
    icon: LineChart,
    title: 'Follow-up & Progress',
    description: 'Progress is reviewed regularly so treatment can be adjusted for better long-term results.',
  },
]

export default function CareProcessSection() {
  return (
    <section className="bg-white py-20 lg:py-28" aria-label="Care process">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span
            className="mb-3 inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground"
            style={{ background: 'var(--medical-blue)' }}
          >
            Simple Process
          </span>
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            From First Call to Better Communication
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A clear treatment journey helps patients and families understand what happens next at
            every stage.
          </p>
        </div>

        <div className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className="group relative rounded-[1.75rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: index % 2 === 0 ? 'var(--medical-blue-bg)' : 'oklch(0.97 0.04 55)' }}
                >
                  <Icon
                    size={24}
                    style={{ color: index % 2 === 0 ? 'var(--medical-blue)' : 'var(--warm-orange-dark)' }}
                  />
                </div>
                <span className="text-4xl font-extrabold text-muted/70">0{index + 1}</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}




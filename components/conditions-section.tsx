import { CheckCircle2, Ear, MessageSquareHeart } from 'lucide-react'

const speechConditions = [
  'Delayed speech and language development',
  'Stammering and fluency difficulties',
  'Unclear speech and articulation issues',
  'Voice problems and hoarseness',
]

const hearingConditions = [
  'Hearing screening and audiometry',
  'Hearing aid trial, fitting and counselling',
  'Digital and Bluetooth hearing aid guidance',
  'Elderly hearing support and follow-up care',
]

function ConditionList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <CheckCircle2
            size={18}
            className="mt-0.5 flex-shrink-0"
            style={{ color: 'var(--warm-orange-dark)' }}
          />
          <span className="text-sm leading-relaxed text-foreground/80">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ConditionsSection() {
  return (
    <section
      className="py-20 lg:py-28"
      style={{ background: 'var(--section-bg)' }}
      aria-label="Conditions treated"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span
              className="mb-4 inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground"
              style={{ background: 'var(--warm-orange-dark)' }}
            >
              Patient Care
            </span>
            <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
              Care for Children, Adults and Senior Patients
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              The website now explains exactly who the clinic helps. This makes the page more
              trustworthy and helps visitors quickly decide whether to book an appointment.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[2rem] border border-border bg-white p-7 shadow-sm">
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'var(--medical-blue-bg)' }}
              >
                <MessageSquareHeart size={25} className="text-primary" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-foreground">Speech & Voice Concerns</h3>
              <ConditionList items={speechConditions} />
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-7 shadow-sm">
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'oklch(0.97 0.04 55)' }}
              >
                <Ear size={25} style={{ color: 'var(--warm-orange-dark)' }} />
              </div>
              <h3 className="mb-4 text-xl font-bold text-foreground">Hearing Care Concerns</h3>
              <ConditionList items={hearingConditions} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}




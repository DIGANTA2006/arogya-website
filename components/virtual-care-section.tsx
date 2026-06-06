import { CheckCircle2, Laptop, MapPin, ShieldCheck } from 'lucide-react'

const options = [
  {
    icon: MapPin,
    title: 'Physical Clinic Visit',
    text: 'Best for hearing tests, first consultation, detailed evaluation and hearing aid fitting.',
  },
  {
    icon: Laptop,
    title: 'Online Video Consultation',
    text: 'Useful for follow-up, speech therapy guidance, parent counselling and report discussion.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe Care Guidance',
    text: 'The clinic can suggest a physical visit whenever online consultation is not suitable.',
  },
]

export default function VirtualCareSection() {
  return (
    <section className="bg-white py-20 lg:py-28" aria-label="Virtual and physical care options">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            Hybrid Care Model
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Choose clinic visit or virtual consultation
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Patients can book a physical clinic visit or request online support for selected services. This expands the clinic beyond nearby visitors.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {options.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-[2rem] border border-border bg-card p-7 shadow-sm">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-7 flex items-start gap-3 rounded-[1.5rem] border border-orange-200 bg-orange-50 p-5 text-sm leading-relaxed text-orange-800">
          <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" />
          <p>
            <strong>Important:</strong> Online consultation is not for emergency cases. The clinic may recommend a physical visit when required.
          </p>
        </div>
      </div>
    </section>
  )
}




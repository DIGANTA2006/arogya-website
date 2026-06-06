import {
  MessageCircle,
  Ear,
  Bluetooth,
  Baby,
  Mic2,
  Activity,
} from "lucide-react"

const services = [
  {
    icon: MessageCircle,
    title: "Speech Therapy",
    description:
      "Comprehensive evaluation and treatment for speech sound disorders, fluency, and articulation problems in children and adults.",
    color: "var(--medical-blue)",
    bg: "var(--medical-blue-bg)",
  },
  {
    icon: Ear,
    title: "Hearing Aid Consultation",
    description:
      "Expert guidance on selecting the best hearing aid suited to your hearing loss level, lifestyle, and budget.",
    color: "var(--warm-orange-dark)",
    bg: "oklch(0.97 0.04 55)",
  },
  {
    icon: Bluetooth,
    title: "Digital & Bluetooth Hearing Aids",
    description:
      "Supply and fitting of advanced digital and Bluetooth-enabled hearing aids from leading brands for crystal-clear sound.",
    color: "var(--medical-blue)",
    bg: "var(--medical-blue-bg)",
  },
  {
    icon: Baby,
    title: "Child Speech Development",
    description:
      "Early intervention programs to help children develop language skills, overcome speech delays, and communicate confidently.",
    color: "var(--warm-orange-dark)",
    bg: "oklch(0.97 0.04 55)",
  },
  {
    icon: Mic2,
    title: "Voice Therapy",
    description:
      "Specialized treatment for voice disorders including hoarseness, vocal nodules, and professional voice rehabilitation.",
    color: "var(--medical-blue)",
    bg: "var(--medical-blue-bg)",
  },
  {
    icon: Activity,
    title: "Audiometry Testing",
    description:
      "Accurate diagnostic hearing tests using modern audiometry equipment to assess the type and degree of hearing loss.",
    color: "var(--warm-orange-dark)",
    bg: "oklch(0.97 0.04 55)",
  },
]

export default function ServicesSection() {
  return (
    <section
      id="services"
      className="py-20 lg:py-28 bg-white"
      aria-label="Our services"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary-foreground mb-3"
            style={{ background: 'var(--medical-blue)' }}
          >
            What We Offer
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Our Specialized Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            We provide a full range of speech therapy and hearing care services, designed to improve
            quality of life through evidence-based, personalized treatment.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.title}
                className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: service.bg }}
                >
                  <Icon size={22} style={{ color: service.color }} />
                </div>
                <h3
                  className="text-base font-bold text-foreground mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}




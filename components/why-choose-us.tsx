import { ShieldCheck, Cpu, Heart, IndianRupee, Smile } from "lucide-react"

const reasons = [
  {
    icon: ShieldCheck,
    title: "Experienced Doctor",
    description:
      "Clinic Specialist brings years of specialized clinical experience in speech therapy and audiology, ensuring accurate diagnosis and effective treatment.",
  },
  {
    icon: Cpu,
    title: "Modern Equipment",
    description:
      "Our clinic is equipped with state-of-the-art audiometry and diagnostic tools for precise hearing and speech evaluations.",
  },
  {
    icon: Heart,
    title: "Personalized Care",
    description:
      "Every patient receives a customized treatment plan designed around their specific needs, age, and therapy goals.",
  },
  {
    icon: IndianRupee,
    title: "Affordable Treatment",
    description:
      "High-quality speech and hearing care at transparent, affordable prices — making expert treatment accessible to all.",
  },
  {
    icon: Smile,
    title: "Friendly Environment",
    description:
      "Our warm and welcoming clinic atmosphere helps patients feel comfortable and confident throughout their treatment journey.",
  },
]

export default function WhyChooseUs() {
  return (
    <section
      className="py-20 lg:py-28"
      style={{ background: 'var(--section-bg)' }}
      aria-label="Why choose us"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary-foreground mb-3"
            style={{ background: 'var(--warm-orange-dark)' }}
          >
            Why Arogya
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Why Choose Us?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            We are committed to delivering the highest standard of care with compassion, expertise,
            and modern technology.
          </p>
        </div>

        {/* Reasons */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon
            const isAccent = index % 2 === 1
            return (
              <div
                key={reason.title}
                className={`group rounded-2xl p-6 text-center border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  isAccent
                    ? "text-white"
                    : "bg-white border-border text-foreground"
                }`}
                style={
                  isAccent
                    ? { background: 'var(--medical-blue)', borderColor: 'transparent' }
                    : {}
                }
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110 ${
                    isAccent ? "bg-white/20" : ""
                  }`}
                  style={!isAccent ? { background: 'var(--medical-blue-bg)' } : {}}
                >
                  <Icon
                    size={24}
                    style={{ color: isAccent ? "white" : 'var(--medical-blue)' }}
                  />
                </div>
                <h3
                  className={`text-sm font-bold mb-2 ${isAccent ? "text-white" : "text-foreground"}`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {reason.title}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isAccent ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  {reason.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}




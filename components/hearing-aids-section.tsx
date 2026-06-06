import Image from "next/image"
import { Bluetooth, BatteryCharging, Volume2, Wifi } from "lucide-react"

const hearingAids = [
  {
    title: "Digital Hearing Aids",
    icon: Volume2,
    description:
      "Advanced digital signal processing for clear, natural sound. Available in behind-the-ear (BTE) and in-the-ear (ITE) styles, precisely fitted to your hearing loss profile.",
    features: ["Crystal-clear sound quality", "Noise reduction technology", "Multiple listening programs", "Comfortable all-day wear"],
  },
  {
    title: "Rechargeable Hearing Aids",
    icon: BatteryCharging,
    description:
      "Convenient rechargeable models that eliminate the hassle of tiny batteries. A single overnight charge provides a full day of hearing support.",
    features: ["Up to 24-hour battery life", "Easy USB-C charging", "No battery replacements needed", "Eco-friendly design"],
  },
  {
    title: "Bluetooth Hearing Aids",
    icon: Bluetooth,
    description:
      "Smart Bluetooth-enabled hearing aids that connect wirelessly to your smartphone, TV, and other devices for seamless audio streaming.",
    features: ["Direct phone call streaming", "TV & music connectivity", "App-controlled settings", "Remote fine-tuning"],
  },
]

export default function HearingAidsSection() {
  return (
    <section
      id="hearing-aids"
      className="py-20 lg:py-28 bg-white"
      aria-label="Hearing aids showcase"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary-foreground mb-3"
            style={{ background: 'var(--medical-blue)' }}
          >
            Hearing Solutions
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Advanced Hearing Aid Range
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            We offer the latest hearing technology from trusted brands. Our audiologist will help
            you find the perfect hearing aid for your lifestyle and budget.
          </p>
        </div>

        {/* Image + Cards layout */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Image */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-square">
              <Image
                src="/images/hearing-aids.jpg"
                alt="Modern digital and Bluetooth hearing aids available at Arogya Speech Therapy"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-5" style={{ background: 'linear-gradient(to top, oklch(0.42 0.18 245 / 0.9), transparent)' }}>
                <div className="flex items-center gap-2">
                  <Wifi size={18} className="text-white" />
                  <span className="text-white text-sm font-semibold">Latest Technology Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {hearingAids.map((aid) => {
              const Icon = aid.icon
              return (
                <div
                  key={aid.title}
                  className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'var(--medical-blue-bg)' }}
                    >
                      <Icon size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-base font-bold text-foreground mb-1"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {aid.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {aid.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aid.features.map((f) => (
                          <span
                            key={f}
                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{
                              background: 'var(--medical-blue-bg)',
                              color: 'var(--medical-blue)',
                            }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}




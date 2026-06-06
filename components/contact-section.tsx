import { MapPin, Phone, Clock, Mail } from "lucide-react"

const workingHours = [
  { day: "Monday – Saturday", time: "11:00 AM – 8:00 PM" },
  { day: "Sunday", time: "By Appointment Only" },
]

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="py-20 lg:py-28 bg-white"
      aria-label="Contact and location"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary-foreground mb-3"
            style={{ background: 'var(--medical-blue)' }}
          >
            Find Us
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Contact &amp; Location
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            Visit us in Vidisha or reach out by phone. We are here to help you and your family.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Info Cards */}
          <div className="flex flex-col gap-5">
            {/* Address */}
            <div className="bg-card border border-border rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--medical-blue-bg)' }}
              >
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  Clinic Address
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  2nd floor, Opposite Devi ka Bagh, near Dagar Gaire,<br />
                  Sanchi Road, Vidisha, PIN 464001
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-card border border-border rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'oklch(0.97 0.04 55)' }}
              >
                <Phone size={20} style={{ color: 'var(--warm-orange-dark)' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  Phone Numbers
                </h3>
                <a
                  href="tel:9755018656"
                  className="block text-sm font-medium hover:text-primary transition-colors"
                  style={{ color: 'var(--medical-blue)' }}
                >
                  9755018656
                </a>
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-card border border-border rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--medical-blue-bg)' }}
              >
                <Clock size={20} className="text-primary" />
              </div>
              <div className="w-full">
                <h3 className="text-sm font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  Working Hours
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {workingHours.map((h) => (
                      <tr key={h.day} className="border-b border-border last:border-0">
                        <td className="py-1.5 text-foreground/80 font-medium pr-4">{h.day}</td>
                        <td className="py-1.5 text-muted-foreground text-right">{h.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Google Maps Embed */}
          <div className="rounded-2xl overflow-hidden border border-border shadow-lg h-96 lg:h-auto min-h-80">
            <iframe
              title="Arogya Speech Therapy & Hearing Care Location"
              src="https://www.Google.com/maps/embed?pb=!1m18!1m12!1m3!1d3654.2!2d77.8165!3d23.5251!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c182e3e3f3f3f%3A0x7f5c3d3e3f3f3f3f!2sVidisha%2C%20Madhya%20Pradesh!5e0!3m2!1sen!2sin!4v1690000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '320px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  )
}




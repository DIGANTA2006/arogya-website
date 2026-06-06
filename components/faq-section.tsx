import { HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'Do I need an appointment before visiting?',
    answer:
      'An appointment is recommended so the clinic can keep enough time for assessment, counselling, and treatment guidance.',
  },
  {
    question: 'Do you provide therapy for children?',
    answer:
      'Yes. The clinic supports child speech delay, language development, unclear speech, and communication difficulties with family guidance.',
  },
  {
    question: 'Can I get a hearing aid consultation?',
    answer:
      'Yes. The clinic provides hearing assessment, hearing aid selection guidance, fitting support, and follow-up counselling.',
  },
  {
    question: 'How fast will the clinic respond after form submission?',
    answer:
      'The clinic team should contact the patient by phone or WhatsApp to confirm the appointment slot. For urgent booking, calling is best.',
  },
]

export default function FaqSection() {
  return (
    <section className="bg-white py-20 lg:py-28" aria-label="Frequently asked questions">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span
            className="mb-3 inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground"
            style={{ background: 'var(--medical-blue)' }}
          >
            FAQ
          </span>
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Common Questions Before Booking
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Clear answers reduce hesitation and help visitors feel confident before contacting the
            clinic.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex gap-4">
                <div
                  className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'var(--medical-blue-bg)' }}
                >
                  <HelpCircle size={19} className="text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-bold text-foreground">{faq.question}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}




export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-16">
      <article className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-bold text-primary hover:underline">← Back to website</a>
        <h1 className="mt-8 text-4xl font-extrabold text-foreground">Terms & Medical Disclaimer</h1>
        <p className="mt-4 text-muted-foreground">Last updated: 1 June 2026</p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>This website provides clinic information and appointment support. It does not provide medical diagnosis, emergency advice or guaranteed treatment outcome.</p>
          <p>Online consultation is suitable only for selected follow-up or guidance cases. The clinic may recommend a physical visit when required.</p>
          <p>For emergency or serious medical problems, patients should visit the nearest hospital immediately.</p>
          <p>Appointment requests are subject to clinic confirmation by call, WhatsApp or email.</p>
        </div>
      </article>
    </main>
  )
}




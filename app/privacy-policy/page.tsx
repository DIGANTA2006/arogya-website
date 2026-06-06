export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-16">
      <article className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-bold text-primary hover:underline">← Back to website</a>
        <h1 className="mt-8 text-4xl font-extrabold text-foreground">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: 1 June 2026</p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>This website collects appointment details such as name, phone number, email, service, preferred date/time and message only for appointment confirmation and clinic communication.</p>
          <p>Appointment details are accessible to authorized clinic staff through the admin portal. Do not submit emergency or highly sensitive information through the website form.</p>
          <p>For production use, appointment records should be stored in a secure cloud database such as Supabase and protected with strong passwords and role-based access.</p>
          <p>Patients may contact the clinic to correct or remove their submitted appointment information.</p>
        </div>
      </article>
    </main>
  )
}




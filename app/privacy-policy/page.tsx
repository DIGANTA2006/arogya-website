export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-white p-6 shadow-sm md:p-10">
        <a href="/" className="text-sm font-bold text-primary">
          ← Back to Home
        </a>

        <h1 className="mt-6 text-4xl font-black text-foreground">
          Privacy Policy
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: 15 June 2026
        </p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-black text-foreground">
              1. Purpose of this policy
            </h2>
            <p className="mt-2">
              Arogya Speech Therapy & Hearing Care collects patient information only for clinic-related purposes such as appointment booking, patient account creation, mobile OTP verification, prescription/report access, therapy reminders, and clinic communication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              2. Information we collect
            </h2>
            <p className="mt-2">
              We may collect patient name, age, mobile number, email address, appointment details, selected service, messages submitted through the website, uploaded prescriptions/reports, and login/security information needed to protect the patient portal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              3. How we use information
            </h2>
            <p className="mt-2">
              Patient information is used to manage appointments, verify mobile numbers, send appointment confirmations or reminders, provide secure access to prescriptions/reports, respond to patient requests, and maintain clinic records.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              4. Consent
            </h2>
            <p className="mt-2">
              During registration, patients must accept the consent notice and this Privacy Policy before creating an account. Patients should provide accurate information and should not register using another person&apos;s email or mobile number.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              5. Storage and security
            </h2>
            <p className="mt-2">
              The website uses secure authentication cookies, password hashing, protected admin/client routes, and Supabase-based storage for production data. Access to patient information is limited to authorized clinic/admin use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              6. Sharing of information
            </h2>
            <p className="mt-2">
              We do not sell patient information. Data may be processed through trusted service providers used by the website, such as Supabase for database/storage, Resend for email, Twilio for SMS/OTP, and Vercel for website hosting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              7. Patient rights
            </h2>
            <p className="mt-2">
              Patients may request access, correction, or deletion review of their account information. Some medical or clinic records may need to be retained where required for treatment continuity, clinic safety, legal compliance, or dispute prevention.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              8. Account deletion requests
            </h2>
            <p className="mt-2">
              Patients can submit an account deletion request from the patient profile page. The clinic will review the request before deleting or anonymizing account data, especially where prescriptions, reports, or appointment history are involved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              9. Cookies
            </h2>
            <p className="mt-2">
              The portal uses essential cookies for login sessions and security. These cookies are required for protected admin and patient areas to work correctly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              10. Emergency disclaimer
            </h2>
            <p className="mt-2">
              This website is not an emergency medical service. For urgent medical situations, contact local emergency services or visit the nearest hospital immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              11. Contact and grievance request
            </h2>
            <p className="mt-2">
              For privacy, correction, or deletion requests, contact Arogya Speech Therapy & Hearing Care directly through the clinic phone number or the contact details shown on this website.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
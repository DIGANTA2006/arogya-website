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
          Last updated: 16 June 2026
        </p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-black text-foreground">
              1. Purpose of this policy
            </h2>
            <p className="mt-2">
              Arogya Speech Therapy & Hearing Care collects and uses patient information only for clinic-related purposes such as appointment booking, patient account creation, mobile OTP verification, prescription/report access, therapy reminders, UPI payment verification, and clinic communication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              2. Information we collect
            </h2>
            <p className="mt-2">
              We may collect patient name, age, mobile number, email address, appointment details, selected service, messages submitted through the website, uploaded prescriptions/reports, payment reference details, payment proof screenshots/PDFs, login records and security information needed to protect the patient portal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              3. Medical records and uploads
            </h2>
            <p className="mt-2">
              Prescription files, scanned reports, digital prescriptions, QR prescription records and uploaded payment proofs are treated as sensitive clinic records. Access is limited to authorized clinic/admin use and the relevant patient portal wherever applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              4. How we use information
            </h2>
            <p className="mt-2">
              Patient information is used to manage appointments, verify mobile numbers, send appointment confirmations or reminders, provide secure access to prescriptions/reports, process manual UPI payment verification, respond to patient requests, and maintain clinic records.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              5. Consent
            </h2>
            <p className="mt-2">
              During registration, appointment booking or patient portal use, patients consent to the clinic storing and processing their submitted information for clinic service, communication, follow-up care, prescription access and payment verification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              6. Storage and security
            </h2>
            <p className="mt-2">
              The website uses secure authentication cookies, password hashing, protected admin/client routes, private Supabase storage, Row Level Security, server-side file validation and restricted admin access for production data. Access to patient information is limited to authorized clinic/admin use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              7. Payment proof privacy
            </h2>
            <p className="mt-2">
              Payment screenshots or reference details are used only for manual clinic verification. Patients should avoid uploading unrelated personal information in payment proof screenshots when possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              8. Sharing of information
            </h2>
            <p className="mt-2">
              We do not sell patient information. Data may be processed through trusted service providers used by the website, such as Supabase for database/storage, Resend for email, Twilio for OTP/SMS verification, Upstash for rate limiting, and Vercel for website hosting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              9. Data retention and deletion
            </h2>
            <p className="mt-2">
              Clinic records may be retained for follow-up support, legal, operational or medical-record purposes. Patients may contact the clinic to request correction, access or deletion where applicable and where retention is not required for clinic/legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              10. Patient rights
            </h2>
            <p className="mt-2">
              Patients may contact the clinic to update incorrect details, request help with portal access, ask about uploaded records, or request support regarding their stored information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              11. Contact
            </h2>
            <p className="mt-2">
              For privacy, account, appointment, prescription or payment-related support, patients should contact Arogya Speech Therapy & Hearing Care using the official phone, WhatsApp or email details displayed on the website.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
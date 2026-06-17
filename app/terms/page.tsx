export default function TermsPage() {
  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-10">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-white p-6 shadow-sm md:p-10">
        <a href="/" className="text-sm font-bold text-primary hover:underline">
          ← Back to website
        </a>

        <h1 className="mt-8 text-4xl font-black text-foreground">
          Terms, Consent & Medical Disclaimer
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: 16 June 2026
        </p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-xl font-black text-foreground">
              1. Website purpose
            </h2>
            <p className="mt-2">
              This website provides clinic information, appointment booking support, patient portal access, prescription/report download support, payment reference submission and communication support for Arogya Speech Therapy & Hearing Care.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              2. Medical disclaimer
            </h2>
            <p className="mt-2">
              The website does not provide emergency medical service, guaranteed diagnosis, guaranteed treatment outcome, or replacement for direct clinical examination. Speech therapy, hearing-care guidance and online consultation are provided according to clinic assessment and suitability.
            </p>
            <p className="mt-2">
              For emergency or serious medical conditions, patients should immediately contact a nearby hospital, doctor, ambulance or emergency service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              3. Online consultation
            </h2>
            <p className="mt-2">
              Online consultation is suitable only for selected cases, follow-up guidance, counselling or therapy support. The clinic may request a physical visit when required for proper assessment or treatment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              4. Appointment confirmation
            </h2>
            <p className="mt-2">
              Appointment booking requests are subject to clinic confirmation, doctor availability, selected service, and available slots. The clinic may contact patients by phone, email or WhatsApp for confirmation or rescheduling.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              5. Patient consent
            </h2>
            <p className="mt-2">
              By creating an account, booking an appointment or using the patient portal, patients agree that the clinic may store and process their name, age, mobile number, email, appointment details, prescriptions, reports, therapy dates, payment references and follow-up information for clinic service and patient support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              6. Prescription and report access
            </h2>
            <p className="mt-2">
              Prescriptions and reports uploaded to the patient portal are provided for patient convenience. Patients should not modify or misuse uploaded medical documents. If any document appears incorrect, the clinic should be contacted for correction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              7. UPI payment verification
            </h2>
            <p className="mt-2">
              UPI payment submission on this website is manually verified by the clinic. Submitting a transaction reference number or screenshot does not automatically mark payment as paid. Payment is marked paid only after clinic verification from its bank or UPI account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              8. Patient responsibility
            </h2>
            <p className="mt-2">
              Patients are responsible for entering correct personal details, contact information, appointment information and payment references. Patients should not create accounts or submit records using another person&apos;s details without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-foreground">
              9. Changes and support
            </h2>
            <p className="mt-2">
              The clinic may update website features, appointment rules, payment process, privacy policy and terms when required. For support, patients should contact the clinic using the phone, WhatsApp or email details shown on the website.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
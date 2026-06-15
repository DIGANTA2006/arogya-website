const clinicAddress =
  "Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road, Vidisha 464001";

const phone = "9755018656";

const mapEmbed =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ||
  "https://www.google.com/maps?q=Arogya%20Speech%20Therapy%20Vidisha%20Sanchi%20Road&output=embed";

const directionsUrl =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ||
  "https://www.google.com/maps/search/?api=1&query=Arogya%20Speech%20Therapy%20Vidisha%20Sanchi%20Road";

export default function ProductionTrustSections() {
  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-border bg-secondary/40 p-6 shadow-sm md:p-8">
          <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
            Doctor & Clinic Trust
          </p>

          <h2 className="mt-3 text-3xl font-black text-foreground md:text-4xl">
            Care led by Dr. Shilpi Roy
          </h2>

          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Arogya Speech Therapy & Hearing Care provides speech therapy, hearing care, consultation, follow-up support, patient portal access, and secure prescription/report downloads.
          </p>

          <div className="mt-6 grid gap-3 text-sm">
            <div className="rounded-2xl bg-white p-4">
              <strong className="text-foreground">Special Focus:</strong>{" "}
              Speech therapy, hearing care, child communication support, hearing aid guidance, and follow-up care.
            </div>

            <div className="rounded-2xl bg-white p-4">
              <strong className="text-foreground">Clinic System:</strong>{" "}
              QR-based prescription sheets, secure patient dashboard, OTP verification, reminders, and admin-managed reports.
            </div>

            <div className="rounded-2xl bg-white p-4">
              <strong className="text-foreground">Credential Note:</strong>{" "}
              Add verified qualification and registration number here after the clinic confirms the exact details.
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="tel:9755018656"
              className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
            >
              Call Clinic
            </a>

            <a
              href={`https://wa.me/91${phone}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
            >
              WhatsApp
            </a>
          </div>
        </article>

        <article className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm">
          <div className="p-6 md:p-8">
            <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
              Clinic Location
            </p>

            <h2 className="mt-3 text-3xl font-black text-foreground md:text-4xl">
              Visit us in Vidisha
            </h2>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {clinicAddress}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
              >
                Get Directions
              </a>

              <a
                href="tel:9755018656"
                className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
              >
                9755018656
              </a>
            </div>
          </div>

          <iframe
            src={mapEmbed}
            title="Arogya Speech Therapy Vidisha location map"
            className="h-[360px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </article>
      </div>
    </section>
  );
}
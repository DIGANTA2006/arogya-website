"use client";

const galleryItems = [
  {
    title: "Clinic Environment",
    subtitle: "Comfortable and patient-friendly care space",
    image: "/gallery/clinic-1.jpg",
  },
  {
    title: "Therapy Session",
    subtitle: "Speech therapy support for children and adults",
    image: "/gallery/therapy-1.jpg",
  },
  {
    title: "Hearing Care",
    subtitle: "Audiology and hearing aid consultation support",
    image: "/gallery/hearing-aid-1.jpg",
  },
  {
    title: "Patient Care",
    subtitle: "Guided treatment and follow-up support",
    image: "/gallery/patients-care-1.jpg",
  },
  {
    title: "Clinic Area",
    subtitle: "Arogya Speech Therapy & Hearing Care",
    image: "/gallery/clinic-2.jpg",
  },
  {
    title: "Awareness Camp",
    subtitle: "Speech and hearing care awareness activities",
    image: "/gallery/camp-1.jpg",
  },
];

export default function GallerySection() {
  return (
    <section id="gallery" className="gallery-section">
      <div className="gallery-container">
        <div className="gallery-heading">
          <span>Clinic Gallery</span>
          <h2>Moments from our clinic</h2>
          <p>
            View clinic photos, therapy moments, hearing care support, and patient-friendly facilities.
          </p>
        </div>

        <div className="gallery-grid">
          {galleryItems.map((item) => (
            <article key={item.title} className="gallery-card">
              <div className="gallery-image-wrap">
                <img
                  src={item.image}
                  alt={item.title}
                  onError={(event) => {
                    event.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>

              <div className="gallery-card-content">
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .gallery-section {
          background:
            radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 30%),
            linear-gradient(135deg, #f8fbff 0%, #eef8ff 48%, #f8fafc 100%);
          padding: 92px 0;
        }

        .gallery-container {
          width: min(1180px, calc(100% - 36px));
          margin: 0 auto;
        }

        .gallery-heading {
          text-align: center;
          max-width: 760px;
          margin: 0 auto 42px;
        }

        .gallery-heading span {
          display: inline-flex;
          border-radius: 999px;
          padding: 8px 15px;
          background: #dff3ff;
          color: #0057b8;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .gallery-heading h2 {
          margin: 18px 0 14px;
          font-size: clamp(38px, 6vw, 64px);
          letter-spacing: -1.4px;
          color: #0f172a;
        }

        .gallery-heading p {
          color: #64748b;
          font-size: 18px;
          line-height: 1.8;
          margin: 0;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        .gallery-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #dbeafe;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .gallery-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12);
        }

        .gallery-image-wrap {
          height: 240px;
          background: #e0f2fe;
          overflow: hidden;
        }

        .gallery-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .gallery-card-content {
          padding: 22px;
        }

        .gallery-card-content h3 {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 22px;
        }

        .gallery-card-content p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
          font-weight: 650;
        }

        @media (max-width: 900px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 620px) {
          .gallery-section {
            padding: 64px 0;
          }

          .gallery-container {
            width: min(100% - 24px, 1180px);
          }

          .gallery-grid {
            grid-template-columns: 1fr;
          }

          .gallery-image-wrap {
            height: 220px;
          }
        }
      `}</style>
    </section>
  );
}
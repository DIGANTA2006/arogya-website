import ReviewPopup from "@/components/review-popup";
import ChatPositionFix from "@/components/chat-position-fix";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://arogya-website-five.vercel.app"),
  title: {
    default: "Arogya Speech Therapy & Hearing Care | Speech Therapy & Hearing Clinic in Vidisha",
    template: "%s | Arogya Speech Therapy & Hearing Care",
  },
  description:
    "Arogya Speech Therapy & Hearing Care in Vidisha provides speech therapy, hearing tests, hearing aid consultation, online consultation and patient appointment support.",
  keywords: [
    "speech therapy in Vidisha",
    "hearing clinic in Vidisha",
    "hearing test Vidisha",
    "speech therapist Vidisha",
    "hearing aid clinic Vidisha",
    "Arogya Speech Therapy",
    "Arogya Hearing Care",
  ],
  openGraph: {
    title: "Arogya Speech Therapy & Hearing Care",
    description:
      "Speech therapy, hearing test and hearing care clinic in Vidisha.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://arogya-website-five.vercel.app",
    siteName: "Arogya Speech Therapy & Hearing Care",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arogya Speech Therapy & Hearing Care",
    description:
      "Speech therapy and hearing care clinic in Vidisha.",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://arogya-website-five.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: "Arogya Speech Therapy & Hearing Care",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://arogya-website-five.vercel.app",
    telephone: "9755018656",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "2nd floor, Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road",
      addressLocality: "Vidisha",
      postalCode: "464001",
      addressCountry: "IN",
    },
    medicalSpecialty: [
      "Speech Therapy",
      "Audiology",
      "Hearing Care",
    ],
    openingHours: "Mo-Sa 11:00-20:00",
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {children}
<ReviewPopup />
        <ChatPositionFix />
      </body>
    </html>
  );
}

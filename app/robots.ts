import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/client/dashboard",
        "/api/",
      ],
    },
    sitemap: "https://arogya-website-five.vercel.app/sitemap.xml",
  };
}

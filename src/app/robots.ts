import type { MetadataRoute } from "next";

import { env } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/employee/",
        "/recruitment/",
        "/my-applications",
        "/apply/",
      ],
    },
    sitemap: new URL("/sitemap.xml", env.APP_URL).toString(),
    host: new URL(env.APP_URL).origin,
  };
}

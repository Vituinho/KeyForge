import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/siteUrl"

export default function robots(): MetadataRoute.Robots {
  const url = siteUrl()
  return { rules: { userAgent: "*", allow: "/", disallow: ["/game", "/battle", "/academy", "/training", "/multiplayer", "/profile", "/statistics", "/locker", "/anime-world"] },
    ...(url ? { sitemap: new URL("/sitemap.xml", url).href } : {}) }
}

import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/siteUrl"

export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl()
  return url ? [{ url: url.href, changeFrequency: "monthly", priority: 1 }] : []
}

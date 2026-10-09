export function siteUrl(): URL | undefined {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "")
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return undefined
    return new URL(url.origin)
  } catch { return undefined }
}

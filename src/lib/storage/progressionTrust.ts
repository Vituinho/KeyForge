/** Local saves are personal/unverified. Account scoping is isolation, never authorization. */
export function scopedStorageKey(base: string): string {
  if (typeof window === "undefined") return base
  try {
    const user = JSON.parse(localStorage.getItem("keyforge_auth_user") ?? "null")
    return user?.id && !user.isGuest ? `${base}:account:${user.id}` : base
  } catch { return base }
}

/** Retain the original local snapshot before replacing a display cache with verified data. */
export function preserveLegacyLocal(base: string, raw: string | null): void {
  if (typeof window === "undefined" || !raw) return
  const key = `${scopedStorageKey(base)}:legacy-unverified`
  if (!localStorage.getItem(key)) localStorage.setItem(key, raw)
}

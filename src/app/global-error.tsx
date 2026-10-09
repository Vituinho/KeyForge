"use client"

import { en } from "@/locales/en"
import { ptBR } from "@/locales/pt-BR"

// This boundary replaces the root layout, so it cannot depend on its providers.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="en"><body style={{ background: "#0c0d10", color: "#fafafa", fontFamily: "system-ui", margin: 0 }}>
    <main style={{ maxWidth: 600, margin: "12vh auto", padding: 24 }}>
      <title>KeyForge — Recovery</title>
      <h1>KeyForge</h1>
      <p>{en.release.errorDescription}</p>
      <p lang="pt-BR">{ptBR.release.errorDescription}</p>
      <button onClick={retry} style={{ background: "#f59e0b", color: "#111", border: 0, padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontSize: 16 }}>{en.release.retry} / {ptBR.release.retry}</button>
    </main>
  </body></html>
}

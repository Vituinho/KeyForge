import { ImageResponse } from "next/og"

export const alt = "KeyForge — Typing, training and battles / Digitação, treino e batalhas"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export default function Image() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "90px", background: "#101115", color: "#f4f4f5", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", color: "#fb923c", fontSize: 26, letterSpacing: 8, marginBottom: 35 }}>KEYFORGE</div>
    <div style={{ display: "flex", fontSize: 74, fontWeight: 800 }}>Forge your speed.</div>
    <div style={{ display: "flex", fontSize: 74, fontWeight: 800, color: "#fdba74" }}>Master every key.</div>
    <div style={{ display: "flex", fontSize: 26, color: "#a5a7b1", marginTop: 40 }}>Typing · Training · Battles / Digitação · Treino · Batalhas</div>
  </div>, size)
}

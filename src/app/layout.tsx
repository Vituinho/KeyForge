import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { I18nProvider } from "@/lib/i18n/i18nContext"
import { AuthProvider } from "@/lib/auth/authContext"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "KeyForge — Anime RPG Typing Battle Experience",
    template: "%s | KeyForge",
  },
  description:
    "Master your keyboard and conquer anime worlds. Face iconic shinobi in real-time typing battles with RPG progression, touch typing academy, and telemetry.",
  keywords: [
    "KeyForge",
    "typing game",
    "touch typing",
    "anime RPG",
    "monkeytype",
    "speed typing",
    "Naruto typing battle",
    "jogo de digitação",
    "anime typing",
  ],
  authors: [{ name: "KeyForge Team" }],
  openGraph: {
    title: "KeyForge — Anime RPG Typing Battle Experience",
    description:
      "Master your keyboard and conquer anime worlds. Face iconic shinobi in real-time typing battles with RPG progression.",
    type: "website",
    siteName: "KeyForge",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "KeyForge — Anime RPG Typing Battle Experience",
    description:
      "Master your keyboard and conquer anime worlds. Face iconic shinobi in real-time typing battles with RPG progression.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-white`}
      >
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}

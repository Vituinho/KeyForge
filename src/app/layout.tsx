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
  title: "KeyForge — Type. Fight. Evolve.",
  description:
    "Master your keyboard. Defeat the strongest anime characters.",
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

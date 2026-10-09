import type { Metadata } from "next"
import { siteUrl } from "@/lib/siteUrl"
import { Geist, Geist_Mono } from "next/font/google"
import { I18nProvider } from "@/lib/i18n/i18nContext"
import { AuthProvider } from "@/lib/auth/authContext"
import { MigrationSyncManager } from "@/components/progression/MigrationSyncManager"
import { AppShell } from "@/components/common/AppShell"
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
  metadataBase: siteUrl(),
  title: { default: "KeyForge — Typing, Training & Battles", template: "%s | KeyForge" },
  description: "Improve your typing through battles, adaptive Academy training and real progression. Practice with ABNT2 or ANSI keyboards and compete in live PvP.",
  applicationName: "KeyForge",
  keywords: ["KeyForge", "typing game", "touch typing", "adaptive training", "jogo de digitação", "ABNT2", "ANSI"],
  openGraph: { title: "KeyForge — Forge your speed. Master every key.", description: "Typing battles, adaptive training and progression.", type: "website", siteName: "KeyForge", locale: "en_US", alternateLocale: ["pt_BR"] },
  twitter: { card: "summary_large_image", title: "KeyForge — Typing, Training & Battles" },
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
          <AuthProvider>
            <MigrationSyncManager />
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}

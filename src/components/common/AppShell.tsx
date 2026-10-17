"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { memo } from "react"
import { MotionConfig } from "framer-motion"
import { Swords, Menu } from "lucide-react"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { useAuth } from "@/lib/auth/authContext"
import { useI18n } from "@/lib/i18n/i18nContext"

const Navigation = memo(function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  if (["/", "/login", "/register", "/battle", "/multiplayer/arena", "/multiplayer/demo"].includes(pathname)) return null
  const links = [
    ["/game", "common.dashboard"], ["/academy", "nav.academy"], ["/training", "nav.training"],
    ["/anime-world", "nav.animeWorlds"], ["/multiplayer", "release.pvp"],
    ["/statistics", "nav.statistics"], ["/locker", "nav.locker"],
  ]
  const navLinks = links.map(([href, label]) => <Link key={href} href={href}
    onClick={event => event.currentTarget.closest("details")?.removeAttribute("open")}
    aria-current={pathname === href || pathname.startsWith(href + "/") ? "page" : undefined}
    className="kf-nav-link">{t(label)}</Link>)
  return <header className="kf-app-header">
    <a href="#app-main" className="kf-skip">{t("release.skip")}</a>
    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
      <Link href="/game" className="flex shrink-0 items-center gap-1.5 font-black tracking-wide text-orange-300"><Swords size={19} /><span>KEYFORGE</span></Link>
      <nav aria-label={t("release.navigation")} className="hidden xl:flex items-center gap-1">{navLinks}</nav>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <details className="relative xl:hidden" onKeyDown={event => {
          if (event.key === "Escape") {
            event.currentTarget.removeAttribute("open")
            event.currentTarget.querySelector("summary")?.focus()
          }
        }}>
          <summary className="list-none rounded-lg p-2 border border-white/10 cursor-pointer" aria-label={t("nav.toggleMenu")}><Menu size={20} /></summary>
          <nav aria-label={t("release.navigation")} className="absolute right-0 top-full mt-3 w-60 max-h-[75dvh] overflow-y-auto z-50 p-2 rounded-xl border border-white/15 bg-neutral-950 shadow-xl flex flex-col">{navLinks}<Link href={user.isGuest ? "/login" : "/profile"} className="kf-nav-link sm:hidden">{t(user.isGuest ? "common.login" : "nav.profile")}</Link>{!user.isGuest && <button type="button" className="kf-nav-link text-left" onClick={logout}>{t("release.signOut")}</button>}</nav>
        </details>
        <Link href={user.isGuest ? "/login" : "/profile"} title={user.isGuest ? undefined : user.username} className="hidden sm:flex kf-nav-link max-w-32 truncate">{user.isGuest ? t("common.login") : user.username}</Link>
        {!user.isGuest && <button type="button" onClick={logout} className="hidden sm:block kf-nav-link">{t("release.signOut")}</button>}
      </div>
    </div>
  </header>
})

export function AppShell({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user"><Navigation /><div id="app-main" tabIndex={-1}>{children}</div></MotionConfig>
}

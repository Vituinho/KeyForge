"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/i18nContext"

export default function NotFound() {
  const { t } = useI18n()
  return <main className="max-w-xl mx-auto px-5 py-24 space-y-5 text-center"><p className="kf-eyebrow">404 · KEYFORGE</p><h1 className="text-3xl font-bold">{t("release.notFound")}</h1><p className="text-white/60">{t("release.notFoundDescription")}</p><Link className="kf-button kf-button-primary" href="/game">{t("common.dashboard")}</Link><Link className="kf-button ml-2" href="/">{t("common.home")}</Link></main>
}

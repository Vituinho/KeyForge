"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/i18nContext"

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n()
  return <main className="max-w-xl mx-auto px-5 py-24 space-y-5 text-center"><p className="kf-eyebrow">KEYFORGE</p><h1 className="text-3xl font-bold">{t("release.error")}</h1><p className="text-white/60">{t("release.errorDescription")}</p><button type="button" className="kf-button kf-button-primary" onClick={retry}>{t("release.retry")}</button><Link className="kf-button ml-2" href="/game">{t("common.dashboard")}</Link></main>
}

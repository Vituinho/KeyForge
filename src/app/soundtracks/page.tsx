"use client"

import Link from "next/link"
import { useMemo, useState, type MouseEvent } from "react"
import { ArrowLeft, ArrowUpRight, Headphones, Music2, Search } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"
import { filterSoundtracks, SOUNDTRACK_DISCOVERY, SOUNDTRACK_SERIES, SPOTIFY_PLAYLIST, type DiscoveryFilter } from "@/lib/audio/soundtrackDiscovery"
import { openSpotifyWindow } from "@/lib/audio/spotifyWindow"

export default function SoundtracksPage() {
  const { t } = useI18n()
  const [query, setQuery] = useState("")
  const [series, setSeries] = useState("")
  const [filter, setFilter] = useState<DiscoveryFilter>("all")
  const [separateWindow, setSeparateWindow] = useState(false)
  const openReference = (event: MouseEvent<HTMLAnchorElement>) => {
    if (separateWindow && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0
      && openSpotifyWindow(event.currentTarget.href)) event.preventDefault()
  }
  const results = useMemo(() => filterSoundtracks(query, series, filter), [query, series, filter])
  const linked = SOUNDTRACK_DISCOVERY.filter(entry => entry.spotify).length
  const reset = () => { setQuery(""); setSeries(""); setFilter("all") }
  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
    <Link href="/game" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/65 hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-orange-300"><ArrowLeft size={16} aria-hidden="true" />{t("common.dashboard")}</Link>
    <header className="relative mt-4 overflow-hidden rounded-2xl border border-orange-300/15 bg-gradient-to-br from-orange-400/10 via-[#14161b] to-[#101115] p-5 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="hidden rounded-2xl bg-orange-400/15 p-3 text-orange-300 sm:block"><Headphones size={28} aria-hidden="true" /></span>
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-300">{t("soundtracks.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t("soundtracks.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">{t("soundtracks.subtitle")}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm"><p><strong className="mr-1 text-orange-300">56</strong>{t("soundtracks.encounters")}</p><p><strong className="mr-1 text-green-300">{linked}</strong>{t("soundtracks.verifiedLinks")}</p><p><strong className="mr-1 text-white">8</strong>{t("soundtracks.originals")}</p></div>
    </header>

    <aside className="my-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.025] p-4 text-sm leading-relaxed text-white/65">
      <Music2 size={19} className="mt-1 shrink-0 text-orange-300" aria-hidden="true" /><p><strong className="text-white/90">{t("soundtracks.separateTitle")}</strong> {t("soundtracks.separateBody")}</p>
    </aside>

    <div className="mb-5 space-y-3">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-white/80"><input type="checkbox" checked={separateWindow} onChange={event => setSeparateWindow(event.target.checked)} aria-describedby="spotify-window-hint" className="size-5 shrink-0 accent-orange-400" />{t("soundtracks.separateWindow")}</label>
      <p id="spotify-window-hint" className="text-xs leading-relaxed text-white/55">{t("soundtracks.windowHint")}</p>
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><p className="text-xs text-orange-300">{t("soundtracks.playlist")}</p><h2 className="mt-1 break-words text-sm font-bold">{SPOTIFY_PLAYLIST.title}</h2><p className="mt-1 text-xs text-white/55">{SPOTIFY_PLAYLIST.curator}</p></div>
        <a href={SPOTIFY_PLAYLIST.url} onClick={openReference} target="_blank" rel="noopener noreferrer" aria-label={`${t("soundtracks.open")} — ${SPOTIFY_PLAYLIST.title} (${t(separateWindow ? "soundtracks.windowDestination" : "soundtracks.newTab")})`} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-green-300/40 px-4 py-3 text-sm font-bold text-green-300 hover:bg-green-300/10 focus-visible:outline-2 focus-visible:outline-green-300">{t("soundtracks.open")}<ArrowUpRight size={17} aria-hidden="true" /></a>
      </div>
    </div>

    <section aria-label={t("soundtracks.filters")} className="mb-6 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)]">
        <div><label htmlFor="soundtrack-search" className="mb-1.5 block text-xs font-semibold text-white/65">{t("soundtracks.search")}</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 text-white/40" size={17} aria-hidden="true" /><input id="soundtrack-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("soundtracks.searchPlaceholder")} className="min-h-11 w-full rounded-xl border border-white/15 bg-[#14161b] py-3 pl-10 pr-3 text-sm outline-none focus:border-orange-300" /></div></div>
        <div><label htmlFor="soundtrack-series" className="mb-1.5 block text-xs font-semibold text-white/65">{t("soundtracks.anime")}</label><select id="soundtrack-series" value={series} onChange={event => setSeries(event.target.value)} className="min-h-11 w-full rounded-xl border border-white/15 bg-[#14161b] p-3 text-sm outline-none focus:border-orange-300"><option value="">{t("soundtracks.allSeries")}</option>{SOUNDTRACK_SERIES.map(name => <option key={name}>{name}</option>)}</select></div>
      </div>
      <div className="flex flex-wrap gap-2">{(["all", "linked", "pending", "original"] as const).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-orange-300 ${filter === value ? "border-orange-300/40 bg-orange-400/15 text-orange-200" : "border-white/10 text-white/65 hover:bg-white/5"}`}>{t(`soundtracks.filter_${value}`)}</button>)}</div>
    </section>

    <p role="status" className="mb-4 text-sm text-white/55">{t("soundtracks.showing", { count: results.length, total: 56 })}</p>
    {results.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><h2 className="font-bold">{t("soundtracks.empty")}</h2><p className="my-3 text-sm text-white/60">{t("soundtracks.emptyHint")}</p><button type="button" onClick={reset} className="min-h-11 rounded-xl bg-orange-400 px-5 py-2 font-bold text-black">{t("soundtracks.reset")}</button></div>
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map(entry => <article key={entry.enemyId} data-encounter={entry.enemyId} className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-[#14161b] p-5">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-orange-300">{entry.series}</p><h2 className="mt-1 break-words text-lg font-extrabold">{entry.character}</h2></div><Music2 size={18} className="mt-1 shrink-0 text-white/25" aria-hidden="true" /></div>
        <p className="mt-4 break-words text-base font-semibold leading-relaxed" lang={entry.kind !== "original" && /[\u3000-\u9fff]/.test(entry.title ?? "") ? "ja" : undefined}>{entry.kind === "original" ? t("soundtracks.originalTitle") : entry.title ?? t("soundtracks.unknownTitle")}</p>
        {entry.enemyId === "pain" || entry.enemyId === "itachi" ? <p className="text-sm text-white/55">{entry.enemyId === "pain" ? "Girei" : "Senya"}</p> : null}
        <dl className="my-4 space-y-3 break-words text-xs leading-relaxed">
          {entry.spotify && <div><dt className="text-white/45">{t("soundtracks.artist")}</dt><dd className="mt-0.5 text-white/80">{entry.spotify.artists}</dd></div>}
          <div><dt className="text-white/45">{t(entry.status === "unresolved" ? "soundtracks.releaseCredits" : "soundtracks.composer")}</dt><dd className="mt-0.5 text-white/80">{entry.kind === "original" ? t("soundtracks.originalCredit") : entry.composers.join(" · ")}</dd></div>
        </dl>
        {entry.status === "unresolved" && <p className="mb-4 text-xs text-amber-200/80">{t("soundtracks.creditsPending")}</p>}
        <div className="mt-auto border-t border-white/10 pt-4">
          {entry.spotify ? <><p className="mb-3 text-xs text-green-300">{t(entry.spotify.type === "track" ? "soundtracks.verifiedTrack" : "soundtracks.verifiedAlbum")}</p><a href={entry.spotify.url} onClick={openReference} target="_blank" rel="noopener noreferrer" aria-label={`${t("soundtracks.open")} — ${entry.character} (${t(separateWindow ? "soundtracks.windowDestination" : "soundtracks.newTab")})`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1ed760] px-4 py-3 text-center text-sm font-bold text-black transition-colors hover:bg-[#3be477] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-300">{t("soundtracks.open")}<ArrowUpRight size={17} aria-hidden="true" /></a><p className="mt-2 text-xs text-white/45">{t(separateWindow ? "soundtracks.windowDestination" : "soundtracks.newTab")}</p></>
            : <p className="rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-white/55">{t(entry.kind === "original" ? "soundtracks.noAnimeTrack" : "soundtracks.noVerifiedLink")}</p>}
        </div>
      </article>)}</div>}
    <p className="mt-6 text-xs leading-relaxed text-white/45">{t("soundtracks.editorial")}</p>
  </main>
}

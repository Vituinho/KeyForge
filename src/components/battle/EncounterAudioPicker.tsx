"use client"

import { memo, useEffect, useState, useSyncExternalStore } from "react"
import { BATTLE_MUSIC } from "@/lib/audio/battleMusic"
import { localBattleTracks } from "@/lib/audio/localBattleTracks"
import { musicManager } from "@/lib/audio/musicManager"
import { useI18n } from "@/lib/i18n/i18nContext"

export const EncounterAudioPicker = memo(function EncounterAudioPicker({ enemyId }: { enemyId: string }) {
  const { t } = useI18n()
  const [selected, setSelected] = useState(enemyId)
  const [filename, setFilename] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const status = useSyncExternalStore(musicManager.subscribe, musicManager.getStatus, () => "idle")
  useEffect(() => {
    let active = true, revision = 0
    const refresh = () => {
      const request = ++revision
      void localBattleTracks.get(selected).then(track => { if (active && request === revision) setFilename(track?.name ?? null) })
    }
    refresh()
    const unsubscribe = localBattleTracks.subscribe(id => { if (id === selected) refresh() })
    return () => { active = false; unsubscribe() }
  }, [selected])
  return <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
    <label className="block space-y-1">
      <span>{t("release.audio.encounter")}</span>
      <select value={selected} disabled={busy} onChange={event => { setSelected(event.target.value); setNotice("") }} className="w-full rounded bg-neutral-900 p-2 text-white">
        {Object.values(BATTLE_MUSIC).map(track => <option key={track.enemyId} value={track.enemyId}>{track.name}</option>)}
      </select>
    </label>
    <p className="break-words text-white/70">{filename || t("release.audio.noLocalTrack")}</p>
    <label className="block space-y-1">
      <span>{t("release.audio.chooseLocal")}</span>
      <input type="file" accept="audio/*,.mp3,.ogg,.oga,.wav,.m4a,.aac,.flac,.webm,.opus" disabled={busy}
        className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-orange-400/20 file:p-2 file:text-orange-200"
        onChange={async event => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (!file) return
          setBusy(true)
          try { setNotice(await localBattleTracks.assign(selected, file) ? "localSaved" : "localSession") }
          catch (error) { setNotice(error instanceof Error && ["localSize", "localFormat"].includes(error.message) ? error.message : "localFailed") }
          finally { setBusy(false) }
        }} />
    </label>
    {filename && <button type="button" disabled={busy} className="text-orange-300 underline" onClick={async () => {
      setBusy(true)
      try { setNotice(await localBattleTracks.remove(selected) ? "localRemoved" : "localRemoveSession") }
      finally { setBusy(false) }
    }}>{t("release.audio.removeLocal")}</button>}
    <div role="status" className="space-y-1 text-white/60">
      {notice && <p>{t(`release.audio.${notice}`)}</p>}
      <p>{t(`release.audio.status_${status}`)}</p>
    </div>
    <p className="text-white/45">{t("release.audio.localPrivacy")}</p>
  </div>
})

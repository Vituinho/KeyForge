"use client"

import { memo, useSyncExternalStore } from "react"
import { Volume2, VolumeX, SlidersHorizontal } from "lucide-react"
import { getAudioSettings, getServerAudioSettings, saveAudioSettings, subscribeAudioSettings } from "@/lib/audio/audioSettings"
import { useI18n } from "@/lib/i18n/i18nContext"
import { EncounterAudioPicker } from "./EncounterAudioPicker"

export const BattleAudioControls = memo(function BattleAudioControls({ enemyId }: { enemyId: string }) {
  const { t } = useI18n()
  const settings = useSyncExternalStore(subscribeAudioSettings, getAudioSettings, getServerAudioSettings)
  return (
    <div className="flex items-center gap-2 text-white/70">
      <button type="button" className="p-2 rounded-lg hover:bg-white/10" aria-label={t(settings.enabled ? "release.audio.mute" : "release.audio.unmute")} aria-pressed={!settings.enabled}
        onClick={() => saveAudioSettings({ enabled: !settings.enabled })}>
        {settings.enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      <details className="relative">
        <summary className="list-none p-2 rounded-lg cursor-pointer hover:bg-white/10" aria-label={t("release.audio.settings")}><SlidersHorizontal size={18} /></summary>
        <div className="absolute right-0 top-full mt-2 z-40 w-72 max-h-[75vh] overflow-y-auto rounded-xl border border-white/15 bg-neutral-950 shadow-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white">{t("release.audio.settings")}</p>
          {(["masterVolume", "musicVolume", "sfxVolume"] as const).map(key => (
            <label key={key} className="block text-xs space-y-1">
              <span className="flex justify-between"><span>{t(`release.audio.${key}`)}</span><span>{Math.round(settings[key] * 100)}%</span></span>
              <input type="range" aria-label={t(`release.audio.${key}`)} aria-valuetext={`${Math.round(settings[key] * 100)}%`} min="0" max="1" step="0.01" value={settings[key]} className="w-full accent-orange-400"
                onChange={event => saveAudioSettings({ [key]: Number(event.target.value) })} />
            </label>
          ))}
          <p className="text-xs text-white/50">{t("release.audio.availability")}</p>
          <EncounterAudioPicker key={enemyId} enemyId={enemyId} />
        </div>
      </details>
    </div>
  )
})

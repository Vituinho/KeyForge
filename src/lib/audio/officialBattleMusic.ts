import { getBattleMusic, type BattleMusicTrack } from "./battleMusic"

/** Repository-managed clearance, never user input or a streaming-page URL. */
export interface OfficialRecording {
  enemyId: string
  title: string
  composers: readonly string[]
  file: string
  sourceUrl: string
  permissionDocument: string
  sha256: string
  rights: { synchronization: boolean; masterUse: boolean; publicHosting: boolean; commercialUse: boolean }
}

// Intentionally empty: no official master asset or game/hosting grant was supplied.
// Buying/subscribing to an OST does not qualify a recording for this registry.
export const OFFICIAL_RECORDINGS: Readonly<Record<string, OfficialRecording>> = {}

export function isClearedOfficialRecording(recording: OfficialRecording): boolean {
  return !!recording.title.trim() && recording.composers.length > 0
    && /^\/audio\/bgm\/official\/[a-z0-9_-]+\.(mp3|wav|ogg|m4a)$/.test(recording.file)
    && /^docs\/audio-rights\/[a-z0-9_-]+\.md$/.test(recording.permissionDocument)
    && /^https:\/\//.test(recording.sourceUrl)
    && /^[a-f0-9]{64}$/.test(recording.sha256)
    && Object.values(recording.rights).length === 4
    && recording.rights.synchronization === true && recording.rights.masterUse === true
    && recording.rights.publicHosting === true && recording.rights.commercialUse === true
}

/** Existing player still owns looping, fades, autoplay recovery and volume. */
export function selectBattleMusic(enemyId: string, recordings = OFFICIAL_RECORDINGS): {
  primary: BattleMusicTrack | null; fallback: BattleMusicTrack | null
} {
  const original = getBattleMusic(enemyId)
  const official = recordings[enemyId]
  if (!original) return { primary: null, fallback: null }
  if (!official || official.enemyId !== enemyId || !isClearedOfficialRecording(official)) {
    return { primary: original, fallback: null }
  }
  return {
    primary: {
      enemyId, name: official.title, file: official.file, style: original.style,
      available: true, source: official.sourceUrl, license: official.permissionDocument,
      commercialUse: true, attribution: `${official.title} — ${official.composers.join(", ")}`,
    },
    fallback: original,
  }
}

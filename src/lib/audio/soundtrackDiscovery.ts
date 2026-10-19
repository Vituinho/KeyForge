import catalog from "./soundtrackReferences.json"
import spotify from "./spotifyReferences.json"

export const SPOTIFY_REFERENCES = spotify.encounters as Record<string, {
  url: string; type: string; title: string; artists: string; album: string
  albumUrl: string; evidenceUrl: string; verifiedAt: string
}>
export const SOUNDTRACK_DISCOVERY = catalog.encounters.map(entry => ({
  ...entry, spotify: SPOTIFY_REFERENCES[entry.enemyId] ?? null,
}))
export const SOUNDTRACK_SERIES = [...new Set(SOUNDTRACK_DISCOVERY.map(entry => entry.series))]
// Official Sony Music Japan playlist, already referenced by the soundtrack catalog.
export const SPOTIFY_PLAYLIST = {
  title: "NARUTO and NARUTO SHIPPUDEN SOUNDTRACKS",
  curator: "Sony Music Japan",
  url: "https://open.spotify.com/playlist/7wkGN40FnYhlmKNMNMc5Ng",
}
export type DiscoveryFilter = "all" | "linked" | "pending" | "original"

export function filterSoundtracks(query: string, series: string, filter: DiscoveryFilter) {
  const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
  const search = normalize(query.trim())
  return SOUNDTRACK_DISCOVERY.filter(entry =>
    (!series || entry.series === series)
    && (filter === "all" || filter === "linked" && !!entry.spotify
      || filter === "pending" && entry.kind !== "original" && !entry.spotify
      || filter === "original" && entry.kind === "original")
    && normalize([entry.character, entry.series, entry.title, entry.spotify?.title, entry.spotify?.artists,
      ...entry.composers, entry.enemyId === "pain" ? "Girei" : entry.enemyId === "itachi" ? "Senya" : ""].join(" ")).includes(search))
}

export function isSpotifyReferenceUrl(url: string) {
  return /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[A-Za-z0-9]{22}$/.test(url)
}

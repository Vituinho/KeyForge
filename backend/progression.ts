import { randomInt, createHash } from "node:crypto"
import type { Database } from "./database"
import { json, transaction } from "./database"
import { player, profileOf, inventoryOf, uuid } from "./players"
import { getCharacterById } from "../src/data/characters"
import { getTextsForCharacter } from "../src/data/texts"
import { scaleEnemyForBattle } from "../src/lib/battle/difficultyScaler"
import { getTopWeakKeys, prioritizeSentencesByWeakKeys } from "../src/lib/worlds/hunterAdaptiveEngine"
import { calculateBattleRewards } from "../src/lib/progression/calculateBattleRewards"
import { calculateAcademyLessonRewards, calculateTrainingRewards } from "../src/lib/progression/calculateActivityRewards"
import { calculateMultiplayerRewards } from "../src/lib/multiplayer/calculateMultiplayerRewards"
import { assertCampaignAccess, replayBattle, type BattleChallenge, type BattleInputEvent } from "../src/lib/security/battleValidation"
import { replayPractice, type PracticeChallenge, type PracticeRound } from "../src/lib/security/practiceValidation"
import { validateProgressionRequest } from "../src/lib/security/progressionRequest"
import type { MultiplayerMatchRow } from "../src/types/database"
export const binding = (input: unknown) => createHash("sha256").update(JSON.stringify(input)).digest("hex")
export async function progression(db: Database, userId: string, input: Record<string, unknown>) {
  validateProgressionRequest(input)
  return transaction(db, async tx => {
    const row = await player(tx, userId)
    const profile = profileOf(row)
    if (input.action === "begin" || input.action === "beginPractice") {
      let challenge: BattleChallenge | PracticeChallenge
      if (input.action === "begin") {
        if (typeof input.enemyId !== "string" || !["en", "pt-BR"].includes(String(input.language))) throw new Error("Invalid challenge")
        const enemy = getCharacterById(input.enemyId)
        if (!enemy) throw new Error("Unknown enemy")
        assertCampaignAccess(profile, enemy)
        let texts = getTextsForCharacter(enemy.id, input.language as "en" | "pt-BR")
        if (enemy.world === "hunter") texts = prioritizeSentencesByWeakKeys(texts, getTopWeakKeys(profile.keyErrors ?? {}, 5))
        challenge = { enemy: scaleEnemyForBattle(enemy, profile), texts, language: input.language as "en" | "pt-BR" }
      } else {
        if (!["academy", "home-row", "training"].includes(String(input.kind)) || !["ABNT2", "ANSI"].includes(String(input.layout)) || !["en", "pt-BR"].includes(String(input.language))) throw new Error("Invalid practice")
        if (input.targetKeys !== undefined && (!Array.isArray(input.targetKeys) || input.targetKeys.length > 5 || input.targetKeys.some(key => typeof key !== "string" || Array.from(key).length !== 1 || !key.trim() || /\p{C}/u.test(key)))) throw new Error("Invalid keys")
        challenge = { kind: input.kind, layout: input.layout, language: input.language, targetKeys: input.targetKeys ?? [] } as PracticeChallenge
      }
      const active = await tx.challenge.count({ where: { userId, finished: false, expiresAt: { gt: new Date() } } })
      if (active >= 20) throw new Error("Too many active challenges")
      const session = await tx.challenge.create({ data: { userId, challenge: json(challenge), expiresAt: new Date(Date.now() + 1800000) } })
      return input.action === "begin" ? { id: session.id, ...challenge } : { id: session.id }
    }
    const id = input.action === "pvp" ? input.matchId : input.sessionId
    if (!uuid(id)) throw new Error("Invalid activity")
    const source = `${input.action === "pvp" ? "pvp" : input.action === "practice" ? "practice" : "battle"}:${id}`
    const digest = binding(input)
    const cached = await tx.receipt.findUnique({ where: { userId_source: { userId, source } } })
    if (cached) { if (cached.binding !== digest) throw new Error("Replay changed"); return cached.receipt }
    let next = profile
    let receipt: unknown
    const inventory = inventoryOf(row)
    const grant = (crateId: string, count: number) => { inventory.crates[crateId] = (inventory.crates[crateId] ?? 0) + count }
    if (input.action === "pvp") {
      const matchRow = await tx.match.findUniqueOrThrow({ where: { id: id as string } })
      const match = matchRow.state as unknown as MultiplayerMatchRow
      if (match.status !== "finished" || ![match.player_1_id, match.player_2_id].includes(userId)) throw new Error("Unverified match")
      const events = await tx.matchEvent.findMany({ where: { matchId: match.id, userId } })
      const combo = Math.max(0, ...events.map(event => Number((event.data as Record<string, unknown>).combo ?? 0)))
      const p1 = match.player_1_id === userId
      const summary = calculateMultiplayerRewards(match, userId, p1 ? match.player_1_wpm : match.player_2_wpm, p1 ? match.player_1_accuracy : match.player_2_accuracy, combo, profile, () => randomInt(1000000) / 1000000)
      if (summary) {
        next = summary.updatedProfile
        if (summary.awardedCrate) grant(summary.awardedCrate.crateId, 1)
        inventory.forgeShards += summary.shardsAwarded
      }
      receipt = { summary }
    } else {
      const session = await tx.challenge.findUniqueOrThrow({ where: { id: id as string } })
      if (session.userId !== userId || session.finished || session.expiresAt.getTime() <= Date.now()) throw new Error("Invalid session")
      const elapsed = Date.now() - session.createdAt.getTime()
      if (input.action === "practice") {
        const replay = replayPractice(session.challenge as unknown as PracticeChallenge, input.rounds as PracticeRound[], elapsed, typeof input.targetKey === "string" ? input.targetKey : undefined)
        const summary = replay.lessonId ? calculateAcademyLessonRewards(replay.lessonId, replay.stats, profile) : calculateTrainingRewards(replay.stats, profile)
        next = summary.updatedProfile
        receipt = { summary }
      } else {
        const challenge = session.challenge as unknown as BattleChallenge
        if (!challenge.enemy) throw new Error("Not a battle")
        assertCampaignAccess(profile, challenge.enemy)
        const result = replayBattle(challenge, input.events as BattleInputEvent[], elapsed)
        const summary = calculateBattleRewards(result, challenge.enemy, profile)
        next = summary.updatedProfile
        for (const crate of summary.awardedCrates ?? []) grant(crate.crateId, crate.count)
        receipt = { summary, result }
      }
      await tx.challenge.update({ where: { id: session.id }, data: { finished: true } })
    }
    await tx.player.update({ where: { userId }, data: { profile: json(next), inventory: json(inventory), version: { increment: 1 } } })
    await tx.receipt.create({ data: { userId, source, binding: digest, receipt: json(receipt) } })
    return receipt
  })
}

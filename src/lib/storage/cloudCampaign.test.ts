import assert from "node:assert/strict"
import { test } from "node:test"
import { campaignFromCloud, campaignToCloud } from "./cloudCampaign"
import { createDefaultCampaignProgress } from "../../types/player"
import type { CampaignProgressRow } from "../../types/database"

test("cloud campaign persists every world, preserves local details and bounds malformed stages", () => {
  const base = createDefaultCampaignProgress()
  base.naruto.firstClearClaimed.naruto = true
  const rows = [{ world_id: "naruto", current_stage: 8, completed_stages: [8, 1, 1, 99], completed: true },
    { world_id: "jujutsu", current_stage: 3, completed_stages: [1, 2], completed: false },
    { world_id: "unknown", current_stage: 99, completed_stages: [], completed: true }] as CampaignProgressRow[]
  const campaign = campaignFromCloud(base, rows)
  assert.deepEqual(campaign.naruto.completedStages, [1, 8])
  assert.equal(campaign.naruto.firstClearClaimed.naruto, true)
  assert.deepEqual(campaign.jujutsu.completedStages, [1, 2])
  assert.equal(campaign.unknown, undefined)
  assert.equal(campaign.jujutsu.unlocked, true)
  const payload = campaignToCloud("player", campaign, "today")
  assert.deepEqual(payload.map(row => row.world_id), ["naruto", "jujutsu"])
  assert.ok(payload.every(row => row.user_id === "player"))
})

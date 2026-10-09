import assert from "node:assert/strict"
import { test } from "node:test"
import { ALL_CRATES } from "./crates"

test("advertised crate minimums never exceed a possible weighted drop", () => {
  const rarities = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "secret"]
  for (const crate of ALL_CRATES) {
    const minimum = rarities.indexOf(crate.guaranteedMinRarity ?? "common")
    for (const drop of crate.dropWeights.filter(entry => entry.weight > 0)) {
      assert.ok(rarities.indexOf(drop.rarity) >= minimum, `${crate.id} advertises a guarantee its ${drop.rarity} drops cannot meet`)
    }
  }
})

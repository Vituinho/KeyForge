import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { database } from "../backend/database"
import { importLegacy } from "../backend/legacy"
async function main() {
  const args = process.argv.slice(2)
  const file = args[args.indexOf("--file") + 1]
  const expected = args[args.indexOf("--sha256") + 1]
  if (!args.includes("--file") || !args.includes("--sha256") || !/^[a-f0-9]{64}$/.test(expected ?? "")) throw new Error("Usage: --file OWNER_EXPORT.json --sha256 REVIEWED_HASH [--apply]")
  const raw = readFileSync(file)
  const digest = createHash("sha256").update(raw).digest("hex")
  if (digest !== expected) throw new Error("Export hash mismatch")
  const records: unknown = JSON.parse(raw.toString("utf8"))
  if (!args.includes("--apply")) { console.log("Reviewed file hash matches. No database writes; add --apply after reviewing provenance and backing up the target."); return }
  if (!process.env.DATABASE_URL) throw new Error("Operator database URL required")
  const db = database(process.env.DATABASE_URL)
  try { console.log(await importLegacy(db, records, digest)) } finally { await db.$disconnect() }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : "Import failed"); process.exitCode = 1 })

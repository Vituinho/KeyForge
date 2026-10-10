import { readdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"

function tests(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? tests(join(directory, entry.name)) : /\.test\.tsx?$/.test(entry.name) ? [join(directory, entry.name)] : [])
}
const unit = ["node_modules/tsx/dist/cli.mjs", "--test", "--test-concurrency=4", "--test-reporter=spec", ...tests("src").sort()]
const script = (name: string) => ["node_modules/tsx/dist/cli.mjs", `scripts/${name}.ts`]
const steps: [string, string[]][] = process.argv.includes("--unit") ? [["unit", unit]] : [
  ["unit", unit], ["security", script("verify-multiplayer-security")], ["security-database", script("verify-production-security")], ["campaign", script("verify-world-campaign")],
  ["progression", script("verify-progression-polish")], ["balance", script("test-balance-profiles")], ["pvp", script("simulate-pvp-battle")],
  ["i18n", script("audit-i18n")], ["audio-assets", script("audit-audio")],
  ["typescript", ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"]],
  ["eslint", ["node_modules/eslint/bin/eslint.js"]], ["build", ["node_modules/next/dist/bin/next", "build"]],
  ["security-http", script("verify-security-http")],
]
const logs = mkdtempSync(join(tmpdir(), "keyforge-release-"))
const results = []
for (const [name, args] of steps) {
  console.log(`Running ${name}…`)
  const result = spawnSync(process.execPath, args, { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" }, maxBuffer: 8 * 1024 * 1024 })
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
  writeFileSync(join(logs, `${name}.log`), output)
  results.push({ name, passed: result.status === 0, status: result.status, error: result.error?.message })
  console.log(`${name}: ${result.status === 0 ? "PASS" : "FAIL"}${name === "unit" ? ` (${output.match(/tests (\d+)/)?.[1] ?? "?"} tests)` : ""}`)
  if (result.status !== 0) { console.log(output.slice(-10000)); process.exitCode = 1; break }
}
writeFileSync(join(logs, "results.json"), JSON.stringify({ date: new Date().toISOString(), results }, null, 2))
console.log(`Validation logs: ${logs}`)

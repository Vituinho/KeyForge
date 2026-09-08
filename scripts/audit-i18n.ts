/**
 * KeyForge i18n Audit Script
 * Usage: npx tsx scripts/audit-i18n.ts
 */

import { readFileSync, readdirSync, statSync } from "fs"
import { join, extname } from "path"
import { en } from "../src/locales/en"
import { ptBR } from "../src/locales/pt-BR"

// ─── 1. Key parity check ─────────────────────────────────────────────────────

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenKeys(v as Record<string, unknown>, full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

const enKeys = new Set(flattenKeys(en as unknown as Record<string, unknown>))
const ptBRKeys = new Set(flattenKeys(ptBR as unknown as Record<string, unknown>))

const missingInPtBR = [...enKeys].filter((k) => !ptBRKeys.has(k))
const missingInEn = [...ptBRKeys].filter((k) => !enKeys.has(k))

// ─── 2. Hardcoded string scanner ─────────────────────────────────────────────

const PROJECT_ROOT = join(__dirname, "..")

function walkFiles(dir: string, exts: string[]): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...walkFiles(full, exts))
    } else if (exts.includes(extname(full))) {
      results.push(full)
    }
  }
  return results
}

const SUSPICIOUS_PATTERNS: Array<{ label: string; re: RegExp }> = [
  {
    label: "Plain JSX text node (possible hardcoded string)",
    re: />([A-Z][a-z]+([ ][A-Za-z]+){1,6})</,
  },
  {
    label: "Hardcoded title/aria-label attribute",
    re: /(?:title|aria-label)="[A-Z][a-z ]{3,}"/,
  },
  {
    label: "Hardcoded placeholder attribute",
    re: /placeholder="[A-Za-z ]{4,}"/,
  },
]

function isSafeLine(line: string): boolean {
  const t = line.trim()
  if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return true
  if (t.includes("t(")) return true
  if (["className=", "type=", "href=", "src=", "autoComplete=", "autoCapitalize=",
       "spellCheck=", "role=", "aria-selected", "key=", "data-", "?: ",
       "=> ", " | ", ": string", "import ", "export "].some((p) => t.includes(p))) return true
  return false
}

const SRC_DIR = join(PROJECT_ROOT, "src")
const EXCLUDE_PATTERNS = [".test.", ".spec.", ".stories."]

const tsxFiles = walkFiles(SRC_DIR, [".tsx", ".ts"]).filter(
  (f) =>
    !EXCLUDE_PATTERNS.some((p) => f.includes(p)) &&
    !f.includes("locales") &&
    !f.includes("scripts")
)

interface SuspiciousHit {
  file: string
  line: number
  text: string
  reason: string
}

const suspiciousHits: SuspiciousHit[] = []

for (const file of tsxFiles) {
  const lines = readFileSync(file, "utf-8").split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isSafeLine(line)) continue
    for (const { label, re } of SUSPICIOUS_PATTERNS) {
      if (re.test(line)) {
        suspiciousHits.push({
          file: file.replace(PROJECT_ROOT + "\\", "").replace(PROJECT_ROOT + "/", ""),
          line: i + 1,
          text: line.trim().slice(0, 120),
          reason: label,
        })
        break
      }
    }
  }
}

// ─── 3. Report ────────────────────────────────────────────────────────────────

let hasErrors = false

console.log("\n╔═══════════════════════════════════════════════╗")
console.log("║      KeyForge i18n Audit — Results            ║")
console.log("╚═══════════════════════════════════════════════╝\n")

console.log("── 1. Key Parity ────────────────────────────────")
if (missingInPtBR.length === 0 && missingInEn.length === 0) {
  console.log("✅  100% key parity between en.ts and pt-BR.ts\n")
} else {
  if (missingInPtBR.length > 0) {
    hasErrors = true
    console.log(`❌  Missing in pt-BR.ts (${missingInPtBR.length}):`)
    missingInPtBR.forEach((k) => console.log(`    • ${k}`))
    console.log()
  }
  if (missingInEn.length > 0) {
    hasErrors = true
    console.log(`❌  Missing in en.ts (${missingInEn.length}):`)
    missingInEn.forEach((k) => console.log(`    • ${k}`))
    console.log()
  }
}

console.log("── 2. Potential Hardcoded Strings ───────────────")
if (suspiciousHits.length === 0) {
  console.log("✅  No suspicious hardcoded strings found in src/\n")
} else {
  console.log(`⚠️   ${suspiciousHits.length} potentially hardcoded strings (review manually):`)
  suspiciousHits.forEach((hit) => {
    console.log(`\n  📄 ${hit.file}:${hit.line}`)
    console.log(`     Reason : ${hit.reason}`)
    console.log(`     Content: ${hit.text}`)
  })
  console.log()
}

console.log("── Summary ──────────────────────────────────────")
console.log(`  en.ts keys       : ${enKeys.size}`)
console.log(`  pt-BR.ts keys    : ${ptBRKeys.size}`)
console.log(`  Missing in pt-BR : ${missingInPtBR.length}`)
console.log(`  Missing in en    : ${missingInEn.length}`)
console.log(`  Suspicious hits  : ${suspiciousHits.length} (manual review)`)
console.log()

if (hasErrors) {
  console.error("❌  Audit FAILED — fix key parity errors before committing.\n")
  process.exit(1)
} else {
  console.log("✅  Audit PASSED — key parity is 100%.\n")
}

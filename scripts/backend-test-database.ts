import { execFileSync } from "node:child_process"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
/** Creates an isolated cluster. Never reads DATABASE_URL or touches an existing database. */
export function backendTestDatabase() {
  const bin = process.env.KEYFORGE_TEST_PG_BIN ?? (process.platform === "win32" ? "C:/Program Files/PostgreSQL/18/bin" : "")
  const dir = mkdtempSync(join(tmpdir(), "keyforge-backend-"))
  const port = 22000 + Math.floor(Math.random() * 10000)
  const run = (name: string, args: string[]) => execFileSync(bin ? join(bin, name + (process.platform === "win32" ? ".exe" : "")) : name, args, { encoding: "utf8", windowsHide: true, timeout: 60000, stdio: name === "pg_ctl" ? "ignore" : "pipe" })
  run("initdb", ["-D", dir, "-U", "postgres", "-A", "trust", "-E", "UTF8", "--locale=C"])
  run("pg_ctl", ["-D", dir, "-l", join(dir, "server.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"])
  const url = `postgresql://postgres@127.0.0.1:${port}/postgres`
  const close = () => run("pg_ctl", ["-D", dir, "-w", "stop", "-m", "fast"])
  try {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe", windowsHide: true, timeout: 60000 })
    return { url, close, dir }
  } catch (error) { close(); throw error }
}

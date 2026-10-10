import { build } from "esbuild"
void build({ entryPoints: ["backend/server.ts"], outfile: "backend/dist/server.mjs", bundle: true, platform: "node", target: "node24", format: "esm", packages: "external" }).catch(error => { console.error(error); process.exitCode = 1 })

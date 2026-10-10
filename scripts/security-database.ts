import { execFile,execFileSync } from "node:child_process"
import { promisify } from "node:util"
import { mkdtempSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/** Always creates its own disposable loopback-only database; accepts no production URL. */
export function securityDatabase() {
  const bin = process.env.KEYFORGE_TEST_PG_BIN ?? (process.platform === "win32" ? "C:/Program Files/PostgreSQL/18/bin" : "")
  const exe = (name: string) => bin ? join(bin, name + (process.platform === "win32" ? ".exe" : "")) : name
  const dir = mkdtempSync(join(tmpdir(), "keyforge-security-"))
  const port = 22000 + Math.floor(Math.random()*10000)
  const run = (name: string, args: string[], input?: string) => execFileSync(exe(name),args,{input,encoding:"utf8",windowsHide:true,stdio:name==="pg_ctl"?"ignore":["pipe","pipe","pipe"],timeout:60000})
  let running = false
  const sql = (query: string) => run("psql",["-X","-v","ON_ERROR_STOP=1","-v","VERBOSITY=verbose","-h","127.0.0.1","-p",String(port),"-U","postgres","-d","postgres","-At"],query).trim()
  const sqlAsync=async(query:string)=>{
    const child=promisify(execFile)(exe("psql"),["-X","-v","ON_ERROR_STOP=1","-v","VERBOSITY=verbose","-h","127.0.0.1","-p",String(port),"-U","postgres","-d","postgres","-At","-c",query],{encoding:"utf8",windowsHide:true,timeout:60000})
    return (await child).stdout.trim()
  }
  try {
    run("initdb",["-D",dir,"-U","postgres","-A","trust","-E","UTF8","--locale=C"])
    run("pg_ctl",["-D",dir,"-l",join(dir,"server.log"),"-o",`-h 127.0.0.1 -p ${port} -c wal_level=logical`,"-w","start"])
    running = true
    sql(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb NOT NULL DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
      CREATE PUBLICATION supabase_realtime;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;`)
    for (const file of ["schema.sql","cosmetics_schema.sql","multiplayer_schema.sql"]) sql(readFileSync(join("supabase",file),"utf8"))
    // Real upgraded legacy player data, not just an empty new installation.
    sql(`INSERT INTO auth.users VALUES('11111111-1111-4111-8111-111111111111','{"username":"Alice"}'),('22222222-2222-4222-8222-222222222222','{"username":"Bob"}'),('33333333-3333-4333-8333-333333333333','{"username":"Mallory"}');
      UPDATE public.profiles SET xp=99999,level=80,rank='SSS',forge_shards=99999 WHERE id='11111111-1111-4111-8111-111111111111';`)
    sql("GRANT UPDATE(xp,level,forge_shards) ON public.profiles TO authenticated; GRANT INSERT(cosmetic_id) ON public.user_cosmetics TO authenticated;")
    for (const file of readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")).sort()) sql(readFileSync(join("supabase/migrations",file),"utf8"))
    return { sql,sqlAsync, dir, port, exe, close:()=>{if(running){ run("pg_ctl",["-D",dir,"-w","stop","-m","fast"]);running=false }} }
  } catch (error) {
    if(running) run("pg_ctl",["-D",dir,"-w","stop","-m","fast"])
    throw error
  }
}

if (process.argv.includes("--smoke")) {
  const db = securityDatabase()
  try { console.log("Migrations applied to isolated PostgreSQL; verified profiles:",db.sql("SELECT count(*) FROM public.verified_players")) }
  finally { db.close() }
}

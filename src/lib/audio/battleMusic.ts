/** One independently configurable, licensed track per encounter. Assets are not bundled yet. */
export interface BattleMusicTrack {
  enemyId: string
  name: string
  file: string
  style: string
  available: boolean
  source: string | null
  license: string | null
  commercialUse: boolean | null
  attribution: string | null
}
export const BATTLE_MUSIC: Record<string, BattleMusicTrack> = {
  "naruto": { enemyId: "naruto", name: "Naruto Uzumaki", file: "/audio/bgm/naruto.mp3", style: "Percussive strings and restrained drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "sakura": { enemyId: "sakura", name: "Sakura Haruno", file: "/audio/bgm/sakura.mp3", style: "Percussive strings and restrained drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "rock-lee": { enemyId: "rock-lee", name: "Rock Lee", file: "/audio/bgm/rock-lee.mp3", style: "Percussive strings and restrained drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "kakashi": { enemyId: "kakashi", name: "Kakashi Hatake", file: "/audio/bgm/kakashi.mp3", style: "Percussive strings and restrained drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "sasuke": { enemyId: "sasuke", name: "Sasuke Uchiha", file: "/audio/bgm/sasuke.mp3", style: "Percussive strings and restrained drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "itachi": { enemyId: "itachi", name: "Itachi Uchiha", file: "/audio/bgm/itachi.mp3", style: "Percussive strings and restrained drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "pain": { enemyId: "pain", name: "Pain (Nagato)", file: "/audio/bgm/pain.mp3", style: "Percussive strings and restrained drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "madara": { enemyId: "madara", name: "Madara Uchiha", file: "/audio/bgm/madara.mp3", style: "Percussive strings and restrained drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "yuji": { enemyId: "yuji", name: "Yuji Itadori", file: "/audio/bgm/yuji.mp3", style: "Dark electronic pulses and syncopated percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "nobara": { enemyId: "nobara", name: "Nobara Kugisaki", file: "/audio/bgm/nobara.mp3", style: "Dark electronic pulses and syncopated percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "megumi": { enemyId: "megumi", name: "Megumi Fushiguro", file: "/audio/bgm/megumi.mp3", style: "Dark electronic pulses and syncopated percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "todo": { enemyId: "todo", name: "Aoi Todo", file: "/audio/bgm/todo.mp3", style: "Dark electronic pulses and syncopated percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "nanami": { enemyId: "nanami", name: "Kento Nanami", file: "/audio/bgm/nanami.mp3", style: "Dark electronic pulses and syncopated percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "toji": { enemyId: "toji", name: "Toji Fushiguro", file: "/audio/bgm/toji.mp3", style: "Dark electronic pulses and syncopated percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "sukuna": { enemyId: "sukuna", name: "Ryomen Sukuna", file: "/audio/bgm/sukuna.mp3", style: "Dark electronic pulses and syncopated percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "gojo": { enemyId: "gojo", name: "Satoru Gojo", file: "/audio/bgm/gojo.mp3", style: "Dark electronic pulses and syncopated percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "krillin": { enemyId: "krillin", name: "Krillin", file: "/audio/bgm/krillin.mp3", style: "Energetic rock and orchestral percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "piccolo": { enemyId: "piccolo", name: "Piccolo", file: "/audio/bgm/piccolo.mp3", style: "Energetic rock and orchestral percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "vegeta": { enemyId: "vegeta", name: "Vegeta", file: "/audio/bgm/vegeta.mp3", style: "Energetic rock and orchestral percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "frieza": { enemyId: "frieza", name: "Frieza", file: "/audio/bgm/frieza.mp3", style: "Energetic rock and orchestral percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "cell": { enemyId: "cell", name: "Cell", file: "/audio/bgm/cell.mp3", style: "Energetic rock and orchestral percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "gohan": { enemyId: "gohan", name: "Gohan", file: "/audio/bgm/gohan.mp3", style: "Energetic rock and orchestral percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "broly": { enemyId: "broly", name: "Broly", file: "/audio/bgm/broly.mp3", style: "Energetic rock and orchestral percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "goku": { enemyId: "goku", name: "Son Goku", file: "/audio/bgm/goku.mp3", style: "Energetic rock and orchestral percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "usopp": { enemyId: "usopp", name: "Usopp", file: "/audio/bgm/usopp.mp3", style: "Adventurous brass and rhythmic strings", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "sanji": { enemyId: "sanji", name: "Sanji", file: "/audio/bgm/sanji.mp3", style: "Adventurous brass and rhythmic strings", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "zoro": { enemyId: "zoro", name: "Roronoa Zoro", file: "/audio/bgm/zoro.mp3", style: "Adventurous brass and rhythmic strings", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "law": { enemyId: "law", name: "Trafalgar Law", file: "/audio/bgm/law.mp3", style: "Adventurous brass and rhythmic strings", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "doflamingo": { enemyId: "doflamingo", name: "Donquixote Doflamingo", file: "/audio/bgm/doflamingo.mp3", style: "Adventurous brass and rhythmic strings", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "katakuri": { enemyId: "katakuri", name: "Charlotte Katakuri", file: "/audio/bgm/katakuri.mp3", style: "Adventurous brass and rhythmic strings", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "kaido": { enemyId: "kaido", name: "Kaido", file: "/audio/bgm/kaido.mp3", style: "Adventurous brass and rhythmic strings", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "luffy": { enemyId: "luffy", name: "Monkey D. Luffy", file: "/audio/bgm/luffy.mp3", style: "Adventurous brass and rhythmic strings", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "dungeon_guardian": { enemyId: "dungeon_guardian", name: "Dungeon Guardian", file: "/audio/bgm/dungeon_guardian.mp3", style: "Atmospheric synths and deep percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "cerberus": { enemyId: "cerberus", name: "Cerberus", file: "/audio/bgm/cerberus.mp3", style: "Atmospheric synths and deep percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "igris": { enemyId: "igris", name: "Blood-Red Commander Igris", file: "/audio/bgm/igris.mp3", style: "Atmospheric synths and deep percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "iron": { enemyId: "iron", name: "Iron", file: "/audio/bgm/iron.mp3", style: "Atmospheric synths and deep percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "tusk": { enemyId: "tusk", name: "Tusk", file: "/audio/bgm/tusk.mp3", style: "Atmospheric synths and deep percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "beru": { enemyId: "beru", name: "Beru", file: "/audio/bgm/beru.mp3", style: "Atmospheric synths and deep percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "bellion": { enemyId: "bellion", name: "Bellion", file: "/audio/bgm/bellion.mp3", style: "Atmospheric synths and deep percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "jinwoo": { enemyId: "jinwoo", name: "Sung Jin-Woo", file: "/audio/bgm/jinwoo.mp3", style: "Atmospheric synths and deep percussion", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "zenitsu": { enemyId: "zenitsu", name: "Zenitsu Agatsuma", file: "/audio/bgm/zenitsu.mp3", style: "Japanese-inspired strings and cinematic drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "inosuke": { enemyId: "inosuke", name: "Inosuke Hashibira", file: "/audio/bgm/inosuke.mp3", style: "Japanese-inspired strings and cinematic drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "shinobu": { enemyId: "shinobu", name: "Shinobu Kocho", file: "/audio/bgm/shinobu.mp3", style: "Japanese-inspired strings and cinematic drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "rengoku": { enemyId: "rengoku", name: "Kyojuro Rengoku", file: "/audio/bgm/rengoku.mp3", style: "Japanese-inspired strings and cinematic drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "akaza": { enemyId: "akaza", name: "Akaza", file: "/audio/bgm/akaza.mp3", style: "Japanese-inspired strings and cinematic drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "gyutaro": { enemyId: "gyutaro", name: "Gyutaro & Daki", file: "/audio/bgm/gyutaro.mp3", style: "Japanese-inspired strings and cinematic drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "kokushibo": { enemyId: "kokushibo", name: "Kokushibo", file: "/audio/bgm/kokushibo.mp3", style: "Japanese-inspired strings and cinematic drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "muzan": { enemyId: "muzan", name: "Muzan Kibutsuji", file: "/audio/bgm/muzan.mp3", style: "Japanese-inspired strings and cinematic drums", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "cipher_initiate": { enemyId: "cipher_initiate", name: "Cipher Initiate", file: "/audio/bgm/cipher_initiate.mp3", style: "Original futuristic synths and precise electronic rhythms", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "lexicon_warden": { enemyId: "lexicon_warden", name: "Lexicon Warden", file: "/audio/bgm/lexicon_warden.mp3", style: "Original futuristic synths and precise electronic rhythms", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "rhythm_weaver": { enemyId: "rhythm_weaver", name: "Rhythm Weaver", file: "/audio/bgm/rhythm_weaver.mp3", style: "Original futuristic synths and precise electronic rhythms", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "accuracy_arbiter": { enemyId: "accuracy_arbiter", name: "Accuracy Arbiter", file: "/audio/bgm/accuracy_arbiter.mp3", style: "Original futuristic synths and precise electronic rhythms", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "velocity_phantom": { enemyId: "velocity_phantom", name: "Velocity Phantom", file: "/audio/bgm/velocity_phantom.mp3", style: "Original futuristic synths and precise electronic rhythms", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "endurance_colossus": { enemyId: "endurance_colossus", name: "Endurance Colossus", file: "/audio/bgm/endurance_colossus.mp3", style: "Original futuristic synths and precise electronic rhythms", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "keystroke_sovereign": { enemyId: "keystroke_sovereign", name: "Keystroke Sovereign", file: "/audio/bgm/keystroke_sovereign.mp3", style: "Original futuristic synths and precise electronic rhythms", available: false, source: null, license: null, commercialUse: null, attribution: null },
  "nexus_mirror": { enemyId: "nexus_mirror", name: "The Nexus Mirror", file: "/audio/bgm/nexus_mirror.mp3", style: "Original futuristic synths and precise electronic rhythms", available: false, source: null, license: null, commercialUse: null, attribution: null },
}
// Set only after a real licensed file and its evidence are present.
export const BATTLE_MUSIC_FALLBACK: BattleMusicTrack | null = null
export const getBattleMusic = (enemyId: string) => BATTLE_MUSIC[enemyId] ?? null

/**
 * Deterministic Multiplayer Word Generator
 * Uses Mulberry32 pseudo-random number generator for 100% synchronized,
 * fair word sequences across opposing clients given an identical seed.
 */

export function createMulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next(): number {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WORDS_PT_BR = {
  short: [
    "fogo", "raio", "vento", "agua", "selo", "cura", "foco", "kage",
    "clan", "vila", "manto", "dano", "alma", "arma", "mira", "onda",
    "lama", "arte", "raiz", "areia", "golpe", "furor", "salto", "guarda"
  ],
  medium: [
    "chakra", "jutsu", "kunai", "shuriken", "shinobi", "konoha", "hokage",
    "sharingan", "byakugan", "katon", "suiton", "raiton", "doton", "fuuton",
    "espada", "lamina", "escudo", "trovao", "corrente", "destino", "guerreiro",
    "sombra", "clone", "tecnica", "defesa", "ataque", "impacto", "espirito"
  ],
  long: [
    "rasengan", "chidori", "amaterasu", "susanoo", "tsukuyomi", "kamui",
    "taijutsu", "genjutsu", "senjutsu", "ninjutsu", "ressurreicao",
    "invocacao", "transformacao", "concentracao", "velocidade", "perfeicao",
    "destruicao", "tempestade", "iluminacao", "legendario", "disciplina"
  ],
}

const WORDS_EN = {
  short: [
    "fire", "wind", "leaf", "seal", "clan", "blade", "dash", "kage",
    "soul", "wave", "sand", "fist", "strike", "mark", "edge", "flow",
    "palm", "rush", "iron", "gate", "path", "dust", "core", "aura"
  ],
  medium: [
    "chakra", "jutsu", "kunai", "shuriken", "shinobi", "konoha", "hokage",
    "shadow", "clones", "scroll", "lightning", "torrent", "barrier", "impact",
    "phantom", "dragon", "spiral", "warrior", "spirit", "stealth", "flame",
    "recoil", "strike", "falcon", "vision", "instinct", "master"
  ],
  long: [
    "rasengan", "chidori", "sharingan", "byakugan", "amaterasu", "susanoo",
    "tsukuyomi", "taijutsu", "genjutsu", "ninjutsu", "senjutsu", "summoning",
    "destruction", "resurrection", "discipline", "transformation", "concentrate",
    "legendary", "teleport", "annihilation", "domination"
  ],
}

/**
 * Generates an array of words deterministically from a given seed.
 * Guarantees fair length distribution and prevents consecutive duplicate words.
 */
export function generateMatchWords(
  seed: number,
  count = 30,
  language: "pt-BR" | "en" = "pt-BR"
): string[] {
  const rng = createMulberry32(seed)
  const dict = language === "en" ? WORDS_EN : WORDS_PT_BR

  const result: string[] = []
  let lastWord = ""

  for (let i = 0; i < count; i++) {
    // 35% short, 45% medium, 20% long
    const roll = rng()
    let pool: string[]

    if (roll < 0.35) {
      pool = dict.short
    } else if (roll < 0.8) {
      pool = dict.medium
    } else {
      pool = dict.long
    }

    // Pick random index from pool
    const index = Math.floor(rng() * pool.length)
    let chosen = pool[index]

    // Prevent immediate consecutive duplicate
    if (chosen === lastWord && pool.length > 1) {
      chosen = pool[(index + 1) % pool.length]
    }

    result.push(chosen)
    lastWord = chosen
  }

  return result
}

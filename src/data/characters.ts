import { Enemy } from "@/types/character"

export const CHARACTERS: Enemy[] = [
  // 1. Naruto Uzumaki — Tutorial / Balanced
  {
    id: "naruto",
    name: "Naruto Uzumaki",
    anime: "Naruto Shippuden",
    world: "naruto",
    stage: 1,
    level: 1,
    type: "normal",
    typingFocus: "balanced",
    maxHp: 450,
    attack: 6,
    attackInterval: 5500,
    recommendedWpm: 30,
    recommendedAccuracy: 90,
    difficulty: 10,
    xpReward: 40,
    firstClearBonusXp: 100,
    isBoss: false,
    themeColor: "#f97316",
    accentColor: "#3b82f6",
    description:
      "The hyperactive ninja who never gives up. A balanced matchup to warm up your keystrokes and learn the battle rhythm.",
    abilities: [
      {
        id: "shadow-clone",
        name: "Shadow Clone Jutsu",
        description: "Naruto summons clones to reinforce his spirit.",
        trigger: "on_health_low",
        triggerThreshold: 30,
      },
    ],
    mechanics: [],
  },

  // 2. Sakura Haruno — Precision / Accuracy
  {
    id: "sakura",
    name: "Sakura Haruno",
    anime: "Naruto Shippuden",
    world: "naruto",
    stage: 2,
    level: 3,
    type: "normal",
    typingFocus: "accuracy",
    maxHp: 520,
    attack: 8,
    attackInterval: 5000,
    recommendedWpm: 35,
    recommendedAccuracy: 94,
    difficulty: 25,
    xpReward: 55,
    firstClearBonusXp: 120,
    isBoss: false,
    themeColor: "#ec4899",
    accentColor: "#10b981",
    description:
      "Medical ninja with monstrous chakra control. Demands deliberate precision over reckless speed.",
    abilities: [
      {
        id: "cherry-blossom-impact",
        name: "Cherry Blossom Impact",
        description: "Concentrated chakra punch punishing inaccuracy.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "sakura-precision",
        name: "Chakra Precision Strike",
        description:
          "Accuracy below 94% reduces damage by 50%. Accuracy ≥ 94% grants +20% bonus damage.",
        targetAccuracy: 94,
        belowThresholdPenalty: 0.5,
        aboveThresholdBonus: 1.2,
      },
    ],
  },

  // 3. Rock Lee — Speed Check
  {
    id: "rock-lee",
    name: "Rock Lee",
    anime: "Naruto Shippuden",
    world: "naruto",
    stage: 3,
    level: 5,
    type: "normal",
    typingFocus: "speed",
    maxHp: 600,
    attack: 9,
    attackInterval: 4500,
    recommendedWpm: 50,
    recommendedAccuracy: 92,
    difficulty: 40,
    xpReward: 70,
    firstClearBonusXp: 150,
    isBoss: false,
    themeColor: "#22c55e",
    accentColor: "#ef4444",
    description:
      "The genius of hard work. Demands rapid typing cadence through the Eight Inner Gates.",
    abilities: [
      {
        id: "primary-lotus",
        name: "Primary Lotus",
        description: "High-speed aerial drop.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "lee-eight-gates",
        name: "Eight Inner Gates",
        description:
          "Below 30 WPM deals -40% damage. 50+ WPM deals +25%, 70+ WPM deals +50% bonus damage.",
        slowThreshold: 30,
        slowMultiplier: 0.6,
        thresholds: [
          { minWpm: 70, multiplier: 1.5, label: "EIGHT GATES SURGE" },
          { minWpm: 50, multiplier: 1.25, label: "LOTUS VELOCITY" },
          { minWpm: 30, multiplier: 1.0, label: "TAIJUTSU CADENCE" },
        ],
      },
    ],
  },

  // 4. Kakashi Hatake — Consistency
  {
    id: "kakashi",
    name: "Kakashi Hatake",
    anime: "Naruto Shippuden",
    world: "naruto",
    stage: 4,
    level: 8,
    type: "elite",
    typingFocus: "consistency",
    maxHp: 750,
    attack: 11,
    attackInterval: 4500,
    recommendedWpm: 55,
    recommendedAccuracy: 95,
    difficulty: 55,
    xpReward: 90,
    firstClearBonusXp: 180,
    isBoss: false,
    themeColor: "#06b6d4",
    accentColor: "#6366f1",
    description:
      "The Copy Ninja. Reads your typing cadence; maintaining consistent WPM yields steady mastery bonuses.",
    abilities: [
      {
        id: "raikiri",
        name: "Lightning Blade (Raikiri)",
        description: "Thrust of lightning punishing irregular rhythm.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "kakashi-copy-ninja",
        name: "Copy Ninja Consistency",
        description:
          "Keeping WPM within 10 of your match average grants +30% damage. Erractic swings suffer -20%.",
        maxWpmVariance: 10,
        maxAccVariance: 5,
        bonusMultiplier: 1.3,
        penaltyMultiplier: 0.8,
      },
    ],
  },

  // 5. Sasuke Uchiha — Combo Scaling
  {
    id: "sasuke",
    name: "Sasuke Uchiha",
    anime: "Naruto Shippuden",
    world: "naruto",
    stage: 5,
    level: 12,
    type: "elite",
    typingFocus: "combo",
    maxHp: 900,
    attack: 13,
    attackInterval: 4200,
    recommendedWpm: 60,
    recommendedAccuracy: 95,
    difficulty: 70,
    xpReward: 115,
    firstClearBonusXp: 220,
    isBoss: false,
    themeColor: "#8b5cf6",
    accentColor: "#3b82f6",
    description:
      "Prodigy of the Uchiha clan. Harnesses Sharingan precision to turn high combos into devastating lightning strikes.",
    abilities: [
      {
        id: "chidori",
        name: "Chidori Stream",
        description: "High-voltage lightning piercing your defenses.",
      },
    ],
    mechanics: [
      {
        type: "combo-scaling",
        id: "sasuke-sharingan-combo",
        name: "Sharingan Combo",
        description:
          "Combo x10 (+25%), x20 (+50%), x30 (+100%). Erring triggers a 5 HP counter-attack.",
        tiers: [
          { minCombo: 30, multiplier: 2.0, label: "KIRIN COMBO x2.0" },
          { minCombo: 20, multiplier: 1.5, label: "CHIDORI COMBO x1.5" },
          { minCombo: 10, multiplier: 1.25, label: "SHARINGAN FLOW x1.25" },
        ],
        breakComboCounterAttack: 5,
      },
    ],
  },

  // 6. Itachi Uchiha — Precision + Focus (Genjutsu)
  {
    id: "itachi",
    name: "Itachi Uchiha",
    anime: "Naruto Shippuden",
    world: "naruto",
    stage: 6,
    level: 15,
    type: "elite",
    typingFocus: "focus",
    maxHp: 1100,
    attack: 15,
    attackInterval: 4000,
    recommendedWpm: 65,
    recommendedAccuracy: 96,
    difficulty: 80,
    xpReward: 145,
    firstClearBonusXp: 260,
    isBoss: false,
    themeColor: "#dc2626",
    accentColor: "#171717",
    description:
      "Master of Genjutsu. Challenges cognitive focus with deceptive, punctuation-rich sentences.",
    abilities: [
      {
        id: "tsukuyomi",
        name: "Tsukuyomi",
        description: "Illusion bending perceived typing rhythm.",
      },
    ],
    mechanics: [
      {
        type: "focus-genjutsu",
        id: "itachi-tsukuyomi",
        name: "Tsukuyomi Illusion",
        description:
          "Complex punctuation sentences. ≥ 96% accuracy dispels the illusion for +20% bonus damage.",
        complexPunctuation: true,
      },
    ],
  },

  // 7. Pain (Nagato) — Endurance (Six Paths)
  {
    id: "pain",
    name: "Pain (Nagato)",
    anime: "Naruto Shippuden",
    world: "naruto",
    stage: 7,
    level: 18,
    type: "elite",
    typingFocus: "endurance",
    maxHp: 1400,
    attack: 17,
    attackInterval: 3800,
    recommendedWpm: 70,
    recommendedAccuracy: 96,
    difficulty: 90,
    xpReward: 180,
    firstClearBonusXp: 320,
    isBoss: false,
    themeColor: "#f59e0b",
    accentColor: "#6b7280",
    description:
      "Leader of the Akatsuki. A grueling multi-phase endurance trial requiring relentless precision over lengthy sentences.",
    abilities: [
      {
        id: "shinra-tensei",
        name: "Almighty Push (Shinra Tensei)",
        description: "Gravitational pulse pushing back damage.",
      },
    ],
    mechanics: [
      {
        type: "multi-phase",
        id: "pain-six-paths",
        name: "Six Paths of Pain",
        description:
          "Endurance trial across 3 distinct combat phases (Asura, Preva, Deva Path).",
        totalPhases: 3,
        phaseNames: [
          "Phase 1: Asura & Human Path",
          "Phase 2: Animal & Naraka Path",
          "Phase 3: Deva Path (Almighty Push)",
        ],
        phaseHpRatios: [0.35, 0.35, 0.3],
      },
    ],
  },

  // 8. Madara Uchiha — Final Boss (All Aspects)
  {
    id: "madara",
    name: "Madara Uchiha",
    anime: "Naruto Shippuden",
    world: "naruto",
    stage: 8,
    level: 25,
    type: "boss",
    typingFocus: "all",
    maxHp: 1800,
    attack: 20,
    attackInterval: 3500,
    recommendedWpm: 80,
    recommendedAccuracy: 97,
    difficulty: 100,
    xpReward: 250,
    firstClearBonusXp: 500,
    isBoss: true,
    themeColor: "#ef4444",
    accentColor: "#a855f7",
    description:
      "The legendary ghost of the Uchiha. 3 catastrophic phases testing speed, combo, accuracy, and sheer typing endurance.",
    abilities: [
      {
        id: "tengai-shinsei",
        name: "Shattered Heaven (Tengai Shinsei)",
        description: "Drops meteors upon inaccurate keystrokes.",
      },
    ],
    mechanics: [
      {
        type: "multi-phase-boss",
        id: "madara-three-phases",
        name: "Godlike Calamity",
        description:
          "Phase 1: Edo Tensei (Balanced). Phase 2: Perfect Susanoo (Speed & Combo). Phase 3: Ten-Tails Jinchuriki (Accuracy & Endurance).",
        totalPhases: 3,
        phaseNames: [
          "Phase 1: Edo Tensei (Balanced)",
          "Phase 2: Perfect Susanoo (Speed & Combo)",
          "Phase 3: Ten-Tails Jinchuriki (Accuracy & Endurance)",
        ],
        phaseHpRatios: [0.35, 0.35, 0.3],
      },
      {
        type: "precision-strike",
        id: "madara-accuracy-check",
        name: "Majestic Flame Guard",
        description: "Accuracy below 95% reduces damage dealt by 40%.",
        targetAccuracy: 95,
        belowThresholdPenalty: 0.6,
        aboveThresholdBonus: 1.15,
      },
    ],
  },
]

export function getCharacterById(id: string): Enemy | undefined {
  return CHARACTERS.find((c) => c.id === id)
}

export function getCharactersByAnime(anime: string): Enemy[] {
  return CHARACTERS.filter((c) => c.anime === anime)
}

export function getCharactersByWorld(world: string): Enemy[] {
  return CHARACTERS.filter((c) => c.world === world)
}

export function getCharacterByStage(world: string, stage: number): Enemy | undefined {
  return CHARACTERS.find((c) => c.world === world && c.stage === stage)
}

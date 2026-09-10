import { Enemy } from "@/types/character"

/**
 * KeyForge v2.0: Naruto World Campaign Balancing Configuration
 *
 * Difficulty & Combat Progression:
 * - Stage 1 (Naruto): HP 450, Atk 6, Int 5500ms, RecWpm 30, RecAcc 90, XP 40 (Bonus: 100)
 * - Stage 2 (Sakura): HP 520, Atk 8, Int 5000ms, RecWpm 35, RecAcc 94, XP 55 (Bonus: 120)
 * - Stage 3 (Rock Lee): HP 600, Atk 9, Int 4500ms, RecWpm 50, RecAcc 92, XP 70 (Bonus: 150)
 * - Stage 4 (Kakashi): HP 750, Atk 11, Int 4500ms, RecWpm 55, RecAcc 95, XP 90 (Bonus: 180)
 * - Stage 5 (Sasuke): HP 900, Atk 13, Int 4200ms, RecWpm 60, RecAcc 95, XP 115 (Bonus: 220)
 * - Stage 6 (Itachi): HP 1100, Atk 15, Int 4000ms, RecWpm 65, RecAcc 96, XP 145 (Bonus: 260)
 * - Stage 7 (Pain): HP 1400, Atk 17, Int 3800ms, RecWpm 70, RecAcc 96, XP 180 (Bonus: 320)
 * - Stage 8 (Madara): HP 1800, Atk 20, Int 3500ms, RecWpm 80, RecAcc 97, XP 250 (Bonus: 500)
 */
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

  // -------------------------------------------------------------
  // JUJUTSU KAISEN — Precision, Punctuation & Special Characters
  // -------------------------------------------------------------
  // 9. Yuji Itadori — Divergent Fist (Precision Basics)
  {
    id: "yuji",
    name: "Yuji Itadori",
    anime: "Jujutsu Kaisen",
    world: "jujutsu",
    stage: 1,
    level: 12,
    type: "normal",
    typingFocus: "precision",
    maxHp: 650,
    attack: 8,
    attackInterval: 5000,
    recommendedWpm: 40,
    recommendedAccuracy: 92,
    difficulty: 30,
    xpReward: 60,
    firstClearBonusXp: 120,
    isBoss: false,
    themeColor: "#ef4444",
    accentColor: "#f59e0b",
    description:
      "Vessel of the King of Curses. Delivers devastating Divergent Fist blows requiring precise timing and accurate punctuation.",
    abilities: [
      {
        id: "divergent-fist",
        name: "Divergent Fist",
        description: "Delayed impact strike reinforcing basic punctuation precision.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "yuji-divergent-precision",
        name: "Divergent Precision",
        description: "Accuracy below 92% reduces damage by 40%.",
        targetAccuracy: 92,
        belowThresholdPenalty: 0.6,
        aboveThresholdBonus: 1.15,
      },
    ],
  },

  // 10. Nobara Kugisaki — Resonance (Punctuation Nails)
  {
    id: "nobara",
    name: "Nobara Kugisaki",
    anime: "Jujutsu Kaisen",
    world: "jujutsu",
    stage: 2,
    level: 14,
    type: "normal",
    typingFocus: "precision",
    maxHp: 750,
    attack: 10,
    attackInterval: 4800,
    recommendedWpm: 45,
    recommendedAccuracy: 93,
    difficulty: 40,
    xpReward: 75,
    firstClearBonusXp: 150,
    isBoss: false,
    themeColor: "#ec4899",
    accentColor: "#f43f5e",
    description:
      "Fierce sorcerer wielding hammer and nails. Demands surgical precision across apostrophes, hyphens, and exclamation marks.",
    abilities: [
      {
        id: "resonance",
        name: "Resonance",
        description: "Transmits damage directly through needle-sharp punctuation accuracy.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "nobara-hairpin-precision",
        name: "Hairpin Precision",
        description: "Accuracy below 93% reduces damage by 45%.",
        targetAccuracy: 93,
        belowThresholdPenalty: 0.55,
        aboveThresholdBonus: 1.2,
      },
    ],
  },

  // 11. Megumi Fushiguro — Ten Shadows (Quotation Marks & Semicolons)
  {
    id: "megumi",
    name: "Megumi Fushiguro",
    anime: "Jujutsu Kaisen",
    world: "jujutsu",
    stage: 3,
    level: 16,
    type: "normal",
    typingFocus: "precision",
    maxHp: 880,
    attack: 12,
    attackInterval: 4500,
    recommendedWpm: 50,
    recommendedAccuracy: 94,
    difficulty: 50,
    xpReward: 95,
    firstClearBonusXp: 180,
    isBoss: false,
    themeColor: "#3b82f6",
    accentColor: "#1d4ed8",
    description:
      "Shadow technique inheritor. Challenges mental composure with complex quotations, semicolons, and parentheses.",
    abilities: [
      {
        id: "shadow-summons",
        name: "Ten Shadows Summoning",
        description: "Summons divine hounds and Nue through disciplined symbol keystrokes.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "megumi-shadow-focus",
        name: "Shadow Domain Focus",
        description: "Accuracy below 94% reduces damage by 50%.",
        targetAccuracy: 94,
        belowThresholdPenalty: 0.5,
        aboveThresholdBonus: 1.25,
      },
    ],
  },

  // 12. Aoi Todo — Boogie Woogie (Punctuation Rhythm Swaps)
  {
    id: "todo",
    name: "Aoi Todo",
    anime: "Jujutsu Kaisen",
    world: "jujutsu",
    stage: 4,
    level: 18,
    type: "elite",
    typingFocus: "precision",
    maxHp: 1050,
    attack: 14,
    attackInterval: 4200,
    recommendedWpm: 56,
    recommendedAccuracy: 95,
    difficulty: 60,
    xpReward: 120,
    firstClearBonusXp: 220,
    isBoss: false,
    themeColor: "#8b5cf6",
    accentColor: "#a855f7",
    description:
      "530,000 IQ sorcerer. Swaps rhythmic patterns and tests punctuation shifts with sudden cadence changes.",
    abilities: [
      {
        id: "boogie-woogie",
        name: "Boogie Woogie",
        description: "Claps hands to shift sentence rhythm unpredictably.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "todo-clap-precision",
        name: "Boogie Woogie Sync",
        description: "Accuracy below 95% reduces damage by 50%.",
        targetAccuracy: 95,
        belowThresholdPenalty: 0.5,
        aboveThresholdBonus: 1.25,
      },
    ],
  },

  // 13. Kento Nanami — 7:3 Ratio Technique (Numerical & Critical Precision)
  {
    id: "nanami",
    name: "Kento Nanami",
    anime: "Jujutsu Kaisen",
    world: "jujutsu",
    stage: 5,
    level: 20,
    type: "elite",
    typingFocus: "precision",
    maxHp: 1250,
    attack: 16,
    attackInterval: 4000,
    recommendedWpm: 62,
    recommendedAccuracy: 95,
    difficulty: 70,
    xpReward: 150,
    firstClearBonusXp: 260,
    isBoss: false,
    themeColor: "#eab308",
    accentColor: "#ca8a04",
    description:
      "The salaryman sorcerer. Forces a weak point at the 7:3 ratio, requiring precision on numbers, percentages, and colons.",
    abilities: [
      {
        id: "ratio-strike",
        name: "Ratio Technique: 7:3",
        description: "Delivers guaranteed critical strikes when symbol precision meets the ratio standard.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "nanami-ratio-precision",
        name: "7:3 Ratio Critical",
        description: "Accuracy below 95% deals 55% reduced damage. 95%+ precision deals +30% critical bonus.",
        targetAccuracy: 95,
        belowThresholdPenalty: 0.45,
        aboveThresholdBonus: 1.3,
      },
    ],
  },

  // 14. Toji Fushiguro — Heavenly Restriction (Zero Cursed Energy, Pure Speed & Precision)
  {
    id: "toji",
    name: "Toji Fushiguro",
    anime: "Jujutsu Kaisen",
    world: "jujutsu",
    stage: 6,
    level: 23,
    type: "elite",
    typingFocus: "precision",
    maxHp: 1500,
    attack: 19,
    attackInterval: 3800,
    recommendedWpm: 70,
    recommendedAccuracy: 96,
    difficulty: 80,
    xpReward: 185,
    firstClearBonusXp: 300,
    isBoss: false,
    themeColor: "#64748b",
    accentColor: "#0f172a",
    description:
      "The Sorcerer Killer. Wields the Inverted Spear of Heaven with raw physical speed and zero room for input error.",
    abilities: [
      {
        id: "inverted-spear",
        name: "Inverted Spear of Heaven",
        description: "Pierces through all defensive mistakes with lethal velocity.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "toji-lethal-precision",
        name: "Heavenly Restriction",
        description: "Accuracy below 96% reduces damage by 60%.",
        targetAccuracy: 96,
        belowThresholdPenalty: 0.4,
        aboveThresholdBonus: 1.35,
      },
    ],
  },

  // 15. Ryomen Sukuna — Malevolent Shrine (Dismantle & Cleave)
  {
    id: "sukuna",
    name: "Ryomen Sukuna",
    anime: "Jujutsu Kaisen",
    world: "jujutsu",
    stage: 7,
    level: 26,
    type: "boss",
    typingFocus: "precision",
    maxHp: 1850,
    attack: 22,
    attackInterval: 3500,
    recommendedWpm: 78,
    recommendedAccuracy: 97,
    difficulty: 90,
    xpReward: 230,
    firstClearBonusXp: 400,
    isBoss: true,
    themeColor: "#dc2626",
    accentColor: "#7f1d1d",
    description:
      "The King of Curses. Unleashes Malevolent Shrine with an unrelenting barrage of complex punctuation and multi-clause sentences.",
    abilities: [
      {
        id: "malevolent-shrine",
        name: "Domain Expansion: Malevolent Shrine",
        description: "Inundates the typing space with endless slicing keystrokes.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "sukuna-dismantle-precision",
        name: "Cleave & Dismantle",
        description: "Accuracy below 97% suffers 70% damage reduction.",
        targetAccuracy: 97,
        belowThresholdPenalty: 0.3,
        aboveThresholdBonus: 1.4,
      },
    ],
  },

  // 16. Satoru Gojo — Limitless & Infinite Void (98%–100% Precision Requirement)
  {
    id: "gojo",
    name: "Satoru Gojo",
    anime: "Jujutsu Kaisen",
    world: "jujutsu",
    stage: 8,
    level: 30,
    type: "boss",
    typingFocus: "precision",
    maxHp: 2300,
    attack: 26,
    attackInterval: 3200,
    recommendedWpm: 88,
    recommendedAccuracy: 98,
    difficulty: 98,
    xpReward: 300,
    firstClearBonusXp: 600,
    isBoss: true,
    themeColor: "#06b6d4",
    accentColor: "#8b5cf6",
    description:
      "The Honored One. The Infinity barrier blocks all imperfect strikes. Demands 98% to 100% accuracy to penetrate his defense.",
    abilities: [
      {
        id: "infinite-void",
        name: "Domain Expansion: Infinite Void",
        description: "Floods the mind with limitless information, demanding absolute cognitive focus.",
      },
      {
        id: "hollow-purple",
        name: "Secret Technique: Hollow Purple",
        description: "Combines red and blue into an unstoppable singularity.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "gojo-infinity-barrier",
        name: "Infinity Absolute Barrier",
        description:
          "Accuracy below 98% is absorbed by Infinity, reducing damage by 90%. 98%+ precision penetrates the barrier for +45% bonus damage.",
        targetAccuracy: 98,
        belowThresholdPenalty: 0.1,
        aboveThresholdBonus: 1.45,
      },
    ],
  },

  // -------------------------------------------------------------
  // DRAGON WORLD — Velocity, Speed Bursts & High-WPM Scaling
  // -------------------------------------------------------------
  // 17. Krillin — Turtle School Sprint (Base Speed Warmup)
  {
    id: "krillin",
    name: "Krillin",
    anime: "Dragon Ball Z",
    world: "dragon",
    stage: 1,
    level: 18,
    type: "normal",
    typingFocus: "speed",
    maxHp: 700,
    attack: 9,
    attackInterval: 4800,
    recommendedWpm: 45,
    recommendedAccuracy: 90,
    difficulty: 35,
    xpReward: 70,
    firstClearBonusXp: 140,
    isBoss: false,
    themeColor: "#f97316",
    accentColor: "#ea580c",
    description:
      "Loyal martial artist of the Turtle School. Tests baseline sprint speed with Destructo Disc acceleration.",
    abilities: [
      {
        id: "destructo-disc",
        name: "Destructo Disc",
        description: "Spins razor-sharp ki blades, demanding swift keystrokes.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "krillin-turtle-sprint",
        name: "Turtle School Sprint",
        description: "Below 35 WPM deals -30% damage. 45+ WPM deals +15% bonus damage.",
        slowThreshold: 35,
        slowMultiplier: 0.7,
        thresholds: [{ minWpm: 45, multiplier: 1.15, label: "TURTLE VELOCITY" }],
      },
    ],
  },

  // 18. Piccolo — Special Beam Cannon (Concentrated Speed Burst)
  {
    id: "piccolo",
    name: "Piccolo",
    anime: "Dragon Ball Z",
    world: "dragon",
    stage: 2,
    level: 21,
    type: "normal",
    typingFocus: "speed",
    maxHp: 850,
    attack: 11,
    attackInterval: 4500,
    recommendedWpm: 55,
    recommendedAccuracy: 91,
    difficulty: 45,
    xpReward: 90,
    firstClearBonusXp: 180,
    isBoss: false,
    themeColor: "#22c55e",
    accentColor: "#15803d",
    description:
      "Namekian tactician and master mentor. Demands concentrated burst velocity to penetrate his defensive guard.",
    abilities: [
      {
        id: "special-beam-cannon",
        name: "Special Beam Cannon (Makankosappo)",
        description: "Drills through physical defenses with a hyper-focused ki laser.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "piccolo-beam-focus",
        name: "Special Beam Focus",
        description: "Below 45 WPM deals -35% damage. 55+ WPM deals +20% bonus damage.",
        slowThreshold: 45,
        slowMultiplier: 0.65,
        thresholds: [{ minWpm: 55, multiplier: 1.2, label: "LIGHT GRENADE SPEED" }],
      },
    ],
  },

  // 19. Vegeta — Saiyan Prince Pride (High-Speed Threshold)
  {
    id: "vegeta",
    name: "Vegeta",
    anime: "Dragon Ball Z",
    world: "dragon",
    stage: 3,
    level: 24,
    type: "elite",
    typingFocus: "speed",
    maxHp: 1050,
    attack: 13,
    attackInterval: 4200,
    recommendedWpm: 65,
    recommendedAccuracy: 92,
    difficulty: 55,
    xpReward: 115,
    firstClearBonusXp: 220,
    isBoss: false,
    themeColor: "#3b82f6",
    accentColor: "#1d4ed8",
    description:
      "Prince of all Saiyans. Unforgiving pride rewards rapid, aggressive typing cadence while crushing slow keystrokes.",
    abilities: [
      {
        id: "final-flash",
        name: "Final Flash",
        description: "Channels imperial pride into a devastating high-velocity beam.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "vegeta-saiyan-speed",
        name: "Saiyan Pride Velocity",
        description: "Below 55 WPM deals -40% damage. 70+ WPM deals +30% bonus damage.",
        slowThreshold: 55,
        slowMultiplier: 0.6,
        thresholds: [
          { minWpm: 70, multiplier: 1.3, label: "FINAL FLASH CADENCE" },
          { minWpm: 60, multiplier: 1.15, label: "SAIYAN PRIDE SURGE" },
        ],
      },
    ],
  },

  // 20. Frieza — Death Beam Barrage (Rapid Consecutive Speed)
  {
    id: "frieza",
    name: "Frieza",
    anime: "Dragon Ball Z",
    world: "dragon",
    stage: 4,
    level: 27,
    type: "elite",
    typingFocus: "speed",
    maxHp: 1300,
    attack: 16,
    attackInterval: 3900,
    recommendedWpm: 72,
    recommendedAccuracy: 92,
    difficulty: 65,
    xpReward: 145,
    firstClearBonusXp: 270,
    isBoss: false,
    themeColor: "#a855f7",
    accentColor: "#7e22ce",
    description:
      "Galactic tyrant in his final form. Fires rapid consecutive death beams that demand rapid, non-stop typing bursts.",
    abilities: [
      {
        id: "death-beam",
        name: "Death Beam Barrage",
        description: "Fires piercing finger lasers at hypersonic frequency.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "frieza-death-blitz",
        name: "Death Beam Blitz",
        description: "Below 60 WPM suffers -45% damage. 78+ WPM grants +35% bonus damage.",
        slowThreshold: 60,
        slowMultiplier: 0.55,
        thresholds: [
          { minWpm: 78, multiplier: 1.35, label: "DEATH BEAM BLITZ" },
          { minWpm: 68, multiplier: 1.2, label: "GOLDEN EMPEROR SPEED" },
        ],
      },
    ],
  },

  // 21. Cell — Perfect Form Speed (Extreme Velocity Check)
  {
    id: "cell",
    name: "Cell",
    anime: "Dragon Ball Z",
    world: "dragon",
    stage: 5,
    level: 30,
    type: "elite",
    typingFocus: "speed",
    maxHp: 1550,
    attack: 19,
    attackInterval: 3600,
    recommendedWpm: 80,
    recommendedAccuracy: 93,
    difficulty: 75,
    xpReward: 180,
    firstClearBonusXp: 330,
    isBoss: false,
    themeColor: "#16a34a",
    accentColor: "#15803d",
    description:
      "The ultimate bio-android in his Perfect Form. Synthesizes every warrior's DNA into a blistering typing cadence.",
    abilities: [
      {
        id: "solar-kamehameha",
        name: "Solar Kamehameha",
        description: "Unleashes solar-system-shattering velocity through flawless execution.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "cell-perfect-velocity",
        name: "Perfect Velocity Form",
        description: "Below 68 WPM deals -50% damage. 85+ WPM grants +40% bonus damage.",
        slowThreshold: 68,
        slowMultiplier: 0.5,
        thresholds: [
          { minWpm: 85, multiplier: 1.4, label: "PERFECT SPEED FORM" },
          { minWpm: 75, multiplier: 1.25, label: "SOLAR KAMEHAMEHA VELOCITY" },
        ],
      },
    ],
  },

  // 22. Gohan — Super Saiyan 2 Unleashed (Emotional Burst Velocity)
  {
    id: "gohan",
    name: "Gohan",
    anime: "Dragon Ball Z",
    world: "dragon",
    stage: 6,
    level: 33,
    type: "elite",
    typingFocus: "speed",
    maxHp: 1800,
    attack: 22,
    attackInterval: 3400,
    recommendedWpm: 86,
    recommendedAccuracy: 93,
    difficulty: 85,
    xpReward: 220,
    firstClearBonusXp: 400,
    isBoss: false,
    themeColor: "#eab308",
    accentColor: "#ca8a04",
    description:
      "The hidden prodigy awakening Super Saiyan 2. Unleashes golden lightning and furious high-speed combos.",
    abilities: [
      {
        id: "father-son-kamehameha",
        name: "Father-Son Kamehameha",
        description: "Channels ancestral power into an explosive, unyielding speed burst.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "gohan-ssj2-surge",
        name: "Super Saiyan 2 Surge",
        description: "Below 72 WPM incurs -55% damage. 92+ WPM unleashes +45% bonus damage.",
        slowThreshold: 72,
        slowMultiplier: 0.45,
        thresholds: [
          { minWpm: 92, multiplier: 1.45, label: "SUPER SAIYAN 2 BURST" },
          { minWpm: 80, multiplier: 1.25, label: "UNLEASHED POTENTIAL" },
        ],
      },
    ],
  },

  // 23. Broly — Legendary Wrath (Overwhelming Speed & Endurance)
  {
    id: "broly",
    name: "Broly",
    anime: "Dragon Ball Z",
    world: "dragon",
    stage: 7,
    level: 36,
    type: "boss",
    typingFocus: "speed",
    maxHp: 2200,
    attack: 25,
    attackInterval: 3100,
    recommendedWpm: 92,
    recommendedAccuracy: 94,
    difficulty: 92,
    xpReward: 270,
    firstClearBonusXp: 500,
    isBoss: true,
    themeColor: "#84cc16",
    accentColor: "#4d7c0f",
    description:
      "The Legendary Super Saiyan. Boundless ki and unstoppable momentum require relentless, non-stop typing velocity.",
    abilities: [
      {
        id: "gigantic-roar",
        name: "Gigantic Roar",
        description: "An uncontrollable tempest of emerald energy tearing through the arena.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "broly-berserker-rush",
        name: "Legendary Berserker Rush",
        description: "Below 78 WPM deals -60% damage. 98+ WPM deals +50% bonus damage.",
        slowThreshold: 78,
        slowMultiplier: 0.4,
        thresholds: [
          { minWpm: 98, multiplier: 1.5, label: "MAXIMUM POWER RUSH" },
          { minWpm: 88, multiplier: 1.3, label: "LEGENDARY BERSERKER SPEED" },
        ],
      },
    ],
  },

  // 24. Son Goku — Autonomous Ultra Instinct (The Supreme Velocity Crucible)
  {
    id: "goku",
    name: "Son Goku",
    anime: "Dragon Ball Z",
    world: "dragon",
    stage: 8,
    level: 40,
    type: "boss",
    typingFocus: "speed",
    maxHp: 2600,
    attack: 28,
    attackInterval: 2800,
    recommendedWpm: 98,
    recommendedAccuracy: 94,
    difficulty: 100,
    xpReward: 350,
    firstClearBonusXp: 700,
    isBoss: true,
    themeColor: "#f59e0b",
    accentColor: "#ef4444",
    description:
      "Autonomous Ultra Instinct. The body reacts and strikes without conscious thought. Demands sustained 95–105+ WPM to overcome.",
    abilities: [
      {
        id: "ultra-instinct",
        name: "Autonomous Ultra Instinct",
        description: "Fingers move at pure neural reflex, dodging hesitation and striking at godlike cadence.",
      },
      {
        id: "divine-kamehameha",
        name: "God Kamehameha",
        description: "Surfs across enemy attacks to deliver an overwhelming blast.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "goku-ultra-instinct-velocity",
        name: "Ultra Instinct Transcendence",
        description:
          "Below 85 WPM suffers -70% damage reduction. 95+ WPM deals +40%, and 105+ WPM unlocks +60% godlike damage.",
        slowThreshold: 85,
        slowMultiplier: 0.3,
        thresholds: [
          { minWpm: 105, multiplier: 1.6, label: "AUTONOMOUS ULTRA INSTINCT" },
          { minWpm: 95, multiplier: 1.4, label: "GODLIKE ACCELERATION" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // PIRATE WORLD — Consistency, Long Texts & Stamina Endurance
  // -------------------------------------------------------------
  // 25. Usopp — Sniper's Steady Breath (Baseline Rhythmic Consistency)
  {
    id: "usopp",
    name: "Usopp",
    anime: "One Piece",
    world: "pirate",
    stage: 1,
    level: 25,
    type: "normal",
    typingFocus: "consistency",
    maxHp: 750,
    attack: 10,
    attackInterval: 4800,
    recommendedWpm: 48,
    recommendedAccuracy: 92,
    difficulty: 40,
    xpReward: 80,
    firstClearBonusXp: 160,
    isBoss: false,
    themeColor: "#f59e0b",
    accentColor: "#d97706",
    description:
      "Sniper King of the Straw Hat Pirates. Demands patient, steady rhythmic breathing across extended sentences.",
    abilities: [
      {
        id: "firebird-star",
        name: "Firebird Star",
        description: "Launches a flaming projectile requiring steady, unhurried cadence.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "usopp-steady-breath",
        name: "Sniper's Steady Breath",
        description: "Keeping WPM within 12 of your match average grants +20% damage. Erratic swings suffer -25%.",
        maxWpmVariance: 12,
        maxAccVariance: 5,
        bonusMultiplier: 1.2,
        penaltyMultiplier: 0.75,
      },
    ],
  },

  // 26. Sanji — Black Leg Cadence (Culinary Rhythm Stability)
  {
    id: "sanji",
    name: "Sanji",
    anime: "One Piece",
    world: "pirate",
    stage: 2,
    level: 28,
    type: "normal",
    typingFocus: "consistency",
    maxHp: 900,
    attack: 12,
    attackInterval: 4500,
    recommendedWpm: 56,
    recommendedAccuracy: 93,
    difficulty: 50,
    xpReward: 100,
    firstClearBonusXp: 200,
    isBoss: false,
    themeColor: "#3b82f6",
    accentColor: "#f97316",
    description:
      "Cook of the Straw Hats and master of Black Leg style. Demands consistent, rhythmic kicks without frantic tempo swings.",
    abilities: [
      {
        id: "diable-jambe",
        name: "Diable Jambe",
        description: "Friction-ignited kicks reward flawless, continuous rhythmic pacing.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "sanji-leg-cadence",
        name: "Black Leg Cadence",
        description: "Keeping pace within 10 WPM of your battle average grants +25% bonus. Inconsistent swings deal -30%.",
        maxWpmVariance: 10,
        maxAccVariance: 4,
        bonusMultiplier: 1.25,
        penaltyMultiplier: 0.7,
      },
    ],
  },

  // 27. Roronoa Zoro — King of Hell (Combo Endurance & Focus)
  {
    id: "zoro",
    name: "Roronoa Zoro",
    anime: "One Piece",
    world: "pirate",
    stage: 3,
    level: 31,
    type: "elite",
    typingFocus: "consistency",
    maxHp: 1150,
    attack: 14,
    attackInterval: 4200,
    recommendedWpm: 64,
    recommendedAccuracy: 93,
    difficulty: 60,
    xpReward: 130,
    firstClearBonusXp: 250,
    isBoss: false,
    themeColor: "#10b981",
    accentColor: "#047857",
    description:
      "Master swordsman of the Three-Sword Style. Protects an unbroken combo string through grueling, high-stamina trials.",
    abilities: [
      {
        id: "ashura-nine-blades",
        name: "Demon Aura: Ashura",
        description: "Manifests nine spirit blades requiring unwavering combo discipline.",
      },
    ],
    mechanics: [
      {
        type: "combo-scaling",
        id: "zoro-three-sword-combo",
        name: "Three-Sword Combo Focus",
        description: "Combo x10 (+25%), x20 (+50%), x30 (+80%). Errors trigger a 6 HP counter-strike.",
        tiers: [
          { minCombo: 30, multiplier: 1.8, label: "KING OF HELL STRIKE" },
          { minCombo: 20, multiplier: 1.5, label: "ASHURA FLOW" },
          { minCombo: 10, multiplier: 1.25, label: "THREE-SWORD SYNC" },
        ],
        breakComboCounterAttack: 6,
      },
    ],
  },

  // 28. Trafalgar Law — Surgeon of Death (Spatial Cadence Precision)
  {
    id: "law",
    name: "Trafalgar Law",
    anime: "One Piece",
    world: "pirate",
    stage: 4,
    level: 34,
    type: "elite",
    typingFocus: "consistency",
    maxHp: 1400,
    attack: 17,
    attackInterval: 3900,
    recommendedWpm: 70,
    recommendedAccuracy: 94,
    difficulty: 70,
    xpReward: 160,
    firstClearBonusXp: 300,
    isBoss: false,
    themeColor: "#eab308",
    accentColor: "#0f172a",
    description:
      "Captain of the Heart Pirates. The Room creates an isolated operational theater requiring steady, methodical cadence.",
    abilities: [
      {
        id: "room-shambles",
        name: "Room: Shambles",
        description: "Rearranges the spatial battlefield, demanding disciplined composure.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "law-room-consistency",
        name: "Room Spatial Consistency",
        description: "Maintaining cadence within 8 WPM grants +30% damage. Erratic swings suffer -35%.",
        maxWpmVariance: 8,
        maxAccVariance: 3,
        bonusMultiplier: 1.3,
        penaltyMultiplier: 0.65,
      },
    ],
  },

  // 29. Donquixote Doflamingo — Heavenly Yaksha (Long-Text Puppet Flow)
  {
    id: "doflamingo",
    name: "Donquixote Doflamingo",
    anime: "One Piece",
    world: "pirate",
    stage: 5,
    level: 37,
    type: "elite",
    typingFocus: "consistency",
    maxHp: 1680,
    attack: 20,
    attackInterval: 3600,
    recommendedWpm: 76,
    recommendedAccuracy: 94,
    difficulty: 80,
    xpReward: 200,
    firstClearBonusXp: 370,
    isBoss: false,
    themeColor: "#ec4899",
    accentColor: "#be185d",
    description:
      "Ruler of Dressrosa. Weaves Birdcage strings into long-form sentences that test typing stamina and unbroken concentration.",
    abilities: [
      {
        id: "birdcage",
        name: "Birdcage Awakening",
        description: "Constricts the arena with razor-sharp strings as the battle progresses.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "doflamingo-string-flow",
        name: "Parasite String Flow",
        description: "Keeping pace within 7 WPM grants +35% damage. Drastic swings suffer -40%.",
        maxWpmVariance: 7,
        maxAccVariance: 3,
        bonusMultiplier: 1.35,
        penaltyMultiplier: 0.6,
      },
    ],
  },

  // 30. Charlotte Katakuri — Sweet Commander (Future Sight Rhythm)
  {
    id: "katakuri",
    name: "Charlotte Katakuri",
    anime: "One Piece",
    world: "pirate",
    stage: 6,
    level: 40,
    type: "elite",
    typingFocus: "consistency",
    maxHp: 1950,
    attack: 23,
    attackInterval: 3400,
    recommendedWpm: 82,
    recommendedAccuracy: 95,
    difficulty: 88,
    xpReward: 240,
    firstClearBonusXp: 440,
    isBoss: false,
    themeColor: "#9333ea",
    accentColor: "#581c87",
    description:
      "Supreme Commander of the Big Mom Pirates. Advanced Observation Haki reads your keystrokes ahead of time.",
    abilities: [
      {
        id: "future-sight",
        name: "Advanced Observation: Future Sight",
        description: "Anticipates each word before it appears, punishing hesitation immediately.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "katakuri-future-sight",
        name: "Future Sight Cadence",
        description: "Fluctuating by more than 6 WPM incurs -45% damage. Flawless consistency yields +40% bonus.",
        maxWpmVariance: 6,
        maxAccVariance: 2,
        bonusMultiplier: 1.4,
        penaltyMultiplier: 0.55,
      },
    ],
  },

  // 31. Kaido — King of the Beasts (Titan Endurance Trial)
  {
    id: "kaido",
    name: "Kaido",
    anime: "One Piece",
    world: "pirate",
    stage: 7,
    level: 44,
    type: "boss",
    typingFocus: "consistency",
    maxHp: 2350,
    attack: 26,
    attackInterval: 3200,
    recommendedWpm: 88,
    recommendedAccuracy: 95,
    difficulty: 94,
    xpReward: 290,
    firstClearBonusXp: 550,
    isBoss: true,
    themeColor: "#475569",
    accentColor: "#0284c7",
    description:
      "Emperor of the Sea and the world's strongest creature. Demands relentless multi-round stamina to wear down his draconic scale defense.",
    abilities: [
      {
        id: "thunder-bagua",
        name: "Thunder Bagua",
        description: "Strikes with devastating imperial haki, testing your defensive typing stamina.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "kaido-titan-endurance",
        name: "Thunder Bagua Endurance",
        description: "Variance under 6 WPM grants +45% damage. Fatigue swings suffer -50%.",
        maxWpmVariance: 6,
        maxAccVariance: 2,
        bonusMultiplier: 1.45,
        penaltyMultiplier: 0.5,
      },
    ],
  },

  // 32. Monkey D. Luffy — Gear 5 Sun God Nika (The Liberation Endurance Crucible)
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    anime: "One Piece",
    world: "pirate",
    stage: 8,
    level: 48,
    type: "boss",
    typingFocus: "consistency",
    maxHp: 2750,
    attack: 29,
    attackInterval: 2900,
    recommendedWpm: 94,
    recommendedAccuracy: 95,
    difficulty: 100,
    xpReward: 380,
    firstClearBonusXp: 750,
    isBoss: true,
    themeColor: "#38bdf8",
    accentColor: "#fbbf24",
    description:
      "Sun God Nika Awakening (Gear 5). The Drums of Liberation demand joy, stamina, and metronomic rhythm across long-form prose.",
    abilities: [
      {
        id: "drums-of-liberation",
        name: "Drums of Liberation",
        description: "Rhythmic heartbeat pulses across the battlefield, demanding metronomic consistency.",
      },
      {
        id: "bajrang-gun",
        name: "Gomu Gomu no Bajrang Gun",
        description: "An island-sized fist descending from the heavens that tests final combat endurance.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "luffy-gear5-rhythm",
        name: "Sun God Nika Rhythm of Liberation",
        description:
          "Variance within 5 WPM yields +50% bonus damage. Erratic bursts suffer -60% penalty.",
        maxWpmVariance: 5,
        maxAccVariance: 2,
        bonusMultiplier: 1.5,
        penaltyMultiplier: 0.4,
      },
    ],
  },

  // 33. Dungeon Guardian — E-Rank Gate Sentry (Weak Keys Introduction)
  {
    id: "dungeon_guardian",
    name: "Dungeon Guardian",
    anime: "Solo Leveling",
    world: "hunter",
    stage: 1,
    level: 32,
    type: "normal",
    typingFocus: "weak_keys",
    maxHp: 1300,
    attack: 18,
    attackInterval: 4200,
    recommendedWpm: 50,
    recommendedAccuracy: 93,
    difficulty: 45,
    xpReward: 90,
    firstClearBonusXp: 180,
    isBoss: false,
    themeColor: "#06b6d4",
    accentColor: "#64748b",
    description:
      "Dungeon Sentry of the Double Lair. Tests fundamental key control and punishes inaccurate strikes.",
    abilities: [
      {
        id: "stone-slam",
        name: "Stone Slam",
        description: "Heavy stone club swing that punishes sloppy keystrokes.",
      },
    ],
    mechanics: [
      {
        type: "adaptive-weakness",
        id: "guardian-system-check",
        name: "Dungeon System Gate",
        description:
          "Gate system check. Typing errors trigger -25% damage penalty. Clean typing grants +15% damage bonus.",
        errorPenaltyMultiplier: 0.75,
        flawlessBonusMultiplier: 1.15,
        minAccuracyRequirement: 93,
      },
    ],
  },

  // 34. Cerberus — Keeper of the Hell Gate (Hellhound Weak Key Trial)
  {
    id: "cerberus",
    name: "Cerberus",
    anime: "Solo Leveling",
    world: "hunter",
    stage: 2,
    level: 35,
    type: "normal",
    typingFocus: "weak_keys",
    maxHp: 1480,
    attack: 20,
    attackInterval: 4000,
    recommendedWpm: 58,
    recommendedAccuracy: 94,
    difficulty: 55,
    xpReward: 110,
    firstClearBonusXp: 220,
    isBoss: false,
    themeColor: "#ef4444",
    accentColor: "#f97316",
    description:
      "Gatekeeper of the Demon Castle. Three-headed demon hound punishing hesitation on difficult letter transitions.",
    abilities: [
      {
        id: "hellfire-breath",
        name: "Hellfire Breath",
        description: "Blazing breath covering the battlefield in sulfurous flame.",
      },
    ],
    mechanics: [
      {
        type: "adaptive-weakness",
        id: "cerberus-gate-pressure",
        name: "Hell Gate Pressure",
        description:
          "Hellhound trial. Errors incur -30% penalty. Clean typing with 94%+ accuracy deals +20% bonus damage.",
        errorPenaltyMultiplier: 0.7,
        flawlessBonusMultiplier: 1.2,
        minAccuracyRequirement: 94,
      },
    ],
  },

  // 35. Blood-Red Commander Igris — The Crimson Knight (Chivalric Precision)
  {
    id: "igris",
    name: "Blood-Red Commander Igris",
    anime: "Solo Leveling",
    world: "hunter",
    stage: 3,
    level: 38,
    type: "elite",
    typingFocus: "weak_keys",
    maxHp: 1680,
    attack: 22,
    attackInterval: 3800,
    recommendedWpm: 66,
    recommendedAccuracy: 94,
    difficulty: 65,
    xpReward: 140,
    firstClearBonusXp: 270,
    isBoss: false,
    themeColor: "#dc2626",
    accentColor: "#991b1b",
    description:
      "Commander of the Throne Room. Chivalric longsword duelist punishing weak key fumbles with lethal counters.",
    abilities: [
      {
        id: "longsword-cleave",
        name: "Longsword Cleave",
        description: "A sweeping crimson blade arc that parries flawed keystrokes.",
      },
    ],
    mechanics: [
      {
        type: "adaptive-weakness",
        id: "igris-chivalric-vigil",
        name: "Knight Commander's Vigil",
        description:
          "Chivalric precision. Blood-Red Commander punishes mistakes with -35% damage. Clean precision grants +25% bonus.",
        errorPenaltyMultiplier: 0.65,
        flawlessBonusMultiplier: 1.25,
        minAccuracyRequirement: 94,
      },
    ],
  },

  // 36. Iron — The Indomitable Shadow Tank (Shield Bastion Barrier)
  {
    id: "iron",
    name: "Iron",
    anime: "Solo Leveling",
    world: "hunter",
    stage: 4,
    level: 41,
    type: "normal",
    typingFocus: "weak_keys",
    maxHp: 1900,
    attack: 23,
    attackInterval: 3600,
    recommendedWpm: 72,
    recommendedAccuracy: 94,
    difficulty: 72,
    xpReward: 170,
    firstClearBonusXp: 320,
    isBoss: false,
    themeColor: "#64748b",
    accentColor: "#334155",
    description:
      "Indomitable Shadow Tank. Massive shield and heavy armor demand clean strikes to break through.",
    abilities: [
      {
        id: "taunting-roar",
        name: "Taunting Roar",
        description: "Echoing war cry that shakes player resolve.",
      },
    ],
    mechanics: [
      {
        type: "adaptive-weakness",
        id: "iron-shield-bastion",
        name: "Shield Bastion Barrier",
        description:
          "Heavy armor barrier. Any error incurs -40% damage penalty. Flawless execution pierces armor for +30% bonus.",
        errorPenaltyMultiplier: 0.6,
        flawlessBonusMultiplier: 1.3,
        minAccuracyRequirement: 95,
      },
    ],
  },

  // 37. Tusk — High Orc Shaman (Hymn of Agony Curse)
  {
    id: "tusk",
    name: "Tusk",
    anime: "Solo Leveling",
    world: "hunter",
    stage: 5,
    level: 44,
    type: "elite",
    typingFocus: "weak_keys",
    maxHp: 2100,
    attack: 25,
    attackInterval: 3400,
    recommendedWpm: 78,
    recommendedAccuracy: 95,
    difficulty: 80,
    xpReward: 210,
    firstClearBonusXp: 390,
    isBoss: false,
    themeColor: "#d97706",
    accentColor: "#b45309",
    description:
      "High Orc Grand Shaman Kargalgan. Gravity and hymn curses test focus on the most difficult key patterns.",
    abilities: [
      {
        id: "hymn-of-dragons",
        name: "Hymn of Fire Dragons",
        description: "Incinerating flame pillars summoned by ancient orc incantations.",
      },
    ],
    mechanics: [
      {
        type: "adaptive-weakness",
        id: "tusk-hymn-curse",
        name: "Hymn of Agony Curse",
        description:
          "High Orc Shaman curse. Weak keystrokes trigger -45% damage reduction. Overcoming weak keys grants +35% bonus.",
        errorPenaltyMultiplier: 0.55,
        flawlessBonusMultiplier: 1.35,
        minAccuracyRequirement: 95,
      },
    ],
  },

  // 38. Beru — The Ant King (Apex Predator Speed & Reflexes)
  {
    id: "beru",
    name: "Beru",
    anime: "Solo Leveling",
    world: "hunter",
    stage: 6,
    level: 47,
    type: "boss",
    typingFocus: "weak_keys",
    maxHp: 2350,
    attack: 27,
    attackInterval: 3200,
    recommendedWpm: 84,
    recommendedAccuracy: 95,
    difficulty: 88,
    xpReward: 260,
    firstClearBonusXp: 480,
    isBoss: false,
    themeColor: "#8b5cf6",
    accentColor: "#6d28d9",
    description:
      "The Apex Predator of Jeju Island. Supreme speed and lethal claws that counter-attack on any dropped combo.",
    abilities: [
      {
        id: "predator-rush",
        name: "Predator Rush",
        description: "Supersonic blitz shredding anything caught hesitating.",
      },
    ],
    mechanics: [
      {
        type: "adaptive-weakness",
        id: "beru-predator-strike",
        name: "Predator King Strike",
        description:
          "Extreme hunter instincts. Mistakes trigger -50% penalty and enemy counter-strikes. Flawless execution yields +40% bonus.",
        errorPenaltyMultiplier: 0.5,
        flawlessBonusMultiplier: 1.4,
        minAccuracyRequirement: 96,
      },
      {
        type: "combo-scaling",
        id: "beru-combo-counter",
        name: "Predator Counter",
        description: "Combo drops trigger immediate counter-damage.",
        tiers: [
          { minCombo: 15, multiplier: 1.15, label: "HIVE SHATTER (x1.15)" },
          { minCombo: 30, multiplier: 1.3, label: "PREDATOR DOMINANCE (x1.3)" },
        ],
        breakComboCounterAttack: 20,
      },
    ],
  },

  // 39. Bellion — Grand Marshal of the Shadow Army (Supreme Authority)
  {
    id: "bellion",
    name: "Bellion",
    anime: "Solo Leveling",
    world: "hunter",
    stage: 7,
    level: 50,
    type: "boss",
    typingFocus: "weak_keys",
    maxHp: 2600,
    attack: 29,
    attackInterval: 3000,
    recommendedWpm: 90,
    recommendedAccuracy: 96,
    difficulty: 94,
    xpReward: 310,
    firstClearBonusXp: 580,
    isBoss: true,
    themeColor: "#6366f1",
    accentColor: "#4338ca",
    description:
      "Grand Marshal born from the World Tree. Centipede segmented greatsword sweeps through any keyboard flaws.",
    abilities: [
      {
        id: "centipede-blade",
        name: "Centipede Blade",
        description: "Segmented whip-sword that coils around uncoordinated finger movements.",
      },
    ],
    mechanics: [
      {
        type: "adaptive-weakness",
        id: "bellion-marshal-authority",
        name: "Grand Marshal Authority",
        description:
          "Supreme shadow command. Errors reduce damage by -55%. Flawless keystrokes with 96%+ accuracy grant +45% bonus.",
        errorPenaltyMultiplier: 0.45,
        flawlessBonusMultiplier: 1.45,
        minAccuracyRequirement: 96,
      },
    ],
  },

  // 40. Sung Jin-Woo — The Shadow Monarch (The System Crucible & Arise)
  {
    id: "jinwoo",
    name: "Sung Jin-Woo",
    anime: "Solo Leveling",
    world: "hunter",
    stage: 8,
    level: 55,
    type: "boss",
    typingFocus: "weak_keys",
    maxHp: 2900,
    attack: 31,
    attackInterval: 2800,
    recommendedWpm: 96,
    recommendedAccuracy: 96,
    difficulty: 100,
    xpReward: 400,
    firstClearBonusXp: 800,
    isBoss: true,
    themeColor: "#06b6d4",
    accentColor: "#a855f7",
    description:
      "The Shadow Monarch. The System identifies every weak key in your muscle memory and tests your ultimate mastery.",
    abilities: [
      {
        id: "arise-call",
        name: "Arise",
        description: "Extracts shadows from every imperfection in your cadence.",
      },
      {
        id: "monarch-domain",
        name: "Monarch's Domain",
        description: "Shadow domain amplifying damage on flawless execution.",
      },
    ],
    mechanics: [
      {
        type: "adaptive-weakness",
        id: "jinwoo-monarch-arise",
        name: "Shadow Monarch's Arise",
        description:
          "The System tests your weakest keys. Mistakes trigger -65% damage reduction. Flawless accuracy with unbroken combos yields +55% sovereign damage.",
        errorPenaltyMultiplier: 0.35,
        flawlessBonusMultiplier: 1.55,
        minAccuracyRequirement: 96,
      },
      {
        type: "combo-scaling",
        id: "jinwoo-shadow-dominion",
        name: "Shadow Dominion",
        description: "Combo streaks empower shadow strikes; dropping combo triggers counter-attack.",
        tiers: [
          { minCombo: 20, multiplier: 1.2, label: "SHADOW SURGE (x1.2)" },
          { minCombo: 35, multiplier: 1.35, label: "MONARCH'S DOMAIN (x1.35)" },
          { minCombo: 50, multiplier: 1.5, label: "ARISE SOVEREIGN (x1.5)" },
        ],
        breakComboCounterAttack: 25,
      },
    ],
  },

  // 41. Zenitsu Agatsuma — Thunderclap and Flash (Home Row & Index Sprint)
  {
    id: "zenitsu",
    name: "Zenitsu Agatsuma",
    anime: "Demon Slayer",
    world: "demon",
    stage: 1,
    level: 36,
    type: "normal",
    typingFocus: "touch_typing",
    maxHp: 1400,
    attack: 20,
    attackInterval: 4000,
    recommendedWpm: 54,
    recommendedAccuracy: 93,
    difficulty: 50,
    xpReward: 100,
    firstClearBonusXp: 200,
    isBoss: false,
    themeColor: "#eab308",
    accentColor: "#ca8a04",
    description:
      "Thunder Breathing First Form: Thunderclap and Flash. Demands lightning-fast index finger bursts and home-row anchors.",
    abilities: [
      {
        id: "thunderclap-flash",
        name: "Thunderclap and Flash",
        description: "A blinding forward dash powered by rapid index finger strikes.",
      },
    ],
    mechanics: [
      {
        type: "touch-typing",
        id: "zenitsu-thunder-discipline",
        name: "Thunder Breathing First Form",
        description:
          "Index finger sprint. Accuracy under 93% breaks rhythm (-25% damage). 93%+ grants +15% thunder speed bonus.",
        accuracyThreshold: 93,
        bonusMultiplier: 1.15,
        penaltyMultiplier: 0.75,
      },
    ],
  },

  // 42. Inosuke Hashibira — Beast Breathing (Middle & Ring Finger Reach)
  {
    id: "inosuke",
    name: "Inosuke Hashibira",
    anime: "Demon Slayer",
    world: "demon",
    stage: 2,
    level: 39,
    type: "normal",
    typingFocus: "touch_typing",
    maxHp: 1580,
    attack: 22,
    attackInterval: 3800,
    recommendedWpm: 62,
    recommendedAccuracy: 94,
    difficulty: 60,
    xpReward: 125,
    firstClearBonusXp: 250,
    isBoss: false,
    themeColor: "#0284c7",
    accentColor: "#0369a1",
    description:
      "Beast Breathing Fang Styles. Aggressive serrated twin blades test middle and ring finger reach across rows.",
    abilities: [
      {
        id: "crazy-cutting",
        name: "Crazy Cutting",
        description: "Feral dual-blade flurry slicing through uncoordinated finger movements.",
      },
    ],
    mechanics: [
      {
        type: "touch-typing",
        id: "inosuke-beast-reach",
        name: "Beast Breathing Spatial Sense",
        description:
          "Middle and ring finger coordination. Below 94% accuracy incurs -30% damage. 94%+ yields +20% beast fury bonus.",
        accuracyThreshold: 94,
        bonusMultiplier: 1.2,
        penaltyMultiplier: 0.7,
      },
    ],
  },

  // 43. Shinobu Kocho — Insect Breathing (Pinky Precision & Flutter)
  {
    id: "shinobu",
    name: "Shinobu Kocho",
    anime: "Demon Slayer",
    world: "demon",
    stage: 3,
    level: 42,
    type: "normal",
    typingFocus: "touch_typing",
    maxHp: 1780,
    attack: 23,
    attackInterval: 3600,
    recommendedWpm: 68,
    recommendedAccuracy: 95,
    difficulty: 70,
    xpReward: 155,
    firstClearBonusXp: 300,
    isBoss: false,
    themeColor: "#c084fc",
    accentColor: "#a855f7",
    description:
      "Insect Breathing Dance of the Butterfly. Lethal wisteria poison delivered through delicate pinky finger precision.",
    abilities: [
      {
        id: "butterfly-dance",
        name: "Dance of the Butterfly",
        description: "Fluttering thrusts injecting lethal wisteria poison into typographical flaws.",
      },
    ],
    mechanics: [
      {
        type: "touch-typing",
        id: "shinobu-pinky-flutter",
        name: "Insect Breathing Wisteria Thrust",
        description:
          "Pinky finger precision test. Below 95% accuracy drops damage by -35%. 95%+ grants +25% venom bonus.",
        accuracyThreshold: 95,
        bonusMultiplier: 1.25,
        penaltyMultiplier: 0.65,
      },
    ],
  },

  // 44. Kyojuro Rengoku — Flame Hashira (Alternating Hand Cadence)
  {
    id: "rengoku",
    name: "Kyojuro Rengoku",
    anime: "Demon Slayer",
    world: "demon",
    stage: 4,
    level: 45,
    type: "elite",
    typingFocus: "touch_typing",
    maxHp: 2050,
    attack: 25,
    attackInterval: 3400,
    recommendedWpm: 76,
    recommendedAccuracy: 95,
    difficulty: 78,
    xpReward: 190,
    firstClearBonusXp: 370,
    isBoss: false,
    themeColor: "#f97316",
    accentColor: "#ea580c",
    description:
      "Flame Breathing Ninth Form: Rengoku. Set your heart ablaze and maintain harmonic alternating hand cadence.",
    abilities: [
      {
        id: "flame-tiger",
        name: "Flame Tiger",
        description: "A ferocious roaring tiger of pure flame devouring hesitant typists.",
      },
    ],
    mechanics: [
      {
        type: "touch-typing",
        id: "rengoku-flame-cadence",
        name: "Set Your Heart Ablaze",
        description:
          "Alternating hand harmony. Below 95% accuracy incurs -40% damage. 95%+ ignites +30% blazing bonus.",
        accuracyThreshold: 95,
        bonusMultiplier: 1.3,
        penaltyMultiplier: 0.6,
      },
    ],
  },

  // 45. Akaza — Upper Moon Three (Compass Needle Symmetry)
  {
    id: "akaza",
    name: "Akaza",
    anime: "Demon Slayer",
    world: "demon",
    stage: 5,
    level: 48,
    type: "elite",
    typingFocus: "touch_typing",
    maxHp: 2300,
    attack: 27,
    attackInterval: 3200,
    recommendedWpm: 82,
    recommendedAccuracy: 95,
    difficulty: 86,
    xpReward: 230,
    firstClearBonusXp: 440,
    isBoss: false,
    themeColor: "#ec4899",
    accentColor: "#db2777",
    description:
      "Destructive Death: Compass Needle. Senses fighting spirit and punishes any hand asymmetry or dropped combo.",
    abilities: [
      {
        id: "compass-needle",
        name: "Compass Needle",
        description: "Deploys a snowflake compass instantly homing in on finger hesitation.",
      },
      {
        id: "air-type",
        name: "Air Type Shockwaves",
        description: "Invisible fist shockwaves punishing errors with counter-damage.",
      },
    ],
    mechanics: [
      {
        type: "touch-typing",
        id: "akaza-compass-symmetry",
        name: "Destructive Death Compass",
        description:
          "Two-hand symmetry check. Below 95% accuracy suffers -45% damage. 95%+ grants +35% martial bonus.",
        accuracyThreshold: 95,
        bonusMultiplier: 1.35,
        penaltyMultiplier: 0.55,
      },
      {
        type: "combo-scaling",
        id: "akaza-annihilation-counter",
        name: "Annihilation Type Counter",
        description: "Combo drops trigger immediate counter-damage.",
        tiers: [
          { minCombo: 15, multiplier: 1.15, label: "MARTIAL HARMONY (x1.15)" },
          { minCombo: 30, multiplier: 1.3, label: "COMPASS SYMMETRY (x1.3)" },
        ],
        breakComboCounterAttack: 20,
      },
    ],
  },

  // 46. Gyutaro & Daki — Upper Moon Six (Dual Hand Coordination)
  {
    id: "gyutaro",
    name: "Gyutaro & Daki",
    anime: "Demon Slayer",
    world: "demon",
    stage: 6,
    level: 51,
    type: "boss",
    typingFocus: "touch_typing",
    maxHp: 2550,
    attack: 29,
    attackInterval: 3000,
    recommendedWpm: 88,
    recommendedAccuracy: 96,
    difficulty: 92,
    xpReward: 280,
    firstClearBonusXp: 530,
    isBoss: false,
    themeColor: "#84cc16",
    accentColor: "#65a30d",
    description:
      "Blood Demon Art: Flying Blood Scythes and Obi Sashes. Twin battle requiring synchronized left and right hand touch-typing.",
    abilities: [
      {
        id: "blood-scythes",
        name: "Flying Blood Scythes",
        description: "Rotating razor-sharp blood scythes tracking typing cadence.",
      },
      {
        id: "obi-slashes",
        name: "Obi Sash Entanglement",
        description: "Constricting ribbon ribbons that punish uncoordinated finger strikes.",
      },
    ],
    mechanics: [
      {
        type: "touch-typing",
        id: "gyutaro-twin-coordination",
        name: "Dual Blood Demon Coordination",
        description:
          "Dual hand synchronization. Below 96% accuracy drops damage by -50%. 96%+ yields +40% severed bond bonus.",
        accuracyThreshold: 96,
        bonusMultiplier: 1.4,
        penaltyMultiplier: 0.5,
      },
    ],
  },

  // 47. Kokushibo — Upper Moon One (Ten-Finger Total Concentration)
  {
    id: "kokushibo",
    name: "Kokushibo",
    anime: "Demon Slayer",
    world: "demon",
    stage: 7,
    level: 54,
    type: "boss",
    typingFocus: "touch_typing",
    maxHp: 2800,
    attack: 31,
    attackInterval: 2800,
    recommendedWpm: 94,
    recommendedAccuracy: 96,
    difficulty: 96,
    xpReward: 340,
    firstClearBonusXp: 650,
    isBoss: true,
    themeColor: "#6b21a8",
    accentColor: "#581c87",
    description:
      "Moon Breathing: First to Sixteenth Form. Upper Moon One commands supreme swordsmanship across all ten fingers.",
    abilities: [
      {
        id: "moon-dragon-ring",
        name: "Moon Dragon Ringtail",
        description: "A sweeping gigantic blade arc releasing hundreds of chaotic crescent moon blades.",
      },
      {
        id: "calamity-moon",
        name: "Catastrophe: Ten-Eyed Moon",
        description: "Unleashes dimensional moon crescent slashes across the arena.",
      },
    ],
    mechanics: [
      {
        type: "touch-typing",
        id: "kokushibo-moon-discipline",
        name: "Moon Breathing Total Concentration",
        description:
          "Ten-finger moon discipline. Below 96% accuracy incurs -55% damage penalty. 96%+ grants +45% celestial crescent bonus.",
        accuracyThreshold: 96,
        bonusMultiplier: 1.45,
        penaltyMultiplier: 0.45,
      },
    ],
  },

  // 48. Muzan Kibutsuji — The Demon King (Flawless Ten-Finger Biokinesis Crucible)
  {
    id: "muzan",
    name: "Muzan Kibutsuji",
    anime: "Demon Slayer",
    world: "demon",
    stage: 8,
    level: 60,
    type: "boss",
    typingFocus: "touch_typing",
    maxHp: 3100,
    attack: 33,
    attackInterval: 2600,
    recommendedWpm: 100,
    recommendedAccuracy: 97,
    difficulty: 100,
    xpReward: 450,
    firstClearBonusXp: 900,
    isBoss: true,
    themeColor: "#e11d48",
    accentColor: "#be123c",
    description:
      "The Demon Progenitor. Biokinesis whip arms and cellular regeneration test ultimate touch-typing mastery across every finger.",
    abilities: [
      {
        id: "flesh-whips",
        name: "Biokinesis Flesh Whips",
        description: "Supersonic serrated arm whips shredding through any typing hesitation.",
      },
      {
        id: "black-blood-bramble",
        name: "Black Blood: Bramble Web",
        description: "Cellular poison webs covering the arena to crush uncoordinated hands.",
      },
    ],
    mechanics: [
      {
        type: "touch-typing",
        id: "muzan-total-concentration-constant",
        name: "Total Concentration Constant Crucible",
        description:
          "The supreme touch-typing test. Below 97% accuracy suffers -65% cellular decay. 97%+ accuracy yields +60% dawn sunlight damage.",
        accuracyThreshold: 97,
        bonusMultiplier: 1.6,
        penaltyMultiplier: 0.35,
      },
      {
        type: "combo-scaling",
        id: "muzan-sun-breathing-combo",
        name: "Sun Breathing Thirteenth Form",
        description: "Continuous combo streaks chain the 12 breathing forms into the sun form; error counter-attack.",
        tiers: [
          { minCombo: 20, multiplier: 1.2, label: "SUN HARMONY (x1.2)" },
          { minCombo: 35, multiplier: 1.35, label: "HINOKAMI KAGURA (x1.35)" },
          { minCombo: 50, multiplier: 1.6, label: "SUN BREATHING FORM 13 (x1.6)" },
        ],
        breakComboCounterAttack: 30,
      },
    ],
  },

  // 49. Cipher Initiate — The Digital Gatekeeper (Nexus Mastery Stage 1)
  {
    id: "cipher_initiate",
    name: "Cipher Initiate",
    anime: "KeyForge",
    world: "nexus",
    stage: 1,
    level: 50,
    type: "normal",
    typingFocus: "mastery",
    maxHp: 1800,
    attack: 24,
    attackInterval: 3600,
    recommendedWpm: 70,
    recommendedAccuracy: 94,
    difficulty: 70,
    xpReward: 160,
    firstClearBonusXp: 320,
    isBoss: false,
    themeColor: "#f97316",
    accentColor: "#ea580c",
    description:
      "First sentinel of the KeyForge Core. Tests simultaneous speed and precision discipline.",
    abilities: [
      {
        id: "binary-barrage",
        name: "Binary Barrage",
        description: "A cascade of encrypted datastreams testing core typing cadence.",
      },
    ],
    mechanics: [
      {
        type: "nexus-mastery",
        id: "cipher-gate-mastery",
        name: "Cipher Protocol",
        description:
          "Simultaneous speed and precision. Requires 68+ WPM and 94%+ accuracy for +20% bonus; otherwise deals -30% damage.",
        minWpm: 68,
        minAccuracy: 94,
        bonusMultiplier: 1.2,
        penaltyMultiplier: 0.7,
      },
    ],
  },

  // 50. Lexicon Warden — Vocabulary Complexity (Nexus Mastery Stage 2)
  {
    id: "lexicon_warden",
    name: "Lexicon Warden",
    anime: "KeyForge",
    world: "nexus",
    stage: 2,
    level: 53,
    type: "normal",
    typingFocus: "mastery",
    maxHp: 2050,
    attack: 26,
    attackInterval: 3400,
    recommendedWpm: 76,
    recommendedAccuracy: 95,
    difficulty: 78,
    xpReward: 190,
    firstClearBonusXp: 380,
    isBoss: false,
    themeColor: "#eab308",
    accentColor: "#ca8a04",
    description:
      "Guardian of the Infinite Lexicon. Complex syllables and multi-clause sentences demand linguistic mastery.",
    abilities: [
      {
        id: "lexical-bind",
        name: "Lexical Bind",
        description: "Spells woven from esoteric vocabulary that tangle hesitant hands.",
      },
    ],
    mechanics: [
      {
        type: "nexus-mastery",
        id: "lexicon-syntax-mastery",
        name: "Lexical Complexity Protocol",
        description:
          "Advanced vocabulary crucible. Requires 74+ WPM and 95%+ accuracy for +25% bonus; otherwise -35% penalty.",
        minWpm: 74,
        minAccuracy: 95,
        bonusMultiplier: 1.25,
        penaltyMultiplier: 0.65,
      },
    ],
  },

  // 51. Rhythm Weaver — The Metronome Core (Nexus Mastery Stage 3)
  {
    id: "rhythm_weaver",
    name: "Rhythm Weaver",
    anime: "KeyForge",
    world: "nexus",
    stage: 3,
    level: 56,
    type: "elite",
    typingFocus: "mastery",
    maxHp: 2300,
    attack: 28,
    attackInterval: 3200,
    recommendedWpm: 82,
    recommendedAccuracy: 95,
    difficulty: 84,
    xpReward: 230,
    firstClearBonusXp: 450,
    isBoss: false,
    themeColor: "#06b6d4",
    accentColor: "#0891b2",
    description:
      "Pulsing metronome of the Crucible. Punishes erratic burst swings and rewards seamless typing flow.",
    abilities: [
      {
        id: "cadence-pulse",
        name: "Cadence Pulse",
        description: "Rhythmic waves radiating across the screen measuring typing variance.",
      },
    ],
    mechanics: [
      {
        type: "consistency",
        id: "rhythm-weaver-metronome",
        name: "Harmonic Cadence Lock",
        description:
          "Variance within 6 WPM grants +35% damage bonus. Speed swings greater than 6 WPM suffer -40% damage penalty.",
        maxWpmVariance: 6,
        maxAccVariance: 2,
        bonusMultiplier: 1.35,
        penaltyMultiplier: 0.6,
      },
    ],
  },

  // 52. Accuracy Arbiter — The Zero-Error Sentinel (Nexus Mastery Stage 4)
  {
    id: "accuracy_arbiter",
    name: "Accuracy Arbiter",
    anime: "KeyForge",
    world: "nexus",
    stage: 4,
    level: 59,
    type: "elite",
    typingFocus: "mastery",
    maxHp: 2550,
    attack: 30,
    attackInterval: 3000,
    recommendedWpm: 88,
    recommendedAccuracy: 97,
    difficulty: 90,
    xpReward: 270,
    firstClearBonusXp: 530,
    isBoss: false,
    themeColor: "#8b5cf6",
    accentColor: "#7c3aed",
    description:
      "Flawless perfectionist sentinel. Absorbs all damage if accuracy falls below 97%.",
    abilities: [
      {
        id: "purity-barrier",
        name: "Purity Barrier",
        description: "Crystalline barrier reflecting any imperfect typing keystroke.",
      },
    ],
    mechanics: [
      {
        type: "precision-strike",
        id: "accuracy-arbiter-null-error",
        name: "Zero-Error Crystalline Shield",
        description:
          "Below 97% accuracy suffers -50% damage reduction. 97%+ accuracy pierces shield for +35% bonus.",
        targetAccuracy: 97,
        belowThresholdPenalty: 0.5,
        aboveThresholdBonus: 1.35,
      },
    ],
  },

  // 53. Velocity Phantom — The Hyper-Cadence Core (Nexus Mastery Stage 5)
  {
    id: "velocity_phantom",
    name: "Velocity Phantom",
    anime: "KeyForge",
    world: "nexus",
    stage: 5,
    level: 62,
    type: "elite",
    typingFocus: "mastery",
    maxHp: 2800,
    attack: 32,
    attackInterval: 2800,
    recommendedWpm: 96,
    recommendedAccuracy: 95,
    difficulty: 94,
    xpReward: 310,
    firstClearBonusXp: 600,
    isBoss: false,
    themeColor: "#10b981",
    accentColor: "#059669",
    description:
      "Tachyon-infused speed phantom. Requires blinding velocity of 96+ WPM to overcome.",
    abilities: [
      {
        id: "lightspeed-phase",
        name: "Lightspeed Phase",
        description: "Phases through keystrokes struck below supersonic cadence.",
      },
    ],
    mechanics: [
      {
        type: "speed-check",
        id: "velocity-phantom-blitz",
        name: "Hyper-Velocity Overdrive",
        description:
          "Velocity barrier. Below 90 WPM deals -50% damage. 96+ WPM deals +25% bonus; 104+ WPM unlocks +45% hyper-damage.",
        slowThreshold: 90,
        slowMultiplier: 0.5,
        thresholds: [
          { minWpm: 96, multiplier: 1.25, label: "VELOCITY BREAKTHROUGH" },
          { minWpm: 104, multiplier: 1.45, label: "HYPER-SPEED TRANSCENDENCE" },
        ],
      },
    ],
  },

  // 54. Endurance Colossus — The Unyielding Monolith (Nexus Mastery Stage 6)
  {
    id: "endurance_colossus",
    name: "Endurance Colossus",
    anime: "KeyForge",
    world: "nexus",
    stage: 6,
    level: 65,
    type: "boss",
    typingFocus: "mastery",
    maxHp: 3100,
    attack: 34,
    attackInterval: 2700,
    recommendedWpm: 92,
    recommendedAccuracy: 96,
    difficulty: 96,
    xpReward: 360,
    firstClearBonusXp: 700,
    isBoss: false,
    themeColor: "#6366f1",
    accentColor: "#4f46e5",
    description:
      "Gargantuan titan carved from monolithic data strata. Massive HP pool tests marathon combo stamina.",
    abilities: [
      {
        id: "monolithic-weight",
        name: "Monolithic Weight",
        description: "Crushing gravity demanding continuous uninterrupted combo strings.",
      },
    ],
    mechanics: [
      {
        type: "combo-scaling",
        id: "endurance-colossus-chain",
        name: "Monolithic Combo Resonator",
        description:
          "Sustained combo streaks scale damage up to +60%; breaking combo triggers heavy counter-attack.",
        tiers: [
          { minCombo: 20, multiplier: 1.2, label: "MOMENTUM RESONANCE (x1.2)" },
          { minCombo: 40, multiplier: 1.4, label: "TITANIC FORCE (x1.4)" },
          { minCombo: 60, multiplier: 1.6, label: "UNBREAKABLE MONOLITH (x1.6)" },
        ],
        breakComboCounterAttack: 25,
      },
    ],
  },

  // 55. Keystroke Sovereign — The Grand Architect (Nexus Mastery Stage 7)
  {
    id: "keystroke_sovereign",
    name: "Keystroke Sovereign",
    anime: "KeyForge",
    world: "nexus",
    stage: 7,
    level: 68,
    type: "boss",
    typingFocus: "mastery",
    maxHp: 3400,
    attack: 36,
    attackInterval: 2500,
    recommendedWpm: 98,
    recommendedAccuracy: 97,
    difficulty: 98,
    xpReward: 420,
    firstClearBonusXp: 850,
    isBoss: true,
    themeColor: "#ec4899",
    accentColor: "#db2777",
    description:
      "Architect of the Crucible. Harmonizes speed, accuracy, and endurance into a unified final challenge.",
    abilities: [
      {
        id: "architect-matrix",
        name: "Architect Matrix",
        description: "Rearranges the digital battlefield into a comprehensive mastery trial.",
      },
    ],
    mechanics: [
      {
        type: "nexus-mastery",
        id: "sovereign-grand-mastery",
        name: "Grand Architect Mastery",
        description:
          "Requires 95+ WPM and 97%+ accuracy simultaneously for +45% sovereign bonus; otherwise deals -55% damage.",
        minWpm: 95,
        minAccuracy: 97,
        bonusMultiplier: 1.45,
        penaltyMultiplier: 0.45,
      },
    ],
  },

  // 56. The Nexus Mirror — The Mirror Sovereign (KeyForge Grand Climax Final Boss)
  {
    id: "nexus_mirror",
    name: "The Nexus Mirror",
    anime: "KeyForge",
    world: "nexus",
    stage: 8,
    level: 75,
    type: "boss",
    typingFocus: "mastery",
    maxHp: 3800,
    attack: 40,
    attackInterval: 2300,
    recommendedWpm: 105,
    recommendedAccuracy: 98,
    difficulty: 100,
    xpReward: 500,
    firstClearBonusXp: 1000,
    isBoss: true,
    themeColor: "#f97316",
    accentColor: "#a855f7",
    description:
      "The Living Reflection of the Typist. Adapts to your personal speed, accuracy, and rhythm. The ultimate crucible of KeyForge.",
    abilities: [
      {
        id: "mirror-reflection",
        name: "Soul Mirror",
        description: "Reflects your own typing prowess against you in real-time combat.",
      },
      {
        id: "crucible-ascendance",
        name: "Crucible Ascendance",
        description: "The entire digital universe concentrates into the ultimate test of human typing mastery.",
      },
    ],
    mechanics: [
      {
        type: "nexus-mastery",
        id: "nexus-mirror-sovereign-test",
        name: "The Mirror Sovereign Crucible",
        description:
          "The supreme mastery threshold. Requires 100+ WPM and 98%+ accuracy simultaneously for +65% transcendence bonus; otherwise deals -65% penalty.",
        minWpm: 100,
        minAccuracy: 98,
        bonusMultiplier: 1.65,
        penaltyMultiplier: 0.35,
      },
      {
        type: "combo-scaling",
        id: "nexus-mirror-combo",
        name: "Echoing Reflection Chain",
        description: "Unbroken combo streak amplifies damage; dropping combo triggers devastating reflection shockwave.",
        tiers: [
          { minCombo: 25, multiplier: 1.25, label: "PERFECT REFLECTION (x1.25)" },
          { minCombo: 50, multiplier: 1.5, label: "SOVEREIGN HARMONY (x1.5)" },
        ],
        breakComboCounterAttack: 35,
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

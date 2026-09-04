import { Enemy } from "@/types/character"
import { TypingStats } from "@/types/typing"

export interface DefeatAdvice {
  title: string
  analysis: string
  tacticalTip: string
  recommendedDrillTitle: string
  recommendedLink: string
  recommendedLinkText: string
  focusMetric: {
    label: string
    current: string | number
    required: string | number
    status: "pass" | "fail"
  }
}

/**
 * Returns customized coaching advice when the player is defeated,
 * tailored to the specific enemy's mechanics, typing focus, and player's match performance.
 */
export function getDefeatAdvice(enemy: Enemy, stats: TypingStats): DefeatAdvice {
  switch (enemy.id) {
    case "sakura": {
      const pass = stats.battleAccuracy >= 92
      return {
        title: "Precision Strike Deficit",
        analysis:
          "Sakura's Chakra Scalpel mechanic reduces your damage output drastically when your accuracy drops below 92%.",
        tacticalTip:
          "Deliberately decelerate your keystrokes by 10-15%. In this fight, a clean 95% accuracy deals triple the damage of an inaccurate 60 WPM burst.",
        recommendedDrillTitle: "Targeted Weak-Key Precision",
        recommendedLink: "/training?mode=weak-keys",
        recommendedLinkText: "Practice Weak Keys",
        focusMetric: {
          label: "Accuracy Threshold",
          current: `${stats.battleAccuracy}%`,
          required: "92%+",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "rock_lee": {
      const pass = stats.battleWpm >= 55
      return {
        title: "Speed Gate Check Failed",
        analysis:
          "Rock Lee unleashes the Eight Gates, penalizing any typing cadence below 55 WPM while rewarding burst speeds with massive damage boosts.",
        tacticalTip:
          "Warm up your finger muscles and type short common words in fluid burst movements without pausing between syllables.",
        recommendedDrillTitle: "Speed Test Burst Drills",
        recommendedLink: "/training?mode=speed-test",
        recommendedLinkText: "Train Speed Burst",
        focusMetric: {
          label: "Speed Threshold",
          current: `${stats.battleWpm} WPM`,
          required: "55+ WPM",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "kakashi": {
      const pass = stats.battleAccuracy >= 88 && stats.battleWpm >= 45
      return {
        title: "Cadence Breakdown",
        analysis:
          "Kakashi's Copy Ninja Sharingan reads fluctuations in your typing cadence. Stutters, halts, or erratic rhythms dampen your strikes.",
        tacticalTip:
          "Adopt a metronome-like rhythm. Type each letter at an even, continuous cadence rather than sprinting and freezing on difficult words.",
        recommendedDrillTitle: "Steady Flow Practice",
        recommendedLink: "/training?mode=free-practice",
        recommendedLinkText: "Practice Rhythm",
        focusMetric: {
          label: "Tempo & Accuracy",
          current: `${stats.battleAccuracy}% / ${stats.battleWpm} WPM`,
          required: "88%+ / 45+ WPM",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "sasuke": {
      const pass = stats.bestCombo >= 15
      return {
        title: "Combo Disruption & Counter",
        analysis:
          "Sasuke's Chidori triggers immediate counter-attack damage on you whenever a combo breaks, resetting your damage momentum.",
        tacticalTip:
          "Never guess keystrokes. Protecting a 15x or 20x combo is vital against Sasuke to avoid taking retaliatory counter-shocks.",
        recommendedDrillTitle: "Streak & Accuracy Drills",
        recommendedLink: "/training?mode=weak-keys",
        recommendedLinkText: "Eliminate Combo Breakers",
        focusMetric: {
          label: "Highest Streak",
          current: `×${stats.bestCombo}`,
          required: "×15+",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "itachi": {
      const pass = stats.battleAccuracy >= 93
      return {
        title: "Genjutsu Punctuation Trap",
        analysis:
          "Itachi's Tsukuyomi fills the battlefield with complex sentence structures, quotes, commas, semicolons, and apostrophes.",
        tacticalTip:
          "Use the shift key with the opposite hand of the target key. Do not glance down at the keyboard when hitting punctuation symbols.",
        recommendedDrillTitle: "Academy Punctuation Lessons",
        recommendedLink: "/academy",
        recommendedLinkText: "Go to Academy",
        focusMetric: {
          label: "Symbol Precision",
          current: `${stats.battleAccuracy}%`,
          required: "93%+",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "pain": {
      const pass = stats.battleWpm >= 60 && stats.battleAccuracy >= 90
      return {
        title: "Six Paths Endurance Depleted",
        analysis:
          "Pain's 3 divine phases require high stamina and unwavering concentration. Fatigue in Phase 2 or 3 leads to lethal error cascades.",
        tacticalTip:
          "Breathe steadily and keep your shoulders relaxed. Pacing yourself evenly across all 3 phases is key to overcoming the Deva Path.",
        recommendedDrillTitle: "Endurance Practice",
        recommendedLink: "/training?mode=free-practice",
        recommendedLinkText: "Train Free Practice",
        focusMetric: {
          label: "Phase Endurance",
          current: `${stats.battleWpm} WPM (${stats.totalErrors} errors)`,
          required: "60+ WPM / <10 errors",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "madara": {
      const pass = stats.battleWpm >= 70 && stats.battleAccuracy >= 93
      return {
        title: "Ultimate Calamity Overwhelmed",
        analysis:
          "Madara's Perfect Susanoo combines devastating attack speed with strict accuracy and multi-phase resistance.",
        tacticalTip:
          "Attain Rank A or S and Level 10+ before challenging Madara. Ensure your keyboard muscle memory is completely automatic.",
        recommendedDrillTitle: "Shinobi Academy Mastery",
        recommendedLink: "/academy",
        recommendedLinkText: "Master Academy Drills",
        focusMetric: {
          label: "Shinobi Mastery",
          current: `${stats.battleWpm} WPM / ${stats.battleAccuracy}%`,
          required: "70+ WPM / 93%+",
          status: pass ? "pass" : "fail",
        },
      }
    }

    default: {
      const pass = stats.battleWpm >= 30 && stats.battleAccuracy >= 80
      return {
        title: "Shinobi Fundamentals",
        analysis:
          "Naruto's aggressive clone barrage tests your fundamental typing speed and composure under pressure.",
        tacticalTip:
          "Keep your fingers anchored on the home row (ASDF JKL;) and read 2 to 3 words ahead while typing.",
        recommendedDrillTitle: "Shinobi Fundamentals",
        recommendedLink: "/training?mode=free-practice",
        recommendedLinkText: "Practice Fundamentals",
        focusMetric: {
          label: "Basic Cadence",
          current: `${stats.battleWpm} WPM / ${stats.battleAccuracy}%`,
          required: "30+ WPM / 80%+",
          status: pass ? "pass" : "fail",
        },
      }
    }
  }
}

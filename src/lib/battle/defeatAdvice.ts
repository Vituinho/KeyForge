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

export type DefeatAdviceTranslator = (
  key: string,
  params?: Record<string, string | number>
) => string

/**
 * Returns customized coaching advice when the player is defeated,
 * tailored to the specific enemy's mechanics, typing focus, and player's match performance.
 * Supports active locale translation via optional `t` translator.
 */
export function getDefeatAdvice(
  enemy: Enemy,
  stats: TypingStats,
  t?: DefeatAdviceTranslator
): DefeatAdvice {
  switch (enemy.id) {
    case "sakura": {
      const pass = stats.battleAccuracy >= 92
      return {
        title: t ? t("battleResult.defeatAdvice.sakura.title") : "Precision Strike Deficit",
        analysis: t
          ? t("battleResult.defeatAdvice.sakura.analysis")
          : "Sakura's Chakra Scalpel mechanic reduces your damage output drastically when your accuracy drops below 92%.",
        tacticalTip: t
          ? t("battleResult.defeatAdvice.sakura.tacticalTip")
          : "Deliberately decelerate your keystrokes by 10-15%. In this fight, a clean 95% accuracy deals triple the damage of an inaccurate 60 WPM burst.",
        recommendedDrillTitle: t
          ? t("battleResult.defeatAdvice.sakura.recommendedDrillTitle")
          : "Targeted Weak-Key Precision",
        recommendedLink: "/training?mode=weak-keys",
        recommendedLinkText: t
          ? t("battleResult.defeatAdvice.sakura.recommendedLinkText")
          : "Practice Weak Keys",
        focusMetric: {
          label: t ? t("battleResult.defeatAdvice.sakura.metricLabel") : "Accuracy Threshold",
          current: `${stats.battleAccuracy}%`,
          required: "92%+",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "rock_lee":
    case "rock-lee": {
      const pass = stats.battleWpm >= 55
      return {
        title: t ? t("battleResult.defeatAdvice.rockLee.title") : "Speed Gate Check Failed",
        analysis: t
          ? t("battleResult.defeatAdvice.rockLee.analysis")
          : "Rock Lee unleashes the Eight Gates, penalizing any typing cadence below 55 WPM while rewarding burst speeds with massive damage boosts.",
        tacticalTip: t
          ? t("battleResult.defeatAdvice.rockLee.tacticalTip")
          : "Warm up your finger muscles and type short common words in fluid burst movements without pausing between syllables.",
        recommendedDrillTitle: t
          ? t("battleResult.defeatAdvice.rockLee.recommendedDrillTitle")
          : "Speed Test Burst Drills",
        recommendedLink: "/training?mode=speed-test",
        recommendedLinkText: t
          ? t("battleResult.defeatAdvice.rockLee.recommendedLinkText")
          : "Train Speed Burst",
        focusMetric: {
          label: t ? t("battleResult.defeatAdvice.rockLee.metricLabel") : "Speed Threshold",
          current: `${stats.battleWpm} WPM`,
          required: "55+ WPM",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "kakashi": {
      const pass = stats.battleAccuracy >= 88 && stats.battleWpm >= 45
      return {
        title: t ? t("battleResult.defeatAdvice.kakashi.title") : "Cadence Breakdown",
        analysis: t
          ? t("battleResult.defeatAdvice.kakashi.analysis")
          : "Kakashi's Copy Ninja Sharingan reads fluctuations in your typing cadence. Stutters, halts, or erratic rhythms dampen your strikes.",
        tacticalTip: t
          ? t("battleResult.defeatAdvice.kakashi.tacticalTip")
          : "Adopt a metronome-like rhythm. Type each letter at an even, continuous cadence rather than sprinting and freezing on difficult words.",
        recommendedDrillTitle: t
          ? t("battleResult.defeatAdvice.kakashi.recommendedDrillTitle")
          : "Steady Flow Practice",
        recommendedLink: "/training?mode=free-practice",
        recommendedLinkText: t
          ? t("battleResult.defeatAdvice.kakashi.recommendedLinkText")
          : "Practice Rhythm",
        focusMetric: {
          label: t ? t("battleResult.defeatAdvice.kakashi.metricLabel") : "Tempo & Accuracy",
          current: `${stats.battleAccuracy}% / ${stats.battleWpm} WPM`,
          required: "88%+ / 45+ WPM",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "sasuke": {
      const pass = stats.bestCombo >= 15
      return {
        title: t ? t("battleResult.defeatAdvice.sasuke.title") : "Combo Disruption & Counter",
        analysis: t
          ? t("battleResult.defeatAdvice.sasuke.analysis")
          : "Sasuke's Chidori triggers immediate counter-attack damage on you whenever a combo breaks, resetting your damage momentum.",
        tacticalTip: t
          ? t("battleResult.defeatAdvice.sasuke.tacticalTip")
          : "Never guess keystrokes. Protecting a 15x or 20x combo is vital against Sasuke to avoid taking retaliatory counter-shocks.",
        recommendedDrillTitle: t
          ? t("battleResult.defeatAdvice.sasuke.recommendedDrillTitle")
          : "Streak & Accuracy Drills",
        recommendedLink: "/training?mode=weak-keys",
        recommendedLinkText: t
          ? t("battleResult.defeatAdvice.sasuke.recommendedLinkText")
          : "Eliminate Combo Breakers",
        focusMetric: {
          label: t ? t("battleResult.defeatAdvice.sasuke.metricLabel") : "Highest Streak",
          current: `×${stats.bestCombo}`,
          required: "×15+",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "itachi": {
      const pass = stats.battleAccuracy >= 93
      return {
        title: t ? t("battleResult.defeatAdvice.itachi.title") : "Genjutsu Punctuation Trap",
        analysis: t
          ? t("battleResult.defeatAdvice.itachi.analysis")
          : "Itachi's Tsukuyomi fills the battlefield with complex sentence structures, quotes, commas, semicolons, and apostrophes.",
        tacticalTip: t
          ? t("battleResult.defeatAdvice.itachi.tacticalTip")
          : "Use the shift key with the opposite hand of the target key. Do not glance down at the keyboard when hitting punctuation symbols.",
        recommendedDrillTitle: t
          ? t("battleResult.defeatAdvice.itachi.recommendedDrillTitle")
          : "Academy Punctuation Lessons",
        recommendedLink: "/academy",
        recommendedLinkText: t
          ? t("battleResult.defeatAdvice.itachi.recommendedLinkText")
          : "Go to Academy",
        focusMetric: {
          label: t ? t("battleResult.defeatAdvice.itachi.metricLabel") : "Symbol Precision",
          current: `${stats.battleAccuracy}%`,
          required: "93%+",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "pain": {
      const pass = stats.battleWpm >= 60 && stats.battleAccuracy >= 90
      return {
        title: t ? t("battleResult.defeatAdvice.pain.title") : "Six Paths Endurance Depleted",
        analysis: t
          ? t("battleResult.defeatAdvice.pain.analysis")
          : "Pain's 3 divine phases require high stamina and unwavering concentration. Fatigue in Phase 2 or 3 leads to lethal error cascades.",
        tacticalTip: t
          ? t("battleResult.defeatAdvice.pain.tacticalTip")
          : "Breathe steadily and keep your shoulders relaxed. Pacing yourself evenly across all 3 phases is key to overcoming the Deva Path.",
        recommendedDrillTitle: t
          ? t("battleResult.defeatAdvice.pain.recommendedDrillTitle")
          : "Endurance Practice",
        recommendedLink: "/training?mode=free-practice",
        recommendedLinkText: t
          ? t("battleResult.defeatAdvice.pain.recommendedLinkText")
          : "Train Free Practice",
        focusMetric: {
          label: t ? t("battleResult.defeatAdvice.pain.metricLabel") : "Phase Endurance",
          current: t
            ? t("battleResult.defeatAdvice.pain.current", {
                wpm: stats.battleWpm,
                errors: stats.totalErrors,
              })
            : `${stats.battleWpm} WPM (${stats.totalErrors} errors)`,
          required: t ? t("battleResult.defeatAdvice.pain.required") : "60+ WPM / <10 errors",
          status: pass ? "pass" : "fail",
        },
      }
    }

    case "madara": {
      const pass = stats.battleWpm >= 70 && stats.battleAccuracy >= 93
      return {
        title: t ? t("battleResult.defeatAdvice.madara.title") : "Ultimate Calamity Overwhelmed",
        analysis: t
          ? t("battleResult.defeatAdvice.madara.analysis")
          : "Madara's Perfect Susanoo combines devastating attack speed with strict accuracy and multi-phase resistance.",
        tacticalTip: t
          ? t("battleResult.defeatAdvice.madara.tacticalTip")
          : "Attain Rank A or S and Level 10+ before challenging Madara. Ensure your keyboard muscle memory is completely automatic.",
        recommendedDrillTitle: t
          ? t("battleResult.defeatAdvice.madara.recommendedDrillTitle")
          : "Shinobi Academy Mastery",
        recommendedLink: "/academy",
        recommendedLinkText: t
          ? t("battleResult.defeatAdvice.madara.recommendedLinkText")
          : "Master Academy Drills",
        focusMetric: {
          label: t ? t("battleResult.defeatAdvice.madara.metricLabel") : "Shinobi Mastery",
          current: `${stats.battleWpm} WPM / ${stats.battleAccuracy}%`,
          required: "70+ WPM / 93%+",
          status: pass ? "pass" : "fail",
        },
      }
    }

    default: {
      const pass = stats.battleWpm >= 30 && stats.battleAccuracy >= 80
      return {
        title: t ? t("battleResult.defeatAdvice.default.title") : "Shinobi Fundamentals",
        analysis: t
          ? t("battleResult.defeatAdvice.default.analysis")
          : "Naruto's aggressive clone barrage tests your fundamental typing speed and composure under pressure.",
        tacticalTip: t
          ? t("battleResult.defeatAdvice.default.tacticalTip")
          : "Keep your fingers anchored on the home row (ASDF JKL;) and read 2 to 3 words ahead while typing.",
        recommendedDrillTitle: t
          ? t("battleResult.defeatAdvice.default.recommendedDrillTitle")
          : "Shinobi Fundamentals",
        recommendedLink: "/training?mode=free-practice",
        recommendedLinkText: t
          ? t("battleResult.defeatAdvice.default.recommendedLinkText")
          : "Practice Fundamentals",
        focusMetric: {
          label: t ? t("battleResult.defeatAdvice.default.metricLabel") : "Basic Cadence",
          current: `${stats.battleWpm} WPM / ${stats.battleAccuracy}%`,
          required: "30+ WPM / 80%+",
          status: pass ? "pass" : "fail",
        },
      }
    }
  }
}

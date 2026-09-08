export interface AcademyModule {
  id: string
  title: string
  subtitle: string
  description: string
  order: number
  status: "available" | "soon"
  badge?: string
}

export interface AcademyLesson {
  id: string
  moduleId: string
  title: string
  type: "theory" | "practice"
  accuracyTarget?: number // e.g. 95%
  exercises?: string[]
}

export function getAcademyModules(t: (key: string) => string): AcademyModule[] {
  return [
    {
      id: "intro",
      title: t("academy.modules.intro.title"),
      subtitle: t("academy.modules.intro.subtitle"),
      description: t("academy.modules.intro.desc"),
      order: 1,
      status: "available",
      badge: t("academy.modules.intro.badge"),
    },
    {
      id: "home-row",
      title: t("academy.modules.homeRow.title"),
      subtitle: t("academy.modules.homeRow.subtitle"),
      description: t("academy.modules.homeRow.desc"),
      order: 2,
      status: "available",
      badge: t("academy.modules.homeRow.badge"),
    },
    {
      id: "left-hand",
      title: t("academy.modules.leftHand.title"),
      subtitle: t("academy.modules.leftHand.subtitle"),
      description: t("academy.modules.leftHand.desc"),
      order: 3,
      status: "soon",
    },
    {
      id: "right-hand",
      title: t("academy.modules.rightHand.title"),
      subtitle: t("academy.modules.rightHand.subtitle"),
      description: t("academy.modules.rightHand.desc"),
      order: 4,
      status: "soon",
    },
    {
      id: "all-fingers",
      title: t("academy.modules.allFingers.title"),
      subtitle: t("academy.modules.allFingers.subtitle"),
      description: t("academy.modules.allFingers.desc"),
      order: 5,
      status: "soon",
    },
    {
      id: "numbers",
      title: t("academy.modules.numbers.title"),
      subtitle: t("academy.modules.numbers.subtitle"),
      description: t("academy.modules.numbers.desc"),
      order: 6,
      status: "soon",
    },
    {
      id: "symbols",
      title: t("academy.modules.symbols.title"),
      subtitle: t("academy.modules.symbols.subtitle"),
      description: t("academy.modules.symbols.desc"),
      order: 7,
      status: "soon",
    },
  ]
}

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: "intro",
    title: "1. Introduction",
    subtitle: "Fundamentals of Touch Typing",
    description: "Learn the core philosophy: posture, finger discipline, and why accuracy beats speed.",
    order: 1,
    status: "available",
    badge: "Core",
  },
  {
    id: "home-row",
    title: "2. Home Row",
    subtitle: "A S D F — J K L Ç",
    description: "Master the foundation of the keyboard. Anchor your fingers on the tactile bumps of F and J.",
    order: 2,
    status: "available",
    badge: "Essential",
  },
  {
    id: "left-hand",
    title: "3. Left Hand",
    subtitle: "Q W E R T · Z X C V",
    description: "Expand upwards and downwards using your left hand fingers.",
    order: 3,
    status: "soon",
  },
  {
    id: "right-hand",
    title: "4. Right Hand",
    subtitle: "Y U I O P · B N M , . ;",
    description: "Expand reach across the right side of the keyboard.",
    order: 4,
    status: "soon",
  },
  {
    id: "all-fingers",
    title: "5. All Fingers",
    subtitle: "Fluency & Word Patterns",
    description: "Coordinate both hands smoothly across full vocabulary.",
    order: 5,
    status: "soon",
  },
  {
    id: "numbers",
    title: "6. Numbers",
    subtitle: "1 2 3 4 5 6 7 8 9 0",
    description: "Reach the top number row without glancing down.",
    order: 6,
    status: "soon",
  },
  {
    id: "symbols",
    title: "7. Symbols",
    subtitle: "Punctuation & Code Characters",
    description: "Master braces, brackets, quotes, and punctuation keys.",
    order: 7,
    status: "soon",
  },
]

export const HOME_ROW_EXERCISES_PT = [
  "asdf jklç",
  "asdf jklç",
  "fdsa çlkj",
  "asdf jklç",
  "a s d f j k l ç",
  "fad jak lad ças",
  "fala sala dala cala",
]

export const HOME_ROW_EXERCISES_EN = [
  "asdf jkl;",
  "asdf jkl;",
  "fdsa ;lkj",
  "asdf jkl;",
  "a s d f j k l ;",
  "fad jak lad gas",
  "fall salsa flask glad",
]

export function getHomeRowExercises(locale: string = "pt-BR"): string[] {
  return locale === "en" ? HOME_ROW_EXERCISES_EN : HOME_ROW_EXERCISES_PT
}

export const HOME_ROW_EXERCISES = HOME_ROW_EXERCISES_PT

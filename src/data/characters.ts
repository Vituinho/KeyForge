import { Enemy } from "@/types/character"

export const CHARACTERS: Enemy[] = [
  {
    id: "naruto",
    name: "Naruto Uzumaki",
    anime: "Naruto",
    level: 1,
    type: "normal",
    maxHp: 500,
    attack: 8,
    attackInterval: 5000, // attacks every 5 seconds
    recommendedWpm: 30,
    recommendedAccuracy: 85,
    difficulty: 10,
    themeColor: "#f97316", // orange-500
    accentColor: "#3b82f6", // blue-500
    description:
      "The hyperactive, knucklehead ninja of the Hidden Leaf Village. He never gives up — neither should you.",
    abilities: [
      {
        id: "shadow-clone",
        name: "Shadow Clone Jutsu",
        description: "Naruto creates clones — future mechanic placeholder.",
        trigger: "on_health_low",
        triggerThreshold: 30,
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

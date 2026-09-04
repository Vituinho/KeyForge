// Battle texts indexed by character id.
// Each entry is an array of sentences used in rotation during battle.
// Future: difficulty tiers, language modes, boss-specific texts.

export const BATTLE_TEXTS: Record<string, string[]> = {
  naruto: [
    "The ninja runs quickly through the hidden village at dawn.",
    "Hard work and determination are the keys to becoming hokage.",
    "Never give up no matter how difficult the path may seem.",
    "Believe in yourself and your friends will always be there for you.",
    "The will of fire burns bright in every leaf village ninja.",
    "A true ninja never abandons their comrades in battle.",
    "Training every day builds strength that cannot be taken away.",
    "Protect what matters most with every fiber of your being.",
    "The path to greatness is paved with failures and lessons learned.",
    "Shadow clone jutsu is the ultimate technique of hard work.",
  ],
  default: [
    "The quick brown fox jumps over the lazy dog with great speed.",
    "Practice makes perfect when you dedicate time every single day.",
    "Focus on each character and let your fingers find their rhythm.",
    "Typing fast requires both accuracy and consistent daily practice.",
    "Every expert was once a beginner who refused to give up.",
  ],
}

export function getTextsForCharacter(characterId: string): string[] {
  return BATTLE_TEXTS[characterId] ?? BATTLE_TEXTS["default"]
}

import { getFingerForKey, type KeyboardLayoutId, type Finger } from "../keyboard/fingerMap"
import { learnableKeys, LEARNING_STAGES } from "./keyMastery"

const ANCHORS: Record<Finger, string> = {
  leftPinky: "a", leftRing: "s", leftMiddle: "d", leftIndex: "f",
  rightIndex: "j", rightMiddle: "k", rightRing: "l", rightPinky: ";", thumb: " ",
}
const PT_WORDS = "amor barco casa dado escola flor gato hora ilha janela kiwi lua mundo noite olho pato queijo rato sapo terra uva vida web xadrez yoga zebra aço braço coração força maçã praça açúcar ação raro correr real treino aprender escrever rápido tecla teclado trabalho caminho jogo família música livro pequeno quente viagem zero feliz texto".split(" ")
const EN_WORDS = "apple book cat day earth flower green home ink jump kite light moon night open place queen river sun tree under voice water extra yellow zebra quick fox rhythm write learn keyboard practice world bright calm strong joy amazing brave".split(" ")
const PT_SENTENCES = [
  "o rato corre pela terra e procura uma casa tranquila.",
  "a força da prática ajuda a escrever com calma e precisão.",
  "a janela aberta mostra flores no jardim e um céu azul.",
  "hoje quero aprender uma tecla nova e melhorar meu ritmo.",
  "o kiwi, a maçã e o queijo estão na mesa da cozinha.",
  "o yoga traz calma, e a web oferece novos caminhos.",
  "um bom livro inspira uma viagem pelo mundo.",
  "o jogador de xadrez planeja cada movimento com cuidado.",
]
const EN_SENTENCES = [
  "the quick brown fox jumps over the lazy dog.",
  "we write with a calm rhythm and learn a little every day.",
  "bright flowers grow beside the river near our home.",
  "a good book opens a window to an amazing world.",
  "practice each key with care and keep your hands relaxed.",
]
export interface KeyExercise { targetKey: string; stage: number; kind: typeof LEARNING_STAGES[number]; text: string }

/** Resolve shifted/dead-key symbols through their existing physical key's finger. */
export function getPracticeFinger(key: string | null, layout: KeyboardLayoutId) {
  if (!key) return null
  const aliases: Record<string, string> = {
    "<": ",", ">": ".", "?": ";", "/": ";", "º": "'", "ª": "'",
    "~": layout === "ANSI" ? "a" : "'", "`": layout === "ANSI" ? "a" : "'",
  }
  return getFingerForKey(key, layout) ?? getFingerForKey(aliases[key], layout)
}

/** Deterministic, prebuildable drills for every manually selectable key. */
export function generateKeyExercises(target: string, layout: KeyboardLayoutId): KeyExercise[] {
  const key = target.normalize("NFC").toLowerCase()
  if (!learnableKeys(layout).includes(key)) throw new Error(`Unsupported Academy key: ${target}`)
  const pt = layout === "ABNT2"
  const finger = getPracticeFinger(key, layout)?.finger ?? "rightPinky"
  const anchor = finger === "rightPinky" && pt ? "ç" : ANCHORS[finger]
  const partners = key === "r" ? ["e", "t", "f"] : [anchor, "e", "a"].filter((partner) => partner !== key)
  const letter = /^[a-zç]$/.test(key)
  const words = (pt ? PT_WORDS : EN_WORDS).filter((word) => word.includes(key))
  const sentences = (pt ? PT_SENTENCES : EN_SENTENCES).filter((sentence) => sentence.includes(key))
  const context = pt ? `pratique ${key} com calma e atenção.` : `practice ${key} with calm and care.`
  const texts = [
    Array(4).fill(key.repeat(4)).join(" "),
    Array(4).fill(`${anchor}${key} ${key}${anchor}`).join(" "),
    Array(2).fill(partners.map((partner) => `${partner}${key} ${key}${partner}`).join(" ")).join(" "),
    letter ? Array(2).fill(["a", "e", "i", "o", "u"].map((vowel) => `${key}${vowel}`).join(" ")).join(" ")
      : ["a", "1", "2", "3", "b"].map((partner) => `${partner}${key}${partner}`).join(" "),
    words.length ? Array.from({ length: 6 }, (_, index) => words[index % words.length]).join(" ")
      : ["tecla", "key", "1", "2", "3", "4"].map((word) => `${word}${key}`).join(" "),
    sentences.length ? Array.from({ length: 3 }, (_, index) => sentences[index % sentences.length]).join(" ")
      : key === "!" ? (pt ? "vamos treinar! cada tecla conta! continue assim! mais uma vez!" : "let us practice! every key counts! keep going! once again!")
      : Array(4).fill(context).join(" "),
  ]
  // Ensure enough target evidence even in sparse natural sentences.
  return texts.map((text, stage) => {
    while (Array.from(text).filter((char) => char === key).length < 4) text += ` ${texts[stage]}`
    return { targetKey: key, stage, kind: LEARNING_STAGES[stage], text }
  })
}

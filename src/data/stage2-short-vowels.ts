import { PhonicsRule } from "@/types";

/**
 * Stage 2: CVC Short Vowels (5 rules)
 * Data extracted from phonics-kb/L2-cvc-words.md
 * NO IPA — child-friendly descriptions only
 */
export const stage2ShortVowels: PhonicsRule[] = [
  // ─── Rule 1: Short A ─────────────────────────────────
  {
    id: "short_a",
    stage: 2,
    category: "short_vowel",
    title: "短元音 Aa",
    titleEn: "Short Vowel A",
    soundDescription: "张大嘴巴，发 'aaaa'，像咬一口大苹果",
    soundExample: "apple 里就有这个音！",
    letters: "a",
    color: "#ef4444", // red
    wordFamilies: [
      {
        ending: "-at",
        words: ["cat", "bat", "hat", "mat", "rat", "sat", "pat", "fat"],
      },
      {
        ending: "-an",
        words: ["can", "fan", "man", "pan", "ran", "van", "tan"],
      },
      {
        ending: "-ap",
        words: ["cap", "map", "nap", "tap", "clap", "snap"],
      },
      {
        ending: "-ag",
        words: ["bag", "tag", "wag", "rag", "flag"],
      },
    ],
    practiceWords: [
      "cat", "bat", "hat", "mat", "rat", "sat", "pat", "fat",
      "can", "fan", "man", "pan", "ran", "van",
      "cap", "map", "nap", "tap",
      "bag", "tag", "wag", "flag",
    ],
    transferWords: ["dad", "sad", "bad", "had", "mad", "jam", "ham", "back", "pack"],
    nonsenseWords: ["zat", "vab", "flad", "glat"],
  },

  // ─── Rule 2: Short E ─────────────────────────────────
  {
    id: "short_e",
    stage: 2,
    category: "short_vowel",
    title: "短元音 Ee",
    titleEn: "Short Vowel E",
    soundDescription: "嘴巴微微张开，发 'ehhh'，像看到小老鼠轻轻叫一声",
    soundExample: "egg 的第一个音就是它！",
    letters: "e",
    color: "#f59e0b", // amber
    wordFamilies: [
      {
        ending: "-et",
        words: ["pet", "net", "wet", "get", "set", "jet", "vet", "let"],
      },
      {
        ending: "-en",
        words: ["pen", "ten", "hen", "men", "den"],
      },
      {
        ending: "-ed",
        words: ["bed", "red", "fed", "led", "wed"],
      },
    ],
    practiceWords: [
      "pet", "net", "wet", "get", "set", "jet", "let",
      "pen", "ten", "hen", "men",
      "bed", "red", "fed",
    ],
    transferWords: ["leg", "peg", "beg", "bell", "tell", "well", "sell"],
    nonsenseWords: ["pem", "blet", "snet", "frep"],
  },

  // ─── Rule 3: Short I ─────────────────────────────────
  {
    id: "short_i",
    stage: 2,
    category: "short_vowel",
    title: "短元音 Ii",
    titleEn: "Short Vowel I",
    soundDescription: "嘴巴微微笑，发 'i-i-i'，像小老鼠吱吱叫",
    soundExample: "igloo 的第一个音！",
    letters: "i",
    color: "#22c55e", // green
    wordFamilies: [
      {
        ending: "-ig",
        words: ["big", "dig", "pig", "wig", "fig"],
      },
      {
        ending: "-in",
        words: ["pin", "bin", "fin", "tin", "win"],
      },
      {
        ending: "-ip",
        words: ["dip", "hip", "lip", "rip", "sip", "tip", "zip"],
      },
      {
        ending: "-it",
        words: ["bit", "fit", "hit", "kit", "lit", "sit"],
      },
    ],
    practiceWords: [
      "big", "dig", "pig", "wig",
      "pin", "bin", "win", "tin",
      "dip", "hip", "lip", "tip", "zip",
      "bit", "fit", "hit", "sit",
    ],
    transferWords: ["kick", "pick", "sick", "bill", "fill", "hill", "ship", "chip"],
    nonsenseWords: ["bix", "flig", "snit", "vrim"],
  },

  // ─── Rule 4: Short O ─────────────────────────────────
  {
    id: "short_o",
    stage: 2,
    category: "short_vowel",
    title: "短元音 Oo",
    titleEn: "Short Vowel O",
    soundDescription: "嘴巴圆圆，发 'o-o-o'，像一只小青蛙呱呱叫",
    soundExample: "octopus 的第一个音！",
    letters: "o",
    color: "#3b82f6", // blue
    wordFamilies: [
      {
        ending: "-op",
        words: ["hop", "mop", "pop", "top", "cop", "stop", "drop"],
      },
      {
        ending: "-ot",
        words: ["cot", "dot", "hot", "lot", "not", "pot", "rot"],
      },
      {
        ending: "-og",
        words: ["dog", "fog", "hog", "jog", "log"],
      },
    ],
    practiceWords: [
      "hop", "mop", "pop", "top", "cop", "stop",
      "cot", "dot", "hot", "not", "pot",
      "dog", "fog", "log", "jog",
    ],
    transferWords: ["dock", "lock", "rock", "sock", "bob", "job", "rob", "sob", "nod", "rod"],
    nonsenseWords: ["frob", "glok", "strod", "blom"],
  },

  // ─── Rule 5: Short U ─────────────────────────────────
  {
    id: "short_u",
    stage: 2,
    category: "short_vowel",
    title: "短元音 Uu",
    titleEn: "Short Vowel U",
    soundDescription: "嘴巴微微张开，发 'u-u-u'，像肚子饿的时候叫一声",
    soundExample: "umbrella 的第一个音！",
    letters: "u",
    color: "#a855f7", // purple
    wordFamilies: [
      {
        ending: "-un",
        words: ["run", "sun", "fun", "bun", "gun"],
      },
      {
        ending: "-ug",
        words: ["bug", "dug", "hug", "jug", "mug", "rug", "tug"],
      },
      {
        ending: "-up",
        words: ["cup", "pup"],
      },
      {
        ending: "-ut",
        words: ["but", "cut", "hut", "nut"],
      },
    ],
    practiceWords: [
      "run", "sun", "fun", "bun",
      "bug", "hug", "jug", "mug", "rug",
      "cup", "pup",
      "but", "cut", "nut",
    ],
    transferWords: ["buck", "duck", "luck", "truck", "drum", "gum", "hum", "bud", "mud"],
    nonsenseWords: ["mup", "gluck", "frul", "vut"],
  },
];

/** Get a rule by ID */
export function getRuleById(id: string): PhonicsRule | undefined {
  return stage2ShortVowels.find((r) => r.id === id);
}

/** Get the next unmastered rule after the given one */
export function getNextRuleId(currentId: string): string | null {
  const idx = stage2ShortVowels.findIndex((r) => r.id === currentId);
  if (idx < 0 || idx >= stage2ShortVowels.length - 1) return null;
  return stage2ShortVowels[idx + 1].id;
}

/** Get a random practice word for a rule */
export function getRandomPracticeWord(rule: PhonicsRule): string {
  const words = rule.practiceWords;
  return words[Math.floor(Math.random() * words.length)];
}

/** Get a random transfer/nonsense word for a rule */
export function getRandomTransferWord(rule: PhonicsRule): string {
  const words = [...rule.transferWords, ...rule.nonsenseWords];
  return words[Math.floor(Math.random() * words.length)];
}

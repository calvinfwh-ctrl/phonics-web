import type {
  PhonicsRule,
  ListenQuestion,
  BlendQuestion,
  FamilyQuestion,
  SegmentQuestion,
  SubstituteQuestion,
  SubstituteQuestionV2,
  TransferQuestion,
  TransferQuestionV2,
} from "@/types";

/**
 * Learning engine — generates exercises for each L1-L5 level.
 * Deterministic local logic, not AI-controlled.
 */

/** Shuffle array in place */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate L1: Listen & Discriminate questions */
export function generateListenQuestions(rule: PhonicsRule, count: number = 4): ListenQuestion[] {
  const questions: ListenQuestion[] = [];
  const targetWords = shuffle(rule.practiceWords).slice(0, Math.ceil(count / 2));
  const allOtherWords = getOtherWords(rule);
  const distractorWords = shuffle(allOtherWords).slice(0, Math.floor(count / 2));

  for (const word of targetWords) {
    questions.push({ word, hasTargetSound: true });
  }
  for (const word of distractorWords) {
    questions.push({ word, hasTargetSound: false });
  }

  return shuffle(questions).slice(0, count);
}

export function generateBlendQuestions(rule: PhonicsRule, count: number = 5): BlendQuestion[] {
  const words = shuffle(rule.practiceWords).slice(0, count);
  const allOtherWords = getOtherWords(rule);
  const questions: BlendQuestion[] = [];

  for (const word of words) {
    const letters = word.split("");
    const distractors = findConsonantFrameDistractors(word, allOtherWords);
    const choices = shuffle([word, ...distractors]);

    questions.push({
      word,
      letters,
      choices,
      correctIndex: choices.indexOf(word),
    });
  }

  return questions;
}

function findConsonantFrameDistractors(word: string, pool: string[]): string[] {
  if (word.length < 3) {
    return shuffle(pool.filter((w) => w.length === word.length && w !== word)).slice(0, 2);
  }

  const first = word[0];
  const last = word[word.length - 1];
  const frameMatches = pool.filter(
    (w) => w.length === word.length && w !== word && w[0] === first && w[w.length - 1] === last
  );
  if (frameMatches.length >= 2) return shuffle(frameMatches).slice(0, 2);

  const sameFirst = pool.filter((w) => w.length === word.length && w !== word && w[0] === first);
  if (sameFirst.length >= 2) return shuffle(sameFirst).slice(0, 2);

  const sameLength = pool.filter((w) => w.length === word.length && w !== word);
  return shuffle(sameLength).slice(0, 2);
}

export function generateFamilyQuestions(rule: PhonicsRule, count: number = 5): FamilyQuestion[] {
  const questions: FamilyQuestion[] = [];
  const allOtherWords = getOtherWords(rule);
  if (!rule.wordFamilies || rule.wordFamilies.length === 0) return questions;

  for (const family of rule.wordFamilies) {
    const words = shuffle(family.words);
    for (const word of words.slice(0, 2)) {
      if (questions.length >= count) break;
      const onset = word.slice(0, -family.ending.length + 1) || word[0];
      const distractors = shuffle(
        allOtherWords.filter((w) => w.length === word.length && w !== word)
      ).slice(0, 2);
      const choices = shuffle([word, ...distractors]);
      questions.push({
        wordFamily: family.ending,
        onset,
        targetWord: word,
        choices,
        correctIndex: choices.indexOf(word),
      });
    }
    if (questions.length >= count) break;
  }
  return questions.slice(0, count);
}

export function generateSegmentQuestions(rule: PhonicsRule, count: number = 5): SegmentQuestion[] {
  const words = shuffle(rule.practiceWords).filter((w) => w.length === 3).slice(0, count);
  const allOtherWords = getOtherWords(rule);
  const allLetters = getAllLetters(rule, allOtherWords);

  return words.map((word) => {
    const letters = word.split("");
    const elkoninBoxes = letters.length;
    const notInWord = allLetters.filter((l) => !letters.includes(l));
    const distractorLetters = shuffle(notInWord).slice(0, Math.min(3, notInWord.length));
    return { word, letters, distractorLetters, elkoninBoxes };
  });
}

function getAllLetters(rule: PhonicsRule, otherWords: string[]): string[] {
  const letterSet = new Set<string>();
  for (const word of otherWords) { for (const ch of word) letterSet.add(ch); }
  for (const word of rule.practiceWords) { for (const ch of word) letterSet.add(ch); }
  return Array.from(letterSet);
}

// ─── L4: Substitution generators ─────────────────────────────

export function generateSubstituteQuestions(rule: PhonicsRule, count: number = 4): SubstituteQuestion[] {
  const words = shuffle(rule.practiceWords).slice(0, count);
  const questions: SubstituteQuestion[] = [];
  for (const baseWord of words) {
    if (baseWord.length < 3) continue;
    const family = rule.wordFamilies?.find((f) => f.words.includes(baseWord));
    if (!family) continue;
    const partnerWords = family.words.filter((w) => w !== baseWord);
    if (partnerWords.length === 0) continue;
    const targetWord = partnerWords[0];
    const swapFrom = baseWord[0];
    const swapTo = targetWord[0];
    const distractors = shuffle(
      family.words.filter((w) => w !== targetWord && w !== baseWord)
    ).slice(0, 2);
    const choices = shuffle([targetWord, ...distractors]);
    questions.push({
      baseWord, swapFrom, swapTo, targetWord, choices,
      correctIndex: choices.indexOf(targetWord),
    });
  }
  return questions.slice(0, count);
}

export function generateSubstituteQuestionsV2(rule: PhonicsRule, count: number = 4): SubstituteQuestionV2[] {
  const questions: SubstituteQuestionV2[] = [];
  const allOtherWords = getOtherWords(rule);
  if (!rule.wordFamilies || rule.wordFamilies.length === 0) return questions;

  for (const family of rule.wordFamilies) {
    const words = shuffle(family.words);
    for (const baseWord of words) {
      if (questions.length >= count) break;
      const partnerWords = family.words.filter((w) => w !== baseWord);
      if (partnerWords.length === 0) continue;
      const targetWord = partnerWords[0];
      const swapFrom = baseWord[0];
      const swapTo = targetWord[0];
      const replacePosition = 0;
      const otherOnsets = allOtherWords
        .filter((w) => w.length === 3 && w !== baseWord && w !== targetWord)
        .map((w) => w[0]);
      const uniqueDistractors = [...new Set(otherOnsets)].filter((l) => l !== swapTo);
      const distractorOnsets = shuffle(uniqueDistractors).slice(0, Math.min(3, uniqueDistractors.length));
      const poolLetters = shuffle([swapTo, ...distractorOnsets]);

      questions.push({ baseWord, targetWord, swapFrom, swapTo, poolLetters, replacePosition });
    }
    if (questions.length >= count) break;
  }
  return questions.slice(0, count);
}

// ─── L5: Transfer generators ──────────────────────────────

export function generateTransferQuestions(rule: PhonicsRule, count: number = 4): TransferQuestion[] {
  const nonsenseWords = shuffle(rule.nonsenseWords);
  const transferWords = shuffle(rule.transferWords);
  const allWords = [...nonsenseWords, ...transferWords].slice(0, count);
  const allOtherWords = getOtherWords(rule);

  return allWords.map((word) => {
    const isNonsense = rule.nonsenseWords.includes(word);
    const distractors = shuffle(
      allOtherWords.filter((w) => w.length === word.length && w !== word)
    ).slice(0, 2);
    const choices = shuffle([word, ...distractors]);
    return { word, isNonsense, choices, correctIndex: choices.indexOf(word) };
  });
}

/**
 * Generate L5: Audio-only sound choice (P2 REDESIGN)
 *
 * OLD: show word text → child reads it → picks from word choices (no decoding test)
 * NEW: show word text → hear 3 different pronunciations → pick which is correct
 *
 * The 3 audioOptions use different spellings to make TTS produce different vowel sounds:
 *   - Option 0: correct decoding (word as-is, short vowel)
 *   - Option 1: long vowel distractor (different spelling → long vowel)
 *   - Option 2: wrong vowel distractor (different spelling → other short vowel)
 */
export function generateTransferQuestionsV2(
  rule: PhonicsRule,
  count: number = 4
): TransferQuestionV2[] {
  const nonsenseWords = shuffle(rule.nonsenseWords);
  const transferWords = shuffle(rule.transferWords);
  const allWords = [...nonsenseWords, ...transferWords].slice(0, count);

  // Vowel substitution maps for generating audio-distinct distractors
  const vowelRules = getVowelDistractorRules(rule.id);

  return allWords.map((word) => {
    const isNonsense = rule.nonsenseWords.includes(word);

    // Generate 3 audio-distinct spellings
    const audioOptions = generateAudioOptions(word, vowelRules);

    return {
      word,
      isNonsense,
      audioOptions,
      correctIndex: 0, // First option is always the correct pronunciation
    };
  });
}

/**
 * Vowel distractor rules per phonics rule.
 * For each rule, defines how to generate:
 *   - A "long vowel" distractor spelling
 *   - A "wrong short vowel" distractor spelling
 *
 * The TTS engine reads these alternative spellings to produce different vowel sounds.
 */
function getVowelDistractorRules(ruleId: string): {
  vowelIndex: number;
  longSpelling: string;
  wrongSpelling: string;
  vowelHint: string; // Child-friendly hint text
} {
  // CVC words: vowel is always at position 1
  // Replace the single vowel letter with a digraph/alternative to change TTS output
  const rules: Record<string, { longSpelling: string; wrongSpelling: string; vowelHint: string }> = {
    short_a: { longSpelling: "ay", wrongSpelling: "e", vowelHint: "短元音 A 发 /a/" },
    short_e: { longSpelling: "ee", wrongSpelling: "a", vowelHint: "短元音 E 发 /e/" },
    short_i: { longSpelling: "igh", wrongSpelling: "e", vowelHint: "短元音 I 发 /i/" },
    short_o: { longSpelling: "oa", wrongSpelling: "u", vowelHint: "短元音 O 发 /o/" },
    short_u: { longSpelling: "oo", wrongSpelling: "o", vowelHint: "短元音 U 发 /u/" },
  };

  const config = rules[ruleId] || { longSpelling: "ay", wrongSpelling: "e", vowelHint: "注意听元音！" };
  return { vowelIndex: 1, ...config };
}

/**
 * Generate 3 audio-distinct spellings for a CVC word.
 * Position 1 (vowel) is replaced with alternatives.
 */
function generateAudioOptions(
  word: string,
  rules: { vowelIndex: number; longSpelling: string; wrongSpelling: string; vowelHint: string }
): string[] {
  const chars = word.split("");
  const vi = rules.vowelIndex;

  // Option 0: Correct — word as-is (short vowel)
  const correct = word;

  // Option 1: Long vowel — replace vowel with long spelling
  const longVariant = [...chars];
  longVariant.splice(vi, 1, rules.longSpelling);
  // Trim to reasonable length (CVC words can get long with igh)
  const longWord = longVariant.join("");

  // Option 2: Wrong short vowel — replace vowel with wrong spelling
  const wrongVariant = [...chars];
  wrongVariant.splice(vi, 1, rules.wrongSpelling);
  const wrongWord = wrongVariant.join("");

  return [correct, longWord, wrongWord];
}

// ─── Utility ──────────────────────────────────────────────

function getOtherWords(rule: PhonicsRule): string[] {
  const allWords: Record<string, string[]> = {
    short_a: [
      ...["pet", "wet", "get", "set", "pen", "ten", "hen", "bed", "red"],
      ...["big", "dig", "pig", "pin", "tip", "zip", "bit", "fit", "sit"],
      ...["hop", "mop", "pop", "dog", "log", "hot", "not", "pot", "cot"],
      ...["run", "sun", "fun", "bug", "hug", "cup", "cut", "nut", "but"],
    ],
    short_e: [
      ...["cat", "bat", "hat", "mat", "cap", "map", "bag", "tag"],
      ...["big", "dig", "pig", "pin", "tip", "zip"],
      ...["hop", "mop", "pop", "dog", "log"],
      ...["run", "sun", "bug", "hug", "cup"],
    ],
    short_i: [
      ...["cat", "bat", "hat", "cap", "map", "bag", "tag"],
      ...["pet", "wet", "get", "pen", "hen", "bed", "red"],
      ...["hop", "mop", "pop", "dog", "log"],
      ...["run", "sun", "bug", "hug", "cup"],
    ],
    short_o: [
      ...["cat", "bat", "hat", "cap", "map", "bag", "tag"],
      ...["pet", "wet", "get", "pen", "hen", "bed", "red"],
      ...["big", "dig", "pig", "pin", "tip", "zip"],
      ...["run", "sun", "bug", "hug", "cup"],
    ],
    short_u: [
      ...["cat", "bat", "hat", "cap", "map", "bag", "tag"],
      ...["pet", "wet", "get", "pen", "hen", "bed", "red"],
      ...["big", "dig", "pig", "pin", "tip", "zip"],
      ...["hop", "mop", "pop", "dog", "log"],
    ],
  };
  return allWords[rule.id] || [];
}

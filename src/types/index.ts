// SPEC-v3 Type Definitions
// Rule-driven phonics: the rule is the core unit, not individual words.

/** A single phonics rule (e.g. "short a /æ/") */
export interface PhonicsRule {
  id: string;                    // "short_a", "letter_m", "digraph_sh"
  stage: 1 | 2 | 3;
  category: "letter" | "short_vowel" | "digraph";
  title: string;                 // "短元音 Aa"
  titleEn: string;               // "Short Vowel A"

  // Child-friendly description (NO IPA!)
  soundDescription: string;      // "张大嘴巴，发 'aaaa'，像咬一口大苹果"
  soundExample: string;          // "apple 里就有这个音"

  letters: string;               // "a" or "sh"
  color: string;                 // Theme color for this rule

  // Word families (Stage 2 only)
  wordFamilies?: WordFamily[];

  // Practice words — original (for reference, not exposed to children)
  practiceWords: string[];
  // Transfer words — real words not taught, used for L5 transfer
  transferWords: string[];
  // Nonsense words — fake words for L5 gold standard test
  nonsenseWords: string[];
}

export interface WordFamily {
  ending: string;                // "-at"
  words: string[];               // ["cat","bat","hat","mat","rat","sat"]
}

/** Learning status for a single rule */
export type RuleStatus = "not_started" | "in_progress" | "struggling" | "mastered";

export type LevelNumber = 1 | 2 | 3 | 4 | 5;

export interface RuleProgress {
  ruleId: string;
  status: RuleStatus;
  currentLevel: LevelNumber;
  attempts: number;
  masteredDate?: string;
  lastAttempt?: {
    level: number;
    correct: number;
    total: number;
    date: string;
  };
}

export interface ErrorRecord {
  id?: number;
  ruleId: string;
  level: LevelNumber;
  word: string;
  errorType: "listen" | "blend" | "family" | "segment" | "substitute" | "transfer";
  failCount: number;
  firstFailAt: string;
  lastFailAt: string;
}

export interface StudyLog {
  id?: number;
  date: string;
  ruleId: string;
  level: number;
  exerciseType: string;
  correctCount: number;
  totalCount: number;
  durationSeconds?: number;
}

// ─── Exercise Types ────────────────────────────────────────────

/** L1: Listen & Discriminate — hear a word, pick if target sound is present */
export interface ListenQuestion {
  word: string;                   // word to play via TTS
  hasTargetSound: boolean;        // true = contains target phoneme
  distractors?: string[];         // extra words to play as options
}

/** L2: Blend & Read — audio-only: hear a word, pick the correct text word */
export interface BlendQuestion {
  word: string;
  letters: string[];              // [c, a, t] — kept for post-answer feedback only
  choices: string[];              // [cat, cot, cut] — child picks correct word
  correctIndex: number;
}

/** L3: Word Family (DEPRECATED in P0 — replaced by SegmentQuestion) */
export interface FamilyQuestion {
  wordFamily: string;             // "-at"
  onset: string;                  // "b"
  targetWord: string;             // "bat"
  choices: string[];              // [bat, bet, bit]
  correctIndex: number;
}

/** L3 NEW: Drag & Spell — hear a word, drag letter tiles to Elkonin boxes */
export interface SegmentQuestion {
  word: string;                   // "bat"
  letters: string[];              // ["b", "a", "t"]
  distractorLetters: string[];    // ["c", "h"] extra distractors
  elkoninBoxes: number;           // 3
}

/** L4: Phoneme Substitution (DEPRECATED — replaced by SubstituteQuestionV2 in P1) */
export interface SubstituteQuestion {
  baseWord: string;               // "cat"
  swapFrom: string;               // "c"
  swapTo: string;                 // "b"
  targetWord: string;             // "bat"
  choices: string[];              // [bat, cat, hat]
  correctIndex: number;
}

/** L4 NEW: Drag & Replace — drag a letter to replace one position (P1) */
export interface SubstituteQuestionV2 {
  baseWord: string;               // "cat"
  targetWord: string;             // "hat"
  swapFrom: string;               // "c"
  swapTo: string;                 // "h"
  poolLetters: string[];          // ["h", "b", "m"] — letter pool for dragging
  replacePosition: number;        // 0 (first position to replace)
}

/** L5: Transfer / Nonsense Words (DEPRECATED — replaced by TransferQuestionV2 in P2) */
export interface TransferQuestion {
  word: string;                   // "zat", "vab", "flad"
  isNonsense: boolean;            // true = fake word
  choices: string[];              // multiple choice pronunciations
  correctIndex: number;
}

/** L5 NEW: Audio-only sound choice — see word, hear 3 pronunciations, pick correct one (P2) */
export interface TransferQuestionV2 {
  word: string;                   // "zat" (displayed text)
  isNonsense: boolean;            // true = fake word
  audioOptions: string[];         // ["zat", "zayt", "zet"] — TTS reads these for diff sounds
  correctIndex: number;           // 0
}

// ─── Speech Types ───────────────────────────────────────────────

export type SpeechStatus = "idle" | "speaking" | "listening" | "error";

export interface SpeechState {
  status: SpeechStatus;
  error?: string;
}

// ─── App State ──────────────────────────────────────────────────

export type AppTab = "learn" | "practice" | "rewards";

export type HootyMood = "welcome" | "teaching" | "correct" | "wrong" | "celebrate";

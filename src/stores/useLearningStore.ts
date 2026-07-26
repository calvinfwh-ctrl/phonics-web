import { create } from "zustand";
import type {
  PhonicsRule,
  RuleProgress,
  LevelNumber,
  ListenQuestion,
  BlendQuestion,
  FamilyQuestion,
  SegmentQuestion,
  SubstituteQuestion,
  SubstituteQuestionV2,
  TransferQuestion,
  TransferQuestionV2,
} from "@/types";
import { stage2ShortVowels, getRuleById, getNextRuleId } from "@/data";
import * as db from "@/lib/db";
import {
  generateListenQuestions,
  generateBlendQuestions,
  generateFamilyQuestions,
  generateSegmentQuestions,
  generateSubstituteQuestions,
  generateSubstituteQuestionsV2,
  generateTransferQuestions,
  generateTransferQuestionsV2,
} from "@/lib/learning-engine";

interface LearningState {
  currentRule: PhonicsRule | null;
  currentLevel: LevelNumber;
  isSessionActive: boolean;
  showTeachScreen: boolean;
  listenQuestions: ListenQuestion[];
  blendQuestions: BlendQuestion[];
  familyQuestions: FamilyQuestion[];
  segmentQuestions: SegmentQuestion[];
  substituteQuestions: SubstituteQuestion[];
  substituteQuestionsV2: SubstituteQuestionV2[];
  transferQuestions: TransferQuestion[];
  transferQuestionsV2: TransferQuestionV2[];
  currentQuestionIndex: number;
  correctCount: number;
  totalCount: number;
  levelResults: Record<number, { correct: number; total: number }>;
  ruleProgresses: Record<string, RuleProgress>;
  startSession: (ruleId?: string) => Promise<void>;
  endSession: () => void;
  completeTeachScreen: () => void;
  generateLevelQuestions: (level: LevelNumber) => void;
  answerQuestion: (userChoiceIndex: number, correctIndex: number) => { isCorrect: boolean; levelComplete: boolean; ruleComplete: boolean; };
  answerSegmentQuestion: (correct: boolean, word: string) => { isCorrect: boolean; levelComplete: boolean; ruleComplete: boolean; };
  recordWrongDrag: (word: string) => void;
  advanceLevel: () => Promise<string | null>;
  resetSession: () => void;
  refreshProgress: () => Promise<void>;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  currentRule: null,
  currentLevel: 1,
  isSessionActive: false,
  showTeachScreen: false,
  listenQuestions: [],
  blendQuestions: [],
  familyQuestions: [],
  segmentQuestions: [],
  substituteQuestions: [],
  substituteQuestionsV2: [],
  transferQuestions: [],
  transferQuestionsV2: [],
  currentQuestionIndex: 0,
  correctCount: 0,
  totalCount: 0,
  levelResults: {},
  ruleProgresses: {},

  startSession: async (ruleId?: string) => {
    let targetRuleId = ruleId;
    if (!targetRuleId) {
      const priority = await db.getPriorityRule();
      if (priority) targetRuleId = priority;
      else {
        for (const rule of stage2ShortVowels) {
          const progress = await db.getRuleProgress(rule.id);
          if (progress.status !== "mastered") { targetRuleId = rule.id; break; }
        }
      }
    }
    if (!targetRuleId) targetRuleId = stage2ShortVowels[0].id;

    const rule = getRuleById(targetRuleId);
    if (!rule) return;

    const progress = await db.getRuleProgress(targetRuleId);
    const currentLevel = progress.currentLevel as LevelNumber;
    const isFirstTime = progress.status === "not_started";

    set({
      currentRule: rule, currentLevel, isSessionActive: true,
      showTeachScreen: isFirstTime, currentQuestionIndex: 0,
      correctCount: 0, totalCount: 0, levelResults: {},
    });

    if (!isFirstTime) get().generateLevelQuestions(currentLevel);
    await db.updateRuleProgress(targetRuleId, { status: "in_progress" });
  },

  endSession: () => set({ isSessionActive: false, currentRule: null, showTeachScreen: false }),

  completeTeachScreen: () => {
    set({ showTeachScreen: false });
    get().generateLevelQuestions(get().currentLevel);
  },

  generateLevelQuestions: (level: LevelNumber) => {
    const rule = get().currentRule;
    if (!rule) return;
    switch (level) {
      case 1: set({ listenQuestions: generateListenQuestions(rule, 5) }); break;
      case 2: set({ blendQuestions: generateBlendQuestions(rule, 5) }); break;
      case 3: set({ segmentQuestions: generateSegmentQuestions(rule, 5) }); break;
      case 4: set({ substituteQuestionsV2: generateSubstituteQuestionsV2(rule, 4) }); break;
      case 5: set({ transferQuestionsV2: generateTransferQuestionsV2(rule, 4) }); break;
    }
    set({ currentQuestionIndex: 0, correctCount: 0, totalCount: 0 });
  },

  answerQuestion: (userChoiceIndex, correctIndex) => {
    const isCorrect = userChoiceIndex === correctIndex;
    const state = get();
    const level = state.currentLevel;
    const newCorrect = state.correctCount + (isCorrect ? 1 : 0);
    const newTotal = state.totalCount + 1;
    const newIndex = state.currentQuestionIndex + 1;
    const questionCount = getQuestionCountForLevel(level, state);
    const levelComplete = newIndex >= questionCount;
    const passThreshold = level === 5 ? 2 / 3 : 0.6;
    const ruleComplete = levelComplete && level === 5 && newCorrect / newTotal >= passThreshold;

    set({
      correctCount: newCorrect, totalCount: newTotal,
      currentQuestionIndex: levelComplete ? questionCount : newIndex,
      levelResults: { ...state.levelResults, [level]: { correct: newCorrect, total: newTotal } },
    });
    return { isCorrect, levelComplete, ruleComplete };
  },

  answerSegmentQuestion: (correct, word) => {
    const state = get();
    const level = state.currentLevel;
    const newCorrect = state.correctCount + (correct ? 1 : 0);
    const newTotal = state.totalCount + 1;
    // Only advance question index for correct answers (drag exercises allow retry)
    const newIndex = correct ? state.currentQuestionIndex + 1 : state.currentQuestionIndex;
    const questionCount = level === 3 ? state.segmentQuestions.length : state.substituteQuestionsV2.length;
    const levelComplete = newIndex >= questionCount;

    set({
      correctCount: newCorrect, totalCount: newTotal,
      currentQuestionIndex: levelComplete ? questionCount : newIndex,
      levelResults: { ...state.levelResults, [level]: { correct: newCorrect, total: newTotal } },
    });
    return { isCorrect: correct, levelComplete, ruleComplete: false };
  },

  recordWrongDrag: (word) => {
    const state = get();
    const rule = state.currentRule;
    const level = state.currentLevel;
    if (rule) {
      const errorType = level === 3 ? "segment" as const : "substitute" as const;
      db.recordError(rule.id, level as LevelNumber, word, errorType).catch(() => {});
    }
    set({ totalCount: state.totalCount + 1 });
  },

  advanceLevel: async () => {
    const state = get();
    const rule = state.currentRule;
    if (!rule) return null;

    const currentLevel = state.currentLevel;
    const result = state.levelResults[currentLevel];
    const passThreshold = currentLevel === 5 ? 2 / 3 : 0.6;
    const passed = result ? result.correct / result.total >= passThreshold : false;

    if (!passed) {
      await db.recordError(rule.id, currentLevel, rule.practiceWords[0],
        currentLevel === 1 ? "listen" : currentLevel === 2 ? "blend"
          : currentLevel === 3 ? "segment" : currentLevel === 4 ? "substitute" : "transfer");
      state.generateLevelQuestions(currentLevel);
      return null;
    }

    await db.logStudy({
      date: new Date().toISOString().split("T")[0],
      ruleId: rule.id, level: currentLevel, exerciseType: `L${currentLevel}`,
      correctCount: result?.correct || 0, totalCount: result?.total || 0,
    });

    if (currentLevel >= 5) {
      await db.markRuleMastered(rule.id);
      set({ isSessionActive: false });
      return getNextRuleId(rule.id);
    }

    const nextLevel = (currentLevel + 1) as LevelNumber;
    await db.updateRuleProgress(rule.id, { currentLevel: nextLevel, status: "in_progress" });
    get().generateLevelQuestions(nextLevel);
    set({ currentLevel: nextLevel, currentQuestionIndex: 0 });
    return null;
  },

  resetSession: () => set({
    currentRule: null, currentLevel: 1, isSessionActive: false, showTeachScreen: false,
    currentQuestionIndex: 0, correctCount: 0, totalCount: 0, levelResults: {},
    listenQuestions: [], blendQuestions: [], familyQuestions: [],
    segmentQuestions: [], substituteQuestions: [], substituteQuestionsV2: [],
    transferQuestions: [], transferQuestionsV2: [],
  }),

  refreshProgress: async () => {
    const progresses: Record<string, RuleProgress> = {};
    for (const rule of stage2ShortVowels) {
      progresses[rule.id] = await db.getRuleProgress(rule.id);
    }
    set({ ruleProgresses: progresses });
  },
}));

function getQuestionCountForLevel(level: LevelNumber, state: LearningState): number {
  switch (level) {
    case 1: return state.listenQuestions.length;
    case 2: return state.blendQuestions.length;
    case 3: return state.segmentQuestions.length;
    case 4: return state.substituteQuestionsV2.length;
    case 5: return state.transferQuestionsV2.length;
  }
}

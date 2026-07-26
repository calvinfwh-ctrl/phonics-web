"use client";

import { useEffect } from "react";
import { stage2ShortVowels } from "@/data";
import { useLearningStore } from "@/stores/useLearningStore";
import HootyAvatar from "@/components/HootyAvatar";
import TeachScreen from "@/components/TeachScreen";
import ListenExercise from "@/components/ListenExercise";
import BlendExercise from "@/components/BlendExercise";
import DragSpellExercise from "@/components/DragSpellExercise";
import SubstituteExercise from "@/components/SubstituteExercise";
import TransferExercise from "@/components/TransferExercise";

export default function LearnPage() {
  const {
    currentRule,
    currentLevel,
    isSessionActive,
    showTeachScreen,
    listenQuestions,
    blendQuestions,
    segmentQuestions,
    substituteQuestionsV2,
    transferQuestionsV2,
    correctCount,
    totalCount,
    ruleProgresses,
    startSession,
    completeTeachScreen,
    answerQuestion,
    answerSegmentQuestion,
    recordWrongDrag,
    advanceLevel,
    resetSession,
    refreshProgress,
  } = useLearningStore();

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  // ─── No active session: show rule selection ───
  if (!isSessionActive) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <HootyAvatar mood="welcome" message="准备好学新规则了吗？" size="lg" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">Stage 2: CVC 短元音</h2>

        <div className="grid gap-3">
          {stage2ShortVowels.map((rule) => {
            const progress = ruleProgresses[rule.id];
            const isMastered = progress?.status === "mastered";
            const isStruggling = progress?.status === "struggling";
            const isInProgress = progress?.status === "in_progress";

            return (
              <button
                key={rule.id}
                onClick={() => startSession(rule.id)}
                className={`
                  w-full p-4 rounded-2xl border-2 text-left transition-all
                  hover:scale-[1.02] active:scale-[0.98]
                  ${isMastered
                    ? "border-green-300 bg-green-50"
                    : isStruggling
                      ? "border-red-300 bg-red-50"
                      : isInProgress
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white"
                  }
                `}
                style={{ borderLeftColor: rule.color, borderLeftWidth: "6px" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{rule.titleEn}</h3>
                    <p className="text-sm text-gray-500">{rule.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{rule.soundDescription}</p>
                  </div>
                  <div className="text-right">
                    {isMastered && <span className="text-2xl">⭐</span>}
                    {isStruggling && <span className="text-2xl">🔄</span>}
                    {isInProgress && <span className="text-2xl">📖</span>}
                    {!isMastered && !isStruggling && !isInProgress && (
                      <span className="text-2xl">▶️</span>
                    )}
                  </div>
                </div>

                {progress && progress.status !== "not_started" && !isMastered && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${level <= (progress.currentLevel || 1)
                            ? "bg-primary-500 text-white"
                            : "bg-gray-200 text-gray-400"
                          }
                        `}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Teaching screen ───
  if (showTeachScreen && currentRule) {
    return (
      <TeachScreen
        rule={currentRule}
        onComplete={completeTeachScreen}
        onSkip={completeTeachScreen}
      />
    );
  }

  // ─── Active session ───
  if (!currentRule) return null;

  const handleAnswer = (choiceIdx: number, correctIdx: number) => {
    answerQuestion(choiceIdx, correctIdx);
  };

  const handleDragAnswer = (correct: boolean, word: string) => {
    answerSegmentQuestion(correct, word);
  };

  const handleWrongDrag = (word: string) => {
    recordWrongDrag(word);
  };

  const handleLevelComplete = async () => {
    const nextRuleId = await advanceLevel();
    if (nextRuleId) {
      await startSession(nextRuleId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={resetSession}
          className="text-primary-600 font-medium text-sm"
        >
          ← 返回
        </button>
        <h2 className="text-lg font-bold">
          L{currentLevel} · {currentRule.titleEn}
        </h2>
        <div className="text-sm text-gray-500">
          {correctCount}/{totalCount} 对
        </div>
      </div>

      <div className="exercise-wrapper">
        {currentLevel === 1 && (
          <ListenExercise
            questions={listenQuestions}
            onAnswer={handleAnswer}
            onComplete={handleLevelComplete}
            targetLetter={currentRule.letters}
          />
        )}
        {currentLevel === 2 && (
          <BlendExercise
            questions={blendQuestions}
            onAnswer={handleAnswer}
            onComplete={handleLevelComplete}
          />
        )}
        {currentLevel === 3 && (
          <DragSpellExercise
            questions={segmentQuestions}
            onAnswer={handleDragAnswer}
            onComplete={handleLevelComplete}
          />
        )}
        {currentLevel === 4 && (
          <SubstituteExercise
            questions={substituteQuestionsV2}
            onAnswer={handleDragAnswer}
            onComplete={handleLevelComplete}
            onWrongDrag={handleWrongDrag}
          />
        )}
        {currentLevel === 5 && (
          <TransferExercise
            questions={transferQuestionsV2}
            onAnswer={handleAnswer}
            onComplete={handleLevelComplete}
          />
        )}
      </div>
    </div>
  );
}

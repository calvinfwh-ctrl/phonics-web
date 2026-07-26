"use client";

import { useState, useCallback } from "react";
import type { ListenQuestion } from "@/types";
import { speechService } from "@/lib/speech";
import HootyAvatar from "./HootyAvatar";

interface ListenExerciseProps {
  questions: ListenQuestion[];
  onAnswer: (choiceIndex: number, correctIndex: number) => void;
  onComplete: () => void;
  targetLetter?: string; // The target letter/sound being tested
}

export default function ListenExercise({
  questions,
  onAnswer,
  onComplete,
  targetLetter,
}: ListenExerciseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);

  const question = questions[currentIdx];
  if (!question) return null;

  const handlePlay = useCallback(() => {
    speechService.cancelSpeech();
    speechService.speak(question.word, { rate: 0.7 });
  }, [question.word]);

  const handleScaffoldBlend = useCallback(() => {
    speechService.cancelSpeech();
    // Slow segmented pronunciation for struggling child
    speechService.speakBlend(question.word.split(""), { rate: 0.4, gap: 350 });
  }, [question.word]);

  const handleAnswer = (choice: boolean) => {
    if (answered) return;

    const correct = choice === question.hasTargetSound;
    setIsCorrect(correct);
    setSelectedChoice(choice ? 1 : 0);
    setAnswered(true);

    if (correct) {
      setConsecutiveWrong(0);
    } else {
      const newStreak = consecutiveWrong + 1;
      setConsecutiveWrong(newStreak);
    }

    onAnswer(choice ? 1 : 0, question.hasTargetSound ? 1 : 0);

    // Wait for feedback then advance
    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
        setAnswered(false);
        setSelectedChoice(null);
        setIsCorrect(null);
      } else {
        onComplete();
      }
    }, correct ? 1500 : 2500);
  };

  const showScaffoldBtn = consecutiveWrong >= 2 && !answered;
  const showScaffoldHint = consecutiveWrong >= 3 && !answered;

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Progress bar */}
      <div className="w-full max-w-sm bg-gray-200 rounded-full h-3">
        <div
          className="bg-primary-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${((currentIdx + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>
      <p className="text-sm text-gray-500">
        L1 听音辨字 · {currentIdx + 1}/{questions.length}
      </p>

      {!answered && (
        <HootyAvatar mood="teaching" message="仔细听！有这个音吗？" size="md" />
      )}

      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={answered}
        className="w-28 h-28 rounded-full bg-primary-500 hover:bg-primary-600
                   text-white flex items-center justify-center text-4xl
                   shadow-lg hover:shadow-xl transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   active:scale-95"
        aria-label="播放发音"
      >
        🔊
      </button>
      <p className="text-sm text-gray-400">点击播放，听听是什么词</p>

      {/* Scaffold: segmented replay */}
      {showScaffoldBtn && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-amber-600 font-medium">听仔细～</p>
          <button
            onClick={handleScaffoldBlend}
            className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200
                       text-amber-800 text-sm font-medium transition-all border border-amber-300"
          >
            🐢 慢速分段播放
          </button>
        </div>
      )}

      {/* Scaffold hint: show target sound */}
      {showScaffoldHint && targetLetter && (
        <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-center">
          <p className="text-xs text-amber-600">今天的音是：</p>
          <p className="text-2xl font-bold text-amber-700">{targetLetter.repeat(3)}</p>
        </div>
      )}

      {/* Answer buttons */}
      <div className="flex gap-6 mt-4">
        <button
          onClick={() => handleAnswer(true)}
          disabled={answered}
          className={`
            w-28 h-16 rounded-2xl text-xl font-bold transition-all
            ${answered && isCorrect === true
              ? "bg-green-500 text-white scale-105"
              : answered && selectedChoice === 1 && !isCorrect
                ? "bg-red-500 text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-95
          `}
        >
          ✅ 有
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={answered}
          className={`
            w-28 h-16 rounded-2xl text-xl font-bold transition-all
            ${answered && isCorrect === true
              ? "bg-green-500 text-white scale-105"
              : answered && selectedChoice === 0 && isCorrect === false
                ? "bg-red-500 text-white"
                : "bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-95
          `}
        >
          ❌ 没有
        </button>
      </div>

      {/* Feedback */}
      {answered && (
        <div className="animate-bounce-in text-center">
          {isCorrect ? (
            <HootyAvatar mood="correct" message={`对啦！这个词就是 "${question.word}"`} />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <HootyAvatar
                mood="wrong"
                message={`这是 "${question.word}"，它${question.hasTargetSound ? "有" : "没有"}这个音哦`}
              />
              <button
                onClick={handlePlay}
                className="w-14 h-14 rounded-full bg-gray-200 hover:bg-gray-300
                           text-gray-600 flex items-center justify-center text-xl
                           transition-all active:scale-95"
                aria-label="重播"
              >
                🔊
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

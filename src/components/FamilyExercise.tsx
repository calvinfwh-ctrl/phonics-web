"use client";

import { useState } from "react";
import type { FamilyQuestion } from "@/types";
import { speechService } from "@/lib/speech";
import HootyAvatar from "./HootyAvatar";

interface FamilyExerciseProps {
  questions: FamilyQuestion[];
  onAnswer: (choiceIndex: number, correctIndex: number) => void;
  onComplete: () => void;
}

export default function FamilyExercise({ questions, onAnswer, onComplete }: FamilyExerciseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = questions[currentIdx];
  if (!question) return null;

  const handleAnswer = (choiceIdx: number) => {
    if (answered) return;

    const correct = choiceIdx === question.correctIndex;
    setIsCorrect(correct);
    setAnswered(true);

    onAnswer(choiceIdx, question.correctIndex);

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
        setAnswered(false);
        setIsCorrect(null);
      } else {
        onComplete();
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="w-full max-w-sm bg-gray-200 rounded-full h-3">
        <div
          className="bg-primary-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${((currentIdx + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>
      <p className="text-sm text-gray-500">
        L3 词族扩展 · {currentIdx + 1}/{questions.length}
      </p>

      {!answered && (
        <HootyAvatar
          mood="teaching"
          message={`学了 ${question.wordFamily} 系列的词，把前面的音换一换！`}
        />
      )}

      {/* Question display */}
      <div className="text-center">
        <p className="text-3xl font-bold text-primary-700 mb-2">
          {question.onset}
          <span className="text-primary-400">{question.wordFamily.slice(1)}</span>
          {" = ?"}
        </p>
        <p className="text-gray-500 text-lg">
          {question.onset} + {question.wordFamily.slice(1)}
        </p>
      </div>

      {/* Play hint */}
      <button
        onClick={() => speechService.speak(`${question.onset}${question.wordFamily.slice(1)}`, { rate: 0.6 })}
        disabled={answered}
        className="w-20 h-20 rounded-full bg-primary-400 hover:bg-primary-500 
                   text-white flex items-center justify-center text-2xl
                   shadow-lg transition-all
                   disabled:opacity-50
                   active:scale-95"
        aria-label="播放读音"
      >
        🔊
      </button>

      {/* Choices */}
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {question.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            disabled={answered}
            className={`
              min-w-[120px] h-16 px-6 rounded-2xl text-2xl font-bold transition-all
              ${answered && i === question.correctIndex
                ? "bg-green-500 text-white scale-105"
                : answered && i !== question.correctIndex && !isCorrect
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700 hover:bg-primary-50 border-2 border-gray-300 hover:border-primary-400"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-95
            `}
          >
            {choice}
          </button>
        ))}
      </div>

      {answered && (
        <div className="animate-bounce-in text-center">
          {isCorrect ? (
            <HootyAvatar mood="correct" message="没错！同一个家族，换一个开头就是新词！" />
          ) : (
            <HootyAvatar
              mood="wrong"
              message={`正确答案是 "${question.targetWord}"，${question.onset} + ${question.wordFamily.slice(1)}`}
            />
          )}
        </div>
      )}
    </div>
  );
}

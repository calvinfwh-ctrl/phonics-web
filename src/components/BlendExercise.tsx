"use client";

import { useState, useCallback } from "react";
import type { BlendQuestion } from "@/types";
import { speechService } from "@/lib/speech";
import HootyAvatar from "./HootyAvatar";

interface BlendExerciseProps {
  questions: BlendQuestion[];
  onAnswer: (choiceIndex: number, correctIndex: number) => void;
  onComplete: () => void;
}

export default function BlendExercise({ questions, onAnswer, onComplete }: BlendExerciseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [scaffoldActive, setScaffoldActive] = useState(false);

  const question = questions[currentIdx];
  if (!question) return null;

  const handlePlayWord = useCallback(() => {
    speechService.cancelSpeech();
    speechService.speak(question.word, { rate: 0.7 });
  }, [question.word]);

  const handleScaffoldBlend = useCallback(() => {
    speechService.cancelSpeech();
    setScaffoldActive(true);
    speechService.speakBlend(question.letters, { rate: 0.4, gap: 350 });
  }, [question.letters]);

  const handleAnswer = async (choiceIdx: number) => {
    if (answered) return;

    const correct = choiceIdx === question.correctIndex;
    setIsCorrect(correct);
    setAnswered(true);

    if (!correct) {
      const newStreak = wrongStreak + 1;
      setWrongStreak(newStreak);
    } else {
      setWrongStreak(0);
      setScaffoldActive(false);
    }

    onAnswer(choiceIdx, question.correctIndex);

    await new Promise((r) => setTimeout(r, correct ? 2000 : 2500));

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setAnswered(false);
      setIsCorrect(null);
    } else {
      onComplete();
    }
  };

  // Scaffold shows after 2+ wrong answers (aligned with L3 and spec)
  const showScaffoldButton = wrongStreak >= 2 && !answered;

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
        L2 听音选词 · {currentIdx + 1}/{questions.length}
      </p>

      {/* Hooty instruction — no word text shown! */}
      {!answered && (
        <HootyAvatar
          mood="teaching"
          message="听一听，是哪个词？"
        />
      )}

      {/* Play audio button — the ONLY way to hear the word */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handlePlayWord}
          disabled={answered}
          className="w-24 h-24 rounded-full bg-primary-500 hover:bg-primary-600
                     text-white flex items-center justify-center text-4xl
                     shadow-lg hover:shadow-xl transition-all
                     disabled:opacity-50
                     active:scale-95"
          aria-label="播放单词发音"
        >
          🔊
        </button>
        <p className="text-sm text-gray-400">点喇叭听单词</p>
      </div>

      {/* Scaffold: slow segment blend (shown after 2+ wrong answers per spec) */}
      {showScaffoldButton && (
        <button
          onClick={handleScaffoldBlend}
          className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200
                     text-amber-800 text-sm font-medium transition-all
                     border border-amber-300"
        >
          🐢 慢速分段播放
        </button>
      )}

      {/* Choices — text words only, no letters displayed */}
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {question.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            disabled={answered}
            className={`
              min-w-[120px] h-16 px-6 rounded-2xl text-2xl font-bold transition-all
              ${
                answered && i === question.correctIndex
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

      {/* Post-answer feedback */}
      {answered && (
        <div className="animate-bounce-in text-center">
          {isCorrect ? (
            <div className="flex flex-col items-center gap-3">
              <HootyAvatar mood="correct" message="没错！" />
              {/* Letters appear AFTER correct answer — confirmation, not hint */}
              <div className="flex items-center gap-2 text-4xl font-bold text-green-600 animate-bounce-in">
                {question.letters.map((letter, i) => (
                  <span
                    key={i}
                    className="w-14 h-14 flex items-center justify-center
                               bg-green-100 border-2 border-green-300 rounded-xl"
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <button
                onClick={() => speechService.speak(question.word, { rate: 0.7 })}
                className="text-green-600 hover:text-green-700 text-sm underline"
              >
                🔊 再听一次
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <HootyAvatar
                mood="wrong"
                message={`正确答案是 "${question.word}"，再听一次？`}
              />
              <button
                onClick={handlePlayWord}
                className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300
                           text-gray-600 flex items-center justify-center text-2xl
                           transition-all active:scale-95"
                aria-label="重播单词"
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

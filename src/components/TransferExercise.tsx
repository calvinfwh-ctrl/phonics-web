"use client";

import { useState, useCallback } from "react";
import type { TransferQuestionV2 } from "@/types";
import { speechService } from "@/lib/speech";
import HootyAvatar from "./HootyAvatar";

interface TransferExerciseProps {
  questions: TransferQuestionV2[];
  onAnswer: (choiceIndex: number, correctIndex: number) => void;
  onComplete: () => void;
}

export default function TransferExercise({ questions, onAnswer, onComplete }: TransferExerciseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const question = questions[currentIdx];
  if (!question) return null;

  const handlePlayOption = useCallback(
    async (optionIdx: number) => {
      speechService.cancelSpeech();
      setSpeakingIdx(optionIdx);
      try {
        // Play the TTS spelling to produce the target pronunciation
        await speechService.speak(question.audioOptions[optionIdx], { rate: 0.7 });
      } finally {
        setSpeakingIdx(null);
      }
    },
    [question.audioOptions]
  );

  const handlePlayCorrect = useCallback(async () => {
    speechService.cancelSpeech();
    await speechService.speak(question.audioOptions[question.correctIndex], { rate: 0.65 });
  }, [question.audioOptions, question.correctIndex]);

  const handleAnswer = async (choiceIdx: number) => {
    if (answered) return;

    const correct = choiceIdx === question.correctIndex;
    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      setConsecutiveWrong(0);
    } else {
      const newStreak = consecutiveWrong + 1;
      setConsecutiveWrong(newStreak);
    }

    onAnswer(choiceIdx, question.correctIndex);

    await new Promise((r) => setTimeout(r, correct ? 2500 : 3000));

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setAnswered(false);
      setIsCorrect(null);
    } else {
      onComplete();
    }
  };

  const showScaffoldSeg = consecutiveWrong >= 2 && !answered;
  const showScaffoldHint = consecutiveWrong >= 3 && !answered;

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Progress */}
      <div className="w-full max-w-sm bg-gray-200 rounded-full h-3">
        <div
          className="bg-green-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${((currentIdx + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>
      <p className="text-sm text-gray-500">
        ⭐ L5 终极挑战 · {currentIdx + 1}/{questions.length}
      </p>

      {/* Hooty */}
      {!answered && (
        <HootyAvatar
          mood="celebrate"
          message="用你学的规则，读这个词！听听看哪个发音是对的？"
        />
      )}
      {answered && isCorrect && (
        <HootyAvatar mood="celebrate" message="牛！你用规则读出了一个没见过的词！🌟" size="lg" />
      )}
      {answered && !isCorrect && (
        <HootyAvatar mood="wrong" message="想想短元音怎么发～再听一次！" />
      )}

      {/* Word display + badge */}
      <div className="text-center">
        {question.isNonsense && (
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full mb-2">
            🧙 魔法假词
          </span>
        )}
        <p className="text-5xl font-bold text-gray-800 tracking-widest">{question.word}</p>
      </div>

      {/* Audio options — 3 playback buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => handlePlayOption(i)}
            disabled={answered}
            className={`
              flex items-center gap-3 p-3 rounded-xl border-2 transition-all
              ${
                answered && i === question.correctIndex
                  ? "border-green-500 bg-green-50 shadow-md"
                  : answered && i !== question.correctIndex && !isCorrect
                    ? "border-red-300 bg-red-50"
                    : showScaffoldHint && i === question.correctIndex
                      ? "border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300"
                      : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50"
              }
              ${speakingIdx === i ? "ring-2 ring-primary-400 animate-pulse" : ""}
              active:scale-95
            `}
            aria-label={`发音选项 ${i + 1}`}
          >
            <span
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                ${speakingIdx === i ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-600"}
              `}
            >
              {speakingIdx === i ? "🔊" : ["A", "B", "C"][i]}
            </span>
            <span className="text-sm text-gray-500">
              {i === 0 ? "发音 A" : i === 1 ? "发音 B" : "发音 C"}
            </span>
          </button>
        ))}
      </div>

      {/* Select answer buttons */}
      {!answered && (
        <div className="flex gap-3 mt-2">
          {[0, 1, 2].map((i) => (
            <button
              key={`select-${i}`}
              onClick={() => handleAnswer(i)}
              className="w-16 h-16 rounded-2xl border-2 border-gray-300 bg-white
                         text-xl font-bold text-gray-700 hover:border-primary-400 hover:bg-primary-50
                         transition-all active:scale-95"
            >
              {["A", "B", "C"][i]}
            </button>
          ))}
        </div>
      )}
      {!answered && <p className="text-xs text-gray-400">先听3个发音，再选对的那个</p>}

      {/* Scaffold: segmented replay hint */}
      {showScaffoldSeg && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-amber-600 font-medium">听仔细～</p>
          <button
            onClick={handlePlayCorrect}
            className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200
                       text-amber-800 text-sm font-medium transition-all border border-amber-300"
          >
            🔊 再听一遍对的发音
          </button>
        </div>
      )}

      {/* Post-answer feedback */}
      {answered && (
        <div className="animate-bounce-in text-center">
          <button
            onClick={handlePlayCorrect}
            className="px-4 py-2 rounded-xl bg-green-100 hover:bg-green-200
                       text-green-800 text-sm font-medium transition-all"
          >
            🔊 听正确发音
          </button>
        </div>
      )}
    </div>
  );
}

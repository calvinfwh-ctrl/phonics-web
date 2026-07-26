"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import type { SubstituteQuestionV2 } from "@/types";
import { speechService } from "@/lib/speech";
import HootyAvatar from "./HootyAvatar";

// ─── Sub-components ─────────────────────────────────────────────

function LetterTile({
  letter,
  id,
  isUsed,
}: {
  letter: string;
  id: string;
  isUsed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isUsed,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 50 : 1 }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      disabled={isUsed}
      className={`
        w-[64px] h-[64px] flex items-center justify-center
        text-3xl font-bold rounded-2xl transition-all duration-200 select-none
        ${isDragging ? "shadow-2xl scale-110 opacity-90" : ""}
        ${isUsed
          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
          : "bg-white text-primary-700 border-2 border-primary-300 hover:border-primary-500 hover:shadow-md cursor-grab active:cursor-grabbing"
        }
      `}
      aria-label={`拖拽字母 ${letter}`}
    >
      {letter}
    </button>
  );
}

function LetterSlot({
  letter,
  isTarget,
  isOver,
  isCorrect,
  isWrong,
  scaffoldLevel,
}: {
  letter: string;
  isTarget: boolean;
  isOver: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  scaffoldLevel: number; // 0=none, 1=blink, 2=strong highlight
}) {
  const { setNodeRef } = useDroppable({ id: isTarget ? "replace-slot" : `fixed-${letter}` });

  return (
    <div
      ref={setNodeRef}
      className={`
        w-[72px] h-[72px] flex items-center justify-center
        rounded-2xl border-2 text-3xl font-bold transition-all duration-300
        ${isTarget && isOver
          ? "border-primary-500 bg-primary-50 scale-110 shadow-lg"
          : isTarget && isCorrect
            ? "border-green-500 bg-green-100 text-green-700"
            : isTarget && isWrong
              ? "border-red-500 bg-red-100 animate-shake"
              : isTarget && scaffoldLevel >= 1
                ? "border-amber-400 bg-amber-50 animate-pulse shadow-md"
                : isTarget && scaffoldLevel >= 2
                  ? "border-amber-500 bg-amber-100 ring-2 ring-amber-400 animate-pulse shadow-lg"
                  : isTarget
                    ? "border-amber-400 bg-amber-50 animate-pulse border-dashed"
                    : "bg-white border-gray-300 text-gray-700"
        }
      `}
    >
      {letter}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

interface SubstituteExerciseProps {
  questions: SubstituteQuestionV2[];
  onAnswer: (correct: boolean, word: string) => void;
  onComplete: () => void;
  onWrongDrag?: (word: string) => void;
}

export default function SubstituteExercise({
  questions,
  onAnswer,
  onComplete,
  onWrongDrag,
}: SubstituteExerciseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [currentLetters, setCurrentLetters] = useState<string[]>([]);
  const [showWrongWord, setShowWrongWord] = useState(false);
  const [wrongWord, setWrongWord] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overReplaceSlot, setOverReplaceSlot] = useState(false);

  const question = questions[currentIdx];
  const prevQuestionKey = useRef("");

  const questionKey = `${currentIdx}-${question?.baseWord ?? ""}`;

  useEffect(() => {
    if (questionKey === prevQuestionKey.current || !question) return;
    prevQuestionKey.current = questionKey;
    setCurrentLetters(question.baseWord.split(""));
    setAnswered(false);
    setIsCorrect(null);
    setWrongAttempts(0);
    setShowWrongWord(false);
    setWrongWord("");
  }, [questionKey, question]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handlePlayBaseWord = useCallback(() => {
    if (!question) return;
    speechService.cancelSpeech();
    setIsSpeaking(true);
    speechService.speak(question.baseWord, { rate: 0.7 }).finally(() => setIsSpeaking(false));
  }, [question]);

  const handlePlayInstruction = useCallback(() => {
    if (!question) return;
    speechService.cancelSpeech();
    speechService.speak(`把 ${question.swapFrom} 换成 ${question.swapTo}`, { rate: 0.6 });
  }, [question]);

  const handlePlayCorrectWord = useCallback(() => {
    if (!question) return;
    speechService.cancelSpeech();
    speechService.speak(question.targetWord, { rate: 0.7 });
  }, [question]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || !question || answered) return;

      if (String(over.id) !== "replace-slot") return;

      const draggedId = String(active.id);
      const draggedLetter = draggedId.replace(/^tile-/, "").replace(/-\d+$/, "");
      const isCorrectDrop = draggedLetter === question.swapTo;

      if (isCorrectDrop) {
        const newLetters = [...currentLetters];
        newLetters[question.replacePosition] = draggedLetter;
        setCurrentLetters(newLetters);
        setIsCorrect(true);
        setAnswered(true);
        speechService.speak(question.targetWord, { rate: 0.7 });
        onAnswer(true, question.targetWord);

        setTimeout(() => {
          if (currentIdx + 1 < questions.length) {
            setCurrentIdx(currentIdx + 1);
          } else {
            onComplete();
          }
        }, 2000);
      } else {
        const newLetters = [...currentLetters];
        const originalLetter = newLetters[question.replacePosition];
        newLetters[question.replacePosition] = draggedLetter;
        const tempWord = newLetters.join("");

        setCurrentLetters(newLetters);
        setShowWrongWord(true);
        setWrongWord(tempWord);
        setIsCorrect(false);

        const newAttempts = wrongAttempts + 1;
        setWrongAttempts(newAttempts);

        // Track wrong drag in store without advancing question
        onWrongDrag?.(tempWord);

        // Play wrong word for educational feedback
        speechService.speak(tempWord, { rate: 0.7 }).then(() => {
          setTimeout(() => {
            speechService.speak(
              `这是 ${tempWord}，不是 ${question.targetWord}，再试一次！`,
              { rate: 0.65 }
            );
          }, 400);
        });

        // Scaffold: repeat instruction after 2+ wrong
        if (newAttempts >= 2) {
          setTimeout(() => {
            speechService.speak(`把 ${question.swapFrom} 换成 ${question.swapTo}`, { rate: 0.55 });
          }, 2500);
        }

        // Scaffold: play correct word after 3+ wrong
        if (newAttempts >= 3) {
          setTimeout(() => {
            speechService.speak(question.targetWord, { rate: 0.65 });
          }, 3500);
        }

        // Revert after delay
        setTimeout(() => {
          const reverted = [...currentLetters];
          reverted[question.replacePosition] = originalLetter;
          setCurrentLetters(reverted);
          setShowWrongWord(false);
          setWrongWord("");
          setIsCorrect(null);
        }, 2500);
      }
    },
    [currentLetters, question, answered, wrongAttempts, currentIdx, questions.length, onAnswer, onComplete, onWrongDrag]
  );

  const handleDragOver = useCallback((event: any) => {
    setOverReplaceSlot(event.over?.id === "replace-slot");
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
    setOverReplaceSlot(false);
  }, []);

  if (!question) return null;

  const scaffoldLevel = answered ? 0 : wrongAttempts;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="w-full max-w-sm bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((currentIdx + (answered ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          L4 音素替换 · {currentIdx + 1}/{questions.length}
        </p>

        {!answered && !showWrongWord && (
          <HootyAvatar mood="teaching" message="换一换，变成新词！" />
        )}
        {answered && isCorrect && (
          <HootyAvatar mood="celebrate" message={`厉害！${question.baseWord} → ${question.targetWord}！`} />
        )}

        <div className="flex items-center gap-3">
          {currentLetters.map((letter, i) => (
            <LetterSlot
              key={`letter-${i}-${questionKey}`}
              letter={letter}
              isTarget={i === question.replacePosition}
              isOver={i === question.replacePosition && overReplaceSlot}
              isCorrect={answered && isCorrect === true && i === question.replacePosition}
              isWrong={showWrongWord && i === question.replacePosition}
              scaffoldLevel={scaffoldLevel}
            />
          ))}
        </div>

        <div className="flex gap-4 items-center flex-wrap justify-center">
          <button
            onClick={handlePlayBaseWord}
            disabled={isSpeaking || answered}
            className={`w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300
                        text-gray-700 flex items-center justify-center text-2xl
                        transition-all active:scale-95 ${isSpeaking ? "animate-pulse" : ""}`}
            aria-label="播放基础词"
          >
            🔊
          </button>

          {!answered && (
            <button
              onClick={handlePlayInstruction}
              className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200
                         text-amber-800 text-sm font-medium transition-all border border-amber-300"
            >
              🗣️ 听指令
            </button>
          )}

          {/* Scaffold buttons */}
          {!answered && wrongAttempts >= 2 && (
            <button
              onClick={handlePlayCorrectWord}
              className="px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200
                         text-orange-800 text-sm font-medium transition-all border border-orange-300"
            >
              🔊 听正确发音
            </button>
          )}

          {!answered && (
            <p className="text-sm text-gray-400">
              把 <span className="font-bold text-red-500">{question.swapFrom}</span> 换成{" "}
              <span className="font-bold text-green-600">{question.swapTo}</span>
            </p>
          )}
        </div>

        {/* Scaffold hint */}
        {!answered && wrongAttempts >= 3 && (
          <div className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-300 text-center">
            <p className="text-xs text-orange-600">答案：</p>
            <p className="text-xl font-bold text-orange-700">{question.targetWord}</p>
          </div>
        )}

        {!answered && (
          <div className="flex flex-wrap gap-3 justify-center mt-2 px-4">
            {question.poolLetters.map((letter, i) => {
              const occurrence = question.poolLetters.slice(0, i).filter((l) => l === letter).length;
              const tileId = `tile-${letter}-${occurrence}`;
              return (
                <LetterTile key={`${tileId}-${questionKey}`} letter={letter} id={tileId} isUsed={false} />
              );
            })}
          </div>
        )}

        {answered && isCorrect && (
          <div className="animate-bounce-in text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-3xl font-bold">
              {currentLetters.map((letter, i) => (
                <span
                  key={i}
                  className={`w-14 h-14 flex items-center justify-center rounded-xl
                    ${i === question.replacePosition ? "bg-green-100 border-2 border-green-400 text-green-700" : "bg-white border-2 border-gray-200 text-gray-700"}`}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-lg text-green-700 font-bold">{currentLetters.join("")}!</p>
            <button
              onClick={handlePlayCorrectWord}
              className="text-green-600 hover:text-green-700 text-sm underline"
            >
              🔊 再听一次
            </button>
          </div>
        )}

        <DragOverlay>
          {activeDragId ? (
            <div className="w-[64px] h-[64px] flex items-center justify-center
                            text-3xl font-bold rounded-2xl bg-primary-100
                            border-2 border-primary-400 shadow-2xl">
              {activeDragId.replace(/^tile-/, "").replace(/-\d+$/, "")}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

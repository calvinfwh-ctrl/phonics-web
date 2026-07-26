"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import type { SegmentQuestion } from "@/types";
import { speechService } from "@/lib/speech";
import HootyAvatar from "./HootyAvatar";

// ─── Sub-components ─────────────────────────────────────────────

/** A draggable letter tile */
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
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 1,
      }
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
        text-3xl font-bold rounded-2xl
        transition-all duration-200 select-none
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

/** A droppable Elkonin box slot */
function SlotBox({
  slotIndex,
  letter,
  isCorrect,
  isError,
  isHint,
}: {
  slotIndex: number;
  letter: string | null;
  isCorrect: boolean;
  isError: boolean;
  isHint: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotIndex}` });

  return (
    <div
      ref={setNodeRef}
      className={`
        w-[72px] h-[72px] flex items-center justify-center
        rounded-2xl border-2 text-3xl font-bold
        transition-all duration-300
        ${isOver
          ? "border-primary-500 bg-primary-50 scale-105"
          : isCorrect
            ? "border-green-500 bg-green-100 text-green-700"
            : isError
              ? "border-red-500 bg-red-100 animate-shake"
              : isHint
                ? "border-amber-400 bg-amber-50 border-dashed"
                : "border-gray-300 bg-gray-50 border-dashed"
        }
      `}
    >
      {letter || (
        <span className={isOver ? "text-primary-300" : "text-gray-300"}>?</span>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

interface DragSpellExerciseProps {
  questions: SegmentQuestion[];
  onAnswer: (correct: boolean, word: string) => void;
  onComplete: () => void;
}

export default function DragSpellExercise({
  questions,
  onAnswer,
  onComplete,
}: DragSpellExerciseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [placedSlots, setPlacedSlots] = useState<(string | null)[]>([]);
  const [slotCorrect, setSlotCorrect] = useState<boolean[]>([]);
  const [slotError, setSlotError] = useState<boolean[]>([]);
  const [slotHint, setSlotHint] = useState<boolean[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [allCorrect, setAllCorrect] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [tileUsedMap, setTileUsedMap] = useState<Record<string, boolean>>({});

  const question = questions[currentIdx];
  const prevQuestionKey = useRef<string>("");

  // Init state when question changes
  const questionKey = `${currentIdx}-${question?.word ?? ""}`;

  useEffect(() => {
    if (questionKey === prevQuestionKey.current) return;
    prevQuestionKey.current = questionKey;

    if (!question) return;
    setPlacedSlots(new Array(question.elkoninBoxes).fill(null));
    setSlotCorrect(new Array(question.elkoninBoxes).fill(false));
    setSlotError(new Array(question.elkoninBoxes).fill(false));
    setSlotHint(new Array(question.elkoninBoxes).fill(false));
    setWrongAttempts(0);
    setAllCorrect(false);
    setTileUsedMap({});
  }, [questionKey, question]);

  // Pool of all tiles: correct letters + distractors, shuffled (stable per question)
  const tilePool = useMemo(() => {
    if (!question) return [];
    const all = [...question.letters, ...question.distractorLetters];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionKey]);

  // Sensors: pointer + touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const handlePlayWord = useCallback(() => {
    if (!question) return;
    speechService.cancelSpeech();
    setIsSpeaking(true);
    speechService.speak(question.word, { rate: 0.7 }).finally(() => setIsSpeaking(false));
  }, [question]);

  const handleScaffoldBlend = useCallback(() => {
    if (!question) return;
    speechService.cancelSpeech();
    speechService.speakBlend(question.letters, { rate: 0.4, gap: 350 });
  }, [question]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;

      if (!over || !question) return;

      const slotMatch = String(over.id).match(/^slot-(\d+)$/);
      if (!slotMatch) return;

      const slotIndex = parseInt(slotMatch[1], 10);
      const tileId = String(active.id);
      const draggedLetter = tileId.replace(/^tile-/, "").replace(/-\d+$/, "");

      // If slot already filled, reject
      if (placedSlots[slotIndex] !== null) return;

      const correctLetter = question.letters[slotIndex];
      const isCorrect = draggedLetter === correctLetter;

      if (isCorrect) {
        // Place the letter
        const newPlaced = [...placedSlots];
        newPlaced[slotIndex] = draggedLetter;
        setPlacedSlots(newPlaced);

        const newCorrect = [...slotCorrect];
        newCorrect[slotIndex] = true;
        setSlotCorrect(newCorrect);

        const newError = [...slotError];
        newError[slotIndex] = false;
        setSlotError(newError);

        const newHint = [...slotHint];
        newHint[slotIndex] = false;
        setSlotHint(newHint);

        // Mark tile as used
        setTileUsedMap((prev) => ({ ...prev, [tileId]: true }));

        // Play the letter sound
        speechService.speak(draggedLetter, { rate: 0.5 });

        // Check if all slots are filled
        const allFilled = newPlaced.every((l) => l !== null);
        if (allFilled) {
          setAllCorrect(true);
          speechService.speak(question.word, { rate: 0.7 });
          // Report correct only when fully assembled
          onAnswer(true, question.word);

          setTimeout(() => {
            if (currentIdx + 1 < questions.length) {
              setCurrentIdx(currentIdx + 1);
            } else {
              onComplete();
            }
          }, 2000);
        }
      } else {
        // Wrong placement
        const newError = [...slotError];
        newError[slotIndex] = true;
        setSlotError(newError);

        const newAttempts = wrongAttempts + 1;
        setWrongAttempts(newAttempts);

        // Report wrong attempt to store for tracking
        onAnswer(false, question.word);

        // Replay the word
        speechService.speak(question.word, { rate: 0.7 });

        // After 2+ wrong attempts, show scaffold
        if (newAttempts >= 2) {
          const newHint = [...slotHint];
          const firstEmpty = placedSlots.findIndex((l) => l === null);
          if (firstEmpty >= 0) {
            newHint[firstEmpty] = true;
          }
          setSlotHint(newHint);

          setTimeout(() => {
            speechService.speakBlend(question.letters, { rate: 0.4, gap: 350 });
          }, 600);
        }

        // Clear error animation
        setTimeout(() => {
          setSlotError((prev) => {
            const cleared = [...prev];
            cleared[slotIndex] = false;
            return cleared;
          });
        }, 600);
      }
    },
    [
      placedSlots,
      slotCorrect,
      slotError,
      slotHint,
      wrongAttempts,
      question,
      currentIdx,
      questions.length,
      onAnswer,
      onComplete,
    ]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  if (!question) return null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col items-center gap-6 p-6">
        {/* Progress bar */}
        <div className="w-full max-w-sm bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${
                ((currentIdx + (allCorrect ? 1 : 0)) / questions.length) * 100
              }%`,
            }}
          />
        </div>
        <p className="text-sm text-gray-500">
          L3 听音拼词 · {currentIdx + 1}/{questions.length}
        </p>

        {/* Hooty instruction */}
        {!allCorrect && (
          <HootyAvatar mood="teaching" message="听词拼字！把字母拖到方格里～" />
        )}
        {allCorrect && (
          <HootyAvatar mood="celebrate" message="太棒了！" />
        )}

        {/* Audio play button */}
        <button
          onClick={handlePlayWord}
          disabled={isSpeaking || allCorrect}
          className={`
            w-24 h-24 rounded-full bg-primary-500 hover:bg-primary-600
            text-white flex items-center justify-center text-4xl
            shadow-lg hover:shadow-xl transition-all
            disabled:opacity-50
            active:scale-95
            ${isSpeaking ? "animate-pulse" : ""}
          `}
          aria-label="播放单词发音"
        >
          🔊
        </button>
        <p className="text-sm text-gray-400">点喇叭听单词</p>

        {/* Scaffold button (after 2+ wrong attempts) */}
        {wrongAttempts >= 2 && !allCorrect && (
          <button
            onClick={handleScaffoldBlend}
            className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200
                       text-amber-800 text-sm font-medium transition-all
                       border border-amber-300"
          >
            🐢 慢速分段播放
          </button>
        )}

        {/* Elkonin boxes */}
        <div className="flex gap-4 justify-center mt-4">
          {Array.from({ length: question.elkoninBoxes }).map((_, i) => (
            <SlotBox
              key={`slot-${i}-${questionKey}`}
              slotIndex={i}
              letter={placedSlots[i]}
              isCorrect={slotCorrect[i]}
              isError={slotError[i]}
              isHint={slotHint[i]}
            />
          ))}
        </div>

        {/* Letter pool */}
        <div className="flex flex-wrap gap-3 justify-center mt-2 px-4">
          {tilePool.map((letter, i) => {
            const occurrence = tilePool.slice(0, i).filter((l) => l === letter).length;
            const tileId = `tile-${letter}-${occurrence}`;
            const isUsed = tileUsedMap[tileId] ?? false;

            return (
              <LetterTile
                key={`${tileId}-${questionKey}`}
                letter={letter}
                id={tileId}
                isUsed={isUsed}
              />
            );
          })}
        </div>

        {/* Post-completion feedback */}
        {allCorrect && (
          <div className="animate-bounce-in text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-3xl font-bold text-green-600">
              {question.letters.map((letter, i) => (
                <span
                  key={i}
                  className="w-14 h-14 flex items-center justify-center
                             bg-green-100 border-2 border-green-400 rounded-xl"
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-lg text-green-700 font-bold">{question.word}!</p>
            <button
              onClick={handlePlayWord}
              className="text-green-600 hover:text-green-700 text-sm underline"
            >
              🔊 再听一次
            </button>
          </div>
        )}

        {/* Drag overlay */}
        <DragOverlay>
          {activeDragId ? (
            <div
              className="w-[64px] h-[64px] flex items-center justify-center
                         text-3xl font-bold rounded-2xl bg-primary-100
                         border-2 border-primary-400 shadow-2xl"
            >
              {activeDragId.replace(/^tile-/, "").replace(/-\d+$/, "")}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

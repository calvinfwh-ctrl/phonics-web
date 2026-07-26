"use client";

import { useState, useCallback } from "react";
import type { PhonicsRule } from "@/types";
import { speechService } from "@/lib/speech";
import HootyAvatar from "./HootyAvatar";

interface TeachScreenProps {
  rule: PhonicsRule;
  onComplete: () => void;
  onSkip: () => void;
}

// Fun emoji map for practice words
const wordEmojis: Record<string, string> = {
  cat: "🐱", bat: "🦇", hat: "🎩", mat: "🧘", rat: "🐀", sat: "💺", pat: "👋", fat: "🍔",
  can: "🥫", fan: "🌀", man: "🧑", pan: "🍳", ran: "🏃", van: "🚐", tan: "☀️",
  cap: "🧢", map: "🗺️", nap: "😴", tap: "🚰", clap: "👏", snap: "🫰",
  bag: "👜", tag: "🏷️", wag: "🐕", rag: "🧹", flag: "🚩",
  pet: "🐹", net: "🥅", wet: "💧", get: "🎁", set: "📺", jet: "✈️", vet: "🩺", let: "🤝",
  pen: "🖊️", ten: "🔟", hen: "🐔", men: "👥", den: "🕳️",
  bed: "🛏️", red: "🔴", fed: "🍽️", led: "🚶",
  big: "🐘", dig: "⛏️", pig: "🐷", wig: "🦱", fig: "🫒",
  pin: "📌", bin: "🗑️", fin: "🦈", tin: "🥫", win: "🏆",
  dip: "💧", hip: "🕺", lip: "👄", rip: "📄", sip: "☕", tip: "💡", zip: "🤐",
  bit: "🦷", fit: "💪", hit: "🥊", kit: "🧰", lit: "💡", sit: "🪑",
  hop: "🐰", mop: "🧹", pop: "🎈", top: "🔝", cop: "👮", stop: "🛑", drop: "💧",
  cot: "🛏️", dot: "🔵", hot: "🔥", lot: "📦", not: "🚫", pot: "🫖", rot: "🦠",
  dog: "🐶", fog: "🌫️", hog: "🐗", jog: "🏃", log: "🪵",
  run: "🏃", sun: "☀️", fun: "🎉", bun: "🍞", gun: "🔫",
  bug: "🐛", dug: "⛏️", hug: "🤗", jug: "🏺", mug: "☕", rug: "🪶", tug: "⛵",
  cup: "🥤", pup: "🐶",
  but: "🤷", cut: "✂️", hut: "🛖", nut: "🥜",
};

const TOTAL_STEPS = 5;

export default function TeachScreen({ rule, onComplete, onSkip }: TeachScreenProps) {
  const [step, setStep] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Select 3-4 example words from practice words
  const exampleWords = rule.practiceWords.slice(0, 4);

  // Get contrast words from other rules (not containing rule.letters)
  const contrastWords = getContrastWords(rule);

  const speakWithIndicator = useCallback(async (text: string, rate = 0.7) => {
    speechService.cancelSpeech();
    setIsSpeaking(true);
    try {
      await speechService.speak(text, { rate });
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${i + 1 === step ? "bg-primary-500 w-6" : i + 1 < step ? "bg-primary-300" : "bg-gray-300"}
            `}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="text-sm text-gray-400 hover:text-gray-600 underline self-end"
      >
        跳过教学 →
      </button>

      <div className="w-full flex flex-col items-center gap-6 mt-2">

        {/* ─── Step 1: Rule Intro ─── */}
        {step === 1 && (
          <>
            <HootyAvatar mood="welcome" message={`今天我们来学${rule.title}！`} size="lg" />

            <div
              className="w-32 h-32 rounded-3xl flex items-center justify-center text-6xl font-bold shadow-lg"
              style={{
                backgroundColor: `${rule.color}20`,
                borderColor: rule.color,
                borderWidth: "3px",
                color: rule.color,
              }}
            >
              {rule.letters.toUpperCase()}
            </div>

            <p className="text-lg text-gray-600 text-center">{rule.soundExample}</p>

            <button
              onClick={() => speakWithIndicator(rule.letters, 0.6)}
              disabled={isSpeaking}
              className={`
                w-20 h-20 rounded-full bg-primary-500 hover:bg-primary-600
                text-white flex items-center justify-center text-3xl
                shadow-lg transition-all active:scale-95
                ${isSpeaking ? "animate-pulse" : ""}
              `}
              aria-label="播放发音"
            >
              🔊
            </button>

            <p className="text-sm text-gray-400">点喇叭听发音</p>
          </>
        )}

        {/* ─── Step 2: Sound Demo ─── */}
        {step === 2 && (
          <>
            <HootyAvatar mood="teaching" message="张大嘴巴，跟我一起说！" />

            <div className="text-center space-y-3">
              <p className="text-xl font-medium text-gray-700">
                {rule.soundDescription}
              </p>
              {rule.soundExample && (
                <p className="text-lg text-gray-500">"{rule.soundExample}"</p>
              )}
            </div>

            <button
              onClick={async () => {
                // Play sound 3 times with 1s gap for child to repeat
                await speakWithIndicator(rule.letters, 0.5);
                await new Promise((r) => setTimeout(r, 1200));
                await speakWithIndicator(rule.letters, 0.5);
                await new Promise((r) => setTimeout(r, 1200));
                await speakWithIndicator(rule.letters, 0.6);
              }}
              disabled={isSpeaking}
              className={`
                w-24 h-24 rounded-full bg-primary-500 hover:bg-primary-600
                text-white flex items-center justify-center text-4xl
                shadow-lg transition-all active:scale-95
                ${isSpeaking ? "animate-pulse" : ""}
              `}
              aria-label="播放发音 ×3"
            >
              🔊
            </button>
            <p className="text-sm text-gray-400">点喇叭听3遍，跟着读！</p>
          </>
        )}

        {/* ─── Step 3: Example Words ─── */}
        {step === 3 && (
          <>
            <HootyAvatar mood="teaching" message={`听这些词，都有 "${rule.letters}" 的音！`} />

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              {exampleWords.map((word) => (
                <button
                  key={word}
                  onClick={() => speakWithIndicator(word, 0.6)}
                  className="flex items-center gap-2 p-3 rounded-xl
                             bg-white border-2 border-gray-200 hover:border-primary-300
                             transition-all active:scale-95 text-left"
                >
                  <span className="text-2xl">{wordEmojis[word] || "🔤"}</span>
                  <span className="text-xl font-medium text-gray-700">{word}</span>
                  <span className="ml-auto text-sm">🔊</span>
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-400">每个词都能点来听！</p>
          </>
        )}

        {/* ─── Step 4: Contrast ─── */}
        {step === 4 && (
          <>
            <HootyAvatar mood="teaching" message={`这个没有 "${rule.letters}" 的音：`} />

            <div className="flex gap-4">
              {contrastWords.map((word) => (
                <button
                  key={word}
                  onClick={() => speakWithIndicator(word, 0.7)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl
                             bg-red-50 border-2 border-red-200
                             hover:bg-red-100 transition-all active:scale-95"
                >
                  <span className="text-2xl">{wordEmojis[word] || "🔤"}</span>
                  <span className="text-xl font-medium text-gray-700">{word}</span>
                  <span className="text-2xl">❌</span>
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-400">听一听，它们没有今天的音！</p>
          </>
        )}

        {/* ─── Step 5: Ready ─── */}
        {step === 5 && (
          <>
            <HootyAvatar mood="celebrate" message="准备好练习了吗？" size="lg" />

            <div className="text-center space-y-3">
              <p className="text-lg text-gray-600">
                你已经认识了 <span className="font-bold" style={{ color: rule.color }}>{rule.letters.toUpperCase()}</span> 的发音！
              </p>
              <p className="text-gray-500">现在就来做练习吧 🎯</p>
            </div>

            <button
              onClick={onComplete}
              className="px-8 py-4 rounded-2xl text-xl font-bold text-white
                         shadow-lg hover:shadow-xl transition-all active:scale-95"
              style={{ backgroundColor: rule.color }}
            >
              开始练习 →
            </button>
          </>
        )}

        {/* Navigation buttons (Steps 1-4) */}
        {step < 5 && (
          <div className="flex gap-4 mt-4">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300
                           text-gray-700 font-medium transition-all active:scale-95"
              >
                ← 上一步
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-6 py-3 rounded-xl text-white font-medium
                         shadow-md hover:shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: rule.color }}
            >
              {step === TOTAL_STEPS - 1 ? "准备好了！" : "下一步 →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Get 2 contrast words from other rules (not containing the target letter) */
function getContrastWords(rule: PhonicsRule): string[] {
  const allContrastPools: Record<string, string[]> = {
    short_a: ["pet", "wet", "big", "dig", "hop", "mop", "sun", "run", "bug", "cup"],
    short_e: ["cat", "hat", "big", "pig", "hop", "dog", "sun", "fun"],
    short_i: ["cat", "map", "pet", "bed", "hop", "dog", "sun", "fun"],
    short_o: ["cat", "bag", "pet", "bed", "big", "zip", "sun", "fun"],
    short_u: ["cat", "map", "pet", "bed", "big", "pig", "hop", "dog"],
  };

  const pool = allContrastPools[rule.id] || ["pet", "dog"];
  return pool.slice(0, 2);
}

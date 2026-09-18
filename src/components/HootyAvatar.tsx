"use client";

import { useEffect } from "react";
import type { HootyMood } from "@/types";
import { speechService } from "@/lib/speech";

interface HootyAvatarProps {
  mood: HootyMood;
  message?: string;
  size?: "sm" | "md" | "lg";
  /** Speak the bubble. Defaults on for teaching/welcome so kids hear natural Chinese. */
  autoSpeak?: boolean;
}

const moodEmojis: Record<HootyMood, string> = {
  welcome: "🦉",
  teaching: "📖",
  correct: "🌟",
  wrong: "🤔",
  celebrate: "🎉",
};

const moodColors: Record<HootyMood, string> = {
  welcome: "bg-blue-100 border-blue-300",
  teaching: "bg-amber-100 border-amber-300",
  correct: "bg-green-100 border-green-400",
  wrong: "bg-red-100 border-red-300",
  celebrate: "bg-purple-100 border-purple-400",
};

const moodLabels: Record<HootyMood, string> = {
  welcome: "Hooty",
  teaching: "Hooty 老师",
  correct: "答对了！",
  wrong: "再想想～",
  celebrate: "太棒了！",
};

const sizeClasses: Record<string, string> = {
  sm: "text-3xl p-2",
  md: "text-5xl p-3",
  lg: "text-7xl p-4",
};

export default function HootyAvatar({
  mood,
  message,
  size = "md",
  autoSpeak,
}: HootyAvatarProps) {
  const shouldSpeak =
    autoSpeak ?? (mood === "teaching" || mood === "welcome");

  useEffect(() => {
    if (!shouldSpeak || !message) return;
    void speechService.speak(message, { lang: "auto" });
  }, [message, shouldSpeak, mood]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          relative rounded-full border-2 ${moodColors[mood]} ${sizeClasses[size]}
          flex items-center justify-center
          transition-all duration-300 ease-bounce
          ${mood === "celebrate" ? "animate-star-pop" : ""}
          ${mood === "wrong" ? "animate-shake" : ""}
        `}
        role="img"
        aria-label={moodLabels[mood]}
      >
        <span className={mood === "welcome" ? "animate-float" : ""}>
          {moodEmojis[mood]}
        </span>
      </div>

      {message && (
        <div
          className={`
            max-w-xs px-4 py-2 rounded-2xl text-center text-sm font-medium
            ${mood === "correct" ? "bg-green-50 text-green-800" : ""}
            ${mood === "wrong" ? "bg-red-50 text-red-800" : ""}
            ${mood === "celebrate" ? "bg-purple-50 text-purple-800" : ""}
            ${mood === "teaching" ? "bg-amber-50 text-amber-800" : ""}
            ${mood === "welcome" ? "bg-blue-50 text-blue-800" : ""}
            animate-bounce-in
          `}
        >
          {message}
        </div>
      )}

      <span className="text-xs text-gray-400 font-medium">
        {moodLabels[mood]}
      </span>
    </div>
  );
}

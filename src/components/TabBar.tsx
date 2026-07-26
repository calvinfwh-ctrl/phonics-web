"use client";

import type { AppTab } from "@/types";

interface TabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; label: string; emoji: string }[] = [
  { id: "learn", label: "学规则", emoji: "📚" },
  { id: "practice", label: "练规则", emoji: "🎯" },
  { id: "rewards", label: "奖励", emoji: "⭐" },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 
                    shadow-lg safe-area-bottom z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center justify-center gap-0.5
              w-full h-full transition-all
              ${activeTab === tab.id
                ? "text-primary-600 scale-105"
                : "text-gray-400 hover:text-gray-600"
              }
            `}
          >
            <span className="text-2xl">{tab.emoji}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

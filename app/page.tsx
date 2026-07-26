"use client";

import { useState, useEffect } from "react";
import type { AppTab } from "@/types";
import TabBar from "@/components/TabBar";
import LearnPage from "./learn/page";
import PracticePage from "./practice/page";
import RewardsPage from "./rewards/page";
import { useLearningStore } from "@/stores/useLearningStore";

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("learn");
  const refreshProgress = useLearningStore((s) => s.refreshProgress);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  return (
    <div className="min-h-dvh pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 safe-area-top">
        <h1 className="text-xl font-bold text-center text-primary-700">
          🦉 PhonicsTeacher
        </h1>
      </header>

      {/* Content */}
      {activeTab === "learn" && <LearnPage />}
      {activeTab === "practice" && <PracticePage />}
      {activeTab === "rewards" && <RewardsPage />}

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

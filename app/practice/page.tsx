"use client";

import { useLearningStore } from "@/stores/useLearningStore";
import HootyAvatar from "@/components/HootyAvatar";

export default function PracticePage() {
  const { startSession, ruleProgresses, isSessionActive } = useLearningStore();

  const strugglingRules = Object.entries(ruleProgresses).filter(
    ([, p]) => p.status === "struggling"
  );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <HootyAvatar
          mood="teaching"
          message="练习薄弱环节，越来越棒！"
          size="md"
        />
      </div>

      <h2 className="text-2xl font-bold text-center mb-6">🎯 针对性练习</h2>

      {strugglingRules.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">🌟</p>
          <p className="text-lg text-gray-600">
            没有需要复习的规则！
          </p>
          <p className="text-sm text-gray-400 mt-2">
            所有规则都在顺利掌握中
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {strugglingRules.map(([ruleId, progress]) => (
            <button
              key={ruleId}
              onClick={() => startSession(ruleId)}
              disabled={isSessionActive}
              className="w-full p-4 rounded-2xl border-2 border-amber-300 
                         bg-amber-50 text-left transition-all
                         hover:scale-[1.02] active:scale-[0.98]
                         disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {ruleId.replace("_", " ").toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-500">
                    卡在 L{progress.currentLevel} · 尝试 {progress.attempts} 次
                  </p>
                </div>
                <span className="text-2xl">🔄</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

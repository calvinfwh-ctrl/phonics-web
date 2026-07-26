"use client";

import { useEffect, useState } from "react";
import { useLearningStore } from "@/stores/useLearningStore";
import { stage2ShortVowels } from "@/data";
import HootyAvatar from "@/components/HootyAvatar";

export default function RewardsPage() {
  const { ruleProgresses, refreshProgress } = useLearningStore();
  const [studyCount, setStudyCount] = useState(0);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const masteredCount = Object.values(ruleProgresses).filter(
    (p) => p.status === "mastered"
  ).length;
  const totalRules = stage2ShortVowels.length;
  const totalStars = Object.values(ruleProgresses).reduce(
    (sum, p) => sum + (p.status === "mastered" ? 3 : p.status === "in_progress" ? 1 : 0),
    0
  );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <HootyAvatar
          mood={masteredCount > 0 ? "celebrate" : "welcome"}
          message={masteredCount > 0
            ? `已经掌握了 ${masteredCount} 个规则！`
            : "完成学习赢星星！"
          }
          size="lg"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-3xl mb-1">📚</p>
          <p className="text-2xl font-bold text-primary-600">
            {masteredCount}/{totalRules}
          </p>
          <p className="text-xs text-gray-500">已掌握</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-3xl mb-1">⭐</p>
          <p className="text-2xl font-bold text-amber-500">{totalStars}</p>
          <p className="text-xs text-gray-500">总星星</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-3xl mb-1">🔥</p>
          <p className="text-2xl font-bold text-red-500">
            {Object.values(ruleProgresses).filter((p) => p.status === "in_progress").length}
          </p>
          <p className="text-xs text-gray-500">进行中</p>
        </div>
      </div>

      {/* Rule progress */}
      <h2 className="text-xl font-bold mb-4">规则进度</h2>
      <div className="grid gap-3">
        {stage2ShortVowels.map((rule) => {
          const progress = ruleProgresses[rule.id];
          const isMastered = progress?.status === "mastered";

          return (
            <div
              key={rule.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl border-2
                ${isMastered
                  ? "border-green-200 bg-green-50"
                  : "border-gray-100 bg-white"
                }
              `}
            >
              {/* Progress dots */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`
                      w-4 h-4 rounded-full
                      ${isMastered
                        ? "bg-green-400"
                        : level < (progress?.currentLevel || 1)
                          ? "bg-primary-400"
                          : level === (progress?.currentLevel || 1) && progress?.status !== "not_started"
                            ? "bg-primary-200 ring-2 ring-primary-400"
                            : "bg-gray-200"
                      }
                    `}
                  />
                ))}
              </div>

              <div className="flex-1">
                <p className="font-semibold">{rule.titleEn}</p>
                <p className="text-xs text-gray-400">{rule.title}</p>
              </div>

              <div className="text-right">
                {isMastered ? (
                  <span className="text-xl star-twinkle">⭐</span>
                ) : progress?.status === "in_progress" ? (
                  <span className="text-xl">📖</span>
                ) : (
                  <span className="text-xl opacity-30">⭐</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

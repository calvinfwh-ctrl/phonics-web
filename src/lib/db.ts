import Dexie, { type Table } from "dexie";
import type { RuleProgress, ErrorRecord, StudyLog } from "@/types";

/**
 * IndexedDB database implementing SPEC-v3 SQLite schema.
 * Tables: rule_progress, rule_errors, study_log
 */
class PhonicsDB extends Dexie {
  ruleProgress!: Table<RuleProgress, string>;
  ruleErrors!: Table<ErrorRecord, number>;
  studyLog!: Table<StudyLog, number>;

  constructor() {
    super("PhonicsDB");

    this.version(1).stores({
      ruleProgress: "ruleId, status, currentLevel",
      ruleErrors: "++id, ruleId, level, errorType, failCount",
      studyLog: "++id, date, ruleId, level, exerciseType",
    });
  }
}

export const db = new PhonicsDB();

// ─── Rule Progress Helpers ────────────────────────────────

export async function getRuleProgress(ruleId: string): Promise<RuleProgress> {
  const progress = await db.ruleProgress.get(ruleId);
  if (progress) return progress;

  // Default for new rules
  return {
    ruleId,
    status: "not_started",
    currentLevel: 1,
    attempts: 0,
  };
}

export async function updateRuleProgress(
  ruleId: string,
  updates: Partial<RuleProgress>
): Promise<void> {
  const existing = await db.ruleProgress.get(ruleId);
  if (existing) {
    await db.ruleProgress.update(ruleId, {
      ...existing,
      ...updates,
      attempts: (existing.attempts || 0) + (updates.attempts || 1),
    });
  } else {
    await db.ruleProgress.put({
      ruleId,
      status: "not_started",
      currentLevel: 1,
      attempts: updates.attempts || 1,
      ...updates,
    });
  }
}

/** Mark a rule as mastered after passing L5 */
export async function markRuleMastered(ruleId: string): Promise<void> {
  await db.ruleProgress.put({
    ruleId,
    status: "mastered",
    currentLevel: 5,
    attempts: 1,
    masteredDate: new Date().toISOString(),
    lastAttempt: { level: 5, correct: 1, total: 1, date: new Date().toISOString() },
  });
}

/** Get the rule that needs attention (struggling or next unstarted) */
export async function getPriorityRule(): Promise<string | null> {
  // First: check for struggling rules
  const struggling = await db.ruleProgress
    .where("status")
    .equals("struggling")
    .first();

  if (struggling) return struggling.ruleId;

  // Second: check for in-progress rules
  const inProgress = await db.ruleProgress
    .where("status")
    .equals("in_progress")
    .first();

  if (inProgress) return inProgress.ruleId;

  return null;
}

// ─── Error Record Helpers ─────────────────────────────────

export async function recordError(
  ruleId: string,
  level: number,
  word: string,
  errorType: ErrorRecord["errorType"]
): Promise<void> {
  const existing = await db.ruleErrors
    .where({ ruleId, level, word })
    .first();

  if (existing) {
    await db.ruleErrors.update(existing.id!, {
      failCount: (existing.failCount || 0) + 1,
      lastFailAt: new Date().toISOString(),
    });
  } else {
    const now = new Date().toISOString();
    await db.ruleErrors.add({
      ruleId,
      level: level as ErrorRecord["level"],
      word,
      errorType,
      failCount: 1,
      firstFailAt: now,
      lastFailAt: now,
    });
  }

  // Mark rule as struggling if failCount >= 3
  const errors = await db.ruleErrors.where({ ruleId, level }).toArray();
  const totalFails = errors.reduce((sum, e) => sum + e.failCount, 0);
  if (totalFails >= 3) {
    await updateRuleProgress(ruleId, { status: "struggling", currentLevel: level as ErrorRecord["level"] });
  }
}

// ─── Study Log Helpers ────────────────────────────────────

export async function logStudy(session: StudyLog): Promise<void> {
  await db.studyLog.add({
    ...session,
    date: session.date || new Date().toISOString().split("T")[0],
  });
}

/** Get today's study count */
export async function getTodayStudyCount(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  return db.studyLog.where("date").equals(today).count();
}

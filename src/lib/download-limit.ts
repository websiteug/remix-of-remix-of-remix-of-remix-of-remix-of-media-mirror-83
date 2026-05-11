import { database } from "./firebase";
import { ref, get, runTransaction, remove, set } from "firebase/database";

// Daily download limits per subscription plan
export const dailyDownloadLimits: Record<string, number> = {
  "2 Days": 10,
  "1 Week": 15,
  "2 Weeks": 20,
  "1 Month": 25,
  "3 Months": 30,
  "6 Months": 35,
  "1 Year": 40,
  Lifetime: -1, // unlimited
  "Admin (Unlimited)": -1,
  "Agent Plan": -1, // agent plan unaffected
  "LuoFree Plan": 5,
};

export function getDailyLimitForPlan(plan?: string | null): number {
  if (!plan) return 0;
  if (plan in dailyDownloadLimits) return dailyDownloadLimits[plan];
  return 0;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getTodayDownloadCount(userId: string): Promise<number> {
  const r = ref(database, `downloadCounts/${userId}/${todayKey()}`);
  const snap = await get(r);
  return snap.exists() ? Number(snap.val()) || 0 : 0;
}

/**
 * Atomically check + increment. Returns { allowed, count, limit }.
 * If limit is -1 (unlimited) it always allows and still increments for stats.
 */
export async function tryConsumeDownload(
  userId: string,
  plan: string | undefined | null
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const limit = getDailyLimitForPlan(plan);
  const r = ref(database, `downloadCounts/${userId}/${todayKey()}`);

  const result = await runTransaction(r, (current) => {
    const c = Number(current) || 0;
    if (limit !== -1 && c >= limit) {
      return undefined; // abort transaction so download is not allowed
    }
    return c + 1;
  });

  const newCount = Number(result.snapshot.val()) || 0;
  const allowed = limit === -1 || result.committed;
  return { allowed, count: newCount, limit };
}

/**
 * Reset today's download count for a user. Called when a user activates
 * a new subscription or upgrades, so they get a fresh daily quota.
 */
export async function resetTodayDownloadCount(userId: string): Promise<void> {
  try {
    const r = ref(database, `downloadCounts/${userId}/${todayKey()}`);
    await set(r, 0);
  } catch (e) {
    console.error("Failed to reset daily download count:", e);
  }
}

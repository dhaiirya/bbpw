import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, settingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { createNotification } from "../lib/notificationHelper";

const router: IRouter = Router();

async function getSetting(key: string, fallback: number): Promise<number> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  if (!row) return fallback;
  const parsed = Number(row.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

router.post("/rewards/daily", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const now = new Date();
  if (user.lastDailyRewardAt) {
    const last = new Date(user.lastDailyRewardAt);
    const sameDay =
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate();
    if (sameDay) {
      res.status(400).json({ error: "Daily reward already claimed today" });
      return;
    }
  }

  // Read configurable values from settings table
  const [baseReward, streakBonusPerDay, maxStreakBonus] = await Promise.all([
    getSetting("daily_reward_base", 50),
    getSetting("daily_reward_streak_bonus_per_day", 10),
    getSetting("daily_reward_max_streak_bonus", 100),
  ]);

  const newStreak = (user.loginStreak ?? 0) + 1;
  const streakBonus = Math.min(newStreak * streakBonusPerDay, maxStreakBonus);
  const coinsAwarded = baseReward + streakBonus;

  const [updated] = await db.update(usersTable)
    .set({
      coins: sql`${usersTable.coins} + ${coinsAwarded}`,
      lastDailyRewardAt: now,
      loginStreak: newStreak,
    })
    .where(eq(usersTable.id, userId))
    .returning();

  await createNotification(
    userId,
    "daily_reward",
    "Daily Reward Claimed!",
    `You received ${coinsAwarded} BBPW Coins! Streak: ${newStreak} days.`,
  );

  res.json({ coinsAwarded, newBalance: updated.coins, streak: newStreak, baseReward, streakBonus });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { createNotification } from "../lib/notificationHelper";

const router: IRouter = Router();

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
  // Streak bonus
  const newStreak = (user.loginStreak ?? 0) + 1;
  const baseReward = 50;
  const streakBonus = Math.min(newStreak * 10, 100);
  const coinsAwarded = baseReward + streakBonus;
  const [updated] = await db.update(usersTable)
    .set({
      coins: sql`${usersTable.coins} + ${coinsAwarded}`,
      lastDailyRewardAt: now,
      loginStreak: newStreak,
    })
    .where(eq(usersTable.id, userId))
    .returning();
  await createNotification(userId, "daily_reward", "Daily Reward Claimed!", `You received ${coinsAwarded} BBPW Coins! Streak: ${newStreak} days.`);
  res.json({ coinsAwarded, newBalance: updated.coins, streak: newStreak });
});

export default router;

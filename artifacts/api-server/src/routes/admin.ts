import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, matchesTable, predictionsTable, settingsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import { serializeUser } from "../lib/userSerializer";

const DEFAULT_SETTINGS: Record<string, string> = {
  daily_reward_base: "50",
  daily_reward_streak_bonus_per_day: "10",
  daily_reward_max_streak_bonus: "100",
};

const router: IRouter = Router();

// Admin stats
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [matchCount] = await db.select({ count: sql<number>`count(*)` }).from(matchesTable);
  const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(matchesTable).where(eq(matchesTable.status, "upcoming"));
  const [predCount] = await db.select({ count: sql<number>`count(*)` }).from(predictionsTable);
  const [coinsSum] = await db.select({ total: sql<number>`sum(coins)` }).from(usersTable);
  const recentActivity = [
    {
      type: "system",
      description: "Platform stats loaded",
      timestamp: new Date().toISOString(),
    },
  ];
  res.json({
    totalUsers: Number(userCount?.count ?? 0),
    totalMatches: Number(matchCount?.count ?? 0),
    activeMatches: Number(activeCount?.count ?? 0),
    totalPredictions: Number(predCount?.count ?? 0),
    totalCoinsInCirculation: Number(coinsSum?.total ?? 0),
    recentActivity,
  });
});

// Set user coins (admin)
router.patch("/admin/users/:userId/coins", requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
  const { coins } = req.body;
  if (coins === undefined || coins < 0) {
    res.status(400).json({ error: "Invalid coin amount" });
    return;
  }
  const [updated] = await db.update(usersTable).set({ coins }).where(eq(usersTable.id, userId)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(serializeUser(updated));
});

// GET platform settings
router.get("/admin/settings", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable);
  // Merge DB rows with defaults so all keys are always present
  const merged: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    merged[row.key] = row.value;
  }
  res.json(merged);
});

// PUT platform settings (bulk upsert)
router.put("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const allowed = new Set(Object.keys(DEFAULT_SETTINGS));
  const updates = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    if (!allowed.has(key)) continue;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      res.status(400).json({ error: `Invalid value for ${key}: must be a non-negative number` });
      return;
    }
    await db.insert(settingsTable)
      .values({ key, value: String(num), updatedAt: new Date() })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value: String(num), updatedAt: new Date() } });
  }
  const rows = await db.select().from(settingsTable);
  const merged: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) merged[row.key] = row.value;
  res.json(merged);
});

// Toggle admin (admin)
router.patch("/admin/users/:userId/toggle-admin", requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [updated] = await db.update(usersTable).set({ isAdmin: !user.isAdmin }).where(eq(usersTable.id, userId)).returning();
  res.json(serializeUser(updated));
});

export default router;

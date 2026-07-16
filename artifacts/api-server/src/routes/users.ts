import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { db, usersTable, predictionsTable, matchesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { serializeUser } from "../lib/userSerializer";

const router: IRouter = Router();

// List all users (admin)
router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(serializeUser));
});

// Search users
router.get("/users/search", requireAuth, async (req, res): Promise<void> => {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ error: "Query is required" });
    return;
  }
  const users = await db.select().from(usersTable)
    .where(ilike(usersTable.username, `%${q}%`))
    .limit(20);
  res.json(users.map(serializeUser));
});

// Get user profile
router.get("/users/:userId", requireAuth, async (req, res): Promise<void> => {
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  // Recent predictions
  const recentPredictions = await db.select({
    prediction: predictionsTable,
    match: matchesTable,
  })
    .from(predictionsTable)
    .innerJoin(matchesTable, eq(predictionsTable.matchId, matchesTable.id))
    .where(eq(predictionsTable.userId, userId))
    .orderBy(predictionsTable.createdAt)
    .limit(10);
  const formattedPredictions = recentPredictions.map(r => ({
    prediction: {
      ...r.prediction,
      createdAt: r.prediction.createdAt.toISOString(),
    },
    match: {
      ...r.match,
      kickoffAt: r.match.kickoffAt.toISOString(),
      createdAt: r.match.createdAt.toISOString(),
    },
  }));
  res.json({
    user: serializeUser(user),
    recentPredictions: formattedPredictions,
    leaderboardRank: null,
    friendStatus: null,
  });
});

// Update user (admin or self)
router.patch("/users/:userId", requireAuth, async (req, res): Promise<void> => {
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const isSelf = req.session.userId === userId;
  const isAdmin = req.session.isAdmin;
  if (!isSelf && !isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { username, avatarUrl, isAdmin: setAdmin, coins } = req.body;
  const updates: Record<string, unknown> = {};
  if (username !== undefined) updates.username = username;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (isAdmin !== undefined && req.session.isAdmin) updates.isAdmin = setAdmin;
  if (coins !== undefined && req.session.isAdmin) updates.coins = coins;
  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(serializeUser(updated));
});

// Delete user (admin)
router.delete("/users/:userId", requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ success: true, message: "User deleted" });
});

// Get user predictions
router.get("/users/:userId/predictions", requireAuth, async (req, res): Promise<void> => {
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
  const rows = await db.select({
    prediction: predictionsTable,
    match: matchesTable,
  })
    .from(predictionsTable)
    .innerJoin(matchesTable, eq(predictionsTable.matchId, matchesTable.id))
    .where(eq(predictionsTable.userId, userId))
    .orderBy(predictionsTable.createdAt);
  const result = rows.map(r => ({
    prediction: {
      ...r.prediction,
      createdAt: r.prediction.createdAt.toISOString(),
    },
    match: {
      ...r.match,
      kickoffAt: r.match.kickoffAt.toISOString(),
      createdAt: r.match.createdAt.toISOString(),
    },
  }));
  res.json(result);
});

export default router;

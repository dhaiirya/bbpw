import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, predictionsTable, matchesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Get my predictions
router.get("/predictions", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const rows = await db.select({
    prediction: predictionsTable,
    match: matchesTable,
  })
    .from(predictionsTable)
    .innerJoin(matchesTable, eq(predictionsTable.matchId, matchesTable.id))
    .where(eq(predictionsTable.userId, userId))
    .orderBy(predictionsTable.createdAt);
  const result = rows.map(r => ({
    prediction: { ...r.prediction, createdAt: r.prediction.createdAt.toISOString() },
    match: { ...r.match, kickoffAt: r.match.kickoffAt.toISOString(), createdAt: r.match.createdAt.toISOString() },
  }));
  res.json(result);
});

// Place prediction
router.post("/predictions", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const { matchId, prediction, stake } = req.body;
  if (!matchId || !prediction || !stake) {
    res.status(400).json({ error: "matchId, prediction, and stake are required" });
    return;
  }
  if (!["home", "draw", "away"].includes(prediction)) {
    res.status(400).json({ error: "Prediction must be home, draw, or away" });
    return;
  }
  if (stake < 10) {
    res.status(400).json({ error: "Minimum stake is 10 BBPW Coins" });
    return;
  }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  if (match.status !== "upcoming") {
    res.status(400).json({ error: "Betting is closed for this match" });
    return;
  }
  if (new Date() >= match.kickoffAt) {
    res.status(400).json({ error: "Cannot predict after kickoff" });
    return;
  }
  // Check for existing prediction
  const [existing] = await db.select().from(predictionsTable)
    .where(and(eq(predictionsTable.matchId, matchId), eq(predictionsTable.userId, userId)));
  if (existing) {
    res.status(400).json({ error: "You have already placed a prediction on this match" });
    return;
  }
  // Check balance
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.coins < stake) {
    res.status(400).json({ error: "Insufficient BBPW Coins" });
    return;
  }
  // Deduct stake
  await db.update(usersTable).set({ coins: user.coins - stake }).where(eq(usersTable.id, userId));
  // Update match pool
  await db.update(matchesTable).set({
    totalPool: match.totalPool + stake,
    predictionCount: match.predictionCount + 1,
  }).where(eq(matchesTable.id, matchId));
  const [pred] = await db.insert(predictionsTable).values({
    userId,
    matchId,
    prediction,
    stake,
    outcome: "pending",
  }).returning();
  res.status(201).json({ ...pred, createdAt: pred.createdAt.toISOString() });
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { db, matchesTable, predictionsTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { createNotification } from "../lib/notificationHelper";
import { serializeUser } from "../lib/userSerializer";

const router: IRouter = Router();

function serializeMatch(m: typeof matchesTable.$inferSelect) {
  return {
    ...m,
    kickoffAt: m.kickoffAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  };
}

// List matches
router.get("/matches", requireAuth, async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  let query = db.select().from(matchesTable);
  if (status && status !== "all") {
    const rows = await db.select().from(matchesTable).where(eq(matchesTable.status, status)).orderBy(matchesTable.kickoffAt);
    res.json(rows.map(serializeMatch));
    return;
  }
  const rows = await query.orderBy(matchesTable.kickoffAt);
  res.json(rows.map(serializeMatch));
});

// Today's matches
router.get("/matches/today", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const rows = await db.select().from(matchesTable)
    .where(and(gte(matchesTable.kickoffAt, start), lt(matchesTable.kickoffAt, end)))
    .orderBy(matchesTable.kickoffAt);
  res.json(rows.map(serializeMatch));
});

// Get single match
router.get("/matches/:matchId", requireAuth, async (req, res): Promise<void> => {
  const matchId = parseInt(Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId, 10);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  // Vote counts
  const votes = await db.select({
    prediction: predictionsTable.prediction,
    count: sql<number>`count(*)`,
    totalStake: sql<number>`sum(${predictionsTable.stake})`,
  }).from(predictionsTable)
    .where(eq(predictionsTable.matchId, matchId))
    .groupBy(predictionsTable.prediction);
  let homeVotes = 0, drawVotes = 0, awayVotes = 0, totalStaked = 0;
  for (const v of votes) {
    const cnt = Number(v.count);
    const stk = Number(v.totalStake ?? 0);
    totalStaked += stk;
    if (v.prediction === "home") homeVotes = cnt;
    if (v.prediction === "draw") drawVotes = cnt;
    if (v.prediction === "away") awayVotes = cnt;
  }
  // User's own prediction
  const userId = req.session.userId!;
  const [userPrediction] = await db.select().from(predictionsTable)
    .where(and(eq(predictionsTable.matchId, matchId), eq(predictionsTable.userId, userId)));
  res.json({
    match: serializeMatch(match),
    userPrediction: userPrediction ? { ...userPrediction, createdAt: userPrediction.createdAt.toISOString() } : null,
    homeVotes,
    drawVotes,
    awayVotes,
    totalStaked,
  });
});

// Create match (admin)
router.post("/matches", requireAdmin, async (req, res): Promise<void> => {
  const { league, leagueLabel, homeTeam, awayTeam, kickoffAt } = req.body;
  if (!league || !leagueLabel || !homeTeam || !awayTeam || !kickoffAt) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  const [match] = await db.insert(matchesTable).values({
    league,
    leagueLabel,
    homeTeam,
    awayTeam,
    kickoffAt: new Date(kickoffAt),
    status: "upcoming",
  }).returning();
  res.status(201).json(serializeMatch(match));
});

// Update match (admin)
router.patch("/matches/:matchId", requireAdmin, async (req, res): Promise<void> => {
  const matchId = parseInt(Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId, 10);
  const { league, leagueLabel, homeTeam, awayTeam, kickoffAt, status } = req.body;
  const updates: Record<string, unknown> = {};
  if (league !== undefined) updates.league = league;
  if (leagueLabel !== undefined) updates.leagueLabel = leagueLabel;
  if (homeTeam !== undefined) updates.homeTeam = homeTeam;
  if (awayTeam !== undefined) updates.awayTeam = awayTeam;
  if (kickoffAt !== undefined) updates.kickoffAt = new Date(kickoffAt);
  if (status !== undefined) updates.status = status;
  const [match] = await db.update(matchesTable).set(updates).where(eq(matchesTable.id, matchId)).returning();
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  res.json(serializeMatch(match));
});

// Delete match (admin)
router.delete("/matches/:matchId", requireAdmin, async (req, res): Promise<void> => {
  const matchId = parseInt(Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId, 10);
  await db.delete(matchesTable).where(eq(matchesTable.id, matchId));
  res.json({ success: true, message: "Match deleted" });
});

// Declare result (admin)
router.post("/matches/:matchId/result", requireAdmin, async (req, res): Promise<void> => {
  const matchId = parseInt(Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId, 10);
  const { result, homeScore, awayScore } = req.body;
  if (!result || !["home", "draw", "away"].includes(result)) {
    res.status(400).json({ error: "Invalid result" });
    return;
  }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  if (match.status === "completed") {
    res.status(400).json({ error: "Match already completed" });
    return;
  }
  // Settle predictions
  const allPredictions = await db.select().from(predictionsTable).where(eq(predictionsTable.matchId, matchId));
  const winners = allPredictions.filter(p => p.prediction === result);
  const losers = allPredictions.filter(p => p.prediction !== result);
  const totalLost = losers.reduce((sum, p) => sum + p.stake, 0);
  const payoutPerWinner = winners.length > 0 ? Math.floor(totalLost / winners.length) : 0;
  // Update losers
  for (const loser of losers) {
    await db.update(predictionsTable).set({ outcome: "loss", payout: 0 }).where(eq(predictionsTable.id, loser.id));
    await db.update(usersTable)
      .set({ losses: sql`${usersTable.losses} + 1` })
      .where(eq(usersTable.id, loser.userId));
    await createNotification(
      loser.userId,
      "prediction_lost",
      "Prediction Lost",
      `Your prediction for ${match.homeTeam} vs ${match.awayTeam} was incorrect. You lost ${loser.stake} BBPW Coins.`
    );
  }
  // Update winners
  for (const winner of winners) {
    const payout = winner.stake + payoutPerWinner;
    await db.update(predictionsTable).set({ outcome: "win", payout }).where(eq(predictionsTable.id, winner.id));
    await db.update(usersTable)
      .set({
        wins: sql`${usersTable.wins} + 1`,
        coins: sql`${usersTable.coins} + ${payoutPerWinner}`,
      })
      .where(eq(usersTable.id, winner.userId));
    await createNotification(
      winner.userId,
      "prediction_won",
      "Prediction Won!",
      `Your prediction for ${match.homeTeam} vs ${match.awayTeam} was correct! You won ${payoutPerWinner} BBPW Coins.`
    );
  }
  // Update accuracy for all participants
  for (const p of allPredictions) {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, p.userId));
    if (user[0]) {
      const total = user[0].wins + user[0].losses;
      const acc = total > 0 ? Math.round((user[0].wins / total) * 100) : 0;
      await db.update(usersTable).set({ accuracy: acc }).where(eq(usersTable.id, p.userId));
    }
  }
  // Mark match completed
  const [updatedMatch] = await db.update(matchesTable).set({
    status: "completed",
    result,
    homeScore,
    awayScore,
  }).where(eq(matchesTable.id, matchId)).returning();
  res.json({
    match: serializeMatch(updatedMatch),
    winnersCount: winners.length,
    losersCount: losers.length,
    totalPool: totalLost,
    payoutPerWinner,
  });
});

export default router;

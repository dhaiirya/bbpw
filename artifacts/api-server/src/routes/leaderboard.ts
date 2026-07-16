import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { serializeUser } from "../lib/userSerializer";

const router: IRouter = Router();

router.get("/leaderboard", requireAuth, async (req, res): Promise<void> => {
  const sortBy = (req.query.sortBy as string) ?? "coins";
  const limit = Math.min(parseInt((req.query.limit as string) ?? "50", 10), 200);
  const allowedSorts = ["coins", "accuracy", "wins"] as const;
  const safeSort = allowedSorts.includes(sortBy as (typeof allowedSorts)[number]) ? sortBy : "coins";
  const users = await db.select().from(usersTable)
    .orderBy(desc(sql.raw(safeSort)))
    .limit(limit);
  const entries = users.map((u, i) => ({
    rank: i + 1,
    user: serializeUser(u),
    coins: u.coins,
    wins: u.wins,
    accuracy: u.wins + u.losses > 0 ? Math.round((u.wins / (u.wins + u.losses)) * 100) : 0,
  }));
  res.json(entries);
});

export default router;

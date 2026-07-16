import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { serializeUser } from "../lib/userSerializer";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, pin } = req.body;
  if (!username || typeof username !== "string" || username.length < 3 || username.length > 30) {
    res.status(400).json({ error: "Username must be 3-30 characters" });
    return;
  }
  if (!pin || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ error: "PIN must be exactly 4 digits" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  const pinHash = await bcrypt.hash(pin, 10);
  // First user is admin
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const isAdmin = Number(countResult[0]?.count ?? 0) === 0;
  const [user] = await db.insert(usersTable).values({
    username,
    pinHash,
    isAdmin,
    coins: 1000,
  }).returning();
  req.session.userId = user.id;
  req.session.isAdmin = user.isAdmin;
  const token = String(req.session.id);
  res.status(201).json({ user: serializeUser(user), token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, pin, rememberMe } = req.body;
  if (!username || !pin) {
    res.status(400).json({ error: "Username and PIN are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "Invalid username or PIN" });
    return;
  }
  const valid = await bcrypt.compare(pin, user.pinHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or PIN" });
    return;
  }
  if (rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  }
  req.session.userId = user.id;
  req.session.isAdmin = user.isAdmin;
  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));
  const token = String(req.session.id);
  res.json({ user: serializeUser(user), token });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(serializeUser(user));
});

export default router;

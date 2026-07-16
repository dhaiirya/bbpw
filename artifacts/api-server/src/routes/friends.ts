import { Router, type IRouter } from "express";
import { eq, and, or } from "drizzle-orm";
import { db, friendRequestsTable, friendshipsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { serializeUser } from "../lib/userSerializer";
import { createNotification } from "../lib/notificationHelper";

const router: IRouter = Router();

// Get friends
router.get("/friends", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const rows = await db.select().from(friendshipsTable)
    .where(eq(friendshipsTable.userId, userId));
  const friends = await Promise.all(rows.map(async r => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.friendId));
    return { id: r.id, user: user ? serializeUser(user) : null, friendedAt: r.createdAt.toISOString() };
  }));
  res.json(friends.filter(f => f.user !== null));
});

// Get friend requests
router.get("/friends/requests", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const rows = await db.select().from(friendRequestsTable)
    .where(and(eq(friendRequestsTable.toUserId, userId), eq(friendRequestsTable.status, "pending")));
  const requests = await Promise.all(rows.map(async r => {
    const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, r.fromUserId));
    const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, r.toUserId));
    return {
      id: r.id,
      fromUser: fromUser ? serializeUser(fromUser) : null,
      toUser: toUser ? serializeUser(toUser) : null,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    };
  }));
  res.json(requests);
});

// Send friend request
router.post("/friends/requests", requireAuth, async (req, res): Promise<void> => {
  const fromUserId = req.session.userId!;
  const { toUserId } = req.body;
  if (!toUserId || toUserId === fromUserId) {
    res.status(400).json({ error: "Invalid target user" });
    return;
  }
  // Check existing
  const [existing] = await db.select().from(friendRequestsTable)
    .where(or(
      and(eq(friendRequestsTable.fromUserId, fromUserId), eq(friendRequestsTable.toUserId, toUserId)),
      and(eq(friendRequestsTable.fromUserId, toUserId), eq(friendRequestsTable.toUserId, fromUserId))
    ));
  if (existing) {
    res.status(400).json({ error: "Friend request already exists" });
    return;
  }
  const [request] = await db.insert(friendRequestsTable).values({ fromUserId, toUserId }).returning();
  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, fromUserId));
  const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, toUserId));
  await createNotification(toUserId, "friend_request", "Friend Request", `${fromUser?.username ?? "Someone"} sent you a friend request.`);
  res.status(201).json({
    id: request.id,
    fromUser: fromUser ? serializeUser(fromUser) : null,
    toUser: toUser ? serializeUser(toUser) : null,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
  });
});

// Respond to friend request
router.patch("/friends/requests/:requestId", requireAuth, async (req, res): Promise<void> => {
  const requestId = parseInt(Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId, 10);
  const { action } = req.body;
  const [request] = await db.select().from(friendRequestsTable).where(eq(friendRequestsTable.id, requestId));
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (action === "accept") {
    await db.update(friendRequestsTable).set({ status: "accepted" }).where(eq(friendRequestsTable.id, requestId));
    await db.insert(friendshipsTable).values({ userId: request.fromUserId, friendId: request.toUserId });
    await db.insert(friendshipsTable).values({ userId: request.toUserId, friendId: request.fromUserId });
  } else {
    await db.update(friendRequestsTable).set({ status: "declined" }).where(eq(friendRequestsTable.id, requestId));
  }
  res.json({ success: true, message: `Request ${action}ed` });
});

// Remove friend
router.delete("/friends/:friendId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const friendId = parseInt(Array.isArray(req.params.friendId) ? req.params.friendId[0] : req.params.friendId, 10);
  await db.delete(friendshipsTable).where(or(
    and(eq(friendshipsTable.userId, userId), eq(friendshipsTable.friendId, friendId)),
    and(eq(friendshipsTable.userId, friendId), eq(friendshipsTable.friendId, userId))
  ));
  res.json({ success: true, message: "Friend removed" });
});

export default router;

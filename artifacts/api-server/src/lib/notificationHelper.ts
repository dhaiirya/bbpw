import { db, notificationsTable } from "@workspace/db";

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string
) {
  await db.insert(notificationsTable).values({ userId, type, title, message });
}

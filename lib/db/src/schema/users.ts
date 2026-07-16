import { pgTable, serial, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  avatarUrl: text("avatar_url"),
  coins: integer("coins").notNull().default(1000),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  accuracy: real("accuracy").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  badges: text("badges").array().notNull().default([]),
  loginStreak: integer("login_streak").notNull().default(0),
  lastLoginAt: timestamp("last_login_at"),
  lastDailyRewardAt: timestamp("last_daily_reward_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

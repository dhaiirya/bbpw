import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  league: text("league").notNull(),
  leagueLabel: text("league_label").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  kickoffAt: timestamp("kickoff_at").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, live, completed, cancelled
  result: text("result"), // home, draw, away, null
  totalPool: integer("total_pool").notNull().default(0),
  predictionCount: integer("prediction_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  scores: defineTable({
    userId: v.id("users"),
    score: v.number(),
    logsSliced: v.number(),
    maxCombo: v.number(),
    playedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_score", ["score"]),
  leaderboard: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    highScore: v.number(),
    totalLogsSliced: v.number(),
    gamesPlayed: v.number(),
  }).index("by_high_score", ["highScore"]),
});

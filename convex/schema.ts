// convex/schema.ts — complete. Nothing else to add.
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /* ── the bot: one row per person, per channel ── */
  conversations: defineTable({
    channel: v.string(),           // "whatsapp" | "email"
    handle: v.string(),            // phone number or email address
    stage: v.number(),             // 0-5 = on that brief · 6 = finished
    score: v.number(),             // running total out of 24
    symbols: v.array(v.string()),  // what voters saw — feeds the collision rule
    lastSeen: v.number(),
  }).index("by_handle", ["channel", "handle"]),

  /* ── the public wall: every symbol anyone draws ── */
  symbols: defineTable({
    briefIndex: v.number(),
    dataUrl: v.string(),           // DOWNSCALE TO 240px FIRST — Convex caps docs at 1MB
    score: v.number(),
    readings: v.array(v.string()),
    sessionId: v.string(),
  })
    .index("by_brief", ["briefIndex"])
    .index("by_session", ["sessionId"]),

  /* ── completed ballot papers, for delivery and the leaderboard ── */
  ballots: defineTable({
    sessionId: v.string(),
    totalScore: v.number(),
    votesReached: v.number(),
    sentToEmail: v.optional(v.string()),
    sentToWhatsapp: v.optional(v.string()),
  }).index("by_score", ["totalScore"]),
});

// convex/wall.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addSymbol = mutation({
  args: {
    briefIndex: v.number(),
    dataUrl: v.string(),
    score: v.number(),
    readings: v.array(v.string()),
    sessionId: v.string(),
  },
  handler: (ctx, args) => ctx.db.insert("symbols", args),
});

/**
 * The wall. Everyone's attempt at the same brief, side by side.
 * This is the projector view — subscribe with useQuery and it fills live
 * as people play. No polling, no sockets.
 */
export const forBrief = query({
  args: { briefIndex: v.number() },
  handler: async (ctx, { briefIndex }) => {
    const rows = await ctx.db
      .query("symbols")
      .withIndex("by_brief", (q) => q.eq("briefIndex", briefIndex))
      .order("desc")
      .take(60);

    const total = rows.length || 1;
    return {
      symbols: rows.map((r) => ({ id: r._id, dataUrl: r.dataUrl, score: r.score })),
      count: rows.length,
      // The stat worth putting on screen: how often this brief gets read correctly.
      averageScore: rows.reduce((a, r) => a + r.score, 0) / total,
      perfect: rows.filter((r) => r.score === 4).length,
    };
  },
});

export const saveBallot = mutation({
  args: { sessionId: v.string(), totalScore: v.number(), votesReached: v.number() },
  handler: (ctx, args) => ctx.db.insert("ballots", args),
});

export const markSent = mutation({
  args: {
    sessionId: v.string(),
    email: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, email, whatsapp }) => {
    const b = await ctx.db
      .query("ballots")
      .filter((q) => q.eq(q.field("sessionId"), sessionId))
      .first();
    if (!b) return null;
    return ctx.db.patch(b._id, {
      ...(email ? { sentToEmail: email } : {}),
      ...(whatsapp ? { sentToWhatsapp: whatsapp } : {}),
    });
  },
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("ballots").withIndex("by_score").order("desc").take(10);
    return rows.map((r, i) => ({ rank: i + 1, score: r.totalScore, votes: r.votesReached }));
  },
});

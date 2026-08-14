// convex/chat.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* Add to convex/schema.ts:

  conversations: defineTable({
    channel: v.string(),          // "whatsapp" | "email"
    handle: v.string(),           // phone number or email address
    stage: v.number(),            // -1 = not started, 0-5 = on that brief, 6 = done
    score: v.number(),
    symbols: v.array(v.string()), // what the voters saw, feeds the collision rule
    lastSeen: v.number(),
  }).index("by_handle", ["channel", "handle"]),

*/

export const get = query({
  args: { channel: v.string(), handle: v.string() },
  handler: (ctx, { channel, handle }) =>
    ctx.db
      .query("conversations")
      .withIndex("by_handle", (q) => q.eq("channel", channel).eq("handle", handle))
      .first(),
});

export const start = mutation({
  args: { channel: v.string(), handle: v.string() },
  handler: async (ctx, { channel, handle }) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_handle", (q) => q.eq("channel", channel).eq("handle", handle))
      .first();

    const fresh = { stage: 0, score: 0, symbols: [], lastSeen: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, fresh);
      return existing._id;
    }
    return ctx.db.insert("conversations", { channel, handle, ...fresh });
  },
});

export const advance = mutation({
  args: {
    channel: v.string(),
    handle: v.string(),
    scoreDelta: v.number(),
    sawLabel: v.string(),
  },
  handler: async (ctx, { channel, handle, scoreDelta, sawLabel }) => {
    const c = await ctx.db
      .query("conversations")
      .withIndex("by_handle", (q) => q.eq("channel", channel).eq("handle", handle))
      .first();
    if (!c) return null;

    await ctx.db.patch(c._id, {
      stage: c.stage + 1,
      score: c.score + scoreDelta,
      symbols: [...c.symbols, sawLabel],
      lastSeen: Date.now(),
    });
    return { stage: c.stage + 1, score: c.score + scoreDelta };
  },
});

/** For the projector: how many people are playing over chat right now. */
export const activity = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("conversations").take(500);
    const hourAgo = Date.now() - 3_600_000;
    return {
      total: all.length,
      active: all.filter((c) => c.lastSeen > hourAgo).length,
      finished: all.filter((c) => c.stage >= 6).length,
    };
  },
});

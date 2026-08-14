// lib/state.ts
// Server-side bridge to Convex. This is what the `declare function` stubs in the
// bot routes were standing in for — it is now real, so there is nothing left to wire.
//
// Uses ConvexHttpClient because API routes are server-side and one-shot. The
// reactive `useQuery` hook is for the browser (the /wall and /live pages).

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export type ConvoState = {
  channel: string;
  handle: string;
  stage: number;      // -1 not started · 0-5 on that brief · 6 finished
  score: number;
  symbols: string[];
  lastSeen: number;
};

export async function getState(
  channel: string,
  handle: string
): Promise<ConvoState | null> {
  try {
    return (await client.query(api.chat.get, { channel, handle })) as ConvoState | null;
  } catch (e) {
    console.error("getState", e);
    return null;
  }
}

export async function startConversation(channel: string, handle: string) {
  return client.mutation(api.chat.start, { channel, handle });
}

export async function advanceConversation(
  channel: string,
  handle: string,
  scoreDelta: number,
  sawLabel: string
): Promise<{ stage: number; score: number } | null> {
  try {
    return (await client.mutation(api.chat.advance, {
      channel,
      handle,
      scoreDelta,
      sawLabel,
    })) as { stage: number; score: number } | null;
  } catch (e) {
    console.error("advanceConversation", e);
    return null;
  }
}

/* ── Optional: the public wall, if you built that too ── */

export async function recordSymbol(args: {
  briefIndex: number;
  dataUrl: string;
  score: number;
  readings: string[];
  sessionId: string;
}) {
  try {
    return await client.mutation(api.wall.addSymbol, args);
  } catch (e) {
    console.error("recordSymbol", e);
    return null;
  }
}

// app/api/wa/route.ts — Twilio inbound webhook. THIS IS THE BOT.
//
// Twilio POSTs form-encoded data here every time someone messages your number.
// Point your sandbox "When a message comes in" at:
//   https://<your-vercel-app>.vercel.app/api/wa
//
// THREE THINGS THAT WILL COST YOU TIME IF YOU DON'T KNOW THEM:
//
// 1. MediaUrl0 requires HTTP Basic auth with your Twilio SID/token to fetch.
//    A plain fetch returns 401 and you'll think the image is broken.
// 2. Twilio's webhook times out at 15 seconds. A gpt-4o vision call on a photo
//    is 3-8s, so inline is usually fine — but reply 200 fast and send outbound
//    over REST rather than returning multi-message TwiML.
// 3. The sandbox only reaches numbers that already sent "join <code>".

import { readSymbol, formatVerdict, closingMessage } from "@/lib/agent";
import { briefMessage, WELCOME, BRIEFS } from "@/lib/briefs";
import { getState, startConversation, advanceConversation } from "@/lib/state";

const SID = process.env.TWILIO_ACCOUNT_SID!;
const TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const FROM = process.env.TWILIO_WHATSAPP_FROM!;
const auth = () => "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64");

async function send(to: string, body: string) {
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: FROM, To: to, Body: body }),
  });
}

/** Twilio media needs auth. Pull it and hand OpenAI a data URL. */
async function fetchMediaAsDataUrl(url: string): Promise<string> {
  const r = await fetch(url, { headers: { Authorization: auth() } });
  if (!r.ok) throw new Error(`media fetch failed: ${r.status}`);
  const type = r.headers.get("content-type") ?? "image/jpeg";
  const b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
  return `data:${type};base64,${b64}`;
}

const ok = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { "Content-Type": "text/xml" },
  });

export async function POST(req: Request) {
  const form = await req.formData();
  const from = String(form.get("From") ?? "");        // "whatsapp:+9198..."
  const body = String(form.get("Body") ?? "").trim();
  const numMedia = Number(form.get("NumMedia") ?? 0);
  const mediaUrl = String(form.get("MediaUrl0") ?? "");
  const handle = from.replace("whatsapp:", "");

  if (!from) return ok();

  try {
    const state = await getState("whatsapp", handle);      // your Convex client
    const word = body.toUpperCase();

    // ── commands ──
    if (!state || word === "START" || word === "AGAIN" || word === "RESTART") {
      if (!state) {
        await send(from, WELCOME);
        await startConversation("whatsapp", handle);
        return ok();
      }
      await startConversation("whatsapp", handle);
      await send(from, briefMessage(0));
      return ok();
    }

    if (word === "HELP") {
      await send(from, "Draw the symbol on paper, photograph it, send the photo.\n\n*AGAIN* to restart · *SKIP* for the next brief");
      return ok();
    }

    if (state.stage >= BRIEFS.length) {
      await send(from, "You have finished. Reply *AGAIN* to run it once more.");
      return ok();
    }

    // ── no photo ──
    if (numMedia === 0 || !mediaUrl) {
      await send(from, "I need a photograph of the drawing. Take it straight on, in good light, and get close.");
      return ok();
    }

    // ── the real path ──
    await send(from, "_Showing it to four voters…_");

    const dataUrl = await fetchMediaAsDataUrl(mediaUrl);
    const verdict = await readSymbol(dataUrl, state.stage, state.symbols);

    await send(from, formatVerdict(verdict));

    const next = await advanceConversation("whatsapp", handle, verdict.score, verdict.readings[0]?.saw ?? "unknown");

    if (next && next.stage < BRIEFS.length) {
      await send(from, briefMessage(next.stage));
    } else if (next) {
      await send(from, closingMessage(next.score, [...state.symbols, verdict.readings[0]?.saw ?? "?"]));
    }
  } catch (e) {
    console.error("wa handler", e);
    await send(from, "Something went wrong at this end. Send the photograph again.");
  }

  return ok();
}

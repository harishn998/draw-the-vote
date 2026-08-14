// app/api/inbound-email/route.ts
//
// Same bot, over email. The game logic is identical — only the transport changes.
//
// INBOUND EMAIL IS THE HARD PART, AND IT IS NOT RESEND'S CORE PRODUCT.
// Resend is outbound-first. Check whether inbound is available on your plan
// before you commit an hour to it — if it isn't, use one of these instead:
//
//   Cloudflare Email Workers  — free, fastest to set up if your domain is on CF
//   SendGrid Inbound Parse    — free, POSTs multipart form-data to your route
//   Postmark inbound          — free, POSTs clean JSON with base64 attachments
//
// All of them POST to a URL. This route normalises whatever shape arrives,
// so swapping providers is a ten-line change in `parseInbound`.

import { readSymbol, formatVerdict, closingMessage } from "@/lib/agent";
import { briefMessage, WELCOME, BRIEFS } from "@/lib/briefs";
import { Resend } from "resend";
import { getState, startConversation, advanceConversation } from "@/lib/state";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Election Commission <onboarding@resend.dev>";

type Inbound = { from: string; subject: string; text: string; imageDataUrl?: string };

/** Adapt this one function to whichever provider you end up using. */
async function parseInbound(req: Request): Promise<Inbound> {
  const ct = req.headers.get("content-type") ?? "";

  // Postmark / Resend style: JSON with base64 attachments
  if (ct.includes("application/json")) {
    const j: any = await req.json();
    const att = (j.Attachments ?? j.attachments ?? [])[0];
    return {
      from: j.From ?? j.from ?? "",
      subject: j.Subject ?? j.subject ?? "",
      text: j.TextBody ?? j.text ?? "",
      imageDataUrl: att
        ? `data:${att.ContentType ?? att.content_type};base64,${att.Content ?? att.content}`
        : undefined,
    };
  }

  // SendGrid Inbound Parse style: multipart form-data
  const f = await req.formData();
  const file = f.get("attachment1") as File | null;
  let imageDataUrl: string | undefined;
  if (file) {
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    imageDataUrl = `data:${file.type || "image/jpeg"};base64,${b64}`;
  }
  return {
    from: String(f.get("from") ?? ""),
    subject: String(f.get("subject") ?? ""),
    text: String(f.get("text") ?? ""),
    imageDataUrl,
  };
}

const addr = (raw: string) => (raw.match(/<([^>]+)>/)?.[1] ?? raw).trim().toLowerCase();

const wrap = (body: string) => `
<div style="background:#101A3D;padding:36px 24px;font-family:Poppins,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto">
    <div style="display:flex;height:5px;width:40px;margin-bottom:20px">
      <div style="flex:1;background:#F2822F"></div><div style="flex:1;background:#FFFDF7"></div><div style="flex:1;background:#3FB184"></div>
    </div>
    <div style="color:#EFE9DA;font-size:15px;line-height:1.75;font-weight:300;white-space:pre-wrap">${body}</div>
    <p style="margin:26px 0 0;color:#EFE9DA;opacity:.35;font-size:11px;letter-spacing:2px;text-transform:uppercase">
      Election Commission of India · 1951
    </p>
  </div>
</div>`;

async function reply(to: string, subject: string, body: string) {
  await resend.emails.send({ from: FROM, to, subject, html: wrap(body) });
}

export async function POST(req: Request) {
  try {
    const mail = await parseInbound(req);
    const handle = addr(mail.from);
    if (!handle) return Response.json({ ok: true });

    const state = await getState("email", handle);
    const subject = "Re: " + (mail.subject || "Ballot symbols");

    if (!state) {
      await startConversation("email", handle);
      await reply(handle, "Ballot symbols — Brief 01", WELCOME + "\n\n" + briefMessage(0));
      return Response.json({ ok: true });
    }

    if (/\b(again|restart)\b/i.test(mail.text)) {
      await startConversation("email", handle);
      await reply(handle, subject, briefMessage(0));
      return Response.json({ ok: true });
    }

    if (state.stage >= BRIEFS.length) {
      await reply(handle, subject, "You have finished. Reply AGAIN to run it once more.");
      return Response.json({ ok: true });
    }

    if (!mail.imageDataUrl) {
      await reply(handle, subject, "I need a photograph of the drawing attached. Straight on, good light, close in.");
      return Response.json({ ok: true });
    }

    const verdict = await readSymbol(mail.imageDataUrl, state.stage, state.symbols);
    const next = await advanceConversation("email", handle, verdict.score, verdict.readings[0]?.saw ?? "unknown");

    const tail =
      next && next.stage < BRIEFS.length
        ? "\n\n———\n\n" + briefMessage(next.stage)
        : next
        ? "\n\n———\n\n" + closingMessage(next.score, [...state.symbols, verdict.readings[0]?.saw ?? "?"])
        : "";

    await reply(handle, subject, formatVerdict(verdict) + tail);
  } catch (e) {
    console.error("inbound-email", e);
  }
  return Response.json({ ok: true });
}

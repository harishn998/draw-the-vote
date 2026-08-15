// app/api/telegram/route.ts — THE BOT. Free, no upgrade, anyone can message it.
import { readSymbol, formatVerdict, closingMessage } from "@/lib/agent";
import { briefMessage, WELCOME, BRIEFS } from "@/lib/briefs";
import { getState, startConversation, advanceConversation } from "@/lib/state";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SECRET = process.env.TELEGRAM_SECRET!;
const API = `https://api.telegram.org/bot${TOKEN}`;

async function send(chatId: number, text: string) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function typing(chatId: number) {
  await fetch(`${API}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

// file_id -> getFile -> download -> data URL. Two steps, not one.
async function photoToDataUrl(fileId: string): Promise<string> {
  const meta = await (await fetch(`${API}/getFile?file_id=${fileId}`)).json();
  if (!meta.ok) throw new Error("getFile failed");
  const bin = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${meta.result.file_path}`);
  const b64 = Buffer.from(await bin.arrayBuffer()).toString("base64");
  return `data:image/jpeg;base64,${b64}`;
}

export async function POST(req: Request) {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const update = await req.json();
  const msg = update.message ?? update.edited_message;
  if (!msg?.chat?.id) return Response.json({ ok: true });

  const chatId: number = msg.chat.id;
  const handle = String(chatId);
  const word = (msg.text ?? msg.caption ?? "").trim().toUpperCase().replace("/", "");

  try {
    const state = await getState("telegram", handle);

    if (!state) {
      await startConversation("telegram", handle);
      await send(chatId, WELCOME);
      await send(chatId, briefMessage(0));
      return Response.json({ ok: true });
    }
    if (["START", "AGAIN", "RESTART"].includes(word)) {
      await startConversation("telegram", handle);
      await send(chatId, briefMessage(0));
      return Response.json({ ok: true });
    }
    if (word === "HELP") {
      await send(chatId, "Draw the symbol on paper, photograph it, send the photo.\n\n/again — start over");
      return Response.json({ ok: true });
    }
    if (state.stage >= BRIEFS.length) {
      await send(chatId, "You have finished. Send /again to run it once more.");
      return Response.json({ ok: true });
    }
    if (!msg.photo?.length) {
      await send(chatId, "I need a *photograph* of the drawing. Straight on, good light, fill the frame.");
      return Response.json({ ok: true });
    }

    await typing(chatId);
    await send(chatId, "_Showing it to four voters…_");

    // photo[] is ascending by size. Second-largest keeps the call fast.
    const sizes = msg.photo;
    const chosen = sizes[Math.max(0, sizes.length - 2)];

    const dataUrl = await photoToDataUrl(chosen.file_id);
    const verdict = await readSymbol(dataUrl, state.stage, state.symbols);
    await send(chatId, formatVerdict(verdict));

    const next = await advanceConversation(
      "telegram", handle, verdict.score, verdict.readings[0]?.saw ?? "unknown"
    );

    if (next && next.stage < BRIEFS.length) {
      await send(chatId, briefMessage(next.stage));
    } else if (next) {
      await send(chatId, closingMessage(next.score, [...state.symbols, verdict.readings[0]?.saw ?? "?"]));
    }
  } catch (e) {
    console.error("telegram", e);
    await send(chatId, "Something went wrong at this end. Send the photograph again.");
  }

  return Response.json({ ok: true });
}

// Browser check that the route deployed.
export async function GET() {
  return Response.json({
    ok: true,
    hasToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasSecret: Boolean(process.env.TELEGRAM_SECRET),
  });
}

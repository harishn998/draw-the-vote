# The bot — build guide

**Draw on paper. Photograph it. Send it in. Four voters from 1951 write back.**

Same game, but the interaction is a pen on actual paper and a conversation on your phone — which is much closer to what the real Election Commission was doing than a mouse on a canvas.

---

## Read this before you start

**This is a 2–2.5 hour build**, and roughly 40 minutes of it is Twilio setup you cannot compress.

**Keep the web game as your guaranteed demo.** If it's 2:15 and the webhook isn't returning, you demo the web version and *describe* the bot. Do not put yourself in a position where the only thing you can show depends on an external webhook.

**Hard time gates:**
- **12:30** — Twilio sandbox joined, webhook returning 200. If not, stop and go back to the web app.
- **1:30** — one photo round-trips end to end. If not, stop.
- **2:30** — tools down, rehearse.

**OpenAI credits cover the vision call only.** Twilio is a separate account with its own (free trial) credit. Say this correctly if asked.

---

## The architecture

```
WhatsApp photo ─┐
                ├─→ /api/wa or /api/inbound-email
Email photo ────┘         │
                          ├─→ Convex: what brief is this person on?
                          ├─→ lib/agent.ts: ONE gpt-4o vision call
                          │     reads the drawing AND writes the reply
                          └─→ send verdict + next brief
```

**One call, not two.** The vision call both reads the photo and composes the clerk's reply. Two calls would double latency, and Twilio's webhook times out at 15 seconds.

Channels are interchangeable — `lib/agent.ts` and `convex/chat.ts` know nothing about WhatsApp or email. Adding Telegram later would be one more route file.

---

## Setup, in this exact order

**1 · Deploy first (5 min).** Twilio needs a public URL. Don't fight ngrok.
```bash
npx vercel --prod
```

**2 · Twilio sandbox (15 min).**
- Console → Messaging → Try it out → Send a WhatsApp message
- Note your join code, then from your own phone WhatsApp `join <your-code>` to **+1 415 523 8886**
- In "Sandbox settings", set **When a message comes in** → `https://<your-app>.vercel.app/api/wa`, method POST

**3 · Env.**
```
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
NEXT_PUBLIC_CONVEX_URL=https://...
CONVEX_DEPLOY_KEY=...
```

**4 · Convex.** `npx convex dev`, add the `conversations` table from the comment at the top of `convex/chat.ts`.

---

## Claude Code — the prompts, in order

**Prompt 1 — wire the state**

> `lib/briefs.ts`, `lib/agent.ts`, `convex/chat.ts`, `app/api/wa/route.ts` and `app/api/inbound-email/route.ts` are written. Do not rewrite their logic.
>
> The two route files end with `declare function` stubs for `getState`, `startConversation` and `advanceConversation`. Replace those with a real `lib/state.ts` that calls Convex from the server using `ConvexHttpClient` and `NEXT_PUBLIC_CONVEX_URL`. Add the `conversations` table to `convex/schema.ts` exactly as described in the comment at the top of `convex/chat.ts`.

**Prompt 2 — prove the webhook**

> Add a GET handler to `/api/wa` that returns `{ ok: true }` so I can check the deployment in a browser. Add console.log of every inbound field at the top of the POST handler.

**Prompt 3 — the first round trip**

> Test the flow end to end. When a photo arrives, the media URL must be fetched with Twilio Basic auth before being passed to OpenAI — that's already in `fetchMediaAsDataUrl`, verify it works. Log the vision response.

**Prompt 4 — resilience**

> Add a 12-second timeout around the vision call. If it times out, send "The voters are still looking. Send it again in a moment." and do not advance the stage. Also guard against the same photo being processed twice if Twilio retries.

**Prompt 5 — the projector view**

> Add a `/live` route that subscribes to `chat.activity` and shows, in the existing design language, how many people are playing over WhatsApp right now and how many have finished. Big numbers, Poppins, tricolour.

---

## Testing without burning time

- **Test the webhook before the AI.** Reply with a fixed string first. If that doesn't arrive, nothing else matters.
- **Photograph one symbol once** and reuse that photo for every test. Don't redraw each time.
- **Watch `npx vercel logs --follow`** in a terminal. Twilio swallows errors silently; your logs are the only truth.
- **Twilio Console → Monitor → Logs → Errors** tells you if Twilio couldn't reach you at all.

**The two errors you will actually hit:**
- `401` fetching MediaUrl0 → you forgot the Basic auth header
- Twilio error `63015`/`63016` → that number never joined the sandbox

---

## The demo — three minutes

**0:00–0:30 — the story.** In 1951 India gave every adult the vote at once. Britain took a century. America had literacy tests until 1965. India did it in year four, with ~85% of voters unable to read a ballot. The answer wasn't to fix the voter. It was to fix the ballot — every party got a picture.

**0:30–2:30 — do it live.** Mirror your phone on the projector.
1. Show the WhatsApp thread. The Commission sends Brief 01.
2. **Draw the symbol on paper, on stage, with a marker.** Big and slow so the room sees it.
3. Photograph it with your phone and send.
4. The reply comes back — four voters, in character, from 1951.

Someone will be misread and the room will laugh. That's the moment.

**2:30–3:00 — close.** "Those pictures are still on the ballot today. That's not a curiosity. It's the design decision that let a country with 85% non-literacy run a real democracy from day one."

**Fallback, decided in advance:** if the reply doesn't come within ten seconds on stage, switch to the web app tab and keep talking. Have it open in tab 2. Do not stand there refreshing.

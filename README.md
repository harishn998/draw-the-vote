# Draw the Vote

**176 million voters. Roughly 85% of them cannot read the ballot. Draw it so they cannot get it wrong.**

India, 1951. You are the Election Commission. Six parties need symbols, and you have to draw them. A vision model reads your actual drawing as four different villagers — and each new symbol must be impossible to confuse with every symbol already on the paper.

Two ways to play. **The web game** (draw with a mouse) and **the bot** (draw on paper, photograph it, WhatsApp it in).

---

## Accounts

| | Status | Needed for |
|---|---|---|
| Vercel | ✅ have | Hosting. Deploy early — Twilio needs a public URL. |
| Convex | ✅ have | Bot conversation state + the public wall |
| Resend | ✅ have | Emailing the ballot paper |
| OpenAI | ✅ event credits | The vision call. The only AI in the build. |
| **Twilio** | ⬜ **needed** | **WhatsApp. See `SETUP-TWILIO.md` — do this first.** |

---

## Start here — 15 minutes

```bash
# 1 · scaffold
npx create-next-app@latest draw-the-vote --ts --app --eslint --no-tailwind --no-src-dir --import-alias "@/*"
cd draw-the-vote

# 2 · overlay this folder
cp -r /path/to/this/src/* ./
cp /path/to/this/.env.example .env.local

# 3 · deps
npm i openai convex resend

# 4 · convex (writes its own env vars into .env.local)
npx convex dev        # leave running in its own terminal

# 5 · fill in the rest of .env.local, then
npm run dev

# 6 · deploy NOW, not later — Twilio needs a public URL
npx vercel --prod
```

Then work through **`SETUP-TWILIO.md`**.

---

## What's in here

```
preview/draw-the-vote-preview.html   ← the finished design + a fully playable game.
                                        This is the spec. Open it first.
src/
  app/globals.css        the complete design system, three themes
  app/api/read/          vision call for the web game
  app/api/wa/            the WhatsApp bot (Twilio inbound webhook)
  app/api/email/         Resend — email the ballot paper
  app/api/inbound-email/ the bot over email
  lib/briefs.ts          the six party briefs — single source of truth
  lib/agent.ts           ONE vision call: reads the photo AND writes the reply
  lib/state.ts           Convex bridge. Already wired, nothing to plumb.
  components/Preloader.tsx  the tricolour chakra loader
  convex/schema.ts       complete — conversations, wall, ballots
  convex/chat.ts         bot state machine
  convex/wall.ts         the public wall + leaderboard
docs/
  KICKOFF.md        web game: build order, Claude Code prompts, demo script
  BOT.md            bot: architecture, prompts, testing, time gates
  INTEGRATIONS.md   Convex wall, Resend, WhatsApp — setup and priority
```

---

## Build order — and the gates matter more than the list

Do these strictly in order. Each one is demoable on its own.

| | | Gate |
|---|---|---|
| 1 | Port `preview/` into React on the local mock | **12:30** — playable or stop |
| 2 | Real `/api/read` vision call | **1:15** |
| 3 | Ballot paper PNG export | 1:40 |
| 4 | Convex wall at `/wall` | 2:10 |
| 5 | The WhatsApp bot | **2:30 — tools down regardless** |

**If a gate slips, drop everything below it.** A finished web game beats a half-wired webhook, every time. Decide that now, while it's cheap.

---

## Open Claude Code with this

> `preview/draw-the-vote-preview.html` is the finished design, the finished animation and the finished game loop. **Match it exactly.** Port it to React components using `app/globals.css`, which already contains every token. Do not redesign it and do not replace the CSS variables with Tailwind defaults — the tricolour is load-bearing: saffron means a misread symbol, green means a correct one.
>
> The files in `lib/`, `convex/` and `app/api/` are written. Wire the UI to them; don't rewrite them.
>
> Start by getting the game fully playable with the local `read()` mock from the preview. Do not touch the API until that works end to end.

Then one feature per prompt, committing after each. The full prompt sequences are in `docs/KICKOFF.md` (web) and `docs/BOT.md` (bot).

---

## Your safety net

`NEXT_PUBLIC_USE_MOCK=true` skips the OpenAI call and uses the local scorer, which is tuned to the same legibility rules as the live gauge — so it behaves identically. If the API is slow at 3:30 in front of the room, flip it and nobody knows.

**Test that switch at 2:00, not at 3:29.**

---

## Before you submit

- Round the figures: "about 176 million", "roughly 85%". Sources vary and you don't want to defend a precise number on stage.
- Keep the footer line: parties invented, election real. Don't swap in real historical party names.
- Test on a phone. The canvas already takes touch input.
- Check the tricolour entrance animation on the **deployed** URL, not just localhost. It's the first thing anyone sees.

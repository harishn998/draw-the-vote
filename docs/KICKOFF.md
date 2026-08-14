# Draw the Vote — build & demo guide

**176 million voters. Roughly 85% of them cannot read the ballot. Draw it so they cannot get it wrong.**

You are the Election Commission in 1951. Six parties need symbols. You draw each one, and a vision model reads your actual drawing as four different villagers. Get it wrong and their votes land in the wrong box.

---

## 1 · The story you're telling

Say this in the first thirty seconds, because it's the whole reason the game exists:

> In 1951 India gave every adult the vote at once. No literacy test, no property qualification, no phase-in. Britain took about a century to get there. America still had literacy tests until 1965. India did it in year four — with an electorate where roughly 85% couldn't read a ballot paper.
>
> Every other democracy treated literacy as a reason to *withhold* the vote. India's answer was the opposite: don't fix the voter, fix the ballot. Give every party a picture.
>
> That one design decision is why universal franchise worked here from the very first election. And the pictures are still on the ballot today.

**The line for a room of builders:** India didn't wait for its people to become literate before trusting them with democracy. It redesigned democracy to work for the people it actually had. That's a design problem, solved by design.

---

## 2 · Setup — 15 minutes

```bash
npx create-next-app@latest draw-the-vote --ts --app --tailwind --eslint
cd draw-the-vote
npm i openai
git init && gh repo create draw-the-vote --private --source=.
```

`.env.local`:
```
OPENAI_API_KEY=sk-...
```

Copy `draw-the-vote-preview.html` and the `starter/` folder into the repo root. Deploy early: `npx vercel` — get a live URL at noon, not at 2:55.

**Stack actually used:** Next.js 15 (App Router) · OpenAI `gpt-4o` vision · plain HTML Canvas · Vercel.
**Not needed:** Convex, Resend, any drawing library, any animation library. All the motion is CSS keyframes.

---

## 3 · Claude Code — the opening prompt

Paste this whole block as your first message:

> Build a Next.js 15 App Router app called **Draw the Vote**.
>
> `draw-the-vote-preview.html` in the repo root is the finished design, the finished animation, and the finished game loop. **Match it exactly.** Same CSS custom properties, same Poppins type scale, same tricolour system, same canvas drawing implementation, same entrance animation. Port it to React components — do not redesign it, and do not replace the token values with Tailwind defaults.
>
> Structure:
> - `lib/ballot.ts` — the `PARTIES` and `VILLAGERS` arrays, typed
> - `components/Pad.tsx` — the canvas, stroke smoothing, undo/clear, squint preview, legibility gauge
> - `components/Readings.tsx` — the four staggered voter cards
> - `components/Ballot.tsx` — the final ballot paper and PNG export
> - `app/page.tsx` — round state machine
> - `app/api/read/route.ts` — already written, don't rewrite it
>
> The canvas uses pointer events and stores strokes as arrays of points so undo works and the drawing can be re-rendered at any size. Keep that — it already handles mouse, touch and stylus.
>
> Start by getting the game fully playable with the local `read()` mock. Do not touch the API until that works end to end.

Then, in order, one prompt at a time:

1. *"Replace the `read()` mock with a POST to `/api/read`, sending `canvas.toDataURL('image/png')`. Keep the mock behind a `USE_MOCK` env flag so I can switch back instantly."*
2. *"The four voter cards should stay in the 'Looking…' state while the request is in flight, then resolve one at a time about 700ms apart."*
3. *"Downscale the canvas to 512px wide before sending it to the API, to cut the payload."*

**Working with Claude Code — three habits that matter under time pressure:**
- **One feature per prompt.** "Add the API call" gets a clean result. "Add the API call and the export and fix mobile" gets a mess you'll spend twenty minutes untangling.
- **Commit after every working step.** `git add -A && git commit -m "voter cards working"`. When something breaks at 2:40 you want a known-good point to jump back to.
- **When a change breaks something, say what you see, not what to do.** "The squint preview is blank after the first round" beats "add a useEffect" — it'll find the real cause.

---

## 4 · Order of work

| Time | Ship | |
|---|---|---|
| 11:00–11:15 | Setup, repo, deploy skeleton | |
| 11:15–12:30 | Port the design + full loop on the mock | **Playable game here** |
| 12:30–1:15 | Real vision call | The point of the build |
| 1:15–1:40 | Staggered reveal + payload downscale | |
| 1:40–2:10 | Ballot paper PNG export | The share artifact |
| 2:10–2:40 | Mobile pass, then rehearse the demo twice | |
| 2:40–3:00 | Submit | |

**Step 1 alone is demoable.** Everything after it is upside, not dependency. That's the shape you want going into a solo four-hour build.

**Adding features later, if you're ahead:**
- *Public wall* — every player's drawing for the same brief, side by side. Needs Convex (`npm i convex`, one table, one reactive query). Best possible addition if you have an hour.
- *Share card* — `/api/og` renders the ballot paper as an OG image so the link previews with your symbols.
- *Timer* — 45 seconds per brief. Adds pressure and makes the drawings funnier.

---

## 5 · How to demo it — three minutes

**Before you go up:** open the tab fresh so the tricolour entrance plays. Have the browser at 100% zoom, window maximised. Play one full round in private first so you know the API is warm.

**0:00–0:30 — the problem.** Deliver the story from section 1. Don't rush it; the surprise is that India did this first and did it in one step.

**0:30–1:00 — the constraint.** "So every party gets a picture instead of a name. Simple — until you have to draw sixty of them, for an electorate speaking a dozen languages, and no two can be confusable."

**1:00–2:30 — play it live.**
1. Put Brief 01 on screen. Read it out.
2. **Ask the room what to draw.** Take the loudest shout. This is your audience participation and it costs nothing.
3. Draw it badly. Let them watch. **Point at the squint panel** — "that's how big it actually prints."
4. Submit. Let the four voters resolve one at a time. Someone will misread it and the room will laugh.
5. Do a second brief fast, ideally something that collides with the first.

**2:30–3:00 — the payoff.** Jump to the ballot paper. Six wobbly hand-drawn symbols with a serial number and a seal. Then close:

> "Those pictures are still on the ballot today. That's not a historical curiosity — it's the design decision that let a country with 85% non-literacy run a real democracy from day one."

**Stop there.** Don't add anything after that line.

**If the API is slow on stage:** flip `USE_MOCK=true` and keep going. The mock uses the same legibility scoring as the gauge, so it behaves identically. Nobody will know. Have it tested before you go up.

---

## 6 · Before you submit

- **Round the figures.** Sources vary on the 1951 electorate — say "about 176 million" and "roughly 85%", not exact numbers you'd have to defend.
- **Keep the footer line:** parties invented, election real. Don't swap in real historical party names — it buys nothing and invites argument.
- **Test on a phone.** The canvas takes touch input already, but check the rail stacks properly below 880px.
- **Check the entrance animation** on the deployed URL, not just localhost. It's the first thing anyone sees.

# Adding Convex, Resend and WhatsApp

These are the **stretch layer**. Only start them once the game plays end to end with the vision call working. If it's past 1:45 and the core isn't solid, skip all of this — a working game beats a half-wired integration.

Recommended order, and each is independently useful:

| | Feature | Time | Worth it? |
|---|---|---|---|
| 1 | Convex — the public wall | 45 min | **Yes.** Best single addition. |
| 2 | Resend — email the ballot | 25 min | Yes. Works for anyone. |
| 3 | WhatsApp — Twilio sandbox | 35 min | Only if 1 and 2 are done. Demo-only. |

---

## 1 · Convex — the wall

The wall is fifty people's attempts at *the same brief*, side by side, filling live on a projector. It's the best thing you can add, and it's the reason to use Convex at all.

```bash
npm i convex
npx convex dev     # leave running in its own terminal
```

Drop in `convex/schema.ts` and `convex/wall.ts`. Then:

**Write** after each round — but downscale first. A full 880×600 PNG dataURL is 200–400KB and Convex caps documents at 1MB:

```ts
function thumb(source: HTMLCanvasElement, size = 240) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#FFFDF7";
  g.fillRect(0, 0, size, size);
  g.drawImage(source, 0, 0, size, size);
  return c.toDataURL("image/png");   // ~15KB
}
```

**Read** on a `/wall` route:

```tsx
const wall = useQuery(api.wall.forBrief, { briefIndex: 0 });
```

That's it — it updates live with no polling. Put `/wall` on the projector while you demo and it fills as people play.

**Claude Code prompt:**
> Add Convex. `convex/schema.ts` and `convex/wall.ts` are written — don't rewrite them. After each round, downscale the canvas to 240px and call `wall.addSymbol` with the brief index, thumbnail, score and readings. Add a `/wall` route that subscribes to `wall.forBrief` and renders a responsive grid of everyone's symbols with a green border at score 4 and saffron below 2. Use a `sessionId` from `crypto.randomUUID()` stored in React state.

---

## 2 · Resend — email

```bash
npm i resend
```

`.env.local` → `RESEND_API_KEY=re_...`

`app/api/email/route.ts` is written. It sends a tricolour HTML email with the ballot paper attached inline via `contentId`.

**One gotcha:** without a verified domain you can only send *from* `onboarding@resend.dev`, and only *to* the address you signed up with. For the event that's fine — you're demoing to your own inbox. Verifying a domain takes DNS propagation time you don't have.

**Claude Code prompt:**
> Wire the Email field on the final screen to POST to `/api/email` with `{ to, pngBase64, score, votes }`, where pngBase64 is the full ballot paper PNG. Show sending / sent / error states in the `.dmsg` element. Don't let it submit twice.

---

## 3 · WhatsApp — Twilio sandbox

**Set expectations first.** This is not covered by your OpenAI credits, and it will only reach numbers that have already joined the sandbox. It is a demo flourish, not an audience feature.

Setup:
1. Twilio account → Messaging → Try WhatsApp → note your sandbox code
2. From your own phone, WhatsApp `join <your-two-words>` to **+1 415 523 8886**
3. `.env.local`:
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

**The one thing that will trip you up:** WhatsApp fetches media from a public URL. You cannot send a dataURL. Upload the PNG to Convex file storage first and pass that URL as `MediaUrl`. If you're short on time, send text-only — it still lands and still demos.

The route already returns a clear message for Twilio error codes 63015/63016, which mean "this number never joined the sandbox." Without that you'll spend fifteen minutes debugging the wrong thing.

**Claude Code prompt:**
> Wire the WhatsApp field to POST to `/api/whatsapp` with `{ to, imageUrl, score }`. Upload the ballot PNG to Convex file storage first and pass the public URL. Surface the API's error message directly in `.dmsg` rather than a generic failure.

---

## A better use of the OpenAI credits, if you want one

Instead of WhatsApp as *output*, use it as *input*: someone draws a symbol **on paper**, photographs it, and WhatsApps it in. A Twilio inbound webhook picks up the image, passes it to the same `gpt-4o` vision call, and replies with the four villagers' verdicts.

That's the same model, the same prompt, no new AI work — but the interaction becomes *pen on actual paper*, which is what the 1951 Commission was really doing. If you have a spare hour after the wall, this is more interesting than sending emails.

---

## The preloader

`components/Preloader.tsx` is the tricolour chakra — the ring draws itself in a saffron-to-green gradient while the spokes pulse and three bands sweep behind it.

Use `useStagedTransition` with it. The 700ms floor matters: without it, a fast API response makes the preloader flash for 80ms and look broken rather than intentional. Real vision calls take 3–6 seconds, so the floor only affects the fast paths.

```tsx
const { busy, label, run } = useStagedTransition();
<Preloader active={busy} label={label} />
await run(() => fetch("/api/read", {...}), "Reading your symbol");
```

Good labels, since they're on screen for a full second: *Reading your symbol* · *Sending the next brief* · *Opening the polls* · *Printing the ballot*.

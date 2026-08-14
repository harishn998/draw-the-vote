# Twilio — the one account you still need

You already have Vercel, Convex and Resend. This is the last one, and it's the only part of the build with an unavoidable waiting period. **Do it first, before you write any code.**

Budget **20 minutes**. If it takes more than 40, abandon WhatsApp and ship the web game — that call is much easier to make at 12:00 than at 2:30.

---

## 1 · Account · 5 min

Sign up at **twilio.com/try-twilio**. Free trial, no card needed, and it comes with enough credit for a few hundred messages — far more than a demo uses.

You'll verify your own phone number during signup. Use the phone you'll be demoing with.

From **Console → Account Info**, copy:
- `Account SID` — starts with `AC`
- `Auth Token` — click to reveal

Into `.env.local`:
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## 2 · Join the WhatsApp sandbox · 5 min

You don't need a WhatsApp Business account, and you don't need Meta review. The sandbox works immediately.

**Console → Messaging → Try it out → Send a WhatsApp message.**

You'll see a join code like `join olive-tiger`. From WhatsApp on your phone, send exactly that phrase to:

```
+1 415 523 8886
```

You should get a confirmation reply within seconds. **You are now connected for 72 hours.**

> **The limitation, stated plainly:** the sandbox only reaches numbers that have sent that join code. Nobody in the audience will receive anything unless they join first. Demo from your own phone, mirrored on the projector. Don't promise the room they can play along.

---

## 3 · Point the webhook at your deployment · 5 min

Twilio needs a public URL, so **deploy before you configure this.** Fighting ngrok will cost you thirty minutes you don't have.

```bash
npx vercel --prod
```

Then on the same sandbox page, under **Sandbox settings**:

| Field | Value |
|---|---|
| When a message comes in | `https://<your-app>.vercel.app/api/wa` |
| Method | `HTTP POST` |

Save.

---

## 4 · Prove it works before you build anything else

Send any message to the sandbox number from your phone. You should get the welcome text back.

**If nothing arrives, check in this order:**

1. **Twilio Console → Monitor → Logs → Errors.** If Twilio couldn't reach your URL at all, it says so here. This is the fastest signal and most people skip it.
2. **`npx vercel logs --follow`** in a terminal. Twilio swallows your exceptions; your own logs are the only truth.
3. **Open `https://<your-app>.vercel.app/api/wa` in a browser.** It should return something rather than a 404. If it 404s, the route didn't deploy.

---

## The two errors you will actually hit

**`401` when fetching the photo.** Twilio's `MediaUrl0` requires HTTP Basic auth with your SID and token. A plain `fetch` returns 401 and you'll waste twenty minutes convinced the image is corrupt. This is already handled in `fetchMediaAsDataUrl` — don't "simplify" it away.

**Twilio error `63015` or `63016`.** That number never joined the sandbox. Not a code problem. The route already surfaces this as a readable message.

---

## Cost, if anyone asks

Trial credit covers this comfortably. Sandbox messages are a fraction of a cent each, and a full six-round game is about fourteen messages.

**And be precise about this if a judge asks:** your OpenAI credits pay for the vision call only. Twilio is a separate account on its own free trial. They are not the same budget.

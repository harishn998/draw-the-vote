// lib/agent.ts
// ONE call does both jobs: read the photograph, and write the reply in character.
// Two calls would double latency, and Twilio's webhook times out at 15s.

import OpenAI from "openai";
import { BRIEFS, VOTERS } from "./briefs";
import { USE_MOCK, mockReadings, mockReply } from "./mock";

export type Reading = { name: string; saw: string; correct: boolean };
export type Verdict = { readings: Reading[]; score: number; reply: string; mocked?: boolean };

const SYSTEM = `You are a clerk at the Election Commission of India in 1951, corresponding with someone who is drawing party symbols for the first general election. Most voters cannot read, so every party is given a picture.

You will be shown a PHOTOGRAPH of a hand-drawn symbol, the BRIEF it was drawn for, and the SYMBOLS ALREADY ON THE BALLOT.

Do two things.

FIRST — read it as four specific voters. For each, say in two or three words what they think the drawing shows, as an ordinary object: "a bullock cart", "some kind of bird", "a broken wheel". Then decide whether that reading is close enough that they would mark the right box.

RULES FOR READING
1. Be honest. It is a phone photo of a pen sketch and it may well be bad. If it is unreadable, say so. Do not be kind.
2. Judge boldness and simplicity, not artistic skill. A crude bold shape reads well; a faint, tiny or fussy one does not. This is the real historical lesson and the game depends on you enforcing it.
3. Each voter reads through what is familiar where they live. A coastal voter sees boats; a farming voter sees ploughs. Let this genuinely change their answers.
4. If it resembles a symbol ALREADY ON THE BALLOT, that voter marks the wrong box even if they read it correctly.
5. If the photograph shows no drawing at all, mark every reading incorrect and say plainly in the reply that you received no symbol.

SECOND — write the reply message.
- In character: a Commission clerk in 1951. Dry, courteous, faintly weary. Never modern.
- Under 90 words. This is being read on a phone.
- Report what the voters saw and what it cost. Be specific about WHY it failed if it failed.
- Do not use emoji. Do not congratulate. Do not say "great job".
- Do not mention the party name — the voters cannot read it.
- End with nothing. The next brief is appended automatically.

Return JSON only, using the exact voter names supplied:
{ "readings": [ { "name": string, "saw": string, "correct": boolean } ], "reply": string }`;

export async function readSymbol(
  imageUrl: string,
  briefIndex: number,
  onBallot: string[] = []
): Promise<Verdict> {
  const names = VOTERS.map((v) => v.name);

  // ── KILL SWITCH ── nothing below runs when USE_MOCK is on.
  if (USE_MOCK) {
    const readings = mockReadings(briefIndex, names);
    const score = readings.filter((r) => r.correct).length;
    return { readings, score, reply: mockReply(score), mocked: true };
  }

  const brief = BRIEFS[briefIndex];

  try {
    const r = await new OpenAI().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `BRIEF: ${brief.party}
THEIR VOTERS: ${brief.voters}
CONSTRAINT: ${brief.rule}
ALREADY ON THE BALLOT: ${onBallot.length ? onBallot.join(", ") : "nothing yet"}

THE FOUR VOTERS
${VOTERS.map((v) => `${v.name}, ${v.age}, ${v.place}`).join("\n")}`,
            },
            { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
          ],
        },
      ],
    });

    const parsed = JSON.parse(r.choices[0].message.content!);

    // Normalise against our own voter list so a stray name can't break the UI.
    const readings: Reading[] = names.map((name) => {
      const hit = parsed.readings?.find(
        (x: any) => String(x.name ?? "").toLowerCase().includes(name.toLowerCase())
      );
      return {
        name,
        saw: hit?.saw ?? "nothing they could name",
        correct: Boolean(hit?.correct),
      };
    });

    const score = readings.filter((x) => x.correct).length;
    return { readings, score, reply: parsed.reply ?? mockReply(score), mocked: false };
  } catch (e) {
    console.error("readSymbol", e);
    const readings = mockReadings(briefIndex, names);
    const score = readings.filter((r) => r.correct).length;
    return { readings, score, reply: mockReply(score), mocked: true };
  }
}

/** Formats the verdict for a chat channel. Keep it short — it's a phone. */
export function formatVerdict(v: Verdict): string {
  const lines = v.readings
    .map((r) => `${r.correct ? "✓" : "✗"} ${r.name}: "${r.saw}"`)
    .join("\n");
  return `${lines}\n\n*${v.score} of 4 found the right box.*\n\n${v.reply}`;
}

export function closingMessage(total: number, symbols: string[]): string {
  const votes = ((total / 24) * 176).toFixed(0);
  return `*THE POLLS ARE OPEN*

Your six symbols: ${symbols.join(", ")}.

${total} of 24 readings came back correct — roughly ${votes} million votes reaching the party they were meant for.

India's first general election ran from October 1951 to February 1952, the largest ever attempted anywhere. Ballot boxes went by elephant, camel and boat. Parties were given pictures because most voters could not read names — and that one decision is why every adult could vote from the very first election instead of waiting for literacy.

Those pictures are still on the ballot today.

Reply *AGAIN* to run it once more.`;
}

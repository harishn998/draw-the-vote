// app/api/read/route.ts
// The player's drawing goes to a vision model, which reads it as four
// different 1951 voters. The input is an image, not text.

import OpenAI from "openai";
import { BRIEFS, VOTERS } from "@/lib/briefs";
import { USE_MOCK, mockReadings, mockReply, type Reading } from "@/lib/mock";

const SYSTEM = `You are simulating how non-literate Indian voters in 1951 would read a hand-drawn election symbol.

You will be shown a rough drawing, told which party it is meant to represent, and given the symbols already on the ballot paper.

For each of the four voters, say plainly what they think the drawing shows — in two or three words, as an ordinary object ("a bullock cart", "some kind of bird", "a broken wheel"). Then decide whether that reading matches the intended symbol closely enough that they would mark the right box.

RULES
1. Be honest about the drawing. It is a mouse sketch and it is probably bad. If it is unreadable, say so. Do not be generous.
2. Judge by boldness and simplicity, not artistic quality. A crude but bold shape reads well. A detailed, faint, or tiny drawing does not — this is the real historical lesson and the game depends on it.
3. Each voter reads differently based on what is familiar where they live. A coastal voter is more likely to see a boat; a farming voter, a plough. Let this genuinely change their answers.
4. If the drawing resembles a symbol ALREADY ON THE PAPER, that voter marks the wrong box even if they read it correctly. Set collision: true.
5. Never mention the party name in what a voter says. They cannot read it.

Return JSON only:
{ "readings": [ { "voterIndex": number, "saw": string, "correct": boolean, "collision": boolean } ] }`;

export async function POST(req: Request) {
  const { imageBase64, roundIndex, onBallot = [] } = await req.json();

  const idx = Number(roundIndex) || 0;
  const names = VOTERS.map((v) => v.name);

  // ── KILL SWITCH ── nothing below this line runs when USE_MOCK is on.
  if (USE_MOCK) {
    const readings = mockReadings(idx, names);
    const score = readings.filter((r) => r.correct).length;
    return Response.json({ readings, score, reply: mockReply(score), mocked: true });
  }

  const brief = BRIEFS[idx];

  try {
    const r = await new OpenAI().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.9, // voters should disagree with each other
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `INTENDED SYMBOL FOR: ${brief.party}
THEIR VOTERS: ${brief.voters}
CONSTRAINT: ${brief.rule}
ALREADY ON THE BALLOT PAPER: ${onBallot.length ? onBallot.join(", ") : "nothing yet"}

THE FOUR VOTERS
${VOTERS.map((v, i) => `${i}. ${v.name}, ${v.age}, ${v.place}`).join("\n")}`,
            },
            { type: "image_url", image_url: { url: imageBase64, detail: "low" } },
          ],
        },
      ],
    });

    const parsed = JSON.parse(r.choices[0].message.content!);

    // Normalise voterIndex → name so this matches the mock shape exactly.
    const readings: Reading[] = names.map((name, i) => {
      const hit = parsed.readings?.find((x: any) => x.voterIndex === i);
      return {
        name,
        saw: hit?.saw ?? "nothing they could name",
        correct: Boolean(hit?.correct) && !hit?.collision,
      };
    });

    const score = readings.filter((x) => x.correct).length;
    return Response.json({ readings, score, reply: mockReply(score), mocked: false });
  } catch (e) {
    console.error("read route", e);
    // Fail into the mock rather than breaking the game mid-demo.
    const readings = mockReadings(idx, names);
    const score = readings.filter((r) => r.correct).length;
    return Response.json({ readings, score, reply: mockReply(score), mocked: true });
  }
}

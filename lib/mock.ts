// lib/mock.ts
// KILL SWITCH. When USE_MOCK is on, zero OpenAI calls leave this machine.
// Server-side var only (no NEXT_PUBLIC_) so it can't be flipped from the browser.

export const USE_MOCK = process.env.USE_MOCK === "true";

export type Reading = { name: string; saw: string; correct: boolean };

const WANT = [
  ["a bullock cart", "a plough", "a sheaf of grain"],
  ["a spinning wheel", "a loom", "a spindle"],
  ["a boat", "a fishing net", "an anchor"],
  ["a mountain", "a pine tree", "a river"],
  ["a train", "a railway signal", "a length of track"],
  ["an oil lamp", "a water pot", "an open hand"],
];

const WRONG = [
  "a chair", "a broken wheel", "some kind of bird", "a hut",
  "a ladder", "a spoon", "a leaf", "a box", "a pile of stones",
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/**
 * Returns the SAME shape as the real vision call, so flipping USE_MOCK
 * can never break the UI. That matters most at 3:30 on stage.
 */
export function mockReadings(briefIndex: number, voterNames: string[]): Reading[] {
  const want = WANT[briefIndex % WANT.length];
  return voterNames.map((name) => {
    const correct = Math.random() < 0.62;
    return { name, saw: correct ? pick(want) : pick(WRONG), correct };
  });
}

export function mockReply(score: number): string {
  if (score === 4) return "All four found the right box. The Commission has no notes.";
  if (score === 3) return "Three of four. One reader was uncertain, which at this scale is several hundred thousand ballots.";
  if (score === 2) return "Half of them marked the wrong party. Bolder lines, fewer of them.";
  if (score === 1) return "One reader only. At ballot size this will not survive the printing.";
  return "None of them could tell what it was. I must ask you to draw it again, larger.";
}

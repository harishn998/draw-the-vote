// components/parties.ts
// The six briefs as the studio screen shows them.
//
// Party name and rule come straight from lib/briefs.ts — that is the single
// source of truth shared with the WhatsApp bot and the vision prompt. Only the
// long voter prose lives here: lib/briefs.ts carries a trimmed version because
// it is pasted into a model prompt, and the screen wants the full paragraph
// from preview/draw-the-vote-preview.html.

import { BRIEFS, VOTERS } from "@/lib/briefs";

const PROSE = [
  "Rice farmers across north Bihar. Nine in ten cannot read. Most have never seen a printed page that was not a summons.",
  "Handloom towns in the Tamil country. These voters work with their hands all day and read almost nothing.",
  "The Malabar coast. Voters who have spent their whole lives looking at exactly one horizon.",
  "Kumaon. Scattered villages, and a polling station four hours' walk from anywhere.",
  "Jamalpur and Kharagpur. Shift workers, mixed literacy, and they will vote in large blocks.",
  "Every province, town and village. Many of these voters are registering under their own name for the first time in their lives.",
];

export type Party = {
  name: string;
  label: string; // "Brief 01"
  voters: string;
  rule: string;
};

export const PARTIES: Party[] = BRIEFS.map((b, i) => ({
  name: b.party,
  label: `Brief ${String(i + 1).padStart(2, "0")}`,
  voters: PROSE[i],
  rule: b.rule,
}));

/** "Sukhdev, 61" · "Chapra, Bihar" — the byline on a reading card. */
export const VILLAGERS = VOTERS.map((v) => ({
  who: `${v.name}, ${v.age}`,
  place: v.place,
}));

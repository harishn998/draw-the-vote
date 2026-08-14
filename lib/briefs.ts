// lib/briefs.ts — single source of truth, used by the web game AND the bot.

export type Brief = {
  party: string;
  voters: string;
  rule: string;
};

export const BRIEFS: Brief[] = [
  {
    party: "The Cultivators' League",
    voters: "Rice farmers across north Bihar. Nine in ten cannot read.",
    rule: "First symbol. Nothing on the paper to clash with yet.",
  },
  {
    party: "The Weavers' Association",
    voters: "Handloom towns in the Tamil country. These voters work with their hands all day.",
    rule: "Must not be mistaken for the Cultivators' symbol.",
  },
  {
    party: "The Fishermen's Front",
    voters: "The Malabar coast. Voters who have spent their lives looking at one horizon.",
    rule: "Two on the paper. Yours must be unmistakable beside both.",
  },
  {
    party: "The Hill Peoples' Party",
    voters: "Kumaon. Scattered villages, a polling station four hours' walk away.",
    rule: "Three on the paper. The margin for confusion is narrowing.",
  },
  {
    party: "The Railway Workers' Union",
    voters: "Jamalpur and Kharagpur. Shift workers who vote in large blocks.",
    rule: "Four on the paper. Anything round will now collide with the Weavers.",
  },
  {
    party: "The Women's Welfare Party",
    voters: "Every province. Many registering under their own name for the first time.",
    rule: "Five on the paper. This is the hardest one.",
  },
];

export const VOTERS = [
  { name: "Sukhdev", age: 61, place: "Chapra, Bihar" },
  { name: "Meenakshi", age: 34, place: "Kumbakonam" },
  { name: "Abdul", age: 47, place: "Kozhikode" },
  { name: "Devki", age: 52, place: "Almora" },
];

export const WELCOME = `*THE ELECTION COMMISSION OF INDIA · 1951*

We are printing ballot papers for one hundred and seventy-six million voters. Most of them cannot read a word on the page.

So every party gets a picture instead of a name. You are going to draw them.

*How this works:* I send you a brief. You draw the symbol *on paper*, photograph it, and send the photo back. Four voters will tell me what they think it is.

Six briefs. Bold and simple wins — detail disappears at ballot size.

Reply *START* when you have a pen.`;

export const briefMessage = (i: number) => {
  const b = BRIEFS[i];
  return `*BRIEF ${String(i + 1).padStart(2, "0")} OF 06*

*${b.party}*
${b.voters}

_${b.rule}_

Draw it on paper and send me a photograph.`;
};

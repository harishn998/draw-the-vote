"use client";
// components/Verdict.tsx
// What the four voters saw, revealed one at a time, then the round's score.

import { VILLAGERS } from "./parties";

export type Card = { saw: string; ok: boolean } | null; // null = still looking

export function Readings({ cards }: { cards: Card[] }) {
  return (
    <div className="reads">
      {VILLAGERS.map((v, i) => {
        const c = cards[i];
        return (
          <div key={v.who} className={c ? `rd in ${c.ok ? "ok" : "no"}` : "rd wait"}>
            <div className="who">
              {v.who} · {v.place}
            </div>
            <div className="saw">{c ? `“${c.saw}”` : "Looking"}</div>
            <div className="vd">{c ? (c.ok ? "Voted correctly" : "Wrong box") : " "}</div>
          </div>
        );
      })}
    </div>
  );
}

const LABEL = (got: number) =>
  got === 4
    ? "Every one of them found the right box."
    : got >= 3
      ? "Most got there. One did not."
      : got >= 2
        ? "Half these voters marked the wrong party."
        : "Almost nobody recognised it. Those votes are gone.";

const NOTE = (got: number) =>
  got >= 3
    ? "The symbols that worked in 1951 were bold, simple and large — a bullock cart, a hut, a lamp, a pair of bullocks. Detail was the enemy, because the printed symbol was about the size of a postage stamp."
    : "Symbols that were faint, fussy, or close to another party's were the biggest single cause of misvoting. The Commission redrew a great many of them before polling opened.";

export function Score({
  got,
  last,
  onNext,
}: {
  got: number;
  last: boolean;
  onNext: () => void;
}) {
  return (
    <>
      <div className={`score ${got >= 3 ? "good" : "bad"}`}>
        <span className="big">{got}/4</span>
        <span className="lb">{LABEL(got)}</span>
      </div>
      <div className="note">
        <b>What actually happened</b>
        {NOTE(got)}
      </div>
      <div className="btns">
        <button type="button" className="btn" onClick={onNext}>
          {last ? "Open the polls →" : "Next brief →"}
        </button>
      </div>
    </>
  );
}

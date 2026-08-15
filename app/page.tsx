"use client";
// app/page.tsx — Draw the Vote.
// Ported from preview/draw-the-vote-preview.html. Three scenes live in the DOM
// at once and the `.on` class decides which is visible, exactly as the preview
// did; the tricolour preloader covers every move between them.

import { useCallback, useEffect, useRef, useState } from "react";
import { Preloader, useReducedMotion } from "@/components/Preloader";
import { ChakraBg, Wipe } from "@/components/Chakra";
import { Studio } from "@/components/Studio";
import { Readings, Score, type Card } from "@/components/Verdict";
import { Ballot } from "@/components/Ballot";
import { History } from "@/components/History";
import { PARTIES } from "@/components/parties";

type Scene = "s0" | "sr" | "se";
type Reading = { name: string; saw: string; correct: boolean };

const THEMES = [
  { id: "chakra", title: "Chakra navy", swatch: "#101A3D" },
  { id: "forest", title: "Deep green", swatch: "#06291C" },
  { id: "cream", title: "Khadi cream", swatch: "#F3EDE0" },
];

export default function Home() {
  const reduce = useReducedMotion();

  const [scene, setScene] = useState<Scene>("s0");
  const [history, setHistory] = useState(true); // the read-first section owns the first screen
  const [pre, setPre] = useState({ run: false, label: "Printing" });
  const [wipe, setWipe] = useState(true);
  const [theme, setTheme] = useState("chakra");

  const [round, setRound] = useState(0);
  const [board, setBoard] = useState<(string | null)[]>(Array(6).fill(null));
  const [stampIdx, setStampIdx] = useState(-1);
  const [hits, setHits] = useState(0);
  const [votes, setVotes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [got, setGot] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [hm, setHm] = useState("Election Commission · 1951");
  const [serial, setSerial] = useState("");

  const votesRef = useRef(0);
  const votesEl = useRef<HTMLElement>(null);
  const symbols = useRef<string[]>([]); // what earlier drawings were read as
  const pending = useRef<string | null>(null); // the PNG awaiting its verdict
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    const t = window.setTimeout(() => setWipe(false), 2200);
    return () => clearTimeout(t);
  }, []);

  /* ── scene changes go behind the preloader ── */
  const show = useCallback(
    (id: Scene, label: string) => {
      if (reduce) {
        setScene(id);
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
      setPre({ run: true, label });
      after(760, () => {
        setScene(id);
        window.scrollTo({ top: 0, behavior: "instant" });
        after(260, () => setPre((p) => ({ ...p, run: false })));
      });
    },
    [reduce]
  );

  /* ── the running vote counter in the masthead ── */
  const tick = useCallback(
    (to: number) => {
      const el = votesEl.current;
      if (!el) return;
      if (reduce) {
        el.textContent = `${to.toFixed(1)}M`;
        return;
      }
      const from = parseFloat(el.textContent || "0") || 0;
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 900);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = `${(from + (to - from) * e).toFixed(1)}M`;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    [reduce]
  );

  const openBrief = useCallback(
    (i: number) => {
      clearTimers();
      if (votesEl.current) votesEl.current.style.color = "";
      setBusy(false);
      setCards(null);
      setGot(null);
      setErr("");
      setStampIdx(-1);
      setHm(`Brief ${i + 1} · Election Commission · 1951`);
      show("sr", "Sending the next brief");
    },
    [show]
  );

  /* ── the history section hands over straight to Brief 01 ──
     It has already covered the swap with its own preloader, so this must not
     run `show()` and stack a second one on top. ── */
  const startFromHistory = useCallback(() => {
    clearTimers();
    setBusy(false);
    setCards(null);
    setGot(null);
    setErr("");
    setStampIdx(-1);
    setRound(0);
    setHm("Brief 1 · Election Commission · 1951");
    setHistory(false);
    setScene("sr");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openHistory = useCallback(() => {
    setHistory(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const finishRound = useCallback(
    (readings: Reading[], score: number) => {
      const next = votesRef.current + Math.round((29_000_000 * score) / 4);
      votesRef.current = next;
      setVotes(next);
      tick(next / 1e6);
      setHits((h) => h + score);
      setBoard((b) => {
        const n = [...b];
        n[round] = pending.current;
        return n;
      });
      symbols.current = [...symbols.current, readings[0]?.saw ?? "unknown"];
      setStampIdx(round);
      setGot(score);

      const el = votesEl.current;
      if (el) {
        el.style.color = score >= 3 ? "var(--green)" : "var(--saffron)";
        after(1100, () => {
          el.style.color = "";
        });
      }
    },
    [round, tick]
  );

  /* ── the drawing goes to /api/read, four voters answer one at a time ── */
  const submit = useCallback(
    async (dataUrl: string) => {
      if (busy) return;
      setBusy(true);
      setErr("");
      setGot(null);
      pending.current = dataUrl;
      setCards([null, null, null, null]);

      const t0 = Date.now();
      try {
        const res = await fetch("/api/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: dataUrl,
            roundIndex: round,
            onBallot: symbols.current,
          }),
        });
        if (!res.ok) throw new Error(`read ${res.status}`);
        const data = await res.json();
        const readings: Reading[] = data.readings ?? [];
        if (!readings.length) throw new Error("empty verdict");
        const score: number =
          typeof data.score === "number" ? data.score : readings.filter((r) => r.correct).length;

        // Hold the same rhythm the preview had: first card at 560ms, then 700ms apart.
        const lead = Math.max(0, 560 - (Date.now() - t0));
        readings.forEach((r, i) => {
          after(reduce ? 0 : lead + i * 700, () => {
            setCards((prev) => {
              const n = [...(prev ?? [null, null, null, null])];
              n[i] = { saw: r.saw, ok: r.correct };
              return n;
            });
            if (i === readings.length - 1) finishRound(readings, score);
          });
        });
      } catch (e) {
        console.error(e);
        setCards(null);
        setBusy(false);
        setErr("The Commission could not be reached. Send the symbol again.");
      }
    },
    [busy, round, reduce, finishRound]
  );

  const next = useCallback(() => {
    const r = round + 1;
    setRound(r);
    if (r < PARTIES.length) {
      openBrief(r);
    } else {
      setSerial(`No. ${100000 + Math.floor(Math.random() * 899999)}`);
      show("se", "Opening the polls");
    }
  }, [round, openBrief, show]);

  const again = useCallback(() => {
    clearTimers();
    setRound(0);
    setVotes(0);
    votesRef.current = 0;
    setHits(0);
    setBoard(Array(6).fill(null));
    setStampIdx(-1);
    setCards(null);
    setGot(null);
    setErr("");
    setBusy(false);
    symbols.current = [];
    pending.current = null;
    if (votesEl.current) votesEl.current.textContent = "0";
    show("s0", "Resetting the roll");
  }, [show]);

  const P = PARTIES[Math.min(round, PARTIES.length - 1)];

  return (
    <>
      <Preloader active={pre.run} label={pre.label} />
      {wipe && <Wipe />}
      <ChakraBg />

      <header>
        <span className="bars">
          <i style={{ background: "#E2601B" }} />
          <i style={{ background: "#F3EDE0" }} />
          <i style={{ background: "#0D6845" }} />
        </span>
        <span className="mast">Draw the Vote</span>
        <span className="pips">
          {PARTIES.map((p, i) => (
            <span key={p.name} className={`pip${i < round ? " done" : i === round ? " now" : ""}`} />
          ))}
        </span>
        <span className="themes">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`th${theme === t.id ? " on" : ""}`}
              title={t.title}
              aria-label={t.title}
              aria-pressed={theme === t.id}
              style={{ background: t.swatch }}
              onClick={() => setTheme(t.id)}
            />
          ))}
        </span>
        <button type="button" className="btn sm gh" onClick={openHistory}>
          History
        </button>
        <span className="hm">{hm}</span>
        <span className="cnt">
          <b ref={votesEl}>0</b>
          <span>votes reaching the right box</span>
        </span>
      </header>

      {history && <History onStart={startFromHistory} />}

      {/* hidden, not unmounted — a trip back to the history mid-game keeps the pad */}
      <div className="wrap" style={history ? { display: "none" } : undefined}>
        {/* ══ the invitation ══ */}
        <section className={`scene${scene === "s0" ? " on" : ""}`}>
          <span className="tag fade" style={{ animationDelay: "1.15s" }}>
            India · 1951
          </span>
          <h1>
            <span className="rv">
              <span style={{ animationDelay: "1.2s" }}>Draw it so</span>
            </span>
            <span className="rv">
              <span style={{ animationDelay: "1.31s" }}>they cannot</span>
            </span>
            <span className="rv">
              <span style={{ animationDelay: "1.42s" }}>get it wrong.</span>
            </span>
          </h1>
          <p className="lede fade" style={{ animationDelay: "1.7s" }}>
            India is about to hold the largest election ever attempted. A hundred and seventy-six
            million people may vote, and roughly eighty-five in every hundred cannot read a ballot
            paper.
            <br />
            <br />
            No country had ever given everyone the vote at once. Every other democracy used reading
            as a reason to withhold it. India&rsquo;s answer was to change the ballot instead — so no
            party gets a name. Every party gets a <em>picture</em>.
            <br />
            <br />
            You have to draw them. Six of them. And each new one must be impossible to confuse with
            every symbol already on the paper.
          </p>
          <div className="btns fade" style={{ animationDelay: "1.95s" }}>
            <button type="button" className="btn" onClick={() => openBrief(0)}>
              Take the first brief →
            </button>
          </div>
        </section>

        {/* ══ the studio ══ */}
        <section className={`scene${scene === "sr" ? " on" : ""}`}>
          <span className="tag">
            Brief {Math.min(round, PARTIES.length - 1) + 1} of {PARTIES.length}
          </span>
          <div className="brief">
            <div className="p">{P.label}</div>
            <h2>{P.name}</h2>
            <div className="v">{P.voters}</div>
            <div className="rule">{P.rule}</div>
          </div>

          <Studio round={round} board={board} stampIdx={stampIdx} busy={busy} onSubmit={submit} />

          <div>
            {cards && <Readings cards={cards} />}
            {err && (
              <div className="note">
                <b>The printer</b>
                {err}
              </div>
            )}
            {got !== null && (
              <Score got={got} last={round >= PARTIES.length - 1} onNext={next} />
            )}
          </div>
        </section>

        {/* ══ polling day ══ */}
        <section className={`scene${scene === "se" ? " on" : ""}`}>
          {scene === "se" && (
            <Ballot hits={hits} votes={votes} board={board} serial={serial} onAgain={again} />
          )}
        </section>
      </div>

      <footer>
        Draw the Vote · Build for India · Games &amp; history · Parties are invented. The election
        was real.
      </footer>
    </>
  );
}

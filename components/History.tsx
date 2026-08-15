"use client";
// components/History.tsx — "How India voted", ported verbatim from history-section.html.
// Four acts observed into view once each (.in is never removed, so the long-cycle
// loops keep their phase when you scroll back), a rail whose fill is driven by the
// --p custom property, and nodes that light as their act passes the viewport.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Preloader, useReducedMotion } from "@/components/Preloader";

/** stroke-dasharray/offset length for a .draw path */
const L = (n: number) => ({ "--l": n }) as CSSProperties;

const ERAS = 4;

export function History({ onStart }: { onStart: () => void }) {
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const eraRefs = useRef<(HTMLElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timer = useRef<number | null>(null);

  // Stable ref callbacks — the acts are hand-written, not mapped.
  const setEra = useMemo(
    () =>
      Array.from({ length: ERAS }, (_, i) => (el: HTMLElement | null) => {
        eraRefs.current[i] = el;
      }),
    []
  );

  useEffect(() => {
    const eras = eraRefs.current.filter(Boolean) as HTMLElement[];
    const rail = railRef.current;
    const root = rootRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    eras.forEach((el) => io.observe(el));

    /* park each node beside the act it belongs to */
    const layout = () => {
      if (!rail) return;
      const rt = rail.getBoundingClientRect().top + window.scrollY;
      eras.forEach((el, i) => {
        const n = nodeRefs.current[i];
        if (!n) return;
        const t = el.getBoundingClientRect().top + window.scrollY;
        n.style.top = `${t - rt + 30}px`;
      });
    };

    const onScroll = () => {
      if (!rail || !root) return;
      const box = rail.getBoundingClientRect();
      // below 820px the rail is display:none and has no height — nothing to fill.
      const p = box.height
        ? Math.max(0, Math.min(1, (window.innerHeight * 0.55 - box.top) / box.height))
        : 0;
      root.style.setProperty("--p", p.toFixed(4));
      eras.forEach((el, i) => {
        const n = nodeRefs.current[i];
        if (!n) return;
        const r = el.getBoundingClientRect();
        n.classList.toggle(
          "lit",
          r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.25
        );
      });
    };

    const onResize = () => {
      layout();
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    layout();
    onScroll();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const go = () => {
    if (reduce) {
      onStart();
      return;
    }
    setBusy(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setBusy(false);
      onStart();
    }, 900);
  };

  return (
    <>
      <Preloader active={busy} label="Opening the first brief" />

      <div className="history" ref={rootRef}>
        <div className="hwrap">
          <div className="timeline">
            <div className="rail" ref={railRef}>
              {Array.from({ length: ERAS }, (_, i) => (
                <span
                  key={i}
                  className="node"
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                />
              ))}
            </div>
            <div className="col">
              <section className="intro">
                <span className="tag">Before you play</span>
                <h1>
                  How do you vote
                  <br />
                  if you <span className="o">cannot read</span>
                  <br />
                  the ballot?
                </h1>
                <p className="lede">
                  In 1951 India gave the vote to every adult at once — no property test, no
                  education test, no phase-in. Britain and America spread suffrage across a century
                  and still attached conditions. India did it in one step, four years after
                  independence, with roughly twenty million displaced people still to enrol.
                  <br />
                  <br />
                  There was one problem nobody anywhere had solved.
                </p>
                <div className="stats">
                  <div className="st">
                    <b>173,212,343</b>
                    <span>registered electors — about a sixth of the world</span>
                  </div>
                  <div className="st">
                    <b>18.33%</b>
                    <span>literacy. Around 85 in 100 could not read a name</span>
                  </div>
                  <div className="st">
                    <b>489</b>
                    <span>seats · 1,874 candidates</span>
                  </div>
                  <div className="st">
                    <b>200,000+</b>
                    <span>polling stations, Oct 1951 – Feb 1952</span>
                  </div>
                </div>
              </section>

              {/* ══ act one · the balloting system ══ */}
              <section className="era" ref={setEra[0]}>
                <span className="yr">1951</span>
                <div className="rv">
                  <span className="kick">Act one · The Balloting System</span>
                  <h2>The symbol was on the box.</h2>
                </div>
                <p className="txt rv d1">
                  Not on the paper. Every candidate got <b>their own ballot box</b>, standing in a
                  screened compartment, each labelled with that candidate&apos;s name and their
                  picture — a pair of bullocks, a hut, a lamp.
                  <br />
                  <br />
                  The voter was handed a slip carrying <b>nothing but a serial number</b>. No names,
                  no symbols, nothing to read at all. You walked in and dropped the blank slip into
                  the box under the right picture.
                  <br />
                  <br />
                  Reading was removed from the act of voting entirely. Recognition replaced it.
                </p>
                <div className="stage rv d2">
                  <svg
                    viewBox="0 0 520 230"
                    aria-label="Three ballot boxes labelled with symbols; a blank slip drops into the middle one"
                  >
                    <g>
                      <rect
                        className="boxline boxfill draw s1"
                        style={L(460)}
                        x="30"
                        y="90"
                        width="120"
                        height="110"
                      />
                      <rect
                        className="boxline draw s1"
                        style={L(140)}
                        x="60"
                        y="82"
                        width="60"
                        height="10"
                      />
                      <path
                        className="boxline fadein"
                        d="M66 140 h48 M72 140 v-14 h36 v14 M72 126 l18 -16 l18 16"
                      />
                      <text className="lbl fadein" x="90" y="192" textAnchor="middle">
                        HUT
                      </text>
                    </g>
                    <g>
                      <rect
                        className="boxline boxfill draw s2 chosen"
                        style={L(460)}
                        x="200"
                        y="90"
                        width="120"
                        height="110"
                      />
                      <rect
                        className="boxline draw s2 chosen"
                        style={L(140)}
                        x="230"
                        y="82"
                        width="60"
                        height="10"
                      />
                      <path
                        className="boxline fadein chosen"
                        d="M246 154 h28 M250 154 c0 -12 20 -12 20 0 M260 142 v-10 M254 132 h12"
                      />
                      <text className="lbl fadein" x="260" y="192" textAnchor="middle">
                        LAMP
                      </text>
                      <g className="slip">
                        <rect className="paper" x="240" y="34" width="40" height="30" />
                        <line
                          className="ink"
                          x1="248"
                          y1="52"
                          x2="272"
                          y2="52"
                          strokeWidth="1.6"
                        />
                      </g>
                    </g>
                    <g>
                      <rect
                        className="boxline boxfill draw s3"
                        style={L(460)}
                        x="370"
                        y="90"
                        width="120"
                        height="110"
                      />
                      <rect
                        className="boxline draw s3"
                        style={L(140)}
                        x="400"
                        y="82"
                        width="60"
                        height="10"
                      />
                      <path
                        className="boxline fadein"
                        d="M400 148 h52 M406 148 v-8 M422 148 v-8 M400 140 c8 -14 22 -14 30 0 M430 140 c8 -14 22 -14 30 0"
                      />
                      <text className="lbl fadein" x="430" y="192" textAnchor="middle">
                        BULLOCKS
                      </text>
                    </g>
                    <text
                      className="lbl fadein"
                      x="260"
                      y="22"
                      textAnchor="middle"
                      style={{ opacity: 0.4 }}
                    >
                      SLIP CARRIES ONLY A SERIAL NUMBER
                    </text>
                  </svg>
                </div>
              </section>

              {/* ══ act two · the marking system ══ */}
              <section className="era" ref={setEra[1]}>
                <span className="yr">1962</span>
                <div className="rv">
                  <span className="kick">Act two · The Marking System</span>
                  <h2>The symbol moved onto the paper.</h2>
                </div>
                <p className="txt rv d1">
                  From the third general election the boxes collapsed into one. A{" "}
                  <b>single ballot paper</b> now listed every candidate, each beside their picture,
                  and the voter marked their choice with an arrow-cross rubber stamp before folding
                  it into one common box.
                  <br />
                  <br />
                  Cheaper, faster, and far less to carry up a mountain. This is the ballot most
                  Indians picture when they picture a ballot, and it ran for four decades.
                </p>
                <div className="stage rv d2">
                  <svg
                    viewBox="0 0 520 250"
                    aria-label="A single ballot paper listing candidates with symbols; a stamp marks one row"
                  >
                    <rect
                      className="paper draw s1"
                      style={L(940)}
                      x="120"
                      y="16"
                      width="280"
                      height="180"
                      stroke="#EFE9DA"
                      strokeWidth="2"
                    />
                    <line
                      className="ink draw s1"
                      style={L(260)}
                      x1="136"
                      y1="42"
                      x2="384"
                      y2="42"
                      strokeWidth="2.6"
                    />
                    <rect className="rowhi" x="120" y="92" width="280" height="34" />
                    <g className="fadein">
                      <g transform="translate(140,58)">
                        <path className="ink" d="M4 16 h26 M8 16 v-10 h18 v10 M8 6 l9 -9 l9 9" />
                        <line
                          className="ink"
                          x1="52"
                          y1="10"
                          x2="150"
                          y2="10"
                          strokeWidth="1.6"
                          opacity={0.45}
                        />
                        <rect className="ink" x="196" y="0" width="22" height="22" strokeWidth="1.8" />
                      </g>
                      <g transform="translate(140,96)">
                        <path className="ink" d="M4 18 h24 M8 18 c0 -10 16 -10 16 0 M16 8 v-9 M11 -1 h10" />
                        <line
                          className="ink"
                          x1="52"
                          y1="10"
                          x2="150"
                          y2="10"
                          strokeWidth="1.6"
                          opacity={0.45}
                        />
                        <rect className="ink" x="196" y="0" width="22" height="22" strokeWidth="1.8" />
                      </g>
                      <g transform="translate(140,134)">
                        <path className="ink" d="M2 14 h28 M6 14 v-6 M18 14 v-6 M2 8 c6 -11 16 -11 22 0" />
                        <line
                          className="ink"
                          x1="52"
                          y1="10"
                          x2="150"
                          y2="10"
                          strokeWidth="1.6"
                          opacity={0.45}
                        />
                        <rect className="ink" x="196" y="0" width="22" height="22" strokeWidth="1.8" />
                      </g>
                      <text
                        className="lbl"
                        x="260"
                        y="222"
                        textAnchor="middle"
                        style={{ opacity: 0.45 }}
                      >
                        ONE PAPER · ONE BOX · ONE STAMP
                      </text>
                    </g>
                    <g className="stamp" transform="translate(347,107)">
                      <path
                        d="M-9 0 l6 7 l12 -14"
                        stroke="#F2822F"
                        strokeWidth="3.6"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </svg>
                </div>
              </section>

              {/* ══ act three · the machine ══ */}
              <section className="era" ref={setEra[2]}>
                <span className="yr">2001</span>
                <div className="rv">
                  <span className="kick">Act three · The machine</span>
                  <h2>The paper went away. The picture didn&apos;t.</h2>
                </div>
                <p className="txt rv d1">
                  Electronic voting machines took over from 2001. No paper, no stamp, no folding — a
                  row of buttons, and beside each one{" "}
                  <b>the same kind of picture that was painted on a wooden box in 1951</b>.
                  <br />
                  <br />
                  Three completely different mechanisms across seventy years. The one element that
                  survived all three was the symbol.
                </p>
                <div className="stage rv d2">
                  <svg
                    viewBox="0 0 520 220"
                    aria-label="An electronic voting machine panel with symbols beside buttons; one button lights up"
                  >
                    <rect
                      className="boxline boxfill draw s1"
                      style={L(940)}
                      x="120"
                      y="16"
                      width="280"
                      height="170"
                    />
                    <line
                      className="boxline draw s1"
                      style={L(290)}
                      x1="120"
                      y1="46"
                      x2="400"
                      y2="46"
                    />
                    <text className="lbl fadein" x="260" y="36" textAnchor="middle">
                      BALLOT UNIT
                    </text>
                    <g className="fadein">
                      <g transform="translate(148,64)">
                        <path className="boxline" d="M4 16 h26 M8 16 v-10 h18 v10 M8 6 l9 -9 l9 9" />
                        <line
                          className="boxline"
                          x1="52"
                          y1="8"
                          x2="150"
                          y2="8"
                          strokeWidth="1.4"
                          opacity={0.3}
                        />
                        <circle cx="196" cy="8" r="4" fill="#EFE9DA" opacity={0.25} />
                        <rect className="boxline" x="212" y="0" width="30" height="17" strokeWidth="1.8" />
                      </g>
                      <g transform="translate(148,148)">
                        <path className="boxline" d="M2 14 h28 M6 14 v-6 M18 14 v-6 M2 8 c6 -11 16 -11 22 0" />
                        <line
                          className="boxline"
                          x1="52"
                          y1="8"
                          x2="150"
                          y2="8"
                          strokeWidth="1.4"
                          opacity={0.3}
                        />
                        <circle cx="196" cy="8" r="4" fill="#EFE9DA" opacity={0.25} />
                        <rect className="boxline" x="212" y="0" width="30" height="17" strokeWidth="1.8" />
                      </g>
                      <g transform="translate(148,106)">
                        <path className="boxline" d="M4 18 h24 M8 18 c0 -10 16 -10 16 0 M16 8 v-9 M11 -1 h10" />
                        <line
                          className="boxline"
                          x1="52"
                          y1="8"
                          x2="150"
                          y2="8"
                          strokeWidth="1.4"
                          opacity={0.3}
                        />
                        <circle className="btnled" cx="196" cy="8" r="5" />
                        <circle cx="196" cy="8" r="4" fill="#EFE9DA" opacity={0.25} />
                        <rect
                          className="boxline press"
                          x="212"
                          y="0"
                          width="30"
                          height="17"
                          strokeWidth="1.8"
                        />
                      </g>
                    </g>
                  </svg>
                </div>
              </section>

              {/* ══ the throughline, the failure, the handoff ══ */}
              <section
                className="era"
                ref={setEra[3]}
                style={{ borderBottom: "3px solid var(--line)" }}
              >
                <div className="constant rv">
                  <span className="k">The throughline</span>
                  <h3>The mechanism changed three times. The picture never left.</h3>
                  <div className="thread">
                    <div className="tcell">
                      <svg viewBox="0 0 40 40">
                        <path
                          d="M8 28 h24 M12 28 c0 -13 16 -13 16 0 M20 15 v-11 M14 4 h12"
                          stroke="#F2822F"
                          strokeWidth="2.2"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="ty">1951</div>
                      <div className="tw">painted on a wooden box</div>
                    </div>
                    <div className="tcell">
                      <svg viewBox="0 0 40 40">
                        <path
                          d="M8 28 h24 M12 28 c0 -13 16 -13 16 0 M20 15 v-11 M14 4 h12"
                          stroke="#EFE9DA"
                          strokeWidth="2.2"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="ty">1962</div>
                      <div className="tw">printed on the paper</div>
                    </div>
                    <div className="tcell">
                      <svg viewBox="0 0 40 40">
                        <path
                          d="M8 28 h24 M12 28 c0 -13 16 -13 16 0 M20 15 v-11 M14 4 h12"
                          stroke="#3FB184"
                          strokeWidth="2.2"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="ty">2001</div>
                      <div className="tw">beside a button</div>
                    </div>
                    <div className="tcell">
                      <svg viewBox="0 0 40 40">
                        <path
                          d="M8 28 h24 M12 28 c0 -13 16 -13 16 0 M20 15 v-11 M14 4 h12"
                          stroke="#8B9CE0"
                          strokeWidth="2.2"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="ty">Today</div>
                      <div className="tw">still there</div>
                    </div>
                  </div>
                  <p className="txt" style={{ marginTop: 24 }}>
                    India&apos;s electorate can now largely read. The symbols stayed anyway.{" "}
                    <b>
                      The thing built for the person at the margin became the design everyone kept.
                    </b>
                  </p>
                </div>

                <div className="fail rv d1">
                  <span className="k">And the part they got wrong</span>
                  <p>
                    While preparing the rolls, the Commission found enormous numbers of women
                    enrolled not by name but as <b>&quot;A&apos;s mother&quot;</b> or{" "}
                    <b>&quot;B&apos;s wife&quot;</b> — unwilling to give their names to a stranger.
                    Sukumar Sen ruled that a name is essential to identity and must appear.{" "}
                    <b>Roughly 2.8 million women were struck off and could not vote</b> in the first
                    election.
                    <br />
                    <br />
                    The same Commission that solved brilliantly for non-literacy failed to solve for
                    this. Designing for the citizen you actually have is hard, and they did not get
                    all of it right.
                  </p>
                </div>

                <div className="handoff rv d2">
                  <h3>Somebody had to draw those pictures.</h3>
                  <p>
                    Six briefs. Four voters who cannot read a word of it. Find out whether what is
                    obvious to you is obvious to anyone else.
                  </p>
                  <button type="button" className="btn" onClick={go}>
                    Take the first brief →
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default History;

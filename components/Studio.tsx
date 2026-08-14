"use client";
// components/Studio.tsx
// The drawing pad, the nib tray, and the three rail panels: the squint preview
// at true ballot size, the legibility gauge, and the six slots on the paper.
//
// Strokes live in a ref, not in state — the canvas is redrawn imperatively on
// every pointermove and React only hears about the derived numbers.

import { useCallback, useEffect, useRef, useState } from "react";
import { PARTIES } from "./parties";

type Pt = [number, number];
type Stroke = { w: number; pts: Pt[] };

const NIBS = [
  { w: 7, title: "Fine", d: 6 },
  { w: 15, title: "Medium", d: 11 },
  { w: 28, title: "Bold", d: 18 },
];

const SHEET = "#FFFDF7";
const INK = "#14120C"; // dark in every theme — you always draw on white paper

function metrics(strokes: Stroke[], w: number, h: number) {
  let len = 0,
    minX = 1e9,
    maxX = -1e9,
    minY = 1e9,
    maxY = -1e9;
  strokes.forEach((s) =>
    s.pts.forEach((p, i) => {
      if (i) len += Math.hypot(p[0] - s.pts[i - 1][0], p[1] - s.pts[i - 1][1]);
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    })
  );
  return {
    len,
    area: strokes.length ? ((maxX - minX) * (maxY - minY)) / (w * h) : 0,
    n: strokes.length,
    avgW: strokes.length ? strokes.reduce((a, s) => a + s.w, 0) / strokes.length : 0,
  };
}

export function legibility(strokes: Stroke[], w: number, h: number) {
  const m = metrics(strokes, w, h);
  if (!m.n) return { v: 0, t: "Nothing drawn yet." };
  let v = 0.5;
  const t: string[] = [];
  if (m.area < 0.06) {
    v -= 0.3;
    t.push("Too small on the page");
  } else if (m.area > 0.2) v += 0.22;
  if (m.avgW < 9) {
    v -= 0.2;
    t.push("Lines too fine to print");
  } else if (m.avgW >= 15) v += 0.2;
  if (m.n > 13 || m.len > 8500) {
    v -= 0.28;
    t.push("Too much detail — it fills in at this size");
  } else if (m.n <= 8 && m.len > 900) v += 0.25;
  if (m.len < 420) {
    v -= 0.25;
    t.push("Not enough shape to recognise");
  }
  v = Math.max(0.04, Math.min(1, v));
  if (!t.length) t.push(v > 0.75 ? "Bold and simple. This will read." : "Readable, but push it bolder.");
  return { v, t: t.join(" · ") };
}

export function Studio({
  round,
  board,
  stampIdx,
  busy,
  onSubmit,
}: {
  round: number;
  board: (string | null)[];
  stampIdx: number;
  busy: boolean;
  onSubmit: (dataUrl: string) => void;
}) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const sqRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const cur = useRef<Stroke | null>(null);
  const drawing = useRef(false);
  const nib = useRef(7);

  const [w, setW] = useState(7);
  const [ink, setInk] = useState(false);
  const [gauge, setGauge] = useState({ v: 0, t: "Nothing drawn yet." });

  const redraw = useCallback(() => {
    const cv = cvRef.current;
    const sq = sqRef.current;
    if (!cv || !sq) return;
    const cx = cv.getContext("2d")!;
    cx.fillStyle = SHEET;
    cx.fillRect(0, 0, cv.width, cv.height);
    cx.lineCap = "round";
    cx.lineJoin = "round";
    cx.strokeStyle = INK;
    cx.fillStyle = INK;

    strokes.current.forEach((s) => {
      const p = s.pts;
      if (p.length < 2) {
        cx.beginPath();
        cx.arc(p[0][0], p[0][1], s.w / 2, 0, 7);
        cx.fill();
        return;
      }
      for (let i = 1; i < p.length; i++) {
        // Faster strokes thin out, the way a nib lifts off paper.
        const sp = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        cx.lineWidth = Math.max(s.w * 0.55, s.w * (1 - Math.min(0.42, sp / 95)));
        const mx = (p[i - 1][0] + p[i][0]) / 2,
          my = (p[i - 1][1] + p[i][1]) / 2;
        cx.beginPath();
        if (i === 1) cx.moveTo(p[0][0], p[0][1]);
        else {
          const px = (p[i - 2][0] + p[i - 1][0]) / 2,
            py = (p[i - 2][1] + p[i - 1][1]) / 2;
          cx.moveTo(px, py);
        }
        cx.quadraticCurveTo(p[i - 1][0], p[i - 1][1], mx, my);
        cx.stroke();
      }
    });

    const sqx = sq.getContext("2d")!;
    sqx.fillStyle = "#fff";
    sqx.fillRect(0, 0, 56, 56);
    sqx.drawImage(cv, 0, 0, 56, 56);

    setInk(strokes.current.length > 0);
    setGauge(legibility(strokes.current, cv.width, cv.height));
  }, []);

  // A fresh brief means a fresh sheet.
  useEffect(() => {
    strokes.current = [];
    cur.current = null;
    drawing.current = false;
    redraw();
  }, [round, redraw]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const cv = cvRef.current!;
    const r = cv.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * cv.width,
      ((e.clientY - r.top) / r.height) * cv.height,
    ];
  };

  const gcol = gauge.v > 0.7 ? "var(--green)" : gauge.v > 0.42 ? "var(--accent)" : "var(--saffron)";

  return (
    <div className="studio">
      <div>
        <div className="pad">
          <canvas
            ref={cvRef}
            width={880}
            height={600}
            aria-label="Drawing pad"
            onPointerDown={(e) => {
              if (busy) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              drawing.current = true;
              cur.current = { w: nib.current, pts: [pos(e)] };
              strokes.current.push(cur.current);
              redraw();
            }}
            onPointerMove={(e) => {
              if (!drawing.current || !cur.current) return;
              cur.current.pts.push(pos(e));
              redraw();
            }}
            onPointerUp={() => {
              drawing.current = false;
              cur.current = null;
            }}
            onPointerCancel={() => {
              drawing.current = false;
              cur.current = null;
            }}
          />
          {!ink && <div className="hint">Draw the symbol here</div>}
        </div>

        <div className="tray">
          {NIBS.map((n) => (
            <button
              key={n.w}
              type="button"
              className={`nib${w === n.w ? " on" : ""}`}
              title={n.title}
              aria-label={`${n.title} nib`}
              aria-pressed={w === n.w}
              onClick={() => {
                nib.current = n.w;
                setW(n.w);
              }}
            >
              <i style={{ width: n.d, height: n.d }} />
            </button>
          ))}
          <button
            type="button"
            className="btn gh sm"
            onClick={() => {
              strokes.current.pop();
              redraw();
            }}
          >
            Undo
          </button>
          <button
            type="button"
            className="btn gh sm"
            onClick={() => {
              strokes.current = [];
              redraw();
            }}
          >
            Clear
          </button>
          <span className="trayspace" />
          <button
            type="button"
            className="btn sm"
            disabled={!ink || busy}
            onClick={() => {
              if (!strokes.current.length || busy) return;
              onSubmit(cvRef.current!.toDataURL("image/png"));
            }}
          >
            Send it to the printer →
          </button>
        </div>
      </div>

      <div className="rail">
        <div className="panel">
          <div className="ph">At ballot size</div>
          <div className="squint">
            <canvas ref={sqRef} width={56} height={56} aria-hidden="true" />
            <span className="sx">
              This is how big your symbol actually prints. If you can&rsquo;t tell what it is here,
              neither can they.
            </span>
          </div>
        </div>

        <div className="panel">
          <div className="ph">Legibility</div>
          <div className="gauge">
            <div className="gbar">
              <i style={{ width: `${gauge.v * 100}%`, background: gcol }} />
            </div>
            <div className="gtxt">{gauge.t}</div>
          </div>
        </div>

        <div className="panel">
          <div className="ph">On the ballot paper</div>
          <div className="slots">
            {PARTIES.map((p, i) => (
              <div key={p.name} className={`slot${i === stampIdx ? " new" : ""}`}>
                {board[i] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={board[i]!} alt={`Symbol for ${p.name}`} />
                ) : (
                  <span className="e">EMPTY</span>
                )}
                <span className="nm">{board[i] ? p.name.replace(/^The /, "") : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

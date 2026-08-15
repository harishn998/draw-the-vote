"use client";
// components/Ballot.tsx
// Polling day. The six symbols laid out as a printed ballot paper, the tally,
// and the two delivery fields.

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Seal } from "./Chakra";
import { PARTIES } from "./parties";
import { buildBallotPng } from "./ballotPng";

// The bot on the other end is app/api/telegram/route.ts.
// Exported so the history handoff offers the same address, from one definition.
export const BOT_URL = process.env.NEXT_PUBLIC_TELEGRAM_BOT || "https://t.me/YOUR_BOT_HANDLE";
export const BOT_HANDLE = `@${BOT_URL.replace(/\/+$/, "").split("/").pop()}`;

const EPILOGUE =
  "India's first general election ran from October 1951 to February 1952 — the largest exercise of its kind ever attempted anywhere. Ballot boxes travelled by elephant, camel and boat. Parties were given pictures because most voters could not read names, and that one decision is why universal adult franchise worked here from the very first vote instead of being rationed out by literacy. The pictures are still on the ballot today.";

type Msg = { text: string; kind: "" | "ok" | "err" };

export function Ballot({
  hits,
  votes,
  board,
  serial,
  onAgain,
}: {
  hits: number;
  votes: number;
  board: (string | null)[];
  serial: string;
  onAgain: () => void;
}) {
  const pct = Math.round((hits / 24) * 100);
  const millions = (votes / 1e6).toFixed(1);

  const [email, setEmail] = useState("");
  const [emMsg, setEmMsg] = useState<Msg>({ text: "", kind: "" });
  const [sending, setSending] = useState(false);

  async function sendEmail() {
    if (sending) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setEmMsg({ text: "Enter a valid email", kind: "err" });
      return;
    }
    setSending(true);
    setEmMsg({ text: "Sending…", kind: "" });
    try {
      const pngBase64 = await buildBallotPng(board);
      const r = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim(), pngBase64, score: hits, votes: millions }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? "Could not send.");
      setEmMsg({ text: "Sent. Check your inbox.", kind: "ok" });
    } catch (e) {
      setEmMsg({ text: e instanceof Error ? e.message : "Could not send.", kind: "err" });
    } finally {
      setSending(false);
    }
  }

  async function save() {
    const url = await buildBallotPng(board);
    const a = document.createElement("a");
    a.download = "my-ballot-paper.png";
    a.href = url;
    a.click();
  }

  const stats: [string, string][] = [
    [`${millions}M`, "votes reached the party they were meant for"],
    [`${pct}%`, "of your symbols were read correctly"],
    ["176M", "entitled to vote in 1951"],
    ["~85%", "who could not read the paper"],
  ];

  return (
    <>
      <span className="tag">Polling day · 1952</span>
      <h1>{pct >= 75 ? "The paper held." : pct >= 45 ? "It mostly worked." : "Too many marks went astray."}</h1>

      <div className="ballot">
        <div className="bt">
          <Seal />
          <div className="t1">Ballot paper · General Election · Drawn by hand</div>
          <div className="t2">{serial}</div>
        </div>
        <div>
          {PARTIES.map((p, i) => (
            <div key={p.name} className="brow" style={{ animationDelay: `${i * 0.09}s` }}>
              {board[i] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={board[i]!} alt={`Symbol for ${p.name}`} />
              )}
              <div>
                <div className="pn">{p.name}</div>
                <div className="pr">{p.voters.split(".")[0]}</div>
              </div>
              <div className="pc">
                <b>{i + 1}</b>on the paper
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="stats">
        {stats.map(([n, l]) => (
          <div key={l} className="st">
            <b>{n}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <p className="lede">{EPILOGUE}</p>

      <div className="deliver">
        <div className="ph">Send it to yourself</div>
        <div className="dgrid">
          <div className="dcell">
            <div className="dt">Email</div>
            <div className="dd">Your ballot paper, printed as a PNG, delivered to any inbox.</div>
            <div className="dfield">
              <input
                type="email"
                placeholder="you@example.com"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="button" className="btn sm" disabled={sending} onClick={sendEmail}>
                Send
              </button>
            </div>
            <div className={`dmsg${emMsg.kind ? ` ${emMsg.kind}` : ""}`}>{emMsg.text}</div>
          </div>
          <div className="dcell">
            <div className="dt">Play it on paper</div>
            <div className="dd">
              Draw the symbols with an actual pen. Photograph them. The Commission writes back.
            </div>
            {/* The QR sits on a sheet-white block — a code on the navy will not scan. */}
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "var(--sheet)", padding: 10, width: "fit-content" }}>
                <QRCodeSVG
                  value={BOT_URL}
                  size={120}
                  bgColor="#FFFDF7"
                  fgColor="#14120C"
                  title={`Telegram bot ${BOT_HANDLE}`}
                />
              </div>
              <a
                href={BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="dt"
                style={{
                  color: "var(--fg)",
                  opacity: 0.8,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  width: "fit-content",
                }}
              >
                {BOT_HANDLE}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="btns">
        <button type="button" className="btn" onClick={save}>
          Save my ballot paper
        </button>
        <button type="button" className="btn gh" onClick={onAgain}>
          Run the election again
        </button>
      </div>
    </>
  );
}

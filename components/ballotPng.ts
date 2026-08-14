// components/ballotPng.ts
// Renders the six symbols as one printable ballot paper PNG. Used by both the
// download button and the email field, so they can never drift apart.

import { PARTIES } from "./parties";

const load = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });

export async function buildBallotPng(board: (string | null)[]): Promise<string> {
  // Poppins has to be resident or canvas silently falls back to the generic.
  if (document.fonts?.ready) await document.fonts.ready;

  const images = await Promise.all(
    PARTIES.map((_, i) => (board[i] ? load(board[i]!) : Promise.resolve(null)))
  );

  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  c.width = 760;
  c.height = 980;
  g.fillStyle = "#FFFDF7";
  g.fillRect(0, 0, 760, 980);
  g.strokeStyle = "#14120C";
  g.lineWidth = 8;
  g.strokeRect(4, 4, 752, 972);
  g.fillStyle = "#14120C";
  g.textAlign = "center";
  g.font = "700 28px Poppins, sans-serif";
  g.fillText("BALLOT PAPER · DRAWN BY HAND", 380, 70);
  g.font = "500 13px Poppins, sans-serif";
  g.fillText("GENERAL ELECTION · 1952", 380, 98);
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(24, 124);
  g.lineTo(736, 124);
  g.stroke();

  PARTIES.forEach((p, i) => {
    const y = 146 + i * 136;
    if (images[i]) g.drawImage(images[i]!, 40, y + 8, 120, 110);
    g.strokeStyle = "#14120C";
    g.lineWidth = 2;
    g.strokeRect(40, y + 8, 120, 110);
    g.fillStyle = "#14120C";
    g.textAlign = "left";
    g.font = "600 21px Poppins, sans-serif";
    g.fillText(p.name, 184, y + 56);
    g.font = "400 12px Poppins, sans-serif";
    g.fillStyle = "#5A5348";
    g.fillText(`${i + 1} on the paper`, 184, y + 82);
    g.strokeStyle = "#14120C";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(24, y + 128);
    g.lineTo(736, y + 128);
    g.stroke();
  });

  return c.toDataURL("image/png");
}

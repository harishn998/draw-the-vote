// app/api/email/route.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { to, pngBase64, score, votes } = await req.json();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return Response.json({ error: "That doesn't look like an email address." }, { status: 400 });
  }

  // Resend wants raw base64, not the dataURL prefix.
  const raw = pngBase64.replace(/^data:image\/png;base64,/, "");

  const html = `
<div style="margin:0;padding:0;background:#101A3D;font-family:'Poppins',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 28px">

    <div style="display:flex;height:6px;width:44px;margin-bottom:22px">
      <div style="flex:1;height:6px;background:#F2822F"></div>
      <div style="flex:1;height:6px;background:#FFFDF7"></div>
      <div style="flex:1;height:6px;background:#3FB184"></div>
    </div>

    <h1 style="margin:0;color:#EFE9DA;font-size:30px;font-weight:700;letter-spacing:-1px;line-height:1.1">
      Your ballot paper
    </h1>
    <p style="margin:14px 0 0;color:#EFE9DA;opacity:.72;font-size:15px;line-height:1.7;font-weight:300">
      Six symbols, drawn by you, for an electorate of 176 million people who mostly could not read a name.
      <strong style="color:#F2822F;font-weight:600">${score} of 24</strong> readings came back correct —
      about ${votes} million votes reaching the party they were meant for.
    </p>

    <div style="margin:26px 0;border:3px solid #EFE9DA;background:#FFFDF7;padding:14px;text-align:center">
      <img src="cid:ballot" alt="Your hand-drawn ballot paper" style="max-width:100%;display:block;margin:0 auto"/>
    </div>

    <p style="margin:0;color:#EFE9DA;opacity:.6;font-size:13px;line-height:1.75;font-weight:300">
      India's first general election ran from October 1951 to February 1952 — the largest ever attempted anywhere.
      Ballot boxes travelled by elephant, camel and boat. Parties were given pictures because most voters could not
      read names, and that one decision is why universal adult franchise worked here from the very first vote.
      The pictures are still on the ballot today.
    </p>

    <p style="margin:28px 0 0;color:#EFE9DA;opacity:.38;font-size:11px;letter-spacing:2px;text-transform:uppercase">
      Draw the Vote · Build for India · 15 August
    </p>
  </div>
</div>`;

  try {
    const { data, error } = await resend.emails.send({
      from: "Draw the Vote (Election Commission) <agent@ipqc.in>", // swap for your verified domain
      to,
      subject: `Your ballot paper — ${score}/24 read correctly`,
      html,
      attachments: [
        { filename: "my-ballot-paper.png", content: raw, contentId: "ballot" },
      ],
    });
    if (error) throw error;
    return Response.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Could not send. Try again." }, { status: 500 });
  }
}

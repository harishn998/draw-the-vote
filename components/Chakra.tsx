// components/Chakra.tsx
// The three pieces of standing chrome: the drifting background wheel, the
// tricolour entrance wipe, and the seal stamped on the ballot paper.

/**
 * 24 spokes from r1 to r2 around a centre, as one path.
 * Rounded to 4 places: Math.cos can differ in the last bit between Node and the
 * browser, and that is enough to trip a hydration mismatch on this attribute.
 */
export function spokePath(r1: number, r2: number, c: number) {
  const at = (r: number, a: number) =>
    `${(c + r * Math.cos(a)).toFixed(4)} ${(c + r * Math.sin(a)).toFixed(4)}`;
  let d = "";
  for (let i = 0; i < 24; i++) {
    const a = (i * 15 * Math.PI) / 180;
    d += `M${at(r1, a)}L${at(r2, a)}`;
  }
  return d;
}

export function ChakraBg() {
  return (
    <svg className="chakra" viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="94" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="10" stroke="currentColor" strokeWidth="1" />
      <g stroke="currentColor" strokeWidth=".85">
        <path d={spokePath(10, 94, 100)} />
      </g>
    </svg>
  );
}

export function Wipe() {
  return (
    <div className="wipe" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}

export function Seal() {
  return (
    <svg className="seal" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="#1A2A6B" strokeWidth=".8" />
      <circle cx="24" cy="24" r="16" stroke="#1A2A6B" strokeWidth=".8" />
      <circle cx="24" cy="24" r="2.2" fill="#1A2A6B" />
      <g stroke="#1A2A6B" strokeWidth=".55">
        <path d={spokePath(2.2, 16, 24)} />
      </g>
    </svg>
  );
}

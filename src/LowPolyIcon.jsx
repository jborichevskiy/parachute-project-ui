function hashStr(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function LowPolyIcon({ seed, kind, size = 44 }) {
  const rnd = mulberry32(hashStr(seed));
  const hue = kind === "digital" ? 186 : 30;
  const sat = kind === "digital" ? 46 : 58;
  const cx = 50, cy = 51, n = 6;
  const verts = [];
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = 33 + (rnd() * 10 - 5);
    verts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.92]);
  }
  const ox = cx + (rnd() * 16 - 8);
  const oy = cy + (rnd() * 14 - 7);
  const facets = [];
  for (let i = 0; i < n; i++) {
    const a = verts[i], b = verts[(i + 1) % n];
    const light = 52 + Math.floor(rnd() * 28);
    facets.push({
      pts: `${ox},${oy} ${a[0]},${a[1]} ${b[0]},${b[1]}`,
      fill: `hsl(${hue} ${sat}% ${light}%)`,
    });
  }
  const outline = verts.map((v) => v.join(",")).join(" ");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block" }}>
      <polygon points={outline} fill={`hsl(${hue} ${sat}% 40%)`} />
      {facets.map((f, i) => (
        <polygon key={i} points={f.pts} fill={f.fill} stroke="var(--bg)" strokeWidth="0.8" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

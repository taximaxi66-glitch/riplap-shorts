// ---------- math + helpers ----------
const W = 1080, H = 1920, FPS = 30;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const ss = (a, b, x) => { const k = inv(a, b, x); return k * k * (3 - 2 * k); };
const eio = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eout = k => 1 - Math.pow(1 - clamp(k), 3);
const ein = k => clamp(k) ** 3;
const back = k => { const c = 1.9; k = clamp(k); return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const TAU = Math.PI * 2, D2R = Math.PI / 180;
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
// smooth 1D value noise (no flicker: continuous)
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function noise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
function fbm(x) { return noise(x) * 0.6 + noise(x * 2.1 + 5) * 0.28 + noise(x * 4.3 + 9) * 0.12; }
function mixc(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ---------- timing ----------
let T = null; // {duration, lines:[{id,start,end}], words:[{w,line,s,e}]}
function LN(id) { return T.lines.find(l => l.id === id); }
function WD(id, k) { const li = LN(id).i; const ws = T.words.filter(w => w.line === li); return ws[Math.min(k, ws.length - 1)].s; }
function WDW(id, word, nth = 0) {
  const li = LN(id).i; const ws = T.words.filter(w => w.line === li);
  const nm = x => x.toLowerCase().replace(/[^a-z0-9']/g, ''); const m = ws.filter(w => nm(w.w) === nm(word)); if (!m.length) throw new Error('word ' + word + ' in ' + id); return m[nth].s;
}

// ---------- canvas helpers ----------
function mkCanvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function poly(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
function glow(g, x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgb(col, a)); gr.addColorStop(1, rgb(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
function vignette(g, k = 0.55) {
  const gr = g.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.5, H * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${k})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
// limb: thick rounded stroke with ink outline + shade
function limb(g, pts, w, fill, ink, shade, ow) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
  path(); g.strokeStyle = ink; g.lineWidth = w + ow * 2; g.stroke();
  path(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  if (shade) { g.save(); g.translate(w * 0.18, 0); path(); g.strokeStyle = shade; g.lineWidth = w * 0.4; g.stroke(); g.restore(); }
}

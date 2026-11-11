// =====================================================================
// THE CALLER: outside the front door (same comic 2.5D look)
// porch world: facade plane z = 0, outside is z < 0. Porch slab top y = 0, lawn y = -0.36.
// An outside camera looks +z (yaw 0) at the house; the peephole looks -z (yaw 180) out to the street.
// (Interior x maps to porch -x: the sidelight is at x -0.95..-0.62 out here.)
// =====================================================================
const PO = { lawn: -0.36, slabZ: -1.6, lantern: [-1.2, 1.98, -0.12], button: [0.64, 1.36, -0.035], fence: -9.6, road0: -11.2, road1: -18.0, wallC: '#262c3b' };
function porchEnv(t, extra = {}) { return envAt(t, 0, Object.assign({ fogDist: 38, lantern: 1, rain: 0, motes: 0.6, bats: 1 }, extra)); }
const fkz = (E, cam, x, y, z) => fogK(E, Math.max(0, camSpace(cam, x, y, z)[2]));
function fogc(c, E, cam, x, y, z, m = 1) { return rgb(mixc(c, E.P.fog, fkz(E, cam, x, y, z) * m)); }

// ---------- far side of the street: houses with one lit window, trees, hills ----------
const FARH = (() => { const r = rng(91), a = []; let x = -22; while (x < 22) { const w = 5 + r() * 3; a.push({ x0: x, x1: x + w, z: -24 - r() * 3, h: 3.4 + r() * 1.6, roof: 1.6 + r() * 1.2, lit: r() < 0.35, col: [hex('#262b38'), hex('#2e2a2c'), hex('#232c34')][(r() * 3) | 0] }); x += w + 2.5 + r() * 2; } return a; })();
const FART = (() => { const r = rng(93), a = []; for (let i = 0; i < 26; i++) a.push({ x: -30 + r() * 60, z: -20.5 - r() * 14, h: 6 + r() * 6, seed: r() * 100, dead: r() < 0.3 }); return a; })();
function drawFarHouse(g, cam, E, h) {
  const fk = fogK(E, Math.max(0, camSpace(cam, (h.x0 + h.x1) / 2, 0, h.z)[2])), wall = rgb(mixc(h.col, E.P.fog, fk * 0.8)), roof = rgb(mixc([12, 13, 18], E.P.fog, fk * 0.8));
  const y0 = -0.4, xm = (h.x0 + h.x1) / 2;
  fillQ(g, cam, [[h.x0, y0, h.z], [h.x1, y0, h.z], [h.x1, h.h, h.z], [h.x0, h.h, h.z]], wall, 'rgba(0,0,0,0.4)');
  fillQ(g, cam, [[h.x0 - 0.3, h.h, h.z + 0.01], [h.x1 + 0.3, h.h, h.z + 0.01], [xm, h.h + h.roof, h.z + 0.01]], roof, 'rgba(0,0,0,0.4)');
  fillQ(g, cam, [[xm + 0.8, h.h + h.roof * 0.4, h.z + 0.02], [xm + 1.3, h.h + h.roof * 0.4, h.z + 0.02], [xm + 1.3, h.h + h.roof + 0.5, h.z + 0.02], [xm + 0.8, h.h + h.roof + 0.5, h.z + 0.02]], roof, null);
  const nw = Math.max(2, Math.floor((h.x1 - h.x0) / 1.8));
  for (let i = 0; i < nw; i++) { const wx = lerp(h.x0, h.x1, (i + 0.5) / nw); for (const fl of [0, 1]) { const wy = fl ? h.h - 1.4 : 0.9; if (wy + 1 > h.h) continue; const lit = h.lit && i === 1 && fl === 1;
    const sp = fillQ(g, cam, [[wx - 0.35, wy, h.z - 0.01], [wx + 0.35, wy, h.z - 0.01], [wx + 0.35, wy + 0.9, h.z - 0.01], [wx - 0.35, wy + 0.9, h.z - 0.01]], lit ? rgb(mixc([255, 190, 110], E.P.fog, fk * 0.5)) : rgb(mixc([8, 10, 16], E.P.fog, fk * 0.8)), 'rgba(0,0,0,0.3)');
    if (lit && sp) { g.save(); g.globalCompositeOperation = 'lighter'; const c = sp[0]; glow(g, (sp[0][0] + sp[2][0]) / 2, (sp[0][1] + sp[2][1]) / 2, 50, [255, 170, 90], 0.3); g.restore(); } } }
}
// ---------- ground: lawn, path, sidewalk, road ----------
function porchGround(g, cam, E) {
  const L = PO.lawn;
  // far sidewalk + road + near sidewalk + verge (drawn back to front)
  fillQ(g, cam, [[-60, -0.42, -40], [60, -0.42, -40], [60, -0.42, PO.road1 - 1.2], [-60, -0.42, PO.road1 - 1.2]], fogc([10, 14, 14], E, cam, 0, 0, -22), null);
  fillQ(g, cam, [[-60, -0.42, PO.road1 - 1.2], [60, -0.42, PO.road1 - 1.2], [60, -0.42, PO.road1], [-60, -0.42, PO.road1]], fogc([46, 48, 54], E, cam, 0, 0, PO.road1), null);
  fillQ(g, cam, [[-60, -0.44, PO.road1], [60, -0.44, PO.road1], [60, -0.44, PO.road0], [-60, -0.44, PO.road0]], fogc([18, 19, 24], E, cam, 0, 0, -14), null);
  for (let x = -40; x < 40; x += 6) fillQ(g, cam, [[x, -0.439, -14.7], [x + 3, -0.439, -14.7], [x + 3, -0.439, -14.5], [x, -0.439, -14.5]], fogc([170, 170, 160], E, cam, x, 0, -14.6), null);
  fillQ(g, cam, [[-60, -0.42, PO.road0], [60, -0.42, PO.road0], [60, -0.42, PO.road0 + 1.4], [-60, -0.42, PO.road0 + 1.4]], fogc([46, 48, 54], E, cam, 0, 0, PO.road0), null);
  for (let x = -40; x < 40; x += 1.3) line3(g, cam, [x, -0.419, PO.road0], [x, -0.419, PO.road0 + 1.4], 'rgba(0,0,0,0.3)', null);
  // lawn
  fillQ(g, cam, [[-60, L, PO.road0 + 1.4], [60, L, PO.road0 + 1.4], [60, L, 0], [-60, L, 0]], fogc([12, 20, 16], E, cam, 0, 0, -5, 0.6), null);
  const r = rng(61); for (let i = 0; i < 26; i++) { const x = -9 + r() * 18, z = -9 + r() * 8; const p = proj(cam, x, L, z); if (p) { g.fillStyle = 'rgba(4,8,6,0.35)'; ell(g, p[0], p[1], 0.9 * p[2], 0.25 * p[2]); g.fill(); } }
  // flagstone path from the steps to the gate
  for (let z = -2.3, i = 0; z > PO.fence + 0.3; z -= 0.62, i++) { const w = 0.5 + (i % 2) * 0.06, xo = (hash(i * 3.3) - 0.5) * 0.08;
    fillQ(g, cam, [[-w + xo, L + 0.01, z], [w + xo, L + 0.01, z], [w + xo + 0.02, L + 0.01, z - 0.5], [-w + xo - 0.02, L + 0.01, z - 0.5]], fogc([58, 60, 66], E, cam, 0, 0, z, 0.8), 'rgba(6,6,10,0.7)'); }
}
// grass tufts that sway (world points)
const TUFTS = (() => { const r = rng(67), a = []; for (let i = 0; i < 140; i++) { const z = -0.3 - r() * 9; let x = -8 + r() * 16; if (Math.abs(x) < 0.75) x += x < 0 ? -0.8 : 0.8; a.push({ x, z, h: 0.1 + r() * 0.16, s: r() * 10 }); } return a; })();
function drawTuft(g, cam, E, tf) {
  const p = proj(cam, tf.x, PO.lawn, tf.z); if (!p || p[2] < 4) return; const sw = Math.sin(E.t * 1.6 + tf.s) * 0.04 + noise(E.t * 0.5 + tf.s) * 0.03;
  g.strokeStyle = fogc([22, 36, 26], E, cam, tf.x, 0, tf.z, 0.7); g.lineWidth = Math.max(1, 0.012 * p[2]); g.lineCap = 'round'; g.beginPath();
  for (let k = -2; k <= 2; k++) { g.moveTo(p[0] + k * 0.02 * p[2], p[1]); g.quadraticCurveTo(p[0] + (k * 0.03 + sw * 0.5) * p[2], p[1] - tf.h * 0.6 * p[2], p[0] + (k * 0.05 + sw) * p[2], p[1] - tf.h * (1 - Math.abs(k) * 0.15) * p[2]); }
  g.stroke();
}
// ---------- picket fence + gate (left ajar, swinging a little) ----------
function drawFence(g, cam, E) {
  const z = PO.fence, L = PO.lawn, col = fogc([60, 62, 70], E, cam, 0, 0, z, 0.8), dk = fogc([30, 32, 38], E, cam, 0, 0, z, 0.8);
  for (const [a, b] of [[-14, -0.65], [0.65, 14]]) {
    fillQ(g, cam, [[a, L + 0.45, z], [b, L + 0.45, z], [b, L + 0.53, z], [a, L + 0.53, z]], dk, null);
    for (let x = a; x < b; x += 0.16) fillQ(g, cam, [[x, L, z - 0.01], [x + 0.09, L, z - 0.01], [x + 0.09, L + 0.95, z - 0.01], [x + 0.045, L + 1.03, z - 0.01], [x, L + 0.95, z - 0.01]], col, 'rgba(5,6,10,0.6)');
  }
  // gate: hinged at x = 0.65, swung open toward the garden
  const ang = (38 + Math.sin(E.t * 0.9) * 5) * D2R, hx = 0.65, gw = 1.3, P = (u, y) => [hx - Math.cos(ang) * u * gw, L + y, z - Math.sin(ang) * u * gw];
  for (let i = 0; i < 8; i++) { const u0 = i / 8 + 0.02, u1 = u0 + 0.07; fillQ(g, cam, [P(u0, 0.05), P(u1, 0.05), P(u1, 0.95), P((u0 + u1) / 2, 1.02), P(u0, 0.95)], col, 'rgba(5,6,10,0.6)'); }
  fillQ(g, cam, [P(0, 0.3), P(1, 0.3), P(1, 0.37), P(0, 0.37)], dk, null); fillQ(g, cam, [P(0, 0.72), P(1, 0.72), P(1, 0.79), P(0, 0.79)], dk, null);
  for (const x of [-0.7, 0.7]) box3(g, cam, x - 0.06, x + 0.06, L, L + 1.15, z - 0.06, z + 0.06, { front: dk, side: dk, top: col });
  // mailbox on a post
  box3(g, cam, 1.36, 1.42, L, L + 1.05, z + 0.25, z + 0.31, { front: dk, side: dk });
  box3(g, cam, 1.22, 1.56, L + 1.05, L + 1.3, z + 0.1, z + 0.55, { front: fogc([90, 30, 30], E, cam, 1.4, 1, z), side: fogc([70, 24, 24], E, cam, 1.4, 1, z), top: fogc([110, 40, 38], E, cam, 1.4, 1, z), back: fogc([90, 30, 30], E, cam, 1.4, 1, z) });
}
// ---------- street lamps + warm pools ----------
const PLAMPS = [{ x: -5.5, z: -10.9 }, { x: 8.5, z: -10.9 }, { x: -19, z: -18.6 }, { x: 19, z: -18.6 }];
function porchLampPools(g, cam, E) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const L of PLAMPS) { const c = proj(cam, L.x, -0.42, L.z - 1.2), f = proj(cam, L.x, -0.42, L.z - 4); if (!c) continue; const fk = fkz(E, cam, L.x, 0, L.z), rx = 4.5 * c[2], ry = Math.max(8, f ? Math.abs(c[1] - f[1]) : rx * 0.2);
    g.save(); g.translate(c[0], c[1]); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgb([255, 170, 90], 0.3 * (1 - fk * 0.6))); gr.addColorStop(1, rgb([255, 150, 70], 0)); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
  g.restore();
}
function drawPLamp(g, cam, E, L) {
  const b = proj(cam, L.x, -0.42, L.z), tp = proj(cam, L.x, 5.4, L.z), hd = proj(cam, L.x, 5.2, L.z - 1.2); if (!b || !tp || !hd) return;
  const fk = fkz(E, cam, L.x, 0, L.z), s = b[2], col = rgb(mixc([18, 20, 26], E.P.fog, fk * 0.9));
  g.strokeStyle = col; g.lineCap = 'butt'; g.lineWidth = Math.max(1.5, 0.13 * s); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(tp[0], tp[1]); g.quadraticCurveTo(tp[0], hd[1] - 0.3 * s, hd[0], hd[1]); g.stroke();
  g.fillStyle = col; ell(g, hd[0], hd[1], 0.35 * s, 0.12 * s); g.fill(); g.fillStyle = 'rgb(255,214,150)'; ell(g, hd[0], hd[1] + 0.06 * s, 0.25 * s, 0.06 * s); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, hd[0], hd[1] + 0.1 * s, Math.max(30, Math.min(500, 1.8 * s)), [255, 180, 100], 0.45 * (1 - fk * 0.5)); glow(g, hd[0], hd[1] + 0.05 * s, Math.max(8, 0.45 * s), [255, 236, 200], 0.8);
  const g0 = proj(cam, L.x, -0.42, L.z - 1.2); if (g0) { const cg = g.createLinearGradient(0, hd[1], 0, g0[1]); cg.addColorStop(0, 'rgba(255,190,120,0.12)'); cg.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = cg; poly(g, [[hd[0] - 0.2 * s, hd[1]], [hd[0] + 0.2 * s, hd[1]], [g0[0] + 2.6 * s, g0[1]], [g0[0] - 2.6 * s, g0[1]]]); g.fill(); }
  g.restore();
}
// ---------- the big garden tree (bare, swaying) ----------
function drawGardenTree(g, cam, E, x = -4.2, z = -5.5) {
  const b = proj(cam, x, PO.lawn, z); if (!b) return; const fk = fkz(E, cam, x, 0, z) * 0.7, col = rgb(mixc([10, 10, 14], E.P.fog, fk)), r = rng(5);
  const br = (p, a, l, w, d) => { const sw = (noise(E.t * 0.5 + d * 1.7 + a) * 0.06 + Math.sin(E.t * 1.1 + d) * 0.02) * d;
    const q = [p[0] + Math.cos(a + sw) * l, p[1] + Math.sin(a + sw) * l, p[2]]; const A = proj(cam, ...p), B = proj(cam, ...q); if (A && B) { g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = Math.max(1, w * A[2]); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); }
    if (d < 5) { br(q, a - 0.35 - r() * 0.45, l * 0.72, w * 0.62, d + 1); br(q, a + 0.3 + r() * 0.45, l * 0.7, w * 0.6, d + 1); } };
  br([x, PO.lawn, z], Math.PI / 2 + 0.05, 2.6, 0.32, 0);
}
// ---------- the house front ----------
function siding(g, cam, x0, x1, y0, y1, z, col) { for (let y = y0 + 0.16; y < y1; y += 0.16) line3(g, cam, [x0, y, z - 0.001], [x1, y, z - 0.001], col, null); }
function houseWindow(g, cam, E, x0, x1, y0, y1, o = {}) {
  const z = -0.001; fillQ(g, cam, [[x0 - 0.08, y0 - 0.1, z - 0.02], [x1 + 0.08, y0 - 0.1, z - 0.02], [x1 + 0.08, y1 + 0.08, z - 0.02], [x0 - 0.08, y1 + 0.08, z - 0.02]], '#3a4052');
  const sp = fillQ(g, cam, [[x0, y0, z - 0.03], [x1, y0, z - 0.03], [x1, y1, z - 0.03], [x0, y1, z - 0.03]], '#070a12');
  if (sp) { g.save(); g.beginPath(); polyPath(g, sp); g.clip(); const gr = g.createLinearGradient(sp[0][0], sp[3][1], sp[1][0], sp[0][1]); gr.addColorStop(0, 'rgba(120,140,190,0.12)'); gr.addColorStop(0.5, 'rgba(120,140,190,0)'); gr.addColorStop(1, 'rgba(120,140,190,0.08)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (o.curtain) { fillQ(g, cam, [[x0, y0, z - 0.02], [x0 + (x1 - x0) * 0.3, y0, z - 0.02], [x0 + (x1 - x0) * 0.22, y1, z - 0.02], [x0, y1, z - 0.02]], '#2a1c22', null); }
    g.restore(); }
  line3(g, cam, [(x0 + x1) / 2, y0, z - 0.035], [(x0 + x1) / 2, y1, z - 0.035], '#3a4052', null); line3(g, cam, [x0, (y0 + y1) / 2, z - 0.035], [x1, (y0 + y1) / 2, z - 0.035], '#3a4052', null);
  box3(g, cam, x0 - 0.12, x1 + 0.12, y0 - 0.16, y0 - 0.08, -0.14, 0, { front: '#454c60', top: '#555e74' });
}
function drawFacade(g, cam, E, o = {}) {
  const L = PO.lawn;
  fillQ(g, cam, [[-7, L, 0], [7, L, 0], [7, 5.6, 0], [-7, 5.6, 0]], PO.wallC);
  siding(g, cam, -7, 7, L, 5.6, 0, 'rgba(8,10,18,0.45)');
  // foundation band
  fillQ(g, cam, [[-7, L, -0.005], [7, L, -0.005], [7, 0.05, -0.005], [-7, 0.05, -0.005]], '#1c1f28');
  // roof eave + gutter + a slice of roof
  box3(g, cam, -7.3, 7.3, 5.55, 5.75, -0.55, 0.0, { front: '#151820', bottom: '#11131a', top: '#1d2029' });
  fillQ(g, cam, [[-7.3, 5.75, -0.55], [7.3, 5.75, -0.55], [7.3, 8.2, 3.0], [-7.3, 8.2, 3.0]], '#11131b');
  for (let k = 1; k < 9; k++) line3(g, cam, [-7.3, 5.75 + k * 0.27, -0.55 + k * 0.39], [7.3, 5.75 + k * 0.27, -0.55 + k * 0.39], 'rgba(40,46,60,0.5)', null);
  box3(g, cam, 3.3, 3.4, L, 5.6, -0.12, -0.04, { front: '#3a3f4c', side: '#2c303a' });
  // windows (+ the arched one above the door)
  houseWindow(g, cam, E, 1.55, 2.95, 0.75, 2.15, { curtain: 1 }); houseWindow(g, cam, E, -3.25, -1.85, 0.75, 2.15);
  houseWindow(g, cam, E, 1.2, 2.4, 3.4, 4.6, { curtain: 1 }); houseWindow(g, cam, E, -2.6, -1.4, 3.4, 4.6);
  { const pts = [[0.55, 3.0, -0.03], [-0.55, 3.0, -0.03]]; for (let i = 0; i <= 12; i++) { const a = Math.PI - i / 12 * Math.PI; pts.push([Math.cos(a) * 0.55 * -1 * -1, 3.95 + Math.sin(a) * 0.45, -0.03]); }
    fillQ(g, cam, pts, '#070a12'); }
  // door surround, sidelight (dark from outside), fanlight
  fillQ(g, cam, [[-1.05, 0, -0.01], [0.55, 0, -0.01], [0.55, 2.52, -0.01], [-1.05, 2.52, -0.01]], '#3c3a40');
  fillQ(g, cam, [[-0.95, 0.35, -0.02], [-0.62, 0.35, -0.02], [-0.62, 2.05, -0.02], [-0.95, 2.05, -0.02]], '#1a1820'); fillQ(g, cam, [[-0.95, 0.02, -0.02], [-0.62, 0.02, -0.02], [-0.62, 0.35, -0.02], [-0.95, 0.35, -0.02]], '#2a2328');
  fillQ(g, cam, [[-0.45, 2.14, -0.02], [0.45, 2.14, -0.02], [0.45, 2.42, -0.02], [-0.45, 2.42, -0.02]], '#1a1820');
  // the door: deep green, four panels, brass letterbox, knocker, peephole lens
  const dz = -0.03; fillQ(g, cam, [[-0.45, 0.01, dz], [0.45, 0.01, dz], [0.45, 2.05, dz], [-0.45, 2.05, dz]], '#1f3a32');
  for (const [a, b, c, d] of [[-0.36, -0.04, 1.15, 1.95], [0.04, 0.36, 1.15, 1.95], [-0.36, -0.04, 0.12, 0.78], [0.04, 0.36, 0.12, 0.78]]) fillQ(g, cam, [[a, c, dz - 0.004], [b, c, dz - 0.004], [b, d, dz - 0.004], [a, d, dz - 0.004]], '#183029', 'rgba(4,10,8,0.85)');
  const sl = o.slot || 0; fillQ(g, cam, [[-0.2, 0.83, dz - 0.006], [0.2, 0.83, dz - 0.006], [0.2, 0.97, dz - 0.006], [-0.2, 0.97, dz - 0.006]], '#b89a5a');
  fillQ(g, cam, [[-0.17, 0.86, dz - 0.008], [0.17, 0.86, dz - 0.008], [0.17, 0.94, dz - 0.008], [-0.17, 0.94, dz - 0.008]], sl > 0.05 ? '#050404' : '#d4b878');
  disc3(g, cam, [0, 1.55, dz - 0.006], [1, 0, 0], [0, 1, 0], 0.022, '#b89a5a'); disc3(g, cam, [0, 1.55, dz - 0.008], [1, 0, 0], [0, 1, 0], 0.011, '#2a2620');
  disc3(g, cam, [0.37, 1.0, dz - 0.03], [1, 0, 0], [0, 1, 0], 0.035, '#b89a5a');
  // house number
  fillQ(g, cam, [[0.62, 1.82, -0.015], [0.98, 1.82, -0.015], [0.98, 2.08, -0.015], [0.62, 2.08, -0.015]], '#20232c');
  { const c = proj(cam, 0.8, 1.95, -0.02); if (c && c[2] > 60) { g.fillStyle = '#c8b070'; g.font = `900 ${Math.round(0.2 * c[2])}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('27', c[0], c[1]); } }
  // doorbell: plate + glowing ring + button (pressed = pushed in)
  const B = PO.button, pr = o.press || 0;
  box3(g, cam, B[0] - 0.045, B[0] + 0.045, B[1] - 0.07, B[1] + 0.07, B[2] - 0.012, 0, { front: '#3a3a3e', side: '#2a2a2e', top: '#4a4a50' });
  disc3(g, cam, [B[0], B[1], B[2] - 0.013], [1, 0, 0], [0, 1, 0], 0.026, rgb(mixc([60, 80, 90], [140, 230, 255], o.bellLit == null ? 1 : o.bellLit)), KC.ink, 18);
  disc3(g, cam, [B[0], B[1], B[2] - 0.022 + pr * 0.009], [1, 0, 0], [0, 1, 0], 0.017, '#9a9aa0', KC.ink, 16);
  { const c = proj(cam, B[0], B[1], B[2] - 0.013); if (c) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, c[0], c[1], 0.09 * c[2], [120, 220, 255], 0.45 * (o.bellLit == null ? 1 : o.bellLit)); g.restore(); } }
  // the lantern: bracket, cage, hot bulb
  const Lp = PO.lantern; box3(g, cam, Lp[0] - 0.03, Lp[0] + 0.03, Lp[1] + 0.05, Lp[1] + 0.12, Lp[2], 0, { front: '#151515' });
  box3(g, cam, Lp[0] - 0.1, Lp[0] + 0.1, Lp[1] - 0.18, Lp[1] + 0.12, Lp[2] - 0.1, Lp[2] + 0.1, { front: 'rgba(255,214,150,0.85)', side: 'rgba(255,200,130,0.75)', top: '#151515', bottom: '#151515' });
  for (const dx of [-0.1, 0, 0.1]) line3(g, cam, [Lp[0] + dx, Lp[1] - 0.18, Lp[2] - 0.101], [Lp[0] + dx, Lp[1] + 0.12, Lp[2] - 0.101], '#151515', null);
  fillQ(g, cam, [[Lp[0] - 0.13, Lp[1] + 0.12, Lp[2] - 0.13], [Lp[0] + 0.13, Lp[1] + 0.12, Lp[2] - 0.13], [Lp[0], Lp[1] + 0.26, Lp[2]]], '#151515');
  // bushes in front of the wall
  for (const [x, w] of [[-2.6, 1.3], [2.3, 1.5], [-5, 1.2], [4.8, 1.4]]) { const p = proj(cam, x, L, -0.45); if (!p) continue; const s = p[2], sw = Math.sin(E.t * 1.1 + x) * 0.02 * s;
    g.fillStyle = '#0c1612'; for (let k = 0; k < 5; k++) { ell(g, p[0] + (k - 2) * w * 0.2 * s + sw, p[1] - 0.45 * s - (k % 2) * 0.12 * s, w * 0.28 * s, 0.42 * s); g.fill(); }
    g.fillStyle = 'rgba(40,60,46,0.6)'; ell(g, p[0] - w * 0.1 * s + sw, p[1] - 0.75 * s, w * 0.2 * s, 0.14 * s); g.fill(); }
}
function drawPorchSlab(g, cam, E) {
  box3(g, cam, -1.6, 1.6, PO.lawn, 0, PO.slabZ, 0, { front: '#2c2e36', top: '#3a3d47', side: '#24262e' });
  for (let x = -1.6; x < 1.6; x += 0.4) line3(g, cam, [x, 0.001, PO.slabZ], [x, 0.001, 0], 'rgba(10,10,14,0.4)', null);
  box3(g, cam, -0.85, 0.85, PO.lawn, -0.12, -1.9, PO.slabZ, { front: '#2c2e36', top: '#3a3d47', side: '#24262e' });
  box3(g, cam, -0.85, 0.85, PO.lawn, -0.24, -2.2, -1.9, { front: '#2c2e36', top: '#3a3d47', side: '#24262e' });
  // doormat + a potted plant
  fillQ(g, cam, [[-0.45, 0.003, -0.7], [0.45, 0.003, -0.7], [0.45, 0.003, -0.12], [-0.45, 0.003, -0.12]], '#4a3a26', 'rgba(10,8,4,0.7)');
  box3(g, cam, 1.05, 1.35, 0, 0.32, -0.75, -0.45, { front: '#6a3a2a', side: '#55301f', top: '#2a1a12' });
  { const c = proj(cam, 1.2, 0.32, -0.6); if (c) { g.fillStyle = '#16261c'; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.35 + Math.sin(E.t * 1.4 + k) * 0.05; g.beginPath(); g.ellipse(c[0] + Math.cos(a) * 0.18 * c[2], c[1] + Math.sin(a) * 0.2 * c[2], 0.05 * c[2], 0.16 * c[2], a + Math.PI / 2, 0, TAU); g.fill(); } } }
}
// warm lantern light: wall glow, pool on the porch, moths circling the bulb
function lanternLight(g, cam, E) {
  const k = E.lantern; if (k <= 0) return; const Lp = PO.lantern, c = proj(cam, Lp[0], Lp[1] - 0.03, Lp[2] - 0.1); g.save(); g.globalCompositeOperation = 'lighter';
  if (c) { glow(g, c[0], c[1], Math.min(2.4 * c[2], 900), [255, 170, 90], 0.16 * k); glow(g, c[0], c[1], 0.5 * c[2], [255, 225, 170], 0.55 * k); glow(g, c[0], c[1], 0.15 * c[2], [255, 245, 220], 0.9 * k); }
  const pc = proj(cam, -0.6, 0.001, -0.6), pf = proj(cam, -0.6, 0.001, -2.0); if (pc) { const rx = 2.4 * pc[2], ry = Math.max(10, pf ? Math.abs(pf[1] - pc[1]) * 0.9 : rx * 0.25); g.save(); g.translate(pc[0], pc[1]); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgb([255, 180, 100], 0.16 * k)); gr.addColorStop(1, rgb([255, 160, 80], 0)); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
  g.restore();
  for (let i = 0; i < 5; i++) { const a = E.t * (3 + i * 0.9) + i * 1.7, rr_ = 0.12 + (i % 3) * 0.06, m = proj(cam, Lp[0] + Math.cos(a) * rr_, Lp[1] + Math.sin(a * 1.3) * rr_ * 0.8, Lp[2] - 0.15 + Math.sin(a) * 0.1); if (!m) continue;
    const fl = Math.abs(Math.sin(E.t * 30 + i)); g.fillStyle = 'rgba(70,52,38,0.95)'; ell(g, m[0], m[1], 0.012 * m[2] * (0.5 + fl), 0.007 * m[2]); g.fill(); }
}
// ---------- the whole outside: extras [{x, z, draw}] ----------
function porchScene(g, cam, E, extras = [], o = {}) {
  drawSky(g, cam, E); drawBats(g, cam, E);
  const sp = [];
  for (const h of FARH) sp.push({ x: (h.x0 + h.x1) / 2, z: h.z, draw: () => drawFarHouse(g, cam, E, h) });
  for (const tr of FART) sp.push({ x: tr.x, z: tr.z, draw: () => { const p = proj(cam, tr.x, -0.42, tr.z); if (!p) return; const fk = fkz(E, cam, tr.x, 0, tr.z); if (tr.dead) drawDeadTree(g, p[0], p[1], tr.h * p[2], E, fk, tr.seed); else drawPine(g, p[0], p[1], tr.h * p[2], tr.h * 0.75 * p[2], E, fk, tr.seed, false); } });
  sp.sort((a, b) => camSpace(cam, b.x, 0, b.z)[2] - camSpace(cam, a.x, 0, a.z)[2]).forEach(s => s.draw());
  fogBands(g, cam, E, 0.55);
  porchGround(g, cam, E); porchLampPools(g, cam, E);
  if (o.under) o.under(g, cam, E);
  const it = [];
  for (const L of PLAMPS) it.push({ x: L.x, z: L.z, draw: () => drawPLamp(g, cam, E, L) });
  it.push({ x: 0, z: PO.fence, draw: () => drawFence(g, cam, E) });
  it.push({ x: -4.2, z: -5.5, draw: () => drawGardenTree(g, cam, E) });
  for (const tf of TUFTS) it.push({ x: tf.x, z: tf.z, draw: () => drawTuft(g, cam, E, tf) });
  for (let z = -3; z > -30; z -= 6) it.push({ x: 0, z, draw: () => groundFog(g, cam, E, z, 0.7) });
  if (cam.z < 0) { it.push({ x: 0, z: -0.8, draw: () => drawPorchSlab(g, cam, E) }); }
  for (const x of extras) it.push(x);
  it.forEach(s => s.d = camSpace(cam, s.x == null ? 0 : s.x, cam.y, s.z)[2]);
  if (cam.z < 0 && Math.abs(cam.yaw || 0) < 90) drawFacade(g, cam, E, o);   // the house is the backdrop when looking at it
  it.filter(s => s.d > 0.05 || s.always).sort((a, b) => b.d - a.d).forEach(s => s.draw(g, cam, E));
  lanternLight(g, cam, E);
  if (E.motes) motes(g, E, E.motes * 0.6, 3);
  if (o.over) o.over(g, cam, E);
}

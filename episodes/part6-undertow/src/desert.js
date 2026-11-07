// ---------- Part 5 world: a lonely gas station on a desert highway at 3 a.m. (2.5D perspective, same comic look) ----------
const GAS = {
  road: -9, apron: [-4.5, 15.5, -12, 33],
  canopy: { x0: -1.6, x1: 10.6, z0: 3, z1: 15, h: 4.6, th: 0.75 },
  islands: [1.6, 7.4], islandZ: [6.8, 11.2], pumpZ: 9,
  car: { x: 4.5, z: 6.6 },
  store: { x0: -2, x1: 12.5, z0: 23, z1: 30, h: 3.8, door: [4.8, 6.4] },
  sign: { x: -3.4, z: 0.5, h: 8.2 },
};
const DES = { sand: hex('#2b2a34'), sandNear: hex('#17161c'), concrete: hex('#2c2d34'), lamp: [255, 226, 170] };
const DESW = (() => {
  const r = rng(53), cacti = [], josh = [], rocks = [], bush = [], poles = [], specks = [];
  const free = (x, z) => !(x > GAS.apron[0] - 2 && x < GAS.apron[1] + 2 && z > GAS.apron[2] - 2 && z < GAS.apron[3] + 4) && Math.abs(x - GAS.road) > 5;
  for (let i = 0; i < 220; i++) { const x = -70 + r() * 150, z = -10 + r() * 260; if (!free(x, z)) continue; const k = r();
    if (k < 0.35) cacti.push({ x, z, h: 3 + r() * 4.5, arms: r(), seed: r() * 100 }); else if (k < 0.55) josh.push({ x, z, h: 3.5 + r() * 3.5, seed: r() * 100 }); else rocks.push({ x, z, s: 0.4 + r() * 1.6, seed: r() * 100 }); }
  for (let i = 0; i < 160; i++) { const x = -50 + r() * 100, z = -6 + r() * 120; if (!free(x, z)) continue; bush.push({ x, z, s: 0.3 + r() * 0.6, seed: r() * 100 }); }
  for (let z = -60; z < 500; z += 34) poles.push({ x: GAS.road - 5.2, z });
  for (let i = 0; i < 500; i++) { const x = -30 + r() * 60, z = -6 + r() * 60; if (!free(x, z)) continue; specks.push({ x, z, s: 0.03 + r() * 0.06, a: r() }); }
  return { cacti, josh, rocks, bush, poles, specks };
})();
// ---------- 3D helpers: polygons clipped at the near plane ----------
function projPoly(cam, pts) {
  const n = 0.12, out = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], da = DZ(cam, a[2]) - n, db = DZ(cam, b[2]) - n;
    if (da >= 0) out.push(a); if ((da >= 0) !== (db >= 0)) { const k = da / (da - db); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]); } }
  return out.map(p => { const q = proj(cam, p[0], p[1], p[2]); return [q[0], q[1]]; });
}
function poly3(g, cam, pts, fill, stroke, lw) { const q = projPoly(cam, pts); if (q.length < 3) return null; poly(g, q); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 2; g.lineJoin = 'round'; g.stroke(); } return q; }
function box3(g, cam, x0, x1, y0, y1, z0, z1, c, ink, lw = 2) {   // c: {front, side, top, bottom}
  if (cam.x < x0 && c.side) poly3(g, cam, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], c.side, ink, lw);
  if (cam.x > x1 && c.side) poly3(g, cam, [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], c.side, ink, lw);
  if (cam.y > y1 && c.top) poly3(g, cam, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], c.top, ink, lw);
  if (cam.y < y0 && c.bottom) poly3(g, cam, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], c.bottom, ink, lw);
  if (cam.z > z1 && (c.back || c.front)) poly3(g, cam, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], c.back || c.front, ink, lw);
  if (cam.z < z0 && c.front) poly3(g, cam, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], c.front, ink, lw);
}
const fcol = (c, E, fk) => rgb(mixc(c, E.P.fog, fk));
function soundRings(g, x, y, t, t0, s = 1, col = [190, 220, 255], dur = 1.1, n = 3) {
  for (let i = 0; i < n; i++) { const a = t - t0 - i * 0.18; if (a < 0 || a > dur) continue; const k = a / dur;
    g.strokeStyle = rgb(col, 0.75 * (1 - k)); g.lineWidth = 6 * s * (1 - k * 0.6); g.beginPath(); g.ellipse(x, y, (30 + k * 220) * s, (12 + k * 80) * s, 0, 0, TAU); g.stroke(); }
}
// ---------- ground: sand, highway, concrete apron, light pools ----------
function drawDesertGround(g, cam, E, o = {}) {
  const P = E.P, hy = cam.hy, dawn = E.dawn, lamps = o.lamps == null ? 1 : o.lamps;
  const sand = mixc(DES.sand, hex('#7a5f5a'), dawn), sandN = mixc(DES.sandNear, hex('#3a2e2e'), dawn);
  const gr = g.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, rgb(P.fog)); gr.addColorStop(0.07, rgb(mixc(sand, P.fog, 0.45))); gr.addColorStop(0.35, rgb(sand)); gr.addColorStop(1, rgb(sandN));
  g.fillStyle = gr; g.fillRect(0, hy - 2, W, H - hy + 2);
  const fl = cam.flip ? -1 : 1, zn = cam.z + 0.2 * fl, zf = cam.z + 900 * fl;
  // sand ripples (long soft lines, far → near)
  g.lineCap = 'round';
  for (let i = 0; i < (cam.flip ? 0 : 26); i++) { const z = cam.z + 2 + Math.pow(i / 26, 1.6) * 80, a = proj(cam, -40, 0, z), b = proj(cam, 40, 0, z); if (!a) continue;
    g.strokeStyle = rgb(mixc([70, 68, 82], P.fog, fogK(E, z - cam.z)), 0.22); g.lineWidth = Math.max(1, a[2] * 0.015); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(W / 2 + Math.sin(i * 3.1) * 200, a[1] + Math.sin(i) * a[2] * 0.05, b[0], b[1]); g.stroke(); }
  // highway
  const rd = projPoly(cam, [[GAS.road - 3.6, 0, zn], [GAS.road + 3.6, 0, zn], [GAS.road + 3.6, 0, zf], [GAS.road - 3.6, 0, zf]]);
  if (rd.length > 2) { const rg = g.createLinearGradient(0, hy, 0, H); rg.addColorStop(0, rgb(P.fog)); rg.addColorStop(0.1, rgb(mixc(P.road, P.fog, 0.45))); rg.addColorStop(1, rgb(P.road)); g.fillStyle = rg; poly(g, rd); g.fill(); }
  for (const ex of [GAS.road - 3.4, GAS.road + 3.4]) { const L = projPoly(cam, [[ex - 0.08, 0, zn], [ex + 0.08, 0, zn], [ex + 0.08, 0, zf], [ex - 0.08, 0, zf]]); if (L.length > 2) { g.fillStyle = rgb(mixc([170, 172, 168], P.fog, 0.4), 0.6); poly(g, L); g.fill(); } }
  for (let z = Math.floor(cam.z / 9) * 9; z < cam.z + (cam.flip ? -1 : 200); z += 9) { if (z + 3.5 < zn) continue; const fk = fogK(E, Math.max(z, zn) - cam.z);
    const q = projPoly(cam, [[GAS.road - 0.07, 0, Math.max(z, zn)], [GAS.road + 0.07, 0, Math.max(z, zn)], [GAS.road + 0.07, 0, z + 3.5], [GAS.road - 0.07, 0, z + 3.5]]); if (q.length > 2) { g.fillStyle = rgb(mixc([214, 168, 40], P.fog, fk * 0.9)); poly(g, q); g.fill(); } }
  // concrete apron with expansion joints
  const A = GAS.apron;
  if (cam.flip || A[3] > zn) {
    const z0 = cam.flip ? A[2] : Math.max(A[2], zn), zE = cam.flip ? Math.min(A[3], zn) : A[3], ap = projPoly(cam, [[A[0], 0, z0], [A[1], 0, z0], [A[1], 0, zE], [A[0], 0, zE]]);
    if (ap.length > 2) { const cc = mixc(DES.concrete, hex('#6d6260'), dawn), fk = fogK(E, Math.max(4, A[2] + 20 - cam.z)); g.fillStyle = rgb(mixc(cc, P.fog, fk * 0.3)); poly(g, ap); g.fill();
      g.save(); poly(g, ap); g.clip(); g.strokeStyle = 'rgba(10,10,14,0.35)'; g.lineWidth = 2;
      for (let x = A[0]; x <= A[1]; x += 4) { const q = projPoly(cam, [[x, 0, z0], [x + 0.001, 0, z0], [x + 0.001, 0, zE], [x, 0, zE]]); if (q.length > 2) { g.beginPath(); g.moveTo(q[0][0], q[0][1]); g.lineTo(q[q.length - 1][0], q[q.length - 1][1]); g.stroke(); } }
      for (let z = Math.ceil(z0 / 4) * 4; z < zE; z += 4) { const a = proj(cam, A[0], 0, z), b = proj(cam, A[1], 0, z); if (a && b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
      // oil stains
      [[3.8, 9.5, 0.7], [5.2, 12, 0.5], [0.4, 18, 0.9], [8.8, 20, 0.6]].forEach(s => { const p = proj(cam, s[0], 0, s[1]); if (!p) return; g.fillStyle = 'rgba(8,8,10,0.35)'; ell(g, p[0], p[1], s[2] * p[2], s[2] * p[2] * Math.max(0.05, cam.y / p[3])); g.fill(); });
      g.restore(); }
  }
  // light pools: canopy lights + store windows (warm, steady)
  if (lamps > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const C = GAS.canopy;
    for (const [lx, lz, r, a] of [[1.2, 6.5, 6, 0.2], [7.8, 6.5, 6, 0.2], [1.2, 12, 6, 0.18], [7.8, 12, 6, 0.18], [5, 24, 9, 0.12]]) { const p = proj(cam, lx, 0, lz); if (!p) continue;
      g.save(); g.translate(p[0], p[1]); g.scale(1, Math.max(0.04, (cam.y + 0.02) / p[3])); glow(g, 0, 0, Math.min(r * p[2], 4000), DES.lamp, a * lamps * (1 - dawn * 0.7)); g.restore(); }
    g.restore(); }
  // tiny pebbles in the sand near the camera
  for (const s of DESW.specks) { const p = proj(cam, s.x, 0, s.z); if (!p || p[3] > 40) continue; g.fillStyle = rgb(mixc([12, 12, 16], P.fog, fogK(E, p[3])), 0.5 + 0.3 * s.a); ell(g, p[0], p[1], s.s * p[2], s.s * p[2] * 0.5); g.fill(); }
}
// ---------- props ----------
function drawSaguaro(g, x, y, h, E, fk, arms, seed) {
  const col = fcol([26, 40, 34], E, fk), colL = fcol([48, 66, 56], E, fk), ink = fcol([6, 8, 8], E, fk), w = h * 0.13, sway = 0;
  const trunk = () => { rr(g, x - w / 2, y - h, w, h, w / 2); };
  g.lineWidth = Math.max(1, h * 0.012); g.strokeStyle = ink;
  const arm = (sd, ay, ah) => { g.fillStyle = col; g.beginPath(); g.moveTo(x + sd * w * 0.4, y - ay); g.lineTo(x + sd * w * 1.4, y - ay); g.lineTo(x + sd * w * 1.4, y - ay - ah); g.arc(x + sd * w * 1.4 - sd * w * 0.0, y - ay - ah, w * 0.38, Math.PI, 0, false);
    g.lineTo(x + sd * w * 1.78 - (sd < 0 ? w * 0.76 : 0) + (sd < 0 ? w * 0 : 0), y - ay - ah); g.closePath(); };
  // arms as rounded L-shapes
  const L = (sd, ay, ah) => { g.fillStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x, y - ay); g.lineTo(x + sd * w * 1.3, y - ay); g.lineTo(x + sd * w * 1.3, y - ay - ah); g.strokeStyle = ink; g.lineWidth = w * 0.78 + Math.max(2, h * 0.02); g.stroke(); g.strokeStyle = col; g.lineWidth = w * 0.78; g.stroke(); g.strokeStyle = colL; g.lineWidth = w * 0.18; g.beginPath(); g.moveTo(x + sd * w * 1.3 - w * 0.15, y - ay - w * 0.2); g.lineTo(x + sd * w * 1.3 - w * 0.15, y - ay - ah); g.stroke(); };
  if (arms > 0.25) L(-1, h * 0.42, h * 0.3); if (arms > 0.55) L(1, h * 0.55, h * 0.22);
  trunk(); g.fillStyle = col; g.fill(); g.strokeStyle = ink; g.lineWidth = Math.max(2, h * 0.02); g.stroke();
  g.save(); trunk(); g.clip(); g.fillStyle = colL; g.fillRect(x - w * 0.42, y - h, w * 0.22, h); g.strokeStyle = fcol([12, 18, 16], E, fk); g.lineWidth = Math.max(1, w * 0.05); for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - w / 2 + w * i / 4, y - h); g.lineTo(x - w / 2 + w * i / 4, y); g.stroke(); } g.restore();
}
function drawJoshua(g, x, y, h, E, fk, seed) {
  const r = rng(seed * 1000 | 0), ink = fcol([10, 10, 12], E, fk), col = fcol([30, 30, 30], E, fk), leaf = fcol([36, 50, 40], E, fk);
  g.lineCap = 'round'; const tips = [];
  const br = (x0, y0, a, l, w, d) => { const sw = Math.sin(E.t * 0.6 + seed + d) * 0.02 * d, x1 = x0 + Math.cos(a + sw) * l, y1 = y0 + Math.sin(a + sw) * l;
    g.strokeStyle = ink; g.lineWidth = w + 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
    if (d < 3) { br(x1, y1, a - 0.5 - r() * 0.4, l * 0.7, w * 0.7, d + 1); br(x1, y1, a + 0.4 + r() * 0.4, l * 0.65, w * 0.7, d + 1); } else tips.push([x1, y1]); };
  br(x, y, -Math.PI / 2 + (r() - 0.5) * 0.3, h * 0.45, h * 0.07, 0);
  for (const [tx, ty] of tips) { g.strokeStyle = leaf; g.lineWidth = Math.max(1, h * 0.012); g.beginPath(); for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.35; g.moveTo(tx, ty); g.lineTo(tx + Math.cos(a) * h * 0.07, ty + Math.sin(a) * h * 0.07); } g.stroke(); }
}
function drawRock(g, x, y, s, E, fk, seed) {
  const r = rng(seed * 997 | 0), pts = []; for (let k = 0; k < 7; k++) { const a = Math.PI + k / 6 * Math.PI; pts.push([x + Math.cos(a) * s * (0.8 + r() * 0.35), y + Math.sin(a) * s * (0.5 + r() * 0.25)]); }
  g.fillStyle = fcol([34, 30, 36], E, fk); poly(g, pts); g.fill(); g.strokeStyle = fcol([8, 8, 10], E, fk); g.lineWidth = Math.max(1, s * 0.05); g.stroke();
  g.fillStyle = fcol([70, 66, 80], E, fk); poly(g, [pts[2], pts[3], pts[4], [x, y - s * 0.15]]); g.fill();
}
function drawBush(g, x, y, s, E, fk, seed) {
  g.strokeStyle = fcol([30, 32, 26], E, fk); g.lineWidth = Math.max(1, s * 0.04); g.beginPath();
  for (let k = 0; k < 9; k++) { const a = -Math.PI * (0.1 + 0.8 * k / 8), l = s * (0.7 + hash(seed + k) * 0.4); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l + Math.sin(E.t * 1.2 + seed + k) * s * 0.05, y + Math.sin(a) * l * 0.8); } g.stroke();
}
function tumbleweed(g, x, y, s, rot, E, fk) {
  g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = fcol([90, 74, 58], E, fk); g.lineWidth = Math.max(1, s * 0.04);
  for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(0, 0, s * (0.5 - k * 0.04), s * (0.36 + k * 0.03), k * 0.55, 0, TAU); g.stroke(); } g.restore();
}
function drawCar3D(g, cam, E, x, z, o = {}) {   // your car: sides as 3D planes + the detailed rear
  const x0 = x - 0.95, x1 = x + 0.95, z1 = z + 4.3, body = rgb([30, 44, 74]), bodyS = rgb([20, 30, 52]), ink = '#06080d', glass = '#0c1220';
  const door = o.door || 0;   // 0..1 driver door ripped away (left side, front half)
  for (const sx of [x0, x1]) { if ((sx === x0) !== (cam.x < x0)) continue; if (cam.x >= x0 && cam.x <= x1) continue;
    poly3(g, cam, [[sx, 0.28, z], [sx, 0.28, z1], [sx, 0.95, z1], [sx, 0.95, z]], bodyS, ink, 2);
    poly3(g, cam, [[sx + (sx === x0 ? 0.15 : -0.15), 0.95, z + 0.5], [sx + (sx === x0 ? 0.15 : -0.15), 0.95, z1 - 0.9], [sx + (sx === x0 ? 0.3 : -0.3), 1.42, z1 - 1.6], [sx + (sx === x0 ? 0.3 : -0.3), 1.42, z + 1.1]], glass, ink, 2);
    for (const wz of [z + 0.75, z1 - 0.8]) { const p = proj(cam, sx, 0.33, wz); if (p) { g.fillStyle = '#0b0c0f'; ell(g, p[0], p[1], Math.max(2, 0.36 * p[2] * Math.abs(cam.x - sx) / p[3] * 0.9 + 0.08 * p[2]), 0.34 * p[2]); g.fill(); } }
    if (sx === x0) { const fd = proj(cam, x0, 0.75, z + 0.9); if (fd) { g.fillStyle = '#1a2440'; rr(g, fd[0] - fd[2] * 0.06, fd[1] - fd[2] * 0.08, fd[2] * 0.12, fd[2] * 0.14, fd[2] * 0.02); g.fill(); g.strokeStyle = ink; g.lineWidth = 1.5; g.stroke(); } }
  }
  if (cam.y > 1.42) poly3(g, cam, [[x0 + 0.3, 1.42, z + 1.1], [x1 - 0.3, 1.42, z + 1.1], [x1 - 0.3, 1.42, z1 - 1.6], [x0 + 0.3, 1.42, z1 - 1.6]], body, ink, 2);
  const p = cam.flip ? proj(cam, x, 0, z1) : proj(cam, x, 0, z); if (p && (cam.flip ? cam.z > z1 : cam.z < z)) drawCarRear(g, p[0], p[1], p[2], E, { tail: 0, driver: false, fk: 0 });
}
function drawPumpIsland(g, cam, E, ix, o = {}) {
  const Z = GAS.islandZ, ink = '#0b0b0e';
  box3(g, cam, ix - 0.55, ix + 0.55, 0, 0.18, Z[0], Z[1], { front: '#8c8a86', side: '#6f6d6a', top: '#a9a69f' }, ink, 1.5);
  // bollards at the ends (yellow)
  for (const bz of [Z[0] + 0.2, Z[1] - 0.2]) box3(g, cam, ix - 0.09, ix + 0.09, 0.18, 1.0, bz - 0.09, bz + 0.09, { front: '#d6a12a', side: '#a37a1d', top: '#e8c25a' }, ink, 1.5);
  // the pump
  const pz0 = GAS.pumpZ - 0.4, pz1 = GAS.pumpZ + 0.4;
  box3(g, cam, ix - 0.36, ix + 0.36, 0.18, 1.0, pz0, pz1, { front: '#a42b25', side: '#7c1f1b', top: '#c23b2b' }, ink, 2);
  box3(g, cam, ix - 0.36, ix + 0.36, 1.0, 1.95, pz0, pz1, { front: '#d9d6cf', side: '#b3afa7', top: '#ece9e2' }, ink, 2);
  box3(g, cam, ix - 0.4, ix + 0.4, 1.95, 2.15, pz0 - 0.05, pz1 + 0.05, { front: '#a42b25', side: '#7c1f1b', top: '#c23b2b' }, ink, 2);
  // screens + digits on the faces turned to the camera (left/right sides face the cars)
  for (const sx of [ix - 0.36, ix + 0.36]) { if ((sx < ix) !== (cam.x < ix - 0.36)) continue; if (cam.x > ix - 0.36 && cam.x < ix + 0.36) continue;
    const q = poly3(g, cam, [[sx, 1.35, pz0 + 0.12], [sx, 1.35, pz1 - 0.12], [sx, 1.75, pz1 - 0.12], [sx, 1.75, pz0 + 0.12]], '#0d2a2a', ink, 1.5);
    if (q) { g.save(); g.globalCompositeOperation = 'lighter'; const c = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2]; glow(g, c[0], c[1], Math.abs(q[2][1] - q[0][1]) * 1.4, [80, 230, 200], 0.35); g.restore();
      g.fillStyle = '#7ff0d0'; for (let k = 0; k < 4; k++) { const a = [lerp(q[0][0], q[1][0], 0.15 + k * 0.2), lerp(lerp(q[0][1], q[3][1], 0.5), lerp(q[1][1], q[2][1], 0.5), 0.15 + k * 0.2)]; g.fillRect(a[0] - 2, a[1] - 4, 4, 8); } }
    // nozzle holster + hose
    const n = proj(cam, sx, 1.15, pz1 - 0.15); if (n && !(o.nozzleOut && sx > ix)) { g.fillStyle = '#111'; rr(g, n[0] - n[2] * 0.05, n[1] - n[2] * 0.12, n[2] * 0.1, n[2] * 0.2, n[2] * 0.02); g.fill(); }
  }
}
function drawCanopyUnder(g, cam, E, o = {}) {   // the underside (drawn early: things beneath it go in front)
  const C = GAS.canopy, lit = (o.lamps == null ? 1 : o.lamps);
  if (cam.y < C.h) {
    poly3(g, cam, [[C.x0, C.h, C.z0], [C.x1, C.h, C.z0], [C.x1, C.h, C.z1], [C.x0, C.h, C.z1]], rgb(mixc([50, 50, 54], [128, 124, 116], lit * (1 - E.dawn * 0.5))), '#0b0b0e', 2);
    // light panels
    for (const lx of [0.3, 3.3, 6.3]) for (const lz of [5, 9.2, 12.6]) {
      const q = poly3(g, cam, [[lx, C.h - 0.02, lz], [lx + 2.4, C.h - 0.02, lz], [lx + 2.4, C.h - 0.02, lz + 1.0], [lx, C.h - 0.02, lz + 1.0]], rgb(mixc([90, 88, 84], [255, 248, 225], lit)), null);
      if (q && lit > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const c = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2], rr_ = Math.min(900, Math.hypot(q[2][0] - q[0][0], q[2][1] - q[0][1]) * 1.3); glow(g, c[0], c[1], rr_, DES.lamp, 0.16 * lit); g.restore(); }
    }
  }
}
function drawCanopyFront(g, cam, E, o = {}) {
  const C = GAS.canopy, y0 = C.h, y1 = C.h + C.th, ink = '#0b0b0e', lit = (o.lamps == null ? 1 : o.lamps);
  const fw = rgb(mixc([150, 148, 144], [228, 225, 218], 0.5 + 0.5 * E.dawn)), fs = rgb(mixc([110, 108, 106], [200, 196, 190], 0.4 + 0.4 * E.dawn));
  box3(g, cam, C.x0, C.x1, y0, y1, C.z0, C.z1, { front: fw, side: fs, top: '#2a2b30' }, ink, 2.5);
  if (cam.z < C.z0) { poly3(g, cam, [[C.x0, y0 + 0.2, C.z0 - 0.01], [C.x1, y0 + 0.2, C.z0 - 0.01], [C.x1, y0 + 0.42, C.z0 - 0.01], [C.x0, y0 + 0.42, C.z0 - 0.01]], '#b8241e', null);
    const p = proj(cam, (C.x0 + C.x1) / 2, y0 + 0.58, C.z0 - 0.02); if (p) { g.fillStyle = '#b8241e'; g.font = `900 ${Math.max(6, p[2] * 0.26)}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FUEL  ·  OPEN 24 HRS', p[0], p[1]); } }
  if (cam.x > C.x1) poly3(g, cam, [[C.x1 + 0.01, y0 + 0.2, C.z0], [C.x1 + 0.01, y0 + 0.2, C.z1], [C.x1 + 0.01, y0 + 0.42, C.z1], [C.x1 + 0.01, y0 + 0.42, C.z0]], '#8e1c17', null);
  if (cam.x < C.x0) poly3(g, cam, [[C.x0 - 0.01, y0 + 0.2, C.z0], [C.x0 - 0.01, y0 + 0.2, C.z1], [C.x0 - 0.01, y0 + 0.42, C.z1], [C.x0 - 0.01, y0 + 0.42, C.z0]], '#8e1c17', null);
}
function drawColumn(g, cam, E, x, z) { box3(g, cam, x - 0.17, x + 0.17, 0.18, GAS.canopy.h, z - 0.17, z + 0.17, { front: '#bdb9b0', side: '#8e8b84' }, '#0b0b0e', 2); }
function drawStore(g, cam, E, o = {}) {
  const S = GAS.store, ink = '#0b0b0e', lit = 1 - E.dawn * 0.4, fk = fogK(E, S.z0 - cam.z) * 0.6, D = S.door;
  const wall = fcol(mixc([96, 86, 76], [150, 130, 112], E.dawn), E, fk), wallS = fcol([62, 56, 50], E, fk);
  box3(g, cam, S.x0, S.x1, 0, S.h, S.z0, S.z1, { front: wall, side: wallS, top: '#1d1d22' }, ink, 2.5);
  if (cam.z >= S.z0) return;
  const shattered = o.shattered || 0;
  // windows + door: warm interior with shelves
  const wins = [[S.x0 + 0.6, D[0] - 0.35], [D[0], D[1]], [D[1] + 0.35, S.x1 - 0.6]];
  wins.forEach(([a, b], wi) => { const isDoor = wi === 1, y0 = isDoor ? 0.02 : 0.55, y1 = isDoor ? 2.25 : 2.55, z = S.z0 - 0.01;
    const q = projPoly(cam, [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]]); if (q.length < 3) return;
    g.save(); poly(g, q); g.clip();
    const top = proj(cam, a, y1, z), bot = proj(cam, a, y0, z), ig = g.createLinearGradient(0, top[1], 0, bot[1]);
    ig.addColorStop(0, rgb(mixc([70, 60, 46], [255, 236, 190], lit))); ig.addColorStop(1, rgb(mixc([50, 40, 30], [214, 170, 110], lit))); g.fillStyle = ig; g.fillRect(0, 0, W, H);
    // shelves inside (slightly deeper = parallax)
    for (let k = 0; k < 4; k++) { const sx = a + 0.4 + k * 1.4; if (sx > b) break; const s0 = proj(cam, sx, 0, z + 2.2), s1 = proj(cam, sx + 0.9, 1.6, z + 2.2); if (!s0 || !s1) continue;
      g.fillStyle = 'rgba(40,30,24,0.85)'; g.fillRect(s0[0], s1[1], s1[0] - s0[0], s0[1] - s1[1]);
      for (let r = 0; r < 4; r++) { const yy = lerp(s1[1], s0[1], (r + 0.5) / 4.2); for (let j = 0; j < 5; j++) { g.fillStyle = ['#c23b2b', '#2f6b9a', '#e0b030', '#3a8a4a', '#d06a2a'][(k * 3 + r + j) % 5]; g.fillRect(lerp(s0[0], s1[0], 0.06 + j * 0.19), yy - (s0[1] - s1[1]) * 0.08, (s1[0] - s0[0]) * 0.13, (s0[1] - s1[1]) * 0.12); } } }
    // fridge glow at the back
    const fg = proj(cam, (a + b) / 2, 1.2, z + 6); if (fg) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, fg[0], fg[1], fg[2] * 2.5, [150, 210, 255], 0.18 * lit); g.restore(); }
    if (o.inside) o.inside(g, cam, E, a, b);
    // glass reflection
    const rg = g.createLinearGradient(q[0][0], q[2][1], q[1][0], q[0][1]); rg.addColorStop(0.3, 'rgba(255,255,255,0)'); rg.addColorStop(0.42, 'rgba(255,255,255,0.12)'); rg.addColorStop(0.5, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.restore();
    poly(g, q); g.strokeStyle = '#1a1a1e'; g.lineWidth = Math.max(2, top[2] * 0.06); g.stroke();
    if (isDoor) { const m = proj(cam, (a + b) / 2, 1.05, z), bw = proj(cam, b - 0.15, 1.05, z); g.strokeStyle = '#c8c8c8'; g.lineWidth = Math.max(2, m[2] * 0.04); g.beginPath(); g.moveTo(lerp(q[0][0], q[1][0], 0.15), m[1]); g.lineTo(bw[0], m[1]); g.stroke(); }
    // window glow outward
    g.save(); g.globalCompositeOperation = 'lighter'; const c = proj(cam, (a + b) / 2, 1.4, z); glow(g, c[0], c[1], Math.min(1500, (b - a) * c[2] * 0.9), [255, 200, 130], 0.16 * lit); g.restore();
  });
  // OPEN neon sign in the left window (steady red glow)
  const on = proj(cam, S.x0 + 2.2, 2.05, S.z0 - 0.02); if (on) { const s = on[2]; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, on[0], on[1], s * 0.9, [255, 50, 60], 0.35 * lit); g.restore();
    g.font = `900 ${Math.max(6, s * 0.34)}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = Math.max(1, s * 0.03); g.strokeStyle = rgb([255, 120, 130], lit); g.strokeText('OPEN', on[0], on[1]); g.fillStyle = rgb([255, 60, 70], 0.4 + 0.6 * lit); g.fillText('OPEN', on[0], on[1]); }
  // the sign band on the roof edge
  const sb = proj(cam, (S.x0 + S.x1) / 2, S.h - 0.45, S.z0 - 0.02); if (sb) { g.font = `900 ${Math.max(6, sb[2] * 0.5)}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = sb[2] * 0.06; g.strokeStyle = '#0b0b0e'; g.strokeText('DESERT STAR MART', sb[0], sb[1]); g.fillStyle = rgb(mixc([200, 60, 50], [255, 90, 70], lit)); g.fillText('DESERT STAR MART', sb[0], sb[1]); }
  // ice chest + trash can
  box3(g, cam, S.x0 + 0.4, S.x0 + 1.9, 0, 1.2, S.z0 - 0.9, S.z0 - 0.05, { front: '#d9dde2', side: '#a9adb3', top: '#eef0f2' }, ink, 2);
  const ic = proj(cam, S.x0 + 1.15, 0.75, S.z0 - 0.91); if (ic) { g.fillStyle = '#2a6fb0'; g.font = `900 ${Math.max(6, ic[2] * 0.36)}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ICE', ic[0], ic[1]); }
  box3(g, cam, D[1] + 0.6, D[1] + 1.1, 0, 0.95, S.z0 - 0.7, S.z0 - 0.2, { front: '#3a3f46', side: '#2a2e33', top: '#16181b' }, ink, 2);
  // wall lamp above the door
  const wl = proj(cam, (D[0] + D[1]) / 2, 2.75, S.z0 - 0.05); if (wl) { g.fillStyle = '#222'; rr(g, wl[0] - wl[2] * 0.2, wl[1] - wl[2] * 0.08, wl[2] * 0.4, wl[2] * 0.12, 3); g.fill(); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, wl[0], wl[1] + wl[2] * 0.1, wl[2] * 1.8, DES.lamp, 0.3 * lit); g.restore(); }
}
function drawPoleSign(g, cam, E) {
  const s = GAS.sign, ink = '#0b0b0e', p0 = proj(cam, s.x, 0, s.z), p1 = proj(cam, s.x, s.h, s.z); if (!p0 || !p1) return;
  g.strokeStyle = '#2b2c31'; g.lineWidth = Math.max(3, p0[2] * 0.22); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
  const q = poly3(g, cam, [[s.x - 1.6, s.h - 0.4, s.z], [s.x + 1.6, s.h - 0.4, s.z], [s.x + 1.6, s.h + 1.6, s.z], [s.x - 1.6, s.h + 1.6, s.z]], '#f2ebdc', ink, 3);
  if (!q) return; const c = proj(cam, s.x, s.h + 0.95, s.z), d = proj(cam, s.x, s.h + 0.12, s.z);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, c[0], c[1], c[2] * 3.2, [255, 220, 170], 0.28 * (1 - E.dawn * 0.6)); g.restore();
  g.font = `900 ${c[2] * 0.95}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c4241c'; g.fillText('GAS', c[0], c[1]);
  g.fillStyle = '#16161a'; rr(g, d[0] - d[2] * 1.2, d[1] - d[2] * 0.28, d[2] * 2.4, d[2] * 0.56, 4); g.fill(); g.fillStyle = '#ffb347'; g.font = `900 ${d[2] * 0.42}px Inter`; g.fillText('3.99⁹', d[0], d[1] + 2);
}
function drawPolesWires(g, cam, E) {
  const tops = [];
  for (const ps of DESW.poles) { const dz = DZ(cam, ps.z); if (dz < 0.6 || dz > 300) { tops.push(null); continue; } const a = proj(cam, ps.x, 0, ps.z), b = proj(cam, ps.x, 7.5, ps.z), fk = fogK(E, dz);
    g.strokeStyle = fcol([28, 22, 20], E, fk); g.lineWidth = Math.max(1.5, a[2] * 0.22); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    const c0 = proj(cam, ps.x - 1.1, 7.1, ps.z), c1 = proj(cam, ps.x + 1.1, 7.1, ps.z); g.lineWidth = Math.max(1, a[2] * 0.12); g.beginPath(); g.moveTo(c0[0], c0[1]); g.lineTo(c1[0], c1[1]); g.stroke(); tops.push([c0, c1, fk]); }
  g.lineWidth = 1.5;
  for (let i = 0; i < tops.length - 1; i++) { const a = tops[i], b = tops[i + 1]; if (!a || !b) continue; g.strokeStyle = fcol([20, 18, 20], E, b[2]);
    for (const k of [0, 1]) { g.beginPath(); g.moveTo(a[k][0], a[k][1]); g.quadraticCurveTo((a[k][0] + b[k][0]) / 2, (a[k][1] + b[k][1]) / 2 + Math.abs(a[k][1] - b[k][1]) * 0.25 + 6, b[k][0], b[k][1]); g.stroke(); } }
}
function drawMesas(g, cam, E) {   // flat-topped rock formations on the horizon
  const P = E.P, hy = cam.hy, col = rgb(mixc(mixc(P.hor, P.tree, 0.35), P.fog, 0.45)), colL = rgb(mixc(mixc(P.hor, P.tree, 0.1), P.fog, 0.35));
  [[-0.1, 0.26, 150], [0.5, 0.18, 95], [0.75, 0.3, 190], [1.05, 0.12, 70]].forEach(([cx, wd, ht], i) => { const x = cx * W - cam.x * 4, w = wd * W;
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w * 0.62, hy + 4); g.lineTo(x - w * 0.42, hy - ht * 0.82); g.lineTo(x - w * 0.36, hy - ht); g.lineTo(x + w * 0.38, hy - ht); g.lineTo(x + w * 0.45, hy - ht * 0.8); g.lineTo(x + w * 0.65, hy + 4); g.fill();
    g.fillStyle = colL; poly(g, [[x - w * 0.36, hy - ht], [x + w * 0.38, hy - ht], [x + w * 0.36, hy - ht * 0.93], [x - w * 0.34, hy - ht * 0.93]]); g.fill(); });
}
function moths(g, cam, E, k = 1) {   // moths circling the canopy lights
  if (k <= 0 || E.dawn > 0.6) return; const C = GAS.canopy;
  for (let i = 0; i < 14; i++) { const lx = [1.5, 4.5, 7.5][i % 3], lz = [5.5, 9.7, 13.1][(i >> 1) % 3], a = E.t * (2.5 + hash(i) * 2) + i * 2.1, rr_ = 0.25 + hash(i + 5) * 0.5;
    const p = proj(cam, lx + Math.cos(a) * rr_, C.h - 0.25 - hash(i + 9) * 0.5 + Math.sin(a * 1.7) * 0.12, lz + Math.sin(a) * rr_ * 0.6); if (!p || p[3] > 60) continue;
    const s = Math.max(1.5, p[2] * 0.025), fl = Math.abs(Math.sin(E.t * 30 + i)); g.fillStyle = 'rgba(255,240,210,0.9)'; ell(g, p[0] - s * fl, p[1], s * fl, s * 0.6); g.fill(); ell(g, p[0] + s * fl, p[1], s * fl, s * 0.6); g.fill(); }
}
function dust(g, E, k = 1, seed = 1, wind = 30) {   // drifting desert dust specks (no leaves here)
  if (k <= 0) return; const r = rng(seed);
  for (let i = 0; i < 90; i++) { const depth = 0.3 + r() * 0.7, x0 = r() * W, y0 = r() * H, sp = 6 + 20 * depth;
    const x = ((x0 + E.t * (wind + 40 * depth)) % (W + 40) + W + 40) % (W + 40) - 20, y = (y0 + E.t * sp + Math.sin(E.t * 0.7 + i) * 20 * depth) % (H + 20) - 10;
    g.fillStyle = rgb(mixc([215, 205, 190], [255, 220, 190], E.dawn), 0.35 * depth * k); ell(g, x, y, 1 + 2.2 * depth, 1 + 2.2 * depth); g.fill(); }
}
// full desert view; extras: [{z, draw:(g,cam,E)=>{}}]
function desertScene(g, cam, E, extras = [], o = {}) {
  drawSky(g, cam, E); drawMesas(g, cam, E); drawBats(g, cam, E); fogBands(g, cam, E, 0.55);
  drawDesertGround(g, cam, E, o);
  const sp = [];
  for (const c of DESW.cacti) { const dz = DZ(cam, c.z); if (dz < 0.5 || dz > 220) continue; sp.push({ z: c.z, draw: () => { const p = proj(cam, c.x, 0, c.z); if (!p || p[0] < -p[2] * 3 || p[0] > W + p[2] * 3) return; drawSaguaro(g, p[0], p[1], c.h * p[2], E, fogK(E, dz), c.arms, c.seed); } }); }
  for (const c of DESW.josh) { const dz = DZ(cam, c.z); if (dz < 0.5 || dz > 200) continue; sp.push({ z: c.z, draw: () => { const p = proj(cam, c.x, 0, c.z); if (!p || p[0] < -p[2] * 4 || p[0] > W + p[2] * 4) return; drawJoshua(g, p[0], p[1], c.h * p[2], E, fogK(E, dz), c.seed); } }); }
  for (const c of DESW.rocks) { const dz = DZ(cam, c.z); if (dz < 0.5 || dz > 150) continue; sp.push({ z: c.z, draw: () => { const p = proj(cam, c.x, 0, c.z); if (p) drawRock(g, p[0], p[1], c.s * p[2], E, fogK(E, dz), c.seed); } }); }
  for (const c of DESW.bush) { const dz = DZ(cam, c.z); if (dz < 0.5 || dz > 80) continue; sp.push({ z: c.z, draw: () => { const p = proj(cam, c.x, 0, c.z); if (p) drawBush(g, p[0], p[1], c.s * p[2], E, fogK(E, dz), c.seed); } }); }
  for (let i = 0; i < 3; i++) { const z = [26, 44, 70][i], per = 16 + i * 5, k = ((E.t + i * 6) % per) / per, x = lerp(-40, 50, k), dz = DZ(cam, z); if (dz < 1) continue;
    sp.push({ z, draw: () => { const bounce = Math.abs(Math.sin(k * per * 2.2)) * 0.6, p = proj(cam, x, 0.45 + bounce, z); if (p) tumbleweed(g, p[0], p[1], 0.9 * p[2], E.t * 3 + i, E, fogK(E, dz)); } }); }
  sp.push({ z: 400, draw: () => drawPolesWires(g, cam, E) });
  if (DZ(cam, GAS.store.z0) > 0.3) sp.push({ z: GAS.store.z0, draw: () => drawStore(g, cam, E, o.store || {}) });
  sp.push({ z: cam.flip ? GAS.canopy.z0 - 0.5 : GAS.canopy.z1 + 0.5, draw: () => drawCanopyUnder(g, cam, E, o) });
  for (const ix of GAS.islands) { for (const cz of [6.3, 11.7]) sp.push({ z: cz, draw: () => drawColumn(g, cam, E, ix, cz) }); sp.push({ z: GAS.islandZ[0], draw: () => drawPumpIsland(g, cam, E, ix, o.pump || {}) }); }
  if (o.car !== false) sp.push({ z: cam.flip ? GAS.car.z + 4.3 : GAS.car.z, draw: () => drawCar3D(g, cam, E, GAS.car.x, GAS.car.z, o.carO || {}) });
  if (DZ(cam, GAS.canopy.z0) > 0.2 || cam.y > GAS.canopy.h || cam.flip) sp.push({ z: cam.flip ? GAS.canopy.z1 + 0.01 : GAS.canopy.z0 - 0.01, draw: () => drawCanopyFront(g, cam, E, o) });
  sp.push({ z: GAS.sign.z, draw: () => drawPoleSign(g, cam, E) });
  if (!cam.flip) for (let z = Math.ceil(cam.z / 8) * 8; z < cam.z + 120; z += 8) sp.push({ z: z + 0.01, draw: () => groundFog(g, cam, E, z, 0.7) });
  for (const x of extras) sp.push(x);
  sp.sort((a, b) => DZ(cam, b.z) - DZ(cam, a.z)).forEach(s => s.draw(g, cam, E));
  moths(g, cam, E); moonRays(g, cam, E, 0.8); sunRays(g, cam, E);
  dust(g, E, o.dust == null ? 1 : o.dust, 2, o.wind == null ? 30 : o.wind);
}
// how much canopy light reaches a point (for warm rim light on the creature)
function canopyLight(x, z) { const C = GAS.canopy, dx = Math.max(C.x0 - x, 0, x - C.x1), dz = Math.max(C.z0 - z, 0, z - C.z1); return clamp(1 - Math.hypot(dx, dz) / 9); }
// a Mimicker sprite in the desert world (feet at world z)
function mimicSprite(z, x, pose, yaw = 0, opt = {}) {
  return { z, draw: (g, cam, E) => {
    const p = proj(cam, x, 0, z); if (!p) return;
    const fk = fogK(E, p[3]) * (opt.fogMul == null ? 0.6 : opt.fogMul);
    const L = scratch(); L.g.clearRect(0, 0, W, H);
    L.g.fillStyle = 'rgba(0,0,0,0.4)'; ell(L.g, p[0], p[1], p[2] * 0.6, p[2] * 0.09 * Math.max(0.3, cam.y / p[3] * 3)); L.g.fill();
    const RJ = drawRig(L.g, MIMIC, pose, p[0], p[1], p[2], yaw, { t: E.t, twitch: 1, ...opt });
    const lit = opt.lit == null ? canopyLight(x, z) * (1 - E.dawn) : opt.lit;
    L.g.save(); L.g.globalCompositeOperation = 'source-atop';
    if (lit > 0) { const gr = L.g.createLinearGradient(p[0] - p[2] * 1.2, 0, p[0] + p[2] * 1.2, 0); gr.addColorStop(0, `rgba(255,215,150,${0.32 * lit})`); gr.addColorStop(0.55, 'rgba(255,215,150,0)'); L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H); }
    const rg = L.g.createLinearGradient(p[0] - p[2], 0, p[0] + p[2], 0); rg.addColorStop(0.5, 'rgba(150,175,230,0)'); rg.addColorStop(1, 'rgba(150,175,230,0.16)'); L.g.fillStyle = rg; L.g.fillRect(0, 0, W, H);
    if (opt.dark) { L.g.fillStyle = `rgba(4,5,10,${opt.dark})`; L.g.fillRect(0, 0, W, H); }
    L.g.fillStyle = rgb(E.P.fog, fk * 0.9); L.g.fillRect(0, 0, W, H);
    L.g.restore();
    if (opt.dark && opt.eyesGlow !== false) { /* keep the white eyes readable in the dark */ }
    g.save(); g.globalAlpha = opt.alpha == null ? 1 : opt.alpha; g.drawImage(L.c, 0, 0);
    if (opt.eyeGlow > 0 && Math.cos(yaw * D2R) > 0.3) { const hd = RJ.P(RJ.J.head), nk = RJ.P(RJ.J.neckTop), cx = lerp(nk[0], hd[0], 0.55), cy = lerp(nk[1], hd[1], 0.55) - MIMIC.headH * p[2] * 0.15, dx = MIMIC.headW * p[2] * 0.16 * Math.cos(yaw * D2R);
      g.globalCompositeOperation = 'lighter'; for (const sd of [-1, 1]) { glow(g, cx + sd * dx, cy, Math.max(8, p[2] * 0.08), [240, 245, 225], 0.9 * opt.eyeGlow); g.fillStyle = `rgba(255,255,245,${opt.eyeGlow})`; ell(g, cx + sd * dx, cy, Math.max(1.5, p[2] * 0.012), Math.max(1.2, p[2] * 0.009)); g.fill(); } }
    g.restore();
  } };
}
function youSprite(z, x, pose, yaw, opt = {}) {
  return { z, draw: (g, cam, E) => { const p = proj(cam, x, 0, z); if (!p) return;
    g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, p[0], p[1], p[2] * 0.35, p[2] * 0.05); g.fill();
    drawRig(g, YOU, pose, p[0], p[1], p[2], yaw, { t: E.t, ...opt });
    if (opt.after) opt.after(g, p);
  } };
}
// sideways desert view (for the what-if chase): parallax layers
function sideDesert(g, E, scroll, horizon, o = {}) {
  const P = E.P; const gr = g.createLinearGradient(0, horizon - 1200, 0, horizon); gr.addColorStop(0, rgb(P.top)); gr.addColorStop(0.7, rgb(P.mid)); gr.addColorStop(1, rgb(P.hor));
  g.fillStyle = gr; g.fillRect(0, 0, W, horizon + 4);
  if (P.moon > 0) { glow(g, 820, horizon - 760, 220, [190, 205, 235], 0.2); ell(g, 820, horizon - 760, 44, 44); g.fillStyle = '#d6d3c4'; g.fill(); }
  drawBats(g, { hy: horizon }, E); drawMesas(g, { x: scroll * 0.002, hy: horizon }, E);
  [[0.25, 0.7, 0.5], [0.55, 0.4, 0.8], [1.0, 0.15, 1.2]].forEach(([par, fk, sc], li) => {
    const spacing = 260 * sc, off = (scroll * par) % spacing, n = Math.ceil(W / spacing) + 3;
    g.fillStyle = rgb(mixc(DES.sand, P.fog, fk)); g.fillRect(0, horizon + li * 30 * sc, W, H);
    for (let i = -1; i < n; i++) { const id = Math.floor((scroll * par) / spacing) + i, x = i * spacing - off + hash(id * 3 + li) * spacing * 0.5, hh = (260 + hash(id * 7 + li) * 260) * sc, y = horizon + li * 30 * sc + 10;
      const k = hash(id * 11 + li); if (k < 0.4) drawSaguaro(g, x, y, hh, E, fk, hash(id), id); else if (k < 0.6) drawJoshua(g, x, y, hh * 1.1, E, fk, id); else drawRock(g, x, y, hh * 0.18, E, fk, id); }
    const fg = g.createLinearGradient(0, horizon - 100 * sc, 0, horizon + 60 * sc); fg.addColorStop(0, rgb(P.fog, 0)); fg.addColorStop(1, rgb(P.fog, 0.3 - li * 0.06)); g.fillStyle = fg; g.fillRect(0, horizon - 100 * sc, W, 160 * sc);
  });
}

// ---------- inside the store, looking out through the glass front (flipped camera: looks toward -z) ----------
function storeHoles() { const S = GAS.store, D = S.door; return [[S.x0 + 0.6, D[0] - 0.35, 0.55, 2.55], [D[0], D[1], 0.02, 2.25], [D[1] + 0.35, S.x1 - 0.6, 0.55, 2.55]]; }
function holesPath(g, cam, z) { for (const [a, b, y0, y1] of storeHoles()) { const q = projPoly(cam, [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]]); if (q.length < 3) continue; g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]); g.closePath(); } }
// o.outside: extras in the world outside; o.onGlass(g): things pressed on the glass (clipped to the windows); o.inside: extras inside [{z, draw}]
function storeInterior(g, cam, E, o = {}) {
  const S = GAS.store, z = S.z0, ink = '#0b0b0e', warm = [255, 214, 150];
  desertScene(g, cam, E, o.outside || [], { car: o.car, carO: o.carO, dust: 0.4, store: {} });
  // things against the glass (outside), only visible through the windows
  if (o.onGlass) { g.save(); g.beginPath(); holesPath(g, cam, z); g.clip(); o.onGlass(g); g.restore(); }
  // glass: slight warm reflection of the interior + streaks + (optional) breath fog
  g.save(); g.beginPath(); holesPath(g, cam, z); g.clip();
  g.fillStyle = 'rgba(255,200,140,0.06)'; g.fillRect(0, 0, W, H);
  const rg = g.createLinearGradient(0, 0, W, H); rg.addColorStop(0.25, 'rgba(255,255,255,0)'); rg.addColorStop(0.33, 'rgba(255,240,220,0.08)'); rg.addColorStop(0.4, 'rgba(255,255,255,0)'); rg.addColorStop(0.62, 'rgba(255,240,220,0.06)'); rg.addColorStop(0.66, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  if (o.glassFx) o.glassFx(g);
  g.restore();
  // ---- the room ----
  const x0 = S.x0, x1 = S.x1, h = S.h, zb = cam.z - 0.15;
  // floor tiles
  const fq = poly3(g, cam, [[x0, 0, z], [x1, 0, z], [x1, 0, zb], [x0, 0, zb]], '#3a3530', null);
  if (fq) { g.save(); poly(g, fq); g.clip();
    for (let i = 0; i < 30; i++) for (let j = 0; j < 12; j++) { if ((i + j) % 2) continue; const tx = x0 + i * 0.5, tz = z + j * 0.5; poly3(g, cam, [[tx, 0, tz], [tx + 0.5, 0, tz], [tx + 0.5, 0, tz + 0.5], [tx, 0, tz + 0.5]], '#4a443c', null); }
    g.globalCompositeOperation = 'lighter'; const c = proj(cam, cam.x, 0, z + 2.5); if (c) { g.save(); g.translate(c[0], c[1]); g.scale(1, 0.35); glow(g, 0, 0, 900, warm, 0.12); g.restore(); }
    g.restore(); }
  // ceiling with light panels (steady)
  poly3(g, cam, [[x0, h, z], [x1, h, z], [x1, h, zb], [x0, h, zb]], '#2c2924', null);
  for (let lx = x0 + 1; lx < x1 - 1; lx += 3) for (let lz = z + 1.2; lz < zb; lz += 2.4) { const q = poly3(g, cam, [[lx, h - 0.01, lz], [lx + 1.8, h - 0.01, lz], [lx + 1.8, h - 0.01, lz + 0.5], [lx, h - 0.01, lz + 0.5]], '#fff3d8', null);
    if (q) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, (q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, 260, warm, 0.18); g.restore(); } }
  // front wall with the window + door holes
  const wq = projPoly(cam, [[x0, 0, z], [x1, 0, z], [x1, h, z], [x0, h, z]]);
  if (wq.length > 2) { g.save(); g.beginPath(); g.moveTo(wq[0][0], wq[0][1]); for (let i = 1; i < wq.length; i++) g.lineTo(wq[i][0], wq[i][1]); g.closePath(); holesPath(g, cam, z);
    const wg = g.createLinearGradient(0, proj(cam, 0, h, z)[1], 0, proj(cam, 0, 0, z)[1]); wg.addColorStop(0, '#3b342c'); wg.addColorStop(1, '#2a251f'); g.fillStyle = wg; g.fill('evenodd'); g.restore(); }
  // window frames (aluminium) + door push bar + deadbolt
  for (const [a, b, y0, y1] of storeHoles()) { const q = projPoly(cam, [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]]); if (q.length < 3) continue; poly(g, q); g.strokeStyle = '#8d8f94'; g.lineWidth = Math.max(3, proj(cam, a, y0, z)[2] * 0.06); g.stroke(); g.strokeStyle = ink; g.lineWidth = 2; g.stroke(); }
  const D = S.door, pb = proj(cam, D[0] + 0.15, 1.05, z - 0.02), pb2 = proj(cam, D[1] - 0.15, 1.05, z - 0.02);
  if (pb && pb2 && !o.doorGone) { g.strokeStyle = '#c9cbd0'; g.lineWidth = Math.max(4, pb[2] * 0.05); g.lineCap = 'round'; g.beginPath(); g.moveTo(pb[0], pb[1]); g.lineTo(pb2[0], pb2[1]); g.stroke();
    const lk = proj(cam, D[0] + 0.12, 1.35, z - 0.02); if (lk) { g.fillStyle = '#b9bcc3'; rr(g, lk[0] - lk[2] * 0.05, lk[1] - lk[2] * 0.08, lk[2] * 0.1, lk[2] * 0.16, 3); g.fill(); g.save(); g.translate(lk[0], lk[1]); g.rotate((o.lock || 0) * Math.PI / 2); g.fillStyle = '#2a2c31'; g.fillRect(-lk[2] * 0.012, -lk[2] * 0.05, lk[2] * 0.024, lk[2] * 0.1); g.restore(); } }
  // side shelves along the walls (perspective boxes full of products)
  for (const sx of [x0 + 0.05, x1 - 0.65]) for (let sz = z + 1.5; sz < zb - 0.6; sz += 1.6) {
    box3(g, cam, sx, sx + 0.6, 0, 1.7, sz, sz + 1.4, { front: '#3a2f27', side: '#4a3c31', top: '#2a221c', back: '#3a2f27' }, ink, 2);
    const inner = sx < cam.x ? sx + 0.6 : sx; for (let r = 0; r < 4; r++) { const y = 0.25 + r * 0.38; for (let k = 0; k < 4; k++) { const q = poly3(g, cam, [[inner, y, sz + 0.1 + k * 0.33], [inner, y, sz + 0.36 + k * 0.33], [inner, y + 0.26, sz + 0.36 + k * 0.33], [inner, y + 0.26, sz + 0.1 + k * 0.33]], ['#b5332a', '#2f6b9a', '#d8a92e', '#3a8a4a', '#c8662a'][(r * 2 + k + Math.round(sz)) % 5], null); } } }
  // the counter with the register (right side, near the glass)
  if (o.counter !== false) { box3(g, cam, 9.2, 12.4, 0, 1.05, z + 1.2, z + 2.2, { front: '#5a2a24', side: '#47211c', top: '#c9c3b6', back: '#5a2a24' }, ink, 2);
    box3(g, cam, 9.8, 10.5, 1.05, 1.4, z + 1.4, z + 1.9, { front: '#1f2126', side: '#16181c', top: '#2a2d33', back: '#1f2126' }, ink, 2); }
  if (o.inside) { const ins = [...o.inside].sort((a, b) => DZ(cam, b.z) - DZ(cam, a.z)); ins.forEach(it => it.draw(g, cam, E)); }
  // warm interior light + vignette
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, 200, 1100, warm, 0.06); g.restore();
}
// your car seen from the side (for the what-if chase). o.door 0..1 = the door being ripped off (flies to the left)
function sideCar(g, x, y, s, E, o = {}) {
  const ink = '#06080d', body = '#1e2c4a', bodyL = '#2b3d63', glass = '#121a2c', X = v => x + v * s, Y = v => y - v * s;
  g.fillStyle = 'rgba(0,0,0,0.4)'; ell(g, x, y, 2.4 * s, 0.12 * s); g.fill();
  g.lineJoin = 'round'; g.strokeStyle = ink; g.lineWidth = Math.max(3, s * 0.03);
  // body (car faces left: hood on the left)
  g.fillStyle = body; g.beginPath(); g.moveTo(X(-2.2), Y(0.35)); g.lineTo(X(-2.25), Y(0.8)); g.lineTo(X(-1.2), Y(0.95)); g.lineTo(X(-0.55), Y(1.42)); g.lineTo(X(0.9), Y(1.42)); g.lineTo(X(1.6), Y(0.98)); g.lineTo(X(2.2), Y(0.92)); g.lineTo(X(2.22), Y(0.35)); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = bodyL; g.fillRect(X(-2.1), Y(0.82), 4.2 * s, 0.06 * s);
  // rear window
  g.fillStyle = glass; poly(g, [[X(0.55), Y(1.36)], [X(0.88), Y(1.36)], [X(1.45), Y(0.98)], [X(0.55), Y(0.98)]]); g.fill(); g.stroke();
  // wheels
  for (const wx of [-1.4, 1.45]) { g.fillStyle = '#0b0c0f'; ell(g, X(wx), Y(0.33), 0.36 * s, 0.36 * s); g.fill(); g.fillStyle = '#5a5f6a'; ell(g, X(wx), Y(0.33), 0.17 * s, 0.17 * s); g.fill(); g.stroke(); }
  // the door opening (dark) where the driver door was
  g.fillStyle = '#05060a'; poly(g, [[X(-1.05), Y(0.4)], [X(0.45), Y(0.4)], [X(0.45), Y(1.36)], [X(-0.5), Y(1.36)], [X(-1.05), Y(0.95)]]); g.fill();
  if (o.seatYou) o.seatYou(g);
  // the driver door (can be ripped away)
  const dk = o.door || 0;
  g.save(); g.translate(X(-1.05) - dk * 3.2 * s, Y(0.4) - Math.sin(dk * Math.PI) * 1.4 * s + dk * dk * 0.3 * s); g.rotate(-dk * 2.4 - (o.doorOpen || 0) * 0.15);
  g.fillStyle = body; g.beginPath(); g.moveTo(0, 0); g.lineTo(1.5 * s, 0); g.lineTo(1.5 * s, -0.96 * s); g.lineTo(0.55 * s, -0.96 * s); g.lineTo(0, -0.55 * s); g.closePath(); g.fill(); g.stroke();
  if (dk < 0.15) { g.fillStyle = glass; poly(g, [[0.12 * s, -0.58 * s], [0.6 * s, -0.92 * s], [1.42 * s, -0.92 * s], [1.42 * s, -0.58 * s]]); g.fill(); g.stroke(); }
  g.fillStyle = '#9aa0ad'; rr(g, 1.15 * s, -0.5 * s, 0.22 * s, 0.06 * s, 0.02 * s); g.fill();
  g.restore();
  // front window + pillar
  g.fillStyle = glass; poly(g, [[X(-0.95), Y(0.98)], [X(-0.55), Y(1.36)], [X(-0.45), Y(1.36)], [X(-0.45), Y(0.98)]]); if (dk > 0.1) { g.fill(); g.stroke(); }
  // headlight + taillight
  g.fillStyle = '#e8e2c8'; rr(g, X(-2.24), Y(0.78), 0.18 * s, 0.12 * s, 0.03 * s); g.fill(); g.fillStyle = '#5a1416'; rr(g, X(2.08), Y(0.86), 0.14 * s, 0.14 * s, 0.03 * s); g.fill();
}
// glass shards flying (real pieces with spin, gravity)
function shards(g, x, y, age, n, seed, sc = 1, dir = 0, spread = Math.PI, col = 'rgba(200,225,255,0.85)') {
  if (age < 0 || age > 1.6) return; const r = rng(seed);
  for (let i = 0; i < n; i++) { const a = dir + (r() - 0.5) * spread, v = (300 + r() * 900) * sc, rot = r() * 6 + age * (r() - 0.5) * 20, sz = (8 + r() * 26) * sc;
    const px = x + Math.cos(a) * v * age, py = y + Math.sin(a) * v * age + 900 * sc * age * age; g.save(); g.translate(px, py); g.rotate(rot); g.globalAlpha = 1 - clamp((age - 1.1) / 0.5);
    g.fillStyle = col; g.strokeStyle = 'rgba(20,30,50,0.8)'; g.lineWidth = 1.5; poly(g, [[-sz * 0.5, -sz * 0.3], [sz * 0.6, -sz * 0.1], [-sz * 0.1, sz * 0.5]]); g.fill(); g.stroke(); g.restore(); }
}

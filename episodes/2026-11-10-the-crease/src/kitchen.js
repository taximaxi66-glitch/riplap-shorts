// =====================================================================
// THE CREASE: the kitchen at 2 a.m. (2.5D perspective set, Part 3 comic look)
// camera: {x, y, z, f, hy, yaw (deg, + turns right), cx}
// world: x right, y up, z into the room. Back wall z = 6, floor y = 0, ceiling y = 2.55
// =====================================================================
const KR = { x0: -2.5, x1: 2.5, back: 6.0, front: -1.5, ceil: 2.55 };
const KC = { ink: '#0b0c12', wall: '#1f2638', wallS: '#171d2c', ceil: '#0f131d', tileA: '#1c2130', tileB: '#141823', cab: '#23304a', cabS: '#1a2438', top: '#3b4459', topE: '#565f75',
  wood: '#3a2a20', woodS: '#2a1e17', door: '#2b2320', fridge: '#5d6474', fridgeS: '#474d5b', fridgeIn: '#ffe7bd', warm: [255, 205, 140], moon: [140, 170, 230] };
const FRIDGE = { x0: 1.32, x1: 2.22, z0: 5.3, z1: 6.0, h: 1.86, split: 1.3 };
const LIGHT = [1.72, 0.95, 5.05];   // where the fridge light sits (in the opening)
function camSpace(cam, x, y, z) { const dx = x - cam.x, dz = z - cam.z, a = (cam.yaw || 0) * D2R, c = Math.cos(a), s = Math.sin(a); return [dx * c - dz * s, y - cam.y, dx * s + dz * c]; }
// yaw-capable projection (replaces the street one)
function proj(cam, x, y, z) { const p = camSpace(cam, x, y, z); if (p[2] < 0.05) return null; const s = cam.f / p[2]; return [(cam.cx || W / 2) + p[0] * s, cam.hy - p[1] * s, s, p[2]]; }
function projPoly(cam, pts) {
  const N = 0.06, cs = pts.map(p => camSpace(cam, p[0], p[1], p[2])), out = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i], b = cs[(i + 1) % cs.length], ain = a[2] >= N, bin = b[2] >= N;
    if (ain) out.push(a); if (ain !== bin) { const k = (N - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), N]); }
  }
  return out.map(p => { const s = cam.f / p[2]; return [(cam.cx || W / 2) + p[0] * s, cam.hy - p[1] * s, p[2]]; });
}
function polyPath(g, sp) { g.moveTo(sp[0][0], sp[0][1]); for (let i = 1; i < sp.length; i++) g.lineTo(sp[i][0], sp[i][1]); g.closePath(); }
function lwAt(cam, sp) { const d = sp.reduce((a, p) => a + p[2], 0) / sp.length; return clamp(cam.f * 0.0042 / d, 1.4, 9); }
function fillQ(g, cam, pts, fill, ink = KC.ink, lw) {
  const sp = projPoly(cam, pts); if (sp.length < 3) return null;
  g.beginPath(); polyPath(g, sp); if (fill) { g.fillStyle = fill; g.fill(); }
  if (ink) { g.strokeStyle = ink; g.lineWidth = lw || lwAt(cam, sp); g.lineJoin = 'round'; g.stroke(); }
  return sp;
}
function line3(g, cam, a, b, col, lw) {
  const A = camSpace(cam, ...a), B = camSpace(cam, ...b), N = 0.06; if (A[2] < N && B[2] < N) return;
  let p = A, q = B; if (p[2] < N) { const k = (N - p[2]) / (q[2] - p[2]); p = [lerp(p[0], q[0], k), lerp(p[1], q[1], k), N]; } if (q[2] < N) { const k = (N - q[2]) / (p[2] - q[2]); q = [lerp(q[0], p[0], k), lerp(q[1], p[1], k), N]; }
  const P = v => [(cam.cx || W / 2) + v[0] * cam.f / v[2], cam.hy - v[1] * cam.f / v[2]];
  const s = P(p), e = P(q); g.strokeStyle = col; g.lineWidth = lw || clamp(cam.f * 0.003 / ((p[2] + q[2]) / 2), 1, 6); g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(e[0], e[1]); g.stroke();
}
// axis-aligned box, only the faces turned to the camera
function box3(g, cam, x0, x1, y0, y1, z0, z1, c) {
  const F = [];
  const v = (x, y, z) => [x, y, z], C = camSpace(cam, cam.x, cam.y, cam.z);
  if (cam.z < z0) F.push([[v(x0, y0, z0), v(x1, y0, z0), v(x1, y1, z0), v(x0, y1, z0)], c.front]);
  if (cam.z > z1) F.push([[v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1)], c.back || c.front]);
  if (cam.y > y1) F.push([[v(x0, y1, z0), v(x1, y1, z0), v(x1, y1, z1), v(x0, y1, z1)], c.top || c.front]);
  if (cam.y < y0) F.push([[v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1)], c.bottom || c.side || c.front]);
  if (cam.x < x0) F.push([[v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0)], c.side || c.front]);
  if (cam.x > x1) F.push([[v(x1, y0, z0), v(x1, y0, z1), v(x1, y1, z1), v(x1, y1, z0)], c.side || c.front]);
  for (const [pts, col] of F) fillQ(g, cam, pts, col, c.ink === undefined ? KC.ink : c.ink);
}
// a circle lying in a plane (center, two axis vectors)
function disc3(g, cam, c, ax, ay, r, fill, ink, n = 28) {
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push([0, 1, 2].map(j => c[j] + (ax[j] * Math.cos(a) + ay[j] * Math.sin(a)) * r)); }
  return fillQ(g, cam, pts, fill, ink);
}
function envK(t, extra = {}) { return Object.assign({ t, dawn: 0, fogDist: 90, P: { fog: [16, 20, 32] }, fridge: 1, gapLight: 1, moon: 1 }, extra); }

// ---------- outside the window / door glass: rainy night, swaying tree, a far house ----------
function outsideNight(g, cam, E, clipSp) {
  g.save(); g.beginPath(); polyPath(g, clipSp); g.clip();
  const ys = clipSp.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const gr = g.createLinearGradient(0, y0 - 200, 0, y1 + 100); gr.addColorStop(0, '#0a1024'); gr.addColorStop(0.6, '#1b2744'); gr.addColorStop(1, '#2c3a58'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // moon + halo (far away)
  const m = proj(cam, 7, 13, 46); if (m) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, m[0], m[1], 0.9 * m[2] * 2.5, [150, 175, 230], 0.35); g.restore(); g.fillStyle = '#dfe6f2'; ell(g, m[0], m[1], 0.9 * m[2], 0.9 * m[2]); g.fill(); g.fillStyle = 'rgba(150,160,185,0.5)'; ell(g, m[0] - 0.25 * m[2], m[1] - 0.15 * m[2], 0.22 * m[2], 0.18 * m[2]); g.fill(); }
  // drifting clouds
  for (let i = 0; i < 6; i++) { const cx = -14 + ((i * 7.3 + E.t * 0.55) % 32), c = proj(cam, cx, 9 + (i % 3) * 2.2, 40); if (!c) continue; g.fillStyle = `rgba(${40 + i * 4},${50 + i * 4},${78 + i * 3},0.85)`; for (let k = 0; k < 4; k++) { ell(g, c[0] + (k - 1.5) * 1.6 * c[2], c[1] + Math.sin(k * 2 + i) * 0.4 * c[2], 1.6 * c[2], 0.65 * c[2]); g.fill(); } }
  // a neighbour's house far away with one warm window
  const hs = [[-9, 0, 26, 5.5, 4.6], [3, 0, 30, 6.5, 5.2]];
  for (const [hx, , hz, hw, hh] of hs) {
    fillQ(g, cam, [[hx, 0, hz], [hx + hw, 0, hz], [hx + hw, hh, hz], [hx, hh, hz]], '#0b0f1a', null);
    fillQ(g, cam, [[hx - 0.4, hh, hz], [hx + hw + 0.4, hh, hz], [hx + hw / 2, hh + 2.2, hz]], '#090c15', null);
  }
  const wn = projPoly(cam, [[-6.6, 1.6, 25.9], [-5.6, 1.6, 25.9], [-5.6, 2.6, 25.9], [-6.6, 2.6, 25.9]]); if (wn.length > 2) { g.fillStyle = '#f2b366'; g.beginPath(); polyPath(g, wn); g.fill(); const c = wn[0]; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, (wn[0][0] + wn[2][0]) / 2, (wn[0][1] + wn[2][1]) / 2, 60, [255, 170, 90], 0.35); g.restore(); }
  // hedge + garden fence line
  fillQ(g, cam, [[-30, 0, 14], [30, 0, 14], [30, 1.3, 14], [-30, 1.3, 14]], '#070a10', null);
  for (let x = -10; x < 10; x += 0.6) { fillQ(g, cam, [[x, 0, 11], [x + 0.12, 0, 11], [x + 0.12, 1.15, 11], [x + 0.06, 1.25, 11], [x, 1.15, 11]], '#0d1119', null); }
  // the tree right outside: trunk + branches that sway
  const sway = noise(E.t * 0.6) * 0.18 + Math.sin(E.t * 1.3) * 0.05;
  const tr = [[-3.2, 0, 9.5], [-3.0, 3.0, 9.5], [-2.6, 6.5, 9.5]];
  const P = tr.map(p => proj(cam, ...p)); if (P.every(Boolean)) { limb(g, P.map(p => [p[0], p[1]]), 0.45 * P[0][2], '#06080d', '#06080d', null, 0); }
  const br = rng(5); g.strokeStyle = '#05070b'; g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const by = 2.4 + i * 0.45, dir = i % 2 ? 1 : -0.6, len = 2.2 + br() * 2.5, b0 = proj(cam, -3.0 + i * 0.03, by, 9.5); if (!b0) continue;
    let pts = [[b0[0], b0[1]]], px = -3.0, py = by;
    for (let k = 1; k <= 5; k++) { px += dir * len / 5; py += (br() - 0.3) * 0.5 + sway * k * 0.25 * (i % 3 === 0 ? 1.4 : 1); const q = proj(cam, px, py, 9.5); if (q) pts.push([q[0], q[1]]); }
    g.lineWidth = Math.max(2, 0.12 * b0[2]); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts) g.lineTo(q[0], q[1]); g.stroke();
    for (let k = 2; k < pts.length; k++) { g.lineWidth = Math.max(1, 0.04 * b0[2]); g.beginPath(); g.moveTo(pts[k][0], pts[k][1]); g.lineTo(pts[k][0] + dir * 0.4 * b0[2], pts[k][1] - (0.3 + sway) * b0[2]); g.stroke(); }
  }
  // rain falling outside (screen space, inside the clip)
  const r = rng(21); g.strokeStyle = 'rgba(170,190,225,0.35)'; g.lineWidth = 2; g.beginPath();
  for (let i = 0; i < 90; i++) { const x0 = r() * W, yy = (r() * H + E.t * (1300 + r() * 500)) % H; g.moveTo(x0 - yy * 0.06, yy); g.lineTo(x0 - yy * 0.06 - 5, yy + 34); }
  g.stroke();
  g.restore();
}
// raindrops sliding down a glass pane (plane z = zp)
function glassDrops(g, cam, E, x0, x1, y0, y1, zp, seed = 3) {
  const r = rng(seed);
  for (let i = 0; i < 46; i++) {
    const x = lerp(x0, x1, r()), sp = r() < 0.25 ? 0.05 + r() * 0.12 : 0.004, yy = y1 - ((r() * (y1 - y0) + E.t * sp) % (y1 - y0)), sz = 0.006 + r() * 0.012;
    const p = proj(cam, x, yy, zp); if (!p) continue;
    g.fillStyle = 'rgba(190,210,240,0.35)'; ell(g, p[0], p[1], sz * p[2], sz * 1.25 * p[2]); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; ell(g, p[0] - sz * 0.3 * p[2], p[1] - sz * 0.4 * p[2], sz * 0.3 * p[2], sz * 0.3 * p[2]); g.fill();
    if (sp > 0.01) { g.strokeStyle = 'rgba(190,210,240,0.12)'; g.lineWidth = sz * 0.8 * p[2]; const q = proj(cam, x, yy + 0.15, zp); if (q) { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); } }
  }
}
// ---------- the window above the sink ----------
const WIN = { x0: -0.82, x1: 0.42, y0: 1.18, y1: 2.02 };
function drawWindow(g, cam, E, o = {}) {
  const z = KR.back, sp = projPoly(cam, [[WIN.x0, WIN.y0, z], [WIN.x1, WIN.y0, z], [WIN.x1, WIN.y1, z], [WIN.x0, WIN.y1, z]]); if (sp.length < 3) return;
  outsideNight(g, cam, E, sp);
  if (o.outside) o.outside(g, cam, E, sp);
  // glass: faint reflection of the warm fridge light + drops
  g.save(); g.beginPath(); polyPath(g, sp); g.clip();
  const gl = g.createLinearGradient(sp[0][0], 0, sp[1][0], 0); gl.addColorStop(0, 'rgba(120,140,190,0.05)'); gl.addColorStop(1, `rgba(255,200,140,${0.10 * E.fridge})`); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  glassDrops(g, cam, E, WIN.x0, WIN.x1, WIN.y0, WIN.y1, z - 0.01);
  if (o.glass) o.glass(g, cam, E, sp);
  g.restore();
  // frame + cross mullion + sill
  const fw = 0.05, c = '#2c3446';
  for (const [a, b, cc, d] of [[WIN.x0 - fw, WIN.x0, WIN.y0 - fw, WIN.y1 + fw], [WIN.x1, WIN.x1 + fw, WIN.y0 - fw, WIN.y1 + fw], [WIN.x0, WIN.x1, WIN.y1, WIN.y1 + fw], [(WIN.x0 + WIN.x1) / 2 - 0.02, (WIN.x0 + WIN.x1) / 2 + 0.02, WIN.y0, WIN.y1], [WIN.x0, WIN.x1, (WIN.y0 + WIN.y1) / 2 - 0.02, (WIN.y0 + WIN.y1) / 2 + 0.02]])
    fillQ(g, cam, [[a, cc, z - 0.02], [b, cc, z - 0.02], [b, d, z - 0.02], [a, d, z - 0.02]], c);
  box3(g, cam, WIN.x0 - 0.1, WIN.x1 + 0.1, WIN.y0 - 0.08, WIN.y0 - 0.02, z - 0.16, z, { front: '#323b50', top: '#414b62' });
  // a small plant pot on the sill
  box3(g, cam, WIN.x0 + 0.05, WIN.x0 + 0.19, WIN.y0 - 0.02, WIN.y0 + 0.1, z - 0.13, z - 0.03, { front: '#6a3a2a', top: '#3a2016' });
  for (let i = 0; i < 5; i++) { const a = proj(cam, WIN.x0 + 0.12, WIN.y0 + 0.1, z - 0.08), b = proj(cam, WIN.x0 + 0.12 + (i - 2) * 0.05 + Math.sin(E.t + i) * 0.006, WIN.y0 + 0.24 - Math.abs(i - 2) * 0.03, z - 0.08); if (a && b) { g.strokeStyle = '#1f3a24'; g.lineWidth = Math.max(2, 0.015 * a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(a[0], b[1], b[0], b[1]); g.stroke(); } }
  // curtains that breathe in a draft
  for (const sd of [-1, 1]) {
    const xe = sd < 0 ? WIN.x0 - 0.12 : WIN.x1 + 0.12, xi = sd < 0 ? WIN.x0 + 0.12 : WIN.x1 - 0.12, pts = [];
    for (let i = 0; i <= 10; i++) { const k = i / 10, y = lerp(WIN.y1 + 0.12, WIN.y0 - 0.05, k); pts.push([xi + sd * k * 0.05 + Math.sin(E.t * 1.1 + k * 4 + sd) * 0.012 * k, y, z - 0.07]); }
    for (let i = 10; i >= 0; i--) { const k = i / 10, y = lerp(WIN.y1 + 0.12, WIN.y0 - 0.05, k); pts.push([xe, y, z - 0.07]); }
    fillQ(g, cam, pts, '#3c3446');
    for (let f = 1; f < 3; f++) line3(g, cam, [lerp(xe, xi, f / 3), WIN.y1 + 0.1, z - 0.075], [lerp(xe, xi, f / 3) + Math.sin(E.t * 1.1 + f) * 0.01, WIN.y0, z - 0.075], 'rgba(10,8,16,0.6)');
  }
  line3(g, cam, [WIN.x0 - 0.2, WIN.y1 + 0.13, z - 0.08], [WIN.x1 + 0.2, WIN.y1 + 0.13, z - 0.08], '#141820', 4);
}
// ---------- the back door (on the back wall, left) ----------
const BD = { x0: -2.24, x1: -1.4, h: 2.05, gap: 0.03 };
function drawBackDoor(g, cam, E, o = {}) {
  const z = KR.back, sh = o.shake || 0;
  fillQ(g, cam, [[BD.x0 - 0.07, 0, z - 0.01], [BD.x1 + 0.07, 0, z - 0.01], [BD.x1 + 0.07, BD.h + 0.07, z - 0.01], [BD.x0 - 0.07, BD.h + 0.07, z - 0.01]], '#2e2a2a');
  // gap under the door: cold light from outside, broken by whatever stands out there
  const gsp = fillQ(g, cam, [[BD.x0, 0, z - 0.02], [BD.x1, 0, z - 0.02], [BD.x1, BD.gap, z - 0.02], [BD.x0, BD.gap, z - 0.02]], '#9db6e0', null);
  if (gsp && o.gapShadow) o.gapShadow(g, cam, E, gsp);
  const dx = sh * 0.004;
  const dp = fillQ(g, cam, [[BD.x0 + dx, BD.gap, z - 0.03], [BD.x1 + dx, BD.gap, z - 0.03], [BD.x1 + dx, BD.h, z - 0.03], [BD.x0 + dx, BD.h, z - 0.03]], KC.door);
  // panels
  for (const [a, b] of [[0.2, 0.95], [1.1, 1.3]]) fillQ(g, cam, [[BD.x0 + 0.1 + dx, a, z - 0.035], [BD.x1 - 0.1 + dx, a, z - 0.035], [BD.x1 - 0.1 + dx, b, z - 0.035], [BD.x0 + 0.1 + dx, b, z - 0.035]], '#241d1a', 'rgba(5,4,6,0.8)');
  // little window in the door: 4 panes, outside visible
  const wsp = projPoly(cam, [[BD.x0 + 0.14 + dx, 1.42, z - 0.035], [BD.x1 - 0.14 + dx, 1.42, z - 0.035], [BD.x1 - 0.14 + dx, 1.9, z - 0.035], [BD.x0 + 0.14 + dx, 1.9, z - 0.035]]);
  if (wsp.length > 2) { outsideNight(g, cam, E, wsp); g.save(); g.beginPath(); polyPath(g, wsp); g.clip(); glassDrops(g, cam, E, BD.x0, BD.x1, 1.42, 1.9, z - 0.04, 9); if (o.doorGlass) o.doorGlass(g, cam, E, wsp); g.restore(); g.strokeStyle = KC.ink; g.lineWidth = lwAt(cam, wsp); g.beginPath(); polyPath(g, wsp); g.stroke();
    line3(g, cam, [(BD.x0 + BD.x1) / 2 + dx, 1.42, z - 0.04], [(BD.x0 + BD.x1) / 2 + dx, 1.9, z - 0.04], '#241d1a', null); line3(g, cam, [BD.x0 + 0.14 + dx, 1.66, z - 0.04], [BD.x1 - 0.14 + dx, 1.66, z - 0.04], '#241d1a', null); }
  // knob (jiggles when something tries it)
  const kj = (o.knob || 0) * Math.sin(E.t * 38) * 0.35;
  const kc = [BD.x1 - 0.1 + dx, 1.0, z - 0.06]; disc3(g, cam, [kc[0], kc[1], kc[2] - 0.005], [1, 0, 0], [0, 1, 0], 0.05, '#4a4236');
  disc3(g, cam, kc, [Math.cos(kj), Math.sin(kj), 0], [-Math.sin(kj), Math.cos(kj), 0], 0.035, '#a89670');
  line3(g, cam, [kc[0] - 0.03 * Math.cos(kj), kc[1] - 0.03 * Math.sin(kj), kc[2] - 0.01], [kc[0] + 0.03 * Math.cos(kj), kc[1] + 0.03 * Math.sin(kj), kc[2] - 0.01], 'rgba(40,30,20,0.8)', 2);
  // doormat
  fillQ(g, cam, [[BD.x0 + 0.02, 0.002, z - 0.75], [BD.x1 - 0.02, 0.002, z - 0.75], [BD.x1 - 0.02, 0.002, z - 0.12], [BD.x0 + 0.02, 0.002, z - 0.12]], '#3a2c22');
  for (let i = 1; i < 6; i++) line3(g, cam, [BD.x0 + 0.05, 0.003, z - 0.12 - i * 0.105], [BD.x1 - 0.05, 0.003, z - 0.12 - i * 0.105], 'rgba(20,14,10,0.6)');
  // the cold light fan on the floor in front of the gap
  const a = proj(cam, (BD.x0 + BD.x1) / 2, 0, z - 0.1); if (a && E.gapLight > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(a[0], a[1]); g.scale(1, 0.25); glow(g, 0, 0, 0.9 * a[2], [130, 160, 220], 0.16 * E.gapLight * (o.gapDim == null ? 1 : o.gapDim)); g.restore(); }
}
function drawClock(g, cam, E, c = [-1.82, 2.32, 5.98]) {
  disc3(g, cam, c, [1, 0, 0], [0, 1, 0], 0.15, '#c9c3b3'); disc3(g, cam, [c[0], c[1], c[2] - 0.005], [1, 0, 0], [0, 1, 0], 0.125, '#e4dfd2', 'rgba(30,30,40,0.6)');
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line3(g, cam, [c[0] + Math.sin(a) * 0.1, c[1] + Math.cos(a) * 0.1, c[2] - 0.01], [c[0] + Math.sin(a) * 0.115, c[1] + Math.cos(a) * 0.115, c[2] - 0.01], '#333'); }
  const hand = (a, l, w, col) => line3(g, cam, [c[0], c[1], c[2] - 0.012], [c[0] + Math.sin(a) * l, c[1] + Math.cos(a) * l, c[2] - 0.012], col, w);
  const sec = Math.floor(E.t + 7);  // ticks once per second
  hand((2 + 13 / 60) / 12 * TAU, 0.065, null, '#111'); hand(13 / 60 * TAU, 0.1, null, '#111'); hand(sec / 60 * TAU, 0.11, 1.5, '#b3261e');
}
// ---------- room shell ----------
function drawShell(g, cam, E, o = {}) {
  const { x0, x1, back, front, ceil } = KR;
  fillQ(g, cam, [[x0, ceil, front], [x1, ceil, front], [x1, ceil, back], [x0, ceil, back]], KC.ceil);
  fillQ(g, cam, [[x0, 0, back], [x1, 0, back], [x1, ceil, back], [x0, ceil, back]], KC.wall);
  // wallpaper stripes on the back wall
  for (let x = x0 + 0.25; x < x1; x += 0.25) line3(g, cam, [x, 0.95, back - 0.001], [x, ceil, back - 0.001], 'rgba(10,12,22,0.25)');
  fillQ(g, cam, [[x0, 0, front], [x0, 0, back], [x0, ceil, back], [x0, ceil, front]], KC.wallS);
  fillQ(g, cam, [[x1, 0, front], [x1, 0, back], [x1, ceil, back], [x1, ceil, front]], KC.wallS);
  // floor tiles (checker)
  for (let zz = front; zz < back; zz += 0.5) for (let xx = x0; xx < x1; xx += 0.5) {
    const k = (Math.round((zz - front) / 0.5) + Math.round((xx - x0) / 0.5)) % 2; fillQ(g, cam, [[xx, 0, zz], [xx + 0.5, 0, zz], [xx + 0.5, 0, zz + 0.5], [xx, 0, zz + 0.5]], k ? KC.tileA : KC.tileB, 'rgba(6,7,12,0.55)');
  }
  // skirting + crown lines
  line3(g, cam, [x0, 0.08, back - 0.002], [x1, 0.08, back - 0.002], '#11151f', 3);
  line3(g, cam, [x0, ceil - 0.05, back - 0.002], [x1, ceil - 0.05, back - 0.002], '#0a0d14', 3);
  // left wall: the doorway to the hall + stairs
  const dsp = projPoly(cam, [[x0 + 0.001, 0, 1.55], [x0 + 0.001, 0, 2.5], [x0 + 0.001, 2.1, 2.5], [x0 + 0.001, 2.1, 1.55]]);
  if (dsp.length > 2) { g.save(); g.beginPath(); polyPath(g, dsp); g.clip(); hallway(g, cam, E); if (o.hall) o.hall(g, cam, E); g.restore(); g.strokeStyle = '#2e2a2a'; g.lineWidth = lwAt(cam, dsp) * 3; g.beginPath(); polyPath(g, dsp); g.stroke(); }
  // a family photo on the left wall
  fillQ(g, cam, [[x0 + 0.01, 1.35, 3.55], [x0 + 0.01, 1.35, 4.15], [x0 + 0.01, 1.8, 4.15], [x0 + 0.01, 1.8, 3.55]], '#4a3a2c');
  fillQ(g, cam, [[x0 + 0.015, 1.4, 3.6], [x0 + 0.015, 1.4, 4.1], [x0 + 0.015, 1.75, 4.1], [x0 + 0.015, 1.75, 3.6]], '#5d6a80', null);
  // right wall: a calendar + light switch
  fillQ(g, cam, [[x1 - 0.01, 1.2, 3.3], [x1 - 0.01, 1.2, 3.75], [x1 - 0.01, 1.75, 3.75], [x1 - 0.01, 1.75, 3.3]], '#bdb6a6');
  fillQ(g, cam, [[x1 - 0.015, 1.25, 3.35], [x1 - 0.015, 1.25, 3.7], [x1 - 0.015, 1.5, 3.7], [x1 - 0.015, 1.5, 3.35]], '#8a3a32', null);
  fillQ(g, cam, [[x1 - 0.01, 1.2, 1.4], [x1 - 0.01, 1.2, 1.5], [x1 - 0.01, 1.32, 1.5], [x1 - 0.01, 1.32, 1.4]], '#b0aa9c');
  drawWindow(g, cam, E, o.win || {});
  drawBackDoor(g, cam, E, o.door || {});
  drawClock(g, cam, E);
  // moonlight falling through the window onto the floor + its cross shadow
  if (E.moon > 0) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const mx = 0.25, mz = -1.3;  // light comes in slanted toward the camera
    const fl = (x, y) => [x + mx * (y), 0.003, KR.back + mz * y];
    const q = projPoly(cam, [fl(WIN.x0, WIN.y0), fl(WIN.x1, WIN.y0), fl(WIN.x1, WIN.y1), fl(WIN.x0, WIN.y1)]);
    if (q.length > 2) { const cy = q.reduce((a, p) => a + p[1], 0) / q.length; g.fillStyle = `rgba(110,140,210,${0.10 * E.moon})`; g.beginPath(); polyPath(g, q); g.fill(); }
    g.restore();
    const xm = (WIN.x0 + WIN.x1) / 2, ym = (WIN.y0 + WIN.y1) / 2;
    line3(g, cam, fl(xm, WIN.y0), fl(xm, WIN.y1), 'rgba(4,6,12,0.35)', null); line3(g, cam, fl(WIN.x0, ym), fl(WIN.x1, ym), 'rgba(4,6,12,0.35)', null);
  }
}
// what you see of the hall through the doorway: the foot of the stairs going up into the dark
function hallway(g, cam, E) {
  const x0 = KR.x0;
  fillQ(g, cam, [[x0 - 3, 0, 1.0], [x0, 0, 1.0], [x0, 0, 3.0], [x0 - 3, 0, 3.0]], '#151a26');
  fillQ(g, cam, [[x0 - 3, 0, 3.0], [x0, 0, 3.0], [x0, 3.5, 3.0], [x0 - 3, 3.5, 3.0]], '#11151f');
  fillQ(g, cam, [[x0 - 3, 0, 1.0], [x0 - 3, 0, 3.0], [x0 - 3, 4, 3.0], [x0 - 3, 4, 1.0]], '#0c0f17');
  // stairs climbing away (toward -x), banister
  for (let i = 0; i < 12; i++) {
    const sx = x0 - 0.55 - i * 0.27, sy = (i + 1) * 0.19;
    box3(g, cam, sx - 0.27, sx, 0, sy, 1.55, 2.6, { front: '#2a2733', top: '#4a4558', side: '#322f3c' });
  }
  // moonlight from a small window at the top of the stairs
  const mw = proj(cam, x0 - 2.9, 2.6, 2.1); if (mw) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, mw[0], mw[1], 1.6 * mw[2], [120, 150, 220], 0.4); g.restore(); }
  for (let i = 0; i < 12; i++) { const sx = x0 - 0.65 - i * 0.27, sy = (i + 1) * 0.19; line3(g, cam, [sx, sy, 1.6], [sx, sy + 0.9, 1.6], '#3a3036', null); }
  line3(g, cam, [x0 - 0.5, 1.15, 1.6], [x0 - 3.6, 3.4, 1.6], '#4a3c40', null);
}
// ---------- counters, sink, upper cabinets ----------
function drawCounter(g, cam, E) {
  const z0 = 5.4, z1 = KR.back, xa = -1.32, xb = 1.27;
  box3(g, cam, xa, xb, 0.08, 0.86, z0 + 0.04, z1, { front: KC.cab, top: KC.cab, side: KC.cabS });
  box3(g, cam, xa, xb, 0, 0.08, z0 + 0.1, z1, { front: '#0d1018', side: '#0d1018' });
  for (let x = xa; x < xb - 0.1; x += 0.5) {
    fillQ(g, cam, [[x + 0.04, 0.14, z0 + 0.035], [x + 0.46, 0.14, z0 + 0.035], [x + 0.46, 0.8, z0 + 0.035], [x + 0.04, 0.8, z0 + 0.035]], '#29385a', 'rgba(8,10,18,0.9)');
    line3(g, cam, [x + 0.4, 0.62, z0 + 0.025], [x + 0.4, 0.74, z0 + 0.025], '#9aa2b4', null);
  }
  box3(g, cam, xa - 0.02, xb + 0.02, 0.86, 0.92, z0, z1, { front: KC.topE, top: KC.top, side: KC.topE });
  // sink basin + faucet
  const sx0 = -0.55, sx1 = 0.15;
  fillQ(g, cam, [[sx0, 0.921, z0 + 0.1], [sx1, 0.921, z0 + 0.1], [sx1, 0.921, z1 - 0.12], [sx0, 0.921, z1 - 0.12]], '#4a5266', '#7a8296');
  fillQ(g, cam, [[sx0 + 0.04, 0.922, z0 + 0.14], [sx1 - 0.04, 0.922, z0 + 0.14], [sx1 - 0.04, 0.922, z1 - 0.16], [sx0 + 0.04, 0.922, z1 - 0.16]], '#2a3040', null);
  disc3(g, cam, [(sx0 + sx1) / 2, 0.923, (z0 + z1) / 2], [1, 0, 0], [0, 0, 1], 0.03, '#111', null, 12);
  const fb = [(sx0 + sx1) / 2, 0.92, z1 - 0.06], ft = [(sx0 + sx1) / 2, 1.18, z1 - 0.08], fe = [(sx0 + sx1) / 2, 1.12, z1 - 0.3];
  const P = [fb, ft, fe].map(p => proj(cam, ...p)); if (P.every(Boolean)) limb(g, P.map(p => [p[0], p[1]]), 0.025 * P[1][2], '#8d95a6', KC.ink, null, Math.max(1, 0.006 * P[1][2]));
  // a drop forms and falls every 1.7 s
  const ph = (E.t % 1.7) / 1.7, dz = fe[2]; const dy = ph < 0.7 ? 0 : (ph - 0.7) / 0.3; const dp = proj(cam, fe[0], fe[1] - 0.02 - dy * dy * 0.18, dz);
  if (dp) { g.fillStyle = 'rgba(190,210,240,0.8)'; ell(g, dp[0], dp[1], 0.006 * dp[2] * (0.5 + ph), 0.009 * dp[2] * (0.5 + ph)); g.fill(); }
  // dishes on the drying rack
  // upper cabinets
  box3(g, cam, xa, -0.95, 1.5, 2.36, 5.62, z1, { front: KC.cab, bottom: KC.cabS, side: KC.cabS });
  box3(g, cam, 0.55, xb, 1.5, 2.36, 5.62, z1, { front: KC.cab, bottom: KC.cabS, side: KC.cabS });
  for (const x of [xa + 0.03, 0.58, 0.92]) fillQ(g, cam, [[x, 1.55, 5.615], [x + 0.32, 1.55, 5.615], [x + 0.32, 2.31, 5.615], [x, 2.31, 5.615]], '#29385a', 'rgba(8,10,18,0.9)');
  // cereal box + kettle on the counter
  box3(g, cam, 0.62, 0.86, 0.92, 1.26, 5.62, 5.72, { front: '#c4472d', top: '#8a2f1f', side: '#9a3522' });
  fillQ(g, cam, [[0.66, 1.05, 5.615], [0.82, 1.05, 5.615], [0.82, 1.2, 5.615], [0.66, 1.2, 5.615]], '#f0c24a', null);
}
// ---------- the fridge ----------
function drawFridge(g, cam, E, open = 1) {
  const F = FRIDGE, th = open * 104 * D2R;
  const lit = E.fridge * open;
  // interior cavity first
  if (open > 0.01) {
    const ins = 0.05, a = F.x0 + ins, b = F.x1 - ins, zb = F.z1 - 0.05;
    const L = mixc([60, 58, 54], [255, 236, 200], clamp(E.fridge));
    fillQ(g, cam, [[a, 0.08, zb], [b, 0.08, zb], [b, F.split - 0.04, zb], [a, F.split - 0.04, zb]], rgb(L), null);
    fillQ(g, cam, [[a, 0.08, F.z0], [a, 0.08, zb], [a, F.split - 0.04, zb], [a, F.split - 0.04, F.z0]], rgb(mixc(L, [0, 0, 0], 0.15)), null);
    fillQ(g, cam, [[b, 0.08, F.z0], [b, 0.08, zb], [b, F.split - 0.04, zb], [b, F.split - 0.04, F.z0]], rgb(mixc(L, [0, 0, 0], 0.1)), null);
    fillQ(g, cam, [[a, F.split - 0.04, F.z0], [b, F.split - 0.04, F.z0], [b, F.split - 0.04, zb], [a, F.split - 0.04, zb]], rgb(mixc(L, [0, 0, 0], 0.2)), null);
    fillQ(g, cam, [[a, 0.08, F.z0], [b, 0.08, F.z0], [b, 0.08, zb], [a, 0.08, zb]], rgb(mixc(L, [0, 0, 0], 0.25)), null);
    for (const sy of [0.42, 0.78]) fillQ(g, cam, [[a, sy, F.z0 + 0.02], [b, sy, F.z0 + 0.02], [b, sy, zb], [a, sy, zb]], `rgba(255,255,255,${0.35 * lit + 0.05})`, 'rgba(120,110,90,0.6)');
    // food: milk, jars, bottles, a leftover cake
    const cols = [['#f2f2ee', '#3a78c8'], ['#c8452e', '#7a2a1c'], ['#e8c454', '#8a6a1a'], ['#6ea84a', '#2f5a20']];
    box3(g, cam, a + 0.06, a + 0.2, 0.78, 1.06, 5.55, 5.68, { front: '#f4f2ea', top: '#dcdad2', side: '#cfcdc4' });
    fillQ(g, cam, [[a + 0.06, 0.86, 5.545], [a + 0.2, 0.86, 5.545], [a + 0.2, 0.95, 5.545], [a + 0.06, 0.95, 5.545]], '#3a78c8', null);
    for (let i = 0; i < 3; i++) box3(g, cam, a + 0.3 + i * 0.15, a + 0.4 + i * 0.15, 0.78, 0.92 + i * 0.02, 5.6, 5.7, { front: cols[i + 1][0], top: cols[i + 1][1], side: cols[i + 1][1] });
    for (let i = 0; i < 4; i++) box3(g, cam, a + 0.05 + i * 0.18, a + 0.15 + i * 0.18, 0.42, 0.62 + (i % 2) * 0.06, 5.55, 5.65, { front: ['#5a8a3a', '#b23a2a', '#d8d0c0', '#7a5a9a'][i], top: '#222' });
    box3(g, cam, a + 0.1, b - 0.1, 0.1, 0.32, 5.45, 5.8, { front: 'rgba(200,220,210,0.55)', top: 'rgba(220,235,225,0.5)' });
    // the light bulb glow
    g.save(); g.globalCompositeOperation = 'lighter'; const lb = proj(cam, (a + b) / 2, 1.15, 5.7); if (lb) glow(g, lb[0], lb[1], 0.5 * lb[2], [255, 230, 180], 0.55 * lit); g.restore();
  }
  // body: left side, top, freezer door, frame of the main door opening
  box3(g, cam, F.x0, F.x1, F.split, F.h, F.z0, F.z1, { front: KC.fridge, top: '#6c7384', side: KC.fridgeS });
  if (cam.x < F.x0) fillQ(g, cam, [[F.x0, 0, F.z0], [F.x0, 0, F.z1], [F.x0, F.split, F.z1], [F.x0, F.split, F.z0]], KC.fridgeS);
  line3(g, cam, [F.x0 + 0.08, F.split + 0.1, F.z0 - 0.02], [F.x0 + 0.08, F.split + 0.3, F.z0 - 0.02], '#a7adba', null);
  fillQ(g, cam, [[F.x0, 0, F.z0], [F.x1, 0, F.z0], [F.x1, 0.07, F.z0], [F.x0, 0.07, F.z0]], '#2a2e38');
  // magnets + a child's drawing on the freezer door
  fillQ(g, cam, [[F.x0 + 0.3, 1.42, F.z0 - 0.005], [F.x0 + 0.62, 1.42, F.z0 - 0.005], [F.x0 + 0.62, 1.74, F.z0 - 0.005], [F.x0 + 0.3, 1.74, F.z0 - 0.005]], '#d9d4c4', 'rgba(0,0,0,0.5)');
  disc3(g, cam, [F.x0 + 0.46, 1.62, F.z0 - 0.007], [1, 0, 0], [0, 1, 0], 0.05, '#e0b23a', null);
  // main door, hinged at the right front edge
  const hx = F.x1, hz = F.z0, dw = F.x1 - F.x0, fx = hx - dw * Math.cos(th), fz = hz - dw * Math.sin(th), nx = -Math.sin(th) * 0.08, nz = Math.cos(th) * 0.08;
  const outer = [[hx, 0.07, hz], [fx, 0.07, fz], [fx, F.split - 0.02, fz], [hx, F.split - 0.02, hz]];
  const inner = outer.map(p => [p[0] + nx, p[1], p[2] + nz]);
  // which side of the door faces us?
  const cIn = camSpace(cam, cam.x, 0, cam.z), toCam = [cam.x - (hx + fx) / 2, cam.z - (hz + fz) / 2], nrm = [-Math.sin(th), Math.cos(th)];
  const seesInner = toCam[0] * nrm[0] + toCam[1] * nrm[1] > 0;
  fillQ(g, cam, [[fx, 0.07, fz], [fx + nx, 0.07, fz + nz], [fx + nx, F.split - 0.02, fz + nz], [fx, F.split - 0.02, fz]], '#3c414d');
  if (seesInner) {
    fillQ(g, cam, inner, rgb(mixc([70, 72, 80], [235, 222, 196], lit)));
    // door shelves with bottles
    for (const sy of [0.3, 0.68, 1.02]) {
      const s0 = inner.map(p => p), A = (k, y, d) => [lerp(s0[0][0], s0[1][0], k) + Math.cos(th) * 0 + nx * d, y, lerp(s0[0][2], s0[1][2], k) + nz * d];
      for (let i = 0; i < 4; i++) { const k0 = 0.12 + i * 0.2; fillQ(g, cam, [A(k0, sy, 0.1), A(k0 + 0.12, sy, 0.1), A(k0 + 0.12, sy + 0.2 + (i % 2) * 0.05, 0.1), A(k0 + 0.06, sy + 0.26 + (i % 2) * 0.05, 0.1), A(k0, sy + 0.2 + (i % 2) * 0.05, 0.1)], ['#3d7a48', '#d9a03a', '#b8c0c8', '#a8342a'][(i + Math.round(sy * 10)) % 4]); }
      fillQ(g, cam, [A(0.05, sy, 0.02), A(0.95, sy, 0.02), A(0.95, sy + 0.08, 0.16), A(0.05, sy + 0.08, 0.16)], `rgba(220,230,235,${0.4 + 0.3 * lit})`);
    }
  } else {
    fillQ(g, cam, outer, KC.fridge);
    line3(g, cam, [fx + 0.06 * Math.cos(th), 0.75, fz + 0.06 * Math.sin(th) - 0.02], [fx + 0.06 * Math.cos(th), 1.1, fz + 0.06 * Math.sin(th) - 0.02], '#a7adba', null);
  }
}
// warm fridge light: floor pool, wall glow, a soft beam with dust
function fridgeLight(g, cam, E, k = 1) {
  if (k * E.fridge <= 0.01) return; const a = k * E.fridge;
  g.save(); g.globalCompositeOperation = 'lighter';
  const c = proj(cam, 1.5, 0, 4.4), e = proj(cam, 1.5, 0, 2.2);
  if (c) { const rx = 2.6 * c[2], ry = e ? Math.max(30, Math.abs(c[1] - e[1]) * 0.9) : rx * 0.3; g.save(); g.translate(c[0], c[1]); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgb(KC.warm, 0.22 * a)); gr.addColorStop(0.5, rgb(KC.warm, 0.08 * a)); gr.addColorStop(1, rgb(KC.warm, 0)); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
  const w = proj(cam, 1.2, 1.0, 5.9); if (w) glow(g, w[0], w[1], 1.6 * w[2], KC.warm, 0.13 * a);
  const s = proj(cam, 1.75, 0.9, 5.2); if (s) glow(g, s[0], s[1], 0.9 * s[2], [255, 225, 175], 0.22 * a);
  // the beam: from the opening toward the camera, slightly left
  const bs = projPoly(cam, [[1.35, 1.25, 5.3], [1.35, 0.08, 5.3], [-0.2, 0, 2.6], [0.4, 2.1, 2.2]]);
  if (false && bs.length > 2) { const gr = g.createLinearGradient(bs[0][0], 0, bs[2][0], 0); gr.addColorStop(0, rgb(KC.warm, 0.1 * a)); gr.addColorStop(1, rgb(KC.warm, 0)); g.fillStyle = gr; g.beginPath(); polyPath(g, bs); g.fill(); }
  g.restore();
}
// dust floating in the light
function lightDust(g, cam, E, k = 1, n = 60, seed = 4) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = lerp(-0.5, 2.0, r()), y = lerp(0.2, 2.2, r()) + ((E.t * 0.03 * (r() - 0.4)) % 0.5), z = lerp(2.8, 5.3, r());
    const p = proj(cam, x + Math.sin(E.t * 0.4 + i) * 0.06, y + Math.sin(E.t * 0.3 + i * 2) * 0.05, z); if (!p) continue;
    const inBeam = clamp(1 - Math.abs(x - 1.3) / 1.6) * clamp(1 - Math.abs(z - 4.3) / 2);
    g.fillStyle = `rgba(255,230,190,${0.5 * inBeam * k * E.fridge})`; const sz = Math.max(1.2, 0.006 * p[2]); g.fillRect(p[0], p[1], sz, sz);
  }
}
// ---------- table + chairs, the hanging lamp ----------
function drawTable(g, cam, E) {
  const x0 = -0.45, x1 = 0.95, z0 = 2.3, z1 = 3.2, h = 0.76;
  for (const [lx, lz] of [[x0 + 0.05, z0 + 0.05], [x1 - 0.1, z0 + 0.05], [x0 + 0.05, z1 - 0.1], [x1 - 0.1, z1 - 0.1]]) box3(g, cam, lx, lx + 0.06, 0, h - 0.04, lz, lz + 0.06, { front: KC.woodS, side: '#22180f' });
  box3(g, cam, x0, x1, h - 0.05, h, z0, z1, { front: KC.wood, top: '#4a372a', side: KC.woodS, bottom: '#1b130d' });
  // bowl + spoon + spilled cereal
  const bc = [0.35, h + 0.001, 2.72];
  disc3(g, cam, bc, [1, 0, 0], [0, 0, 1], 0.11, '#d8d2c4'); disc3(g, cam, [bc[0], bc[1] + 0.05, bc[2]], [1, 0, 0], [0, 0, 1], 0.09, '#efe7d4');
  const r = rng(8); for (let i = 0; i < 9; i++) disc3(g, cam, [bc[0] + (r() - 0.5) * 0.12, bc[1] + 0.052, bc[2] + (r() - 0.5) * 0.1], [1, 0, 0], [0, 0, 1], 0.014, '#d79a3c', null, 8);
  for (let i = 0; i < 5; i++) disc3(g, cam, [0.05 + r() * 0.25, h + 0.002, 2.55 + r() * 0.3], [1, 0, 0], [0, 0, 1], 0.013, '#c98a32', null, 8);
  line3(g, cam, [0.5, h + 0.004, 2.65], [0.72, h + 0.004, 2.58], '#a9aebb', 3);
}
function drawChair(g, cam, E, x, z, back = 1) {
  const h = 0.46; for (const [lx, lz] of [[x, z], [x + 0.36, z], [x, z + 0.36], [x + 0.36, z + 0.36]]) box3(g, cam, lx, lx + 0.04, 0, h, lz, lz + 0.04, { front: KC.woodS, side: '#1d150f' });
  box3(g, cam, x - 0.02, x + 0.42, h, h + 0.04, z - 0.02, z + 0.42, { front: KC.wood, top: '#45332a', side: KC.woodS });
  const bz = back > 0 ? z + 0.4 : z - 0.02; box3(g, cam, x - 0.02, x + 0.42, h + 0.04, h + 0.5, bz, bz + 0.04, { front: KC.wood, top: '#45332a', side: KC.woodS });
  for (let i = 0; i < 3; i++) box3(g, cam, x + 0.06 + i * 0.12, x + 0.1 + i * 0.12, h + 0.04, h + 0.42, bz - 0.005, bz + 0.045, { front: '#3a2a20', ink: null });
}
function drawPendant(g, cam, E) {
  const sw = Math.sin(E.t * 0.7) * 0.015, top = [0.25, KR.ceil, 2.8], bot = [0.25 + sw, 2.0, 2.8];
  line3(g, cam, top, bot, '#07080c', 2);
  const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; pts.push([bot[0] + Math.cos(a) * 0.2, bot[1] - 0.18, bot[2] + Math.sin(a) * 0.2]); }
  const cone = projPoly(cam, [[bot[0] - 0.05, bot[1], bot[2]], [bot[0] + 0.05, bot[1], bot[2]], [bot[0] + 0.22, bot[1] - 0.18, bot[2]], [bot[0] - 0.22, bot[1] - 0.18, bot[2]]]);
  if (cone.length > 2) { g.fillStyle = '#1b2232'; g.strokeStyle = KC.ink; g.lineWidth = 2; g.beginPath(); polyPath(g, cone); g.fill(); g.stroke(); }
}
// the full kitchen with depth-sorted extras: [{z, draw(g,cam,E)}]
function kitchenScene(g, cam, E, extras = [], o = {}) {
  drawShell(g, cam, E, o);
  if (o.under) o.under(g, cam, E);
  fridgeLight(g, cam, E, o.light == null ? 1 : o.light);
  const items = [
    { n: 'counter', x: 0, z: 5.7, draw: () => drawCounter(g, cam, E) },
    { n: 'fridge', x: 1.77, z: 5.65, draw: () => drawFridge(g, cam, E, o.fridgeOpen == null ? 1 : o.fridgeOpen) },
    { n: 'table', x: 0.25, z: 2.75, draw: () => drawTable(g, cam, E) },
    { n: 'chair1', x: 0.25, z: 3.45, draw: () => drawChair(g, cam, E, 0.05, 3.25, 1) },
    { n: 'chair2', x: -0.75, z: 2.2, draw: () => drawChair(g, cam, E, -0.95, 2.45, 1) },
    { n: 'pendant', x: 0.25, z: 2.8, draw: () => drawPendant(g, cam, E) },
    ...extras.map(e => ({ n: 'x', x: e.x == null ? 0 : e.x, z: e.z, draw: () => e.draw(g, cam, E) })),
  ].filter(it => !o.skip || !o.skip.includes(it.n));
  items.forEach(it => it.d = camSpace(cam, it.x, cam.y, it.z)[2]);
  items.sort((a, b) => b.d - a.d).forEach(it => it.draw());
  lightDust(g, cam, E, 1);
  if (o.over) o.over(g, cam, E);
}

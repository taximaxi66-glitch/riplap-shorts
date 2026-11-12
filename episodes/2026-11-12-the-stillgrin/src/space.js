// =====================================================================
// shared 2.5D space helpers (yaw camera, projected polys, boxes) - Part 3 comic look
// camera: {x, y, z, f, hy, yaw (deg, + turns right), cx}
// world: x right, y up, z into the room. Back wall z = 6, floor y = 0, ceiling y = 2.55
// =====================================================================
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
  if (E.rainOut === 0) { g.restore(); return; }
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

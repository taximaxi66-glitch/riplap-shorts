// =====================================================================
// THE STILLGRIN: the back garden at midnight (same comic 2.5D look as Part 3)
// garden world: the back wall of your house is the plane z = 0, the garden runs to +z.
// lawn y = 0. Back fence z = 16 (1.95 m boards). Side fences x = +-7. Shed back right with a motion light.
// a camera at the house looks +z (yaw 0); turned round (yaw 180) it looks back at the house.
// =====================================================================
const KC = { ink: '#0b0c12' };
const GD = { fenceZ: 16, fenceH: 1.95, side: 7, shed: { x0: 2.3, x1: 5.4, z0: 12.4, z1: 15.2, h: 2.25, ridge: 2.85 }, lamp: [3.0, 2.02, 12.33], bins: [{ x: 5.9, z: 6.6, col: [26, 48, 34] }, { x: 5.9, z: 7.45, col: [28, 30, 36] }], swing: { x0: -4.7, x1: -2.5, z: 9.2, h: 2.1 }, tree: [-5.0, 13.6] };
const LAMP_COL = [205, 225, 255];
function gardenEnv(t, extra = {}) { return envAt(t, 0, Object.assign({ fogDist: 34, lamp: 0, rain: 0, motes: 0.5, bats: 1, kitchen: 1 }, extra)); }
const fkz = (E, cam, x, y, z) => fogK(E, Math.max(0, camSpace(cam, x, y, z)[2]));
function fogc(c, E, cam, x, y, z, m = 1) { return rgb(mixc(c, E.P.fog, fkz(E, cam, x, y, z) * m)); }
// how much the shed lamp lights a world point (0..1), smooth falloff
function lampAt(E, x, y, z) { if (!E.lamp) return 0; const L = GD.lamp, d = Math.hypot(x - L[0], (y - L[1]) * 0.8, z - L[2]); return E.lamp * Math.pow(clamp(1.1 - d / 6.5), 1.5) * (z < L[2] + 0.4 ? 1 : 0.15); }
function litc(c, E, cam, x, y, z, m = 1) { const k = lampAt(E, x, y, z); const base = mixc(c, E.P.fog, fkz(E, cam, x, y, z) * m * (1 - k * 0.6)); const hi = [Math.min(255, c[0] * 1.5 + 14), Math.min(255, c[1] * 1.55 + 18), Math.min(255, c[2] * 1.7 + 28)]; return rgb(mixc(base, hi, Math.min(0.45, k * 0.65))); }

// ---------- beyond the back fence: neighbours' houses, trees ----------
const GFARH = (() => { const r = rng(191), a = []; let x = -24; while (x < 24) { const w = 5 + r() * 3; a.push({ x0: x, x1: x + w, z: 27 + r() * 4, h: 3.6 + r() * 1.8, roof: 1.8 + r() * 1.2, lit: r() < 0.3, col: [hex('#232838'), hex('#2a2629'), hex('#20292f')][(r() * 3) | 0] }); x += w + 3 + r() * 3; } return a; })();
const GFART = (() => { const r = rng(193), a = []; for (let i = 0; i < 24; i++) a.push({ x: -26 + r() * 52, z: 18.5 + r() * 16, h: 6 + r() * 6, seed: r() * 100, dead: r() < 0.45 }); return a; })();
function drawFarHouse(g, cam, E, h) {
  const fk = fkz(E, cam, (h.x0 + h.x1) / 2, 0, h.z), wall = rgb(mixc(h.col, E.P.fog, fk * 0.8)), roof = rgb(mixc([12, 13, 18], E.P.fog, fk * 0.8)), xm = (h.x0 + h.x1) / 2;
  fillQ(g, cam, [[h.x0, 0, h.z], [h.x1, 0, h.z], [h.x1, h.h, h.z], [h.x0, h.h, h.z]], wall, 'rgba(0,0,0,0.4)');
  fillQ(g, cam, [[h.x0 - 0.3, h.h, h.z - 0.01], [h.x1 + 0.3, h.h, h.z - 0.01], [xm, h.h + h.roof, h.z - 0.01]], roof, 'rgba(0,0,0,0.4)');
  fillQ(g, cam, [[xm + 0.8, h.h + h.roof * 0.4, h.z - 0.02], [xm + 1.3, h.h + h.roof * 0.4, h.z - 0.02], [xm + 1.3, h.h + h.roof + 0.5, h.z - 0.02], [xm + 0.8, h.h + h.roof + 0.5, h.z - 0.02]], roof, null);
  const nw = Math.max(2, Math.floor((h.x1 - h.x0) / 1.8));
  for (let i = 0; i < nw; i++) { const wx = lerp(h.x0, h.x1, (i + 0.5) / nw); for (const fl of [0, 1]) { const wy = fl ? h.h - 1.4 : 0.9; if (wy + 1 > h.h) continue; const lit = h.lit && i === 1 && fl === 1;
    const sp = fillQ(g, cam, [[wx - 0.35, wy, h.z - 0.01], [wx + 0.35, wy, h.z - 0.01], [wx + 0.35, wy + 0.9, h.z - 0.01], [wx - 0.35, wy + 0.9, h.z - 0.01]], lit ? rgb(mixc([255, 190, 110], E.P.fog, fk * 0.5)) : rgb(mixc([8, 10, 16], E.P.fog, fk * 0.8)), 'rgba(0,0,0,0.3)');
    if (lit && sp) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, (sp[0][0] + sp[2][0]) / 2, (sp[0][1] + sp[2][1]) / 2, 50, [255, 170, 90], 0.3); g.restore(); } } }
}
// ---------- lawn, stepping stones, flower bed ----------
function gardenGround(g, cam, E) {
  // ground beyond the fence (rarely seen) + the lawn
  fillQ(g, cam, [[-60, -0.02, 60], [60, -0.02, 60], [60, -0.02, GD.fenceZ], [-60, -0.02, GD.fenceZ]], fogc([10, 14, 14], E, cam, 0, 0, 25), null);
  { const sp = projPoly(cam, [[-GD.side, 0, -2], [GD.side, 0, -2], [GD.side, 0, GD.fenceZ], [-GD.side, 0, GD.fenceZ]]); if (sp.length > 2) { const n = proj(cam, 0, 0, Math.max(cam.z + 1, 0.5)), f = proj(cam, 0, 0, GD.fenceZ); const gr = g.createLinearGradient(0, n ? Math.min(H, n[1]) : H, 0, f ? f[1] : 0); gr.addColorStop(0, '#0d1712'); gr.addColorStop(1, rgb(mixc([18, 30, 23], E.P.fog, 0.25))); g.fillStyle = gr; g.beginPath(); polyPath(g, sp); g.fill(); } }
  // warm kitchen light spilling out of the open back door
  if ((E.kitchen == null ? 1 : E.kitchen) > 0 && cam.z > -1) { const c = proj(cam, 0, 0, 1.6), f = proj(cam, 0, 0, 3.2); if (c) { const rx = 2.2 * c[2], ry = Math.max(10, f ? Math.abs(c[1] - f[1]) * 0.9 : rx * 0.3); g.save(); g.globalCompositeOperation = 'lighter'; g.translate(c[0], c[1]); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(255,170,100,0.2)'); gr.addColorStop(1, 'rgba(255,160,90,0)'); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); } }
  // mown stripes
  for (let x = -6; x < 7; x += 2) fillQ(g, cam, [[x, 0.001, 0.6], [x + 1, 0.001, 0.6], [x + 1, 0.001, GD.fenceZ - 0.6], [x, 0.001, GD.fenceZ - 0.6]], 'rgba(30,48,36,0.18)', null);
  // dark patches
  const r = rng(61); for (let i = 0; i < 24; i++) { const x = -6.5 + r() * 13, z = 1 + r() * 14; const p = proj(cam, x, 0, z); if (p) { g.fillStyle = 'rgba(4,8,6,0.3)'; ell(g, p[0], p[1], 0.8 * p[2], 0.2 * p[2]); g.fill(); } }
  // patio slabs by the house
  for (let x = -2.4; x < 2.4; x += 0.8) for (let z = 0; z < 1.6; z += 0.8) fillQ(g, cam, [[x + 0.02, 0.012, z + 0.02], [x + 0.78, 0.012, z + 0.02], [x + 0.78, 0.012, z + 0.78], [x + 0.02, 0.012, z + 0.78]], fogc([52, 54, 60], E, cam, x, 0, z, 0.7), 'rgba(8,8,12,0.6)');
  // stepping stones from the patio to the shed
  for (let i = 0; i < 12; i++) { const k = i / 11, z = lerp(2.2, 11.6, k), x = lerp(0.3, 3.1, k * k) + Math.sin(i * 1.7) * 0.08; disc3(g, cam, [x, 0.012, z], [1, 0, 0], [0, 0, 1], 0.27, litc([62, 64, 70], E, cam, x, 0, z, 0.8), 'rgba(6,6,10,0.7)', 18); }
  // flower bed along the left fence
  fillQ(g, cam, [[-GD.side, 0.01, 1], [-GD.side + 1.1, 0.01, 1], [-GD.side + 1.1, 0.01, 12], [-GD.side, 0.01, 12]], fogc([22, 16, 14], E, cam, -6, 0, 6, 0.7), null);
}
const GTUFTS = (() => { const r = rng(67), a = []; for (let i = 0; i < 170; i++) { const z = 1.7 + r() * 13.8, x = -6.6 + r() * 13.2; a.push({ x, z, h: 0.08 + r() * 0.14, s: r() * 10 }); } return a; })();
function drawTuft(g, cam, E, tf) {
  const p = proj(cam, tf.x, 0, tf.z); if (!p || p[2] < 6) return; const sw = Math.sin(E.t * 1.6 + tf.s) * 0.04 + noise(E.t * 0.5 + tf.s) * 0.03;
  g.strokeStyle = litc([26, 42, 30], E, cam, tf.x, 0, tf.z, 0.7); g.lineWidth = Math.max(1, 0.012 * p[2]); g.lineCap = 'round'; g.beginPath();
  for (let k = -2; k <= 2; k++) { g.moveTo(p[0] + k * 0.02 * p[2], p[1]); g.quadraticCurveTo(p[0] + (k * 0.03 + sw * 0.5) * p[2], p[1] - tf.h * 0.6 * p[2], p[0] + (k * 0.05 + sw) * p[2], p[1] - tf.h * (1 - Math.abs(k) * 0.15) * p[2]); }
  g.stroke();
}
// ---------- fences: tall vertical boards ----------
function boardCol(E, cam, x, y, z, i) { const v = hash(i * 7.1) * 10; return litc([52 + v, 44 + v * 0.8, 40 + v * 0.6], E, cam, x, y, z, 0.8); }
function drawBackFence(g, cam, E, x0 = -GD.side, x1 = GD.side) {
  const z = GD.fenceZ, H = GD.fenceH;
  // rails behind the boards are hidden; boards with slightly uneven tops
  for (let x = x0, i = 0; x < x1 - 0.01; x += 0.15, i++) {
    const h = H + (hash(i * 3.7) - 0.5) * 0.04, lean = (hash(i * 1.3) - 0.5) * 0.01;
    fillQ(g, cam, [[x, 0, z], [x + 0.145, 0, z], [x + 0.145 + lean, h, z], [x + lean, h, z]], boardCol(E, cam, x, 1, z, i), 'rgba(8,6,6,0.75)');
  }
  // knots + a dark gap here and there
  for (let i = 0; i < 18; i++) { const x = x0 + hash(i * 9.3) * (x1 - x0), y = 0.3 + hash(i * 4.1) * 1.4, p = proj(cam, x, y, z - 0.005); if (p) { g.fillStyle = 'rgba(20,14,12,0.7)'; ell(g, p[0], p[1], 0.025 * p[2], 0.035 * p[2]); g.fill(); } }
  // posts every 2 m
  for (let x = x0; x <= x1 + 0.01; x += 2) box3(g, cam, x - 0.05, x + 0.05, 0, H + 0.05, z - 0.06, z, { front: litc([40, 34, 30], E, cam, x, 1, z), side: litc([30, 25, 22], E, cam, x, 1, z), top: litc([60, 52, 46], E, cam, x, 2, z) });
}
function drawSideFence(g, cam, E, sd) {
  const x = sd * GD.side, H = GD.fenceH;
  for (let z = 0, i = 0; z < GD.fenceZ - 0.01; z += 0.15, i++) {
    const h = H + (hash(i * 2.9 + sd) - 0.5) * 0.04;
    fillQ(g, cam, [[x, 0, z], [x, 0, z + 0.145], [x, h, z + 0.145], [x, h, z]], boardCol(E, cam, x, 1, z, i + 50 * sd), 'rgba(8,6,6,0.6)');
  }
}
// ---------- the shed + the motion light ----------
function drawShed(g, cam, E) {
  const S = GD.shed, c = (col, x, y, z) => litc(col, E, cam, x, y, z, 0.8), zm = (S.z0 + S.z1) / 2;
  // walls
  box3(g, cam, S.x0, S.x1, 0, S.h, S.z0, S.z1, { front: c([40, 33, 28], 3.8, 1, S.z0), side: c([30, 25, 22], S.x0, 1, zm), back: c([30, 25, 22], 3.8, 1, S.z1), top: '#1a1614' });
  // shiplap lines on the front
  for (let y = 0.18; y < S.h; y += 0.18) line3(g, cam, [S.x0, y, S.z0 - 0.003], [S.x1, y, S.z0 - 0.003], 'rgba(12,9,8,0.55)', null);
  if (cam.x < S.x0) for (let y = 0.18; y < S.h; y += 0.18) line3(g, cam, [S.x0 - 0.003, y, S.z0], [S.x0 - 0.003, y, S.z1], 'rgba(12,9,8,0.55)', null);
  // gable roof (ridge along z): two slopes + front gable triangle
  const ov = 0.2, rx = (S.x0 + S.x1) / 2;
  fillQ(g, cam, [[S.x0 - ov, S.h - 0.1, S.z0 - ov], [rx, S.ridge, S.z0 - ov], [rx, S.ridge, S.z1 + ov], [S.x0 - ov, S.h - 0.1, S.z1 + ov]], c([30, 28, 30], S.x0, 2.5, zm), KC.ink);
  fillQ(g, cam, [[S.x1 + ov, S.h - 0.1, S.z0 - ov], [rx, S.ridge, S.z0 - ov], [rx, S.ridge, S.z1 + ov], [S.x1 + ov, S.h - 0.1, S.z1 + ov]], c([24, 22, 24], S.x1, 2.5, zm), KC.ink);
  fillQ(g, cam, [[S.x0, S.h, S.z0 - 0.002], [S.x1, S.h, S.z0 - 0.002], [rx, S.ridge - 0.05, S.z0 - 0.002]], c([36, 30, 26], rx, 2.5, S.z0), KC.ink);
  fillQ(g, cam, [[S.x0 - ov, S.h - 0.1, S.z0 - ov], [rx, S.ridge, S.z0 - ov], [rx, S.ridge + 0.08, S.z0 - ov], [S.x0 - ov, S.h - 0.02, S.z0 - ov]], '#141214', KC.ink);
  fillQ(g, cam, [[S.x1 + ov, S.h - 0.1, S.z0 - ov], [rx, S.ridge, S.z0 - ov], [rx, S.ridge + 0.08, S.z0 - ov], [S.x1 + ov, S.h - 0.02, S.z0 - ov]], '#141214', KC.ink);
  // door (planked, Z-brace), padlock hasp
  const dx0 = 3.75, dx1 = 4.65, dh = 1.9, dz = S.z0 - 0.01;
  fillQ(g, cam, [[dx0, 0.02, dz], [dx1, 0.02, dz], [dx1, dh, dz], [dx0, dh, dz]], c([34, 28, 24], 4.2, 1, dz), KC.ink);
  for (let x = dx0 + 0.15; x < dx1; x += 0.15) line3(g, cam, [x, 0.03, dz - 0.002], [x, dh - 0.01, dz - 0.002], 'rgba(10,8,6,0.6)', null);
  for (const [a, b] of [[0.25, 0.35], [1.55, 1.65]]) fillQ(g, cam, [[dx0 + 0.04, a, dz - 0.004], [dx1 - 0.04, a, dz - 0.004], [dx1 - 0.04, b, dz - 0.004], [dx0 + 0.04, b, dz - 0.004]], c([62, 52, 44], 4.2, 1, dz), 'rgba(8,6,6,0.7)');
  fillQ(g, cam, [[dx0 + 0.06, 0.35, dz - 0.004], [dx0 + 0.16, 0.35, dz - 0.004], [dx1 - 0.06, 1.55, dz - 0.004], [dx1 - 0.16, 1.55, dz - 0.004]], c([62, 52, 44], 4.2, 1, dz), 'rgba(8,6,6,0.7)');
  box3(g, cam, dx0 + 0.05, dx0 + 0.13, 0.95, 1.08, dz - 0.04, dz, { front: '#55565c', side: '#3a3b40' });
  // small window, dark, with cobweb
  const wx0 = 2.6, wx1 = 3.4, wy0 = 1.05, wy1 = 1.65, wz = S.z0 - 0.01;
  fillQ(g, cam, [[wx0 - 0.06, wy0 - 0.06, wz], [wx1 + 0.06, wy0 - 0.06, wz], [wx1 + 0.06, wy1 + 0.06, wz], [wx0 - 0.06, wy1 + 0.06, wz]], c([70, 62, 54], 3, 1.3, wz), KC.ink);
  const ws = fillQ(g, cam, [[wx0, wy0, wz - 0.003], [wx1, wy0, wz - 0.003], [wx1, wy1, wz - 0.003], [wx0, wy1, wz - 0.003]], '#06080d', KC.ink);
  if (ws) { g.save(); g.beginPath(); polyPath(g, ws); g.clip(); const gr = g.createLinearGradient(ws[0][0], ws[3][1], ws[1][0], ws[0][1]); gr.addColorStop(0, 'rgba(140,160,200,0.10)'); gr.addColorStop(0.5, 'rgba(140,160,200,0)'); gr.addColorStop(1, 'rgba(140,160,200,0.14)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  line3(g, cam, [3.0, wy0, wz - 0.006], [3.0, wy1, wz - 0.006], c([70, 62, 54], 3, 1.3, wz), null);
  // water butt + leaning spade on the side
  const bp = [S.x0 - 0.35, 0, 13.4]; box3(g, cam, bp[0] - 0.25, bp[0] + 0.25, 0, 0.95, bp[2] - 0.25, bp[2] + 0.25, { front: c([22, 30, 26], bp[0], 0.5, bp[2]), side: c([16, 22, 20], bp[0], 0.5, bp[2]), top: '#0a0c0c' });
  wLimb(g, cam, [[S.x0 - 0.06, 0.05, 14.2], [S.x0 - 0.06, 1.35, 14.45]], 0.035, c([70, 52, 36], S.x0, 1, 14.3), '#2a2018');
  // the motion light: bracket, black housing, sensor dome, LED face
  const L = GD.lamp, on = E.lamp || 0;
  box3(g, cam, L[0] - 0.03, L[0] + 0.03, L[1] + 0.02, L[1] + 0.12, L[2], S.z0, { front: '#141416' });
  box3(g, cam, L[0] - 0.16, L[0] + 0.16, L[1] - 0.1, L[1] + 0.1, L[2] - 0.12, L[2], { front: '#1c1d22', side: '#141418', top: '#26272c', bottom: '#101014' });
  fillQ(g, cam, [[L[0] - 0.13, L[1] - 0.075, L[2] - 0.125], [L[0] + 0.13, L[1] - 0.075, L[2] - 0.125], [L[0] + 0.13, L[1] + 0.075, L[2] - 0.125], [L[0] - 0.13, L[1] + 0.075, L[2] - 0.125]], rgb(mixc([60, 64, 70], [250, 252, 255], on)), KC.ink);
  disc3(g, cam, [L[0], L[1] - 0.16, L[2] - 0.08], [1, 0, 0], [0, 0, 1], 0.045, '#3a3b42', KC.ink, 14);
  { const s = proj(cam, L[0] + 0.025, L[1] - 0.16, L[2] - 0.11); if (s) { g.fillStyle = on > 0.5 ? 'rgba(255,60,50,0.95)' : 'rgba(120,30,30,0.7)'; ell(g, s[0], s[1], Math.max(1.5, 0.008 * s[2]), Math.max(1.5, 0.008 * s[2])); g.fill(); } }
}
// cold flood light from the lamp: glare, cone in the fog, pool on the lawn, wash on the fence
function lampLight(g, cam, E) {
  const k = E.lamp || 0; if (k <= 0.003) return; const L = GD.lamp;
  g.save(); g.globalCompositeOperation = 'lighter';
  // pool on the lawn (ellipse projected through two ground points)
  const pc = proj(cam, 2.4, 0, 9.4), pn = proj(cam, 2.4, 0, 6.0), pf = proj(cam, 2.4, 0, 12.2);
  if (pc) { const rx = 5.2 * pc[2], ry = Math.max(12, pn && pf ? Math.abs(pn[1] - pf[1]) * 0.6 : rx * 0.25); g.save(); g.translate(pc[0], pc[1]); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgb(LAMP_COL, 0.16 * k)); gr.addColorStop(0.5, rgb(LAMP_COL, 0.06 * k)); gr.addColorStop(1, rgb(LAMP_COL, 0)); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
  // the cone in the haze
  const c0 = proj(cam, L[0], L[1] - 0.05, L[2] - 0.13), g1 = proj(cam, 0.2, 0, 7.5), g2 = proj(cam, 4.8, 0, 7.5);
  if (c0 && g1 && g2) { const gr = g.createLinearGradient(c0[0], c0[1], (g1[0] + g2[0]) / 2, g1[1]); gr.addColorStop(0, rgb(LAMP_COL, 0.05 * k)); gr.addColorStop(1, rgb(LAMP_COL, 0)); g.fillStyle = gr; poly(g, [[c0[0] - 6, c0[1]], [c0[0] + 6, c0[1]], [g2[0], g2[1]], [g1[0], g1[1]]]); g.fill(); }
  if (c0) { const s = c0[2]; glow(g, c0[0], c0[1], Math.min(1100, Math.max(60, 2.2 * s)), LAMP_COL, 0.22 * k); glow(g, c0[0], c0[1], Math.max(16, 0.45 * s), [235, 242, 255], 0.75 * k); glow(g, c0[0], c0[1], Math.max(6, 0.14 * s), [255, 255, 255], 0.95 * k); }
  g.restore();
  // moths circling the lamp
  for (let i = 0; i < 4; i++) { const a = E.t * (3 + i * 0.9) + i * 1.7, r_ = 0.14 + (i % 3) * 0.08, m = proj(cam, L[0] + Math.cos(a) * r_, L[1] - 0.1 + Math.sin(a * 1.3) * r_ * 0.8, L[2] - 0.3 + Math.sin(a) * 0.12); if (!m) continue;
    const fl = Math.abs(Math.sin(E.t * 30 + i)); g.fillStyle = rgb([70, 60, 52], 0.95 * k); ell(g, m[0], m[1], 0.012 * m[2] * (0.5 + fl), 0.007 * m[2]); g.fill(); }
}
// ---------- wheelie bins ----------
function drawBin(g, cam, E, b, o = {}) {
  const x0 = b.x - 0.3, x1 = b.x + 0.3, z0 = b.z - 0.36, z1 = b.z + 0.36, h = 1.0, c = (k) => litc(b.col.map(v => v * k), E, cam, b.x, 0.6, b.z, 0.7);
  // slightly tapered body (wider at the top), front recess, handle, wheels
  const tp = 0.03, F = [[x0 + tp, 0.05, z0 + tp], [x1 - tp, 0.05, z0 + tp], [x1, h, z0], [x0, h, z0]], Bk = [[x0 + tp, 0.05, z1 - tp], [x1 - tp, 0.05, z1 - tp], [x1, h, z1], [x0, h, z1]];
  if (cam.x < x0) fillQ(g, cam, [F[0], Bk[0], Bk[3], F[3]], c(0.72), KC.ink); if (cam.x > x1) fillQ(g, cam, [F[1], Bk[1], Bk[2], F[2]], c(0.72), KC.ink);
  if (cam.z < z0) fillQ(g, cam, F, c(0.95), KC.ink); else fillQ(g, cam, Bk, c(0.85), KC.ink);
  if (cam.z < z0) { fillQ(g, cam, [[x0 + 0.08, 0.25, z0 - 0.002], [x1 - 0.08, 0.25, z0 - 0.002], [x1 - 0.07, 0.85, z0 - 0.002], [x0 + 0.07, 0.85, z0 - 0.002]], c(0.8), 'rgba(0,0,0,0.35)');
    const nm = proj(cam, b.x, 0.6, z0 - 0.004); if (nm && nm[2] > 120) { g.fillStyle = 'rgba(230,230,220,0.55)'; g.font = `900 ${Math.round(0.09 * nm[2])}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('27', nm[0], nm[1]); } }
  for (let y = 0.3; y < h - 0.1; y += 0.22) if (cam.x < x0) line3(g, cam, [x0 - 0.003, y, z0 + 0.05], [x0 - 0.003, y, z1 - 0.05], 'rgba(0,0,0,0.3)', null);
  box3(g, cam, x0 + 0.05, x1 - 0.05, h - 0.06, h - 0.02, z1 + 0.02, z1 + 0.07, { front: c(0.6), top: c(0.7), side: c(0.5) });   // handle bar at the back
  // lid (open angle o.lid degrees, hinged at the back), with a rim
  const la = (o.lid || 0) * D2R, hz = z1, P = (x, u, dy = 0) => [x, h + dy + Math.sin(la) * u * 0.78, hz - Math.cos(la) * u * 0.78];
  fillQ(g, cam, [P(x0 - 0.02, 0), P(x1 + 0.02, 0), P(x1 + 0.02, 1), P(x0 - 0.02, 1)], c(1.15), KC.ink);
  fillQ(g, cam, [P(x0 - 0.02, 1), P(x1 + 0.02, 1), P(x1 + 0.02, 1, -0.05), P(x0 - 0.02, 1, -0.05)], c(0.7), KC.ink);
  if (la > 0.2) { const ins = fillQ(g, cam, [[x0 + 0.02, h - 0.005, z0 + 0.02], [x1 - 0.02, h - 0.005, z0 + 0.02], [x1 - 0.02, h - 0.005, z1 - 0.02], [x0 + 0.02, h - 0.005, z1 - 0.02]], '#050608', KC.ink); }
  for (const x of [x0 + 0.05, x1 - 0.05]) disc3(g, cam, [x, 0.1, z1 - 0.02], [0, 1, 0], [0, 0, 1], 0.1, '#0b0b0e', KC.ink, 14);
}
// ---------- swing set (the swing still moving) ----------
function drawSwing(g, cam, E, sw) {
  const S = GD.swing, col = litc([70, 74, 82], E, cam, -3.6, 1, S.z), z = S.z;
  for (const x of [S.x0, S.x1]) { wLimb(g, cam, [[x, 0, z - 0.7], [x, S.h, z]], 0.07, col, '#2a2c32'); wLimb(g, cam, [[x, 0, z + 0.7], [x, S.h, z]], 0.07, col, '#2a2c32'); }
  wLimb(g, cam, [[S.x0, S.h, z], [S.x1, S.h, z]], 0.08, col, '#2a2c32');
  const a = sw == null ? Math.sin(E.t * 2.1) * 0.28 : sw, cx = (S.x0 + S.x1) / 2, top = S.h, L = 1.6, seatY = top - Math.cos(a) * L, seatZ = z + Math.sin(a) * L;
  for (const dx of [-0.22, 0.22]) line3(g, cam, [cx + dx, top, z], [cx + dx, seatY, seatZ], litc([150, 150, 150], E, cam, cx, 1, z), null);
  box3(g, cam, cx - 0.26, cx + 0.26, seatY - 0.04, seatY, seatZ - 0.11, seatZ + 0.11, { front: litc([110, 40, 34], E, cam, cx, 1, z), top: litc([140, 54, 44], E, cam, cx, 1, z), side: litc([80, 30, 26], E, cam, cx, 1, z) });
  const p = proj(cam, cx, 0.003, seatZ); if (p) { g.fillStyle = 'rgba(0,0,0,0.3)'; ell(g, p[0], p[1], 0.35 * p[2], 0.07 * p[2]); g.fill(); }
}
// ---------- the big bare tree in the back corner ----------
function drawGTree(g, cam, E, x = GD.tree[0], z = GD.tree[1]) {
  const b = proj(cam, x, 0, z); if (!b) return; const fk = fkz(E, cam, x, 0, z) * 0.6, col = rgb(mixc([12, 12, 16], E.P.fog, fk)), r = rng(5);
  const br = (p, a, l, w, d) => { const sw = (noise(E.t * 0.5 + d * 1.7 + a) * 0.06 + Math.sin(E.t * 1.1 + d) * 0.025) * d;
    const q = [p[0] + Math.cos(a + sw) * l, p[1] + Math.sin(a + sw) * l, p[2]]; const A = proj(cam, ...p), B = proj(cam, ...q); if (A && B) { g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = Math.max(1, w * A[2]); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); }
    if (d < 5) { br(q, a - 0.35 - r() * 0.45, l * 0.72, w * 0.62, d + 1); br(q, a + 0.3 + r() * 0.45, l * 0.7, w * 0.6, d + 1); } };
  br([x, 0, z], Math.PI / 2 + 0.08, 3.0, 0.38, 0);
}
// ---------- the house (seen when you turn round): back wall, open back door, lit kitchen window ----------
function drawHouseBack(g, cam, E, o = {}) {
  const c = '#2e3446', kw = E.kitchen == null ? 1 : E.kitchen;
  fillQ(g, cam, [[-8, 0, 0], [8, 0, 0], [8, 5.8, 0], [-8, 5.8, 0]], c, KC.ink);
  for (let y = 0.3; y < 5.8; y += 0.3) line3(g, cam, [-8, y, 0.001], [8, y, 0.001], 'rgba(8,10,16,0.35)', null);
  box3(g, cam, -8.2, 8.2, 5.7, 5.9, 0, 0.4, { front: '#161922', bottom: '#11131a', top: '#1d2029' });
  // door frame + open door (swung inward, so we look into the warm kitchen)
  const dx0 = -0.45, dx1 = 0.45, dh = 2.05;
  const ds = fillQ(g, cam, [[dx0, 0, 0.002], [dx1, 0, 0.002], [dx1, dh, 0.002], [dx0, dh, 0.002]], rgb(mixc([40, 26, 18], [255, 196, 130], kw)), KC.ink);
  if (ds) { g.save(); g.beginPath(); polyPath(g, ds); g.clip(); // a slice of kitchen: cupboards, tiles
    fillQ(g, cam, [[dx0 - 1, 0, -3], [dx1 + 1, 0, -3], [dx1 + 1, 2.4, -3], [dx0 - 1, 2.4, -3]], rgb(mixc([30, 22, 16], [235, 180, 120], kw)), null);
    box3(g, cam, -1.4, 0.2, 0, 0.9, -3, -2.4, { front: rgb(mixc([30, 26, 24], [180, 140, 100], kw)), top: rgb(mixc([30, 26, 24], [220, 200, 170], kw)), ink: 'rgba(30,20,10,0.6)' });
    fillQ(g, cam, [[dx0, 0, -0.01], [dx1, 0, -0.01], [dx1 - 0.2, 0, -0.9], [dx0, 0, -0.9]], rgb(mixc([30, 22, 16], [200, 150, 100], kw)), null);
    g.restore(); }
  fillQ(g, cam, [[dx0 - 0.05, 0, 0.004], [dx0, 0, 0.004], [dx0, dh + 0.05, 0.004], [dx0 - 0.05, dh + 0.05, 0.004]], '#3a3a40', KC.ink);
  fillQ(g, cam, [[dx1, 0, 0.004], [dx1 + 0.05, 0, 0.004], [dx1 + 0.05, dh + 0.05, 0.004], [dx1, dh + 0.05, 0.004]], '#3a3a40', KC.ink);
  fillQ(g, cam, [[dx1, 0, 0.002], [dx1, 0, -0.85], [dx1, dh, -0.85], [dx1, dh, 0.002]], rgb(mixc([30, 30, 34], [120, 90, 64], kw)), KC.ink);
  // kitchen window, warm
  const ws = fillQ(g, cam, [[1.0, 1.0, 0.003], [2.6, 1.0, 0.003], [2.6, 2.1, 0.003], [1.0, 2.1, 0.003]], rgb(mixc([14, 16, 24], [255, 190, 120], kw)), KC.ink);
  if (ws) { line3(g, cam, [1.8, 1.0, 0.005], [1.8, 2.1, 0.005], '#2a2a30', null); box3(g, cam, 0.9, 2.7, 0.92, 1.0, 0, 0.12, { front: '#454c60', top: '#555e74' }); }
  if (kw > 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (const p of [proj(cam, 0, 1.2, 0.01), proj(cam, 1.8, 1.5, 0.01)]) if (p) glow(g, p[0], p[1], Math.min(900, 2.0 * p[2]), [255, 170, 100], 0.2 * kw); const fl = proj(cam, 0, 0, 1.2); if (fl) { g.save(); g.translate(fl[0], fl[1]); g.scale(1, 0.25); glow(g, 0, 0, 1.6 * fl[2], [255, 180, 110], 0.18 * kw); g.restore(); } g.restore(); }
  for (const [a, b] of [[-3.0, -1.8], [1.2, 2.4]]) { fillQ(g, cam, [[a, 3.3, 0.003], [b, 3.3, 0.003], [b, 4.4, 0.003], [a, 4.4, 0.003]], '#0a0d16', KC.ink); line3(g, cam, [(a + b) / 2, 3.3, 0.005], [(a + b) / 2, 4.4, 0.005], '#3a4052', null); box3(g, cam, a - 0.1, b + 0.1, 3.22, 3.3, 0, 0.12, { front: '#454c60', top: '#555e74' }); }
  box3(g, cam, -3.9, -3.8, 0, 5.7, 0.02, 0.12, { front: '#1a1d26', side: '#14161e' });
  // outdoor tap + a pot plant
  box3(g, cam, 2.9, 3.0, 0.5, 0.62, 0, 0.12, { front: '#7a6a40' });
  box3(g, cam, -1.6, -1.2, 0, 0.42, 0.2, 0.6, { front: '#6a3a2a', side: '#55301f', top: '#1a1210' });
}
// ---------- small garden props (foreground life) ----------
function drawProps(g, cam, E) {
  // red ball
  { const p = proj(cam, -1.7, 0.12, 3.8); if (p) { g.fillStyle = 'rgba(0,0,0,0.4)'; ell(g, p[0], p[1] + 0.11 * p[2], 0.16 * p[2], 0.04 * p[2]); g.fill(); g.fillStyle = litc([120, 30, 28], E, cam, -1.7, 0, 3.8); g.strokeStyle = KC.ink; g.lineWidth = Math.max(1, p[2] * 0.008); ell(g, p[0], p[1], 0.12 * p[2], 0.12 * p[2]); g.fill(); g.stroke(); g.strokeStyle = 'rgba(230,220,200,0.5)'; g.beginPath(); g.arc(p[0], p[1], 0.12 * p[2], -2.2, -0.6); g.stroke(); } }
  // watering can
  box3(g, cam, 1.3, 1.6, 0, 0.3, 1.8, 2.0, { front: litc([40, 70, 60], E, cam, 1.4, 0, 1.9), side: litc([30, 52, 46], E, cam, 1.4, 0, 1.9), top: litc([50, 84, 72], E, cam, 1.4, 0, 1.9) });
  wLimb(g, cam, [[1.6, 0.12, 1.9], [1.85, 0.36, 1.9]], 0.03, litc([40, 70, 60], E, cam, 1.4, 0, 1.9), '#1a2a24');
  // two plastic garden chairs + a small table
  for (const [x, z, a] of [[-2.6, 2.6, 0.3], [-3.6, 3.3, -0.2]]) { const c1 = litc([150, 152, 150], E, cam, x, 0, z), c2 = litc([110, 112, 110], E, cam, x, 0, z);
    box3(g, cam, x - 0.24, x + 0.24, 0.42, 0.47, z - 0.22, z + 0.22, { front: c2, top: c1, side: c2 }); box3(g, cam, x - 0.24, x + 0.24, 0.47, 0.95, z + 0.18, z + 0.24, { front: c1, side: c2, back: c1, top: c1 });
    for (const dx of [-0.2, 0.2]) for (const dz of [-0.18, 0.18]) wLimb(g, cam, [[x + dx, 0, z + dz], [x + dx, 0.43, z + dz]], 0.03, c2, '#3a3a3a'); }
  box3(g, cam, -3.4, -2.8, 0.55, 0.6, 1.6, 2.1, { front: litc([120, 120, 118], E, cam, -3, 0, 2), top: litc([150, 150, 148], E, cam, -3, 0, 2) }); wLimb(g, cam, [[-3.1, 0, 1.85], [-3.1, 0.55, 1.85]], 0.05, '#555', '#333');
  // hose reel against the house
  disc3(g, cam, [3.2, 0.3, 0.25], [1, 0, 0], [0, 1, 0], 0.28, litc([40, 90, 50], E, cam, 3.2, 0.3, 0.3), KC.ink, 20); disc3(g, cam, [3.2, 0.3, 0.24], [1, 0, 0], [0, 1, 0], 0.1, '#14181a', KC.ink, 14);
}
function drawShrubs(g, cam, E) {
  for (let i = 0; i < 9; i++) { const z = 1.6 + i * 1.25, x = -6.45, p = proj(cam, x, 0, z); if (!p) continue; const s = p[2], sw = Math.sin(E.t * 1.2 + i) * 0.03 * s, w = 0.5 + hash(i) * 0.3;
    g.fillStyle = litc([14, 26, 20], E, cam, x, 0.4, z); for (let k = 0; k < 5; k++) { ell(g, p[0] + (k - 2) * w * 0.22 * s + sw, p[1] - 0.35 * s - (k % 2) * 0.12 * s, w * 0.3 * s, 0.4 * s); g.fill(); }
    g.fillStyle = 'rgba(60,80,64,0.45)'; ell(g, p[0] + sw, p[1] - 0.62 * s, w * 0.18 * s, 0.1 * s); g.fill();
    if (i % 3 === 1) { g.fillStyle = 'rgba(180,120,150,0.6)'; for (let k = 0; k < 4; k++) { ell(g, p[0] + (k - 1.5) * 0.12 * s + sw, p[1] - (0.45 + (k % 2) * 0.15) * s, 0.035 * s, 0.035 * s); g.fill(); } } }
}
// ---------- the whole garden: extras [{x, z, draw}] ----------
function gardenScene(g, cam, E, extras = [], o = {}) {
  drawSky(g, cam, E); drawBats(g, cam, E);
  const sp = [];
  for (const h of GFARH) sp.push({ x: (h.x0 + h.x1) / 2, z: h.z, draw: () => drawFarHouse(g, cam, E, h) });
  for (const tr of GFART) sp.push({ x: tr.x, z: tr.z, draw: () => { const p = proj(cam, tr.x, 0, tr.z); if (!p) return; const fk = fkz(E, cam, tr.x, 0, tr.z); if (tr.dead) drawDeadTree(g, p[0], p[1], tr.h * p[2], E, fk, tr.seed); else drawPine(g, p[0], p[1], tr.h * p[2], tr.h * 0.75 * p[2], E, fk, tr.seed, false); } });
  sp.sort((a, b) => camSpace(cam, b.x, 0, b.z)[2] - camSpace(cam, a.x, 0, a.z)[2]).forEach(s => s.draw());
  fogBands(g, cam, E, 0.45);
  gardenGround(g, cam, E);
  if (o.under) o.under(g, cam, E);
  const it = [];
  if (o.behindFence) for (const x of o.behindFence) it.push(x);
  it.push({ x: 0, z: GD.fenceZ + 0.02, draw: () => drawBackFence(g, cam, E) });
  it.push({ x: -GD.side, z: 8, draw: () => drawSideFence(g, cam, E, -1), side: -1 });
  it.push({ x: GD.side, z: 8, draw: () => drawSideFence(g, cam, E, 1), side: 1 });
  it.push({ x: 3.85, z: 13.8, draw: () => drawShed(g, cam, E) });
  it.push({ x: GD.tree[0], z: GD.tree[1], draw: () => drawGTree(g, cam, E) });
  it.push({ x: -3.6, z: GD.swing.z, draw: () => drawSwing(g, cam, E, o.swing) });
  for (const b of GD.bins) it.push({ x: b.x, z: b.z, draw: () => drawBin(g, cam, E, b, { lid: b === GD.bins[0] ? (o.lid || 0) : 0 }) });
  it.push({ x: -1, z: 2.6, draw: () => drawProps(g, cam, E) });
  it.push({ x: -6.45, z: 7, draw: () => drawShrubs(g, cam, E) });
  for (const tf of GTUFTS) it.push({ x: tf.x, z: tf.z, draw: () => drawTuft(g, cam, E, tf) });
  for (let z = 3; z < 30; z += 5) it.push({ x: 0, z, draw: () => groundFog(g, cam, E, z, 0.6) });
  for (const x of extras) it.push(x);
  it.forEach(s => { s.d = camSpace(cam, s.x == null ? 0 : s.x, cam.y, s.z)[2]; if (s.side) s.d = camSpace(cam, s.x, cam.y, clamp(cam.z, 0, GD.fenceZ))[2] + 30; });
  // side fences always behind everything inside the garden
  if (cam.z > 0.2 && Math.abs(cam.yaw || 0) > 100) drawHouseBack(g, cam, E, o);
  it.filter(s => s.d > 0.05 || s.always).sort((a, b) => b.d - a.d).forEach(s => s.draw(g, cam, E));
  lampLight(g, cam, E);
  // night grade: darker when the lamp is off
  g.fillStyle = `rgba(4,6,16,${0.1 * (1 - (E.lamp || 0)) + (o.darken || 0)})`; g.fillRect(0, 0, W, H);
  if (E.motes) motes(g, E, E.motes * 0.6, 3);
  if (o.over) o.over(g, cam, E);
}

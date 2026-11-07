// ---------- Part 6 world: a lonely lighthouse on a rocky headland at midnight (2.5D perspective, same comic look) ----------
const LH = { x: -3, z: 54, r0: 2.25, r1: 1.5, base: 1.1, h: 16, galR: 2.35, lanR: 1.3, lanH: 2.9, lampY: 17.5 };
const COT = { x0: -12.5, x1: -6.5, z0: 44, z1: 49.5, h: 2.8, roof: 4.6 };
const DOCK = { x0: 2.2, x1: 10.5, z0: 38.4, z1: 40.0, y: 0.55 };
const BOAT = { x: 8.6, z: 42.1 };
const SEA = { col: hex('#0a1322'), colN: hex('#060b14'), foam: [210, 225, 235] };
const shoreX = z => 3.0 + 1.5 * Math.sin(z * 0.13) + 0.8 * Math.sin(z * 0.41 + 1);
const TIPZ = 63;
const CW = (() => {
  const r = rng(91), rocks = [], stacks = [], tufts = [], posts = [], flowers = [];
  for (let i = 0; i < 70; i++) { const z = -20 + r() * 86, sx = shoreX(z), x = sx - 3 + r() * 6.5; if (Math.abs(x - pathX(z)) < 1.6) continue; if (z > 40 && x < 1 && x > -14) continue; if (z < 33 && x > -1.6) continue; if (z > 36 && z < 43 && x > 1) continue;
    rocks.push({ x, z, s: 0.35 + Math.pow(r(), 2) * 1.6, seed: r() * 100, wet: x > sx - 0.5 }); }
  for (let i = 0; i < 40; i++) { const z = -30 + r() * 120; if (z > 58 && z < 80) continue; const x = shoreX(z) + 5 + r() * 45; stacks.push({ x, z, s: 0.8 + r() * 3.5, seed: r() * 100 }); }
  for (let i = 0; i < 6; i++) stacks.push({ x: -10 + i * 4 + r() * 2, z: 70 + r() * 30, s: 1 + r() * 3, seed: r() * 100 });
  for (let i = 0; i < 420; i++) { const z = -20 + r() * 82, x = -40 + r() * (shoreX(z) - 1.2 + 40); if (Math.abs(x - pathX(z)) < 0.9) continue; tufts.push({ x, z, h: 0.18 + r() * 0.35, seed: r() * 10 }); }
  for (let z = -20; z < 50; z += 3.2) posts.push({ x: pathX(z) + 1.05, z });
  for (let i = 0; i < 40; i++) { const z = -10 + r() * 60, x = -20 + r() * 20; flowers.push({ x, z, seed: r() * 10 }); }
  return { rocks, stacks, tufts, posts, flowers };
})();
function pathX(z) { return -1.2 - 1.6 * Math.sin(z * 0.05) - (z > 40 ? (z - 40) * 0.05 : 0); }

// ---------- sky (handles a camera looking up the tower: hy far below the frame) ----------
function coastSky(g, cam, E) {
  if (cam.hy > 1500) { const P = E.P, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rgb(P.top)); gr.addColorStop(1, rgb(P.mid)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    drawSky(g, { ...cam, hy: 1500 }, E); g.fillStyle = gr; g.fillRect(0, 1540, W, H); drawBats(g, { ...cam, hy: 1500 }, E); return; }
  drawSky(g, cam, E); drawBats(g, cam, E);
}
// ---------- sea + land ----------
function coastGround(g, cam, E, o = {}) {
  const P = E.P, hy = cam.hy, dawn = E.dawn, t = E.t;
  if (hy > H + 40) return;
  // the sea, everywhere below the horizon
  const sc = mixc(SEA.col, hex('#5a5068'), dawn), scN = mixc(SEA.colN, hex('#2c2838'), dawn);
  const gr = g.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, rgb(mixc(P.hor, sc, 0.35))); gr.addColorStop(0.06, rgb(mixc(sc, P.fog, 0.3))); gr.addColorStop(0.4, rgb(sc)); gr.addColorStop(1, rgb(scN));
  g.fillStyle = gr; g.fillRect(0, hy - 2, W, H - hy + 2);
  // moon / sun glitter path on the water
  const mx = cam.flip ? null : 190 - cam.x * 2, gx = dawn > 0.4 ? W * 0.68 : mx, gcol = dawn > 0.4 ? [255, 200, 150] : [200, 215, 240];
  if (gx != null) { g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) { const k = Math.pow(i / 70, 1.7), y = hy + 4 + k * (H - hy), w = (14 + k * 160) * (0.5 + 0.5 * Math.abs(noise(t * 0.8 + i * 1.7))), x = gx + noise(t * 0.5 + i * 3.1) * (10 + k * 120);
      g.fillStyle = rgb(gcol, (0.32 - k * 0.22) * (dawn > 0.4 ? dawn : 1 - dawn * 2)); ell(g, x, y, w, 1.5 + k * 5); g.fill(); }
    g.restore(); }
  // swell lines rolling in toward the shore
  if (!cam.flip) for (let i = 0; i < 34; i++) { const z = cam.z + 1 + Math.pow(((i + t * 0.18) % 34) / 34, 1.8) * 140, a = proj(cam, -60, 0, z), b = proj(cam, 120, 0, z); if (!a) continue;
    const fk = fogK(E, z - cam.z); g.strokeStyle = rgb(mixc([120, 140, 170], P.fog, fk), 0.16 * (1 - fk)); g.lineWidth = Math.max(1, a[2] * 0.03);
    g.beginPath(); g.moveTo(a[0], a[1]); for (let x = -60; x <= 120; x += 6) { const p = proj(cam, x, 0.05 * Math.sin(x * 0.4 + t * 1.3 + i), z); g.lineTo(p[0], p[1]); } g.stroke(); }
  // the land: a headland, shore on the right, tip ahead
  const fl = cam.flip ? -1 : 1, zn = cam.z + 0.15 * fl;
  const pts = []; const zA = cam.flip ? -40 : Math.max(-40, zn);
  if (!cam.flip || zn > -40) {
    const zE = cam.flip ? Math.min(TIPZ, zn) : TIPZ;
    for (let z = zA; z <= zE; z += 1) pts.push([shoreX(z), 0, z]);
    if (zE >= TIPZ) { for (let k = 1; k <= 8; k++) { const a = k / 8 * Math.PI / 2; pts.push([lerp(shoreX(TIPZ), -14, 1 - Math.cos(a)), 0, TIPZ + Math.sin(a) * 5]); } pts.push([-30, 0, TIPZ + 4]); pts.push([-300, 0, TIPZ + 12]); }
    else pts.push([-300, 0, zE]);
    pts.push([-300, 0, zA]);
  }
  const land = projPoly(cam, pts);
  if (land.length > 2) {
    const lc = mixc(hex('#141a17'), hex('#4a4040'), dawn), lcN = mixc(hex('#0a0e0c'), hex('#2a2424'), dawn);
    const lg = g.createLinearGradient(0, hy, 0, H); lg.addColorStop(0, rgb(mixc(lc, P.fog, 0.55))); lg.addColorStop(0.12, rgb(mixc(lc, P.fog, 0.15))); lg.addColorStop(1, rgb(lcN));
    poly(g, land); g.fillStyle = lg; g.fill(); g.strokeStyle = rgb(mixc([8, 10, 10], P.fog, 0.2)); g.lineWidth = 2; g.stroke();
    // rocky shore band (darker, wet)
    g.save(); poly(g, land); g.clip();
    const band = []; for (let z = zA; z <= Math.min(TIPZ, cam.flip ? zn : 999); z += 1) band.push([shoreX(z) - 1.6, 0, z]); for (let z = Math.min(TIPZ, cam.flip ? zn : 999); z >= zA; z -= 1) band.push([shoreX(z) + 0.2, 0, z]);
    const bq = projPoly(cam, band); if (bq.length > 2) { poly(g, bq); g.fillStyle = rgb(mixc([16, 18, 22], P.fog, 0.1), 0.85); g.fill(); }
    // the dirt path to the lighthouse
    const pp = []; for (let z = zA; z <= 51; z += 1) pp.push([pathX(z) - 0.75, 0, z]); for (let z = 51; z >= zA; z -= 1) pp.push([pathX(z) + 0.75, 0, z]);
    const pq = projPoly(cam, pp); if (pq.length > 2) { poly(g, pq); const pc = mixc(hex('#2c2722'), hex('#6a5a50'), dawn); g.fillStyle = rgb(mixc(pc, P.fog, 0.1)); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.stroke(); }
    g.restore();
  }
  // foam where waves hit the shore (smooth pulse, no flicker)
  if (!o.noFoam) { g.save(); g.globalCompositeOperation = 'lighter';
    for (let z = Math.floor(cam.z) - 60; z <= TIPZ; z += 0.8) { const dz = DZ(cam, z); if (dz < 3 || dz > 90) continue; const wv = 0.5 + 0.5 * Math.sin(t * 1.1 - z * 0.35), x = shoreX(z) + 0.25 + wv * 0.6, p = proj(cam, x, 0, z); if (!p) continue;
      const fk = fogK(E, dz); g.fillStyle = rgb(SEA.foam, (0.12 + 0.18 * wv) * (1 - fk)); ell(g, p[0], p[1], p[2] * (0.7 + wv * 0.5), Math.min(30, p[2] * 0.07 * Math.max(0.3, cam.y / dz * 3))); g.fill(); }
    g.restore(); }
}
// ---------- props ----------
function boulder(g, x, y, s, E, fk, seed, wet) {
  const r = rng(seed * 991 | 0), pts = []; for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI; pts.push([x + Math.cos(a) * s * (0.85 + r() * 0.3), y + Math.sin(a) * s * (0.55 + r() * 0.35)]); }
  const base = mixc([30, 34, 38], [80, 70, 74], E.dawn);
  g.fillStyle = fcol(base, E, fk); poly(g, pts); g.fill(); g.strokeStyle = fcol([6, 8, 10], E, fk); g.lineWidth = Math.max(1, s * 0.05); g.stroke();
  g.fillStyle = fcol(mixc(base, [140, 150, 170], 0.35), E, fk); poly(g, [pts[3], pts[4], pts[5], [x + s * 0.1, y - s * 0.2], [x - s * 0.3, y - s * 0.15]]); g.fill();   // moonlit top facet
  g.fillStyle = fcol([24, 42, 28], E, fk); ell(g, x - s * 0.3, y - s * 0.05, s * 0.35, s * 0.12); g.fill();   // moss
  if (wet) { g.strokeStyle = `rgba(200,225,240,${0.35 * (1 - fk)})`; g.lineWidth = Math.max(1, s * 0.04); g.beginPath(); g.moveTo(pts[3][0], pts[3][1] + s * 0.05); g.quadraticCurveTo(x, y - s * 0.6, pts[6][0], pts[6][1] + s * 0.05); g.stroke(); }
}
function seaStack(g, cam, E, st) {
  const p = proj(cam, st.x, 0, st.z); if (!p) return; const fk = fogK(E, p[3]), s = st.s * p[2], r = rng(st.seed * 77 | 0);
  const pts = [[p[0] - s * 0.9, p[1] + s * 0.05]]; for (let k = 1; k < 7; k++) pts.push([p[0] - s * 0.9 + k / 7 * s * 1.8 + (r() - 0.5) * s * 0.2, p[1] - s * (0.5 + r() * 0.9) * Math.sin(k / 7 * Math.PI) - s * 0.2]); pts.push([p[0] + s * 0.9, p[1] + s * 0.05]);
  g.fillStyle = fcol(mixc([18, 22, 28], [70, 60, 66], E.dawn), E, fk * 0.9); poly(g, pts); g.fill(); g.strokeStyle = fcol([4, 6, 8], E, fk); g.lineWidth = Math.max(1, s * 0.04); g.stroke();
  g.fillStyle = fcol([90, 100, 120], E, fk); poly(g, [pts[2], pts[3], pts[4], [pts[3][0], pts[3][1] + s * 0.25]]); g.fill();
  const wv = 0.5 + 0.5 * Math.sin(E.t * 1.4 + st.seed); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgb(SEA.foam, (0.15 + 0.25 * wv) * (1 - fk)); ell(g, p[0], p[1], s * (1.0 + wv * 0.3), s * 0.12); g.fill(); g.restore();
}
function grassTuft(g, x, y, h, E, fk, seed) {
  g.strokeStyle = fcol(mixc([30, 44, 32], [80, 80, 60], E.dawn), E, fk); g.lineWidth = Math.max(1, h * 0.05); g.beginPath();
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.28 + Math.sin(E.t * 1.6 + seed + k * 0.3) * 0.12; g.moveTo(x + (k - 2) * h * 0.08, y); g.quadraticCurveTo(x + Math.cos(a) * h * 0.4, y + Math.sin(a) * h * 0.6, x + Math.cos(a) * h * 0.7 + Math.sin(E.t * 1.2 + seed) * h * 0.12, y + Math.sin(a) * h); }
  g.stroke();
}
function fencePost(g, cam, E, ps, nx) {
  const a = proj(cam, ps.x, 0, ps.z), b = proj(cam, ps.x, 1.0, ps.z); if (!a || !b) return null; const fk = fogK(E, a[3]);
  g.strokeStyle = fcol([40, 32, 26], E, fk); g.lineWidth = Math.max(1.5, a[2] * 0.11); g.lineCap = 'butt'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  if (nx) { const c = proj(cam, nx.x, 0.9, nx.z); if (c) { g.strokeStyle = fcol([70, 60, 46], E, fk); g.lineWidth = Math.max(1, a[2] * 0.025); g.beginPath(); g.moveTo(b[0], b[1] + a[2] * 0.08); g.quadraticCurveTo((b[0] + c[0]) / 2, (b[1] + c[1]) / 2 + Math.abs(b[0] - c[0]) * 0.12 + a[2] * 0.12, c[0], c[1] + a[2] * 0.08); g.stroke(); } }
}
// ---------- the lighthouse ----------
function towerR(y) { return lerp(LH.r0, LH.r1, clamp((y - LH.base) / (LH.h - LH.base))); }
function ringY(cam, y, rWorld, p) { return Math.max(0.5, rWorld * p[2] * (cam.y - y) / p[3]); }   // vertical radius of a horizontal ring
function drawLighthouse(g, cam, E, o = {}) {
  const ink = '#090b0e', fk = fogK(E, DZ(cam, LH.z)) * 0.55, dawn = E.dawn, lamp = o.lamp || 0, x = LH.x, z = LH.z;
  const P = y => proj(cam, x, y, z); const pb = P(0), pt = P(LH.h); if (!pb || !pt) return;
  const moonL = 1 - dawn * 0.5;
  // stone plinth
  const r0 = LH.r0 + 0.45, pp = P(LH.base);
  g.fillStyle = fcol([70, 70, 76], E, fk); g.beginPath(); g.moveTo(pb[0] - r0 * pb[2], pb[1]); g.lineTo(pp[0] - r0 * pp[2], pp[1]); g.ellipse(pp[0], pp[1], r0 * pp[2], ringY(cam, LH.base, r0, pp), 0, Math.PI, 0, true); g.lineTo(pb[0] + r0 * pb[2], pb[1]); g.ellipse(pb[0], pb[1], r0 * pb[2], ringY(cam, 0, r0, pb), 0, 0, Math.PI); g.closePath(); g.fill(); g.strokeStyle = ink; g.lineWidth = 2.5; g.stroke();
  // tower body: banded red/white, tapered; shaded with a horizontal gradient (moonlight from the left)
  const bands = 5, segs = 24;
  for (let i = 0; i < segs; i++) { const y0 = lerp(LH.base, LH.h, i / segs), y1 = lerp(LH.base, LH.h, (i + 1) / segs), a = P(y0), b = P(y1), ra = towerR(y0) * a[2], rb = towerR(y1) * b[2];
    const red = Math.floor(i / (segs / bands)) % 2 === 1, c0 = red ? mixc([150, 32, 30], [200, 70, 60], dawn) : mixc([196, 192, 182], [240, 220, 205], dawn);
    const gr_ = g.createLinearGradient(a[0] - ra, 0, a[0] + ra, 0); gr_.addColorStop(0, fcol(mixc(c0, [255, 255, 255], 0.12 * moonL), E, fk)); gr_.addColorStop(0.35, fcol(c0, E, fk)); gr_.addColorStop(1, fcol(mixc(c0, [5, 8, 16], 0.68), E, fk));
    g.fillStyle = gr_; g.beginPath(); g.moveTo(a[0] - ra, a[1]); g.lineTo(b[0] - rb, b[1] + 0.5); g.lineTo(b[0] + rb, b[1] + 0.5); g.lineTo(a[0] + ra, a[1]); g.ellipse(a[0], a[1], ra, ringY(cam, y0, towerR(y0), a), 0, 0, Math.PI); g.closePath(); g.fill(); }
  g.strokeStyle = ink; g.lineWidth = 3; const b0 = P(LH.base); g.beginPath(); g.moveTo(b0[0] - towerR(LH.base) * b0[2], b0[1]); g.lineTo(pt[0] - LH.r1 * pt[2], pt[1]); g.moveTo(b0[0] + towerR(LH.base) * b0[2], b0[1]); g.lineTo(pt[0] + LH.r1 * pt[2], pt[1]); g.stroke();
  // stone joints (faint rings)
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1.5; for (let y = LH.base + 0.8; y < LH.h; y += 0.8) { const a = P(y); g.beginPath(); g.ellipse(a[0], a[1], towerR(y) * a[2], ringY(cam, y, towerR(y), a), 0, 0.1, Math.PI - 0.1); g.stroke(); }
  // door (arched, facing -z) + small step
  if (!cam.flip) { const d0 = proj(cam, x - 0.55, LH.base, z - towerR(LH.base) - 0.02), d1 = proj(cam, x + 0.55, LH.base + 2.1, z - towerR(LH.base) - 0.02);
    if (d0 && d1) { const open = o.doorOpen || 0; g.fillStyle = '#0a0806'; g.beginPath(); g.moveTo(d0[0], d0[1]); g.lineTo(d0[0], d1[1] + (d1[0] - d0[0]) / 2); g.arc((d0[0] + d1[0]) / 2, d1[1] + (d1[0] - d0[0]) / 2, (d1[0] - d0[0]) / 2, Math.PI, 0); g.lineTo(d1[0], d0[1]); g.closePath(); g.fill(); g.strokeStyle = ink; g.lineWidth = 2.5; g.stroke();
      g.save(); g.clip(); if (open > 0 && o.doorGlow) { g.globalCompositeOperation = 'lighter'; glow(g, (d0[0] + d1[0]) / 2, (d0[1] + d1[1]) / 2, (d1[0] - d0[0]) * 1.3, [255, 190, 110], 0.5 * o.doorGlow); g.globalCompositeOperation = 'source-over'; }
      const dw = (d1[0] - d0[0]) * (1 - open * 0.85); g.fillStyle = fcol([60, 38, 24], E, fk); g.fillRect(d0[0], d1[1] - (d1[0] - d0[0]), dw, d0[1] - d1[1] + (d1[0] - d0[0]));
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(d0[0] + dw * k / 4, d1[1] - (d1[0] - d0[0])); g.lineTo(d0[0] + dw * k / 4, d0[1]); g.stroke(); } g.fillStyle = '#c9a65a'; ell(g, d0[0] + dw * 0.85, lerp(d0[1], d1[1], 0.45), Math.max(1.5, d0[2] * 0.05), Math.max(1.5, d0[2] * 0.05)); g.fill(); g.restore(); }
    // little windows up the tower (light up as you climb)
    [4.5, 8.5, 12.5].forEach((wy, i) => { const r = towerR(wy) + 0.02, a = proj(cam, x + 0.3 * (i % 2 ? -1 : 1), wy, z - r), b = proj(cam, x + 0.3 * (i % 2 ? -1 : 1), wy + 0.9, z - r); if (!a || !b) return; const w = a[2] * 0.22, lit = (o.windows || [0, 0, 0])[i];
      g.fillStyle = lit > 0 ? rgb(mixc([12, 12, 16], [255, 200, 120], lit)) : '#0b0c10'; rr(g, a[0] - w, b[1], w * 2, a[1] - b[1], w); g.fill(); g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
      if (lit > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, a[0], (a[1] + b[1]) / 2, a[2] * 1.4, [255, 190, 110], 0.4 * lit); g.restore(); } }); }
  // gallery: a stone ledge + iron railing
  const gy = LH.h, gp = P(gy), gR = LH.galR * gp[2], gRy = ringY(cam, gy, LH.galR, gp);
  g.fillStyle = fcol([40, 40, 46], E, fk); g.beginPath(); g.ellipse(gp[0], gp[1], gR, gRy, 0, 0, TAU); g.fill(); g.strokeStyle = ink; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = fcol([58, 58, 64], E, fk); g.beginPath(); g.moveTo(gp[0] - gR, gp[1]); g.ellipse(gp[0], gp[1], gR, gRy, 0, Math.PI, 0, true); g.lineTo(gp[0] + gR, gp[1] + gp[2] * 0.35); g.ellipse(gp[0], gp[1] + gp[2] * 0.35, gR, gRy, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
  // corbels under the ledge
  for (let k = 0; k < 9; k++) { const a = Math.PI * (0.08 + k * 0.105), cx = gp[0] + Math.cos(a) * LH.r1 * gp[2] * 1.15, cy = gp[1] + gp[2] * 0.35 + Math.sin(a) * gRy * 0.6; g.fillStyle = fcol([30, 30, 36], E, fk); poly(g, [[cx - gp[2] * 0.08, cy], [cx + gp[2] * 0.08, cy], [cx, cy + gp[2] * 0.4]]); g.fill(); }
  // lantern room (behind the railing)
  const ly0 = LH.h + 0.25, ly1 = ly0 + LH.lanH, la = P(ly0), lb = P(ly1), lR = LH.lanR;
  const lit = lamp * (1 - dawn * 0.6);
  g.fillStyle = lit > 0 ? rgb(mixc([16, 20, 30], [255, 236, 190], lit)) : fcol([14, 18, 28], E, fk);
  g.fillRect(la[0] - lR * la[2], lb[1], lR * 2 * la[2], la[1] - lb[1]);
  if (lit > 0) { const gr2 = g.createRadialGradient(la[0], (la[1] + lb[1]) / 2, 0, la[0], (la[1] + lb[1]) / 2, lR * la[2] * 1.2); gr2.addColorStop(0, `rgba(255,255,240,${lit})`); gr2.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr2; g.fillRect(la[0] - lR * la[2], lb[1], lR * 2 * la[2], la[1] - lb[1]); }
  else { g.fillStyle = 'rgba(160,180,220,0.12)'; poly(g, [[la[0] - lR * la[2] * 0.7, lb[1]], [la[0] - lR * la[2] * 0.3, lb[1]], [la[0] - lR * la[2] * 0.6, la[1]], [la[0] - lR * la[2] * 0.95, la[1]]]); g.fill(); }
  g.strokeStyle = ink; g.lineWidth = Math.max(2, la[2] * 0.06); for (let k = 0; k <= 6; k++) { const xx = la[0] + Math.cos(Math.PI * k / 6) * lR * la[2]; g.beginPath(); g.moveTo(xx, la[1]); g.lineTo(xx, lb[1]); g.stroke(); }
  g.lineWidth = Math.max(1.5, la[2] * 0.03); g.beginPath(); g.moveTo(la[0] - lR * la[2], (la[1] + lb[1]) / 2); g.lineTo(la[0] + lR * la[2], (la[1] + lb[1]) / 2); g.stroke();
  // dome + vent ball + rod
  const dp = P(ly1); g.fillStyle = fcol(mixc([30, 34, 40], [70, 40, 40], 0.4), E, fk); g.beginPath(); g.ellipse(dp[0], dp[1], lR * 1.12 * dp[2], lR * 0.95 * dp[2], 0, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = ink; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = 'rgba(170,190,230,0.2)'; g.beginPath(); g.ellipse(dp[0] - lR * 0.4 * dp[2], dp[1] - lR * 0.5 * dp[2], lR * 0.3 * dp[2], lR * 0.25 * dp[2], -0.5, 0, TAU); g.fill();
  const vb = P(ly1 + lR * 0.95 + 0.2); g.fillStyle = '#1c1f26'; ell(g, vb[0], vb[1], dp[2] * 0.22, dp[2] * 0.22); g.fill(); g.stroke(); const rod = P(ly1 + lR + 1.4); g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(vb[0], vb[1]); g.lineTo(rod[0], rod[1]); g.stroke();
  // railing in front of the lantern
  const rh = 1.0, rp = P(gy + rh); g.strokeStyle = fcol([20, 20, 24], E, fk); g.lineWidth = Math.max(1.5, gp[2] * 0.035);
  g.beginPath(); g.ellipse(rp[0], rp[1], gR * 0.97, ringY(cam, gy + rh, LH.galR, rp), 0, 0, Math.PI); g.stroke();
  for (let k = 0; k <= 12; k++) { const a = Math.PI * k / 12, bx = gp[0] + Math.cos(a) * gR * 0.97, by = gp[1] + Math.sin(a) * gRy, ty = rp[1] + Math.sin(a) * ringY(cam, gy + rh, LH.galR, rp); g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, ty); g.stroke(); }
  if (o.onGallery) o.onGallery(g, cam, E);
  // lamp glow halo
  if (lit > 0) { const lp = P(LH.lampY); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lp[0], lp[1], Math.min(900, lp[2] * 6), [255, 225, 160], 0.45 * lit); glow(g, lp[0], lp[1], lp[2] * 1.6, [255, 250, 230], 0.8 * lit); g.restore(); }
}
// the rotating beam. Returns its angle so the shots can sync things to it
const BEAM_W = 0.9;   // rad/s
function beamAngle(t, t0) { return 2.4 + (t - t0) * BEAM_W; }
function drawBeams(g, cam, E, k, ang) {
  if (k <= 0.01) return; const lp = proj(cam, LH.x, LH.lampY, LH.z); if (!lp) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const off of [0, Math.PI]) { const a = ang + off, dx = Math.cos(a), dz = Math.sin(a);
    // facing: how much this beam points at the camera
    const vx = cam.x - LH.x, vz = cam.z - LH.z, vl = Math.hypot(vx, vz) || 1, face = Math.max(0, (dx * vx + dz * vz) / vl);
    const L = 70, far = proj(cam, LH.x + dx * L, LH.lampY - 3, LH.z + dz * L), sideX = -dz, sideZ = dx;
    if (far) { const wFar = 7, fa = proj(cam, LH.x + dx * L + sideX * wFar, LH.lampY - 3 + wFar * 0.4, LH.z + dz * L + sideZ * wFar), fb = proj(cam, LH.x + dx * L - sideX * wFar, LH.lampY - 3 - wFar * 0.4, LH.z + dz * L - sideZ * wFar);
      if (fa && fb) { const gr = g.createLinearGradient(lp[0], lp[1], far[0], far[1]); gr.addColorStop(0, rgb([255, 236, 180], 0.3 * k)); gr.addColorStop(1, rgb([255, 236, 180], 0));
        g.fillStyle = gr; poly(g, [[lp[0], lp[1] - lp[2] * 0.3], fa, fb, [lp[0], lp[1] + lp[2] * 0.3]].map(p => [p[0], p[1]])); g.fill(); } }
    else { // pointing behind the camera: a wide wash
      const gr = g.createRadialGradient(lp[0], lp[1], 0, lp[0], lp[1], 1400); gr.addColorStop(0, rgb([255, 236, 180], 0.1 * k * face)); gr.addColorStop(1, rgb([255, 236, 180], 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    if (face > 0.6) { const f = Math.pow((face - 0.6) / 0.4, 3); glow(g, lp[0], lp[1], 200 + 600 * f, [255, 240, 200], 0.4 * f * k); }
  }
  g.restore();
}
// ---------- keeper's cottage ----------
function drawCottage(g, cam, E, o = {}) {
  const C = COT, ink = '#0a0b0e', fk = fogK(E, DZ(cam, C.z0)) * 0.6;
  const wall = fcol(mixc([150, 150, 150], [210, 195, 185], E.dawn), E, fk), wallS = fcol([86, 88, 96], E, fk), roof = fcol([34, 38, 48], E, fk), roofS = fcol([24, 26, 34], E, fk);
  box3(g, cam, C.x0, C.x1, 0, C.h, C.z0, C.z1, { front: wall, side: wallS, back: wall }, ink, 2.5);
  // gable roof (ridge along x)
  const zm = (C.z0 + C.z1) / 2;
  if (cam.y < C.roof || true) { poly3(g, cam, [[C.x0 - 0.3, C.h, C.z0 - 0.3], [C.x1 + 0.3, C.h, C.z0 - 0.3], [C.x1 + 0.3, C.roof, zm], [C.x0 - 0.3, C.roof, zm]], roof, ink, 2.5);
    if (cam.x > C.x1) poly3(g, cam, [[C.x1, C.h, C.z0], [C.x1, C.h, C.z1], [C.x1, C.roof, zm]], wallS, ink, 2.5);
    if (cam.x < C.x0) poly3(g, cam, [[C.x0, C.h, C.z0], [C.x0, C.h, C.z1], [C.x0, C.roof, zm]], wallS, ink, 2.5); }
  box3(g, cam, C.x0 + 1.0, C.x0 + 1.6, C.h + 0.6, C.roof + 0.7, zm - 0.3, zm + 0.3, { front: fcol([60, 50, 46], E, fk), side: fcol([40, 34, 32], E, fk), top: '#111' }, ink, 2);
  // chimney smoke (slow, soft)
  const ch = proj(cam, C.x0 + 1.3, C.roof + 0.8, zm); if (ch) for (let i = 0; i < 6; i++) { const k = ((E.t * 0.12 + i / 6) % 1), x = ch[0] + k * ch[2] * 2.5 + Math.sin(E.t + i) * ch[2] * 0.2, y = ch[1] - k * ch[2] * 3; g.fillStyle = `rgba(150,160,180,${0.12 * (1 - k)})`; ell(g, x, y, ch[2] * (0.3 + k), ch[2] * (0.25 + k * 0.8)); g.fill(); }
  if (cam.z < C.z0) { // windows + door on the front
    for (const wx of [C.x0 + 0.8, C.x1 - 2.0]) { const q = poly3(g, cam, [[wx, 1.0, C.z0 - 0.01], [wx + 1.2, 1.0, C.z0 - 0.01], [wx + 1.2, 2.1, C.z0 - 0.01], [wx, 2.1, C.z0 - 0.01]], o.lit ? '#e8b060' : '#11151e', ink, 2);
      if (q) { g.strokeStyle = '#d8d8d0'; g.lineWidth = 2; g.beginPath(); g.moveTo((q[0][0] + q[1][0]) / 2, q[0][1]); g.lineTo((q[2][0] + q[3][0]) / 2, q[2][1]); g.moveTo(q[0][0], (q[0][1] + q[3][1]) / 2); g.lineTo(q[1][0], (q[1][1] + q[2][1]) / 2); g.stroke(); } }
    poly3(g, cam, [[C.x0 + 2.6, 0, C.z0 - 0.01], [C.x0 + 3.5, 0, C.z0 - 0.01], [C.x0 + 3.5, 2.0, C.z0 - 0.01], [C.x0 + 2.6, 2.0, C.z0 - 0.01]], fcol([50, 70, 90], E, fk), ink, 2); }
}
// ---------- dock + rowboat ----------
function drawDock(g, cam, E) {
  const D = DOCK, ink = '#0a0b0e', fk = fogK(E, DZ(cam, D.z0)) * 0.6, wood = fcol([70, 56, 42], E, fk), woodS = fcol([44, 34, 26], E, fk);
  for (let x = D.x0 + 1; x <= D.x1; x += 2.2) for (const z of [D.z0 + 0.1, D.z1 - 0.1]) box3(g, cam, x - 0.1, x + 0.1, -1, D.y + 0.4, z - 0.1, z + 0.1, { front: woodS, side: woodS, top: wood }, ink, 1.5);
  box3(g, cam, D.x0, D.x1, D.y - 0.12, D.y, D.z0, D.z1, { front: woodS, side: woodS, top: wood }, ink, 2);
  if (cam.y > D.y) for (let x = D.x0 + 0.3; x < D.x1; x += 0.3) { const a = proj(cam, x, D.y, D.z0), b = proj(cam, x, D.y, D.z1); if (a && b) { g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
}
function drawBoat3D(g, cam, E, o = {}) {
  const bob = Math.sin(E.t * 1.3) * 0.08, roll = Math.sin(E.t * 0.9) * 0.05, B = BOAT, fk = fogK(E, DZ(cam, B.z)) * 0.6;
  const p = proj(cam, B.x, 0.2 + bob, B.z); if (!p) return; const s = p[2];
  g.save(); g.translate(p[0], p[1]); g.rotate(roll);
  g.fillStyle = fcol([120, 40, 34], E, fk); g.strokeStyle = '#0a0b0e'; g.lineWidth = Math.max(1.5, s * 0.03);
  g.beginPath(); g.moveTo(-1.9 * s, -0.45 * s); g.quadraticCurveTo(-1.6 * s, 0.15 * s, 0, 0.18 * s); g.quadraticCurveTo(1.7 * s, 0.15 * s, 2.1 * s, -0.55 * s); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = fcol([190, 180, 160], E, fk); g.fillRect(-1.85 * s, -0.5 * s, 3.9 * s, 0.1 * s);
  g.strokeStyle = fcol([90, 70, 50], E, fk); g.lineWidth = Math.max(1, s * 0.05); g.beginPath(); g.moveTo(-0.6 * s, -0.5 * s); g.lineTo(0.2 * s, -0.95 * s); g.stroke();
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgb(SEA.foam, 0.12); ell(g, p[0], p[1] + s * 0.15, s * 2.2, s * 0.12); g.fill(); g.restore();
  const dk = proj(cam, DOCK.x1 - 0.3, DOCK.y, DOCK.z1); if (dk) { g.strokeStyle = 'rgba(160,140,110,0.7)'; g.lineWidth = Math.max(1, s * 0.015); g.beginPath(); g.moveTo(dk[0], dk[1]); g.quadraticCurveTo((dk[0] + p[0] - 1.6 * s) / 2, Math.max(dk[1], p[1]) + s * 0.3, p[0] - 1.7 * s, p[1] - 0.45 * s); g.stroke(); }
}
// drifting sea mist + spray
function seaMist(g, E, k = 1, seed = 3) {
  if (k <= 0) return; const r = rng(seed);
  for (let i = 0; i < 80; i++) { const depth = 0.3 + r() * 0.7, x0 = r() * W, y0 = r() * H;
    const x = ((x0 - E.t * (14 + 30 * depth)) % (W + 40) + W + 40) % (W + 40) - 20, y = (y0 + E.t * (8 + 14 * depth) + Math.sin(E.t * 0.6 + i) * 25 * depth) % (H + 20) - 10;
    g.fillStyle = rgb(mixc([200, 215, 235], [255, 220, 190], E.dawn), 0.32 * depth * k); ell(g, x, y, 1 + 2 * depth, 1 + 2 * depth); g.fill(); }
}
// ---------- the full view ----------
function coastScene(g, cam, E, extras = [], o = {}) {
  coastSky(g, cam, E); fogBands(g, cam, E, 0.45);
  coastGround(g, cam, E, o);
  const sp = [];
  for (const st of CW.stacks) { const dz = DZ(cam, st.z); if (dz < 1 || dz > 250) continue; sp.push({ z: st.z, draw: () => seaStack(g, cam, E, st) }); }
  for (const c of CW.rocks) { const dz = DZ(cam, c.z); if (dz < 0.6 || dz > 140) continue; sp.push({ z: c.z, draw: () => { const p = proj(cam, c.x, 0, c.z); if (!p || p[0] < -c.s * p[2] * 2 || p[0] > W + c.s * p[2] * 2) return; boulder(g, p[0], p[1], c.s * p[2], E, fogK(E, dz), c.seed, c.wet); } }); }
  for (const c of CW.tufts) { const dz = DZ(cam, c.z); if (dz < 0.5 || dz > 60) continue; sp.push({ z: c.z, draw: () => { const p = proj(cam, c.x, 0, c.z); if (!p || p[0] < -50 || p[0] > W + 50) return; grassTuft(g, p[0], p[1], c.h * p[2], E, fogK(E, dz), c.seed); } }); }
  CW.posts.forEach((ps, i) => { const dz = DZ(cam, ps.z); if (dz < 0.8 || dz > 120) return; sp.push({ z: ps.z, draw: () => fencePost(g, cam, E, ps, CW.posts[i + 1]) }); });
  if (DZ(cam, COT.z0) > 0.5) sp.push({ z: COT.z0, draw: () => drawCottage(g, cam, E, o.cot || {}) });
  if (o.dock !== false) { sp.push({ z: DOCK.z0, draw: () => drawDock(g, cam, E) }); sp.push({ z: BOAT.z, draw: () => drawBoat3D(g, cam, E) }); }
  if (DZ(cam, LH.z) > 1) sp.push({ z: LH.z - LH.r0, draw: () => { drawLighthouse(g, cam, E, o.lh || {}); } });
  if (!cam.flip) for (let z = Math.ceil(cam.z / 7) * 7; z < cam.z + 100; z += 7) sp.push({ z: z + 0.01, draw: () => groundFog(g, cam, E, z, 0.55) });
  for (const x of extras) sp.push(x);
  sp.sort((a, b) => DZ(cam, b.z) - DZ(cam, a.z)).forEach(s => s.draw(g, cam, E));
  if (o.beam) drawBeams(g, cam, E, o.beam.k, o.beam.ang);
  moonRays(g, cam, E, 0.7); sunRays(g, cam, E);
  seaMist(g, E, o.mist == null ? 0.8 : o.mist, 4);
}
// an Undertow sprite in the coast world (feet at world z)
function underSprite(z, x, pose, yaw = 0, opt = {}) {
  return { z, draw: (g, cam, E) => {
    const p = proj(cam, x, opt.y || 0, z); if (!p) return;
    const fk = fogK(E, p[3]) * (opt.fogMul == null ? 0.55 : opt.fogMul);
    const L = scratch(); L.g.clearRect(0, 0, W, H);
    if (!opt.noShadow) { L.g.fillStyle = 'rgba(0,0,0,0.4)'; ell(L.g, p[0], p[1], p[2] * 0.8, p[2] * 0.08 * Math.max(0.3, cam.y / p[3] * 3)); L.g.fill(); }
    const RJ = drawRig(L.g, UNDER, pose, p[0], p[1], p[2], yaw, { t: E.t, twitch: 1, ...opt });
    L.g.save(); L.g.globalCompositeOperation = 'source-atop';
    const rg = L.g.createLinearGradient(p[0] - p[2] * 1.4, 0, p[0] + p[2] * 1.4, 0); rg.addColorStop(0, 'rgba(170,200,240,0.2)'); rg.addColorStop(0.45, 'rgba(170,200,240,0)'); L.g.fillStyle = rg; L.g.fillRect(0, 0, W, H);   // moon rim light
    if (opt.lit > 0) { L.g.fillStyle = `rgba(255,225,160,${0.45 * opt.lit})`; L.g.fillRect(0, 0, W, H); }
    if (opt.dark) { L.g.fillStyle = `rgba(3,5,10,${opt.dark})`; L.g.fillRect(0, 0, W, H); }
    L.g.fillStyle = rgb(E.P.fog, fk * 0.9); L.g.fillRect(0, 0, W, H);
    L.g.restore();
    g.save(); g.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
    if (opt.water) { const wl = proj(cam, x, 0, z); g.beginPath(); g.rect(0, 0, W, wl[1]); g.clip(); }
    g.drawImage(L.c, 0, 0);
    if (opt.water && (opt.y || 0) < 0) { const wl = proj(cam, x, 0, z); g.globalCompositeOperation = 'lighter'; const wv = 0.5 + 0.5 * Math.sin(E.t * 3); g.fillStyle = rgb(SEA.foam, 0.25 + 0.15 * wv); ell(g, wl[0], wl[1], wl[2] * (1.1 + 0.2 * wv), wl[2] * 0.08); g.fill(); g.globalCompositeOperation = 'source-over'; }
    if (opt.eyeGlow > 0) { const hd = RJ.P(RJ.J.head); g.globalCompositeOperation = 'lighter'; glow(g, hd[0], hd[1] + UNDER.headH * p[2] * 0.1, Math.max(8, p[2] * 0.13), [150, 240, 230], 0.4 * opt.eyeGlow); }
    // water dripping off it
    if (opt.drip) { g.globalCompositeOperation = 'source-over'; for (let i = 0; i < 5; i++) { const per = 0.9 + hash(i) * 0.6, k = ((E.t + i * 0.37) % per) / per, x0 = p[0] + (hash(i + 3) - 0.5) * p[2] * 1.2, y0 = p[1] - p[2] * (0.5 + hash(i + 6) * 0.6); g.fillStyle = `rgba(190,220,235,${0.6 * (1 - k)})`; ell(g, x0, y0 + k * (p[1] - y0), Math.max(1, p[2] * 0.012), Math.max(1.5, p[2] * 0.02)); g.fill(); } }
    g.restore();
  } };
}
function keeperSprite(z, x, pose, yaw, opt = {}) {
  return { z, draw: (g, cam, E) => { const p = proj(cam, x, opt.y || 0, z); if (!p) return;
    g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, p[0], p[1], p[2] * 0.35, p[2] * 0.05); g.fill();
    drawRig(g, KEEPER, pose, p[0], p[1], p[2], yaw, { t: E.t, ...opt });
    if (opt.after) opt.after(g, p);
  } };
}
// ---------- side view of the sea (for the grey what-if scenes): parallax layers ----------
function sideSea(g, E, scroll, horizon, o = {}) {
  const P = E.P, t = E.t; const gr = g.createLinearGradient(0, horizon - 1300, 0, horizon); gr.addColorStop(0, rgb(P.top)); gr.addColorStop(0.7, rgb(P.mid)); gr.addColorStop(1, rgb(P.hor));
  g.fillStyle = gr; g.fillRect(0, 0, W, horizon + 4);
  if (P.moon > 0) { glow(g, 820, horizon - 760, 260, [190, 205, 235], 0.22); ell(g, 820, horizon - 760, 48, 48); g.fillStyle = '#d6d3c4'; g.fill(); }
  for (let i = 0; i < 5; i++) { const x = ((i * 300 + t * (10 + i * 3)) % (W + 600)) - 300, y = horizon - 500 - i * 120; g.fillStyle = 'rgba(40,48,70,0.45)'; ell(g, x, y, 260, 50); g.fill(); ell(g, x + 120, y - 20, 180, 40); g.fill(); }
  drawBats(g, { hy: horizon }, E);
  // far lighthouse silhouette on the headland
  if (o.lighthouse !== false) { const lx = 160 - (scroll * 0.05) % 2000; g.fillStyle = rgb(mixc([18, 22, 34], P.fog, 0.35)); poly(g, [[lx - 300, horizon + 2], [lx - 120, horizon - 40], [lx + 60, horizon - 50], [lx + 260, horizon + 2]]); g.fill();
    poly(g, [[lx - 18, horizon - 40], [lx + 18, horizon - 40], [lx + 12, horizon - 240], [lx - 12, horizon - 240]]); g.fill(); g.fillRect(lx - 22, horizon - 250, 44, 10); g.fillRect(lx - 12, horizon - 285, 24, 35); }
  // sea layers
  [[0.2, 0.5, 0.6], [0.5, 0.25, 0.85], [1.0, 0.0, 1.2]].forEach(([par, fk, sc], li) => {
    const y0 = horizon + li * 40 * sc; g.fillStyle = rgb(mixc(mixc(SEA.col, [30, 40, 60], 0.3 - li * 0.1), P.fog, fk)); g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) g.lineTo(x, y0 + Math.sin((x + scroll * par) * 0.012 + t * (1 + li * 0.4)) * 8 * sc + Math.sin((x + scroll * par) * 0.031 - t * 1.7) * 4 * sc); g.lineTo(W, H); g.closePath(); g.fill();
    g.strokeStyle = rgb(SEA.foam, 0.12 + li * 0.05); g.lineWidth = 2 * sc; g.stroke();
  });
}
// one foreground wave surface (side view) at y; returns the surface height function
function seaSurface(x, t, y) { return y + Math.sin(x * 0.011 + t * 1.6) * 14 + Math.sin(x * 0.027 - t * 2.3) * 6; }
function frontWater(g, E, y, o = {}) {
  const t = E.t; g.fillStyle = o.col || 'rgba(8,16,30,0.92)'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, seaSurface(x, t, y)); g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(200,220,235,0.45)'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= W; x += 8) { const yy = seaSurface(x, t, y); x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
}

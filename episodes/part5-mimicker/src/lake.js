// ---------- Part 4 world: a frozen lake at midnight (2.5D perspective, same comic look as the road) ----------
const LAKE = { x0: -26, x1: 30, z1: 92 };   // ice area; shore beyond
const HOLE_YOU = { x: 0.55, z: 1.1, r: 0.32 }, HOLE_IT = { x: 2.2, z: 46, r: 0.75 };
const CABIN = { x: -11, z: 100, w: 7, d: 5, h: 3.2 };
const LAKEW = (() => {
  const r = rng(41), trees = [], drifts = [], cracks = [], holes = [HOLE_YOU, HOLE_IT, { x: -7, z: 30, r: 0.4 }, { x: 9, z: 64, r: 0.45 }, { x: -3, z: 78, r: 0.4 }], rocks = [];
  for (let i = 0; i < 300; i++) {
    let x, z; const k = r();
    if (k < 0.45) { z = LAKE.z1 + 3 + r() * 170; x = -90 + r() * 180; if (Math.abs(x - CABIN.x) < 7 && z < CABIN.z + 9) continue; }
    else { const side = r() < 0.5 ? -1 : 1; x = side < 0 ? LAKE.x0 - 3 - r() * 40 : LAKE.x1 + 3 + r() * 40; z = -25 + r() * 140; }
    trees.push({ x, z, h: 8 + r() * 10, w: 0.36 + r() * 0.1, seed: r() * 100 });
  }
  for (let i = 0; i < 70; i++) drifts.push({ x: LAKE.x0 + r() * (LAKE.x1 - LAKE.x0), z: -10 + r() * 100, w: 1 + r() * 4, d: 0.3 + r() * 1.2, a: 0.08 + r() * 0.12 });
  for (let i = 0; i < 45; i++) { const pts = []; let x = LAKE.x0 + 4 + r() * (LAKE.x1 - LAKE.x0 - 8), z = -6 + r() * 90, a = r() * TAU; pts.push([x, z]); for (let k = 0; k < 5; k++) { a += (r() - 0.5) * 1.2; const l = 0.6 + r() * 2.5; x += Math.cos(a) * l; z += Math.sin(a) * l; pts.push([x, z]); } cracks.push(pts); }
  for (let i = 0; i < 26; i++) { const side = r() < 0.5 ? -1 : 1; rocks.push({ x: side < 0 ? LAKE.x0 - r() * 3 : LAKE.x1 + r() * 3, z: -10 + r() * 100, s: 0.4 + r() * 0.9 }); }
  return { trees, drifts, cracks, holes, rocks };
})();
const ICE = { ice: hex('#1b2a40'), iceNear: hex('#0d1626'), snow: hex('#5a6884'), snowD: hex('#c9b8bd') };

function drawLakeGround(g, cam, E) {
  const P = E.P, hy = cam.hy, dawn = E.dawn;
  const snow = mixc(ICE.snow, hex('#8a7f90'), dawn), ice = mixc(ICE.ice, hex('#4a4c63'), dawn), iceN = mixc(ICE.iceNear, hex('#25263a'), dawn);
  // snowy ground everywhere
  const gr = g.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, rgb(P.fog)); gr.addColorStop(0.1, rgb(mixc(snow, P.fog, 0.4))); gr.addColorStop(1, rgb(mixc(snow, [0, 0, 0], 0.35)));
  g.fillStyle = gr; g.fillRect(0, hy - 2, W, H - hy + 2);
  const zn = cam.z + 0.3, q = (x, z) => { const p = proj(cam, x, 0, z); return [p[0], p[1]]; };
  // the ice sheet
  const iz1 = Math.max(zn + 0.1, LAKE.z1);
  if (LAKE.z1 > zn) {
    const pts = [q(LAKE.x0, zn), q(LAKE.x1, zn), q(LAKE.x1, LAKE.z1 - 4), q(LAKE.x1 - 6, LAKE.z1), q(LAKE.x0 + 8, LAKE.z1), q(LAKE.x0, LAKE.z1 - 6)];
    const far = q(0, LAKE.z1)[1], near = Math.min(H, q(0, zn)[1]);
    const ig = g.createLinearGradient(0, far, 0, near); ig.addColorStop(0, rgb(mixc(ice, P.fog, 0.55))); ig.addColorStop(0.25, rgb(mixc(ice, P.fog, 0.2))); ig.addColorStop(1, rgb(iceN));
    g.fillStyle = ig; poly(g, pts); g.fill();
    g.save(); poly(g, pts); g.clip();
    // moon / sun reflection streak on the ice
    const mx = dawn > 0.4 ? W * 0.68 : 190 - cam.x * 2;
    g.save(); g.globalCompositeOperation = 'lighter';
    const rg = g.createLinearGradient(0, far, 0, H); rg.addColorStop(0, rgb(dawn > 0.4 ? [255, 190, 140] : [150, 170, 210], 0.28)); rg.addColorStop(1, rgb([150, 170, 210], 0));
    g.fillStyle = rg; g.beginPath(); g.moveTo(mx - 20, far); g.lineTo(mx + 20, far); g.lineTo(mx + 260, H); g.lineTo(mx - 260, H); g.fill();
    g.restore();
    // wind-blown snow drifts on the ice
    for (const d of LAKEW.drifts) { const p = proj(cam, d.x, 0, d.z); if (!p || p[3] > 90) continue; const fk = fogK(E, p[3]);
      g.fillStyle = rgb(mixc(snow, P.fog, fk), d.a + 0.15 * (1 - fk)); ell(g, p[0], p[1], d.w * p[2], d.d * p[2] * (cam.y + 0.2) / p[3] * 0.9 + 1, 0); g.fill(); }
    // cracks in the ice
    g.lineCap = 'round';
    for (const c of LAKEW.cracks) { const a = proj(cam, c[0][0], 0, c[0][1]); if (!a || a[3] > 70) continue; const fk = fogK(E, a[3]);
      g.strokeStyle = rgb([200, 225, 250], 0.32 * (1 - fk)); g.lineWidth = Math.max(1, a[2] * 0.02); g.beginPath(); let ok = true;
      c.forEach((pt, i) => { const p = proj(cam, pt[0], 0, pt[1]); if (!p) { ok = false; return; } i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); if (ok) g.stroke(); }
    g.restore();
    // shoreline edge (a ridge of pushed-up ice + snow bank)
    g.strokeStyle = rgb(mixc([210, 225, 240], P.fog, 0.5), 0.55); g.lineWidth = 3; g.beginPath(); pts.slice(2).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  }
}
function drawHole(g, cam, E, h, o = {}) {   // fishing hole: slush rim, black water, ripples
  const p = proj(cam, h.x, 0, h.z); if (!p) return; const fk = fogK(E, p[3]);
  const rx = h.r * p[2], ry = Math.max(1.5, h.r * p[2] * (cam.y + 0.01) / p[3]);
  g.fillStyle = rgb(mixc([210, 222, 236], E.P.fog, fk)); ell(g, p[0], p[1], rx * 1.45, ry * 1.5); g.fill();
  g.fillStyle = rgb(mixc([120, 140, 165], E.P.fog, fk)); ell(g, p[0], p[1] + ry * 0.1, rx * 1.1, ry * 1.12); g.fill();
  g.fillStyle = rgb(mixc([3, 6, 12], E.P.fog, fk * 0.8)); ell(g, p[0], p[1] + ry * 0.12, rx, ry); g.fill();
  const rip = o.ripple || 0;
  if (rip > 0) { g.strokeStyle = rgb([140, 170, 210], 0.45 * rip); g.lineWidth = Math.max(1, p[2] * 0.012); for (let i = 0; i < 2; i++) { const k = ((E.t * 0.8 + i * 0.5) % 1); ell(g, p[0], p[1] + ry * 0.12, rx * k, ry * k); g.stroke(); } }
}
function drawCabin(g, cam, E) {
  const c = CABIN, fk = fogK(E, c.z - cam.z) * 0.85, P = E.P;
  const Q = (x, y, z) => { const p = proj(cam, x, y, z); return p ? [p[0], p[1]] : null; };
  const x0 = c.x - c.w / 2, x1 = c.x + c.w / 2, z0 = c.z, z1 = c.z + c.d;
  if (!Q(x0, 0, z0)) return;
  const wood = rgb(mixc([46, 30, 24], P.fog, fk)), woodS = rgb(mixc([30, 20, 17], P.fog, fk)), roof = rgb(mixc([200, 212, 228], P.fog, fk)), ink = rgb(mixc([8, 8, 10], P.fog, fk));
  // side wall (visible right side)
  g.fillStyle = woodS; poly(g, [Q(x1, 0, z0), Q(x1, 0, z1), Q(x1, c.h, z1), Q(x1, c.h, z0)]); g.fill();
  // front wall + gable
  g.fillStyle = wood; poly(g, [Q(x0, 0, z0), Q(x1, 0, z0), Q(x1, c.h, z0), Q(c.x, c.h + 2.2, z0), Q(x0, c.h, z0)]); g.fill(); g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
  // log lines
  g.strokeStyle = rgb(mixc([18, 12, 10], P.fog, fk), 0.8); g.lineWidth = 1.5;
  for (let y = 0.4; y < c.h; y += 0.45) { const a = Q(x0, y, z0), b = Q(x1, y, z0), d = Q(x1, y, z1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.stroke(); }
  // snowy roof
  g.fillStyle = roof; poly(g, [Q(x0 - 0.5, c.h - 0.1, z0 - 0.3), Q(c.x, c.h + 2.4, z0 - 0.3), Q(c.x, c.h + 2.4, z1 + 0.3), Q(x0 - 0.5, c.h - 0.1, z1 + 0.3)]); g.fill();
  g.fillStyle = rgb(mixc([160, 175, 200], P.fog, fk)); poly(g, [Q(c.x, c.h + 2.4, z0 - 0.3), Q(x1 + 0.5, c.h - 0.1, z0 - 0.3), Q(x1 + 0.5, c.h - 0.1, z1 + 0.3), Q(c.x, c.h + 2.4, z1 + 0.3)]); g.fill();
  // chimney + smoke
  g.fillStyle = woodS; poly(g, [Q(x1 - 1.6, c.h + 0.8, z0 + 2), Q(x1 - 1.0, c.h + 0.8, z0 + 2), Q(x1 - 1.0, c.h + 2.6, z0 + 2), Q(x1 - 1.6, c.h + 2.6, z0 + 2)]); g.fill();
  const ch = proj(cam, x1 - 1.3, c.h + 2.7, z0 + 2);
  for (let i = 0; i < 6; i++) { const k = ((E.t * 0.18 + i / 6) % 1); g.fillStyle = rgb(mixc([120, 130, 150], P.fog, 0.4), 0.3 * (1 - k)); ell(g, ch[0] + k * 60 + Math.sin(E.t + i) * 8, ch[1] - k * 160, 10 + k * 40, 8 + k * 30); g.fill(); }
  // warm windows + door
  const lit = 1 - E.dawn * 0.6;
  for (const wx of [x0 + 1.2, x1 - 1.9]) { const a = Q(wx, 1.2, z0 - 0.01), b = Q(wx + 1.0, 2.2, z0 - 0.01); g.fillStyle = rgb([255, 180, 90], 0.95); g.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
    g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(a[0], b[1], b[0] - a[0], a[1] - b[1]); g.beginPath(); g.moveTo((a[0] + b[0]) / 2, b[1]); g.lineTo((a[0] + b[0]) / 2, a[1]); g.stroke();
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (b[0] - a[0]) * 3.5, [255, 170, 80], 0.35 * lit); g.restore(); }
  const d0 = Q(c.x - 0.5, 0, z0 - 0.01), d1 = Q(c.x + 0.5, 2.0, z0 - 0.01); g.fillStyle = rgb(mixc([22, 14, 10], P.fog, fk)); g.fillRect(d0[0], d1[1], d1[0] - d0[0], d0[1] - d1[1]);
  // snow bank in front
  const sb = proj(cam, c.x, 0, z0 - 0.5); g.fillStyle = roof; ell(g, sb[0], sb[1], c.w * 0.8 * sb[2], 0.25 * sb[2]); g.fill();
}
function drawGear(g, cam, E, o = {}) {   // your spot: bucket, lantern, rod, auger, thermos
  const L = proj(cam, -0.45, 0, 0.7);
  if (L && o.lantern !== 0) { const k = o.lantern == null ? 1 : o.lantern; g.save(); g.globalCompositeOperation = 'lighter'; const p0 = proj(cam, -0.45, 0, 0.7);
    g.save(); g.translate(p0[0], p0[1]); g.scale(1, Math.max(0.12, (cam.y + 0.05) / p0[3])); glow(g, 0, 0, Math.min(p0[2] * 4.2, 1300), [255, 170, 80], 0.22 * k); g.restore(); g.restore(); }
  const items = [];
  // auger stuck in the ice
  if (o.props !== false) items.push({ z: 1.8, d: () => { const a = proj(cam, -0.95, 0, 1.8), b = proj(cam, -0.9, 1.25, 1.8); if (!a || !b) return; g.strokeStyle = '#0d0f14'; g.lineWidth = Math.max(2, a[2] * 0.07); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.strokeStyle = '#7d8696'; g.lineWidth = Math.max(1.5, a[2] * 0.04); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(lerp(a[0], b[0], 0.45), lerp(a[1], b[1], 0.45)); g.stroke(); g.strokeStyle = '#c23b2b'; g.lineWidth = Math.max(2, a[2] * 0.06); g.beginPath(); g.moveTo(b[0] - a[2] * 0.3, b[1]); g.lineTo(b[0] + a[2] * 0.3, b[1]); g.stroke(); } });
  // lantern
  items.push({ z: 0.7, d: () => { const p = proj(cam, -0.45, 0, 0.7); if (!p) return; const s = p[2], k = o.lantern == null ? 1 : o.lantern;
    g.fillStyle = '#1a1c22'; rr(g, p[0] - s * 0.09, p[1] - s * 0.05, s * 0.18, s * 0.05, s * 0.01); g.fill(); rr(g, p[0] - s * 0.08, p[1] - s * 0.36, s * 0.16, s * 0.05, s * 0.01); g.fill();
    g.fillStyle = rgb(mixc([60, 50, 40], [255, 200, 110], k)); rr(g, p[0] - s * 0.065, p[1] - s * 0.31, s * 0.13, s * 0.26, s * 0.02); g.fill(); g.strokeStyle = '#0c0d10'; g.lineWidth = Math.max(1, s * 0.012); g.stroke();
    g.beginPath(); g.arc(p[0], p[1] - s * 0.38, s * 0.06, Math.PI, TAU); g.stroke();
    if (k > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, p[0], p[1] - s * 0.18, Math.min(s * 0.9, 420), [255, 175, 90], 0.45 * k * (0.95 + 0.05 * Math.sin(E.t * 3))); g.restore(); } } });
  // bucket seat
  if (o.bucket !== false) items.push({ z: 0.05, d: () => { const p = proj(cam, 0, 0, 0), s = p ? p[2] : 0; if (!p) return; g.fillStyle = '#c9cfd8'; g.strokeStyle = '#0c0d10'; g.lineWidth = Math.max(1, s * 0.012);
    poly(g, [[p[0] - s * 0.17, p[1] - s * 0.42], [p[0] + s * 0.17, p[1] - s * 0.42], [p[0] + s * 0.14, p[1]], [p[0] - s * 0.14, p[1]]]); g.fill(); g.stroke(); g.fillStyle = '#9aa2b0'; ell(g, p[0], p[1] - s * 0.42, s * 0.17, s * 0.03); g.fill(); g.stroke(); } });
  // thermos
  if (o.props !== false) items.push({ z: 0.4, d: () => { const p = proj(cam, 0.9, 0, 0.4); if (!p) return; const s = p[2]; g.fillStyle = '#2f6b4a'; rr(g, p[0] - s * 0.04, p[1] - s * 0.26, s * 0.08, s * 0.26, s * 0.02); g.fill(); g.strokeStyle = '#0c0d10'; g.lineWidth = Math.max(1, s * 0.01); g.stroke(); g.fillStyle = '#c9cfd8'; rr(g, p[0] - s * 0.04, p[1] - s * 0.3, s * 0.08, s * 0.05, s * 0.01); g.fill(); } });
  return items;
}
function snowfall(g, E, k = 1, seed = 2, wind = 0) {   // slow falling snow, three depths (never flickers)
  if (k <= 0) return; const r = rng(seed);
  for (let i = 0; i < 150; i++) {
    const depth = 0.25 + r() * 0.75, x0 = r() * W, y0 = r() * H, sp = 40 + 110 * depth;
    const y = (y0 + E.t * sp) % (H + 40) - 20, x = ((x0 + Math.sin(E.t * 0.7 + i) * 26 * depth + E.t * (14 + wind) * depth) % (W + 20) + W + 20) % (W + 20) - 10;
    g.fillStyle = rgb(mixc([225, 235, 250], [255, 235, 215], E.dawn), (0.25 + 0.55 * depth) * k); ell(g, x, y, 1.4 + depth * 3.2, 1.4 + depth * 3.2); g.fill();
  }
}
// full lake view; extras: [{z, draw:(g,cam,E)=>{}}]
function lakeScene(g, cam, E, extras = [], o = {}) {
  drawSky(g, cam, E); drawBats(g, cam, E); fogBands(g, cam, E, 0.75);
  drawLakeGround(g, cam, E);
  const sp = [];
  for (const tr of LAKEW.trees) { const dz = tr.z - cam.z; if (dz < 0.5 || dz > 260) continue; sp.push({ z: tr.z, draw: () => { const p = proj(cam, tr.x, 0, tr.z); if (!p || p[0] < -p[2] * 6 || p[0] > W + p[2] * 6) return; drawPine(g, p[0], p[1], tr.h * p[2], tr.h * tr.w * 2.1 * p[2], E, fogK(E, dz), tr.seed, tr.x < 0);
    // snow on the branches
    const fk = fogK(E, dz); g.fillStyle = rgb(mixc([200, 212, 230], E.P.fog, fk), 0.55); for (let i = 1; i < 5; i++) { const y = p[1] - tr.h * p[2] * (0.12 + i / 6 * 0.8), ww = tr.h * tr.w * 2.1 * p[2] * (1 - i / 6 * 0.78) * 0.32; ell(g, p[0] - ww * 0.3, y - tr.h * p[2] * 0.015, ww, tr.h * p[2] * 0.012); g.fill(); } } }); }
  for (const rk of LAKEW.rocks) { const dz = rk.z - cam.z; if (dz < 0.5 || dz > 120) continue; sp.push({ z: rk.z, draw: () => { const p = proj(cam, rk.x, 0, rk.z); if (!p) return; const fk = fogK(E, dz); g.fillStyle = rgb(mixc([30, 34, 44], E.P.fog, fk)); ell(g, p[0], p[1], rk.s * p[2], rk.s * 0.6 * p[2]); g.fill(); g.fillStyle = rgb(mixc([200, 212, 230], E.P.fog, fk)); ell(g, p[0], p[1] - rk.s * 0.4 * p[2], rk.s * 0.8 * p[2], rk.s * 0.25 * p[2]); g.fill(); } }); }
  if (CABIN.z - cam.z > 1) sp.push({ z: CABIN.z, draw: () => drawCabin(g, cam, E) });
  for (const h of LAKEW.holes) { if (o.skipHole && o.skipHole(h)) continue; const dz = h.z - cam.z; if (dz < 0.4 || dz > 90) continue; sp.push({ z: h.z + 0.02, draw: () => drawHole(g, cam, E, h, { ripple: h === HOLE_IT ? (o.ripple || 0) : 0 }) }); }
  if (o.gear) for (const it of drawGear(g, cam, E, o.gear)) if (it.z - cam.z > 0.3) sp.push({ z: it.z, draw: it.d });
  for (let z = Math.ceil(cam.z / 7) * 7; z < cam.z + 120; z += 7) sp.push({ z: z + 0.01, draw: () => groundFog(g, cam, E, z, 0.9) });
  for (const x of extras) sp.push(x);
  sp.sort((a, b) => b.z - a.z).forEach(s => s.draw(g, cam, E));
  moonRays(g, cam, E, 0.9); sunRays(g, cam, E);
  snowfall(g, E, o.snow == null ? 1 : o.snow, 2, o.wind || 0);
}
// a Frostjaw sprite in the lake world (feet at world z). opt.sink: metres below the ice (clipped at the hole)
function frostSprite(z, x, pose, yaw = 0, opt = {}) {
  return { z, draw: (g, cam, E) => {
    const p = proj(cam, x, 0, z); if (!p) return;
    const fk = fogK(E, p[3]) * (opt.fogMul == null ? 0.7 : opt.fogMul);
    const L = scratch(); L.g.clearRect(0, 0, W, H);
    const sink = opt.sink || 0;
    if (!sink) { L.g.fillStyle = 'rgba(0,0,0,0.35)'; ell(L.g, p[0], p[1], p[2] * 0.55, p[2] * 0.08 * Math.max(0.3, cam.y / p[3] * 3)); L.g.fill(); }
    drawRig(L.g, FROST, pose, p[0], p[1] + sink * p[2], p[2], yaw, { t: E.t, twitch: 1, ...opt });
    if (sink > 0) {   // keep only what is above the ice (plus what shows inside the hole opening)
      const h = opt.hole || HOLE_IT, hp = proj(cam, h.x, 0, h.z), ry = Math.max(2, h.r * hp[2] * (cam.y + 0.01) / hp[3]);
      L.g.save(); L.g.globalCompositeOperation = 'destination-in'; L.g.fillStyle = '#000'; L.g.beginPath(); L.g.rect(0, 0, W, hp[1]); L.g.moveTo(hp[0] + h.r * hp[2], hp[1] + ry * 0.12); L.g.ellipse(hp[0], hp[1] + ry * 0.12, h.r * hp[2], ry, 0, 0, TAU); L.g.fill(); L.g.restore();
    }
    if (opt.lit) { L.g.save(); L.g.globalCompositeOperation = 'source-atop'; const gr = L.g.createLinearGradient(0, p[1] - 2.6 * p[2], 0, p[1]); gr.addColorStop(0, 'rgba(255,190,120,0)'); gr.addColorStop(1, `rgba(255,190,120,${0.22 * opt.lit})`); L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H); L.g.restore(); }
    // cold rim light from the moon
    L.g.save(); L.g.globalCompositeOperation = 'source-atop'; const rg = L.g.createLinearGradient(p[0] - p[2], 0, p[0] + p[2], 0); rg.addColorStop(0, 'rgba(170,200,255,0.18)'); rg.addColorStop(0.5, 'rgba(170,200,255,0)'); L.g.fillStyle = rg; L.g.fillRect(0, 0, W, H); L.g.restore();
    L.g.save(); L.g.globalCompositeOperation = 'source-atop'; L.g.fillStyle = rgb(E.P.fog, fk * 0.9); L.g.fillRect(0, 0, W, H); L.g.restore();
    g.save(); g.globalAlpha = opt.alpha == null ? 1 : opt.alpha; g.drawImage(L.c, 0, 0); g.restore();
  } };
}
function youSprite(z, x, pose, yaw, opt = {}) {   // the survivor as a sprite in the lake world
  return { z, draw: (g, cam, E) => { const p = proj(cam, x, 0, z); if (!p) return;
    g.fillStyle = 'rgba(0,0,0,0.3)'; ell(g, p[0], p[1], p[2] * 0.35, p[2] * 0.05); g.fill();
    if (opt.rot) { g.save(); g.translate(p[0], p[1]); g.rotate(opt.rot); drawRig(g, YOU, pose, opt.ox || 0, opt.oy || 0, p[2], yaw, { t: E.t, ...opt }); g.restore(); }
    else drawRig(g, YOU, pose, p[0], p[1], p[2], yaw, { t: E.t, ...opt });
    if (opt.after) opt.after(g, p);
  } };
}
// sound made visible: expanding rings
function soundRings(g, x, y, t, t0, s = 1, col = [190, 220, 255], dur = 1.1, n = 3) {
  for (let i = 0; i < n; i++) { const a = t - t0 - i * 0.18; if (a < 0 || a > dur) continue; const k = a / dur;
    g.strokeStyle = rgb(col, 0.75 * (1 - k)); g.lineWidth = 6 * s * (1 - k * 0.6); g.beginPath(); g.ellipse(x, y, (30 + k * 220) * s, (12 + k * 80) * s, 0, 0, TAU); g.stroke(); }
}
function sideIce(g, E, scroll, horizon, o = {}) {   // sideways lake view (for the what-if run)
  sideForest(g, E, scroll * 0.3, horizon - 8, o);
  const ig = g.createLinearGradient(0, horizon - 10, 0, H); ig.addColorStop(0, rgb(mixc(ICE.ice, E.P.fog, 0.55))); ig.addColorStop(0.2, rgb(ICE.ice)); ig.addColorStop(1, rgb(ICE.iceNear));
  g.fillStyle = ig; g.fillRect(0, horizon - 10, W, H);
  g.strokeStyle = 'rgba(200,225,250,0.25)'; g.lineWidth = 2;
  for (let i = -1; i < 14; i++) { const x = ((i * 160 - scroll) % 2240 + 2240) % 2240 - 300, hh = hash(i * 3 + 1); g.beginPath(); g.moveTo(x, horizon + 60 + hh * 500); g.lineTo(x + 70 + hh * 40, horizon + 70 + hh * 520); g.lineTo(x + 150, horizon + 50 + hh * 540); g.stroke();
    g.fillStyle = 'rgba(200,212,230,0.12)'; ell(g, x + 100, horizon + 140 + hh * 400, 120 + hh * 90, 14); g.fill(); }
}

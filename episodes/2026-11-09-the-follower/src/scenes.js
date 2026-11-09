// ---------- composed environments ----------
// full road view; extras: [{z, draw:(g,cam,E)=>{}}]
function roadScene(g, cam, E, extras = [], o = {}) {
  drawSky(g, cam, E); drawBats(g, cam, E); fogBands(g, cam, E, 0.8);
  drawGround(g, cam, E);
  if (o.carZ != null) headlightPool(g, cam, E, o.carZ, E.head);
  const sp = [];
  for (const tr of WORLD.trees) { const dz = tr.z - cam.z; if (dz < 0.5 || dz > 230) continue; sp.push({ z: tr.z, draw: () => { const p = proj(cam, tr.x, 0, tr.z); if (!p || p[0] < -p[2] * 5 || p[0] > W + p[2] * 5) return; drawPine(g, p[0], p[1], tr.h * p[2], tr.h * tr.w * 2.1 * p[2], E, fogK(E, dz), tr.seed, tr.x < 0); } }); }
  for (const d of WORLD.dead) { const dz = d.z - cam.z; if (dz < 0.5 || dz > 200) continue; sp.push({ z: d.z, draw: () => { const p = proj(cam, d.x, 0, d.z); if (p) drawDeadTree(g, p[0], p[1], d.h * p[2], E, fogK(E, dz), d.seed); } }); }
  for (const t of WORLD.tufts) { const dz = t.z - cam.z; if (dz < 0.6 || dz > 70) continue; sp.push({ z: t.z, draw: () => { const p = proj(cam, t.x, 0, t.z); if (!p) return; const c = rgb(mixc([20, 30, 26], E.P.fog, fogK(E, dz))); g.strokeStyle = c; g.lineWidth = Math.max(1, p[2] * 0.02); g.beginPath(); for (let k = -2; k <= 2; k++) { g.moveTo(p[0] + k * p[2] * 0.05, p[1]); g.lineTo(p[0] + k * p[2] * 0.09 + Math.sin(E.t * 1.5 + t.seed + k) * p[2] * 0.03, p[1] - t.h * p[2] * (1 - Math.abs(k) * 0.15)); } g.stroke(); } }); }
  for (const ps of WORLD.posts) { const dz = ps.z - cam.z; if (dz < 0.6 || dz > 150) continue; sp.push({ z: ps.z, draw: () => { const p = proj(cam, ps.x, 0, ps.z); if (!p) return; const fk = fogK(E, dz); g.fillStyle = rgb(mixc([200, 200, 196], E.P.fog, fk)); g.fillRect(p[0] - p[2] * 0.05, p[1] - p[2] * 1.0, p[2] * 0.1, p[2] * 1.0); g.fillStyle = rgb(mixc([20, 20, 20], E.P.fog, fk)); g.fillRect(p[0] - p[2] * 0.05, p[1] - p[2] * 0.85, p[2] * 0.1, p[2] * 0.12); if (E.head > 0 && o.carZ != null && dz < 45) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, p[0], p[1] - p[2] * 0.8, p[2] * 0.15, [255, 160, 60], 0.6 * E.head * (1 - fk)); g.restore(); } } }); }
  for (let z = Math.ceil(cam.z / 7) * 7; z < cam.z + 120; z += 7) sp.push({ z: z + 0.01, draw: () => groundFog(g, cam, E, z, 1) });
  for (const x of extras) sp.push(x);
  sp.sort((a, b) => b.z - a.z).forEach(s => s.draw(g, cam, E));
  if (o.carZ != null) headlightBeams(g, cam, E, o.carZ, E.head);
  moonRays(g, cam, E); sunRays(g, cam, E);
  if (E.motes) motes(g, E, E.motes); rain(g, E, E.rain);
}
// a creature sprite in the road world (feet at world z)
function creatureSprite(z, x, pose, yaw = 0, opt = {}) {
  return { z, draw: (g, cam, E) => {
    const p = proj(cam, x, 0, z); if (!p) return;
    const fk = fogK(E, p[3]) * (opt.fogMul == null ? 1 : opt.fogMul);
    const L = scratch(); L.g.clearRect(0, 0, W, H);
    // shadow on ground
    L.g.fillStyle = 'rgba(0,0,0,0.35)'; ell(L.g, p[0], p[1], p[2] * 0.5, p[2] * 0.08); L.g.fill();
    drawRig(L.g, STRETCHER, pose, p[0], p[1], p[2], yaw, { t: E.t, twitch: 1, ...opt });
    if (opt.lit) { L.g.save(); L.g.globalCompositeOperation = 'source-atop'; const gr = L.g.createLinearGradient(0, p[1] - 2.8 * p[2], 0, p[1]); gr.addColorStop(0, 'rgba(255,220,160,0)'); gr.addColorStop(1, `rgba(255,220,160,${0.25 * opt.lit})`); L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H); L.g.restore(); }
    L.g.save(); L.g.globalCompositeOperation = 'source-atop'; L.g.fillStyle = rgb(E.P.fog, fk * 0.92); L.g.fillRect(0, 0, W, H); L.g.restore();
    g.save(); g.globalAlpha = opt.alpha == null ? 1 : opt.alpha; g.drawImage(L.c, 0, 0); g.restore();
  } };
}
const _scr = []; let _scrI = 0;
function scratch() { if (!_scr[_scrI]) { const c = mkCanvas(); _scr[_scrI] = { c, g: c.getContext('2d') }; } const s = _scr[_scrI]; _scrI = (_scrI + 1) % 4; return s; }

// ---------- inside the car: through the windshield ----------
function windshieldPOV(g, E, o) {
  const cam = { x: -0.38, y: 1.18, z: 0.4, hy: 840 + (o.hyOff || 0), f: 1150 };
  roadScene(g, cam, E, o.extras || [], { carZ: -2.0 });
  // hood
  g.fillStyle = '#121a2c'; g.beginPath(); g.moveTo(-50, 1330); g.quadraticCurveTo(W / 2, 1180, W + 50, 1330); g.lineTo(W + 50, H); g.lineTo(-50, H); g.fill();
  g.strokeStyle = 'rgba(140,160,210,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(80, 1300); g.quadraticCurveTo(W / 2, 1185, W - 80, 1300); g.stroke();
  // raindrops on the glass
  const r = rng(21);
  for (let i = 0; i < 38; i++) { const x = r() * W, y = 250 + r() * 1050, rr_ = 4 + r() * 9, dy = ((E.t * (r() < 0.2 ? 40 : 0)) % 300); g.fillStyle = 'rgba(200,215,240,0.18)'; ell(g, x, y + dy, rr_, rr_ * 1.2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; ell(g, x - rr_ * 0.3, y + dy - rr_ * 0.4, rr_ * 0.3, rr_ * 0.3); g.fill(); }
  // glass reflection streak
  const rg = g.createLinearGradient(0, 300, W, 1000); rg.addColorStop(0.3, 'rgba(255,255,255,0)'); rg.addColorStop(0.45, 'rgba(160,180,220,0.06)'); rg.addColorStop(0.55, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  // frame: roof + A pillars
  g.fillStyle = '#07080c';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 260); g.quadraticCurveTo(W / 2, 200, 0, 260); g.fill();
  poly(g, [[0, 0], [150, 0], [-10, 1500], [0, 1500]]); g.fill(); poly(g, [[W, 0], [W - 150, 0], [W + 10, 1500], [W, 1500]]); g.fill();
  poly(g, [[0, 220], [210, 230], [0, 1450]]); g.fill(); poly(g, [[W, 220], [W - 210, 230], [W, 1450]]); g.fill();
  // rear-view mirror (swings gently)
  g.save(); g.translate(W / 2 + 60, 225); g.rotate(Math.sin(E.t * 1.3) * 0.03 + (o.mirrorKick || 0)); g.fillStyle = '#0d0f14'; g.fillRect(-8, 0, 16, 60);
  rr(g, -150, 55, 300, 85, 22); g.fill(); rr(g, -138, 66, 276, 63, 16); g.fillStyle = '#1b2233'; g.fill();
  g.fillStyle = 'rgba(255,60,40,0.25)'; ell(g, 60, 98, 60, 14); g.fill();
  // air freshener tree
  g.translate(-40, 140); g.rotate(Math.sin(E.t * 2.1) * 0.25); g.strokeStyle = '#ccc'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 60); g.stroke(); g.fillStyle = '#2f7a3f'; poly(g, [[0, 60], [26, 120], [-26, 120]]); g.fill(); g.restore();
  // dashboard
  const dg = g.createLinearGradient(0, 1380, 0, H); dg.addColorStop(0, '#15171d'); dg.addColorStop(1, '#07080b'); g.fillStyle = dg;
  g.beginPath(); g.moveTo(0, 1440); g.quadraticCurveTo(W / 2, 1360, W, 1440); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.strokeStyle = 'rgba(120,130,160,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 1442); g.quadraticCurveTo(W / 2, 1362, W, 1442); g.stroke();
  // gauges glow
  const dl = o.dash == null ? 1 : o.dash;
  if (dl > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 300, 1560, 120, [80, 160, 255], 0.35 * dl); glow(g, 500, 1560, 100, [80, 160, 255], 0.3 * dl); g.restore(); }
  for (const gx of [300, 500]) { g.strokeStyle = rgb([120, 180, 255], 0.3 + 0.6 * dl); g.lineWidth = 4; g.beginPath(); g.arc(gx, 1570, 70, Math.PI * 0.8, Math.PI * 2.2); g.stroke(); g.strokeStyle = rgb([255, 90, 60], 0.5 + 0.5 * dl); g.beginPath(); g.moveTo(gx, 1570); g.lineTo(gx - 40, 1530); g.stroke(); }
  // steering wheel + gripping hands (tremble)
  const tr = o.tremble || 0, wx = 400 + noise(E.t * 20) * 4 * tr, wy = 1700 + noise(E.t * 18 + 2) * 3 * tr;
  g.strokeStyle = '#0a0b0e'; g.lineWidth = 46; g.beginPath(); g.ellipse(wx, wy, 330, 250, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.strokeStyle = '#2a2d36'; g.lineWidth = 6; g.beginPath(); g.ellipse(wx, wy - 12, 330, 250, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  for (const sd of [-1, 1]) {
    const hx = wx + sd * 290, hy = wy - 120;
    g.fillStyle = HUMAN.hoodie; g.strokeStyle = '#141218'; g.lineWidth = 6; poly(g, [[hx - 70 + sd * 40, H + 20], [hx + 70 + sd * 40, H + 20], [hx + 50, hy + 50], [hx - 50, hy + 50]]); g.fill(); g.stroke();
    g.fillStyle = HUMAN.skin; rr(g, hx - 48, hy - 50, 96, 110, 40); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(80,50,30,0.6)'; g.lineWidth = 4; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(hx - 30 + k * 24, hy - 40); g.lineTo(hx - 30 + k * 24, hy - 5); g.stroke(); }
  }
}

// ---------- sideways forest backdrop (for the window view and the chase) ----------
function sideForest(g, E, scroll, horizon, o = {}) {
  const P = E.P;
  const gr = g.createLinearGradient(0, horizon - 1200, 0, horizon); gr.addColorStop(0, rgb(P.top)); gr.addColorStop(0.7, rgb(P.mid)); gr.addColorStop(1, rgb(P.hor));
  g.fillStyle = gr; g.fillRect(0, 0, W, horizon + 4);
  if (o.moon !== false && P.moon > 0) { glow(g, 820, horizon - 760, 220, [190, 205, 235], 0.2); ell(g, 820, horizon - 760, 44, 44); g.fillStyle = '#d6d3c4'; g.fill(); }
  drawBats(g, { hy: horizon }, E);
  const layers = [[0.12, 0.85, 0.25], [0.3, 0.6, 0.5], [0.6, 0.35, 0.8], [1.0, 0.12, 1.25]];
  const r = rng(5);
  layers.forEach(([par, fk, sc], li) => {
    const spacing = 150 * sc, off = (scroll * par) % spacing;
    const n = Math.ceil(W / spacing) + 3;
    for (let i = -1; i < n; i++) {
      const id = Math.floor((scroll * par) / spacing) + i, hh = (520 + hash(id * 7 + li) * 380) * sc, x = i * spacing - off + hash(id * 3 + li) * spacing * 0.6;
      if (hash(id * 11 + li) < 0.15 && li > 0) drawDeadTree(g, x, horizon + 30 * sc, hh * 0.9, E, fk, id);
      else drawPine(g, x, horizon + 30 * sc, hh, hh * 0.45, E, fk, id, true);
    }
    // ground fog per layer
    const fg = g.createLinearGradient(0, horizon - 120 * sc, 0, horizon + 60 * sc); fg.addColorStop(0, rgb(P.fog, 0)); fg.addColorStop(1, rgb(P.fog, 0.35 - li * 0.06)); g.fillStyle = fg; g.fillRect(0, horizon - 120 * sc, W, 180 * sc);
  });
}

// ---------- inside the car: looking at the driver's door from the passenger seat ----------
const DOOR = { winTop: 330, sill: 980, left: 150, right: 1010 };
function windowPath(g) { g.beginPath(); g.moveTo(DOOR.left + 140, DOOR.winTop); g.lineTo(DOOR.right, DOOR.winTop + 10); g.lineTo(DOOR.right, DOOR.sill); g.lineTo(DOOR.left - 40, DOOR.sill); g.closePath(); }
function carSide(g, E, o = {}) {
  // outside
  g.save(); windowPath(g); g.clip();
  sideForest(g, E, 300 + E.t * 2, 860, {});
  // road edge outside + headlight spill
  g.fillStyle = rgb(mixc(E.P.road, E.P.fog, 0.3)); g.fillRect(0, 860, W, 200);
  if (E.head > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 120, 900, 520, [255, 220, 160], 0.22 * E.head); g.restore(); }
  if (o.outside) o.outside(g);
  // glass: tint + reflections + condensation
  g.fillStyle = 'rgba(20,30,50,0.22)'; g.fillRect(0, 0, W, H);
  const rg = g.createLinearGradient(DOOR.left, DOOR.winTop, DOOR.right, DOOR.sill); rg.addColorStop(0.2, 'rgba(255,255,255,0)'); rg.addColorStop(0.32, 'rgba(180,200,240,0.07)'); rg.addColorStop(0.4, 'rgba(255,255,255,0)'); rg.addColorStop(0.7, 'rgba(180,200,240,0.05)'); rg.addColorStop(0.75, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  if (o.glass) o.glass(g);
  g.restore();
  // window frame + roof
  const ink = '#06070a';
  g.fillStyle = '#121419'; g.fillRect(0, 0, W, DOOR.winTop - 20);
  const rl = g.createLinearGradient(0, 0, 0, DOOR.winTop); rl.addColorStop(0, '#1d2028'); rl.addColorStop(1, '#0d0f13'); g.fillStyle = rl; g.fillRect(0, 0, W, DOOR.winTop - 20);
  g.fillStyle = '#0b0c10'; g.beginPath(); g.moveTo(0, DOOR.winTop - 20); g.lineTo(W, DOOR.winTop - 20); g.lineTo(W, DOOR.winTop + 10); g.lineTo(DOOR.left + 140, DOOR.winTop); g.lineTo(DOOR.left - 40, DOOR.sill); g.lineTo(0, DOOR.sill); g.fill();
  // grab handle on roof
  g.strokeStyle = '#2a2d35'; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(560, 230); g.quadraticCurveTo(650, 290, 740, 230); g.stroke();
  // door panel
  const dg = g.createLinearGradient(0, DOOR.sill, 0, H); dg.addColorStop(0, '#22252d'); dg.addColorStop(1, '#0c0d11'); g.fillStyle = dg; g.fillRect(0, DOOR.sill, W, H - DOOR.sill);
  g.fillStyle = '#16181e'; rr(g, 70, DOOR.sill + 10, W - 40, 60, 20); g.fill(); // sill top
  g.strokeStyle = 'rgba(140,150,180,0.2)'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, DOOR.sill + 12); g.lineTo(W, DOOR.sill + 12); g.stroke();
  // armrest + handle + window switch + speaker
  g.fillStyle = '#2b2f39'; rr(g, 260, 1230, 700, 90, 40); g.fill(); g.strokeStyle = ink; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#9aa0ad'; rr(g, 330, 1140, 150, 42, 18); g.fill(); g.fillStyle = '#5c6270'; rr(g, 345, 1150, 120, 22, 10); g.fill();
  g.fillStyle = '#0c0d10'; for (let i = 0; i < 2; i++) { rr(g, 700 + i * 80, 1250, 60, 34, 8); g.fill(); }
  g.fillStyle = '#121318'; ell(g, 620, 1560, 150, 120); g.fill(); g.strokeStyle = '#2a2d36'; g.lineWidth = 6; g.stroke();
  g.fillStyle = 'rgba(80,85,95,0.35)'; for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) { if (i * i / 16 + j * j / 9 > 1) continue; ell(g, 620 + i * 30, 1560 + j * 30, 6, 6); g.fill(); }
  // lock pin on the sill
  const lp = o.lockPin == null ? 0 : o.lockPin;  // 0 up, 1 down
  g.fillStyle = '#c7c9cf'; rr(g, 820, DOOR.sill - 52 + lp * 44, 30, 60 - lp * 44, 12); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.stroke();
  // dashboard edge + steering wheel at left
  g.fillStyle = '#0b0c10'; poly(g, [[0, 900], [210, 980], [260, 1500], [0, 1600]]); g.fill();
  g.strokeStyle = '#08090c'; g.lineWidth = 40; g.beginPath(); g.ellipse(150, 1170, 60, 270, -0.18, 0, TAU); g.stroke();
  g.strokeStyle = '#2b2e37'; g.lineWidth = 5; g.beginPath(); g.ellipse(160, 1165, 60, 270, -0.18, -1.2, 1.0); g.stroke();
  // light switch knob on dash (left)
  const lo = o.lightKnob || 0; g.save(); g.translate(120, 960); g.rotate(-lo * 1.2); g.fillStyle = '#1c1f26'; ell(g, 0, 0, 38, 38); g.fill(); g.strokeStyle = '#555b68'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#cfd3db'; g.fillRect(-4, -34, 8, 26); g.restore();
  if (E.head > 0.05) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 120, 960, 60, [90, 220, 120], 0.6 * E.head); g.restore(); }
  // seat back on the right
  if (o.seat !== false) { g.fillStyle = '#17191f'; rr(g, 870, 560, 260, 980, 60); g.fill(); g.strokeStyle = ink; g.lineWidth = 5; g.stroke(); g.fillStyle = '#1e2129'; rr(g, 900, 420, 200, 150, 40); g.fill(); g.stroke(); g.fillStyle = '#2a2d36'; g.fillRect(950, 560, 18, 40); g.fillRect(1040, 560, 18, 40); }
}
// seated / sliding driver seen from the passenger side (profile, facing left)
function driverPose(cover, slide, t, lights) {
  const reach = lights || 0;
  const pose = {
    legL: [lerp(88, 105, slide), lerp(85, 130, slide)], legR: [lerp(84, 100, slide), lerp(80, 125, slide)],
    lean: lerp(lerp(-8, 25, cover), 70, slide), headPitch: lerp(5, 35, Math.max(cover, slide)) + noise(t * 3) * 2,
    armL: [lerp(lerp(70, 60, reach), 40, cover), lerp(lerp(15, 5, reach), 115, cover), 0],
    armR: [lerp(65, 40, cover), lerp(25, 115, cover), 0],
    bob: 0, roll: 0,
  };
  return pose;
}
function drawDriver(g, E, cover, slide, lights, o = {}) {
  const s = 640, tr = (o.tremble || 0);
  const cx = 600 - slide * 180 + noise(E.t * 22) * tr * 5, cy = 1980 + slide * 520 + noise(E.t * 19 + 1) * tr * 4;
  drawRig(g, HUMAN, driverPose(cover, slide, E.t, lights), cx, cy - HUMAN.hipY * s * 0.0, s, -90, { t: E.t, expr: cover > 0.5 || o.closed ? 'closed' : 'scared' });
}

// =====================================================================
// ---------- The Follower: characters in the street world + lamp shadows ----------
// =====================================================================
function toWorld(l, wx, wz, yaw) { const c = Math.cos(yaw * D2R), s = Math.sin(yaw * D2R); return [wx + l[0] * c + l[2] * s, l[1], wz - (-l[0] * s + l[2] * c)]; }
function humanSegs(wx, wz, yaw, pose) {
  const J = rigJoints(HUMAN, pose), m = p => toWorld(p, wx, wz, yaw);
  return [[J.legL.slice(0, 3).map(m), 0.13], [J.legR.slice(0, 3).map(m), 0.13], [[J.pel, J.top].map(m), 0.36], [J.armL.slice(0, 3).map(m), 0.1], [J.armR.slice(0, 3).map(m), 0.1], [[J.neckTop, J.head, [J.head[0], J.head[1] + 0.1, J.head[2]]].map(m), 0.26]];
}
function folSegs(wx, wz, yaw, o) {
  const J = folJoints(o), m = p => toWorld(p, wx, wz, yaw), segs = [];
  for (const sd of [-1, 1]) { const l = J.legs[sd]; segs.push([[l[0], l[1]].map(m), 0.16], [[l[1], l[2]].map(m), 0.1], [[l[2], l[3]].map(m), 0.08]); const a = J.arms[sd]; segs.push([a.map(m), 0.09]); }
  segs.push([[J.pel, [0, J.pel[1] + 0.6, -0.05], J.hump, J.chest].map(m), 0.5]);
  const neck = []; for (let i = 0; i <= 8; i++) { const k = i / 8; neck.push([0, 1, 2].map(j => (1 - k) * (1 - k) * J.nb[j] + 2 * k * (1 - k) * J.nc[j] + k * k * J.head[j])); }
  segs.push([neck.map(m), 0.17]);
  segs.push([[J.head, [J.head[0], J.head[1] - 0.45, J.head[2] + 0.1]].map(m), 0.5]);
  // dangling fingers
  for (const sd of [-1, 1]) { const w = J.arms[sd][2]; segs.push([[w, [w[0], w[1] - 0.55, w[2] + 0.15]].map(m), 0.12]); }
  return segs;
}
// segsList: [{segs, near:[x,z]}]; draws soft-edged shadows of every lit lamp onto the ground
function drawShadows(g, cam, E, segsList, k = 1) {
  const L = scratch(); const lg = L.g;
  for (const lamp of LAMPS) {
    const lv = lampLevel(E, lamp); if (lv < 0.02) continue;
    const near = segsList.some(c => Math.hypot(c.near[0] - lamp.hx, c.near[1] - lamp.z) < 16); if (!near) continue;
    lg.clearRect(0, 0, W, H); lg.lineCap = 'round'; lg.lineJoin = 'round'; lg.strokeStyle = '#000';
    const Lp = [lamp.hx, lamp.hy, lamp.z];
    const gp = P => { const d = Math.max(0.3, Lp[1] - P[1]), f = Lp[1] / d; return [Lp[0] + (P[0] - Lp[0]) * f, Lp[2] + (P[2] - Lp[2]) * f]; };
    for (const c of segsList) for (const [pts, w] of c.segs) {
      const sc = pts.map(gp).map(q => proj(cam, q[0], 0, q[1])); if (sc.every(p => !p)) continue;
      const ws = pts.map((P, i) => sc[i] ? Math.min(400, w * sc[i][2] * Lp[1] / Math.max(0.3, Lp[1] - P[1])) : 0);
      for (let i = 0; i < sc.length - 1; i++) { if (!sc[i] || !sc[i + 1]) continue; lg.lineWidth = Math.max(1, (ws[i] + ws[i + 1]) / 2); lg.beginPath(); lg.moveTo(sc[i][0], sc[i][1]); lg.lineTo(sc[i + 1][0], sc[i + 1][1]); lg.stroke(); }
      if (sc.length === 1 && sc[0]) { lg.fillStyle = '#000'; ell(lg, sc[0][0], sc[0][1], ws[0] / 2, ws[0] / 4); lg.fill(); }
    }
    // fade with distance from the lamp: mask by a radial gradient around the pool
    const pc = proj(cam, lamp.hx, 0, lamp.z), pf = proj(cam, lamp.hx, 0, lamp.z + 16);
    lg.save(); lg.globalCompositeOperation = 'destination-in';
    if (pc) { const rx = 18 * pc[2]; lg.translate(pc[0], pc[1]); const ry = Math.max(20, pf ? Math.abs(pc[1] - pf[1]) * 1.1 : rx); lg.scale(1, ry / rx); const gr = lg.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gr; lg.fillRect(-rx, -rx, 2 * rx, 2 * rx); }
    lg.restore();
    g.save(); g.globalAlpha = 0.62 * lv * k; g.filter = 'blur(2px)'; g.drawImage(L.c, 0, 0); g.restore();
  }
}
// draw a character with fog + warm lamp light, through a scratch layer
function litSprite(g, cam, E, wx, wz, drawFn, o = {}) {
  const p = proj(cam, wx, 0, wz); if (!p) return;
  const fk = fogK(E, p[3]) * (o.fogMul == null ? 0.7 : o.fogMul), lit = (o.lit == null ? lampLight(E, wx, wz) : o.lit);
  const L = scratch(); L.g.clearRect(0, 0, W, H);
  L.g.fillStyle = 'rgba(0,0,0,0.35)'; ell(L.g, p[0], p[1], p[2] * (o.shadowW || 0.4), p[2] * 0.06); L.g.fill();
  drawFn(L.g, p);
  L.g.save(); L.g.globalCompositeOperation = 'source-atop';
  const top = p[1] - (o.h || 4) * p[2];
  const gr = L.g.createLinearGradient(0, top, 0, p[1]); gr.addColorStop(0, `rgba(255,186,110,${0.32 * lit})`); gr.addColorStop(1, `rgba(255,170,90,${0.08 * lit})`); L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H);
  L.g.fillStyle = `rgba(10,14,28,${0.5 * (1 - lit) * (o.dark == null ? 1 : o.dark)})`; L.g.fillRect(0, 0, W, H);
  L.g.fillStyle = rgb(E.P.fog, fk * 0.9); L.g.fillRect(0, 0, W, H); L.g.restore();
  g.save(); g.globalAlpha = o.alpha == null ? 1 : o.alpha; g.drawImage(L.c, 0, 0); g.restore();
}
function humanSprite(wx, wz, pose, yaw, o = {}) { return { z: wz, draw: (g, cam, E) => litSprite(g, cam, E, wx, wz, (lg, p) => drawRig(lg, HUMAN, pose, p[0], p[1], p[2], yaw, { t: E.t, expr: o.expr || 'scared' }), { h: 1.9, shadowW: 0.3, ...o }) }; }
function folSprite(wx, wz, fo, yaw, o = {}) { return { z: wz + (o.zBias || 0), draw: (g, cam, E) => litSprite(g, cam, E, wx, wz, (lg, p) => drawFollower(lg, fo, p[0], p[1], p[2], yaw, { t: E.t, ...o }), { h: 4, shadowW: 0.7, ...o }) }; }

// ---------- the foggy forest road world (2.5D perspective, comic look) ----------
const NIGHT = { top: hex('#05070f'), mid: hex('#121a2e'), hor: hex('#2a344c'), fog: hex('#56637d'), tree: hex('#0c141b'), treeLit: hex('#1e2c37'), grass: hex('#070b0e'), road: hex('#111318'), moon: 1 };
const DAWN = { top: hex('#2d3d63'), mid: hex('#a8707a'), hor: hex('#f4b483'), fog: hex('#d6b7a8'), tree: hex('#24222a'), treeLit: hex('#43373c'), grass: hex('#1a1a1d'), road: hex('#2a282b'), moon: 0 };
function envAt(t, dawn = 0, extra = {}) {
  const P = {}; for (const k in NIGHT) P[k] = typeof NIGHT[k] === 'number' ? lerp(NIGHT[k], DAWN[k], dawn) : mixc(NIGHT[k], DAWN[k], dawn);
  return Object.assign({ t, dawn, fogDist: lerp(44, 60, dawn), head: 0, tail: 0, P, bats: 1 - dawn, birds: dawn, rain: 0, motes: 1 }, extra);
}
function proj(cam, x, y, z) { const dz = z - cam.z; if (dz < 0.05) return null; const s = cam.f / dz; return [W / 2 + (x - cam.x) * s, cam.hy + (cam.y - y) * s, s, dz]; }
const fogK = (E, dz) => 1 - Math.exp(-dz / E.fogDist);

// ---------- static world layout ----------
const WORLD = (() => {
  const r = rng(7), trees = [], tufts = [], posts = [], dead = [];
  for (let i = 0; i < 260; i++) {
    const side = i % 2 ? 1 : -1, z = -20 + r() * 300, x = side * (5.2 + Math.pow(r(), 1.4) * 34);
    trees.push({ x, z, h: 7 + r() * 9, w: 0.36 + r() * 0.1, seed: r() * 100, tiers: 5 + (r() * 3 | 0) });
  }
  for (let i = 0; i < 14; i++) { const side = i % 2 ? 1 : -1; dead.push({ x: side * (4.6 + r() * 6), z: r() * 160, h: 5 + r() * 4, seed: r() * 100 }); }
  for (let i = 0; i < 220; i++) { const side = r() < 0.5 ? -1 : 1; tufts.push({ x: side * (3.7 + r() * 2.6), z: -10 + r() * 140, h: 0.18 + r() * 0.3, seed: r() * 10 }); }
  for (let z = -40; z < 300; z += 24) { posts.push({ x: -3.95, z }); posts.push({ x: 3.95, z: z + 12 }); }
  const cracks = []; for (let i = 0; i < 40; i++) cracks.push({ x: -3 + r() * 6, z: r() * 200, l: 0.4 + r() * 1.4, a: r() * 3 });
  return { trees, tufts, posts, dead, cracks };
})();

// ---------- sky ----------
function drawSky(g, cam, E) {
  const P = E.P, hy = cam.hy;
  const gr = g.createLinearGradient(0, hy - 1300, 0, hy + 40);
  gr.addColorStop(0, rgb(P.top)); gr.addColorStop(0.62, rgb(P.mid)); gr.addColorStop(1, rgb(P.hor));
  g.fillStyle = gr; g.fillRect(0, 0, W, hy + 60);
  // stars (gentle, slow twinkle - no flicker)
  const r = rng(3); g.fillStyle = '#fff';
  for (let i = 0; i < 140; i++) {
    const x = r() * W, y = hy - 300 - r() * 1400, a = (0.25 + 0.5 * r()) * (1 - E.dawn) * (0.75 + 0.25 * Math.sin(E.t * 0.8 + i));
    if (y < -10) continue; g.globalAlpha = a; g.fillRect(x, y, 2.2, 2.2);
  }
  g.globalAlpha = 1;
  // moon
  if (P.moon > 0.02) {
    const mx = 190 - cam.x * 2, my = hy - 640;
    glow(g, mx, my, 330, [190, 205, 235], 0.22 * P.moon);
    g.globalAlpha = P.moon; ell(g, mx, my, 62, 62); g.fillStyle = '#d9d6c6'; g.fill();
    g.fillStyle = 'rgba(150,145,130,0.55)';
    [[-18, -14, 13], [16, 8, 10], [-6, 22, 7], [22, -20, 6], [-26, 10, 5]].forEach(c => { ell(g, mx + c[0], my + c[1], c[2], c[2]); g.fill(); });
    g.globalAlpha = 1;
  }
  // dawn sun glow
  if (E.dawn > 0.01) { glow(g, W * 0.68, hy + 20, 900, [255, 190, 120], 0.55 * E.dawn); glow(g, W * 0.68, hy + 10, 200, [255, 230, 180], 0.7 * E.dawn); }
  // drifting clouds, lit edges
  for (let i = 0; i < 9; i++) {
    const sp = 9 + i * 2.3, x = ((i * 397 + E.t * sp) % (W + 900)) - 450, y = hy - 520 - (i % 4) * 190 - (i * 37 % 80);
    const s = 1 + (i % 3) * 0.4;
    g.save(); g.globalAlpha = 0.5 - E.dawn * 0.15;
    for (let b = 0; b < 5; b++) {
      const bx = x + (b - 2) * 95 * s, by = y + Math.sin(b * 2.1 + i) * 22, br = (70 + (b * 31 + i * 17) % 50) * s;
      const cg = g.createRadialGradient(bx, by - br * 0.3, 0, bx, by, br * 1.2);
      const top = E.dawn > 0.3 ? [240, 170, 150] : [92, 104, 132], body = E.dawn > 0.3 ? [140, 110, 130] : [30, 36, 54];
      cg.addColorStop(0, rgb(top, 0.9)); cg.addColorStop(0.55, rgb(body, 0.7)); cg.addColorStop(1, rgb(body, 0));
      g.fillStyle = cg; ell(g, bx, by, br * 1.5, br * 0.75); g.fill();
    }
    g.restore();
  }
  // mountains (2 layers)
  for (let L = 0; L < 2; L++) {
    const base = mixc(P.hor, P.tree, L ? 0.25 : 0.12), amp = L ? 150 : 230;
    g.fillStyle = rgb(mixc(base, P.fog, 0.35)); g.beginPath(); g.moveTo(0, hy + 5);
    for (let x = 0; x <= W; x += 20) { const n = Math.abs(noise((x + cam.x * (L ? 6 : 3)) * 0.004 + L * 10)) * amp + Math.abs(noise(x * 0.013 + L * 3)) * 40; g.lineTo(x, hy - n * (L ? 0.8 : 1) - (L ? 0 : 30)); }
    g.lineTo(W, hy + 5); g.fill();
  }
}

// ---------- flying things ----------
function drawBats(g, cam, E) {
  if (E.bats > 0.05) for (let i = 0; i < 3; i++) {
    const per = 14 + i * 4, k = ((E.t + i * 5.3) % per) / per, x = lerp(-80, W + 80, k), y = cam.hy - 700 - i * 120 + Math.sin(k * 9 + i) * 40;
    const fl = Math.sin(E.t * 16 + i * 2), s = 1.1 - i * 0.2;
    g.strokeStyle = rgb([8, 10, 16], E.bats); g.lineWidth = 3.5 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 16 * s, y - fl * 9 * s); g.quadraticCurveTo(x - 7 * s, y - 3 * s, x, y + 2 * s); g.quadraticCurveTo(x + 7 * s, y - 3 * s, x + 16 * s, y - fl * 9 * s); g.stroke();
  }
  if (E.birds > 0.05) for (let i = 0; i < 6; i++) {
    const k = ((E.t * 0.07 + i * 0.13) % 1.3), x = lerp(-60, W + 60, k) + i * 40, y = cam.hy - 560 - (i % 3) * 60 + i * 18 + Math.sin(E.t * 2 + i) * 10;
    const fl = Math.sin(E.t * 12 + i * 1.7);
    g.strokeStyle = rgb([40, 30, 40], E.birds * 0.9); g.lineWidth = 3; g.beginPath(); g.moveTo(x - 13, y - fl * 7); g.quadraticCurveTo(x - 5, y - 2, x, y + 1); g.quadraticCurveTo(x + 5, y - 2, x + 13, y - fl * 7); g.stroke();
  }
}

// ---------- ground + road ----------
function drawGround(g, cam, E) {
  const P = E.P, hy = cam.hy;
  const gr = g.createLinearGradient(0, hy, 0, H);
  gr.addColorStop(0, rgb(P.fog)); gr.addColorStop(0.08, rgb(mixc(P.grass, P.fog, 0.6))); gr.addColorStop(0.4, rgb(P.grass)); gr.addColorStop(1, rgb(mixc(P.grass, [0, 0, 0], 0.3)));
  g.fillStyle = gr; g.fillRect(0, hy - 2, W, H - hy + 2);
  const zn = cam.z + 0.4, zf = cam.z + 900;
  const q = (x, z) => proj(cam, x, 0, z);
  // shoulders (gravel)
  const sh = [q(-4.4, zn), q(4.4, zn), q(4.4, zf), q(-4.4, zf)];
  g.fillStyle = rgb(mixc(P.road, P.grass, 0.4)); poly(g, sh.map(p => [p[0], p[1]])); g.fill();
  // asphalt
  const rd = [q(-3.6, zn), q(3.6, zn), q(3.6, zf), q(-3.6, zf)];
  const rg = g.createLinearGradient(0, hy, 0, Math.min(H, rd[0][1]));
  rg.addColorStop(0, rgb(P.fog)); rg.addColorStop(0.12, rgb(mixc(P.road, P.fog, 0.5))); rg.addColorStop(1, rgb(P.road));
  g.fillStyle = rg; poly(g, rd.map(p => [p[0], p[1]])); g.fill();
  // cracks / patches
  g.lineWidth = 2;
  for (const c of WORLD.cracks) {
    const a = q(c.x, c.z), b = q(c.x + Math.cos(c.a) * c.l, c.z + Math.sin(c.a) * c.l); if (!a || !b || a[3] > 120) continue;
    g.strokeStyle = rgb([0, 0, 0], 0.35 * (1 - fogK(E, a[3]))); g.lineWidth = Math.max(1, a[2] * 0.03); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  // edge lines
  for (const ex of [-3.4, 3.4]) {
    const L = [q(ex - 0.08, zn), q(ex + 0.08, zn), q(ex + 0.08, zf), q(ex - 0.08, zf)];
    g.fillStyle = rgb(mixc([170, 172, 168], P.fog, 0.35), 0.7); poly(g, L.map(p => [p[0], p[1]])); g.fill();
  }
  // center dashes
  const d0 = Math.floor(cam.z / 9) * 9;
  for (let z = d0; z < cam.z + 220; z += 9) {
    if (z + 3.5 < zn) continue;
    const a = q(-0.07, Math.max(z, zn)), b = q(0.07, Math.max(z, zn)), c = q(0.07, z + 3.5), d = q(-0.07, z + 3.5);
    const fk = fogK(E, Math.max(z, zn) - cam.z);
    g.fillStyle = rgb(mixc([214, 168, 40], P.fog, fk * 0.9)); poly(g, [a, b, c, d].map(p => [p[0], p[1]])); g.fill();
  }
}

function headlightPool(g, cam, E, carZ, k) {
  if (k <= 0.01) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const z0 = carZ + 4.3 + i * 6, z1 = z0 + 6, w0 = 1.0 + i * 0.75, w1 = w0 + 0.75;
    const a = proj(cam, -w0, 0, z0), b = proj(cam, w0, 0, z0), c = proj(cam, w1, 0, z1), d = proj(cam, -w1, 0, z1);
    if (!a || !c) continue;
    g.fillStyle = rgb([255, 214, 150], 0.075 * k * (1 - i / 6)); poly(g, [a, b, c, d].map(p => [p[0], p[1]])); g.fill();
  }
  g.restore();
}
function headlightBeams(g, cam, E, carZ, k) {   // volumetric cones in the fog
  if (k <= 0.01) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const sx of [-0.62, 0.62]) {
    const o = proj(cam, sx, 0.68, carZ + 4.25); if (!o) continue;
    const far = proj(cam, sx * 4, 0.2, carZ + 45); const farU = proj(cam, sx * 4, 2.4, carZ + 45);
    const gr = g.createLinearGradient(o[0], o[1], far[0], (far[1] + farU[1]) / 2);
    const near = o[3] < 5 ? 0.3 : 1;
    gr.addColorStop(0, rgb([255, 230, 180], 0.22 * k * near)); gr.addColorStop(1, rgb([255, 230, 180], 0));
    g.fillStyle = gr; poly(g, [[o[0], o[1] - 4], [farU[0] - 180, farU[1]], [far[0] + 180, far[1]], [o[0], o[1] + 4]]); g.fill();
    if (o[3] >= 5) glow(g, o[0], o[1], 26 * o[2] / 30 + 30, [255, 240, 200], 0.6 * k);
  }
  g.restore();
}

// ---------- sprites ----------
function drawPine(g, sx, sy, h, w, E, fk, seed, lit) {
  const P = E.P, col = rgb(mixc(P.tree, P.fog, fk)), colL = rgb(mixc(P.treeLit, P.fog, fk));
  const sway = Math.sin(E.t * 0.9 + seed) * 0.012 * h + fbm(E.t * 0.3 + seed) * 0.01 * h;
  g.fillStyle = rgb(mixc([20, 16, 14], P.fog, fk)); g.fillRect(sx - w * 0.05, sy - h * 0.18, w * 0.1, h * 0.18);
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const k0 = i / tiers, yb = sy - h * (0.12 + k0 * 0.8), yt = sy - h * (0.36 + k0 * 0.66), ww = w * (1 - k0 * 0.78) * 0.5;
    const off = sway * (0.3 + k0);
    g.fillStyle = col; g.beginPath(); g.moveTo(sx - ww, yb); g.lineTo(sx - ww * 0.55, yb - h * 0.025); g.lineTo(sx + off, yt); g.lineTo(sx + ww * 0.55, yb - h * 0.03); g.lineTo(sx + ww, yb);
    // jagged bottom edge
    for (let j = 6; j >= 0; j--) g.lineTo(sx - ww + (2 * ww) * j / 6, yb + (j % 2 ? h * 0.018 : 0));
    g.fill();
    if (lit) { g.fillStyle = colL; g.beginPath(); g.moveTo(sx + off, yt); g.lineTo(sx - ww, yb); g.lineTo(sx - ww * 0.45, yb); g.closePath(); g.fill(); }
  }
}
function drawDeadTree(g, sx, sy, h, E, fk, seed) {
  const r = rng(seed * 1000 | 0); g.strokeStyle = rgb(mixc([16, 14, 16], E.P.fog, fk)); g.lineCap = 'round';
  const br = (x, y, a, l, w, d) => {
    const sw = Math.sin(E.t * 0.8 + seed + d) * 0.03 * d;
    const x2 = x + Math.cos(a + sw) * l, y2 = y + Math.sin(a + sw) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if (d < 4) { br(x2, y2, a - 0.4 - r() * 0.4, l * 0.68, w * 0.62, d + 1); br(x2, y2, a + 0.35 + r() * 0.4, l * 0.64, w * 0.6, d + 1); }
  };
  br(sx, sy, -Math.PI / 2 + (r() - 0.5) * 0.2, h * 0.42, h * 0.05, 0);
}

// ---------- foggy layers ----------
function fogBands(g, cam, E, k = 1) {
  const P = E.P, hy = cam.hy;
  for (let i = 0; i < 4; i++) {
    const y = hy + 20 + i * 40, x = ((E.t * (14 + i * 9) + i * 300) % 1600) - 400;
    const gr = g.createRadialGradient(x, y, 0, x, y, 700);
    gr.addColorStop(0, rgb(P.fog, 0.32 * k)); gr.addColorStop(1, rgb(P.fog, 0)); g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1, 0.18); g.translate(-x, -y); g.fillRect(x - 700, y - 700, 1400, 1400); g.restore();
  }
  const gr = g.createLinearGradient(0, hy - 260, 0, hy + 220);
  gr.addColorStop(0, rgb(P.fog, 0)); gr.addColorStop(0.55, rgb(P.fog, 0.42 * k)); gr.addColorStop(1, rgb(P.fog, 0));
  g.fillStyle = gr; g.fillRect(0, hy - 260, W, 480);
}
function groundFog(g, cam, E, z, k = 1) {   // a drifting fog sheet lying on the ground at depth z
  const p = proj(cam, 0, 0.3, z); if (!p) return;
  const P = E.P, wpx = 30 * p[2], hpx = 1.6 * p[2];
  for (let i = 0; i < 3; i++) {
    const x = p[0] + Math.sin(E.t * 0.15 + z + i * 2) * wpx * 0.25 + (i - 1) * wpx * 0.35;
    g.save(); g.translate(x, p[1]); g.scale(1, hpx / wpx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, wpx * 0.5); gr.addColorStop(0, rgb(P.fog, 0.15 * k)); gr.addColorStop(1, rgb(P.fog, 0));
    g.fillStyle = gr; g.fillRect(-wpx / 2, -wpx / 2, wpx, wpx); g.restore();
  }
}
function moonRays(g, cam, E, k = 1) {
  if (E.dawn > 0.5) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  const mx = 190 - cam.x * 2, my = cam.hy - 640;
  for (let i = 0; i < 4; i++) {
    const a = 0.95 + i * 0.16 + Math.sin(E.t * 0.2 + i) * 0.03, len = 2200, wd = 70 + i * 40;
    const x2 = mx + Math.cos(a) * len, y2 = my + Math.sin(a) * len, nx = -Math.sin(a) * wd, ny = Math.cos(a) * wd;
    const gr = g.createLinearGradient(mx, my, x2, y2); const al = (0.045 + 0.02 * Math.sin(E.t * 0.35 + i * 2)) * k * (1 - E.dawn * 2);
    gr.addColorStop(0, rgb([170, 190, 230], al)); gr.addColorStop(1, rgb([170, 190, 230], 0));
    g.fillStyle = gr; poly(g, [[mx, my], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny]]); g.fill();
  }
  if (E.dawn > 0) { /* nothing */ }
  g.restore();
}
function sunRays(g, cam, E) {
  if (E.dawn < 0.05) return;
  g.save(); g.globalCompositeOperation = 'lighter'; const sx = W * 0.68, sy = cam.hy + 10;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(E.t * 0.15 + i) * 0.03, len = 1900, wd = 50 + (i % 3) * 30;
    const x2 = sx + Math.cos(a) * len, y2 = sy + Math.sin(a) * len, nx = -Math.sin(a) * wd, ny = Math.cos(a) * wd;
    const gr = g.createLinearGradient(sx, sy, x2, y2); gr.addColorStop(0, rgb([255, 210, 150], 0.12 * E.dawn)); gr.addColorStop(1, rgb([255, 210, 150], 0));
    g.fillStyle = gr; poly(g, [[sx, sy], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny]]); g.fill();
  }
  g.restore();
}
function motes(g, E, k = 1, seed = 1) {   // slow falling ash/dust + a few tumbling leaves
  const r = rng(seed);
  for (let i = 0; i < 70; i++) {
    const depth = 0.3 + r() * 0.7, x0 = r() * W, y0 = r() * H, sp = 18 + 50 * depth;
    const y = (y0 + E.t * sp) % (H + 40) - 20, x = (x0 + Math.sin(E.t * 0.6 + i) * 30 * depth + E.t * 10 * depth) % W;
    g.fillStyle = rgb(mixc([210, 220, 240], [255, 230, 200], E.dawn), 0.45 * depth * k); g.fillRect(x, y, 2.5 * depth + 1, 2.5 * depth + 1);
  }
  for (let i = 0; i < 4; i++) {
    const per = 9 + i * 2, kk = ((E.t + i * 3.1) % per) / per, x = lerp(-60, W + 60, kk) + Math.sin(kk * 12 + i) * 70, y = lerp(-80, H * 0.9, kk) + i * 120;
    const rot = E.t * 3 + i, sq = Math.sin(E.t * 4 + i);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, Math.max(0.15, Math.abs(sq)));
    g.fillStyle = rgb(mixc([70, 46, 30], [140, 90, 50], E.dawn), 0.85 * k); g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(0, -11, 16, 0); g.quadraticCurveTo(0, 11, -16, 0); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-14, 0); g.lineTo(18, 0); g.stroke(); g.restore();
  }
}
function rain(g, E, k) {
  if (k <= 0) return; const r = rng(11); g.strokeStyle = `rgba(190,205,230,${0.22 * k})`; g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i < 140; i++) { const x0 = r() * (W + 200), y0 = r() * H, sp = 1600 + r() * 600; const y = (y0 + E.t * sp) % (H + 100) - 50, x = (x0 - (y + 50) * 0.12) % (W + 100); g.moveTo(x, y); g.lineTo(x - 7, y + 40); }
  g.stroke();
}

// ---------- the car seen from behind ----------
function drawCarRear(g, sx, sy, s, E, o = {}) {
  const P = E.P, shake = o.shake || 0;
  g.save(); g.translate(sx + shake * Math.sin(E.t * 47) * s * 0.01, sy + shake * Math.sin(E.t * 61) * s * 0.008);
  const X = v => v * s, Y = v => -v * s;
  // shadow
  g.fillStyle = 'rgba(0,0,0,0.45)'; ell(g, 0, 0, X(1.15), X(0.12)); g.fill();
  // tyres
  g.fillStyle = '#0b0c0f'; rr(g, X(-0.92), Y(0.45), X(0.34), X(0.45), X(0.06)); g.fill(); rr(g, X(0.58), Y(0.45), X(0.34), X(0.45), X(0.06)); g.fill();
  // lower body
  const body = mixc([30, 44, 74], P.fog, o.fk || 0);
  g.fillStyle = rgb(body); rr(g, X(-0.95), Y(0.92), X(1.9), X(0.62), X(0.1)); g.fill();
  g.strokeStyle = '#06080d'; g.lineWidth = Math.max(2, X(0.025)); g.stroke();
  // cabin
  poly(g, [[X(-0.82), Y(0.9)], [X(0.82), Y(0.9)], [X(0.62), Y(1.42)], [X(-0.62), Y(1.42)]]); g.fillStyle = rgb(mixc(body, [0, 0, 0], 0.15)); g.fill(); g.stroke();
  // rear glass
  poly(g, [[X(-0.7), Y(0.96)], [X(0.7), Y(0.96)], [X(0.55), Y(1.36)], [X(-0.55), Y(1.36)]]);
  const gl = g.createLinearGradient(0, Y(1.36), 0, Y(0.96)); gl.addColorStop(0, '#20283a'); gl.addColorStop(1, '#0a0d14'); g.fillStyle = gl; g.fill();
  if (o.driver !== false) { // driver head + headrests (seen through glass)
    g.fillStyle = '#05070b'; rr(g, X(0.1), Y(1.26), X(0.28), X(0.22), X(0.06)); g.fill();
    ell(g, X(-0.26), Y(1.2), X(0.12), X(0.14)); g.fill(); rr(g, X(-0.36), Y(1.08), X(0.2), X(0.14), X(0.04)); g.fill();
  }
  g.strokeStyle = 'rgba(160,180,220,0.18)'; g.lineWidth = X(0.02); g.beginPath(); g.moveTo(X(-0.4), Y(1.3)); g.lineTo(X(-0.15), Y(1.0)); g.stroke();
  // highlight on roof edge
  g.strokeStyle = 'rgba(150,170,210,0.35)'; g.lineWidth = X(0.018); g.beginPath(); g.moveTo(X(-0.6), Y(1.41)); g.lineTo(X(0.6), Y(1.41)); g.stroke();
  // boot line + handle
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = X(0.012); g.beginPath(); g.moveTo(X(-0.7), Y(0.72)); g.lineTo(X(0.7), Y(0.72)); g.stroke();
  // taillights
  for (const sd of [-1, 1]) {
    const lx = sd < 0 ? X(-0.9) : X(0.62);
    rr(g, lx, Y(0.84), X(0.28), X(0.15), X(0.03)); g.fillStyle = o.tail > 0.05 ? rgb([255, 40 + 40 * o.tail, 40], 1) : '#4a1214'; g.fill(); g.stroke();
    if (o.tail > 0.05) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lx + X(0.14), Y(0.77), X(0.55), [255, 40, 30], 0.35 * o.tail); g.restore(); }
  }
  // plate
  rr(g, X(-0.24), Y(0.6), X(0.48), X(0.13), X(0.02)); g.fillStyle = '#cfd2c8'; g.fill(); g.strokeStyle = '#111'; g.lineWidth = X(0.01); g.stroke();
  g.fillStyle = '#1a1a1a'; g.font = `900 ${X(0.085)}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NX 731', 0, Y(0.535));
  // bumper
  g.fillStyle = '#0c0f15'; rr(g, X(-0.97), Y(0.42), X(1.94), X(0.14), X(0.05)); g.fill();
  // exhaust
  g.fillStyle = '#2a2a2e'; rr(g, X(-0.62), Y(0.3), X(0.12), X(0.06), X(0.03)); g.fill();
  g.restore();
}
function exhaustPuffs(g, sx, sy, s, E, t0, t1) {   // smoke puffs from the sputtering engine, between t0..t1
  for (let i = 0; i < 9; i++) {
    const birth = t0 + i * (t1 - t0) / 9, age = E.t - birth; if (age < 0 || age > 2.4) continue;
    const k = age / 2.4, x = sx - 0.56 * s - k * 0.9 * s + Math.sin(i) * 0.1 * s, y = sy - 0.27 * s - k * 0.9 * s, r = (0.12 + k * 0.7) * s;
    g.fillStyle = rgb([150, 155, 165], 0.35 * (1 - k)); ell(g, x, y, r, r * 0.8); g.fill();
  }
}

// =====================================================================
// ---------- the village street (The Follower) ----------
// =====================================================================
// streetlights alternate sides every 17 m; head hangs over the road edge
const LAMPS = (() => { const a = []; for (let i = 0; i < 14; i++) { const side = i % 2 ? -1 : 1; a.push({ i, side, x: side * 4.5, z: -20 + i * 17, hx: side * 3.3, hy: 6.0 }); } return a; })();
const HOUSES = (() => {
  const r = rng(41), a = [];
  for (const side of [-1, 1]) { let z = -30 + r() * 6; while (z < 260) { const L = 8 + r() * 5, D = 8 + r() * 3; a.push({ side, x: side * (9.5 + r() * 2.5), z0: z, z1: z + L, D, hw: 4.6 + r() * 1.6, roof: 2.4 + r() * 1.2, col: [hex('#2a2f3c'), hex('#33302e'), hex('#26323a'), hex('#3a3436')][(r() * 4) | 0], seed: r() * 100, lit: r() }); z += L + 4 + r() * 6; } }
  let best = null; for (const h of a) if (h.side > 0 && h.z0 > 80 && (!best || h.z0 < best.z0)) best = h; best.home = true;
  return a;
})();
const HEDGES = (() => { const r = rng(43), a = []; for (const side of [-1, 1]) for (let z = -30; z < 260; z += 1.6 + r() * 0.8) if (r() > 0.25) a.push({ x: side * (6.6 + r() * 0.4), z, h: 0.8 + r() * 0.5, w: 0.9 + r() * 0.5, seed: r() * 10 }); return a; })();
const STREES = (() => { const r = rng(47), a = []; for (let i = 0; i < 70; i++) { const side = r() < 0.5 ? -1 : 1; a.push({ x: side * (14 + r() * 30), z: -20 + r() * 280, h: 8 + r() * 9, w: 0.38 + r() * 0.1, seed: r() * 100, dead: r() < 0.25 }); } return a; })();
function lampLevel(E, L) { return E.lamp ? E.lamp(L) : 1; }

function drawStreetGround(g, cam, E) {
  const P = E.P, hy = cam.hy;
  const gr = g.createLinearGradient(0, hy, 0, H);
  gr.addColorStop(0, rgb(P.fog)); gr.addColorStop(0.08, rgb(mixc(P.grass, P.fog, 0.6))); gr.addColorStop(0.4, rgb(P.grass)); gr.addColorStop(1, rgb(mixc(P.grass, [0, 0, 0], 0.3)));
  g.fillStyle = gr; g.fillRect(0, Math.max(0, hy - 2), W, H);
  const zn = cam.z + 0.3, zf = cam.z + 900, q = (x, z) => proj(cam, x, 0, z);
  const strip = (x0, x1, col) => { const a = q(x0, zn), b = q(x1, zn), c = q(x1, zf), d = q(x0, zf); g.fillStyle = col; poly(g, [a, b, c, d].map(p => [p[0], p[1]])); g.fill(); };
  // sidewalks (paving) + curbs
  const sw = rgb(mixc([46, 48, 54], P.fog, 0.15));
  strip(-6.2, -3.7, sw); strip(3.7, 6.2, sw);
  const rd = [q(-3.7, zn), q(3.7, zn), q(3.7, zf), q(-3.7, zf)];
  const rg = g.createLinearGradient(0, hy, 0, Math.min(H * 2, rd[0][1]));
  rg.addColorStop(0, rgb(P.fog)); rg.addColorStop(0.12, rgb(mixc(P.road, P.fog, 0.5))); rg.addColorStop(1, rgb(P.road));
  g.fillStyle = rg; poly(g, rd.map(p => [p[0], p[1]])); g.fill();
  for (const ex of [-3.7, 3.7]) strip(ex - 0.07, ex + 0.07, rgb(mixc([120, 122, 126], P.fog, 0.3), 0.8));
  // paving joints on the sidewalks
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  for (let z = Math.floor(cam.z); z < cam.z + 60; z += 1.2) { if (z < zn) continue; for (const sd of [-1, 1]) { const a = q(sd * 3.75, z), b = q(sd * 6.2, z); if (!a || !b) continue; g.lineWidth = Math.max(1, a[2] * 0.012); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
  // cracks + puddles on the asphalt
  for (const c of WORLD.cracks) {
    const a = q(c.x, c.z), b = q(c.x + Math.cos(c.a) * c.l, c.z + Math.sin(c.a) * c.l); if (!a || !b || a[3] > 120 || a[3] < 4 || b[3] < 4) continue;
    g.strokeStyle = rgb([0, 0, 0], 0.35 * (1 - fogK(E, a[3]))); g.lineWidth = Math.max(1, Math.min(4, a[2] * 0.03)); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  const r = rng(77);
  for (let i = 0; i < 26; i++) { const x = -3 + r() * 6, z = r() * 220, rx = 0.5 + r() * 1.2; const p = q(x, z); if (!p || p[3] < 0.5) continue; g.fillStyle = rgb([70, 82, 110], 0.18 * (1 - fogK(E, p[3]))); ell(g, p[0], p[1], rx * p[2], rx * p[2] * 0.12 * Math.max(0.3, (p[1] - hy) / p[2] * 0.6)); g.fill(); }
  // center dashes
  const d0 = Math.floor(cam.z / 9) * 9;
  for (let z = d0; z < cam.z + 220; z += 9) {
    if (z + 3.5 < zn) continue;
    const a = q(-0.07, Math.max(z, zn)), b = q(0.07, Math.max(z, zn)), c = q(0.07, z + 3.5), d = q(-0.07, z + 3.5);
    g.fillStyle = rgb(mixc([196, 196, 186], P.fog, fogK(E, Math.max(z, zn) - cam.z) * 0.9), 0.75); poly(g, [a, b, c, d].map(p => [p[0], p[1]])); g.fill();
  }
}
// warm sodium pools on the ground (additive)
function lampPools(g, cam, E) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const L of LAMPS) {
    const k = lampLevel(E, L); if (k < 0.01) continue; const p = proj(cam, L.hx, 0, L.z); if (!p || p[3] > 140) continue;
    const fk = fogK(E, p[3]), rx = 7.5 * p[2], ry = Math.max(6, (proj(cam, L.hx, 0, L.z - 7) ? Math.abs(proj(cam, L.hx, 0, L.z - 7)[1] - p[1]) : rx * 0.3));
    g.save(); g.translate(p[0], p[1]); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgb([255, 176, 92], 0.42 * k * (1 - fk * 0.7))); gr.addColorStop(0.45, rgb([255, 150, 70], 0.16 * k * (1 - fk * 0.7))); gr.addColorStop(1, rgb([255, 140, 60], 0));
    g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore();
  }
  g.restore();
}
function drawLamp(g, cam, E, L) {
  const b = proj(cam, L.x, 0, L.z), tp = proj(cam, L.x, L.hy + 0.25, L.z), hd = proj(cam, L.hx, L.hy, L.z); if (!b || !tp || !hd) return;
  const fk = fogK(E, b[3]), k = lampLevel(E, L), s = b[2];
  const col = rgb(mixc([18, 20, 26], E.P.fog, fk * 0.9));
  g.strokeStyle = col; g.lineCap = 'butt'; g.lineWidth = Math.max(1.5, 0.16 * s); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(tp[0], tp[1]); g.stroke();
  g.lineWidth = Math.max(1.5, 0.26 * s); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[0], b[1] - 0.6 * s); g.stroke();   // base
  g.lineWidth = Math.max(1, 0.09 * s); g.beginPath(); g.moveTo(tp[0], tp[1]); g.quadraticCurveTo(lerp(tp[0], hd[0], 0.5), tp[1] - 0.25 * s, hd[0], hd[1] - 0.05 * s); g.stroke();
  // lamp head (cobra style)
  g.fillStyle = col; ell(g, hd[0], hd[1], 0.42 * s, 0.13 * s); g.fill();
  g.fillStyle = k > 0.02 ? rgb(mixc([60, 40, 20], [255, 214, 150], k)) : '#2a2a2c'; ell(g, hd[0], hd[1] + 0.07 * s, 0.32 * s, 0.07 * s); g.fill();
  const near = ss(4, 14, b[3]);
  if (k > 0.01) {
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, hd[0], hd[1] + 0.1 * s, Math.max(30, Math.min(700, 1.6 * s)), [255, 190, 110], 0.55 * k * (1 - fk * 0.6) * (0.25 + 0.75 * near));
    glow(g, hd[0], hd[1] + 0.1 * s, Math.max(10, 0.5 * s), [255, 236, 200], 0.8 * k);
    // soft light cone in the haze
    const g0 = proj(cam, L.hx, 0, L.z); const cw = 3.6 * s;
    const cg = g.createLinearGradient(0, hd[1], 0, g0[1]); cg.addColorStop(0, rgb([255, 190, 120], 0.13 * k * (1 - fk * 0.5) * near)); cg.addColorStop(1, rgb([255, 170, 90], 0.0));
    g.fillStyle = cg; poly(g, [[hd[0] - 0.25 * s, hd[1]], [hd[0] + 0.25 * s, hd[1]], [g0[0] + cw, g0[1]], [g0[0] - cw, g0[1]]]); g.fill();
    g.restore();
  }
}
function drawHouse(g, cam, E, h) {
  const sd = h.side, xf = h.x, xb = h.x + sd * h.D, P = E.P;
  const zEnd = cam.z < h.z0 ? h.z0 : (cam.z > h.z1 ? h.z1 : null);
  const q = (x, y, z) => proj(cam, x, y, Math.max(z, cam.z + 0.3));
  const c0 = q(xf, 0, h.z0), c1 = q(xf, 0, h.z1); if (!c0 || !c1) return;
  const cs = Math.min(c0[2], 220), fk = fogK(E, Math.max(c0[3], 2)), wall = mixc(h.col, P.fog, fk), endW = mixc(mixc(h.col, [0, 0, 0], 0.35), P.fog, fk), roofC = mixc([14, 15, 20], P.fog, fk);
  const pts = (arr) => arr.map(v => q(v[0], v[1], v[2])).map(p => [p[0], p[1]]);
  // gable end facing the camera
  if (zEnd != null) {
    const xm = (xf + xb) / 2;
    g.fillStyle = rgb(endW); poly(g, pts([[xf, 0, zEnd], [xb, 0, zEnd], [xb, h.hw, zEnd], [xm, h.hw + h.roof, zEnd], [xf, h.hw, zEnd]])); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.stroke();
    // small attic window
    const aw = pts([[xm - sd * 0.5, h.hw + 0.4, zEnd], [xm + sd * 0.5, h.hw + 0.4, zEnd], [xm + sd * 0.5, h.hw + 1.2, zEnd], [xm - sd * 0.5, h.hw + 1.2, zEnd]]);
    g.fillStyle = rgb(mixc([10, 12, 18], P.fog, fk)); poly(g, aw); g.fill();
  }
  // facade facing the street
  g.fillStyle = rgb(wall); poly(g, pts([[xf, 0, h.z0], [xf, 0, h.z1], [xf, h.hw, h.z1], [xf, h.hw, h.z0]])); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = Math.max(1, cs * 0.02); g.stroke();
  // siding lines
  g.strokeStyle = rgb([0, 0, 0], 0.18 * (1 - fk)); g.lineWidth = 1;
  for (let y = 0.5; y < h.hw; y += 0.5) { const a = q(xf, y, h.z0), b = q(xf, y, h.z1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  // roof slope
  const xr = (xf + xb) / 2;
  g.fillStyle = rgb(roofC); poly(g, pts([[xf - sd * 0.4, h.hw - 0.2, h.z0 - 0.3], [xf - sd * 0.4, h.hw - 0.2, h.z1 + 0.3], [xr, h.hw + h.roof, h.z1 + 0.3], [xr, h.hw + h.roof, h.z0 - 0.3]])); g.fill();
  g.strokeStyle = rgb(mixc([60, 70, 90], P.fog, fk), 0.6); g.lineWidth = Math.max(1, cs * 0.03); const e0 = q(xf - sd * 0.4, h.hw - 0.2, h.z0 - 0.3), e1 = q(xf - sd * 0.4, h.hw - 0.2, h.z1 + 0.3); g.beginPath(); g.moveTo(e0[0], e0[1]); g.lineTo(e1[0], e1[1]); g.stroke();
  // chimney
  const cz = lerp(h.z0, h.z1, 0.7), cx = lerp(xf, xr, 0.6);
  g.fillStyle = rgb(mixc([30, 26, 26], P.fog, fk)); poly(g, pts([[cx, h.hw + h.roof * 0.5, cz], [cx, h.hw + h.roof * 0.5, cz + 0.8], [cx, h.hw + h.roof + 0.9, cz + 0.8], [cx, h.hw + h.roof + 0.9, cz]])); g.fill();
  // windows + door
  const r = rng(h.seed * 1000 | 0), n = Math.max(2, Math.floor((h.z1 - h.z0) / 2.6));
  for (let i = 0; i < n; i++) {
    const zc = lerp(h.z0, h.z1, (i + 0.5) / n), door = h.home ? i === 0 : (i === 1 && n > 2);
    for (const fl of door ? [0] : [0, 1]) {
      const y0 = fl ? 2.9 : (door ? 0 : 0.9), y1 = fl ? 4.1 : (door ? 2.2 : 2.2), wz = door ? 0.55 : 0.6;
      if (fl && y1 > h.hw - 0.2) continue;
      const lit = (r() < 0.18 + h.lit * 0.2 && !door) || (h.home && door);
      const wp = pts([[xf, y0, zc - wz], [xf, y0, zc + wz], [xf, y1, zc + wz], [xf, y1, zc - wz]]);
      if (lit) {
        g.fillStyle = rgb(mixc([255, 196, 120], P.fog, fk * 0.7)); poly(g, wp); g.fill();
        g.save(); g.globalCompositeOperation = 'lighter'; const m = [(wp[0][0] + wp[2][0]) / 2, (wp[0][1] + wp[2][1]) / 2]; const wpx = Math.hypot(wp[2][0] - wp[0][0], wp[2][1] - wp[0][1]); glow(g, m[0], m[1], Math.min(400, Math.max(20, wpx * 1.6)), [255, 170, 90], 0.25 * (1 - fk)); g.restore();
        // curtain + mullion
        g.fillStyle = rgb(mixc([120, 60, 40], P.fog, fk), 0.6); poly(g, [wp[0], [lerp(wp[0][0], wp[1][0], 0.3), lerp(wp[0][1], wp[1][1], 0.3)], [lerp(wp[3][0], wp[2][0], 0.25), lerp(wp[3][1], wp[2][1], 0.25)], wp[3]]); g.fill();
        if (h.home && door) { g.save(); g.globalCompositeOperation = 'lighter'; const lp = q(xf - sd * 0.15, 2.6, zc - 0.9); glow(g, lp[0], lp[1], Math.min(500, Math.max(30, lp[2] * 2.2)), [255, 190, 110], 0.55 * (1 - fk * 0.5)); glow(g, lp[0], lp[1], Math.max(8, cs * 0.25), [255, 240, 210], 0.9); g.restore(); }
      } else { g.fillStyle = rgb(mixc(door ? [20, 14, 12] : [8, 10, 16], P.fog, fk)); poly(g, wp); g.fill(); }
      g.strokeStyle = rgb(mixc([170, 170, 165], P.fog, fk), 0.55); g.lineWidth = Math.max(1, cs * 0.03); poly(g, wp); g.stroke();
      if (!door) { const a = [(wp[0][0] + wp[1][0]) / 2, (wp[0][1] + wp[1][1]) / 2], b = [(wp[3][0] + wp[2][0]) / 2, (wp[3][1] + wp[2][1]) / 2]; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    }
  }
}
function drawHedge(g, cam, E, h) {
  const p = proj(cam, h.x, 0, h.z); if (!p || p[3] < 0.4) return; const fk = fogK(E, p[3]);
  const col = mixc([12, 22, 18], E.P.fog, fk), hi = mixc([26, 42, 34], E.P.fog, fk), s = p[2];
  const sw = Math.sin(E.t * 1.1 + h.seed) * 0.03 * s;
  g.fillStyle = rgb(col);
  for (let k = 0; k < 4; k++) { ell(g, p[0] + (k - 1.5) * h.w * 0.32 * s + sw, p[1] - h.h * s * (0.45 + (k % 2) * 0.12), h.w * 0.36 * s, h.h * 0.55 * s); g.fill(); }
  g.fillStyle = rgb(hi, 0.7); ell(g, p[0] - h.w * 0.15 * s + sw, p[1] - h.h * s * 0.85, h.w * 0.22 * s, h.h * 0.18 * s); g.fill();
}
// the whole street; extras: [{z, draw(g,cam,E)}]
function streetScene(g, cam, E, extras = [], o = {}) {
  drawSky(g, cam, E); drawBats(g, cam, E); fogBands(g, cam, E, 0.6);
  drawStreetGround(g, cam, E); lampPools(g, cam, E);
  if (o.under) o.under(g, cam, E);
  const sp = [];
  for (const tr of STREES) { const dz = tr.z - cam.z; if (dz < 0.5 || dz > 230) continue; sp.push({ z: tr.z, draw: () => { const p = proj(cam, tr.x, 0, tr.z); if (!p || p[0] < -p[2] * 8 || p[0] > W + p[2] * 8) return; if (tr.dead) drawDeadTree(g, p[0], p[1], tr.h * p[2], E, fogK(E, dz), tr.seed); else drawPine(g, p[0], p[1], tr.h * p[2], tr.h * tr.w * 2.1 * p[2], E, fogK(E, dz), tr.seed, tr.x < 0); } }); }
  for (const h of HOUSES) { if (h.z1 < cam.z + 0.5 || h.z0 - cam.z > 200) continue; sp.push({ z: Math.max(h.z0, cam.z + 1) + 0.5, draw: () => drawHouse(g, cam, E, h) }); }
  for (const h of HEDGES) { const dz = h.z - cam.z; if (dz < 0.5 || dz > 120) continue; sp.push({ z: h.z, draw: () => drawHedge(g, cam, E, h) }); }
  for (const L of LAMPS) { const dz = L.z - cam.z; if (dz < 0.4 || dz > 200) continue; sp.push({ z: L.z, draw: () => drawLamp(g, cam, E, L) }); }
  for (let z = Math.ceil(cam.z / 7) * 7; z < cam.z + 120; z += 7) sp.push({ z: z + 0.01, draw: () => groundFog(g, cam, E, z, 0.8) });
  for (const x of extras) sp.push(x);
  sp.sort((a, b) => b.z - a.z).forEach(s => s.draw(g, cam, E));
  moonRays(g, cam, E, 0.8);
  if (E.motes) motes(g, E, E.motes); rain(g, E, E.rain);
}
// light of the nearest lamps at a world point (0..1), for lighting characters
function lampLight(E, x, z) { let k = 0; for (const L of LAMPS) { const d = Math.hypot(x - L.hx, z - L.z); k = Math.max(k, lampLevel(E, L) * clamp(1 - d / 9)); } return k; }

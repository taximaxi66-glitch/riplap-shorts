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

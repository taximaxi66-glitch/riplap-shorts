// =====================================================================
// THE CALLER: the front hall at 3 a.m. (2.5D perspective set, Part 3 comic look)
// world: x right, y up, z toward the front door. Door wall z = 6, floor y = 0, high foyer ceiling y = 5
// the stairs climb along the left wall toward the camera onto a landing gallery (y 2.66, z < 0.83)
// =====================================================================
const HL = { x0: -1.4, x1: 1.4, back: 6.0, front: -2.6, ceil: 5.0, land: 2.66, landZ: 0.83 };
const KC = { ink: '#0b0c12', wall: '#232a3c', wallS: '#1a2030', wain: '#1b2131', ceil: '#0e121b', board: '#2b2220', boardB: '#251d1b', door: '#3a2420', doorS: '#2a1916',
  step: '#2c2a36', stepT: '#4a4558', carpet: '#4a1f24', carpetT: '#5e2a2e', brass: '#b89a5a', warm: [255, 190, 120], moon: [140, 170, 230] };
const FD = { x0: -0.45, x1: 0.45, h: 2.05 }, SIDE = { x0: 0.62, x1: 0.95, y0: 0.35, y1: 2.05 }, FAN = { x0: -0.45, x1: 0.45, y0: 2.14, y1: 2.42 };
const PEEP = [0, 1.55, 5.955], SLOT = { x0: -0.17, x1: 0.17, y0: 0.86, y1: 0.94 };
const STEP = { x0: -1.4, x1: -0.45, z0: 4.75, d: 0.28, h: 0.19, n: 14 };
const CHIME = [1.395, 2.2, 5.15];
function hallEnv(t, extra = {}) { return Object.assign({ t, dawn: 0, fogDist: 90, P: { fog: [16, 20, 32] }, porch: 1, moon: 1, rainOut: 0 }, extra); }

// ---------- frosted glass lit by the porch lantern outside ----------
function frosted(g, cam, E, x0, x1, y0, y1, z, o = {}) {
  const sp = projPoly(cam, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]); if (sp.length < 3) return null;
  g.save(); g.beginPath(); polyPath(g, sp); g.clip();
  const xs = sp.map(p => p[0]), ys = sp.map(p => p[1]), bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys), bw = bx1 - bx0, bh = by1 - by0;
  const k = E.porch;
  g.fillStyle = rgb(mixc([30, 28, 34], [150, 110, 70], k)); g.fillRect(bx0, by0, bw, bh);
  // the lantern: a soft hot spot near the right edge, upper half
  const lx = bx0 + bw * (o.lx == null ? 0.85 : o.lx), ly = by0 + bh * (o.ly == null ? 0.25 : o.ly);
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, lx, ly, Math.max(bw, bh) * 0.9, [255, 170, 90], 0.55 * k); glow(g, lx, ly, Math.max(bw, bh) * 0.35, [255, 225, 170], 0.5 * k);
  g.restore();
  // slow fog drifting past outside, blurred
  for (let i = 0; i < 4; i++) { const fx = bx0 + ((E.t * 18 * (1 + i * 0.3) + i * 97) % (bw + 200)) - 100, fy = by0 + bh * (0.2 + i * 0.2); g.fillStyle = `rgba(200,170,140,${0.07 * k})`; ell(g, fx, fy, bw * 0.6, bh * 0.08); g.fill(); }
  // moths circling the lantern: soft dark blots on the glass
  for (let i = 0; i < 3; i++) { const a = E.t * (2.2 + i * 0.7) + i * 2, rr_ = bw * (0.2 + i * 0.08); const mx = lx + Math.cos(a) * rr_ - bw * 0.15, my = ly + Math.sin(a * 1.3) * rr_ * 0.8; g.fillStyle = `rgba(40,26,18,${0.35 * k})`; ell(g, mx, my, Math.max(2, bw * 0.03), Math.max(2, bw * 0.022)); g.fill(); }
  if (o.shadow) o.shadow(g, sp, { bx0, by0, bw, bh });
  // frost texture: fine stipple + vertical reeds
  const r = rng(o.seed || 31); g.fillStyle = 'rgba(255,240,220,0.06)';
  for (let i = 0; i < 160; i++) { g.fillRect(bx0 + r() * bw, by0 + r() * bh, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = Math.max(1, bw * 0.01); for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(bx0 + bw * i / 6, by0); g.lineTo(bx0 + bw * i / 6, by1); g.stroke(); }
  g.restore();
  g.strokeStyle = KC.ink; g.lineWidth = lwAt(cam, sp); g.beginPath(); polyPath(g, sp); g.stroke();
  return sp;
}
// ---------- the high arched window above the door: night sky, a swaying tree ----------
function highWindow(g, cam, E) {
  const z = HL.back, pts = [];
  pts.push([-0.55, 3.0, z], [0.55, 3.0, z]); for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; pts.push([Math.cos(a) * 0.55, 3.95 + Math.sin(a) * 0.45, z]); }
  const sp = projPoly(cam, pts); if (sp.length < 3) return;
  outsideNight(g, cam, E, sp);
  const fw = 0.05; line3(g, cam, [0, 3.0, z - 0.02], [0, 4.4, z - 0.02], '#2c3446', null); line3(g, cam, [-0.55, 3.75, z - 0.02], [0.55, 3.75, z - 0.02], '#2c3446', null);
  g.strokeStyle = '#2c3446'; g.lineWidth = lwAt(cam, sp) * 3; g.beginPath(); polyPath(g, sp); g.stroke();
  g.strokeStyle = KC.ink; g.lineWidth = lwAt(cam, sp); g.beginPath(); polyPath(g, sp); g.stroke();
}
// ---------- the front door, seen from inside ----------
function drawFrontDoor(g, cam, E, o = {}) {
  const z = HL.back, dz = z - 0.03;
  // casing
  fillQ(g, cam, [[FD.x0 - 0.1, 0, z - 0.01], [SIDE.x1 + 0.1, 0, z - 0.01], [SIDE.x1 + 0.1, FAN.y1 + 0.1, z - 0.01], [FD.x0 - 0.1, FAN.y1 + 0.1, z - 0.01]], '#2f2a2e');
  frosted(g, cam, E, SIDE.x0, SIDE.x1, SIDE.y0, SIDE.y1, z - 0.02, { lx: 0.95, ly: 0.12, shadow: o.sideShadow, seed: 7 });
  fillQ(g, cam, [[SIDE.x0, 0.02, z - 0.02], [SIDE.x1, 0.02, z - 0.02], [SIDE.x1, SIDE.y0, z - 0.02], [SIDE.x0, SIDE.y0, z - 0.02]], '#2a2328');
  frosted(g, cam, E, FAN.x0, FAN.x1, FAN.y0, FAN.y1, z - 0.02, { lx: 1.1, ly: 0.5, seed: 9 });
  for (const x of [-0.15, 0.15]) line3(g, cam, [x, FAN.y0, z - 0.025], [x, FAN.y1, z - 0.025], '#2f2a2e', null);
  // the door slab + raised panels
  fillQ(g, cam, [[FD.x0, 0.01, dz], [FD.x1, 0.01, dz], [FD.x1, FD.h, dz], [FD.x0, FD.h, dz]], KC.door);
  for (const [a, b, c, d] of [[-0.36, -0.04, 1.15, 1.95], [0.04, 0.36, 1.15, 1.95], [-0.36, -0.04, 0.12, 0.78], [0.04, 0.36, 0.12, 0.78]]) {
    fillQ(g, cam, [[a, c, dz - 0.005], [b, c, dz - 0.005], [b, d, dz - 0.005], [a, d, dz - 0.005]], KC.doorS, 'rgba(8,4,4,0.85)');
    line3(g, cam, [a + 0.02, d - 0.02, dz - 0.006], [b - 0.02, d - 0.02, dz - 0.006], 'rgba(120,70,55,0.35)', null);
  }
  // letterbox: brass frame, inner flap hinged at the top (swings inward when pushed)
  const op = o.slot || 0;
  fillQ(g, cam, [[SLOT.x0 - 0.03, SLOT.y0 - 0.03, dz - 0.008], [SLOT.x1 + 0.03, SLOT.y0 - 0.03, dz - 0.008], [SLOT.x1 + 0.03, SLOT.y1 + 0.03, dz - 0.008], [SLOT.x0 - 0.03, SLOT.y1 + 0.03, dz - 0.008]], '#8a7344');
  const hole = fillQ(g, cam, [[SLOT.x0, SLOT.y0, dz - 0.009], [SLOT.x1, SLOT.y0, dz - 0.009], [SLOT.x1, SLOT.y1, dz - 0.009], [SLOT.x0, SLOT.y1, dz - 0.009]], op > 0.02 ? '#120c0a' : '#5c4a2c');
  if (op > 0.02 && hole) { g.save(); g.beginPath(); polyPath(g, hole); g.clip(); const c = proj(cam, 0, SLOT.y0 + 0.02, dz); if (c) { g.globalCompositeOperation = 'lighter'; glow(g, c[0], c[1], 0.25 * c[2], [255, 170, 90], 0.35 * op * E.porch); } g.restore(); }
  if (o.slotInside) o.slotInside(g, cam, E);
  const fa = op * 72 * D2R, fl = SLOT.y1 - SLOT.y0 + 0.01;
  fillQ(g, cam, [[SLOT.x0 - 0.005, SLOT.y1 + 0.005, dz - 0.012], [SLOT.x1 + 0.005, SLOT.y1 + 0.005, dz - 0.012], [SLOT.x1 + 0.005, SLOT.y1 + 0.005 - Math.cos(fa) * fl, dz - 0.012 - Math.sin(fa) * fl], [SLOT.x0 - 0.005, SLOT.y1 + 0.005 - Math.cos(fa) * fl, dz - 0.012 - Math.sin(fa) * fl]], rgb(mixc([196, 168, 104], [120, 100, 60], op)));
  // peephole: brass ring with a tiny warm dot of light in the lens
  disc3(g, cam, [PEEP[0], PEEP[1], dz - 0.008], [1, 0, 0], [0, 1, 0], 0.03, '#9c8248'); disc3(g, cam, [PEEP[0], PEEP[1], dz - 0.01], [1, 0, 0], [0, 1, 0], 0.016, '#120f0c');
  const pp = proj(cam, PEEP[0], PEEP[1], dz - 0.011); if (pp && !o.noPeepGlint) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, pp[0], pp[1], 0.04 * pp[2], [255, 190, 120], 0.6 * E.porch * (o.peepLight == null ? 1 : o.peepLight)); g.restore(); }
  // knob, deadbolt, chain
  const kc = [FD.x1 - 0.08, 1.0, dz - 0.03]; disc3(g, cam, [kc[0], kc[1], dz - 0.008], [1, 0, 0], [0, 1, 0], 0.045, '#5a4a30'); disc3(g, cam, kc, [1, 0, 0], [0, 1, 0], 0.033, KC.brass);
  disc3(g, cam, [FD.x1 - 0.08, 1.22, dz - 0.012], [1, 0, 0], [0, 1, 0], 0.028, '#8a7344');
  box3(g, cam, FD.x1 - 0.11, FD.x1 - 0.05, 1.3, 1.36, dz - 0.03, dz - 0.005, { front: '#8a7344' });
  { const a = [FD.x1 - 0.08, 1.33, dz - 0.03], sw = Math.sin(E.t * 1.3) * 0.01; let prev = proj(cam, ...a); for (let i = 1; i <= 7; i++) { const k = i / 7, q = proj(cam, lerp(a[0], FD.x1 + 0.12, k) + sw * Math.sin(k * Math.PI), a[1] - Math.sin(k * Math.PI) * 0.09, dz - 0.03); if (prev && q) { g.strokeStyle = '#a08a58'; g.lineWidth = Math.max(1.5, 0.012 * q[2]); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke(); } prev = q; } }
  box3(g, cam, FD.x1 + 0.08, FD.x1 + 0.16, 1.3, 1.36, z - 0.03, z - 0.005, { front: '#8a7344' });
  // threshold strip
  box3(g, cam, FD.x0, FD.x1, 0, 0.025, z - 0.08, z - 0.01, { front: '#6a5a3a', top: '#8a7344' });
  // the thin line of porch light under the door
  fillQ(g, cam, [[FD.x0 + 0.02, 0.026, dz + 0.001], [FD.x1 - 0.02, 0.026, dz + 0.001], [FD.x1 - 0.02, 0.034, dz + 0.001], [FD.x0 + 0.02, 0.034, dz + 0.001]], rgb(mixc([40, 30, 25], [255, 196, 130], E.porch)), null);
  if (o.gapShadow) o.gapShadow(g, cam, E);
}
// ---------- the doorbell chime box on the right wall: two bars, a hammer that strikes ----------
function drawChime(g, cam, E, hit = 0, shake = 0) {
  const [x, y, z] = CHIME, j = shake * Math.sin(E.t * 70) * 0.003;
  // wooden back plate
  box3(g, cam, x - 0.025, x, y - 0.17, y + 0.17, z - 0.24, z + 0.24, { front: '#5a3e2c', side: '#4a3222', top: '#6a4a34', bottom: '#3a2618' });
  fillQ(g, cam, [[x - 0.026, y - 0.14, z - 0.21], [x - 0.026, y - 0.14, z + 0.21], [x - 0.026, y + 0.14, z + 0.21], [x - 0.026, y + 0.14, z - 0.21]], '#4a3222', 'rgba(20,12,8,0.7)');
  // two brass tone bars on little posts (they shiver after a strike)
  for (const [yy, ph] of [[y + 0.065, 0], [y - 0.065, 1.3]]) { const v = j * (1 + ph);
    for (const zz of [z - 0.17, z + 0.17]) box3(g, cam, x - 0.06, x - 0.026, yy - 0.012, yy + 0.012, zz - 0.012, zz + 0.012, { front: '#2a1e14', side: '#2a1e14', top: '#3a2a1c' });
    box3(g, cam, x - 0.085, x - 0.06, yy - 0.022 + v, yy + 0.022 + v, z - 0.22, z + 0.22, { front: '#c9a65a', top: '#e6c87a', bottom: '#8a6e34', side: '#a8883e' });
    line3(g, cam, [x - 0.086, yy + 0.012 + v, z - 0.2], [x - 0.086, yy + 0.012 + v, z + 0.2], 'rgba(255,240,200,0.55)', null); }
  // the plunger: a black cylinder in a coil, it shoots up into the top bar and drops onto the low one
  const py = y + (hit > 0 ? hit * 0.06 : 0);
  box3(g, cam, x - 0.07, x - 0.03, y - 0.04, y + 0.04, z - 0.03, z + 0.03, { front: '#7a5a3a', side: '#6a4a2a', top: '#8a6a4a' });
  for (let k = 0; k < 6; k++) line3(g, cam, [x - 0.072, y - 0.035 + k * 0.014, z - 0.03], [x - 0.072, y - 0.035 + k * 0.014, z + 0.03], '#b07a3a', null);
  box3(g, cam, x - 0.064, x - 0.04, py - 0.05, py + 0.05, z - 0.012, z + 0.012, { front: '#1a1a1e', side: '#141418', top: '#2a2a30' });
  const wire = [[x - 0.005, y + 0.17, z + 0.15], [x - 0.005, y + 0.45, z + 0.17], [x - 0.005, HL.ceil, z + 0.2]]; const P = wire.map(p => proj(cam, ...p)); if (P.every(Boolean)) { g.strokeStyle = '#151820'; g.lineWidth = Math.max(1, 0.006 * P[0][2]); g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.lineTo(P[1][0], P[1][1]); g.lineTo(P[2][0], P[2][1]); g.stroke(); }
  if (hit > 0.3) { const c = proj(cam, x - 0.08, y + 0.065, z); if (c) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, c[0], c[1], 0.45 * c[2], [255, 220, 150], 0.4 * hit); g.restore(); } }
}
// ---------- room shell: walls, floorboards, wainscot, ceiling ----------
function hallShell(g, cam, E, o = {}) {
  const { x0, x1, back, front, ceil } = HL;
  fillQ(g, cam, [[x0, ceil, front], [x1, ceil, front], [x1, ceil, back], [x0, ceil, back]], KC.ceil);
  fillQ(g, cam, [[x0, 0, back], [x1, 0, back], [x1, ceil, back], [x0, ceil, back]], KC.wall);
  fillQ(g, cam, [[x0, 0, front], [x0, 0, back], [x0, ceil, back], [x0, ceil, front]], KC.wallS);
  fillQ(g, cam, [[x1, 0, front], [x1, 0, back], [x1, ceil, back], [x1, ceil, front]], KC.wallS);
  // wallpaper stripes
  for (let x = x0 + 0.2; x < x1; x += 0.2) line3(g, cam, [x, 0.95, back - 0.001], [x, ceil, back - 0.001], 'rgba(8,10,20,0.28)');
  for (let z = front + 0.2; z < back; z += 0.2) line3(g, cam, [x1 - 0.001, 0.95, z], [x1 - 0.001, ceil, z], 'rgba(8,10,20,0.25)');
  // wainscot panels (right + back wall)
  fillQ(g, cam, [[x1 - 0.002, 0, front], [x1 - 0.002, 0, back], [x1 - 0.002, 0.95, back], [x1 - 0.002, 0.95, front]], KC.wain);
  for (let z = front + 0.1; z < back - 0.4; z += 0.62) fillQ(g, cam, [[x1 - 0.004, 0.18, z], [x1 - 0.004, 0.18, z + 0.5], [x1 - 0.004, 0.8, z + 0.5], [x1 - 0.004, 0.8, z]], '#182033', 'rgba(5,6,10,0.7)');
  fillQ(g, cam, [[FD.x0 - 0.1 > x0 ? x0 : x0, 0, back - 0.002], [x1, 0, back - 0.002], [x1, 0.95, back - 0.002], [x0, 0.95, back - 0.002]], KC.wain);
  line3(g, cam, [x1 - 0.003, 0.95, front], [x1 - 0.003, 0.95, back], '#2e3650', 4); line3(g, cam, [x0, 0.95, back - 0.003], [x1, 0.95, back - 0.003], '#2e3650', 4);
  // floorboards running toward the door
  fillQ(g, cam, [[x0, 0, front], [x1, 0, front], [x1, 0, back], [x0, 0, back]], KC.board);
  for (let x = x0 + 0.18; x < x1; x += 0.18) line3(g, cam, [x, 0.001, front], [x, 0.001, back], 'rgba(10,6,6,0.55)');
  const r = rng(17); for (let x = x0; x < x1; x += 0.18) { let z = front + r() * 1.2; while (z < back) { line3(g, cam, [x, 0.001, z], [x + 0.18, 0.001, z], 'rgba(10,6,6,0.5)'); z += 1.2 + r() * 1.0; } }
  // crown moulding + skirting
  line3(g, cam, [x0, ceil - 0.05, back - 0.002], [x1, ceil - 0.05, back - 0.002], '#0a0d14', 4);
  line3(g, cam, [x1 - 0.002, 0.08, front], [x1 - 0.002, 0.08, back], '#0f131d', 4);
  highWindow(g, cam, E);
  drawFrontDoor(g, cam, E, o.door || {});
  // right wall: framed pictures, light switch, the chime box
  for (const [za, zb, ya, yb, c] of [[2.1, 2.6, 1.35, 1.85, '#5a6476'], [2.8, 3.1, 1.45, 1.8, '#6a5a50'], [0.6, 1.3, 1.4, 1.9, '#4c5a68']]) {
    fillQ(g, cam, [[x1 - 0.01, ya, za], [x1 - 0.01, ya, zb], [x1 - 0.01, yb, zb], [x1 - 0.01, yb, za]], '#3a2c22');
    fillQ(g, cam, [[x1 - 0.015, ya + 0.05, za + 0.05], [x1 - 0.015, ya + 0.05, zb - 0.05], [x1 - 0.015, yb - 0.05, zb - 0.05], [x1 - 0.015, yb - 0.05, za + 0.05]], c, null);
  }
  fillQ(g, cam, [[x1 - 0.01, 1.15, 5.55], [x1 - 0.01, 1.15, 5.65], [x1 - 0.01, 1.28, 5.65], [x1 - 0.01, 1.28, 5.55]], '#b0aa9c');
  drawChime(g, cam, E, o.chimeHit || 0, o.chimeShake || 0);
}
// ---------- stairs along the left wall, banister, the landing gallery ----------
function drawStairs(g, cam, E, o = {}) {
  const { x0, x1, z0, d, h, n } = STEP;
  // steps from the top down (far first when looking from the hall)
  const order = []; for (let i = 0; i < n; i++) order.push(i);
  order.sort((a, b) => camSpace(cam, x0, 0, z0 - (b + 0.5) * d)[2] - camSpace(cam, x0, 0, z0 - (a + 0.5) * d)[2]);
  for (const i of order) {
    const za = z0 - (i + 1) * d, zb = z0 - i * d, y = (i + 1) * h;
    if (cam.y > y) { fillQ(g, cam, [[x0, y, za], [x1, y, za], [x1, y, zb], [x0, y, zb]], KC.stepT); fillQ(g, cam, [[x0 + 0.2, y + 0.002, za], [x1 - 0.15, y + 0.002, za], [x1 - 0.15, y + 0.002, zb], [x0 + 0.2, y + 0.002, zb]], KC.carpetT, 'rgba(10,4,6,0.6)'); }
    if (cam.z > zb) { fillQ(g, cam, [[x0, y - h, zb], [x1, y - h, zb], [x1, y, zb], [x0, y, zb]], KC.step); fillQ(g, cam, [[x0 + 0.2, y - h, zb + 0.001], [x1 - 0.15, y - h, zb + 0.001], [x1 - 0.15, y, zb + 0.001], [x0 + 0.2, y, zb + 0.001]], KC.carpet, 'rgba(10,4,6,0.5)'); }
    line3(g, cam, [x0 + 0.2, y + 0.004, zb], [x1 - 0.15, y + 0.004, zb], '#8a7344', null);   // brass stair rod
  }
  // the closed side of the stairs (facing the hall) with a little cupboard door
  const prof = [[x1, 0, z0]]; for (let i = 0; i < n; i++) { prof.push([x1, (i + 1) * h, z0 - i * d]); prof.push([x1, (i + 1) * h, z0 - (i + 1) * d]); }
  prof.push([x1, HL.land - 0.16, HL.landZ - 0.02]); prof.push([x1, 0, HL.landZ - 0.02]);
  for (let i = 0; i < n; i++) line3(g, cam, [x1 + 0.003, (i + 1) * h, z0 - i * d], [x1 + 0.003, (i + 1) * h, z0 - (i + 1) * d], 'rgba(90,80,110,0.5)', null);
  if (cam.x > x1) { fillQ(g, cam, prof, KC.wallS); fillQ(g, cam, [[x1 + 0.002, 0.05, 2.6], [x1 + 0.002, 0.05, 3.3], [x1 + 0.002, 1.05, 3.3], [x1 + 0.002, 1.05, 2.6]], '#1d2232', 'rgba(5,6,10,0.8)'); disc3(g, cam, [x1 + 0.004, 0.6, 3.22], [0, 0, 1], [0, 1, 0], 0.015, '#8a7344', null, 10); }
  // newel post + balusters + handrail
  box3(g, cam, x1 - 0.06, x1 + 0.08, 0, 1.12, z0 + 0.02, z0 + 0.16, { front: '#3a2a22', side: '#2e2019', top: '#4a362a' });
  { const c = proj(cam, x1 + 0.01, 1.2, z0 + 0.09); if (c) { g.fillStyle = '#4a362a'; ell(g, c[0], c[1], 0.075 * c[2], 0.075 * c[2]); g.fill(); g.strokeStyle = KC.ink; g.lineWidth = lwAt(cam, [c]); g.stroke(); } }
  for (let i = 0; i < n; i++) { const zc = z0 - (i + 0.5) * d, y = (i + 1) * h; line3(g, cam, [x1 + 0.01, y, zc], [x1 + 0.01, y + 0.92, zc], '#33251e', null); }
  line3(g, cam, [x1 + 0.01, 1.06, z0 + 0.09], [x1 + 0.01, HL.land + 0.95, HL.landZ], '#4a362a', null);
  // the landing slab + its railing
  box3(g, cam, x0, x1 + 1.85, HL.land - 0.16, HL.land, HL.front, HL.landZ, { front: '#1b2030', top: '#2b2220', bottom: '#141824' });
  for (let x = -0.4; x < HL.x1; x += 0.13) line3(g, cam, [x, HL.land, HL.landZ - 0.04], [x, HL.land + 0.92, HL.landZ - 0.04], '#33251e', null);
  line3(g, cam, [-0.45, HL.land + 0.95, HL.landZ - 0.04], [HL.x1, HL.land + 0.95, HL.landZ - 0.04], '#4a362a', null);
}
// ---------- furniture: console table, coats, shoes, rug, radiator, pendant ----------
function drawConsole(g, cam, E) {
  const x0 = 1.05, x1 = 1.38, z0 = 3.9, z1 = 4.9, h = 0.82;
  for (const [lx, lz] of [[x0 + 0.02, z0 + 0.03], [x0 + 0.02, z1 - 0.07]]) box3(g, cam, lx, lx + 0.04, 0, h - 0.04, lz, lz + 0.04, { front: '#2a1e17', side: '#22180f' });
  box3(g, cam, x0, x1, h - 0.05, h, z0, z1, { front: '#3a2a20', top: '#4a372a', side: '#2a1e17', bottom: '#1b130d' });
  box3(g, cam, x0 + 0.03, x1, h - 0.22, h - 0.05, z0 + 0.05, z1 - 0.05, { front: '#33251c', side: '#2a1e17' });
  // lamp (off): base + shade
  const lb = [1.25, h, 4.65]; box3(g, cam, lb[0] - 0.05, lb[0] + 0.05, h, h + 0.32, lb[2] - 0.05, lb[2] + 0.05, { front: '#5a5e68', side: '#4a4e58', top: '#6a6e78' });
  const shade = projPoly(cam, [[lb[0] - 0.09, h + 0.32, lb[2]], [lb[0] + 0.09, h + 0.32, lb[2]], [lb[0] + 0.15, h + 0.12 + 0.2 * 0 + 0.0, lb[2]].map((v, i) => i === 1 ? h + 0.18 : v), [lb[0] - 0.15, h + 0.18, lb[2]]]);
  if (shade.length > 2) { g.fillStyle = '#4c4a52'; g.strokeStyle = KC.ink; g.lineWidth = lwAt(cam, shade); g.beginPath(); polyPath(g, shade); g.fill(); g.stroke(); }
  // bowl with keys + a framed photo
  disc3(g, cam, [1.2, h + 0.003, 4.2], [1, 0, 0], [0, 0, 1], 0.09, '#6a7488');
  line3(g, cam, [1.16, h + 0.01, 4.18], [1.24, h + 0.01, 4.24], '#c8b070', 3);
  box3(g, cam, 1.3, 1.34, h, h + 0.22, 4.35, 4.5, { front: '#3a2c22', side: '#2a1e17' });
}
function drawCoats(g, cam, E) {
  const x = HL.x1 - 0.02;
  line3(g, cam, [x, 1.78, 2.55], [x, 1.78, 3.7], '#3a2a22', 6);
  const cols = [['#2f3b52', '#232c3e'], ['#5a3a2a', '#40291e'], ['#2a3a30', '#1f2b24']];
  cols.forEach(([c, s], i) => {
    const zc = 2.8 + i * 0.38, sw = Math.sin(E.t * 0.8 + i) * 0.01, xx = x - 0.08 - (i % 2) * 0.03;
    const pts = [[xx, 1.76, zc - 0.06], [xx, 1.76, zc + 0.06], [xx - 0.02, 1.55, zc + 0.18], [xx - 0.03 - sw, 0.85 + i * 0.05, zc + 0.2], [xx - 0.03 - sw, 0.82 + i * 0.05, zc - 0.2], [xx - 0.02, 1.55, zc - 0.18]];
    fillQ(g, cam, pts, c); line3(g, cam, [xx - 0.01, 1.7, zc], [xx - 0.03, 0.95 + i * 0.05, zc], s, null);
    disc3(g, cam, [x - 0.01, 1.8, zc], [0, 0, 1], [0, 1, 0], 0.02, '#8a7344', null, 10);
  });
  // a scarf + umbrella leaning on the wall
  line3(g, cam, [x - 0.06, 1.74, 3.6], [x - 0.08, 1.1, 3.62], '#8a2a2a', 8);
  line3(g, cam, [x - 0.04, 0, 3.95], [x - 0.12, 0.95, 3.85], '#151820', 7);
}
function drawShoes(g, cam, E) {
  fillQ(g, cam, [[-1.3, 0.003, 5.15], [-0.6, 0.003, 5.15], [-0.6, 0.003, 5.9], [-1.3, 0.003, 5.9]], '#2a2a30');
  const sh = [[-1.2, 5.3, '#1a1a1e'], [-1.05, 5.32, '#1a1a1e'], [-0.85, 5.55, '#7a2a2a'], [-0.72, 5.6, '#7a2a2a']];
  for (const [x, z, c] of sh) { box3(g, cam, x, x + 0.1, 0, 0.08, z, z + 0.28, { front: c, top: c, side: c }); }
}
function drawRug(g, cam, E) {
  fillQ(g, cam, [[-0.35, 0.002, 2.4], [0.75, 0.002, 2.4], [0.75, 0.002, 5.7], [-0.35, 0.002, 5.7]], '#3e2226', 'rgba(10,4,6,0.6)');
  fillQ(g, cam, [[-0.25, 0.003, 2.5], [0.65, 0.003, 2.5], [0.65, 0.003, 5.6], [-0.25, 0.003, 5.6]], null, 'rgba(160,110,70,0.35)');
  for (let z = 2.9; z < 5.4; z += 0.6) { const c = [0.2, 0.004, z]; disc3(g, cam, c, [0.18, 0, 0], [0, 0, 0.18], 1, null, 'rgba(160,110,70,0.3)', 4); }
}
function drawRadiator(g, cam, E) {
  const x = HL.x1 - 0.12; box3(g, cam, x, HL.x1 - 0.02, 0.15, 0.72, 0.9, 1.9, { front: '#3a4152', side: '#4a5266', top: '#556074' });
  for (let z = 0.95; z < 1.9; z += 0.08) line3(g, cam, [x - 0.001, 0.2, z], [x - 0.001, 0.68, z], 'rgba(10,12,18,0.6)', null);
}
function drawPendant(g, cam, E) {
  const sw = Math.sin(E.t * 0.6) * 0.02, top = [0.2, HL.ceil, 3.4], bot = [0.2 + sw, 3.65, 3.4];
  line3(g, cam, top, bot, '#07080c', 2);
  const bell = projPoly(cam, [[bot[0] - 0.04, bot[1], bot[2]], [bot[0] + 0.04, bot[1], bot[2]], [bot[0] + 0.2, bot[1] - 0.22, bot[2]], [bot[0] - 0.2, bot[1] - 0.22, bot[2]]]);
  if (bell.length > 2) { g.fillStyle = '#2a2420'; g.strokeStyle = KC.ink; g.lineWidth = 2; g.beginPath(); polyPath(g, bell); g.fill(); g.stroke(); }
}
// ---------- light: warm porch light through the frosted glass, cold moon from the high window ----------
function hallLight(g, cam, E) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const k = E.porch;
  if (k > 0.01) {
    // fan of warm light on the floor from the sidelight + door gap
    const fan = projPoly(cam, [[SIDE.x0, 0.002, 5.98], [SIDE.x1, 0.002, 5.98], [SIDE.x1 + 0.5, 0.002, 3.3], [SIDE.x0 - 0.7, 0.002, 3.3]]);
    if (fan.length > 2) { const a = fan[0], b = fan[3]; const gr = g.createLinearGradient(a[0], a[1], (b[0] + fan[2][0]) / 2, b[1]); gr.addColorStop(0, rgb(KC.warm, 0.2 * k)); gr.addColorStop(1, rgb(KC.warm, 0)); g.fillStyle = gr; g.beginPath(); polyPath(g, fan); g.fill(); }
    const s = proj(cam, (SIDE.x0 + SIDE.x1) / 2, 1.5, 5.95); if (s) glow(g, s[0], s[1], 1.4 * s[2], [255, 170, 90], 0.14 * k);
    const f = proj(cam, 0, 2.28, 5.95); if (f) glow(g, f[0], f[1], 0.9 * f[2], [255, 170, 90], 0.12 * k);
    const fl = proj(cam, 0, 0, 5.85); if (fl) { g.save(); g.translate(fl[0], fl[1]); g.scale(1, 0.18); glow(g, 0, 0, 0.9 * fl[2], [255, 180, 110], 0.18 * k); g.restore(); }
  }
  if (E.moon > 0) {
    // a slanted shaft from the high window down onto the floor near the stairs
    const sh = projPoly(cam, [[-0.5, 4.3, 5.95], [0.5, 4.3, 5.95], [0.6, 0.002, 2.6], [-0.7, 0.002, 2.4]]);
    if (sh.length > 2) { const top = proj(cam, 0, 4.2, 5.9), bot = proj(cam, 0, 0, 2.5); if (top && bot) { const gr = g.createLinearGradient(top[0], top[1], bot[0], bot[1]); gr.addColorStop(0, rgb(KC.moon, 0.07 * E.moon)); gr.addColorStop(0.7, rgb(KC.moon, 0.025 * E.moon)); gr.addColorStop(1, rgb(KC.moon, 0.0)); g.fillStyle = gr; g.beginPath(); polyPath(g, sh); g.fill(); } }
    const pool = projPoly(cam, [[-0.6, 0.003, 3.0], [0.55, 0.003, 3.0], [0.55, 0.003, 2.2], [-0.6, 0.003, 2.2]]);
    if (pool.length > 2) { g.fillStyle = rgb(KC.moon, 0.07 * E.moon); g.beginPath(); polyPath(g, pool); g.fill(); }
  }
  g.restore();
}
function hallDust(g, cam, E, n = 70) {
  const r = rng(4);
  for (let i = 0; i < n; i++) {
    const x = lerp(-0.7, 1.2, r()), y = lerp(0.2, 4.2, r()), z = lerp(2.2, 5.8, r());
    const p = proj(cam, x + Math.sin(E.t * 0.3 + i) * 0.08, y + Math.sin(E.t * 0.25 + i * 2) * 0.06 - ((E.t * 0.02 * (0.5 + r())) % 0.4), z); if (!p) continue;
    const inBeam = clamp(1 - Math.abs(z - (5.95 - (4.3 - y) * 0.85)) / 0.9);
    g.fillStyle = `rgba(200,215,255,${0.45 * inBeam * E.moon + 0.08})`; const sz = Math.max(1.2, 0.007 * p[2]); g.fillRect(p[0], p[1], sz, sz);
  }
}
// the whole hall with depth-sorted extras: [{x, z, draw(g,cam,E)}]
function hallScene(g, cam, E, extras = [], o = {}) {
  hallShell(g, cam, E, o);
  if (o.under) o.under(g, cam, E);
  const items = [
    { n: 'rug', x: 0.2, z: 9, draw: () => drawRug(g, cam, E) },
    { n: 'shoes', x: -0.95, z: 5.5, draw: () => drawShoes(g, cam, E) },
    { n: 'stairs', x: -0.9, z: 2.6, draw: () => drawStairs(g, cam, E, o) },
    { n: 'console', x: 1.2, z: 4.4, draw: () => drawConsole(g, cam, E) },
    { n: 'coats', x: 1.3, z: 3.2, draw: () => drawCoats(g, cam, E) },
    { n: 'radiator', x: 1.3, z: 1.4, draw: () => drawRadiator(g, cam, E) },
    { n: 'pendant', x: 0.2, z: 3.4, draw: () => drawPendant(g, cam, E) },
    ...extras.map(e => ({ n: 'x', x: e.x == null ? 0 : e.x, z: e.z, draw: () => e.draw(g, cam, E) })),
  ].filter(it => !o.skip || !o.skip.includes(it.n));
  items.forEach(it => it.d = it.n === 'rug' ? 1e9 : camSpace(cam, it.x, cam.y, it.z)[2]);
  items.sort((a, b) => b.d - a.d).forEach(it => it.draw());
  hallLight(g, cam, E);
  hallDust(g, cam, E);
  if (o.over) o.over(g, cam, E);
}

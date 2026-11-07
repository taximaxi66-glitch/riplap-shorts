// ---------- the film: Part 6 – The Undertow ----------
const F_ROAD = 1500;
const CUES = [];  // sound cues collected by the shots: {t, n, v}
function cue(t, n, v = 1) { CUES.push({ t: +t.toFixed(3), n, v }); }
function keys(K, t) {   // eased keyframes
  if (t <= K[0].t) return { ...K[0] }; if (t >= K[K.length - 1].t) return { ...K[K.length - 1] };
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1].t) { const k = eio(inv(K[i].t, K[i + 1].t, t)), o = {}; for (const p in K[i]) o[p] = lerp(K[i][p], K[i + 1][p], k); return o; }
}
function path3(K, t) { const o = keys(K, t); return o; }
const YSTRIDE = 4 * (HUMAN.thigh + HUMAN.shin) * Math.sin(50 * D2R);
function footCues(t0, t1, phAt, name, v) { let last = null; for (let t = t0; t < t1; t += 1 / 120) { const n = Math.floor(phAt(t) / Math.PI + 0.5); if (last != null && n !== last) cue(t, name, v); last = n; } }
function standPose(t, o = {}) { return { legL: [-2, 4], legR: [3, 5], footL: 0, footR: 0, armL: [4 + noise(t * 0.6) * 3, 14, 6], armR: [o.reach == null ? 4 : o.reach, o.reach == null ? 14 : 20, 6], lean: 3 + noise(t * 0.5) * 1.5, headPitch: (o.headPitch || 0) + noise(t * 0.7) * 2, headRoll: noise(t * 0.4 + 2) * 3, bob: Math.sin(t * 1.2) * 0.004, roll: 0 }; }
function huddlePose(t, k = 1, o = {}) {   // sitting on the floor, knees up, hands on the head
  const tr = o.tremble || 0;
  return { legL: [lerp(0, 128, k), lerp(4, 112, k)], legR: [lerp(0, 126, k), lerp(4, 110, k)], footL: lerp(0, -20, k), footR: lerp(0, -20, k),
    armL: [lerp(4, 25, k), lerp(14, 135, k), lerp(6, 62, k), lerp(0, 1.55, k)], armR: [lerp(4, 25, k), lerp(14, 135, k), lerp(6, 62, k), lerp(0, 1.55, k)],
    lean: lerp(3, 14, k) + tr * noise(t * 9) * 2, headPitch: lerp(0, 12, k) + noise(t * 3) * 2, headRoll: noise(t * 0.6) * 3 + tr * noise(t * 11) * 3, bob: lerp(0, -0.8, k), roll: 0 };
}
function crouchPose(t, o = {}) { const p = huddlePose(t, 0.75, o); p.lean = 30; p.headPitch = 10; return p; }
const yawCrawl = (dx, dz) => Math.atan2(-dx, dz) / D2R;
const yawWalk = (dx, dz) => Math.atan2(dx, -dz) / D2R;

// ---------- extra 2D bits for this episode ----------
function ruleCard6(g, t, t0, t1, items) {
  if (t < t0 || t > t1 + 0.35) return;
  const k = popK(t, t0, 0.4), out = 1 - ss(t1, t1 + 0.35, t);
  g.save(); g.globalAlpha = out; g.translate(W / 2, 330); g.scale(k, k);
  rr(g, -420, -150, 840, 280, 34); g.fillStyle = 'rgba(10,10,14,0.88)'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#ffd23f'; g.stroke();
  rr(g, -150, -190, 300, 80, 24); g.fillStyle = '#ffd23f'; g.fill();
  g.fillStyle = '#111'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RULE #1', 0, -148);
  items.forEach((it, i) => { if (t < it.at) return; const k2 = popK(t, it.at, 0.3); g.save(); g.translate(40, -55 + i * 100); g.scale(k2, k2); g.font = '900 58px Inter'; g.fillStyle = it.col || '#fff'; g.fillText(it.text, 0, 4);
    if (it.icon) { g.translate(-g.measureText(it.text).width / 2 - 62, 0); it.icon(g); } g.restore(); });
  g.restore();
}
function iconBulb(g) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -6, 60, [255, 220, 120], 0.5); g.restore(); g.fillStyle = '#ffd23f'; ell(g, 0, -8, 24, 26); g.fill(); g.fillStyle = '#bbb'; g.fillRect(-11, 14, 22, 16); g.strokeStyle = '#ff3b2f'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(-30, -34); g.lineTo(30, 30); g.stroke(); }
function iconMoon(g) { g.fillStyle = '#ff5236'; g.beginPath(); g.arc(0, 0, 26, 0.6, Math.PI * 2 - 0.6, false); g.arc(14, 0, 20, Math.PI * 2 - 0.9, 0.9, true); g.fill(); }
function heightGuide(g, cam, t, t0, out, cx, cz) {
  const a = proj(cam, cx + 1.4, 0, cz), b = proj(cam, cx + 1.4, 3.05, cz), hm = proj(cam, cx - 1.5, 0, cz); if (!a || !b) return;
  const k = eout(inv(t0, t0 + 0.5, t));
  g.save(); g.globalAlpha = out; g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[0], lerp(a[1], b[1], k)); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(a[0] - 20, a[1]); g.lineTo(a[0] + 20, a[1]); g.moveTo(b[0] - 20, lerp(a[1], b[1], k)); g.lineTo(b[0] + 20, lerp(a[1], b[1], k)); g.stroke();
  if (k > 0.9) { const lk = popK(t, t0 + 0.4, 0.3); g.translate(Math.min(a[0] + 30, W - 250), lerp(a[1], b[1], 0.55)); g.scale(lk, lk); rr(g, 0, -40, 200, 80, 18); g.fillStyle = 'rgba(8,8,12,0.85)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#ffd23f'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('10 FT', 100, 3); }
  g.restore();
  const hk = ss(t0 + 0.35, t0 + 0.75, t) * out;
  if (hk > 0 && hm) { g.save(); g.globalAlpha = hk * 0.85; g.setLineDash([10, 8]); g.strokeStyle = '#9fd0ff'; g.lineWidth = 4; const s = hm[2], x = hm[0], y = hm[1];
    g.beginPath(); g.ellipse(x, y - 1.62 * s, 0.11 * s, 0.13 * s, 0, 0, TAU); g.moveTo(x - 0.2 * s, y - 1.4 * s); g.lineTo(x + 0.2 * s, y - 1.4 * s); g.lineTo(x + 0.17 * s, y - 0.9 * s); g.lineTo(x + 0.12 * s, y); g.lineTo(x - 0.12 * s, y); g.lineTo(x - 0.17 * s, y - 0.9 * s); g.closePath(); g.stroke();
    g.setLineDash([]); g.fillStyle = '#9fd0ff'; g.font = '900 36px Inter'; g.textAlign = 'center'; g.fillText('YOU', x, y - 1.92 * s); g.restore(); }
}
function handOnGlass(g, x, y, S, rot, k, t, seed) {   // a long webbed hand pressed flat on the glass
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(lerp(1.15, 1, k), lerp(1.15, 1, k)); g.globalAlpha = clamp(k * 3);
  const ink = '#0a0e0f', skin = '#86958c';
  g.fillStyle = skin; g.strokeStyle = ink; g.lineWidth = S * 0.03; g.beginPath(); g.moveTo(-S * 0.22, -S * 1.5); g.lineTo(S * 0.22, -S * 1.5); g.lineTo(S * 0.3, -S * 0.3); g.lineTo(-S * 0.3, -S * 0.3); g.closePath(); g.fill(); g.stroke();
  ell(g, 0, -S * 0.15, S * 0.42, S * 0.36); g.fill(); g.stroke();
  const tips = [];
  for (let f = 0; f < 5; f++) { const a = Math.PI / 2 + (f - 2) * 0.32 + (f === 0 ? 0.5 : 0) + Math.sin(t * 6 + f + seed) * 0.02, L = S * (f === 0 ? 0.7 : 1.4 - Math.abs(f - 2.5) * 0.15);
    const bx = Math.cos(a) * S * 0.3, by = -S * 0.05 + Math.sin(a) * S * 0.25, mx = bx + Math.cos(a) * L * 0.55, my = by + Math.sin(a) * L * 0.55, tx = bx + Math.cos(a) * L, ty = by + Math.sin(a) * L; tips.push([mx, my]);
    limb(g, [[bx, by], [mx, my], [tx, ty]], S * 0.12, skin, ink, null, S * 0.025); mimicNail(g, tx, ty, a, S * 0.05); }
  g.fillStyle = 'rgba(60,90,80,0.45)'; for (let f = 1; f < 4; f++) { poly(g, [[0, S * 0.1], tips[f], tips[f + 1]]); g.fill(); }   // webbing
  g.fillStyle = 'rgba(220,235,230,0.3)'; ell(g, 0, -S * 0.1, S * 0.3, S * 0.22); g.fill();
  g.restore();
}
function breathFog(g, x, y, r, t, k) { if (k <= 0) return; const b = 0.5 + 0.5 * Math.sin(t * 2.6), rr_ = r * (0.8 + 0.35 * b); const gr = g.createRadialGradient(x, y, 0, x, y, rr_); gr.addColorStop(0, `rgba(225,232,240,${0.35 * k * (0.6 + 0.4 * b)})`); gr.addColorStop(1, 'rgba(225,232,240,0)'); g.fillStyle = gr; g.fillRect(x - rr_, y - rr_, rr_ * 2, rr_ * 2); }
function splashFx(g, x, y, age, s = 1, seed = 5) {   // water droplets thrown up
  if (age < 0 || age > 1.4) return; const r = rng(seed);
  for (let i = 0; i < 40; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2, v = (300 + r() * 900) * s, px = x + Math.cos(a) * v * age, py = y + Math.sin(a) * v * age + 1300 * s * age * age;
    g.fillStyle = `rgba(200,225,240,${0.8 * (1 - age / 1.4)})`; ell(g, px, py, (4 + r() * 8) * s, (6 + r() * 10) * s); g.fill(); }
  g.fillStyle = `rgba(220,235,245,${0.5 * (1 - age / 1.4)})`; ell(g, x, y, (120 + age * 300) * s, (20 + age * 30) * s); g.fill();
}
// spiral stair cutaway inside the tower (scroll = how far up we are, in px)
function stairCutaway(g, E, scroll, t, youK) {
  g.fillStyle = '#0b0a0c'; g.fillRect(0, 0, W, H);
  // curved brick wall behind (lit warm from below, cold window light)
  const wg = g.createLinearGradient(0, 0, W, 0); wg.addColorStop(0, '#1d1a1c'); wg.addColorStop(0.5, '#3a3236'); wg.addColorStop(1, '#1a1719'); g.fillStyle = wg; g.fillRect(90, 0, W - 180, H);
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
  for (let y = -((scroll * 0.9) % 60); y < H; y += 60) { g.beginPath(); g.moveTo(90, y); g.lineTo(W - 90, y); g.stroke(); const off = Math.floor((y + scroll * 0.9) / 60) % 2 ? 0 : 50; for (let x = 90 + off; x < W - 90; x += 100) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 60); g.stroke(); } }
  // slit window with moonlight
  const wy = 600 + ((scroll * 0.9) % 1400) - 700; for (const yy of [wy, wy + 1400]) { g.fillStyle = '#0c1424'; rr(g, 470, yy, 140, 300, 70); g.fill(); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, yy + 150, 260, [150, 180, 230], 0.2); g.restore(); g.fillStyle = '#d6d3c4'; ell(g, 560, yy + 80, 22, 22); g.fill(); }
  // outer walls (dark, thick)
  g.fillStyle = '#070607'; g.fillRect(0, 0, 100, H); g.fillRect(W - 100, 0, 100, H); g.strokeStyle = '#000'; g.lineWidth = 6; g.beginPath(); g.moveTo(100, 0); g.lineTo(100, H); g.moveTo(W - 100, 0); g.lineTo(W - 100, H); g.stroke();
  // steps zigzag: each step 90 px high, alternating directions in flights of 8
  const stepH = 70, stepW = 84;
  const stepAt = i => { const fl = Math.floor(i / 8), j = i % 8, dir = fl % 2 ? -1 : 1; return [W / 2 + dir * (j - 3.5) * stepW, 1500 - i * stepH + scroll]; };
  for (let i = 0; i < 60; i++) { const [x, y] = stepAt(i); if (y < -100 || y > H + 100) continue;
    g.fillStyle = '#5a5258'; g.fillRect(x - stepW / 2, y, stepW, 22); g.fillStyle = '#2c272b'; g.fillRect(x - stepW / 2, y + 22, stepW, stepH - 22); g.strokeStyle = '#0a090a'; g.lineWidth = 3; g.strokeRect(x - stepW / 2, y, stepW, stepH); }
  // iron hand rail
  g.strokeStyle = '#141416'; g.lineWidth = 7; g.beginPath(); for (let i = 0; i < 60; i++) { const [x, y] = stepAt(i); i ? g.lineTo(x, y - 110) : g.moveTo(x, y - 110); } g.stroke();
  // warm lamp glow from above
  g.save(); g.globalCompositeOperation = 'lighter'; const top = 1500 - 56 * stepH + scroll; glow(g, W / 2, top, 900, [255, 200, 120], 0.12); g.restore();
  return stepAt;
}
// inside the lantern room, looking out to sea through the glass
function lanternView(g, E, t, o = {}) {
  const cam = { x: LH.x, y: 17.4, z: LH.z + 0.3, hy: o.hy || 860, f: 900 };
  coastScene(g, cam, E, [], { mist: 0.4 });
  // the beam sweeping across the sea outside
  if (o.sweep != null) { const sx = o.sweep, k = o.sweepK == null ? 1 : o.sweepK; g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(W / 2, 1300, sx, cam.hy); gr.addColorStop(0, `rgba(255,236,180,${0.5 * k})`); gr.addColorStop(1, `rgba(255,236,180,${0.05 * k})`); g.fillStyle = gr; poly(g, [[W / 2 - 60, 1350], [sx - 260, cam.hy - 40], [sx + 260, cam.hy + 20], [W / 2 + 60, 1350]]); g.fill(); g.restore(); }
  return cam;
}
function lanternFrame(g, E, t, lamp, o = {}) {   // the iron frame, parapet and ceiling (drawn over the outside view)
  const ink = '#08090b', warm = [255, 210, 140];
  // ceiling (dome inside)
  g.fillStyle = '#121116'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 190); g.quadraticCurveTo(W / 2, 260, 0, 190); g.closePath(); g.fill(); g.strokeStyle = ink; g.lineWidth = 6; g.stroke();
  // mullions (curved bars of the cylindrical lantern)
  for (const [x0, x1] of [[30, 10], [360, 350], [720, 730], [1050, 1070]]) { g.strokeStyle = '#1a1b1f'; g.lineWidth = 34; g.beginPath(); g.moveTo(x0, 200); g.quadraticCurveTo((x0 + x1) / 2 + (x0 < W / 2 ? -14 : 14), 720, x1, 1260); g.stroke();
    g.strokeStyle = `rgba(${warm.join(',')},${0.25 * lamp})`; g.lineWidth = 6; g.beginPath(); g.moveTo(x0 - 10, 200); g.quadraticCurveTo((x0 + x1) / 2 - 24, 720, x1 - 10, 1260); g.stroke(); }
  g.strokeStyle = '#1a1b1f'; g.lineWidth = 22; g.beginPath(); g.moveTo(0, 735); g.quadraticCurveTo(W / 2, 770, W, 735); g.stroke();
  // glass sheen + interior reflection
  g.save(); g.globalCompositeOperation = 'lighter'; const rg = g.createLinearGradient(0, 200, W, 1250); rg.addColorStop(0.2, 'rgba(255,255,255,0)'); rg.addColorStop(0.28, `rgba(255,230,190,${0.05 + 0.06 * lamp})`); rg.addColorStop(0.36, 'rgba(255,255,255,0)'); rg.addColorStop(0.7, `rgba(255,230,190,${0.04 * lamp})`); rg.addColorStop(0.76, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 200, W, 1060); g.restore();
  // parapet wall + floor
  const pg = g.createLinearGradient(0, 1250, 0, H); pg.addColorStop(0, rgb(mixc([40, 34, 30], [120, 84, 50], lamp))); pg.addColorStop(1, rgb(mixc([18, 15, 14], [60, 40, 26], lamp))); g.fillStyle = pg;
  g.beginPath(); g.moveTo(0, 1250); g.quadraticCurveTo(W / 2, 1290, W, 1250); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill(); g.strokeStyle = ink; g.lineWidth = 6; g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, 1250 + i * 60); g.quadraticCurveTo(W / 2, 1290 + i * 64, W, 1250 + i * 60); g.stroke(); }
  for (let x = 80; x < W; x += 180) { g.fillStyle = '#2a2420'; ell(g, x, 1300, 9, 9); g.fill(); }   // rivets
}
function lensLamp(g, x, y, S, t, lamp, rot) {   // the big Fresnel lens on its pedestal
  const ink = '#0a0a0c';
  g.fillStyle = '#2a2b30'; g.strokeStyle = ink; g.lineWidth = 6; poly(g, [[x - S * 0.5, y + S * 1.6], [x + S * 0.5, y + S * 1.6], [x + S * 0.3, y + S * 0.9], [x - S * 0.3, y + S * 0.9]]); g.fill(); g.stroke();
  // lens body: stacked glass rings (prisms) around a bright core
  g.save(); g.beginPath(); g.ellipse(x, y, S * 0.75, S * 0.95, 0, 0, TAU); g.clip();
  const lg = g.createRadialGradient(x, y, 0, x, y, S); lg.addColorStop(0, rgb(mixc([60, 70, 80], [255, 255, 240], lamp))); lg.addColorStop(0.5, rgb(mixc([40, 50, 60], [255, 220, 140], lamp))); lg.addColorStop(1, rgb(mixc([20, 26, 34], [200, 140, 70], lamp)));
  g.fillStyle = lg; g.fillRect(x - S, y - S, 2 * S, 2 * S);
  g.strokeStyle = `rgba(255,255,255,${0.25 + 0.4 * lamp})`; g.lineWidth = 4;
  for (let i = -6; i <= 6; i++) { const yy = y + i * S * 0.15; g.beginPath(); g.moveTo(x - S, yy); g.quadraticCurveTo(x, yy + S * 0.05 * Math.sin(rot + i), x + S, yy); g.stroke(); }
  for (let i = 0; i < 4; i++) { const xx = x + Math.sin(rot + i * Math.PI / 2) * S * 0.75; if (Math.cos(rot + i * Math.PI / 2) < 0) continue; g.strokeStyle = 'rgba(20,20,24,0.7)'; g.lineWidth = 10; g.beginPath(); g.moveTo(xx, y - S); g.lineTo(xx, y + S); g.stroke(); }
  g.restore(); g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.ellipse(x, y, S * 0.75, S * 0.95, 0, 0, TAU); g.stroke();
  g.fillStyle = '#1d1e22'; rr(g, x - S * 0.45, y - S * 1.15, S * 0.9, S * 0.22, 10); g.fill(); g.stroke();
  if (lamp > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, S * 3.2, [255, 210, 130], 0.35 * lamp); glow(g, x, y, S * 0.9, [255, 255, 235], 0.6 * lamp); g.restore(); }
}

let SHOTS = [];
function buildShots() {
  const L = id => LN(id), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  // ===== 0. character-select spinner (≤ 2.6 s) =====
  const land = ww('hook', 'undertow?') - 0.05;
  const kinds = ['ring', 'hay', 'pale', 'frost', 'mimic', 'under'];
  const target = 17; // kinds[17 % 6] = 'under'
  const spinPos = t => target * (1 - Math.pow(1 - clamp(t / land), 3.2));
  { let last = -1; for (let t = 0; t < land; t += 1 / 120) { const p = Math.round(spinPos(t)); if (p !== last) { if (last >= 0) cue(t, 'tick', 0.5); last = p; } } cue(land, 'select', 1); cue(0.0, 'whoosh', 0.6); }
  S.push({ a: 0, b: L('keep').start - 0.1, fade: 0, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H);
    sideSea(g, E, t * 40, 1550, {}); g.fillStyle = 'rgba(5,6,12,0.55)'; g.fillRect(0, 0, W, H); seaMist(g, E, 0.7, 5);
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 70px Inter'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#000';
    const tk = popK(t, 0.05, 0.4); g.translate(W / 2, 330); g.scale(tk, tk); g.strokeText('HOW DO YOU SURVIVE', 0, 0); g.fillStyle = '#fff'; g.fillText('HOW DO YOU SURVIVE', 0, 0);
    g.font = '900 52px Inter'; g.strokeText('THIS HORROR CHARACTER?', 0, 78); g.fillStyle = '#ffd23f'; g.fillText('THIS HORROR CHARACTER?', 0, 78); g.restore();
    g.save(); const pk = popK(t, 0.25, 0.35); g.translate(W / 2, 520); g.scale(pk, pk); rr(g, -130, -42, 260, 84, 22); g.fillStyle = '#c4161c'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 6', 0, 3); g.restore();
    const p = spinPos(t), cy = 900;
    for (let i = Math.floor(p) - 3; i <= Math.floor(p) + 4; i++) {
      if (i < 0) continue; const dx = (i - p) * 300, x = W / 2 + dx; if (x < -200 || x > W + 200) continue;
      const near = 1 - clamp(Math.abs(dx) / 300); const sel = t >= land && i === target;
      g.save(); g.translate(x, cy); const sc = 0.8 + near * 0.2 + (sel ? 0.12 * popK(t, land, 0.3) : 0); g.scale(sc, sc); g.globalAlpha = 0.45 + near * 0.55;
      portrait(g, kinds[i % 6], t); g.restore();
    }
    g.save(); g.translate(W / 2, cy); const sk = t >= land ? 1 + 0.12 * popK(t, land, 0.3) : 1; g.scale(sk, sk); g.strokeStyle = '#ffd23f'; g.lineWidth = 10; rr(g, -142, -182, 284, 364, 30); g.stroke();
    g.fillStyle = '#ffd23f'; poly(g, [[-26, -215], [26, -215], [0, -188]]); g.fill(); g.restore();
    if (t >= land) { const nk = popK(t, land + 0.05, 0.35); g.save(); g.translate(W / 2, 1185); g.scale(nk, nk);
      rr(g, -330, -62, 660, 124, 30); g.fillStyle = 'rgba(8,8,12,0.9)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#fff'; g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THE UNDERTOW', 0, 4); g.restore(); }
    vignette(g, 0.6);
  } });

  // ===== 1. one continuous move: the keeper walks to the lighthouse → the lamp dies → it crawls out of the sea → stands → rule =====
  const s1A = L('keep').start - 0.1, s1B = L('seen').start - 0.03;
  const goesT = ww('keep', 'goes'), darkT = ww('keep', 'dark.'), crawlT = ww('sea', 'crawls'), headT = ww('bent', 'head'), upT = ww('bent', 'upside');
  const standT = ww('tall', 'stands') - 0.1, tenT = ww('tall', 'ten'), fastT = ww('rule', 'faster');
  const lampK1 = t => 1 - ss(goesT, darkT + 0.45, t);
  const ywalk = t => eio(inv(s1A - 0.5, L('keep').end + 0.4, t)), yZ = t => lerp(9.5, 15.5, ywalk(t));
  // the creature's route: out of the water → onto the shore rocks → sideways along the shore → stands
  const CK = [{ t: crawlT - 0.2, x: 9.0, z: 29.5, y: -2.4 }, { t: L('sea').end + 0.9, x: 4.0, z: 26.2, y: -0.3 }, { t: L('bent').start + 0.5, x: 2.0, z: 25.6, y: 0 }, { t: standT, x: 0.2, z: 25.0, y: 0 }];
  const cpos = t => { if (t <= CK[0].t) return { ...CK[0] }; for (let i = 0; i < CK.length - 1; i++) if (t < CK[i + 1].t) { const k = inv(CK[i].t, CK[i + 1].t, t); return { x: lerp(CK[i].x, CK[i + 1].x, k), z: lerp(CK[i].z, CK[i + 1].z, k), y: lerp(CK[i].y, CK[i + 1].y, eio(k)), seg: i }; } return { ...CK[CK.length - 1], seg: 9 }; };
  let cdist = []; { let d = 0, prev = cpos(CK[0].t); for (let t = CK[0].t; t <= standT + 0.01; t += 1 / 60) { const p = cpos(t); d += Math.hypot(p.x - prev.x, p.z - prev.z); prev = p; cdist.push(d); } }
  const cph = t => { const i = clamp(Math.round((t - CK[0].t) * 60), 0, cdist.length - 1); return cdist[i] / CSTRIDE * TAU; };
  const camK = [
    { t: s1A, x: -0.6, y: 2.5, z: 1.5, hy: 930 },
    { t: L('keep').end + 0.1, x: -0.4, y: 2.3, z: 5.5, hy: 940 },
    { t: crawlT + 0.3, x: 3.4, y: 1.4, z: 13.0, hy: 1000 },
    { t: L('bent').start, x: 3.2, y: 1.25, z: 16.5, hy: 1010 },
    { t: headT, x: 1.5, y: 1.0, z: 19.0, hy: 1040 },
    { t: upT + 0.5, x: 0.1, y: 0.75, z: 21.4, hy: 1090 },
    { t: standT + 0.2, x: 0.5, y: 1.1, z: 19.5, hy: 1010 },
    { t: tenT + 0.3, x: 0.6, y: 1.5, z: 18.2, hy: 880 },
    { t: s1B, x: 0.5, y: 1.55, z: 19.0, hy: 880 },
  ];
  cue(s1A, 'waves', 1); cue(s1A + 0.3, 'foghorn', 0.8); cue(goesT, 'lampoff', 1); cue(darkT + 0.3, 'wind', 0.8);
  footCues(s1A - 0.5, L('keep').end + 0.4, t => (yZ(t) - 9.5) / YSTRIDE * TAU * 2, 'step', 0.45);
  cue(crawlT - 0.1, 'splash', 0.9); cue(crawlT + 0.1, 'sting', 0.6); cue(L('sea').end + 0.3, 'waves', 0.8);
  footCues(CK[0].t + 0.1, standT, cph, 'wetslap', 0.75);
  cue(ww('bent', 'backwards...'), 'bonecrack', 0.7); cue(upT, 'twitch', 0.8); cue(upT + 0.1, 'sting', 0.7);
  cue(standT, 'bonecrack', 0.9); cue(standT + 0.3, 'jointstretch', 1); cue(tenT, 'boom', 0.6); cue(L('rule').start, 'card', 0.8);
  cue(ww('rule', "can't"), 'pop', 0.6); cue(ww('rule', 'dark,'), 'pop', 0.7); cue(fastT, 'twitch', 0.9); cue(fastT + 0.05, 'hiss', 0.7);
  S.push({ a: s1A, b: s1B, fade: 0.45, draw: (g, t) => {
    const E = envAt(t); const cam = { ...keys(camK, t), f: F_ROAD }; const ex = [];
    // you, walking up the path, then stopping and turning toward the sea
    const wk = ywalk(t), yz = yZ(t), turn = ss(crawlT, crawlT + 0.6, t);
    const yp = wk > 0 && wk < 1 ? walkPose((yz - 9.5) / YSTRIDE * TAU * 2, 0.9, 0) : standPose(t);
    ex.push(keeperSprite(yz, pathX(yz), yp, lerp(178, 230, turn), { expr: 'scared' }));
    // the creature
    if (t > CK[0].t) {
      const c = cpos(t); const rise = eio(inv(standT, standT + 0.95, t));
      const nx = cpos(Math.min(t + 0.1, standT)); let dx = nx.x - c.x, dz = nx.z - c.z; if (Math.hypot(dx, dz) < 1e-4) { dx = -1; dz = 0; }
      const crawlYaw = yawCrawl(dx, dz);
      const slow = 1 - ss(standT - 0.6, standT, t);
      let pose = crawlPose(cph(t), slow, t);
      if (t > upT - 0.2 && t < standT) { pose.headRoll += 25 * ss(upT - 0.2, upT + 0.3, t); }
      if (rise > 0) { const st = standU(t, { headPitch: 6 }); if (t > fastT && t < fastT + 0.6) { const j = Math.sin(inv(fastT, fastT + 0.6, t) * Math.PI); st.lean += 25 * j; st.headRoll += 30 * j; } pose = poseLerp(pose, st, rise); }
      const yaw = lerp(crawlYaw, 0, rise);
      ex.push(underSprite(c.z, c.x, pose, yaw, { y: c.y, water: c.y < 0, crawl: 1 - rise, mouth: t > fastT ? 0.6 : 0.25, drip: 1, fogMul: 0.35, eyeGlow: 0.5 + 0.5 * ss(upT - 0.2, upT + 0.3, t) }));
      if (t > tenT - 0.05) { const out = 1 - ss(L('rule').start - 0.3, L('rule').start, t); if (out > 0) ex.push({ z: c.z - 0.3, draw: (g, cam, E) => heightGuide(g, cam, t, tenT, out, c.x, c.z) }); }
    }
    coastScene(g, cam, E, ex, { lh: { lamp: lampK1(t) }, beam: { k: lampK1(t), ang: beamAngle(t, 0) } });
    if (t > upT && t < upT + 1) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, 1100, 800, [20, 90, 100], 0.2 * (1 - inv(upT, upT + 1, t))); g.restore(); }
    vignette(g, 0.55);
    ruleCard6(g, t, L('rule').start, s1B - 0.12, [{ text: "CAN'T TOUCH LIGHT", at: ww('rule', "can't"), icon: iconBulb }, { text: 'FAST IN THE DARK', at: ww('rule', 'dark,'), col: '#ff5236' }]);
  } });

  // ===== 2. close-up: its upside-down face — it has seen you =====
  const cA = L('seen').start - 0.03, cB = L('boat').start - 0.12, seenT = ww('seen', 'seen'), youT = ww('seen', 'you.');
  cue(cA, 'hit', 0.8); cue(seenT, 'sting', 0.7); cue(youT + 0.15, 'shriek', 1); cue(youT + 0.1, 'heartbeat', 0.5);
  S.push({ a: cA, b: cB, fade: 0, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#04050a'; g.fillRect(0, 0, W, H);
    sideSea(g, E, 300 + t * 10, 1500, { lighthouse: false }); g.fillStyle = 'rgba(6,8,16,0.62)'; g.fillRect(0, 0, W, H);
    const op = eout(inv(youT, youT + 0.35, t)) * (1 - 0.3 * ss(cB - 0.4, cB, t));
    const z = 1 + 0.08 * inv(cA, cB, t) + 0.1 * eout(inv(youT, youT + 0.3, t)); g.save(); g.translate(W / 2, 760); g.scale(z, z); g.translate(-W / 2, -760);
    underFaceBig(g, W / 2, 720, 300, { t, open: 0.12 + op * 0.88, jitter: 0.2 + op * 0.6, tilt: -8 + noise(t * 1.4) * 6 + op * 8, eyeBig: ss(seenT - 0.1, seenT + 0.3, t), look: 0 });
    g.restore();
    seaMist(g, E, 0.6, 9);
    if (op > 0) { g.fillStyle = `rgba(120,0,0,${0.12 * op})`; g.fillRect(0, 0, W, H); }
    vignette(g, 0.7);
  } });

  // ===== 3. what-if 1: run for your boat? the water is where it hunts (grey) =====
  const bA = L('boat').start - 0.12, bB = L('rocks').start - 0.12, boatT = ww('boat', 'boat?'), noT = ww('boat', 'no.'), waterT = ww('boat', 'water'), isT = ww('boat', 'is'), huntT = ww('boat', 'hunts.');
  const dockY = 1160, waterY = 1230, boatX = 720;
  const youRun = t => lerp(-120, 420, eio(inv(bA, boatT + 0.1, t)));
  { let last = null; for (let t = bA; t < boatT + 0.1; t += 1 / 120) { const n = Math.floor((youRun(t) + 120) / (YSTRIDE * 220) * 2 + 0.5); if (last != null && n !== last) cue(t, 'dockstep', 0.7); last = n; } }
  cue(L('boat').start, 'card', 0.7); cue(noT - 0.05, 'boatthud', 0.9); cue(noT + 0.1, 'creak', 0.7); cue(waterT, 'surface', 1); cue(waterT + 0.1, 'sting', 0.6); cue(isT + 0.05, 'grab', 0.9); cue(huntT - 0.05, 'splash', 1); cue(huntT, 'xstamp', 1); cue(huntT + 0.2, 'impact', 0.5);
  S.push({ a: bA, b: bB, fade: 0.3, draw: (g0, t) => {
    const E = envAt(t); const SC = scratch(); const g = SC.g; g.clearRect(0, 0, W, H);
    sideSea(g, E, 600 + (t - bA) * 40, 1060, {});
    const tip = eio(inv(huntT - 0.25, huntT + 0.35, t)), grab = ss(isT - 0.1, isT + 0.15, t), rise = eio(inv(waterT - 0.15, isT, t));
    // the dock (left), planks + posts
    g.fillStyle = '#3a2e24'; for (let x = -40; x < 520; x += 130) g.fillRect(x, dockY + 10, 22, 260);
    g.fillStyle = '#5a4634'; g.fillRect(-60, dockY - 18, 560, 34); g.strokeStyle = '#120d0a'; g.lineWidth = 4; g.strokeRect(-60, dockY - 18, 560, 34); for (let x = -60; x < 500; x += 56) { g.beginPath(); g.moveTo(x, dockY - 18); g.lineTo(x, dockY + 16); g.stroke(); }
    // the boat, tipping when it is pulled under
    const by = seaSurface(boatX, t, waterY) - 10 + rise * 6 + tip * 40, brot = Math.sin(t * 1.4) * 0.04 + tip * 0.9 + grab * 0.12;
    g.save(); g.translate(boatX, by); g.rotate(brot);
    g.fillStyle = '#7a2a24'; g.strokeStyle = '#0b0b0e'; g.lineWidth = 5; g.beginPath(); g.moveTo(-230, -60); g.quadraticCurveTo(-200, 40, 0, 45); g.quadraticCurveTo(200, 40, 250, -70); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#c8bfa8'; g.fillRect(-228, -66, 476, 14); g.fillStyle = '#4a3624'; g.fillRect(-40, -60, 90, 14);
    // you, jumped into the boat
    if (t > boatT + 0.1) { const yp = huddlePose(t, 0.55, { tremble: 1 }); yp.armR = [lerp(30, 120, grab), 20, 10]; drawRig(g, KEEPER, yp, -40, -50, 220, 70, { t, expr: 'scared' }); }
    g.restore();
    if (t <= boatT + 0.1) { const x = youRun(t), jump = ss(boatT - 0.15, boatT + 0.1, t); const yp = walkPose((x + 120) / (YSTRIDE * 220) * TAU, 1, 1); g.fillStyle = 'rgba(0,0,0,0.3)'; ell(g, x, dockY - 18, 50, 8); g.fill(); drawRig(g, KEEPER, yp, x, dockY - 18 - Math.sin(jump * Math.PI) * 80, 220, 90, { t, expr: 'scared' }); }
    // it rises out of the water next to the boat: upside-down head + long arms on the gunwale
    if (rise > 0) { const hx = boatX + 330, hy = lerp(waterY + 260, waterY - 70, rise);
      for (const sd of [-1, 1]) { const gx = boatX + (sd < 0 ? 120 : 230), gy = by - 70 + (sd < 0 ? 10 : -10); const sh = [hx + sd * 60, waterY + 120]; const el = [lerp(sh[0], gx, 0.5) + 120, lerp(sh[1], gy, 0.5) - 120 * rise];
        const tipP = [lerp(sh[0], gx, rise), lerp(sh[1], gy, rise)]; limb(g, [sh, [lerp(sh[0], el[0], rise), lerp(sh[1], el[1], rise)], tipP], 26, UNDER.skin, UNDER.ink, UNDER.shade, 3);
        if (grab > 0) for (let f = 0; f < 4; f++) { const a = Math.PI * (1.05 + f * 0.13); limb(g, [tipP, [tipP[0] + Math.cos(a) * 46, tipP[1] + Math.sin(a) * 30], [tipP[0] + Math.cos(a) * 70, tipP[1] + 30 + f * 4]], 8, UNDER.skin, UNDER.ink, null, 2); } }
      underFaceBig(g, hx, hy, 70, { t, open: 0.3 + grab * 0.6, noNeck: true, jitter: 0.4 }); }
    frontWater(g, E, waterY + 70);
    splashFx(g, boatX + 80, waterY + 40, t - huntT + 0.05, 1, 7); splashFx(g, boatX + 320, waterY + 40, t - waterT + 0.1, 0.6, 9);
    seaMist(g, E, 0.6, 4); vignette(g, 0.55);
    const kick = t > huntT - 0.05 && t < huntT + 0.3 ? 1 - inv(huntT - 0.05, huntT + 0.3, t) : 0;
    g0.save(); g0.filter = 'grayscale(1) brightness(1.7) contrast(1.15)'; g0.translate(noise(t * 40) * 14 * kick, noise(t * 37 + 2) * 10 * kick); g0.drawImage(SC.c, 0, 0); g0.restore();
    chip(g0, t, L('boat').start, bB - 0.15, 'RUN FOR YOUR BOAT?', '#ff3b2f', 250, g2 => iconX(g2, 24));
    bigX(g0, t, huntT, W / 2, 780, 230);
  } });

  // ===== 4. what-if 2: hide in the rocks? it smells you (grey) =====
  const kA = L('rocks').start - 0.12, kB = L('works').start - 0.15, smellT = ww('rocks', 'smells'), onT = ww('rocks', 'on'), secT = ww('rocks', 'seconds.');
  const gy = 1330, bx0 = 470, bx1 = 960, btop = 860;
  const bTop = x => { const k = clamp((x - bx0) / (bx1 - bx0)); return gy - (gy - btop) * Math.sin(k * Math.PI) * (0.85 + 0.15 * Math.sin(k * 5)); };
  const mX = t => lerp(1500, 690, eio(inv(kA, smellT, t)));
  footCues(kA, smellT, t => (1500 - mX(t)) / (CSTRIDE * 170) * TAU, 'wetslap', 0.7);
  cue(L('rocks').start, 'card', 0.7); cue(smellT, 'sniff', 1.1); cue(smellT + 0.45, 'sniff', 0.9); cue(onT - 0.1, 'shriek', 0.8); cue(onT, 'hit', 0.7); cue(secT, 'xstamp', 1);
  S.push({ a: kA, b: kB, fade: 0.3, draw: (g0, t) => {
    const E = envAt(t); const SC = scratch(); const g = SC.g; g.clearRect(0, 0, W, H);
    sideSea(g, E, 900 + (t - kA) * 40, 1030, {});
    // rocky ground band
    g.fillStyle = '#16181c'; g.beginPath(); g.moveTo(0, gy - 40); for (let x = 0; x <= W; x += 60) g.lineTo(x, gy - 40 + Math.sin(x * 0.03) * 20 + hash(x) * 30); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    boulder(g, 140, gy - 20, 170, E, 0, 3, false); boulder(g, 1040, gy + 10, 150, E, 0, 8, true);
    // you, crouched behind the big rock, hands over your head
    const lunge = eio(inv(onT - 0.05, onT + 0.25, t));
    g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, 380, gy, 90, 12); g.fill();
    drawRig(g, KEEPER, crouchPose(t, { tremble: 1 }), 380, gy, 330, 80, { t, expr: t > smellT ? 'closed' : 'scared' });
    // the big boulder you hide behind
    g.fillStyle = '#2a2f36'; g.strokeStyle = '#08090b'; g.lineWidth = 6; g.beginPath(); g.moveTo(bx0, gy); for (let x = bx0; x <= bx1; x += 10) g.lineTo(x, bTop(x)); g.lineTo(bx1, gy); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#4a525c'; g.beginPath(); g.moveTo(bx0 + 60, bTop(bx0 + 60)); for (let x = bx0 + 60; x <= bx1 - 120; x += 10) g.lineTo(x, bTop(x)); g.lineTo(bx1 - 160, bTop(bx1 - 160) + 90); g.lineTo(bx0 + 120, bTop(bx0 + 120) + 60); g.closePath(); g.fill();
    g.fillStyle = '#1d3524'; ell(g, 640, gy - 80, 120, 30); g.fill();
    // it crawls over the rock; its upside-down head comes down over the edge, sniffing
    const mx = mX(t), my = mx > bx1 ? gy : bTop(mx), moving = t < smellT;
    const pose = crawlPose((1500 - mx) / (CSTRIDE * 170) * TAU, moving ? 1 : 0.2, t);
    if (!moving) { const sn = Math.sin((t - smellT) * 9) * (1 - lunge); pose.headPitch += 10 + sn * 4; pose.lean -= 6; pose.armL = [-140, 120, 34, 0]; }
    if (lunge > 0) { pose.lean = lerp(pose.lean, -150, lunge); pose.armL = [lerp(pose.armL[0], -175, lunge), 40, 30, 0]; pose.armR = [lerp(pose.armR[0], -170, lunge), 40, 30, 0]; }
    drawRig(g, UNDER, pose, mx + lunge * -80, my - 6, 170, 90, { t, crawl: 1, twitch: 1, mouth: 0.25 + lunge * 0.7 });
    if (t > smellT && t < onT) for (let i = 0; i < 3; i++) { const a = ((t - smellT) * 1.5 + i / 3) % 1; g.strokeStyle = `rgba(220,230,240,${0.5 * (1 - a)})`; g.lineWidth = 3; g.beginPath(); g.arc(470 - a * 60, 900 + i * 18, 20 + a * 40, -0.6, 0.6); g.stroke(); }
    seaMist(g, E, 0.5, 6); vignette(g, 0.55);
    const kick = t > onT && t < onT + 0.35 ? 1 - inv(onT, onT + 0.35, t) : 0;
    g0.save(); g0.filter = 'grayscale(1) brightness(1.7) contrast(1.15)'; g0.translate(noise(t * 40) * 16 * kick, noise(t * 37 + 2) * 12 * kick); g0.drawImage(SC.c, 0, 0); g0.restore();
    chip(g0, t, L('rocks').start, kB - 0.15, 'HIDE IN THE ROCKS?', '#ff3b2f', 250, g2 => iconX(g2, 24));
    bigX(g0, t, secT, W / 2, 780, 230);
  } });

  // ===== 5. here's what works: get inside → run to the top → relight the lamp =====
  const hA = L('works').start - 0.15, getT = ww('works', 'get'), insT = ww('works', 'inside,'), runT = ww('works', 'run'), topT = ww('works', 'top,'), relT = ww('works', 'relight'), lampT = ww('works', 'lamp.');
  const cB5 = L('climb').start - 0.1, doorZ = LH.z - LH.r0 - 0.35;
  const checks = [{ text: 'GET INSIDE', at: getT }, { text: 'RUN TO THE TOP', at: runT }, { text: 'RELIGHT THE LAMP', at: relT }];
  const ui5 = (g, t) => { chip(g, t, L('works').start, cB5 - 0.1, "HERE'S WHAT WORKS", '#3ee07a', 250, g2 => iconCheck(g2, 24)); checklist(g, t, checks); };
  const yr = t => eio(inv(hA - 0.2, insT + 0.1, t)), yZ5 = t => lerp(40.5, doorZ, yr(t));
  footCues(hA, insT + 0.1, t => (yZ5(t) - 40.5) / YSTRIDE * TAU * 2, 'step', 0.6);
  cue(L('works').start, 'good', 0.8); cue(getT, 'pop', 0.5); cue(insT - 0.05, 'dooropen', 0.8); cue(runT - 0.25, 'doorslam', 1.1);
  cue(runT, 'pop', 0.5); for (let k = 0; k < 6; k++) cue(runT - 0.05 + k * 0.13, 'stairstep', 0.8);
  cue(relT, 'pop', 0.5); cue(relT + 0.05, 'lever', 1); cue(lampT - 0.1, 'ignite', 1.1); cue(lampT + 0.3, 'lamphum', 0.9);
  const sA = runT - 0.12, iA = relT - 0.16;
  S.push({ a: hA, b: sA, fade: 0.35, draw: (g, t) => {
    const E = envAt(t); const k = inv(hA, sA, t);
    const cam = { x: lerp(-2.3, -2.9, k), y: lerp(2.1, 1.8, k), z: lerp(32, 41.5, eio(k)), hy: 930, f: F_ROAD };
    const ex = [], yz = yZ5(t), inK = ss(insT + 0.05, insT + 0.35, t);
    if (inK < 1) ex.push(keeperSprite(yz, lerp(pathX(yz), LH.x, inv(46, doorZ, yz)), yr(t) < 1 ? walkPose((yz - 40.5) / YSTRIDE * TAU * 2, 1, 1) : standPose(t), 180, { expr: 'scared', after: null }));
    // it races along the shore rocks in the dark
    const mz = lerp(36, 47, inv(hA, sA, t)), mx = shoreX(mz) - 0.6;
    ex.push(underSprite(mz, mx, crawlPose((t - hA) * 2.6 * TAU, 1, t), yawCrawl(-0.3, 1), { crawl: 1, fogMul: 0.4, dark: 0.25, eyeGlow: 1, drip: 1 }));
    footCues; const door = ss(insT - 0.1, insT + 0.1, t) * (1 - ss(runT - 0.4, runT - 0.2, t));
    coastScene(g, cam, E, ex, { lh: { lamp: 0, doorOpen: door, doorGlow: 0 }, dock: false });
    if (inK > 0 && inK < 1) { const p = proj(cam, LH.x, 0, yz); if (p) { g.save(); g.globalAlpha = 1 - inK; drawRig(g, KEEPER, standPose(t), p[0], p[1], p[2], 180, { t }); g.restore(); } }
    vignette(g, 0.55); ui5(g, t);
  } });
  S.push({ a: sA, b: iA, fade: 0.12, draw: (g, t) => {
    const E = envAt(t); const k = inv(sA, iA, t), scroll = k * 5.4 * 70 + 380;
    const stepAt = stairCutaway(g, E, scroll, t);
    const pos = 9.3 + k * 5.4, i = Math.floor(pos), f = pos - i, a = stepAt(i), b = stepAt(i + 1), x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f) - Math.sin(f * Math.PI) * 18;
    const dir = Math.floor(i / 8) % 2 ? -1 : 1;
    drawRig(g, KEEPER, walkPose(pos * Math.PI, 1, 1), x, y, 260, dir * 90, { t, expr: 'scared' });
    vignette(g, 0.6); ui5(g, t);
  } });
  S.push({ a: iA, b: cB5, fade: 0.12, draw: (g, t) => {
    const E = envAt(t); const lamp = ss(lampT - 0.15, lampT + 0.35, t), rot = (t - lampT) * BEAM_W * 2;
    g.fillStyle = '#07080c'; g.fillRect(0, 0, W, H);
    lanternView(g, E, t, { hy: 900 }); g.fillStyle = `rgba(4,6,12,${0.35 * (1 - lamp)})`; g.fillRect(0, 0, W, H);
    lanternFrame(g, E, t, lamp);
    const push = 1 + 0.06 * inv(iA, cB5, t); g.save(); g.translate(W / 2, 900); g.scale(push, push); g.translate(-W / 2, -900);
    lensLamp(g, 470, 860, 330, t, lamp, lamp > 0 ? rot : 0);
    // your hand on the lever
    const pull = eio(inv(relT, relT + 0.3, t));
    g.save(); g.translate(880, 1200); g.rotate(lerp(-0.5, 0.5, pull)); g.strokeStyle = '#22242a'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -300); g.stroke(); g.fillStyle = '#b8241e'; ell(g, 0, -310, 34, 34); g.fill();
    g.fillStyle = '#e2b590'; g.strokeStyle = '#141218'; g.lineWidth = 6; rr(g, -60, -360, 120, 110, 40); g.fill(); g.stroke(); g.restore();
    g.fillStyle = KEEPER.hoodie; g.strokeStyle = '#141218'; g.lineWidth = 6; const hx = 880 + Math.sin(lerp(-0.5, 0.5, pull)) * 300, hy = 1200 - Math.cos(lerp(-0.5, 0.5, pull)) * 300;
    poly(g, [[hx + 20, hy + 30], [hx + 80, hy - 30], [W + 40, hy + 380], [W + 40, hy + 560]]); g.fill(); g.stroke();
    g.restore();
    if (lamp > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 470, 860, 1400, [255, 200, 120], 0.2 * lamp); g.restore(); }
    vignette(g, 0.55 - 0.15 * lamp); ui5(g, t);
  } });

  // ===== 6. it climbs the tower (beam on) → its face against the glass, right next to you =====
  const clA = cB5, pressT = ww('climb', 'presses'), faceT = ww('climb', 'face'), glassT = ww('climb', 'glass.'), rightT = ww('next', 'right'), inA = pressT - 0.32;
  const climbY = t => lerp(5.5, 14.8, eio(inv(clA - 0.3, inA + 0.2, t)));
  cue(clA, 'hit', 0.5); footCues(clA, inA, t => (climbY(t) - 5.5) / 0.9 * TAU, 'climbslap', 0.8); cue(ww('climb', 'climbs'), 'bonecrack', 0.5);
  S.push({ a: clA, b: inA, fade: 0.25, draw: (g, t) => {
    const E = envAt(t); const k = inv(clA, inA, t);
    const cam = { x: LH.x + 2.0, y: lerp(4, 7, k), z: LH.z - 11.5, hy: lerp(1950, 1800, k), f: 1250 };
    const cy = climbY(t), cz = LH.z - towerR(cy) - 0.35, ph = (cy - 5.5) / 0.9 * TAU;
    const s = Math.sin(ph);
    const pose = { legL: [40 + 30 * s, 90 + 20 * Math.max(0, s)], legR: [40 - 30 * s, 90 + 20 * Math.max(0, -s)], footL: -20, footR: -20, legSpread: 30,
      armL: [170 + 14 * s, 15, 30, 0], armR: [170 - 14 * s, 15, 30, 0], lean: 4, headPitch: -10 + noise(t * 1.2) * 8, headRoll: 160 + noise(t) * 10, bob: 0, roll: 3 * s, curl: 40 };
    const ex = [{ z: LH.z - LH.r0 - 0.6, draw: underSprite(cz, LH.x + 0.45, pose, 180, { y: cy - 1.5, crawl: 1, noShadow: true, fogMul: 0.2, dark: 0.1, eyeGlow: 1, drip: 1 }).draw }];
    coastScene(g, cam, E, ex, { lh: { lamp: 1 }, beam: { k: 1, ang: beamAngle(t, lampT) }, dock: false });
    vignette(g, 0.6);
  } });
  // inside the lantern room
  const sweep1 = [pressT - 1.25, pressT - 0.45];
  cue(sweep1[0] + 0.1, 'beamwhoosh', 0.7); cue(pressT + 0.05, 'glassthud', 1.1); cue(pressT + 0.1, 'sting', 0.8); cue(faceT, 'squeak', 0.9); cue(glassT, 'glassthud', 0.8); cue(glassT + 0.4, 'squeak', 0.5); cue(rightT, 'heartbeat', 0.9); cue(rightT + 0.1, 'breath', 0.7);
  const iB = L('next').end + 0.12;
  S.push({ a: inA, b: iB, fade: 0.2, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#07080c'; g.fillRect(0, 0, W, H);
    const sw = inv(sweep1[0], sweep1[1], t), swK = Math.sin(sw * Math.PI);
    const push = ss(rightT - 0.2, L('next').end, t);
    g.save(); g.translate(700, 1000); const z = 1 + push * 0.22; g.scale(z, z); g.translate(-700, -1000);
    lanternView(g, E, t, { hy: 860, sweep: sw > 0 && sw < 1 ? lerp(-500, W + 500, sw) : null, sweepK: swK });
    // the creature, hanging upside down from the roof outside, slams its face on the glass right next to you
    const slam = eout(inv(pressT - 0.05, pressT + 0.12, t)), fx = 760, fy = 820;
    g.save(); g.beginPath(); g.rect(0, 200, W, 1050); g.clip();
    if (slam > 0) { const yy = lerp(fy - 500, fy, slam);
      g.save(); g.globalAlpha = 0.85; for (const sd of [-1, 1]) limb(g, [[fx + sd * 170, 150], [fx + sd * 300, yy - 300], [fx + sd * 330, yy - 40]], 40, '#6d7c74', UNDER.ink, '#4a5852', 4); g.restore();
      underFaceBig(g, fx, yy, 190, { t, open: 0.25 + 0.2 * Math.sin(t * 2), jitter: 0.25, tilt: 6 + noise(t * 1.3) * 5, look: -0.7, eyeBig: push });
      g.fillStyle = `rgba(230,240,235,${0.16 * slam})`; ell(g, fx, yy - 120, 120, 70); g.fill(); ell(g, fx, yy + 60, 140, 60); g.fill();   // flattened skin on the glass
      handOnGlass(g, fx - 300, yy + 40, 150, 0.4, ss(faceT - 0.05, faceT + 0.1, t), t, 1); handOnGlass(g, fx + 290, yy - 60, 150, -0.35, ss(glassT - 0.05, glassT + 0.1, t), t, 2);
      breathFog(g, fx, yy - 360, 170, t, slam); }
    g.restore();
    lanternFrame(g, E, t, 1);
    lensLamp(g, 150, 860, 300, t, 1, t * BEAM_W * 2);
    // you, sitting on the floor in the light, hands over your head
    drawRig(g, KEEPER, huddlePose(t, 1, { tremble: t > pressT ? 1 : 0.3 }), 560, 1640, 520, 20, { t, expr: t > pressT + 0.3 ? 'closed' : 'scared' });
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 150, 900, 1100, [255, 200, 120], 0.16); g.restore();
    g.restore();
    if (t > pressT && t < pressT + 1) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, 800, 800, [110, 10, 15], 0.18 * (1 - inv(pressT, pressT + 1, t))); g.restore(); }
    vignette(g, 0.6 + 0.1 * push);
  } });

  // ===== 7. split close-up: its face on the glass / you in the light — stay in the light =====
  const dA = iB, dB = L('dawn').start - 0.35, stayT = ww('stay', 'stay.'), inT = ww('stay', 'in.'), lightT = ww('stay', 'light.');
  const sweep2 = [L('next').end + 0.9, L('next').end + 1.5];
  cue(dA, 'hit', 0.5); cue(sweep2[0] + 0.1, 'beamwhoosh', 0.8); cue(sweep2[0] + 0.3, 'hiss', 0.9); cue(stayT, 'heartbeat', 1); cue(inT, 'heartbeat', 1); cue(lightT, 'heartbeat', 1); cue(lightT + 0.4, 'breathstop', 0.6);
  S.push({ a: dA, b: dB, fade: 0, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#05060b'; g.fillRect(0, 0, W, H);
    const sw = inv(sweep2[0], sweep2[1], t), swK = Math.sin(sw * Math.PI), recoil = ss(sweep2[0] + 0.15, sweep2[0] + 0.4, t) * (1 - ss(sweep2[1] + 0.2, sweep2[1] + 1.0, t));
    g.save(); g.beginPath(); g.rect(0, 0, W, 1000); g.clip();
    const bg = g.createLinearGradient(0, 0, 0, 1000); bg.addColorStop(0, '#0a0f1e'); bg.addColorStop(1, '#121a26'); g.fillStyle = bg; g.fillRect(0, 0, W, 1000);
    if (swK > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lerp(-200, W + 200, sw), 500, 700, [255, 236, 180], 0.55 * swK); g.restore(); }
    const pushz = 1 + 0.06 * inv(dA, dB, t); g.save(); g.translate(W / 2, 450); g.scale(pushz, pushz); g.translate(-W / 2, -450);
    const fy = 470 - recoil * 260;
    for (const sd of [-1, 1]) limb(g, [[W / 2 + sd * 200, -60], [W / 2 + sd * 330, fy - 200], [W / 2 + sd * 360, fy + 60 - recoil * 40]], 46, '#6d7c74', UNDER.ink, '#4a5852', 4);
    underFaceBig(g, W / 2, fy, 230, { t, open: 0.2 + recoil * 0.6 + 0.08 * Math.sin(t * 2), jitter: 0.3 + recoil, tilt: -6 + noise(t * 1.2) * 5, look: 0.4, eyeBig: ss(stayT, lightT, t) });
    handOnGlass(g, 150, 560 - recoil * 200, 200, 0.45, 1, t, 3); handOnGlass(g, 930, 500 - recoil * 200, 200, -0.45, 1, t, 4);
    g.restore();
    breathFog(g, W / 2, 330, 260, t, 1 - recoil);
    g.fillStyle = 'rgba(255,220,180,0.04)'; g.fillRect(0, 0, W, 1000); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 30; g.beginPath(); g.moveTo(-50, 600); g.lineTo(500, -50); g.stroke();
    g.restore();
    g.fillStyle = '#1a1b1f'; g.fillRect(0, 990, W, 40); g.fillStyle = '#8d8f94'; g.fillRect(0, 985, W, 10);
    const pulse = [stayT, inT, lightT].reduce((a, b) => a + (t > b ? Math.exp(-(t - b) * 6) : 0), 0);
    g.save(); g.beginPath(); g.rect(0, 1030, W, H - 1030); g.clip(); const ig = g.createLinearGradient(0, 1030, 0, H); ig.addColorStop(0, '#6a4a28'); ig.addColorStop(1, '#2a1c10'); g.fillStyle = ig; g.fillRect(0, 1030, W, H);
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, 1300, 900, [255, 210, 140], 0.35); g.restore();
    keeperFaceBig(g, W / 2, 1520 - pulse * 10, 270 * (1 + 0.04 * pulse + 0.05 * inv(dA, dB, t)), { t, tremble: 0.8 + pulse, lit: 1 }); g.restore();
    if (pulse > 0) { g.fillStyle = `rgba(120,0,0,${0.16 * Math.min(1, pulse)})`; g.fillRect(0, 0, W, H); }
    vignette(g, 0.7);
  } });

  // ===== 8. sunrise: it lets go, slides back into the sea → follow for part 7 =====
  const zA = dB, letT = ww('dawn', 'lets'), slideT = ww('dawn', 'slides'), seaT = ww('dawn', 'sea.'), end = T.duration;
  const ctaT = L('cta').start, fol = ww('cta', 'follow,'), sev = ww('cta', 'seven'), surv = ww('cta', 'survived?');
  const R0 = { x: LH.x + 1.4, z: LH.z - 1.9, y: 15.2 }, R1 = { x: LH.x + 3.6, z: LH.z - 4.0 }, R2 = { x: shoreX(47) + 3.5, z: 47 };
  const fallK = t => ein(inv(letT, letT + 0.55, t));
  const slideK = t => eio(inv(slideT - 0.2, seaT + 0.6, t));
  const sdist = Math.hypot(R2.x - R1.x, R2.z - R1.z);
  cue(L('dawn').start - 0.4, 'birds', 0.8); cue(L('dawn').start - 0.2, 'waves', 0.9); cue(letT + 0.55, 'thud', 0.9); footCues(slideT - 0.2, seaT + 0.6, t => slideK(t) * sdist / CSTRIDE * TAU, 'wetslap', 0.5); cue(seaT + 0.2, 'splash', 0.7);
  cue(ctaT, 'card', 0.7); cue(surv + 0.3, 'like', 0.9); cue(fol, 'follow', 1.0); cue(end - 1.3, 'surface', 0.8); cue(end - 1.2, 'sting', 0.8);
  S.push({ a: zA, b: end + 0.1, fade: 0.35, draw: (g, t) => {
    const back_ = ss(end - 1.4, end - 0.8, t);
    const dawn = 0.85 * ss(zA - 0.3, L('dawn').start + 1.4, t) * (1 - 0.85 * back_);
    const E = envAt(t, dawn);
    const cam = keys([{ t: zA, x: 2.6, y: 4.6, z: 31.5, hy: 960 }, { t: ctaT, x: 3.0, y: 4.2, z: 32.5, hy: 960 }, { t: end, x: 3.2, y: 4.0, z: 33.2, hy: 960 }], t); cam.f = 1000;
    const ex = [];
    const fk = fallK(t), sk = slideK(t);
    let x, z, y, pose, yaw, crawl = 1;
    if (t < letT) { x = R0.x; z = R0.z; y = R0.y; pose = crawlPose(0, 0.2, t); pose.lean = -90; yaw = 160; }
    else if (sk <= 0) { x = lerp(R0.x, R1.x, fk); z = lerp(R0.z, R1.z, fk); y = lerp(R0.y, 0, fk); pose = crawlPose(fk * 3, 0.5, t); yaw = 160 + fk * 60; }
    else { x = lerp(R1.x, R2.x, sk); z = lerp(R1.z, R2.z, sk); const shore = shoreX(z); y = -clamp((x - shore - 0.5) / 3.5) * 2.6; pose = crawlPose(sk * sdist / CSTRIDE * TAU, 1, t); yaw = yawCrawl(R2.x - R1.x, R2.z - R1.z); }
    if (t < seaT + 1.2) ex.push(underSprite(z, x, pose, yaw, { y, water: y < 0, crawl, fogMul: lerp(0.4, 0.9, dawn), dark: 0.15, eyeGlow: 0.6, drip: 1, noShadow: t < letT + 0.5 }));
    // the teaser: its upside-down head breaks the surface again, eyes glowing
    if (t > end - 1.3) { const k = eout(inv(end - 1.3, end - 0.6, t)); ex.push({ z: 38.5, draw: (g, cam, E) => { const p = proj(cam, 4.4, 0, 38.5); if (!p) return; const S_ = p[2] * 0.28;
      g.save(); g.beginPath(); g.rect(0, 0, W, p[1] + S_ * 0.05); g.clip(); underFaceBig(g, p[0], p[1] + lerp(S_ * 1.6, -S_ * 0.15, k), S_, { t, noNeck: true, open: 0.2, eyeBig: k }); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, p[0], p[1] - S_ * 0.1, S_ * 1.5, [150, 240, 230], 0.4 * k); g.fillStyle = rgb(SEA.foam, 0.35 * k); ell(g, p[0], p[1], S_ * 1.1, S_ * 0.12); g.fill(); g.restore(); } }); }
    ex.push(keeperSprite(LH.z - 3.2, LH.x - 1.2, standPose(t), 150, { y: 0, expr: 'scared' }));
    coastScene(g, cam, E, ex, { lh: { lamp: 1 - dawn * 0.8 + back_ * 0.6 }, beam: { k: (1 - dawn) * 0.8 + back_ * 0.5, ang: beamAngle(t, lampT) } });
    vignette(g, 0.45);
    if (t > ctaT - 0.05) {
      bigWord(g, t, ctaT, end + 1, 'WOULD YOU HAVE', '#ffffff', 300, 84); bigWord(g, t, surv, end + 1, 'SURVIVED?', '#ffd23f', 400, 104);
      if (t > surv + 0.3) { const k = popK(t, surv + 0.3, 0.35); g.save(); g.translate(W / 2 - 170, 600); g.scale(k, k); g.fillStyle = '#ff2f55'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-90, -30, -50, -100, 0, -55); g.bezierCurveTo(50, -100, 90, -30, 0, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.restore(); }
      if (t > fol) { const k = popK(t, fol, 0.35); g.save(); g.translate(W / 2 + 90, 590); g.scale(k, k); rr(g, -170, -55, 340, 110, 30); g.fillStyle = '#fe2c55'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ FOLLOW', 0, 3); g.restore(); }
      if (t > sev - 0.05) { const k = popK(t, sev - 0.05, 0.4); g.save(); g.translate(W / 2, 760); g.scale(k, k); rr(g, -190, -48, 380, 96, 24); g.fillStyle = 'rgba(8,8,12,0.88)'; g.fill(); g.strokeStyle = '#c4161c'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 7 SOON', 0, 3); g.restore(); }
    }
  } });
  SHOTS = S;
}

// ---------- frame compositor ----------
let MAIN = null, LAYER = null;
function renderFrame(t) {
  if (!MAIN) { MAIN = document.getElementById('c'); LAYER = mkCanvas(); }
  const g = MAIN.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  const act = SHOTS.filter(s => t >= s.a - s.fade && t < s.b + 1e-6);
  let first = true;
  for (const s of act) {
    const k = s.fade > 0 ? ss(s.a - s.fade, s.a, t) : 1;
    const lg = LAYER.getContext('2d'); lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalAlpha = 1; lg.filter = 'none'; lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, W, H);
    lg.save(); s.draw(lg, t); lg.restore();
    g.save(); g.globalAlpha = first ? 1 : k; g.drawImage(LAYER, 0, 0); g.restore();
    first = false;
  }
  captions(g, t);
}

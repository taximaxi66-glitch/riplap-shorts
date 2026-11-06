// ---------- Part 4: THE FROSTJAW (blind, hunts by sound, face split from chin to forehead) ----------
const FROST = { hipY: 1.2, hipW: 0.13, thigh: 0.66, shin: 0.62, foot: 0.3, spine: 0.76, shW: 0.25, upper: 0.68, fore: 0.66, hand: 0.38, neck: 0.34, headH: 0.5, headW: 0.27,
  skin: '#a3b4c3', shade: '#62748a', ink: '#0d1117', limbW: 0.095, kind: 'frost' };
// the survivor: red parka + mustard beanie
const YOU4 = { ...HUMAN, hoodie: '#a3322b', hoodieS: '#6e1f1b', jeans: '#2b3550', jeansS: '#1d2438', shoe: '#3a2a20', beanie: '#d6a136', beanieS: '#a3761f' };

function icicle(g, x, y, w, l, t, seed) {   // a hanging icicle with a slow drip
  g.fillStyle = 'rgba(215,235,250,0.92)'; g.strokeStyle = 'rgba(20,40,60,0.8)'; g.lineWidth = Math.max(1, w * 0.25);
  g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + w, y); g.lineTo(x + w * 0.1, y + l); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x - w * 0.5, y + l * 0.1, Math.max(1, w * 0.3), l * 0.45);
  const per = 2.2 + (seed % 3) * 0.7, k = ((t + seed * 0.37) % per) / per;
  if (k > 0.55) { const d = (k - 0.55) / 0.45; g.fillStyle = `rgba(210,230,250,${0.8 * (1 - d)})`; ell(g, x + w * 0.1, y + l + d * d * l * 3, w * 0.35, w * 0.5); g.fill(); }
}
function beanie(g, r, hh, ow, R, side) {
  g.save(); g.translate(-side * r * 0.05, 0);
  g.fillStyle = R.beanie; g.strokeStyle = R.ink; g.lineWidth = ow;
  g.beginPath(); g.ellipse(0, -hh * 0.45, r * 1.06, hh * 0.78, 0, Math.PI, TAU); g.closePath(); g.fill(); g.stroke();
  rr(g, -r * 1.1, -hh * 0.55, r * 2.2, hh * 0.3, hh * 0.1); g.fillStyle = R.beanieS; g.fill(); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = Math.max(1, ow * 0.6);
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * r * 0.28, -hh * 0.55); g.lineTo(i * r * 0.22, -hh * 1.05); g.stroke(); }
  g.fillStyle = R.beanie; ell(g, 0, -hh * 1.25, r * 0.3, r * 0.3); g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
  g.restore();
}
function humanBack(g, s, ow, R) {   // back of the head (hood + beanie)
  const r = R.headW * s * 0.55, hh = R.headH * s * 0.5;
  g.fillStyle = R.hoodieS; ell(g, 0, hh * 0.3, r * 1.2, hh * 1.0); g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
  g.fillStyle = R.hair; ell(g, 0, 0, r, hh); g.fill(); g.stroke();
  if (R.beanie) beanie(g, r, hh, ow, R, 0);
}
function frostTorsoDetail(g, R, pel, top, s, wid, opt) {   // frostbite blotches + frost crust on the shoulders
  g.save(); g.fillStyle = 'rgba(35,45,70,0.45)';
  [[0.3, -0.5, 0.06], [0.55, 0.4, 0.05], [0.75, -0.2, 0.04], [0.2, 0.3, 0.035]].forEach(b => { const p = [lerp(pel[0], top[0], b[0]), lerp(pel[1], top[1], b[0])]; ell(g, p[0] + b[1] * wid(2), p[1], b[2] * s, b[2] * s * 0.8); g.fill(); });
  g.fillStyle = 'rgba(230,242,255,0.75)';
  for (let i = 0; i < 7; i++) { const x = lerp(top[0] - wid(3), top[0] + wid(3), i / 6); ell(g, x, top[1] + s * 0.02 + (i % 2) * s * 0.01, s * 0.03, s * 0.015); g.fill(); }
  g.restore();
}
// small head on the rig (front / profile / back). opt.mouth 0..1 = how far the face is split open
function frostHeadSmall(g, R, top, nk, hd, s, ow, yaw, pose, opt) {
  limb(g, [[top[0], top[1]], [lerp(top[0], nk[0], 0.5) + s * 0.02, lerp(top[1], nk[1], 0.5)], [nk[0], nk[1]]], 0.055 * s, R.skin, R.ink, R.shade, ow);
  const cy_ = Math.cos(yaw * D2R), front = Math.abs(cy_) > 0.55, dir = Math.sin(yaw * D2R) >= 0 ? 1 : -1;
  const hw = R.headW * s * 0.5, hh = R.headH * s * 0.55, m = opt.mouth == null ? 0.15 : opt.mouth, t = opt.t || 0;
  const nAng = Math.atan2(hd[1] - nk[1], hd[0] - nk[0]) + Math.PI / 2, nLen = Math.hypot(hd[0] - nk[0], hd[1] - nk[1]) / s;
  const rotN = front ? clamp(nLen / 0.2) * 0.5 * Math.atan2(Math.sin(nAng), Math.cos(nAng)) : Math.atan2(Math.sin(nAng), Math.cos(nAng));
  g.save(); g.translate(lerp(nk[0], hd[0], 0.6), lerp(nk[1], hd[1], 0.6)); g.rotate(rotN + (pose.headRoll || 0) * D2R);
  // wet black hair strands
  g.strokeStyle = '#0b0e14'; g.lineWidth = Math.max(1.2, s * 0.012); g.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const x = lerp(-hw * 0.9, hw * 0.9, i / 6), l = hh * (1.2 + (i % 3) * 0.35); g.beginPath(); g.moveTo(x * 0.6, -hh * 0.9); g.quadraticCurveTo(x * 1.25, -hh * 0.2, x * 1.15 + Math.sin(t * 1.3 + i) * hw * 0.08, -hh * 0.9 + l); g.stroke(); }
  if (cy_ < -0.55) { ell(g, 0, 0, hw, hh); g.fillStyle = R.shade; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
    g.fillStyle = '#0b0e14'; ell(g, 0, -hh * 0.2, hw * 0.95, hh * 0.85); g.fill(); g.restore(); return; }
  if (front) {
    const gap = hw * 0.75 * m;
    // throat behind the split
    if (m > 0.05) { g.fillStyle = '#3a0a10'; ell(g, 0, 0, gap * 0.75 + hw * 0.1, hh * 0.92); g.fill(); g.fillStyle = '#050102'; ell(g, 0, hh * 0.05, gap * 0.4, hh * 0.6); g.fill(); }
    for (const sd of [-1, 1]) {
      g.save(); g.translate(sd * gap * 0.5, 0); g.rotate(sd * m * 0.12);
      g.beginPath(); g.moveTo(0, -hh); g.bezierCurveTo(sd * hw * 0.8, -hh * 1.05, sd * hw * 1.1, -hh * 0.2, sd * hw * 0.85, hh * 0.45); g.quadraticCurveTo(sd * hw * 0.5, hh * 1.05, 0, hh); g.lineTo(0, -hh); g.closePath();
      g.fillStyle = sd < 0 ? R.shade : R.skin; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
      // eyeless socket dent
      g.fillStyle = 'rgba(30,40,60,0.55)'; ell(g, sd * hw * 0.42, -hh * 0.3, hw * 0.22, hh * 0.12, sd * 0.2); g.fill();
      if (m > 0.05) { g.fillStyle = '#e9e4d2'; for (let k = 0; k < 6; k++) { const y = lerp(-hh * 0.75, hh * 0.75, k / 5); poly(g, [[0, y - hh * 0.06], [0, y + hh * 0.06], [-sd * hw * 0.22 * m - sd * 1, y]]); g.fill(); } }
      g.restore();
    }
    if (m <= 0.05) { g.strokeStyle = '#2a0c10'; g.lineWidth = Math.max(1.5, ow * 1.2); g.beginPath(); g.moveTo(0, -hh * 0.95); for (let k = 1; k <= 8; k++) g.lineTo(Math.sin(k * 2.3) * hw * 0.05, lerp(-hh * 0.95, hh * 0.95, k / 8)); g.stroke(); }
    icicle(g, -hw * 0.3 - gap * 0.5, hh * 0.85, hw * 0.08, hh * 0.35, t, 3); icicle(g, hw * 0.35 + gap * 0.5, hh * 0.7, hw * 0.07, hh * 0.28, t, 5);
  } else {
    g.scale(dir, 1);
    g.beginPath(); g.moveTo(-hw * 0.8, -hh * 0.4); g.bezierCurveTo(-hw * 0.6, -hh * 1.1, hw * 0.8, -hh * 1.1, hw * 0.95, -hh * 0.1);
    g.lineTo(hw * (0.95 + m * 0.3), hh * (0.1 + m * 0.2)); g.lineTo(hw * 0.4, hh * 0.3); g.lineTo(hw * (0.85 + m * 0.2), hh * (0.55 + m * 0.4)); g.quadraticCurveTo(hw * 0.2, hh * 1.15, -hw * 0.4, hh * 0.7); g.quadraticCurveTo(-hw * 0.95, hh * 0.2, -hw * 0.8, -hh * 0.4); g.closePath();
    g.fillStyle = R.skin; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
    g.fillStyle = '#1a0507'; poly(g, [[hw * (0.95 + m * 0.3), hh * (0.1 + m * 0.2)], [hw * 0.4, hh * 0.3], [hw * (0.85 + m * 0.2), hh * (0.55 + m * 0.4)]]); g.fill();
    g.fillStyle = 'rgba(30,40,60,0.55)'; ell(g, hw * 0.45, -hh * 0.35, hw * 0.18, hh * 0.1); g.fill();
    icicle(g, hw * 0.3, hh * 0.85, hw * 0.08, hh * 0.35, t, 4);
  }
  g.restore();
}

// ---------- the big close-up face ----------
function frostFaceBig(g, cx, cy, S, o = {}) {   // S = px per unit; head ~2.3 units tall. o.open 0..1 splits the face apart
  const t = o.t || 0, m = clamp(o.open || 0), jit = o.jitter || 0;
  g.save(); g.translate(cx + noise(t * 23) * jit * S * 0.05, cy + noise(t * 19 + 4) * jit * S * 0.04); g.rotate((o.tilt || 0) * D2R + noise(t * 17 + 9) * jit * 0.03);
  const ink = '#0c1016', skin = '#a9bac9', shade = '#6e8196', dark = '#55667a';
  // neck with tendons
  g.fillStyle = skin; g.strokeStyle = ink; g.lineWidth = S * 0.025;
  poly(g, [[-S * 0.24, S * 0.7], [S * 0.24, S * 0.7], [S * 0.34, S * 2.8], [-S * 0.34, S * 2.8]]); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(40,55,75,0.55)'; g.lineWidth = S * 0.014;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-S * 0.15 + i * S * 0.1, S * 0.85); g.lineTo(-S * 0.2 + i * S * 0.13, S * 2.6); g.stroke(); }
  // hair behind
  g.strokeStyle = '#080a10'; g.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const x = lerp(-0.62, 0.62, i / 15) * S, l = S * (1.6 + hash(i) * 1.0); g.lineWidth = S * (0.03 + hash(i + 3) * 0.03);
    g.beginPath(); g.moveTo(x * 0.5, -S * 1.05); g.bezierCurveTo(x * 1.5, -S * 0.7, x * 1.35 + Math.sin(t * 1.1 + i) * S * 0.04, -S * 0.1, x * 1.25 + Math.sin(t * 0.9 + i * 2) * S * 0.06, -S * 1.0 + l); g.stroke(); }
  const gap = S * (0.05 + 0.75 * m), rot = m * 0.16;
  // the inside: red-black throat with ridges
  if (m > 0.02) {
    const tg = g.createRadialGradient(0, S * 0.05, 0, 0, S * 0.05, S * 1.0); tg.addColorStop(0, '#000'); tg.addColorStop(0.45, '#2a0509'); tg.addColorStop(1, '#6b1620');
    g.fillStyle = tg; ell(g, 0, 0, gap * 0.62 + S * 0.08, S * 1.02); g.fill();
    g.strokeStyle = 'rgba(140,40,50,0.6)'; g.lineWidth = S * 0.018;
    for (let k = 0; k < 7; k++) { const y = lerp(-S * 0.75, S * 0.75, k / 6), w = (gap * 0.55 + S * 0.05) * Math.sqrt(1 - (y / S) ** 2 * 0.9); g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + S * 0.05, w, y); g.stroke(); }
  }
  // two halves of the face
  for (const sd of [-1, 1]) {
    g.save(); g.translate(sd * gap * 0.5, 0); g.rotate(sd * rot);
    const half = () => { g.beginPath(); g.moveTo(0, -S * 1.12); g.bezierCurveTo(sd * S * 0.62, -S * 1.15, sd * S * 0.7, -S * 0.35, sd * S * 0.58, S * 0.2); g.bezierCurveTo(sd * S * 0.5, S * 0.7, sd * S * 0.25, S * 1.02, 0, S * 1.05);
      for (let k = 12; k >= 0; k--) g.lineTo(sd * (Math.sin(k * 2.7) * S * 0.018 + (k % 2) * S * 0.012), lerp(-S * 1.12, S * 1.05, k / 12)); g.closePath(); };
    half();
    const gr = g.createLinearGradient(-S * 0.6, 0, S * 0.6, 0); gr.addColorStop(0, shade); gr.addColorStop(0.5, skin); gr.addColorStop(1, dark);
    g.fillStyle = gr; g.fill(); g.lineWidth = S * 0.03; g.strokeStyle = ink; g.stroke();
    g.save(); half(); g.clip();
    // eyeless: smooth sunken socket with skin grown over it
    const ex = sd * S * 0.3, ey = -S * 0.35;
    const sg = g.createRadialGradient(ex, ey, 0, ex, ey, S * 0.22); sg.addColorStop(0, 'rgba(25,35,55,0.85)'); sg.addColorStop(0.7, 'rgba(50,65,90,0.4)'); sg.addColorStop(1, 'rgba(90,110,130,0)');
    g.fillStyle = sg; ell(g, ex, ey, S * 0.22, S * 0.15, sd * 0.25); g.fill();
    g.strokeStyle = 'rgba(30,40,55,0.7)'; g.lineWidth = S * 0.012; g.beginPath(); g.moveTo(ex - S * 0.12, ey); g.quadraticCurveTo(ex, ey + S * 0.035, ex + S * 0.12, ey); g.stroke();
    // frostbite blotches + veins
    g.fillStyle = 'rgba(40,50,80,0.4)'; ell(g, sd * S * 0.35, S * 0.35, S * 0.12, S * 0.09); g.fill(); ell(g, sd * S * 0.2, -S * 0.8, S * 0.08, S * 0.06); g.fill();
    g.strokeStyle = 'rgba(50,70,120,0.55)'; g.lineWidth = S * 0.01;
    for (let v = 0; v < 3; v++) { g.beginPath(); g.moveTo(sd * S * 0.04, -S * 0.6 + v * S * 0.5); g.quadraticCurveTo(sd * S * 0.2, -S * 0.5 + v * S * 0.5, sd * S * (0.3 + v * 0.05), -S * 0.65 + v * S * 0.55); g.stroke(); }
    // frost crust along the outer edge
    g.fillStyle = 'rgba(235,245,255,0.7)';
    for (let k = 0; k < 9; k++) { const a = -1.3 + k * 0.3; ell(g, sd * Math.cos(a) * S * 0.55, Math.sin(a) * S * 0.95, S * 0.05, S * 0.025, a); g.fill(); }
    g.restore();
    // needle teeth along the split edge
    if (m > 0.02) { for (let k = 0; k < 14; k++) { const y = lerp(-S * 0.95, S * 0.9, k / 13), l = S * (0.07 + (k % 3) * 0.035) * Math.min(1, m * 3);
      g.fillStyle = k % 4 === 1 ? '#c9c0a2' : '#eae5d2'; g.strokeStyle = ink; g.lineWidth = S * 0.006; poly(g, [[0, y - S * 0.035], [0, y + S * 0.035], [-sd * l, y + S * 0.01]]); g.fill(); g.stroke(); } }
    g.restore();
  }
  // icy drool strings across the split
  if (m > 0.15) { g.strokeStyle = 'rgba(200,220,240,0.55)'; g.lineWidth = S * 0.012;
    for (let k = 0; k < 4; k++) { const y = -S * 0.5 + k * S * 0.38, sag = S * (0.1 + k * 0.05) * (1 + 0.2 * Math.sin(t * 2 + k)); g.beginPath(); g.moveTo(-gap * 0.5, y); g.quadraticCurveTo(0, y + sag, gap * 0.5, y); g.stroke(); } }
  // icicles hanging from the chin halves
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) icicle(g, sd * (gap * 0.5 + S * (0.08 + k * 0.12)), S * (1.0 - k * 0.06), S * 0.035, S * (0.18 + (k % 2) * 0.14), t, k + (sd > 0 ? 3 : 0));
  // cold breath from inside
  if (o.breath) { const b = 0.5 + 0.5 * Math.sin(t * 2.4); g.fillStyle = `rgba(220,232,248,${0.12 * o.breath * (0.5 + b)})`; ell(g, 0, S * 1.2 + b * S * 0.2, S * (0.4 + b * 0.25), S * 0.25); g.fill(); }
  g.restore();
}

// ---------- your face on the ice: eyes shut, sleeve over the mouth ----------
function youFaceBig4(g, cx, cy, S, o = {}) {
  const t = o.t || 0, tr = o.tremble || 0, ink = '#141218';
  g.save(); g.translate(cx + noise(t * 30) * tr * S * 0.02, cy + noise(t * 27 + 3) * tr * S * 0.015);
  // hood + snow around
  g.fillStyle = YOU4.hoodieS; ell(g, 0, S * 0.1, S * 1.25, S * 1.3); g.fill(); g.strokeStyle = ink; g.lineWidth = S * 0.025; g.stroke();
  const fg = g.createLinearGradient(-S, 0, S, 0); fg.addColorStop(0, '#d29f7f'); fg.addColorStop(0.5, '#e3b493'); fg.addColorStop(1, '#a57659');
  ell(g, 0, S * 0.15, S * 0.78, S * 0.95); g.fillStyle = fg; g.fill(); g.stroke();
  // red cold cheeks
  g.fillStyle = 'rgba(220,80,80,0.25)'; ell(g, -S * 0.45, S * 0.35, S * 0.18, S * 0.12); g.fill(); ell(g, S * 0.45, S * 0.35, S * 0.18, S * 0.12); g.fill();
  // beanie
  g.fillStyle = YOU4.beanie; g.beginPath(); g.ellipse(0, -S * 0.32, S * 0.86, S * 0.75, 0, Math.PI, TAU); g.closePath(); g.fill(); g.stroke();
  rr(g, -S * 0.9, -S * 0.42, S * 1.8, S * 0.3, S * 0.1); g.fillStyle = YOU4.beanieS; g.fill(); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = S * 0.02; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * S * 0.19, -S * 0.42); g.lineTo(i * S * 0.15, -S * 0.95); g.stroke(); }
  // frost on the eyebrows / lashes
  g.strokeStyle = '#2a1a10'; g.lineWidth = S * 0.06; g.lineCap = 'round';
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * S * 0.12, -S * 0.05); g.lineTo(sx * S * 0.48, S * 0.04); g.stroke(); }
  g.strokeStyle = 'rgba(235,245,255,0.8)'; g.lineWidth = S * 0.02; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * S * 0.15, -S * 0.08); g.lineTo(sx * S * 0.45, S * 0.0); g.stroke(); }
  // squeezed eyes
  g.strokeStyle = ink; g.lineWidth = S * 0.04;
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(sx * S * 0.5, S * 0.16); g.quadraticCurveTo(sx * S * 0.32, S * 0.26, sx * S * 0.14, S * 0.16); g.stroke();
    g.lineWidth = S * 0.018; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(sx * S * (0.52 + k * 0.02), S * (0.12 + k * 0.05)); g.lineTo(sx * S * (0.62 + k * 0.02), S * (0.09 + k * 0.06)); g.stroke(); } g.lineWidth = S * 0.04;
  }
  g.lineWidth = S * 0.025; g.beginPath(); g.moveTo(0, S * 0.22); g.quadraticCurveTo(S * 0.1, S * 0.42, -S * 0.02, S * 0.46); g.stroke();
  // the sleeve pressed over the mouth
  const sl = o.sleeve == null ? 1 : o.sleeve;
  if (sl > 0) {
    g.save(); g.translate(lerp(S * 1.6, 0, eout(sl)), lerp(S * 1.0, 0, eout(sl)));
    g.fillStyle = YOU4.hoodie; g.strokeStyle = ink; g.lineWidth = S * 0.03;
    poly(g, [[-S * 0.55, S * 0.5], [S * 0.45, S * 0.45], [S * 1.6, S * 1.3], [S * 1.2, S * 1.9], [-S * 0.5, S * 0.95]]); g.fill(); g.stroke();
    rr(g, -S * 0.62, S * 0.45, S * 0.3, S * 0.52, S * 0.1); g.fillStyle = YOU4.hoodieS; g.fill(); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = S * 0.018; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(S * (0.0 + k * 0.3), S * 0.55); g.lineTo(S * (0.15 + k * 0.3), S * 0.95); g.stroke(); }
    // frost on the sleeve
    g.fillStyle = 'rgba(235,245,255,0.6)'; for (let k = 0; k < 6; k++) { ell(g, S * (-0.4 + k * 0.17), S * (0.5 + (k % 2) * 0.05), S * 0.03, S * 0.015); g.fill(); }
    g.restore();
  }
  // sweat drop
  const sw = (t * 0.25) % 1; g.fillStyle = 'rgba(200,225,255,0.85)'; g.beginPath(); const sx = S * 0.62, sy = -S * 0.02 + sw * S * 0.4;
  g.moveTo(sx, sy - S * 0.06); g.quadraticCurveTo(sx + S * 0.04, sy, sx, sy + S * 0.03); g.quadraticCurveTo(sx - S * 0.04, sy, sx, sy - S * 0.06); g.fill();
  g.restore();
}

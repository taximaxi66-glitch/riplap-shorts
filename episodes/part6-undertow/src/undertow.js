// ---------- Part 6: THE UNDERTOW (crawls out of the sea bent backwards, head upside down; can't touch the light) ----------
const UNDER = { hipY: 1.5, hipW: 0.12, thigh: 0.76, shin: 0.74, foot: 0.3, spine: 0.8, shW: 0.25, upper: 0.86, fore: 0.8, hand: 0.42, neck: 0.3, headH: 0.5, headW: 0.3,
  skin: '#7f8e86', shade: '#4d5c57', ink: '#0a0e0f', limbW: 0.08, kind: 'under' };
// the keeper: yellow raincoat, navy beanie, dark boots
const KEEPER = { ...HUMAN, hoodie: '#d9a62a', hoodieS: '#9c7417', jeans: '#28324a', jeansS: '#1c2336', shoe: '#2a2420', hair: '#3a2416', beanie: '#2d3c5c', beanieS: '#1d2840' };

function poseLerp(a, b, k) { const o = {}; for (const p in a) { const v = a[p], w = b[p] == null ? v : b[p]; o[p] = Array.isArray(v) ? v.map((x, i) => lerp(x, w[i] == null ? x : w[i], k)) : lerp(v, w, k); } return o; }
// bent-backwards crawl (belly up, travels head first toward -z of the rig). ph = cycle phase
function crawlPose(ph, A = 1, t = 0) {
  const s = Math.sin(ph), c = Math.cos(ph), lift = k => Math.max(0, k);
  return { legL: [52 + 14 * s * A, 86 + 22 * lift(c) * A], legR: [52 - 14 * s * A, 86 + 22 * lift(-c) * A], footL: -20, footR: -20, legSpread: 24,
    armL: [-118 - 16 * s * A - 10 * lift(-c) * A, 112 + 10 * lift(-c) * A, 34, 0], armR: [-118 + 16 * s * A - 10 * lift(c) * A, 112 + 10 * lift(c) * A, 34, 0],
    lean: -122 + 3 * Math.sin(2 * ph), headPitch: 300 + 8 * Math.sin(ph + 1) + noise(t * 1.3) * 6, headRoll: noise(t * 0.9 + 3) * 10 + Math.pow(Math.max(0, noise(t * 0.8 + 7)), 3) * 40,
    bob: -0.42 + 0.03 * Math.cos(2 * ph) * A, roll: 4 * s * A, curl: -30 };
}
// standing tall: hunched, arms hanging past the knees, head upside down on the neck
function standU(t, o = {}) {
  const jerk = Math.pow(Math.max(0, noise(t * 0.8 + 7)), 3) * 38;
  return { legL: [-4, 12], legR: [6, 14], footL: 0, footR: 0, legSpread: 4, armL: [-6 + noise(t * 0.7) * 5, 10, 12, 0], armR: [-4 + noise(t * 0.6 + 3) * 5, 12, 12, 0],
    lean: (o.lean == null ? 14 : o.lean) + noise(t * 0.4) * 2, headPitch: (o.headPitch == null ? 8 : o.headPitch) + noise(t * 0.9) * 4, headRoll: (o.headRoll || 0) + noise(t * 1.3 + 5) * 8 + jerk * (o.twitchy == null ? 1 : o.twitchy),
    bob: Math.sin(t * 1.3) * 0.01, roll: noise(t * 0.5) * 2, curl: 25 + noise(t * 2) * 15 };
}
const CSTRIDE = 2 * 2 * (UNDER.thigh + UNDER.shin) * Math.sin(14 * D2R) * 1.6;   // ground covered per crawl cycle (m)

function underTorsoDetail(g, R, pel, top, s, wid, opt) {   // barnacles, wet sheen, seaweed hanging off it
  g.save();
  g.fillStyle = 'rgba(30,40,38,0.45)';
  [[0.3, -0.5, 0.05], [0.55, 0.45, 0.045], [0.78, -0.15, 0.04]].forEach(b => { const p = [lerp(pel[0], top[0], b[0]), lerp(pel[1], top[1], b[0])]; ell(g, p[0] + b[1] * wid(2), p[1], b[2] * s, b[2] * s * 0.7); g.fill(); });
  // barnacle cluster near the shoulders
  const bp = [lerp(pel[0], top[0], 0.85) + wid(3) * 0.4, lerp(pel[1], top[1], 0.85)];
  for (let i = 0; i < 6; i++) { const x = bp[0] + (hash(i) - 0.5) * s * 0.12, y = bp[1] + (hash(i + 4) - 0.5) * s * 0.08, r = s * (0.012 + hash(i + 9) * 0.012);
    g.fillStyle = '#c9c7b4'; ell(g, x, y, r, r); g.fill(); g.fillStyle = '#1b1d1a'; ell(g, x, y, r * 0.4, r * 0.4); g.fill(); }
  // wet sheen along the body
  g.strokeStyle = 'rgba(200,230,235,0.28)'; g.lineWidth = Math.max(1, s * 0.012); g.lineCap = 'round';
  g.beginPath(); g.moveTo(lerp(pel[0], top[0], 0.15) - wid(1) * 0.5, lerp(pel[1], top[1], 0.15)); g.lineTo(lerp(pel[0], top[0], 0.8) - wid(2) * 0.6, lerp(pel[1], top[1], 0.8)); g.stroke();
  // seaweed strands hanging (gravity = down on screen)
  const t = opt.t || 0;
  for (let i = 0; i < 4; i++) { const k = 0.3 + i * 0.18, p = [lerp(pel[0], top[0], k) + (i % 2 ? 1 : -1) * wid(2) * 0.6, lerp(pel[1], top[1], k)], L = s * (0.18 + hash(i + 2) * 0.22);
    g.strokeStyle = 'rgba(22,44,30,0.95)'; g.lineWidth = Math.max(1.2, s * 0.012); g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + Math.sin(t * 1.7 + i) * s * 0.03, p[1] + L * 0.5, p[0] + Math.sin(t * 1.3 + i * 2) * s * 0.05, p[1] + L); g.stroke(); }
  g.restore();
}
function underLimbDetail(g, R, p, w, opt, isArm) {
  const t = opt.t || 0, j = p[1];
  for (let i = 0; i < 4; i++) { const x = j[0] + (hash(i + isArm * 7) - 0.5) * w * 1.3, y = j[1] + (hash(i + 3 + isArm) - 0.5) * w * 1.0, r = w * (0.12 + hash(i + 11) * 0.1);
    g.fillStyle = '#c3c1ad'; ell(g, x, y, r, r); g.fill(); g.fillStyle = '#161816'; ell(g, x, y, r * 0.4, r * 0.4); g.fill(); }
  const L = w * (2.2 + isArm * 1.2), q = [lerp(p[1][0], p[2][0], 0.35), lerp(p[1][1], p[2][1], 0.35)];
  g.strokeStyle = 'rgba(20,42,28,0.95)'; g.lineWidth = Math.max(1.2, w * 0.14); g.lineCap = 'round';
  g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(q[0] + Math.sin(t * 1.9 + isArm) * w * 0.4, q[1] + L * 0.5, q[0] + Math.sin(t * 1.4 + isArm * 3) * w * 0.7, q[1] + L); g.stroke();
}
// inverted face, small (on the rig). On screen the chin is up and the skull + hair hang down.
function underHeadSmall(g, R, top, nk, hd, s, ow, yaw, pose, opt) {
  const t = opt.t || 0, crawl = opt.crawl || 0, flipF = crawl > 0.5 ? -1 : 1;
  const f = Math.cos(yaw * D2R) * flipF, front = f > 0.5, back = f < -0.5, dir = (Math.sin(yaw * D2R) >= 0 ? 1 : -1) * flipF;
  const mid = [lerp(top[0], nk[0], 0.5) + s * 0.03 * Math.sin(t * 0.8), lerp(top[1], nk[1], 0.5)];
  limb(g, [[top[0], top[1]], mid, [nk[0], nk[1]]], 0.062 * s, R.skin, R.ink, R.shade, ow);
  g.strokeStyle = 'rgba(60,18,22,0.75)'; g.lineWidth = Math.max(1, s * 0.006);   // gill slits
  for (let k = 0; k < 3; k++) { const p = [lerp(top[0], nk[0], 0.35 + k * 0.15), lerp(top[1], nk[1], 0.35 + k * 0.15)]; g.beginPath(); g.moveTo(p[0] - s * 0.025, p[1]); g.lineTo(p[0] + s * 0.02, p[1] + s * 0.006); g.stroke(); }
  const hw = R.headW * s * 0.5, hh = R.headH * s * 0.55, mo = opt.mouth == null ? 0.25 : opt.mouth;
  g.save(); g.translate(hd[0], hd[1]); g.rotate((pose.headRoll || 0) * D2R * 0.6);
  // hair hanging from the skull (bottom on screen), wet + stringy
  g.strokeStyle = '#08100c'; g.lineCap = 'round';
  for (let i = 0; i < 11; i++) { const x = lerp(-hw * 0.95, hw * 0.95, i / 10), l = hh * lerp(1.6 + hash(i + 2) * 1.6, 0.7 + hash(i + 2) * 0.5, clamp(crawl)); g.lineWidth = Math.max(1.2, s * (0.009 + hash(i) * 0.008));
    g.beginPath(); g.moveTo(x * 0.8, hh * 0.5); g.quadraticCurveTo(x * 1.1, hh * 1.2, x * 1.05 + Math.sin(t * 1.2 + i) * hw * 0.15, hh * 0.6 + l); g.stroke(); }
  if (back) { g.fillStyle = '#0c1410'; ell(g, 0, hh * 0.1, hw * 0.85, hh * 1.0); g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke(); g.restore(); return; }
  const skin = R.skin;
  if (front) {
    g.beginPath(); g.moveTo(0, -hh * 1.0); g.bezierCurveTo(hw * 0.45, -hh * 1.0, hw * 0.8, -hh * 0.35, hw * 0.85, hh * 0.15); g.bezierCurveTo(hw * 0.9, hh * 0.85, hw * 0.4, hh * 1.05, 0, hh * 1.05);
    g.bezierCurveTo(-hw * 0.4, hh * 1.05, -hw * 0.9, hh * 0.85, -hw * 0.85, hh * 0.15); g.bezierCurveTo(-hw * 0.8, -hh * 0.35, -hw * 0.45, -hh * 1.0, 0, -hh * 1.0); g.closePath();
    g.fillStyle = skin; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
    // mouth near the chin (top): wide upside-down grin, opens into a black hole with needle teeth
    const my = -hh * 0.55, mw = hw * 0.62, mh = hh * (0.08 + mo * 0.5);
    g.fillStyle = '#050304'; g.beginPath(); g.moveTo(-mw, my + hh * 0.18); g.quadraticCurveTo(0, my - mh, mw, my + hh * 0.18); g.quadraticCurveTo(0, my + mh * 0.6 + hh * 0.08, -mw, my + hh * 0.18); g.fill();
    g.fillStyle = '#e4e2d2'; for (let k = 0; k < 7; k++) { const x = lerp(-mw * 0.75, mw * 0.75, k / 6), y = my + hh * 0.05 - (1 - Math.abs(x) / mw) * mh * 0.6; poly(g, [[x - hw * 0.035, y], [x + hw * 0.035, y], [x, y + hh * 0.13]]); g.fill(); }
    // nostrils (pointing up)
    g.fillStyle = '#1a1414'; ell(g, -hw * 0.09, -hh * 0.12, hw * 0.04, hh * 0.05); g.fill(); ell(g, hw * 0.09, -hh * 0.12, hw * 0.04, hh * 0.05); g.fill();
    // sunken sockets + milky glowing eyes (below the nose on screen)
    for (const sd of [-1, 1]) { g.fillStyle = 'rgba(15,22,22,0.7)'; ell(g, sd * hw * 0.36, hh * 0.25, hw * 0.25, hh * 0.2); g.fill();
      if (opt.eyes !== false) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, sd * hw * 0.36, hh * 0.25, hw * 0.4, [170, 240, 235], 0.35); g.restore();
        g.fillStyle = '#dff4ef'; ell(g, sd * hw * 0.36, hh * 0.25, hw * (0.14 + (sd > 0 ? 0.03 : 0)), hh * 0.12); g.fill(); g.fillStyle = '#0d1111'; ell(g, sd * hw * 0.36, hh * 0.25, hw * 0.025, hw * 0.025); g.fill(); } }
    g.strokeStyle = 'rgba(30,40,38,0.6)'; g.lineWidth = Math.max(1, ow * 0.6); g.beginPath(); g.moveTo(-hw * 0.5, hh * 0.55); g.quadraticCurveTo(0, hh * 0.45, hw * 0.5, hh * 0.55); g.stroke();
    g.fillStyle = '#c8c6b2'; for (let i = 0; i < 4; i++) { ell(g, hw * (0.3 + i * 0.1), hh * (0.75 + (i % 2) * 0.1), hw * 0.06, hw * 0.06); g.fill(); }
  } else {
    g.scale(dir, 1);
    g.beginPath(); g.moveTo(hw * 0.2, -hh * 1.0); g.lineTo(hw * 0.75, -hh * 0.75); g.lineTo(hw * 0.85, -hh * 0.3); g.lineTo(hw * 0.95, -hh * 0.05); g.lineTo(hw * 0.8, hh * 0.15);
    g.bezierCurveTo(hw * 0.9, hh * 0.9, -hw * 0.5, hh * 1.15, -hw * 0.8, hh * 0.3); g.bezierCurveTo(-hw * 0.9, -hh * 0.3, -hw * 0.3, -hh * 1.0, hw * 0.2, -hh * 1.0); g.closePath();
    g.fillStyle = skin; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
    g.fillStyle = '#050304'; poly(g, [[hw * 0.8, -hh * (0.62 + mo * 0.2)], [hw * 0.25, -hh * 0.55], [hw * 0.8, -hh * (0.42 - mo * 0.2)]]); g.fill();
    g.fillStyle = 'rgba(15,22,22,0.7)'; ell(g, hw * 0.5, hh * 0.25, hw * 0.22, hh * 0.18); g.fill();
    if (opt.eyes !== false) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, hw * 0.55, hh * 0.25, hw * 0.35, [170, 240, 235], 0.35); g.restore(); g.fillStyle = '#dff4ef'; ell(g, hw * 0.58, hh * 0.25, hw * 0.1, hh * 0.1); g.fill(); }
  }
  g.restore();
}

// ---------- the big close-up: an upside-down drowned face ----------
// S = px per unit. Chin at y≈-1.1 (top), skull down to y≈+1.25, hair hangs further down. The neck rises off the top.
function underFaceBig(g, cx, cy, S, o = {}) {
  const t = o.t || 0, mo = clamp(o.open || 0), jit = o.jitter || 0;
  g.save(); g.translate(cx + noise(t * 23) * jit * S * 0.05, cy + noise(t * 19 + 4) * jit * S * 0.04); g.rotate((o.tilt || 0) * D2R + noise(t * 17 + 9) * jit * 0.03);
  const ink = '#0a0e0f', skin = '#8a998f', shade = '#56665f', dark = '#3c4a45';
  // neck rising to the top of the frame, with gill slits that flutter
  g.fillStyle = shade; g.strokeStyle = ink; g.lineWidth = S * 0.025;
  if (!o.noNeck) { poly(g, [[-S * 0.3, -S * 0.75], [S * 0.3, -S * 0.75], [S * 0.26, -S * 4.5], [-S * 0.26, -S * 4.5]]); g.fill(); g.stroke(); }
  if (!o.noNeck) for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const y = -S * (1.05 + k * 0.28), op = 0.5 + 0.5 * Math.sin(t * 3 + k);
    g.fillStyle = `rgba(70,14,20,${0.6 + 0.3 * op})`; g.beginPath(); g.moveTo(sd * S * 0.05, y); g.quadraticCurveTo(sd * S * 0.18, y + S * (0.04 + 0.05 * op), sd * S * 0.27, y - S * 0.02); g.quadraticCurveTo(sd * S * 0.18, y + S * 0.01, sd * S * 0.05, y); g.fill(); }
  // hair: long, wet, dark green-black, hanging down from the skull
  g.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const x = lerp(-0.85, 0.85, i / 25) * S, l = S * (1.6 + hash(i) * 1.8); g.strokeStyle = i % 5 === 2 ? '#13281b' : '#070c09'; g.lineWidth = S * (0.025 + hash(i + 3) * 0.035);
    g.beginPath(); g.moveTo(x * 0.7, S * 0.6); g.bezierCurveTo(x * 1.25, S * 1.1, x * 1.1 + Math.sin(t * 1.1 + i) * S * 0.06, S * 1.8, x * 1.0 + Math.sin(t * 0.9 + i * 2) * S * 0.1, S * 0.9 + l); g.stroke(); }
  // drips falling from the hair tips
  for (let i = 0; i < 6; i++) { const per = 1.3 + hash(i) * 1.2, k = ((t + i * 0.7) % per) / per, x = lerp(-0.8, 0.8, hash(i + 20)) * S, y0 = S * (2.6 + hash(i) * 1.2);
    g.fillStyle = `rgba(190,225,230,${0.7 * (1 - k)})`; ell(g, x, y0 + k * k * S * 2.5, S * 0.025, S * 0.04); g.fill(); }
  // ---- the head ----
  const hp = () => { g.beginPath(); g.moveTo(0, -S * 1.12); g.bezierCurveTo(S * 0.42, -S * 1.12, S * 0.62, -S * 0.7, S * 0.68, -S * 0.2); g.bezierCurveTo(S * 0.8, S * 0.5, S * 0.7, S * 1.25, 0, S * 1.28);
    g.bezierCurveTo(-S * 0.7, S * 1.25, -S * 0.8, S * 0.5, -S * 0.68, -S * 0.2); g.bezierCurveTo(-S * 0.62, -S * 0.7, -S * 0.42, -S * 1.12, 0, -S * 1.12); g.closePath(); };
  hp(); const gr = g.createLinearGradient(-S * 0.7, 0, S * 0.7, 0); gr.addColorStop(0, shade); gr.addColorStop(0.45, skin); gr.addColorStop(1, dark); g.fillStyle = gr; g.fill(); g.lineWidth = S * 0.03; g.strokeStyle = ink; g.stroke();
  g.save(); hp(); g.clip();
  // mottled drowned skin, veins, barnacles on the skull
  g.fillStyle = 'rgba(40,58,52,0.45)'; [[0.35, 0.8, 0.16], [-0.4, 0.95, 0.12], [0.5, -0.1, 0.1], [-0.2, -0.85, 0.09]].forEach(b => { ell(g, b[0] * S, b[1] * S, b[2] * S, b[2] * S * 0.7); g.fill(); });
  g.strokeStyle = 'rgba(40,60,90,0.4)'; g.lineWidth = S * 0.01; for (let v = 0; v < 6; v++) { const a = v * 1.1; g.beginPath(); g.moveTo(Math.cos(a) * S * 0.2, S * 0.85 + Math.sin(a) * S * 0.1); g.quadraticCurveTo(Math.cos(a) * S * 0.45, S * 0.8 + Math.sin(a * 2) * S * 0.2, Math.cos(a) * S * 0.62, S * 0.7 + Math.sin(a) * S * 0.35); g.stroke(); }
  for (let i = 0; i < 14; i++) { const x = (0.15 + hash(i) * 0.45) * S, y = (0.75 + hash(i + 7) * 0.45) * S, r = S * (0.025 + hash(i + 3) * 0.035);
    g.fillStyle = '#d1cfbb'; g.strokeStyle = ink; g.lineWidth = S * 0.006; ell(g, x, y, r, r); g.fill(); g.stroke(); g.fillStyle = '#1a1c18'; ell(g, x, y, r * 0.38, r * 0.38); g.fill(); }
  // brow wrinkles (below the eyes, since the face is upside down)
  g.strokeStyle = 'rgba(30,42,38,0.6)'; g.lineWidth = S * 0.014;
  for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-S * 0.45, S * (0.5 + k * 0.08)); g.quadraticCurveTo(0, S * (0.42 + k * 0.08), S * 0.45, S * (0.5 + k * 0.08)); g.stroke(); }
  g.restore();
  // eyes: big, milky, pale sea-glass glow, pinhole pupils
  for (const sd of [-1, 1]) {
    const ex = sd * S * 0.3, ey = S * 0.2 + (sd > 0 ? S * 0.03 : 0);
    const sg = g.createRadialGradient(ex, ey, 0, ex, ey, S * 0.27); sg.addColorStop(0, 'rgba(8,14,14,0.95)'); sg.addColorStop(0.65, 'rgba(25,38,36,0.65)'); sg.addColorStop(1, 'rgba(60,80,75,0)');
    g.fillStyle = sg; ell(g, ex, ey, S * 0.27, S * 0.21, sd * 0.15); g.fill();
    const er = S * (0.12 + (sd > 0 ? 0.02 : 0) + (o.eyeBig || 0) * 0.04);
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, ex, ey, S * 0.32, [150, 240, 230], 0.32 + (o.eyeBig || 0) * 0.2); g.restore();
    const eg = g.createRadialGradient(ex - er * 0.3, ey - er * 0.3, 0, ex, ey, er); eg.addColorStop(0, '#f4fffb'); eg.addColorStop(1, '#a9d9d1'); g.fillStyle = eg; ell(g, ex, ey, er, er * 0.85); g.fill(); g.strokeStyle = ink; g.lineWidth = S * 0.012; g.stroke();
    g.fillStyle = '#0b1010'; ell(g, ex + (o.look || 0) * er * 0.4, ey, S * 0.018, S * 0.018); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)'; ell(g, ex - er * 0.35, ey - er * 0.3, er * 0.15, er * 0.1); g.fill();
  }
  // nose: flat, two slits pointing up
  g.fillStyle = '#1a1414'; ell(g, -S * 0.07, -S * 0.22, S * 0.03, S * 0.06, -0.3); g.fill(); ell(g, S * 0.07, -S * 0.22, S * 0.03, S * 0.06, 0.3); g.fill();
  g.strokeStyle = 'rgba(30,40,36,0.7)'; g.lineWidth = S * 0.015; g.beginPath(); g.moveTo(-S * 0.13, -S * 0.12); g.quadraticCurveTo(0, -S * 0.04, S * 0.13, -S * 0.12); g.stroke();
  // the mouth near the chin: a too-wide grin, upside down, opens into a dark pit full of needle teeth
  const my = -S * 0.62, mw = S * 0.56, open = S * (0.06 + mo * 0.62);
  const mp = () => { g.beginPath(); g.moveTo(-mw, my + S * 0.16); g.bezierCurveTo(-mw * 0.5, my - open * 0.9, mw * 0.5, my - open * 0.9, mw, my + S * 0.16); g.bezierCurveTo(mw * 0.5, my + S * 0.08 + open * 0.35, -mw * 0.5, my + S * 0.08 + open * 0.35, -mw, my + S * 0.16); g.closePath(); };
  mp(); const mg = g.createLinearGradient(0, my - open, 0, my + open * 0.4); mg.addColorStop(0, '#2a080b'); mg.addColorStop(0.5, '#030102'); mg.addColorStop(1, '#16050a'); g.fillStyle = mg; g.fill(); g.strokeStyle = '#2b2a28'; g.lineWidth = S * 0.025; g.stroke();
  g.save(); mp(); g.clip();
  for (let k = 0; k < 15; k++) { const a = k / 14, x = lerp(-mw * 0.9, mw * 0.9, a), ytop = my - open * 0.9 * (1 - Math.pow(2 * a - 1, 2)) * 0.75 + S * 0.16 * Math.pow(2 * a - 1, 2), L = S * (0.07 + hash(k) * 0.07 + mo * 0.05);
    g.fillStyle = k % 3 ? '#e9e8da' : '#cfcdb9'; poly(g, [[x - S * 0.022, ytop - S * 0.02], [x + S * 0.022, ytop - S * 0.02], [x + S * 0.004, ytop + L]]); g.fill(); }
  for (let k = 0; k < 13; k++) { const a = k / 12, x = lerp(-mw * 0.85, mw * 0.85, a), ybot = my + S * 0.16 * Math.pow(2 * a - 1, 2) + (S * 0.08 + open * 0.35) * (1 - Math.pow(2 * a - 1, 2)) * 0.75, L = S * (0.06 + hash(k + 30) * 0.06 + mo * 0.05);
    g.fillStyle = k % 4 ? '#e3e1d1' : '#c6c4b0'; poly(g, [[x - S * 0.02, ybot + S * 0.02], [x + S * 0.02, ybot + S * 0.02], [x - S * 0.003, ybot - L]]); g.fill(); }
  g.restore();
  // torn mouth corners running up the cheeks (dark, not gory)
  g.strokeStyle = 'rgba(40,16,18,0.8)'; g.lineWidth = S * 0.02; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * mw, my + S * 0.16); g.lineTo(sd * S * 0.66, my + S * 0.32); g.stroke(); }
  // wet highlights
  g.strokeStyle = 'rgba(225,245,245,0.35)'; g.lineWidth = S * 0.03; g.lineCap = 'round';
  g.beginPath(); g.arc(-S * 0.15, S * 0.75, S * 0.45, 2.2, 2.9); g.stroke(); g.beginPath(); g.arc(S * 0.1, -S * 0.5, S * 0.55, -0.9, -0.5); g.stroke();
  g.restore();
}

// ---------- the keeper's face: eyes shut, lit warm by the lamp ----------
function keeperFaceBig(g, cx, cy, S, o = {}) {
  const t = o.t || 0, tr = o.tremble || 0, ink = '#141218', lit = o.lit == null ? 1 : o.lit;
  g.save(); g.translate(cx + noise(t * 30) * tr * S * 0.02, cy + noise(t * 27 + 3) * tr * S * 0.015);
  // raincoat hood
  g.fillStyle = KEEPER.hoodieS; ell(g, 0, S * 0.15, S * 1.3, S * 1.38); g.fill(); g.strokeStyle = ink; g.lineWidth = S * 0.025; g.stroke();
  g.fillStyle = KEEPER.hoodie; ell(g, 0, S * 0.12, S * 1.18, S * 1.28); g.fill(); g.stroke();
  g.fillStyle = '#4a3a12'; ell(g, 0, S * 0.18, S * 0.96, S * 1.12); g.fill();
  const fg = g.createLinearGradient(-S, 0, S, 0); fg.addColorStop(0, '#f0b585'); fg.addColorStop(0.5, '#e6b996'); fg.addColorStop(1, '#9a6c50');
  ell(g, 0, S * 0.15, S * 0.78, S * 0.98); g.fillStyle = fg; g.fill(); g.stroke();
  // beanie
  g.fillStyle = KEEPER.beanie; g.beginPath(); g.ellipse(0, -S * 0.35, S * 0.86, S * 0.62, 0, Math.PI, TAU); g.closePath(); g.fill(); g.stroke();
  rr(g, -S * 0.88, -S * 0.42, S * 1.76, S * 0.26, S * 0.08); g.fillStyle = KEEPER.beanieS; g.fill(); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = S * 0.015; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * S * 0.24, -S * 0.42); g.lineTo(i * S * 0.18, -S * 0.9); g.stroke(); }
  g.strokeStyle = '#2a1a10'; g.lineWidth = S * 0.06; g.lineCap = 'round';
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * S * 0.12, -S * 0.06); g.lineTo(sx * S * 0.48, S * 0.04); g.stroke(); }
  g.strokeStyle = ink; g.lineWidth = S * 0.04;
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * S * 0.5, S * 0.16); g.quadraticCurveTo(sx * S * 0.32, S * 0.26, sx * S * 0.14, S * 0.16); g.stroke();
    g.lineWidth = S * 0.018; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(sx * S * (0.52 + k * 0.02), S * (0.12 + k * 0.05)); g.lineTo(sx * S * (0.62 + k * 0.02), S * (0.09 + k * 0.06)); g.stroke(); } g.lineWidth = S * 0.04; }
  g.lineWidth = S * 0.025; g.beginPath(); g.moveTo(0, S * 0.22); g.quadraticCurveTo(S * 0.1, S * 0.44, -S * 0.02, S * 0.48); g.stroke();
  g.lineWidth = S * 0.04; g.beginPath(); g.moveTo(-S * 0.2, S * 0.72); g.quadraticCurveTo(0, S * 0.66 + Math.sin(t * 9) * S * 0.01, S * 0.2, S * 0.72); g.stroke();
  // stubble
  g.fillStyle = 'rgba(60,40,30,0.35)'; for (let i = 0; i < 40; i++) { const a = hash(i) * Math.PI, r = S * (0.55 + hash(i + 50) * 0.2); ell(g, Math.cos(a) * r * 0.9, S * 0.3 + Math.sin(a) * r * 0.7, S * 0.01, S * 0.01); g.fill(); }
  // warm lamp light from the left side
  if (lit > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, -S * 1.2, -S * 0.2, S * 1.8, [255, 200, 120], 0.28 * lit); g.restore(); }
  const sw = (t * 0.25) % 1; g.fillStyle = 'rgba(200,225,255,0.85)'; g.beginPath(); const sx = S * 0.5, sy = S * 0.0 + sw * S * 0.4;
  g.moveTo(sx, sy - S * 0.06); g.quadraticCurveTo(sx + S * 0.04, sy, sx, sy + S * 0.03); g.quadraticCurveTo(sx - S * 0.04, sy, sx, sy - S * 0.06); g.fill();
  g.restore();
}

// ---------- THE FOLLOWER: the film ----------
const F_ROAD = 1500;
const CUES = [];  // sound cues collected by the shots: {t, n, v}
function cue(t, n, v = 1) { CUES.push({ t: +t.toFixed(3), n, v }); }
function keys(K, t) {   // eased keyframes
  if (t <= K[0].t) return { ...K[0] }; if (t >= K[K.length - 1].t) return { ...K[K.length - 1] };
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1].t) { const k = eio(inv(K[i].t, K[i + 1].t, t)), o = {}; for (const p in K[i]) o[p] = lerp(K[i][p], K[i + 1][p], k); return o; }
}
function humanIdle(t, o = {}) {
  return { legL: [-2, 4], legR: [3, 5], footL: 0, footR: 0, armL: [-4 + noise(t * 0.7) * 3, 14, 7], armR: [-3 + noise(t * 0.6 + 3) * 3, 16, 7], lean: 4 + noise(t * 0.4) * 1.5,
    headPitch: (o.headPitch || 0) + noise(t * 0.9) * 2, headRoll: (o.headRoll || 0) + noise(t * 1.3 + 5) * 2, bob: Math.sin(t * 2.4) * 0.006, roll: noise(t * 0.5) * 1, curl: 10 };
}
function blendPose(a, b, k) { const o = {}; for (const p in a) { if (Array.isArray(a[p])) o[p] = a[p].map((v, i) => lerp(v, b[p] ? b[p][i] : v, k)); else o[p] = lerp(a[p], b[p] == null ? a[p] : b[p], k); } return o; }
const HSTRIDE = 4 * (HUMAN.thigh + HUMAN.shin) * Math.sin(24 * D2R);   // m per walk cycle (1.43)
const FSTRIDE = HSTRIDE / 2;                                              // the Follower plants a foot on every one of your steps
const YX = 2.3, VW = 1.35;   // your lane + walking speed
// its foot + shin seen up close (world space)
function bigFoot(g, cam, E, ball, o = {}) {
  const hock = [ball[0], ball[1] + 0.62, ball[2] - 0.34], top = [ball[0] + 0.04, ball[1] + 2.4, ball[2] + 0.2];
  const P = [top, hock, ball].map(p => proj(cam, p[0], p[1], p[2])); if (P.some(p => !p)) return;
  const s = P[2][2], ink = FOL.ink;
  const L = scratch(); const lg = L.g; lg.clearRect(0, 0, W, H);
  if (ball[1] < 0.05) { lg.fillStyle = 'rgba(0,0,0,0.5)'; ell(lg, P[2][0] + 0.1 * s, P[2][1] + 0.02 * s, 0.45 * s, 0.07 * s); lg.fill(); }
  // tapered, bony shin from above the frame down to the hock
  const [T, Hk, B] = P, dx = Hk[0] - T[0], dy = Hk[1] - T[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const wT = 0.13 * T[2], wH = 0.055 * s;
  lg.beginPath(); lg.moveTo(T[0] + nx * wT, T[1] + ny * wT);
  lg.quadraticCurveTo((T[0] + Hk[0]) / 2 + nx * wT * 0.55, (T[1] + Hk[1]) / 2 + ny * wT * 0.55, Hk[0] + nx * wH, Hk[1] + ny * wH);
  lg.lineTo(Hk[0] - nx * wH, Hk[1] - ny * wH);
  lg.quadraticCurveTo((T[0] + Hk[0]) / 2 - nx * wT * 0.75, (T[1] + Hk[1]) / 2 - ny * wT * 0.75, T[0] - nx * wT, T[1] - ny * wT); lg.closePath();
  const gr = lg.createLinearGradient(T[0] - nx * wT, 0, T[0] + nx * wT, 0); gr.addColorStop(0, FOL.dark); gr.addColorStop(0.5, FOL.skin); gr.addColorStop(1, FOL.shade);
  lg.fillStyle = gr; lg.fill(); lg.strokeStyle = ink; lg.lineWidth = Math.max(2, s * 0.012); lg.stroke();
  // skin folds + a bony ridge
  lg.save(); lg.clip(); lg.strokeStyle = 'rgba(50,46,42,0.5)'; lg.lineWidth = Math.max(1, s * 0.006);
  for (let i = 1; i < 9; i++) { const k = i / 9, x = lerp(T[0], Hk[0], k), y = lerp(T[1], Hk[1], k), w = lerp(wT, wH, k); lg.beginPath(); lg.moveTo(x - nx * w, y - ny * w); lg.quadraticCurveTo(x + dx / len * w * 0.4, y + dy / len * w * 0.4, x + nx * w * 0.6, y + ny * w * 0.6); lg.stroke(); }
  lg.strokeStyle = 'rgba(230,226,216,0.5)'; lg.lineWidth = Math.max(2, s * 0.012); lg.beginPath(); lg.moveTo(T[0] + nx * wT * 0.4, T[1] + ny * wT * 0.4); lg.lineTo(Hk[0] + nx * wH * 0.3, Hk[1] + ny * wH * 0.3); lg.stroke(); lg.restore();
  // metatarsal + knobbly hock + long toes
  limb(lg, [Hk, B].map(p => [p[0], p[1]]), 0.075 * s, FOL.skin, ink, FOL.shade, Math.max(2, s * 0.012));
  lg.fillStyle = FOL.skin; lg.strokeStyle = ink; lg.lineWidth = Math.max(2, s * 0.01); ell(lg, Hk[0], Hk[1], 0.07 * s, 0.065 * s); lg.fill(); lg.stroke();
  const spread = o.spread == null ? 1 : o.spread;
  for (let i = -1; i <= 1; i++) {
    const tz = ball[2] + (i === 0 ? 0.42 : 0.3), tx = ball[0] + i * 0.2 * spread, tp = proj(cam, tx, 0, tz), mp = proj(cam, lerp(ball[0], tx, 0.55), 0.07 * (1 - spread * 0.5) + ball[1], lerp(ball[2], tz, 0.55));
    if (!tp || !mp) continue; const tb = ball[1] > 0.02 ? [tp[0], tp[1] - ball[1] * tp[2]] : [tp[0], tp[1]];
    limb(lg, [[B[0], B[1]], [mp[0], mp[1]], tb], 0.035 * s, FOL.skin, ink, null, Math.max(1.5, s * 0.009));
    lg.fillStyle = '#1b1612'; ell(lg, tb[0], tb[1] + 0.005 * s, 0.022 * tp[2], 0.012 * tp[2]); lg.fill();
  }
  lg.save(); lg.globalCompositeOperation = 'source-atop'; const lit = o.lit || 0;
  const sg = lg.createLinearGradient(0, T[1], 0, B[1]); sg.addColorStop(0, `rgba(10,14,28,${0.45 - lit * 0.2})`); sg.addColorStop(1, `rgba(255,170,90,${0.08 + lit * 0.15})`); lg.fillStyle = sg; lg.fillRect(0, 0, W, H); lg.restore();
  g.drawImage(L.c, 0, 0);
}
function optionCard(g, t, t0, letter, title, sub, subAt, y, col, out = 1e9) {
  if (t < t0 || t > out + 0.3) return;
  const k = popK(t, t0, 0.35), fo = 1 - ss(out, out + 0.3, t);
  g.save(); g.globalAlpha = clamp((t - t0) / 0.1) * fo; g.translate(W / 2, y); g.scale(k, k);
  const hasSub = sub && t >= subAt, hh = 132;
  rr(g, -450, -hh / 2, 900, hh, 30); g.fillStyle = 'rgba(8,8,12,0.86)'; g.fill(); g.lineWidth = 7; g.strokeStyle = col; g.stroke();
  rr(g, -430, -48, 96, 96, 22); g.fillStyle = col; g.fill();
  g.fillStyle = '#111'; g.font = '900 66px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, -382, 4);
  g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '900 52px Inter';
  if (hasSub) { const sk = clamp((t - subAt) / 0.2); g.fillText(title, -310, -20 * sk + 3); g.globalAlpha *= sk; g.fillStyle = col; g.font = '900 36px Inter'; g.fillText(sub, -310, 34); }
  else g.fillText(title, -310, 3);
  g.restore();
}
function heartFollow(g, t, tH, tF, y, dx = 0) {
  if (t > tH) { const k = popK(t, tH, 0.35); g.save(); g.translate(W / 2 - 200 + dx * 0.55, y); g.scale(k * (dx ? 0.8 : 1), k * (dx ? 0.8 : 1)); g.fillStyle = '#ff2f55'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-90, -30, -50, -100, 0, -55); g.bezierCurveTo(50, -100, 90, -30, 0, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.restore(); }
  if (t > tF) { const k = popK(t, tF, 0.35); g.save(); g.translate(W / 2 + 80 + dx * 0.72, y - 10 * (dx ? 0 : 1)); g.scale(k * (dx ? 0.8 : 1), k * (dx ? 0.8 : 1)); rr(g, -170, -55, 340, 110, 30); g.fillStyle = '#fe2c55'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ FOLLOW', 0, 3); g.restore(); }
}
function commentChip(g, t, t0, y, t1 = 1e9, cx = W / 2) {
  if (t < t0 || t > t1 + 0.25) return; const k = popK(t, t0, 0.35) * (1 - ss(t1, t1 + 0.25, t));
  g.save(); g.translate(cx, y); g.scale(k * (cx === W / 2 ? 1 : 0.78), k * (cx === W / 2 ? 1 : 0.78)); rr(g, -260, -50, 520, 100, 28); g.fillStyle = 'rgba(8,8,12,0.86)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
  // speech bubble icon
  g.fillStyle = '#ffd23f'; rr(g, -225, -28, 70, 48, 14); g.fill(); poly(g, [[-210, 18], [-190, 18], [-214, 36]]); g.fill();
  g.fillStyle = '#111'; for (let i = 0; i < 3; i++) { ell(g, -205 + i * 15, -4, 5, 5); g.fill(); }
  g.fillStyle = '#fff'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COMMENT', 40, 3); g.restore();
}
// a dark night street as a soft background for close-ups
function streetBokeh(g, t, E, o = {}) {
  const cam = { x: o.x == null ? 0.5 : o.x, y: 1.6, z: o.z == null ? 40 : o.z, hy: o.hy || 900, f: 1500 };
  const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H); streetScene(L.g, cam, E, []);
  g.save(); g.filter = `blur(${o.blur || 7}px)`; g.drawImage(L.c, 0, 0); g.restore();
  g.fillStyle = `rgba(4,6,14,${o.dim == null ? 0.35 : o.dim})`; g.fillRect(0, 0, W, H);
}
function puffs(g, t, x, y, t0, t1, every = 0.9, s = 1) {   // breath vapour
  for (let i = 0; i < 12; i++) { const b = t0 + i * every, age = t - b; if (b > t1 || age < 0 || age > 1.2) continue; g.fillStyle = `rgba(220,230,245,${0.22 * (1 - age / 1.2)})`; ell(g, x + age * 70 * s, y - age * 60 * s, (26 + age * 70) * s, (18 + age * 45) * s); g.fill(); }
}

function fgDetail() { return { z: 26.2, draw: (g, cam, E) => {
  const m = proj(cam, -0.6, 0, 26.2); if (!m) return; const s = m[2];
  // a manhole cover
  g.fillStyle = '#16171b'; ell(g, m[0], m[1], 0.42 * s, 0.42 * s * 0.28); g.fill(); g.strokeStyle = '#2e3036'; g.lineWidth = Math.max(2, s * 0.02); g.stroke();
  g.strokeStyle = 'rgba(80,84,92,0.6)'; g.lineWidth = Math.max(1, s * 0.01); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(m[0] + i * 0.12 * s - 0.2 * s, m[1] - 0.07 * s); g.lineTo(m[0] + i * 0.12 * s + 0.2 * s, m[1] + 0.07 * s); g.stroke(); }
  // a puddle with the lamp's reflection
  const p = proj(cam, 1.9, 0, 25.4); if (!p) return; g.save(); g.translate(p[0], p[1]); g.scale(1, 0.18);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.9 * p[2]); gr.addColorStop(0, 'rgba(60,70,95,0.55)'); gr.addColorStop(1, 'rgba(40,46,62,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 0.9 * p[2], 0.9 * p[2], 0, 0, TAU); g.fill();
  g.globalCompositeOperation = 'lighter'; const sh = Math.sin(E.t * 1.7) * 0.04 * p[2]; g.fillStyle = 'rgba(255,190,110,0.35)'; g.beginPath(); g.ellipse(sh, -0.1 * p[2], 0.08 * p[2], 0.35 * p[2], 0, 0, TAU); g.fill(); g.restore();
} }; }
let SHOTS = [];
function buildShots() {
  const L = id => LN(id), w = (id, k) => WD(id, k), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  const youZ = t => 8 + VW * t;                       // continuous walk through shots 1-2
  const youPh = t => (youZ(t) - 8) / HSTRIDE * TAU;
  // footstep sounds: yours + its heavier steps landing a hair later (the hint)
  const stepTimes = (t0, t1, phf) => { const a = []; let last = null; for (let t = t0; t < t1; t += 1 / 240) { const n = Math.floor((phf(t) / TAU - 0.25) * 2); if (last != null && n !== last) a.push(t); last = n; } return a; };

  // ===== 1. walking home alone (camera behind you) =====
  const s1B = L('steps').start - 0.12;
  stepTimes(0, 8.2, youPh).forEach((x, i) => { cue(x, 'step', 0.55); if (x > 1.0) cue(x + 0.07, 'thud', x < 4 ? 0.25 : 0.45); });
  cue(0.0, 'hum', 0.6); cue(0.3, 'wind', 0.8);
  S.push({ a: 0, b: s1B, fade: 0, draw: (g, t) => {
    const E = envAt(t); const z = youZ(t), ph = youPh(t);
    const cam = { x: 1.4 + Math.sin(t * 0.5) * 0.05, y: 1.85, z: z - 4.4 + t * 0.12, hy: 880 + Math.sin(ph * 2) * 3, f: F_ROAD };
    const pose = walkPose(ph, 1, 0); pose.lean = 4; pose.headPitch = 6;
    const fz = z - 4.75, fo = { t, ...folWalkFeet(ph / TAU - 0.25, FSTRIDE, 0.3), head: [0, 3.0, 1.7], reach: 0 };
    const segs = [{ segs: humanSegs(YX, z, 180, pose), near: [YX, z] }, { segs: folSegs(YX - 2.4, fz, 180, fo), near: [YX - 2.4, fz] }];
    streetScene(g, cam, E, [humanSprite(YX, z, pose, 180)], { under: (g, cam, E) => drawShadows(g, cam, E, segs) });
    vignette(g, 0.55);
    chip(g, t, 0.15, s1B - 0.3, '11:58 PM', '#9fb6ff', 250);
  } });

  // ===== 2. low shot: your sneakers... and a grey foot steps in =====
  const s2A = s1B, s2B = L('stop').start - 0.2, many = ww('many', 'many.'), plantT = many - 0.02;
  const camZ2 = t => { let d = 0; const n = 80, dt = (t - s2A) / n; for (let i = 0; i < n; i++) d += (1 - 0.88 * ss(plantT - 0.6, plantT + 0.3, s2A + (i + 0.5) * dt)) * dt; return youZ(s2A) - 2.4 + VW * d; };
  const footZ = camZ2(plantT) + 1.75;
  cue(plantT, 'thud', 1.1); cue(plantT + 0.05, 'bonecrack', 0.5); cue(plantT - 0.35, 'swing', 0.35); cue(many + 0.1, 'sting', 0.45);
  S.push({ a: s2A, b: s2B, fade: 0.3, draw: (g, t) => {
    const E = envAt(t); const z = youZ(t), ph = youPh(t);
    const cam = { x: 2.05, y: 0.42, z: camZ2(t), hy: 1060, f: 1400 };
    const pose = walkPose(ph, 1, 0); pose.lean = 4;
    const sw = ss(plantT - 0.5, plantT, t);   // swing in from above-left, then planted (locked)
    const ball = [lerp(1.55, 1.72, sw), lerp(2.2, 0, eio(sw)), lerp(footZ - 0.15, footZ, sw)];
    const segs = [{ segs: humanSegs(YX, z, 180, pose), near: [YX, z] }];
    streetScene(g, cam, E, [humanSprite(YX, z, pose, 180, { fogMul: 0.4 })], { under: (g, cam, E) => drawShadows(g, cam, E, segs) });
    if (sw > 0.001) bigFoot(g, cam, E, ball, { lit: 0.2, spread: lerp(0.6, 1, ss(plantT - 0.05, plantT + 0.25, t)) });
    vignette(g, 0.6);
  } });

  // ===== 3a. you stop (close-up of your face) =====
  const s3A = s2B, s3B = L('one').start - 0.08, stopT = ww('stop', 'stop.');
  cue(s3A, 'whoosh', 0.3);
  S.push({ a: s3A, b: s3B, fade: 0.12, draw: (g, t) => {
    const E = envAt(t); streetBokeh(g, t, E, { z: 30, x: 1.0 });
    const zk = 1 + 0.05 * inv(s3A, s3B, t);
    g.save(); g.translate(W / 2, 900); g.scale(zk, zk); g.translate(-W / 2, -900);
    humanFaceOpen(g, W / 2, 880, 330, { t, wide: lerp(0.3, 1, ss(stopT, stopT + 0.25, t)), look: -ss(stopT + 0.4, stopT + 0.8, t) * 0.9, tremble: 0.6 });
    puffs(g, t, W / 2 + 40, 1150, s3A, stopT + 0.1, 0.7);
    g.restore(); vignette(g, 0.65);
  } });

  // ===== 3b. one more step... behind you (low, behind your heels) =====
  const s3bA = s3B, s3bB = L('shadow').start - 0.2, stepT = ww('one', 'step...') + 0.05;
  cue(stepT, 'thud', 1.3); cue(stepT + 0.04, 'bonecrack', 0.7); cue(stepT, 'sting', 0.6); cue(s3bA, 'heartbeat', 0.7);
  S.push({ a: s3bA, b: s3bB, fade: 0.1, draw: (g, t) => {
    const E = envAt(t); const yz = 50.2;
    const cam = { x: 2.55, y: 0.38, z: 47.4 + 0.35 * eio(inv(stepT, s3bB, t)), hy: 1040, f: 1400 };
    const pose = humanIdle(t); pose.legL = [-3, 3]; pose.legR = [4, 4];
    const segs = [{ segs: humanSegs(2.75, yz, 180, pose), near: [2.75, yz] }];
    streetScene(g, cam, E, [humanSprite(2.75, yz, pose, 180, { fogMul: 0.3 })], { under: (g, cam, E) => drawShadows(g, cam, E, segs) });
    const sw = ss(stepT - 0.45, stepT, t);
    if (sw > 0.001) bigFoot(g, cam, E, [lerp(2.15, 2.3, sw), lerp(2.2, 0, eio(sw)), lerp(48.6, 48.75, sw)], { lit: 0.55, spread: lerp(0.6, 1, ss(stepT - 0.05, stepT + 0.25, t)) });
    vignette(g, 0.6);
  } });

  // ===== 4. two shadows on the asphalt =====
  const s4A = s3bB, s4B = L('up').start - 0.08, twoT = ww('shadow', 'two'), tallT = ww('tall', 'tall.');
  cue(s4A, 'whoosh', 0.35); cue(twoT, 'sting', 0.55); cue(tallT - 0.1, 'bonecrack', 0.9); cue(tallT + 0.3, 'twitch', 0.6);
  S.push({ a: s4A, b: s4B, fade: 0.3, draw: (g, t) => {
    const E = envAt(t); const yz = 57, fz = 55.7;
    const cam = { x: 1.9, y: 5.6, z: lerp(52.0, 54.4, eio(inv(s4A + 0.3, tallT + 0.2, t))), hy: -320, f: 1500 };
    const pose = humanIdle(t); const unf = ss(tallT - 0.4, tallT + 0.9, t);
    const fo = { t, footL: [-0.4, 0, 0.15], footR: [0.4, 0, -0.1], head: [0.9 + 0.35 * unf + Math.sin(t * 0.9) * 0.08, lerp(3.0, 2.6, unf), lerp(1.45, 1.6, unf)], reach: unf * 0.8, curl: 0.3 + 0.3 * Math.sin(t * 2), headRoll: noise(t * 2) * 6 };
    const segs = [{ segs: humanSegs(1.5, yz, 180, pose), near: [1.5, yz] }, { segs: folSegs(2.9, fz, 180, fo), near: [2.9, fz] }];
    streetScene(g, cam, E, [], { under: (g, cam, E) => {
      // we stand inside the lamp's warm light: brighten the ground around us
      g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, 'rgba(255,170,90,0.2)'); gr.addColorStop(0.7, 'rgba(255,160,80,0.08)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
      drawShadows(g, cam, E, segs, 1.1); } });
    vignette(g, 0.6);
  } });

  // ===== 5a. you look up =====
  const s5A = s4B, upT = ww('up', 'look'), s5B = L('up').end + 0.42;
  cue(s5A, 'whoosh', 0.3); cue(upT, 'cloth', 0.6); cue(s5A + 0.1, 'breathstop', 0.6);
  S.push({ a: s5A, b: s5B, fade: 0.15, draw: (g, t) => {
    const E = envAt(t); streetBokeh(g, t, E, { z: 30, x: 1.0, hy: lerp(900, 1250, eio(inv(upT, s5B, t))) });
    const k = eio(inv(upT - 0.1, upT + 0.7, t));
    humanFaceOpen(g, W / 2, lerp(900, 1000, k), 340, { t, wide: lerp(0.7, 1, k), up: k, tremble: 0.8 });
    vignette(g, 0.65);
  } });

  // ===== 5b. POV looking up: its face right above yours =====
  const s5bA = s5B, s5bB = L('hand').start - 0.12, bendT = ww('face', 'bending'), faceT = ww('face', 'face,');
  cue(s5bA, 'hit', 0.9); cue(s5bA, 'sting', 0.9); cue(s5bA + 0.05, 'bonecrack', 0.8); cue(bendT, 'creak', 0.5); cue(faceT, 'twitch', 0.7); cue(faceT + 0.6, 'breath', 0.8);
  S.push({ a: s5bA, b: s5bB, fade: 0, draw: (g, t) => {
    const E = envAt(t);
    const cam = { x: 0, y: 1.6, z: 0, hy: 2700, f: 1200 };
    drawSky(g, cam, E); drawBats(g, cam, E);
    // bare branches at the edges + the streetlight head glowing behind it
    drawDeadTree(g, -120, 2300, 2600, E, 0.5, 3); drawDeadTree(g, 1250, 2350, 2400, E, 0.55, 8);
    const lx = 830, ly = 330; g.fillStyle = '#0c0d12'; g.lineWidth = 34; g.strokeStyle = '#0c0d12'; g.beginPath(); g.moveTo(W + 40, 520); g.quadraticCurveTo(980, 300, lx + 60, ly - 10); g.stroke(); ell(g, lx, ly, 130, 42, -0.2); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lx, ly + 20, 520, [255, 180, 100], 0.5); glow(g, lx, ly + 18, 120, [255, 236, 200], 0.9); g.restore();
    const k0 = eout(inv(s5bA, s5bA + 0.35, t)), push = eio(inv(s5bA, s5bB, t));
    // its hunched body mass above, in silhouette
    g.save(); const zk = 1 + 0.12 * push + 0.05 * ss(faceT, faceT + 0.5, t); g.translate(W / 2, 800); g.scale(zk, zk); g.translate(-W / 2, -800);
    g.fillStyle = '#17181d'; ell(g, 360, -160, 560, 420, 0.3); g.fill(); g.strokeStyle = 'rgba(255,190,120,0.35)'; g.lineWidth = 10; g.beginPath(); g.ellipse(360, -160, 560, 420, 0.3, 0.05, 1.1); g.stroke();
    // dangling arms at the sides
    for (const sd of [-1, 1]) { const ax = W / 2 + sd * 430, sway = Math.sin(t * 1.3 + sd) * 12; limb(g, [[ax + sd * 40, -60], [ax + sd * 10 + sway, 420], [ax - sd * 30 + sway, 760]], 46, '#3a3a3c', '#0a0a0c', null, 5);
      for (let f = 0; f < 3; f++) limb(g, [[ax - sd * 30 + sway, 760], [ax - sd * 30 + sway + (f - 1) * 26, 900], [ax - sd * 40 + sway + (f - 1) * 34, 1020 + f * 10]], 16, '#3a3a3c', '#0a0a0c', null, 3); }
    const tilt = lerp(-14, 8, push) + noise(t * 0.7) * 3 + (1 - k0) * 10;
    followerFaceBig(g, W / 2 + 10, lerp(760, 820, push), lerp(250, 270, k0), { t, mouth: lerp(0.12, 0.5, ss(bendT, faceT + 0.8, t)), tilt, jitter: 1.4 * (1 - k0) + 0.25, rim: 1, drool: ss(faceT - 0.4, faceT + 0.6, t), look: 0 });
    g.restore();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, W, H); motes(g, E, 0.5, 3); vignette(g, 0.7);
  } });

  // ===== 6. long grey fingers curl over your shoulder =====
  const s6A = s5bB, s6B = L('copy').start - 0.15, fingT = ww('hand', 'fingers'), curlT = ww('hand', 'curl'), shT = ww('hand', 'shoulder.');
  cue(s6A, 'whoosh', 0.3); cue(curlT, 'cloth', 0.9); cue(curlT + 0.1, 'bonecrack', 0.6); cue(shT + 0.15, 'tap', 0.8); cue(shT + 0.45, 'tap', 0.7);
  S.push({ a: s6A, b: s6B, fade: 0.3, draw: (g, t) => {
    const E = envAt(t); streetBokeh(g, t, E, { z: 58, x: 2.2, hy: 860, blur: 6, dim: 0.3 });
    const tr = noise(t * 25) * 4, tr2 = noise(t * 22 + 3) * 3;
    // you from behind: hood + shoulders
    g.save(); g.translate(tr, tr2);
    g.fillStyle = HUMAN.hoodieS; g.strokeStyle = '#141218'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(-80, H + 40); g.quadraticCurveTo(-40, 1420, 260, 1380); g.lineTo(640, 1390); g.quadraticCurveTo(1060, 1420, 1160, 1650); g.lineTo(1160, H + 40); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = HUMAN.hoodie; g.beginPath(); g.moveTo(560, 1420); g.quadraticCurveTo(980, 1440, 1160, 1700); g.lineTo(1160, H); g.lineTo(560, H); g.fill();
    ell(g, 420, 1180, 300, 360); g.fillStyle = HUMAN.hoodieS; g.fill(); g.stroke();
    ell(g, 430, 1210, 250, 300); g.fillStyle = HUMAN.hoodie; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 6; g.beginPath(); g.moveTo(430, 900); g.quadraticCurveTo(450, 1200, 420, 1500); g.stroke();
    g.restore();
    puffs(g, t, 150, 1100, s6A, s6B, 1.0, -1);
    // the hand: slides down from above, then the fingers curl over the shoulder
    const dk = eio(inv(s6A, curlT, t)), ck = eio(inv(curlT, shT + 0.1, t));
    const wx = lerp(1000, 820, dk), wy = lerp(-200, 1110, dk);
    limb(g, [[1200, -300], [lerp(1150, 960, dk), lerp(-200, 500, dk)], [wx, wy]], 150, FOL.skin, FOL.ink, FOL.shade, 7);
    g.fillStyle = FOL.skin; g.strokeStyle = FOL.ink; g.lineWidth = 7; ell(g, wx - 30, wy + 40, 120, 90, -0.6); g.fill(); g.stroke();
    g.fillStyle = 'rgba(70,64,58,0.35)'; ell(g, wx - 10, wy + 50, 70, 40, -0.6); g.fill();
    for (let f = 0; f < 3; f++) {
      const bx = wx - 110 + f * 70, by = wy + 90 + f * 8;
      let ext = 0; [shT + 0.15, shT + 0.45].forEach((x, i) => { if (i % 3 === f % 3 || f === 1) { const d = t - x; if (d > -0.1 && d < 0.12) ext = Math.max(ext, d < 0 ? 1 + d / 0.1 : 1 - d / 0.12); } });
      const a0 = 1.9 - f * 0.12, a1 = a0 + lerp(0.1, 0.9, ck), a2 = a1 + lerp(0.1, 0.9, ck);
      const L1 = 170 + f * 15, L2 = 150, L3 = 110 + ext * 25;
      const k1 = [bx + Math.cos(a0) * L1, by + Math.sin(a0) * L1], k2 = [k1[0] + Math.cos(a1) * L2, k1[1] + Math.sin(a1) * L2], k3 = [k2[0] + Math.cos(a2) * L3, k2[1] + Math.sin(a2) * L3];
      limb(g, [[bx, by], k1, k2, k3], 42, FOL.skin, FOL.ink, FOL.shade, 5);
      for (const kk of [k1, k2]) { g.fillStyle = FOL.skin; ell(g, kk[0], kk[1], 23, 21); g.fill(); g.strokeStyle = 'rgba(60,50,45,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(kk[0] - 14, kk[1] - 4); g.quadraticCurveTo(kk[0], kk[1] + 6, kk[0] + 14, kk[1] - 4); g.stroke(); }
      g.fillStyle = '#231c18'; ell(g, k3[0], k3[1], 18, 14, a2); g.fill();
      // dent in the fabric where the fingertips press
      if (ck > 0.6) { g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 5; g.beginPath(); g.arc(k3[0], k3[1] + 10, 40, 0.3, Math.PI - 0.3); g.stroke(); }
    }
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, W, H); vignette(g, 0.7);
  } });

  // ===== 7. it copies everything you do (wide, full reveal) =====
  const s7A = s6B, s7B = L('optA').start - 0.2, evT = ww('copy', 'everything'), walkT = ww('copy', 'walk,'), stopT2 = ww('copy', 'stop,');
  const fLag = 0.14;
  const z7 = t => 30 - VW * clamp(t - walkT, 0, stopT2 - walkT);    // you walk toward the camera
  const z7f = t => 31.35 - VW * clamp(t - walkT - fLag, 0, stopT2 - walkT);
  const ph7 = t => (30 - z7(t)) / HSTRIDE * TAU, ph7f = t => (31.35 - z7f(t)) / HSTRIDE * TAU;
  stepTimes(walkT - 0.05, stopT2 + 0.4, ph7).forEach(x => cue(x, 'step', 0.6));
  stepTimes(walkT + fLag - 0.05, stopT2 + fLag + 0.4, ph7f).forEach(x => cue(x, 'thud', 0.8));
  cue(s7A, 'whoosh', 0.4); cue(s7A + 0.1, 'sting', 0.5); cue(evT + 0.2, 'twitch', 0.6); cue(stopT2 + fLag + 0.25, 'bonecrack', 0.7); cue(ww('two', 'two'), 'card', 0.8);
  S.push({ a: s7A, b: s7B, fade: 0.3, draw: (g, t) => {
    const E = envAt(t); const yz = z7(t), fz = z7f(t);
    const cam = { x: 0.35 + 0.15 * inv(s7A, s7B, t), y: 1.45, z: 23.6 - 0.5 * inv(s7A, s7B, t), hy: 700, f: 1750 };
    const tiltY = ss(evT, evT + 0.4, t) * (1 - ss(walkT - 0.4, walkT, t)), tiltF = ss(evT + 0.18, evT + 0.5, t) * (1 - ss(walkT - 0.3, walkT + 0.1, t));
    const walking = t > walkT - 0.05 && t < stopT2 + 0.35;
    let pose = humanIdle(t, { headRoll: -14 * tiltY, headPitch: 4 });
    if (t > walkT - 0.1) { const wp = walkPose(ph7(t), 1, 0); wp.lean = 5; const k = ss(walkT - 0.12, walkT + 0.15, t) * (1 - ss(stopT2, stopT2 + 0.3, t)); pose = blendPose(pose, wp, k); }
    const jerk = t > stopT2 + fLag ? Math.exp(-(t - stopT2 - fLag) * 7) * Math.sin((t - stopT2 - fLag) * 40) : 0;
    const sink = ss(stopT2 + 0.5, s7B, t);
    const feet = folWalkFeet(ph7f(t) / TAU - 0.25, FSTRIDE, 0.32);
    const still = { footL: [-0.4, 0, 0.12], footR: [0.4, 0, -0.08], bob: 0 };
    const wk = ss(walkT + fLag - 0.1, walkT + fLag + 0.1, t) * (1 - ss(stopT2 + fLag - 0.05, stopT2 + fLag + 0.12, t));
    const fo = { t, footL: walking && wk > 0 ? feet.footL.map((v, i) => lerp(still.footL[i], v, wk)) : still.footL, footR: walking && wk > 0 ? feet.footR.map((v, i) => lerp(still.footR[i], v, wk)) : still.footR, bob: feet.bob * wk,
      head: [0.05 + noise(t * 0.8) * 0.05 + jerk * 0.08, lerp(2.55, 2.35, sink) + Math.sin(t * 1.4) * 0.03, 1.32], reach: 0.15 + 0.15 * sink, curl: 0.3 + 0.2 * Math.sin(t * 2.3), headRoll: -24 * tiltF + jerk * 10 + noise(t * 2.5) * 4, mouth: 0.25 + 0.15 * sink };
    const segs = [{ segs: humanSegs(1.1, yz, 18, pose), near: [1.1, yz] }, { segs: folSegs(1.1, fz, 18, fo), near: [1.1, fz] }];
    streetScene(g, cam, E, [fgDetail(), humanSprite(1.1, yz, pose, 18, { lit: 0.55, fogMul: 0.2 }), folSprite(1.1, fz, fo, 18, { lit: 0.6, fogMul: 0.2, zBias: 0.4 })], { under: (g, cam, E) => drawShadows(g, cam, E, segs) });
    vignette(g, 0.55);
    if (t > ww('two', 'two') - 0.1) bigWord(g, t, ww('two', 'two') - 0.05, s7B, '2 OPTIONS', '#ffd23f', 290, 110);
  } });

  // ===== 8A. walk home and never turn around... =====
  const s8A = s7B, s8B = L('optB').start - 0.15, neverT = ww('optA', 'never'), follT = ww('optA', 'follows'), doorT = ww('optA', 'door.');
  const z8 = t => 66 + VW * (t - s8A), ph8 = t => (z8(t) - 66) / HSTRIDE * TAU;
  stepTimes(s8A, s8B, ph8).forEach(x => { cue(x, 'step', 0.5); cue(x + 0.07, 'thud', 0.7); });
  cue(L('optA').start, 'card', 0.9); cue(follT, 'sting', 0.4);
  S.push({ a: s8A, b: s8B, fade: 0.3, draw: (g, t) => {
    const E = envAt(t); const yz = z8(t), fz = yz - 1.35, ph = ph8(t);
    const cam = { x: 1.5, y: 2.2, z: fz - 6.4 - 0.8 * inv(s8A, s8B, t), hy: 820, f: F_ROAD };
    const pose = walkPose(ph, 1, 0); pose.lean = 5;
    const fo = { t, ...folWalkFeet(ph / TAU - 0.25, FSTRIDE, 0.32), head: [0, 2.5 + Math.sin(t * 1.4) * 0.04, 1.32], reach: 0.2, curl: 0.4, mouth: 0.3 };
    const segs = [{ segs: humanSegs(YX, yz, 180, pose), near: [YX, yz] }, { segs: folSegs(YX, fz, 180, fo), near: [YX, fz] }];
    streetScene(g, cam, E, [humanSprite(YX, yz, pose, 180, { fogMul: 0.3 }), folSprite(YX, fz, fo, 180, { fogMul: 0.3 })], { under: (g, cam, E) => drawShadows(g, cam, E, segs) });
    vignette(g, 0.55);
    optionCard(g, t, L('optA').start, 'A', 'WALK HOME', 'AND NEVER TURN AROUND', neverT, 260, '#3ee07a');
  } });

  // ===== 8B. or stand still until sunrise (split close-up) =====
  const s9A = s8B, s9B = L('q').start - 0.15, standT = ww('optB', 'stand'), sunT = ww('optB', 'sunrise,');
  cue(L('optB').start, 'card', 0.9); cue(s9A + 0.1, 'heartbeat', 0.8); cue(ww('optB', 'above'), 'creak', 0.5);
  S.push({ a: s9A, b: s9B, fade: 0.3, draw: (g, t) => {
    const E = envAt(t); streetBokeh(g, t, E, { z: 34, x: 0.5, hy: 1300, dim: 0.45 });
    const pk = eio(inv(s9A, s9B, t));
    // its face hangs upside down right above yours
    followerFaceBig(g, W / 2 + 30, lerp(600, 640, pk), 235, { t, mouth: 0.3 + 0.12 * Math.sin(t * 1.2), tilt: 180 + Math.sin(t * 0.8) * 4, flip: true, drool: 1, look: 0, rim: 0.4 });
    humanFaceOpen(g, W / 2 - 20, 1240, 250, { t, wide: 1, up: 1, tremble: 1 });
    puffs(g, t, W / 2, 1450, s9A, s9B, 0.9);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, W, H); vignette(g, 0.7);
    optionCard(g, t, L('optB').start - 0.02, 'B', 'STAND STILL', 'UNTIL SUNRISE', sunT, 230, '#5aa8ff');
  } });

  // ===== 9. what do you do? =====
  const s10A = s9B, s10B = L('cta').start - 0.15, qT = ww('q', 'do?', 1);
  cue(s10A, 'hit', 0.6); cue(s10A, 'pop', 0.5);
  S.push({ a: s10A, b: s10B, fade: 0.12, draw: (g, t) => {
    const E = envAt(t); streetBokeh(g, t, E, { z: 30, x: 0.5, hy: 1500, dim: 0.5 });
    const pk = eio(inv(s10A, s10B + 0.3, t));
    followerFaceBig(g, W / 2, lerp(1050, 1010, pk), lerp(240, 270, pk), { t, mouth: lerp(0.3, 0.6, pk), tilt: noise(t * 0.8) * 5 - 6, drool: 1, jitter: 0.25, rim: 0.6 });
    vignette(g, 0.7);
    optionCard(g, t, s10A + 0.02, 'A', 'WALK HOME', null, 0, 240, '#3ee07a');
    optionCard(g, t, s10A + 0.12, 'B', 'STAND STILL', null, 0, 400, '#5aa8ff');
  } });

  // ===== 10. CTA: walk or stand still? =====
  const nA = s10B, end = T.duration, comT = ww('cta', 'comments,'), folT = ww('cta', 'follow'), turnT = end - 1.3;
  cue(nA, 'whoosh', 0.4); cue(ww('cta', 'still?') , 'pop', 0.6); cue(comT, 'card', 0.8); cue(folT - 0.35, 'like', 0.9); cue(folT, 'follow', 1.0); cue(turnT + 0.05, 'sting', 0.9); cue(turnT, 'bonecrack', 0.9);
  S.push({ a: nA, b: end + 0.1, fade: 0.3, draw: (g, t) => {
    const E = envAt(t);
    const cam = { x: 0.4, y: 1.45, z: 21.6 - 0.4 * inv(nA, end, t), hy: 1060, f: F_ROAD };
    const turn = eout(inv(turnT, turnT + 0.35, t));
    const pose = humanIdle(t, { headPitch: 4 });
    const fo = { t, footL: [-0.4, 0, 0.12], footR: [0.4, 0, -0.08], head: [0.05 - turn * 0.35, 2.35 - turn * 0.05, 1.32 - turn * 0.2], reach: 0.3, curl: 0.3 + 0.2 * Math.sin(t * 2.3), headRoll: noise(t * 2.5) * 4 + turn * 30, mouth: 0.4 + turn * 0.4 };
    const segs = [{ segs: humanSegs(1.1, 28.1, 18, pose), near: [1.1, 28.1] }, { segs: folSegs(1.1, 29.45, 18, fo), near: [1.1, 29.45] }];
    streetScene(g, cam, E, [fgDetail(), humanSprite(1.1, 28.1, pose, 18, { lit: 0.55, fogMul: 0.2 }), folSprite(1.1, 29.45, fo, 18 - turn * 30, { lit: 0.6, fogMul: 0.2, zBias: 0.4 })], { under: (g, cam, E) => drawShadows(g, cam, E, segs) });
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, W, H); vignette(g, 0.6);
    bigWord(g, t, nA + 0.05, end + 1, 'WALK', '#3ee07a', 210, 84); bigWord(g, t, ww('cta', 'or'), end + 1, 'OR', '#ffffff', 290, 62); bigWord(g, t, ww('cta', 'stand'), end + 1, 'STAND STILL?', '#5aa8ff', 375, 84);
    commentChip(g, t, comT, 1580, 1e9, 300);
    heartFollow(g, t, folT - 0.35, folT, 1580, 400);
    if (t > folT - 0.4) { /* the comment chip makes room for like + follow */ }
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

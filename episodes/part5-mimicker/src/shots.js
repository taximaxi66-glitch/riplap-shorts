// ---------- the film: Part 5 – The Mimicker ----------
const F_ROAD = 1500;
const CUES = [];  // sound cues collected by the shots: {t, n, v}
function cue(t, n, v = 1) { CUES.push({ t: +t.toFixed(3), n, v }); }

function idlePose(t, o = {}) {   // the Mimicker standing: hunched, long neck forward, arms hanging to the ground, twitches
  const jerk = Math.pow(Math.max(0, noise(t * 0.8 + 7)), 3) * 34;
  return { legL: [-4, 10], legR: [5, 12], footL: 0, footR: 0, armL: [-8 + noise(t * 0.7) * 5, 8, 10], armR: [-5 + noise(t * 0.6 + 3) * 5, 10, 10], lean: (o.lean == null ? 22 : o.lean) + noise(t * 0.4) * 2,
    headPitch: (o.headPitch == null ? 40 : o.headPitch) + noise(t * 0.9) * 4, headRoll: (o.headRoll || 0) + noise(t * 1.3 + 5) * 8 + jerk * (o.twitchy == null ? 1 : o.twitchy), bob: Math.sin(t * 1.3) * 0.01, roll: noise(t * 0.5) * 2, curl: 25 + noise(t * 2) * 15 };
}
function keys(K, t) {   // eased keyframes
  if (t <= K[0].t) return { ...K[0] }; if (t >= K[K.length - 1].t) return { ...K[K.length - 1] };
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1].t) { const k = eio(inv(K[i].t, K[i + 1].t, t)), o = {}; for (const p in K[i]) o[p] = lerp(K[i][p], K[i + 1][p], k); return o; }
}
const STRIDE = A => 4 * (MIMIC.thigh + MIMIC.shin) * Math.sin(24 * A * D2R);
const STRIDE_RUN = 4 * (MIMIC.thigh + MIMIC.shin) * Math.sin(50 * D2R);
const YSTRIDE = 4 * (HUMAN.thigh + HUMAN.shin) * Math.sin(50 * D2R);
function footCues(t0, t1, phAt, name, v) { let last = null; for (let t = t0; t < t1; t += 1 / 120) { const n = Math.floor(phAt(t) / Math.PI + 0.5); if (last != null && n !== last) cue(t, name, v); last = n; } }
function mimicWalk(ph, A = 1, run = 0) { const p = walkPose(ph, A, run); p.lean = 20 + run * 22; p.headPitch = 38 - run * 10; p.curl = 30; p.armL = [p.armL[0] * 0.6 - 4, 10 + run * 30, 10]; p.armR = [p.armR[0] * 0.6 - 4, 10 + run * 30, 10]; return p; }
function standPose(t, o = {}) { return { legL: [-2, 4], legR: [3, 5], footL: 0, footR: 0, armL: [4 + noise(t * 0.6) * 3, 14, 6], armR: [o.reach == null ? 4 : o.reach, o.reach == null ? 14 : 20, 6], lean: 3 + noise(t * 0.5) * 1.5, headPitch: (o.headPitch || 0) + noise(t * 0.7) * 2, headRoll: noise(t * 0.4 + 2) * 3, bob: Math.sin(t * 1.2) * 0.004, roll: 0 }; }
function earsPose(t, k = 1, o = {}) {   // sitting on the floor against the wall, knees up, hands pressed on the ears
  const tr = o.tremble || 0;
  return { legL: [lerp(0, 128, k), lerp(4, 112, k)], legR: [lerp(0, 126, k), lerp(4, 110, k)], footL: lerp(0, -20, k), footR: lerp(0, -20, k),
    armL: [lerp(4, 25, k), lerp(14, 135, k), lerp(6, 62, k), lerp(0, 1.55, k)], armR: [lerp(4, 25, k), lerp(14, 135, k), lerp(6, 62, k), lerp(0, 1.55, k)],
    lean: lerp(3, 14, k) + tr * noise(t * 9) * 2, headPitch: lerp(0, 12, k) + noise(t * 3) * 2, headRoll: noise(t * 0.6) * 3 + tr * noise(t * 11) * 3, bob: lerp(0, -0.8, k), roll: 0 };
}

// ---------- extra 2D bits for this episode ----------
function ruleCard5(g, t, t0, t1, items) {   // RULE #1 card with three lines appearing on their words
  if (t < t0 || t > t1 + 0.35) return;
  const k = popK(t, t0, 0.4), out = 1 - ss(t1, t1 + 0.35, t);
  g.save(); g.globalAlpha = out; g.translate(W / 2, 330); g.scale(k, k);
  rr(g, -420, -150, 840, 320, 34); g.fillStyle = 'rgba(10,10,14,0.88)'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#ffd23f'; g.stroke();
  rr(g, -150, -190, 300, 80, 24); g.fillStyle = '#ffd23f'; g.fill();
  g.fillStyle = '#111'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RULE #1', 0, -148);
  items.forEach((it, i) => { if (t < it.at) return; const k2 = popK(t, it.at, 0.3); g.save(); g.translate(0, -60 + i * 92); g.scale(k2, k2); g.font = '900 58px Inter'; g.fillStyle = it.col || '#fff'; g.fillText(it.text, 0, 4); g.restore(); });
  g.restore();
}
function speech(g, t, t0, t1, text, x, y, tailX, tailY, col = '#fff', size = 64) {   // your speech bubble
  if (t < t0 || t > t1 + 0.25) return;
  const k = popK(t, t0, 0.3), out = 1 - ss(t1, t1 + 0.25, t);
  g.save(); g.globalAlpha = out; g.translate(x, y); g.scale(k, k); g.font = `900 ${size}px Inter`; const w = g.measureText(text).width + 80;
  g.fillStyle = col; g.strokeStyle = '#111'; g.lineWidth = 7; g.beginPath(); rr(g, -w / 2, -60, w, 120, 40); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-30, 55); g.lineTo(tailX - x, tailY - y); g.lineTo(30, 55); g.closePath(); g.fill(); g.stroke(); g.fillRect(-28, 48, 56, 12);
  g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4); g.restore();
}
function polaroid(g, t, t0, t1, deadAt, x, y) {   // mom's photo; turns grey on "died"
  if (t < t0 || t > t1 + 0.35) return;
  const k = popK(t, t0, 0.35), out = 1 - ss(t1, t1 + 0.35, t), grey = ss(deadAt, deadAt + 0.35, t);
  g.save(); g.globalAlpha = out; g.translate(x, y); g.rotate(-0.08 + 0.02 * Math.sin(t)); g.scale(k, k);
  g.fillStyle = 'rgba(0,0,0,0.4)'; rr(g, -150, -170, 310, 360, 8); g.fill();
  g.fillStyle = '#efe9dc'; rr(g, -160, -180, 310, 360, 8); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 4; g.stroke();
  const L = scratch(); L.g.clearRect(0, 0, 400, 400); const p = L.g;
  p.fillStyle = '#7ea0c4'; p.fillRect(0, 0, 270, 250); p.fillStyle = '#9cc28a'; p.fillRect(0, 170, 270, 80);
  p.fillStyle = '#6b3f2a'; ell(p, 135, 100, 72, 80); p.fill();                     // hair
  p.fillStyle = '#d23b4c'; p.beginPath(); p.moveTo(45, 250); p.quadraticCurveTo(135, 150, 225, 250); p.fill();   // red sweater
  p.fillStyle = '#e8b896'; ell(p, 135, 110, 46, 56); p.fill(); p.strokeStyle = '#3a2416'; p.lineWidth = 3; p.stroke();
  p.fillStyle = '#6b3f2a'; p.beginPath(); p.ellipse(135, 78, 52, 36, 0, Math.PI, TAU); p.fill();
  p.fillStyle = '#222'; ell(p, 118, 108, 5, 6); p.fill(); ell(p, 152, 108, 5, 6); p.fill();
  p.strokeStyle = '#7a2a2a'; p.lineWidth = 4; p.beginPath(); p.arc(135, 128, 16, 0.2, Math.PI - 0.2); p.stroke();
  g.save(); g.filter = `grayscale(${grey}) brightness(${1 - grey * 0.3})`; g.drawImage(L.c, 0, 0, 270, 250, -140, -160, 270, 250); g.restore();
  g.fillStyle = '#222'; g.font = '900 40px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MOM ♥', -5, 135);
  if (grey > 0) { g.globalAlpha = out * grey; g.fillStyle = '#111'; rr(g, 60, -205, 110, 50, 10); g.fill(); g.fillStyle = '#fff'; g.font = '900 28px Inter'; g.fillText('2025', 115, -178); }
  g.restore();
}
function hose(g, cam, a, b, c) { const pa = proj(cam, ...a), pb = proj(cam, ...b), pc = proj(cam, ...c); if (!pa || !pb || !pc) return;
  g.strokeStyle = '#0c0c0e'; g.lineWidth = Math.max(2, pc[2] * 0.035); g.lineCap = 'round'; g.beginPath(); g.moveTo(pa[0], pa[1]); g.quadraticCurveTo(pb[0], pb[1], pc[0], pc[1]); g.stroke();
  g.fillStyle = '#1b1c20'; g.save(); g.translate(pc[0], pc[1]); g.rotate(-0.4); rr(g, -pc[2] * 0.14, -pc[2] * 0.035, pc[2] * 0.16, pc[2] * 0.07, 3); g.fill(); g.fillStyle = '#c23b2b'; rr(g, -pc[2] * 0.2, -pc[2] * 0.04, pc[2] * 0.07, pc[2] * 0.08, 3); g.fill(); g.restore(); }
function heightGuide(g, cam, t, t0, out, cx, cz) {
  const a = proj(cam, cx + 1.3, 0, cz), b = proj(cam, cx + 1.3, 2.74, cz), hm = proj(cam, cx - 1.45, 0, cz); if (!a || !b) return;
  const k = eout(inv(t0, t0 + 0.5, t));
  g.save(); g.globalAlpha = out; g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[0], lerp(a[1], b[1], k)); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(a[0] - 20, a[1]); g.lineTo(a[0] + 20, a[1]); g.moveTo(b[0] - 20, lerp(a[1], b[1], k)); g.lineTo(b[0] + 20, lerp(a[1], b[1], k)); g.stroke();
  if (k > 0.9) { const lk = popK(t, t0 + 0.4, 0.3); g.translate(Math.min(a[0] + 30, W - 230), lerp(a[1], b[1], 0.55)); g.scale(lk, lk); rr(g, 0, -40, 170, 80, 18); g.fillStyle = 'rgba(8,8,12,0.85)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#ffd23f'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('9 FT', 85, 3); }
  g.restore();
  const hk = ss(t0 + 0.35, t0 + 0.75, t) * out;
  if (hk > 0 && hm) { g.save(); g.globalAlpha = hk * 0.85; g.setLineDash([10, 8]); g.strokeStyle = '#9fd0ff'; g.lineWidth = 4; const s = hm[2], x = hm[0], y = hm[1];
    g.beginPath(); g.ellipse(x, y - 1.62 * s, 0.11 * s, 0.13 * s, 0, 0, TAU); g.moveTo(x - 0.2 * s, y - 1.4 * s); g.lineTo(x + 0.2 * s, y - 1.4 * s); g.lineTo(x + 0.17 * s, y - 0.9 * s); g.lineTo(x + 0.12 * s, y); g.lineTo(x - 0.12 * s, y); g.lineTo(x - 0.17 * s, y - 0.9 * s); g.closePath(); g.stroke();
    g.setLineDash([]); g.fillStyle = '#9fd0ff'; g.font = '900 36px Inter'; g.textAlign = 'center'; g.fillText('YOU', x, y - 1.92 * s); g.restore(); }
}
function handOnGlass(g, x, y, S, rot, k, t, seed) {   // a long-fingered palm pressed flat on the glass
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(lerp(1.15, 1, k), lerp(1.15, 1, k)); g.globalAlpha = clamp(k * 3);
  const ink = '#0f0d0a', skin = '#b6b29a', pr = '#d8d6c6';
  g.fillStyle = skin; g.strokeStyle = ink; g.lineWidth = S * 0.03; g.beginPath(); g.moveTo(-S * 0.25, S * 1.4); g.lineTo(S * 0.25, S * 1.4); g.lineTo(S * 0.3, S * 0.4); g.lineTo(-S * 0.3, S * 0.4); g.closePath(); g.fill(); g.stroke();
  ell(g, 0, S * 0.25, S * 0.42, S * 0.36); g.fill(); g.stroke();
  for (let f = 0; f < 5; f++) { const a = -Math.PI / 2 + (f - 2) * 0.33 + (f === 0 ? -0.5 : 0) + Math.sin(t * 6 + f + seed) * 0.02, L = S * (f === 0 ? 0.7 : 1.35 - Math.abs(f - 2.5) * 0.15);
    const bx = Math.cos(a) * S * 0.3, by = S * 0.15 + Math.sin(a) * S * 0.25, mx = bx + Math.cos(a) * L * 0.55, my = by + Math.sin(a) * L * 0.55, tx = bx + Math.cos(a) * L, ty = by + Math.sin(a) * L;
    limb(g, [[bx, by], [mx, my], [tx, ty]], S * 0.13, skin, ink, null, S * 0.025); g.fillStyle = 'rgba(255,255,255,0.18)'; ell(g, tx - Math.cos(a) * S * 0.06, ty - Math.sin(a) * S * 0.06, S * 0.06, S * 0.05); g.fill(); mimicNail(g, tx, ty, a, S * 0.05); }
  g.fillStyle = 'rgba(230,230,215,0.35)'; ell(g, 0, S * 0.25, S * 0.3, S * 0.22); g.fill();   // flattened palm on the glass
  g.restore();
}
function breathFog(g, x, y, r, t, k) { if (k <= 0) return; const b = 0.5 + 0.5 * Math.sin(t * 2.6), rr_ = r * (0.8 + 0.35 * b); const gr = g.createRadialGradient(x, y, 0, x, y, rr_); gr.addColorStop(0, `rgba(225,232,240,${0.38 * k * (0.6 + 0.4 * b)})`); gr.addColorStop(1, 'rgba(225,232,240,0)'); g.fillStyle = gr; g.fillRect(x - rr_, y - rr_, rr_ * 2, rr_ * 2); }

let SHOTS = [];
function buildShots() {
  const L = id => LN(id), w = (id, k) => WD(id, k), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  // ===== 0. character-select spinner (≤ 2.6 s) =====
  const land = ww('hook', 'mimicker?') - 0.05;
  const kinds = ['ring', 'hay', 'pale', 'frost', 'mimic'];
  const target = 14; // kinds[14 % 5] = 'mimic'
  const spinPos = t => target * (1 - Math.pow(1 - clamp(t / land), 3.2));
  { let last = -1; for (let t = 0; t < land; t += 1 / 120) { const p = Math.round(spinPos(t)); if (p !== last) { if (last >= 0) cue(t, 'tick', 0.5); last = p; } } cue(land, 'select', 1); cue(0.0, 'whoosh', 0.6); }
  S.push({ a: 0, b: L('gas').start - 0.1, fade: 0, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H);
    sideDesert(g, E, t * 40, 1600, { }); g.fillStyle = 'rgba(5,6,12,0.55)'; g.fillRect(0, 0, W, H); dust(g, E, 0.7, 5);
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 70px Inter'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#000';
    const tk = popK(t, 0.05, 0.4); g.translate(W / 2, 330); g.scale(tk, tk); g.strokeText('HOW DO YOU SURVIVE', 0, 0); g.fillStyle = '#fff'; g.fillText('HOW DO YOU SURVIVE', 0, 0);
    g.font = '900 52px Inter'; g.strokeText('THIS HORROR CHARACTER?', 0, 78); g.fillStyle = '#ffd23f'; g.fillText('THIS HORROR CHARACTER?', 0, 78); g.restore();
    g.save(); const pk = popK(t, 0.25, 0.35); g.translate(W / 2, 520); g.scale(pk, pk); rr(g, -130, -42, 260, 84, 22); g.fillStyle = '#c4161c'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 5', 0, 3); g.restore();
    const p = spinPos(t), cy = 900;
    for (let i = Math.floor(p) - 3; i <= Math.floor(p) + 4; i++) {
      if (i < 0) continue; const dx = (i - p) * 300, x = W / 2 + dx; if (x < -200 || x > W + 200) continue;
      const near = 1 - clamp(Math.abs(dx) / 300); const sel = t >= land && i === target;
      g.save(); g.translate(x, cy); const sc = 0.8 + near * 0.2 + (sel ? 0.12 * popK(t, land, 0.3) : 0); g.scale(sc, sc); g.globalAlpha = 0.45 + near * 0.55;
      portrait(g, kinds[i % 5], t); g.restore();
    }
    g.save(); g.translate(W / 2, cy); const sk = t >= land ? 1 + 0.12 * popK(t, land, 0.3) : 1; g.scale(sk, sk); g.strokeStyle = '#ffd23f'; g.lineWidth = 10; rr(g, -142, -182, 284, 364, 30); g.stroke();
    g.fillStyle = '#ffd23f'; poly(g, [[-26, -215], [26, -215], [0, -188]]); g.fill(); g.restore();
    if (t >= land) { const nk = popK(t, land + 0.05, 0.35); g.save(); g.translate(W / 2, 1185); g.scale(nk, nk);
      rr(g, -330, -62, 660, 124, 30); g.fillStyle = 'rgba(8,8,12,0.9)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#fff'; g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THE MIMICKER', 0, 4); g.restore(); }
    vignette(g, 0.6);
  } });

  // ===== 1. one continuous move: pumping gas → mom's voice from the dark → it steps into the light → 9 ft → rule =====
  const s1A = L('gas').start - 0.45, s1B = L('calls').start - 0.03;
  const turnT = ww('voice', 'mom'), m1T = L('voice').end + 0.1, eyesT = L('but').start + 0.9, walk0 = L('but').end - 0.45, walk1 = ww('light', 'light.') + 0.45;
  const W0 = [17.5, 31], W1 = [12.6, 19.2], hangT = ww('tall', 'hangs'), nineT = ww('tall', 'nine');
  const wdist = Math.hypot(W0[0] - W1[0], W0[1] - W1[1]), wph = t => eio(inv(walk0, walk1, t)) * wdist / STRIDE(1) * TAU;
  const camK = [
    { t: s1A, x: -2.5, y: 2.0, z: -8.5, hy: 960 },
    { t: L('voice').start, x: -1.2, y: 1.9, z: -6.0, hy: 970 },
    { t: L('voice').end, x: 6.5, y: 1.6, z: -4.0, hy: 1000 },
    { t: walk0, x: 12.5, y: 1.0, z: -1.0, hy: 1150 },
    { t: walk1, x: 12.3, y: 1.0, z: 9.0, hy: 1150 },
    { t: nineT + 0.3, x: 11.6, y: 1.5, z: 10.0, hy: 860 },
    { t: ww('tall', 'jaw'), x: 12.4, y: 2.3, z: 13.8, hy: 880 },
    { t: ww('tall', 'chest.'), x: 12.6, y: 2.45, z: 14.6, hy: 870 },
    { t: L('rule').start + 0.4, x: 12.2, y: 0.9, z: 12.0, hy: 1010 },
    { t: s1B, x: 12.4, y: 0.85, z: 12.6, hy: 1020 },
  ];
  cue(s1A + 0.1, 'wind', 0.7); cue(s1A + 0.2, 'hum', 0.6); cue(s1A + 0.6, 'pumpflow', 0.7); cue(L('gas').start + 0.6, 'nozzle', 0.8); cue(ww('gas', 'station.') + 0.2, 'pumpflow', 0.5);
  cue(ww('voice', 'dark,'), 'whoosh', 0.4); cue(m1T, 'mimic1', 1); cue(turnT + 0.05, 'cloth', 0.6); cue(ww('but', 'died') - 0.05, 'sting', 0.55);
  cue(eyesT, 'sting', 0.7); footCues(walk0, walk1, wph, 'barefoot', 0.9); cue(ww('light', 'light.'), 'hit', 0.8);
  cue(nineT, 'boom', 0.55); cue(hangT, 'jawdrop', 1); cue(hangT + 0.05, 'sting', 0.7); cue(L('rule').start, 'card', 0.8);
  cue(ww('rule', 'copies'), 'pop', 0.6); cue(ww('rule', "can't"), 'pop', 0.6); cue(ww('rule', 'unless'), 'pop', 0.7); cue(ww('rule', 'answer.'), 'twitch', 0.6);
  for (let k = 0; k < 3; k++) cue(walk1 + 0.6 + k * 1.1, 'twitch', 0.35);
  S.push({ a: s1A, b: s1B, fade: 0.45, draw: (g, t) => {
    const E = envAt(t); const cam = { ...keys(camK, t), f: F_ROAD };
    const ex = [];
    // the creature: two white eyes in the dark → walks into the light → stands, jaw drops
    const wk = eio(inv(walk0, walk1, t)), cx = lerp(W0[0], W1[0], wk), cz = lerp(W0[1], W1[1], wk);
    let pose = idlePose(t, { headPitch: 40 });
    if (t > walk0 && t < walk1 + 0.3) { const wp = mimicWalk(wph(t), 1, 0), st = ss(walk1 - 0.3, walk1 + 0.3, t); for (const k of ['legL', 'legR', 'armL', 'armR']) pose[k] = wp[k].map((v, i) => lerp(v, pose[k][i], st)); pose.bob = lerp(wp.bob, pose.bob, st); pose.lean = lerp(wp.lean, pose.lean, st); }
    const lookStore = ss(ww('rule', "can't") - 0.2, ww('rule', 'inside...'), t) * (1 - ss(ww('rule', 'unless'), ww('rule', 'answer.'), t));
    const yaw = t < walk1 ? -22 : lerp(-18, 55, lookStore);
    const jaw = lerp(1.5, 2.9, eout(inv(hangT, hangT + 0.35, t))), talk = t > ww('rule', 'copies') - 0.1 && t < ww('rule', 'voices,') + 0.4 ? 0.8 : 0;
    const lit = canopyLight(cx, cz), dark = 0.62 * (1 - lit);
    if (t > eyesT - 0.3) ex.push(mimicSprite(cz, cx, pose, yaw, { jaw, talk, fogMul: 0.45, dark, eyeGlow: ss(eyesT - 0.3, eyesT + 0.2, t) * (1 - lit * 1.4), alpha: ss(eyesT - 0.3, eyesT + 0.6, t) }));
    // you, pumping gas, then turning toward the dark
    const turn = eio(inv(turnT, turnT + 0.6, t)), yYaw = lerp(90, 150, turn);
    ex.push({ z: 7.75, draw: (g, cam, E) => { const p = proj(cam, 3.05, 0, 7.75); if (!p) return; g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, p[0], p[1], p[2] * 0.35, p[2] * 0.05); g.fill();
      const ps = standPose(t, { reach: lerp(62, 20, turn) }); ps.armR = [lerp(62, 20, turn), lerp(18, 20, turn), 0]; drawRig(g, YOU, ps, p[0], p[1], p[2], yYaw, { t, expr: 'scared' }); } });
    ex.push({ z: 7.5, draw: (g, cam, E) => hose(g, cam, [1.98, 1.1, 9.25], [2.6, -0.4, 8.6], [3.5, 0.78, 7.52]) });
    // the voice from the dark: sound rings
    if (t > ww('voice', 'mom') - 0.2 && t < L('but').start) ex.push({ z: 34, draw: (g, cam, E) => { const p = proj(cam, 14, 1.6, 34); if (p) { soundRings(g, p[0], p[1], t, ww('voice', 'calling'), 1.1, [255, 190, 170]); soundRings(g, p[0], p[1], t, m1T, 1.3, [255, 190, 170], 1.4, 4); } } });
    if (t > nineT - 0.05) { const out = 1 - ss(ww('tall', 'jaw') - 0.3, ww('tall', 'jaw'), t); if (out > 0) ex.push({ z: cz - 0.3, draw: (g, cam, E) => heightGuide(g, cam, t, nineT, out, cx, cz) }); }
    desertScene(g, cam, E, ex, { pump: { nozzleOut: true } });
    if (t > hangT && t < hangT + 1) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, 800, 900, [110, 10, 15], 0.2 * (1 - inv(hangT, hangT + 1, t))); g.restore(); }
    vignette(g, 0.55);
    // her voice, from the dark
    voiceText(g, t, m1T, m1T + 0.8, 'SWEETIE...?', W * 0.62, 640, 64); voiceText(g, t, m1T + 0.8, m1T + 1.75, 'WHERE ARE YOU?', W * 0.58, 640, 60);
    polaroid(g, t, ww('but', 'mom') - 0.1, L('light').start - 0.15, ww('but', 'died'), 300, 560);
    ruleCard5(g, t, L('rule').start, s1B - 0.12, [{ text: 'IT COPIES VOICES', at: ww('rule', 'copies') }, { text: "CAN'T COME INSIDE", at: ww('rule', "can't") }, { text: 'UNLESS YOU ANSWER', at: ww('rule', 'unless'), col: '#ff5236' }]);
  } });

  // ===== 2. close-up: it calls you in your mother's voice =====
  const cA = L('calls').start - 0.03, cB = L('run').start - 0.12, m2T = L('calls').end + 0.03, callT = ww('calls', 'calling');
  cue(cA, 'hit', 0.85); cue(callT, 'bonecrack', 0.5); cue(m2T, 'mimic2', 1); cue(m2T, 'heartbeat', 0.6);
  S.push({ a: cA, b: cB, fade: 0, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#04050a'; g.fillRect(0, 0, W, H);
    sideDesert(g, E, 400 + t * 12, 1500, {}); g.fillStyle = 'rgba(8,10,20,0.6)'; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 80, 1300, 700, DES.lamp, 0.22); glow(g, 120, 1100, 160, DES.lamp, 0.25); g.restore();   // canopy lights behind, out of focus
    const talk = t > m2T - 0.05 ? 1 : (t > callT && t < L('calls').end ? 0.35 : 0);
    const z = 1 + 0.07 * inv(cA, cB, t); g.save(); g.translate(W / 2, 700); g.scale(z, z); g.translate(-W / 2, -700);
    mimicFaceBig(g, W / 2 + 10, 560, 255, { t, talk, jitter: 0.3 + talk * 0.4, tilt: lerp(-6, 10, ss(callT, callT + 0.4, t)) + noise(t * 1.5) * 4, look: 0.4 });
    g.restore();
    dust(g, E, 0.6, 9); vignette(g, 0.7);
    voiceText(g, t, m2T, m2T + 1.15, "HONEY... IT'S MOM.", W / 2, 180, 62); voiceText(g, t, m2T + 1.2, cB, 'LET ME IN.', W / 2, 180, 76);
  } });

  // ===== 3. what-if 1: run for your car? it rips the door off (grey) =====
  const rA = L('run').start - 0.12, rB = L('shout').start - 0.12, ripT = ww('run', 'rips'), doorT = ww('run', 'door'), offT = ww('run', 'off.');
  const gy = 1360, cs = 200, carX = 640, doorX = carX - 0.3 * cs;
  const youX = t => lerp(1180, doorX + 70, eio(inv(rA, ww('run', 'no.') + 0.05, t))), mimX = t => lerp(-420, doorX - 330, eio(inv(ww('run', 'car?') - 0.1, ripT, t)));
  { let last = null; for (let t = rA; t < ww('run', 'no.'); t += 1 / 120) { const n = Math.floor((1180 - youX(t)) / (YSTRIDE * cs) * 2 + 0.5); if (last != null && n !== last) cue(t, 'step', 0.6); last = n; } }
  footCues(ww('run', 'car?') - 0.1, ripT, t => (mimX(t) + 420) / (STRIDE_RUN * cs) * TAU, 'barefoot', 0.9);
  cue(L('run').start, 'card', 0.7); cue(ww('run', 'no.'), 'buzz', 0.7); cue(ww('run', 'no.') + 0.05, 'doorhandle', 0.8); cue(ripT - 0.1, 'screech', 0.6); cue(ripT, 'grab', 0.9); cue(doorT, 'doorrip', 1); cue(doorT + 0.05, 'glass', 0.8); cue(offT, 'xstamp', 1); cue(offT + 0.25, 'impact', 0.6);
  S.push({ a: rA, b: rB, fade: 0.3, draw: (g0, t) => {
    const E = envAt(t); const SC = scratch(); const g = SC.g; g.clearRect(0, 0, W, H);
    sideDesert(g, E, 800 + (t - rA) * 60, 1150, {});
    g.fillStyle = rgb([40, 40, 46]); g.fillRect(0, 1150 + 50, W, H); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 900, 1300, 700, DES.lamp, 0.15); g.restore();
    const dk = ss(doorT, doorT + 0.55, t), open = ss(ww('run', 'no.'), ww('run', 'no.') + 0.25, t) * (1 - dk);
    sideCar(g, carX, gy, cs, E, { door: dk, doorOpen: open });
    // you: run to the door, pull it, then stumble back
    const yx = youX(t), back = ss(doorT, doorT + 0.4, t);
    const yp = t < ww('run', 'no.') ? walkPose((1180 - yx) / (YSTRIDE * cs) * TAU, 1, 1) : standPose(t);
    if (t >= ww('run', 'no.')) { yp.armR = [lerp(80, 120, back), lerp(10, 40, back), 0]; yp.lean = lerp(10, -25, back); yp.headPitch = -10; }
    g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, yx + back * 120, gy, 90, 12); g.fill();
    drawRig(g, YOU, yp, yx + back * 120, gy, cs, -90, { t, expr: 'scared' });
    // the Mimicker sprints in on all its long limbs, grabs the door
    if (t > ww('run', 'car?') - 0.2) { const mx = mimX(t), grab = ss(ripT - 0.15, ripT + 0.05, t), yank = ss(doorT, doorT + 0.3, t);
      const mp = t < ripT ? mimicWalk((mx + 420) / (STRIDE_RUN * cs) * TAU, 1, 1) : idlePose(t, { lean: 30, headPitch: 20 });
      mp.armR = [lerp(mp.armR[0], lerp(85, 150, yank), grab), lerp(mp.armR[1], 5, grab), 0]; mp.armL = [lerp(mp.armL[0], lerp(70, 130, yank), grab), lerp(mp.armL[1], 10, grab), 0];
      g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, mx, gy, 150, 16); g.fill(); drawRig(g, MIMIC, mp, mx, gy, cs, 90, { t, twitch: 1, jaw: 2.8 }); }
    shards(g, doorX - 40, gy - 1.1 * cs, t - doorT, 26, 7, 1, -Math.PI * 0.75, 1.6);
    dust(g, E, 0.6, 4); vignette(g, 0.55);
    const kick = t > doorT && t < doorT + 0.35 ? 1 - inv(doorT, doorT + 0.35, t) : 0;
    g0.save(); g0.filter = 'grayscale(1) contrast(1.15)'; g0.translate(noise(t * 40) * 14 * kick, noise(t * 37 + 2) * 10 * kick); g0.drawImage(SC.c, 0, 0); g0.restore();
    chip(g0, t, L('run').start, rB - 0.15, 'RUN FOR YOUR CAR?', '#ff3b2f', 250, g2 => iconX(g2, 24));
    bigX(g0, t, offT, W / 2, 800, 230);
  } });

  // ===== 4. what-if 2: yell at it? that's an answer — it comes through the glass (grey) =====
  const yA = L('shout').start - 0.12, yB = L('works').start - 0.15, yellT = ww('shout', 'yell'), ansT = ww('shout', "that's"), lungeT = ww('shout', 'now') - 0.15, breakT = ww('shout', 'now') + 0.12, inT = ww('shout', 'inside.');
  cue(L('shout').start, 'card', 0.7); cue(yellT + 0.05, 'shout', 0.9); cue(ansT, 'bonecrack', 0.7); cue(ansT + 0.1, 'sting', 0.6); cue(lungeT, 'whoosh', 0.7); cue(breakT, 'glass', 1.1); cue(breakT, 'impact', 0.7); cue(inT, 'xstamp', 1);
  S.push({ a: yA, b: yB, fade: 0.3, draw: (g0, t) => {
    const E = envAt(t); const SC = scratch(); const g = SC.g; g.clearRect(0, 0, W, H);
    const cam = { flip: true, x: 5.4, y: 1.45, z: 29.2 - 0.4 * inv(yA, yB, t), hy: 950, f: 1250 };
    const lunge = eio(inv(lungeT, breakT + 0.35, t)), mz = lerp(20.6, 24.6, lunge), inside = mz > 23.05;
    const pose = lunge > 0 ? mimicWalk(lunge * 3 * Math.PI, 1, 1) : idlePose(t, { headPitch: 35 });
    const tilt = ss(ansT, ansT + 0.4, t);
    if (lunge <= 0) pose.headRoll += tilt * 25;
    const spr = mimicSprite(mz, 5.6, pose, 0, { jaw: 2.8, talk: tilt > 0 && lunge <= 0 ? 0.5 : 0, fogMul: 0.25, lit: 0.5, eyeBig: tilt });
    const br = t - breakT;
    storeInterior(g, cam, E, { outside: inside ? [] : [spr], inside: [
      ...(inside ? [spr] : []),
      { z: 25.6, draw: (g, cam, E) => { const p = proj(cam, 4.3, 0, 25.6); if (!p) return; const fall = ss(breakT, breakT + 0.4, t);
        const ps = standPose(t); ps.armR = [lerp(lerp(10, 120, ss(yellT, yellT + 0.2, t)), 40, fall), 30, 10]; ps.lean = lerp(5, -20, fall); drawRig(g, YOU, ps, p[0], p[1], p[2], 180, { t }); } },
    ], glassFx: g => { if (br > 0) { const c = proj(cam, 5.6, 1.1, 23); g.fillStyle = 'rgba(0,0,0,0)'; } }, doorGone: br > 0 });
    // the door glass explodes inward
    if (br > 0) { const c = proj(cam, 5.6, 1.15, 23); shards(g, c[0], c[1], br, 40, 21, 1.4, Math.PI / 2, Math.PI * 1.9); if (br < 0.25) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, c[0], c[1], 500, [220, 235, 255], 0.5 * (1 - br / 0.25)); g.restore(); } }
    vignette(g, 0.55);
    const kick = br > 0 && br < 0.35 ? 1 - br / 0.35 : 0;
    g0.save(); g0.filter = 'grayscale(1) contrast(1.15)'; g0.translate(noise(t * 40) * 16 * kick, noise(t * 37 + 2) * 12 * kick); g0.drawImage(SC.c, 0, 0); g0.restore();
    speech(g0, t, yellT, ansT - 0.1, 'GO AWAY!', 380, 560, 330, 900);
    chip(g0, t, L('shout').start, yB - 0.15, 'YELL AT IT?', '#ff3b2f', 250, g2 => iconX(g2, 24));
    bigX(g0, t, inT, W / 2, 800, 230);
  } });

  // ===== 5. here's what works: get inside → lock the door → cover your ears =====
  const hA = L('works').start - 0.15, getT = ww('works', 'get'), inT2 = ww('works', 'inside,') + 0.1, lockT = ww('works', 'lock'), coverT = ww('works', 'cover');
  const lockA = lockT - 0.12, lockB = coverT - 0.18, gB = L('glass').start - 0.12;
  const checks = [{ text: 'GET INSIDE', at: getT }, { text: 'LOCK THE DOOR', at: lockT }, { text: 'COVER YOUR EARS', at: coverT }];
  const yrun = t => eio(inv(hA + 0.15, inT2, t)), ypath = k => [lerp(3.0, 5.6, k), lerp(7.6, 23.2, k)];
  { let last = null; for (let t = hA; t < inT2; t += 1 / 120) { const k = yrun(t), d = k * 15.8, n = Math.floor(d / YSTRIDE * 2 + 0.5); if (last != null && n !== last) cue(t, 'step', 0.55); last = n; } }
  cue(L('works').start, 'good', 0.8); cue(getT, 'pop', 0.5); cue(inT2 - 0.05, 'doorbell', 0.8); cue(lockT, 'pop', 0.5); cue(lockT + 0.12, 'lockclick', 1.2); cue(coverT, 'pop', 0.5); cue(coverT + 0.05, 'slide', 0.6); cue(coverT + 0.3, 'heartbeat', 0.7);
  const ui5 = (g, t) => { chip(g, t, L('works').start, gB - 0.1, "HERE'S WHAT WORKS", '#3ee07a', 250, g2 => iconCheck(g2, 24)); checklist(g, t, checks); };
  S.push({ a: hA, b: lockA, fade: 0.35, draw: (g, t) => {
    const E = envAt(t); const ck = inv(hA, lockA, t); const cam = { x: lerp(5.2, 5.6, ck), y: lerp(3.7, 3.2, ck), z: lerp(-1.5, 9.0, eio(ck)), hy: lerp(780, 820, ck), f: F_ROAD };
    const k = yrun(t), [yx, yz] = ypath(k), ex = [];
    if (k < 1) ex.push(youSprite(yz, yx, k > 0 && k < 1 ? walkPose(k * 15.8 / YSTRIDE * TAU, 1, 1) : standPose(t), 172, { expr: 'scared' }));
    ex.push(mimicSprite(24, 16.5, idlePose(t, { headPitch: 30 }), -60, { jaw: 2.8, fogMul: 0.5, dark: 0.35, eyeGlow: 0.6 }));
    desertScene(g, cam, E, ex, { pump: { nozzleOut: false } });
    vignette(g, 0.55); ui5(g, t);
  } });
  // close-up: the deadbolt
  S.push({ a: lockA, b: lockB, fade: 0.12, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#05070c'; g.fillRect(0, 0, W, H);
    // outside through the door glass: canopy lights, out of focus
    g.save(); rr(g, 60, 120, 600, 1500, 10); g.clip(); const bg = g.createLinearGradient(0, 120, 0, 1620); bg.addColorStop(0, '#0b1222'); bg.addColorStop(1, '#1a1820'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) glow(g, 120 + i * 120, 520 + (i % 2) * 40, 120, DES.lamp, 0.35); g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(255,255,255,0.05)'; poly(g, [[60, 120], [260, 120], [60, 700]]); g.fill(); g.restore();
    // aluminium frame + deadbolt
    g.fillStyle = '#7b7e85'; g.fillRect(660, 0, 200, H); g.fillStyle = '#5c5f66'; g.fillRect(700, 0, 30, H); g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(660, -10, 200, H + 20);
    g.fillStyle = '#9aa0a8'; rr(g, 690, 760, 140, 260, 30); g.fill(); g.stroke(); g.fillStyle = '#c9ccd2'; ell(g, 760, 890, 62, 62); g.fill(); g.stroke();
    const rot = eio(inv(lockT, lockT + 0.22, t)) * Math.PI / 2;
    g.save(); g.translate(760, 890); g.rotate(rot); g.fillStyle = '#2b2d33'; rr(g, -20, -70, 40, 140, 16); g.fill(); g.restore();
    // the bolt sliding into the frame
    g.fillStyle = '#d8dbe0'; g.fillRect(830, 870, lerp(10, 110, eio(inv(lockT, lockT + 0.22, t))), 40);
    // your hand turning it
    g.save(); g.translate(760, 890); g.rotate(rot * 0.8); g.fillStyle = '#e2b590'; g.strokeStyle = '#141218'; g.lineWidth = 6; rr(g, -80, -40, 120, 150, 50); g.fill(); g.stroke(); rr(g, 20, -40, 60, 38, 18); g.fill(); g.stroke(); g.restore();
    g.fillStyle = YOU.hoodie; g.strokeStyle = '#141218'; g.lineWidth = 6; poly(g, [[660, 1000], [820, 960], [1100, 1500], [1100, 1900], [880, 1900]]); g.fill(); g.stroke();
    // padlock pop
    if (t > lockT + 0.15) { const k = popK(t, lockT + 0.15, 0.3); g.save(); g.translate(330, 980); g.scale(k, k); g.strokeStyle = '#3ee07a'; g.lineWidth = 18; g.beginPath(); g.arc(0, -40, 50, Math.PI, TAU); g.stroke(); g.fillStyle = '#3ee07a'; rr(g, -75, -40, 150, 120, 20); g.fill(); g.fillStyle = '#0b2a16'; ell(g, 0, 10, 14, 14); g.fill(); g.fillRect(-6, 10, 12, 35); g.restore(); }
    vignette(g, 0.5); ui5(g, t);
  } });
  // inside: you slide down under the window, hands over your ears; it comes for the glass
  const pressT = ww('glass', 'presses'), glassT = ww('glass', 'glass...'), rightT = ww('glass', 'right'), begT = ww('begs', 'begs'), m3T = L('begs').end + 0.08;
  const sitX = 2.5, sitZ = 23.38, faceAt = [2.55, 1.62, 22.92];
  cue(pressT - 0.25, 'whoosh', 0.5); cue(pressT + 0.12, 'squeak', 1); cue(pressT + 0.15, 'sting', 0.8); cue(glassT, 'glassthud', 1); cue(glassT + 0.12, 'glassthud', 0.8); cue(rightT, 'heartbeat', 0.9); cue(L('glass').start + 0.2, 'breath', 0.6); cue(begT, 'breath', 0.7); cue(rightT + 0.6, 'squeak', 0.5);
  footCues(lockB, pressT - 0.4, t => (t - lockB) / 0.42 * Math.PI, 'barefoot', 0.7);
  S.push({ a: lockB, b: L('begs').end + 0.05, fade: 0.25, draw: (g, t) => {
    const E = envAt(t); const ck = ss(L('glass').start, L('begs').start, t);
    const cam = { flip: true, x: lerp(3.6, 2.7, ck), y: lerp(1.1, 1.0, ck), z: lerp(27.6, 25.0, ck), hy: lerp(1000, 1060, ck), f: 1300 };
    const sit = eio(inv(coverT, coverT + 0.55, t));
    const app = eio(inv(lockB, pressT - 0.3, t)), bend = eout(inv(pressT - 0.35, pressT + 0.12, t));
    const mz = lerp(14, 22.4, app), mx = lerp(7, 2.9, app);
    const pose = app < 1 ? mimicWalk(app * 8.4 / STRIDE(1) * TAU, 1, 0) : idlePose(t, { headPitch: 20 });
    pose.lean = lerp(pose.lean, 70, bend); pose.headPitch = lerp(pose.headPitch, -50, bend);
    const hk = ss(glassT - 0.05, glassT + 0.08, t), hk2 = ss(glassT + 0.07, glassT + 0.2, t);
    storeInterior(g, cam, E, {
      outside: [mimicSprite(mz, mx, pose, bend > 0.2 ? 0 : -30, { jaw: 2.8, fogMul: 0.2, lit: 0.35, dark: 0.15 + bend * 0.3, alpha: 1 - bend })],
      onGlass: g => { const p = proj(cam, ...faceAt); if (!p) return; const S_ = p[2] * 0.2;
        if (bend > 0) { g.save(); g.globalAlpha = bend; mimicFaceBig(g, p[0] + (1 - bend) * 120, p[1] - (1 - bend) * 260, S_, { t, talk: t > begT ? 0.6 : 0, jitter: 0.25, tilt: -8 + noise(t * 1.3) * 5, look: -0.6 }); g.restore();
          g.fillStyle = `rgba(235,235,225,${0.18 * bend})`; ell(g, p[0] - S_ * 0.1, p[1] - S_ * 0.7, S_ * 0.35, S_ * 0.25); g.fill(); ell(g, p[0] - S_ * 0.08, p[1] - S_ * 0.15, S_ * 0.12, S_ * 0.08); g.fill(); }
        handOnGlass(g, p[0] - S_ * 1.9, p[1] + S_ * 0.1, S_ * 0.95, -0.3, hk, t, 1); handOnGlass(g, p[0] + S_ * 1.9, p[1] - S_ * 0.3, S_ * 0.95, 0.35, hk2, t, 2); },
      glassFx: g => { const p = proj(cam, faceAt[0], faceAt[1] - 0.45, faceAt[2]); if (p) breathFog(g, p[0], p[1], p[2] * 0.35, t, bend); },
      inside: [{ z: sitZ, draw: (g, cam, E) => { const p = proj(cam, sitX, 0, sitZ); if (!p) return; drawRig(g, YOU, earsPose(t, sit, { tremble: t > pressT ? 1 : 0.3 }), p[0], p[1], p[2], 0, { t, expr: sit > 0.5 ? 'closed' : 'scared' }); } }],
      lock: 1,
    });
    if (t > pressT && t < pressT + 1) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, 700, 800, [110, 10, 15], 0.18 * (1 - inv(pressT, pressT + 1, t))); g.restore(); }
    g.fillStyle = `rgba(0,0,0,${0.12 * ck})`; g.fillRect(0, 0, W, H); vignette(g, 0.6 + 0.1 * ck);
    if (t < gB + 0.4) { g.save(); g.globalAlpha = 1 - ss(gB, gB + 0.4, t); ui5(g, t); g.restore(); }
  } });

  // ===== 6. split close-up: it begs in your mother's voice — don't say a word =====
  const dA = L('begs').end + 0.05, dB = L('dawn').start - 0.35, dontT = ww('dont', "don't."), sayT = ww('dont', 'say.'), wordT = ww('dont', 'word.');
  cue(dA, 'hit', 0.6); cue(m3T, 'mimic3', 1); cue(dontT, 'heartbeat', 1); cue(sayT, 'heartbeat', 1); cue(wordT, 'heartbeat', 1); cue(wordT + 0.4, 'breathstop', 0.6);
  S.push({ a: dA, b: dB, fade: 0, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#05060b'; g.fillRect(0, 0, W, H);
    // top: its face against the glass (night outside, canopy glow behind it)
    g.save(); g.beginPath(); g.rect(0, 0, W, 1000); g.clip();
    const bg = g.createLinearGradient(0, 0, 0, 1000); bg.addColorStop(0, '#0a0f1e'); bg.addColorStop(1, '#1c1a22'); g.fillStyle = bg; g.fillRect(0, 0, W, 1000);
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 900, 900, 500, DES.lamp, 0.25); g.restore();
    const talk = t > m3T && t < m3T + 1.75 ? 1 : 0.15, push = 1 + 0.06 * inv(dA, dB, t);
    g.save(); g.translate(W / 2, 450); g.scale(push, push); g.translate(-W / 2, -450);
    mimicFaceBig(g, W / 2 - 20, 330, 190, { t, talk, jitter: 0.3, tilt: -6 + noise(t * 1.2) * 5, look: 0.5, eyeBig: ss(dontT, wordT, t) });
    handOnGlass(g, 150, 520, 190, -0.4, 1, t, 3); handOnGlass(g, 930, 450, 190, 0.45, 1, t, 4);
    g.restore();
    breathFog(g, W / 2, 620, 260, t, 1);
    g.fillStyle = 'rgba(255,220,180,0.05)'; g.fillRect(0, 0, W, 1000); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 30; g.beginPath(); g.moveTo(-50, 600); g.lineTo(500, -50); g.stroke();
    g.restore();
    // frame bar between
    g.fillStyle = '#2a251f'; g.fillRect(0, 990, W, 40); g.fillStyle = '#8d8f94'; g.fillRect(0, 985, W, 12);
    // bottom: your face — eyes shut, hands on the ears, lips pressed
    const pulse = [dontT, sayT, wordT].reduce((a, b) => a + (t > b ? Math.exp(-(t - b) * 6) : 0), 0);
    g.save(); g.beginPath(); g.rect(0, 1030, W, H - 1030); g.clip(); const ig = g.createLinearGradient(0, 1030, 0, H); ig.addColorStop(0, '#3b342c'); ig.addColorStop(1, '#1a1612'); g.fillStyle = ig; g.fillRect(0, 1030, W, H);
    youFaceBig(g, W / 2, 1520 - pulse * 10, 270 * (1 + 0.04 * pulse + 0.05 * inv(dA, dB, t)), { t, tremble: 0.8 + pulse, ears: 1 }); g.restore();
    voiceText(g, t, m3T, m3T + 1.7, 'PLEASE... ANSWER ME.', W / 2, 150, 60);
    if (pulse > 0) { g.fillStyle = `rgba(120,0,0,${0.18 * Math.min(1, pulse)})`; g.fillRect(0, 0, W, H); }
    vignette(g, 0.7);
  } });

  // ===== 7. dawn: the voice goes quiet, it walks back into the desert → follow for part 6 =====
  const zA = dB, walksT = ww('dawn', 'walks') - 0.2, end = T.duration;
  const ctaT = L('cta').start, fol = ww('cta', 'follow,'), six = ww('cta', 'six'), surv = ww('cta', 'survived?');
  const A0 = [12.4, 19.5], A1 = [27, 70], adist = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]);
  const aw = t => clamp((t - walksT) / 9), aph = t => aw(t) * adist / STRIDE(0.9) * TAU;
  cue(L('dawn').start - 0.4, 'birds', 0.8); cue(walksT, 'twitch', 0.5); footCues(walksT, ctaT, aph, 'barefoot', 0.45); cue(ctaT, 'card', 0.7); cue(surv + 0.3, 'like', 0.9); cue(fol, 'follow', 1.0);
  cue(end - 1.25, 'mimicS', 0.9); cue(end - 1.2, 'sting', 0.8);
  S.push({ a: zA, b: end + 0.1, fade: 0.35, draw: (g, t) => {
    const back_ = ss(end - 1.3, end - 0.7, t);
    const dawn = 0.85 * ss(zA - 0.3, L('dawn').start + 1.4, t) * (1 - 0.85 * back_);
    const E = envAt(t, dawn);
    const cam = keys([{ t: zA, x: 11.6, y: 1.2, z: -1.0, hy: 1060 }, { t: ctaT, x: 11.9, y: 1.4, z: -2.5, hy: 1060 }, { t: end, x: 12.1, y: 1.5, z: -3.2, hy: 1060 }], t); cam.f = F_ROAD;
    const k = aw(t), mx = lerp(A0[0], A1[0], k), mz = lerp(A0[1], A1[1], k);
    const turnBack = ss(end - 1.25, end - 0.85, t);
    const pose = k > 0 && k < 1 && turnBack < 0.5 ? mimicWalk(aph(t), 0.9, 0) : idlePose(t, { headPitch: 25 });
    const ex = [mimicSprite(mz, mx, pose, lerp(k > 0 ? 165 : -20, 0, turnBack), { jaw: 2.8, fogMul: lerp(0.5, 1.1, dawn), lit: 0, dark: back_ * 0.5, eyeGlow: turnBack })];
    ex.push(youSprite(22.6, 5.6, standPose(t), 25, { expr: 'scared' }));
    desertScene(g, cam, E, ex, { lamps: 1 - dawn * 0.6 });
    vignette(g, 0.45);
    voiceText(g, t, end - 1.2, end + 1, 'SWEETIE...?', W * 0.7, 1000, 48);
    if (t > ctaT - 0.05) {
      bigWord(g, t, ctaT, end + 1, 'WOULD YOU HAVE', '#ffffff', 300, 84); bigWord(g, t, surv, end + 1, 'SURVIVED?', '#ffd23f', 400, 104);
      if (t > surv + 0.3) { const k = popK(t, surv + 0.3, 0.35); g.save(); g.translate(W / 2 - 170, 600); g.scale(k, k); g.fillStyle = '#ff2f55'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-90, -30, -50, -100, 0, -55); g.bezierCurveTo(50, -100, 90, -30, 0, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.restore(); }
      if (t > fol) { const k = popK(t, fol, 0.35); g.save(); g.translate(W / 2 + 90, 590); g.scale(k, k); rr(g, -170, -55, 340, 110, 30); g.fillStyle = '#fe2c55'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ FOLLOW', 0, 3); g.restore(); }
      if (t > six - 0.05) { const k = popK(t, six - 0.05, 0.4); g.save(); g.translate(W / 2, 760); g.scale(k, k); rr(g, -190, -48, 380, 96, 24); g.fillStyle = 'rgba(8,8,12,0.88)'; g.fill(); g.strokeStyle = '#c4161c'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 6 SOON', 0, 3); g.restore(); }
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

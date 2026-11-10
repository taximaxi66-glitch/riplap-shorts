// ---------- THE CREASE: the film ----------
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
function heartFollow(g, t, tH, tF, y) {
  if (t > tH) { const k = popK(t, tH, 0.35); g.save(); g.translate(W / 2 + 20, y); g.scale(k * 0.8, k * 0.8); g.fillStyle = '#ff2f55'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-90, -30, -50, -100, 0, -55); g.bezierCurveTo(50, -100, 90, -30, 0, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.restore(); }
  if (t > tF) { const k = popK(t, tF, 0.35); g.save(); g.translate(W / 2 + 290, y - 10); g.scale(k * 0.8, k * 0.8); rr(g, -170, -55, 340, 110, 30); g.fillStyle = '#fe2c55'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ FOLLOW', 0, 3); g.restore(); }
}
function commentChip(g, t, t0, y, cx) {
  if (t < t0) return; const k = popK(t, t0, 0.35);
  g.save(); g.translate(cx, y); g.scale(k * 0.78, k * 0.78); rr(g, -260, -50, 520, 100, 28); g.fillStyle = 'rgba(8,8,12,0.86)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#ffd23f'; rr(g, -225, -28, 70, 48, 14); g.fill(); poly(g, [[-210, 18], [-190, 18], [-214, 36]]); g.fill();
  g.fillStyle = '#111'; for (let i = 0; i < 3; i++) { ell(g, -205 + i * 15, -4, 5, 5); g.fill(); }
  g.fillStyle = '#fff'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COMMENT', 40, 3); g.restore();
}
// blurred kitchen behind close-ups
function kitchenBokeh(g, t, E, cam, o = {}) {
  const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H); kitchenScene(L.g, cam, E, o.extras || [], o.ko || {});
  g.save(); g.filter = `blur(${o.blur || 8}px)`; g.drawImage(L.c, 0, 0); g.restore();
  g.fillStyle = `rgba(4,6,14,${o.dim == null ? 0.35 : o.dim})`; g.fillRect(0, 0, W, H);
}
// your face, lit warm from one side by the fridge
function yourFace(g, t, cx, cy, S, o = {}) {
  const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H);
  humanFaceOpen(L.g, cx, cy, S, { t, ...o });
  L.g.save(); L.g.globalCompositeOperation = 'source-atop';
  const lit = o.lit == null ? 1 : o.lit, side = o.lightSide || 1;
  const gr = L.g.createLinearGradient(cx + side * S * 1.3, 0, cx - side * S * 1.1, 0); gr.addColorStop(0, `rgba(255,205,140,${0.38 * lit})`); gr.addColorStop(0.55, 'rgba(255,205,140,0)'); gr.addColorStop(1, `rgba(6,8,20,${0.55})`);
  L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H); L.g.fillStyle = `rgba(6,8,20,${0.18 + 0.4 * (1 - lit)})`; L.g.fillRect(0, 0, W, H); L.g.restore();
  g.drawImage(L.c, 0, 0);
}
// your pose at the fridge (facing it, reaching in)
function fridgePose(t, reach = 0, o = {}) {
  const p = humanIdle(t, { headPitch: o.headPitch || 8, headRoll: o.headRoll || 0 });
  p.armR = [lerp(p.armR[0], 62, reach), lerp(p.armR[1], 30, reach), 6]; p.lean = 6 + reach * 4;
  return p;
}
// screen-relative rig yaw for a world facing angle (0 = facing -z)
const ryaw = (cam, wy) => wy - (cam.yaw || 0);
// fridge-lit human in the kitchen
function youSprite(cam, x, z, pose, wy, o = {}) { return { x, z, draw: (g, c, E) => litSprite(g, c, E, x, z, (lg, p) => drawRig(lg, HUMAN, pose, p[0], p[1], p[2], ryaw(c, wy), { t: E.t, expr: 'scared' }), { h: 1.9, shadowW: 0.3, lit: o.lit == null ? 0.8 : o.lit, fogMul: 0.15, dark: o.dark == null ? 0.7 : o.dark }) }; }
// a world-space creature sprite
function crSprite(o, lo = {}) { const s = creaseSprite(o, o.z, lo); s.x = o.x; return s; }
// walking with planted feet along a straight path: returns {x, z, feetW, bob}
function creaseWalk(p0, p1, u, stride = 0.62, lift = 0.16, width = 0.26) {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), d = [(p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L], sd = [d[1], -d[0]];
  const at = (s, side) => [p0[0] + d[0] * s + sd[0] * side * width, p0[1] + d[1] * s + sd[1] * side * width];
  const c = u / stride, feet = {};
  for (const [nm, side, off] of [['L', -1, 0], ['R', 1, 1]]) {
    const cc = c + off, n = Math.floor(cc / 2), f = cc / 2 - n;     // each foot: stands for half a 2-step cycle, swings for the other half
    let s, y = 0;
    if (f < 0.5) s = (n * 2 - off + 1) * stride; else { const k = (f - 0.5) * 2, ke = eio(k); s = lerp((n * 2 - off + 1) * stride, (n * 2 - off + 3) * stride, ke); y = Math.sin(k * Math.PI) * lift; }
    s = clamp(s - stride, 0, L); const q = at(s, side); feet[nm] = [q[0], y, q[1]];
  }
  const b = at(clamp(u, 0, L), 0);
  return { x: b[0], z: b[1], feetW: feet, bob: -Math.abs(Math.sin(c * Math.PI)) * 0.05 };
}

let SHOTS = [];
function buildShots() {
  const L = id => LN(id), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  const YOU = [1.6, 4.72];      // you, at the fridge
  const CRS = [-1.8, 5.05];     // where it stands up, in front of the back door
  cue(0.0, 'hum', 0.9); cue(0.0, 'rainbed', 1.0);

  // ===== 1. 2:13 AM: the kitchen, the fridge opens =====
  const s1B = L('quiet').start - 0.35, openT = 0.35;
  cue(openT, 'fridge', 1.0); cue(ww('hook', 'sneak'), 'step', 0.25); cue(ww('hook', 'snack.'), 'cloth', 0.4);
  S.push({ a: 0, b: s1B, fade: 0, draw: (g, t) => {
    const open = eout(inv(openT, openT + 1.1, t)), E = envK(t, { fridge: open });
    const pk = eio(inv(0, s1B, t));
    const cam = { x: lerp(0.95, 1.05, pk), y: 1.95, z: lerp(1.2, 1.8, pk), f: 1000, hy: 640 };
    const pose = fridgePose(t, ss(ww('hook', 'midnight'), ww('hook', 'snack.') + 0.3, t));
    kitchenScene(g, cam, E, [youSprite(cam, YOU[0], YOU[1], pose, 180, { lit: 0.25 + 0.6 * open })], { fridgeOpen: open, skip: ['chair2'],
      win: { outside: (g, cam, E) => { // two pale eyes low in the garden: barely visible, gone after a moment
        const k = 1 - ss(2.2, 2.8, t); if (k <= 0) return; for (const sd of [-1, 1]) { const e = proj(cam, -0.35 + sd * 0.1, 1.3, 7.0); if (e) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, e[0], e[1], 0.25 * e[2], CR.eye, 0.7 * k); g.restore(); g.fillStyle = rgb(CR.eye, k); ell(g, e[0], e[1], 0.035 * e[2], 0.035 * e[2]); g.fill(); } } } } });
    vignette(g, 0.6);
    chip(g, t, 0.12, s1B - 0.25, '2:13 AM', '#9fb6ff', 250);
  } });

  // ===== 2. your face in the fridge light, calm... then your eyes snap to the window =====
  const s2A = s1B, s2B = ww('tap', 'tap.') - 0.12, thenT = ww('tap', 'Then...');
  cue(s2A, 'whoosh', 0.25); cue(thenT - 0.25, 'tap', 0.5);
  const s2M = ww('quiet', 'The') - 0.1;
  cue(s2M, 'whoosh', 0.2);
  S.push({ a: s2A, b: s2M, fade: 0.3, draw: (g, t) => {   // the dark hall + stairs: everyone upstairs is asleep
    const E = envK(t); const pk = eio(inv(s2A, s2M, t));
    const cam = { x: lerp(0.9, 0.55, pk), y: 1.5, z: 2.05, f: 1000, hy: 900, yaw: -90 };
    kitchenScene(g, cam, E, [], { skip: ['table', 'chair1', 'chair2', 'pendant'] });
    vignette(g, 0.65);
  } });
  S.push({ a: s2M, b: s2B, fade: 0.2, draw: (g, t) => {
    const E = envK(t);
    kitchenBokeh(g, t, E, { x: 0.6, y: 1.55, z: 3.0, f: 900, hy: 900, yaw: 30 }, { blur: 9, dim: 0.35 });
    const pk = eio(inv(s2A, s2B, t));
    const look = -ss(thenT - 0.25, thenT + 0.05, t) * 0.9;
    yourFace(g, t, W / 2 + 40, 900 + pk * 10, lerp(330, 350, pk), { wide: lerp(0.15, 0.7, ss(thenT - 0.25, thenT + 0.1, t)), look, tremble: 0.2 + 0.5 * ss(thenT, thenT + 0.3, t), lightSide: 1 });
    vignette(g, 0.7);
  } });

  // ===== 3. the kitchen window: tap... tap... tap (in the dark, could be a branch) =====
  const s3A = s2B, noT = ww('branch', 'No.'), s3B = noT - 0.04;
  const tapTimes = [ww('tap', 'tap.'), ww('tap', 'Tap.', 0), ww('tap', 'Tap.', 1), ww('win', 'tapping') + 0.05, ww('win', 'tapping') + 0.3, ww('win', 'window.') + 0.15, ww('branch', 'Just') - 0.05];
  tapTimes.forEach((x, i) => cue(x, 'tap', i < 3 ? 1.0 : 0.8));
  cue(s3A, 'whoosh', 0.3); cue(ww('branch', 'branch?'), 'creak', 0.25);
  // fingers: tips pressing the glass in turn
  const fingerTap = (t, f) => { let p = 0; tapTimes.forEach((x, i) => { if ((i + f) % 4 === 0 || (i > 2 && f === (i % 4))) { const d = t - x; if (d > -0.09 && d < 0.2) p = Math.max(p, d < 0 ? 1 + d / 0.09 : 1 - d / 0.2); } }); return p; };
  const drawFingers = (g, cam, E, t, litK, drag = 0) => {
    const skin = rgb(mixc([20, 22, 30], [196, 191, 178], litK)), sh = rgb(mixc([12, 14, 20], [128, 123, 112], litK));
    // the flat palm, just below the sill outside
    const pa = proj(cam, 0.12, 1.0 - drag, 6.14), pb = proj(cam, 0.15, 1.18 - drag, 6.12);
    if (pa && pb) { g.fillStyle = sh; g.strokeStyle = CR.ink; g.lineWidth = 4; g.beginPath(); g.ellipse(pb[0], pb[1] + 0.03 * pb[2], 0.15 * pb[2], 0.1 * pb[2], -0.15, 0, TAU); g.fill(); g.stroke(); }
    for (let f = 0; f < 4; f++) {
      const tap = fingerTap(t, f), bx = -0.02 + f * 0.09, tipY = 1.44 + [0, 0.08, 0.1, 0.03][f] - drag * 1.0, z = 6.05 - tap * 0.05;
      const a = proj(cam, bx + 0.09 + (f - 1.5) * -0.02, 1.15 - drag, 6.12), b = proj(cam, bx + (f - 1.5) * 0.02 + Math.sin(t * 0.7 + f) * 0.004, tipY, z); if (!a || !b) continue;
      creaseFinger(g, a[0], a[1], b[0], b[1], 0.044 * b[2], tap * litK + litK * 0.3, { skin, shade: sh, bend: 0.06 + f * 0.02, side: f < 2 ? 1 : -1 });
    }
  };
  S.push({ a: s3A, b: s3B, fade: 0, draw: (g, t) => {
    const E = envK(t); const pk = eio(inv(s3A, s3B, t)), br = ss(ww('branch', 'Just') - 0.2, ww('branch', 'branch?') + 0.2, t);
    const cam = { x: lerp(-0.1, 0.0, pk) - br * 0.15, y: lerp(1.6, 1.62, pk) + br * 0.1, z: lerp(4.7, 4.95, pk), f: 1000, hy: 960 };
    kitchenScene(g, cam, E, [], { win: { outside: (g, cam, E) => drawFingers(g, cam, E, t, 0.16) } });
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, W, H); vignette(g, 0.65);
  } });

  // ===== 4. NO. those are fingers (punch in, the glass catches the fridge light) =====
  const s4A = s3B, goneT = ww('gone', 'gone.'), s4B = goneT + 0.45, fingT = ww('branch', 'fingers.');
  cue(goneT + 0.1, 'drop', 1.4); cue(L('door').start + 2.0, 'drop', 0.9); cue(s4A, 'hit', 0.7); cue(s4A, 'sting', 0.8); cue(ww('gone', 'Then') + 0.1, 'slide', 0.9); cue(ww('gone', 'Then') + 0.1, 'squeak', 0.8);
  S.push({ a: s4A, b: s4B, fade: 0, draw: (g, t) => {
    const E = envK(t); const pk = eout(inv(s4A, s4A + 0.5, t));
    const cam = { x: 0.12, y: 1.52, z: lerp(4.85, 5.1, pk) + 0.05 * inv(s4A, s4B, t), f: 1300, hy: 820 };
    const drag = ein(inv(ww('gone', 'Then') + 0.05, goneT + 0.05, t));
    kitchenScene(g, cam, E, [], { win: { outside: (g, cam, E) => drawFingers(g, cam, E, t, 1 - drag * 0.3, drag * 0.9),
      glass: (g, cam, E) => { // fog of breath + the smears the fingertips leave
        const fb = proj(cam, 0.14, 1.32 - drag * 0.3, 6.0); if (fb) { g.fillStyle = `rgba(200,210,225,${0.08 + 0.05 * Math.sin(t * 2.2)})`; ell(g, fb[0], fb[1], 0.25 * fb[2], 0.12 * fb[2]); g.fill(); }
        if (drag > 0) for (let f = 0; f < 4; f++) { const a = proj(cam, -0.02 + f * 0.09 + (f - 1.5) * 0.02, 1.44 + [0, 0.08, 0.1, 0.03][f], 5.99), b = proj(cam, -0.02 + f * 0.09 + (f - 1.5) * 0.02, 1.44 - drag * 0.3, 5.99); if (a && b) { g.strokeStyle = 'rgba(225,225,215,0.13)'; g.lineWidth = 0.025 * a[2]; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], Math.min(b[1], H)); g.stroke(); } } } } });
    // warm reflection of the fridge glow on the glass edge
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W * 0.95, H * 0.55, 600, KC.warm, 0.12); g.restore();
    vignette(g, 0.6);
  } });

  // ===== 5. silence. your face. =====
  const s5A = s4B, s5B = L('door').start - 0.05;
  S.push({ a: s5A, b: s5B, fade: 0.12, draw: (g, t) => {
    const E = envK(t); kitchenBokeh(g, t, E, { x: 0.6, y: 1.55, z: 3.0, f: 900, hy: 900, yaw: 30 }, { blur: 9, dim: 0.4 });
    yourFace(g, t, W / 2 + 40, 910, 360, { wide: 1, look: -0.8, tremble: 0.7, lightSide: 1 });
    vignette(g, 0.7);
  } });

  // ===== 6. something creaks at the back door: knob, shadows in the gap of light =====
  const s6A = s5B, s6B = ww('gap', 'hand') - 0.3, creakT = ww('door', 'creaks');
  cue(s6A, 'whoosh', 0.3); cue(creakT, 'creak', 1.0); cue(creakT + 0.05, 'knob', 0.9); cue(ww('door', 'door.') + 0.1, 'knob', 0.6); cue(ww('door', 'back') , 'step', 0.4); cue(ww('door', 'door.') + 0.3, 'step', 0.35);
  S.push({ a: s6A, b: s6B, fade: 0.25, draw: (g, t) => {
    const E = envK(t); const pk = eio(inv(s6A, s6B, t));
    const cam = { x: -1.55, y: lerp(1.25, 0.9, pk), z: lerp(3.15, 3.55, pk), f: 1000, hy: lerp(980, 900, pk), yaw: -4 };
    const knob = ss(creakT - 0.05, creakT + 0.05, t) * (1 - ss(creakT + 0.7, creakT + 0.9, t)) + ss(ww('door', 'door.'), ww('door', 'door.') + 0.1, t) * (1 - ss(ww('door', 'door.') + 0.4, ww('door', 'door.') + 0.6, t));
    kitchenScene(g, cam, E, [], { skip: ['chair2', 'table', 'chair1', 'pendant'], door: { knob, shake: knob * Math.sin(t * 40),
      gapShadow: (g, cam, E, sp) => { // two dark shapes (feet) move along the line of light
        for (const [x0, ph] of [[-2.05, 0], [-1.75, 0.6]]) { const x = x0 + Math.sin(t * 0.9 + ph) * 0.04 + ss(creakT - 0.6, creakT, t) * 0.08; const a = proj(cam, x - 0.09, 0, 5.98), b = proj(cam, x + 0.09, BD.gap, 5.98); if (a && b && t > s6A + 0.2) { g.fillStyle = 'rgba(5,6,10,0.92)'; g.fillRect(a[0], b[1] - 2, b[0] - a[0], a[1] - b[1] + 4); } } } } });
    vignette(g, 0.65);
  } });

  // ===== 7. a hand slides through the gap underneath: flat, like paper =====
  const s7A = s6B, s7B = L('unfold').start - 0.2, handT = ww('gap', 'hand'), flatT = ww('gap', 'Flat.');
  const slideZ = t => 10.4 - 0.85 * ss(handT - 0.2, ww('gap', 'underneath.') + 0.3, t) - 0.55 * ss(flatT - 0.2, s7B, t) - 0.1 * inv(s7A, s7B, t);
  cue(s7A, 'whoosh', 0.25); cue(handT - 0.1, 'paper', 1.0); cue(ww('gap', 'slides'), 'slide', 0.6); cue(flatT - 0.15, 'paper', 1.1); cue(flatT, 'sting', 0.6); cue(ww('gap', 'paper.'), 'crinkle', 0.9);
  S.push({ a: s7A, b: s7B, fade: 0.15, draw: (g, t) => {
    const E = envK(t); const pk = eio(inv(s7A, s7B, t));
    const cam = { x: -1.7, y: 0.34, z: lerp(4.45, 4.3, pk), f: 1000, hy: 700 };
    const rz = slideZ(t), fp = proj(cam, -1.8, 0, 5.985);
    const sp = crSprite({ x: -1.82, z: rz, yaw: 0, legA: 90, torsoA: 90, armAbsAll: 90, armSpread: -17, elbow: 0, clampZ: 5.985, fingerSpread: lerp(0.05, 0.28, ss(handT + 0.3, handT + 1.2, t)), floorY: 0.004, mouth: 0.1, eyes: 0, twitch: 1, t }, { warm: 0.25, dark: 0.35, lightX: W });
    kitchenScene(g, cam, E, [{ x: -1.82, z: 5.4, draw: (g, cam, E) => { g.save(); if (fp) { g.beginPath(); g.rect(0, fp[1] + 3, W, H); g.clip(); } sp.draw(g, cam, E); g.restore(); } }], { skip: ['chair2', 'table', 'chair1', 'pendant'], door: { gapDim: 1 } });
    vignette(g, 0.65);
  } });

  // ===== 8. it peels itself off the floor... and unfolds =====
  const s8A = s7B, s8B = L('eyes').start - 0.15, peelT = ww('unfold', 'peels'), unfT = ww('unfold', 'unfolds.');
  cue(s8A, 'whoosh', 0.25); cue(s8A + 0.1, 'paper', 0.8); cue(peelT, 'crinkle', 1.0); cue(peelT + 0.45, 'bonecrack', 0.7); cue(ww('unfold', 'floor,'), 'crinkle', 0.8);
  cue(unfT - 0.05, 'crinkle', 1.2); cue(unfT + 0.05, 'bonecrack', 1.0); cue(unfT + 0.05, 'hit', 0.8); cue(unfT + 0.05, 'sting', 0.9); cue(unfT + 0.55, 'bonecrack', 0.9); cue(unfT + 0.6, 'twitch', 0.8);
  const crPose8 = t => {
    const z = lerp(slideZ(s8A), 5.05, ss(s8A, peelT + 0.1, t));
    const k1 = ss(peelT, unfT - 0.2, t);                    // legs stand up, upper body flops over
    const k2 = eout(inv(unfT - 0.05, unfT + 0.3, t));        // snap upright
    const k3 = ss(unfT + 0.45, unfT + 0.75, t);              // head flips over to the side
    const legA = lerp(90, 0, k1), torsoA = k2 > 0 ? lerp(lerp(90, 128, k1), 10, k2) + Math.sin(k2 * Math.PI) * -12 : lerp(90, 128, k1);
    const armAbsAll = k2 > 0 ? lerp(lerp(90, 168, k1), 180, k2) : lerp(90, 168, k1);
    return { x: -1.82, z, yaw: 0, legA, torsoA, headA: lerp(lerp(0, 55, k1), 18, k3), headRoll: lerp(0, 72, k3) + noise(t * 3) * 3 * k3, armAbsAll, armSpread: lerp(-17, 10, ss(peelT - 0.2, unfT + 0.2, t)), elbow: lerp(0, 14, k2), hipH: lerp(1.25, 1.15, k2), clampZ: z + 2.6 > 6 && k1 < 0.02 ? 5.985 : null, flatLegs: k1 < 0.6, floorY: 0.004, eyes: k3, mouth: 0.15, twitch: 1, t };
  };
  S.push({ a: s8A, b: s8B, fade: 0.15, draw: (g, t) => {
    const E = envK(t); const pk = eio(inv(s8A, s8B, t)), jolt = Math.exp(-Math.max(0, t - unfT) * 8) * (t > unfT ? 1 : 0);
    const cam = { x: lerp(-0.85, -0.95, pk), y: lerp(1.15, 1.35, pk) + jolt * 0.02, z: lerp(2.15, 2.45, pk), f: 960, hy: lerp(1000, 900, pk), yaw: -10 };
    kitchenScene(g, cam, E, [crSprite(crPose8(t), { warm: 0.28, dark: 0.5, lightX: W })], { skip: ['chair2', 'table', 'pendant'] });
    vignette(g, 0.62);
  } });

  // ===== 9. its eyes shine in the fridge light (face close-up) =====
  const s9A = s8B, s9B = L('you').start - 0.12, shineT = ww('eyes', 'shine'), seesT = ww('eyes', 'sees');
  cue(s9A, 'whoosh', 0.3); cue(shineT - 0.05, 'shine', 1.0); cue(seesT, 'twitch', 0.9); cue(seesT + 0.05, 'bonecrack', 0.6); cue(ww('eyes', 'lit.') + 0.2, 'breath', 0.9);
  S.push({ a: s9A, b: s9B, fade: 0.2, draw: (g, t) => {
    const E = envK(t); kitchenBokeh(g, t, E, { x: -1.0, y: 1.9, z: 3.2, f: 800, hy: 760, yaw: 40 }, { blur: 10, dim: 0.5 });
    const pk = eio(inv(s9A, s9B, t)), tw = Math.exp(-Math.max(0, t - seesT) * 6) * (t > seesT ? 1 : 0);
    creaseFaceBig(g, W / 2 - 10 + tw * 40, lerp(860, 900, pk), lerp(300, 345, pk), { t, eyes: ss(shineT - 0.15, shineT + 0.35, t), mouth: lerp(0.05, 0.35, ss(seesT, s9B, t)), tilt: lerp(-38, -30, pk) + tw * 25 + noise(t * 0.8) * 3, jitter: 0.3 + tw, rim: ss(s9A, shineT + 0.3, t), look: 0.4 });
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 0, W, H); vignette(g, 0.7);
  } });

  // ===== 10. and the only light in the house... is on you (over its shoulder) =====
  const s10A = s9B, s10B = L('closer').start - 0.12, youT = ww('you', 'you.');
  cue(s10A, 'whoosh', 0.3); cue(youT, 'sting', 0.5); cue(youT - 0.1, 'bonecrack', 0.8);
  S.push({ a: s10A, b: s10B, fade: 0.25, draw: (g, t) => {
    const E = envK(t); const pk = eio(inv(s10A, s10B, t));
    const cam = { x: lerp(-2.25, -2.15, pk), y: 1.7, z: lerp(1.85, 2.05, pk), f: 900, hy: 860, yaw: lerp(44, 40, pk) };
    const turn = ss(youT - 0.15, youT + 0.1, t);
    const co = { x: -1.0, z: 4.5, yaw: lerp(120, 95, turn), torsoA: 10, headA: 18, headRoll: lerp(72, 40, turn) + noise(t * 3) * 3, hipH: 1.15, armSpread: 10, elbow: 14, eyes: 1, mouth: 0.2, twitch: 1, t };
    kitchenScene(g, cam, E, [crSprite(co, { warm: 0.25, dark: 0.6, lightX: W }), youSprite(cam, YOU[0], YOU[1], fridgePose(t, 0.6), 180, { lit: 0.9 })], { skip: [] });
    vignette(g, 0.62);
  } });

  // ===== 11. it twitches closer (from your side of the kitchen) =====
  const s11A = s10B, s11B = L('two').start - 0.12, twT = ww('closer', 'twitches');
  const p0 = [-1.25, 4.55], p1 = [-0.1, 4.45];
  const stepU = t => { // stop-start: frozen, then jerks two fast steps, frozen again
    const k = (t - twT + 0.1); if (k < 0) return 0; const seg = [[0, 0.25, 0, 0.62], [0.55, 0.75, 0.62, 1.24], [1.05, 1.22, 1.24, 1.86]]; let u = 0;
    for (const [a, b, ua, ub] of seg) { if (k >= b) u = ub; else if (k > a) u = lerp(ua, ub, eio((k - a) / (b - a))); } return u; };
  [0.0, 0.55, 1.05].forEach(d => { cue(twT - 0.1 + d + 0.12, 'stomp', 0.9); cue(twT - 0.1 + d + 0.05, 'crinkle', 0.6); });
  cue(s11A, 'whoosh', 0.25);
  S.push({ a: s11A, b: s11B, fade: 0.12, draw: (g, t) => {
    const E = envK(t); const u = stepU(t), wk = creaseWalk(p0, p1, u, 0.31, 0.18, 0.24);
    const cam = { x: 2.05, y: 1.62, z: 4.0, f: 900, hy: 900, yaw: -68 };
    const jerk = noise(t * 14) * 6 * (1 - ss(0, 0.2, Math.abs(((t - twT) % 0.5) - 0.25)));
    const co = { x: wk.x, z: wk.z, yaw: 95, feetW: wk.feetW, torsoA: 14 + jerk * 0.5, headA: 18, headRoll: 40 + noise(t * 4) * 8 + jerk, hipH: 1.13 + wk.bob, armSpread: 10, elbow: 14, eyes: 1, mouth: 0.25, twitch: 1, t };
    kitchenScene(g, cam, E, [crSprite(co, { warm: 0.3, dark: 0.45, lightX: W * 0.9 })], { skip: ['pendant'] });
    vignette(g, 0.62);
  } });

  // ===== 12. two options... A: slam the fridge shut and freeze in total darkness =====
  const s12A = s11B, s12B = L('optB').start - 0.15, twoT = ww('two', 'two'), slamT = ww('optA', 'Slam'), darkT = ww('optA', 'darkness.');
  cue(twoT, 'card', 0.8); cue(L('optA').start, 'card', 0.9); cue(darkT - 0.3, 'slam', 1.0); cue(darkT - 0.2, 'heartbeat', 0.9);
  S.push({ a: s12A, b: s12B, fade: 0.2, draw: (g, t) => {
    const close = ein(inv(darkT - 0.55, darkT - 0.3, t)), open = 1 - close * 0.985, E = envK(t, { fridge: 1, moon: 1 });
    const cam = { x: lerp(0.3, 0.4, inv(s12A, s12B, t)), y: 1.6, z: 2.4, f: 900, hy: 900, yaw: 4 };
    const pose = fridgePose(t, 0.5 * (1 - close)); pose.armL = [lerp(10, 50, ss(slamT - 0.2, darkT - 0.4, t)), 20, 10];
    const co = { x: -0.6, z: 4.85, yaw: 70, torsoA: 16, headA: 18, headRoll: 35 + noise(t * 3) * 6, hipH: 1.13, armSpread: 10, elbow: 14, eyes: 1, mouth: 0.3, twitch: 1, t };
    kitchenScene(g, cam, E, [crSprite(co, { warm: 0.3 * open, dark: 0.45 + 0.4 * close, lightX: W }), youSprite(cam, YOU[0], YOU[1], pose, 180, { lit: 0.9 * open, dark: 0.7 + 0.3 * close })], { fridgeOpen: open, light: open, skip: ['pendant'] });
    // darkness falls, only its eyes stay
    if (close > 0) { g.fillStyle = `rgba(2,3,8,${0.72 * close})`; g.fillRect(0, 0, W, H); const J = creaseJoints(co); for (const sd of [-1, 1]) { const e = proj(cam, ...v3.add(v3.add(J.head, v3.mul(J.hx, sd * 0.075)), v3.mul(J.hu, 0.06))); if (e) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, e[0], e[1], 0.12 * e[2], CR.eye, 0.3 * close); g.restore(); g.fillStyle = rgb(CR.eye, 0.7 * close); ell(g, e[0], e[1], 0.02 * e[2], 0.02 * e[2]); g.fill(); } } }
    vignette(g, 0.6);
    bigWord(g, t, twoT - 0.05, L('optA').start - 0.1, '2 OPTIONS', '#ffd23f', 290, 110);
    optionCard(g, t, L('optA').start, 'A', 'SLAM THE FRIDGE', 'AND FREEZE IN THE DARK', ww('optA', 'freeze'), 270, '#3ee07a');
  } });

  // ===== 13. B: leave it open and run for the stairs =====
  const s13A = s12B, s13B = L('q').start - 0.12, runT = ww('optB', 'run');
  const runX = t => lerp(-1.1, -3.4, ss(runT - 0.25, s13B + 0.4, t) * 0.6 + 0.4 * inv(runT - 0.25, s13B + 0.4, t));
  cue(L('optB').start, 'card', 0.9);
  for (let x = runT - 0.15; x < s13B; x += 0.27) cue(x, 'step', 0.8);
  S.push({ a: s13A, b: s13B, fade: 0.2, draw: (g, t) => {
    const E = envK(t); const pk = eio(inv(s13A, s13B, t));
    const cam = { x: lerp(1.3, 1.1, pk), y: 1.55, z: 2.05, f: 1000, hy: 880, yaw: -90 };
    const rk = ss(runT - 0.3, runT, t), x = runX(t), ph = (x + 1.1) / 1.2 * TAU;
    let pose = humanIdle(t, { headPitch: 0 }); if (rk > 0) pose = blendPose(pose, walkPose(ph, 1, 1), rk);
    const climb = clamp((-2.55 - x) / 0.27) * 0.19 * 0 + Math.max(0, Math.floor((-2.55 - x) / 0.27 + 1)) * 0.19;
    const you = { x, z: 2.05, draw: (g, c, E) => { const p = proj(c, x, Math.max(0, climb), 2.05); if (!p) return; const Lr = scratch(); Lr.g.setTransform(1, 0, 0, 1, 0, 0); Lr.g.clearRect(0, 0, W, H); drawRig(Lr.g, HUMAN, pose, p[0], p[1], p[2], 180 - 0, { t: E.t, expr: 'scared' }); Lr.g.save(); Lr.g.globalCompositeOperation = 'source-atop'; Lr.g.fillStyle = `rgba(8,10,22,${0.35 + 0.35 * clamp((-2.4 - x) / 1.2)})`; Lr.g.fillRect(0, 0, W, H); Lr.g.restore(); g.drawImage(Lr.c, 0, 0); } };
    kitchenScene(g, cam, E, x < -2.45 ? [] : [you], { skip: ['table', 'chair1', 'chair2', 'pendant'], hall: x < -2.45 ? (g, c, E) => you.draw(g, c, E) : null });
    vignette(g, 0.6);
    optionCard(g, t, L('optB').start - 0.02, 'B', 'RUN FOR THE STAIRS', 'LEAVE THE LIGHT ON', ww('optB', 'leave'), 270, '#5aa8ff');
  } });

  // ===== 14. what do you do? =====
  const s14A = s13B, s14B = L('cta').start - 0.12;
  cue(s14A, 'hit', 0.6); cue(s14A, 'sting', 0.6); cue(ww('q', 'do?', 1) + 0.1, 'pop', 0.5);
  S.push({ a: s14A, b: s14B, fade: 0.1, draw: (g, t) => {
    const E = envK(t); kitchenBokeh(g, t, E, { x: 1.2, y: 1.6, z: 3.4, f: 800, hy: 860, yaw: -40 }, { blur: 10, dim: 0.5 });
    const pk = eio(inv(s14A, s14B + 0.3, t));
    creaseFaceBig(g, W / 2, lerp(1000, 960, pk), lerp(300, 340, pk), { t, eyes: 1, mouth: lerp(0.35, 0.75, pk), tilt: -25 + noise(t * 0.8) * 5, jitter: 0.35, rim: 0.8, drool: 1 });
    vignette(g, 0.7);
    optionCard(g, t, s14A + 0.02, 'A', 'SLAM THE FRIDGE', null, 0, 260, '#3ee07a');
    optionCard(g, t, s14A + 0.12, 'B', 'RUN FOR THE STAIRS', null, 0, 420, '#5aa8ff');
  } });

  // ===== 15. CTA: fridge or stairs? =====
  const nA = s14B, end = T.duration, comT = ww('cta', 'comments,'), folT = ww('cta', 'follow'), snapT = end - 1.2;
  cue(nA, 'whoosh', 0.35); cue(ww('cta', 'stairs?'), 'pop', 0.6); cue(comT, 'card', 0.8); cue(folT - 0.35, 'like', 0.9); cue(folT, 'follow', 1.0); cue(snapT, 'bonecrack', 1.0); cue(snapT + 0.03, 'sting', 0.9);
  S.push({ a: nA, b: end + 0.1, fade: 0.3, draw: (g, t) => {
    const E = envK(t); const pk = eio(inv(nA, end, t)), snap = eout(inv(snapT, snapT + 0.18, t));
    const cam = { x: 0.8, y: 1.85, z: lerp(1.3, 1.7, pk), f: 980, hy: 830 };
    const co = { x: 0.05, z: 4.3, yaw: lerp(60, 15, snap), torsoA: 14, headA: lerp(18, 8, snap), headRoll: lerp(40, 0, snap) + noise(t * 3) * 5 * (1 - snap), hipH: 1.13, armSpread: 10, elbow: 14, eyes: 1, mouth: 0.3 + 0.4 * snap, twitch: 1, t };
    kitchenScene(g, cam, E, [crSprite(co, { warm: 0.3, dark: 0.42, lightX: W }), youSprite(cam, YOU[0], YOU[1], fridgePose(t, 0.3, { headRoll: -10 }), 180, { lit: 0.9 })], { skip: ['chair2'] });
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 0, W, H); vignette(g, 0.6);
    bigWord(g, t, nA + 0.05, end + 1, 'FRIDGE', '#3ee07a', 210, 84); bigWord(g, t, ww('cta', 'or'), end + 1, 'OR', '#ffffff', 290, 62); bigWord(g, t, ww('cta', 'stairs?'), end + 1, 'STAIRS?', '#5aa8ff', 375, 84);
    commentChip(g, t, comT, 1580, 290);
    heartFollow(g, t, folT - 0.35, folT, 1580);
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

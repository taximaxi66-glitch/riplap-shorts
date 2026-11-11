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
// ===================== THE CALLER: the film =====================
// blurred hall behind close-ups
function hallBokeh(g, t, E, cam, o = {}) {
  const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H); hallScene(L.g, cam, E, o.extras || [], o.ho || {});
  g.save(); g.filter = `blur(${o.blur || 8}px)`; g.drawImage(L.c, 0, 0); g.restore();
  g.fillStyle = `rgba(4,6,14,${o.dim == null ? 0.35 : o.dim})`; g.fillRect(0, 0, W, H);
}
// ---------- the peephole: the porch through a fisheye lens ----------
let FISH = null;
function peephole(g, t, drawFn, o = {}) {
  if (!FISH) FISH = { c: mkCanvas(), c2: mkCanvas() }; const fg = FISH.c.getContext('2d'); fg.setTransform(1, 0, 0, 1, 0, 0); fg.globalAlpha = 1; fg.clearRect(0, 0, W, H);
  const cx = W / 2, cy = o.cy || 900, R = o.R || 470;
  const g2 = FISH.c2.getContext('2d'); g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalAlpha = 1; g2.clearRect(0, 0, W, H); g2.save(); drawFn(g2); g2.restore();
  fg.save(); fg.filter = 'blur(10px)'; fg.translate(cx, cy); fg.scale(1.9, 1.9); fg.translate(-cx, -cy); fg.drawImage(FISH.c2, 0, 0); fg.restore(); fg.drawImage(FISH.c2, 0, 0);
  g.fillStyle = '#030305'; g.fillRect(0, 0, W, H);
  // barrel distortion in rings: the centre bulges, the edges squeeze
  const N = 30, a = o.bulge == null ? 1.1 : o.bulge;
  for (let i = N; i >= 1; i--) {
    const r = R * i / N, k = 1 / (1 + a * (r / R) * (r / R));
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip(); g.translate(cx, cy); g.scale(1 / k * 0 + (1 + a * 0.15) * k, (1 + a * 0.15) * k); g.translate(-cx, -cy); g.drawImage(FISH.c, 0, 0); g.restore();
  }
  // lens: dark falloff at the rim, glass glint, brass ring
  const vg = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.8, 'rgba(0,0,0,0.35)'); vg.addColorStop(1, 'rgba(0,0,0,0.92)'); g.fillStyle = vg; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,240,220,0.10)'; g.lineWidth = 18; g.beginPath(); g.arc(cx, cy, R * 0.86, Math.PI * 1.08, Math.PI * 1.42); g.stroke();
  g.strokeStyle = 'rgba(255,240,220,0.06)'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, R * 0.8, Math.PI * 0.1, Math.PI * 0.3); g.stroke();
  g.strokeStyle = '#4a3c22'; g.lineWidth = 26; g.beginPath(); g.arc(cx, cy, R + 13, 0, TAU); g.stroke(); g.strokeStyle = '#141008'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R + 27, 0, TAU); g.stroke();
}
// the creature's base placement: pressed to the wall right of the door (porch world), facing the door side
const CB = { x: 1.5, z: -0.55, floorY: 0, yaw: -90, lean: 22 };
const BTN = () => [PO.button[0], PO.button[1], PO.button[2] - 0.01];
function cw(t, o = {}) { return Object.assign({ ...CB, t, tipR: BTN(), curl: 0.35, mouth: 0.1, followNeck: 1, pointR: 1 }, o); }
// your bare feet at the bottom of the frame (POV looking down)
function yourFeet(g, t, shift = 0, o = {}) {
  for (const sd of [-1, 1]) {
    const bx = W / 2 + sd * 170 + (sd > 0 ? shift * 40 : 0), by = 2010 + (sd > 0 ? -shift * 25 : 0);
    g.save(); g.translate(bx, by); g.rotate(sd * 0.06 + (sd > 0 ? shift * 0.08 : 0));
    // pajama leg
    g.fillStyle = '#2b3a5a'; g.strokeStyle = '#0b0c12'; g.lineWidth = 6; g.beginPath(); g.moveTo(-120, 120); g.lineTo(-95, -150); g.lineTo(95, -150); g.lineTo(120, 120); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(160,180,220,0.25)'; g.lineWidth = 5; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 60, -150); g.lineTo(i * 70, 120); g.stroke(); }
    // foot
    const fg = g.createLinearGradient(-80, -400, 80, -200); fg.addColorStop(0, '#d8a684'); fg.addColorStop(1, '#a87a5c');
    g.fillStyle = fg; g.strokeStyle = '#0b0c12'; g.lineWidth = 6; g.beginPath(); g.moveTo(-85, -140); g.bezierCurveTo(-110, -260, -90, -430, -10, -440); g.bezierCurveTo(70, -445, 100, -300, 85, -140); g.closePath(); g.fill(); g.stroke();
    for (let k = 0; k < 5; k++) { const tx = lerp(-70, 70, k / 4) * (sd > 0 ? -1 : 1), ty = -430 + Math.abs(k - (sd > 0 ? 4 : 0)) * 14 - (k === (sd > 0 ? 4 : 0) ? 10 : 0); g.fillStyle = '#c99878'; ell(g, tx, ty, k === (sd > 0 ? 4 : 0) ? 26 : 19, 22); g.fill(); g.stroke(); }
    g.restore();
  }
  g.fillStyle = `rgba(6,8,18,${o.dark == null ? 0.45 : o.dark})`; g.fillRect(0, 1350, W, 570);
}
// long grey fingers coming in through the letterbox (hall world). u = how far in (0..1), feel = sweep, aim = [x,y,z] to point at
function slotFingers(g, cam, E, t, u, o = {}) {
  if (u <= 0.001) return; const zf = 5.96, base = [0, 0.9, 6.02], tw = o.twitch == null ? 1 : o.twitch;
  // the back of the hand fills the slot (dark, lit warm from behind)
  const hp = projPoly(cam, [[SLOT.x0 + 0.01, SLOT.y0 + 0.005, zf + 0.004], [SLOT.x1 - 0.01, SLOT.y0 + 0.005, zf + 0.004], [SLOT.x1 - 0.01, SLOT.y1 - 0.005, zf + 0.004], [SLOT.x0 + 0.01, SLOT.y1 - 0.005, zf + 0.004]]);
  if (hp.length > 2) { g.fillStyle = '#3a3e42'; g.beginPath(); polyPath(g, hp); g.fill(); }
  for (let f = 0; f < 4; f++) {
    const x0 = -0.09 + f * 0.06, L = (f === 1 || f === 2 ? 0.62 : 0.5) * u * (1 + hash(f * 3) * 0.15), sweep = (o.feel || 0) * Math.sin(t * 1.6 + f * 0.6) * 0.18 + noise(t * 1.3 + f) * 0.05 * tw;
    let dir = V.norm([sweep + (f - 1.5) * 0.12, -0.15, -1]);
    if (o.aim) { const a = V.norm(V.sub(o.aim, [x0, 0.9, zf])); dir = V.norm(V.lerp(dir, a, o.aimK || 0)); }
    const pts = [[x0, 0.9, zf + 0.02]]; let p = pts[0], d = dir;
    const curl = (o.curl == null ? 0.35 : o.curl) * (0.7 + f * 0.25) + Math.sin(t * 4 + f * 1.7) * 0.2 * tw;
    for (let k = 0; k < 3; k++) { const sl = L * [0.42, 0.33, 0.25][k]; d = V.norm(V.add(d, [0, -curl * (k + 1) * 0.35, 0])); p = V.add(p, V.mul(d, sl)); p = [p[0], Math.max(p[1], 0.012), Math.min(p[2], zf - 0.005 * (k + 1))]; pts.push(p); }
    wFinger(g, cam, pts, 0.028);
  }
}
// the creature's face pressed against frosted glass (2D, close)
function faceOnGlass(g, t, k, o = {}) {
  g.fillStyle = '#0a0b10'; g.fillRect(0, 0, W, H);
  const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H);
  const gr = L.g.createRadialGradient(W * 0.85, 300, 50, W * 0.85, 300, 1400); gr.addColorStop(0, '#9a6a40'); gr.addColorStop(0.5, '#3a281a'); gr.addColorStop(1, '#120c08'); L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H);
  callerFace(L.g, W / 2 + 10, 900 + (1 - k) * 30, lerp(300, 345, k), { t, mouth: o.mouth || 0.4, rim: 1.3, jitter: o.jitter || 0.2, neckOff: true, drool: 1 });
  // hands flat on the glass: narrow palms, long jointed fingers spread out
  for (const sd of [-1, 1]) { const hx = W / 2 + sd * 390, hy = 1230;
    for (let f = 0; f < 4; f++) { const a = -Math.PI / 2 + sd * (-0.25 + f * 0.22), l = [230, 290, 280, 220][f], p1 = [hx + Math.cos(a) * 60, hy - 40 + Math.sin(a) * 60], p2 = [p1[0] + Math.cos(a) * l * 0.45, p1[1] + Math.sin(a) * l * 0.45], p3 = [p2[0] + Math.cos(a + sd * 0.12) * l * 0.33, p2[1] + Math.sin(a + sd * 0.12) * l * 0.33], p4 = [p3[0] + Math.cos(a + sd * 0.22) * l * 0.25, p3[1] + Math.sin(a + sd * 0.22) * l * 0.25];
      limb(L.g, [p1, p2, p3, p4], 24 - f, '#8f989c', '#0d0e13', '#5f686e', 4); L.g.fillStyle = '#2a2622'; ell(L.g, p4[0], p4[1], 9, 9); L.g.fill(); }
    L.g.fillStyle = '#7c8586'; L.g.strokeStyle = '#0d0e13'; L.g.lineWidth = 5; L.g.beginPath(); L.g.ellipse(hx, hy + 10, 62, 85, sd * 0.1, 0, TAU); L.g.fill(); L.g.stroke();
  }
  g.save(); g.filter = `blur(${lerp(16, 3, k)}px)`; g.drawImage(L.c, 0, 0); g.restore();
  // frost: milky streaks; where it presses the frost clears
  g.fillStyle = `rgba(170,150,125,${lerp(0.3, 0.1, k)})`; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,240,220,0.08)'; g.lineWidth = 22; for (let x = 30; x < W; x += 70) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  g.fillStyle = `rgba(230,235,240,${0.1 + 0.06 * Math.sin(t * 2.2)})`; ell(g, W / 2, 1000, 170, 90); g.fill();   // its breath fogging the glass
}

let SHOTS = [];
function buildShots() {
  const L = id => LN(id), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  cue(0.0, 'wind', 1.0); cue(0.0, 'crickets', 1.0); cue(0.0, 'hum', 0.6);

  // ===== 1. 3:07 a.m.: from the landing down into the dark hall. The bell rings. A shape leaves the frosted glass =====
  const ring0 = 0.3, s1B = ww('hook', "Everyone's") - 0.12;
  cue(ring0, 'dingdong', 1.0); cue(ring0 + 1.2, 'drop', 1.2);
  S.push({ a: 0, b: s1B, fade: 0, draw: (g, t) => {
    const pk = eio(inv(0, s1B + 1, t)), E = hallEnv(t);
    const cam = { x: lerp(0.85, 0.8, pk), y: lerp(4.25, 4.15, pk), z: lerp(0.05, 0.3, pk), f: 900, hy: lerp(420, 440, pk), yaw: -7 };
    const hit = Math.max(0, 1 - Math.abs(t - ring0 - 0.03) / 0.06) + Math.max(0, 1 - Math.abs(t - ring0 - 0.55) / 0.06);
    hallScene(g, cam, E, [], { chimeHit: hit, chimeShake: Math.exp(-Math.max(0, t - ring0) * 2) * (t > ring0 ? 1 : 0),
      door: { sideShadow: (g, sp, b) => { const k = ss(0.6, 2.2, t); if (k >= 1) return; const x = b.bx0 + b.bw * lerp(0.45, 1.6, k); g.save(); g.filter = 'blur(2px)'; g.fillStyle = 'rgba(8,5,4,0.95)'; g.beginPath(); g.ellipse(x, b.by0 + b.bh * 0.12, b.bw * 0.34, b.bh * 0.08, 0, 0, TAU); g.fill(); g.fillRect(x - b.bw * 0.22, b.by0 + b.bh * 0.17, b.bw * 0.44, b.bh); g.restore(); } } });
    vignette(g, 0.62);
    chip(g, t, 0.12, L('down').start, '3:07 AM', '#9fb6ff', 250);
  } });
  // ===== 2. your face in the dark: everyone's asleep =====
  const s2A = s1B, s2B = ww('hook', 'And') - 0.08;
  cue(s2A, 'whoosh', 0.25);
  S.push({ a: s2A, b: s2B, fade: 0.15, draw: (g, t) => {
    const E = hallEnv(t); hallBokeh(g, t, E, { x: 0.3, y: 4.2, z: 0.7, f: 760, hy: 520, yaw: 40 }, { blur: 10, dim: 0.45 });
    const pk = eio(inv(s2A, s2B, t));
    yourFace(g, t, W / 2 - 30, lerp(930, 910, pk), lerp(320, 340, pk), { wide: 0.75, look: 0.6, up: -0.5, tremble: 0.35, lightSide: 1, lit: 0.45 });
    vignette(g, 0.72); chip(g, t, 0.12, L('down').start, '3:07 AM', '#9fb6ff', 250);
  } });
  // ===== 3. the chime box still trembling: someone rings your doorbell =====
  const s3A = s2B, s3B = L('down').start - 0.12;
  cue(s3A, 'whoosh', 0.2);
  S.push({ a: s3A, b: s3B, fade: 0.15, draw: (g, t) => {
    const E = hallEnv(t), pk = eio(inv(s3A, s3B, t));
    const cam = { x: lerp(0.15, 0.3, pk), y: 2.12, z: lerp(4.75, 4.85, pk), f: 1350, hy: 960, yaw: 74 };
    hallScene(g, cam, E, [], { chimeShake: 0.25 + 0.2 * Math.sin(t * 3), skip: ['pendant'] });
    // dust drifting down from the box
    const r = rng(9); for (let i = 0; i < 26; i++) { const x = CHIME[0] - 0.05 - r() * 0.15, y = CHIME[1] - ((t - s3A) * (0.08 + r() * 0.1) + r() * 0.3), z = CHIME[2] - 0.15 + r() * 0.3; const p = proj(cam, x, y, z); if (p) { g.fillStyle = 'rgba(220,210,190,0.5)'; g.fillRect(p[0], p[1], 3, 3); } }
    vignette(g, 0.65); chip(g, t, 0.12, L('down').start, '3:07 AM', '#9fb6ff', 250);
  } });
  // ===== 4. POV: you creep down the stairs =====
  const s4A = s3B, s4B = L('glass').start - 0.1;
  const stepT = []; for (let x = s4A + 0.15; x < s4B; x += 0.42) stepT.push(x);
  stepT.forEach((x, i) => { cue(x, 'step', 0.5); if (i % 2 === 0) cue(x + 0.05, 'creak', 0.35); });
  S.push({ a: s4A, b: s4B, fade: 0.2, draw: (g, t) => {
    const E = hallEnv(t), u = inv(s4A, s4B + 0.4, t), st = (t - s4A) / 0.42, bob = -Math.abs(Math.sin(st * Math.PI)) * 0.03;
    const z = lerp(1.35, 2.6, u), y = lerp(2.66 - 0.19 * 0.5 + 1.55, (4.75 - 2.6) / 0.28 * 0.19 * 0 + 1.55 + 0.19 * ((4.75 - 2.6) / 0.28), u) + bob;
    const cam = { x: -0.95, y: lerp(4.05, 3.0, u) + bob, z, f: 900, hy: lerp(560, 620, u), yaw: 8 };
    hallScene(g, cam, E, [], { skip: ['pendant'] });
    // your hand on the banister
    vignette(g, 0.65);
  } });
  // ===== 5. through the frosted glass... nobody's there =====
  const s5A = s4B, s5B = L('again').start - 0.1;
  cue(s5A, 'whoosh', 0.2); cue(ww('glass', "nobody's"), 'breath', 0.6);
  S.push({ a: s5A, b: s5B, fade: 0.25, draw: (g, t) => {
    const E = hallEnv(t), pk = eio(inv(s5A, s5B, t));
    const cam = { x: lerp(0.15, 0.3, pk), y: 1.6, z: lerp(3.6, 4.2, pk), f: 1000, hy: 900, yaw: lerp(6, 9, pk) };
    hallScene(g, cam, E, [], { skip: ['pendant'] });
    vignette(g, 0.65);
  } });
  // ===== 6. then it rings again (the chime strikes: DING) =====
  const s6A = s5B, s6B = L('peep').start - 0.08, dingT = ww('again', 'rings') - 0.05;
  cue(dingT, 'ding', 1.0); cue(s6A, 'whoosh', 0.2);
  S.push({ a: s6A, b: s6B, fade: 0.1, draw: (g, t) => {
    const E = hallEnv(t), j = Math.exp(-Math.max(0, t - dingT) * 6) * (t > dingT ? 1 : 0);
    const cam = { x: 0.55 + j * 0.01, y: 2.2 + j * 0.008, z: 5.0, f: 1100, hy: 960, yaw: 82 };
    hallScene(g, cam, E, [], { chimeHit: Math.max(0, 1 - Math.abs(t - dingT - 0.03) / 0.07), chimeShake: j, skip: ['pendant'] });
    vignette(g, 0.65);
  } });
  // ===== 7. you look through the peephole: an empty porch =====
  const s7A = s6B, lensT = ww('peep', 'peephole.') + 0.1, s7B = L('button').start - 0.1;
  cue(s7A, 'whoosh', 0.25); cue(ww('peep', 'look'), 'cloth', 0.6); cue(lensT - 0.05, 'whoosh', 0.35); cue(lensT + 0.3, 'gate', 0.5);
  const porchPeep = (t, extras = [], co = {}) => (fg) => { const cam = { x: 0, y: 1.55, z: -0.06, f: 300, hy: co.hy || 920, yaw: 180 }; porchScene(fg, cam, porchEnv(t), extras); };
  S.push({ a: s7A, b: lensT, fade: 0.2, draw: (g, t) => {
    const E = hallEnv(t), k = ein(inv(s7A, lensT, t));
    const cam = { x: 0.0, y: 1.55, z: lerp(4.6, 5.86, k), f: 1000, hy: 960, yaw: 0 };
    hallScene(g, cam, E, [], { skip: ['pendant'] }); vignette(g, 0.65);
  } });
  S.push({ a: lensT, b: s7B, fade: 0.18, draw: (g, t) => {
    peephole(g, t, porchPeep(t)); vignette(g, 0.4);
  } });
  // ===== 8. the button outside: still pressed down... by a long grey finger, from above =====
  const s8A = s7B, s8B = L('bends').start - 0.05, upT = ww('finger', 'by'), relT = s8B - 0.25;
  cue(s8A, 'whoosh', 0.3); cue(ww('finger', 'finger,'), 'sting', 0.5); cue(ww('finger', 'above.'), 'bonecrack', 0.7); cue(relT, 'dong', 1.0);
  const HEADUP = [1.15, 4.05, -0.6];
  S.push({ a: s8A, b: s8B, fade: 0.2, draw: (g, t) => {
    const E = porchEnv(t), tilt = eio(inv(upT - 0.1, ww('finger', 'above.') + 0.2, t)), pk = inv(s8A, s8B, t);
    const cam = { x: lerp(0.3, 0.26, pk) - tilt * 0.1, y: lerp(1.36, 1.5, tilt), z: lerp(-0.55, -0.62, pk) - tilt * 0.35, f: lerp(1150, 950, tilt), hy: lerp(960, 1760, tilt), yaw: lerp(22, 32, tilt) };
    const rel = ss(relT - 0.05, relT + 0.15, t), press = 1 - rel;
    const co = cw(t, { head: HEADUP, tipR: V.add(BTN(), [0, rel * 0.12, -rel * 0.08]), fold: 1, mouth: 0.1 });
    porchScene(g, cam, E, [callerSprite(co, { lightX: 0, warm: 0.15, dark: 0.42, always: true })], { press, bellLit: 1 });
    vignette(g, 0.62);
  } });
  // ===== 9. the peephole again: something bends down... and looks right back at you =====
  const s9A = s8B, bendT = ww('bends', 'bends'), downT = ww('bends', 'down...'), lookT = ww('bends', 'looks'), youT = ww('bends', 'you.'), s9B = L('tall').start - 0.15;
  cue(s9A, 'whoosh', 0.2); cue(bendT - 0.1, 'bonecrack', 0.8); cue(bendT + 0.4, 'bonecrack', 0.6); cue(downT + 0.1, 'bonecrack', 0.8); cue(lookT, 'twitch', 1.0); cue(lookT + 0.05, 'bonecrack', 1.0); cue(youT, 'hit', 1.0); cue(youT, 'sting', 1.0); cue(youT + 0.1, 'breath', 0.8);
  S.push({ a: s9A, b: s9B, fade: 0.15, draw: (g, t) => {
    const lower = eout(inv(bendT - 0.1, downT + 0.25, t)), snap = eout(inv(lookT, lookT + 0.16, t)), lunge = ein(inv(ww('bends', 'right') + 0.1, youT, t));
    const steps = Math.floor(lower * 5) / 5 * 0.4 + lower * 0.6;   // stop-start descent
    const head = [lerp(0.05, 0.02, steps) + lunge * 0.035, lerp(2.95, 1.56, steps), lerp(-0.42, -0.36, steps) + lunge * 0.24];
    const co = cw(t, { head, headRoll: lerp(165, 0, snap) + noise(t * 4) * 6 * (1 - lunge), followNeck: 0, mouth: 0.15 + 0.5 * lunge, fold: 1 });
    peephole(g, t, porchPeep(t, [callerSprite(co, { lightX: W, warm: 0.22, dark: 0.35, always: true, zBias: 5 })]));
    vignette(g, 0.4);
    if (t > youT) { const k = Math.exp(-(t - youT) * 5); g.fillStyle = `rgba(0,0,0,${0.25 * k})`; g.fillRect(0, 0, W, H); }
  } });
  // ===== 10. outside, wide: twice as tall as your door; its neck folds like an old ladder =====
  const s10A = s9B, neckT = ww('tall', 'neck'), ladT = ww('tall', 'ladder.'), s10B = L('slot').start - 0.1;
  cue(s10A, 'whoosh', 0.35); cue(s10A + 0.05, 'sting', 0.5); cue(neckT, 'bonecrack', 0.9); cue(neckT + 0.3, 'bonecrack', 0.8); [0, 0.22, 0.44].forEach(d => cue(ladT - 0.5 + d, 'bonecrack', 1.0)); cue(ladT + 0.05, 'twitch', 1.0);
  const PEEPH = [0.02, 1.56, -0.36];
  S.push({ a: s10A, b: s10B, fade: 0.12, draw: (g, t) => {
    const E = porchEnv(t), pk = eio(inv(s10A, s10B, t));
    const cam = { x: lerp(-0.35, -0.2, pk), y: lerp(0.3, 0.38, pk), z: lerp(-3.3, -2.9, pk), f: 600, hy: lerp(1450, 1430, pk), yaw: lerp(20, 18, pk) };
    const pz = eio(inv(ladT - 0.15, s10B + 0.1, t)); cam.f = lerp(cam.f, 1150, pz); cam.hy = lerp(cam.hy, 1900, pz); cam.yaw = lerp(cam.yaw, 17, pz);
    const up = ss(neckT - 0.1, neckT + 0.55, t), dn = Math.floor(clamp((t - (ladT - 0.5)) / 0.22, 0, 3)) / 3;
    const top = [1.0, 4.0, -0.75], mid = [0.45, 2.45, -0.85];
    let head = V.lerp(PEEPH, top, up); if (dn > 0) head = V.lerp(top, mid, eout(clamp(dn + clamp((t - (ladT - 0.5)) % 0.22 / 0.22, 0, 1) * 0 , 0, 1)));
    const turn = ss(ladT, ladT + 0.15, t);
    const co = cw(t, { head, headTurn: lerp(0, -95, turn), followNeck: 0, headRoll: 0, mouth: 0.15 + 0.3 * turn });
    porchScene(g, cam, E, [callerSprite(co, { lightX: 100, lightY: 900, warm: 0.3, dark: 0.18, always: true })], { press: 0, bellLit: 1 });
    vignette(g, 0.6);
  } });
  // ===== 11. the letterbox flips open =====
  const s11A = s10B, flipT = ww('slot', 'flips'), s11B = L('feel').start - 0.05;
  cue(s11A, 'whoosh', 0.25); cue(flipT, 'flap', 1.0); cue(flipT + 0.05, 'sting', 0.4);
  const slotCam = (t, pk) => ({ x: lerp(0.32, 0.28, pk), y: lerp(0.72, 0.78, pk), z: lerp(4.85, 5.05, pk), f: 1000, hy: 900, yaw: -14 });
  S.push({ a: s11A, b: s11B, fade: 0.2, draw: (g, t) => {
    const E = hallEnv(t), op = eout(inv(flipT - 0.04, flipT + 0.1, t)) - Math.max(0, Math.sin((t - flipT) * 30) * 0.15 * Math.exp(-(t - flipT) * 8)) * (t > flipT ? 1 : 0);
    hallScene(g, slotCam(t, inv(s11A, L('hears').start, t)), E, [], { door: { slot: clamp(op) }, skip: ['pendant'] }); vignette(g, 0.65);
  } });
  // ===== 12. long fingers slide in, feeling for you =====
  const s12A = s11B, s12B = L('hears').start - 0.1, inT = ww('feel', 'slide');
  cue(ww('feel', 'Long') + 0.1, 'slide', 0.8); cue(inT, 'skin', 1.0); cue(ww('feel', 'feeling'), 'tap', 0.6); cue(ww('feel', 'feeling') + 0.35, 'tap', 0.5); cue(ww('feel', 'you.'), 'tap', 0.6);
  S.push({ a: s12A, b: s12B, fade: 0, draw: (g, t) => {
    const E = hallEnv(t), u = ss(ww('feel', 'Long') - 0.1, ww('feel', 'in,') + 0.3, t);
    hallScene(g, slotCam(t, inv(s11A, L('hears').start, t)), E, [{ x: 0, z: 5.5, draw: (g, c, E) => slotFingers(g, c, E, t, u, { feel: ss(ww('feel', 'feeling') - 0.3, ww('feel', 'feeling'), t), curl: lerp(0.15, 0.4, u) }) }], { door: { slot: 1 }, skip: ['pendant'] });
    vignette(g, 0.65);
  } });
  // ===== 13. it can't fit through... but it hears every creak (POV: your feet, a board gives) =====
  const s13A = s12B, crkT = ww('hears', 'creak.') - 0.15, s13B = L('two').start - 0.12;
  cue(s13A, 'whoosh', 0.2); cue(crkT, 'floorcreak', 1.0); cue(crkT + 0.25, 'twitch', 0.9); cue(crkT + 0.25, 'sting', 0.5); cue(s13A + 0.2, 'heartbeat', 0.8); cue(ww('hears', 'fit'), 'tap', 0.5);
  S.push({ a: s13A, b: s13B, fade: 0.15, draw: (g, t) => {
    const E = hallEnv(t), sh = ss(crkT - 0.15, crkT + 0.05, t), snap = eout(inv(crkT + 0.2, crkT + 0.35, t));
    const cam = { x: 0.6, y: 1.6, z: 4.55, f: 900, hy: 260, yaw: -16 };
    hallScene(g, cam, E, [{ x: 0, z: 5.5, draw: (g, c, E) => slotFingers(g, c, E, t, 1, { feel: 1 - snap, aim: [0.6, 0.0, 4.6], aimK: snap * 0.9, twitch: 1 - snap * 0.8, curl: lerp(0.4, 0.05, snap) }) }], { door: { slot: 1 }, skip: ['pendant'] });
    yourFeet(g, t, sh);
    vignette(g, 0.65);
  } });
  // ===== 14. two options. A: sneak up the creaky stairs =====
  const s14A = s13B, twoT = ww('two', 'two'), aT = L('optA').start, s14B = L('optB').start - 0.12;
  cue(s14A, 'whoosh', 0.3); cue(twoT, 'card', 0.8); cue(aT, 'card', 0.9); cue(ww('optA', 'creaky'), 'creak', 0.6); cue(ww('optA', 'room...') , 'step', 0.4);
  S.push({ a: s14A, b: s14B, fade: 0.2, draw: (g, t) => {
    const E = hallEnv(t), pk = eio(inv(s14A, s14B, t)), st = Math.floor(clamp((t - aT) / 0.7, 0, 3));
    const cam = { x: -0.92, y: 1.6 + lerp(0, 0.19, ss(0, 1, (t - aT) / 0.7 - st)) * (st < 3 ? 1 : 0) + st * 0.19, z: 5.45 - st * 0.28 - lerp(0, 0.28, ss(0, 1, (t - aT) / 0.7 - st)) * (st < 3 ? 1 : 0) - pk * 0.1, f: 900, hy: 1350, yaw: 180 };
    hallScene(g, cam, E, [], { skip: ['pendant'] }); vignette(g, 0.68);
    bigWord(g, t, twoT - 0.05, aT - 0.1, '2 OPTIONS', '#ffd23f', 290, 110);
    optionCard(g, t, aT, 'A', 'SNEAK UP THE STAIRS', null, 0, 270, '#3ee07a');
  } });
  // ===== 15. B: stay perfectly still right next to the door (the fingers creep toward your face) =====
  const s15A = s14B, s15B = L('q').start - 0.1, bT = L('optB').start;
  cue(bT, 'card', 0.9); cue(ww('optB', 'still,'), 'breathstop', 1.0); cue(ww('optB', 'door,'), 'tap', 0.5); cue(ww('optB', 'leaves.'), 'skin', 0.6);
  S.push({ a: s15A, b: s15B, fade: 0.2, draw: (g, t) => {
    const E = hallEnv(t), pk = eio(inv(s15A, s15B, t));
    hallBokeh(g, t, E, { x: 0.75, y: 1.3, z: 5.2, f: 800, hy: 900, yaw: -60 }, { blur: 9, dim: 0.4, ho: { door: { slot: 1 } } });
    // fingers reaching in from the left toward your cheek
    const reach = lerp(0.15, 0.85, pk) + Math.sin(t * 1.3) * 0.05;
    { const px = lerp(-120, 200, reach), py = 1180 + Math.sin(t * 1.1) * 15;
      limb(g, [[-200, py + 260], [px - 120, py + 90], [px, py]], 60, '#8f989c', '#0d0e13', '#5f686e', 5);
      g.fillStyle = '#868f93'; g.strokeStyle = '#0d0e13'; g.lineWidth = 5; ell(g, px, py, 70, 52, -0.4); g.fill(); g.stroke();
      for (let f = 0; f < 4; f++) { const a0 = -0.95 + f * 0.28 + Math.sin(t * 2.2 + f) * 0.06, l = [190, 240, 230, 170][f], b0 = [px + Math.cos(a0) * 55, py + Math.sin(a0) * 45];
        const p1 = [b0[0] + Math.cos(a0) * l * 0.42, b0[1] + Math.sin(a0) * l * 0.42], a1 = a0 + 0.35 + Math.sin(t * 3 + f) * 0.1, p2 = [p1[0] + Math.cos(a1) * l * 0.33, p1[1] + Math.sin(a1) * l * 0.33], a2 = a1 + 0.4, p3 = [p2[0] + Math.cos(a2) * l * 0.25, p2[1] + Math.sin(a2) * l * 0.25];
        limb(g, [b0, p1, p2, p3], 20 - f * 1.5, '#8f989c', '#0d0e13', '#5f686e', 4); g.fillStyle = '#2a2622'; ell(g, p3[0], p3[1], 8, 8); g.fill(); } }
    yourFace(g, t, W / 2 + 150, 900, 280, { wide: 0.05, look: -0.9, tremble: 0.45, lightSide: -1, lit: 0.35 });
    // eyes shut tight: lids over the face's eyes
    g.fillStyle = 'rgba(150,105,80,0.98)'; for (const sd of [-1, 1]) { ell(g, W / 2 + 150 + sd * 280 * 0.32, 900 + 280 * 0.1, 280 * 0.2, 280 * 0.14); g.fill(); g.strokeStyle = '#141218'; g.lineWidth = 7; g.beginPath(); g.moveTo(W / 2 + 150 + sd * 90 - 47, 934); g.quadraticCurveTo(W / 2 + 150 + sd * 90, 948, W / 2 + 150 + sd * 90 + 47, 934); g.stroke(); }
    vignette(g, 0.62);
    optionCard(g, t, bT, 'B', 'STAY STILL BY THE DOOR', null, 0, 270, '#5aa8ff');
  } });
  // ===== 16. what do you do? (its face pressed to the frosted glass) =====
  const s16A = s15B, s16B = L('cta').start - 0.1;
  cue(s16A, 'hit', 0.7); cue(s16A, 'sting', 0.7); cue(s16A + 0.1, 'squeak', 0.8);
  S.push({ a: s16A, b: s16B, fade: 0.08, draw: (g, t) => {
    faceOnGlass(g, t, eout(inv(s16A, s16A + 0.35, t)), { mouth: lerp(0.3, 0.7, inv(s16A, s16B, t)) });
    vignette(g, 0.65);
    optionCard(g, t, s16A + 0.02, 'A', 'SNEAK UP THE STAIRS', null, 0, 260, '#3ee07a');
    optionCard(g, t, s16A + 0.12, 'B', 'STAY STILL BY THE DOOR', null, 0, 420, '#5aa8ff');
  } });
  // ===== 17. CTA: stairs or stay? ...and the bell rings once more =====
  const nA = s16B, end = T.duration, comT = ww('cta', 'comments,'), folT = ww('cta', 'follow'), ringT = end - 1.3;
  cue(nA, 'whoosh', 0.35); cue(ww('cta', 'stay?'), 'pop', 0.6); cue(comT, 'card', 0.8); cue(folT - 0.35, 'like', 0.9); cue(folT, 'follow', 1.0); cue(ringT, 'dingdong', 1.0); cue(ringT, 'sting', 0.7);
  S.push({ a: nA, b: end + 0.1, fade: 0.3, draw: (g, t) => {
    const E = hallEnv(t), pk = eio(inv(nA, end, t));
    const cam = { x: lerp(0.55, 0.45, pk), y: 1.7, z: lerp(1.6, 2.1, pk), f: 900, hy: 820, yaw: -3 };
    const hit = Math.max(0, 1 - Math.abs(t - ringT - 0.03) / 0.06) + Math.max(0, 1 - Math.abs(t - ringT - 0.55) / 0.06);
    hallScene(g, cam, E, [{ x: 0, z: 5.5, draw: (g, c, E) => slotFingers(g, c, E, t, 1, { feel: 1, curl: 0.35 }) }], { door: { slot: 1, sideShadow: (g, sp, b) => { g.save(); g.filter = 'blur(5px)'; g.fillStyle = 'rgba(12,8,6,0.8)'; g.beginPath(); g.ellipse(b.bx0 + b.bw * 0.55, b.by0 + b.bh * 0.1, b.bw * 0.3, b.bh * 0.075, 0, 0, TAU); g.fill(); g.fillRect(b.bx0 + b.bw * 0.3, b.by0 + b.bh * 0.15, b.bw * 0.5, b.bh); g.restore(); } }, chimeHit: hit, chimeShake: t > ringT ? Math.exp(-(t - ringT) * 2) : 0 });
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, 0, W, H); vignette(g, 0.6);
    bigWord(g, t, nA + 0.05, end + 1, 'STAIRS', '#3ee07a', 210, 84); bigWord(g, t, ww('cta', 'or'), end + 1, 'OR', '#ffffff', 290, 62); bigWord(g, t, ww('cta', 'stay?'), end + 1, 'STAY?', '#5aa8ff', 375, 84);
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
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
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

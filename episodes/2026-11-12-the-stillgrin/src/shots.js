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
// your face, lit from one side (col = light colour)
function yourFace(g, t, cx, cy, S, o = {}) {
  const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H);
  humanFaceOpen(L.g, cx, cy, S, { t, ...o });
  L.g.save(); L.g.globalCompositeOperation = 'source-atop';
  const lit = o.lit == null ? 1 : o.lit, side = o.lightSide || 1, c = o.col || [210, 225, 255];
  const gr = L.g.createLinearGradient(cx + side * S * 1.3, 0, cx - side * S * 1.1, 0); gr.addColorStop(0, rgb(c, 0.4 * lit)); gr.addColorStop(0.55, rgb(c, 0)); gr.addColorStop(1, 'rgba(6,8,20,0.6)');
  L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H); L.g.fillStyle = `rgba(6,8,20,${0.2 + 0.4 * (1 - lit)})`; L.g.fillRect(0, 0, W, H); L.g.restore();
  g.drawImage(L.c, 0, 0);
}
// blurred garden behind close-ups
function gardenBokeh(g, t, E, cam, o = {}) {
  const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H); gardenScene(L.g, cam, E, o.extras || [], o.go || {});
  g.save(); g.filter = `blur(${o.blur || 8}px)`; g.drawImage(L.c, 0, 0); g.restore();
  g.fillStyle = `rgba(4,6,14,${o.dim == null ? 0.35 : o.dim})`; g.fillRect(0, 0, W, H);
}
// ---------- POV: your arm holding the trash bag (screen space, bottom right) ----------
function sleeve(g, pts, w) { limb(g, pts, w, '#2a3550', '#0b0c12', '#1c2438', 6); }
function povBag(g, t, o = {}) {
  const hx = o.hx || 860, hy = o.hy || 1600, sw = o.swing || 0, k = o.light == null ? 0.4 : o.light;
  sleeve(g, [[W + 140, H + 120], [hx + 120, hy + 120], [hx + 10, hy + 15]], 150);
  // the bag hangs from the fist, swinging
  g.save(); g.translate(hx - 10, hy + 30); g.rotate(sw);
  const bg = g.createLinearGradient(-150, 0, 150, 0); bg.addColorStop(0, '#05060a'); bg.addColorStop(0.35, rgb([60, 66, 84], 0.9 * k + 0.1)); bg.addColorStop(0.5, '#0b0c12'); bg.addColorStop(1, '#030305');
  g.fillStyle = bg; g.strokeStyle = '#000'; g.lineWidth = 6; g.beginPath(); g.moveTo(-30, 0); g.bezierCurveTo(-60, 60, -210, 140, -200, 330); g.lineTo(-180, 600); g.lineTo(200, 600); g.lineTo(210, 330); g.bezierCurveTo(220, 150, 60, 60, 30, 0); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = rgb([140, 150, 175], 0.25 * k + 0.05); g.lineWidth = 5; for (const [a, b] of [[-110, 260], [-40, 300], [70, 240], [130, 330]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a + 20, b + 60, a - 10, b + 140); g.stroke(); }
  g.fillStyle = '#0b0c12'; ell(g, 0, -6, 46, 30); g.fill(); g.strokeStyle = '#000'; g.stroke();   // knot
  g.restore();
  // fist over the knot
  g.fillStyle = '#c99878'; g.strokeStyle = '#141218'; g.lineWidth = 6; g.beginPath(); g.ellipse(hx, hy, 80, 66, -0.3, 0, TAU); g.fill(); g.stroke();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(hx - 62 + i * 30, hy - 30 + i * 6, 22, 30, -0.4, 0, TAU); g.fillStyle = '#d4a484'; g.fill(); g.stroke(); }
  g.fillStyle = 'rgba(6,8,20,0.35)'; g.beginPath(); g.ellipse(hx, hy, 80, 66, -0.3, 0, TAU); g.fill();
}
// ---------- POV: your two hands raised, waving ----------
function povWave(g, t, amp = 1, lit = 0.5) {
  for (const sd of [-1, 1]) {
    const ph = t * 6.5 + (sd > 0 ? 0 : 1.2), a = Math.sin(ph) * 0.35 * amp, bx = W / 2 + sd * 470, by = 1420;
    const hx = bx + Math.sin(a) * 230 * sd, hy = by - Math.cos(a) * 230;
    sleeve(g, [[W / 2 + sd * 660, H + 150], [bx + sd * 40, by + 260], [bx, by]], 140);
    g.save(); g.translate(hx, hy); g.rotate(a * sd);
    g.fillStyle = '#c99878'; g.strokeStyle = '#141218'; g.lineWidth = 6; ell(g, 0, 40, 70, 82); g.fill(); g.stroke();
    for (let f = 0; f < 4; f++) { const fx = -48 + f * 32, fl = [95, 115, 110, 90][f]; g.beginPath(); g.ellipse(fx, -20 - fl * 0.45, 17, fl * 0.55, (f - 1.5) * 0.08, 0, TAU); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(sd * 70, 50, 18, 50, sd * -0.9, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = `rgba(6,8,20,${0.45 - lit * 0.3})`; ell(g, 0, 20, 90, 140); g.fill();
    g.restore();
    // wrist
    limb(g, [[bx, by], [hx - Math.sin(a * sd) * 30, hy + 120]], 80, '#b88868', '#141218', null, 5);
  }
}
// creature placements
const FENCE_X = -0.8;
function sgo(t, o = {}) { return Object.assign({ x: 0.8, z: 11, yaw: 180, rise: 0, t, mouth: 0.15, twitch: 0.15, curl: 0.2 }, o); }
// four long fingers hooked over the fence top: u = how far over (0..1), tap = which finger taps now
function fenceFingers(g, cam, E, t, x0, u, o = {}) {
  const z = GD.fenceZ, top = GD.fenceH + 0.02;
  const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H);
  // the back of the hand peeks over the top edge
  if (u > 0.25) { const hk = clamp((u - 0.25) / 0.4); sgChain(L.g, cam, [[x0 - 0.04, top + 0.02 * hk, z + 0.09], [x0 + 0.13, top + 0.04 + 0.04 * hk, z + 0.08], [x0 + 0.3, top + 0.03 * hk, z + 0.09]], [0.045, 0.06, 0.045], SG.shade, SG.dark); for (let f = 0; f < 4; f++) wKnobC(L.g, cam, [x0 + f * 0.085 - 0.01, top + 0.045 * hk + 0.01, z + 0.05], 0.022); }
  for (let f = 0; f < 4; f++) {
    const uf = clamp(u * 1.6 - f * 0.18), fx = x0 + f * 0.075 + (f === 0 ? -0.02 : 0);
    if (uf <= 0.01) continue;
    const tp = o.taps ? o.taps(f) : 0;   // 0..1 lift of the fingertip
    const b = [fx, top + 0.03, z + 0.06], k1 = [fx + (f - 1.5) * 0.01, top + 0.05, z - 0.02], k2 = [fx + (f - 1.5) * 0.025, top - 0.06, z - 0.08];
    const len = [0.3, 0.4, 0.38, 0.3][f], tip = [fx + (f - 1.5) * 0.035, top - len * lerp(0.2, 1, eout(uf)) + tp * 0.07, z - 0.04 - tp * 0.07];
    const k3 = V.lerp(k2, tip, 0.5); k3[2] -= 0.05; k3[0] += (f - 1.5) * 0.02;
    sgFinger(L.g, cam, uf < 0.4 ? [b, V.lerp(b, k1, uf / 0.4)] : uf < 0.7 ? [b, k1, V.lerp(k1, k2, (uf - 0.4) / 0.3)] : [b, k1, k2, k3, tip], 0.05, SG.skin, SG.shade);
  }
  L.g.save(); L.g.globalCompositeOperation = 'source-atop'; const lit = o.lit == null ? E.lamp : o.lit; L.g.fillStyle = `rgba(6,8,20,${lerp(0.75, 0.15, lit)})`; L.g.fillRect(0, 0, W, H); L.g.restore();
  g.drawImage(L.c, 0, 0);
}
// a smooth click: the lamp ramps over 0.12 s (no flicker)
const lampRamp = (t, on, off = 1e9) => ss(on, on + 0.12, t) * (1 - ss(off, off + 0.22, t));

let SHOTS = [];
function buildShots() {
  const L = id => LN(id), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  cue(0.0, 'wind', 1.0); cue(0.0, 'crickets', 1.0);
  const YOU = [5.05, 1.62, 6.55];
  // ===== 1. silent opening + hook: you step out with the trash; far back, two pale pinpoints over the fence go out =====
  const s1B = L('on').start - 0.15;
  cue(0.1, 'doorcreak', 0.8); for (let x = 0.55; x < s1B; x += 0.5) cue(x, 'grassstep', 0.6); cue(0.6, 'crinkle', 0.5); cue(1.6, 'crinkle', 0.4); cue(3.2, 'crinkle', 0.4);
  S.push({ a: 0, b: s1B, fade: 0, draw: (g, t) => {
    const u = eio(inv(0, s1B + 0.6, t)), st = t / 0.5, bob = -Math.abs(Math.sin(st * Math.PI)) * 0.035;
    const cam = { x: lerp(0.1, 4.4, u), y: 1.62 + bob, z: lerp(0.4, 5.6, u), f: 860, hy: 1120, yaw: lerp(2, 18, u) + Math.sin(st * Math.PI) * 0.6 };
    const E = gardenEnv(t);
    const eyes = 1 - ss(1.5, 1.9, t);
    gardenScene(g, cam, E, [], { over: (g, c) => { if (eyes > 0) for (const sd of [-1, 1]) { const p = proj(c, FENCE_X + sd * 0.11, 2.12, GD.fenceZ + 0.3); if (p) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, p[0], p[1], 40, [230, 240, 255], 0.8 * eyes); g.restore(); g.fillStyle = `rgba(245,248,255,${0.95 * eyes})`; ell(g, p[0], p[1], 4.5, 4.5); g.fill(); } } } });
    povBag(g, t, { swing: Math.sin(t * 3.3) * 0.12, light: 0.25 });
    vignette(g, 0.6);
    chip(g, t, 0.15, L('on').start, '11:56 PM', '#9fb6ff', 250);
  } });
  // ===== 2. at the bins: the motion light on the shed clicks on =====
  const s2A = s1B, onT = ww('on', 'clicks'), s2B = L('still').start - 0.1;
  cue(s2A, 'whoosh', 0.2); cue(onT, 'lampclick', 1.0); cue(onT + 0.05, 'lamphum', 0.8);
  S.push({ a: s2A, b: s2B, fade: 0.25, draw: (g, t) => {
    const pk = eio(inv(s2A, s2B, t)), E = gardenEnv(t, { lamp: lampRamp(t, onT) });
    const cam = { x: lerp(4.5, 4.8, pk), y: 1.62, z: lerp(5.8, 6.1, pk), f: 860, hy: 1060, yaw: lerp(14, 4, pk) };
    gardenScene(g, cam, E, [], { lid: 70 * ss(s2A, s2A + 0.6, t) });
    povBag(g, t, { swing: Math.sin(t * 3.0) * 0.06, light: 0.3 + 0.5 * E.lamp });
    vignette(g, 0.6);
  } });
  // ===== 3. you stand still... the bag goes in the bin... and it clicks off =====
  const s3A = s2B, offT = ww('still', 'off.') - 0.05, s3B = L('again').start - 0.12;
  cue(ww('still', 'stand') + 0.2, 'binbag', 0.9); cue(offT, 'lampclick', 0.8); cue(offT + 0.3, 'breath', 0.5);
  S.push({ a: s3A, b: s3B, fade: 0.2, draw: (g, t) => {
    const pk = eio(inv(s3A, s3B, t)), E = gardenEnv(t, { lamp: 1 - ss(offT, offT + 0.25, t) });
    const cam = { x: lerp(4.5, 4.45, pk), y: 1.7, z: lerp(4.7, 4.6, pk), f: 760, hy: lerp(640, 620, pk), yaw: lerp(30, 28, pk) };
    const dk = eio(inv(ww('still', 'stand') - 0.1, ww('still', 'stand') + 0.35, t));
    gardenScene(g, cam, E, [{ x: 5.9, z: 6.55, draw: (g, c) => { if (dk >= 1) return; const p = proj(c, 5.9, lerp(1.55, 0.95, dk), 6.5); if (!p) return; const s = p[2]; g.save(); g.translate(p[0], p[1]); g.rotate(0.2 - dk * 0.3); g.fillStyle = '#07080c'; g.strokeStyle = '#000'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 0.26 * s, 0.3 * s, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = 'rgba(150,165,200,0.25)'; ell(g, -0.08 * s, -0.08 * s, 0.06 * s, 0.12 * s); g.fill(); g.fillStyle = '#07080c'; ell(g, 0, -0.32 * s, 0.07 * s, 0.07 * s); g.fill(); g.restore(); } }], { lid: 70 });
    vignette(g, 0.62);
  } });
  // ===== 4. close on the lamp: it clicks on again (red sensor LED) =====
  const s4A = s3B, on2T = ww('again', 'clicks'), s4B = L('move').start - 0.08;
  cue(on2T, 'lampclick', 1.0); cue(on2T + 0.04, 'lamphum', 0.8); cue(on2T + 0.05, 'sting', 0.35);
  S.push({ a: s4A, b: s4B, fade: 0.15, draw: (g, t) => {
    const pk = eio(inv(s4A, s4B, t)), E = gardenEnv(t, { lamp: lampRamp(t, on2T) });
    const cam = { x: lerp(2.6, 2.55, pk), y: lerp(1.45, 1.42, pk), z: lerp(10.6, 10.8, pk), f: 1250, hy: lerp(1450, 1470, pk), yaw: 12 };
    gardenScene(g, cam, E, []);
    vignette(g, 0.62);
  } });
  // ===== 5. your face: but you didn't move =====
  const s5A = s4B, s5B = L('taps').start - 0.1;
  cue(s5A, 'whoosh', 0.2); cue(ww('move', 'move.'), 'heartbeat', 0.6);
  S.push({ a: s5A, b: s5B, fade: 0.12, draw: (g, t) => {
    const E = gardenEnv(t, { lamp: 1 }), pk = eio(inv(s5A, s5B, t));
    gardenBokeh(g, t, E, { x: 4.0, y: 1.6, z: 5.4, f: 700, hy: 900, yaw: -150 }, { blur: 10, dim: 0.45 });
    yourFace(g, t, W / 2 + 20, lerp(930, 900, pk), lerp(310, 340, pk), { wide: 0.85, look: -0.35, tremble: 0.35, lightSide: -1, lit: 0.55 });
    vignette(g, 0.7);
  } });
  // ===== 6. behind the fence... something taps (push in, the boards shiver, dust) =====
  const s6A = s5B, tapT = ww('taps', 'taps.'), s6B = L('curl').start - 0.08;
  const T6 = [tapT, tapT + 0.38, tapT + 0.66, tapT + 1.05]; T6.forEach((x, i) => cue(x, 'woodtap', 0.9 - i * 0.05));
  cue(s6A, 'whoosh', 0.15); cue(s6A + 0.2, 'drop', 2.6);
  S.push({ a: s6A, b: s6B, fade: 0.2, draw: (g, t) => {
    const pk = eio(inv(s6A, s6B + 0.4, t)), E = gardenEnv(t, { lamp: 1 });
    const cam = { x: lerp(4.6, 3.6, pk), y: 1.6, z: lerp(6.9, 9.0, pk), f: lerp(820, 1000, pk), hy: 900, yaw: lerp(-30, -34, pk) };
    const sh = T6.reduce((a, x) => a + (t > x ? Math.exp(-(t - x) * 14) : 0), 0);
    gardenScene(g, cam, E, [{ x: FENCE_X, z: GD.fenceZ - 0.05, draw: (g, c) => { // dust puffs from the board tops on each tap
      for (const x of T6) { if (t < x || t > x + 1.2) continue; const k = (t - x); for (let i = 0; i < 7; i++) { const p = proj(c, FENCE_X + 0.1 + (hash(i + x) - 0.5) * 0.4, GD.fenceH - k * (0.3 + hash(i * 3) * 0.4), GD.fenceZ - 0.05); if (p) { g.fillStyle = `rgba(210,200,180,${0.5 * (1 - k / 1.2)})`; g.fillRect(p[0], p[1], 3, 3); } } } } }], { over: (g) => { if (sh > 0.01) { g.fillStyle = `rgba(0,0,0,${0.06 * sh})`; g.fillRect(0, 0, W, H); } } });
    vignette(g, 0.62);
  } });
  // ===== 7. long grey fingers curl over the top (close, low angle), tapping =====
  const s7A = s6B, s7B = L('rise').start - 0.1, inT = ww('curl', 'Long') - 0.1;
  const tapsF = f => { const per = 0.62, ph = ((t7 - inT - 0.9 - f * 0.17) % per + per) % per; return t7 > inT + 0.9 ? Math.max(0, Math.sin(ph / per * Math.PI * 2)) * (ph < per / 2 ? 1 : 0) : 0; };
  let t7 = 0; for (let n = 0; n < 6; n++) for (let f = 0; f < 4; f++) { const x = inT + 0.9 + f * 0.17 + 0.31 + n * 0.62; if (x < s7B) cue(x, 'woodtap', 0.5); }
  cue(inT + 0.1, 'skin', 0.8); cue(ww('curl', 'curl'), 'bonecrack', 0.5);
  S.push({ a: s7A, b: s7B, fade: 0.15, draw: (g, t) => {
    t7 = t; const pk = eio(inv(s7A, s7B, t)), E = gardenEnv(t, { lamp: 1 });
    const cam = { x: FENCE_X + 0.15, y: lerp(1.6, 1.62, pk), z: lerp(15.05, 15.2, pk), f: 1000, hy: lerp(1220, 1260, pk), yaw: -4 };
    const u = ss(inT, ww('curl', 'top.'), t);
    gardenScene(g, cam, E, [{ x: FENCE_X, z: GD.fenceZ - 0.12, draw: (g, c, E) => fenceFingers(g, c, E, t, FENCE_X - 0.05, u, { taps: tapsF }) }]);
    vignette(g, 0.62);
  } });
  // ===== 8. a face rises above the fence. much too high =====
  const s8A = s7B, riseT = ww('rise', 'rises'), highT = ww('rise', 'high.'), s8B = L('out').start - 0.05;
  cue(s8A, 'whoosh', 0.2); cue(riseT - 0.1, 'fencecreak', 1.0); cue(riseT + 0.2, 'bonecrack', 0.6); cue(highT - 0.05, 'twitch', 1.0); cue(highT, 'sting', 0.8); cue(highT + 0.1, 'breath', 0.6);
  const RISE = (t) => { const k = eout(inv(riseT - 0.15, ww('rise', 'it.') + 0.25, t)), stp = Math.floor(k * 6) / 6 * 0.35 + k * 0.65; return stp; };
  S.push({ a: s8A, b: s8B, fade: 0.15, draw: (g, t) => {
    const E = gardenEnv(t, { lamp: 1 }), pz = eio(inv(highT - 0.3, highT + 0.25, t));
    const cam = { x: lerp(2.95, 2.85, pz), y: 1.6, z: lerp(10.2, 10.6, pz), f: lerp(1800, 3000, pz), hy: lerp(1250, 1420, pz), yaw: lerp(-32, -32.5, pz) };
    const k = RISE(t), snap = eout(inv(highT - 0.05, highT + 0.1, t));
    const co = sgo(t, { x: FENCE_X, z: GD.fenceZ + 0.75, rise: 1, floorY: lerp(-1.75, 0.3, k), headRoll: lerp(0, 24, snap) + noise(t * 3) * 3, mouth: lerp(0.05, 0.35, snap), handL: [FENCE_X - 0.75, GD.fenceH + 0.02, GD.fenceZ + 0.05], handR: [FENCE_X + 0.75, GD.fenceH + 0.02, GD.fenceZ + 0.05], noShadow: true });
    gardenScene(g, cam, E, [{ x: FENCE_X - 0.75, z: GD.fenceZ - 0.12, draw: (g, c, E) => { fenceFingers(g, c, E, t, FENCE_X - 0.83, 1, {}); fenceFingers(g, c, E, t, FENCE_X + 0.6, ss(riseT, riseT + 0.5, t), {}); } }], { behindFence: [sgSprite(co, { lit: 0.8, always: true, fogMul: 0.3, clipZ: GD.fenceZ })] });
    vignette(g, 0.6);
  } });
  // ===== 9. the light goes out: only two pinpoints... the fence creaks, they drop, then race closer =====
  const s9A = s8B, outT = ww('out', 'out.') - 0.05, s9B = L('back').start + 0.75, revT = ww('back', 'on...');
  cue(outT, 'lampclick', 0.9); cue(outT + 0.45, 'fencecreak', 0.9); cue(outT + 0.75, 'thud', 1.0); [0, 0.13, 0.26, 0.39, 0.52, 0.65].forEach(d => cue(outT + 1.0 + d, 'grassstep', 0.8)); cue(outT + 0.2, 'drop', 2.5);
  const EYEPATH = (t) => { const a = inv(outT + 0.3, outT + 0.8, t), b = inv(outT + 0.95, outT + 1.75, t);
    if (a < 1) return [FENCE_X, lerp(2.95, 1.6, ein(a)), GD.fenceZ + 0.42 + a * 0.3];
    return V.lerp([FENCE_X, 1.25, GD.fenceZ - 0.6], [1.0, 1.2, 11.6], Math.floor(b * 5) / 5 * 0.5 + eio(b) * 0.5); };
  S.push({ a: s9A, b: revT, fade: 0, draw: (g, t) => {
    const lamp = 1 - ss(outT, outT + 0.25, t), E = gardenEnv(t, { lamp });
    const zo = eio(inv(outT + 0.2, outT + 1.3, t)); const cam = { x: lerp(2.85, 4.2, zo), y: 1.6, z: lerp(10.6, 7.6, zo), f: lerp(3000, 900, zo), hy: lerp(1420, 1000, zo), yaw: lerp(-32.5, -28, zo) };
    const sk = t < outT + 0.3;
    const co = sgo(t, { x: FENCE_X, z: GD.fenceZ + 0.75, rise: 1, floorY: 0.3, headRoll: 24, mouth: 0.35, handL: [FENCE_X - 0.75, GD.fenceH + 0.02, GD.fenceZ + 0.05], handR: [FENCE_X + 0.75, GD.fenceH + 0.02, GD.fenceZ + 0.05], noShadow: true });
    gardenScene(g, cam, E, sk ? [{ x: FENCE_X - 0.75, z: GD.fenceZ - 0.12, draw: (g, c, E) => { fenceFingers(g, c, E, t, FENCE_X - 0.83, 1, { lit: lamp }); fenceFingers(g, c, E, t, FENCE_X + 0.6, 1, { lit: lamp }); } }] : [],
      { behindFence: sk ? [sgSprite(co, { lit: lamp * 0.8, always: true, fogMul: 0.3, clipZ: GD.fenceZ })] : [], darken: 0.12 * (1 - lamp),
        over: (g, c) => { if (sk) return; const P = EYEPATH(t); for (const sd of [-1, 1]) { const p = proj(c, P[0] + sd * 0.11, P[1], P[2]); if (p) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, p[0], p[1], Math.max(10, p[2] * 0.06), [230, 240, 255], 0.6); g.restore(); g.fillStyle = '#f5f8ff'; ell(g, p[0], p[1], Math.max(2.5, p[2] * 0.012), Math.max(2.5, p[2] * 0.012)); g.fill(); } } } });
    vignette(g, 0.65);
  } });
  // ===== 10. it clicks back on... it's in your garden (crouched, frozen mid-crawl) =====
  const s10B = L('frozen').start - 0.08;
  cue(revT, 'lampclick', 1.0); cue(revT + 0.02, 'hit', 1.0); cue(revT + 0.02, 'sting', 1.0); cue(revT + 0.05, 'lamphum', 0.8);
  const POSE1 = (t) => sgo(t, { x: 1.0, z: 11.4, rise: 0.05, yaw: 160, headRoll: -28, mouth: 0.3, twitch: 0.25, handL: [0.45, 0, 10.2], handR: [1.85, 0, 10.6], feet: { '-1': [0.55, 0, 12.3], 1: [1.5, 0, 12.0] } });
  S.push({ a: revT, b: s10B, fade: 0, draw: (g, t) => {
    const E = gardenEnv(t, { lamp: lampRamp(t, revT) }), pk = eout(inv(revT, s10B, t));
    const cam = { x: 4.2, y: 1.6, z: lerp(8.0, 7.7, pk), f: lerp(860, 820, pk), hy: 960, yaw: -28 };
    gardenScene(g, cam, E, [sgSprite(POSE1(t), { lit: E.lamp })]);
    vignette(g, 0.62);
  } });
  // ===== 11. frozen. halfway to you (low, close; only the fingers twitch) =====
  const s11A = s10B, s11B = L('dark').start - 0.08;
  cue(s11A, 'whoosh', 0.25); cue(ww('frozen', 'Halfway'), 'bonecrack', 0.4); cue(ww('frozen', 'you.'), 'twitch', 0.6);
  S.push({ a: s11A, b: s11B, fade: 0.15, draw: (g, t) => {
    const E = gardenEnv(t, { lamp: 1 }), pk = eio(inv(s11A, s11B, t));
    const cam = { x: lerp(2.6, 2.4, pk), y: lerp(0.9, 0.95, pk), z: lerp(7.6, 8.0, pk), f: 900, hy: 1050, yaw: lerp(-20, -18, pk) };
    const co = POSE1(t); co.twitch = 0.6; co.headRoll = -28 + (t > ww('frozen', 'you.') ? 6 * eout(inv(ww('frozen', 'you.'), ww('frozen', 'you.') + 0.1, t)) : 0);
    gardenScene(g, cam, E, [sgSprite(co, { lit: 1 })]);
    vignette(g, 0.62);
  } });
  // ===== 12. it only moves in the dark: the light times out... pinpoints jerk... click: much closer =====
  const s12A = s11B, off3 = ww('dark', 'moves') - 0.15, on3 = ww('dark', 'dark.') + 0.05, s12B = L('stays').start - 0.05;
  cue(off3, 'lampclick', 0.7); [0, 0.12, 0.24, 0.36].forEach(d => cue(off3 + 0.25 + d, 'grassstep', 0.9)); cue(on3, 'lampclick', 1.0); cue(on3, 'hit', 0.8); cue(on3, 'sting', 0.6); cue(on3 + 0.03, 'lamphum', 0.7);
  const POSE2 = (t) => sgo(t, { x: 2.9, z: 9.4, rise: 0.25, yaw: 192, headRoll: 18, mouth: 0.55, twitch: 0.3, handL: [2.4, 0, 8.3], handR: [3.75, 0, 8.6], feet: { '-1': [2.4, 0, 10.2], 1: [3.4, 0, 10.1] } });
  S.push({ a: s12A, b: s12B, fade: 0.12, draw: (g, t) => {
    const lamp = 1 - ss(off3, off3 + 0.2, t) + lampRamp(t, on3), E = gardenEnv(t, { lamp: clamp(lamp) });
    const cam = { x: 4.4, y: 1.6, z: 6.4, f: 820, hy: 930, yaw: lerp(-27, -40, ss(on3, on3 + 0.15, t)) };
    const dark = t > off3 + 0.1 && t < on3;
    const co = t < on3 ? POSE1(t) : POSE2(t), far = t < on3;
    const eyeP = V.lerp([1.4, 1.25, 10.3], [2.65, 1.45, 8.3], Math.floor(clamp(inv(off3 + 0.2, on3 - 0.1, t)) * 4) / 4 * 0.6 + eio(inv(off3 + 0.2, on3 - 0.1, t)) * 0.4);
    gardenScene(g, cam, E, dark ? [] : [sgSprite(co, far ? { lit: E.lamp } : { lit: E.lamp, dark: 0.5, fogMul: 0.2 })], { darken: 0.1 * (1 - E.lamp), over: (g, c) => { if (!dark) return; for (const sd of [-1, 1]) { const p = proj(c, eyeP[0] + sd * 0.11, eyeP[1], eyeP[2]); if (p) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, p[0], p[1], Math.max(10, p[2] * 0.06), [230, 240, 255], 0.6); g.restore(); g.fillStyle = '#f5f8ff'; ell(g, p[0], p[1], Math.max(2.5, p[2] * 0.012), Math.max(2.5, p[2] * 0.012)); g.fill(); } } } });
    vignette(g, 0.62);
  } });
  // ===== 13. the light only stays on while something moves: you wave, slowly =====
  const s13A = s12B, s13B = L('two').start - 0.1;
  cue(s13A, 'cloth', 0.6); cue(s13A + 0.6, 'cloth', 0.5); cue(s13A + 1.3, 'cloth', 0.5); cue(ww('stays', 'moves.'), 'bonecrack', 0.5);
  S.push({ a: s13A, b: s13B, fade: 0.15, draw: (g, t) => {
    const E = gardenEnv(t, { lamp: 1 }), pk = eio(inv(s13A, s13B, t));
    const cam = { x: 4.9, y: 1.62, z: 6.5, f: lerp(900, 1050, pk), hy: 880, yaw: -45 };
    gardenScene(g, cam, E, [sgSprite(POSE2(t), { lit: 1, dark: 0.5, fogMul: 0.2 })]);
    povWave(g, t - s13A, ss(s13A, s13A + 0.4, t), 0.6);
    vignette(g, 0.62);
  } });
  // ===== 14. you have two options: its face, big =====
  const s14A = s13B, twoT = ww('two', 'two'), s14B = L('optA').start - 0.1;
  cue(s14A, 'whoosh', 0.3); cue(s14A + 0.02, 'sting', 0.5); cue(twoT, 'card', 0.8);
  const bigFace = (g, t, k, o = {}) => {
    const E = gardenEnv(t, { lamp: 1 }); gardenBokeh(g, t, E, { x: 3.4, y: 1.3, z: 7.4, f: 600, hy: 1000, yaw: -20 }, { blur: 12, dim: 0.5 });
    const L2 = scratch(); L2.g.setTransform(1, 0, 0, 1, 0, 0); L2.g.clearRect(0, 0, W, H);
    // shoulders + hump behind the head
    // the hump looming behind and above the head, shoulders to the sides
    { const c = L2.g, sg = c.createLinearGradient(0, 250, 0, 1700); sg.addColorStop(0, '#4c4a42'); sg.addColorStop(0.4, '#2c2b26'); sg.addColorStop(1, '#0e0d0a'); c.fillStyle = sg; c.strokeStyle = SG.ink; c.lineWidth = 8;
      c.beginPath(); c.moveTo(-60, 1980); c.lineTo(-60, 1100); c.bezierCurveTo(-40, 820, 120, 640, 290, 600); c.bezierCurveTo(330, 300, 750, 300, 790, 600); c.bezierCurveTo(960, 640, 1120, 820, 1140, 1100); c.lineTo(1140, 1980); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(20,18,16,0.45)'; c.beginPath(); c.ellipse(540, 1500, 330, 420, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(30,28,24,0.5)'; c.lineWidth = 6; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(120 + i * 20, 900 + i * 90); c.quadraticCurveTo(220, 840 + i * 90, 300, 900 + i * 90); c.stroke(); c.beginPath(); c.moveTo(960 - i * 20, 900 + i * 90); c.quadraticCurveTo(860, 840 + i * 90, 780, 900 + i * 90); c.stroke(); } }
    sgFace(L2.g, W / 2 + (o.dx || 0), 980 + (1 - k) * 40, lerp(330, 380, k), { t, mouth: o.mouth == null ? 0.5 : o.mouth, jitter: o.jitter || 0.15, rot: (o.roll || 0) * D2R });
    L2.g.save(); L2.g.globalCompositeOperation = 'source-atop'; const gr = L2.g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(220,232,255,0.22)'); gr.addColorStop(1, 'rgba(6,8,20,0.45)'); L2.g.fillStyle = gr; L2.g.fillRect(0, 0, W, H); L2.g.restore();
    g.drawImage(L2.c, 0, 0);
    // pinpoint glints
    const S2 = lerp(330, 380, k), ro = (o.roll || 0) * D2R; for (const sd of [-1, 1]) { const ex = sd * 0.3 * S2, ey = -0.12 * S2, x = W / 2 + (o.dx || 0) + ex * Math.cos(ro) - ey * Math.sin(ro), y = 980 + (1 - k) * 40 + ex * Math.sin(ro) + ey * Math.cos(ro); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, 40, [230, 240, 255], 0.35); g.restore(); }
  };
  S.push({ a: s14A, b: s14B, fade: 0.08, draw: (g, t) => {
    bigFace(g, t, eout(inv(s14A, s14A + 0.4, t)), { roll: 14 + noise(t * 2) * 2, mouth: 0.45 });
    vignette(g, 0.62);
    bigWord(g, t, twoT - 0.05, s14B, '2 OPTIONS', '#ffd23f', 250, 110);
  } });
  // ===== 15. A: keep waving, back away to the house =====
  const s15A = s14B, aT = L('optA').start, s15B = L('optB').start - 0.1;
  cue(aT, 'card', 0.9); for (let x = ww('optA', 'back'); x < s15B; x += 0.55) cue(x, 'grassstep', 0.5); cue(aT + 0.3, 'cloth', 0.5); cue(aT + 1.1, 'cloth', 0.5);
  S.push({ a: s15A, b: s15B, fade: 0.2, draw: (g, t) => {
    const E = gardenEnv(t, { lamp: 1 }), u = ss(ww('optA', 'back') - 0.2, s15B + 0.3, t), st = (t - s15A) / 0.55;
    const cam = { x: lerp(4.9, 4.4, u), y: 1.62 - Math.abs(Math.sin(st * Math.PI)) * 0.02, z: lerp(6.5, 4.4, u), f: 900, hy: 880, yaw: lerp(-45, -36, u) };
    gardenScene(g, cam, E, [sgSprite(POSE2(t), { lit: 1, dark: 0.5, fogMul: 0.2 })]);
    povWave(g, t, 1, 0.6); vignette(g, 0.62);
    optionCard(g, t, aT, 'A', 'WAVE + BACK AWAY', null, 0, 260, '#3ee07a');
  } });
  // ===== 16. B: drop the bag, sprint for the door in the dark =====
  const s16A = s15B, bT = L('optB').start, dropT = ww('optB', 'drop'), runT = ww('optB', 'sprint'), s16B = L('q').start - 0.1;
  cue(bT, 'card', 0.9); cue(dropT + 0.15, 'binbag', 0.8); cue(runT - 0.1, 'whoosh', 0.5); for (let x = runT; x < s16B; x += 0.27) cue(x, 'grassstep', 0.9); cue(runT + 0.6, 'lampclick', 0.6); cue(runT, 'heartbeat', 0.8);
  S.push({ a: s16A, b: s16B, fade: 0.2, draw: (g, t) => {
    const turn = eio(inv(dropT, runT, t)), run = clamp((t - runT) / (s16B - runT)), st = (t - runT) / 0.27;
    const lamp = 1 - ss(runT + 0.6, runT + 0.85, t), E = gardenEnv(t, { lamp });
    const bob = t > runT ? -Math.abs(Math.sin(st * Math.PI)) * 0.07 : 0;
    const cam = { x: lerp(4.9, 1.3, eio(run)), y: 1.6 + bob, z: lerp(6.5, 3.6, eio(run)), f: 780, hy: 900, yaw: lerp(-42, -168, turn) + (t > runT ? Math.sin(st * Math.PI) * 1.5 : 0) };
    gardenScene(g, cam, E, [sgSprite(POSE2(t), { lit: lamp, dark: 0.5, fogMul: 0.2 })], { darken: 0.08 * (1 - lamp) });
    if (t < dropT + 0.35) povBag(g, t, { hy: 1600 + ein(inv(dropT, dropT + 0.35, t)) * 500, swing: Math.sin(t * 3) * 0.06, light: 0.5 });
    vignette(g, 0.62);
    optionCard(g, t, bT, 'B', 'SPRINT IN THE DARK', null, 0, 260, '#5aa8ff');
  } });
  // ===== 17. what do you do? its face, both cards =====
  const s17A = s16B, s17B = L('cta').start - 0.1;
  cue(s17A, 'hit', 0.7); cue(s17A, 'sting', 0.7); cue(s17A + 0.1, 'twitch', 0.8);
  S.push({ a: s17A, b: s17B, fade: 0.08, draw: (g, t) => {
    const snap = eout(inv(s17A + 0.1, s17A + 0.22, t));
    bigFace(g, t, eout(inv(s17A, s17A + 0.35, t)), { roll: lerp(-20, 8, snap), mouth: 0.75, jitter: 0.3 });
    vignette(g, 0.6);
    optionCard(g, t, s17A + 0.02, 'A', 'WAVE + BACK AWAY', null, 0, 260, '#3ee07a');
    optionCard(g, t, s17A + 0.12, 'B', 'SPRINT IN THE DARK', null, 0, 420, '#5aa8ff');
  } });
  // ===== 18. CTA: wave or sprint? the garden, it waits in the light... which clicks off at the end =====
  const nA = s17B, end = T.duration, comT = ww('cta', 'comments,'), folT = ww('cta', 'follow'), lastOff = end - 1.0;
  cue(nA, 'whoosh', 0.35); cue(ww('cta', 'sprint?'), 'pop', 0.6); cue(comT, 'card', 0.8); cue(folT - 0.35, 'like', 0.9); cue(folT, 'follow', 1.0); cue(lastOff, 'lampclick', 0.9); cue(lastOff + 0.05, 'sting', 0.6);
  S.push({ a: nA, b: end + 0.1, fade: 0.3, draw: (g, t) => {
    const pk = eio(inv(nA, end, t)), lamp = 1 - ss(lastOff, lastOff + 0.25, t), E = gardenEnv(t, { lamp });
    const cam = { x: lerp(4.8, 4.6, pk), y: 1.25, z: lerp(5.0, 5.5, pk), f: 860, hy: 1080, yaw: lerp(-36, -38, pk) };
    gardenScene(g, cam, E, [sgSprite(POSE2(t), { lit: lamp, dark: 0.5, fogMul: 0.2 })], { darken: 0.1 * (1 - lamp) });
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, W, H); vignette(g, 0.6);
    bigWord(g, t, nA + 0.05, end + 1, 'WAVE', '#3ee07a', 230, 96); bigWord(g, t, ww('cta', 'or'), end + 1, 'OR', '#ffffff', 320, 62); bigWord(g, t, ww('cta', 'sprint?'), end + 1, 'SPRINT?', '#5aa8ff', 410, 96);
    commentChip(g, t, comT, 1590, 290);
    heartFollow(g, t, folT - 0.35, folT, 1590);
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

// ---------- the film ----------
const F_ROAD = 1500;
const CUES = [];  // sound cues collected by the shots: {t, n, v}
function cue(t, n, v = 1) { CUES.push({ t: +t.toFixed(3), n, v }); }

function idlePose(t, o = {}) {
  return { legL: [-2, 4], legR: [3, 5], footL: 0, footR: 0, armL: [-4 + noise(t * 0.7) * 3, 10, 7], armR: [-3 + noise(t * 0.6 + 3) * 3, 12, 7], lean: 10 + noise(t * 0.4) * 2,
    headPitch: (o.headPitch == null ? 18 : o.headPitch) + noise(t * 0.9) * 3, headRoll: (o.headRoll || 0) + noise(t * 1.3 + 5) * 4, bob: Math.sin(t * 1.6) * 0.008, roll: noise(t * 0.5) * 1.5, curl: 15 + noise(t * 2) * 10 };
}
function keys(K, t) {   // eased keyframes
  if (t <= K[0].t) return { ...K[0] }; if (t >= K[K.length - 1].t) return { ...K[K.length - 1] };
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1].t) { const k = eio(inv(K[i].t, K[i + 1].t, t)), o = {}; for (const p in K[i]) o[p] = lerp(K[i][p], K[i + 1][p], k); return o; }
}
const STRIDE = A => 4 * (STRETCHER.thigh + STRETCHER.shin) * Math.sin(24 * A * D2R);
const STRIDE_RUN = 4 * (STRETCHER.thigh + STRETCHER.shin) * Math.sin(50 * D2R);

let SHOTS = [];
function buildShots() {
  const L = id => LN(id), w = (id, k) => WD(id, k), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  // ===== 0. character-select spinner (≤ 2.6 s) =====
  const land = ww('hook', 'pale') - 0.05;
  const kinds = ['ring', 'hay', 'q', 'pale'];
  const target = 14; // index of the card we land on (kinds[14 % 4] = 'pale')
  const spinPos = t => target * (1 - Math.pow(1 - clamp(t / land), 3.2));
  // cue a tick each time a card passes the selector
  { let last = -1; for (let t = 0; t < land; t += 1 / 120) { const p = Math.round(spinPos(t)); if (p !== last) { if (last >= 0) cue(t, 'tick', 0.5); last = p; } } cue(land, 'select', 1); cue(0.0, 'whoosh', 0.6); }
  S.push({ a: 0, b: L('car').start - 0.1, fade: 0, draw: (g, t) => {
    const E = envAt(t); const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#05060c'); bg.addColorStop(0.5, '#141a2c'); bg.addColorStop(1, '#05060a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    sideForest(g, E, t * 30, 1600, { moon: false }); g.fillStyle = 'rgba(5,6,12,0.55)'; g.fillRect(0, 0, W, H);
    // title
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 70px Inter'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#000';
    const tk = popK(t, 0.05, 0.4); g.translate(W / 2, 330); g.scale(tk, tk); g.strokeText('HOW DO YOU SURVIVE', 0, 0); g.fillStyle = '#fff'; g.fillText('HOW DO YOU SURVIVE', 0, 0);
    g.font = '900 52px Inter'; g.strokeText('THIS HORROR CHARACTER?', 0, 78); g.fillStyle = '#ffd23f'; g.fillText('THIS HORROR CHARACTER?', 0, 78); g.restore();
    g.save(); const pk = popK(t, 0.25, 0.35); g.translate(W / 2, 520); g.scale(pk, pk); rr(g, -130, -42, 260, 84, 22); g.fillStyle = '#c4161c'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 3', 0, 3); g.restore();
    // carousel
    const p = spinPos(t), cy = 900;
    for (let i = Math.floor(p) - 3; i <= Math.floor(p) + 4; i++) {
      if (i < 0) continue; const dx = (i - p) * 300, x = W / 2 + dx; if (x < -200 || x > W + 200) continue;
      const near = 1 - clamp(Math.abs(dx) / 300); const sel = t >= land && i === target;
      g.save(); g.translate(x, cy); const sc = 0.8 + near * 0.2 + (sel ? 0.12 * popK(t, land, 0.3) : 0); g.scale(sc, sc); g.globalAlpha = 0.45 + near * 0.55;
      portrait(g, kinds[i % 4], t); g.restore();
    }
    // selector
    g.save(); g.translate(W / 2, cy); const sk = t >= land ? 1 + 0.12 * popK(t, land, 0.3) : 1; g.scale(sk, sk); g.strokeStyle = '#ffd23f'; g.lineWidth = 10; rr(g, -142, -182, 284, 364, 30); g.stroke();
    g.fillStyle = '#ffd23f'; poly(g, [[-26, -215], [26, -215], [0, -188]]); g.fill(); g.restore();
    if (t >= land) {   // name plate
      const nk = popK(t, land + 0.05, 0.35); g.save(); g.translate(W / 2, 1185); g.scale(nk, nk);
      rr(g, -360, -62, 720, 124, 30); g.fillStyle = 'rgba(8,8,12,0.9)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#fff'; g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THE PALE STRETCHER', 0, 4); g.restore();
    }
    vignette(g, 0.6);
  } });

  // ===== 1. one continuous camera move: car dies → down the road → up to the creature =====
  const cz = 62, sStart = L('car').start - 0.45;
  const camK = [
    { t: sStart, x: 0.9, y: 1.45, z: -8.0, hy: 900 },
    { t: L('fog').start, x: 0.55, y: 1.55, z: -6.3, hy: 905 },
    { t: L('stand').start + 0.4, x: 0.15, y: 2.0, z: 38, hy: 890 },
    { t: L('tall').start, x: 0.1, y: 1.5, z: 45, hy: 930 },
    { t: L('rule').start + 0.1, x: 0.0, y: 0.8, z: 55, hy: 1010 },
    { t: L('see').start - 0.05, x: 0.0, y: 1.0, z: 58.6, hy: 1500 },
  ];
  const dies = ww('car', 'dies');
  cue(dies - 0.15, 'sputter', 1); cue(L('fog').start - 0.1, 'whoosh', 0.35); cue(ww('stand', 'standing.') + 0.05, 'sting', 0.8);
  cue(ww('stand', 'standing.') + 0.05, 'bonecrack', 0.6); cue(w('tall', 1), 'boom', 0.55); cue(L('rule').start, 'card', 0.8); cue(ww('rule', 'never'), 'pop', 0.6);
  for (let k = 0; k < 3; k++) cue(L('tall').start + 1.2 + k * 0.9, 'twitch', 0.35);
  S.push({ a: sStart, b: L('see').start - 0.03, fade: 0.45, draw: (g, t) => {
    const E = envAt(t, 0, { head: 1, tail: 1 }); const c = keys(camK, t); const cam = { ...c, f: F_ROAD };
    const jerk = ss(ww('stand', 'standing.'), ww('stand', 'standing.') + 0.12, t);
    const pose = idlePose(t, { headRoll: lerp(0, 16, jerk), headPitch: lerp(30, 20, ss(L('rule').start, L('rule').end, t)) + 10 * ss(L('rule').start, L('see').start, t) });
    const ex = [creatureSprite(cz, 0.2, pose, 0, { mouth: 0.25, eyes: t < L('tall').start - 0.2 ? true : false })];
    // the car
    ex.push({ z: 0, draw: (g, cam, E) => { const p = proj(cam, 0, 0, 0); if (!p || p[3] < 0.6) return; const sh = t > dies - 0.1 && t < dies + 0.8 ? (1 - inv(dies - 0.1, dies + 0.8, t)) * 2 : 0;
      g.save(); g.globalAlpha = ss(1.8, 4.5, p[3]); exhaustPuffs(g, p[0], p[1], p[2], E, sStart, dies + 0.5); drawCarRear(g, p[0], p[1], p[2], E, { tail: E.tail, shake: sh, fk: fogK(E, p[3]) * 0.6 }); g.restore(); } });
    // height guide
    const tH = w('tall', 1);
    if (t > tH - 0.05 && t < L('rule').start + 0.2) ex.push({ z: cz - 0.3, draw: (g, cam, E) => {
      const a = proj(cam, 1.05, 0, cz), b = proj(cam, 1.05, 2.74, cz), hm = proj(cam, -1.2, 0, cz); if (!a || !b) return;
      const k = eout(inv(tH, tH + 0.5, t)), out = 1 - ss(L('rule').start - 0.1, L('rule').start + 0.2, t);
      g.save(); g.globalAlpha = out; g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[0], lerp(a[1], b[1], k)); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(a[0] - 20, a[1]); g.lineTo(a[0] + 20, a[1]); g.moveTo(b[0] - 20, lerp(a[1], b[1], k)); g.lineTo(b[0] + 20, lerp(a[1], b[1], k)); g.stroke();
      if (k > 0.9) { const lk = popK(t, tH + 0.4, 0.3); g.translate(a[0] + 40, lerp(a[1], b[1], 0.55)); g.scale(lk, lk); rr(g, 0, -40, 170, 80, 18); g.fillStyle = 'rgba(8,8,12,0.85)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#ffd23f'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('9 FT', 85, 3); }
      g.restore();
      // a normal 6 ft person for scale
      const hk = ss(ww('tall', 'feet'), ww('tall', 'feet') + 0.4, t) * out;
      if (hk > 0 && hm) { g.save(); g.globalAlpha = hk * 0.8; g.setLineDash([10, 8]); g.strokeStyle = '#9fd0ff'; g.lineWidth = 4; const s = hm[2], x = hm[0], y = hm[1];
        g.beginPath(); g.ellipse(x, y - 1.66 * s, 0.11 * s, 0.13 * s, 0, 0, TAU); g.moveTo(x - 0.2 * s, y - 1.42 * s); g.lineTo(x + 0.2 * s, y - 1.42 * s); g.lineTo(x + 0.17 * s, y - 0.9 * s); g.lineTo(x + 0.12 * s, y); g.lineTo(x - 0.12 * s, y); g.lineTo(x - 0.17 * s, y - 0.9 * s); g.closePath(); g.stroke();
        g.setLineDash([]); g.fillStyle = '#9fd0ff'; g.font = '900 36px Inter'; g.textAlign = 'center'; g.fillText('YOU', x, y - 1.95 * s); g.restore(); }
      // arms down to the knees
      const ak = ss(ww('tall', 'knees.') - 0.1, ww('tall', 'knees.') + 0.2, t) * out;
      if (ak > 0) { const kn = proj(cam, 0.75, 0.74, cz); g.save(); g.globalAlpha = ak; g.strokeStyle = '#ff5236'; g.lineWidth = 5; g.beginPath(); g.moveTo(kn[0] - 1.1 * kn[2], kn[1]); g.lineTo(kn[0] - 0.1 * kn[2], kn[1]); g.stroke(); g.restore(); }
    } });
    roadScene(g, cam, E, ex, { carZ: 0 });
    ruleCard(g, t, L('rule').start, L('see').start - 0.1, 1, ['NEVER LOOK', 'AT ITS FACE'], ww('rule', 'never'));
  } });

  // ===== 2. the face — it screams =====
  const scr = ww('see', 'screams...');
  cue(L('see').start - 0.03, 'hit', 0.9); cue(scr, 'scream', 1.0);
  S.push({ a: L('see').start - 0.03, b: L('runs').start - 0.05, fade: 0, draw: (g, t) => {
    const E = envAt(t); const bg = g.createRadialGradient(W / 2, 800, 100, W / 2, 900, 1200); bg.addColorStop(0, '#2a3348'); bg.addColorStop(1, '#05060a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    sideForest(g, E, 40, 1500, { moon: false }); g.fillStyle = 'rgba(30,38,56,0.55)'; g.fillRect(0, 0, W, H); fogBands(g, { hy: 1300 }, E, 0.8);
    const op = eout(inv(scr - 0.05, scr + 0.35, t)), z = 1 + 0.07 * eout(inv(scr - 0.05, scr + 0.3, t)) + 0.02 * inv(L('see').start, scr, t);
    g.save(); g.translate(W / 2, 760); g.scale(z, z); g.translate(-W / 2, -760);
    stretcherFaceBig(g, W / 2, 640, 300, { t, mouth: lerp(0.15, 1.0, op), jitter: op * 1.4, eyeBig: op, look: 0 });
    g.restore();
    if (t > scr) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, 900, 900, [120, 10, 10], 0.25 * (1 - inv(scr, scr + 1.2, t))); g.restore(); }
    motes(g, E, 0.7); vignette(g, 0.7);
  } });

  // ===== 3. it runs at you =====
  const rA = L('runs').start - 0.05, rHit = ww('runs', 'stops.') + 0.1, rB = L('walk').start - 0.18;
  cue(rA, 'whoosh', 0.7); cue(ww('runs', 'never'), 'sting', 0.7); cue(rHit, 'impact', 1.0);
  S.push({ a: rA, b: rB, fade: 0.08, draw: (g, t) => {
    const E = envAt(t, 0, { head: 0.6 }); const camZ = 5, cam = { x: 0, y: 1.25, z: camZ, hy: 900 + noise(t * 30) * 12 * inv(rA, rHit, t), f: F_ROAD };
    const k = clamp((t - rA) / (rHit - rA)), z = lerp(cz - 30, camZ + 1.9, Math.pow(k, 0.9));
    const ph = (cz - 30 - z) / STRIDE_RUN * TAU;
    const lunge = ss(rHit - 0.25, rHit, t);
    const pose = walkPose(ph, 1, 1); pose.lean += 8; pose.headPitch = -10; pose.armL = [lerp(pose.armL[0], 150, lunge), lerp(pose.armL[1], 10, lunge), lerp(8, 25, lunge)]; pose.armR = [lerp(pose.armR[0], 150, lunge), lerp(pose.armR[1], 10, lunge), lerp(8, 25, lunge)]; pose.curl = 30;
    roadScene(g, cam, E, [creatureSprite(z, 0, pose, 0, { mouth: 1, lit: 0.5 })], {});
    bigWord(g, t, ww('runs', 'never'), rB, 'IT NEVER STOPS', '#ff3b2f', 330, 104);
    if (t > rHit) { g.fillStyle = rgb([0, 0, 0], ss(rHit, rB, t)); g.fillRect(0, 0, W, H); }
    vignette(g, 0.6);
  } });

  // ===== 4. through the windshield: it walks toward your car =====
  const wA = L('walk').start - 0.25, wB = L('woods').start - 0.08;
  S.push({ a: wA, b: wB, fade: 0.3, draw: (g, t) => {
    const E = envAt(t, 0, { head: 1 }); const z = lerp(33, 27, inv(wA, wB + 0.4, t)); const ph = (33 - z) / STRIDE(0.8) * TAU;
    const pose = walkPose(ph, 0.8, 0); pose.headPitch = 22; pose.headRoll = 10 + noise(t) * 5; pose.curl = 20;
    windshieldPOV(g, E, { extras: [creatureSprite(z, -0.5, pose, 0, { mouth: 0.3, lit: 1, eyes: false, fogMul: 0.55 })], tremble: 1 });
    vignette(g, 0.5);
  } });
  { const z0 = 33; for (let t = wA; t < wB; t += 1 / 60) { const ph = (z0 - lerp(33, 27, inv(wA, wB + 0.4, t))) / STRIDE(0.8) * TAU, ph2 = (z0 - lerp(33, 27, inv(wA, wB + 0.4, t + 1 / 60))) / STRIDE(0.8) * TAU; if (Math.floor(ph / Math.PI + 0.5) !== Math.floor(ph2 / Math.PI + 0.5)) cue(t, 'step', 0.35); } }
  cue(L('walk').start, 'heartbeat', 0.5);

  // ===== 5. option 1: run into the woods? (what-if, grey) =====
  const oA = L('woods').start - 0.08, oB = L('lock').start - 0.15, legs = ww('woods', 'legs,'), catchT = ww('woods', 'catches'), secs = ww('woods', 'seconds.');
  cue(L('woods').start, 'card', 0.7); cue(ww('woods', 'no.'), 'buzz', 0.7); cue(legs - 0.1, 'whoosh', 0.5); cue(catchT + 0.15, 'grab', 0.9); cue(secs, 'xstamp', 1);
  S.push({ a: oA, b: oB, fade: 0.3, draw: (g0, t) => {
    const E = envAt(t, 0); const SC = scratch(); let g = SC.g; g.clearRect(0, 0, W, H); const runV = 5.2, sc = 330, ground = 1300;
    const dist = (t - oA) * runV; const scroll = dist * sc;
    sideForest(g, E, scroll * 0.35, ground - 40, {});
    // forest floor: dirt, roots, leaves
    const fg = g.createLinearGradient(0, ground - 60, 0, H); fg.addColorStop(0, '#1d2226'); fg.addColorStop(1, '#0a0c0e'); g.fillStyle = fg; g.fillRect(0, ground - 30, W, H);
    for (let i = -1; i < 12; i++) { const x = ((i * 140 - scroll) % 1680 + 1680) % 1680 - 300, hh = hash(i + Math.floor((i * 140 - scroll) / 1680)); g.strokeStyle = '#2b2620'; g.lineWidth = 8; g.beginPath(); g.moveTo(x, ground + 20 + hh * 120); g.quadraticCurveTo(x + 50, ground + hh * 120, x + 120, ground + 30 + hh * 120); g.stroke(); g.fillStyle = '#4a3020'; ell(g, x + 60, ground + 140 + hh * 200, 14, 6, hh * 3); g.fill(); }
    // runner (human)
    const caught = ss(catchT, catchT + 0.25, t);
    const rp = walkPose(dist / 2.7 * TAU, 1, 1); rp.lean = lerp(20, 35, caught); rp.headPitch = -10;
    const rx = 640 + caught * 40;
    // the creature closing in
    const cx = lerp(-650, rx - 520, eio(inv(legs - 0.15, catchT + 0.15, t)));
    const cdist = dist * 1.25;
    const cp = walkPose(cdist / STRIDE_RUN * TAU, 1, 0.65); cp.lean = 30; cp.headPitch = -20; cp.curl = 25;
    const reach = ss(catchT - 0.2, catchT + 0.1, t); cp.armR = [lerp(cp.armR[0], 95, reach), lerp(cp.armR[1], 0, reach), 0];
    g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, rx, ground, 120, 16); g.fill(); ell(g, cx, ground, 160, 18); g.fill();
    drawRig(g, HUMAN, rp, rx, ground, sc, 90, { t, expr: 'scared' });
    if (t > legs - 0.2) drawRig(g, STRETCHER, cp, cx, ground, sc, 90, { t, twitch: 1, mouth: 1 });
    motes(g, E, 0.6); vignette(g, 0.55);
    g0.save(); g0.filter = 'grayscale(1) contrast(1.15)'; g0.drawImage(SC.c, 0, 0); g0.restore(); g = g0;
    chip(g, t, L('woods').start, oB - 0.15, 'RUN INTO THE WOODS?', '#ff3b2f', 250, g2 => iconX(g2, 24));
    bigX(g, t, secs, W / 2, 800, 230);
  } });

  // ===== 6. option 2: lock the doors? =====
  const lA = L('lock').start - 0.15, lB = L('works').start - 0.15, lockT = ww('lock', 'lock') + 0.08, ifT = ww('lock', 'if') - 0.08, glassT = ww('lock', 'glass') + 0.1, stopT = ww('lock', 'stop');
  cue(L('lock').start, 'card', 0.7); cue(lockT + 0.12, 'lockclick', 1); cue(ifT, 'whoosh', 0.4); cue(glassT - 0.25, 'swing', 0.6); cue(glassT, 'glass', 1.0); cue(stopT, 'xstamp', 1);
  const shards = (() => { const r = rng(99), a = []; for (let i = 0; i < 46; i++) { const ang = r() * TAU, sp = 300 + r() * 1100; a.push({ x: 560 + (r() - 0.5) * 120, y: 640 + (r() - 0.5) * 120, vx: Math.cos(ang) * sp * 0.8 + 250, vy: Math.sin(ang) * sp * 0.6 - 200, vr: (r() - 0.5) * 14, s: 18 + r() * 40, pts: [[r() - 0.5, -0.6], [0.6, r() * 0.4], [-0.5 + r() * 0.3, 0.6]] }); } return a; })();
  const cracks = (() => { const r = rng(17), a = []; for (let i = 0; i < 14; i++) { const ang = i / 14 * TAU + r() * 0.3, pts = [[0, 0]]; let x = 0, y = 0; for (let k = 0; k < 5; k++) { x += Math.cos(ang + (r() - 0.5) * 0.5) * (50 + r() * 70); y += Math.sin(ang + (r() - 0.5) * 0.5) * (50 + r() * 70); pts.push([x, y]); } a.push(pts); } return a; })();
  S.push({ a: lA, b: lB, fade: 0.3, draw: (g, t) => {
    const E = envAt(t, 0, { head: 1 });
    if (t < ifT) {   // close-up: a finger pushes the lock pin down
      const pin = ss(lockT, lockT + 0.12, t);
      g.save(); const zk = 2.2; g.translate(W / 2, 860); g.scale(zk, zk); g.translate(-835, -960);
      carSide(g, E, { lockPin: pin, seat: false, head: 1 });
      // spotlight on the pin so it reads
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 835, DOOR.sill - 20, 90, [120, 140, 190], 0.25); g.restore();
      const pinTop = DOOR.sill - 52 + pin * 44;
      const fy = lerp(pinTop - 260, pinTop, ss(lA, lockT, t)) - (t > lockT + 0.3 ? ss(lockT + 0.3, lockT + 0.7, t) * 200 : 0);
      g.fillStyle = HUMAN.hoodie; g.strokeStyle = '#141218'; g.lineWidth = 3; poly(g, [[860, fy - 120], [940, fy - 230], [1010, fy - 170], [905, fy - 70]]); g.fill(); g.stroke();
      g.fillStyle = HUMAN.skin; rr(g, 830, fy - 140, 90, 85, 30); g.fill(); g.stroke(); rr(g, 818, fy - 75, 34, 75, 15); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)'; rr(g, 824, fy - 22, 22, 16, 6); g.fill();
      g.restore();
    } else {   // what-if: it smashes through the glass (grey)
      const L2 = scratch(); const lg = L2.g; lg.clearRect(0, 0, W, H);
      const hitK = inv(glassT - 0.3, glassT, t), after = t - glassT;
      carSide(lg, E, { lockPin: 1, outside: og => {
        // its pale body right outside the window, head above the frame (we never see the face)
        drawRig(og, STRETCHER, idlePose(t, { headPitch: 25 }), 560, 2050, 700, 0, { t, twitch: 1, eyes: false });
      }, glass: gg => {
        if (after > 0) { gg.save(); gg.translate(560, 640); gg.strokeStyle = 'rgba(235,240,255,0.85)'; gg.lineWidth = 4; const ck = eout(clamp(after / 0.12));
          cracks.forEach(c => { gg.beginPath(); gg.moveTo(0, 0); c.forEach((p, i) => { if (i / c.length <= ck) gg.lineTo(p[0], p[1]); }); gg.stroke(); });
          gg.lineWidth = 2.5; for (let r = 60; r < 360; r += 80) { gg.beginPath(); gg.ellipse(0, 0, r * ck, r * 0.8 * ck, 0, 0, TAU); gg.stroke(); }
          gg.fillStyle = 'rgba(0,0,0,0.75)'; ell(gg, 10, 10, 110 * ck, 90 * ck); gg.fill(); gg.restore(); }
      } });
      // the arm: winds up, then punches through the glass toward the driver's seat
      const fistX = after < 0 ? lerp(-120, 520, ein(hitK)) - (1 - ss(ifT, glassT - 0.32, t)) * 100 : lerp(560, 760, eout(clamp(after / 0.5)));
      const fistY = after < 0 ? lerp(700, 640, hitK) : lerp(640, 760, eout(clamp(after / 0.5)));
      if (t > ifT + 0.1) {
        limb(lg, [[-80, 780], [fistX - 260, fistY + 40], [fistX, fistY]], 70, STRETCHER.skin, STRETCHER.ink, STRETCHER.shade, 5);
        const open = clamp(after / 0.25);
        for (let f = 0; f < 4; f++) { const a = -0.5 + f * 0.33 * (0.3 + open), l = lerp(40, 150, open); limb(lg, [[fistX, fistY], [fistX + Math.cos(a) * l * 0.55, fistY + Math.sin(a) * l * 0.55], [fistX + Math.cos(a + 0.5 * open) * l, fistY + Math.sin(a + 0.5 * open) * l]], 18, STRETCHER.skin, STRETCHER.ink, null, 3); }
      }
      // flying shards (fall with gravity)
      if (after > 0) shards.forEach(s => { const tt = after; if (tt > 1.6) return; const x = s.x + s.vx * tt, y = s.y + s.vy * tt + 1400 * tt * tt; const sc2 = 1 + tt * 0.6;
        lg.save(); lg.translate(x, y); lg.rotate(s.vr * tt); lg.scale(sc2, sc2); lg.fillStyle = 'rgba(210,225,245,0.55)'; lg.strokeStyle = 'rgba(255,255,255,0.9)'; lg.lineWidth = 2; poly(lg, s.pts.map(p => [p[0] * s.s, p[1] * s.s])); lg.fill(); lg.stroke(); lg.restore(); });
      // camera kick on impact
      const kick = after > 0 && after < 0.35 ? (1 - after / 0.35) : 0;
      g.save(); g.filter = 'grayscale(1) contrast(1.15) brightness(1.05)'; g.translate(noise(t * 40) * 18 * kick, noise(t * 37 + 2) * 14 * kick); g.drawImage(L2.c, 0, 0); g.restore();
      bigX(g, t, stopT, W / 2, 820, 230);
    }
    vignette(g, 0.55);
    chip(g, t, L('lock').start, lB - 0.15, 'LOCK THE DOORS?', '#ff3b2f', 250, g2 => iconX(g2, 24));
  } });

  // ===== 7. here's what works =====
  const hA = L('works').start - 0.15, hB = L('feet').start - 0.2;
  const lightsT = ww('works', 'lights'), coverT = ww('works', 'cover'), slideT = ww('works', 'slide');
  cue(L('works').start, 'good', 0.8); cue(lightsT + 0.25, 'switch', 0.9); cue(coverT, 'pop', 0.5); cue(coverT + 0.1, 'cloth', 0.6); cue(slideT, 'pop', 0.5); cue(slideT + 0.1, 'slide', 0.7);
  S.push({ a: hA, b: hB, fade: 0.35, draw: (g, t) => {
    const knob = ss(lightsT + 0.1, lightsT + 0.3, t), head = 1 - ss(lightsT + 0.25, lightsT + 0.75, t);
    const E = envAt(t, 0, { head });
    carSide(g, E, { lockPin: 1, lightKnob: knob });
    const reach = ss(lightsT - 0.35, lightsT + 0.05, t) * (1 - ss(lightsT + 0.35, lightsT + 0.7, t));
    drawDriver(g, E, ss(coverT, coverT + 0.35, t), eio(inv(slideT, slideT + 0.9, t)), reach, { tremble: 1 });
    g.fillStyle = rgb([0, 0, 0], 0.35 * (1 - head)); g.fillRect(0, 0, W, H);
    vignette(g, 0.6);
    chip(g, t, L('works').start, hB - 0.1, "HERE'S WHAT WORKS", '#3ee07a', 250, g2 => iconCheck(g2, 24));
    checklist(g, t, [{ text: 'LIGHTS OFF', at: lightsT }, { text: 'COVER YOUR EYES', at: coverT }, { text: 'HIDE LOW', at: slideT }]);
  } });

  // ===== 8. bare feet on the asphalt, right next to your door =====
  const fA = L('feet').start - 0.2, fB = L('tap').start - 0.15, stopF = ww('feet', 'door.') - 0.2;
  const fs = 800, fground = 1560;
  const fx = t => lerp(-1000, 400, ss(fA - 0.3, stopF, t) * 0.0 + inv(fA - 0.3, stopF, t));
  const fph = t => (fx(t) + 1000) / (STRIDE(0.6) * fs) * TAU;
  { let last = null; for (let t = fA; t < fB; t += 1 / 120) { const ph = fph(Math.min(t, stopF)); const n = Math.floor(ph / Math.PI + 0.5); if (last != null && n !== last && t < stopF + 0.05) cue(t, 'barefoot', 0.8); last = n; } }
  S.push({ a: fA, b: fB, fade: 0.4, draw: (g, t) => {
    const E = envAt(t, 0, { head: 0 });
    sideForest(g, E, 200 + t * 4, 1050, {});
    // asphalt with grain and the edge line
    const ag = g.createLinearGradient(0, 1050, 0, H); ag.addColorStop(0, rgb(mixc(E.P.road, E.P.fog, 0.6))); ag.addColorStop(0.25, rgb(E.P.road)); ag.addColorStop(1, '#0b0c0f'); g.fillStyle = ag; g.fillRect(0, 1050, W, H - 1050);
    const r = rng(4); g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 500; i++) { const y = 1080 + Math.pow(r(), 0.7) * 840; g.fillRect(r() * W, y, 2 + (y - 1050) / 200, 2 + (y - 1050) / 200); }
    g.fillStyle = 'rgba(190,190,180,0.5)'; poly(g, [[0, 1720], [W, 1640], [W, 1665], [0, 1752]]); g.fill();
    // the car's side: door, sill, front wheel
    g.fillStyle = '#16203a'; poly(g, [[560, 300], [W + 20, 300], [W + 20, 1290], [600, 1290], [560, 1200]]); g.fill(); g.strokeStyle = '#05070c'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#0c1222'; g.fillRect(560, 1180, W - 540, 110);
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(780, 300); g.lineTo(780, 1180); g.stroke();
    g.fillStyle = '#8e95a6'; rr(g, 830, 560, 150, 40, 16); g.fill();
    g.strokeStyle = 'rgba(150,170,210,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(570, 520); g.lineTo(W, 500); g.stroke();
    g.fillStyle = '#05060a'; ell(g, 680, 1210, 190, 120); g.fill();
    g.fillStyle = '#0d0e11'; ell(g, 680, 1260, 165, 165); g.fill(); g.fillStyle = '#3a3e48'; ell(g, 680, 1260, 92, 92); g.fill(); g.fillStyle = '#1a1c22'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ell(g, 680 + Math.cos(a) * 55, 1260 + Math.sin(a) * 55, 16, 16); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.5)'; ell(g, 760, 1430, 360, 40); g.fill();
    // fog low on the ground
    groundFog(g, { x: 0, y: 1, z: 0, hy: 1300, f: 900 }, E, 6, 1.2);
    // the legs (upper body out of frame)
    const x = fx(Math.min(t, stopF)), walking = t < stopF;
    let pose = walkPose(fph(Math.min(t, stopF)), 0.6, 0);
    const settle = ss(stopF, stopF + 0.6, t); const ip = idlePose(t, { headPitch: 25 });
    if (!walking) { for (const k of ['legL', 'legR', 'armL', 'armR']) pose[k] = pose[k].map((v, i) => lerp(v, ip[k][i], settle)); pose.bob = lerp(pose.bob, ip.bob, settle); }
    pose.curl = 20;
    g.fillStyle = 'rgba(0,0,0,0.45)'; ell(g, x, fground, 220, 26); g.fill();
    drawRig(g, STRETCHER, pose, x, fground, fs, 90, { t, twitch: 1.5, eyes: false });
    fogBands(g, { hy: 1500 }, E, 0.5); motes(g, E, 0.6); vignette(g, 0.65);
  } });

  // ===== 9. long fingers tap on the window =====
  const tA = L('tap').start - 0.15, tB = L('still').start - 0.15, tap0 = ww('tap', 'tap');
  const taps = [tap0, tap0 + 0.42, tap0 + 0.84, tap0 + 1.3, tap0 + 1.62];
  taps.forEach((x, i) => cue(x, 'tap', i === 0 ? 1 : 0.85));
  S.push({ a: tA, b: tB, fade: 0.4, draw: (g, t) => {
    const E = envAt(t, 0, { head: 0 });
    const hk = eout(inv(tA, tap0 - 0.15, t));
    carSide(g, E, { lockPin: 1, lightKnob: 1, seat: true, outside: og => {
      // the hand on the other side of the glass
      const hx = 600, hy = lerp(80, 470, hk);
      limb(og, [[hx + 300, -100], [hx + 140, hy - 70], [hx, hy]], 84, STRETCHER.skin, STRETCHER.ink, STRETCHER.shade, 5);
      og.fillStyle = STRETCHER.skin; og.strokeStyle = STRETCHER.ink; og.lineWidth = 5; ell(og, hx, hy + 20, 95, 78, -0.3); og.fill(); og.stroke();
      for (let f = 0; f < 4; f++) {
        const ti = taps.findIndex((x, i) => i % 4 === f || false); let ext = 0;
        taps.forEach((x, i) => { if (i % 4 === f) { const d = t - x; if (d > -0.12 && d < 0.1) ext = Math.max(ext, d < 0 ? 1 + d / 0.12 : 1 - d / 0.1); } });
        const bx = hx - 95 + f * 52, by = hy + 70, len = 280 + f % 2 * 40 + ext * 34;
        limb(og, [[bx, by], [bx - 10 - ext * 10, by + len * 0.5], [bx - 20 - ext * 25, by + len]], 26, STRETCHER.skin, STRETCHER.ink, null, 4);
      }
    }, glass: gg => {
      taps.forEach(x => { const d = t - x; if (d < 0 || d > 0.9) return; gg.strokeStyle = `rgba(220,230,255,${0.5 * (1 - d / 0.9)})`; gg.lineWidth = 3; ell(gg, 485 + (taps.indexOf(x) % 4) * 52, 830, 20 + d * 120, 10 + d * 60); gg.stroke(); });
    } });
    drawDriver(g, E, 1, 1, 0, { tremble: 1, closed: true });
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, H); vignette(g, 0.7);
  } });

  // ===== 10. don't move. don't breathe. =====
  const dA = L('still').start - 0.15, dB = L('wait').start - 0.1, breatheT = ww('still', 'breathe.');
  cue(dA, 'heartbeat', 0.8); cue(breatheT - 0.1, 'breathstop', 0.6); cue(ww('still', 'open'), 'sting', 0.5);
  S.push({ a: dA, b: dB, fade: 0.35, draw: (g, t) => {
    const E = envAt(t);
    // window above: outside darkness, its face pressed against the glass
    g.fillStyle = '#0b0d14'; g.fillRect(0, 0, W, H);
    g.save(); poly(g, [[60, 120], [W, 140], [W, 980], [0, 980], [0, 300]]); g.clip();
    sideForest(g, E, 360, 900, { moon: false }); g.fillStyle = 'rgba(10,14,24,0.55)'; g.fillRect(0, 0, W, H);
    const fy = lerp(560, 600, inv(dA, dB, t));
    stretcherFaceBig(g, 600, fy, 230, { t, mouth: 0.35 + 0.1 * Math.sin(t * 1.5), tilt: -8, look: 1 });
    // breath fog from its mouth on the glass
    const br = 0.5 + 0.5 * Math.sin(t * 2.2); g.fillStyle = `rgba(200,210,230,${0.12 + 0.12 * br})`; ell(g, 600, fy + 200, 180 + br * 30, 120 + br * 20); g.fill();
    g.fillStyle = 'rgba(20,30,50,0.25)'; g.fillRect(0, 0, W, H);
    g.restore();
    g.fillStyle = '#0b0c10'; poly(g, [[0, 960], [W, 960], [W, 1010], [0, 1010]]); g.fill();
    // the driver, eyes squeezed shut
    humanFaceBig(g, 470, 1400, 300, { t, tremble: 1 });
    // their own breath: visible puffs until "don't breathe"
    for (let i = 0; i < 4; i++) { const b = dA + i * 0.55, age = t - b; if (b > breatheT - 0.1 || age < 0 || age > 0.9) continue; g.fillStyle = `rgba(220,230,245,${0.3 * (1 - age / 0.9)})`; ell(g, 470 + age * 120, 1640 - age * 90, 30 + age * 60, 20 + age * 40); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, W, H); vignette(g, 0.7);
  } });

  // ===== 11. it's waiting for you to look =====
  const aA = L('wait').start - 0.1, aB = L('dawn').start - 0.35, lookT = ww('wait', 'look.');
  cue(lookT, 'sting', 0.9); cue(aA, 'creak', 0.4);
  S.push({ a: aA, b: aB, fade: 0.3, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#07080c'; g.fillRect(0, 0, W, H);
    const pk = eio(inv(aA, aB, t)); g.save(); const z = 1 + 0.12 * pk; g.translate(W / 2, 760); g.scale(z, z); g.translate(-W / 2, -760);
    g.save(); poly(g, [[0, 80], [W, 80], [W, 1350], [0, 1350]]); g.clip();
    sideForest(g, E, 360, 1200, { moon: false }); g.fillStyle = 'rgba(10,14,24,0.6)'; g.fillRect(0, 0, W, H);
    const tilt = lerp(-8, -32, ss(L('wait').start, lookT, t)) + (t > lookT ? Math.sin((t - lookT) * 30) * 2 * (1 - inv(lookT, lookT + 0.5, t)) : 0);
    stretcherFaceBig(g, W / 2, 720, 300, { t, mouth: lerp(0.35, 0.9, ss(lookT - 0.4, lookT + 0.3, t)), tilt, look: 1, eyeBig: ss(lookT, lookT + 0.3, t), jitter: 0.3 });
    const br = 0.5 + 0.5 * Math.sin(t * 2.2); g.fillStyle = `rgba(200,210,230,${0.1 + 0.1 * br})`; ell(g, W / 2, 1050, 220, 140); g.fill();
    // glass streaks
    g.strokeStyle = 'rgba(200,215,240,0.12)'; g.lineWidth = 30; g.beginPath(); g.moveTo(100, 1300); g.lineTo(500, 100); g.stroke();
    g.restore(); g.restore();
    // the top of the driver's hood at the bottom
    g.fillStyle = '#2e1112'; ell(g, 420, 1860 + noise(t * 20) * 4, 330, 210); g.fill(); g.strokeStyle = '#141218'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#24160d'; ell(g, 420, 1760 + noise(t * 20) * 4, 150, 80); g.fill();
    g.fillStyle = rgb([0, 0, 0], ss(aB - 0.6, aB, t)); g.fillRect(0, 0, W, H);
    vignette(g, 0.75);
  } });

  // ===== 12. dawn → it's gone → follow for part 4 =====
  const nA = aB, gone = ww('dawn', 'gone.'), end = T.duration;
  const ctaT = L('cta').start, fol = ww('cta', 'follow,'), four = ww('cta', 'four'), surv = ww('cta', 'survived?');
  cue(L('dawn').start - 0.6, 'birds', 0.8); cue(gone, 'whoosh', 0.35); cue(ctaT, 'card', 0.7); cue(surv + 0.3, 'like', 0.9); cue(fol, 'follow', 1.0); cue(end - 1.05, 'sting', 0.8);
  S.push({ a: nA, b: end + 0.1, fade: 0.25, draw: (g, t) => {
    const back_ = ss(end - 1.1, end - 0.4, t);
    const dawn = ss(nA - 0.3, L('dawn').start + 1.8, t) * (1 - 0.45 * back_);
    const E = envAt(t, dawn, { head: 0, tail: 0 });
    const cam = keys([{ t: nA, x: 0.7, y: 1.4, z: -8.5, hy: 900 }, { t: ctaT, x: 0.4, y: 1.7, z: -9.5, hy: 940 }, { t: end, x: 0.2, y: 2.1, z: -11, hy: 980 }], t); cam.f = F_ROAD;
    const z = lerp(26, 40, inv(nA, gone + 0.3, t)), ph = (z - 26) / STRIDE(0.7) * TAU;
    const pose = walkPose(ph, 0.7, 0); pose.headPitch = 20; pose.curl = 15;
    const alpha = 1 - ss(gone - 0.3, gone + 0.35, t);
    const ex = [{ z: 0, draw: (g, cam, E) => { const p = proj(cam, 0, 0, 0); drawCarRear(g, p[0], p[1], p[2], E, { tail: 0 }); } }];
    if (alpha > 0) ex.push(creatureSprite(z, 2.1, pose, 180, { alpha, eyes: false, fogMul: 0.45 }));
    if (back_ > 0) ex.push(creatureSprite(42, -2.0, idlePose(t), 0, { alpha: back_ * 0.9, mouth: 0.6, fogMul: 0.4 }));
    roadScene(g, cam, E, ex, {});
    vignette(g, 0.45);
    // call to action
    if (t > ctaT - 0.05) {
      bigWord(g, t, ctaT, end + 1, 'WOULD YOU HAVE', '#ffffff', 300, 84); bigWord(g, t, ww('cta', 'survived?'), end + 1, 'SURVIVED?', '#ffd23f', 400, 104);
      if (t > surv + 0.3) { const k = popK(t, surv + 0.3, 0.35); g.save(); g.translate(W / 2 - 170, 600); g.scale(k, k); g.fillStyle = '#ff2f55'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-90, -30, -50, -100, 0, -55); g.bezierCurveTo(50, -100, 90, -30, 0, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.restore(); }
      if (t > fol) { const k = popK(t, fol, 0.35); g.save(); g.translate(W / 2 + 90, 590); g.scale(k, k); rr(g, -170, -55, 340, 110, 30); g.fillStyle = '#fe2c55'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ FOLLOW', 0, 3); g.restore(); }
      if (t > four - 0.05) { const k = popK(t, four - 0.05, 0.4); g.save(); g.translate(W / 2, 760); g.scale(k, k); rr(g, -190, -48, 380, 96, 24); g.fillStyle = 'rgba(8,8,12,0.88)'; g.fill(); g.strokeStyle = '#c4161c'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 4 SOON', 0, 3); g.restore(); }
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
    g.save(); if (s.grey) g.filter = 'grayscale(1) contrast(1.15)'; g.globalAlpha = first ? 1 : k; g.drawImage(LAYER, 0, 0); g.restore();
    first = false;
  }
  captions(g, t);
}

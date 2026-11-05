// ---------- the film: Part 4 – The Frostjaw ----------
const F_ROAD = 1500;
const CUES = [];  // sound cues collected by the shots: {t, n, v}
function cue(t, n, v = 1) { CUES.push({ t: +t.toFixed(3), n, v }); }

function idlePose(t, o = {}) {   // the Frostjaw standing: hunched, head forward, listening twitches
  const jerk = Math.pow(Math.max(0, noise(t * 0.9 + 7)), 3) * 30;
  return { legL: [-3, 8], legR: [4, 9], footL: 0, footR: 0, armL: [-6 + noise(t * 0.7) * 4, 14, 8], armR: [-4 + noise(t * 0.6 + 3) * 4, 16, 8], lean: (o.lean == null ? 20 : o.lean) + noise(t * 0.4) * 2,
    headPitch: (o.headPitch == null ? 30 : o.headPitch) + noise(t * 0.9) * 4, headRoll: (o.headRoll || 0) + noise(t * 1.3 + 5) * 7 + jerk * (o.twitchy == null ? 1 : o.twitchy), bob: Math.sin(t * 1.4) * 0.01, roll: noise(t * 0.5) * 2, curl: 20 + noise(t * 2) * 12 };
}
function keys(K, t) {   // eased keyframes
  if (t <= K[0].t) return { ...K[0] }; if (t >= K[K.length - 1].t) return { ...K[K.length - 1] };
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1].t) { const k = eio(inv(K[i].t, K[i + 1].t, t)), o = {}; for (const p in K[i]) o[p] = lerp(K[i][p], K[i + 1][p], k); return o; }
}
const STRIDE = A => 4 * (FROST.thigh + FROST.shin) * Math.sin(24 * A * D2R);
const STRIDE_RUN = 4 * (FROST.thigh + FROST.shin) * Math.sin(50 * D2R);
function footCues(t0, t1, phAt, name, v) { let last = null; for (let t = t0; t < t1; t += 1 / 120) { const n = Math.floor(phAt(t) / Math.PI + 0.5); if (last != null && n !== last) cue(t, name, v); last = n; } }
function sitPose(t, o = {}) {   // you on the bucket, holding the rod
  const tr = o.tremble || 0;
  return { legL: [82, 86], legR: [78, 84], footL: 0, footR: 0, armL: [o.armA == null ? 52 : o.armA, 40, 12], armR: [o.armA == null ? 50 : o.armA, 42, -12], lean: 12 + noise(t * 0.5) * 2 + tr * noise(t * 9) * 2,
    headPitch: (o.headPitch || 0) + noise(t * 0.6) * 3, headRoll: noise(t * 0.4 + 2) * 3, bob: -0.5, roll: 0 };
}
function lieK(k, t, o = {}) {   // sitting (k=0) → lying flat on the back (k=1); o.sleeve brings an arm to the mouth
  const sl = o.sleeve || 0;
  return { legL: [lerp(82, 4, k), lerp(86, 8, k)], legR: [lerp(78, 0, k), lerp(84, 4, k)], footL: lerp(0, -30, k), footR: lerp(0, -30, k),
    armL: [lerp(lerp(50, 8, k), 120, sl), lerp(lerp(40, 10, k), 120, sl), 0], armR: [lerp(50, 12, k), lerp(42, 15, k), 0],
    lean: lerp(12, 0, k), headPitch: lerp(0, -6, k) + noise(t * 3) * 1.5, headRoll: 0, bob: -0.5 * (1 - k), roll: 0 };
}
function crawlPose(ph) { const s = Math.sin(ph), c = Math.cos(ph);
  return { legL: [8 + s * 12, 20 + Math.max(0, c) * 50], legR: [8 - s * 12, 20 + Math.max(0, -c) * 50], footL: -40, footR: -40, armL: [150 + s * 25, -30 - Math.max(0, c) * 40, 0], armR: [150 - s * 25, -30 - Math.max(0, -c) * 40, 0], lean: 0, headPitch: -40, bob: 0, roll: 0 }; }
// draw the survivor rotated about the pelvis (rot in rad; +PI/2 = lying on the back, head to the right)
function drawYouRot(g, cx, cy, s, pose, rot, yaw, opt = {}) { g.save(); g.translate(cx, cy); g.rotate(rot); drawRig(g, YOU, pose, 0, (YOU.hipY + (pose.bob || 0)) * s, s, yaw, opt); g.restore(); }
function glove(g, x, y, s, rot, o = {}) {   // a gloved hand coming in from the bottom of the frame
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = YOU.hoodie; g.strokeStyle = '#141218'; g.lineWidth = 6; poly(g, [[-80, 520], [80, 520], [62, 40], [-62, 40]]); g.fill(); g.stroke();
  g.fillStyle = YOU.hoodieS; rr(g, -70, 20, 140, 60, 20); g.fill(); g.stroke();
  g.fillStyle = '#2b2d33'; rr(g, -62, -95, 124, 125, 42); g.fill(); g.stroke();
  if (!o.fist) { rr(g, -82, -70, 40, 70, 18); g.fill(); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 5; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-30 + k * 28, -88); g.lineTo(-30 + k * 28, -50); g.stroke(); }
  g.fillStyle = 'rgba(235,245,255,0.55)'; for (let k = 0; k < 5; k++) { ell(g, -50 + k * 25, -92 + (k % 2) * 4, 8, 4); g.fill(); }
  g.restore();
}
function phone(g, x, y, s, rot, on, t) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  rr(g, -95, -185, 190, 370, 28); g.fillStyle = '#0d0e12'; g.fill(); g.strokeStyle = '#3a3d46'; g.lineWidth = 6; g.stroke();
  rr(g, -82, -168, 164, 336, 18); g.fillStyle = on > 0 ? rgb(mixc([12, 14, 20], [40, 70, 120], on)) : '#07080b'; g.fill();
  if (on > 0) {
    g.save(); g.globalAlpha = on; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 22px Inter'; g.fillText('INCOMING CALL', 0, -110); g.font = '900 40px Inter'; g.fillText('MOM', 0, -60);
    ell(g, 0, 10, 38, 38); g.fillStyle = '#9fb4d8'; g.fill();
    const p = 1 + 0.08 * Math.sin(t * 14); g.fillStyle = '#ff3b30'; ell(g, -45, 110, 26 * p, 26 * p); g.fill(); g.fillStyle = '#34c759'; ell(g, 45, 110, 26 * p, 26 * p); g.fill();
    g.restore(); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, 0, 380, [120, 170, 255], 0.35 * on); g.restore();
  }
  g.restore();
}
function iceCrackBurst(g, x, y, s, age, seed) {   // cracks spreading from a point on the ice + a little snow puff
  if (age < 0) return; const r = rng(seed), k = eout(clamp(age / 0.18)), a0 = 1 - clamp((age - 1.5) / 0.6);
  if (a0 <= 0) return;
  g.save(); g.strokeStyle = `rgba(220,238,255,${0.85 * a0})`; g.lineWidth = 3 * s; g.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const ang = r() * TAU; let px = x, py = y; g.beginPath(); g.moveTo(px, py); for (let j = 0; j < 4; j++) { const l = (25 + r() * 45) * s * k; px += Math.cos(ang + (r() - 0.5) * 0.7) * l; py += Math.sin(ang + (r() - 0.5) * 0.7) * l * 0.35; g.lineTo(px, py); } g.stroke(); }
  if (age < 0.6) { g.fillStyle = `rgba(230,240,255,${0.5 * (1 - age / 0.6)})`; for (let i = 0; i < 6; i++) { const ang = -Math.PI * (0.15 + 0.7 * r()), d = age * (80 + r() * 120) * s; ell(g, x + Math.cos(ang) * d, y + Math.sin(ang) * d + age * age * 300 * s, 5 * s, 5 * s); g.fill(); } }
  g.restore();
}

let SHOTS = [];
function buildShots() {
  const L = id => LN(id), w = (id, k) => WD(id, k), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  // ===== 0. character-select spinner (≤ 2.6 s) =====
  const land = ww('hook', 'frostjaw?') - 0.05;
  const kinds = ['ring', 'hay', 'pale', 'frost'];
  const target = 15; // kinds[15 % 4] = 'frost'
  const spinPos = t => target * (1 - Math.pow(1 - clamp(t / land), 3.2));
  { let last = -1; for (let t = 0; t < land; t += 1 / 120) { const p = Math.round(spinPos(t)); if (p !== last) { if (last >= 0) cue(t, 'tick', 0.5); last = p; } } cue(land, 'select', 1); cue(0.0, 'whoosh', 0.6); }
  S.push({ a: 0, b: L('lake').start - 0.1, fade: 0, draw: (g, t) => {
    const E = envAt(t); const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#05060c'); bg.addColorStop(0.5, '#141a2c'); bg.addColorStop(1, '#05060a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    sideForest(g, E, t * 30, 1600, { moon: false }); g.fillStyle = 'rgba(5,6,12,0.55)'; g.fillRect(0, 0, W, H); snowfall(g, E, 0.7, 5);
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 70px Inter'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#000';
    const tk = popK(t, 0.05, 0.4); g.translate(W / 2, 330); g.scale(tk, tk); g.strokeText('HOW DO YOU SURVIVE', 0, 0); g.fillStyle = '#fff'; g.fillText('HOW DO YOU SURVIVE', 0, 0);
    g.font = '900 52px Inter'; g.strokeText('THIS HORROR CHARACTER?', 0, 78); g.fillStyle = '#ffd23f'; g.fillText('THIS HORROR CHARACTER?', 0, 78); g.restore();
    g.save(); const pk = popK(t, 0.25, 0.35); g.translate(W / 2, 520); g.scale(pk, pk); rr(g, -130, -42, 260, 84, 22); g.fillStyle = '#c4161c'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 4', 0, 3); g.restore();
    const p = spinPos(t), cy = 900;
    for (let i = Math.floor(p) - 3; i <= Math.floor(p) + 4; i++) {
      if (i < 0) continue; const dx = (i - p) * 300, x = W / 2 + dx; if (x < -200 || x > W + 200) continue;
      const near = 1 - clamp(Math.abs(dx) / 300); const sel = t >= land && i === target;
      g.save(); g.translate(x, cy); const sc = 0.8 + near * 0.2 + (sel ? 0.12 * popK(t, land, 0.3) : 0); g.scale(sc, sc); g.globalAlpha = 0.45 + near * 0.55;
      portrait(g, kinds[i % 4], t); g.restore();
    }
    g.save(); g.translate(W / 2, cy); const sk = t >= land ? 1 + 0.12 * popK(t, land, 0.3) : 1; g.scale(sk, sk); g.strokeStyle = '#ffd23f'; g.lineWidth = 10; rr(g, -142, -182, 284, 364, 30); g.stroke();
    g.fillStyle = '#ffd23f'; poly(g, [[-26, -215], [26, -215], [0, -188]]); g.fill(); g.restore();
    if (t >= land) { const nk = popK(t, land + 0.05, 0.35); g.save(); g.translate(W / 2, 1185); g.scale(nk, nk);
      rr(g, -330, -62, 660, 124, 30); g.fillStyle = 'rgba(8,8,12,0.9)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#fff'; g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THE FROSTJAW', 0, 4); g.restore(); }
    vignette(g, 0.6);
  } });

  // ===== 1. one continuous move: you fishing → line snaps → over the ice → it crawls out → rule =====
  const sStart = L('lake').start - 0.45, snapT = ww('snap', 'snaps...') + 0.05;
  const crawl0 = ww('climb', 'something') + 0.1, crawl1 = ww('climb', 'water.') + 0.7, step1 = L('tall').start + 0.6;
  const splitT = ww('tall', 'split') + 0.05;
  const camK = [
    { t: sStart, x: 0.75, y: 1.75, z: -4.8, hy: 880 },
    { t: L('snap').start, x: 0.65, y: 1.6, z: -3.6, hy: 890 },
    { t: L('climb').start + 0.15, x: 0.7, y: 1.65, z: -3.1, hy: 890 },
    { t: crawl0 + 0.6, x: 1.6, y: 1.6, z: 36.5, hy: 910 },
    { t: L('tall').start + 0.2, x: 0.9, y: 1.55, z: 37, hy: 925 },
    { t: ww('tall', 'face'), x: 1.4, y: 2.1, z: 40.5, hy: 950 },
    { t: ww('tall', 'forehead.'), x: 1.45, y: 2.25, z: 43.4, hy: 880 },
    { t: L('rule').start + 0.35, x: 0.6, y: 0.85, z: 40.2, hy: 1030 },
    { t: L('noise').start, x: 0.6, y: 0.8, z: 40.8, hy: 1040 },
  ];
  cue(sStart + 0.2, 'wind', 0.6); cue(snapT - 0.02, 'snap', 1); cue(snapT + 0.1, 'whoosh', 0.35); cue(L('climb').start + 0.1, 'whoosh', 0.45);
  cue(crawl0, 'splash', 0.9); cue(crawl0 + 0.25, 'sting', 0.8); cue(crawl1 - 0.4, 'icecrack', 0.6); cue(ww('tall', 'eight'), 'boom', 0.55);
  cue(step1, 'crunch', 0.7); cue(step1 + 0.45, 'crunch', 0.6);
  cue(splitT, 'splitjaw', 1); cue(splitT + 0.05, 'sting', 0.7); cue(L('rule').start, 'card', 0.8); cue(ww('rule', "it's"), 'pop', 0.6); cue(ww('rule', 'hunts'), 'pop', 0.5);
  for (let k = 0; k < 3; k++) cue(L('tall').start + 1.0 + k * 0.85, 'twitch', 0.35);
  S.push({ a: sStart, b: L('noise').start - 0.03, fade: 0.45, draw: (g, t) => {
    const E = envAt(t); const c = keys(camK, t); const cam = { ...c, f: F_ROAD };
    // the creature: rises out of the far hole, steps onto the ice, stands and listens
    const rise = eout(inv(crawl0, crawl1, t)), sink = lerp(1.7, 0, rise);
    const stepK = ss(crawl1 - 0.1, step1 + 0.8, t), cx = lerp(HOLE_IT.x, HOLE_IT.x - 0.9, stepK), cz = lerp(HOLE_IT.z, HOLE_IT.z - 0.8, stepK);
    let pose = idlePose(t, { headPitch: lerp(10, 30, rise), lean: lerp(55, 20, rise) });
    if (rise < 1) { pose.armL = [lerp(125, pose.armL[0], rise), lerp(-60, pose.armL[1], rise), 20]; pose.armR = [lerp(118, pose.armR[0], rise), lerp(-55, pose.armR[1], rise), 20]; pose.curl = 50; }
    if (stepK > 0 && stepK < 1) { const wp = walkPose(stepK * TAU, 0.6, 0); pose.legL = wp.legL; pose.legR = wp.legR; }
    const split = eout(inv(splitT, splitT + 0.35, t)) * (1 - ss(L('rule').start - 0.2, L('rule').start + 0.6, t) * 0.75);
    const ex = [];
    if (t > crawl0 - 0.2) ex.push(frostSprite(cz, cx, pose, 0, { mouth: Math.max(0.05, split), sink: rise < 1 ? sink : 0, fogMul: 0.5 }));
    // water splashing out of the hole while it climbs
    if (t > crawl0 && t < crawl1 + 0.8) ex.push({ z: HOLE_IT.z - 0.05, draw: (g, cam, E) => { const p = proj(cam, HOLE_IT.x, 0, HOLE_IT.z); if (!p) return; const r = rng(5);
      for (let i = 0; i < 18; i++) { const b = crawl0 + r() * (crawl1 - crawl0), a = t - b; if (a < 0 || a > 0.7) continue; const vx = (r() - 0.5) * 2.2, vy = 1.5 + r() * 2;
        const x = p[0] + vx * a * p[2], y = p[1] - (vy * a - 4.9 * a * a) * p[2]; if (y > p[1] + 4) continue; g.fillStyle = `rgba(170,200,230,${0.8 * (1 - a / 0.7)})`; ell(g, x, y, 0.035 * p[2], 0.05 * p[2]); g.fill(); } } });
    // you, the rod and the line
    const snapK = t - snapT;
    ex.push({ z: 0.0, draw: (g, cam, E) => { const p = proj(cam, 0, 0, 0); if (!p || p[3] < 1.0) return; g.save(); g.globalAlpha = ss(1.0, 2.6, p[3]);
      const tipBend = snapK < 0 ? lerp(0, 1, ss(L('snap').start - 0.2, snapT, t)) : Math.max(0, Math.exp(-snapK * 5) * Math.cos(snapK * 30)) * -0.6;
      const hand = proj(cam, 0.12, 0.72, 0.42), tip = proj(cam, 0.45, lerp(1.05, 0.72, tipBend), lerp(1.0, 1.08, tipBend)), hole = proj(cam, HOLE_YOU.x, 0, HOLE_YOU.z);
      // rod (behind the body from this view)
      g.strokeStyle = '#111318'; g.lineWidth = Math.max(2, p[2] * 0.022); g.beginPath(); g.moveTo(hand[0], hand[1]); g.quadraticCurveTo(lerp(hand[0], tip[0], 0.6), lerp(hand[1], tip[1], 0.4) - p[2] * 0.03 * (1 - tipBend), tip[0], tip[1]); g.stroke();
      g.strokeStyle = 'rgba(230,236,245,0.85)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(tip[0], tip[1]);
      if (snapK < 0) g.lineTo(hole[0], hole[1] + 2); else { const k = clamp(snapK / 0.5); g.quadraticCurveTo(tip[0] + p[2] * 0.4 * k, tip[1] - p[2] * 0.25 * k + p[2] * 0.4 * k * k, tip[0] + p[2] * 0.15, tip[1] + p[2] * lerp(0.3, 0.75, k)); }
      g.stroke();
      if (snapK < 0 && snapK > -1.0) { g.strokeStyle = `rgba(150,180,220,${0.5 * (1 + snapK)})`; g.lineWidth = 2; for (let i = 0; i < 2; i++) { const k = (t * 1.6 + i * 0.5) % 1; ell(g, hole[0], hole[1] + 2, k * p[2] * 0.3, k * p[2] * 0.06); g.stroke(); } }
      drawRig(g, YOU, sitPose(t, { headPitch: snapK > 0 ? -10 * ss(0, 0.4, snapK) : 0, tremble: snapK > 0 ? 1 : 0 }), p[0], p[1], p[2], 148, { t, expr: 'scared' });
      g.restore(); } });
    // height guide: 8 FT + you for scale
    const tH = ww('tall', 'eight'), out = 1 - ss(ww('tall', 'its') - 0.2, ww('tall', 'its') + 0.15, t);
    if (t > tH - 0.05 && out > 0) ex.push({ z: cz - 0.3, draw: (g, cam, E) => {
      const a = proj(cam, cx + 1.25, 0, cz), b = proj(cam, cx + 1.25, 2.44, cz), hm = proj(cam, cx - 1.3, 0, cz); if (!a || !b) return;
      const k = eout(inv(tH, tH + 0.5, t));
      g.save(); g.globalAlpha = out; g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[0], lerp(a[1], b[1], k)); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(a[0] - 20, a[1]); g.lineTo(a[0] + 20, a[1]); g.moveTo(b[0] - 20, lerp(a[1], b[1], k)); g.lineTo(b[0] + 20, lerp(a[1], b[1], k)); g.stroke();
      if (k > 0.9) { const lk = popK(t, tH + 0.4, 0.3); g.translate(a[0] + 36, lerp(a[1], b[1], 0.55)); g.scale(lk, lk); rr(g, 0, -40, 170, 80, 18); g.fillStyle = 'rgba(8,8,12,0.85)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#ffd23f'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('8 FT', 85, 3); }
      g.restore();
      const hk = ss(ww('tall', 'feet'), ww('tall', 'feet') + 0.4, t) * out;
      if (hk > 0 && hm) { g.save(); g.globalAlpha = hk * 0.8; g.setLineDash([10, 8]); g.strokeStyle = '#9fd0ff'; g.lineWidth = 4; const s = hm[2], x = hm[0], y = hm[1];
        g.beginPath(); g.ellipse(x, y - 1.66 * s, 0.11 * s, 0.13 * s, 0, 0, TAU); g.moveTo(x - 0.2 * s, y - 1.42 * s); g.lineTo(x + 0.2 * s, y - 1.42 * s); g.lineTo(x + 0.17 * s, y - 0.9 * s); g.lineTo(x + 0.12 * s, y); g.lineTo(x - 0.12 * s, y); g.lineTo(x - 0.17 * s, y - 0.9 * s); g.closePath(); g.stroke();
        g.setLineDash([]); g.fillStyle = '#9fd0ff'; g.font = '900 36px Inter'; g.textAlign = 'center'; g.fillText('YOU', x, y - 1.95 * s); g.restore(); }
    } });
    lakeScene(g, cam, E, ex, { gear: { lantern: 1 }, ripple: t > crawl1 ? 1 - inv(crawl1, crawl1 + 3, t) : 0 });
    // the face splitting: red flash
    if (t > splitT && t < splitT + 1) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, 800, 900, [110, 10, 15], 0.22 * (1 - inv(splitT, splitT + 1, t))); g.restore(); }
    vignette(g, 0.55);
    ruleCard(g, t, L('rule').start, L('noise').start - 0.12, 1, ["IT'S BLIND.", 'HUNTS BY SOUND'], ww('rule', "it's"), (g2, tt) => {
      g2.translate(-30, 0); g2.scale(0.85, 0.85); g2.strokeStyle = '#fff'; g2.lineWidth = 9; g2.lineCap = 'round'; g2.beginPath(); g2.arc(-10, -6, 40, Math.PI * 0.85, Math.PI * 2.2); g2.quadraticCurveTo(28, 30, 0, 46); g2.stroke();
      g2.beginPath(); g2.arc(-8, -4, 16, Math.PI, Math.PI * 2.1); g2.stroke();
      for (let i = 0; i < 3; i++) { const a = ((tt * 1.4 + i / 3) % 1); g2.globalAlpha = 1 - a; g2.lineWidth = 7; g2.beginPath(); g2.arc(40, 0, 26 + a * 34, -0.6, 0.6); g2.stroke(); } g2.globalAlpha = 1;
    });
  } });

  // ===== 2. close-up: one noise and it finds you =====
  const nA = L('noise').start - 0.03, nB = L('turn').start - 0.08, noiseT = ww('noise', 'noise...') + 0.1, findT = ww('finds', 'finds');
  cue(nA, 'hit', 0.9); cue(noiseT, 'icecrack', 0.8); cue(findT - 0.05, 'splitjaw', 1); cue(findT, 'scream', 1.0);
  S.push({ a: nA, b: nB, fade: 0, draw: (g, t) => {
    const E = envAt(t); const bg = g.createRadialGradient(W / 2, 800, 100, W / 2, 900, 1200); bg.addColorStop(0, '#26324a'); bg.addColorStop(1, '#04050a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    sideForest(g, E, 60, 1500, { moon: false }); g.fillStyle = 'rgba(26,36,56,0.55)'; g.fillRect(0, 0, W, H); fogBands(g, { hy: 1300 }, E, 0.8);
    const op = eout(inv(findT - 0.05, findT + 0.3, t)), snapHead = ss(noiseT, noiseT + 0.12, t);
    const z = 1 + 0.08 * eout(inv(findT - 0.05, findT + 0.3, t)) + 0.02 * inv(nA, findT, t);
    g.save(); g.translate(W / 2, 760); g.scale(z, z); g.translate(-W / 2, -760);
    frostFaceBig(g, W / 2 + snapHead * 30, 650, 290, { t, open: lerp(0.0, 1.0, op), jitter: 0.4 + op * 1.4, tilt: lerp(-4, 14, snapHead) * (1 - op) + noise(t * 2) * 3, breath: 1 });
    g.restore();
    soundRings(g, W * 0.82, 1250, t, noiseT, 1.2);
    if (t > findT) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, 900, 900, [120, 10, 10], 0.28 * (1 - inv(findT, findT + 1.2, t))); g.restore(); }
    snowfall(g, E, 0.8, 9); vignette(g, 0.7);
  } });

  // ===== 3. POV from your seat: its head turns toward you =====
  const pA = L('turn').start - 0.08, pB = L('run').start - 0.1, headT = ww('turn', 'head'), youT = ww('turn', 'you.');
  cue(pA, 'heartbeat', 0.55); cue(headT + 0.1, 'bonecrack', 0.6); cue(youT - 0.1, 'sting', 0.5);
  footCues(youT - 0.3, pB, t => (t - (youT - 0.3)) / 0.55 * Math.PI, 'crunch', 0.55);
  S.push({ a: pA, b: pB, fade: 0.3, draw: (g, t) => {
    const E = envAt(t); const cam = { x: 0.15, y: 1.15, z: -0.25 + inv(pA, pB, t) * 0.1, hy: 905, f: F_ROAD };
    const turn = eio(inv(headT, youT + 0.1, t)), walk = Math.max(0, t - (youT - 0.3));
    const z = 8.5 - walk * 1.2, pose = idlePose(t, { headPitch: 26, twitchy: 0.4 });
    if (walk > 0) { const wp = walkPose(walk / 0.55 * Math.PI, 0.7, 0); pose.legL = wp.legL; pose.legR = wp.legR; pose.bob = wp.bob; }
    lakeScene(g, cam, E, [frostSprite(z, 1.4, pose, lerp(80, 0, turn), { mouth: 0.08 + 0.12 * turn, fogMul: 0.45 })], { gear: { lantern: 1, bucket: false }, skipHole: h => h === HOLE_YOU });
    // your hands on the rod, trembling; your breath in the cold
    const tr = 6, hx = 610 + noise(t * 18) * tr, hy = 1620 + noise(t * 16 + 2) * tr;
    g.strokeStyle = '#111318'; g.lineWidth = 16; g.beginPath(); g.moveTo(hx - 40, hy + 60); g.lineTo(hx + 260, hy - 520); g.stroke(); g.strokeStyle = '#3c4150'; g.lineWidth = 5; g.beginPath(); g.moveTo(hx - 30, hy + 40); g.lineTo(hx + 250, hy - 500); g.stroke();
    g.strokeStyle = 'rgba(230,236,245,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx + 260, hy - 520); g.quadraticCurveTo(hx + 320, hy - 300, hx + 300, hy - 60); g.stroke();
    glove(g, hx - 60, hy + 20, 1.05, -0.25, { fist: true }); glove(g, hx + 90, hy - 90, 0.95, -0.4, { fist: true });
    for (let i = 0; i < 3; i++) { const b = pA + i * 0.75, a = t - b; if (a < 0 || a > 1) continue; g.fillStyle = `rgba(225,235,248,${0.28 * (1 - a)})`; ell(g, 520 + a * 60, 1250 - a * 140, 60 + a * 120, 40 + a * 70); g.fill(); }
    vignette(g, 0.55);
  } });

  // ===== 4. what-if 1: run for the cabin? (grey) =====
  const oA = L('run').start - 0.1, oB = L('call').start - 0.15, iceT = ww('run', 'ice'), grabT = ww('run', 'every') + 0.05, stepT = ww('run', 'step.');
  const runV = 4.6, rsc = 330, rground = 1330, strikes = [];
  { const ph = t => (t - oA) * runV / 2.7 * TAU; let last = null; for (let t = oA; t < grabT; t += 1 / 120) { const n = Math.floor(ph(t) / Math.PI + 0.5); if (last != null && n !== last) { strikes.push(t); cue(t, 'icecrack', 0.55); } last = n; } }
  cue(L('run').start, 'card', 0.7); cue(ww('run', 'no.'), 'buzz', 0.7); cue(iceT - 0.1, 'whoosh', 0.5); cue(grabT, 'grab', 0.9); cue(stepT, 'xstamp', 1);
  S.push({ a: oA, b: oB, fade: 0.3, draw: (g0, t) => {
    const E = envAt(t); const SC = scratch(); let g = SC.g; g.clearRect(0, 0, W, H);
    const dist = (t - oA) * runV, scroll = dist * rsc;
    sideIce(g, E, scroll, 1040, {});
    // the cabin, far away on the right — too far
    g.save(); const cbx = 900 - (t - oA) * 6; g.fillStyle = '#121012'; poly(g, [[cbx - 90, 1032], [cbx + 90, 1032], [cbx + 90, 975], [cbx, 935], [cbx - 90, 975]]); g.fill(); g.fillStyle = '#ffb35a'; g.fillRect(cbx - 50, 990, 22, 18); g.fillRect(cbx + 30, 990, 22, 18); g.globalCompositeOperation = 'lighter'; glow(g, cbx, 1000, 90, [255, 170, 80], 0.3); g.restore();
    // cracks under each footstep (stay on the ice as it scrolls away)
    const rx = 640;
    strikes.forEach((s, i) => { if (t < s) return; const x = rx + (i % 2 ? 18 : -18) - ((t - s) * runV * rsc); iceCrackBurst(g, x, rground + 6, 1.3, t - s, 31 + i); if (t - s < 0.9) { g.save(); soundRings(g, x, rground, t, s, 0.55); g.restore(); } });
    const caught = ss(grabT, grabT + 0.25, t);
    const rp = walkPose(dist / 2.7 * TAU, 1, 1); rp.lean = lerp(20, 40, caught); rp.headPitch = -10;
    const cxk = eio(inv(iceT - 0.1, grabT + 0.1, t)), cx = lerp(-700, rx - 470, cxk);
    const cp = walkPose(dist * 1.3 / STRIDE_RUN * TAU, 1, 0.7); cp.lean = 35; cp.headPitch = -15; cp.curl = 30;
    const reach = ss(grabT - 0.25, grabT + 0.05, t); cp.armR = [lerp(cp.armR[0], 100, reach), lerp(cp.armR[1], 0, reach), 0]; cp.armL = [lerp(cp.armL[0], 80, reach), lerp(cp.armL[1], 10, reach), 0];
    g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, rx, rground, 120, 16); g.fill(); ell(g, cx, rground, 170, 18); g.fill();
    drawRig(g, YOU, rp, rx + caught * 40, rground, rsc, 90, { t, expr: 'scared' });
    if (t > iceT - 0.2) drawRig(g, FROST, cp, cx, rground, rsc, 90, { t, twitch: 1, mouth: 0.6 + 0.4 * reach });
    snowfall(g, E, 0.7, 4, -60); vignette(g, 0.55);
    g0.save(); g0.filter = 'grayscale(1) contrast(1.15)'; g0.drawImage(SC.c, 0, 0); g0.restore(); g = g0;
    chip(g, t, L('run').start, oB - 0.15, 'RUN FOR THE CABIN?', '#ff3b2f', 250, g2 => iconX(g2, 24));
    bigX(g, t, stepT, W / 2, 800, 230);
  } });

  // ===== 5. what-if 2: call for help? the phone buzzes (grey) =====
  const cA = L('call').start - 0.15, cB = L('works').start - 0.15, buzzT = ww('call', 'buzzes,') - 0.05, hearsT = ww('call', 'hears'), tooT = ww('call', 'too.');
  cue(L('call').start, 'card', 0.7); cue(buzzT, 'phonebuzz', 1); cue(hearsT - 0.15, 'bonecrack', 0.7); cue(hearsT, 'screech', 0.8); cue(tooT - 0.05, 'impact', 0.9); cue(tooT, 'xstamp', 1);
  footCues(hearsT, tooT, t => (t - hearsT) / 0.16 * Math.PI, 'crunch', 0.6);
  S.push({ a: cA, b: cB, fade: 0.3, draw: (g0, t) => {
    const E = envAt(t); const SC = scratch(); const g = SC.g; g.clearRect(0, 0, W, H);
    const cam = { x: 0.35, y: 1.05, z: -0.6, hy: 930, f: F_ROAD };
    const runK = inv(hearsT, tooT - 0.02, t), z = lerp(19, 1.6, Math.pow(runK, 0.85)), snap = ss(buzzT + 0.2, hearsT - 0.05, t);
    let pose = idlePose(t, { headPitch: 25, twitchy: 0.4 });
    if (runK > 0) { pose = walkPose((19 - z) / STRIDE_RUN * TAU, 1, 1); pose.lean += 6; pose.headPitch = 0; const lg = ss(tooT - 0.35, tooT, t); pose.armL = [lerp(pose.armL[0], 140, lg), lerp(pose.armL[1], 10, lg), 25]; pose.armR = [lerp(pose.armR[0], 140, lg), lerp(pose.armR[1], 10, lg), 25]; pose.curl = 35; }
    lakeScene(g, cam, E, [frostSprite(z, lerp(-2.4, 0.1, runK), pose, lerp(90, 0, snap), { mouth: runK > 0 ? 1 : 0.1, fogMul: 0.45, lit: runK })], { gear: { lantern: 1, bucket: false }, skipHole: h => h === HOLE_YOU });
    // the phone in your glove
    const up = eout(inv(cA, L('call').start + 0.6, t)), on = ss(buzzT - 0.05, buzzT + 0.05, t), vib = t > buzzT ? Math.sin(t * 90) * 7 * on : 0;
    const px = 760 + vib, py = lerp(2300, 1180, up);
    phone(g, px, py, 1.15, -0.12, on, t); glove(g, px + 40, py + 210, 1.0, -0.2, { fist: true });
    if (on > 0) soundRings(g, px, py, t, buzzT, 1.3, [190, 220, 255], 0.9, 4);
    const kick = t > tooT - 0.05 && t < tooT + 0.3 ? 1 - inv(tooT - 0.05, tooT + 0.3, t) : 0;
    vignette(g, 0.55);
    g0.save(); g0.filter = 'grayscale(1) contrast(1.15)'; g0.translate(noise(t * 40) * 16 * kick, noise(t * 37 + 2) * 12 * kick); g0.drawImage(SC.c, 0, 0); g0.restore();
    chip(g0, t, L('call').start, cB - 0.15, 'CALL FOR HELP?', '#ff3b2f', 250, g2 => iconX(g2, 24));
    bigX(g0, t, tooT, W / 2, 800, 230);
  } });

  // ===== 6. here's what works: phone off, lie flat, breathe into your sleeve =====
  const hA = L('works').start - 0.15, hB = L('feet').start - 0.2, offT = ww('works', 'off,'), lieT = ww('works', 'lie'), brT = ww('works', 'breathe');
  cue(L('works').start, 'good', 0.8); cue(offT, 'click', 1); cue(ww('works', 'phone'), 'pop', 0.5); cue(lieT, 'pop', 0.5); cue(lieT + 0.05, 'slide', 0.7); cue(brT, 'pop', 0.5); cue(brT + 0.1, 'cloth', 0.7);
  S.push({ a: hA, b: hB, fade: 0.35, draw: (g, t) => {
    const E = envAt(t); const ck = inv(hA, hB, t); const cam = { x: lerp(-0.4, -0.15, ck), y: lerp(1.05, 0.7, eio(ck)), z: lerp(-3.9, -3.1, ck), hy: lerp(960, 1010, ck), f: F_ROAD };
    const lk = eio(inv(lieT - 0.05, lieT + 0.75, t)), sl = eio(inv(brT - 0.1, brT + 0.45, t)), phoneOn = 1 - ss(offT, offT + 0.12, t);
    const you = { z: 0.05, draw: (g, cam, E) => { const p = proj(cam, 0, 0, 0); const s = p[2];
      const px = p[0] + lerp(0, -0.25, lk) * s, py = p[1] - lerp(0.44, 0.14, lk) * s;
      drawYouRot(g, px, py, s, lieK(lk, t, { sleeve: sl }), lk * Math.PI / 2, -90, { t, expr: lk > 0.5 ? 'closed' : 'scared' });
      // phone screen in the hand (glow until switched off)
      if (phoneOn > 0) { const hx = px - 0.42 * s, hy = py - 0.22 * s; g.fillStyle = rgb([150, 190, 255], phoneOn); rr(g, hx - 0.04 * s, hy - 0.07 * s, 0.08 * s, 0.13 * s, 0.01 * s); g.fill(); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, hx, hy, 0.6 * s, [120, 170, 255], 0.4 * phoneOn); g.restore(); }
      // breath clouds: big before, tiny and muffled after the sleeve
      for (let i = 0; i < 4; i++) { const b = hA + i * 0.95, a = t - b; if (a < 0 || a > 1.1) continue; const muff = b > brT ? 0.25 : 1; const hx = px + lerp(-0.08, 0.95, lk) * s, hy = py - lerp(0.95, 0.25, lk) * s;
        g.fillStyle = `rgba(225,235,248,${0.3 * muff * (1 - a / 1.1)})`; ell(g, hx - a * 0.25 * s * (1 - lk), hy - a * 0.3 * s, (0.08 + a * 0.2) * s * muff, (0.06 + a * 0.14) * s * muff); g.fill(); }
    } };
    lakeScene(g, cam, E, [you], { gear: { lantern: 1 } });
    vignette(g, 0.6);
    chip(g, t, L('works').start, hB - 0.1, "HERE'S WHAT WORKS", '#3ee07a', 250, g2 => iconCheck(g2, 24));
    checklist(g, t, [{ text: 'PHONE OFF', at: ww('works', 'phone') }, { text: 'LIE FLAT', at: lieT }, { text: 'BREATHE IN SLEEVE', at: brT }]);
  } });

  // ===== 7. ice level: its feet crunch across the ice, right next to your head =====
  const fA = L('feet').start - 0.2, fB = L('jaw').start - 0.15, stopF = ww('feet', 'head.') - 0.1;
  const fzC = 2.1, fxT = t => lerp(-1.9, 1.1, inv(fA - 0.2, stopF, Math.min(t, stopF)));
  const fph = t => (fxT(t) + 1.9) / STRIDE(0.6) * TAU;
  const fsteps = []; { let last = null; for (let t = fA; t < stopF + 0.05; t += 1 / 120) { const n = Math.floor(fph(t) / Math.PI + 0.5); if (last != null && n !== last) { fsteps.push({ t, x: fxT(t) + (n % 2 ? 0.12 : -0.12) }); cue(t, 'crunch', 0.95); } last = n; } }
  cue(fA, 'heartbeat', 0.7); cue(stopF + 0.25, 'sting', 0.55);
  S.push({ a: fA, b: fB, fade: 0.4, draw: (g, t) => {
    const E = envAt(t); const cam = { x: 0.5, y: 0.3, z: -1.4 + inv(fA, fB, t) * 0.15, hy: 1450, f: F_ROAD };
    const x = fxT(t), walking = t < stopF, settle = ss(stopF, stopF + 0.6, t);
    let pose = walkPose(fph(t), 0.6, 0); pose.lean = 18; pose.headPitch = 30; pose.curl = 25;
    const ip = idlePose(t, { headPitch: 40, lean: 30 });
    if (!walking) { for (const k of ['legL', 'legR', 'armL', 'armR']) pose[k] = pose[k].map((v, i) => lerp(v, ip[k][i], settle)); pose.bob = lerp(pose.bob, ip.bob, settle); pose.lean = lerp(18, 45, settle); pose.headPitch = lerp(30, 55, settle); pose.headRoll = ip.headRoll; }
    const ex = [frostSprite(fzC, x, pose, lerp(90, -35, settle), { mouth: 0.08 + 0.2 * settle, fogMul: 0.3 })];
    // cracks + snow puffs where its feet land
    ex.push({ z: fzC + 0.01, draw: (g, cam, E) => { fsteps.forEach((f, i) => { if (t < f.t) return; const p = proj(cam, f.x, 0, fzC + (i % 2 ? 0.1 : -0.1)); iceCrackBurst(g, p[0], p[1], 1.4, t - f.t, 77 + i); }); } });
    // you lying on the ice in the foreground, head on the right, sleeve over your mouth
    ex.push({ z: 0.9, draw: (g, cam, E) => { const p = proj(cam, -0.55, 0, 0.9), s = p[2]; drawYouRot(g, p[0], p[1] - 0.14 * s, s, lieK(1, t, { sleeve: 1 }), Math.PI / 2, -90, { t, expr: 'closed' }); } });
    lakeScene(g, cam, E, ex, { gear: { lantern: 0.6, bucket: false, props: false }, skipHole: h => h === HOLE_YOU });
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, W, H); vignette(g, 0.65);
  } });

  // ===== 8. its jaw opens inches above your face — don't move, don't breathe =====
  const jA = L('jaw').start - 0.15, jB = L('throw').start - 0.15, openT = ww('jaw', 'opens,'), faceT = ww('jaw', 'face.'), brStop = ww('still', 'breathe.');
  const dropT0 = openT + 0.6, dropT1 = faceT + 0.05;
  cue(jA, 'creak', 0.5); cue(openT - 0.05, 'splitjaw', 1); cue(openT, 'sting', 0.7); cue(dropT1, 'drip', 1); cue(L('still').start - 0.1, 'heartbeat', 0.9); cue(brStop - 0.1, 'breathstop', 0.6); cue(ww('still', 'move.'), 'twitch', 0.5);
  S.push({ a: jA, b: jB, fade: 0.35, draw: (g, t) => {
    const E = envAt(t); g.fillStyle = '#05070d'; g.fillRect(0, 0, W, H);
    drawSky(g, { x: 0, hy: 1500 }, E); g.fillStyle = 'rgba(5,8,16,0.45)'; g.fillRect(0, 0, W, H); drawBats(g, { hy: 1500 }, E);
    // the head comes down upside-down from above
    const dn = eout(inv(jA, openT - 0.1, t)), fy = lerp(-420, 640, dn) + Math.sin(t * 1.3) * 10;
    const op = eout(inv(openT, openT + 0.45, t)) * (1 - 0.6 * ss(jB - 0.9, jB, t));
    g.save(); g.translate(W / 2 + 40, fy); g.rotate(Math.PI + (noise(t * 1.6) * 6 + (t > L('still').start ? noise(t * 3.1) * 6 : 0)) * D2R);
    frostFaceBig(g, 0, 0, 270, { t, open: op * 0.9, jitter: 0.25, breath: 0 });
    g.restore();
    // cold breath pouring down from the split
    const br = 0.5 + 0.5 * Math.sin(t * 2.2); { const bx = W / 2 + 40, by = fy + 420 + br * 40, gr = g.createRadialGradient(bx, by, 0, bx, by, 260); gr.addColorStop(0, `rgba(215,228,245,${(0.16 + 0.08 * br) * op})`); gr.addColorStop(1, 'rgba(215,228,245,0)'); g.fillStyle = gr; g.save(); g.translate(bx, by); g.scale(1, 0.55); g.translate(-bx, -by); g.fillRect(bx - 260, by - 260, 520, 520); g.restore(); }
    // a drop of icy drool falls onto your cheek
    if (t > dropT0 - 0.4) { const k = inv(dropT0, dropT1, t), dx = W / 2 + 60, dy0 = fy + 150, dy1 = 1480; const y = t < dropT0 ? dy0 + (t - dropT0 + 0.4) * 60 : lerp(dy0 + 24, dy1, k * k);
      if (t < dropT1) { g.strokeStyle = 'rgba(200,220,240,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(dx, dy0); g.lineTo(dx, Math.min(y, dy0 + 60)); g.stroke(); g.fillStyle = 'rgba(210,230,250,0.9)'; ell(g, dx, y, 9, 13); g.fill(); }
      else { const a = t - dropT1; g.fillStyle = `rgba(210,230,250,${0.8 * (1 - clamp(a / 1.5))})`; ell(g, dx, dy1 + a * 30, 14, 10); g.fill(); } }
    // you: eyes shut, sleeve over the mouth, trembling
    const flinch = t > dropT1 ? Math.exp(-(t - dropT1) * 4) : 0;
    youFaceBig(g, 470, 1650 + flinch * 12, 270, { t, tremble: 0.6 + flinch * 2, sleeve: 1 });
    for (let i = 0; i < 6; i++) { const b = jA + i * 0.6, a = t - b; if (b > brStop - 0.1 || a < 0 || a > 0.8) continue; g.fillStyle = `rgba(225,235,248,${0.18 * (1 - a / 0.8)})`; ell(g, 690 + a * 60, 1700 - a * 70, 20 + a * 40, 14 + a * 26); g.fill(); }
    snowfall(g, E, 0.6, 13); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, W, H); vignette(g, 0.7);
  } });

  // ===== 9. throw the ice pick → it chases the sound, you crawl to shore (one continuous move) =====
  const tA = L('throw').start - 0.15, tB = L('dawn').start - 0.35, throwT = ww('throw', 'throw'), relT = ww('throw', 'ice') + 0.02, landT = ww('throw', 'lake.') + 0.05, runT = landT + 0.35, crawlT = ww('chase', 'crawl') - 0.15;
  const pick0 = [1.05, 0.55, 0.3], pick1 = [6.5, 0, 38];
  cue(throwT, 'swing', 0.8); cue(relT, 'whoosh', 0.6); cue(landT, 'clink', 1); cue(landT + 0.08, 'icecrack', 0.5); cue(landT + 0.2, 'bonecrack', 0.6); cue(runT, 'screech', 0.6); cue(crawlT, 'slide', 0.6); cue(crawlT + 0.7, 'slide', 0.5);
  footCues(runT, tB, t => (t - runT) * 9 / STRIDE_RUN * TAU, 'crunch', 0.45);
  S.push({ a: tA, b: tB, fade: 0.35, draw: (g, t) => {
    const E = envAt(t); const cam = keys([{ t: tA, x: 0.4, y: 0.8, z: -2.1, hy: 1060 }, { t: runT, x: 0.45, y: 0.85, z: -2.3, hy: 1050 }, { t: crawlT - 0.2, x: 0.4, y: 2.4, z: -5.5, hy: 1000 }, { t: tB, x: 0.2, y: 3.0, z: -7.0, hy: 990 }], t); cam.f = F_ROAD;
    const ex = [];
    // the creature next to you: listening; snaps toward the sound, then runs off after it
    const turn = ss(landT + 0.1, runT + 0.15, t), run = Math.max(0, t - runT);
    const cz = 2.6 + run * run * 1.6 + run * 4.5, cxx = lerp(-0.6, -0.6 + (pick1[0] + 0.6) * 0.9, clamp((cz - 2.6) / (pick1[2] - 2.6)));
    let pose = idlePose(t, { headPitch: 45, lean: 35, twitchy: 0.6 });
    if (run > 0) { pose = walkPose((cz - 2.6) / STRIDE_RUN * TAU, 1, 1); pose.lean += 8; pose.curl = 30; }
    ex.push(frostSprite(cz, cxx, pose, lerp(110, 180, turn), { mouth: 0.15, fogMul: 0.45 }));
    // you: lying, then belly-crawling toward the shore
    const ck = Math.max(0, t - crawlT);
    ex.push({ z: 0.4, draw: (g, cam, E) => { const p = proj(cam, 0.45 - ck * 0.35, 0, 0.4 + ck * 0.1); if (!p || p[3] < 0.3) return; const s = p[2];
      if (t < crawlT) { const armUp = ss(throwT - 0.25, throwT, t) * (1 - ss(relT, relT + 0.3, t)); drawYouRot(g, p[0], p[1] - 0.14 * s, s, lieK(1, t, { sleeve: 1 - armUp }), Math.PI / 2, -90, { t, expr: 'closed' }); }
      else { const k = ss(crawlT, crawlT + 0.4, t); drawYouRot(g, p[0], p[1] - 0.14 * s, s, crawlPose(ck * 5), lerp(Math.PI / 2, -Math.PI / 2, 0) * (1 - k) + (-Math.PI / 2) * k, -90, { t, expr: 'scared' }); } } });
    // the thrown arm (close to the lens) and the flying ice pick
    if (t > relT) ex.push({ z: 30, draw: (g, cam, E) => { const k = clamp((t - relT) / (landT - relT)), x = lerp(pick0[0], pick1[0], k), z = lerp(pick0[2], pick1[2], Math.pow(k, 0.8)), y = lerp(pick0[1], 0, k) + Math.sin(k * Math.PI) * 5.5;
      if (k >= 1) { const p = proj(cam, pick1[0], 0, pick1[2]); if (!p) return; g.save(); g.translate(p[0], p[1]); g.rotate(0.3); g.fillStyle = '#c23b2b'; g.fillRect(-0.15 * p[2], -0.03 * p[2], 0.3 * p[2], 0.06 * p[2]); g.restore(); soundRings(g, p[0], p[1], t, landT, 0.7); iceCrackBurst(g, p[0], p[1], 0.6, t - landT, 5); return; }
      const p = proj(cam, x, y, z); if (!p) return; const s = Math.max(p[2], 40); g.save(); g.translate(p[0], p[1]); g.rotate(t * 16);
      g.strokeStyle = '#c23b2b'; g.lineWidth = s * 0.05; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -s * 0.18); g.lineTo(0, s * 0.18); g.stroke(); g.strokeStyle = '#c9cfd8'; g.lineWidth = s * 0.035; g.beginPath(); g.moveTo(-s * 0.14, -s * 0.18); g.quadraticCurveTo(0, -s * 0.24, s * 0.14, -s * 0.18); g.stroke(); g.restore(); } });
    lakeScene(g, cam, E, ex, { gear: { lantern: 0.6, bucket: true, props: false } });
    // your arm swinging up out of frame
    if (t > throwT - 0.35 && t < relT + 0.45) { const k = eio(inv(throwT - 0.35, relT, t)), out = 1 - ss(relT + 0.05, relT + 0.45, t); g.save(); g.globalAlpha = out; glove(g, lerp(820, 640, k), lerp(2050, 1250, k) + (1 - out) * 500, 1.2, lerp(0.6, -0.5, k), { fist: k < 0.95 }); g.restore(); }
    vignette(g, 0.55);
  } });

  // ===== 10. dawn: it slides back under the ice → follow for part 5 =====
  const dA = tB, slideT = ww('dawn', 'slides'), iceGone = ww('dawn', 'ice.') + 0.3, end = T.duration;
  const ctaT = L('cta').start, fol = ww('cta', 'follow,'), five = ww('cta', 'five'), surv = ww('cta', 'survived?');
  const TEASE = { x: -1.0, z: 40.5, r: 0.7 };
  cue(L('dawn').start - 0.5, 'birds', 0.8); cue(slideT + 0.1, 'splash', 0.6); cue(ctaT, 'card', 0.7); cue(surv + 0.3, 'like', 0.9); cue(fol, 'follow', 1.0); cue(end - 1.15, 'icecrack', 0.9); cue(end - 1.05, 'sting', 0.8);
  S.push({ a: dA, b: end + 0.1, fade: 0.3, draw: (g, t) => {
    const back_ = ss(end - 1.2, end - 0.5, t);
    const dawn = 0.8 * ss(dA - 0.3, L('dawn').start + 1.5, t) * (1 - 0.8 * back_);
    const E = envAt(t, dawn);
    const cam = keys([{ t: dA, x: 1.6, y: 1.7, z: 35.2, hy: 930 }, { t: ctaT, x: 1.2, y: 1.8, z: 33.5, hy: 960 }, { t: end, x: 0.6, y: 2.1, z: 33.0, hy: 990 }], t); cam.f = F_ROAD;
    const sinkK = eio(inv(slideT - 0.1, iceGone, t));
    const ex = [];
    if (sinkK < 1) ex.push(frostSprite(HOLE_IT.z, HOLE_IT.x, idlePose(t, { headPitch: 20 }), 180, { sink: sinkK * 2.9, fogMul: 0.35 }));
    // you, safe on the shore by the trees, watching
    ex.push(youSprite(58, -5, { legL: [0, 4], legR: [3, 5], footL: 0, footR: 0, armL: [10, 30, 10], armR: [5, 40, 10], lean: 5, headPitch: 0, bob: 0, roll: 0 }, 70, { expr: 'scared' }));
    // the teaser: a pale hand reaches out of the hole right in front of the camera
    if (back_ > 0) ex.push(frostSprite(TEASE.z, TEASE.x, { ...idlePose(t, { headPitch: -10 }), armR: [165, -10, 15], armL: [150, 10, 15], curl: 40 }, 0, { sink: lerp(3.2, 1.6, eout(back_)), hole: TEASE, mouth: 0.5, fogMul: 0.2 }));
    if (back_ > 0) ex.push({ z: TEASE.z + 0.02, draw: (g, cam, E) => { g.save(); g.globalAlpha = ss(0, 0.3, back_); drawHole(g, cam, E, TEASE, { ripple: 1 }); g.restore(); } });
    lakeScene(g, cam, E, ex, { gear: { lantern: 0 }, ripple: t > slideT ? 1 - inv(iceGone, iceGone + 2, t) : 0 });
    vignette(g, 0.45);
    if (t > ctaT - 0.05) {
      bigWord(g, t, ctaT, end + 1, 'WOULD YOU HAVE', '#ffffff', 300, 84); bigWord(g, t, surv, end + 1, 'SURVIVED?', '#ffd23f', 400, 104);
      if (t > surv + 0.3) { const k = popK(t, surv + 0.3, 0.35); g.save(); g.translate(W / 2 - 170, 600); g.scale(k, k); g.fillStyle = '#ff2f55'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-90, -30, -50, -100, 0, -55); g.bezierCurveTo(50, -100, 90, -30, 0, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.restore(); }
      if (t > fol) { const k = popK(t, fol, 0.35); g.save(); g.translate(W / 2 + 90, 590); g.scale(k, k); rr(g, -170, -55, 340, 110, 30); g.fillStyle = '#fe2c55'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ FOLLOW', 0, 3); g.restore(); }
      if (t > five - 0.05) { const k = popK(t, five - 0.05, 0.4); g.save(); g.translate(W / 2, 760); g.scale(k, k); rr(g, -190, -48, 380, 96, 24); g.fillStyle = 'rgba(8,8,12,0.88)'; g.fill(); g.strokeStyle = '#c4161c'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 5 SOON', 0, 3); g.restore(); }
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

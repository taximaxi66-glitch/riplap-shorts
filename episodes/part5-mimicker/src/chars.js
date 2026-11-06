// ---------- jointed 3D-ish rig, projected with a yaw (front / side / 3-4 views) ----------
const STRETCHER = { hipY: 1.44, hipW: 0.12, thigh: 0.72, shin: 0.7, foot: 0.26, spine: 0.84, shW: 0.23, upper: 0.62, fore: 0.6, hand: 0.34, neck: 0.16, headH: 0.34, headW: 0.17,
  skin: '#cdc2b0', shade: '#9a8e7d', ink: '#141218', limbW: 0.088, kind: 'stretcher' };
const HUMAN = { hipY: 0.94, hipW: 0.1, thigh: 0.44, shin: 0.44, foot: 0.24, spine: 0.55, shW: 0.2, upper: 0.3, fore: 0.27, hand: 0.17, neck: 0.08, headH: 0.24, headW: 0.17,
  skin: '#e2b590', shade: '#b98a68', ink: '#141218', limbW: 0.11, kind: 'human', hoodie: '#7a2c2a', hoodieS: '#561d1c', jeans: '#2f4060', jeansS: '#22304a', shoe: '#e9e6df', hair: '#3a2416' };

function legPts(R, side, pose) {
  const [pa, kb] = pose[side < 0 ? 'legL' : 'legR'];
  const hip = [side * R.hipW, R.hipY + (pose.bob || 0), 0];
  const a = pa * D2R, b = (pa - kb) * D2R;
  const knee = [hip[0] + side * 0.012, hip[1] - R.thigh * Math.cos(a), hip[2] + R.thigh * Math.sin(a)];
  const ank = [knee[0], knee[1] - R.shin * Math.cos(b), knee[2] + R.shin * Math.sin(b)];
  const fa = (pose[side < 0 ? 'footL' : 'footR'] || 0) * D2R;
  const toe = [ank[0] + side * 0.02, ank[1] - 0.02 + Math.sin(fa) * R.foot * 0.6, ank[2] + R.foot * Math.cos(fa)];
  return [hip, knee, ank, toe];
}
function armPts(R, side, pose, sh) {
  const [pa, eb, ab] = pose[side < 0 ? 'armL' : 'armR'];
  const a = pa * D2R, b = (pa + eb) * D2R, r = (ab || 0) * D2R;
  const el = [sh[0] + side * Math.sin(r) * R.upper, sh[1] - R.upper * Math.cos(a) * Math.cos(r), sh[2] + R.upper * Math.sin(a) * Math.cos(r)];
  const inw = pose[side < 0 ? 'armL' : 'armR'][3] || 0;
  const wr = [el[0] + side * Math.sin(r) * R.fore * 0.6 - side * inw * R.fore, el[1] - R.fore * Math.cos(b), el[2] + R.fore * Math.sin(b)];
  const tip = [wr[0] + side * 0.01, wr[1] - R.hand * Math.cos(b + (pose.curl || 0) * D2R), wr[2] + R.hand * Math.sin(b + (pose.curl || 0) * D2R)];
  return [sh, el, wr, tip];
}
function rigJoints(R, pose) {
  const lean = (pose.lean || 0) * D2R, bob = pose.bob || 0;
  const pel = [0, R.hipY + bob, 0];
  const top = [Math.sin((pose.roll || 0) * D2R) * R.spine, pel[1] + R.spine * Math.cos(lean), R.spine * Math.sin(lean)];
  const shL = [top[0] - R.shW, top[1] - 0.03, top[2]], shR = [top[0] + R.shW, top[1] - 0.03, top[2]];
  const hl = (pose.headPitch || 0) * D2R + lean;
  const neckTop = [top[0], top[1] + R.neck * Math.cos(hl), top[2] + R.neck * Math.sin(hl)];
  const head = [neckTop[0], neckTop[1] + R.headH * 0.5 * Math.cos(hl), neckTop[2] + R.headH * 0.5 * Math.sin(hl)];
  const lp = { ...pose, bob };
  return { pel, top, neckTop, head, legL: legPts(R, -1, lp), legR: legPts(R, 1, lp), armL: armPts(R, -1, pose, shL), armR: armPts(R, 1, pose, shR) };
}
function walkPose(ph, A = 1, run = 0) {
  const s = Math.sin(ph), c = Math.cos(ph);
  const leg = (s, c) => [s * (24 + run * 26) * A, (12 + run * 70) * A * Math.pow(Math.max(0, c), 1.3) + 6 * A];
  return {
    legL: leg(s, c), legR: leg(-s, -c), footL: -10 * Math.max(0, c) * A, footR: -10 * Math.max(0, -c) * A,
    armL: [-s * (22 + run * 40) * A, 18 + run * 70, 8], armR: [s * (22 + run * 40) * A, 18 + run * 70, 8],
    bob: (0.03 + run * 0.05) * Math.cos(2 * ph) * A, lean: 6 + run * 18, roll: s * 2 * A,
  };
}
// draw rig at ground point (cx,cy), scale s px/m, yaw deg (0 = facing camera, 90 = facing right)
function drawRig(g, R, pose, cx, cy, s, yaw, opt = {}) {
  const cy_ = Math.cos(yaw * D2R), sy_ = Math.sin(yaw * D2R);
  const P = p => [cx + (p[0] * cy_ + p[2] * sy_) * s, cy - p[1] * s, -p[0] * sy_ + p[2] * cy_];
  const J = rigJoints(R, pose);
  const ow = Math.max(1.5, s * 0.012), parts = [];
  const isS = R.kind !== 'human';
  const legCol = isS ? [R.skin, R.shade] : [R.jeans, R.jeansS];
  const armCol = isS ? [R.skin, R.shade] : [R.hoodie, R.hoodieS];
  for (const side of ['L', 'R']) {
    const lp = J['leg' + side].map(P), ap = J['arm' + side].map(P);
    parts.push({ z: (lp[1][2] + lp[2][2]) / 2 - 0.001, draw: () => drawLeg(g, R, lp, s, ow, legCol, opt) });
    parts.push({ z: (ap[1][2] + ap[2][2]) / 2 + (isS ? 0.02 : 0.03), draw: () => drawArm(g, R, ap, s, ow, armCol, opt, side, pose) });
  }
  const pel = P(J.pel), top = P(J.top), nk = P(J.neckTop), hd = P(J.head);
  parts.push({ z: (pel[2] + top[2]) / 2, draw: () => drawTorso(g, R, pel, top, s, ow, yaw, opt) });
  parts.push({ z: hd[2] + 0.05, draw: () => drawHead(g, R, top, nk, hd, s, ow, yaw, pose, opt) });
  parts.sort((a, b) => a.z - b.z).forEach(p => p.draw());
  return { J, P };
}
function drawLeg(g, R, p, s, ow, col, opt) {
  const w = R.limbW * s;
  if (R.kind !== 'human') {
    limb(g, [p[0], p[1], p[2]], w, col[0], R.ink, col[1], ow);
    // knobbly knee + ankle
    g.fillStyle = col[0]; g.strokeStyle = R.ink; g.lineWidth = ow; ell(g, p[1][0], p[1][1], w * 0.62, w * 0.55); g.fill(); g.stroke();
    // long foot with toes
    limb(g, [p[2], p[3]], w * 0.7, col[0], R.ink, null, ow);
    const dx = p[3][0] - p[2][0], dy = p[3][1] - p[2][1];
    if (R.kind === 'frost') { g.fillStyle = 'rgba(25,35,50,0.5)'; ell(g, p[1][0], p[1][1] + w * 0.9, w * 0.35, w * 0.6); g.fill(); }
    for (let i = -1; i <= 1; i++) { g.strokeStyle = R.ink; g.lineWidth = ow * 0.8; g.beginPath(); g.moveTo(p[3][0] + i * w * 0.18, p[3][1]); g.lineTo(p[3][0] + i * w * 0.22 + dx * 0.15, p[3][1] + dy * 0.15 + w * 0.08); g.stroke(); }
  } else {
    limb(g, [p[0], p[1], p[2]], w, col[0], R.ink, col[1], ow);
    limb(g, [p[2], p[3]], w * 0.75, R.shoe, R.ink, null, ow);
  }
}
function drawArm(g, R, p, s, ow, col, opt, side, pose) {
  const w = R.limbW * s * (R.kind !== 'human' ? 0.85 : 0.9);
  limb(g, [p[0], p[1], p[2]], w, col[0], R.ink, col[1], ow);
  const sk = R.skin;
  if (R.kind !== 'human') {
    g.fillStyle = col[0]; g.strokeStyle = R.ink; g.lineWidth = ow; ell(g, p[1][0], p[1][1], w * 0.6, w * 0.6); g.fill(); g.stroke();
    // hand: long bony fingers, twitching
    const dx = p[3][0] - p[2][0], dy = p[3][1] - p[2][1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    for (let f = 0; f < 4; f++) {
      const spread = (f - 1.5) * 0.16, tw = Math.sin((opt.t || 0) * 7 + f * 1.3 + side.length) * (opt.twitch || 0) * 0.15;
      const a = Math.atan2(uy, ux) + spread + tw, mid = [p[2][0] + Math.cos(a) * L * 0.55, p[2][1] + Math.sin(a) * L * 0.55];
      const c = a + (pose.curl || 0) * D2R * 0.6 * (side === 'L' ? -1 : 1);
      const tip = [mid[0] + Math.cos(c) * L * 0.5, mid[1] + Math.sin(c) * L * 0.5];
      limb(g, [p[2], mid, tip], w * 0.28, sk, R.ink, null, ow * 0.7);
      if (R.kind === 'frost') icicle(g, tip[0], tip[1], w * 0.12, w * (0.5 + (f % 2) * 0.4), opt.t || 0, f);
      if (R.kind === 'mimic') mimicNail(g, tip[0], tip[1], c, w * 0.22);
    }
    if (R.kind === 'frost') { for (let k = 0; k < 3; k++) { const q = [lerp(p[1][0], p[2][0], 0.3 + k * 0.25), lerp(p[1][1], p[2][1], 0.3 + k * 0.25) + w * 0.4]; icicle(g, q[0], q[1], w * 0.14, w * (0.7 + (k % 2) * 0.6), opt.t || 0, k + 7); } }
  } else {
    limb(g, [p[2], [lerp(p[2][0], p[3][0], 0.6), lerp(p[2][1], p[3][1], 0.6)]], w * 0.85, sk, R.ink, null, ow);
  }
}
function drawTorso(g, R, pel, top, s, ow, yaw, opt) {
  const fw = Math.abs(Math.cos(yaw * D2R)), sw = Math.abs(Math.sin(yaw * D2R));
  const wid = k => (R.kind !== 'human' ? [0.15, 0.1, 0.2, 0.25][k] * fw + [0.1, 0.08, 0.13, 0.11][k] * sw : [0.17, 0.16, 0.2, 0.22][k] * fw + [0.12, 0.11, 0.13, 0.12][k] * sw) * s;
  const pt = k => [lerp(pel[0], top[0], [0, 0.3, 0.65, 1][k]), lerp(pel[1], top[1], [0, 0.3, 0.65, 1][k])];
  const L = [0, 1, 2, 3].map(k => [pt(k)[0] - wid(k), pt(k)[1]]), Rr = [3, 2, 1, 0].map(k => [pt(k)[0] + wid(k), pt(k)[1]]);
  const fill = R.kind !== 'human' ? R.skin : R.hoodie, sh = R.kind !== 'human' ? R.shade : R.hoodieS;
  g.beginPath(); g.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < 4; i++) g.lineTo(L[i][0], L[i][1]);
  g.quadraticCurveTo(top[0], top[1] - 0.06 * s, Rr[0][0], Rr[0][1]);
  for (let i = 1; i < 4; i++) g.lineTo(Rr[i][0], Rr[i][1]);
  g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow * 1.2; g.stroke();
  // shading on one side
  g.save(); g.clip(); g.fillStyle = sh; g.globalAlpha = 0.7; g.fillRect(lerp(pel[0], top[0], 0.5) + wid(2) * 0.35, top[1] - 0.2 * s, wid(3) * 2, (pel[1] - top[1]) + 0.4 * s); g.restore();
  if (R.kind !== 'human') {   // ribs + sunken belly
    g.strokeStyle = 'rgba(40,30,30,0.55)'; g.lineWidth = Math.max(1, s * 0.008);
    for (let i = 0; i < 6; i++) {
      const k = 0.5 + i * 0.075, p = [lerp(pel[0], top[0], k), lerp(pel[1], top[1], k)], ww = wid(2) * (0.8 - Math.abs(i - 2) * 0.05);
      g.beginPath(); g.moveTo(p[0] - ww * 0.85, p[1] + s * 0.02); g.quadraticCurveTo(p[0] - ww * 0.3, p[1] - s * 0.03, p[0] - ww * 0.08, p[1]); g.stroke();
      g.beginPath(); g.moveTo(p[0] + ww * 0.85, p[1] + s * 0.02); g.quadraticCurveTo(p[0] + ww * 0.3, p[1] - s * 0.03, p[0] + ww * 0.08, p[1]); g.stroke();
    }
    g.beginPath(); g.moveTo(lerp(pel[0], top[0], 0.48), lerp(pel[1], top[1], 0.48)); g.lineTo(lerp(pel[0], top[0], 0.9), lerp(pel[1], top[1], 0.9)); g.stroke();
    if (R.kind === 'frost') frostTorsoDetail(g, R, pel, top, s, wid, opt);
    if (R.kind === 'mimic') mimicTorsoDetail(g, R, pel, top, s, wid, opt);
    // hip bones
    g.fillStyle = 'rgba(60,45,40,0.35)'; ell(g, pel[0], pel[1] + 0.02 * s, wid(0) * 0.9, 0.05 * s); g.fill();
  } else {
    // hoodie pocket + strings
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = Math.max(1, s * 0.01);
    const m = [lerp(pel[0], top[0], 0.22), lerp(pel[1], top[1], 0.22)]; g.strokeRect(m[0] - wid(1) * 0.55, m[1] - 0.08 * s, wid(1) * 1.1, 0.1 * s);
  }
}
function drawHead(g, R, top, nk, hd, s, ow, yaw, pose, opt) {
  const front = Math.abs(Math.cos(yaw * D2R)) > 0.55, dir = Math.sin(yaw * D2R) >= 0 ? 1 : -1;
  if (R.kind === 'frost') { frostHeadSmall(g, R, top, nk, hd, s, ow, yaw, pose, opt); return; }
  if (R.kind === 'mimic') { mimicHeadSmall(g, R, top, nk, hd, s, ow, yaw, pose, opt); return; }
  if (R.kind !== 'human') {
    limb(g, [[top[0], top[1]], [nk[0], nk[1]]], 0.06 * s, R.skin, R.ink, null, ow);
    g.save(); g.translate(hd[0], hd[1]); g.rotate((pose.headRoll || 0) * D2R);
    if (Math.cos(yaw * D2R) < -0.55) { ell(g, 0, 0, R.headW * s * 0.55, R.headH * s * 0.55); g.fillStyle = R.shade; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke(); }
    else if (front) stretcherFaceSmall(g, s, ow, R, opt); else stretcherProfile(g, s, ow, R, dir, opt);
    g.restore();
  } else {
    limb(g, [[top[0], top[1]], [nk[0], nk[1]]], 0.08 * s, R.skin, R.ink, null, ow);
    g.save(); g.translate(hd[0], hd[1]); g.rotate((pose.headRoll || 0) * D2R);
    if (Math.cos(yaw * D2R) < -0.55) humanBack(g, s, ow, R); else humanHead(g, s, ow, R, front ? 0 : dir, opt.expr || 'scared', opt);
    g.restore();
  }
}
function stretcherFaceSmall(g, s, ow, R, opt) {
  const hw = R.headW * s, hh = R.headH * s * 0.55, mo = opt.mouth == null ? 0.6 : opt.mouth;
  ell(g, 0, 0, hw * 0.55, hh); g.fillStyle = R.skin; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
  g.fillStyle = 'rgba(70,55,50,0.45)'; ell(g, -hw * 0.2, -hh * 0.25, hw * 0.16, hh * 0.18); g.fill(); ell(g, hw * 0.2, -hh * 0.25, hw * 0.16, hh * 0.18); g.fill();
  if (opt.eyes !== false) { g.fillStyle = '#fff'; ell(g, -hw * 0.2, -hh * 0.25, hw * 0.07, hw * 0.07); g.fill(); ell(g, hw * 0.2, -hh * 0.25, hw * 0.07, hw * 0.07); g.fill(); }
  g.fillStyle = '#0a0406'; ell(g, 0, hh * (0.15 + mo * 0.35), hw * 0.22, hh * (0.25 + mo * 0.75)); g.fill();
}
function stretcherProfile(g, s, ow, R, dir, opt) {
  const hw = R.headW * s, hh = R.headH * s * 0.55, mo = opt.mouth == null ? 0.5 : opt.mouth;
  g.scale(dir, 1);
  g.beginPath(); g.moveTo(-hw * 0.45, -hh); g.quadraticCurveTo(hw * 0.5, -hh * 1.1, hw * 0.55, -hh * 0.1); g.lineTo(hw * 0.45, hh * 0.2);
  g.lineTo(hw * 0.25, hh * (0.3 + mo)); g.lineTo(-hw * 0.2, hh * (0.4 + mo * 0.9)); g.quadraticCurveTo(-hw * 0.5, hh * 0.2, -hw * 0.45, -hh); g.closePath();
  g.fillStyle = R.skin; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
  g.fillStyle = '#0a0406'; poly(g, [[hw * 0.45, hh * 0.2], [hw * 0.05, hh * 0.15], [hw * 0.0, hh * (0.3 + mo * 0.8)], [hw * 0.25, hh * (0.3 + mo)]]); g.fill();
  g.fillStyle = '#fff'; ell(g, hw * 0.25, -hh * 0.3, hw * 0.06, hw * 0.06); g.fill();
}
function humanHead(g, s, ow, R, side, expr, opt) {
  const r = R.headW * s * 0.55, hh = R.headH * s * 0.5;
  // hood behind
  g.fillStyle = R.hoodieS; ell(g, -side * r * 0.25, hh * 0.25, r * 1.15, hh * 1.0); g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
  ell(g, 0, 0, r, hh); g.fillStyle = R.skin; g.fill(); g.stroke();
  // hair
  g.fillStyle = R.hair; g.beginPath(); g.ellipse(-side * r * 0.1, -hh * 0.35, r * 1.02, hh * 0.72, 0, Math.PI * 1.02, Math.PI * 1.98); g.fill();
  if (R.beanie) beanie(g, r, hh, ow, R, side);
  if (side === 0) {
    eyesFront(g, r, hh, expr, opt);
  } else {
    g.save(); g.scale(side, 1);
    // nose
    g.strokeStyle = R.ink; g.lineWidth = ow * 0.8; g.beginPath(); g.moveTo(r * 0.92, -hh * 0.05); g.lineTo(r * 1.08, hh * 0.18); g.lineTo(r * 0.92, hh * 0.24); g.stroke();
    if (expr === 'closed') { g.beginPath(); g.moveTo(r * 0.45, -hh * 0.05); g.quadraticCurveTo(r * 0.6, hh * 0.05, r * 0.75, -hh * 0.05); g.stroke(); }
    else { g.fillStyle = '#fff'; ell(g, r * 0.62, -hh * 0.06, r * 0.16, r * 0.15); g.fill(); g.stroke(); g.fillStyle = '#111'; ell(g, r * 0.7, -hh * 0.04, r * 0.06, r * 0.06); g.fill(); }
    g.fillStyle = '#3a1a1a'; ell(g, r * 0.72, hh * 0.5, r * 0.1, expr === 'scared' ? r * 0.12 : r * 0.04); g.fill();
    g.restore();
  }
}
function eyesFront(g, r, hh, expr, opt) {
  const ink = '#141218';
  if (expr === 'closed') {
    g.strokeStyle = ink; g.lineWidth = r * 0.08; g.lineCap = 'round';
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * r * 0.55, -hh * 0.02); g.quadraticCurveTo(sx * r * 0.35, hh * 0.1, sx * r * 0.15, -hh * 0.04); g.stroke(); }
    g.beginPath(); g.moveTo(-r * 0.2, hh * 0.52); g.quadraticCurveTo(0, hh * 0.44, r * 0.2, hh * 0.52); g.stroke();
  } else {
    for (const sx of [-1, 1]) { g.fillStyle = '#fff'; ell(g, sx * r * 0.36, -hh * 0.05, r * 0.2, r * 0.22); g.fill(); g.strokeStyle = ink; g.lineWidth = r * 0.05; g.stroke(); g.fillStyle = '#111'; ell(g, sx * r * 0.36, -hh * 0.03, r * 0.08, r * 0.08); g.fill(); }
    g.fillStyle = '#3a1a1a'; ell(g, 0, hh * 0.5, r * 0.14, r * 0.17); g.fill();
  }
}

// ---------- big close-up: the Pale Stretcher's face ----------
function stretcherFaceBig(g, cx, cy, S, o = {}) {   // S = px per "head unit" (head is ~2.2 units tall)
  const t = o.t || 0, mo = o.mouth == null ? 0.3 : o.mouth, jit = o.jitter || 0;
  g.save(); g.translate(cx + noise(t * 23) * jit * S * 0.05, cy + noise(t * 19 + 4) * jit * S * 0.04); g.rotate((o.tilt || 0) * D2R + noise(t * 17 + 9) * jit * 0.03);
  const ink = '#120f14', skin = '#cbc0ad', shade = '#958977', dark = '#7d7262';
  // neck
  g.fillStyle = skin; g.strokeStyle = ink; g.lineWidth = S * 0.025;
  poly(g, [[-S * 0.22, S * 0.6], [S * 0.22, S * 0.6], [S * 0.3, S * 2.6], [-S * 0.3, S * 2.6]]); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(60,45,40,0.5)'; g.lineWidth = S * 0.012;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-S * 0.1 + i * S * 0.1, S * 0.8); g.lineTo(-S * 0.12 + i * S * 0.12, S * 2.4); g.stroke(); }
  // skull (long, narrow, slightly lopsided)
  g.beginPath(); g.moveTo(0, -S * 1.15);
  g.bezierCurveTo(S * 0.55, -S * 1.15, S * 0.62, -S * 0.3, S * 0.48, S * 0.2);
  g.bezierCurveTo(S * 0.42, S * (0.5 + mo * 0.6), S * 0.2, S * (0.8 + mo * 1.1), 0, S * (0.85 + mo * 1.15));
  g.bezierCurveTo(-S * 0.24, S * (0.8 + mo * 1.1), -S * 0.46, S * (0.45 + mo * 0.6), -S * 0.5, S * 0.15);
  g.bezierCurveTo(-S * 0.62, -S * 0.35, -S * 0.52, -S * 1.15, 0, -S * 1.15); g.closePath();
  const gr = g.createLinearGradient(-S * 0.5, 0, S * 0.5, 0); gr.addColorStop(0, shade); gr.addColorStop(0.45, skin); gr.addColorStop(1, dark);
  g.fillStyle = gr; g.fill(); g.lineWidth = S * 0.03; g.strokeStyle = ink; g.stroke();
  // stretched skin creases
  g.strokeStyle = 'rgba(70,55,48,0.55)'; g.lineWidth = S * 0.012;
  [[-0.35, -0.8, -0.1, -0.95], [0.12, -0.9, 0.38, -0.75], [-0.42, -0.2, -0.3, 0.3], [0.4, -0.15, 0.32, 0.35], [-0.15, -0.55, 0.15, -0.55]].forEach(c => { g.beginPath(); g.moveTo(c[0] * S, c[1] * S); g.quadraticCurveTo((c[0] + c[2]) / 2 * S, (c[1] + c[3]) / 2 * S - S * 0.04, c[2] * S, c[3] * S); g.stroke(); });
  // sunken sockets
  for (const sx of [-1, 1]) {
    const ex = sx * S * 0.21, ey = -S * 0.3;
    const sg = g.createRadialGradient(ex, ey, 0, ex, ey, S * 0.2); sg.addColorStop(0, 'rgba(25,15,15,0.95)'); sg.addColorStop(0.6, 'rgba(50,35,30,0.7)'); sg.addColorStop(1, 'rgba(90,70,60,0)');
    g.fillStyle = sg; ell(g, ex, ey, S * 0.2, S * 0.17, sx * 0.2); g.fill();
    if (o.eyes !== false) {
      const er = S * (0.035 + (o.eyeBig || 0) * 0.02);
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, ex, ey, S * 0.12, [230, 235, 255], 0.35); g.restore();
      g.fillStyle = '#f4f4f0'; ell(g, ex + (o.look || 0) * S * 0.03, ey, er, er * 1.1); g.fill();
    }
  }
  // gaping mouth: tall black hole with ragged lips
  const mt = S * 0.05, mb = S * (0.35 + mo * 1.25), mw = S * (0.13 + mo * 0.1);
  g.beginPath(); g.moveTo(-mw, mt);
  for (let i = 0; i <= 8; i++) { const k = i / 8; g.lineTo(lerp(-mw, mw, k), mt + Math.sin(k * 9 + 1) * S * 0.015); }
  g.bezierCurveTo(mw * 1.2, lerp(mt, mb, 0.5), mw * 0.6, mb, 0, mb); g.bezierCurveTo(-mw * 0.6, mb, -mw * 1.2, lerp(mt, mb, 0.5), -mw, mt); g.closePath();
  const mg = g.createLinearGradient(0, mt, 0, mb); mg.addColorStop(0, '#2a0d0f'); mg.addColorStop(0.3, '#070204'); mg.addColorStop(1, '#000');
  g.fillStyle = mg; g.fill(); g.strokeStyle = '#3d1e1c'; g.lineWidth = S * 0.025; g.stroke();
  // a few crooked teeth on top
  g.fillStyle = '#d8d0b8';
  for (let i = 0; i < 5; i++) { const x = lerp(-mw * 0.8, mw * 0.8, i / 4); poly(g, [[x - S * 0.02, mt + S * 0.01], [x + S * 0.02, mt + S * 0.01], [x + S * 0.004, mt + S * (0.05 + (i % 2) * 0.03)]]); g.fill(); }
  // nose slits
  g.fillStyle = '#2a1a18'; ell(g, -S * 0.04, -S * 0.08, S * 0.018, S * 0.035, 0.3); g.fill(); ell(g, S * 0.04, -S * 0.08, S * 0.018, S * 0.035, -0.3); g.fill();
  g.restore();
}

// ---------- human close-up face (eyes shut, trembling) ----------
function humanFaceBig(g, cx, cy, S, o = {}) {
  const t = o.t || 0, tr = o.tremble || 0, ink = '#141218';
  g.save(); g.translate(cx + noise(t * 30) * tr * S * 0.02, cy + noise(t * 27 + 3) * tr * S * 0.015);
  // hood
  g.fillStyle = '#561d1c'; ell(g, 0, S * 0.1, S * 1.25, S * 1.35); g.fill(); g.strokeStyle = ink; g.lineWidth = S * 0.025; g.stroke();
  g.fillStyle = '#3e1413'; ell(g, 0, S * 0.15, S * 1.0, S * 1.15); g.fill();
  // face
  const fg = g.createLinearGradient(-S, 0, S, 0); fg.addColorStop(0, '#d9a985'); fg.addColorStop(0.5, '#e6b996'); fg.addColorStop(1, '#a87a5c');
  ell(g, 0, S * 0.12, S * 0.78, S * 0.98); g.fillStyle = fg; g.fill(); g.stroke();
  // hair fringe
  g.fillStyle = '#3a2416'; g.beginPath(); g.moveTo(-S * 0.8, -S * 0.1);
  for (let i = 0; i <= 10; i++) { const k = i / 10; g.lineTo(lerp(-S * 0.8, S * 0.8, k), -S * 0.45 + Math.sin(k * 11) * S * 0.06 + (i % 2) * S * 0.08); }
  g.lineTo(S * 0.8, -S * 0.1); g.quadraticCurveTo(S * 0.7, -S * 0.95, 0, -S * 0.92); g.quadraticCurveTo(-S * 0.75, -S * 0.95, -S * 0.8, -S * 0.1); g.fill();
  // brows (worried)
  g.strokeStyle = '#2a1a10'; g.lineWidth = S * 0.06; g.lineCap = 'round';
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * S * 0.12, -S * 0.12); g.lineTo(sx * S * 0.48, -S * 0.02); g.stroke(); }
  // squeezed eyes
  g.strokeStyle = ink; g.lineWidth = S * 0.04;
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(sx * S * 0.5, S * 0.1); g.quadraticCurveTo(sx * S * 0.32, S * 0.2, sx * S * 0.14, S * 0.1); g.stroke();
    g.lineWidth = S * 0.018; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(sx * S * (0.52 + k * 0.02), S * (0.06 + k * 0.05)); g.lineTo(sx * S * (0.62 + k * 0.02), S * (0.03 + k * 0.06)); g.stroke(); } g.lineWidth = S * 0.04;
  }
  // nose + mouth pressed
  g.lineWidth = S * 0.025; g.beginPath(); g.moveTo(0, S * 0.15); g.quadraticCurveTo(S * 0.1, S * 0.38, -S * 0.02, S * 0.42); g.stroke();
  g.lineWidth = S * 0.035; g.beginPath(); g.moveTo(-S * 0.2, S * 0.66); g.quadraticCurveTo(0, S * 0.6 + Math.sin(t * 9) * S * 0.01, S * 0.2, S * 0.66); g.stroke();
  // sweat
  const sw = (t * 0.25) % 1;
  g.fillStyle = 'rgba(200,225,255,0.85)'; g.beginPath(); const sx = S * 0.6, sy = -S * 0.05 + sw * S * 0.4;
  g.moveTo(sx, sy - S * 0.06); g.quadraticCurveTo(sx + S * 0.04, sy, sx, sy + S * 0.03); g.quadraticCurveTo(sx - S * 0.04, sy, sx, sy - S * 0.06); g.fill();
  // hands over mouth? (no) - fingers on cheeks edge
  g.restore();
}

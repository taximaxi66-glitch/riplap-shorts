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
  const wr = [el[0] + side * Math.sin(r) * R.fore * 0.6, el[1] - R.fore * Math.cos(b), el[2] + R.fore * Math.sin(b)];
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
  const isS = R.kind === 'stretcher';
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
  if (R.kind === 'stretcher') {
    limb(g, [p[0], p[1], p[2]], w, col[0], R.ink, col[1], ow);
    // knobbly knee + ankle
    g.fillStyle = col[0]; g.strokeStyle = R.ink; g.lineWidth = ow; ell(g, p[1][0], p[1][1], w * 0.62, w * 0.55); g.fill(); g.stroke();
    // long foot with toes
    limb(g, [p[2], p[3]], w * 0.7, col[0], R.ink, null, ow);
    const dx = p[3][0] - p[2][0], dy = p[3][1] - p[2][1];
    for (let i = -1; i <= 1; i++) { g.strokeStyle = R.ink; g.lineWidth = ow * 0.8; g.beginPath(); g.moveTo(p[3][0] + i * w * 0.18, p[3][1]); g.lineTo(p[3][0] + i * w * 0.22 + dx * 0.15, p[3][1] + dy * 0.15 + w * 0.08); g.stroke(); }
  } else {
    limb(g, [p[0], p[1], p[2]], w, col[0], R.ink, col[1], ow);
    limb(g, [p[2], p[3]], w * 0.75, R.shoe, R.ink, null, ow);
  }
}
function drawArm(g, R, p, s, ow, col, opt, side, pose) {
  const w = R.limbW * s * (R.kind === 'stretcher' ? 0.85 : 0.9);
  limb(g, [p[0], p[1], p[2]], w, col[0], R.ink, col[1], ow);
  const sk = R.skin;
  if (R.kind === 'stretcher') {
    g.fillStyle = col[0]; g.strokeStyle = R.ink; g.lineWidth = ow; ell(g, p[1][0], p[1][1], w * 0.6, w * 0.6); g.fill(); g.stroke();
    // hand: long bony fingers, twitching
    const dx = p[3][0] - p[2][0], dy = p[3][1] - p[2][1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    for (let f = 0; f < 4; f++) {
      const spread = (f - 1.5) * 0.16, tw = Math.sin((opt.t || 0) * 7 + f * 1.3 + side.length) * (opt.twitch || 0) * 0.15;
      const a = Math.atan2(uy, ux) + spread + tw, mid = [p[2][0] + Math.cos(a) * L * 0.55, p[2][1] + Math.sin(a) * L * 0.55];
      const c = a + (pose.curl || 0) * D2R * 0.6 * (side === 'L' ? -1 : 1);
      const tip = [mid[0] + Math.cos(c) * L * 0.5, mid[1] + Math.sin(c) * L * 0.5];
      limb(g, [p[2], mid, tip], w * 0.28, sk, R.ink, null, ow * 0.7);
    }
  } else {
    limb(g, [p[2], [lerp(p[2][0], p[3][0], 0.6), lerp(p[2][1], p[3][1], 0.6)]], w * 0.85, sk, R.ink, null, ow);
  }
}
function drawTorso(g, R, pel, top, s, ow, yaw, opt) {
  const fw = Math.abs(Math.cos(yaw * D2R)), sw = Math.abs(Math.sin(yaw * D2R));
  const wid = k => (R.kind === 'stretcher' ? [0.15, 0.1, 0.2, 0.25][k] * fw + [0.1, 0.08, 0.13, 0.11][k] * sw : [0.17, 0.16, 0.2, 0.22][k] * fw + [0.12, 0.11, 0.13, 0.12][k] * sw) * s;
  const pt = k => [lerp(pel[0], top[0], [0, 0.3, 0.65, 1][k]), lerp(pel[1], top[1], [0, 0.3, 0.65, 1][k])];
  const L = [0, 1, 2, 3].map(k => [pt(k)[0] - wid(k), pt(k)[1]]), Rr = [3, 2, 1, 0].map(k => [pt(k)[0] + wid(k), pt(k)[1]]);
  const fill = R.kind === 'stretcher' ? R.skin : R.hoodie, sh = R.kind === 'stretcher' ? R.shade : R.hoodieS;
  g.beginPath(); g.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < 4; i++) g.lineTo(L[i][0], L[i][1]);
  g.quadraticCurveTo(top[0], top[1] - 0.06 * s, Rr[0][0], Rr[0][1]);
  for (let i = 1; i < 4; i++) g.lineTo(Rr[i][0], Rr[i][1]);
  g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow * 1.2; g.stroke();
  // shading on one side
  g.save(); g.clip(); g.fillStyle = sh; g.globalAlpha = 0.7; g.fillRect(lerp(pel[0], top[0], 0.5) + wid(2) * 0.35, top[1] - 0.2 * s, wid(3) * 2, (pel[1] - top[1]) + 0.4 * s); g.restore();
  if (R.kind === 'stretcher') {   // ribs + sunken belly
    g.strokeStyle = 'rgba(40,30,30,0.55)'; g.lineWidth = Math.max(1, s * 0.008);
    for (let i = 0; i < 6; i++) {
      const k = 0.5 + i * 0.075, p = [lerp(pel[0], top[0], k), lerp(pel[1], top[1], k)], ww = wid(2) * (0.8 - Math.abs(i - 2) * 0.05);
      g.beginPath(); g.moveTo(p[0] - ww * 0.85, p[1] + s * 0.02); g.quadraticCurveTo(p[0] - ww * 0.3, p[1] - s * 0.03, p[0] - ww * 0.08, p[1]); g.stroke();
      g.beginPath(); g.moveTo(p[0] + ww * 0.85, p[1] + s * 0.02); g.quadraticCurveTo(p[0] + ww * 0.3, p[1] - s * 0.03, p[0] + ww * 0.08, p[1]); g.stroke();
    }
    g.beginPath(); g.moveTo(lerp(pel[0], top[0], 0.48), lerp(pel[1], top[1], 0.48)); g.lineTo(lerp(pel[0], top[0], 0.9), lerp(pel[1], top[1], 0.9)); g.stroke();
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
  if (R.kind === 'stretcher') {
    limb(g, [[top[0], top[1]], [nk[0], nk[1]]], 0.06 * s, R.skin, R.ink, null, ow);
    g.save(); g.translate(hd[0], hd[1]); g.rotate((pose.headRoll || 0) * D2R);
    if (Math.cos(yaw * D2R) < -0.55) { ell(g, 0, 0, R.headW * s * 0.55, R.headH * s * 0.55); g.fillStyle = R.shade; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke(); }
    else if (front) stretcherFaceSmall(g, s, ow, R, opt); else stretcherProfile(g, s, ow, R, dir, opt);
    g.restore();
  } else {
    limb(g, [[top[0], top[1]], [nk[0], nk[1]]], 0.08 * s, R.skin, R.ink, null, ow);
    g.save(); g.translate(hd[0], hd[1]); g.rotate((pose.headRoll || 0) * D2R);
    if (Math.cos(yaw * D2R) < -0.55) { const r = R.headW * s * 0.55, hh = R.headH * s * 0.5; g.fillStyle = R.hoodieS; ell(g, 0, hh * 0.15, r * 1.18, hh * 1.05); g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke(); g.fillStyle = R.hoodie; ell(g, 0, hh * 0.25, r * 1.0, hh * 0.85); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = ow * 0.8; g.beginPath(); g.moveTo(0, -hh * 0.6); g.lineTo(0, hh * 0.9); g.stroke(); }
    else humanHead(g, s, ow, R, front ? 0 : dir, opt.expr || 'scared', opt);
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

// =====================================================================
// ---------- THE FOLLOWER: 4 m tall, stilt legs bent backwards, hunched hump,
//            hook neck that hangs its head forward over you, mantis-folded arms ----------
// =====================================================================
const FOL = { skin: '#b4b2a8', shade: '#7f7d75', dark: '#5d5b55', ink: '#121116', thigh: 1.28, shin: 1.3 };
function ik2(A, B, l1, l2, hint) {   // 2-bone IK: returns the middle joint, bending toward hint
  const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.min(Math.hypot(...d), l1 + l2 - 1e-3), u = d.map(v => v / (Math.hypot(...d) || 1));
  const ca = clamp((l1 * l1 + L * L - l2 * l2) / (2 * l1 * L), -1, 1), sa = Math.sqrt(1 - ca * ca);
  const hd = hint[0] * u[0] + hint[1] * u[1] + hint[2] * u[2]; let v = [hint[0] - hd * u[0], hint[1] - hd * u[1], hint[2] - hd * u[2]]; const vl = Math.hypot(...v) || 1; v = v.map(x => x / vl);
  return [A[0] + l1 * (u[0] * ca + v[0] * sa), A[1] + l1 * (u[1] * ca + v[1] * sa), A[2] + l1 * (u[2] * ca + v[2] * sa)];
}
// o: footL/footR [x, lift, z] (local, z forward), crouch, bob, head [x,y,z] target, reach 0..1 (arms), t, twitch
function folJoints(o) {
  const t = o.t || 0, cr = o.crouch || 0, bob = o.bob || 0;
  const hy = 2.35 - cr * 0.55 + bob;
  const pel = [0, hy, 0], chest = [noise(t * 0.7) * 0.03, hy + 0.95 - cr * 0.1, 0.62 + cr * 0.15], hump = [0, hy + 1.32 - cr * 0.12, 0.12];
  const nb = [chest[0], chest[1] + 0.18, chest[2] + 0.18];
  const head = o.head || [0, hy + 0.9, 1.75];
  const nc = [lerp(nb[0], head[0], 0.5), Math.max(nb[1], head[1]) + 0.75, lerp(nb[2], head[2], 0.55)];
  const legs = {};
  for (const sd of [-1, 1]) {
    const f = o[sd < 0 ? 'footL' : 'footR'] || [sd * 0.34, 0, 0.1];
    const hip = [sd * 0.24, hy, -0.05], ball = [f[0], f[1], f[2]], hock = [f[0], f[1] + 0.62, f[2] - 0.34];
    const knee = ik2(hip, hock, FOL.thigh, FOL.shin, [sd * 0.25, 0.1, 1]);
    legs[sd] = [hip, knee, hock, ball];
  }
  const arms = {}, rk = o.reach || 0;
  for (const sd of [-1, 1]) {
    const S = [chest[0] + sd * 0.3, chest[1] - 0.05, chest[2] + 0.02], tw = noise(t * 1.3 + sd * 4) * 0.04;
    const el = [S[0] + sd * lerp(0.16, 0.2, rk), S[1] + lerp(-0.8, -0.35, rk) + tw, S[2] + lerp(0.15, 0.75, rk)];
    const wr = [S[0] + sd * lerp(0.1, 0.16, rk), S[1] + lerp(-0.18, -0.75, rk), S[2] + lerp(0.6, 1.45, rk)];
    arms[sd] = [S, el, wr];
  }
  return { pel, chest, hump, nb, nc, head, legs, arms };
}
// walking: feet planted, the swing foot lifts and moves forward. ph in cycles, stride m
function folWalkFeet(ph, stride = 1.3, lift = 0.35) {
  const f = sd => { const p = ((ph + (sd < 0 ? 0 : 0.5)) % 1 + 1) % 1;   // 0..0.5 stance, 0.5..1 swing
    if (p < 0.5) return [sd * 0.34, 0, lerp(stride / 2, -stride / 2, p / 0.5)];
    const k = (p - 0.5) / 0.5; return [sd * 0.34, Math.sin(k * Math.PI) * lift, lerp(-stride / 2, stride / 2, eio(k))]; };
  return { footL: f(-1), footR: f(1), bob: -Math.abs(Math.sin(ph * TAU)) * 0.06 };
}
function drawFollower(g, o, cx, cy, s, yaw, opt = {}) {
  const J = folJoints(o), cY = Math.cos(yaw * D2R), sY = Math.sin(yaw * D2R);
  const P = p => [cx + (p[0] * cY + p[2] * sY) * s, cy - p[1] * s, -p[0] * sY + p[2] * cY];
  const ow = Math.max(1.5, s * 0.013), parts = [], t = opt.t || 0, ink = FOL.ink;
  for (const sd of [-1, 1]) {
    const lp = J.legs[sd].map(P);
    parts.push({ z: (lp[1][2] + lp[2][2]) / 2 - 0.02, draw: () => folLeg(g, lp, s, ow, sd, t) });
    const ap = J.arms[sd].map(P);
    parts.push({ z: ap[1][2] + 0.03, draw: () => folArm(g, ap, s, ow, sd, t, o, J, P) });
  }
  const pel = P(J.pel), ch = P(J.chest), hu = P(J.hump), nb = P(J.nb), nc = P(J.nc), hd = P(J.head);
  parts.push({ z: (pel[2] + ch[2]) / 2 - 0.01, draw: () => folTorso(g, pel, ch, hu, s, ow, yaw, t, P, J) });
  parts.push({ z: (nb[2] + hd[2]) / 2 + 0.02, draw: () => folNeck(g, nb, nc, hd, s, ow) });
  parts.push({ z: hd[2] + 0.05, draw: () => folHeadSmall(g, nc, hd, s, ow, yaw, o, opt) });
  parts.sort((a, b) => a.z - b.z).forEach(p => p.draw());
  return { J, P };
}
function folLeg(g, p, s, ow, sd, t) {
  const w = 0.15 * s;
  limb(g, [p[0], p[1]], w, FOL.skin, FOL.ink, FOL.shade, ow);
  limb(g, [p[1], p[2]], w * 0.62, FOL.skin, FOL.ink, FOL.shade, ow);
  limb(g, [p[2], p[3]], w * 0.48, FOL.skin, FOL.ink, null, ow);
  g.fillStyle = FOL.skin; g.strokeStyle = FOL.ink; g.lineWidth = ow;
  ell(g, p[1][0], p[1][1], w * 0.55, w * 0.5); g.fill(); g.stroke();   // knobbly knee
  ell(g, p[2][0], p[2][1], w * 0.36, w * 0.36); g.fill(); g.stroke();   // hock
  // three long toes with dark nails, spread on the ground
  for (let i = -1; i <= 1; i++) {
    const a = Math.PI / 2 + i * 0.5 + sd * 0.15, L = w * (2.3 + (i === 0 ? 0.6 : 0));
    const tx = p[3][0] + Math.cos(a) * L * (i === 0 ? 0.35 : 1) + i * w * 0.2, ty = p[3][1] + w * 0.05;
    limb(g, [p[3], [lerp(p[3][0], tx, 0.6), p[3][1] - w * 0.14], [tx, ty]], w * 0.3, FOL.skin, FOL.ink, null, ow * 0.7);
    g.fillStyle = '#1b1612'; ell(g, tx + Math.cos(a) * w * 0.12, ty, w * 0.14, w * 0.08); g.fill();
  }
}
function folArm(g, p, s, ow, sd, t, o, J, P) {
  const w = 0.1 * s;
  limb(g, [p[0], p[1]], w, FOL.skin, FOL.ink, FOL.shade, ow);
  limb(g, [p[1], p[2]], w * 0.72, FOL.skin, FOL.ink, FOL.shade, ow);
  g.fillStyle = FOL.skin; g.strokeStyle = FOL.ink; g.lineWidth = ow; ell(g, p[1][0], p[1][1], w * 0.5, w * 0.5); g.fill(); g.stroke();
  // four very long jointed fingers hanging from the wrist
  const rk = o.reach || 0;
  for (let f = 0; f < 3; f++) {
    const spread = (f - 1) * 0.16, tw = noise(t * 2.2 + f * 1.7 + sd * 3) * 0.12 * (opt_tw(o));
    const a0 = Math.PI / 2 + spread * 2 + lerp(0.25, -0.35, rk) * sd * 0 + tw;
    const L1 = w * 1.9, L2 = w * 1.6, L3 = w * 1.1;
    const k1 = [p[2][0] + Math.cos(a0) * L1 + sd * f * w * 0.1, p[2][1] + Math.sin(a0) * L1];
    const a1 = a0 + 0.35 * sd + (o.curl || 0) * 0.5 * sd, k2 = [k1[0] + Math.cos(a1) * L2, k1[1] + Math.sin(a1) * L2];
    const a2 = a1 + 0.5 * sd + (o.curl || 0) * 0.7 * sd, k3 = [k2[0] + Math.cos(a2) * L3, k2[1] + Math.sin(a2) * L3];
    limb(g, [p[2], k1, k2, k3], w * 0.3, FOL.skin, FOL.ink, null, ow * 0.7);
    g.fillStyle = '#231c18'; ell(g, k3[0], k3[1], w * 0.11, w * 0.11); g.fill();
  }
}
function opt_tw(o) { return o.twitch == null ? 1 : o.twitch; }
function folTorso(g, pel, ch, hu, s, ow, yaw, t, P, J) {
  // a lumpy body built from overlapping cross-sections along a hunched spine (works from every angle)
  const hy = J.pel[1], pz = J.pel[2];
  const spine = [[J.pel, 0.22], [[0, hy + 0.45, -0.08], 0.3], [[0, hy + 0.85, 0.02], 0.38], [J.hump, 0.4], [[0, (J.hump[1] + J.chest[1]) / 2 + 0.05, (J.hump[2] + J.chest[2]) / 2], 0.36], [J.chest, 0.3]];
  const pts = []; for (let i = 0; i < spine.length - 1; i++) for (let k = 0; k < 4; k++) { const u = k / 4, A = spine[i], B = spine[i + 1]; pts.push([[lerp(A[0][0], B[0][0], u), lerp(A[0][1], B[0][1], u), lerp(A[0][2], B[0][2], u)], lerp(A[1], B[1], u)]); }
  pts.push(spine[spine.length - 1]);
  const sp = pts.map(([q, r]) => [P(q), r * s]);
  const body = () => { g.beginPath(); for (const [p, r] of sp) { g.moveTo(p[0] + r, p[1]); g.arc(p[0], p[1], r, 0, TAU); } };
  body(); g.strokeStyle = FOL.ink; g.lineWidth = ow * 2.4; g.stroke();
  body(); g.fillStyle = FOL.skin; g.fill();
  g.save(); body(); g.clip();
  const c = P(J.hump); const gr = g.createLinearGradient(c[0] - 0.5 * s, c[1] - 0.5 * s, c[0] + 0.5 * s, c[1] + 0.6 * s); gr.addColorStop(0, 'rgba(220,218,208,0.35)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,38,34,0.55)');
  g.fillStyle = gr; g.fillRect(c[0] - 2 * s, c[1] - 2 * s, 4 * s, 4 * s);
  // ribs: arcs around the chest section
  g.strokeStyle = 'rgba(40,36,34,0.5)'; g.lineWidth = Math.max(1, s * 0.012);
  for (let i = 0; i < 6; i++) { const k = i / 5, q = [0, lerp(J.chest[1] - 0.05, hy + 0.55, k), lerp(J.chest[2] + 0.1, 0.05, k)];
    const a = P([-0.3, q[1], q[2] + 0.12]), m = P([0, q[1] - 0.06, q[2] + 0.3]), b = P([0.3, q[1], q[2] + 0.12]);
    if (m[2] > P(q)[2]) { g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(m[0], m[1] + 0.05 * s, b[0], b[1]); g.stroke(); } }
  // spine knobs along the back
  g.fillStyle = 'rgba(232,228,218,0.7)';
  for (let i = 0; i < 9; i++) { const k = i / 8, q = [0, lerp(hy + 0.5, J.hump[1] + 0.38, Math.sin(k * Math.PI / 2)), lerp(-0.3, J.hump[2] - 0.05, k)]; const p = P(q); if (p[2] < P(J.hump)[2] - 0.1 && Math.abs(Math.cos(yaw * D2R)) > 0.9) continue; ell(g, p[0], p[1], 0.035 * s, 0.028 * s); g.fill(); }
  // sagging skin folds + mottling
  g.strokeStyle = 'rgba(70,64,58,0.5)'; g.lineWidth = Math.max(1, s * 0.01);
  for (let i = 0; i < 3; i++) { const a = P([-0.25, hy + 0.12 + i * 0.12, 0.12]), b = P([0.25, hy + 0.12 + i * 0.12, 0.12]), m = P([0, hy + 0.02 + i * 0.12, 0.25]); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(m[0], m[1], b[0], b[1]); g.stroke(); }
  g.fillStyle = 'rgba(70,66,58,0.22)'; for (let i = 0; i < 5; i++) { const p = P([Math.sin(i * 2.3) * 0.2, hy + 0.4 + i * 0.18, 0.1 + i * 0.05]); ell(g, p[0], p[1], 0.07 * s, 0.045 * s, i); g.fill(); }
  g.restore();
}
function folNeck(g, nb, nc, hd, s, ow) {
  const path = () => { g.beginPath(); g.moveTo(nb[0], nb[1]); g.quadraticCurveTo(nc[0], nc[1], hd[0], hd[1]); };
  g.lineCap = 'round';
  path(); g.strokeStyle = FOL.ink; g.lineWidth = 0.17 * s + ow * 2; g.stroke();
  path(); g.strokeStyle = FOL.skin; g.lineWidth = 0.17 * s; g.stroke();
  g.save(); g.translate(0.03 * s, 0.02 * s); path(); g.strokeStyle = FOL.shade; g.lineWidth = 0.06 * s; g.stroke(); g.restore();
  // vertebrae ridge along the top of the hook
  g.fillStyle = 'rgba(225,222,212,0.7)';
  for (let i = 1; i < 9; i++) { const k = i / 9, x = (1 - k) * (1 - k) * nb[0] + 2 * k * (1 - k) * nc[0] + k * k * hd[0], y = (1 - k) * (1 - k) * nb[1] + 2 * k * (1 - k) * nc[1] + k * k * hd[1]; ell(g, x, y - 0.06 * s, 0.028 * s, 0.022 * s); g.fill(); }
}
function folHeadSmall(g, nc, hd, s, ow, yaw, o, opt) {
  const ang = Math.atan2(hd[1] - nc[1], hd[0] - nc[0]);   // direction the neck enters the head
  const front = Math.cos(yaw * D2R), side = Math.sin(yaw * D2R);
  g.save(); g.translate(hd[0], hd[1]); g.rotate(ang - Math.PI / 2 + (o.headRoll || 0) * D2R);
  const hw = 0.3 * s, hh = 0.5 * s;
  // long smooth head hanging face-forward; crown toward the neck
  g.beginPath(); g.ellipse(0, hh * 0.35, hw, hh, 0, 0, TAU); g.fillStyle = FOL.skin; g.fill(); g.strokeStyle = FOL.ink; g.lineWidth = ow; g.stroke();
  g.fillStyle = 'rgba(90,86,80,0.35)'; g.beginPath(); g.ellipse(hw * 0.35, hh * 0.35, hw * 0.55, hh * 0.9, 0, 0, TAU); g.fill();
  if (front > -0.3) {   // face visible
    const fx = side * hw * 0.35, mo = o.mouth == null ? 0.3 : o.mouth;
    // deep, slanted sockets with tiny glinting pupils
    for (const sx of [-1, 1]) {
      g.fillStyle = 'rgba(30,26,26,0.75)'; ell(g, fx + sx * hw * 0.4, hh * 0.6, hw * 0.3, hw * 0.2, sx * 0.35); g.fill();
      g.fillStyle = '#040203'; ell(g, fx + sx * hw * 0.42, hh * 0.62, hw * 0.19, hw * 0.12, sx * 0.35); g.fill();
      if (opt.eyes !== false) { g.fillStyle = '#f2f0e8'; ell(g, fx + sx * hw * 0.42, hh * 0.62, hw * 0.035, hw * 0.035); g.fill(); }
    }
    // a huge grin, ear to ear, open
    const y0 = hh * 0.9, y1 = hh * (1.02 + mo * 0.3);
    g.fillStyle = '#0a0406'; g.beginPath(); g.moveTo(fx - hw * 0.85, y0 - hh * 0.08); g.quadraticCurveTo(fx, y0 + hh * 0.06, fx + hw * 0.85, y0 - hh * 0.08); g.quadraticCurveTo(fx + hw * 0.4, y1 + hh * 0.08, fx, y1 + hh * 0.1); g.quadraticCurveTo(fx - hw * 0.4, y1 + hh * 0.08, fx - hw * 0.85, y0 - hh * 0.08); g.fill();
    g.fillStyle = '#ddd6c4'; for (let i = -5; i <= 5; i++) { const x = fx + i * hw * 0.13, yt = y0 - hh * 0.02 * (1 - Math.abs(i) / 6); poly(g, [[x - hw * 0.035, yt - hh * 0.02], [x + hw * 0.035, yt - hh * 0.02], [x, yt + hh * (0.07 + (i % 2 ? 0.03 : 0))]]); g.fill(); }
    g.strokeStyle = 'rgba(60,55,50,0.6)'; g.lineWidth = Math.max(1, ow * 0.6); for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(fx + sx * hw * 0.85, y0 - hh * 0.08); g.quadraticCurveTo(fx + sx * hw * 0.95, y0 - hh * 0.3, fx + sx * hw * 0.8, hh * 0.45); g.stroke(); }
  }
  g.restore();
}

// ---------- big close-up of its face (S = px per unit, the face is ~3 units tall) ----------
function followerFaceBig(g, cx, cy, S, o = {}) {
  const t = o.t || 0, mo = o.mouth == null ? 0.25 : o.mouth, jit = o.jitter || 0;
  g.save(); g.translate(cx + noise(t * 23) * jit * S * 0.05, cy + noise(t * 19 + 4) * jit * S * 0.04); g.rotate((o.tilt || 0) * D2R + noise(t * 17 + 9) * jit * 0.03);
  const ink = '#100f13', skin = FOL.skin, shade = FOL.shade, dark = FOL.dark;
  // the neck comes down from above (it is bending over you)
  if (o.neck !== false) {
    g.save(); if (o.flip) g.scale(1, -1);
    g.fillStyle = skin; g.strokeStyle = ink; g.lineWidth = S * 0.025;
    g.beginPath(); g.moveTo(-S * 0.38, -S * 0.9); g.bezierCurveTo(-S * 0.5, -S * 2.0, -S * 0.2, -S * 2.8, S * 0.2, -S * 3.6); g.lineTo(S * 0.75, -S * 3.4); g.bezierCurveTo(S * 0.4, -S * 2.6, S * 0.45, -S * 1.8, S * 0.38, -S * 0.9); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(225,222,212,0.65)'; for (let i = 0; i < 6; i++) { const k = i / 5; ell(g, lerp(S * 0.35, S * 0.6, k * k), lerp(-S * 1.0, -S * 3.2, k), S * 0.07, S * 0.05); g.fill(); }
    g.strokeStyle = 'rgba(60,55,50,0.45)'; g.lineWidth = S * 0.012; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-S * 0.25 + i * S * 0.15, -S * 1.0); g.quadraticCurveTo(-S * 0.25 + i * S * 0.15 + S * 0.1, -S * 2.0, -S * 0.1 + i * S * 0.18 + S * 0.3, -S * 3.0); g.stroke(); }
    g.restore();
  }
  // head: long, smooth, hairless, slightly lopsided
  g.beginPath(); g.moveTo(0, -S * 1.25);
  g.bezierCurveTo(S * 0.7, -S * 1.25, S * 0.82, -S * 0.2, S * 0.7, S * 0.55);
  g.bezierCurveTo(S * 0.6, S * 1.15, S * 0.3, S * 1.45, 0, S * 1.5);
  g.bezierCurveTo(-S * 0.32, S * 1.45, -S * 0.66, S * 1.1, -S * 0.72, S * 0.5);
  g.bezierCurveTo(-S * 0.82, -S * 0.25, -S * 0.68, -S * 1.25, 0, -S * 1.25); g.closePath();
  const gr = g.createLinearGradient(-S * 0.7, -S, S * 0.7, S); gr.addColorStop(0, shade); gr.addColorStop(0.4, skin); gr.addColorStop(1, dark);
  g.fillStyle = gr; g.fill(); g.lineWidth = S * 0.03; g.strokeStyle = ink; g.stroke();
  // rim light from the streetlight behind it
  if (o.rim) { g.save(); g.clip(); g.strokeStyle = rgb([255, 190, 120], 0.55 * o.rim); g.lineWidth = S * 0.09; g.beginPath(); g.moveTo(-S * 0.55, -S * 1.0); g.bezierCurveTo(-S * 0.1, -S * 1.35, S * 0.5, -S * 1.25, S * 0.72, -S * 0.5); g.stroke(); g.restore(); }
  // forehead folds + cheek creases from the stretched grin
  g.strokeStyle = 'rgba(60,55,50,0.5)'; g.lineWidth = S * 0.014;
  [[-0.4, -0.85, 0.35, -0.9], [-0.3, -0.7, 0.25, -0.72], [-0.55, 0.4, -0.45, 0.95], [0.55, 0.4, 0.47, 0.95], [-0.62, 0.0, -0.58, 0.4], [0.62, 0.0, 0.58, 0.4]].forEach(c => { g.beginPath(); g.moveTo(c[0] * S, c[1] * S); g.quadraticCurveTo((c[0] + c[2]) / 2 * S + S * 0.04, (c[1] + c[3]) / 2 * S - S * 0.04, c[2] * S, c[3] * S); g.stroke(); });
  // eyes: small, deep, glossy black, set too far apart, tiny white pupils
  const blink = o.blink || 0;
  for (const sx of [-1, 1]) {
    const ex = sx * S * 0.38, ey = -S * 0.18;
    const sg = g.createRadialGradient(ex, ey, 0, ex, ey, S * 0.28); sg.addColorStop(0, 'rgba(20,12,14,0.95)'); sg.addColorStop(0.55, 'rgba(45,38,36,0.6)'); sg.addColorStop(1, 'rgba(90,85,78,0)');
    g.fillStyle = sg; ell(g, ex, ey, S * 0.28, S * 0.22, sx * 0.25); g.fill();
    g.fillStyle = '#040203'; ell(g, ex, ey, S * 0.15, S * 0.13 * (1 - blink * 0.9)); g.fill();
    if (blink < 0.6) { g.fillStyle = 'rgba(255,255,255,0.18)'; ell(g, ex - S * 0.04, ey - S * 0.05, S * 0.06, S * 0.035); g.fill();
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, ex + (o.look || 0) * S * 0.04, ey, S * 0.08, [230, 235, 255], 0.35); g.restore();
      g.fillStyle = '#f4f2ea'; ell(g, ex + (o.look || 0) * S * 0.04, ey, S * 0.028, S * 0.03); g.fill(); }
  }
  // no nose, just two small holes
  g.fillStyle = '#2a201c'; ell(g, -S * 0.05, S * 0.2, S * 0.022, S * 0.04, 0.3); g.fill(); ell(g, S * 0.05, S * 0.2, S * 0.022, S * 0.04, -0.3); g.fill();
  // the grin: far too wide, ear to ear, lots of thin teeth
  const mw = S * 0.62, mt = S * 0.55, mb = S * (0.62 + mo * 0.55);
  g.beginPath(); g.moveTo(-mw, mt - S * 0.06);
  g.quadraticCurveTo(0, mt + S * 0.12, mw, mt - S * 0.06);
  g.quadraticCurveTo(mw * 0.6, mb + S * 0.05, 0, mb + S * 0.08); g.quadraticCurveTo(-mw * 0.6, mb + S * 0.05, -mw, mt - S * 0.06); g.closePath();
  const mg = g.createLinearGradient(0, mt, 0, mb); mg.addColorStop(0, '#2a0d0f'); mg.addColorStop(0.4, '#070204'); mg.addColorStop(1, '#000');
  g.fillStyle = mg; g.fill(); g.strokeStyle = '#3a2420'; g.lineWidth = S * 0.022; g.stroke();
  g.save(); g.clip(); g.fillStyle = '#ddd5c0';
  for (let i = 0; i <= 18; i++) { const k = i / 18, x = lerp(-mw * 0.92, mw * 0.92, k), yT = mt + S * 0.06 * (1 - Math.pow(2 * k - 1, 2)) - S * 0.03, l = S * (0.07 + (i % 3) * 0.025);
    poly(g, [[x - S * 0.022, yT - S * 0.02], [x + S * 0.022, yT - S * 0.02], [x, yT + l]]); g.fill();
    const yB = lerp(mt, mb + S * 0.05, 1 - Math.pow(2 * k - 1, 2)) ; if (mo > 0.1) { poly(g, [[x - S * 0.02, yB + S * 0.03], [x + S * 0.02, yB + S * 0.03], [x, yB - l * 0.8]]); g.fill(); } }
  g.restore();
  // a string of drool
  if (o.drool) { const dk = (t * 0.35) % 1, dl = S * (0.2 + dk * 0.9) * o.drool; g.strokeStyle = 'rgba(210,220,230,0.6)'; g.lineWidth = S * 0.012; g.beginPath(); g.moveTo(S * 0.15, mb); g.quadraticCurveTo(S * 0.17, mb + dl * 0.5, S * 0.15, mb + dl); g.stroke(); g.fillStyle = 'rgba(220,230,240,0.7)'; ell(g, S * 0.15, mb + dl, S * 0.025, S * 0.035); g.fill(); }
  g.restore();
}
// ---------- your face, eyes wide open (scared) ----------
function humanFaceOpen(g, cx, cy, S, o = {}) {
  const t = o.t || 0, tr = o.tremble || 0, ink = '#141218', wide = o.wide == null ? 0.6 : o.wide, look = o.look || 0;
  g.save(); g.translate(cx + noise(t * 30) * tr * S * 0.02, cy + noise(t * 27 + 3) * tr * S * 0.015);
  g.fillStyle = '#561d1c'; ell(g, 0, S * 0.1, S * 1.25, S * 1.35); g.fill(); g.strokeStyle = ink; g.lineWidth = S * 0.025; g.stroke();
  g.fillStyle = '#3e1413'; ell(g, 0, S * 0.15, S * 1.0, S * 1.15); g.fill();
  const fg = g.createLinearGradient(-S, 0, S, 0); fg.addColorStop(0, '#d9a985'); fg.addColorStop(0.5, '#e6b996'); fg.addColorStop(1, '#a87a5c');
  ell(g, 0, S * 0.12, S * 0.78, S * 0.98); g.fillStyle = fg; g.fill(); g.stroke();
  g.fillStyle = '#3a2416'; g.beginPath(); g.moveTo(-S * 0.8, -S * 0.1);
  for (let i = 0; i <= 10; i++) { const k = i / 10; g.lineTo(lerp(-S * 0.8, S * 0.8, k), -S * 0.45 + Math.sin(k * 11) * S * 0.06 + (i % 2) * S * 0.08); }
  g.lineTo(S * 0.8, -S * 0.1); g.quadraticCurveTo(S * 0.7, -S * 0.95, 0, -S * 0.92); g.quadraticCurveTo(-S * 0.75, -S * 0.95, -S * 0.8, -S * 0.1); g.fill();
  g.strokeStyle = '#2a1a10'; g.lineWidth = S * 0.06; g.lineCap = 'round';
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * S * 0.12, -S * (0.14 + wide * 0.06)); g.lineTo(sx * S * 0.5, -S * (0.06 + wide * 0.04)); g.stroke(); }
  for (const sx of [-1, 1]) {
    const ex = sx * S * 0.32, ey = S * 0.1, rw = S * 0.17, rh = S * (0.1 + wide * 0.08);
    g.fillStyle = '#f5f1ea'; ell(g, ex, ey, rw, rh); g.fill(); g.strokeStyle = ink; g.lineWidth = S * 0.03; g.stroke();
    g.fillStyle = '#3b2a1c'; ell(g, ex + look * rw * 0.45, ey - look * 0 - S * 0.01 - (o.up || 0) * rh * 0.5, S * 0.075, S * 0.075); g.fill();
    g.fillStyle = '#050505'; ell(g, ex + look * rw * 0.45, ey - S * 0.01 - (o.up || 0) * rh * 0.5, S * 0.04, S * 0.04); g.fill();
    g.fillStyle = '#fff'; ell(g, ex + look * rw * 0.45 - S * 0.02, ey - S * 0.03 - (o.up || 0) * rh * 0.5, S * 0.014, S * 0.014); g.fill();
  }
  g.strokeStyle = ink; g.lineWidth = S * 0.025; g.beginPath(); g.moveTo(0, S * 0.2); g.quadraticCurveTo(S * 0.1, S * 0.42, -S * 0.02, S * 0.46); g.stroke();
  g.fillStyle = '#3a1a1a'; ell(g, 0, S * 0.7, S * 0.12, S * (0.05 + wide * 0.07)); g.fill();
  const sw = (t * 0.25) % 1; g.fillStyle = 'rgba(200,225,255,0.85)'; g.beginPath(); const sx = S * 0.6, sy = -S * 0.05 + sw * S * 0.4;
  g.moveTo(sx, sy - S * 0.06); g.quadraticCurveTo(sx + S * 0.04, sy, sx, sy + S * 0.03); g.quadraticCurveTo(sx - S * 0.04, sy, sx, sy - S * 0.06); g.fill();
  g.restore();
}

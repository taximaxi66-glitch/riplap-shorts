// =====================================================================
// THE STILLGRIN: a 3 m pale, waxy thing with a huge hump. No neck: its big bald head hangs
// LOWER than its shoulders, in front of the chest. Spider-long arms whose elbows stick up
// above its back when it crawls, hands with long jointed fingers. A sagging belly of loose skin,
// short legs bent backwards. Face: tiny white pinpoint pupils in deep black sockets and a grin
// that is far too wide (lips pulled back past the cheeks, gums, rows of flat yellow human teeth).
// It only moves in the dark: in the light it is frozen, only the fingers twitch.
// =====================================================================
const SG = { skin: '#a19d8e', shade: '#6c695e', dark: '#4a4840', ink: '#100d0b', gum: '#5a1c22', tooth: '#d8cfa8', toothS: '#9e9370' };
function sgFinger(g, cam, pts, w, col = SG.skin, sh = SG.shade) {
  const P = pts.map(p => proj(cam, ...p)); if (P.some(p => !p)) return;
  // smooth curve through the joints (Catmull-Rom), knuckles slightly fatter than the bones
  const C = [], R = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let k = 0; k < 4; k++) { const u = k / 4, u2 = u * u, u3 = u2 * u; C.push([0, 1, 2].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)));
      const tp = 1 - (i + u) / (n - 1) * 0.45, kn = Math.exp(-((u - 0) * (u - 0)) / 0.02) * (i > 0 ? 0.18 : 0); R.push(w * 0.5 * tp * (1 + kn)); } }
  C.push(pts[n - 1]); R.push(w * 0.5 * 0.55);
  sgChain(g, cam, C, R, col, sh, { ow: 0.004, noHi: false, mid: 0.4 });
  // knuckle wrinkles
  g.strokeStyle = 'rgba(50,46,40,0.7)'; g.lineWidth = Math.max(1, P[0][2] * 0.003);
  for (let i = 1; i < n - 1; i++) { const a = P[i - 1], b = P[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2, r = w * 0.4 * P[i][2]; for (const o of [-0.25, 0, 0.25]) { const cx = P[i][0] + Math.cos(ang - Math.PI / 2) * r * o * 1.4, cy = P[i][1] + Math.sin(ang - Math.PI / 2) * r * o * 1.4; g.beginPath(); g.moveTo(cx - Math.cos(ang) * r * 0.8, cy - Math.sin(ang) * r * 0.8); g.quadraticCurveTo(cx, cy + 2, cx + Math.cos(ang) * r * 0.8, cy + Math.sin(ang) * r * 0.8); g.stroke(); } }
  // long pointed yellow-grey nail
  const a = P[n - 2], e = P[n - 1], ang = Math.atan2(e[1] - a[1], e[0] - a[0]), s = e[2]; g.save(); g.translate(e[0], e[1]); g.rotate(ang);
  g.fillStyle = '#8a8066'; g.strokeStyle = SG.ink; g.lineWidth = Math.max(1, s * 0.003); g.beginPath(); g.moveTo(-w * 0.35 * s, -w * 0.26 * s); g.quadraticCurveTo(w * 0.5 * s, -w * 0.22 * s, w * 0.75 * s, w * 0.05 * s); g.quadraticCurveTo(w * 0.3 * s, w * 0.24 * s, -w * 0.35 * s, w * 0.24 * s); g.closePath(); g.fill(); g.stroke(); g.restore();
}
// a hand: palm at wrist->palm, fingers spread along dir, curling toward n. grip: fingers drape over an edge (pts given)
function sgHand(g, cam, wr, dir, side, n, o = {}) {
  const t = o.t || 0, curl = o.curl == null ? 0.25 : o.curl, palm = V.add(wr, V.mul(dir, 0.16));
  wTaper(g, cam, [wr, palm], [0.09, 0.11], SG.skin, SG.shade);
  for (let f = 0; f < 5; f++) {
    if (o.fingers && o.fingers[f]) { sgFinger(g, cam, o.fingers[f], 0.03); continue; }
    const sp = (f - 2) * 0.13 + (f === 0 ? -0.25 : 0), fd = V.norm(V.add(dir, V.mul(side, sp))), b = V.add(palm, V.mul(side, (f - 2) * 0.028));
    const tw = Math.sin(t * 6 + f * 1.9) * 0.1 * (o.twitch == null ? 1 : o.twitch), L = [0.24, 0.42, 0.46, 0.42, 0.34][f];
    const k1 = V.add(b, V.mul(fd, L * 0.4)), fd2 = V.norm(V.add(fd, V.mul(n, curl + tw))), k2 = V.add(k1, V.mul(fd2, L * 0.33)), fd3 = V.norm(V.add(fd2, V.mul(n, curl + tw))), k3 = V.add(k2, V.mul(fd3, L * 0.27));
    const fl = o.floor; const clampY = p => fl == null ? p : [p[0], Math.max(p[1], fl + 0.015), p[2]];
    sgFinger(g, cam, [b, clampY(k1), clampY(k2), clampY(k3)], 0.036);
  }
}
// o: {x, z, yaw (deg, 180 = facing the house), rise 0..1, t, headRoll, mouth, twitch, handL/handR: [x,y,z] targets, headDrop}
function sgJoints(o) {
  const t = o.t || 0, yaw = (o.yaw == null ? 180 : o.yaw) * D2R, F = [Math.sin(yaw), 0, Math.cos(yaw)], X = [Math.cos(yaw), 0, -Math.sin(yaw)], U = [0, 1, 0];
  const r = o.rise || 0, base = [o.x, o.floorY || 0, o.z], br = Math.sin(t * 1.5) * 0.02 * (o.breath == null ? 1 : o.breath);
  const at = (f, u, x = 0) => V.add(V.add(V.add(base, V.mul(F, f)), V.mul(U, u)), V.mul(X, x));
  const J = { F, X, U, base };
  J.hip = at(lerp(-0.45, -0.05, r), lerp(1.0, 1.35, r));
  J.sho = at(lerp(0.75, 0.12, r), lerp(1.55 + br, 2.55 + br, r));
  J.hump = V.add(V.lerp(J.hip, J.sho, lerp(0.62, 0.8, r)), V.add(V.mul(U, lerp(0.62, 0.25, r)), V.mul(F, lerp(0, -0.42, r))));
  J.belly = V.add(V.lerp(J.hip, J.sho, 0.4), V.add(V.mul(U, lerp(-0.42, 0, r)), V.mul(F, lerp(0, 0.32, r))));
  J.head = V.add(J.sho, V.add(V.mul(F, lerp(0.42, 0.42, r)), V.mul(U, lerp(-0.38, 0.12, r) - (o.headDrop || 0))));
  if (o.head) J.head = o.head;
  J.HF = F;
  J.arm = {};
  for (const sd of [-1, 1]) {
    const sh = V.add(J.sho, V.mul(X, sd * 0.5));
    const hand = (sd < 0 ? o.handL : o.handR) || (r < 0.5 ? at(lerp(1.45, 0.9, r * 2), 0, sd * lerp(0.75, 0.6, r * 2)) : at(0.35, lerp(0.0, 0.45, (r - 0.5) * 2), sd * 0.62));
    const wr = V.add(hand, V.mul(F, -0.18 * (r < 0.5 ? 1 : 0)));
    const hint = V.norm(V.add(V.add(U, V.mul(X, sd * 1.2)), V.mul(F, -0.4)));
    const el = ik2(sh, V.add(wr, [0, 0.12, 0]), 1.05, 1.1, r > 0.5 ? V.norm(V.add(V.mul(X, sd), V.mul(F, -0.6))) : hint);
    J.arm[sd] = { sh, el, wr: V.add(wr, [0, 0.12, 0]), hand };
  }
  J.leg = {};
  for (const sd of [-1, 1]) {
    const hp = V.add(J.hip, V.mul(X, sd * 0.3)), ft = (o.feet && o.feet[sd]) || at(lerp(-0.25, 0.0, r), 0, sd * 0.42);
    const kn = ik2(hp, V.add(ft, [0, 0.12, 0]), 0.62, 0.62, V.norm(V.add(V.mul(F, -1), V.mul(X, sd * 0.3))));   // knees bend BACKWARDS
    J.leg[sd] = { hp, kn, ank: V.add(ft, [0, 0.12, 0]), ft };
  }
  return J;
}
function drawStillgrin(g, cam, E, o) {
  const J = sgJoints(o), t = o.t || E.t, dep = p => camSpace(cam, ...p)[2], parts = [];
  const fy = o.floorY || 0;
  // contact shadows (hands + feet)
  if (!o.noShadow) for (const p of [J.arm[-1].hand, J.arm[1].hand, J.leg[-1].ft, J.leg[1].ft]) { if (p[1] > fy + 0.3) continue; const q = proj(cam, p[0], fy + 0.003, p[2]); if (q) { g.fillStyle = 'rgba(0,0,0,0.5)'; ell(g, q[0], q[1], 0.28 * q[2], 0.06 * q[2]); g.fill(); } }
  { const q = proj(cam, J.belly[0], fy + 0.003, J.belly[2]); if (q && !o.noShadow) { g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, q[0], q[1], 0.9 * q[2], 0.16 * q[2]); g.fill(); } }
  for (const sd of [-1, 1]) {
    const L = J.leg[sd];
    parts.push({ d: dep(L.kn) + 0.05, draw: () => {
      sgChain(g, cam, [L.hp, V.lerp(L.hp, L.kn, 0.5), L.kn, V.lerp(L.kn, L.ank, 0.5), L.ank], [0.2, 0.15, 0.085, 0.065, 0.05], SG.shade, SG.dark);
      const fw = V.norm([J.F[0], 0, J.F[2]]);
      for (let k = -1; k <= 1; k++) { const tb = V.add(L.ank, V.mul(J.X, k * 0.05)), te = V.add([tb[0], fy + 0.015, tb[2]], V.add(V.mul(fw, 0.22), V.mul(J.X, k * 0.06))); wTaper(g, cam, [tb, te], [0.06, 0.03], SG.shade, SG.dark); }
    } });
    const A = J.arm[sd];
    parts.push({ d: Math.min(dep(A.el), dep(A.wr)) - 0.03, draw: () => {
      sgChain(g, cam, [A.sh, V.lerp(A.sh, A.el, 0.35), V.lerp(A.sh, A.el, 0.8), A.el], [0.14, 0.1, 0.065, 0.07], SG.skin, SG.shade);
      sgChain(g, cam, [A.el, V.lerp(A.el, A.wr, 0.3), V.lerp(A.el, A.wr, 0.75), A.wr], [0.07, 0.06, 0.045, 0.045], SG.skin, SG.shade);
      wKnobC(g, cam, A.el, 0.05);
      const dir = V.norm(V.sub(A.hand, A.wr)), d2 = V.len(V.sub(A.hand, A.wr)) < 0.05 ? J.F : dir, side = V.norm(V.cross(d2, [0, 1, 0.001]));
      sgHand(g, cam, A.wr, V.norm(V.add(d2, [0, -0.25, 0])), side, V.norm(V.cross(side, d2)), { t, curl: o.curl == null ? 0.18 : o.curl, twitch: o.twitch, floor: A.hand[1] < fy + 0.2 ? fy : null, fingers: sd < 0 ? o.fingersL : o.fingersR });
    } });
  }
  // body: hip -> belly -> shoulders, a fat tapered mass + the hump + hanging belly skin
  parts.push({ d: dep(J.belly) + 0.02, draw: () => {
    // hanging belly skin
    const sag = V.add(J.belly, [0, -0.28 - Math.sin(t * 1.5) * 0.02, 0]);
    sgChain(g, cam, [V.lerp(J.hip, J.belly, 0.5), sag, V.lerp(J.belly, J.sho, 0.3)], [0.24, 0.32, 0.24], SG.shade, SG.dark);
    sgChain(g, cam, [J.hip, J.belly, J.hump, V.lerp(J.hump, J.sho, 0.6), J.sho], [0.3, 0.4, 0.44, 0.38, 0.3], SG.skin, SG.shade);
    // mottled skin: dark blotches + veins
    { const rr_ = rng(31); for (let i = 0; i < 8; i++) { const k = rr_(), p = V.add(V.lerp(V.lerp(J.hip, J.hump, k), V.lerp(J.hump, J.sho, k), k), V.add(V.mul(J.X, (rr_() - 0.5) * 0.5), V.mul(J.U, (rr_() - 0.3) * 0.4))), q = proj(cam, ...p); if (q) { g.fillStyle = `rgba(60,52,44,${0.1 + rr_() * 0.12})`; ell(g, q[0], q[1], (0.03 + rr_() * 0.06) * q[2], (0.02 + rr_() * 0.04) * q[2], rr_() * 3); g.fill(); } } }
    // spine knobs over the hump
    for (let i = 0; i < 9; i++) { const k = i / 8, p = V.add(V.lerp(V.lerp(J.hip, J.hump, k), V.lerp(J.hump, J.sho, k), k), V.mul(J.U, 0.36 - Math.abs(k - 0.5) * 0.25)); if (V.dot(V.sub([cam.x, cam.y, cam.z], p), V.sub(V.mul(J.U, 0.7), J.F)) > 0) wKnobC(g, cam, p, 0.04); }
    // rib lines + skin folds on the flank
    for (let i = 0; i < 5; i++) { const c = V.lerp(J.belly, J.sho, 0.25 + i * 0.12); for (const sd of [-1, 1]) { const a = proj(cam, ...V.add(c, V.mul(J.X, sd * 0.12))), b = proj(cam, ...V.add(V.add(c, V.mul(J.X, sd * 0.38)), [0, -0.12, 0])); if (a && b) { g.strokeStyle = 'rgba(80,66,50,0.6)'; g.lineWidth = Math.max(1, a[2] * 0.01); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], a[1], b[0], b[1]); g.stroke(); } } }
    const nv = proj(cam, ...V.add(J.belly, [0, -0.3, 0])); if (nv) { g.strokeStyle = 'rgba(70,56,42,0.6)'; g.lineWidth = Math.max(1, nv[2] * 0.01); for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(nv[0], nv[1] - k * 0.07 * nv[2], 0.3 * nv[2], 0.05 * nv[2], 0, 0.15, Math.PI - 0.15); g.stroke(); } }
    // shoulder blades
    sgChain(g, cam, [V.add(J.sho, V.mul(J.X, -0.45)), V.add(J.sho, [0, 0.06, 0]), V.add(J.sho, V.mul(J.X, 0.45))], [0.17, 0.24, 0.17], SG.skin, SG.shade);
  } });
  // head: hangs in front of the chest
  parts.push({ d: -1e9, draw: () => {
    const h = proj(cam, ...J.head); if (!h) return; const S = 0.74 * h[2] / 2.2;
    const front = V.dot(V.sub([cam.x, cam.y, cam.z], J.head), J.HF) > 0;
    sgFace(g, h[0], h[1], S, { t, back: !front, rot: (o.headRoll || 0) * D2R, mouth: o.mouth || 0, lite: S < 40, jitter: o.jitter || 0 });
  } });
  parts.sort((a, b) => b.d - a.d).forEach(p => p.draw());
  return J;
}
// smooth fleshy chain through world points: ink pass (r + outline) then skin pass, shaded from one side
function sgChain(g, cam, pts, rs, col = SG.skin, sh = SG.shade, o = {}) {
  const P = pts.map(p => proj(cam, ...p)); if (P.some(p => !p)) return; const C = [];
  for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], ra = rs[i] * a[2], rb = rs[i + 1] * b[2], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(d / Math.max(2, Math.min(ra, rb) * 0.35)));
    for (let k = 0; k < n; k++) { const u = k / n; C.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(ra, rb, u)]); } }
  const e = P[P.length - 1]; C.push([e[0], e[1], rs[rs.length - 1] * e[2]]);
  const ow = Math.max(1.5, (o.ow || 0.012) * P[0][2]);
  g.fillStyle = SG.ink; g.beginPath(); for (const c of C) { g.moveTo(c[0] + c[2] + ow, c[1]); g.arc(c[0], c[1], c[2] + ow, 0, TAU); } g.fill();
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const c of C) { x0 = Math.min(x0, c[0] - c[2]); y0 = Math.min(y0, c[1] - c[2]); x1 = Math.max(x1, c[0] + c[2]); y1 = Math.max(y1, c[1] + c[2]); }
  const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, col); gr.addColorStop(o.mid || 0.55, col); gr.addColorStop(1, sh);
  g.fillStyle = gr; g.beginPath(); for (const c of C) { g.moveTo(c[0] + c[2], c[1]); g.arc(c[0], c[1], c[2], 0, TAU); } g.fill();
  if (!o.noHi) { g.save(); g.beginPath(); for (const c of C) { g.moveTo(c[0] + c[2], c[1]); g.arc(c[0], c[1], c[2], 0, TAU); } g.clip(); g.fillStyle = 'rgba(255,255,245,0.10)'; g.beginPath(); for (const c of C) { g.moveTo(c[0] - c[2] * 0.25 + c[2] * 0.45, c[1] - c[2] * 0.35); g.arc(c[0] - c[2] * 0.25, c[1] - c[2] * 0.35, c[2] * 0.45, 0, TAU); } g.fill(); g.restore(); }
  return C;
}
function wKnobC(g, cam, p, r) { const q = proj(cam, ...p); if (!q) return; g.fillStyle = SG.shade; ell(g, q[0], q[1], r * q[2], r * q[2]); g.fill(); g.strokeStyle = SG.ink; g.lineWidth = Math.max(1, q[2] * 0.008); g.stroke(); }
// lit through a scratch layer. lo: {lit (0..1 cold lamp light), dark, fog, alpha, eyes (pinpoints stay visible)}
function sgSprite(o, lo = {}) {
  return { x: o.x, z: o.z + (lo.zBias || 0), always: lo.always, draw: (g, cam, E) => {
    const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H);
    const J = drawStillgrin(L.g, cam, E, o);
    const lit = lo.lit == null ? (E.lamp || 0) : lo.lit;
    L.g.save(); L.g.globalCompositeOperation = 'source-atop';
    const lp = proj(cam, ...GD.lamp); if (lp && lit > 0) { const gr = L.g.createRadialGradient(lp[0], lp[1], 0, lp[0], lp[1], 1400); gr.addColorStop(0, rgb([225, 235, 255], 0.14 * lit)); gr.addColorStop(1, rgb([225, 235, 255], 0)); L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H); }
    L.g.fillStyle = `rgba(6,8,20,${lerp(0.82, lo.dark == null ? 0.3 : lo.dark, lit)})`; L.g.fillRect(0, 0, W, H);
    const fk = fkz(E, cam, o.x, 1, o.z) * (lo.fogMul == null ? 0.5 : lo.fogMul); if (fk > 0) { L.g.fillStyle = rgb(E.P.fog, fk * 0.6); L.g.fillRect(0, 0, W, H); }
    L.g.restore();
    g.save(); if (lo.clipZ != null) { const q = proj(cam, o.x, 0, lo.clipZ); if (q) { g.beginPath(); g.rect(0, 0, W, q[1]); g.clip(); } } if (lo.alpha != null) g.globalAlpha = lo.alpha; g.drawImage(L.c, 0, 0); g.restore();
    // the pinpoint eyes stay visible even in the dark
    if (J && (lo.eyes == null || lo.eyes)) { const h = proj(cam, ...J.head); if (h) { const S = 0.74 * h[2] / 2.2; const ro = (o.headRoll || 0) * D2R; for (const sd of [-1, 1]) { const ex = sd * 0.3 * S, ey = -0.12 * S, x = h[0] + ex * Math.cos(ro) - ey * Math.sin(ro), y = h[1] + ex * Math.sin(ro) + ey * Math.cos(ro); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, Math.max(6, 0.18 * S), [230, 240, 255], 0.5 * (1 - lit * 0.5)); g.restore(); g.fillStyle = 'rgba(245,248,255,0.95)'; ell(g, x, y, Math.max(1.5, 0.035 * S), Math.max(1.5, 0.035 * S)); g.fill(); } } }
  } };
}
// ---------- the face (2D). S = px per head unit, head ~2.2 units tall ----------
function sgFace(g, cx, cy, S, o = {}) {
  const t = o.t || 0, m = o.mouth || 0, jit = o.jitter || 0, lite = o.lite, ow = Math.max(1.2, S * 0.03);
  g.save(); g.translate(cx + noise(t * 23) * jit * S * 0.03, cy + noise(t * 19 + 4) * jit * S * 0.02); g.rotate((o.rot || 0) + noise(t * 9) * jit * 0.05);
  // big bald skull, wide at the jaw, lumpy crown
  const skull = () => { g.beginPath(); g.moveTo(0, -S * 1.12); g.bezierCurveTo(S * 0.55, -S * 1.14, S * 0.86, -S * 0.82, S * 0.84, -S * 0.25); g.bezierCurveTo(S * 0.86, S * 0.25, S * 0.8, S * 0.72, S * 0.48, S * 0.98); g.quadraticCurveTo(0, S * 1.16, -S * 0.48, S * 0.98); g.bezierCurveTo(-S * 0.8, S * 0.72, -S * 0.86, S * 0.25, -S * 0.84, -S * 0.25); g.bezierCurveTo(-S * 0.86, -S * 0.82, -S * 0.55, -S * 1.14, 0, -S * 1.12); g.closePath(); };
  skull(); const fg = g.createLinearGradient(-S * 0.8, -S, S * 0.8, S); fg.addColorStop(0, '#cfccbf'); fg.addColorStop(0.55, '#a9a597'); fg.addColorStop(1, '#67645a');
  g.fillStyle = fg; g.fill(); g.strokeStyle = SG.ink; g.lineWidth = ow; g.stroke();
  g.save(); skull(); g.clip();
  const r = rng(55);
  if (o.back) { g.strokeStyle = 'rgba(90,76,60,0.6)'; g.lineWidth = Math.max(1, S * 0.015); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-S * 0.5 + i * S * 0.2, -S * 1.0); g.bezierCurveTo(-S * 0.2 + i * S * 0.1, -S * 0.5, -S * 0.4 + i * S * 0.16, 0, -S * 0.3 + i * S * 0.12, S * 0.6); g.stroke(); } g.fillStyle = 'rgba(30,24,20,0.35)'; ell(g, 0, S * 0.8, S * 0.7, S * 0.45); g.fill(); g.restore(); g.restore(); return; }
  // waxy blotches, veins on the scalp
  for (let i = 0; i < (lite ? 4 : 16); i++) { g.fillStyle = `rgba(${110 + r() * 40},${90 + r() * 30},${70},${0.1 + r() * 0.15})`; ell(g, (r() - 0.5) * S * 1.4, (r() - 0.6) * S * 1.9, S * (0.04 + r() * 0.12), S * (0.03 + r() * 0.08), r() * 3); g.fill(); }
  if (!lite) { g.strokeStyle = 'rgba(90,70,90,0.35)'; g.lineWidth = S * 0.012; for (let i = 0; i < 4; i++) { const x = (i - 1.5) * S * 0.25; g.beginPath(); g.moveTo(x, -S * 1.1); g.bezierCurveTo(x + S * 0.12, -S * 0.9, x - S * 0.1, -S * 0.8, x + S * 0.05, -S * 0.6); g.stroke(); } }
  // forehead creases
  g.strokeStyle = 'rgba(80,64,48,0.5)'; g.lineWidth = Math.max(1, S * 0.016); for (let i = 0; i < (lite ? 2 : 4); i++) { const y = -S * (0.85 - i * 0.11); g.beginPath(); g.moveTo(-S * 0.4, y + S * 0.03); g.quadraticCurveTo(0, y - S * 0.05, S * 0.4, y + S * 0.02); g.stroke(); }
  // deep black eye sockets (sunk, too close together) + cheek hollows
  for (const sd of [-1, 1]) {
    const sg = g.createRadialGradient(sd * S * 0.3, -S * 0.12, S * 0.05, sd * S * 0.3, -S * 0.12, S * 0.36); sg.addColorStop(0, 'rgba(6,4,4,1)'); sg.addColorStop(0.55, 'rgba(10,6,6,0.9)'); sg.addColorStop(1, 'rgba(30,22,16,0)'); g.fillStyle = sg; g.fillRect(-S, -S, 2 * S, 2 * S);
    const cg = g.createRadialGradient(sd * S * 0.5, S * 0.32, 0, sd * S * 0.5, S * 0.32, S * 0.35); cg.addColorStop(0, 'rgba(50,38,28,0.5)'); cg.addColorStop(1, 'rgba(50,38,28,0)'); g.fillStyle = cg; g.fillRect(-S, -S, 2 * S, 2 * S);
  }
  // side shading: cold from the lamp on one side, dark on the other
  const sh = g.createLinearGradient(-S * 0.85, 0, S * 0.85, 0); sh.addColorStop(0, 'rgba(210,225,255,0.18)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(10,8,20,0.45)'); g.fillStyle = sh; g.fillRect(-S, -S * 1.2, 2 * S, 2.4 * S);
  g.restore();
  // pinpoint pupils
  for (const sd of [-1, 1]) { g.fillStyle = '#f4f6ff'; ell(g, sd * S * 0.3, -S * 0.12, Math.max(1, S * 0.035), Math.max(1, S * 0.035)); g.fill(); }
  // nose: two wet slits
  g.fillStyle = '#2a1e18'; for (const sd of [-1, 1]) { ell(g, sd * S * 0.06, S * 0.2, S * 0.025, S * 0.055, sd * 0.3); g.fill(); }
  // THE GRIN: far too wide, corners pulled up toward the eyes; lips stretched thin; gums; rows of teeth
  const mw = S * (0.66 + m * 0.06), my = S * 0.5, up = S * 0.3, gap = S * (0.05 + m * 0.2);
  const lipTop = k => my - up * Math.pow(Math.abs(k), 2.2) - gap * (1 - k * k), lipBot = k => my - up * Math.pow(Math.abs(k), 2.6) * 0.9 + gap * (1 - k * k) + S * 0.1 * (1 - k * k);
  const mouth = () => { g.beginPath(); for (let i = 0; i <= 30; i++) { const k = -1 + i / 15; g.lineTo(k * mw, lipTop(k)); } for (let i = 30; i >= 0; i--) { const k = -1 + i / 15; g.lineTo(k * mw, lipBot(k)); } g.closePath(); };
  // stretched-skin creases radiating from the corners
  g.strokeStyle = 'rgba(70,54,40,0.65)'; g.lineWidth = Math.max(1, S * 0.014);
  for (const sd of [-1, 1]) for (let i = 0; i < (lite ? 2 : 4); i++) { const cx0 = sd * mw * 0.98, cy0 = lipTop(sd) + S * 0.02; g.beginPath(); g.moveTo(cx0, cy0); g.quadraticCurveTo(cx0 + sd * S * 0.08, cy0 - S * (0.05 + i * 0.05), cx0 + sd * S * (0.1 + i * 0.03), cy0 - S * (0.12 + i * 0.09)); g.stroke(); }
  mouth(); g.fillStyle = SG.gum; g.fill();
  g.save(); mouth(); g.clip();
  g.fillStyle = '#0a0304'; g.fillRect(-mw, my - gap * 0.6, 2 * mw, gap * 1.2 + S * 0.05);
  // upper + lower teeth: flat, human, too many, uneven
  const nT = lite ? 12 : 22;
  for (const row of [0, 1]) for (let i = 0; i < nT; i++) {
    const k0 = -1 + (i + 0.08) / nT * 2, k1 = -1 + (i + 0.92) / nT * 2, kc = (k0 + k1) / 2, tl = S * (0.1 + 0.05 * (1 - Math.abs(kc)) + hash(i * 3 + row) * 0.03);
    const y0 = row ? lipBot(kc) + S * 0.01 : lipTop(kc) - S * 0.01, y1 = row ? y0 - tl : y0 + tl;
    g.fillStyle = hash(i * 7 + row) < 0.15 ? '#b8a878' : SG.tooth; g.beginPath(); g.moveTo(k0 * mw, row ? lipBot(k0) + S * 0.01 : lipTop(k0) - S * 0.01); g.lineTo(k1 * mw, row ? lipBot(k1) + S * 0.01 : lipTop(k1) - S * 0.01); g.lineTo(k1 * mw - S * 0.004, y1); g.quadraticCurveTo(kc * mw, y1 + (row ? -1 : 1) * S * 0.015, k0 * mw + S * 0.004, y1); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,40,30,0.7)'; g.lineWidth = Math.max(1, S * 0.008); g.stroke();
  }
  g.restore();
  mouth(); g.strokeStyle = SG.ink; g.lineWidth = ow * 0.9; g.stroke();
  // thin pale lip rims
  g.strokeStyle = 'rgba(160,110,100,0.7)'; g.lineWidth = Math.max(1, S * 0.012); g.beginPath(); for (let i = 0; i <= 30; i++) { const k = -1 + i / 15; g.lineTo(k * mw, lipTop(k) - S * 0.012); } g.stroke();
  // drool
  if (m > 0.2 && !lite) { const dl = S * 0.35 * (0.8 + 0.2 * Math.sin(t * 2)); g.strokeStyle = 'rgba(210,215,220,0.5)'; g.lineWidth = Math.max(1, S * 0.012); g.beginPath(); g.moveTo(S * 0.2, lipBot(0.3)); g.quadraticCurveTo(S * 0.22, lipBot(0.3) + dl * 0.6, S * 0.19, lipBot(0.3) + dl); g.stroke(); }
  g.restore();
}

// =====================================================================
// THE CALLER: a 3.6 m grey thing that rings doorbells at 3 a.m.
// Long bent legs, a narrow ribbed torso, loose skin hanging from its arms like wet sheets,
// arms with one joint too many, and a neck of four segments that folds like a ladder,
// so it can lower its head to the height of a peephole. A small, wrinkled old face:
// four glossy black eyes, no nose, a round puckered mouth ringed with tiny teeth. It hunts by sound.
// =====================================================================
const CL = { skin: '#8f989c', shade: '#5f686e', dark: '#40474d', ink: '#0d0e13', web: 'rgba(70,76,80,0.82)', eyeGlint: [255, 236, 210] };
const V = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] };
// o: {x, z, floorY, yaw, lean, crouch, head:[x,y,z], headTurn, headRoll, tipR:[x,y,z], tipL, feet:{L,R}, mouth, curl, t, twitch}
function callerJoints(o) {
  const t = o.t || 0, yaw = (o.yaw || 0) * D2R, F = [Math.sin(yaw), 0, Math.cos(yaw)], X = [Math.cos(yaw), 0, -Math.sin(yaw)], U = [0, 1, 0];
  const fy = o.floorY == null ? 0 : o.floorY, base = [o.x, fy, o.z], cr = o.crouch || 0;
  const breathe = Math.sin(t * 1.7) * 0.015;
  const hip = V.add(base, [0, 1.72 - cr * 0.5 + (o.bob || 0), 0]);
  const lean = ((o.lean == null ? 18 : o.lean) + noise(t * 0.6) * 2 * (o.twitch == null ? 1 : o.twitch)) * D2R;
  const up = V.norm(V.add(V.mul(U, Math.cos(lean)), V.mul(F, Math.sin(lean))));
  const waist = V.add(V.add(hip, V.mul(up, 0.55)), V.mul(F, -0.06));
  const chest = V.add(V.add(hip, V.mul(up, 1.28 + breathe)), V.mul(F, 0.02));
  const J = { F, X, U, up, hip, waist, chest, base };
  J.sh = {}; for (const sd of [-1, 1]) J.sh[sd] = V.add(V.add(chest, V.mul(X, sd * 0.33)), V.mul(up, -0.05));
  // neck: 4 segments folding like a ladder toward the head target
  const nb = V.add(V.add(chest, V.mul(up, 0.12)), V.mul(F, 0.06)); let H = o.head || V.add(nb, V.add(V.mul(up, 1.35), V.mul(F, 0.6)));
  const seg = 0.47, Lt = seg * 4; let d = V.sub(H, nb), D = V.len(d); if (D > Lt * 0.995) { H = V.add(nb, V.mul(V.norm(d), Lt * 0.995)); d = V.sub(H, nb); D = V.len(d); }
  const u = V.norm(d); let n = V.sub(F, V.mul(u, V.dot(F, u))); if (V.len(n) < 0.15) n = V.sub(U, V.mul(u, V.dot(U, u))); n = V.norm(n);
  const A = Math.sqrt(Math.max(0, seg * seg - (D / 4) * (D / 4))) * 0.55;
  const fold = o.fold == null ? 1 : o.fold;
  J.neck = [nb]; for (let i = 1; i < 4; i++) J.neck.push(V.add(V.add(nb, V.mul(d, i / 4)), V.mul(n, (i % 2 ? 1 : -1) * A * fold + noise(t * 2 + i) * 0.015)));
  J.neck.push(H); J.head = H;
  // head facing
  const ht = (o.headTurn || 0) * D2R; J.HF = [F[0] * Math.cos(ht) + X[0] * Math.sin(ht), 0, F[2] * Math.cos(ht) + X[2] * Math.sin(ht)];
  // arms: shoulder -> elbow1 -> elbow2 -> wrist -> fingertips
  J.arm = {};
  for (const sd of [-1, 1]) {
    const Sh = J.sh[sd], tw = noise(t * 1.1 + sd * 3) * 0.05 * (o.twitch == null ? 1 : o.twitch);
    const tip = (sd > 0 ? o.tipR : o.tipL) || V.add(V.add(V.add(Sh, [0, -2.05, 0]), V.mul(F, 0.25 + tw)), V.mul(X, sd * (0.22 + tw)));
    const toT = V.norm(V.sub(tip, Sh)), wr = V.sub(tip, V.mul(toT, 0.55));
    const d1 = V.norm(V.add(V.add(V.lerp([0, -1, 0], V.norm(V.sub(wr, Sh)), 0.55), V.mul(X, sd * 0.35)), V.mul(F, -0.1)));
    const e1 = V.add(Sh, V.mul(d1, 0.62));
    const e2 = ik2(e1, wr, 0.62, 0.62, V.norm(V.add(V.mul(X, sd), V.mul(F, -0.6))));
    const wr2 = V.add(e2, V.mul(V.norm(V.sub(wr, e2)), 0.62));
    J.arm[sd] = { sh: Sh, e1, e2, wr: wr2, tip, dir: V.norm(V.sub(tip, wr2)) };
  }
  // legs
  J.leg = {};
  for (const sd of [-1, 1]) {
    const hp = V.add(hip, V.mul(X, sd * 0.17)), ft = (o.feet && o.feet[sd < 0 ? 'L' : 'R']) || V.add(V.add(base, V.mul(X, sd * 0.32)), V.mul(F, 0.05));
    const kn = ik2(hp, ft, 0.97, 0.97, V.norm(V.add(F, V.mul(X, sd * 0.25))));
    J.leg[sd] = { hp, kn, ft };
  }
  return J;
}
// small helpers in world space
function wLimb(g, cam, pts, wm, col = CL.skin, sh = CL.shade) {
  const P = pts.map(p => proj(cam, ...p)); if (P.some(p => !p)) return; const s = P.reduce((a, p) => a + p[2], 0) / P.length;
  limb(g, P.map(p => [p[0], p[1]]), Math.max(2, wm * s), col, CL.ink, sh, Math.max(1.2, s * 0.009));
}
// tapered limb through world points, widths in metres per point, one continuous inked shape
function wTaper(g, cam, pts, ws, col = CL.skin, sh = CL.shade) {
  const P = pts.map(p => proj(cam, ...p)); if (P.some(p => !p)) return; const Lp = [], Rp = [];
  for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; const nx = -ty / tl, ny = tx / tl, w = ws[i] * P[i][2] / 2; Lp.push([P[i][0] + nx * w, P[i][1] + ny * w]); Rp.push([P[i][0] - nx * w, P[i][1] - ny * w]); }
  const s0 = P[0][2], ow = Math.max(1.2, s0 * 0.008);
  g.beginPath(); g.moveTo(Lp[0][0], Lp[0][1]); for (let i = 1; i < Lp.length; i++) g.lineTo(Lp[i][0], Lp[i][1]);
  const e = P[P.length - 1], we = ws[ws.length - 1] * e[2] / 2; g.arc(e[0], e[1], we, Math.atan2(Lp[Lp.length - 1][1] - e[1], Lp[Lp.length - 1][0] - e[0]), Math.atan2(Rp[Rp.length - 1][1] - e[1], Rp[Rp.length - 1][0] - e[0]), false);
  for (let i = Rp.length - 1; i >= 0; i--) g.lineTo(Rp[i][0], Rp[i][1]);
  const b0 = P[0], wb = ws[0] * b0[2] / 2; g.arc(b0[0], b0[1], wb, Math.atan2(Rp[0][1] - b0[1], Rp[0][0] - b0[0]), Math.atan2(Lp[0][1] - b0[1], Lp[0][0] - b0[0]), false);
  g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = CL.ink; g.lineWidth = ow; g.lineJoin = 'round'; g.stroke();
  // shade stripe along one side
  g.save(); g.clip(); g.strokeStyle = sh; g.lineCap = 'round'; for (let i = 0; i < P.length - 1; i++) { g.lineWidth = Math.max(1, ws[i] * P[i][2] * 0.45); g.beginPath(); g.moveTo(Rp[i][0], Rp[i][1]); g.lineTo(Rp[i + 1][0], Rp[i + 1][1]); g.stroke(); } g.restore();
}
function wKnob(g, cam, p, r, col = CL.shade) { const q = proj(cam, ...p); if (!q) return; g.fillStyle = col; ell(g, q[0], q[1], r * q[2], r * q[2]); g.fill(); g.strokeStyle = CL.ink; g.lineWidth = Math.max(1, q[2] * 0.008); g.stroke(); }
function camFacing(cam, p, dir) { const c = [cam.x, cam.y, cam.z]; return V.dot(V.sub(c, p), dir) > 0; }
// a long finger with knuckles (world points) + dark nail
function wFinger(g, cam, pts, w) {
  const P = pts.map(p => proj(cam, ...p)); if (P.some(p => !p)) return; const s = P[0][2];
  wTaper(g, cam, pts, pts.map((_, i) => w * [1.15, 0.95, 0.8, 0.55, 0.5][Math.min(i, 4)]));
  g.strokeStyle = 'rgba(30,32,36,0.55)'; g.lineWidth = Math.max(1, s * 0.003);
  for (let i = 1; i < P.length - 1; i++) { const a = P[i - 1], b = P[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2, r = w * 0.45 * P[i][2]; for (const o of [-0.3, 0.3]) { const cx = P[i][0] + Math.cos(ang - Math.PI / 2) * r * o, cy = P[i][1] + Math.sin(ang - Math.PI / 2) * r * o; g.beginPath(); g.moveTo(cx - Math.cos(ang) * r, cy - Math.sin(ang) * r); g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); g.stroke(); } }
  const a = P[P.length - 2], b = P[P.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]); g.save(); g.translate(b[0], b[1]); g.rotate(ang); g.fillStyle = '#2a2622'; g.strokeStyle = CL.ink; g.lineWidth = Math.max(1, s * 0.003); ell(g, -w * 0.1 * b[2], 0, w * 0.45 * b[2], w * 0.26 * b[2]); g.fill(); g.stroke(); g.restore();
}
function callerHand(g, cam, J, A, sd, o) {
  const d = A.dir, X = J.X, side = V.norm(V.cross(d, [0, 1, 0.001])), curl = o.curl == null ? 0.25 : o.curl, t = o.t || 0;
  const palm = V.add(A.wr, V.mul(d, 0.17));
  wLimb(g, cam, [A.wr, palm], 0.085);
  const n = V.norm(V.cross(side, d));
  for (let f = 0; f < 4; f++) {
    const sp = (f - 1.5) * 0.11, fd = V.norm(V.add(d, V.mul(side, sp))), b = V.add(palm, V.mul(side, (f - 1.5) * 0.025));
    const tw = Math.sin(t * 5 + f * 1.9 + sd) * 0.12 * (o.twitch == null ? 1 : o.twitch), L = f === 1 || f === 2 ? 0.4 : 0.32;
    const k1 = V.add(b, V.mul(fd, L * 0.4)), fd2 = V.norm(V.add(fd, V.mul(n, curl + tw))), k2 = V.add(k1, V.mul(fd2, L * 0.33)), fd3 = V.norm(V.add(fd2, V.mul(n, curl + tw))), k3 = V.add(k2, V.mul(fd3, L * 0.27));
    const pts = f === 1 && o.pointR && sd > 0 ? [b, V.lerp(b, A.tip, 0.4), V.lerp(b, A.tip, 0.72), A.tip] : [b, k1, k2, k3];
    wFinger(g, cam, pts, 0.026);
  }
}
// draws the whole creature into g (world space); returns joints
function drawCaller(g, cam, E, o) {
  const J = callerJoints(o), t = o.t || E.t;
  const back = !camFacing(cam, J.chest, J.F), parts = [];
  const dep = p => camSpace(cam, ...p)[2];
  // contact shadows under the feet
  for (const sd of [-1, 1]) { const f = J.leg[sd].ft, q = proj(cam, f[0], (o.floorY || 0) + 0.002, f[2]); if (q) { g.fillStyle = 'rgba(0,0,0,0.5)'; ell(g, q[0], q[1], 0.3 * q[2], 0.06 * q[2]); g.fill(); } }
  for (const sd of [-1, 1]) {
    const L = J.leg[sd];
    parts.push({ d: dep(L.kn) + 0.01, draw: () => {
      wTaper(g, cam, [L.hp, V.lerp(L.hp, L.kn, 0.35), V.lerp(L.hp, L.kn, 0.8), L.kn, V.lerp(L.kn, L.ft, 0.3), V.lerp(L.kn, L.ft, 0.85), L.ft], [0.17, 0.15, 0.09, 0.1, 0.085, 0.055, 0.06]); wKnob(g, cam, V.add(L.kn, V.mul(J.F, 0.03)), 0.045, CL.skin);
      const fw = V.norm([J.F[0], 0, J.F[2]]), toe = V.add(L.ft, V.mul(fw, 0.38)), heel = V.add(L.ft, V.mul(fw, -0.08)), sdv = V.mul(J.X, 0.06);
      const fp = projPoly(cam, [V.add(heel, sdv), V.add(toe, V.mul(sdv, 1.4)), V.add(toe, V.mul(sdv, -1.4)), V.sub(heel, sdv)].map(p => [p[0], Math.max(p[1], (o.floorY || 0) + 0.005), p[2]]));
      if (fp.length > 2) { g.fillStyle = CL.shade; g.strokeStyle = CL.ink; g.lineWidth = lwAt(cam, fp); g.beginPath(); polyPath(g, fp); g.fill(); g.stroke(); }
      for (let k = -2; k <= 2; k++) { const tb = V.add(toe, V.mul(J.X, k * 0.035)), te = V.add(tb, V.mul(fw, 0.1)); wLimb(g, cam, [[tb[0], (o.floorY || 0) + 0.02, tb[2]], [te[0], (o.floorY || 0) + 0.012, te[2]]], 0.025); }
    } });
    const A = J.arm[sd];
    parts.push({ d: dep(A.e2) - 0.02, draw: () => {
      // loose skin hanging between the upper arm and the flank
      const sw = Math.sin(t * 1.3 + sd) * 0.05, dn = [0, -1, 0], hang = k => V.add(V.add(V.lerp(A.sh, A.e2, k), V.mul(dn, 0.28 + 0.22 * Math.sin(k * Math.PI))), V.add(V.mul(J.F, sw * k), V.mul(J.X, sd * 0.02)));
      const edge = []; for (let i = 0; i <= 8; i++) { const k = i / 8, p = hang(k); edge.push(V.add(p, [0, (i % 2) * 0.07 + Math.sin(t * 2.1 + i + sd) * 0.02, 0])); }
      const web = projPoly(cam, [A.sh, A.e1, A.e2, ...edge.reverse()]);
      if (web.length > 2) { g.fillStyle = CL.web; g.strokeStyle = CL.ink; g.lineWidth = lwAt(cam, web) * 0.8; g.beginPath(); polyPath(g, web); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(30,34,38,0.55)'; for (let k = 1; k < 5; k++) { const a = proj(cam, ...V.lerp(A.sh, A.e2, k / 5)), b = proj(cam, ...hang(k / 5)); if (a && b) { g.lineWidth = Math.max(1, a[2] * 0.006); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(a[0] + 4, (a[1] + b[1]) / 2, b[0], b[1]); g.stroke(); } } }
      wTaper(g, cam, [A.sh, V.lerp(A.sh, A.e1, 0.4), A.e1, V.lerp(A.e1, A.e2, 0.5), A.e2, V.lerp(A.e2, A.wr, 0.5), A.wr], [0.13, 0.095, 0.06, 0.065, 0.05, 0.055, 0.04]);
      
      callerHand(g, cam, J, A, sd, o);
    } });
  }
  parts.push({ d: dep(J.waist), draw: () => {
    wLimb(g, cam, [J.leg[-1].hp, J.leg[1].hp], 0.17, CL.shade, CL.dark);
    const X = J.X, up = J.up, at = (b, x, u, f = 0) => V.add(V.add(V.add(b, V.mul(X, x)), V.mul(up, u)), V.mul(J.F, f));
    const br = 1 + Math.sin(t * 1.7) * 0.03, side = sd => [at(J.chest, sd * 0.36, -0.02), at(J.chest, sd * 0.27 * br, -0.25), at(J.chest, sd * 0.25 * br, -0.48), at(J.waist, sd * 0.13, 0.12), at(J.waist, sd * 0.1, -0.1), at(J.hip, sd * 0.2, 0.05), at(J.hip, sd * 0.16, -0.12)];
    const L = side(-1), R = side(1).reverse(), top = [at(J.chest, 0.12, 0.12), at(J.chest, -0.12, 0.12)];
    const tsp = projPoly(cam, [...top, ...L, ...R]);
    if (tsp.length > 2) { g.beginPath(); polyPath(g, tsp); const c0 = proj(cam, ...at(J.chest, -0.3, 0)), c1 = proj(cam, ...at(J.chest, 0.3, 0)); const gr = c0 && c1 ? g.createLinearGradient(c0[0], c0[1], c1[0], c1[1]) : null; if (gr) { gr.addColorStop(0, CL.skin); gr.addColorStop(1, CL.shade); } g.fillStyle = gr || CL.skin; g.fill(); g.strokeStyle = CL.ink; g.lineWidth = lwAt(cam, tsp); g.lineJoin = 'round'; g.stroke();
      // sunken belly shadow under the ribcage
      const bs = projPoly(cam, [at(J.chest, -0.22, -0.5), at(J.chest, 0.22, -0.5), at(J.waist, 0.1, 0.0), at(J.waist, -0.1, 0.0)]); if (bs.length > 2) { g.fillStyle = 'rgba(30,34,40,0.35)'; g.beginPath(); polyPath(g, bs); g.fill(); } }
    // ribs (front) or spine knobs (back)
    if (!back) { for (let i = 0; i < 6; i++) { const c = V.lerp(J.waist, J.chest, 0.45 + i * 0.1); for (const sd of [-1, 1]) { const a = proj(cam, ...V.add(c, V.mul(J.X, sd * 0.03))), b = proj(cam, ...V.add(V.add(c, V.mul(J.X, sd * (0.17 + i * 0.012))), [0, -0.07, 0])); if (a && b) { g.strokeStyle = 'rgba(60,64,66,0.75)'; g.lineWidth = Math.max(1, a[2] * 0.012); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], a[1], b[0], b[1]); g.stroke(); } } }
      const nv = proj(cam, ...V.lerp(J.hip, J.waist, 0.6)); if (nv) { g.fillStyle = 'rgba(40,44,46,0.7)'; ell(g, nv[0], nv[1], 0.015 * nv[2], 0.02 * nv[2]); g.fill(); } }
    else { for (let i = 0; i < 11; i++) wKnob(g, cam, V.add(V.lerp(J.hip, J.chest, i / 10), V.mul(J.F, -0.1)), 0.017, CL.shade); for (const sd of [-1, 1]) { const a = proj(cam, ...V.add(V.add(J.chest, V.mul(J.X, sd * 0.08)), V.mul(J.up, -0.05))), b = proj(cam, ...V.add(V.add(J.chest, V.mul(J.X, sd * 0.24)), V.mul(J.up, -0.4))); if (a && b) { g.strokeStyle = 'rgba(30,34,40,0.6)'; g.lineWidth = Math.max(1, a[2] * 0.012); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], a[1], b[0], b[1]); g.stroke(); } } }
  } });
  // neck + head
  parts.push({ d: Math.min(...J.neck.map(dep)) - 0.05, draw: () => {
    for (let i = 0; i < 4; i++) wTaper(g, cam, [J.neck[i], V.lerp(J.neck[i], J.neck[i + 1], 0.5), J.neck[i + 1]], [0.1 - i * 0.008, 0.07 - i * 0.005, 0.09 - i * 0.008]);
    for (let i = 1; i < 4; i++) { wKnob(g, cam, J.neck[i], 0.055, CL.shade); const q = proj(cam, ...J.neck[i]); if (q) { g.strokeStyle = 'rgba(30,32,36,0.7)'; g.lineWidth = Math.max(1, q[2] * 0.008); ell(g, q[0], q[1], 0.04 * q[2], 0.04 * q[2]); g.stroke(); } }
    const h = proj(cam, ...J.head); if (!h) return;
    const front = camFacing(cam, J.head, J.HF), S = 0.4 * h[2] / 2.2;
    // which way the neck enters the head on screen (head roll follows the top neck segment)
    const nk = proj(cam, ...J.neck[3]); const ang = nk ? Math.atan2(h[0] - nk[0], -(h[1] - nk[1])) : 0;
    callerFace(g, h[0], h[1], S, { t, back: !front, rot: (o.headRoll || 0) * D2R + (o.followNeck ? ang : 0), mouth: o.mouth || 0, lite: S < 40, look: o.look || 0, neckOff: true });
  } });
  parts.sort((a, b) => b.d - a.d).forEach(p => p.draw());
  return J;
}
// lit through a scratch layer: dark night tint + warm lantern light from screen x = lightX
function callerSprite(o, lo = {}) {
  return { x: o.x, z: o.z + (lo.zBias || 0), always: lo.always, draw: (g, cam, E) => {
    const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H);
    const J = drawCaller(L.g, cam, E, o);
    L.g.save(); L.g.globalCompositeOperation = 'source-atop';
    const lx = lo.lightX == null ? 0 : lo.lightX, wk = lo.warm == null ? 0.3 : lo.warm;
    const gr = L.g.createLinearGradient(lx, lo.lightY || 0, lx < W / 2 ? lx + 900 : lx - 900, lo.lightY || 0); gr.addColorStop(0, rgb([255, 180, 110], wk)); gr.addColorStop(1, rgb([255, 180, 110], 0)); L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H);
    L.g.fillStyle = `rgba(8,10,22,${lo.dark == null ? 0.4 : lo.dark})`; L.g.fillRect(0, 0, W, H);
    if (lo.fog) { L.g.fillStyle = rgb(E.P.fog, lo.fog); L.g.fillRect(0, 0, W, H); }
    L.g.restore();
    g.save(); if (lo.alpha != null) g.globalAlpha = lo.alpha; g.drawImage(L.c, 0, 0); g.restore();
    // eye glints stay bright
    if (J && camFacing(cam, J.head, J.HF) && (lo.glint == null || lo.glint)) { const h = proj(cam, ...J.head); if (h) { const S = 0.4 * h[2] / 2.2; for (const sd of [-1, 1]) { g.fillStyle = 'rgba(255,240,220,0.9)'; ell(g, h[0] + sd * 0.33 * S - 0.05 * S, h[1] - 0.2 * S, Math.max(1, 0.05 * S), Math.max(1, 0.05 * S)); g.fill(); } } }
  } };
}
// ---------- the face (2D). S = px per head unit, head is ~2.2 units tall ----------
function callerFace(g, cx, cy, S, o = {}) {
  const t = o.t || 0, m = o.mouth || 0, jit = o.jitter || 0, lite = o.lite;
  g.save(); g.translate(cx + noise(t * 23) * jit * S * 0.03, cy + noise(t * 19 + 4) * jit * S * 0.02); g.rotate((o.rot || 0) + (o.tilt || 0) * D2R + noise(t * 9) * jit * 0.05);
  const ow = Math.max(1.2, S * 0.03);
  // the neck below (big close-ups): a knobbly segment
  if (!o.neckOff) { g.fillStyle = CL.shade; g.strokeStyle = CL.ink; g.lineWidth = ow; g.beginPath(); g.moveTo(-S * 0.26, S * 0.8); g.quadraticCurveTo(-S * 0.2, S * 2, -S * 0.3, S * 3.4); g.lineTo(S * 0.3, S * 3.4); g.quadraticCurveTo(S * 0.2, S * 2, S * 0.26, S * 0.8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = CL.dark; ell(g, 0, S * 2.3, S * 0.36, S * 0.2); g.fill(); g.stroke(); g.strokeStyle = 'rgba(20,22,26,0.6)'; g.lineWidth = ow * 0.6; for (const y of [1.3, 1.7, 2.9]) { g.beginPath(); g.moveTo(-S * 0.2, S * y); g.quadraticCurveTo(0, S * (y + 0.06), S * 0.2, S * y); g.stroke(); } }
  // long wet hair strands behind
  g.strokeStyle = '#121215'; g.lineCap = 'round'; const nh = lite ? 7 : 22;
  for (let i = 0; i < nh; i++) { const k = i / (nh - 1), x0 = lerp(-0.6, 0.6, k) * S, sw = Math.sin(t * 1.1 + i * 0.7) * 0.07 * S, len = 1.0 + hash(i * 1.3) * 0.9; g.lineWidth = Math.max(1, S * (0.012 + hash(i) * 0.014)); g.beginPath(); g.moveTo(x0 * 0.8, -S * 0.95); g.bezierCurveTo(x0 * 1.3, -S * 0.4, x0 * 1.3 + sw, S * 0.4, x0 * 1.15 + sw * 2, S * len); g.stroke(); }
  // skull: high domed forehead, hollow temples, long narrow chin
  const skull = () => { g.beginPath(); g.moveTo(0, -S * 1.12); g.bezierCurveTo(S * 0.74, -S * 1.12, S * 0.74, -S * 0.45, S * 0.6, -S * 0.1); g.bezierCurveTo(S * 0.66, S * 0.2, S * 0.5, S * 0.7, S * 0.22, S * 1.05); g.quadraticCurveTo(0, S * 1.16, -S * 0.22, S * 1.05); g.bezierCurveTo(-S * 0.5, S * 0.7, -S * 0.66, S * 0.2, -S * 0.6, -S * 0.1); g.bezierCurveTo(-S * 0.74, -S * 0.45, -S * 0.74, -S * 1.12, 0, -S * 1.12); g.closePath(); };
  skull(); const fg = g.createLinearGradient(-S * 0.7, -S, S * 0.7, S); fg.addColorStop(0, '#b7bcb9'); fg.addColorStop(0.55, '#949a98'); fg.addColorStop(1, '#5f6665');
  g.fillStyle = fg; g.fill(); g.strokeStyle = CL.ink; g.lineWidth = ow; g.stroke();
  g.save(); skull(); g.clip();
  const r = rng(77);
  if (o.back) {   // back of the head: bald, veins, strands
    g.strokeStyle = 'rgba(60,66,74,0.6)'; g.lineWidth = Math.max(1, S * 0.015); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-S * 0.35 + i * S * 0.17, -S * 0.95); g.bezierCurveTo(-S * 0.1 + i * S * 0.1, -S * 0.5, -S * 0.3 + i * S * 0.16, -S * 0.1, -S * 0.2 + i * S * 0.12, S * 0.5); g.stroke(); }
    g.fillStyle = 'rgba(20,24,30,0.4)'; ell(g, 0, S * 0.8, S * 0.6, S * 0.45); g.fill(); g.restore(); g.restore(); return;
  }
  // blotches + veins under thin skin
  for (let i = 0; i < (lite ? 4 : 14); i++) { g.fillStyle = `rgba(${60 + r() * 30},${56 + r() * 20},${60},${0.12 + r() * 0.15})`; ell(g, (r() - 0.5) * S * 1.2, (r() - 0.55) * S * 1.9, S * (0.04 + r() * 0.12), S * (0.03 + r() * 0.09), r() * 3); g.fill(); }
  if (false) { g.strokeStyle = 'rgba(70,80,110,0.35)'; g.lineWidth = S * 0.01; for (let i = 0; i < 3; i++) { const x = (i - 1) * S * 0.25; g.beginPath(); g.moveTo(x, -S * 1.05); g.bezierCurveTo(x + S * 0.1, -S * 0.85, x - S * 0.08, -S * 0.75, x + S * 0.05, -S * 0.55); g.stroke(); } }
  // irregular wrinkles: forehead, under the eyes, around the mouth
  g.strokeStyle = 'rgba(40,44,46,0.55)'; g.lineWidth = Math.max(1, S * 0.016);
  g.strokeStyle = 'rgba(40,44,46,0.4)'; for (let i = 0; i < (lite ? 2 : 4); i++) { const y = -S * (0.84 - i * 0.12), x0 = -S * (0.1 + r() * 0.35), x1 = x0 + S * (0.2 + r() * 0.35); g.beginPath(); g.moveTo(x0, y + S * 0.03); g.quadraticCurveTo((x0 + x1) / 2, y - S * 0.04, x1, y + r() * S * 0.03); g.stroke(); }
  // deep hollow cheeks + sockets
  for (const sd of [-1, 1]) {
    const cg = g.createRadialGradient(sd * S * 0.36, S * 0.45, 0, sd * S * 0.36, S * 0.45, S * 0.38); cg.addColorStop(0, 'rgba(20,24,30,0.55)'); cg.addColorStop(1, 'rgba(20,24,30,0)'); g.fillStyle = cg; g.fillRect(-S, -S, 2 * S, 2.2 * S);
    const sg = g.createRadialGradient(sd * S * 0.3, -S * 0.2, S * 0.12, sd * S * 0.3, -S * 0.2, S * 0.42); sg.addColorStop(0, 'rgba(14,14,20,0.85)'); sg.addColorStop(1, 'rgba(14,14,20,0)'); g.fillStyle = sg; g.fillRect(-S, -S, 2 * S, 2 * S);
    if (!lite) for (let j = 0; j < 1; j++) { g.beginPath(); g.moveTo(sd * S * (0.14 + j * 0.06), S * (0.06 + j * 0.05)); g.quadraticCurveTo(sd * S * (0.3 + j * 0.04), S * (0.13 + j * 0.06), sd * S * (0.48 - j * 0.02), S * (0.02 + j * 0.06)); g.stroke(); }
  }
  // shading: lit side warm, far side cold dark
  const sh = g.createLinearGradient(-S * 0.7, 0, S * 0.7, 0); sh.addColorStop(0, `rgba(255,190,120,${0.22 * (o.rim == null ? 1 : o.rim)})`); sh.addColorStop(0.45, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(8,12,24,0.5)'); g.fillStyle = sh; g.fillRect(-S, -S * 1.2, 2 * S, 2.4 * S);
  g.restore();
  // four eyes: two big, wet, pitch black; two small ones lower on the cheeks, out of line
  const eye = (ex, ey, rx, ry, lid) => {
    g.fillStyle = '#020203'; ell(g, ex, ey, rx, ry); g.fill(); g.strokeStyle = 'rgba(70,40,40,0.8)'; g.lineWidth = Math.max(1, rx * 0.1); g.stroke();
    const lk = (o.look || 0) * rx * 0.2; g.fillStyle = 'rgba(255,244,230,0.95)'; ell(g, ex - rx * 0.3 + lk, ey - ry * 0.35, rx * 0.09, rx * 0.09); g.fill();
    g.fillStyle = 'rgba(160,180,220,0.35)'; ell(g, ex + rx * 0.25 + lk, ey + ry * 0.4, rx * 0.3, ry * 0.08); g.fill();
    if (lid) { g.fillStyle = '#7d8483'; g.beginPath(); g.ellipse(ex, ey - ry * 0.25, rx * 1.08, ry * 0.8, 0, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill(); g.strokeStyle = CL.ink; g.lineWidth = Math.max(1, rx * 0.12); g.stroke(); }
  };
  // heavy brow folds pressing down on the big eyes (angled in: it is not friendly)
  for (const sd of [-1, 1]) { g.strokeStyle = 'rgba(30,32,36,0.8)'; g.lineWidth = Math.max(1.5, S * 0.03); g.beginPath(); g.moveTo(sd * S * 0.1, -S * 0.36); g.quadraticCurveTo(sd * S * 0.3, -S * 0.5, sd * S * 0.52, -S * 0.42); g.stroke(); }
  eye(-S * 0.3, -S * 0.18, S * 0.19, S * 0.22, 0); eye(S * 0.31, -S * 0.16, S * 0.2, S * 0.23, 0);
  eye(-S * 0.43, S * 0.2, S * 0.07, S * 0.065, 0); eye(S * 0.46, S * 0.24, S * 0.085, S * 0.075, 0);
  // no nose: two slits
  g.strokeStyle = '#1e2024'; g.lineWidth = Math.max(1, S * 0.025); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * S * 0.04, S * 0.24); g.lineTo(sd * S * 0.075, S * 0.38); g.stroke(); }
  // the round puckered mouth: radial lip folds, a dark hole ringed with tiny hooked teeth
  const mr = S * (0.09 + m * 0.21), my = S * 0.7;
  g.strokeStyle = 'rgba(40,42,46,0.7)'; g.lineWidth = Math.max(1, S * 0.016);
  for (let i = 0; i < (lite ? 8 : 18); i++) { const a = i / (lite ? 8 : 18) * TAU; g.beginPath(); g.moveTo(Math.cos(a) * mr * 1.2, my + Math.sin(a) * mr * 1.1); g.lineTo(Math.cos(a) * (mr + S * 0.16), my + Math.sin(a) * (mr * 0.9 + S * 0.14)); g.stroke(); }
  g.fillStyle = '#6e5c5e'; ell(g, 0, my, mr * 1.28, mr * 1.18); g.fill(); g.strokeStyle = CL.ink; g.lineWidth = ow * 0.8; g.stroke();
  g.fillStyle = '#050304'; ell(g, 0, my, mr, mr * 0.92); g.fill();
  if (!lite || m > 0.3) for (const [rk, n, tl] of [[1, 20, 0.34], [0.6, 13, 0.32]]) for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rk, R = mr * rk, bx = Math.cos(a) * R, by = my + Math.sin(a) * R * 0.92, tx = Math.cos(a + 0.12) * R * (1 - tl), ty = my + Math.sin(a + 0.12) * R * 0.92 * (1 - tl), px = -Math.sin(a) * R * 0.08, py = Math.cos(a) * R * 0.08;
    g.fillStyle = '#c4b998'; g.beginPath(); g.moveTo(bx - px * 0.7, by - py * 0.7); g.lineTo(tx, ty); g.lineTo(bx + px * 0.7, by + py * 0.7); g.closePath(); g.fill(); }
  if (m > 0.2) { g.fillStyle = 'rgba(90,10,18,0.65)'; ell(g, 0, my, mr * 0.32, mr * 0.3); g.fill(); }
  // a few wet strands hanging over the forehead and one eye
  g.strokeStyle = 'rgba(14,14,18,0.9)'; g.lineCap = 'round';
  for (const [i, x0k, end] of [[0, -0.42, -0.35], [1, -0.3, -0.05], [2, 0.18, -0.55], [3, 0.4, -0.2]]) { if (lite && i % 2) continue; const x0 = S * x0k, sw = Math.sin(t * 0.9 + i) * 0.03 * S; g.lineWidth = Math.max(1, S * 0.01); g.beginPath(); g.moveTo(x0 * 0.7, -S * 1.08); g.bezierCurveTo(x0 + S * 0.08, -S * 0.8, x0 - S * 0.08 + sw, -S * 0.5, x0 + sw * 1.5, S * end); g.stroke(); }
  // a thread of drool
  if (o.drool) { const dl = S * 0.5 * o.drool * (0.8 + 0.2 * Math.sin(t * 2)); g.strokeStyle = 'rgba(200,210,220,0.55)'; g.lineWidth = Math.max(1, S * 0.012); g.beginPath(); g.moveTo(S * 0.05, my + mr); g.quadraticCurveTo(S * 0.07, my + mr + dl * 0.6, S * 0.04, my + mr + dl); g.stroke(); }
  g.restore();
}

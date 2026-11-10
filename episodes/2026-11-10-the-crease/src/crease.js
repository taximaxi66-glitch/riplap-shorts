// =====================================================================
// THE CREASE: a paper-thin, folded grey humanoid. Every part of it lies in one flat sheet:
// seen from the side it almost disappears. Broad hanger shoulders, torn edges, crease lines,
// long flat strip-fingers, a long folded face with eyes that shine in light, a slit mouth.
// =====================================================================
const CR = { skin: '#cfcabd', shade: '#9a9588', dark: '#6e6a60', ink: '#0d0c10', crease: 'rgba(60,56,50,0.55)', eye: [214, 236, 120] };
const v3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)] };
// o: {x, z, yaw, legA, torsoA, headA, headRoll, armAbs (L/R), armSpread, elbow, hipH, feetW:{L,R}, clampZ, mouth, t}
function creaseJoints(o) {
  const yaw = o.yaw || 0, c = Math.cos(yaw * D2R), s = Math.sin(yaw * D2R);
  const Wd = l => [l[0] * c + l[2] * s, l[1], -(-l[0] * s + l[2] * c)];          // local dir -> world dir
  const Wp = l => { const d = Wd(l); return [o.x + d[0], d[1], o.z + d[2]]; };
  const dir = a => [0, Math.cos(a * D2R), Math.sin(a * D2R)];                      // sagittal: 0 up, 90 forward
  const X = Wd([1, 0, 0]);
  const legA = o.legA || 0, ta = o.torsoA || 0, hipH = o.hipH || 1.25;
  const hipL = v3.mul(dir(legA), hipH);
  const J = { X, F: Wd([0, 0, 1]) };
  J.hip = Wp(hipL);
  J.U = Wd(dir(ta));                         // torso up direction
  J.N = v3.norm(v3.cross(X, J.U));           // sheet normal
  const P = (base, a, d) => v3.add(base, v3.mul(Wd(dir(a)), d));
  J.waist = P(J.hip, ta, 0.36); J.chest = P(J.hip, ta, 1.0); J.neck = P(J.chest, ta, 0.04);
  const ha = ta + (o.headA || 0); J.neckTop = P(J.neck, ha, 0.2);
  // head frame inside the sheet, rolled
  const r = (o.headRoll || 0) * D2R, hu = Wd(dir(ha)), hx = X;
  J.hu = v3.norm(v3.add(v3.mul(hu, Math.cos(r)), v3.mul(hx, Math.sin(r)))); J.hx = v3.norm(v3.sub(v3.mul(hx, Math.cos(r)), v3.mul(hu, Math.sin(r))));
  J.head = v3.add(J.neckTop, v3.mul(J.hu, 0.26));
  // shoulders: very broad, drooping ends
  J.sh = {}; J.arm = {};
  for (const sd of [-1, 1]) {
    J.sh[sd] = v3.add(v3.add(J.chest, v3.mul(X, sd * 0.56)), v3.mul(J.U, -0.1));
    const aa = (o.armAbs && o.armAbs[sd] != null ? o.armAbs[sd] : (o.armAbsAll != null ? o.armAbsAll : ta + 180)), sp = ((o.armSpread == null ? 8 : o.armSpread) + (o.armSpreadD ? o.armSpreadD[sd] : 0)) * D2R;
    const ad = v3.norm(v3.add(v3.mul(Wd(dir(aa)), Math.cos(sp)), v3.mul(X, sd * Math.sin(sp))));
    const el = v3.add(J.sh[sd], v3.mul(ad, 0.8));
    const eb = ((o.elbow == null ? 12 : o.elbow) + (o.elbowD ? o.elbowD[sd] : 0)) * D2R;
    const fd = v3.norm(v3.add(v3.mul(ad, Math.cos(eb)), v3.mul(v3.cross(J.N, ad), -sd * Math.sin(eb) * (o.elbowIn == null ? 1 : o.elbowIn))));
    const wr = v3.add(el, v3.mul(fd, 0.78));
    J.arm[sd] = { sh: J.sh[sd], el, wr, d: fd };
  }
  // legs
  J.leg = {};
  for (const sd of [-1, 1]) {
    const hp = v3.add(J.hip, v3.mul(X, sd * 0.16));
    let ft = o.feetW ? o.feetW[sd < 0 ? 'L' : 'R'] : Wp([sd * 0.24, 0, 0]);
    const hint = v3.add(v3.mul(X, sd * 0.6), Wd([0, 0, 1]));
    const kn = (legA > 45 || o.flatLegs) ? v3.lerp(hp, ft, 0.5) : ik2(hp, ft, 0.68, 0.68, hint);
    J.leg[sd] = { hp, kn, ft };
  }
  if (o.clampZ != null) {   // squeezed through the gap: nothing passes the door plane
    const cl = p => { if (p[2] > o.clampZ) { p[2] = o.clampZ; p[1] = Math.min(p[1], 0.02); } };
    const walk = v => { if (Array.isArray(v) && typeof v[0] === 'number') cl(v); else if (v && typeof v === 'object') for (const k in v) if (!['X', 'U', 'N', 'hu', 'hx', 'd', 'F'].includes(k)) walk(v[k]); };
    walk(J);
  }
  return J;
}
// a flat strip through world points, its width lying in the sheet (plane normal n)
function stripPts(pts, ws, n) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let d = v3.norm(v3.sub(b, a));
    let w = v3.cross(n, d); if (v3.len(w) < 1e-3) w = [1, 0, 0]; w = v3.norm(w);
    L.push(v3.add(pts[i], v3.mul(w, ws[i] / 2))); R.push(v3.sub(pts[i], v3.mul(w, ws[i] / 2)));
  }
  return L.concat(R.reverse());
}
let CR_CLAMP = null;
function crPoly(g, cam, pts, fill, lw) { if (CR_CLAMP != null && pts.every(p => p[2] >= CR_CLAMP - 0.03)) return null; const sp = projPoly(cam, pts); if (sp.length < 3) return null; g.beginPath(); polyPath(g, sp); g.fillStyle = fill; g.fill(); g.strokeStyle = CR.ink; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); return sp; }
function crLine(g, cam, a, b, col, lw) { const p = proj(cam, ...a), q = proj(cam, ...b); if (!p || !q) return; g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
function creaseBack(cam, J) { const d = v3.sub([cam.x, cam.y, cam.z], J.head); return d[0] * J.F[0] + d[2] * J.F[2] < 0; }
// the whole creature into the current context (world space)
function drawCrease(g, cam, E, o) {
  const J = creaseJoints(o), t = o.t || E.t; CR_CLAMP = o.clampZ == null ? null : o.clampZ;
  const pc = proj(cam, ...J.chest); if (!pc) return J;
  const lw = clamp(pc[2] * 0.008, 1.5, 7), n = J.N;
  J.back = creaseBack(cam, J);
  // contact shadows
  const sq = p => o.clampZ != null && p[2] >= o.clampZ - 0.02;
  for (const sd of [-1, 1]) { const f = proj(cam, J.leg[sd].ft[0], 0.002, J.leg[sd].ft[2]); if (f && J.leg[sd].ft[1] < 0.2 && !sq(J.leg[sd].ft)) { g.fillStyle = `rgba(0,0,0,${0.45 * (1 - J.leg[sd].ft[1] * 4)})`; ell(g, f[0], f[1], 0.22 * f[2], 0.05 * f[2]); g.fill(); } }
  // legs: thin flat strips, knobbly knees, long flat feet
  for (const sd of [-1, 1]) {
    const L = J.leg[sd];
    crPoly(g, cam, stripPts([L.hp, L.kn, L.ft], [0.22, 0.13, 0.09], n), CR.shade, lw);
    const kp = proj(cam, ...L.kn); if (kp && !sq(L.kn)) { g.fillStyle = CR.shade; ell(g, kp[0], kp[1], 0.06 * kp[2], 0.06 * kp[2]); g.fill(); g.strokeStyle = CR.ink; g.lineWidth = lw * 0.8; g.stroke(); }
    const fwd = v3.norm([J.F[0], 0, J.F[2]]);
    const fy = L.ft[1], toe = v3.add(L.ft, v3.mul(fwd, 0.36)), side = v3.norm(v3.cross([0, 1, 0], fwd));
    for (let k = -1; k <= 1; k++) crPoly(g, cam, stripPts([v3.add(L.ft, v3.mul(side, k * 0.03)), v3.add(v3.add(toe, v3.mul(side, k * 0.07)), [0, 0, 0])].map(p => [p[0], Math.max(fy, 0.004), p[2]]), [0.05, 0.035], [0, 1, 0]), CR.skin, lw * 0.7);
  }
  // torso: a torn sheet, hanger-broad at the shoulders
  const X = J.X, U = J.U, at = (base, x, u) => v3.add(v3.add(base, v3.mul(X, x)), v3.mul(U, u));
  const tor = [at(J.hip, -0.2, -0.05), at(J.hip, -0.13, 0.2), at(J.waist, -0.12, 0.05), at(J.waist, -0.2, 0.3), at(J.chest, -0.38, -0.32), at(J.chest, -0.62, -0.13), at(J.chest, -0.5, -0.02), at(J.neck, -0.12, 0.0), at(J.neck, -0.06, 0.06),
    at(J.neck, 0.06, 0.06), at(J.neck, 0.12, 0.0), at(J.chest, 0.5, -0.02), at(J.chest, 0.62, -0.13), at(J.chest, 0.38, -0.32), at(J.waist, 0.22, 0.32), at(J.waist, 0.11, 0.04), at(J.hip, 0.14, 0.18), at(J.hip, 0.2, -0.05), at(J.hip, 0, -0.12)];
  // torn jagged edges
  const torn = []; tor.forEach((p, i) => { torn.push(p); const q = tor[(i + 1) % tor.length]; const m = v3.lerp(p, q, 0.5); torn.push(v3.add(m, v3.mul(J.N, 0)).map((v, j) => v + (j === 1 ? (hash(i * 3.1) - 0.5) * 0.04 : (hash(i * 7.7) - 0.5) * 0.04))); });
  const tsp = crPoly(g, cam, torn, CR.skin, lw);
  if (tsp) {
    g.save(); g.beginPath(); polyPath(g, tsp); g.clip();
    // shading: one folded half darker
    const half = projPoly(cam, [at(J.hip, 0, -0.2), at(J.neck, 0, 0.1), at(J.chest, 0.8, 0), at(J.hip, 0.5, -0.2)]); if (half.length > 2) { g.fillStyle = 'rgba(90,86,78,0.45)'; g.beginPath(); polyPath(g, half); g.fill(); }
    // ribs as soft lines, crease lines like folded paper
    if (!J.back) for (let i = 0; i < 5; i++) { const u = 0.62 + i * 0.075; for (const sd of [-1, 1]) crLine(g, cam, at(J.hip, sd * 0.04, u), at(J.hip, sd * (0.18 + i * 0.025), u - 0.05), 'rgba(70,64,58,0.55)', lw * 0.6); }
    crLine(g, cam, at(J.hip, 0, -0.1), at(J.neck, 0, 0.05), CR.crease, lw * 0.9);
    crLine(g, cam, at(J.chest, -0.6, -0.1), at(J.waist, 0.15, 0.1), CR.crease, lw * 0.7);
    crLine(g, cam, at(J.chest, 0.55, -0.15), at(J.hip, -0.1, 0.3), CR.crease, lw * 0.6);
    crLine(g, cam, at(J.waist, -0.25, 0.25), at(J.waist, 0.25, 0.25), CR.crease, lw * 0.6);
    g.restore();
  }
  // arms: long flat strips, flat strip-fingers
  for (const sd of [-1, 1]) {
    const A = J.arm[sd];
    crPoly(g, cam, stripPts([A.sh, A.el, A.wr], [0.2, 0.12, 0.1], n), CR.skin, lw);
    const ep = proj(cam, ...A.el); if (ep && !sq(A.el)) { g.fillStyle = CR.skin; ell(g, ep[0], ep[1], 0.05 * ep[2], 0.05 * ep[2]); g.fill(); g.strokeStyle = CR.ink; g.lineWidth = lw * 0.7; g.stroke(); }
    drawCreaseHand(g, cam, J, A, sd, o, lw);
  }
  // neck + head
  crPoly(g, cam, stripPts([J.neck, J.neckTop], [0.11, 0.08], n), CR.shade, lw);
  if (!sq(J.head)) drawCreaseHeadW(g, cam, E, J, o, lw);
  return J;
}
function drawCreaseHand(g, cam, J, A, sd, o, lw) {
  const n = J.N, d = A.d, side = v3.norm(v3.cross(n, d)), curl = o.curl || 0;
  const palm = v3.add(A.wr, v3.mul(d, 0.15));
  crPoly(g, cam, stripPts([A.wr, palm], [0.1, 0.16], n), CR.skin, lw * 0.8);
  for (let f = 0; f < 4; f++) {
    const sp = (f - 1.5) * (o.fingerSpread == null ? 0.22 : o.fingerSpread), fd = v3.norm(v3.add(v3.mul(d, Math.cos(sp)), v3.mul(side, Math.sin(sp) * -sd)));
    const b = v3.add(palm, v3.mul(side, (f - 1.5) * 0.035 * -sd));
    const tw = Math.sin((o.t || 0) * 6 + f * 1.7 + sd) * 0.04 * (o.twitch || 0);
    const k1 = v3.add(b, v3.mul(fd, 0.16)), fd2 = v3.norm(v3.add(fd, v3.mul(n, curl * 0.9 + tw))), k2 = v3.add(k1, v3.mul(fd2, 0.14)), fd3 = v3.norm(v3.add(fd2, v3.mul(n, curl * 0.9))), k3 = v3.add(k2, v3.mul(fd3, 0.1));
    const pts = [b, k1, k2, k3].map(p => o.clampZ != null && p[2] > o.clampZ ? [p[0], Math.min(p[1], 0.02), o.clampZ] : (o.floorY != null ? [p[0], Math.max(p[1], o.floorY), p[2]] : p));
    crPoly(g, cam, stripPts(pts, [0.035, 0.032, 0.028, 0.02], n), CR.skin, lw * 0.6);
    const tp = proj(cam, ...pts[3]); if (tp) { g.fillStyle = '#2a2420'; ell(g, tp[0], tp[1], 0.012 * tp[2], 0.012 * tp[2]); g.fill(); }
  }
}
// the head in world space (for wide shots): long flat oval with a fold, shining eyes, slit mouth
function drawCreaseHeadW(g, cam, E, J, o, lw) {
  const c = J.head, hu = J.hu, hx = J.hx, pts = [];
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, wob = 1 + (hash(i * 4.3) - 0.5) * 0.08; pts.push(v3.add(v3.add(c, v3.mul(hx, Math.sin(a) * 0.2 * wob)), v3.mul(hu, Math.cos(a) * 0.33 * wob))); }
  const sp = crPoly(g, cam, pts, CR.skin, lw); if (!sp) return;
  g.save(); g.beginPath(); polyPath(g, sp); g.clip();
  const sh = projPoly(cam, [v3.add(c, v3.mul(hu, 0.4)), v3.add(c, v3.mul(hu, -0.4)), v3.add(v3.add(c, v3.mul(hu, -0.4)), v3.mul(hx, 0.3)), v3.add(v3.add(c, v3.mul(hu, 0.4)), v3.mul(hx, 0.3))]);
  if (sh.length > 2) { g.fillStyle = 'rgba(90,86,78,0.4)'; g.beginPath(); polyPath(g, sh); g.fill(); }
  crLine(g, cam, v3.add(c, v3.mul(hu, 0.3)), v3.add(c, v3.mul(hu, -0.3)), CR.crease, lw * 0.8);
  if (J.back) { g.restore(); return; }
  // mouth: a slit from edge to edge
  const m = o.mouth || 0, my = -0.1, mp = [];
  for (let i = 0; i <= 8; i++) { const k = i / 8, x = lerp(-0.2, 0.2, k); mp.push(v3.add(v3.add(c, v3.mul(hx, x)), v3.mul(hu, my + Math.sin(k * Math.PI) * 0.02))); }
  for (let i = 8; i >= 0; i--) { const k = i / 8, x = lerp(-0.2, 0.2, k); mp.push(v3.add(v3.add(c, v3.mul(hx, x)), v3.mul(hu, my - 0.008 - Math.sin(k * Math.PI) * (0.012 + m * 0.11)))); }
  const msp = projPoly(cam, mp); if (msp.length > 2) { g.fillStyle = '#07060a'; g.beginPath(); polyPath(g, msp); g.fill(); }
  // thin torn-paper teeth along the slit
  for (let i = 1; i < 12; i++) { const k = i / 12, x = lerp(-0.19, 0.19, k), top = v3.add(v3.add(c, v3.mul(hx, x)), v3.mul(hu, my + Math.sin(k * Math.PI) * 0.02)), tl = 0.012 + m * 0.035 * Math.sin(k * Math.PI);
    const a = proj(cam, ...top), b = proj(cam, ...v3.add(top, v3.mul(hu, -tl))); if (a && b) { g.strokeStyle = '#d8d2c2'; g.lineWidth = Math.max(1, lw * 0.6); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
  // ink runs under the eyes + a diagonal crease
  for (const sd of [-1, 1]) for (let j = 0; j < 2; j++) crLine(g, cam, v3.add(v3.add(c, v3.mul(hx, sd * (0.06 + j * 0.03))), v3.mul(hu, 0.02)), v3.add(v3.add(c, v3.mul(hx, sd * (0.055 + j * 0.035))), v3.mul(hu, -0.07 - j * 0.03)), 'rgba(15,12,14,0.6)', lw * 0.7);
  crLine(g, cam, v3.add(v3.add(c, v3.mul(hx, -0.2)), v3.mul(hu, 0.2)), v3.add(v3.add(c, v3.mul(hx, 0.05)), v3.mul(hu, 0.12)), CR.crease, lw * 0.6);
  g.restore();
  // eyes: deep black sockets + eyeshine (glows even in the dark)
  for (const sd of [-1, 1]) {
    const e = proj(cam, ...v3.add(v3.add(c, v3.mul(hx, sd * 0.075)), v3.mul(hu, 0.06))); if (!e) continue;
    g.fillStyle = '#060508'; ell(g, e[0], e[1], 0.04 * e[2], 0.05 * e[2]); g.fill();
    const k = o.eyes == null ? 1 : o.eyes;
    if (k > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, e[0], e[1], 0.12 * e[2], CR.eye, 0.55 * k); g.restore(); g.fillStyle = rgb(mixc([40, 40, 30], CR.eye, k)); ell(g, e[0], e[1], 0.025 * e[2], 0.025 * e[2]); g.fill(); g.fillStyle = '#000'; ell(g, e[0], e[1], 0.006 * e[2], 0.02 * e[2]); g.fill(); }
  }
}
// lit through a scratch layer: dark + warm light from one side (screen x of the light), eyes added after
function creaseSprite(o, z, lo = {}) {
  return { z, draw: (g, cam, E) => {
    const L = scratch(); L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H);
    const J = drawCrease(L.g, cam, E, { ...o, eyes: 0 });
    L.g.save(); L.g.globalCompositeOperation = 'source-atop';
    const lx = lo.lightX == null ? W : lo.lightX, wk = lo.warm == null ? 0.35 : lo.warm;
    const gr = L.g.createLinearGradient(lx, 0, lx < W / 2 ? lx + 700 : lx - 700, 0); gr.addColorStop(0, rgb(KC.warm, wk)); gr.addColorStop(1, rgb(KC.warm, 0)); L.g.fillStyle = gr; L.g.fillRect(0, 0, W, H);
    L.g.fillStyle = `rgba(8,10,22,${lo.dark == null ? 0.45 : lo.dark})`; L.g.fillRect(0, 0, W, H); L.g.restore();
    g.save(); if (lo.alpha != null) g.globalAlpha = lo.alpha; g.drawImage(L.c, 0, 0); g.restore();
    // eyes shine on top (they are the brightest thing on it)
    if ((o.eyes == null ? 1 : o.eyes) > 0 && J && J.head && !J.back) {
      for (const sd of [-1, 1]) {
        const e = proj(cam, ...v3.add(v3.add(J.head, v3.mul(J.hx, sd * 0.075)), v3.mul(J.hu, 0.06))); if (!e) continue; const k = (o.eyes == null ? 1 : o.eyes) * (lo.alpha == null ? 1 : lo.alpha);
        g.save(); g.globalCompositeOperation = 'lighter'; glow(g, e[0], e[1], 0.14 * e[2], CR.eye, 0.5 * k); g.restore();
        g.fillStyle = rgb(CR.eye, k); ell(g, e[0], e[1], 0.024 * e[2], 0.024 * e[2]); g.fill(); g.fillStyle = `rgba(0,0,0,${k})`; ell(g, e[0], e[1], 0.006 * e[2], 0.019 * e[2]); g.fill();
      }
    }
  } };
}
// ---------- the big face close-up (2D) ----------
function creaseFaceBig(g, cx, cy, S, o = {}) {
  const t = o.t || 0, m = o.mouth || 0, jit = o.jitter || 0;
  g.save(); g.translate(cx + noise(t * 23) * jit * S * 0.03, cy + noise(t * 19 + 4) * jit * S * 0.02); g.rotate(((o.tilt || 0) + noise(t * 9) * jit * 3) * D2R);
  // thin neck + the broad torn sheet of its shoulders
  { const sg = g.createLinearGradient(-S * 2, 0, S * 2, 0); sg.addColorStop(0, '#4c4943'); sg.addColorStop(0.5, '#3a3833'); sg.addColorStop(1, '#24221f'); g.fillStyle = sg; } g.strokeStyle = CR.ink; g.lineWidth = S * 0.025;
  g.beginPath(); g.moveTo(-S * 2.6, S * 2.9); g.lineTo(-S * 2.2, S * 1.75); g.lineTo(-S * 0.5, S * 1.45); g.lineTo(-S * 0.14, S * 0.95); g.lineTo(S * 0.16, S * 0.95); g.lineTo(S * 0.55, S * 1.45);
  for (let i = 0; i <= 8; i++) g.lineTo(S * (0.55 + i * 0.24), S * (1.47 + (i % 2) * 0.05 + i * 0.03)); g.lineTo(S * 2.6, S * 2.9); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(40,36,32,0.6)'; g.lineWidth = S * 0.015; g.beginPath(); g.moveTo(-S * 1.6, S * 1.7); g.lineTo(-S * 0.3, S * 2.6); g.moveTo(S * 0.9, S * 1.6); g.lineTo(S * 1.8, S * 2.6); g.moveTo(0, S * 1.0); g.lineTo(S * 0.05, S * 2.9); g.stroke();
  // face outline: long, crumpled
  const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, wob = 1 + (hash(i * 2.7 + 1) - 0.5) * 0.06; pts.push([Math.sin(a) * S * 0.68 * wob * (Math.cos(a) > 0 ? 0.9 : 1), -Math.cos(a) * S * 1.12 * wob]); }
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); pts.forEach(p => g.lineTo(p[0], p[1])); g.closePath();
  const fg = g.createLinearGradient(-S * 0.7, 0, S * 0.7, 0); fg.addColorStop(0, '#c9c4b6'); fg.addColorStop(0.49, '#b4afa2'); fg.addColorStop(0.51, '#8a8578'); fg.addColorStop(1, '#6f6a5f');
  g.fillStyle = fg; g.fill(); g.lineWidth = S * 0.03; g.strokeStyle = CR.ink; g.stroke();
  g.save(); g.clip();
  // paper fibres + crease lines
  const r = rng(12); g.strokeStyle = 'rgba(110,104,92,0.35)'; g.lineWidth = S * 0.006;
  for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * S * 1.3, y = (r() - 0.5) * S * 2.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * S * 0.2, y + (r() - 0.5) * S * 0.06); g.stroke(); }
  for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(50,44,36,${0.12 + r() * 0.12})`; ell(g, (r() - 0.5) * S * 1.1, (r() - 0.4) * S * 1.8, S * (0.08 + r() * 0.15), S * (0.05 + r() * 0.1), r() * 3); g.fill(); }
  for (const sd of [-1, 1]) { g.strokeStyle = 'rgba(15,12,14,0.55)'; for (let j = 0; j < 3; j++) { g.lineWidth = S * (0.035 - j * 0.008); g.beginPath(); const x = sd * S * (0.2 + j * 0.06); g.moveTo(x, -S * 0.1); g.quadraticCurveTo(x + S * 0.02, S * 0.1, x - S * 0.01, S * (0.25 + j * 0.12 + 0.05 * Math.sin(t + j))); g.stroke(); } }
  g.strokeStyle = 'rgba(60,56,50,0.65)'; g.lineWidth = S * 0.018;
  g.beginPath(); g.moveTo(S * 0.01, -S * 1.2); g.lineTo(-S * 0.02, -S * 0.3); g.lineTo(S * 0.02, S * 0.3); g.lineTo(0, S * 1.2); g.stroke();
  g.beginPath(); g.moveTo(-S * 0.7, -S * 0.75); g.lineTo(S * 0.15, -S * 0.42); g.stroke();
  g.beginPath(); g.moveTo(S * 0.7, S * 0.15); g.lineTo(S * 0.05, S * 0.5); g.stroke();
  g.beginPath(); g.moveTo(-S * 0.7, S * 0.25); g.lineTo(-S * 0.3, S * 0.05); g.stroke();
  // warm rim from the fridge side
  const rim = o.rim == null ? 1 : o.rim; const rg = g.createLinearGradient(S * 0.7, 0, S * 0.1, 0); rg.addColorStop(0, `rgba(255,200,130,${0.45 * rim})`); rg.addColorStop(1, 'rgba(255,200,130,0)'); g.fillStyle = rg; g.fillRect(-S, -S * 1.3, 2 * S, 2.6 * S);
  g.restore();
  // brow ridge shadows + sockets
  for (const sd of [-1, 1]) {
    const ex = sd * S * 0.27, ey = -S * 0.25;
    g.fillStyle = 'rgba(40,36,32,0.55)'; ell(g, ex, ey - S * 0.02, S * 0.22, S * 0.24); g.fill();
    g.fillStyle = '#050407'; ell(g, ex, ey, S * 0.17, S * 0.2); g.fill();
    const k = o.eyes == null ? 1 : o.eyes, lk = o.look || 0;
    if (k > 0) {
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, ex, ey, S * 0.5, CR.eye, 0.35 * k); g.restore();
      const egr = g.createRadialGradient(ex + lk * S * 0.04, ey, 0, ex, ey, S * 0.13); egr.addColorStop(0, rgb([245, 255, 190], k)); egr.addColorStop(0.45, rgb(CR.eye, k)); egr.addColorStop(1, rgb([60, 80, 20], k));
      g.fillStyle = egr; ell(g, ex + lk * S * 0.04, ey, S * 0.1, S * 0.11); g.fill();
      g.fillStyle = '#000'; ell(g, ex + lk * S * 0.05, ey, S * 0.018 * (1 + (o.pupil || 0)), S * 0.03); g.fill();
    }
  }
  // no nose: two thin slits
  g.strokeStyle = '#2a2622'; g.lineWidth = S * 0.02; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * S * 0.05, S * 0.05); g.lineTo(sd * S * 0.07, S * 0.16); g.stroke(); }
  // the slit mouth: cheek to cheek, tearing past the face edge when it opens
  const mw = S * (0.66 + m * 0.1), my = S * 0.5, oh = S * (0.02 + m * 0.42);
  g.beginPath(); g.moveTo(-mw, my);
  for (let i = 0; i <= 16; i++) { const k = i / 16; g.lineTo(lerp(-mw, mw, k), my - Math.sin(k * Math.PI) * oh * 0.35 - (i % 2) * S * 0.01); }
  for (let i = 16; i >= 0; i--) { const k = i / 16; g.lineTo(lerp(-mw, mw, k), my + Math.sin(k * Math.PI) * oh + (i % 2) * S * 0.012); }
  g.closePath(); g.fillStyle = '#08060a'; g.fill(); g.strokeStyle = CR.ink; g.lineWidth = S * 0.025; g.stroke();
  if (m > 0.05) {   // rows of thin, torn-paper teeth
    g.save(); g.clip();
    g.fillStyle = '#e4dfcf'; g.strokeStyle = '#3a342c'; g.lineWidth = S * 0.006;
    for (let i = 0; i < 26; i++) { const k = (i + 0.5) / 26, x = lerp(-mw, mw, k), yt = my - Math.sin(k * Math.PI) * oh * 0.35, yb = my + Math.sin(k * Math.PI) * oh, tl = S * (0.06 + 0.07 * Math.sin(k * Math.PI)) * clamp(m * 2);
      g.beginPath(); g.moveTo(x - S * 0.022, yt - 2); g.lineTo(x, yt + tl); g.lineTo(x + S * 0.022, yt - 2); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x - S * 0.022, yb + 2); g.lineTo(x + S * 0.004, yb - tl * 0.9); g.lineTo(x + S * 0.022, yb + 2); g.fill(); g.stroke(); }
    g.fillStyle = 'rgba(70,10,14,0.6)'; ell(g, 0, my + oh * 0.4, mw * 0.5, oh * 0.35); g.fill();
    g.restore();
  }
  // a thread of drool
  if (o.drool) { const dl = S * 0.4 * o.drool * (0.8 + 0.2 * Math.sin(t * 2)); g.strokeStyle = 'rgba(210,220,230,0.6)'; g.lineWidth = S * 0.012; g.beginPath(); g.moveTo(S * 0.2, my + oh); g.quadraticCurveTo(S * 0.22, my + oh + dl * 0.6, S * 0.19, my + oh + dl); g.stroke(); }
  g.restore();
}
// a long flat finger seen pressing against glass (close-up 2D): tapered, three joints, flat dark nail
function creaseFinger(g, x0, y0, x1, y1, w, press = 0, o = {}) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, bend = o.bend || 0.12;
  const P = [], K = [0, 0.42, 0.74, 1];
  K.forEach((k, i) => { const off = Math.sin(k * Math.PI) * L * bend * (o.side || 1); P.push([x0 + dx * k + nx * off, y0 + dy * k + ny * off]); });
  const wid = [w * 1.15, w * 0.95, w * 0.85, w * 0.7], Lp = [], Rp = [];
  P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(3, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, qx = -ty / tl, qy = tx / tl; Lp.push([p[0] + qx * wid[i] / 2, p[1] + qy * wid[i] / 2]); Rp.push([p[0] - qx * wid[i] / 2, p[1] - qy * wid[i] / 2]); });
  g.beginPath(); g.moveTo(Lp[0][0], Lp[0][1]); for (let i = 1; i < 4; i++) g.lineTo(Lp[i][0], Lp[i][1]);
  g.quadraticCurveTo(P[3][0] + ux * w * 0.55, P[3][1] + uy * w * 0.55, Rp[3][0], Rp[3][1]); for (let i = 2; i >= 0; i--) g.lineTo(Rp[i][0], Rp[i][1]); g.closePath();
  const gr = g.createLinearGradient(Lp[1][0], Lp[1][1], Rp[1][0], Rp[1][1]); gr.addColorStop(0, o.skin || CR.skin); gr.addColorStop(1, o.shade || CR.shade);
  g.fillStyle = gr; g.fill(); g.strokeStyle = CR.ink; g.lineWidth = Math.max(2, w * 0.09); g.lineJoin = 'round'; g.stroke();
  // knuckle wrinkles + a fold line down the length (paper)
  g.strokeStyle = 'rgba(40,36,32,0.55)'; g.lineWidth = Math.max(1, w * 0.05);
  for (const i of [1, 2]) for (let j = -1; j <= 1; j++) { const c = P[i], s = j * w * 0.1; g.beginPath(); g.moveTo(Lp[i][0] * 0.8 + c[0] * 0.2 + ux * s, Lp[i][1] * 0.8 + c[1] * 0.2 + uy * s); g.quadraticCurveTo(c[0] + ux * (s + w * 0.08), c[1] + uy * (s + w * 0.08), Rp[i][0] * 0.8 + c[0] * 0.2 + ux * s, Rp[i][1] * 0.8 + c[1] * 0.2 + uy * s); g.stroke(); }
  g.strokeStyle = 'rgba(60,56,50,0.35)'; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.lineTo(P[3][0], P[3][1]); g.stroke();
  // long flat dark nail
  g.save(); g.translate(P[3][0] - ux * w * 0.1, P[3][1] - uy * w * 0.1); g.rotate(Math.atan2(uy, ux)); g.fillStyle = '#3a332b'; g.strokeStyle = CR.ink; g.lineWidth = Math.max(1, w * 0.05); rr(g, -w * 0.45, -w * 0.28, w * 0.9, w * 0.56, w * 0.2); g.fill(); g.stroke(); g.restore();
  if (press > 0) { g.fillStyle = `rgba(235,232,222,${0.4 * press})`; ell(g, P[3][0], P[3][1], w * 0.5 * (1 + press * 0.3), w * 0.42 * (1 + press * 0.3), Math.atan2(uy, ux)); g.fill(); }
}

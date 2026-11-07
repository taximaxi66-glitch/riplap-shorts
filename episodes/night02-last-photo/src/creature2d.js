// ---------- the thing on the ceiling, drawn (comic look) and hung into the 3D hallway ----------
// BELOW view: what you see when you look straight up at it. SIDE view: hanging from the ceiling, seen from down the hall.
const INK = '#121014', SK = '#868a83', SKM = '#6b6f69', SKD = '#3e423d', SKL = '#a3a79f';
function bone(g, pts, w, col = SK) {   // tapered, knobbly segments
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, wa = w * 0.62, wm = w * 0.38;
    const mx = (a[0] + b[0]) / 2 + nx * w * 0.12, my = (a[1] + b[1]) / 2 + ny * w * 0.12;
    const path = () => { g.beginPath(); g.moveTo(a[0] + nx * wa, a[1] + ny * wa); g.quadraticCurveTo(mx + nx * wm, my + ny * wm, b[0] + nx * wa, b[1] + ny * wa); g.lineTo(b[0] - nx * wa, b[1] - ny * wa); g.quadraticCurveTo(mx - nx * wm, my - ny * wm, a[0] - nx * wa, a[1] - ny * wa); g.closePath(); };
    path(); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = w * 0.12; g.beginPath(); g.moveTo(a[0] + nx * wa * 0.5, a[1] + ny * wa * 0.5); g.quadraticCurveTo(mx + nx * wm * 0.5, my + ny * wm * 0.5, b[0] + nx * wa * 0.5, b[1] + ny * wa * 0.5); g.stroke(); }
}
// mottled diseased skin, veins and wet sheen, painted only onto what's already drawn
export function skinOver(g, W2, H2, seed = 1) {
  let s_ = seed; const r = () => (s_ = (s_ * 16807) % 2147483647) / 2147483647;
  g.save(); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 260; i++) { const x = r() * W2, y = r() * H2, rad = 8 + r() * 60; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${40 + r() * 40},${35 + r() * 20},${45 + r() * 30},${0.25 + r() * 0.3})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  g.lineCap = 'round'; for (let i = 0; i < 70; i++) { let x = r() * W2, y = r() * H2; g.strokeStyle = `rgba(${60 + r() * 40},40,${70 + r() * 40},0.4)`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(230,240,230,${0.08 + r() * 0.2})`; g.beginPath(); g.ellipse(r() * W2, r() * H2, 2 + r() * 4, 1 + r() * 3, r() * 3, 0, 7); g.fill(); }
  g.restore();
}
function lineLimb(g, pts, w, col = SK) {
  if (w >= 30) { bone(g, pts, w, col); return; }
  g.lineCap = 'round'; g.lineJoin = 'round';
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); };
  path(); g.strokeStyle = INK; g.lineWidth = w + 10; g.stroke(); path(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
  g.save(); g.translate(w * 0.18, -w * 0.1); path(); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = w * 0.3; g.stroke(); g.restore();
}
function knob(g, x, y, r, col = SKM) { g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); }
// a hand gripping the ceiling: long fingers, three joints each; tw(f, j) adds a bend (radians) for twitching
function hand(g, x, y, ang, s, tw, cracks = true) {
  if (cracks) { g.strokeStyle = 'rgba(20,18,22,0.55)'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { const a = ang + (i - 2.5) * 0.4; let px = x + Math.cos(a) * s * 1.6, py = y + Math.sin(a) * s * 1.6; g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 3; k++) { px += Math.cos(a + Math.sin(i * 3 + k) * 0.6) * s * 0.5; py += Math.sin(a + Math.sin(i * 3 + k) * 0.6) * s * 0.5; g.lineTo(px, py); } g.stroke(); } }
  g.fillStyle = SKM; g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.ellipse(x, y, s * 0.55, s * 0.42, ang, 0, 7); g.fill(); g.stroke();
  for (let f = 0; f < 5; f++) {
    const a0 = ang + (f - 2) * 0.32 + (f === 0 ? -0.35 : 0), L = s * (f === 0 || f === 4 ? 0.85 : 1.15);
    let px = x + Math.cos(a0) * s * 0.4, py = y + Math.sin(a0) * s * 0.4, a = a0; const pts = [[px, py]];
    for (let j = 0; j < 3; j++) { a += (j ? 0.25 : 0) + (tw ? tw(f, j) : 0); const l = L * [0.42, 0.33, 0.28][j]; px += Math.cos(a) * l; py += Math.sin(a) * l; pts.push([px, py]); }
    lineLimb(g, pts, s * 0.13, SK); for (const p of pts.slice(1, 3)) knob(g, p[0], p[1], s * 0.085, SKM);
    g.fillStyle = '#1a1414'; g.beginPath(); g.arc(pts[3][0], pts[3][1], s * 0.06, 0, 7); g.fill();
  }
}
// the upside-down face: chin toward the top of the canvas; black eyes; the jaw hangs open (jaw 0..1)
function face(g, x, y, s, o) {
  const jaw = o.jaw ?? 0.6, t = o.t || 0;
  g.save(); g.translate(x, y); g.rotate(o.tilt || 0);
  // skull (long), stretched wrinkled skin
  g.fillStyle = SK; g.strokeStyle = INK; g.lineWidth = 8;
  g.beginPath(); g.ellipse(0, s * 0.15, s * 0.78, s * 1.15, 0, 0, 7); g.fill(); g.stroke();
  const sh = g.createLinearGradient(-s, 0, s, 0); sh.addColorStop(0, 'rgba(0,0,0,0.35)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = sh; g.beginPath(); g.ellipse(0, s * 0.15, s * 0.78, s * 1.15, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(30,32,30,0.55)'; g.lineWidth = 4; for (let i = 0; i < 7; i++) { const xx = (i - 3) * s * 0.17; g.beginPath(); g.moveTo(xx, s * 0.95); g.quadraticCurveTo(xx + s * 0.05, s * 0.7, xx - s * 0.02, s * 0.45); g.stroke(); }
  // the jaw hanging open (toward the top: the head is upside down) — a long black mouth with ragged lips and spit
  const mTop = -s * (0.15 + jaw * 0.95), mBot = s * 0.1;
  g.fillStyle = SKM; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.ellipse(0, mTop - s * 0.05, s * 0.42, s * 0.3, 0, 0, 7); g.fill(); g.stroke();   // lower jaw (chin)
  g.fillStyle = '#050304'; g.beginPath(); g.moveTo(-s * 0.32, mBot); g.quadraticCurveTo(-s * 0.48, (mTop + mBot) / 2, -s * 0.2, mTop); g.quadraticCurveTo(0, mTop - s * 0.08, s * 0.2, mTop); g.quadraticCurveTo(s * 0.48, (mTop + mBot) / 2, s * 0.32, mBot); g.quadraticCurveTo(0, mBot + s * 0.06, -s * 0.32, mBot); g.fill();
  g.strokeStyle = '#3a2828'; g.lineWidth = 9; g.stroke();
  const ig = g.createRadialGradient(0, (mTop + mBot) / 2, 4, 0, (mTop + mBot) / 2, s * 0.5); ig.addColorStop(0, 'rgba(80,10,16,0.55)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = ig; g.fillRect(-s * 0.5, mTop, s, mBot - mTop);
  g.fillStyle = '#cfc6a8'; for (let i = 0; i < 7; i++) { const xx = (i - 3) * s * 0.075; g.beginPath(); g.moveTo(xx - s * 0.03, mBot - 2); g.lineTo(xx + s * 0.03, mBot - 2); g.lineTo(xx + (i % 2 ? 2 : -3), mBot - s * (0.08 + (i % 3) * 0.04)); g.fill(); }
  g.strokeStyle = 'rgba(210,220,210,0.6)'; g.lineWidth = 4; for (let i = 0; i < 3; i++) { const x0 = -s * 0.22 + i * s * 0.2, sway = Math.sin(t * 1.4 + i) * s * 0.04; g.beginPath(); g.moveTo(x0, mBot - s * 0.02); g.quadraticCurveTo(x0 + sway, (mTop + mBot) / 2 + s * 0.15, x0 + s * 0.1, mTop + s * 0.05); g.stroke(); }
  // stretched grey lips and dark gums around the hole
  g.strokeStyle = '#7a5a5a'; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(-s * 0.33, mBot); g.quadraticCurveTo(0, mBot + s * 0.09, s * 0.33, mBot); g.stroke();
  g.fillStyle = 'rgba(90,20,30,0.85)'; g.beginPath(); g.ellipse(0, mBot - s * 0.04, s * 0.28, s * 0.05, 0, 0, 7); g.fill();
  // cheekbones + brow ridge (shading)
  for (const sx of [-1, 1]) { const cg = g.createRadialGradient(sx * s * 0.45, s * 0.35, 4, sx * s * 0.45, s * 0.35, s * 0.35); cg.addColorStop(0, 'rgba(20,20,20,0.45)'); cg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = cg; g.fillRect(sx * s * 0.45 - s * 0.35, 0, s * 0.7, s * 0.7); }
  g.strokeStyle = 'rgba(20,20,20,0.55)'; g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(-s * 0.55, s * 0.82); g.quadraticCurveTo(0, s * 0.72, s * 0.55, s * 0.82); g.stroke();
  // nose slits
  g.fillStyle = '#1e1a1a'; g.beginPath(); g.ellipse(-s * 0.08, s * 0.25, s * 0.035, s * 0.08, -0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(s * 0.08, s * 0.25, s * 0.035, s * 0.08, 0.3, 0, 7); g.fill();
  // sunken sockets + pitch-black glossy eyes (they never blink)
  for (const sx of [-1, 1]) { const ex = sx * s * 0.3, ey = s * 0.62;
    const sg = g.createRadialGradient(ex, ey, 2, ex, ey, s * 0.32); sg.addColorStop(0, 'rgba(10,8,10,0.95)'); sg.addColorStop(0.6, 'rgba(30,28,30,0.7)'); sg.addColorStop(1, 'rgba(60,60,60,0)'); g.fillStyle = sg; g.beginPath(); g.ellipse(ex, ey, s * 0.3, s * 0.26, 0, 0, 7); g.fill();
    g.fillStyle = '#5a1a1e'; g.beginPath(); g.ellipse(ex, ey, s * 0.2, s * 0.165, 0, 0, 7); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(ex, ey, s * 0.17, s * 0.14, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,30,40,0.6)'; g.lineWidth = 2.5; for (let k = 0; k < 5; k++) { const a = k * 1.3; g.beginPath(); g.moveTo(ex + Math.cos(a) * s * 0.2, ey + Math.sin(a) * s * 0.17); g.lineTo(ex + Math.cos(a + 0.2) * s * 0.3, ey + Math.sin(a + 0.2) * s * 0.26); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(ex + s * 0.05, ey - s * 0.04, s * 0.035, s * 0.025, 0, 0, 7); g.fill(); }
  // a few long wet hairs hanging down (toward the bottom here = toward the floor... they fall away from the skull top)
  g.strokeStyle = 'rgba(10,8,8,0.85)'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { const xx = (i - 4) * s * 0.14; g.beginPath(); g.moveTo(xx, s * 1.2); g.quadraticCurveTo(xx + Math.sin(t + i) * s * 0.1, s * 1.5, xx + s * 0.05, s * (1.7 + (i % 3) * 0.12)); g.stroke(); }
  g.restore();
}

// ---------------- BELOW: looking straight up at it (canvas 2048 x 2048, head toward the top) ----------------
export function drawBelow(g, W2, H2, o = {}) {
  const t = o.t || 0, cx = W2 / 2;
  g.clearRect(0, 0, W2, H2);
  // its shadow on the ceiling
  const sh = g.createRadialGradient(cx, H2 * 0.58, 50, cx, H2 * 0.58, W2 * 0.55); sh.addColorStop(0, 'rgba(0,0,0,0.6)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, 0, W2, H2);
  const br = Math.sin(t * 0.9) * 6;
  const shL = [cx - 150, 760], shR = [cx + 150, 760], hpL = [cx - 115, 1470], hpR = [cx + 115, 1470];
  // limbs: joints bend outward the wrong way, long hands gripping the ceiling
  const limbs = [[shL, [cx - 470, 700], [cx - 560, 420], [cx - 650, 230], -2.2, 0], [shR, [cx + 470, 700], [cx + 560, 420], [cx + 650, 230], -0.95, 1], [hpL, [cx - 470, 1560], [cx - 600, 1760], [cx - 520, 1930], 2.1, 2], [hpR, [cx + 470, 1560], [cx + 600, 1760], [cx + 520, 1930], 1.0, 3]];
  for (const [a, k, k2, h, ang, i] of limbs) {
    lineLimb(g, [a, k, k2, h], 54, SK); knob(g, k[0], k[1], 36); knob(g, k2[0], k2[1], 30);
    // loose skin hanging from the upper arm / thigh
    g.fillStyle = SKD; g.strokeStyle = INK; g.lineWidth = 5; const mx = (a[0] + k[0]) / 2, my = (a[1] + k[1]) / 2, sw = Math.sin(t * 1.1 + i) * 10;
    g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mx + sw + 20, my + 70, k[0], k[1]); g.quadraticCurveTo(mx, my + 20, a[0], a[1]); g.fill(); g.stroke();
    hand(g, h[0], h[1], ang, 120, o.tw ? (f, j) => o.tw(i, f, j) : null);
  }
  // torso seen from the belly: narrow ribcage, the skin sagging off it in heavy wet folds
  g.fillStyle = SK; g.strokeStyle = INK; g.lineWidth = 9;
  g.beginPath(); g.moveTo(cx - 170, 740); g.quadraticCurveTo(cx - 230, 1100, cx - 120, 1520); g.lineTo(cx + 120, 1520); g.quadraticCurveTo(cx + 230, 1100, cx + 170, 740); g.quadraticCurveTo(cx, 690, cx - 170, 740); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(40,42,40,0.6)'; g.lineWidth = 7; for (let i = 0; i < 7; i++) { const y = 820 + i * 62; g.beginPath(); g.moveTo(cx - 150 + i * 4, y); g.quadraticCurveTo(cx, y + 40, cx + 150 - i * 4, y); g.stroke(); }
  for (let i = 0; i < 7; i++) {   // the folds: heavy, uneven lobes of loose skin hanging toward you (lighter = nearer), wet
    const y = 860 + i * 95 + br, w = 130 + Math.sin(i * 2.7) * 40, sw = Math.sin(t * 0.8 + i * 1.3) * 14, x = cx + Math.sin(i * 1.9) * 50 + sw, hh = 60 + (i * 37 % 40);
    const lg = g.createRadialGradient(x - w * 0.2, y + hh * 0.3, 10, x, y + hh * 0.5, w * 1.1); lg.addColorStop(0, SKL); lg.addColorStop(0.55, SKM); lg.addColorStop(1, SKD);
    g.fillStyle = lg; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(x - w, y); g.bezierCurveTo(x - w * 1.1, y + hh * 1.4, x - w * 0.2, y + hh * 1.9, x + w * 0.1, y + hh * 1.5); g.bezierCurveTo(x + w * 0.5, y + hh * 2.1, x + w * 1.15, y + hh * 1.2, x + w, y); g.quadraticCurveTo(x, y - 20, x - w, y); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(25,25,25,0.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - w * 0.7, y + hh * 0.6); g.quadraticCurveTo(x, y + hh * 1.1, x + w * 0.7, y + hh * 0.5); g.stroke();
    g.fillStyle = 'rgba(220,230,220,0.5)'; g.beginPath(); g.ellipse(x - w * 0.25, y + hh * 0.7, w * 0.18, hh * 0.12, -0.3, 0, 7); g.fill();
  }
  g.fillStyle = 'rgba(200,210,200,0.45)'; for (let i = 0; i < 6; i++) { const x = cx - 100 + i * 40, y = 1500 + Math.sin(i) * 10; g.beginPath(); g.ellipse(x, y, 6, 10, 0, 0, 7); g.fill(); }   // wet sheen drops
  // neck bent all the way back: it comes toward you, folded skin rings, then the upside-down head
  g.fillStyle = SKM; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(cx - 70, 760); g.quadraticCurveTo(cx - 90, 640, cx - 60, 560); g.lineTo(cx + 60, 560); g.quadraticCurveTo(cx + 90, 640, cx + 70, 760); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(30,30,30,0.6)'; g.lineWidth = 6; for (let i = 0; i < 4; i++) { const y = 590 + i * 42; g.beginPath(); g.moveTo(cx - 70, y); g.quadraticCurveTo(cx, y + 18, cx + 70, y); g.stroke(); }
  face(g, cx + Math.sin(t * 0.5) * 8, 420, 230, { jaw: o.jaw, t, tilt: (o.tilt || 0.1) + Math.sin(t * 0.37) * 0.04 });
  if (o.skin !== false) skinOver(g, W2, H2, 11);
}

// ---------------- SIDE: hanging from the ceiling, seen from down the hall (canvas 2048 x 1400, ceiling at the top edge) ----------------
export function drawSide(g, W2, H2, o = {}) {
  const t = o.t || 0; g.clearRect(0, 0, W2, H2);
  const sh = g.createRadialGradient(W2 / 2, 0, 50, W2 / 2, 0, W2 * 0.5); sh.addColorStop(0, 'rgba(0,0,0,0.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, 0, W2, 300);
  const by = 300 + Math.sin(t * 0.9) * 6;
  // far limbs (darker)
  for (const [a, k, k2, h] of [[[700, by], [520, 480], [360, 300], [380, 30]], [[1380, by + 10], [1580, 480], [1740, 300], [1700, 30]]]) { lineLimb(g, [a, k, k2, h], 44, SKM); knob(g, k[0], k[1], 30, SKD); knob(g, k2[0], k2[1], 26, SKD); }
  // body: horizontal under the ceiling, belly down, sagging skin hanging off it
  g.fillStyle = SK; g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(620, by); g.bezierCurveTo(700, by - 150, 1380, by - 150, 1480, by - 10); g.bezierCurveTo(1440, by + 120, 760, by + 140, 620, by); g.fill(); g.stroke();
  for (let i = 0; i < 12; i++) { const x = 680 + i * 66; knob(g, x, by - 118 + Math.abs(i - 5.5) * 6, 16, SKM); }
  for (let i = 0; i < 8; i++) { const x = 720 + i * 92, sw = Math.sin(t * 0.8 + i * 1.3) * 12, hgt = 150 + (i * 53 % 130);
    const lg = g.createLinearGradient(0, by, 0, by + hgt); lg.addColorStop(0, SKM); lg.addColorStop(1, SKD); g.fillStyle = lg; g.strokeStyle = INK; g.lineWidth = 6;
    g.beginPath(); g.moveTo(x - 60, by + 60); g.quadraticCurveTo(x - 50 + sw, by + hgt, x + sw, by + hgt + 10); g.quadraticCurveTo(x + 50 + sw, by + hgt, x + 60, by + 60); g.fill(); g.stroke(); }
  // near limbs
  for (const [a, k, k2, h, i] of [[[760, by + 20], [600, 560], [420, 360], [460, 30], 0], [[1320, by + 20], [1500, 560], [1680, 360], [1600, 30], 1]]) { lineLimb(g, [a, k, k2, h], 52, SK); knob(g, k[0], k[1], 36); knob(g, k2[0], k2[1], 30);
    g.fillStyle = SKD; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + k[0]) / 2 + 30, (a[1] + k[1]) / 2 + 80 + Math.sin(t + i) * 8, k[0], k[1]); g.quadraticCurveTo((a[0] + k[0]) / 2, (a[1] + k[1]) / 2 + 20, a[0], a[1]); g.fill(); g.stroke();
    for (let f = 0; f < 4; f++) { const fx = h[0] + (f - 1.5) * 26; lineLimb(g, [[h[0], h[1] + 40], [fx, 20], [fx + (f - 1.5) * 18, 6]], 14, SK); } }
  // neck bent back, the head hanging down, face turned to you, upside down
  g.fillStyle = SKM; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(660, by - 20); g.quadraticCurveTo(560, by + 160, 600, by + 330); g.lineTo(700, by + 330); g.quadraticCurveTo(680, by + 160, 740, by + 30); g.fill(); g.stroke();
  face(g, 650, by + 560, 190, { jaw: o.jaw, t, tilt: 0.1 + Math.sin(t * 0.4) * 0.05 });
  if (o.skin !== false) skinOver(g, W2, H2, 23);
}

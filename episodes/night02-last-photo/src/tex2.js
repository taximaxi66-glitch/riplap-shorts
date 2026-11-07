// ---------- textures for "The Last Photo": blue-grey hallway + the four family photos ----------
import * as THREE from 'three';
const R = seed => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData = { canvas: c }; return t; }
function stains(g, w, h, r, n, col, a) { for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, rad = 30 + r() * 140; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${col},${a * (0.4 + r() * 0.6)})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); } }
export const T2 = {};
const INK = '#14121a';

// ---------------- little 2D people for the photos (same family in every picture) ----------------
const FAM = {
  you: { skin: '#e2b590', shirt: '#8e2b2b', shirtD: '#6a1f1f', hair: '#2a1a10', hairStyle: 'short', h: 1.0 },
  mom: { skin: '#e8c0a0', shirt: '#3f6b5a', shirtD: '#2e5044', hair: '#5a3418', hairStyle: 'long', h: 1.04 },
  dad: { skin: '#d9a77f', shirt: '#3d5a86', shirtD: '#2c4466', hair: '#2b2420', hairStyle: 'short', h: 1.12, beard: true },
};
// person seen from the front, from the waist/hips up (portrait framing). (x, y) = centre of the shoulders, s = head radius
function person(g, P, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.lineJoin = 'round'; g.lineCap = 'round';
  const lw = Math.max(2, s * 0.08);
  // torso
  g.fillStyle = P.shirt; g.strokeStyle = INK; g.lineWidth = lw;
  g.beginPath(); g.moveTo(-s * 1.55, s * 0.25); g.quadraticCurveTo(-s * 1.7, s * 3.2, -s * 1.45, s * 4.4); g.lineTo(s * 1.45, s * 4.4); g.quadraticCurveTo(s * 1.7, s * 3.2, s * 1.55, s * 0.25); g.quadraticCurveTo(0, -s * 0.25, -s * 1.55, s * 0.25); g.fill(); g.stroke();
  g.fillStyle = P.shirtD; g.beginPath(); g.moveTo(s * 0.7, s * 0.4); g.quadraticCurveTo(s * 1.5, s * 2.5, s * 1.35, s * 4.4); g.lineTo(s * 1.45, s * 4.4); g.quadraticCurveTo(s * 1.7, s * 3.2, s * 1.55, s * 0.25); g.fill();
  if (P === FAM.you) { g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(-s * 0.25, s * 0.1); g.lineTo(-s * 0.3, s * 1.2); g.moveTo(s * 0.25, s * 0.1); g.lineTo(s * 0.3, s * 1.2); g.stroke(); }
  // arms (optionally around each other / holding things)
  g.strokeStyle = INK; g.lineWidth = lw;
  const arm = (side, ang) => { g.save(); g.translate(side * s * 1.45, s * 0.6); g.rotate(ang); g.fillStyle = P.shirt; g.beginPath(); g.ellipse(0, s * 1.4, s * 0.42, s * 1.5, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = P.skin; g.beginPath(); g.arc(0, s * 2.9, s * 0.36, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); };
  arm(-1, o.armL ?? 0.12); arm(1, o.armR ?? -0.12);
  // neck + head
  g.fillStyle = P.skin; g.fillRect(-s * 0.32, -s * 0.5, s * 0.64, s * 0.8); g.strokeRect(-s * 0.32, -s * 0.5, s * 0.64, s * 0.8);
  g.save(); g.translate(0, -s * 1.15); g.rotate(o.tilt || 0);
  if (P.hairStyle === 'long') { g.fillStyle = P.hair; g.beginPath(); g.moveTo(-s * 0.95, -s * 0.2); g.quadraticCurveTo(-s * 1.25, s * 0.9, -s * 1.05, s * 1.75); g.lineTo(-s * 0.55, s * 1.6); g.lineTo(-s * 0.5, s * 0.3); g.lineTo(s * 0.5, s * 0.3); g.lineTo(s * 0.55, s * 1.6); g.lineTo(s * 1.05, s * 1.75); g.quadraticCurveTo(s * 1.25, s * 0.9, s * 0.95, -s * 0.2); g.quadraticCurveTo(0, -s * 1.5, -s * 0.95, -s * 0.2); g.fill(); g.stroke(); }
  g.fillStyle = P.skin; g.beginPath(); g.ellipse(0, 0, s * 0.92, s * 1.08, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = P.hair; g.beginPath(); g.ellipse(0, -s * 0.45, s * 0.97, s * 0.72, 0, Math.PI * 1.02, Math.PI * 1.98); g.fill(); g.stroke();
  if (P.beard) { g.fillStyle = P.hair; g.beginPath(); g.ellipse(0, s * 0.62, s * 0.7, s * 0.42, 0, 0, Math.PI); g.fill(); }
  // happy photo face: eyes as smiling arcs, open smile
  g.strokeStyle = INK; g.lineWidth = lw * 0.9;
  for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * s * 0.36, -s * 0.02, s * 0.16, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  g.fillStyle = '#5a1a1a'; g.beginPath(); g.moveTo(-s * 0.36, s * 0.38); g.quadraticCurveTo(0, s * 0.82, s * 0.36, s * 0.38); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(220,90,80,0.35)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * s * 0.6, s * 0.28, s * 0.17, s * 0.1, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
  g.restore();
}
// the thing in the photos: very tall, very thin, grey sagging skin, black hollow eyes, head tilted. (x, yFeet) feet, h = total height px
export function thing2D(g, x, yFeet, h, o = {}) {
  g.save(); g.translate(x, yFeet); g.lineJoin = 'round'; g.lineCap = 'round';
  const s = h / 10, lw = Math.max(1.2, s * 0.09), skin = o.skin || '#8d918c', dark = '#5e625d';
  g.strokeStyle = INK; g.lineWidth = lw; g.globalAlpha = o.alpha ?? 1;
  // legs (long, thin, knees knobbly)
  for (const sx of [-1, 1]) { g.fillStyle = skin; g.beginPath(); g.moveTo(sx * s * 0.25, -s * 4.6); g.lineTo(sx * s * 0.42, -s * 2.4); g.lineTo(sx * s * 0.32, 0); g.lineTo(sx * s * 0.14, 0); g.lineTo(sx * s * 0.24, -s * 2.4); g.lineTo(sx * s * 0.08, -s * 4.6); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(sx * s * 0.33, -s * 2.4, s * 0.12, 0, 7); g.fill(); g.stroke(); }
  // torso: narrow ribcage + sagging skin hanging in folds like a wet sheet
  g.fillStyle = skin; g.beginPath(); g.moveTo(-s * 0.55, -s * 7.6); g.quadraticCurveTo(-s * 0.7, -s * 6, -s * 0.35, -s * 4.5); g.lineTo(s * 0.35, -s * 4.5); g.quadraticCurveTo(s * 0.7, -s * 6, s * 0.55, -s * 7.6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = dark; for (let i = 0; i < 4; i++) { const yy = -s * (7.0 - i * 0.55); g.beginPath(); g.moveTo(-s * 0.45, yy); g.quadraticCurveTo(0, yy + s * 0.35, s * 0.45, yy); g.quadraticCurveTo(0, yy + s * 0.2, -s * 0.45, yy); g.fill(); }
  g.fillStyle = skin; g.beginPath(); g.moveTo(-s * 0.6, -s * 5.6); g.quadraticCurveTo(-s * 0.9, -s * 4.2, -s * 0.55, -s * 3.6); g.quadraticCurveTo(-s * 0.2, -s * 4.0, 0, -s * 3.7); g.quadraticCurveTo(s * 0.25, -s * 4.1, s * 0.55, -s * 3.5); g.quadraticCurveTo(s * 0.9, -s * 4.3, s * 0.6, -s * 5.6); g.fill(); g.stroke();
  // arms hanging to the knees (or one reaching: o.reach = [dx, dy] end point relative to the right shoulder)
  const shY = -s * 7.5;
  for (const sx of [-1, 1]) {
    const reach = sx > 0 && o.reach; const ex = reach ? reach[0] : sx * s * 0.95, ey = reach ? reach[1] : -s * 2.4;
    const sxp = sx * s * 0.55, mx = (sxp + ex) / 2 + sx * s * 0.35, my = (shY + ey) / 2;
    g.lineWidth = s * 0.26 + lw * 2; g.strokeStyle = INK; g.beginPath(); g.moveTo(sxp, shY); g.lineTo(mx, my); g.lineTo(ex, ey); g.stroke();
    g.lineWidth = s * 0.26; g.strokeStyle = skin; g.beginPath(); g.moveTo(sxp, shY); g.lineTo(mx, my); g.lineTo(ex, ey); g.stroke();
    // long fingers
    g.lineWidth = s * 0.07 + lw; g.strokeStyle = INK;
    const ang = Math.atan2(ey - my, ex - mx);
    for (let f = 0; f < 4; f++) { const a = ang + (f - 1.5) * 0.18; const l = s * (0.9 + (f % 2) * 0.2); g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a) * l * 0.55, ey + Math.sin(a) * l * 0.55); g.lineTo(ex + Math.cos(a + 0.35 * (reach ? 1 : 0.2)) * l, ey + Math.sin(a + 0.35 * (reach ? 1 : 0.2)) * l); g.stroke(); }
    g.lineWidth = s * 0.07; g.strokeStyle = skin;
    for (let f = 0; f < 4; f++) { const a = ang + (f - 1.5) * 0.18; const l = s * (0.9 + (f % 2) * 0.2); g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a) * l * 0.55, ey + Math.sin(a) * l * 0.55); g.lineTo(ex + Math.cos(a + 0.35 * (reach ? 1 : 0.2)) * l, ey + Math.sin(a + 0.35 * (reach ? 1 : 0.2)) * l); g.stroke(); }
  }
  g.strokeStyle = INK; g.lineWidth = lw;
  // long neck + tilted head: long face, black hollow eyes, slack open jaw
  g.save(); g.translate(0, -s * 7.8); g.rotate(o.tilt ?? 0.45);
  g.fillStyle = skin; g.fillRect(-s * 0.13, -s * 0.9, s * 0.26, s * 1.0); g.strokeRect(-s * 0.13, -s * 0.9, s * 0.26, s * 1.0);
  g.translate(0, -s * 1.5);
  g.beginPath(); g.ellipse(0, 0, s * 0.42, s * 0.78, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#050405'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * s * 0.17, -s * 0.12, s * 0.11, s * 0.15, 0, 0, 7); g.fill(); }
  g.beginPath(); g.ellipse(0, s * 0.42, s * 0.12, s * 0.3, 0, 0, 7); g.fill();
  g.restore();
  g.restore();
}
// photo finishing: slight warm print tone, vignette, soft grain, white border
function printFinish(g, w, h, r, warm = 0.08) {
  const vg = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,0,0.35)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  g.fillStyle = `rgba(255,200,120,${warm})`; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.05 * r()})`; g.fillRect(r() * w, r() * h, 2, 2); }
  g.strokeStyle = '#f2ede2'; g.lineWidth = w * 0.035; g.strokeRect(0, 0, w, h);
}

// ---------------- the four photos ----------------
export function beachPhoto(g, w, h, figure = 1) {
  const r = R(31);
  const sky = g.createLinearGradient(0, 0, 0, h * 0.5); sky.addColorStop(0, '#6fa6d6'); sky.addColorStop(1, '#cfe2ee'); g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.5);
  g.fillStyle = 'rgba(255,255,255,0.8)'; for (const [cx, cy, s] of [[0.2, 0.12, 1], [0.7, 0.08, 1.3], [0.9, 0.2, 0.8]]) { for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx * w + (k - 1.5) * 40 * s, cy * h + Math.sin(k) * 8, 50 * s, 22 * s, 0, 0, 7); g.fill(); } }
  g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(w * 0.82, h * 0.13, 38, 0, 7); g.fill();
  const sea = g.createLinearGradient(0, h * 0.42, 0, h * 0.6); sea.addColorStop(0, '#2f6f96'); sea.addColorStop(1, '#4f98b8'); g.fillStyle = sea; g.fillRect(0, h * 0.42, w, h * 0.18);
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4; for (let i = 0; i < 26; i++) { const x = r() * w, y = h * (0.45 + r() * 0.13); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 6, x + 44, y); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(0, h * 0.6); for (let x = 0; x <= w; x += 30) g.lineTo(x, h * 0.6 - 6 + Math.sin(x * 0.03) * 6); g.lineTo(w, h * 0.62); g.lineTo(0, h * 0.62); g.fill();
  const sand = g.createLinearGradient(0, h * 0.6, 0, h); sand.addColorStop(0, '#e2c995'); sand.addColorStop(1, '#c9a96e'); g.fillStyle = sand; g.fillRect(0, h * 0.6, w, h * 0.4);
  g.fillStyle = 'rgba(150,110,60,0.25)'; for (let i = 0; i < 300; i++) g.fillRect(r() * w, h * 0.62 + r() * h * 0.38, 3, 3);
  // seagulls
  g.strokeStyle = '#333'; g.lineWidth = 3; for (const [x, y] of [[0.15, 0.25], [0.22, 0.2], [0.58, 0.18]]) { g.beginPath(); g.moveTo(x * w - 14, y * h); g.quadraticCurveTo(x * w - 6, y * h - 8, x * w, y * h); g.quadraticCurveTo(x * w + 6, y * h - 8, x * w + 14, y * h); g.stroke(); }
  // the thing: way back, standing at the waterline (small)
  if (figure) thing2D(g, w * 0.76, h * 0.605, h * 0.13, { tilt: 0.35, alpha: 0.9 * figure, skin: '#9a9e99' });
  // the family: Dad, you, Mom
  const s = h * 0.075;
  person(g, FAM.dad, w * 0.26, h * 0.6, s * 1.08, { armR: -0.5 });
  person(g, FAM.mom, w * 0.62, h * 0.62, s * 1.0, { armL: 0.5 });
  person(g, FAM.you, w * 0.44, h * 0.66, s * 0.95, { armL: 0.3, armR: -0.3 });
  printFinish(g, w, h, r, 0.06);
}
export function xmasPhoto(g, w, h, figure = 1) {
  const r = R(41);
  g.fillStyle = '#5a4a3e'; g.fillRect(0, 0, w, h); // warm wall
  const wl = g.createRadialGradient(w * 0.7, h * 0.45, 50, w * 0.6, h * 0.5, w * 0.8); wl.addColorStop(0, 'rgba(255,190,120,0.55)'); wl.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = wl; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a2c24'; g.fillRect(0, h * 0.78, w, h * 0.22);   // floor
  // the dark corner with a curtain (left)
  const cg = g.createLinearGradient(0, 0, w * 0.32, 0); cg.addColorStop(0, 'rgba(8,8,12,0.9)'); cg.addColorStop(1, 'rgba(8,8,12,0)'); g.fillStyle = cg; g.fillRect(0, 0, w * 0.32, h);
  g.fillStyle = '#4a2a2a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w * (0.02 + i * 0.05), 0); g.quadraticCurveTo(w * (0.04 + i * 0.05), h * 0.4, w * (0.03 + i * 0.05), h * 0.8); g.lineTo(w * (0.06 + i * 0.05), h * 0.8); g.quadraticCurveTo(w * (0.07 + i * 0.05), h * 0.4, w * (0.05 + i * 0.05), 0); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, w * 0.25, h);
  if (figure) { thing2D(g, w * 0.15, h * 0.84, h * 0.74, { tilt: 0.75, alpha: figure, skin: '#737772' }); const dk = g.createLinearGradient(0, 0, w * 0.3, 0); dk.addColorStop(0, 'rgba(5,5,8,0.55)'); dk.addColorStop(1, 'rgba(5,5,8,0)'); g.fillStyle = dk; g.fillRect(0, 0, w * 0.3, h); }
  // tree with lights (right)
  g.fillStyle = '#1f4a2c'; for (let i = 0; i < 5; i++) { const y0 = h * (0.12 + i * 0.13), ww = w * (0.06 + i * 0.035); g.beginPath(); g.moveTo(w * 0.83, y0); g.lineTo(w * 0.83 - ww, y0 + h * 0.2); g.lineTo(w * 0.83 + ww, y0 + h * 0.2); g.fill(); }
  g.fillStyle = '#4a2a14'; g.fillRect(w * 0.81, h * 0.8, w * 0.04, h * 0.06);
  g.fillStyle = '#ffd34a'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr_ = k % 2 ? 14 : 32; g.lineTo(w * 0.83 + Math.cos(a) * rr_, h * 0.11 + Math.sin(a) * rr_); } g.fill();
  const cols = ['#ffd34a', '#ff5a4a', '#5ac8fa', '#9aff7a']; for (let i = 0; i < 46; i++) { const k = r(), y = h * (0.18 + k * 0.6), x = w * 0.83 + (r() - 0.5) * w * (0.05 + k * 0.2); g.fillStyle = cols[i % 4]; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,220,150,0.25)'; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); }
  for (const [x, c] of [[0.74, '#b02a2a'], [0.88, '#2a6ab0'], [0.8, '#d0b030']]) { g.fillStyle = c; g.fillRect(w * x, h * 0.84, w * 0.06, h * 0.06); g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(w * x, h * 0.84, w * 0.06, h * 0.06); g.fillStyle = '#eee'; g.fillRect(w * x + w * 0.027, h * 0.84, w * 0.006, h * 0.06); }
  // sofa + the family on it, Santa hats
  g.fillStyle = '#6a3a34'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.roundRect(w * 0.27, h * 0.5, w * 0.46, h * 0.36, 30); g.fill(); g.stroke();
  const s = h * 0.06;
  person(g, FAM.mom, w * 0.36, h * 0.55, s, { armR: -0.3 });
  person(g, FAM.dad, w * 0.63, h * 0.53, s * 1.06, { armL: 0.3 });
  person(g, FAM.you, w * 0.5, h * 0.58, s * 0.95, {});
  for (const [x, y, ss_] of [[0.5, 0.58 - 0.135, 0.95], [0.36, 0.55 - 0.13, 1]]) { g.fillStyle = '#c4161c'; g.beginPath(); g.moveTo(w * x - s * ss_, h * y); g.quadraticCurveTo(w * x, h * y - s * 2.2, w * x + s * ss_ * 1.6, h * y - s * 0.8); g.lineTo(w * x + s * ss_, h * y); g.fill(); g.fillStyle = '#fff'; g.fillRect(w * x - s * ss_ * 1.05, h * y - s * 0.1, s * ss_ * 2.1, s * 0.35); g.beginPath(); g.arc(w * x + s * ss_ * 1.6, h * y - s * 0.8, s * 0.25, 0, 7); g.fill(); }
  printFinish(g, w, h, r, 0.1);
}
export function bdayPhoto(g, w, h, figure = 1) {
  const r = R(51);
  g.fillStyle = '#c9c2a8'; g.fillRect(0, 0, w, h); // kitchen wall
  g.fillStyle = 'rgba(255,255,255,0.25)'; for (let x = 0; x < w; x += 60) for (let y = 0; y < h * 0.45; y += 60) g.fillRect(x + 2, y + 2, 56, 56);  // tiles
  g.fillStyle = '#7a5a3a'; g.fillRect(0, h * 0.42, w * 0.22, h * 0.05); g.fillRect(w * 0.8, h * 0.4, w * 0.2, h * 0.05);  // shelves
  for (let i = 0; i < 4; i++) { g.fillStyle = ['#d08040', '#3a7a5a', '#e0d0b0', '#a03030'][i]; g.fillRect(w * (0.03 + i * 0.045), h * 0.35, w * 0.035, h * 0.07); }
  // balloons + garland
  for (const [x, c] of [[0.1, '#ff5a6a'], [0.18, '#5ac8fa'], [0.88, '#ffd34a'], [0.95, '#9a6aff']]) { g.fillStyle = c; g.beginPath(); g.ellipse(w * x, h * 0.16, 34, 42, 0, 0, 7); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * x, h * 0.16 + 42); g.lineTo(w * x + 10, h * 0.45); g.stroke(); }
  g.strokeStyle = '#d04040'; g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.22, h * 0.05); g.quadraticCurveTo(w * 0.5, h * 0.16, w * 0.78, h * 0.05); g.stroke();
  const flags = ['#ff5a4a', '#ffd34a', '#5ac8fa', '#9aff7a']; for (let i = 0; i < 9; i++) { const k = (i + 0.5) / 9, x = w * (0.22 + k * 0.56), y = h * (0.05 + Math.sin(k * Math.PI) * 0.1); g.fillStyle = flags[i % 4]; g.beginPath(); g.moveTo(x - 18, y); g.lineTo(x + 18, y); g.lineTo(x, y + 40); g.fill(); }
  // the thing behind your chair: its body fills the space behind you, its head cut off by the top edge (just the black eyes)
  if (figure) {
    g.save(); g.globalAlpha = figure;
    const sk = '#868a85', dk = '#5e625d';
    g.fillStyle = sk; g.strokeStyle = INK; g.lineWidth = 4;
    // shoulders + narrow chest, skin hanging in folds
    g.beginPath(); g.moveTo(w * 0.36, h * 0.2); g.quadraticCurveTo(w * 0.5, h * 0.13, w * 0.64, h * 0.2); g.quadraticCurveTo(w * 0.6, h * 0.42, w * 0.58, h * 0.62); g.lineTo(w * 0.42, h * 0.62); g.quadraticCurveTo(w * 0.4, h * 0.42, w * 0.36, h * 0.2); g.fill(); g.stroke();
    g.fillStyle = dk; for (let i = 0; i < 5; i++) { const y = h * (0.25 + i * 0.065); g.beginPath(); g.moveTo(w * 0.43, y); g.quadraticCurveTo(w * 0.5, y + 24, w * 0.57, y); g.quadraticCurveTo(w * 0.5, y + 10, w * 0.43, y); g.fill(); }
    // left arm hanging behind Mom's side
    g.lineCap = 'round'; for (const [lw_, c] of [[46, INK], [36, sk]]) { g.lineWidth = lw_; g.strokeStyle = c; g.beginPath(); g.moveTo(w * 0.37, h * 0.22); g.lineTo(w * 0.33, h * 0.45); g.lineTo(w * 0.35, h * 0.62); g.stroke(); }
    // long neck + head cut by the top edge: forehead, black eyes, the top of the open mouth
    g.fillStyle = sk; g.fillRect(w * 0.485, h * 0.06, w * 0.03, h * 0.09); g.strokeRect(w * 0.485, h * 0.06, w * 0.03, h * 0.09);
    g.save(); g.translate(w * 0.5, h * 0.045); g.rotate(-0.22); g.beginPath(); g.ellipse(0, 0, w * 0.06, h * 0.11, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#040304'; g.beginPath(); g.ellipse(-w * 0.022, h * 0.01, 15, 12, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.022, h * 0.01, 15, 12, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(0, h * 0.075, 10, 24, 0, 0, 7); g.fill(); g.restore();
    // right arm reaching down to your shoulder
    for (const [lw_, c] of [[46, INK], [36, sk]]) { g.lineWidth = lw_; g.strokeStyle = c; g.beginPath(); g.moveTo(w * 0.63, h * 0.22); g.lineTo(w * 0.66, h * 0.38); g.lineTo(w * 0.585, h * 0.5); g.stroke(); }
    g.restore();
  }
  // chair back + you sitting, parents leaning in
  const s = h * 0.075;
  person(g, FAM.mom, w * 0.2, h * 0.5, s, { armR: -0.7 });
  person(g, FAM.dad, w * 0.8, h * 0.48, s * 1.08, { armL: 0.7 });
  g.fillStyle = '#6a4a2e'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.roundRect(w * 0.4, h * 0.42, w * 0.2, h * 0.3, 14); g.fill(); g.stroke();
  person(g, FAM.you, w * 0.5, h * 0.55, s * 0.95, { armL: 0.25, armR: -0.25 });
  // its long grey fingers resting on your shoulder (on top of you)
  if (figure) { g.save(); g.globalAlpha = figure; const sx = w * 0.555, sy = h * 0.555; g.lineCap = 'round';
    for (let f = 0; f < 4; f++) { const x0 = sx - 18 + f * 16, pts = [[sx + 25, sy - 55], [x0 - 10, sy - 8], [x0 - 22 - f * 2, sy + 42 + (f % 2) * 12]];
      g.lineWidth = 22; g.strokeStyle = INK; g.beginPath(); g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.lineTo(...pts[2]); g.stroke(); g.lineWidth = 15; g.strokeStyle = '#8b8f8a'; g.beginPath(); g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.lineTo(...pts[2]); g.stroke(); g.fillStyle = '#1a1414'; g.beginPath(); g.arc(pts[2][0], pts[2][1], 6, 0, 7); g.fill(); }
    g.restore(); }
  // the table with the cake (foreground)
  g.fillStyle = '#e8e2d2'; g.strokeStyle = INK; g.lineWidth = 4; g.fillRect(0, h * 0.78, w, h * 0.22); g.strokeRect(-5, h * 0.78, w + 10, h * 0.3);
  g.fillStyle = '#f2d8e6'; g.beginPath(); g.ellipse(w * 0.5, h * 0.78, w * 0.12, h * 0.035, 0, 0, 7); g.fill(); g.stroke(); g.fillRect(w * 0.38, h * 0.7, w * 0.24, h * 0.08); g.strokeRect(w * 0.38, h * 0.7, w * 0.24, h * 0.08);
  g.fillStyle = '#ffeaf3'; g.beginPath(); g.ellipse(w * 0.5, h * 0.7, w * 0.12, h * 0.03, 0, 0, 7); g.fill(); g.stroke();
  for (let i = 0; i < 6; i++) { const x = w * (0.42 + i * 0.032); g.fillStyle = ['#5ac8fa', '#ff5a6a', '#ffd34a'][i % 3]; g.fillRect(x - 4, h * 0.63, 8, h * 0.06); g.fillStyle = '#ffcc55'; g.beginPath(); g.ellipse(x, h * 0.62, 6, 12, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,200,90,0.3)'; g.beginPath(); g.arc(x, h * 0.62, 24, 0, 7); g.fill(); }
  printFinish(g, w, h, r, 0.08);
}
// the last photo: this hallway, tonight, you from behind, staring at the photos (a dark flash photo). No thing in it.
export function nightPhoto(g, w, h) {
  const r = R(61);
  g.fillStyle = '#0c0f16'; g.fillRect(0, 0, w, h);
  // hallway in perspective toward a vanishing point
  const vx = w * 0.56, vy = h * 0.45;
  const q = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); };
  q([[0, 0], [w, 0], [vx + 90, vy - 90], [vx - 90, vy - 90]], '#1d2230');
  q([[0, h], [w, h], [vx + 90, vy + 80], [vx - 90, vy + 80]], '#2a2420');
  q([[0, 0], [vx - 90, vy - 90], [vx - 90, vy + 80], [0, h]], '#2e3546');
  q([[w, 0], [vx + 90, vy - 90], [vx + 90, vy + 80], [w, h]], '#252b3a');
  q([[vx - 90, vy - 90], [vx + 90, vy - 90], [vx + 90, vy + 80], [vx - 90, vy + 80]], '#10131b');
  // photos on the left wall (receding)
  for (let i = 0; i < 4; i++) { const k = i / 4, x0 = lerpN(w * 0.05, vx - 110, k), x1 = lerpN(w * 0.16, vx - 100, k), yy = lerpN(h * 0.32, vy - 30, k), hh = lerpN(h * 0.16, 22, k);
    g.fillStyle = '#3a2a1a'; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy + hh * 0.1); g.lineTo(x1, yy + hh * 0.9); g.lineTo(x0, yy + hh); g.fill(); g.fillStyle = '#7a8090'; g.beginPath(); g.moveTo(x0 + 6, yy + 6); g.lineTo(x1 - 6, yy + hh * 0.1 + 5); g.lineTo(x1 - 6, yy + hh * 0.9 - 5); g.lineTo(x0 + 6, yy + hh - 6); g.fill(); }
  // you, from behind, small, phone glow in front of you
  const px = w * 0.36, py = h * 0.86, s = h * 0.06;
  g.fillStyle = 'rgba(200,220,255,0.18)'; g.beginPath(); g.ellipse(px - s * 2, py - s * 7.5, s * 4, s * 3, 0, 0, 7); g.fill();
  g.fillStyle = '#5a1c1c'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(px - s * 1.6, py - s * 6); g.quadraticCurveTo(px - s * 1.8, py - s * 2, px - s * 1.4, py); g.lineTo(px + s * 1.4, py); g.quadraticCurveTo(px + s * 1.8, py - s * 2, px + s * 1.6, py - s * 6); g.quadraticCurveTo(px, py - s * 6.6, px - s * 1.6, py - s * 6); g.fill(); g.stroke();
  g.fillStyle = '#1a0f0a'; g.beginPath(); g.ellipse(px, py - s * 7.3, s * 0.95, s * 1.1, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#4a1414'; g.beginPath(); g.ellipse(px, py - s * 6.4, s * 1.2, s * 0.6, 0, 0, Math.PI); g.fill();
  // harsh flash falloff + heavy grain: it looks like someone took it from the dark end of the hall
  const fl = g.createRadialGradient(px, py - s * 5, 30, px, py - s * 5, w * 0.7); fl.addColorStop(0, 'rgba(220,230,255,0.22)'); fl.addColorStop(1, 'rgba(0,0,0,0.4)'); g.fillStyle = fl; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.09 * r()})`; g.fillRect(r() * w, r() * h, 2, 2); }
  g.strokeStyle = '#f2ede2'; g.lineWidth = w * 0.035; g.strokeRect(0, 0, w, h);
}
const lerpN = (a, b, k) => a + (b - a) * k;

export function buildTextures2() {
  // blue-grey hallway wallpaper: soft vertical stripes, a little wear (mix of the TikTok look + Part 3 mood)
  T2.wall = cv(1024, 1024, (g, w, h) => { const r = R(7); g.fillStyle = '#56607a'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(30,36,52,0.22)'; g.fillRect(x, 0, 22, h); g.fillStyle = 'rgba(160,170,200,0.06)'; g.fillRect(x + 30, 0, 4, h); }
    stains(g, w, h, r, 10, '30,30,40', 0.3); });
  T2.wall.wrapS = T2.wall.wrapT = THREE.RepeatWrapping;
  T2.wallL = cv(512, 512, (g, w, h) => { const r = R(8); g.fillStyle = '#4c5468'; g.fillRect(0, 0, w, h); stains(g, w, h, r, 8, '25,25,35', 0.3); });
  T2.wallL.wrapS = T2.wallL.wrapT = THREE.RepeatWrapping;
  T2.floor = cv(1024, 1024, (g, w, h) => { const r = R(3);
    for (let y = 0; y < h; y += 80) { const b = 58 + r() * 14; g.fillStyle = `rgb(${b + 22},${b + 6},${b - 10})`; g.fillRect(0, y, w, 80); g.fillStyle = 'rgba(10,6,4,0.65)'; g.fillRect(0, y, w, 3); g.fillRect(r() * w, y, 3, 80);
      for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(30,18,10,${0.12 + r() * 0.15})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const yy = y + 8 + r() * 64; g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + (r() - 0.5) * 8, w * 0.6, yy + (r() - 0.5) * 8, w, yy); g.stroke(); } }
    stains(g, w, h, r, 8, '15,10,8', 0.35); });
  T2.floor.wrapS = T2.floor.wrapT = THREE.RepeatWrapping;
  T2.runner = cv(256, 1024, (g, w, h) => { g.fillStyle = '#3a2430'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a5a4a'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68);
    for (let y = 80; y < h - 60; y += 90) { g.strokeStyle = 'rgba(150,110,80,0.45)'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2 + 40, y + 40); g.lineTo(w / 2, y + 80); g.lineTo(w / 2 - 40, y + 40); g.closePath(); g.stroke(); } stains(g, w, h, R(4), 6, '10,8,8', 0.4); });
  T2.ceiling = cv(512, 512, (g, w, h) => { const r = R(21); g.fillStyle = '#6c7080'; g.fillRect(0, 0, w, h); stains(g, w, h, r, 8, '40,38,45', 0.35);
    g.strokeStyle = 'rgba(25,24,30,0.55)'; g.lineWidth = 2; let x = 20, y = 300; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 18; k++) { x += 22 + r() * 10; y += (r() - 0.5) * 34; g.lineTo(x, y); } g.stroke(); });
  T2.ceiling.wrapS = T2.ceiling.wrapT = THREE.RepeatWrapping;
  const PW = 1600, PH = 1200;
  T2.beach = cv(PW, PH, (g, w, h) => beachPhoto(g, w, h)); T2.xmas = cv(PW, PH, (g, w, h) => xmasPhoto(g, w, h)); T2.bday = cv(PW, PH, (g, w, h) => bdayPhoto(g, w, h)); T2.night = cv(PW, PH, (g, w, h) => nightPhoto(g, w, h));
  T2.glare = cv(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0.25, 'rgba(255,255,255,0)'); gr.addColorStop(0.4, 'rgba(220,230,255,0.22)'); gr.addColorStop(0.47, 'rgba(255,255,255,0)'); gr.addColorStop(0.62, 'rgba(220,230,255,0.1)'); gr.addColorStop(0.66, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  T2.frosted = cv(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w * 0.6, h * 0.3, 10, w / 2, h / 2, w * 0.8); gr.addColorStop(0, '#c8d6f0'); gr.addColorStop(1, '#3a4866'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = R(2); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${0.08 * r()})`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.strokeStyle = 'rgba(10,14,22,0.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.2, h); g.quadraticCurveTo(w * 0.35, h * 0.5, w * 0.15, 0); g.moveTo(w * 0.3, h * 0.6); g.lineTo(w * 0.8, h * 0.35); g.stroke(); });
}
// survivor face decals with eyes looking up (for the "Don't look up" close-up)
const fc = {};
export function faceUp(k) {   // k 0..1 pupils sliding upward
  const key = Math.round(k * 10); if (fc[key]) return fc[key];
  fc[key] = cv(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#1a1210'; g.lineCap = 'round';
    g.lineWidth = 9; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128 + s * 30, 90 - key * 1.2); g.lineTo(128 + s * 70, 98 - key * 0.6); g.stroke(); }
    for (const s of [-1, 1]) { const ex = 128 + s * 48, ey = 124; g.fillStyle = '#f4f1ea'; g.beginPath(); g.ellipse(ex, ey, 17, 16, 0, 0, 7); g.fill(); g.lineWidth = 4; g.stroke();
      g.fillStyle = '#2b1d14'; g.beginPath(); g.arc(ex, ey + 2 - key * 0.9, 7, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 3, ey - 1 - key * 0.9, 2.5, 0, 7); g.fill(); }
    g.lineWidth = 5; g.beginPath(); g.moveTo(126, 140); g.quadraticCurveTo(136, 160, 122, 166); g.stroke();
    g.fillStyle = '#3a1416'; g.beginPath(); g.ellipse(128, 194, 10, 7, 0, 0, 7); g.fill(); });
  return fc[key];
}
// phone lock screen with the battery at 1 %
export function batteryTex() {
  return cv(512, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0f1626'); gr.addColorStop(1, '#05070c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '900 150px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('11:52', w / 2, 330); g.font = '600 34px Inter, sans-serif'; g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillText('Saturday, November 7', w / 2, 390);
    // battery icon + 1 %
    g.strokeStyle = '#ff3b30'; g.lineWidth = 10; g.strokeRect(w / 2 - 120, 520, 220, 110); g.fillStyle = '#ff3b30'; g.fillRect(w / 2 + 104, 555, 18, 40); g.fillRect(w / 2 - 108, 532, 14, 86);
    g.font = '900 72px Inter, sans-serif'; g.fillText('1%', w / 2, 720); g.font = '600 32px Inter, sans-serif'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText('Low Battery', w / 2, 780); g.fillText('Flashlight will turn off', w / 2, 826);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(w / 2 - 90, h - 40, 180, 8); });
}

// ---------- procedural canvas textures (old, slightly run-down house) ----------
import * as THREE from 'three';
const R = seed => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function stains(g, w, h, r, n, col, a) { for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, rad = 20 + r() * 120; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${col},${a * (0.4 + r() * 0.6)})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); } }
export const TEX = {};
export function buildTextures() {
  // faded floral wallpaper with seams, water stains and peeling patches
  TEX.wallpaper = cv(1024, 1024, (g, w, h) => { const r = R(5);
    g.fillStyle = '#8f8a6c'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 128) { g.fillStyle = 'rgba(70,72,50,0.18)'; g.fillRect(x, 0, 64, h); g.strokeStyle = 'rgba(40,38,30,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 40; y < h; y += 110) for (let x = 32 + ((y / 110) % 2) * 64; x < w; x += 128) { g.fillStyle = 'rgba(110,70,60,0.35)'; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 9, 6, a, 0, 7); g.fill(); } g.fillStyle = 'rgba(70,90,50,0.35)'; g.beginPath(); g.ellipse(x + 16, y + 20, 12, 4, 0.7, 0, 7); g.fill(); }
    stains(g, w, h, r, 14, '60,48,30', 0.35);
    g.fillStyle = 'rgba(70,56,35,0.45)'; for (let i = 0; i < 6; i++) { const x = r() * w; const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, 'rgba(70,56,35,0.55)'); gr.addColorStop(1, 'rgba(70,56,35,0)'); g.fillStyle = gr; g.fillRect(x, 0, 30 + r() * 60, 200 + r() * 250); }
    for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h, pw = 40 + r() * 90, ph = 30 + r() * 80; g.fillStyle = '#b9ad94'; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; g.lineTo(x + Math.cos(a) * pw * (0.6 + r() * 0.4), y + Math.sin(a) * ph * (0.6 + r() * 0.4)); } g.fill(); g.strokeStyle = 'rgba(30,25,20,0.5)'; g.lineWidth = 2; g.stroke(); }
  });
  TEX.wallpaper.wrapS = TEX.wallpaper.wrapT = THREE.RepeatWrapping;
  TEX.plaster = cv(512, 512, (g, w, h) => { const r = R(9); g.fillStyle = '#8c887c'; g.fillRect(0, 0, w, h); stains(g, w, h, r, 10, '70,62,48', 0.4);
    g.strokeStyle = 'rgba(30,28,24,0.6)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (r() - 0.5) * 60; y += (r() - 0.3) * 40; g.lineTo(x, y); } g.stroke(); } });
  TEX.plaster.wrapS = TEX.plaster.wrapT = THREE.RepeatWrapping;
  // worn wooden planks with scratches and dust
  TEX.planks = cv(1024, 1024, (g, w, h) => { const r = R(3);
    for (let y = 0; y < h; y += 64) { const b = 70 + r() * 25; g.fillStyle = `rgb(${b + 25},${b},${b - 25})`; g.fillRect(0, y, w, 64); g.fillStyle = 'rgba(20,12,6,0.6)'; g.fillRect(0, y, w, 3);
      const off = r() * w; g.fillRect(off, y, 3, 64); for (let k = 0; k < 9; k++) { g.strokeStyle = `rgba(40,25,12,${0.15 + r() * 0.2})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const yy = y + 8 + r() * 48; g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + (r() - 0.5) * 8, w * 0.6, yy + (r() - 0.5) * 8, w, yy); g.stroke(); } }
    stains(g, w, h, r, 12, '25,20,15', 0.4); g.strokeStyle = 'rgba(200,190,170,0.15)'; for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 80, y + (r() - 0.5) * 10); g.stroke(); } });
  TEX.planks.wrapS = TEX.planks.wrapT = THREE.RepeatWrapping;
  TEX.cardboard = cv(256, 256, (g, w, h) => { const r = R(11); g.fillStyle = '#a07c4e'; g.fillRect(0, 0, w, h); stains(g, w, h, r, 6, '70,50,25', 0.4);
    g.fillStyle = 'rgba(200,190,160,0.55)'; g.fillRect(w / 2 - 22, 0, 44, h); g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 2; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = 'rgba(30,20,10,0.75)'; g.font = 'bold 30px sans-serif'; g.save(); g.translate(40, 200); g.rotate(-0.05); g.fillText(['KITCHEN', 'BOOKS', 'MISC', 'XMAS'][Math.floor(r() * 4)], 0, 0); g.restore(); });
  TEX.rug = cv(512, 512, (g, w, h) => { const r = R(13); g.fillStyle = '#5a2b2b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a3a'; g.lineWidth = 14; g.strokeRect(30, 30, w - 60, h - 60); g.lineWidth = 4; g.strokeRect(60, 60, w - 120, h - 120);
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(140,110,60,0.5)'; g.beginPath(); g.ellipse(w / 2, h / 2, 40 + i * 30, 20 + i * 18, 0, 0, 7); g.lineWidth = 3; g.strokeStyle = 'rgba(140,110,60,0.5)'; g.stroke(); } stains(g, w, h, r, 8, '20,10,8', 0.5); });
  TEX.blanket = cv(512, 512, (g, w, h) => { g.fillStyle = '#3d4f6a'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 64) { if (((x + y) / 64) % 2) { g.fillStyle = 'rgba(20,30,45,0.45)'; g.fillRect(x, y, 64, 64); } } g.strokeStyle = 'rgba(200,190,160,0.25)'; g.lineWidth = 3; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x + 32, 0); g.lineTo(x + 32, h); g.stroke(); } });
  TEX.poster = cv(256, 360, (g, w, h) => { g.fillStyle = '#1c1c28'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, 150, 10, w / 2, 150, 140); gr.addColorStop(0, '#d0553a'); gr.addColorStop(1, '#2a1a28'); g.fillStyle = gr; g.fillRect(10, 10, w - 20, 250);
    g.fillStyle = '#0b0b10'; g.beginPath(); g.moveTo(40, 260); g.lineTo(100, 150); g.lineTo(140, 200); g.lineTo(180, 120); g.lineTo(220, 260); g.fill(); g.fillStyle = '#e9e1cc'; g.font = '900 34px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('NIGHT', w / 2, 305); g.font = '900 22px Inter, sans-serif'; g.fillText('DRIVE TOUR', w / 2, 335);
    g.fillStyle = '#8f8a6c'; g.beginPath(); g.moveTo(w, 0); g.lineTo(w - 70, 0); g.lineTo(w, 60); g.fill(); });
  TEX.photo = cv(128, 160, (g, w, h) => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#6d8aa8'; g.fillRect(10, 10, w - 20, 110); g.fillStyle = '#d4a582'; for (const x of [45, 80]) { g.beginPath(); g.ellipse(x, 60, 13, 15, 0, 0, 7); g.fill(); g.fillStyle = '#3a2416'; g.beginPath(); g.ellipse(x, 50, 14, 9, 0, Math.PI, 7); g.fill(); g.fillStyle = '#d4a582'; } g.fillStyle = '#7a3030'; g.fillRect(28, 78, 30, 42); g.fillStyle = '#304a70'; g.fillRect(64, 78, 30, 42); });
  TEX.ceiling = cv(512, 512, (g, w, h) => { const r = R(21); g.fillStyle = '#7c786e'; g.fillRect(0, 0, w, h); stains(g, w, h, r, 9, '80,60,30', 0.45); g.strokeStyle = 'rgba(25,22,18,0.7)'; g.lineWidth = 2.5; let x = 40, y = 250; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 20; k++) { x += 20 + r() * 10; y += (r() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); });
  TEX.ceiling.wrapS = TEX.ceiling.wrapT = THREE.RepeatWrapping;
  TEX.tvscreen = cv(256, 200, (g, w, h) => { g.fillStyle = '#0d1012'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(120,140,150,0.15)'; g.beginPath(); g.ellipse(70, 50, 60, 30, -0.4, 0, 7); g.fill(); });
  TEX.pizza = cv(256, 256, (g, w, h) => { g.fillStyle = '#d2c3a0'; g.fillRect(0, 0, w, h); g.fillStyle = '#b02020'; g.font = '900 40px sans-serif'; g.textAlign = 'center'; g.fillText('PIZZA', w / 2, 120); g.beginPath(); g.arc(w / 2, 170, 30, 0, 7); g.strokeStyle = '#b02020'; g.lineWidth = 6; g.stroke(); stains(g, w, h, R(4), 4, '120,80,20', 0.5); });
}
// face decals (expressions) for the survivor
const faceCache = {};
export function faceTex(expr) {
  if (faceCache[expr]) return faceCache[expr];
  faceCache[expr] = cv(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#1a1210'; g.lineCap = 'round';
    const wide = expr === 'scared' || expr === 'terror', closed = expr === 'closed';
    // brows
    g.lineWidth = 9; for (const s of [-1, 1]) { g.beginPath(); if (wide) { g.moveTo(128 + s * 30, 92); g.lineTo(128 + s * 70, 100); } else { g.moveTo(128 + s * 30, 98); g.lineTo(128 + s * 70, 96); } g.stroke(); }
    for (const s of [-1, 1]) {
      const ex = 128 + s * 48, ey = 124;
      if (closed) { g.lineWidth = 6; g.beginPath(); g.moveTo(ex - 18, ey); g.quadraticCurveTo(ex, ey + 10, ex + 18, ey); g.stroke(); continue; }
      g.fillStyle = '#f4f1ea'; g.beginPath(); g.ellipse(ex, ey, 17, wide ? 17 : 12, 0, 0, 7); g.fill(); g.lineWidth = 4; g.stroke();
      g.fillStyle = '#2b1d14'; g.beginPath(); g.arc(ex, ey + 1, wide ? 7 : 8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 3, ey - 3, 2.5, 0, 7); g.fill();
    }
    g.lineWidth = 5; g.beginPath(); g.moveTo(126, 140); g.quadraticCurveTo(136, 160, 122, 166); g.stroke();
    if (expr === 'terror') { g.fillStyle = '#3a1416'; g.beginPath(); g.ellipse(128, 196, 18, 22, 0, 0, 7); g.fill(); }
    else if (wide) { g.fillStyle = '#3a1416'; g.beginPath(); g.ellipse(128, 194, 12, 9, 0, 0, 7); g.fill(); }
    else { g.lineWidth = 5; g.beginPath(); g.moveTo(108, 192); g.quadraticCurveTo(128, 198, 148, 192); g.stroke(); }
  });
  return faceCache[expr];
}
// phone screen (chat message from mom / feed)
const phoneCache = {};
export function phoneTex(mode) {
  if (phoneCache[mode]) return phoneCache[mode];
  phoneCache[mode] = cv(256, 512, (g, w, h) => {
    if (mode === 'light') { g.fillStyle = '#e8eef8'; g.fillRect(0, 0, w, h); return; }
    g.fillStyle = '#10141c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = ['#3a4a6a', '#6a3a4a', '#4a6a5a', '#5a4a3a'][i]; g.fillRect(14, 20 + i * 120, w - 28, 100); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(24, 100 + i * 120, 120, 8); }
    if (mode === 'msg') { g.fillStyle = 'rgba(30,34,44,0.96)'; g.fillRect(8, 30, w - 16, 120); g.fillStyle = '#5ac8fa'; g.beginPath(); g.arc(36, 62, 16, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.fillText('Mom', 62, 58); g.font = '17px sans-serif'; g.fillText('staying at grandma\'s', 20, 100); g.fillText('tonight. back tmrw ♥', 20, 126); }
  });
  return phoneCache[mode];
}

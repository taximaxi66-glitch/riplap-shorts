// ---------- captions: word-accurate pop, one colored keyword ----------
const KEY = new Set(['three', 'asleep', 'doorbell', 'downstairs', 'nobody', 'nobodys', 'again', 'peephole', 'empty', 'pressed', 'finger', 'above', 'bends', 'you', 'tall', 'door', 'ladder', 'letterbox', 'open', 'fingers', 'feeling', 'creak', 'options', 'stairs', 'still', 'leaves', 'do', 'comments', 'follow'])
let CHUNKS = null;
function buildChunks() {
  CHUNKS = [];
  for (const ln of T.lines) {
    const ws = T.words.filter(w => w.line === ln.i); let cur = [];
    // fix overlapping starts
    for (let i = 1; i < ws.length; i++) if (ws[i].s < ws[i - 1].s + 0.06) ws[i].s = ws[i - 1].s + 0.06;
    ws.forEach((w, i) => {
      cur.push(w);
      const punct = /[,.?!:]$/.test(w.w) || /\.\.\.$/.test(w.w);
      const long = cur.map(c => c.w).join(' ').length > 15;
      if (punct || cur.length >= 3 || long || i === ws.length - 1) { CHUNKS.push({ words: cur, line: ln.i }); cur = []; }
    });
  }
  CHUNKS.forEach((c, i) => { const nx = CHUNKS[i + 1]; c.s = c.words[0].s; c.e = nx ? Math.min(nx.words[0].s, c.words[c.words.length - 1].e + 0.6) : c.words[c.words.length - 1].e + 0.8; });
}
function captions(g, t, y = 1440) {
  if (!CHUNKS) buildChunks();
  const c = CHUNKS.find(c => t >= c.s - 0.001 && t < c.e); if (!c) return;
  const fs = 64; g.font = `900 ${fs}px Inter`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const disp = c.words.map(w => w.w.replace(/\.\.\.$/, '…').toUpperCase());
  const widths = disp.map(d => g.measureText(d).width), sp = 18, total = widths.reduce((a, b) => a + b, 0) + sp * (disp.length - 1);
  let x = W / 2 - total / 2; const keyIdx = c.words.findIndex(w => KEY.has(w.w.toLowerCase().replace(/[^a-z]/g, '')));
  c.words.forEach((w, i) => {
    if (t >= w.s) {
      const k = clamp((t - w.s) / 0.13), sc = 1 + 0.28 * (1 - back(k)) * -1 + 0.0; const scl = lerp(1.32, 1, eout(k));
      g.save(); g.translate(x + widths[i] / 2, y); g.scale(scl, scl); g.globalAlpha = clamp(k * 2.5);
      g.lineJoin = 'round'; g.lineWidth = 13; g.strokeStyle = 'rgba(0,0,0,0.92)'; g.strokeText(disp[i], -widths[i] / 2, 3);
      g.fillStyle = i === keyIdx ? '#ff5236' : '#ffffff'; g.fillText(disp[i], -widths[i] / 2, 0);
      g.restore();
    }
    x += widths[i] + sp;
  });
}
// ---------- pop-up cards (stay well inside the frame) ----------
function popK(t, t0, dur = 0.35) { return back(clamp((t - t0) / dur)); }
function chip(g, t, t0, t1, text, col, y = 250, icon = null) {
  if (t < t0 || t > t1 + 0.3) return;
  const k = popK(t, t0), out = 1 - ss(t1, t1 + 0.3, t);
  g.save(); g.globalAlpha = clamp((t - t0) / 0.12) * out; g.translate(W / 2, y); g.scale(k, k);
  g.font = '900 54px Inter'; const tw = g.measureText(text).width + (icon ? 80 : 0), pw = tw + 90;
  rr(g, -pw / 2, -52, pw, 104, 30); g.fillStyle = 'rgba(8,8,12,0.82)'; g.fill(); g.lineWidth = 6; g.strokeStyle = col; g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, icon ? 40 : 0, 3);
  if (icon) { g.save(); g.translate(-pw / 2 + 80, 0); icon(g); g.restore(); }
  g.restore();
}
function iconX(g, s = 30) { g.strokeStyle = '#ff3b2f'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-s, -s); g.lineTo(s, s); g.moveTo(s, -s); g.lineTo(-s, s); g.stroke(); }
function iconCheck(g, s = 30) { g.strokeStyle = '#3ee07a'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-s, 0); g.lineTo(-s * 0.3, s * 0.7); g.lineTo(s, -s * 0.8); g.stroke(); }
function bigX(g, t, t0, cx = W / 2, cy = 820, s = 260) {
  if (t < t0) return; const k = clamp((t - t0) / 0.22);
  g.save(); g.translate(cx, cy); const sc = lerp(1.6, 1, eout(k)); g.scale(sc, sc); g.globalAlpha = clamp(k * 3);
  g.lineCap = 'round'; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 78; g.beginPath(); g.moveTo(-s, -s); g.lineTo(s, s); g.moveTo(s, -s); g.lineTo(-s, s); g.stroke();
  g.strokeStyle = '#ff2f24'; g.lineWidth = 58; g.beginPath(); g.moveTo(-s, -s); g.lineTo(s, s); g.moveTo(s, -s); g.lineTo(-s, s); g.stroke();
  g.restore();
}
function ruleCard(g, t, t0, t1, num, line2, eyeAt) {
  if (t < t0 || t > t1 + 0.35) return;
  const k = popK(t, t0, 0.4), out = 1 - ss(t1, t1 + 0.35, t);
  g.save(); g.globalAlpha = out; g.translate(W / 2, 330); g.scale(k, k);
  rr(g, -420, -150, 840, 300, 34); g.fillStyle = 'rgba(10,10,14,0.88)'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#ffd23f'; g.stroke();
  rr(g, -150, -190, 300, 80, 24); g.fillStyle = '#ffd23f'; g.fill();
  g.fillStyle = '#111'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`RULE #${num}`, 0, -148);
  if (t >= eyeAt) {
    const k2 = popK(t, eyeAt, 0.3);
    g.save(); g.scale(k2, k2); g.fillStyle = '#fff'; g.font = '900 60px Inter'; g.fillText(line2[0], 60, -20); g.fillText(line2[1], 60, 60);
    // eye icon, crossed
    g.translate(-300, 20); g.strokeStyle = '#fff'; g.lineWidth = 9; g.beginPath(); g.moveTo(-70, 0); g.quadraticCurveTo(0, -60, 70, 0); g.quadraticCurveTo(0, 60, -70, 0); g.stroke();
    g.fillStyle = '#fff'; ell(g, 0, 0, 20, 20); g.fill(); g.strokeStyle = '#ff2f24'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-60, -55); g.lineTo(60, 55); g.stroke();
    g.restore();
  }
  g.restore();
}
function bigWord(g, t, t0, t1, text, col, y, size = 120) {
  if (t < t0 || t > t1 + 0.3) return;
  const k = clamp((t - t0) / 0.18), out = 1 - ss(t1, t1 + 0.3, t);
  g.save(); g.globalAlpha = out * clamp(k * 3); g.translate(W / 2, y); const sc = lerp(1.5, 1, eout(k)); g.scale(sc, sc);
  g.font = `900 ${size}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.16; g.strokeStyle = 'rgba(0,0,0,0.9)'; g.strokeText(text, 0, 0); g.fillStyle = col; g.fillText(text, 0, 0); g.restore();
}
function checklist(g, t, items) {  // items: [{text, at}]
  const y0 = 470;
  items.forEach((it, i) => {
    if (t < it.at) return; const k = popK(t, it.at, 0.3);
    g.save(); g.translate(120, y0 + i * 100); g.scale(k, k); g.globalAlpha = clamp((t - it.at) / 0.1);
    rr(g, 0, -40, 600, 80, 22); g.fillStyle = 'rgba(8,10,12,0.8)'; g.fill(); g.strokeStyle = '#3ee07a'; g.lineWidth = 5; g.stroke();
    g.save(); g.translate(48, 0); iconCheck(g, 20); g.restore();
    g.fillStyle = '#fff'; g.font = '900 44px Inter'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(it.text, 100, 3); g.restore();
  });
}

// ---------- intro spinner: character select ----------
function portrait(g, kind, s) {   // draws a small character portrait in a 260x340 card, centered at 0,0
  g.save();
  const bg = g.createLinearGradient(0, -170, 0, 170); bg.addColorStop(0, '#1b1f2e'); bg.addColorStop(1, '#0a0b10'); g.fillStyle = bg; rr(g, -130, -170, 260, 340, 26); g.fill();
  g.save(); rr(g, -130, -170, 260, 340, 26); g.clip();
  if (kind === 'ring') {   // Ringmaster Rot
    g.fillStyle = '#e8ddd0'; ell(g, 0, 10, 70, 82); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#b01e23'; g.fillRect(-60, -150, 120, 110); g.fillRect(-95, -50, 190, 22); g.fillStyle = '#111'; g.fillRect(-60, -70, 120, 16);
    g.fillStyle = '#111'; ell(g, -26, 0, 14, 18); g.fill(); ell(g, 26, 0, 14, 18); g.fill(); g.fillStyle = '#b01e23'; ell(g, 0, 22, 12, 12); g.fill();
    g.strokeStyle = '#6b0f12'; g.lineWidth = 7; g.beginPath(); g.moveTo(-40, 50); g.quadraticCurveTo(0, 80, 40, 50); g.stroke();
    g.fillStyle = '#5a1416'; g.fillRect(-120, 95, 240, 120);
  } else if (kind === 'hay') {   // Hay Reaper
    g.fillStyle = '#8a6a3c'; ell(g, 0, 10, 72, 84); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = '#3e2a12'; g.lineWidth = 4; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 18, -60); g.lineTo(i * 20, 80); g.stroke(); }
    g.fillStyle = '#c9a75a'; g.beginPath(); g.ellipse(0, -60, 125, 30, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0, -90, 60, 50, 0, Math.PI, TAU); g.fill();
    g.fillStyle = '#0a0a0a'; poly(g, [[-40, -10], [-12, -10], [-26, 14]]); g.fill(); poly(g, [[12, -10], [40, -10], [26, 14]]); g.fill();
    g.strokeStyle = '#111'; g.lineWidth = 4; g.beginPath(); g.moveTo(-36, 45); for (let i = 0; i <= 8; i++) g.lineTo(-36 + i * 9, 45 + (i % 2 ? 8 : -2)); g.stroke();
    g.fillStyle = '#3c3a2a'; g.fillRect(-120, 100, 240, 120);
  } else if (kind === 'pale') {
    g.fillStyle = 'rgba(120,140,180,0.25)'; g.fillRect(-130, -170, 260, 340);
    stretcherFaceBig(g, 0, -10, 68, { mouth: 0.45, t: s || 0 });
  } else {
    g.fillStyle = '#20232f'; ell(g, 0, 0, 70, 90); g.fill(); g.fillStyle = '#4b5068'; g.font = '900 120px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 6);
  }
  g.restore();
  g.lineWidth = 5; g.strokeStyle = '#2c3142'; rr(g, -130, -170, 260, 340, 26); g.stroke();
  g.restore();
}

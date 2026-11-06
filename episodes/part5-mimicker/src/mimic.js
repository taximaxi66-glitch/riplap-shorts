// ---------- Part 5: THE MIMICKER (copies voices, can't come inside unless you answer; jaw hangs to its chest) ----------
const MIMIC = { hipY: 1.36, hipW: 0.12, thigh: 0.68, shin: 0.66, foot: 0.3, spine: 0.74, shW: 0.24, upper: 0.8, fore: 0.76, hand: 0.44, neck: 0.62, headH: 0.36, headW: 0.22,
  skin: '#a8a58f', shade: '#6b6956', ink: '#100f0c', limbW: 0.082, kind: 'mimic' };
// the survivor: teal hoodie, white sneakers
const YOU = { ...HUMAN, hoodie: '#2d6a5c', hoodieS: '#1c4a40', jeans: '#2b3550', jeansS: '#1d2438', shoe: '#e9e6df', hair: '#2a1a10' };

function mimicTorsoDetail(g, R, pel, top, s, wid, opt) {   // spine knobs showing through, grey blotches, stitched-looking scar
  g.save();
  g.fillStyle = 'rgba(60,62,48,0.45)';
  [[0.35, -0.45, 0.05], [0.6, 0.5, 0.04], [0.8, -0.1, 0.035], [0.15, 0.35, 0.04]].forEach(b => { const p = [lerp(pel[0], top[0], b[0]), lerp(pel[1], top[1], b[0])]; ell(g, p[0] + b[1] * wid(2), p[1], b[2] * s, b[2] * s * 0.7); g.fill(); });
  g.strokeStyle = 'rgba(70,30,28,0.55)'; g.lineWidth = Math.max(1, s * 0.007);
  const a = [lerp(pel[0], top[0], 0.2) - wid(1) * 0.5, lerp(pel[1], top[1], 0.2)], b = [lerp(pel[0], top[0], 0.62) + wid(2) * 0.3, lerp(pel[1], top[1], 0.62)];
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  for (let k = 1; k < 6; k++) { const p = [lerp(a[0], b[0], k / 6), lerp(a[1], b[1], k / 6)]; g.beginPath(); g.moveTo(p[0] - s * 0.015, p[1] - s * 0.012); g.lineTo(p[0] + s * 0.015, p[1] + s * 0.012); g.stroke(); }
  g.restore();
}
// dark hooked nails on the finger tips
function mimicNail(g, x, y, ang, w) { g.fillStyle = '#1b1712'; g.save(); g.translate(x, y); g.rotate(ang); poly(g, [[-w * 0.5, -w * 0.4], [w * 1.6, 0], [-w * 0.5, w * 0.4]]); g.fill(); g.restore(); }

// small head on the rig: long twisting neck with a voice-box lump, stringy hair, white eyes, jaw hanging to the chest
function mimicHeadSmall(g, R, top, nk, hd, s, ow, yaw, pose, opt) {
  const t = opt.t || 0, talk = opt.talk || 0, cy_ = Math.cos(yaw * D2R), front = Math.abs(cy_) > 0.55, dir = Math.sin(yaw * D2R) >= 0 ? 1 : -1;
  const mid = [lerp(top[0], nk[0], 0.5) + s * 0.05 * Math.sin(t * 0.7), lerp(top[1], nk[1], 0.5)];
  limb(g, [[top[0], top[1]], mid, [nk[0], nk[1]]], 0.06 * s, R.skin, R.ink, R.shade, ow);
  // neck rings (stretched skin)
  g.strokeStyle = 'rgba(50,48,36,0.6)'; g.lineWidth = Math.max(1, s * 0.006);
  for (let k = 1; k < 6; k++) { const p = k < 3 ? [lerp(top[0], mid[0], k / 3), lerp(top[1], mid[1], k / 3)] : [lerp(mid[0], nk[0], (k - 3) / 3), lerp(mid[1], nk[1], (k - 3) / 3)]; g.beginPath(); g.moveTo(p[0] - s * 0.028, p[1]); g.quadraticCurveTo(p[0], p[1] + s * 0.01, p[0] + s * 0.028, p[1]); g.stroke(); }
  // voice-box lump (glows red when it talks)
  const lp = [lerp(mid[0], nk[0], 0.35), lerp(mid[1], nk[1], 0.35)], lr = s * (0.04 + talk * 0.015 * (1 + Math.sin(t * 22)));
  g.fillStyle = R.skin; g.strokeStyle = R.ink; g.lineWidth = ow * 0.8; ell(g, lp[0] + s * 0.02 * (front ? 0 : dir), lp[1], lr, lr * 1.2); g.fill(); g.stroke();
  if (talk > 0.05) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lp[0], lp[1], s * 0.16, [255, 60, 40], 0.5 * talk); g.restore(); }
  const hw = R.headW * s * 0.5, hh = R.headH * s * 0.55;
  const nAng = Math.atan2(hd[1] - nk[1], hd[0] - nk[0]) + Math.PI / 2;
  g.save(); g.translate(lerp(nk[0], hd[0], 0.55), lerp(nk[1], hd[1], 0.55)); g.rotate((front ? 0.4 : 1) * Math.atan2(Math.sin(nAng), Math.cos(nAng)) + (pose.headRoll || 0) * D2R);
  // long stringy hair hanging behind
  g.strokeStyle = '#0d0b09'; g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const x = lerp(-hw * 1.0, hw * 1.0, i / 8), l = hh * (2.2 + hash(i + 2) * 1.6); g.lineWidth = Math.max(1.2, s * (0.01 + hash(i) * 0.008));
    g.beginPath(); g.moveTo(x * 0.6, -hh * 0.95); g.quadraticCurveTo(x * 1.35, -hh * 0.1, x * 1.25 + Math.sin(t * 1.1 + i) * hw * 0.12, -hh * 0.9 + l); g.stroke(); }
  const jaw = hh * ((opt.jaw == null ? 2.6 : opt.jaw) + talk * 0.45 * (0.5 + 0.5 * Math.sin(t * 9)));   // the hanging jaw length
  if (cy_ < -0.55) { ell(g, 0, 0, hw, hh); g.fillStyle = R.shade; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke(); g.fillStyle = '#0d0b09'; ell(g, 0, -hh * 0.1, hw * 0.98, hh * 0.95); g.fill(); g.restore(); return; }
  if (front) {
    // lower jaw: a long skin U hanging down
    g.fillStyle = R.shade; g.strokeStyle = R.ink; g.lineWidth = ow;
    g.beginPath(); g.moveTo(-hw * 0.62, hh * 0.25); g.lineTo(-hw * 0.5, hh * 0.3 + jaw * 0.85); g.quadraticCurveTo(0, hh * 0.3 + jaw * 1.12, hw * 0.5, hh * 0.3 + jaw * 0.85); g.lineTo(hw * 0.62, hh * 0.25); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#070303'; g.beginPath(); g.moveTo(-hw * 0.45, hh * 0.3); g.lineTo(-hw * 0.36, hh * 0.3 + jaw * 0.82); g.quadraticCurveTo(0, hh * 0.3 + jaw * 0.98, hw * 0.36, hh * 0.3 + jaw * 0.82); g.lineTo(hw * 0.45, hh * 0.3); g.closePath(); g.fill();
    g.fillStyle = '#d9cfae'; for (let k = 0; k < 5; k++) { const x = lerp(-hw * 0.28, hw * 0.28, k / 4); poly(g, [[x - hw * 0.05, hh * 0.3 + jaw * 0.86], [x + hw * 0.05, hh * 0.3 + jaw * 0.86], [x, hh * 0.3 + jaw * 0.76]]); g.fill(); }
    // skull
    ell(g, 0, -hh * 0.15, hw * 0.78, hh * 0.95); g.fillStyle = R.skin; g.fill(); g.strokeStyle = R.ink; g.lineWidth = ow; g.stroke();
    // upper teeth row
    g.fillStyle = '#e1d8b8'; rr(g, -hw * 0.42, hh * 0.22, hw * 0.84, hh * 0.18, hh * 0.05); g.fill(); g.strokeStyle = R.ink; g.lineWidth = Math.max(1, ow * 0.6); g.stroke();
    // sunken sockets + blank white eyes
    for (const sd of [-1, 1]) { g.fillStyle = 'rgba(40,36,26,0.6)'; ell(g, sd * hw * 0.32, -hh * 0.28, hw * 0.24, hh * 0.2); g.fill();
      if (opt.eyes !== false) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, sd * hw * 0.32, -hh * 0.28, hw * 0.35, [230, 240, 220], 0.3); g.restore(); g.fillStyle = '#f2f2e8'; ell(g, sd * hw * 0.32, -hh * 0.28, hw * 0.13, hh * 0.1); g.fill(); } }
  } else {
    g.scale(dir, 1);
    g.fillStyle = R.shade; g.strokeStyle = R.ink; g.lineWidth = ow;
    g.beginPath(); g.moveTo(hw * 0.1, hh * 0.25); g.lineTo(hw * 0.75, hh * 0.3); g.lineTo(hw * 0.55, hh * 0.3 + jaw * 0.9); g.quadraticCurveTo(hw * 0.2, hh * 0.3 + jaw * 1.05, -hw * 0.05, hh * 0.3 + jaw * 0.8); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#070303'; poly(g, [[hw * 0.2, hh * 0.32], [hw * 0.62, hh * 0.34], [hw * 0.45, hh * 0.3 + jaw * 0.8], [hw * 0.1, hh * 0.3 + jaw * 0.7]]); g.fill();
    g.beginPath(); g.moveTo(-hw * 0.8, -hh * 0.3); g.bezierCurveTo(-hw * 0.7, -hh * 1.15, hw * 0.75, -hh * 1.15, hw * 0.85, -hh * 0.2); g.lineTo(hw * 0.95, hh * 0.05); g.lineTo(hw * 0.75, hh * 0.35); g.lineTo(-hw * 0.3, hh * 0.45); g.quadraticCurveTo(-hw * 0.9, hh * 0.2, -hw * 0.8, -hh * 0.3); g.closePath();
    g.fillStyle = R.skin; g.fill(); g.stroke();
    g.fillStyle = '#e1d8b8'; rr(g, hw * 0.25, hh * 0.25, hw * 0.55, hh * 0.15, hh * 0.04); g.fill();
    g.fillStyle = 'rgba(40,36,26,0.6)'; ell(g, hw * 0.45, -hh * 0.3, hw * 0.2, hh * 0.17); g.fill();
    if (opt.eyes !== false) { g.fillStyle = '#f2f2e8'; ell(g, hw * 0.5, -hh * 0.3, hw * 0.1, hh * 0.09); g.fill(); }
  }
  g.restore();
}

// ---------- the big close-up face ----------
// S = px per unit; skull spans y -1.2..0.35, the jaw hangs to ~2.1. o.talk 0..1 makes the jaw work + throat glow
function mimicFaceBig(g, cx, cy, S, o = {}) {
  const t = o.t || 0, talk = clamp(o.talk || 0), jit = o.jitter || 0, smile = o.smile || 0;
  g.save(); g.translate(cx + noise(t * 23) * jit * S * 0.05, cy + noise(t * 19 + 4) * jit * S * 0.04); g.rotate((o.tilt || 0) * D2R + noise(t * 17 + 9) * jit * 0.03);
  const ink = '#0f0d0a', skin = '#b3af97', shade = '#77745f', dark = '#5b5947';
  const jawY = S * (1.75 + talk * 0.35 * (0.5 + 0.5 * Math.sin(t * 8.5)) + (o.jawExtra || 0));   // bottom of the hanging jaw
  // long neck behind, with the voice-box lump
  g.fillStyle = shade; g.strokeStyle = ink; g.lineWidth = S * 0.025;
  poly(g, [[-S * 0.26, S * 0.2], [S * 0.26, S * 0.2], [S * 0.3, S * 3.4], [-S * 0.3, S * 3.4]]); g.fill(); g.stroke();
  // hair behind (long, wet, stringy — like a woman's hair)
  g.strokeStyle = '#0b0907'; g.lineCap = 'round';
  for (let i = 0; i < 22; i++) { const x = lerp(-0.72, 0.72, i / 21) * S, l = S * (2.2 + hash(i) * 1.4); g.lineWidth = S * (0.025 + hash(i + 3) * 0.03);
    g.beginPath(); g.moveTo(x * 0.5, -S * 1.15); g.bezierCurveTo(x * 1.6, -S * 0.8, x * 1.5 + Math.sin(t * 1.1 + i) * S * 0.05, -S * 0.0, x * 1.4 + Math.sin(t * 0.9 + i * 2) * S * 0.08, -S * 1.1 + l); g.stroke(); }
  // ---- the hanging lower jaw ----
  const jw = S * 0.5;
  g.beginPath(); g.moveTo(-S * 0.56, S * 0.2); g.bezierCurveTo(-S * 0.6, jawY * 0.6, -jw * 0.9, jawY * 0.95, 0, jawY); g.bezierCurveTo(jw * 0.9, jawY * 0.95, S * 0.6, jawY * 0.6, S * 0.56, S * 0.2); g.closePath();
  const jg = g.createLinearGradient(-S * 0.6, 0, S * 0.6, 0); jg.addColorStop(0, dark); jg.addColorStop(0.5, shade); jg.addColorStop(1, dark); g.fillStyle = jg; g.fill(); g.lineWidth = S * 0.03; g.strokeStyle = ink; g.stroke();
  // mouth hole inside the jaw
  const mi = () => { g.beginPath(); g.moveTo(-S * 0.42, S * 0.3); g.bezierCurveTo(-S * 0.45, jawY * 0.55, -jw * 0.62, jawY * 0.88, 0, jawY * 0.9); g.bezierCurveTo(jw * 0.62, jawY * 0.88, S * 0.45, jawY * 0.55, S * 0.42, S * 0.3); g.closePath(); };
  mi(); const mg = g.createLinearGradient(0, S * 0.3, 0, jawY); mg.addColorStop(0, '#000'); mg.addColorStop(0.6, '#0c0203'); mg.addColorStop(1, '#3a0b0e'); g.fillStyle = mg; g.fill();
  g.save(); mi(); g.clip();
  // throat ridges + the long tongue
  g.strokeStyle = 'rgba(120,30,35,0.55)'; g.lineWidth = S * 0.016;
  for (let k = 0; k < 5; k++) { const y = lerp(S * 0.5, jawY * 0.75, k / 4), w = S * 0.35 * (1 - k * 0.08); g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + S * 0.06, w, y); g.stroke(); }
  const tw = Math.sin(t * 2.3) * S * 0.04;
  g.fillStyle = '#5e3e44'; g.strokeStyle = ink; g.lineWidth = S * 0.015; g.beginPath(); g.moveTo(-S * 0.16, jawY * 0.5); g.bezierCurveTo(-S * 0.2 + tw, jawY * 0.75, -S * 0.12 + tw, jawY * 0.92, tw * 0.5, jawY * 0.95); g.bezierCurveTo(S * 0.14 + tw, jawY * 0.9, S * 0.2 + tw, jawY * 0.72, S * 0.16, jawY * 0.5); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(40,10,12,0.5)'; g.beginPath(); g.moveTo(tw * 0.3, jawY * 0.55); g.lineTo(tw * 0.5, jawY * 0.88); g.stroke();
  g.restore();
  // lower teeth row at the bottom of the jaw (human teeth, too many)
  for (let k = 0; k < 9; k++) { const a = lerp(-0.85, 0.85, k / 8), x = Math.sin(a) * jw * 0.62, y = jawY * 0.9 - Math.cos(a) * S * 0.02 - Math.abs(a) * S * 0.12;
    g.fillStyle = k % 3 === 1 ? '#c8bd96' : '#e3dabb'; g.strokeStyle = ink; g.lineWidth = S * 0.008; rr(g, x - S * 0.045, y - S * 0.12, S * 0.09, S * 0.12, S * 0.025); g.fill(); g.stroke(); }
  // stretched skin strands from the cheeks down to the jaw
  g.strokeStyle = 'rgba(95,90,72,0.9)'; g.lineWidth = S * 0.022;
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(sd * S * (0.5 - k * 0.03), S * (0.25 + k * 0.05)); g.quadraticCurveTo(sd * S * (0.43 - k * 0.02), S * (0.6 + k * 0.2) + talk * S * 0.1, sd * S * (0.47 - k * 0.04), S * (0.75 + k * 0.28) + talk * S * 0.15); g.stroke(); }
  // torn mouth corners (dark, not gory)
  g.strokeStyle = 'rgba(60,18,16,0.75)'; g.lineWidth = S * 0.02; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * S * 0.42, S * 0.28); g.lineTo(sd * S * 0.58, S * 0.12); g.lineTo(sd * S * 0.66, S * 0.16); g.stroke(); }
  // ---- the skull / upper face ----
  const sk = () => { g.beginPath(); g.moveTo(0, -S * 1.2); g.bezierCurveTo(S * 0.58, -S * 1.2, S * 0.7, -S * 0.5, S * 0.62, -S * 0.05); g.bezierCurveTo(S * 0.6, S * 0.2, S * 0.52, S * 0.3, S * 0.42, S * 0.32);
    g.lineTo(-S * 0.42, S * 0.32); g.bezierCurveTo(-S * 0.52, S * 0.3, -S * 0.6, S * 0.2, -S * 0.62, -S * 0.05); g.bezierCurveTo(-S * 0.7, -S * 0.5, -S * 0.58, -S * 1.2, 0, -S * 1.2); g.closePath(); };
  sk(); const gr = g.createLinearGradient(-S * 0.6, 0, S * 0.6, 0); gr.addColorStop(0, shade); gr.addColorStop(0.45, skin); gr.addColorStop(1, dark); g.fillStyle = gr; g.fill(); g.lineWidth = S * 0.03; g.strokeStyle = ink; g.stroke();
  g.save(); sk(); g.clip();
  // creases, blotches
  g.strokeStyle = 'rgba(70,66,50,0.55)'; g.lineWidth = S * 0.012;
  [[-0.35, -0.85, -0.05, -0.98], [0.1, -0.95, 0.4, -0.8], [-0.2, -0.68, 0.2, -0.7], [-0.52, -0.3, -0.45, 0.1], [0.5, -0.25, 0.46, 0.12]].forEach(c => { g.beginPath(); g.moveTo(c[0] * S, c[1] * S); g.quadraticCurveTo((c[0] + c[2]) / 2 * S, (c[1] + c[3]) / 2 * S - S * 0.04, c[2] * S, c[3] * S); g.stroke(); });
  g.fillStyle = 'rgba(80,78,58,0.4)'; ell(g, S * 0.35, -S * 0.9, S * 0.12, S * 0.08); g.fill(); ell(g, -S * 0.42, S * 0.05, S * 0.1, S * 0.07); g.fill();
  // human-ish nose, too flat
  g.strokeStyle = 'rgba(50,46,34,0.8)'; g.lineWidth = S * 0.018; g.beginPath(); g.moveTo(-S * 0.03, -S * 0.42); g.quadraticCurveTo(-S * 0.08, -S * 0.12, -S * 0.1, -S * 0.04); g.stroke();
  g.fillStyle = '#26221a'; ell(g, -S * 0.07, -S * 0.02, S * 0.035, S * 0.022, 0.3); g.fill(); ell(g, S * 0.07, -S * 0.02, S * 0.035, S * 0.022, -0.3); g.fill();
  // eyes: big, milky, slightly uneven, tiny pupils that track
  for (const sd of [-1, 1]) {
    const ex = sd * S * 0.27, ey = -S * 0.42 + (sd > 0 ? S * 0.03 : 0);
    const sg = g.createRadialGradient(ex, ey, 0, ex, ey, S * 0.24); sg.addColorStop(0, 'rgba(25,20,14,0.95)'); sg.addColorStop(0.65, 'rgba(55,50,36,0.6)'); sg.addColorStop(1, 'rgba(100,95,75,0)');
    g.fillStyle = sg; ell(g, ex, ey, S * 0.24, S * 0.19, sd * 0.15); g.fill();
    if (o.eyes !== false) {
      const er = S * (0.11 + (o.eyeBig || 0) * 0.03);
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, ex, ey, S * 0.2, [235, 240, 220], 0.25); g.restore();
      g.fillStyle = '#ecebdf'; ell(g, ex, ey, er, er * 0.8); g.fill(); g.strokeStyle = ink; g.lineWidth = S * 0.012; g.stroke();
      g.strokeStyle = 'rgba(170,60,60,0.5)'; g.lineWidth = S * 0.006; for (let v = 0; v < 3; v++) { const a = v * 2.1 + sd; g.beginPath(); g.moveTo(ex + Math.cos(a) * er, ey + Math.sin(a) * er * 0.8); g.lineTo(ex + Math.cos(a) * er * 0.5, ey + Math.sin(a + 0.3) * er * 0.4); g.stroke(); }
      g.fillStyle = '#111'; ell(g, ex + (o.look || 0) * er * 0.4, ey + S * 0.01, S * 0.022, S * 0.022); g.fill();
    }
  }
  g.restore();
  // the upper teeth: a row of human teeth with grey gums, smiling too wide
  g.fillStyle = '#5a3b3a'; g.beginPath(); g.moveTo(-S * 0.44, S * 0.22); g.quadraticCurveTo(0, S * (0.3 - smile * 0.1), S * 0.44, S * 0.22); g.lineTo(S * 0.42, S * 0.32); g.lineTo(-S * 0.42, S * 0.32); g.closePath(); g.fill();
  for (let k = 0; k < 10; k++) { const x = lerp(-S * 0.38, S * 0.38, k / 9), y = S * 0.25 + Math.abs(x) / S * S * 0.02;
    g.fillStyle = k % 4 === 2 ? '#c9be98' : '#e6ddbe'; g.strokeStyle = ink; g.lineWidth = S * 0.008; rr(g, x - S * 0.035, y, S * 0.07, S * 0.13, S * 0.02); g.fill(); g.stroke(); }
  // voice-box lump on the neck, glowing when it speaks
  const lr = S * (0.14 + talk * 0.05 * (1 + Math.sin(t * 20)));
  if (jawY < S * 2.6) { g.fillStyle = shade; g.strokeStyle = ink; g.lineWidth = S * 0.02; ell(g, S * 0.05, jawY + S * 0.35, lr, lr * 1.15); g.fill(); g.stroke(); }
  if (talk > 0.05) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, S * 0.05, jawY + S * 0.35, S * 0.55, [255, 50, 30], 0.45 * talk); glow(g, 0, S * 0.8, S * 0.9, [255, 40, 30], 0.12 * talk); g.restore(); }
  // drool string
  const dk = (t * 0.4) % 1; g.strokeStyle = 'rgba(210,215,200,0.5)'; g.lineWidth = S * 0.01; g.beginPath(); g.moveTo(S * 0.12, jawY * 0.95); g.lineTo(S * 0.12 + Math.sin(t) * S * 0.02, jawY + S * (0.1 + dk * 0.5)); g.stroke();
  g.restore();
}

// ---------- your face: eyes shut, hands pressed over your ears ----------
function youFaceBig(g, cx, cy, S, o = {}) {
  const t = o.t || 0, tr = o.tremble || 0, ink = '#141218', ears = o.ears == null ? 1 : o.ears;
  g.save(); g.translate(cx + noise(t * 30) * tr * S * 0.02, cy + noise(t * 27 + 3) * tr * S * 0.015);
  g.fillStyle = YOU.hoodieS; ell(g, 0, S * 0.1, S * 1.25, S * 1.35); g.fill(); g.strokeStyle = ink; g.lineWidth = S * 0.025; g.stroke();
  g.fillStyle = '#123129'; ell(g, 0, S * 0.15, S * 1.0, S * 1.15); g.fill();
  const fg = g.createLinearGradient(-S, 0, S, 0); fg.addColorStop(0, '#d9a985'); fg.addColorStop(0.5, '#e6b996'); fg.addColorStop(1, '#a87a5c');
  ell(g, 0, S * 0.12, S * 0.78, S * 0.98); g.fillStyle = fg; g.fill(); g.stroke();
  g.fillStyle = YOU.hair; g.beginPath(); g.moveTo(-S * 0.8, -S * 0.1);
  for (let i = 0; i <= 10; i++) { const k = i / 10; g.lineTo(lerp(-S * 0.8, S * 0.8, k), -S * 0.45 + Math.sin(k * 11) * S * 0.06 + (i % 2) * S * 0.08); }
  g.lineTo(S * 0.8, -S * 0.1); g.quadraticCurveTo(S * 0.7, -S * 0.95, 0, -S * 0.92); g.quadraticCurveTo(-S * 0.75, -S * 0.95, -S * 0.8, -S * 0.1); g.fill();
  g.strokeStyle = '#2a1a10'; g.lineWidth = S * 0.06; g.lineCap = 'round';
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * S * 0.12, -S * 0.12); g.lineTo(sx * S * 0.48, -S * 0.02); g.stroke(); }
  g.strokeStyle = ink; g.lineWidth = S * 0.04;
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(sx * S * 0.5, S * 0.1); g.quadraticCurveTo(sx * S * 0.32, S * 0.2, sx * S * 0.14, S * 0.1); g.stroke();
    g.lineWidth = S * 0.018; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(sx * S * (0.52 + k * 0.02), S * (0.06 + k * 0.05)); g.lineTo(sx * S * (0.62 + k * 0.02), S * (0.03 + k * 0.06)); g.stroke(); } g.lineWidth = S * 0.04;
  }
  g.lineWidth = S * 0.025; g.beginPath(); g.moveTo(0, S * 0.15); g.quadraticCurveTo(S * 0.1, S * 0.38, -S * 0.02, S * 0.42); g.stroke();
  // lips pressed shut (don't answer)
  g.lineWidth = S * 0.04; g.beginPath(); g.moveTo(-S * 0.22, S * 0.66); g.quadraticCurveTo(0, S * 0.6 + Math.sin(t * 9) * S * 0.01, S * 0.22, S * 0.66); g.stroke();
  g.lineWidth = S * 0.015; g.beginPath(); g.moveTo(-S * 0.18, S * 0.72); g.quadraticCurveTo(0, S * 0.69, S * 0.18, S * 0.72); g.stroke();
  // hands pressed over the ears
  if (ears > 0) for (const sx of [-1, 1]) {
    g.save(); g.translate(sx * lerp(S * 1.6, S * 0.78, eout(ears)), lerp(S * 1.2, S * 0.1, eout(ears))); g.rotate(sx * -0.2);
    g.fillStyle = YOU.hoodie; g.strokeStyle = ink; g.lineWidth = S * 0.03; poly(g, [[-S * 0.22, S * 0.3], [S * 0.22, S * 0.3], [sx * S * 0.5 + S * 0.25, S * 1.6], [sx * S * 0.5 - S * 0.25, S * 1.6]]); g.fill(); g.stroke();
    g.fillStyle = '#d9a985'; rr(g, -S * 0.2, -S * 0.32, S * 0.4, S * 0.66, S * 0.16); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(90,50,30,0.6)'; g.lineWidth = S * 0.015; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-S * 0.1 + k * S * 0.1, -S * 0.28); g.lineTo(-S * 0.1 + k * S * 0.1, -S * 0.05); g.stroke(); }
    g.restore();
  }
  const sw = (t * 0.25) % 1; g.fillStyle = 'rgba(200,225,255,0.85)'; g.beginPath(); const sx = S * 0.5, sy = -S * 0.05 + sw * S * 0.4;
  g.moveTo(sx, sy - S * 0.06); g.quadraticCurveTo(sx + S * 0.04, sy, sx, sy + S * 0.03); g.quadraticCurveTo(sx - S * 0.04, sy, sx, sy - S * 0.06); g.fill();
  g.restore();
}
// speech text from the dark: the mimicked mother's voice (wobbly, pale, inside the frame)
function voiceText(g, t, t0, t1, text, x, y, size = 58, col = [235, 225, 210]) {
  if (t < t0 || t > t1 + 0.4) return;
  const k = clamp((t - t0) / 0.5), out = 1 - ss(t1, t1 + 0.4, t);
  g.save(); g.font = `900 ${size}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = k * out;
  const chars = text.split(''), total = g.measureText(text).width; let cx = x - total / 2;
  chars.forEach((c, i) => { const w = g.measureText(c).width, wob = Math.sin(t * 6 + i * 0.7) * size * 0.06;
    g.save(); g.translate(cx + w / 2, y + wob); g.rotate(Math.sin(t * 3 + i) * 0.05);
    g.shadowColor = 'rgba(255,60,40,0.7)'; g.shadowBlur = 18; g.lineJoin = 'round'; g.lineWidth = size * 0.14; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(c, 0, 0);
    g.fillStyle = rgb(col); g.fillText(c, 0, 0); g.restore(); cx += w; });
  g.restore();
}

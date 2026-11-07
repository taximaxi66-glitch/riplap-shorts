// ---------- the thing on the ceiling: grey skin sagging off its bones like a wet sheet, neck bent back, jaw hanging open ----------
import * as THREE from 'three';
import { mat, OUT, noOutline, cyl, sph, seg } from './models.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z), _up = V(0, 1, 0);

function faceTexSag() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 1024);
  // stretched, wrinkled grey skin around a very long open mouth (the jaw hangs down)
  g.strokeStyle = 'rgba(40,42,40,0.55)'; g.lineWidth = 6; g.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const x = 300 + i * 32, y0 = 120 + (i % 3) * 20; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + 10, y0 + 120, x - 6, y0 + 220); g.stroke(); }
  // sunken cheeks
  for (const sx of [-1, 1]) { const gr = g.createRadialGradient(512 + sx * 200, 560, 10, 512 + sx * 200, 560, 160); gr.addColorStop(0, 'rgba(30,32,30,0.55)'); gr.addColorStop(1, 'rgba(30,32,30,0)'); g.fillStyle = gr; g.fillRect(512 + sx * 200 - 160, 400, 320, 320); }
  // mouth: a tall black hole, ragged lips, strings of spit, a few broken teeth on top
  g.fillStyle = '#060304'; g.beginPath(); g.moveTo(420, 600); g.quadraticCurveTo(512, 570, 604, 600); g.quadraticCurveTo(640, 820, 560, 1000); g.quadraticCurveTo(512, 1015, 464, 1000); g.quadraticCurveTo(384, 820, 420, 600); g.fill();
  g.strokeStyle = '#3a2a2a'; g.lineWidth = 12; g.stroke();
  const ig = g.createRadialGradient(512, 760, 20, 512, 760, 200); ig.addColorStop(0, 'rgba(70,10,14,0.55)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = ig; g.fillRect(380, 600, 260, 420);
  g.fillStyle = '#cfc6a8'; for (let i = 0; i < 6; i++) { const x = 440 + i * 28; g.beginPath(); g.moveTo(x - 9, 600); g.lineTo(x + 9, 600); g.lineTo(x + (i % 2 ? 2 : -3), 630 + (i % 3) * 14); g.fill(); }
  g.strokeStyle = 'rgba(200,210,200,0.55)'; g.lineWidth = 4; for (const [x0, x1, y] of [[450, 560, 690], [470, 590, 760], [440, 520, 820]]) { g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + 60, x1, y + 10); g.stroke(); }
  // nose slits
  g.fillStyle = '#1e1a1a'; g.beginPath(); g.ellipse(490, 520, 10, 24, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(534, 520, 10, 24, -0.3, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function drape(w, h, m) {   // a hanging sheet of skin (top edge fixed)
  const geo = new THREE.PlaneGeometry(w, h, 6, 12); geo.translate(0, -h / 2, 0); const me = new THREE.Mesh(geo, m); me.castShadow = true; me.userData.base = geo.attributes.position.array.slice(); return me;
}
export function makeSag() {
  const skin = OUT(mat(0x737771, { side: THREE.DoubleSide })), skinD = OUT(mat(0x4b4f4a, { side: THREE.DoubleSide })), ink = OUT(mat(0x0a0808));
  const G = new THREE.Group();
  const torso = sph(0.17, skin, 0.75, 0.7, 2.5); G.add(torso);
  const ribs = []; for (let i = 0; i < 6; i++) { const rb = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.013, 6, 20, Math.PI), skinD); ribs.push(rb); G.add(rb); }
  const spineK = []; for (let i = 0; i < 9; i++) { const k = sph(0.036, skinD); spineK.push(k); G.add(k); }
  // sagging skin: sheets hanging down from the belly and the upper arms/thighs
  const drapes = []; for (let i = 0; i < 7; i++) { const d = new THREE.Group(); const blob = sph(0.05, i % 2 ? skin : skinD, 1.5 + (i % 3) * 0.4, 1, 0.55); blob.geometry = new THREE.SphereGeometry(0.05, 16, 12); blob.geometry.translate(0, -0.05, 0); blob.scale.set(1.6 + (i % 3) * 0.5, 2.6 + (i % 4) * 0.9, 0.6); d.add(blob); drapes.push(d); G.add(d); }
  const limbDr = []; for (let i = 0; i < 4; i++) { const d = new THREE.Group(); const blob = sph(0.03, skinD); blob.geometry = new THREE.SphereGeometry(0.03, 12, 10); blob.geometry.translate(0, -0.03, 0); blob.scale.set(1.8, 2.8, 0.6); d.add(blob); limbDr.push(d); G.add(d); }
  const neck = cyl(1, 1, 1, skin, 12); G.add(neck); const neckFold = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), skinD); neckFold.push(r); G.add(r); }
  const head = new THREE.Group(); G.add(head);
  const skull = sph(0.17, skin, 0.78, 1.5, 0.92); head.add(skull);
  const jaw = sph(0.12, skin, 0.75, 1.15, 0.7); head.add(jaw);   // the lower jaw, hanging open
  const mouthIn = sph(0.1, OUT(mat(0x050304)), 0.6, 1.5, 0.5); head.add(mouthIn);
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.06, metalness: 0.25 }); OUT(eyeM);
  const eyes = []; for (const s of [-1, 1]) { const sock = sph(0.062, OUT(mat(0x161414)), 1.1, 0.9, 0.5); sock.position.set(s * 0.064, 0.07, 0.12); head.add(sock); const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 24, 16), eyeM); e.scale.set(1.0, 0.85, 0.6); e.position.set(s * 0.064, 0.066, 0.132); head.add(e); eyes.push(e);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); noOutline(hl.material); hl.position.set(s * 0.064 + 0.012, 0.082, 0.155); head.add(hl); }
  const faceM = new THREE.MeshBasicMaterial({ map: faceTexSag(), transparent: true, depthWrite: false }); noOutline(faceM);
  const fp = new THREE.Mesh(new THREE.SphereGeometry(0.172, 32, 24, Math.PI * 0.2, Math.PI * 0.6, Math.PI * 0.18, Math.PI * 0.7), faceM); fp.scale.set(0.79, 1.52, 0.94); head.add(fp);
  const hair = []; const hairM = new THREE.LineBasicMaterial({ color: 0x0a0806 }); for (let i = 0; i < 10; i++) { const geo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 8 }, () => V(0, 0, 0))); const l = new THREE.Line(geo, hairM); hair.push({ l, x: (i / 9 - 0.5) * 0.22, len: 0.22 + (i % 4) * 0.08 }); G.add(l); }
  const mk = () => ({ up: cyl(1, 1, 1, skin, 10), lo: cyl(1, 1, 1, skin, 10), j1: sph(0.034, skinD), j2: sph(0.028, skinD), f: Array.from({ length: 5 }, () => [cyl(1, 1, 1, skin, 6), cyl(1, 1, 1, skin, 6), cyl(1, 1, 1, skin, 6), sph(0.0105, skinD), sph(0.009, skinD), sph(0.008, ink)]) });
  const limbs = [mk(), mk(), mk(), mk()]; for (const L of limbs) { G.add(L.up, L.lo, L.j1, L.j2); for (const f of L.f) G.add(...f); }
  const C = { G, torso, head, eyes, limbs, neck, jaw, mouthIn };
  C.mouthWorld = V(0, 0, 0);
  // st: {pos, heading, anchors[4], headLook, t, jaw 0..1, tw(limb, finger, joint) -> radians, neckBack 0..1, sway}
  C.update = st => {
    const P = st.pos, hdg = st.heading, fwd = V(Math.sin(hdg), 0, Math.cos(hdg)), side = V(Math.cos(hdg), 0, -Math.sin(hdg)), down = V(0, -1, 0), t = st.t;
    torso.position.copy(P); torso.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, down.clone().negate(), fwd));
    ribs.forEach((rb, i) => { rb.position.copy(P).addScaledVector(fwd, 0.28 - i * 0.07).addScaledVector(down, 0.05); rb.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, fwd.clone().negate(), down.clone().negate())); rb.rotateZ(Math.PI); rb.scale.setScalar(1 - Math.abs(i - 2) * 0.06); });
    spineK.forEach((k, i) => { k.position.copy(P).addScaledVector(fwd, 0.48 - i * 0.12).addScaledVector(down, -0.16 + Math.abs(i - 4) * 0.004); });
    // drapes hang from the underside of the belly, swaying slowly, heavy and wet
    drapes.forEach((d, i) => { const k = i / 6 - 0.5; d.position.copy(P).addScaledVector(fwd, k * 0.7).addScaledVector(side, Math.sin(i * 2.3) * 0.07).addScaledVector(down, 0.08);
      d.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, _up, fwd)); d.rotateZ(Math.sin(t * 0.8 + i * 1.7) * 0.12); d.rotateX(Math.sin(t * 0.6 + i) * 0.1); d.scale.y = 1 + 0.06 * Math.sin(t * 1.1 + i); });
    const shoulder = P.clone().addScaledVector(fwd, 0.38), hip = P.clone().addScaledVector(fwd, -0.4);
    const roots = [shoulder.clone().addScaledVector(side, -0.17), shoulder.clone().addScaledVector(side, 0.17), hip.clone().addScaledVector(side, -0.14), hip.clone().addScaledVector(side, 0.14)];
    const lens = [[0.72, 0.74], [0.72, 0.74], [0.7, 0.74], [0.7, 0.74]];
    limbs.forEach((L, i) => {
      const a = roots[i], tgt = st.anchors[i], A = lens[i][0], B = lens[i][1]; const d = tgt.clone().sub(a); const dist = Math.min(d.length(), A + B - 0.01); d.normalize();
      const pole = down.clone().addScaledVector(side, i % 2 ? 0.7 : -0.7).normalize();   // joints bend down and outward: spider-like, wrong
      const x = (A * A - B * B + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, A * A - x * x));
      const pd = pole.clone().addScaledVector(d, -pole.dot(d)).normalize(); const knee = a.clone().addScaledVector(d, x).addScaledVector(pd, h); const end = a.clone().addScaledVector(d, dist);
      seg(L.up, a, knee, 0.026); seg(L.lo, knee, end, 0.021); L.j1.position.copy(knee); L.j2.position.copy(end);
      const ld = limbDr[i]; ld.position.copy(a.clone().lerp(knee, 0.45)).add(V(0, -0.025, 0)); ld.rotation.set(Math.sin(t * 0.9 + i) * 0.12, 0, Math.sin(t * 0.7 + i * 2) * 0.12);
      // long fingers spread flat on the ceiling; every joint can twitch on its own
      const out = end.clone().sub(knee).setY(0).normalize(); if (out.lengthSq() < 0.01) out.copy(fwd);
      L.f.forEach((f, k) => { const ang = (k - 2) * 0.33; const dir = out.clone().applyAxisAngle(_up, ang); const fl = (i < 2 ? 0.3 : 0.22) * (k === 0 || k === 4 ? 0.72 : 1);
        const t1 = st.tw ? st.tw(i, k, 0) : 0, t2 = st.tw ? st.tw(i, k, 1) : 0, t3 = st.tw ? st.tw(i, k, 2) : 0;
        const p1 = end.clone().addScaledVector(dir, fl * 0.38).add(V(0, -0.015 - t1 * 0.12, 0));
        const p2 = p1.clone().addScaledVector(dir, fl * 0.33 * Math.cos(t2)).add(V(0, -Math.sin(t2) * fl * 0.33 + 0.01, 0));
        const p3 = p2.clone().addScaledVector(dir, fl * 0.29 * Math.cos(t2 + t3)).add(V(0, -Math.sin(t2 + t3) * fl * 0.29 + 0.012, 0));
        seg(f[0], end, p1, 0.009); seg(f[1], p1, p2, 0.0075); seg(f[2], p2, p3, 0.0062); f[3].position.copy(p1); f[4].position.copy(p2); f[5].position.copy(p3); });
    });
    // neck: bent all the way back, the head hangs below the shoulders with the face turned to you
    const nb = shoulder.clone().addScaledVector(fwd, 0.1).addScaledVector(down, 0.06);
    const hp = st.headPos || nb.clone().addScaledVector(fwd, 0.16).addScaledVector(down, 0.27);
    seg(neck, nb, hp, 0.03); neckFold.forEach((r, i) => { const q = nb.clone().lerp(hp, 0.25 + i * 0.17); r.position.copy(q); r.quaternion.setFromUnitVectors(V(0, 0, 1), hp.clone().sub(nb).normalize()); });
    head.position.copy(hp); head.lookAt(st.headLook); head.rotateZ(Math.PI + (st.tilt || 0));   // upside down face
    head.scale.setScalar((st.scale || 1) * 0.85);
    const jw = st.jaw ?? 0.6; jaw.position.set(0, -0.2 - jw * 0.12, 0.03); jaw.scale.set(0.75, 1.15 + jw * 0.5, 0.7); mouthIn.position.set(0, -0.12 - jw * 0.06, 0.07); mouthIn.scale.set(0.6, 1.3 + jw * 0.9, 0.5);
    C.mouthWorld.copy(V(0, -0.2 - jw * 0.14, 0.12)).applyMatrix4(head.matrixWorld.clone().compose(head.position, head.quaternion, head.scale));
    hair.forEach(hh => { const p = hh.l.geometry.attributes.position; for (let k = 0; k < 8; k++) { const kk = k / 7; const w = V(hh.x, 0.2, -0.04).applyQuaternion(head.quaternion).multiplyScalar(head.scale.x).add(head.position); p.setXYZ(k, w.x + Math.sin(t * 1.3 + hh.x * 30) * 0.02 * kk, w.y - kk * hh.len, w.z); } p.needsUpdate = true; });
  };
  return C;
}

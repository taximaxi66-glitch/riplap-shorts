// ---------- 3D models: the old house, its clutter, you, and the thing on the ceiling ----------
import * as THREE from 'three';
import { TEX, faceTex, phoneTex } from './tex.js';

let GRAD = null;
export function toonGrad() { if (GRAD) return GRAD; const d = new Uint8Array([40, 95, 170, 255]); GRAD = new THREE.DataTexture(d, 4, 1, THREE.RedFormat); GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.needsUpdate = true; return GRAD; }
export function mat(color, o = {}) { return new THREE.MeshToonMaterial({ color, gradientMap: toonGrad(), ...o }); }
const OUT = m => { m.userData.outlineParameters = { thickness: 0.0045, color: [0.03, 0.03, 0.04], alpha: 1 }; return m; };
export function noOutline(m) { m.userData.outlineParameters = { visible: false }; return m; }
function uvBox(geo, w, h, d, tile = 1) {   // texture tiling in metres for a BoxGeometry
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile); }
  uv.needsUpdate = true; return geo;
}
export function box(w, h, d, m, x = 0, y = 0, z = 0, o = {}) {   // x,y,z = min corner
  const geo = uvBox(new THREE.BoxGeometry(w, h, d), w, h, d, o.tile || 1); const me = new THREE.Mesh(geo, m);
  me.position.set(x + w / 2, y + h / 2, z + d / 2); me.castShadow = o.cast !== false; me.receiveShadow = true; return me;
}
function cyl(r0, r1, h, m, seg = 16) { const me = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); me.castShadow = true; me.receiveShadow = true; return me; }
function sph(r, m, sx = 1, sy = 1, sz = 1) { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m); me.scale.set(sx, sy, sz); me.castShadow = true; me.receiveShadow = true; return me; }
// place a unit cylinder (height 1 along y) between two points
const _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
export function seg(me, a, b, r) { _d.subVectors(b, a); const L = _d.length(); me.position.copy(a).addScaledVector(_d, 0.5); me.quaternion.setFromUnitVectors(_up, _d.normalize()); me.scale.set(r, L, r); }
// a wall along local +x (len), with rectangular openings [{x0,x1,y0,y1}]
function wall(len, h, th, open, m, tile = 1) {
  const g = new THREE.Group(); const os = [...open].sort((a, b) => a.x0 - b.x0); let x = 0;
  for (const o of os) { if (o.x0 > x) g.add(box(o.x0 - x, h, th, m, x, 0, 0, { tile }));
    if (o.y0 > 0) g.add(box(o.x1 - o.x0, o.y0, th, m, o.x0, 0, 0, { tile })); if (o.y1 < h) g.add(box(o.x1 - o.x0, h - o.y1, th, m, o.x0, o.y1, 0, { tile })); x = o.x1; }
  if (x < len) g.add(box(len - x, h, th, m, x, 0, 0, { tile })); return g;
}
function frameAround(o, depth, m) {   // wooden casing around an opening (in wall-local coords)
  const g = new THREE.Group(), t = 0.07;
  g.add(box(t, o.y1 - o.y0 + t, depth, m, o.x0 - t, o.y0, -0.02)); g.add(box(t, o.y1 - o.y0 + t, depth, m, o.x1, o.y0, -0.02)); g.add(box(o.x1 - o.x0 + 2 * t, t, depth, m, o.x0 - t, o.y1, -0.02));
  if (o.y0 > 0.1) g.add(box(o.x1 - o.x0 + 2 * t, t * 0.8, depth + 0.06, m, o.x0 - t, o.y0 - t * 0.8, -0.05)); return g;
}
function cardboardBox(w, h, d, open = false) {
  const g = new THREE.Group(), m = OUT(mat(0xffffff, { map: TEX.cardboard }));
  if (!open) g.add(box(w, h, d, m)); else {
    const th = 0.01; g.add(box(w, th, d, m)); g.add(box(th, h, d, m)); g.add(box(th, h, d, m, w - th)); g.add(box(w, h, th, m)); g.add(box(w, h, th, m, 0, 0, d - th));
    for (const [px, rz] of [[0, 0.9], [w, -0.9]]) { const f = box(w * 0.5, 0.01, d, m); f.geometry.translate(px ? -w / 4 : w / 4, 0, 0); f.position.set(px, h, d / 2); f.rotation.z = rz; g.add(f); }
    const junk = [0x7a3a3a, 0x3a5a7a, 0xc9b98a, 0x445533]; for (let i = 0; i < 4; i++) { const j = box(0.12 + i * 0.03, 0.06, 0.18, OUT(mat(junk[i])), 0.05 + i * 0.07, h - 0.07 + (i % 2) * 0.03, 0.05 + i * 0.04); j.rotation.y = i * 0.4; g.add(j); }
  }
  return g;
}
function clothes(color, s = 1) { const geo = new THREE.SphereGeometry(0.3 * s, 14, 8); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y * 0.18 + Math.sin(p.getX(i) * 13) * 0.012); p.setX(i, p.getX(i) * (1 + Math.sin(p.getZ(i) * 9) * 0.15)); } geo.computeVertexNormals(); const me = new THREE.Mesh(geo, OUT(mat(color))); me.castShadow = me.receiveShadow = true; return me; }
function draped(w, d, m, f) {   // a soft draped cloth (blanket) as a displaced plane
  const geo = new THREE.PlaneGeometry(w, d, 40, 40); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, f(p.getX(i), p.getZ(i))); geo.computeVertexNormals(); const me = new THREE.Mesh(geo, m); me.castShadow = me.receiveShadow = true; return me;
}
function picture(tex, w, h) { const g = new THREE.Group(); g.add(box(w + 0.06, h + 0.06, 0.03, OUT(mat(0x3a2a1a)), -0.03, -0.03, 0)); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(0xffffff, { map: tex })); p.position.set(w / 2, h / 2, 0.032); g.add(p); return g; }
function skyTex() { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#05070f'); gr.addColorStop(1, '#22304c'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.7})`; g.fillRect(Math.random() * 512, Math.random() * 300, 2, 2); }
  g.fillStyle = 'rgba(200,210,235,0.25)'; g.beginPath(); g.arc(360, 120, 70, 0, 7); g.fill(); g.fillStyle = '#e4e2d6'; g.beginPath(); g.arc(360, 120, 34, 0, 7); g.fill();
  g.fillStyle = '#05060a'; g.beginPath(); g.moveTo(0, 512); for (let x = 0; x <= 512; x += 16) g.lineTo(x, 400 - Math.abs(Math.sin(x * 0.03)) * 60 - (x % 48 === 0 ? 20 : 0)); g.lineTo(512, 512); g.fill();
  g.strokeStyle = '#05060a'; g.lineWidth = 9; g.beginPath(); g.moveTo(80, 512); g.lineTo(120, 250); g.lineTo(60, 120); g.moveTo(118, 300); g.lineTo(200, 200); g.lineTo(240, 140); g.moveTo(110, 220); g.lineTo(30, 180); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// =================== SET A: your bedroom (upstairs) ===================
export function buildBedroom() {
  const S = new THREE.Group(), W = 4.2, D = 3.8, H = 2.5;
  const wp = OUT(mat(0xffffff, { map: TEX.wallpaper })), wood = OUT(mat(0x5a3d26)), woodD = OUT(mat(0x3a2718)), trim = OUT(mat(0xb9b09a));
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat(0xffffff, { map: TEX.planks })); fl.rotation.x = -Math.PI / 2; fl.position.set(W / 2, 0, D / 2); fl.receiveShadow = true; TEX.planks.repeat.set(2, 2); S.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat(0xffffff, { map: TEX.ceiling })); ce.rotation.x = Math.PI / 2; ce.position.set(W / 2, H, D / 2); S.add(noOutline(ce.material) && ce);
  const WIN = { x0: 1.2, x1: 2.25, y0: 0.95, y1: 2.05 }, DOOR = { x0: 2.5, x1: 3.4, y0: 0, y1: 2.05 };
  const back = wall(W, H, 0.12, [WIN], wp); back.position.set(0, 0, -0.12); S.add(back); S.add(Object.assign(frameAround(WIN, 0.16, trim), {}));
  const left = wall(D, H, 0.12, [DOOR], wp); left.rotation.y = -Math.PI / 2; left.position.set(0, 0, 0); S.add(left);
  const lf = frameAround(DOOR, 0.16, trim); lf.rotation.y = -Math.PI / 2; lf.position.set(0.04, 0, 0); S.add(lf);
  const right = wall(D, H, 0.12, [], wp); right.rotation.y = -Math.PI / 2; right.position.set(W + 0.12, 0, 0); S.add(right);
  const front = wall(W, H, 0.12, [], wp); front.position.set(0, 0, D); S.add(front);
  // baseboards
  S.add(box(W, 0.1, 0.025, trim, 0, 0, 0)); S.add(box(0.025, 0.1, D, trim, W - 0.025, 0, 0)); S.add(box(W, 0.1, 0.025, trim, 0, 0, D - 0.025));
  // window: sash bars, glass, night outside, curtains
  const wf = OUT(mat(0xd8d2c0)); S.add(box(0.04, WIN.y1 - WIN.y0, 0.05, wf, (WIN.x0 + WIN.x1) / 2 - 0.02, WIN.y0, -0.08)); S.add(box(WIN.x1 - WIN.x0, 0.04, 0.05, wf, WIN.x0, (WIN.y0 + WIN.y1) / 2, -0.08));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.MeshBasicMaterial({ color: 0x9fb4d8, transparent: true, opacity: 0.08 })); glass.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -0.06); S.add(noOutline(glass.material) && glass);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), new THREE.MeshBasicMaterial({ map: skyTex() })); sky.position.set(1.7, 1.6, -2.5); S.add(noOutline(sky.material) && sky);
  const curtM = OUT(mat(0x6b5a40, { side: THREE.DoubleSide })), curtains = [];
  for (const [cx, w] of [[WIN.x0 - 0.2, 0.42], [WIN.x1 - 0.05, 0.3]]) { const geo = new THREE.PlaneGeometry(w, 2.15, 12, 20); const c = new THREE.Mesh(geo, curtM); c.position.set(cx + w / 2, 1.2, 0.02); c.castShadow = true; c.userData.base = geo.attributes.position.array.slice(); S.add(c); curtains.push(c); }
  S.add(cyl(0.015, 0.015, 1.7, OUT(mat(0x2a2a2a))).rotateZ(Math.PI / 2).translateX(0)); S.children[S.children.length - 1].position.set(1.72, 2.28, 0.03);
  // bed (against the right wall, head at the back wall)
  const bed = new THREE.Group(); bed.position.set(2.95, 0, 0.05);
  bed.add(box(1.2, 0.3, 2.05, woodD, 0, 0.1, 0)); for (const [x, z] of [[0, 0], [1.12, 0], [0, 1.97], [1.12, 1.97]]) bed.add(box(0.08, 0.12, 0.08, woodD, x, 0, z));
  bed.add(box(1.2, 0.95, 0.07, wood, 0, 0.1, -0.02)); bed.add(box(1.24, 0.06, 0.1, woodD, -0.02, 1.05, -0.04));
  bed.add(box(1.14, 0.17, 1.95, OUT(mat(0xd8d2c4)), 0.03, 0.38, 0.06));
  const pil = sph(0.3, OUT(mat(0xe6e0d4)), 1.25, 0.32, 0.65); pil.position.set(0.55, 0.62, 0.32); pil.rotation.z = 0.06; bed.add(pil);
  const bl = draped(1.3, 1.45, OUT(mat(0xffffff, { map: TEX.blanket, side: THREE.DoubleSide })), (x, z) => 0.58 + 0.07 * Math.exp(-((x + 0.1) ** 2) * 6) * (z > -0.3 ? 1 : 0.3) + 0.03 * Math.sin(x * 9 + z * 4) * Math.exp(-((z + 0.6) ** 2)) - (Math.abs(x) > 0.58 ? (Math.abs(x) - 0.58) * 2.2 : 0));
  bl.position.set(0.6, 0, 1.3); bed.add(bl);
  S.add(bed);
  // nightstand + lamp + glass + charger cable
  const ns = new THREE.Group(); ns.position.set(2.35, 0, 0.12); ns.add(box(0.5, 0.55, 0.42, wood)); ns.add(box(0.44, 0.15, 0.02, woodD, 0.03, 0.3, 0.42)); ns.add(sph(0.018, OUT(mat(0xc8b070))).translateX(0.25).translateY(0.38).translateZ(0.445));
  const lb = cyl(0.06, 0.08, 0.04, OUT(mat(0x2a2a2a))); lb.position.set(0.15, 0.57, 0.2); ns.add(lb); const ls = cyl(0.01, 0.01, 0.25, OUT(mat(0x2a2a2a))); ls.position.set(0.15, 0.7, 0.2); ns.add(ls);
  const shade = cyl(0.07, 0.13, 0.17, new THREE.MeshToonMaterial({ color: 0xe8c890, emissive: 0x6a4a20, gradientMap: toonGrad(), side: THREE.DoubleSide })); shade.position.set(0.15, 0.86, 0.2); OUT(shade.material); ns.add(shade);
  const gl = cyl(0.03, 0.025, 0.1, new THREE.MeshBasicMaterial({ color: 0xaac0d0, transparent: true, opacity: 0.45 })); gl.position.set(0.36, 0.6, 0.12); ns.add(noOutline(gl.material) && gl);
  const lampL = new THREE.PointLight(0xffb066, 3.2, 7, 1.4); lampL.position.set(0.15, 0.86, 0.2); ns.add(lampL); S.add(ns);
  // desk under the window, chair with a hoodie, laptop, cans, papers
  const desk = new THREE.Group(); desk.position.set(1.05, 0, 0.08); desk.add(box(1.25, 0.04, 0.6, wood, 0, 0.72, 0)); for (const x of [0.02, 1.19]) desk.add(box(0.04, 0.72, 0.56, woodD, x, 0, 0.02));
  desk.add(box(0.34, 0.025, 0.24, OUT(mat(0x2b2d33)), 0.1, 0.76, 0.2)); for (let i = 0; i < 3; i++) { const c = cyl(0.033, 0.033, 0.12, OUT(mat([0x2f8a4a, 0xc23b2b, 0x2f6b9a][i]))); c.position.set(0.7 + i * 0.09, 0.82, 0.18 + (i % 2) * 0.1); desk.add(c); }
  const can = cyl(0.033, 0.033, 0.12, OUT(mat(0x2f8a4a))); can.rotation.z = Math.PI / 2; can.position.set(0.95, 0.03, 0.9); desk.add(can);
  for (let i = 0; i < 4; i++) { const p = box(0.21, 0.004, 0.29, OUT(mat(0xe8e2d2)), 0.45 + i * 0.03, 0.745 + i * 0.004, 0.15 + i * 0.02); p.rotation.y = i * 0.25; desk.add(p); }
  S.add(desk);
  const chair = new THREE.Group(); chair.position.set(1.55, 0, 0.95); chair.rotation.y = 0.5; chair.add(box(0.45, 0.04, 0.45, woodD, -0.22, 0.45, -0.22)); for (const [x, z] of [[-0.2, -0.2], [0.17, -0.2], [-0.2, 0.17], [0.17, 0.17]]) chair.add(box(0.03, 0.45, 0.03, woodD, x, 0, z)); chair.add(box(0.45, 0.5, 0.04, woodD, -0.22, 0.49, 0.19));
  const hood = clothes(0x2d4a3a, 0.9); hood.position.set(0, 0.62, 0.1); hood.rotation.x = -1.2; chair.add(hood); S.add(chair);
  // boxes stacked in the corner, an open one, clothes on the floor, a wardrobe with its door ajar
  const b1 = cardboardBox(0.55, 0.4, 0.45); b1.position.set(0.12, 0, 0.12); S.add(b1); const b2 = cardboardBox(0.45, 0.35, 0.4); b2.position.set(0.18, 0.4, 0.16); b2.rotation.y = 0.12; S.add(b2);
  const b3 = cardboardBox(0.5, 0.35, 0.42, true); b3.position.set(0.15, 0, 0.65); b3.rotation.y = -0.2; S.add(b3);
  const b4 = cardboardBox(0.4, 0.3, 0.35); b4.position.set(1.0, 0, 3.2); b4.rotation.y = 0.4; S.add(b4);
  for (const [x, z, c, s] of [[1.9, 1.7, 0x3a3f55, 1], [2.3, 2.4, 0x7a2a2a, 0.7], [1.4, 2.9, 0x55553a, 0.8]]) { const cl = clothes(c, s); cl.position.set(x, 0.02, z); cl.rotation.y = x * 3; S.add(cl); }
  const sneak = box(0.11, 0.09, 0.28, OUT(mat(0xe9e6df)), 2.6, 0, 2.95); sneak.rotation.y = 0.6; S.add(sneak); const sn2 = box(0.11, 0.09, 0.28, OUT(mat(0xe9e6df)), 2.75, 0, 3.1); sn2.rotation.y = -0.3; S.add(sn2);
  const wr = new THREE.Group(); wr.position.set(0, 0, 0.95); wr.add(box(0.58, 2.0, 1.15, wood)); const wd = box(0.025, 1.85, 0.56, woodD, 0, 0, 0); wd.geometry.translate(0, 0, 0.28); wd.position.set(0.6, 1.0, 0.03); wd.rotation.y = 0.35; wr.add(wd);
  wr.add(box(0.02, 1.86, 0.02, OUT(mat(0x050505)), 0.585, 0.07, 0.6)); S.add(wr);
  // rug, poster, crooked photo, light switch, bare bulb
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), mat(0xffffff, { map: TEX.rug })); rug.rotation.x = -Math.PI / 2; rug.rotation.z = 0.08; rug.position.set(1.8, 0.005, 2.2); rug.receiveShadow = true; S.add(rug);
  const po = picture(TEX.poster, 0.55, 0.77); po.rotation.y = -Math.PI / 2; po.position.set(W - 0.01, 1.25, 1.6); po.rotation.z = 0.04; S.add(po);
  const ph = picture(TEX.photo, 0.22, 0.28); ph.position.set(2.45, 1.45, 0.005); ph.rotation.z = -0.12; S.add(ph);
  S.add(box(0.08, 0.12, 0.02, OUT(mat(0xe0dccc)), 0.02, 1.25, 2.3).rotateY(Math.PI / 2));
  const cord = cyl(0.006, 0.006, 0.35, OUT(mat(0x111111))); cord.position.set(2.1, H - 0.17, 1.9); S.add(cord); const bulb = sph(0.045, OUT(mat(0xd8d4c0))); bulb.position.set(2.1, H - 0.37, 1.9); S.add(bulb);
  // the door (hinged at the wall side), knob, key in the lock
  const door = new THREE.Group(); door.position.set(0.0, 0, DOOR.x0 + 0.02); const slab = box(0.045, 2.0, 0.86, OUT(mat(0x6a4a30)), -0.02, 0, 0); door.add(slab);
  for (const [y, h] of [[0.15, 0.75], [1.05, 0.8]]) door.add(box(0.012, h, 0.6, OUT(mat(0x5a3e28)), 0.028, y, 0.13));
  const knob = sph(0.035, OUT(mat(0xb0a070))); knob.position.set(0.06, 1.0, 0.76); door.add(knob);
  const key = new THREE.Group(); key.position.set(0.055, 0.93, 0.76); key.add(box(0.05, 0.014, 0.008, OUT(mat(0x9a9070)), 0, -0.007, -0.004)); const bow = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 8, 16), OUT(mat(0x9a9070))); bow.position.set(0.07, 0, 0); bow.rotation.y = Math.PI / 2; key.add(bow); door.add(key);
  S.add(door);
  // lights: moonlight through the window (with shadows of the window bars), cold ambient
  const amb = new THREE.HemisphereLight(0x5a6a90, 0x1a1410, 0.8); S.add(amb);
  // the dark upstairs hallway outside your door (seen through the gap), faint cold light from a hall window
  const hw = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), mat(0x8a8470, { map: TEX.wallpaper })); hw.rotation.y = Math.PI / 2; hw.position.set(-1.25, 1.25, 3.0); S.add(hw);
  const hf = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 4), mat(0xffffff, { map: TEX.planks })); hf.rotation.x = -Math.PI / 2; hf.position.set(-0.6, 0.001, 3.0); hf.receiveShadow = true; S.add(hf);
  const hallL = new THREE.PointLight(0x7a90c8, 1.6, 3.5, 1.5); hallL.position.set(-0.7, 2.1, 3.6); S.add(hallL);
  const moon = new THREE.DirectionalLight(0x9fb4ff, 2.2); moon.position.set(1.3, 3.6, -3.5); moon.target.position.set(2.0, 0, 2.2); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 12 }); moon.shadow.bias = -0.001; S.add(moon); S.add(moon.target);
  return { S, door, key, curtains, lampL, shade, W, D, H, DOOR, WIN, bedTop: 0.55 };
}

// =================== SET B: hallway, stairs, living room (downstairs) ===================
// hall x 0..1.3, z -1..3.4 (stairs climb from z 3.4 to 8 along +z). The living-room doorway is in the hall's end wall (z = -1), x 0.2..1.1, up to 2.45 m.
// living room: x -2.2..3.4, z -6.6..-1
export function buildDownstairs() {
  const S = new THREE.Group(), H = 2.6;
  const wp = OUT(mat(0xd6cfb6, { map: TEX.wallpaper })), wpL = OUT(mat(0xc9c2aa, { map: TEX.plaster })), wood = OUT(mat(0x5a3d26)), woodD = OUT(mat(0x3a2718)), trim = OUT(mat(0xb9b09a));
  const planks = mat(0xffffff, { map: TEX.planks });
  const floor = (x0, z0, w, d) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), planks); f.rotation.x = -Math.PI / 2; f.position.set(x0 + w / 2, 0, z0 + d / 2); f.receiveShadow = true; S.add(f); };
  const ceil = (x0, z0, w, d, y) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(0xffffff, { map: TEX.ceiling })); c.rotation.x = Math.PI / 2; c.position.set(x0 + w / 2, y, z0 + d / 2); c.receiveShadow = true; S.add(c); };
  floor(0, -1, 1.3, 9.5); floor(-2.2, -6.6, 5.6, 5.6); ceil(0, -1, 1.3, 4.4, H); ceil(-2.2, -6.6, 5.6, 5.6, H);
  const DW = { x0: 0.2, x1: 1.1, y1: 2.45 };
  // hall side walls (tall: they also bound the stairwell)
  const hl = wall(9.5, H + 2.9, 0.12, [], wp); hl.rotation.y = -Math.PI / 2; hl.position.set(0, 0, -1); S.add(hl);
  const hr = wall(9.5, H + 2.9, 0.12, [], wp); hr.rotation.y = -Math.PI / 2; hr.position.set(1.42, 0, -1); S.add(hr);
  S.add(box(1.3, 2.9, 0.25, wp, 0, 2.6, 3.15));
  // end wall with the doorway (wall thickness 0.14 at z -1.14..-1)
  const efr = frameAround({ x0: DW.x0 + 0.12, x1: DW.x1 + 0.12, y0: 0, y1: DW.y1 }, 0.2, trim); efr.position.set(-0.12, 0, -1.11); S.add(efr);
  // living room walls
  const lw = (len, x, z, ry, open = []) => { const w = wall(len, H, 0.12, open, wpL, 1.5); w.rotation.y = ry; w.position.set(x, 0, z); S.add(w); };
  lw(5.6, -2.2, -6.72, 0); lw(5.6, -2.2, -1.12, 0, [{ x0: 2.4, x1: 3.3, y0: 0, y1: DW.y1 }]);
  lw(5.6, -2.2, -6.6, -Math.PI / 2); lw(5.6, 3.4, -6.6, -Math.PI / 2, [{ x0: 2.0, x1: 3.3, y0: 0.9, y1: 2.15 }]);
  // stairs from the hall (z 3.4) up to the landing (y 2.8, z 8)
  const N = 14, rise = 2.8 / N, run = 4.6 / N, stairM = OUT(mat(0x4e3522)), riserM = OUT(mat(0x8a826a));
  for (let i = 0; i < N; i++) { const y = rise * (i + 1), z = 3.4 + run * i; S.add(box(1.25, 0.04, run + 0.03, stairM, 0.02, y - 0.04, z)); S.add(box(1.25, y - 0.04, 0.02, riserM, 0.02, 0, z)); }
  S.add(box(1.3, 0.05, 1.6, stairM, 0, 2.76, 8.0)); ceil(0, 3.4, 1.3, 6.2, H + 2.9);
  // upstairs: the landing wall with your bedroom door, dim cold light
  S.add(box(1.3, 2.7, 0.12, wp, 0, 2.8, 9.6)); const ud = box(0.8, 2.0, 0.05, OUT(mat(0x6a4a30)), 0.25, 2.8, 9.55); S.add(ud);
  const ul = new THREE.PointLight(0x7a90c8, 1.4, 5, 1.5); ul.position.set(0.65, 4.9, 8.6); S.add(ul);
  const bm = OUT(mat(0x3a2718)); for (let i = 0; i < N; i++) { const y = rise * (i + 1), z = 3.4 + run * (i + 0.5); const b = cyl(0.014, 0.014, 0.9, bm, 8); b.position.set(1.16, y + 0.45, z); S.add(b); }
  const rl = Math.hypot(4.6, 2.8), rail = cyl(0.028, 0.028, rl, bm); rail.position.set(1.16, 1.4 + 0.9, 3.4 + 2.3); rail.rotation.x = Math.atan2(4.6, 2.8); S.add(rail); S.add(box(0.1, 1.1, 0.1, bm, 1.11, 0, 3.25));
  for (let i = 0; i < 5; i++) { const p = picture(TEX.photo, 0.2, 0.25); p.rotation.y = Math.PI / 2; p.position.set(0.0, 1.5 + i * 0.4, 3.0 + i * 0.95); p.rotation.x = (i % 2 ? 0.08 : -0.1); S.add(p); }
  // hall clutter: coats on hooks, shoes, a box, a small table with keys
  for (let i = 0; i < 3; i++) { const c = clothes([0x3a3a44, 0x6a5a3a, 0x2a3a2a][i], 0.55); c.rotation.z = Math.PI / 2; c.position.set(1.2, 1.35, 0.1 + i * 0.35); c.scale.set(1, 1.4, 1); S.add(c); }
  for (const [x, z, r] of [[0.9, 0.0, 0.3], [1.0, 0.3, -0.4], [0.2, 2.4, 1.2]]) { const s = box(0.11, 0.09, 0.28, OUT(mat(0x2a2a2a)), x, 0, z); s.rotation.y = r; S.add(s); }
  const hb = cardboardBox(0.45, 0.36, 0.4, true); hb.position.set(0.05, 0, 1.2); S.add(hb);
  const ht = new THREE.Group(); ht.position.set(0.02, 0, 2.2); ht.add(box(0.3, 0.03, 0.6, wood, 0, 0.8, 0)); ht.add(box(0.03, 0.8, 0.03, woodD, 0.25, 0, 0.02)); ht.add(box(0.03, 0.8, 0.03, woodD, 0.25, 0, 0.55)); S.add(ht);
  // living room: sofa against the far wall, coffee table, old TV, boxes, standing lamp, rug, window with moonlight
  const sofaM = OUT(mat(0x5a4a3a)), sofaD = OUT(mat(0x45382c)); const sofa = new THREE.Group(); sofa.position.set(-0.6, 0, -6.55);
  sofa.add(box(2.2, 0.42, 0.85, sofaD)); sofa.add(box(2.2, 0.85, 0.25, sofaM)); sofa.add(box(0.22, 0.62, 0.85, sofaM, -0.1)); sofa.add(box(0.22, 0.62, 0.85, sofaM, 2.08));
  for (let i = 0; i < 2; i++) { const c = box(1.0, 0.14, 0.62, OUT(mat(0x66533f)), 0.08 + i * 1.02, 0.42, 0.22); c.rotation.x = (i ? 0.03 : -0.04); sofa.add(c); }
  const thr = draped(0.8, 0.9, OUT(mat(0x7a3030, { side: THREE.DoubleSide })), (x, z) => 0.6 + 0.06 * Math.cos(z * 5) + (z > 0.15 ? -(z - 0.15) * 1.3 : 0)); thr.position.set(1.7, 0, 0.45); sofa.add(thr); S.add(sofa);
  const ct = new THREE.Group(); ct.position.set(-0.3, 0, -5.0); ct.add(box(1.2, 0.04, 0.65, wood, 0, 0.42, 0)); for (const [x, z] of [[0.03, 0.03], [1.12, 0.03], [0.03, 0.57], [1.12, 0.57]]) ct.add(box(0.05, 0.42, 0.05, woodD, x, 0, z));
  const pz = box(0.4, 0.05, 0.4, OUT(mat(0xffffff, { map: TEX.pizza })), 0.12, 0.46, 0.12); pz.rotation.y = 0.2; ct.add(pz); for (let i = 0; i < 3; i++) { const c = cyl(0.033, 0.033, 0.12, OUT(mat([0xc23b2b, 0x2f6b9a, 0xcfcfcf][i]))); c.position.set(0.72 + i * 0.12, 0.52, 0.2 + (i % 2) * 0.15); ct.add(c); } S.add(ct);
  const tv = new THREE.Group(); tv.position.set(-2.1, 0, -4.6); tv.rotation.y = Math.PI / 2; tv.add(box(1.2, 0.5, 0.45, woodD)); tv.add(box(0.75, 0.55, 0.5, OUT(mat(0x2a2a2e)), 0.22, 0.5, -0.02)); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.42), mat(0xffffff, { map: TEX.tvscreen })); scr.position.set(0.6, 0.78, 0.49); tv.add(scr); S.add(tv);
  for (const [x, z, w, h, d, o, y] of [[2.4, -6.3, 0.6, 0.45, 0.5, false, 0], [2.45, -6.28, 0.5, 0.35, 0.42, false, 0.45], [-1.9, -2.0, 0.55, 0.4, 0.45, true, 0], [2.6, -2.1, 0.5, 0.4, 0.45, false, 0]]) { const b = cardboardBox(w, h, d, o); b.position.set(x, y, z); b.rotation.y = x * 0.3; S.add(b); }
  const sl = new THREE.Group(); sl.position.set(-1.8, 0, -6.2); sl.add(cyl(0.15, 0.15, 0.03, OUT(mat(0x222222)))); const pole = cyl(0.015, 0.015, 1.6, OUT(mat(0x222222))); pole.position.y = 0.8; sl.add(pole); const sh = cyl(0.12, 0.22, 0.3, OUT(mat(0xc8b890))); sh.position.y = 1.65; sl.add(sh); S.add(sl);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), mat(0xffffff, { map: TEX.rug })); rug.rotation.x = -Math.PI / 2; rug.position.set(0.3, 0.005, -4.6); rug.receiveShadow = true; S.add(rug);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ map: skyTex() })); noOutline(sky.material); sky.position.set(5.5, 1.5, -3.9); sky.rotation.y = -Math.PI / 2; S.add(sky);
  S.add(box(0.05, 1.25, 0.05, OUT(mat(0xd8d2c0)), 3.38, 0.9, -3.97)); S.add(box(0.05, 0.05, 1.3, OUT(mat(0xd8d2c0)), 3.38, 1.5, -4.6));
  // the thing that fell: a picture frame face down by the wall, broken glass around it
  const fallen = box(0.42, 0.025, 0.52, OUT(mat(0x3a2a1a)), -1.2, 0, -3.0); fallen.rotation.y = 0.5; S.add(fallen);
  const sh_ = new THREE.MeshBasicMaterial({ color: 0xc8d8e8, transparent: true, opacity: 0.75, side: THREE.DoubleSide }); noOutline(sh_);
  for (let i = 0; i < 10; i++) { const g = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0, 0.02), new THREE.Vector3(0.01, 0, 0.06)]), sh_); g.position.set(-1.0 + Math.sin(i * 2.3) * 0.5, 0.004, -2.9 + Math.cos(i * 1.7) * 0.5); g.rotation.y = i; S.add(g); }
  const hook = cyl(0.004, 0.004, 0.04, OUT(mat(0x222222))); hook.position.set(-2.12, 1.7, -2.9); hook.rotation.z = Math.PI / 2; S.add(hook);
  const amb = new THREE.HemisphereLight(0x3a4a70, 0x100c08, 0.28); S.add(amb);
  const moon = new THREE.DirectionalLight(0x9fb4ff, 1.6); moon.position.set(7, 3.5, -4.0); moon.target.position.set(0.5, 0, -3.8); S.add(moon); S.add(moon.target);
  return { S, H, DW, rise, run, N };
}

// =================== YOU: a jointed 3D character (hoodie, jeans, sneakers) ===================
export function makeHuman() {
  const skin = OUT(mat(0xe2b590)), hood = OUT(mat(0x8e2b2b)), hoodD = OUT(mat(0x6a1f1f)), jeans = OUT(mat(0x2f4060)), shoe = OUT(mat(0xe9e6df)), hair = OUT(mat(0x2a1a10));
  const J = {}, root = new THREE.Group();
  const joint = (name, parent, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); J[name] = j; return j; };
  const limb = (parent, len, r0, r1, m) => { const c = cyl(r1, r0, len, m); c.position.y = -len / 2; parent.add(c); const k = sph(r0, m); parent.add(k); return c; };
  const hips = joint('hips', root, 0, 0, 0);
  const pel = sph(0.13, jeans, 1.15, 0.7, 0.8); hips.add(pel);
  const spine = joint('spine', hips, 0, 0.05, 0); const torso = cyl(0.15, 0.14, 0.5, hood); torso.scale.set(1, 1, 0.62); torso.position.y = 0.25; spine.add(torso);
  const pocket = box(0.2, 0.1, 0.02, hoodD, -0.1, 0.06, 0.1); spine.add(pocket);
  const chest = joint('chest', spine, 0, 0.48, 0); const sh = sph(0.17, hood, 1, 0.42, 0.62); chest.add(sh);
  const neck = joint('neck', chest, 0, 0.06, 0.01); const nk = cyl(0.05, 0.05, 0.1, skin); nk.position.y = 0.04; neck.add(nk);
  const head = joint('head', neck, 0, 0.12, 0); const hd = sph(0.105, skin, 0.92, 1.12, 1); hd.position.y = 0.04; head.add(hd);
  const hr = sph(0.108, hair, 0.98, 0.72, 1.02); hr.position.set(0, 0.085, -0.018); head.add(hr);
  const hoodBack = sph(0.13, hoodD, 1.08, 0.95, 0.8); hoodBack.position.set(0, -0.03, -0.075); head.add(hoodBack);
  const faceM = new THREE.MeshBasicMaterial({ map: faceTex('normal'), transparent: true, depthWrite: false }); noOutline(faceM);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), faceM); face.position.set(0, 0.03, 0.104); head.add(face);
  const earM = skin; for (const s of [-1, 1]) { const e = sph(0.025, earM, 0.6, 1, 0.8); e.position.set(s * 0.098, 0.03, 0); head.add(e); }
  for (const s of [-1, 1]) {
    const n = s < 0 ? 'L' : 'R';
    const shJ = joint('sh' + n, chest, s * 0.2, -0.02, 0); limb(shJ, 0.3, 0.05, 0.043, hood);
    const el = joint('el' + n, shJ, 0, -0.3, 0); limb(el, 0.26, 0.043, 0.036, hood);
    const wr = joint('wr' + n, el, 0, -0.27, 0); const hand = sph(0.045, skin, 0.8, 1.2, 0.5); hand.position.y = -0.05; wr.add(hand); const th = sph(0.018, skin, 1, 2, 1); th.position.set(-s * 0.03, -0.04, 0.02); wr.add(th);
    const hp = joint('hip' + n, hips, s * 0.1, -0.03, 0); limb(hp, 0.44, 0.085, 0.06, jeans);
    const kn = joint('kn' + n, hp, 0, -0.44, 0); limb(kn, 0.43, 0.06, 0.045, jeans);
    const an = joint('an' + n, kn, 0, -0.43, 0); const sho = box(0.1, 0.08, 0.26, shoe, -0.05, -0.06, -0.06); an.add(sho);
  }
  const phone = new THREE.Group(); const pb = box(0.075, 0.15, 0.01, OUT(mat(0x111111)), -0.0375, -0.075, -0.005); phone.add(pb);
  const scrM = new THREE.MeshBasicMaterial({ map: phoneTex('feed') }); noOutline(scrM); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.138), scrM); scr.position.z = 0.0055; phone.add(scr);
  const glowL = new THREE.PointLight(0x9fc0ff, 0.0, 1.4, 2); glowL.position.set(0, 0, 0.15); phone.add(glowL);
  J.wrR.add(phone); phone.position.set(0.0, -0.1, 0.05); phone.visible = false;
  const torch = new THREE.SpotLight(0xe6eeff, 0, 9, 0.5, 0.6, 1.4); torch.castShadow = true; torch.shadow.mapSize.set(1024, 1024); torch.shadow.bias = -0.0008; const torchT = new THREE.Object3D(); torchT.position.set(0, -0.4, -3); phone.add(torch, torchT); torch.target = torchT; torch.position.set(0, 0.05, -0.01);
  const H = { root, J, face, faceM, phone, scrM, glowL, torch, torchT, expr: 'normal' };
  H.setExpr = e => { if (H.expr !== e) { H.expr = e; faceM.map = faceTex(e); faceM.needsUpdate = true; } };
  H.setPhone = mode => { if (!mode) { phone.visible = false; glowL.intensity = 0; torch.intensity = 0; return; } phone.visible = true; scrM.map = phoneTex(mode); glowL.intensity = mode === 'light' ? 0 : 0.9; torch.intensity = mode === 'light' ? 14 : 0; };
  // pose: angles in degrees. legs: hip [forward, side], knee bend. arms: shoulder [forward, side, twist], elbow bend. spine/neck/head [pitch(forward+), yaw, roll]
  H.pose = p => {
    const r = v => (v || 0) * Math.PI / 180;
    J.spine.rotation.set(r(p.spine?.[0]), r(p.spine?.[1]), r(p.spine?.[2])); J.chest.rotation.set(r(p.chest?.[0]), r(p.chest?.[1]), 0);
    J.neck.rotation.set(r(p.neck?.[0]), r(p.neck?.[1]), r(p.neck?.[2])); J.head.rotation.set(r(p.head?.[0]), r(p.head?.[1]), r(p.head?.[2]));
    for (const n of ['L', 'R']) { const s = n === 'L' ? -1 : 1, a = p['arm' + n] || [0, 8, 0, 10], l = p['leg' + n] || [0, 0, 0];
      J['sh' + n].rotation.set(-r(a[0]), r(a[2]) * s, s * r(a[1]), 'XZY'); J['el' + n].rotation.set(-r(a[3]), 0, 0); J['wr' + n].rotation.set(r(a[4] || 0), 0, 0);
      J['hip' + n].rotation.set(-r(l[0]), 0, s * r(l[1])); J['kn' + n].rotation.set(r(l[2]), 0, 0); J['an' + n].rotation.set(-r(l[3] || 0), 0, 0); }
  };
  return H;
}

// =================== THE THING ON THE CEILING ===================
// long pale emaciated body crawling upside down; head twisted round; big black glossy eyes; a grin of too many teeth.
function creatureFaceTex() { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  // grin: very wide, thin lips, rows of small teeth, dark gums
  g.fillStyle = '#1a0606'; g.beginPath(); g.moveTo(70, 330); g.quadraticCurveTo(256, 450, 442, 330); g.quadraticCurveTo(256, 400, 70, 330); g.fill();
  g.fillStyle = '#e8dfc4'; for (let i = 0; i < 26; i++) { const k = i / 25, x = 85 + k * 342, y = 330 + Math.sin(k * Math.PI) * 62; g.beginPath(); g.moveTo(x - 6, y - 14 + Math.sin(k * Math.PI) * 4); g.lineTo(x + 6, y - 14 + Math.sin(k * Math.PI) * 4); g.lineTo(x, y + 4); g.fill(); }
  g.strokeStyle = '#3a1414'; g.lineWidth = 6; g.beginPath(); g.moveTo(70, 330); g.quadraticCurveTo(256, 450, 442, 330); g.stroke();
  // veins and blotches
  g.strokeStyle = 'rgba(70,60,90,0.5)'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { let x = 256 + (Math.random() - 0.5) * 380, y = 80 + Math.random() * 200; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 40; y += Math.random() * 30; g.lineTo(x, y); } g.stroke(); }
  // sunken nose slits
  g.fillStyle = '#2a1e1e'; g.beginPath(); g.ellipse(240, 270, 7, 16, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(272, 270, 7, 16, -0.3, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function makeCrawler() {
  const skinC = 0x8e8c80, skin = OUT(mat(skinC)), skinD = OUT(mat(0x66645a)), ink = OUT(mat(0x0a0808));
  const G = new THREE.Group();
  const torso = sph(0.2, skin, 0.75, 1.0, 2.6); G.add(torso);
  const ribs = []; for (let i = 0; i < 6; i++) { const rb = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 6, 20, Math.PI), skinD); ribs.push(rb); G.add(rb); }
  const spineK = []; for (let i = 0; i < 9; i++) { const k = sph(0.035, skinD); spineK.push(k); G.add(k); }
  const neck = cyl(1, 1, 1, skin, 12); G.add(neck);
  const head = new THREE.Group(); G.add(head);
  const skull = sph(0.17, skin, 0.74, 1.45, 0.9); head.add(skull);
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.08, metalness: 0.2 }); OUT(eyeM);
  const eyes = []; for (const s of [-1, 1]) { const sock = sph(0.07, OUT(mat(0x120e0c)), 1.15, 0.95, 0.55); sock.position.set(s * 0.066, 0.05, 0.11); head.add(sock); const e = new THREE.Mesh(new THREE.SphereGeometry(0.046, 24, 16), eyeM); e.scale.set(1.05, 0.8, 0.6); e.position.set(s * 0.066, 0.045, 0.125); head.add(e); eyes.push(e);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); noOutline(hl.material); hl.position.set(s * 0.066 + 0.014, 0.062, 0.152); head.add(hl); }
  const faceM = new THREE.MeshBasicMaterial({ map: creatureFaceTex(), transparent: true, depthWrite: false }); noOutline(faceM);
  const fp = new THREE.Mesh(new THREE.SphereGeometry(0.172, 32, 24, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.2, Math.PI * 0.62), faceM); fp.scale.set(0.75, 1.46, 0.91); head.add(fp);
  const hair = []; const hairM = new THREE.LineBasicMaterial({ color: 0x0a0806 }); for (let i = 0; i < 14; i++) { const geo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 8 }, () => new THREE.Vector3())); const l = new THREE.Line(geo, hairM); hair.push({ l, x: (i / 13 - 0.5) * 0.24, len: 0.3 + (i % 4) * 0.1 }); head.add(l); }
  // limbs: arms (front), legs (back); each 2 segments + long hands/feet with fingers
  const mk = () => ({ up: cyl(1, 1, 1, skin, 10), lo: cyl(1, 1, 1, skin, 10), j1: sph(0.045, skinD), j2: sph(0.04, skinD), f: Array.from({ length: 5 }, () => [cyl(1, 1, 1, skin, 6), cyl(1, 1, 1, skin, 6), sph(0.012, ink)]) });
  const limbs = [mk(), mk(), mk(), mk()];
  for (const L of limbs) { G.add(L.up, L.lo, L.j1, L.j2); for (const f of L.f) G.add(...f); }
  const C = { G, torso, head, eyes, limbs, neck, ribs, spineK, hair };
  // state: body pos (world), heading (rad, direction it crawls), anchors [4] (world points on the ceiling), headPos override, headLook (world point), twitch t
  C.update = st => {
    const P = st.pos, hdg = st.heading, fwd = new THREE.Vector3(Math.sin(hdg), 0, Math.cos(hdg)), side = new THREE.Vector3(Math.cos(hdg), 0, -Math.sin(hdg)), down = new THREE.Vector3(0, -1, 0);
    torso.position.copy(P); torso.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, down.clone().negate(), fwd));
    ribs.forEach((rb, i) => { rb.position.copy(P).addScaledVector(fwd, 0.28 - i * 0.07).addScaledVector(down, 0.06); rb.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, fwd.clone().negate(), down.clone().negate())); rb.rotateZ(Math.PI); rb.scale.setScalar(1 - Math.abs(i - 2) * 0.06); });
    spineK.forEach((k, i) => { k.position.copy(P).addScaledVector(fwd, 0.5 - i * 0.12).addScaledVector(down, -0.17 + Math.abs(i - 4) * 0.004); });
    const shoulder = P.clone().addScaledVector(fwd, 0.4), hip = P.clone().addScaledVector(fwd, -0.42);
    const roots = [shoulder.clone().addScaledVector(side, -0.17), shoulder.clone().addScaledVector(side, 0.17), hip.clone().addScaledVector(side, -0.14), hip.clone().addScaledVector(side, 0.14)];
    const lens = [[0.75, 0.75], [0.75, 0.75], [0.7, 0.75], [0.7, 0.75]];
    limbs.forEach((L, i) => {
      const a = roots[i], tgt = st.anchors[i], A = lens[i][0], B = lens[i][1]; const d = tgt.clone().sub(a); let dist = Math.min(d.length(), A + B - 0.01); d.normalize();
      // the joints bend DOWN (away from the ceiling) and outward: spider-like
      const pole = down.clone().multiplyScalar(1).addScaledVector(side, i % 2 ? 0.6 : -0.6).normalize();
      const x = (A * A - B * B + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, A * A - x * x));
      const pd = pole.clone().addScaledVector(d, -pole.dot(d)).normalize(); const knee = a.clone().addScaledVector(d, x).addScaledVector(pd, h); const end = a.clone().addScaledVector(d, dist);
      seg(L.up, a, knee, 0.042); seg(L.lo, knee, end, 0.034); L.j1.position.copy(knee); L.j2.position.copy(end);
      // fingers / toes spread flat on the ceiling, tips curling
      const out = end.clone().sub(knee).setY(0).normalize(); if (out.lengthSq() < 0.01) out.copy(fwd);
      L.f.forEach((f, k) => { const ang = (k - 2) * 0.32 + (st.curl ? Math.sin(st.t * 6 + k + i) * 0.05 : 0); const dir = out.clone().applyAxisAngle(_up, ang); const fl = (i < 2 ? 0.26 : 0.2) * (k === 0 || k === 4 ? 0.7 : 1);
        const m1 = end.clone().addScaledVector(dir, fl * 0.55).add(new THREE.Vector3(0, -0.02, 0)), tip = end.clone().addScaledVector(dir, fl);
        seg(f[0], end, m1, 0.011); seg(f[1], m1, tip, 0.009); f[2].position.copy(tip); });
    });
    // neck + head: twisted around, face turned to the viewer; can be pushed out (peek)
    const nb = shoulder.clone().addScaledVector(fwd, 0.08).addScaledVector(down, 0.05);
    const hp = st.headPos || nb.clone().addScaledVector(fwd, 0.35).addScaledVector(down, 0.2);
    seg(neck, nb, hp, 0.04);
    head.position.copy(hp); head.lookAt(st.headLook); head.rotateZ(Math.PI + (st.tilt || 0)); // upside down face
    const sc = st.scale || 1; head.scale.setScalar(sc);
    hair.forEach(h => { const p = h.l.geometry.attributes.position; for (let k = 0; k < 8; k++) { const kk = k / 7; const w = new THREE.Vector3(h.x, 0.16 - 0.02, -0.03).applyQuaternion(head.quaternion).multiplyScalar(1).add(head.position); p.setXYZ(k, w.x + Math.sin(st.t * 1.3 + h.x * 30) * 0.02 * kk, w.y - kk * h.len, w.z); }
      p.needsUpdate = true; h.l.position.set(0, 0, 0); });
  };
  // hair lines are in world space: detach them from the head
  for (const h of hair) { head.remove(h.l); G.add(h.l); }
  return C;
}

// ---------- sets for "The Last Photo": the hallway with the family photos, the living room, the street outside ----------
import * as THREE from 'three';
import { mat, OUT, noOutline, box, cyl, sph, wall, frameAround, clothes, skyTex } from './models.js';
import { T2 } from './tex2.js';

// HALL: x 0..1.5, z 0..8, height 2.5. Photos on the left wall (x = 0), bathroom door on the right wall, front door at the end (z = 8).
export const HALL = { W: 1.5, L: 8, H: 2.5, photoY: 1.55, photoW: 0.52, photoH: 0.39, photos: [2.2, 3.15, 4.1, 5.05], bath: [4.75, 5.6], front: [0.35, 1.15], kitchen: [6.35, 7.15] };
export function buildHall() {
  const S = new THREE.Group(), { W, L, H } = HALL;
  const wp = OUT(mat(0xffffff, { map: T2.wall })), trim = OUT(mat(0xb4b2a8)), wood = OUT(mat(0x5a3d26)), woodD = OUT(mat(0x3a2718)), doorM = OUT(mat(0x6b4a30)), doorP = OUT(mat(0x5a3d26));
  T2.wall.repeat.set(1, 1); T2.floor.repeat.set(1.5, 1.5);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, L + 0.2), mat(0xffffff, { map: T2.floor })); fl.rotation.x = -Math.PI / 2; fl.position.set(W / 2, 0, L / 2); fl.receiveShadow = true; S.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, L + 0.2), mat(0xffffff, { map: T2.ceiling })); ce.rotation.x = Math.PI / 2; ce.position.set(W / 2, H, L / 2); ce.receiveShadow = true; noOutline(ce.material); S.add(ce);
  // left wall with the kitchen doorway, right wall with the bathroom door, end wall with the front door
  const K = { x0: HALL.kitchen[0], x1: HALL.kitchen[1], y0: 0, y1: 2.08 };
  const lw = wall(L, H, 0.12, [K], wp); lw.rotation.y = -Math.PI / 2; lw.position.set(0, 0, 0); S.add(lw);
  const kf = frameAround(K, 0.18, trim); kf.rotation.y = -Math.PI / 2; kf.position.set(0.02, 0, 0); S.add(kf);
  const B = { x0: HALL.bath[0], x1: HALL.bath[1], y0: 0, y1: 2.05 };
  const rw = wall(L, H, 0.12, [B], wp); rw.rotation.y = -Math.PI / 2; rw.position.set(W + 0.12, 0, 0); S.add(rw);
  const bf = frameAround(B, 0.18, trim); bf.rotation.y = -Math.PI / 2; bf.position.set(W + 0.16, 0, 0); S.add(bf);
  const F = { x0: HALL.front[0], x1: HALL.front[1], y0: 0, y1: 2.1 };
  const ew = wall(W, H, 0.12, [F], wp); ew.position.set(0, 0, L); S.add(ew); const ef = frameAround(F, 0.18, trim); ef.position.set(0, 0, L - 0.04); S.add(ef);
  // skirting boards + a picture rail
  S.add(box(0.025, 0.11, L, trim, 0, 0, 0)); S.add(box(0.025, 0.11, L, trim, W - 0.025, 0, 0));
  S.add(box(0.02, 0.03, L, trim, 0, 2.15, 0)); S.add(box(0.02, 0.03, L, trim, W - 0.02, 2.15, 0));
  // bathroom door (closed) with a thin light gap underneath (light off for now) and a light switch next to it
  const bd = new THREE.Group(); bd.position.set(W - 0.035, 0, B.x0 + 0.02); bd.add(box(0.045, 2.02, B.x1 - B.x0 - 0.04, doorM, -0.02, 0, 0));
  for (const [y, h] of [[0.15, 0.8], [1.08, 0.82]]) bd.add(box(0.012, h, 0.55, doorP, -0.035, y, 0.13));
  const bk = sph(0.032, OUT(mat(0xb8b090))); bk.position.set(-0.06, 1.0, 0.7); bd.add(bk); S.add(bd);
  const sw = box(0.02, 0.12, 0.08, OUT(mat(0xe0dccc)), W - 0.02, 1.2, B.x1 + 0.12); S.add(sw);
  const gapM = new THREE.MeshBasicMaterial({ color: 0xfff1d0, transparent: true, opacity: 0 }); noOutline(gapM);
  const gap = new THREE.Mesh(new THREE.PlaneGeometry(B.x1 - B.x0 - 0.06, 0.015), gapM); gap.rotation.y = -Math.PI / 2; gap.position.set(W - 0.06, 0.008, (B.x0 + B.x1) / 2); S.add(gap);
  const bathL = new THREE.PointLight(0xffe2b0, 0, 1.8, 2); bathL.position.set(W - 0.12, 0.05, (B.x0 + B.x1) / 2); S.add(bathL);
  // front door with a frosted window (an opening, so the streetlight shines through it)
  const fd = new THREE.Group(); fd.position.set(F.x0 + 0.02, 0, L - 0.03); const dw = F.x1 - F.x0 - 0.04, WIN = { x0: 0.18, x1: dw - 0.18, y0: 1.35, y1: 1.85 };
  fd.add(box(dw, WIN.y0, 0.05, doorM, 0, 0, 0)); fd.add(box(dw, 2.06 - WIN.y1, 0.05, doorM, 0, WIN.y1, 0)); fd.add(box(WIN.x0, WIN.y1 - WIN.y0, 0.05, doorM, 0, WIN.y0, 0)); fd.add(box(dw - WIN.x1, WIN.y1 - WIN.y0, 0.05, doorM, WIN.x1, WIN.y0, 0));
  fd.add(box(dw - 0.2, 0.9, 0.012, doorP, 0.1, 0.22, -0.01));
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.MeshBasicMaterial({ map: T2.frosted, transparent: true, opacity: 0.9 })); noOutline(fg.material); fg.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, 0.025); fg.castShadow = false; fd.add(fg);
  const fk = sph(0.035, OUT(mat(0xb8b090))); fk.position.set(dw - 0.08, 1.0, -0.03); fd.add(fk); const lockB = box(0.05, 0.1, 0.03, OUT(mat(0x8a8470)), dw - 0.105, 1.12, -0.04); fd.add(lockB); S.add(fd);
  const mail = box(0.3, 0.05, 0.02, OUT(mat(0x8a8470)), F.x0 + 0.27, 0.95, L - 0.06); S.add(mail);
  // streetlight beyond the door: shines through the little window → a pale beam across the floor (+ a fake volumetric shaft)
  const street = new THREE.SpotLight(0xb8c8ff, 30, 16, 0.32, 0.5, 1.2); street.position.set(0.85, 2.7, 10.5); street.target.position.set(0.7, 0, 5.2); street.castShadow = true; street.shadow.mapSize.set(1024, 1024); street.shadow.bias = -0.0006; S.add(street, street.target);
  const shaftM = new THREE.MeshBasicMaterial({ color: 0xaab8e8, transparent: true, opacity: 0.03, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }); noOutline(shaftM);
  const shaft = new THREE.Mesh(new THREE.ConeGeometry(0.75, 3.6, 24, 1, true), shaftM); shaft.position.set(0.72, 1.0, 6.3); shaft.rotation.x = -Math.PI / 2 + 0.6; S.add(shaft);
  // the four photos on the left wall (frames with glass + glare)
  const photos = [];
  [T2.beach, T2.xmas, T2.bday, T2.night].forEach((tex, i) => {
    const g = new THREE.Group(), w = HALL.photoW, h = HALL.photoH, z = HALL.photos[i];
    g.add(box(0.03, h + 0.07, w + 0.07, OUT(mat(0x2e2016)), 0, -0.035, -0.035)); g.add(box(0.034, h + 0.005, w + 0.005, OUT(mat(0x1a120c)), 0, -0.0025, -0.0025));
    const pm = mat(0xffffff, { map: tex }); noOutline(pm); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), pm); p.rotation.y = Math.PI / 2; p.position.set(0.036, h / 2, w / 2); g.add(p);
    const glM = new THREE.MeshBasicMaterial({ map: T2.glare, transparent: true, opacity: 0.7, depthWrite: false }); noOutline(glM); const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glM); gl.rotation.y = Math.PI / 2; gl.position.set(0.04, h / 2, w / 2); g.add(gl);
    const reflM = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }); noOutline(reflM); const refl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), reflM); refl.rotation.y = Math.PI / 2; refl.position.set(0.041, h / 2, w / 2); g.add(refl);
    g.position.set(0, HALL.photoY - h / 2, z - w / 2); g.rotation.z = [0.012, -0.01, 0.006, 0][i]; S.add(g);
    photos.push({ g, p, pm, gl, refl, reflM, tex, center: new THREE.Vector3(0.036, HALL.photoY, z) });
  });
  // a narrow console table under the first photo: bowl with keys, a small plant, a stack of mail
  const ct = new THREE.Group(); ct.position.set(0.02, 0, 1.35); ct.add(box(0.3, 0.03, 0.9, wood, 0, 0.8, 0)); for (const z of [0.03, 0.84]) { ct.add(box(0.03, 0.8, 0.03, woodD, 0.24, 0, z)); ct.add(box(0.03, 0.8, 0.03, woodD, 0.02, 0, z)); }
  ct.add(box(0.26, 0.03, 0.86, woodD, 0.02, 0.2, 0.02));
  const bowl = sph(0.09, OUT(mat(0x8a5a3a)), 1, 0.4, 1); bowl.position.set(0.15, 0.85, 0.25); ct.add(bowl); const keys = box(0.06, 0.012, 0.03, OUT(mat(0xb0a070)), 0.12, 0.875, 0.22); keys.rotation.y = 0.5; ct.add(keys);
  const pot = cyl(0.05, 0.04, 0.1, OUT(mat(0x9a4a30))); pot.position.set(0.14, 0.88, 0.7); ct.add(pot); for (let i = 0; i < 6; i++) { const lf = sph(0.04, OUT(mat(0x2f5a3a)), 0.5, 1.6, 0.25); lf.position.set(0.14 + Math.sin(i * 1.1) * 0.04, 0.99, 0.7 + Math.cos(i * 1.1) * 0.04); lf.rotation.set(Math.sin(i) * 0.5, i, Math.cos(i) * 0.5); ct.add(lf); }
  for (let i = 0; i < 3; i++) { const m = box(0.16, 0.006, 0.22, OUT(mat([0xe8e2d2, 0xd8d0c0, 0xc8d0e0][i])), 0.05, 0.815 + i * 0.006, 0.45 + i * 0.02); m.rotation.y = i * 0.2; ct.add(m); }
  S.add(ct);
  // right wall: a radiator, an old wall clock (pendulum), coats on hooks near the door, shoes, an umbrella stand
  const rad = new THREE.Group(); rad.position.set(W - 0.12, 0.15, 2.4); for (let i = 0; i < 9; i++) rad.add(box(0.07, 0.6, 0.05, OUT(mat(0xb8b8b0)), 0, 0, i * 0.08)); rad.add(cyl(0.012, 0.012, 0.15, OUT(mat(0x888880))).translateY(-0.07).translateX(0.035)); S.add(rad);
  const clock = new THREE.Group(); clock.position.set(W - 0.03, 1.85, 1.5); clock.rotation.y = -Math.PI / 2;
  clock.add(box(0.26, 0.6, 0.08, OUT(mat(0x4a3020)), -0.13, -0.45, -0.04)); const cf = cyl(0.1, 0.1, 0.02, OUT(mat(0xe8e0c8)), 24); cf.rotation.x = Math.PI / 2; cf.position.set(0, 0.0, 0.05); clock.add(cf);
  const hand1 = box(0.006, 0.07, 0.005, OUT(mat(0x111111)), -0.003, 0, 0.065), hand2 = box(0.005, 0.09, 0.005, OUT(mat(0x111111)), -0.0025, 0, 0.066); hand1.rotation.z = -0.4; hand2.rotation.z = 2.0; clock.add(hand1, hand2);
  const pend = new THREE.Group(); pend.position.set(0, -0.12, 0.03); const rod = box(0.008, 0.26, 0.006, OUT(mat(0xb0a060)), -0.004, -0.26, 0); const bob = cyl(0.035, 0.035, 0.01, OUT(mat(0xc8b060)), 18); bob.rotation.x = Math.PI / 2; bob.position.set(0, -0.28, 0); pend.add(rod, bob); clock.add(pend); S.add(clock);
  for (let i = 0; i < 3; i++) { const hk = cyl(0.008, 0.008, 0.06, OUT(mat(0x333333))); hk.rotation.z = Math.PI / 2; hk.position.set(W - 0.04, 1.75, 6.7 + i * 0.35); S.add(hk); const c = clothes([0x2a3448, 0x5a4a32, 0x3a2a2a][i], 0.55); c.rotation.z = Math.PI / 2; c.scale.set(1, 1.5, 1); c.position.set(W - 0.12, 1.42, 6.7 + i * 0.35); S.add(c); }
  for (const [x, z, r] of [[1.1, 7.45, 0.2], [1.25, 7.5, -0.3], [0.35, 7.55, 1.4], [0.5, 7.45, 1.7]]) { const s = box(0.1, 0.09, 0.27, OUT(mat(0x232323)), x, 0, z); s.rotation.y = r; S.add(s); }
  const us = cyl(0.08, 0.07, 0.5, OUT(mat(0x3a3a40))); us.position.set(W - 0.14, 0.25, 7.65); S.add(us); const umb = cyl(0.015, 0.015, 0.8, OUT(mat(0x1a1a1a))); umb.position.set(W - 0.16, 0.6, 7.63); umb.rotation.z = 0.1; S.add(umb);
  // runner rug, ceiling lamps (off), a smoke detector
  const run = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 7.0), mat(0xffffff, { map: T2.runner })); run.rotation.x = -Math.PI / 2; run.position.set(0.75, 0.004, 4.0); run.receiveShadow = true; S.add(run);
  for (const z of [2.6, 7.2]) { const lb = cyl(0.03, 0.03, 0.03, OUT(mat(0xd8d4c8))); lb.position.set(W / 2, H - 0.015, z); S.add(lb); const dome = sph(0.17, OUT(mat(0xcfc8b8)), 1, 0.45, 1); dome.position.set(W / 2, H - 0.06, z); S.add(dome); }
  const sd = cyl(0.06, 0.06, 0.03, OUT(mat(0xe0e0d8))); sd.position.set(0.75, H - 0.015, 3.4); S.add(sd);
  // the dark kitchen beyond the doorway: a fridge's faint standby light, a counter edge
  const kit = new THREE.Group(); kit.add(box(0.6, 1.8, 0.65, OUT(mat(0xd8d8d0)), -1.4, 0, 6.4)); kit.add(box(0.9, 0.9, 0.6, OUT(mat(0x4a4a50)), -1.2, 0, 7.15)); S.add(kit);
  const kfl = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.4), mat(0x3a3530)); kfl.rotation.x = -Math.PI / 2; kfl.position.set(-1.0, 0.002, 6.75); S.add(kfl);
  const kL = new THREE.PointLight(0x6a8aff, 0.6, 2.2, 2); kL.position.set(-0.6, 1.0, 6.75); S.add(kL);
  // cold ambient + a dim moon fill
  S.add(new THREE.HemisphereLight(0x5a6890, 0x1a1612, 0.75));
  return { S, photos, pend, bd, gap, gapM, bathL, street, shaft, fd };
}

// LIVING ROOM (behind the hall start): x -1.5..3.5, z -4.6..0; window in the back wall (z = -4.6), the street outside
export function buildLiving() {
  const S = new THREE.Group(), H = 2.5;
  const wp = OUT(mat(0xffffff, { map: T2.wallL })), trim = OUT(mat(0xb4b2a8)), wood = OUT(mat(0x5a3d26)), woodD = OUT(mat(0x3a2718));
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.8), mat(0xffffff, { map: T2.floor })); fl.rotation.x = -Math.PI / 2; fl.position.set(1.0, 0, -2.3); fl.receiveShadow = true; S.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.8), mat(0xffffff, { map: T2.ceiling })); ce.rotation.x = Math.PI / 2; ce.position.set(1.0, H, -2.3); noOutline(ce.material); S.add(ce);
  const WIN = { x0: 0.9, x1: 2.5, y0: 0.85, y1: 2.15 };
  const bw = wall(5.0, H, 0.12, [{ x0: WIN.x0 + 1.5, x1: WIN.x1 + 1.5, y0: WIN.y0, y1: WIN.y1 }], wp); bw.position.set(-1.5, 0, -4.72); S.add(bw);
  const wf = frameAround({ x0: WIN.x0 + 1.5, x1: WIN.x1 + 1.5, y0: WIN.y0, y1: WIN.y1 }, 0.2, trim); wf.position.set(-1.5, 0, -4.66); S.add(wf);
  const wfr = OUT(mat(0xd8d2c0)); S.add(box(0.05, WIN.y1 - WIN.y0, 0.05, wfr, (WIN.x0 + WIN.x1) / 2 - 0.025, WIN.y0, -4.68)); S.add(box(WIN.x1 - WIN.x0, 0.05, 0.05, wfr, WIN.x0, (WIN.y0 + WIN.y1) / 2 + 0.15, -4.68));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.MeshBasicMaterial({ color: 0x9fb4d8, transparent: true, opacity: 0.06 })); noOutline(glass.material); glass.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -4.66); S.add(glass);
  const lwl = wall(4.6, H, 0.12, [], wp); lwl.rotation.y = -Math.PI / 2; lwl.position.set(-1.62, 0, -4.6); S.add(lwl);
  const rwl = wall(4.6, H, 0.12, [], wp); rwl.rotation.y = -Math.PI / 2; rwl.position.set(3.5, 0, -4.6); S.add(rwl);
  // curtains (they breathe a little)
  const curtM = OUT(mat(0x3a4560, { side: THREE.DoubleSide })), curtains = [];
  for (const [cx, w] of [[WIN.x0 - 0.35, 0.45], [WIN.x1 - 0.1, 0.45]]) { const geo = new THREE.PlaneGeometry(w, 2.2, 12, 20); const c = new THREE.Mesh(geo, curtM); c.position.set(cx + w / 2, 1.2, -4.5); c.castShadow = true; c.userData.base = geo.attributes.position.array.slice(); S.add(c); curtains.push(c); }
  // sofa, standing lamp (warm, on), coffee table, TV, a plant, a rug, family photos on a shelf
  const sofa = new THREE.Group(); sofa.position.set(-1.0, 0, -2.6); sofa.rotation.y = Math.PI / 2; const sM = OUT(mat(0x4a4e60)), sD = OUT(mat(0x3a3e4e));
  sofa.add(box(2.0, 0.42, 0.85, sD)); sofa.add(box(2.0, 0.85, 0.25, sM)); sofa.add(box(0.2, 0.62, 0.85, sM, -0.08)); sofa.add(box(0.2, 0.62, 0.85, sM, 1.88)); for (let i = 0; i < 2; i++) sofa.add(box(0.92, 0.14, 0.6, OUT(mat(0x555a6e)), 0.08 + i * 0.94, 0.42, 0.22)); S.add(sofa);
  const lamp = new THREE.Group(); lamp.position.set(-1.25, 0, -4.2); lamp.add(cyl(0.15, 0.15, 0.03, OUT(mat(0x222222)))); const pole = cyl(0.015, 0.015, 1.55, OUT(mat(0x222222))); pole.position.y = 0.78; lamp.add(pole);
  const shade = cyl(0.13, 0.22, 0.3, new THREE.MeshToonMaterial({ color: 0xe8c890, emissive: 0x7a5a28, gradientMap: mat(0).gradientMap, side: THREE.DoubleSide })); OUT(shade.material); shade.position.y = 1.62; lamp.add(shade);
  const lampL = new THREE.PointLight(0xffb066, 7.0, 8, 1.3); lampL.position.y = 1.55; lampL.castShadow = true; lampL.shadow.mapSize.set(512, 512); lamp.add(lampL); S.add(lamp);
  const ct = new THREE.Group(); ct.position.set(0.0, 0, -2.9); ct.add(box(0.6, 0.04, 1.1, wood, 0, 0.42, 0)); for (const [x, z] of [[0.03, 0.03], [0.52, 0.03], [0.03, 1.02], [0.52, 1.02]]) ct.add(box(0.05, 0.42, 0.05, woodD, x, 0, z));
  for (let i = 0; i < 2; i++) { const c = cyl(0.04, 0.035, 0.1, OUT(mat([0xd8d0c0, 0x3a6a8a][i]))); c.position.set(0.2 + i * 0.2, 0.51, 0.3 + i * 0.4); ct.add(c); } S.add(ct);
  const tv = new THREE.Group(); tv.position.set(3.38, 0, -3.3); tv.rotation.y = -Math.PI / 2; tv.add(box(1.4, 0.45, 0.4, woodD)); tv.add(box(1.1, 0.65, 0.05, OUT(mat(0x111114)), 0.15, 0.6, 0.15)); S.add(tv);
  const plant = new THREE.Group(); plant.position.set(3.0, 0, -4.3); plant.add(cyl(0.16, 0.12, 0.35, OUT(mat(0x9a4a30)))); plant.children[0].position.y = 0.17; for (let i = 0; i < 10; i++) { const lf = sph(0.12, OUT(mat(0x2f5a3a)), 0.35, 1.4, 0.2); lf.position.set(Math.sin(i * 0.7) * 0.12, 0.6 + (i % 3) * 0.12, Math.cos(i * 0.7) * 0.12); lf.rotation.set(Math.sin(i) * 0.6, i * 0.7, Math.cos(i * 1.3) * 0.6); plant.add(lf); } S.add(plant);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), mat(0x5a3a40)); rug.rotation.x = -Math.PI / 2; rug.position.set(0.4, 0.004, -2.4); rug.receiveShadow = true; S.add(rug);
  // outside: the street, a streetlight, houses, trees; the car with your parents (taillights) drives away
  const out = new THREE.Group(); S.add(out);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 7), mat(0x1c1d22)); road.rotation.x = -Math.PI / 2; road.position.set(1, -0.25, -12); out.add(road);
  const walkM = mat(0x2c2d33); const walk = new THREE.Mesh(new THREE.PlaneGeometry(60, 2), walkM); walk.rotation.x = -Math.PI / 2; walk.position.set(1, -0.2, -7.6); out.add(walk);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 3), mat(0x16201a)); lawn.rotation.x = -Math.PI / 2; lawn.position.set(1, -0.22, -5.8); out.add(lawn);
  for (let i = -6; i < 8; i++) { const d = box(1.2, 0.01, 0.12, mat(0x8a8060), i * 3, -0.24, -12.05); out.add(d); }
  const sl = new THREE.Group(); sl.position.set(4.2, -0.2, -8.4); const sp = cyl(0.05, 0.06, 4.2, OUT(mat(0x2a2a2e))); sp.position.y = 2.1; sl.add(sp); const arm = box(0.9, 0.05, 0.05, OUT(mat(0x2a2a2e)), -0.9, 4.1, -0.02); sl.add(arm);
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xdfe6ff }); noOutline(bulbM); const bulb = sph(0.12, bulbM, 1.5, 0.5, 1); bulb.position.set(-0.85, 4.02, 0); sl.add(bulb); out.add(sl);
  const slL = new THREE.SpotLight(0xb8c8ff, 90, 14, 0.8, 0.6, 1.0); slL.position.set(3.35, 3.8, -8.4); slL.target.position.set(3.2, -0.2, -8.4); out.add(slL, slL.target);
  for (const [x, z, h, c] of [[-6, -18, 4.5, 0x2a2e3e], [1.5, -18.5, 5.2, 0x30283a], [8, -18, 4.2, 0x26303a]]) { const hs = box(5, h, 4, OUT(mat(c)), x - 2.5, -0.2, z - 2); out.add(hs); const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2, 4), OUT(mat(0x1a1c26))); roof.rotation.y = Math.PI / 4; roof.position.set(x, h + 0.8, z); out.add(roof);
    for (let k = 0; k < 2; k++) { const wm = new THREE.MeshBasicMaterial({ color: k ? 0x1a2030 : 0xffc870 }); noOutline(wm); const wi = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.9), wm); wi.position.set(x - 1.2 + k * 2.2, 1.6, z + 2.02); out.add(wi); } }
  const trees = []; for (const [x, z] of [[-3.5, -6.0], [6.0, -6.2], [-0.5, -16]]) { const tr = new THREE.Group(); tr.position.set(x, -0.2, z); const tk = cyl(0.12, 0.18, 2.2, OUT(mat(0x2a1e16))); tk.position.y = 1.1; tr.add(tk); for (let k = 0; k < 5; k++) { const cr = sph(0.9, OUT(mat(0x18241c)), 1, 0.8, 1); cr.position.set(Math.sin(k * 1.3) * 0.6, 2.6 + (k % 2) * 0.5, Math.cos(k * 1.3) * 0.5); tr.add(cr); } out.add(tr); trees.push(tr); }
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(70, 30), new THREE.MeshBasicMaterial({ map: skyTex() })); noOutline(sky.material); sky.position.set(1, 8, -24); out.add(sky);
  // the car
  const car = new THREE.Group(); const cb = OUT(mat(0x1a2238)); car.add(box(4.2, 0.65, 1.8, cb, -2.1, 0.28, -0.9)); car.add(box(2.3, 0.55, 1.6, OUT(mat(0x161c2e)), -1.2, 0.93, -0.8));
  const wM = new THREE.MeshBasicMaterial({ color: 0x0a0e18 }); noOutline(wM); car.add(box(2.1, 0.45, 1.62, wM, -1.1, 0.98, -0.81));
  for (const [x, z] of [[-1.4, -0.9], [1.3, -0.9], [-1.4, 0.75], [1.3, 0.75]]) { const wh = cyl(0.32, 0.32, 0.22, OUT(mat(0x0c0c0e)), 16); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.32, z + 0.07); car.add(wh); }
  const tlM = new THREE.MeshBasicMaterial({ color: 0xff2a20 }); noOutline(tlM); for (const z of [-0.7, 0.7]) { const tl = box(0.05, 0.14, 0.32, tlM, 2.08, 0.6, z - 0.16); car.add(tl); }
  const tailL = new THREE.PointLight(0xff3020, 2.5, 6, 2); tailL.position.set(2.4, 0.6, 0); car.add(tailL);
  const headL = new THREE.SpotLight(0xfff0d0, 25, 18, 0.45, 0.5, 1.2); headL.position.set(-2.2, 0.6, 0); headL.target.position.set(-12, 0, 0); car.add(headL, headL.target);
  car.position.set(1.0, -0.25, -11.0); out.add(car);
  S.add(new THREE.HemisphereLight(0x4a5880, 0x14100c, 0.9));
  return { S, curtains, car, trees, lampL, WIN };
}

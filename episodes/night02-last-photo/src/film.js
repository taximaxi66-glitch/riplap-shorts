// ---------- THE LAST PHOTO: home alone, the family photos change, it hangs from the ceiling right above you ----------
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { buildTextures } from './tex.js';
import { buildTextures2, T2, faceUp, batteryTex } from './tex2.js';
import { makeHuman, mat, noOutline, box, OUT } from './models.js';
import { buildHall, buildLiving, HALL } from './set.js';
import { drawBelow, drawSide } from './creature2d.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
let renderer, effect, scene, camera, HL, LV, you, sag, pov, flash, flashT, dust, dustBase, drip, splash, phoneBig, rt, rtCam, CUES = [];
const cue = (t, n, v = 1) => CUES.push({ t: +t.toFixed(3), n, v });
['photos', 'beach', 'standing', 'thin', 'knees', 'never', 'christmas', 'corner', 'closer', 'listening', 'birthday', 'chair', 'fingers', 'shoulder', 'last', 'tonight', 'behind', 'not', 'reflection', 'ceiling', 'above', 'up', 'upside', 'sheet', 'neck', 'jaw', 'drips', 'blink', 'twitch', 'joint', 'see', 'percent', 'options', 'door', 'underneath', 'bathroom', 'hours', 'comments', 'first', 'again', 'follow', 'photos', 'wrong', 'alone', 'midnight', 'snack', 'every'].forEach(k => KEY.add(k)); KEY.delete('a'); KEY.delete('you');

function setup() {
  buildTextures(); buildTextures2();
  const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
  renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.55; renderer.outputColorSpace = THREE.SRGBColorSpace;
  effect = new OutlineEffect(renderer, { defaultThickness: 0.0035, defaultColor: [0.03, 0.03, 0.05] });
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x020306); scene.fog = new THREE.FogExp2(0x0a0e18, 0.07);
  camera = new THREE.PerspectiveCamera(55, W / H, 0.02, 80); scene.add(camera);
  HL = buildHall(); LV = buildLiving(); scene.add(HL.S, LV.S);
  you = makeHuman(); scene.add(you.root);
  setupCreature();
  // POV: your hand holding the phone (flashlight on), attached to the camera
  pov = new THREE.Group(); camera.add(pov);
  const skin = OUT(mat(0xe2b590)), sleeve = OUT(mat(0x8e2b2b));
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.42, 12), sleeve); arm.rotation.x = Math.PI / 2 - 0.5; arm.position.set(0.05, -0.12, 0.13); pov.add(arm);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), skin); hand.scale.set(1, 0.8, 1.3); pov.add(hand);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.06, 8), skin); f.position.set(-0.03 + i * 0.019, 0.025, -0.035); f.rotation.x = -1.1; pov.add(f); }
  const ph = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.01), OUT(mat(0x111111))); ph.position.set(0, 0.04, -0.02); ph.rotation.x = -1.2; pov.add(ph);
    pov.position.set(0.17, -0.21, -0.38);
  flash = new THREE.SpotLight(0xe8eeff, 0, 14, 0.42, 0.6, 1.4); flash.castShadow = true; flash.shadow.mapSize.set(1024, 1024); flash.shadow.bias = -0.0008; flash.shadow.camera.near = 0.08;
  flashT = new THREE.Object3D(); camera.add(flash, flashT); flash.position.set(0.17, -0.12, -0.42); flashT.position.set(0.05, -0.2, -5); flash.angle = 0.42; flash.penumbra = 0.6; flash.castShadow = true; HL.photos.forEach(ph => ph.gl.material.opacity = 0.7); flash.target = flashT;
  // the phone held up close (battery screen)
  phoneBig = new THREE.Group(); const pb = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.158, 0.009), OUT(mat(0x101012))); phoneBig.add(pb);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.148), new THREE.MeshBasicMaterial({ map: batteryTex() })); noOutline(scr.material); scr.position.z = 0.0052; phoneBig.add(scr);
  const ph2 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), skin); ph2.scale.set(1.3, 0.9, 0.7); ph2.position.set(0.02, -0.07, -0.02); phoneBig.add(ph2);
  const sl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 12), sleeve); sl2.position.set(0.05, -0.2, -0.06); sl2.rotation.x = 0.4; phoneBig.add(sl2);
  phoneBig.position.set(0.0, -0.02, -0.26); phoneBig.rotation.x = 0.12; camera.add(phoneBig); phoneBig.visible = false;
  // floating dust in the air (lit by the phone and the streetlight)
  const n = 700, pos = new Float32Array(n * 3); dustBase = []; const r = rng(77);
  for (let i = 0; i < n; i++) { const p = [r() * HALL.W, 0.2 + r() * 2.2, -3 + r() * 11]; dustBase.push(p); pos.set(p, i * 3); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xc8d4f0, size: 0.008, transparent: true, opacity: 0.55, depthWrite: false })); noOutline(dust.material); scene.add(dust);
  // the drip and its splash
  drip = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.05, metalness: 0.1 })); drip.scale.set(1, 1.7, 1); OUT(drip.material); scene.add(drip);
  splash = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), new THREE.MeshStandardMaterial({ color: 0x15120f, roughness: 0.05, transparent: true, opacity: 0.9 })); splash.rotation.x = -Math.PI / 2; noOutline(splash.material); scene.add(splash);
  // render target: what the glass of the last photo reflects (the ceiling above you)
  rt = new THREE.WebGLRenderTarget(768, 576); rt.texture.colorSpace = THREE.SRGBColorSpace; rtCam = new THREE.PerspectiveCamera(60, 768 / 576, 0.05, 20);
  const refl = HL.photos[3]; refl.reflM.map = rt.texture; rt.texture.wrapS = THREE.RepeatWrapping; rt.texture.repeat.x = -1; rt.texture.offset.x = 1;
}

// ---------------- helpers ----------------
function keys(K, t) { if (t <= K[0].t) return { ...K[0] }; if (t >= K[K.length - 1].t) return { ...K[K.length - 1] };
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1].t) { const k = eio(inv(K[i].t, K[i + 1].t, t)), o = {}; for (const p in K[i]) o[p] = Array.isArray(K[i][p]) ? K[i][p].map((v, j) => lerp(v, K[i + 1][p][j], k)) : lerp(K[i][p], K[i + 1][p], k); return o; } }
function cam(pos, look, roll = 0, fov = 55) { camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); if (roll) camera.rotateZ(roll); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } }
const shake = (t, a, f = 1) => V(noise(t * 1.7 * f) * a, noise(t * 1.9 * f + 3) * a * 0.7, noise(t * 1.3 * f + 7) * a * 0.5);   // smooth handheld sway (never jittery)
function placeYou(x, y, z, yawDeg) { you.root.position.set(x, y, z); you.root.rotation.set(0, yawDeg * D2R, 0, 'YXZ'); }
// a point on a photo: u (0 left .. 1 right), v (0 top .. 1 bottom) → world position on the wall
function onPhoto(i, u, v) { const zc = HALL.photos[i], w = HALL.photoW, h = HALL.photoH; return V(0.037, HALL.photoY + h / 2 - v * h, zc + w / 2 - u * w); }
// standing pose with breathing; phone held up in the right hand (light on)
const stand = (t, o = {}) => ({ spine: [3 + Math.sin(t * 1.6) * 1.2, o.yaw ? o.yaw * 0.3 : 0, 0], neck: [o.neck ?? 4, o.yaw ? o.yaw * 0.3 : 0, 0], head: [o.head ?? noise(t * 0.7) * 3, o.yaw ? o.yaw * 0.4 : 0, 0],
  armR: o.phone === false ? [6, 10, 0, 18] : [62, 14, 0, 58, -10], armL: [6 + Math.sin(t * 1.6) * 1, 10, 0, 16], legL: [0, 2, 4], legR: [0, 3, 4] });
const walkP = (ph, t) => { const s = Math.sin(ph), c = Math.cos(ph); return { spine: [5, 0, -s * 2], neck: [2, 0, 0], head: [2, 0, s * 1.5], armR: [62, 14, 0, 58, -10], armL: [-s * 18, 10, 0, 22],
  legL: [s * 22, 2, 6 + 34 * Math.max(0, c) ** 1.3], legR: [-s * 22, 3, 6 + 34 * Math.max(0, -c) ** 1.3] }; };
function setDust(t, k = 1) { const p = dust.geometry.attributes.position; for (let i = 0; i < dustBase.length; i++) { const b = dustBase[i]; p.setXYZ(i, b[0] + Math.sin(t * 0.21 + i) * 0.08, b[1] + Math.sin(t * 0.17 + i * 1.3) * 0.06 - ((t * 0.012 + i * 0.37) % 0.3), b[2] + Math.cos(t * 0.19 + i * 0.7) * 0.08); } p.needsUpdate = true; dust.material.opacity = 0.55 * k; }

// ---------------- the creature: drawn art hung into the 3D hallway ----------------
// BELOW plane: flat under the ceiling, head toward -z (toward you). SIDE billboard: hanging, faces the camera (for views from down the hall)
const POS = { 1: V(0.78, 2.47, 5.55), 2: V(0.74, 2.47, 6.55) };
const YOU = V(0.62, 0, 5.05);   // where you stand at the last photo
let belowC, belowT, belowP, sideC, sideT, sideP;
function setupCreature() {
  belowC = document.createElement('canvas'); belowC.width = 2048; belowC.height = 2048; belowT = new THREE.CanvasTexture(belowC); belowT.colorSpace = THREE.SRGBColorSpace; belowT.anisotropy = 8;
  belowP = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: belowT, transparent: true, alphaTest: 0.03, toneMapped: false, side: THREE.DoubleSide })); noOutline(belowP.material);
  belowP.rotation.set(Math.PI / 2, 0, Math.PI); scene.add(belowP);
  sideC = document.createElement('canvas'); sideC.width = 2048; sideC.height = 1400; sideT = new THREE.CanvasTexture(sideC); sideT.colorSpace = THREE.SRGBColorSpace; sideT.anisotropy = 8;
  sideP = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.2), new THREE.MeshBasicMaterial({ map: sideT, transparent: true, alphaTest: 0.03, toneMapped: false, side: THREE.DoubleSide })); noOutline(sideP.material); scene.add(sideP);
}
// where a point of the BELOW drawing (u, v in 0..1) is in the world
function bw(u, v, which = 1) { belowP.position.copy(POS[which]); belowP.updateMatrixWorld(true); return belowP.localToWorld(V((u - 0.5) * 1.7, (0.5 - v) * 1.7, 0)); }
// show the creature. o: {jaw, tw(limb, finger, joint), light (0..1 brightness), side: true for the billboard}
function sagAt(t, which, o = {}) {
  const p = POS[which || 1], light = o.light ?? 0.75;
  if (o.side) { sideP.visible = true; drawSide(sideC.getContext('2d'), 2048, 1400, { t, jaw: o.jaw ?? 0.8 }); sideT.needsUpdate = true; sideP.position.set(p.x, 2.5 - 0.6, p.z);
    const c = camera.position; sideP.rotation.set(0, Math.atan2(c.x - p.x, c.z - p.z), 0); sideP.material.color.setScalar(light); return; }
  belowP.visible = true; belowP.position.copy(p); drawBelow(belowC.getContext('2d'), 2048, 2048, { t, jaw: o.jaw ?? 0.8, tw: o.tw }); belowT.needsUpdate = true; belowP.material.color.setScalar(light);
}
// ---------------- the timeline ----------------
let SHOTS = [];
function build() {
  CUES = []; const L = id => LN(id), ww = (id, word, n) => WDW(id, word, n); const S = [];
  const end = T.duration;
  // the opening frame (and the last frame: the video loops)
  const OPEN = { pos: V(1.12, 1.6, 1.25), look: onPhoto(0, 0.55, 0.52) };
  // ===== 1. silent opening: POV in the dark hallway, the phone light lands on the beach photo (it's already in it) =====
  const s1b = L('l1').start - 0.3;
  cue(0, 'room', 1); cue(0.05, 'clock', 0.9); cue(1.4, 'creak', 0.6); cue(s1b - 0.2, 'whoosh', 0.25);
  S.push({ a: 0, b: s1b, fade: 0, go: t => {
    const k = eio(inv(0, s1b, t));
    cam(OPEN.pos.clone().add(V(-0.1 * k, 0, 0.06 * k)).add(shake(t, 0.008)), OPEN.look.clone().lerp(onPhoto(0, 0.6, 0.5), k));
    flash.intensity = 18; pov.visible = true;
  }, ui: (g, t) => { timeTag(g, t, 0.2, s1b + 0.1, '11:47 PM'); } });
  // ===== 2. the living room: you at the window, your parents' car drives away =====
  const s2a = s1b, s2b = L('l2').start - 0.25, carGo = L('l1').start + 0.5;
  cue(s2a, 'room', 0.8); cue(carGo - 0.4, 'caraway', 0.9); cue(ww('l1', 'midnight.') + 0.3, 'clock', 0.5);
  S.push({ a: s2a, b: s2b, fade: 0.35, go: t => {
    const k = ss(carGo, s2b + 0.6, t);
    LV.car.position.set(lerp(3.2, -14, ein(k) * 0.6 + k * 0.4), -0.25, -11.0);
    placeYou(2.15, 0.94, -3.95, 180); const p = stand(t, { phone: false, yaw: lerp(-10, 30, k) }); you.pose(p); you.setExpr('normal'); you.setPhone(null);
    const cp = V(lerp(1.05, 1.2, inv(s2a, s2b, t)), 1.55, lerp(-1.35, -1.75, inv(s2a, s2b, t))).add(shake(t, 0.006));
    cam(cp, V(1.95, 1.3, -4.6));
  } });
  // ===== 3. over your shoulder: down the hallway, past the photos =====
  const s3a = s2b, s3b = L('l3').start - 0.2, walkEnd = L('l2b').end - 0.1;
  const zAt = t => lerp(0.15, 1.7, ss(s3a, walkEnd, t)), phAt = t => (zAt(t) - 0.15) / 0.7 * Math.PI * 2;
  { let last = null; for (let t = s3a; t < walkEnd; t += 1 / 120) { const n = Math.floor(phAt(t) / Math.PI + 0.5); if (last != null && n !== last) cue(t, n % 3 === 1 ? 'creak' : 'step', n % 3 === 1 ? 0.45 : 0.4); last = n; } }
  cue(s3a + 0.2, 'click', 0.7);
  S.push({ a: s3a, b: s3b, fade: 0.35, go: t => {
    const z = zAt(t), walking = t < walkEnd, look = ss(walkEnd - 0.6, s3b, t);
    placeYou(0.78, 0.94 + (walking ? Math.cos(phAt(t) * 2) * 0.012 : 0), z, lerp(0, -38, look));
    const p = walking ? walkP(phAt(t), t) : stand(t); p.head = [0, lerp(0, -40, look), 0]; you.pose(p); you.setExpr('normal'); you.setPhone('light'); you.torchT.position.set(-0.3, -0.25, -3);
    const cp = V(1.4, 2.02, z - 1.85).add(shake(t, 0.01)); cam(cp, V(0.55, 1.35, z + 2.6).lerp(onPhoto(0, 0.5, 0.5), look * 0.55), 0, 52);
  } });
  // ===== 4. close on your face in the phone light: something feels wrong =====
  const s4a = s3b, s4b = L('l4').start - 0.2;
  cue(ww('l3', 'wrong.'), 'sting', 0.45); cue(s4a, 'mduck', 0.6);
  S.push({ a: s4a, b: s4b, fade: 0.3, go: t => {
    const yaw = -60; placeYou(0.78, 0.94, 1.7, yaw); const p = stand(t); p.head = [noise(t) * 2, 0, 0]; p.neck = [2, 0, 0]; you.pose(p); you.setExpr(t > ww('l3', 'wrong.') ? 'scared' : 'normal'); you.setPhone('light'); you.glowL.intensity = 0.15;
    you.root.updateMatrixWorld(true); const hp = you.J.head.getWorldPosition(V(0, 0, 0)).add(V(0, 0.04, 0)); const f = V(Math.sin(yaw * D2R), 0, Math.cos(yaw * D2R)), r_ = V(Math.cos(yaw * D2R), 0, -Math.sin(yaw * D2R)); const k = inv(s4a, s4b, t);
    cam(hp.clone().addScaledVector(f, 0.5 - k * 0.08).addScaledVector(r_, 0.16).add(V(0, -0.03, 0)).add(shake(t, 0.004)), hp, 0, 40); renderer.toneMappingExposure = 1.0;
  } });
  // ===== 5. the beach photo: you, Mom, Dad... and someone standing by the water =====
  const s5a = s4b, s5b = L('l7').start - 0.2, fig = onPhoto(0, 0.76, 0.54);
  cue(ww('l4b', 'standing') , 'sting', 0.7); cue(ww('l4b', 'someone') - 0.1, 'mduck', 0.9); cue(L('l5').start, 'heartbeat', 0.5);
  S.push({ a: s5a, b: s5b, fade: 0.3, go: t => {
    const c = keys([{ t: s5a, d: 1.2, u: 0.5, v: 0.5 }, { t: L('l4').end, d: 1.0, u: 0.5, v: 0.52 }, { t: ww('l4b', 'standing') + 0.2, d: 0.26, u: 0.76, v: 0.54 }, { t: L('l5').end, d: 0.2, u: 0.76, v: 0.53 }, { t: L('l6').start + 0.3, d: 0.42, u: 0.72, v: 0.52 }, { t: s5b, d: 0.5, u: 0.7, v: 0.52 }], t);
    flash.position.set(0.06, -0.07, -0.02); flashT.position.set(0, -0.05, -3); flash.angle = 0.6; flash.penumbra = 0.9; flash.castShadow = false; HL.photos.forEach(ph => ph.gl.material.opacity = 0.18); const tgt = onPhoto(0, c.u, c.v); cam(tgt.clone().add(V(c.d, 0.02, -c.d * 0.12)).add(shake(t, 0.004 * c.d)), tgt);
    flash.intensity = 0.7 + c.d * 2.2; pov.visible = c.d > 0.8;
  } });
  // ===== 6. Christmas: there it is again, in the corner, closer, head tilted =====
  const s6a = s5b, s6b = L('l8').start - 0.2;
  cue(ww('l7b', 'there') - 0.05, 'sting', 0.6); cue(ww('l7b', 'listening.'), 'bonecrack', 0.4); cue(s6a, 'whoosh', 0.3);
  S.push({ a: s6a, b: s6b, fade: 0.25, go: t => {
    const pan = ss(s6a, L('l7').end, t);
    const c = keys([{ t: L('l7').end, d: 1.0, u: 0.5, v: 0.5 }, { t: ww('l7b', 'corner.') + 0.1, d: 0.45, u: 0.22, v: 0.5 }, { t: ww('l7b', 'closer.') + 0.2, d: 0.3, u: 0.18, v: 0.42 }, { t: s6b, d: 0.2, u: 0.2, v: 0.22 }], t);
    flash.position.set(0.06, -0.07, -0.02); flashT.position.set(0, -0.05, -3); flash.angle = 0.6; flash.penumbra = 0.9; flash.castShadow = false; HL.photos.forEach(ph => ph.gl.material.opacity = 0.18); const tgt = onPhoto(1, c.u, c.v), from = onPhoto(0, 0.6, 0.5); const look = from.clone().lerp(tgt, pan);
    cam(look.clone().add(V(lerp(0.6, c.d, pan), 0.03, -0.05 * c.d)).add(shake(t, 0.004)), look);
    flash.intensity = 1.6; pov.visible = pan < 0.5;
  } });
  // ===== 7. Your birthday: right behind your chair, its fingers on your shoulder =====
  const s7a = s6b, s7b = L('l9').start - 0.2;
  cue(ww('l8', 'behind'), 'sting', 0.55); cue(ww('l8b', 'fingers'), 'twitch', 0.5); cue(ww('l8b', 'shoulder.'), 'heartbeat', 0.6);
  S.push({ a: s7a, b: s7b, fade: 0.25, go: t => {
    const pan = ss(s7a, L('l8').start + 0.7, t);
    const c = keys([{ t: L('l8').start + 0.7, d: 1.0, u: 0.5, v: 0.5 }, { t: ww('l8', 'chair...'), d: 0.5, u: 0.5, v: 0.32 }, { t: ww('l8b', 'fingers') + 0.4, d: 0.17, u: 0.555, v: 0.52 }, { t: s7b, d: 0.13, u: 0.56, v: 0.53 }], t);
    flash.position.set(0.06, -0.07, -0.02); flashT.position.set(0, -0.05, -3); flash.angle = 0.6; flash.penumbra = 0.9; flash.castShadow = false; HL.photos.forEach(ph => ph.gl.material.opacity = 0.18); const tgt = onPhoto(2, c.u, c.v), from = onPhoto(1, 0.3, 0.4); const look = from.clone().lerp(tgt, pan);
    cam(look.clone().add(V(lerp(0.5, c.d, pan), 0.02, -0.05 * c.d)).add(shake(t, 0.003)), look);
    flash.intensity = 1.3; pov.visible = false;
  } });
  // ===== 8. the last photo: you've never seen it before =====
  const s8a = s7b, s8b = L('l10').start - 0.1;
  cue(ww('l9', 'never'), 'mduck', 0.8); cue(s8a, 'whoosh', 0.3);
  S.push({ a: s8a, b: s8b, fade: 0.3, go: t => {
    flash.position.set(0.06, -0.07, -0.02); flashT.position.set(0, -0.05, -3); flash.angle = 0.6; flash.penumbra = 0.9; flash.castShadow = false; HL.photos.forEach(ph => ph.gl.material.opacity = 0.18); const pan = ss(s8a, L('l9').start + 1.2, t), push = ss(L('l9').start + 1.2, s8b + 0.6, t);
    const from = onPhoto(2, 0.5, 0.5), tgt = onPhoto(3, 0.5, 0.5); const look = from.clone().lerp(tgt, pan);
    cam(look.clone().add(V(lerp(0.75, 0.62, push), 0.02, 0.0)).add(shake(t, 0.004)), look);
    flash.intensity = 1.8; pov.visible = true;
  } });
  // ===== 9. it's this hallway, tonight — from behind (the camera stands where the photographer stood) =====
  const s9a = s8b, s9b = L('l11').start - 0.2, matchT = ww('l10', 'you,') - 0.15;
  cue(matchT, 'whoosh', 0.35); cue(matchT + 0.3, 'creak', 0.5);
  S.push({ a: s9a, b: s9b, fade: 0.3, go: t => {
    if (t < matchT) { flash.position.set(0.06, -0.07, -0.02); flashT.position.set(0, -0.05, -3); flash.angle = 0.6; flash.penumbra = 0.9; flash.castShadow = false; HL.photos.forEach(ph => ph.gl.material.opacity = 0.18); const tgt = onPhoto(3, 0.5, 0.5); cam(tgt.clone().add(V(0.55 - inv(s9a, matchT, t) * 0.08, 0.02, 0)).add(shake(t, 0.003)), tgt); flash.intensity = 3.2; pov.visible = false; you.root.visible = false; return; }
    const k = inv(matchT, s9b + 0.5, t);
    placeYou(YOU.x, 0.94, YOU.z, -90); const p = stand(t); p.head = [0, 0, 0]; you.pose(p); you.setExpr('normal'); you.setPhone('light'); you.torchT.position.set(0, -0.1, -3);
    cam(V(0.95, 1.95, lerp(7.55, 7.25, k)).add(shake(t, 0.005)), V(0.35, 1.45, 5.0));
  } });
  // ===== 10. and it's not in this one (hold, silence) =====
  const s10a = s9b, s10b = L('l12').start - 0.2;
  cue(s10a, 'mmute', 1.6);
  S.push({ a: s10a, b: s10b, fade: 0.35, go: t => { flash.position.set(0.06, -0.07, -0.02); flashT.position.set(0, -0.05, -3); flash.angle = 0.6; flash.penumbra = 0.9; flash.castShadow = false; HL.photos.forEach(ph => ph.gl.material.opacity = 0.18); const tgt = onPhoto(3, 0.5, 0.5); cam(tgt.clone().add(V(0.5, 0.02, 0)), tgt); flash.intensity = 3.0; pov.visible = false; } });
  // ===== 11. the reflection in the glass: the ceiling, right above you =====
  const s11a = s10b, s11b = L('l14').start - 0.2, refT = ww('l12', 'reflection.') - 0.2, aboveT = ww('l13', 'above');
  cue(refT, 'sting', 0.5); cue(L('l13').start, 'heartbeat', 0.8); cue(aboveT, 'drip', 0.7);
  S.push({ a: s11a, b: s11b, fade: 0.3, go: t => {
    flash.position.set(0.06, -0.07, -0.02); flashT.position.set(0, -0.05, -3); flash.angle = 0.6; flash.penumbra = 0.9; flash.castShadow = false; HL.photos.forEach(ph => ph.gl.material.opacity = 0.18); const ref = ss(refT - 0.3, L('l13').start + 0.3, t), push = ss(L('l13').start, s11b, t);
    HL.photos[3].reflM.opacity = 0.1 + ref * 0.8; HL.photos[3].pm.color.setScalar(lerp(1, 0.3, ref));
    const tgt = onPhoto(3, lerp(0.5, 0.55, push), lerp(0.5, 0.35, push)); cam(tgt.clone().add(V(lerp(0.48, 0.3, push), 0.04, 0.08)).add(shake(t, 0.003)), tgt);
    flash.intensity = lerp(3.0, 1.6, ref); pov.visible = false; sagAt(t, 1, { light: 0.9 });
    // what the glass sees: the ceiling above you
    rtCam.position.set(0.12, 1.5, 5.05); rtCam.lookAt(0.9, 2.45, 5.25);
  }, pre: () => { if (rt) { const v = HL.photos[3].refl.visible; HL.photos[3].refl.visible = false; renderer.setRenderTarget(rt); renderer.render(scene, rtCam); renderer.setRenderTarget(null); HL.photos[3].refl.visible = v; } } });
  // ===== 12. "Don't look up." — your eyes slowly rise =====
  const s12a = s11b, s12b = L('l15').start - 0.1;
  cue(ww('l14', 'up.') + 0.3, 'mmute', s12b - ww('l14', 'up.') + 0.1);
  S.push({ a: s12a, b: s12b, fade: 0.25, go: t => {
    placeYou(YOU.x, 0.94, YOU.z, -90); const p = stand(t); p.head = [-ss(L('l14').start, s12b, t) * 8, 0, 0]; you.pose(p); you.setPhone('light'); you.glowL.intensity = 0.05; you.torch.intensity = 0;
    you.faceM.map = faceUp(ss(L('l14').start + 0.2, s12b - 0.1, t)); you.faceM.needsUpdate = true;
    const hp = V(YOU.x - 0.04, 1.62, YOU.z); cam(hp.clone().add(V(-0.56, -0.04, 0.1)).add(shake(t, 0.002)), hp, 0, 36); renderer.toneMappingExposure = 1.2; you.glowL.intensity = 0.35;
  } });
  // ===== 13. POV: you look up — it's hanging there, upside down =====
  const s13a = s12b, s13b = L('l15b').start - 0.1, hitT = s13a + 0.75;
  cue(hitT, 'boom', 1.0); cue(hitT, 'hit', 0.9); cue(hitT + 0.05, 'hiss', 0.6); cue(hitT + 0.2, 'heartbeat', 0.9);
  S.push({ a: s13a, b: s13b, fade: 0, go: t => {
    const up = eio(inv(s13a, hitT, t)), jolt = t > hitT ? Math.exp(-(t - hitT) * 6) : 0;
    const eye = V(YOU.x, 1.62, YOU.z).add(shake(t, 0.006 + jolt * 0.02)).add(V(0, -jolt * 0.04, 0));
    const look = onPhoto(3, 0.5, 0.5).lerp(bw(0.5, 0.36), up);
    cam(eye, look); flash.intensity = lerp(5, 2, up); pov.visible = up < 0.4; sagAt(t, 1, { jaw: 0.7, light: lerp(0.35, 0.8, up) });
  } });
  // ===== 14. its grey skin sagging like a wet sheet; its neck bent all the way back =====
  const s14a = s13b, s14b = L('l15c').start - 0.1, neckT = ww('l15b', 'neck');
  cue(ww('l15b', 'sagging'), 'jawdrop', 0.55); cue(neckT, 'bonecrack', 0.7);
  S.push({ a: s14a, b: s14b, fade: 0.2, go: t => {
    const c = keys([{ t: s14a, p: [0.55, 1.45, 5.95], u: 0.5, v: 0.62 }, { t: neckT - 0.3, p: [0.7, 1.7, 5.5], u: 0.5, v: 0.5 }, { t: s14b, p: [0.8, 1.85, 5.25], u: 0.5, v: 0.3 }], t);
    cam(V(...c.p).add(shake(t, 0.005)), bw(c.u, c.v), 0, 50); flash.intensity = 1.6; pov.visible = false; sagAt(t, 1, { jaw: 0.75, light: 0.75 });
  } });
  // ===== 15. its jaw hanging open... something drips onto the floor next to you =====
  const s15a = s14b, s15b = L('l16').start - 0.15, dropCut = ww('l15c', 'something') - 0.1, dropT = ww('l15c', 'drips') - 0.05, land = V(0.95, 0.012, 4.9);
  cue(ww('l15c', 'jaw'), 'jawdrop', 0.7); cue(dropCut, 'whoosh', 0.2); cue(dropT + 0.5, 'drip', 1.1);
  S.push({ a: s15a, b: s15b, fade: 0.2, go: t => {
    const jaw = lerp(0.75, 1.0, ss(ww('l15c', 'jaw'), ww('l15c', 'open...'), t));
    if (t < dropCut) { const m = bw(0.5, 0.17); cam(m.clone().add(V(0.05, -0.5 + inv(s15a, dropCut, t) * 0.08, -0.12)).add(shake(t, 0.003)), m, 0, 45); flash.intensity = 1.4; pov.visible = false; sagAt(t, 1, { jaw, light: 0.8 }); return; }
    // down at the floor next to your feet: the drop lands with a wet splat
    placeYou(YOU.x, 0.94, YOU.z, -90); const p = stand(t); you.pose(p); you.setPhone('light'); you.torchT.position.set(0, 1.0, -2.0);
    cam(V(1.22, 0.2, 4.6).add(shake(t, 0.002)), V(0.9, 0.08, 4.95), 0, 44); flash.intensity = 0; pov.visible = false;
    const k = inv(dropT, dropT + 0.5, t); drip.visible = t > dropT && k < 1; drip.position.set(land.x, lerp(2.3, 0.012, k * k), land.z); drip.scale.set(2.4, 4.6, 2.4);
    splash.visible = k >= 1; splash.position.copy(land); splash.scale.setScalar(Math.min(1.3, (t - dropT - 0.5) / 0.1) + 0.01);
  } });
  // ===== 16. its pitch-black eyes don't blink; its fingers twitch one joint at a time =====
  const s16a = s15b, s16b = L('l17').start - 0.15, twT = ww('l16', 'fingers');
  const twAt = t => (i, f, j) => { if (i !== 1) return 0; const t0 = twT + 0.35 + (f * 3 + j) * 0.22; const d = t - t0; return d > 0 && d < 0.45 ? Math.sin(d / 0.45 * Math.PI) * 0.9 : 0; };
  for (let f = 0; f < 5; f++) for (let j = 0; j < 3; j++) { const t0 = twT + 0.35 + (f * 3 + j) * 0.22; if (t0 < s16b) cue(t0, 'twitch', 0.55); }
  cue(ww('l16', 'blink.'), 'sting', 0.4);
  S.push({ a: s16a, b: s16b, fade: 0.2, go: t => {
    if (t < twT - 0.1) { const e = bw(0.5, 0.275), k = inv(s16a, twT, t); cam(e.clone().add(V(0.04, -0.36 + k * 0.08, 0.1)).add(shake(t, 0.002)), e, 0, 34); flash.intensity = 1.2; pov.visible = false; sagAt(t, 1, { jaw: 1.0, light: 0.8 }); return; }
    const h = bw(0.8, 0.12); cam(h.clone().add(V(-0.12, -0.62, 0.16)).add(shake(t, 0.002)), h, 0, 44); flash.intensity = 0.35; pov.visible = false; sagAt(t, 1, { jaw: 1.0, tw: twAt(t), light: 0.8 });
  } });
  // ===== 17. it only moves when you can't see it — and your battery is at one percent =====
  const s17a = s16b, s17b = L('l18').start - 0.15, battT = ww('l17', 'battery...') - 0.3, dimT = ww('l17', 'percent.');
  cue(battT, 'phonebeep', 0.9); cue(dimT, 'mduck', 1.0);
  S.push({ a: s17a, b: s17b, fade: 0.25, go: t => {
    const down = ss(s17a, battT, t);
    const eye = V(YOU.x, 1.62, YOU.z).add(shake(t, 0.005));
    cam(eye, bw(0.5, 0.36).lerp(V(0.9, 0.6, 5.0), down)); sagAt(t, 1, { jaw: 1.0, light: 0.7 });
    phoneBig.visible = t > battT - 0.2; phoneBig.position.set(0, lerp(-0.25, 0.035, ss(battT - 0.2, battT + 0.2, t)), -0.26);
    flash.intensity = lerp(5, 1.6, ss(dimT, s17b, t)); pov.visible = false;
  } });
  // ===== 18. two options: the front door (right under it) or the bathroom (right next to you) =====
  const s18a = s17b, s18b = L('l21').start - 0.15, aT = ww('l19', 'run'), bT = ww('l20', 'or'), lightT = ww('l20', 'light');
  cue(ww('l18', 'two'), 'card', 0.7); cue(aT, 'pop', 0.8); cue(bT, 'pop', 0.8); cue(s18a + 0.2, 'hiss', 0.4); cue(ww('l20', 'hours.') - 0.6, 'sting', 0.8); cue(ww('l20', 'hours.') - 0.6, 'hiss', 0.6);
  S.push({ a: s18a, b: s18b, fade: 0.3, go: t => {
    const hoursT = ww('l20', 'hours.'), toDoor = ss(s18a + 0.3, aT + 0.4, t), toBath = ss(bT - 0.2, bT + 0.7, t), glance = ss(hoursT - 0.9, hoursT - 0.2, t);
    const eye = V(YOU.x, 1.6, YOU.z).add(shake(t, 0.006 + glance * 0.006)).add(V(0.12 * ss(bT + 0.7, hoursT - 1.0, t), 0, 0));
    const near = ss(bT + 0.8, hoursT - 1.0, t);   // while you look at the bathroom door it crawls closer
    POS[2].set(0.74, 2.47, lerp(6.55, 5.95, near));
    const l0 = V(0.74, 2.2, 6.4), l1 = V(0.75, 1.25, 8.0), l2 = V(1.5, 1.05, 5.15), l3 = V(0.72, 1.95, 5.95);
    cam(eye, l0.clone().lerp(l1, toDoor).lerp(l2, toBath).lerp(l3, glance), 0, 58);
    sagAt(t, 2, { jaw: 1.0, side: true, light: 0.55 }); flash.intensity = 2.2 + 0.4 * Math.sin(t * 0.7); pov.visible = true;
    HL.gapM.opacity = 0.7 * ss(lightT - 0.2, lightT + 0.4, t); HL.bathL.intensity = 2.2 * ss(lightT - 0.2, lightT + 0.4, t);
  }, ui: (g, t) => { label3D(g, t, aT, s18b + 0.2, V(0.75, 1.0, 7.95), 'A', 'FRONT DOOR', '#ff3b2f'); label3D(g, t, bT + 0.3, s18b + 0.2, V(1.46, 1.25, 5.17), 'B', 'BATHROOM', '#3ea8ff'); } });
  // ===== 19. what do you do? comment — did you spot it in the first second? — back to the beach photo (loops) =====
  const s19a = s18b, spotT = ww('l22', 'did'), folT = ww('l23', 'follow...');
  cue(ww('l21', 'comments.'), 'like', 0.8); cue(spotT, 'whoosh', 0.4); cue(folT, 'follow', 0.9); cue(end - 1.2, 'sting', 0.5);
  S.push({ a: s19a, b: end + 0.1, fade: 0.3, go: t => {
    const back_ = ss(spotT - 0.2, spotT + 2.0, t), settle = ss(spotT + 2.0, end - 0.05, t);
    if (t < spotT - 0.2) { POS[2].set(0.74, 2.47, 5.95); cam(V(0.95, 1.8, 3.75).add(shake(t, 0.004)), V(0.66, 1.65, 7.6), 0, 58); placeYou(YOU.x, 0.94, YOU.z, 0); const p = stand(t); p.head = [-12, 0, 0]; you.pose(p); you.setPhone('light'); you.setExpr('terror'); you.torchT.position.set(0, 0.5, -3); sagAt(t, 2, { jaw: 1.0, side: true, light: 0.5 }); flash.intensity = 0; pov.visible = false; return; }
    // the camera glides back down the hall to the beach photo and lands exactly on the opening frame
    const pos = V(0.9, 1.7, 4.4).lerp(OPEN.pos, back_), look = onPhoto(0, 0.65, 0.52).lerp(OPEN.look, settle);
    cam(pos.add(shake(t, 0.006)), back_ < 0.6 ? onPhoto(0, 0.75, 0.55).lerp(look, back_ / 0.6) : look);
    flash.intensity = 18; pov.visible = true;
  }, ui: (g, t) => { abBadge(g, t, ww('l21', 'what'), spotT - 0.1); ctaBlock(g, t, ww('l21', 'comments.'), folT, end); } });
  SHOTS = S;
}

// ---------------- 2D overlays ----------------
function timeTag(g, t, t0, t1, text) { if (t < t0 || t > t1 + 0.3) return; const k = popK(t, t0, 0.3), out = 1 - ss(t1, t1 + 0.3, t); g.save(); g.globalAlpha = out; g.translate(W / 2, 250); g.scale(k, k); g.font = '900 46px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; const tw = g.measureText(text).width + 60; rr(g, -tw / 2, -38, tw, 76, 20); g.fillStyle = 'rgba(8,10,16,0.75)'; g.fill(); g.fillStyle = '#e8ecf6'; g.fillText(text, 0, 3); g.restore(); }
function label3D(g, t, t0, t1, p, letter, text, col) {   // a label pinned to a real object in the scene
  if (t < t0 || t > t1) return; const q = p.clone().project(camera); if (q.z > 1) return;
  let x = (q.x * 0.5 + 0.5) * W, y = (-q.y * 0.5 + 0.5) * H; if (x < -60 || x > W + 60) return; const k = popK(t, t0, 0.35);
  g.save(); g.font = '900 50px Inter'; const tw = g.measureText(text).width, bw = tw + 150; x = clamp(x, 80 + bw / 2, W - 80 - bw / 2); y = clamp(y, 260, 1200);
  g.translate(x, y); g.scale(k, k); rr(g, -bw / 2, -50, bw, 100, 24); g.fillStyle = 'rgba(10,10,14,0.9)'; g.fill(); g.lineWidth = 6; g.strokeStyle = col; g.stroke();
  g.fillStyle = col; rr(g, -bw / 2 + 14, -36, 72, 72, 16); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, -bw / 2 + 50, 3); g.textAlign = 'left'; g.fillText(text, -bw / 2 + 104, 3); g.restore();
}
function abBadge(g, t, t0, t1) { if (t < t0 || t > t1 + 0.3) return; const k = popK(t, t0, 0.35), out = 1 - ss(t1, t1 + 0.3, t); g.save(); g.globalAlpha = out; g.translate(W / 2, 330); g.scale(k, k);
  g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; rr(g, -330, -70, 660, 140, 30); g.fillStyle = 'rgba(10,10,14,0.88)'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#ffd23f'; g.stroke();
  g.fillStyle = '#ff3b2f'; g.fillText('A', -170, 3); g.fillStyle = '#fff'; g.fillText('OR', 0, 3); g.fillStyle = '#3ea8ff'; g.fillText('B', 170, 3); g.font = '900 34px Inter'; g.fillStyle = '#ffd23f'; g.fillText('COMMENT ↓', 0, 120); g.restore(); }
function ctaBlock(g, t, t0, folT, end) {
  if (t > t0 + 0.2) { const k = popK(t, t0 + 0.2, 0.35); g.save(); g.translate(W / 2 - 190, 640); g.scale(k, k); g.fillStyle = '#ff2f55'; g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-90, -30, -50, -100, 0, -55); g.bezierCurveTo(50, -100, 90, -30, 0, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.restore(); }
  if (t > folT) { const k = popK(t, folT, 0.35); g.save(); g.translate(W / 2 + 80, 630); g.scale(k, k); rr(g, -170, -55, 340, 110, 30); g.fillStyle = '#fe2c55'; g.fill(); g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ FOLLOW', 0, 3); g.restore(); }
  const wa = WDW('l22', 'watch'); if (t > wa && t < folT - 0.1) { const k = popK(t, wa, 0.35); g.save(); g.translate(W / 2, 430); g.scale(k, k); g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#000'; g.strokeText('↻ WATCH AGAIN', 0, 0); g.fillStyle = '#ffd23f'; g.fillText('↻ WATCH AGAIN', 0, 0); g.restore(); }
}

// ---------------- frame compositor ----------------
let MAIN = null;
function renderShot(s, t) {
  belowP.visible = false; sideP.visible = false; pov.visible = false; phoneBig.visible = false; flash.intensity = 0; you.root.visible = true; you.setPhone(null); you.glowL.intensity = 0;
  drip.visible = false; splash.visible = false; flash.position.set(0.17, -0.12, -0.42); flashT.position.set(0.05, -0.2, -5); you.setExpr('normal'); you.torchT.position.set(0, -0.4, -3);
  HL.photos[3].reflM.opacity = 0; HL.photos[3].pm.color.setScalar(1); HL.gapM.opacity = 0; HL.bathL.intensity = 0; you.faceM.map = null; you.expr = '';
  placeYou(0, 0.94, -30, 0);   // parked off-set unless a shot places you
  renderer.toneMappingExposure = 1.55;
  s.go(t); if (!you.faceM.map) you.setExpr(you.expr || 'normal');
  // the living world: the clock's pendulum swings, curtains breathe, trees sway, dust drifts
  HL.pend.rotation.z = Math.sin(t * Math.PI) * 0.22;
  LV.curtains.forEach((c, i) => { const p = c.geometry.attributes.position, b = c.userData.base; for (let j = 0; j < p.count; j++) { const x = b[j * 3], y = b[j * 3 + 1]; p.setZ(j, Math.sin(x * 14 + i) * 0.035 + Math.sin(t * 0.9 + y * 2 + i) * 0.014 * (1 - (y + 1.1) / 2.2)); } p.needsUpdate = true; c.geometry.computeVertexNormals(); });
  LV.trees.forEach((tr, i) => { tr.rotation.z = Math.sin(t * 0.8 + i) * 0.02; });
  setDust(t);
  if (s.pre) s.pre(t);
  effect.render(scene, camera);
}
function renderFrame(t) {
  if (!MAIN) MAIN = document.getElementById('c'); const g = MAIN.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const act = SHOTS.filter(s => t >= s.a - s.fade && t < s.b + 1e-6);
  act.forEach((s, i) => { renderShot(s, t); const k = i === 0 ? 1 : (s.fade > 0 ? ss(s.a - s.fade, s.a, t) : 1); g.save(); g.globalAlpha = k; g.drawImage(renderer.domElement, 0, 0); g.restore(); });
  vignette(g, 0.62);
  const top = act[act.length - 1]; if (top && top.ui) top.ui(g, t);
  captions(g, t);
}
window.init = async timing => { T = timing; await document.fonts.load('900 60px Inter'); setup(); build(); renderFrame(0.1); return { cues: CUES, dur: T.duration }; };
window.debugCam = (px, py, pz, lx, ly, lz, fl, which) => { renderShot({ go: t => { cam(V(px, py, pz), V(lx, ly, lz), 0, 55); sagAt(t, which || 1, { jaw: 1.0 }); flash.intensity = fl; pov.visible = false; placeYou(0.62, 0.94, 5.05, -90); you.pose(stand(t)); you.setPhone('light'); } }, 70); const g = document.getElementById('c').getContext('2d'); g.drawImage(renderer.domElement, 0, 0); return document.getElementById('c').toDataURL('image/jpeg', 0.9); };
window.frameJPG = (t, q) => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', q || 0.93); };
window.ready = true;

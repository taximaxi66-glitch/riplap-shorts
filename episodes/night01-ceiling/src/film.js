// ---------- the film: home alone, something on the ceiling (new format, episode 1) ----------
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { buildTextures } from './tex.js';
import { buildBedroom, buildDownstairs, makeHuman, makeCrawler, mat, box, seg, noOutline } from './models.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const D = Math.PI / 180;
let renderer, effect, scene, camera, A, B, you, crawl, fingers, pov, flash, flashT, CUES = [];
const cue = (t, n, v = 1) => CUES.push({ t: +t.toFixed(3), n, v });

function setup() {
  buildTextures();
  const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
  renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.outputColorSpace = THREE.SRGBColorSpace;
  effect = new OutlineEffect(renderer, { defaultThickness: 0.004, defaultColor: [0.03, 0.03, 0.04] });
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x020306); scene.fog = new THREE.FogExp2(0x070a12, 0.05);
  camera = new THREE.PerspectiveCamera(58, W / H, 0.03, 80); scene.add(camera);
  A = buildBedroom(); B = buildDownstairs(); scene.add(A.S, B.S);
  you = makeHuman(); scene.add(you.root);
  crawl = makeCrawler(); scene.add(crawl.G);
  // the long fingers that slide under your door (set A)
  fingers = new THREE.Group(); const fm = mat(0x8e8c80); fm.userData.outlineParameters = { thickness: 0.004, color: [0.03, 0.03, 0.04], alpha: 1 };
  fingers.parts = []; for (let i = 0; i < 4; i++) { const p = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), fm); m.castShadow = true; fingers.add(m); return m; }); const nail = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), mat(0x0a0808)); nail.scale.set(1.6, 0.6, 1); fingers.add(nail); const kn = [0, 1].map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 10, 8), fm); fingers.add(s); return s; }); fingers.parts.push({ p, nail, kn }); }
  A.S.add(fingers);
  // POV: your hand holding the phone (flashlight on) attached to the camera
  pov = new THREE.Group(); camera.add(pov);
  const skin = mat(0xe2b590), sleeve = mat(0x8e2b2b);
  for (const m of [skin, sleeve]) m.userData.outlineParameters = { thickness: 0.004, color: [0.03, 0.03, 0.04], alpha: 1 };
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 12), sleeve); arm.rotation.x = Math.PI / 2 - 0.5; arm.position.set(0.05, -0.12, 0.12); pov.add(arm);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), skin); hand.scale.set(1, 0.8, 1.3); pov.add(hand);
  const ph = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.01), mat(0x111111)); ph.position.set(0, 0.04, -0.02); ph.rotation.x = -1.2; pov.add(ph);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); noOutline(led.material); led.position.set(0.02, 0.1, -0.06); pov.add(led);
  pov.position.set(0.17, -0.2, -0.38);
  flash = new THREE.SpotLight(0xe6eeff, 0, 14, 0.42, 0.55, 1.4); flash.castShadow = true; flash.shadow.mapSize.set(1024, 1024); flash.shadow.bias = -0.0008; flash.shadow.camera.near = 0.1;
  flashT = new THREE.Object3D(); camera.add(flash, flashT); flash.position.set(0.17, -0.12, -0.42); flashT.position.set(0.05, -0.3, -5); flash.target = flashT;
}

// ---------------- helpers ----------------
function keys(K, t) { if (t <= K[0].t) return { ...K[0] }; if (t >= K[K.length - 1].t) return { ...K[K.length - 1] };
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1].t) { const k = eio(inv(K[i].t, K[i + 1].t, t)), o = {}; for (const p in K[i]) o[p] = Array.isArray(K[i][p]) ? K[i][p].map((v, j) => lerp(v, K[i + 1][p][j], k)) : lerp(K[i][p], K[i + 1][p], k); return o; } }
function cam(pos, look, roll = 0, fov = 58) { camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); if (roll) camera.rotateZ(roll); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } }
const shake = (t, a, f = 1) => V(noise(t * 1.7 * f) * a, noise(t * 1.9 * f + 3) * a * 0.7, noise(t * 1.3 * f + 7) * a * 0.5);   // smooth handheld sway (no jitter)
function showSet(s) { A.S.visible = s === 'A'; B.S.visible = s === 'B'; }
function blendPose(p, q, k) { const o = {}; for (const key of new Set([...Object.keys(p), ...Object.keys(q)])) { const a = p[key] || q[key].map(() => 0), b = q[key] || p[key].map(() => 0); o[key] = a.map((v, i) => lerp(v, b[i] ?? 0, k)); } return o; }
// survivor poses (degrees)
const P = {
  lie: t => ({ spine: [0, 0, 0], neck: [22, 0, 0], head: [8 + noise(t * 0.6) * 2, -8, 0], armR: [118, 18, 0, 62, 20], armL: [10, 12, 0, 70], legL: [0, 3, 6], legR: [2, 5, 14] }),
  sit: t => ({ spine: [8, 0, 0], neck: [6, 0, 0], head: [0, -30 + noise(t * 0.9) * 4, 0], armR: [40, 18, 0, 70, 10], armL: [5, 18, 0, 25], legL: [88, 4, 6], legR: [86, 6, 12] }),
  stand: t => ({ spine: [3 + noise(t * 0.5) * 1.5, 0, 0], neck: [4, 0, 0], head: [noise(t * 0.7) * 3, 0, 0], armR: [8, 10, 0, 20], armL: [6, 10, 0, 18], legL: [0, 2, 4], legR: [0, 3, 4] }),
  push: t => ({ spine: [10, 0, 0], neck: [0, 0, 0], head: [0, 0, 0], armR: [80, 10, 0, 20], armL: [78, 12, 0, 22], legL: [-12, 2, 5], legR: [18, 3, 10] }),
  key: t => ({ spine: [6, 0, 0], neck: [10, 0, 0], head: [12, 0, 0], armR: [62, 6, 0, 55, -10], armL: [30, 14, 0, 50], legL: [0, 2, 6], legR: [4, 3, 6] }),
  backAway: t => ({ spine: [-6, 0, 0], neck: [-8, 0, 0], head: [-6, 0, 0], armR: [35, 25, 0, 80], armL: [35, 25, 0, 80], legL: [-14, 3, 8], legR: [18, 3, 18] }),
  look: (t, yaw) => ({ spine: [2, yaw * 0.3, 0], neck: [2, yaw * 0.3, 0], head: [noise(t) * 2, yaw * 0.4, 0], armR: [10, 14, 0, 40], armL: [10, 14, 0, 40], legL: [0, 3, 4], legR: [0, 3, 4] }),
};
function placeYou(x, y, z, yawDeg, pitchDeg = 0) { you.root.position.set(x, y, z); you.root.rotation.set(pitchDeg * D, yawDeg * D, 0, 'YXZ'); }
// crawler gait with foot-locking: anchors stay planted on the ceiling until they step
function gait(pathAt, d, ceilY, t) {
  const Lc = 0.62, offs = [[-0.42, 0.6], [0.42, 0.6], [-0.4, -0.55], [0.4, -0.55]], ph = [0, 0.5, 0.5, 0];
  const at = dd => { const p = pathAt(dd); return { pos: p.pos, fwd: V(Math.sin(p.h), 0, Math.cos(p.h)), side: V(Math.cos(p.h), 0, -Math.sin(p.h)), h: p.h }; };
  const plant = (i, n) => { const q = at((n - ph[i]) * Lc + 0.55 * Lc); return q.pos.clone().addScaledVector(q.side, offs[i][0]).addScaledVector(q.fwd, offs[i][1]).setY(ceilY); };
  const anchors = offs.map((o, i) => { const u = d / Lc + ph[i], n = Math.floor(u), f = u - n; if (f < 0.72) return plant(i, n);
    const k = ss(0, 1, (f - 0.72) / 0.28), a = plant(i, n), b = plant(i, n + 1); return a.lerp(b, k).setY(ceilY - 0.16 * Math.sin(Math.PI * k)); });
  const c = at(d); const bob = Math.sin(d / Lc * Math.PI * 4) * 0.02;
  return { pos: c.pos.clone().setY(ceilY - 0.42 + bob), heading: c.h, anchors, t, curl: true };
}

// ---------------- the timeline ----------------
let SHOTS = [];
function build() {
  CUES = []; const L = id => LN(id), w = (id, k) => WD(id, k), ww = (id, word, n) => WDW(id, word, n);
  const S = [];
  const crashT = 3.55, msgT = 1.25, coughT = ww('cough', 'coughs.') + 0.25;
  // ===== 1. silent opening: your messy room at 1 a.m., you on the bed with your phone =====
  cue(0, 'room', 1); cue(0.3, 'clock', 0.8); cue(msgT, 'notif', 0.9); cue(crashT, 'crash', 1); cue(crashT, 'mmute', 1.0); cue(crashT + 0.15, 'heartbeat', 0.5);
  S.push({ a: 0, b: L('intro').start - 0.3, fade: 0, set: 'A', go: t => {
    const k = inv(0, 4.4, t), flinch = ss(crashT, crashT + 0.35, t);
    cam(V(lerp(0.75, 1.35, eio(k)), lerp(1.75, 1.55, k), lerp(3.45, 2.9, eio(k))).add(shake(t, 0.01)), V(3.4, 0.75, 0.9));
    placeYou(3.55, A.bedTop + 0.13 + flinch * 0.06, 1.18, 0, -90 + flinch * 22);
    const p = P.lie(t); if (flinch > 0) { p.neck = [lerp(22, 40, flinch), 0, 0]; p.head = [lerp(8, 0, flinch), lerp(-8, -55, flinch), 0]; p.armR = [lerp(118, 70, flinch), 18, 0, lerp(62, 80, flinch), 20]; }
    you.pose(p); you.setExpr(flinch > 0.3 ? 'scared' : 'normal'); you.setPhone(t > msgT && t < msgT + 1.6 ? 'msg' : 'feed');
  }, ui: (g, t) => {
    timeChip(g, t, 0.15, '1:12 AM');
    phonePop(g, t, msgT + 0.05, msgT + 1.9);
    if (t > crashT && t < crashT + 0.5) { g.fillStyle = `rgba(0,0,0,${0.25 * (1 - inv(crashT, crashT + 0.5, t))})`; g.fillRect(0, 0, W, H); }
  } });
  // ===== 2. you sit up and stare at the half-open door =====
  const sitT = L('intro').start - 0.2;
  S.push({ a: L('intro').start - 0.3, b: L('check').start - 0.15, fade: 0.25, set: 'A', go: t => {
    const sk = eio(inv(sitT, sitT + 0.9, t)), push = inv(L('cough').start - 0.3, L('check').start, t);
    if (t < L('cough').start - 0.3) cam(V(2.3, 1.05, 2.4).add(shake(t, 0.008)), V(3.5, 0.95, 1.1));
    else cam(V(lerp(3.3, 2.6, eio(push)), lerp(1.3, 1.25, push), lerp(1.4, 2.0, eio(push))).add(shake(t, 0.01)), V(0.0, 1.05, 2.95));   // over your shoulder towards the dark door gap
    placeYou(3.55, A.bedTop + 0.13, 1.18, 0, lerp(-68, 0, sk));
    const p = blendPose(P.lie(t), P.sit(t), sk); if (t > coughT - 0.05) p.head = [0, -62 + noise(t) * 3, 0]; you.pose(p); you.setExpr('scared'); you.setPhone('feed');
    A.door.rotation.y = 1.05;   // the door stands half open into darkness
  }, ui: () => {} });
  cue(coughT, 'cough', 1); cue(coughT, 'mmute', 1.6); cue(L('cough').start, 'drone', 0.8);
  // ===== 3. POV down the stairs with the phone light =====
  const stA = L('check').start - 0.15, stB = L('normal').start - 0.05, lightT = ww('check', 'phone,') - 0.05;
  const steps = 9; for (let i = 0; i < steps; i++) cue(lerp(stA + 0.5, stB - 0.1, i / (steps - 1)), i % 3 === 1 ? 'creak' : 'step', i % 3 === 1 ? 0.7 : 0.5);
  cue(lightT, 'click', 0.8);
  S.push({ a: stA, b: stB, fade: 0.3, set: 'B', go: t => {
    const k = inv(stA + 0.45, stB, t), stepK = k * (steps - 1), sp = Math.floor(stepK), sf = stepK - sp, bob = -Math.sin(sf * Math.PI) * 0.035;
    const z = lerp(8.3, 3.6, eio(k)), stairY = clamp((z - 3.4) / B.run) * B.rise + Math.max(0, Math.min(B.N, (z - 3.4) / B.run)) * 0; const y = clamp((z - 3.4) / (B.run * B.N)) * 2.8 + 1.58 + bob;
    cam(V(0.62, y, z).add(shake(t, 0.02, 1.4)), V(0.6, y - 1.1 + k * 0.6, z - 3.5));
    flash.intensity = 26 * ss(lightT, lightT + 0.15, t); pov.visible = true;
  }, ui: () => {} });
  // ===== 4. the hallway: the living room looks normal... until the light finds the eyes =====
  const nA = stB, nB = L('peek').start - 0.05, scareT = L('peek').start - 0.32;
  cue(nA, 'room', 0.9); cue(nA + 0.2, 'step', 0.4); cue(nA + 0.7, 'step', 0.35); cue(L('normal').end + 0.05, 'mmute', scareT - L('normal').end + 0.35); cue(scareT, 'boom', 1); cue(scareT, 'sting', 0.9); cue(scareT + 0.05, 'hiss', 0.7);
  const PEEK = { body: V(1.95, 2.12, -1.65), hidden: V(1.5, 2.28, -1.3), out: V(1.24, 2.26, -1.27) };
  S.push({ a: nA, b: nB, fade: 0.25, set: 'B', go: t => {
    const walk = eio(inv(nA, L('normal').end, t)), z = lerp(3.0, 1.15, walk), bob = Math.sin(walk * Math.PI * 4) * 0.012;
    // the light sweeps the living room: sofa → table → the fallen frame → drifts up to the right door-frame corner
    const sweep = keys([{ t: nA, l: [0.65, 1.3, -3] }, { t: L('normal').start + 0.4, l: [0.2, 0.7, -6.0] }, { t: ww('normal', 'normal.'), l: [-0.2, 0.1, -3.4] }, { t: L('normal').end + 0.7, l: [0.4, 1.0, -3.5] }, { t: scareT - 0.15, l: [1.05, 2.2, -1.4] }], t);
    const jolt = t > scareT ? Math.exp(-(t - scareT) * 7) : 0;
    cam(V(0.62, 1.6 + bob, z).add(shake(t, 0.012)).add(V(0, jolt * 0.05, jolt * 0.12)), V(...sweep.l));
    flash.intensity = 20; pov.visible = true;
    crawl.G.visible = true; const out = ss(scareT - 0.2, scareT + 0.05, t);
    const st = { pos: PEEK.body, heading: -Math.PI / 2, anchors: [V(2.4, 2.6, -1.4), V(2.3, 2.6, -2.1), V(1.5, 2.6, -1.4), V(1.6, 2.6, -2.2)], t, curl: true, headPos: PEEK.hidden.clone().lerp(PEEK.out, out), headLook: camera.position.clone(), tilt: noise(t * 1.3) * 0.15 };
    crawl.update(st);
  }, ui: (g, t) => { if (t > scareT && t < scareT + 0.6) { g.fillStyle = `rgba(255,255,255,${0.12 * (1 - inv(scareT, scareT + 0.6, t))})`; g.fillRect(0, 0, W, H); } } });
  // ===== 5. it peeks further out, a hand grips the corner... then it crawls toward you along the ceiling =====
  const pA = nB, pB = L('run').start - 0.1, crawlT = L('crawl').start - 0.25, gripT = ww('peek', 'ceiling.') - 0.2;
  const path = d => { const a = V(1.95, 2.12, -1.65), c = V(0.65, 2.12, -1.7), e = V(0.65, 2.12, 1.4); if (d < 1.3) return { pos: a.clone().lerp(c, d / 1.3), h: lerp(-Math.PI / 2, 0, ss(0.6, 1.3, d)) }; return { pos: c.clone().lerp(e, Math.min(1, (d - 1.3) / 3.1)), h: 0 }; };
  const dist = t => 4.0 * eio(inv(crawlT, pB + 0.2, t));
  { let last = null; for (let t = crawlT; t < pB; t += 1 / 120) { const st = gait(path, dist(t), 2.6, t), key = st.anchors.map(a => a.y > 2.595 ? 1 : 0).join(''); if (last != null && key !== last && (key.match(/1/g) || []).length > (last.match(/1/g) || []).length) cue(t, 'knuckle', 0.55); last = key; } }
  cue(gripT, 'knuckle', 0.9); cue(crawlT, 'hiss', 0.5); cue(L('crawl').start + 0.2, 'heartbeat', 0.8);
  S.push({ a: pA, b: pB, fade: 0, set: 'B', go: t => {
    const back = eio(inv(crawlT + 0.3, pB, t)), push = eio(inv(pA, crawlT, t));
    const camPos = V(0.62, 1.6, lerp(1.15, 2.4, back) - push * 0.25).add(shake(t, 0.014 + back * 0.01));
    flash.intensity = lerp(16, 9, ss(crawlT, pB, t)); pov.visible = true; crawl.G.visible = true;
    if (t < crawlT) {
      const out = 1; const grip = ss(gripT - 0.2, gripT + 0.15, t);
      const st = { pos: PEEK.body, heading: -Math.PI / 2, anchors: [V(2.4, 2.6, -1.4), V(2.3, 2.6, -2.1), V(1.5, 2.6, -1.4), V(1.6, 2.6, -2.2)], t, curl: true, headPos: PEEK.out.clone().add(V(-0.06 * push, -0.05 * push, 0.02)), headLook: camPos.clone(), tilt: noise(t * 1.3) * 0.2 };
      st.anchors[0] = V(2.2, 2.6, -1.4).lerp(V(1.22, 2.6, -1.18), grip);   // a long hand comes round the corner and grips the ceiling
      crawl.update(st);
      cam(camPos, V(0.95, lerp(1.95, 2.15, push), -1.3));
    } else {
      const d = dist(t), st = gait(path, d, 2.6, t); st.headLook = camPos.clone(); st.tilt = noise(t * 1.1) * 0.15;
      if (d < 0.8) st.headPos = PEEK.out.clone().lerp(st.pos.clone().add(V(0, -0.25, 0.45)), ss(0, 0.8, d));
      crawl.update(st);
      cam(camPos, crawl.head.position.clone().lerp(V(0.62, 1.7, -2), 0.25));
    }
  }, ui: () => {} });
  // ===== 6. run upstairs (POV), slam the door, turn the key =====
  const rA = pB, upB = L('run').start + 0.85, lockT = ww('run', 'lock') + 0.05;
  for (let i = 0; i < 6; i++) cue(rA + 0.08 + i * 0.13, 'step', 0.75); cue(rA, 'whoosh', 0.6); cue(upB + 0.05, 'doorslam', 1); cue(lockT, 'lockclick', 1.2); cue(lockT + 0.2, 'pant', 0.8);
  S.push({ a: rA, b: upB, fade: 0.1, set: 'B', go: t => {
    const k = eio(inv(rA, upB, t)), z = lerp(2.6, 6.4, k), y = clamp((z - 3.4) / (B.run * B.N)) * 2.8 + 1.55;
    cam(V(0.62, y, z).add(shake(t * 3, 0.05)), V(0.6, y + 0.35, z + 3), noise(t * 4) * 0.06);
    flash.intensity = 30; pov.visible = true; crawl.G.visible = true; const st = gait(path, 4.0, 2.6, t); st.headLook = camera.position.clone(); crawl.update(st);
  }, ui: () => {} });
  const dA = upB, dB = L('tap').start - 0.2;
  S.push({ a: dA, b: dB, fade: 0, set: 'A', go: t => {
    const shut = eout(inv(dA, dA + 0.25, t)), turn = ss(lockT - 0.05, lockT + 0.18, t), lean = ss(lockT + 0.3, dB, t);
    A.door.rotation.y = lerp(1.2, 0, shut); A.key.rotation.x = turn * Math.PI / 2;
    cam(V(1.75, 1.4, 1.75).add(shake(t, 0.012 + (1 - shut) * 0.03)), V(0.15, 1.0, 3.05));
    placeYou(0.38 + lean * 0.05, 0.94, 3.12, -90); you.pose(t < lockT - 0.2 ? P.push(t) : blendPose(P.key(t), P.backAway(t), lean)); you.setExpr('terror'); you.setPhone('light');
    pov.visible = false; flash.intensity = 0;
  }, ui: () => {} });
  // ===== 7. it taps on your door, softly — you back away =====
  const tA = dB, tB = L('fingers').start - 0.15, taps = [ww('tap', 'taps'), ww('tap', 'door.') + 0.05, ww('tap', 'softly.') + 0.2];
  taps.forEach(x => cue(x, 'knock', 0.8)); cue(tA, 'mduck', 0.3);
  S.push({ a: tA, b: tB, fade: 0.25, set: 'A', go: t => {
    const back = eio(inv(tA, tB, t)); const tk = taps.reduce((a, b) => a + (t > b ? Math.exp(-(t - b) * 14) * Math.sin((t - b) * 60) : 0), 0);
    A.door.rotation.y = tk * 0.003; A.key.rotation.x = Math.PI / 2;
    cam(V(2.9, 1.45, 1.7).add(shake(t, 0.01)), V(0.3, 1.05, 3.0));
    placeYou(lerp(0.75, 1.35, back), 0.94, lerp(3.05, 3.2, back), -90); const p = P.backAway(t); p.legL = [-14 + Math.sin(back * 9) * 10, 3, 8]; p.legR = [18 - Math.sin(back * 9) * 10, 3, 18]; you.pose(p); you.setExpr('terror'); you.setPhone('light');
  }, ui: () => {} });
  // ===== 8. its long fingers slide under the gap (floor level) =====
  const fA = tB, fB = L('clue').start - 0.15;
  cue(ww('fingers', 'slide'), 'scrape', 0.9); cue(ww('fingers', 'gap.') + 0.1, 'scrape', 0.6); cue(fA + 0.1, 'heartbeat', 0.9);
  S.push({ a: fA, b: fB, fade: 0.25, set: 'A', go: t => {
    const k = ss(ww('fingers', 'slide') - 0.3, ww('fingers', 'gap.') + 0.4, t) * 1.5;
    cam(V(0.95, 0.16, 2.6).add(shake(t, 0.006)), V(-0.05, 0.08, 3.05), 0, 52); flash.intensity = 9; flashT.position.set(0, -0.05, -5);
    A.door.rotation.y = 0; A.key.rotation.x = Math.PI / 2; fingers.visible = true;
    fingers.parts.forEach((f, i) => { const z0 = 2.75 + i * 0.12, reach = k * (0.28 + (i % 2) * 0.08) + Math.sin(t * 3 + i) * 0.015 * k;
      const a = V(-0.06, 0.012, z0), b = V(-0.02 + reach * 0.45, 0.012, z0 + Math.sin(t * 2 + i) * 0.02), c = V(reach * 0.72, 0.02 + 0.022 * Math.max(0, Math.sin(t * 4 + i * 1.7)), z0 + reach * 0.1 * (i - 1.5)), d = V(reach, 0.008, z0 + reach * 0.16 * (i - 1.5));
      seg(f.p[0], a, b, 0.0085); seg(f.p[1], b, c, 0.0072); seg(f.p[2], c, d, 0.006); f.nail.position.copy(d); f.kn[0].position.copy(b); f.kn[1].position.copy(c); });
    placeYou(1.45, 0.94, 3.05, -90); you.torchT.position.set(0, -1.6, -2.4); you.pose(P.backAway(t)); you.setExpr('terror'); you.setPhone('light');
  }, ui: () => {} });
  // ===== 9. the clue: it only crawls on the ceiling, it never looks down (camera looks up at your empty ceiling) =====
  const cA = fB, cB = L('opts').start - 0.15;
  cue(cA, 'mduck', 0.5); cue(ww('clue', 'never'), 'pop', 0.6);
  S.push({ a: cA, b: cB, fade: 0.3, set: 'A', go: t => {
    const k = eio(inv(cA, cB, t)); fingers.visible = false;
    cam(V(2.6, lerp(0.5, 1.2, k), 2.6), V(2.0, lerp(2.5, 1.5, k), lerp(1.6, 1.0, k)));
    placeYou(2.1, 0.94, 2.4, -60); you.pose(P.look(t, -20)); you.setExpr('scared'); you.setPhone('light');
  }, ui: (g, t) => clueCard(g, t, ww('clue', 'only') - 0.1, cB + 0.1) });
  // ===== 10. two options: under the bed, or out the window — then the key turns by itself =====
  const oA = cB, end = T.duration, unlockT = L('what').end + 0.25;
  cue(ww('opts', 'two'), 'card', 0.7); cue(ww('opts', 'hide'), 'pop', 0.8); cue(ww('opts', 'climb'), 'pop', 0.8); cue(ww('what', 'what'), 'sting', 0.6);
  cue(unlockT, 'unlock', 1.1); cue(unlockT + 0.6, 'doorcreak', 0.9); cue(end - 1.1, 'hiss', 0.6); cue(ww('cta', 'comment'), 'like', 0.7); cue(ww('cta', 'follow,'), 'follow', 0.9);
  S.push({ a: oA, b: end + 0.1, fade: 0.3, set: 'A', go: t => {
    const k = eio(inv(oA, unlockT, t)), turnBack = ss(unlockT - 0.1, unlockT + 0.3, t), open = ss(unlockT + 0.6, end - 0.4, t);
    cam(V(lerp(0.9, 0.8, k), 1.75, 3.62).add(shake(t, 0.008)), V(lerp(2.5, 0.25, turnBack), lerp(0.8, 1.75, turnBack), lerp(0.9, 3.1, turnBack)), 0, 70);
    A.key.rotation.x = Math.PI / 2 * (1 - ss(unlockT, unlockT + 0.4, t)); A.door.rotation.y = open * 0.55;
    const look = t < ww('opts', 'climb') ? 35 : (t < unlockT ? -35 : 80);
    placeYou(2.2, 0.94, 2.1, lerp(180, 200, k)); you.pose(P.look(t, look * (1 - turnBack) + turnBack * 90)); you.setExpr('terror'); you.setPhone('light');
    // two black eyes high up in the dark door gap at the very end
    crawl.G.visible = open > 0.3; if (crawl.G.visible) { const st = { pos: V(-0.8, 2.05, 3.1), heading: Math.PI / 2, anchors: [V(-0.4, 2.5, 2.8), V(-0.4, 2.5, 3.5), V(-1.2, 2.5, 2.8), V(-1.2, 2.5, 3.5)], t, curl: true, headPos: V(-0.12, lerp(2.3, 1.95, open), 3.22), headLook: camera.position.clone(), tilt: 0.25 }; crawl.update(st); }
  }, ui: (g, t) => {
    optionCard(g, t, ww('opts', 'hide') - 0.05, end + 1, 'A', 'HIDE UNDER THE BED', 230, '#3ea0ff');
    optionCard(g, t, ww('opts', 'climb') - 0.05, end + 1, 'B', 'OUT THE WINDOW', 350, '#ff9a3e');
    if (t > ww('what', 'what') - 0.05 && t < L('cta').start - 0.1) bigWord(g, t, ww('what', 'what') - 0.05, L('cta').start - 0.2, 'WHAT DO YOU DO?', '#ffffff', 620, 92);
    if (t > L('cta').start - 0.1) cta(g, t);
  } });
  SHOTS = S;
  crawl.G.visible = false; fingers.visible = false;
}
// ---------------- 2D overlays ----------------
function timeChip(g, t, t0, text) { if (t < t0) return; const k = popK(t, t0, 0.3), out = 1 - ss(3.2, 3.6, t); if (out <= 0) return; g.save(); g.globalAlpha = out; g.translate(W / 2, 230); g.scale(k, k); rr(g, -140, -46, 280, 92, 22); g.fillStyle = 'rgba(8,8,12,0.75)'; g.fill(); g.fillStyle = '#fff'; g.font = '900 56px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3); g.restore(); }
function phonePop(g, t, t0, t1) { if (t < t0 || t > t1 + 0.3) return; const k = popK(t, t0, 0.35), out = 1 - ss(t1, t1 + 0.3, t);
  g.save(); g.globalAlpha = out; g.translate(W / 2, 420); g.scale(k, k); rr(g, -400, -80, 800, 160, 34); g.fillStyle = 'rgba(28,30,38,0.95)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#5ac8fa'; ell(g, -320, -10, 42, 42); g.fill(); g.fillStyle = '#fff'; g.font = '900 40px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('M', -320, -8);
  g.textAlign = 'left'; g.font = '900 40px Inter'; g.fillText('Mom', -250, -32); g.font = '900 34px Inter'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillText("we're staying at grandma's tonight ❤️", -250, 22); g.restore(); }
function clueCard(g, t, t0, t1) { if (t < t0 || t > t1 + 0.3) return; const k = popK(t, t0, 0.35), out = 1 - ss(t1, t1 + 0.3, t);
  g.save(); g.globalAlpha = out; g.translate(W / 2, 330); g.scale(k, k); rr(g, -400, -120, 800, 240, 32); g.fillStyle = 'rgba(10,10,14,0.88)'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#ffd23f'; g.stroke();
  rr(g, -110, -158, 220, 74, 22); g.fillStyle = '#ffd23f'; g.fill(); g.fillStyle = '#111'; g.font = '900 46px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CLUE', 0, -119);
  g.fillStyle = '#fff'; g.font = '900 54px Inter'; g.fillText('ONLY ON THE CEILING', 0, -18); if (t > WDW('clue', 'never') - 0.05) { const k2 = popK(t, WDW('clue', 'never') - 0.05, 0.3); g.save(); g.scale(k2, k2); g.fillStyle = '#ff5236'; g.fillText('NEVER LOOKS DOWN', 0, 62); g.restore(); } g.restore(); }
function optionCard(g, t, t0, t1, letter, text, y, col) { if (t < t0 || t > t1) return; const k = popK(t, t0, 0.35);
  g.save(); g.translate(W / 2, y); g.scale(k, k); g.font = '900 52px Inter'; const tw = g.measureText(text).width, pw = tw + 170;
  rr(g, -pw / 2, -52, pw, 104, 30); g.fillStyle = 'rgba(8,8,12,0.86)'; g.fill(); g.lineWidth = 6; g.strokeStyle = col; g.stroke();
  ell(g, -pw / 2 + 56, 0, 36, 36); g.fillStyle = col; g.fill(); g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 50px Inter'; g.fillText(letter, -pw / 2 + 56, 3);
  g.fillStyle = '#fff'; g.font = '900 52px Inter'; g.fillText(text, 45, 4); g.restore(); }
function cta(g, t) { const c0 = LN('cta').start, cm = WDW('cta', 'comment'), fol = WDW('cta', 'follow,');
  bigWord(g, t, c0 - 0.05, T.duration + 1, 'A OR B?', '#ffd23f', 560, 120);
  if (t > cm) { const k = popK(t, cm, 0.35); g.save(); g.translate(W / 2 - 170, 720); g.scale(k, k); rr(g, -120, -55, 240, 110, 30); g.fillStyle = '#fff'; g.fill(); poly(g, [[-60, 50], [-20, 50], [-75, 90]]); g.fill(); g.fillStyle = '#111'; g.font = '900 44px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💬 A/B', 0, 3); g.restore(); }
  if (t > fol) { const k = popK(t, fol, 0.35); g.save(); g.translate(W / 2 + 160, 720); g.scale(k, k); rr(g, -150, -55, 300, 110, 30); g.fillStyle = '#fe2c55'; g.fill(); g.fillStyle = '#fff'; g.font = '900 50px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ FOLLOW', 0, 3); g.restore(); }
  if (t > fol + 0.4) { const k = popK(t, fol + 0.4, 0.35); g.save(); g.translate(W / 2, 860); g.scale(k, k); rr(g, -220, -46, 440, 92, 24); g.fillStyle = 'rgba(8,8,12,0.88)'; g.fill(); g.strokeStyle = '#c4161c'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = '900 46px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NEXT NIGHT SOON', 0, 3); g.restore(); }
}
// ---------------- frame compositor ----------------
let MAIN = null;
function renderShot(s, t) {
  crawl.G.visible = false; fingers.visible = false; pov.visible = false; flash.intensity = 0; A.door.rotation.y = 0; A.key.rotation.x = 0; you.root.visible = true;
  showSet(s.set); you.root.visible = s.set === 'A' ? true : false;
  s.go(t);
  // living details: curtains breathe, lamp warmth
  A.curtains.forEach((c, i) => { const p = c.geometry.attributes.position, b = c.userData.base; for (let j = 0; j < p.count; j++) { const x = b[j * 3], y = b[j * 3 + 1]; p.setZ(j, Math.sin(x * 14 + i) * 0.035 + Math.sin(t * 0.9 + y * 2 + i) * 0.012 * (1 - (y + 1.07) / 2.15)); } p.needsUpdate = true; c.geometry.computeVertexNormals(); });
  effect.render(scene, camera);
}
function renderFrame(t) {
  if (!MAIN) MAIN = document.getElementById('c'); const g = MAIN.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const act = SHOTS.filter(s => t >= s.a - s.fade && t < s.b + 1e-6);
  act.forEach((s, i) => { renderShot(s, t); const k = i === 0 ? 1 : (s.fade > 0 ? ss(s.a - s.fade, s.a, t) : 1); g.save(); g.globalAlpha = k; g.drawImage(renderer.domElement, 0, 0); g.restore(); });
  vignette(g, 0.6);
  const top = act[act.length - 1]; if (top && top.ui) top.ui(g, t);
  captions(g, t);
}
window.init = async timing => { T = timing; await document.fonts.load('900 60px Inter'); setup(); build(); renderFrame(0.1); return { cues: CUES, dur: T.duration }; };
window.frameJPG = (t, q) => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', q || 0.93); };
window.ready = true;

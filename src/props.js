// Small procedural props for the themed days (balloons, keys, houses, pool toys...).
import * as THREE from 'three';
import { add, gradient, SPHERE, CYL, PINK } from './models.js';
import { textures } from './fx.js';

const CONE = new THREE.ConeGeometry(1, 1, 16);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const GOLD = 0xffcf3f;

export function makeGlow(color, size) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: textures.glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })
  );
  s.scale.set(size, size, 1);
  return s;
}

// origin at the end of the string; the balloon floats about 1.9 above
export function makeBalloon(color) {
  const root = new THREE.Group();
  add(root, CYL, 0xffffff, [0, 0.7, 0], [0.012, 1.4, 0.012]).castShadow = false;
  const b = add(root, SPHERE, color, [0, 1.95, 0], [0.5, 0.62, 0.5]);
  add(root, CONE, color, [0, 1.3, 0], [0.09, 0.12, 0.09]).rotation.x = Math.PI;
  add(root, SPHERE, 0xffffff, [-0.17, 2.15, 0.28], [0.08, 0.14, 0.04]).castShadow = false;
  root.userData.body = b;
  return root;
}

export function makeKey() {
  const root = new THREE.Group();
  const ring = add(root, new THREE.TorusGeometry(0.22, 0.07, 10, 20), GOLD, [0, 0.55, 0]);
  add(root, CYL, GOLD, [0, 0.18, 0], [0.06, 0.55, 0.06]);
  add(root, BOX, GOLD, [0.12, 0.02, 0], [0.2, 0.08, 0.08]);
  add(root, BOX, GOLD, [0.1, 0.14, 0], [0.16, 0.08, 0.08]);
  root.userData.ring = ring;
  return root;
}

export function makeOrnament(color) {
  const root = new THREE.Group();
  add(root, SPHERE, color, [0, 0, 0], 0.22);
  add(root, CYL, GOLD, [0, 0.22, 0], [0.07, 0.07, 0.07]);
  add(root, SPHERE, 0xffffff, [-0.08, 0.08, 0.17], [0.05, 0.08, 0.03]).castShadow = false;
  return root;
}

export function makeChest() {
  const root = new THREE.Group();
  add(root, BOX, 0x9b5de5, [0, 0.45, 0], [1.6, 0.9, 1.0]);
  const lid = add(root, new THREE.CylinderGeometry(0.5, 0.5, 1.6, 16, 1, false, 0, Math.PI), 0xb983ff, [0, 0.9, 0]);
  lid.rotation.set(0, 0, Math.PI / 2);
  lid.rotation.order = 'XYZ';
  lid.rotation.y = Math.PI / 2;
  add(root, BOX, GOLD, [0, 0.9, 0.52], [0.22, 0.28, 0.06]);
  add(root, BOX, GOLD, [-0.55, 0.45, 0.51], [0.1, 0.92, 0.04]);
  add(root, BOX, GOLD, [0.55, 0.45, 0.51], [0.1, 0.92, 0.04]);
  return root;
}

// a cottage with a glowing window and a door facing +z
export function makeHouse(wall = 0xffd6a5, roof = 0xff6b35) {
  const root = new THREE.Group();
  add(root, BOX, wall, [0, 1.1, 0], [3.2, 2.2, 2.8]);
  const r = add(root, CONE, roof, [0, 3.0, 0], [2.7, 1.7, 2.7]);
  r.rotation.y = Math.PI / 4;
  add(root, BOX, 0x6b4226, [0.85, 0.95, 1.41], [0.9, 1.5, 0.08]);
  add(root, SPHERE, GOLD, [1.12, 0.95, 1.48], 0.06);
  const win = add(root, BOX, new THREE.MeshBasicMaterial({ color: 0xffd45e }), [-0.8, 1.35, 1.42], [0.75, 0.75, 0.06]);
  win.castShadow = false;
  add(root, BOX, 0xffffff, [-0.8, 1.35, 1.44], [0.08, 0.8, 0.04]);
  add(root, BOX, 0xffffff, [-0.8, 1.35, 1.44], [0.8, 0.08, 0.04]);
  add(root, BOX, wall, [-0.9, 3.0, -0.5], [0.4, 1.0, 0.4]);
  const glow = makeGlow(0xffc857, 2.2);
  glow.position.set(-0.8, 1.35, 1.9);
  root.add(glow);
  root.userData.doorPos = new THREE.Vector3(0.85, 0, 1.6);
  return root;
}

export function makeHauntedHouse() {
  const root = new THREE.Group();
  const dark = 0x5a4a7a;
  add(root, BOX, dark, [0, 2.2, 0], [6.5, 4.4, 4.5]);
  add(root, BOX, 0x6d5a91, [-3.2, 3.6, 0.6], [2.0, 7.2, 2.0]);
  const t = add(root, CONE, 0x3a2a5c, [-3.2, 8.4, 0.6], [2.5, 2.8, 2.5]);
  t.rotation.y = 0.5;
  const roof = add(root, CONE, 0x3a2a5c, [0.8, 5.7, 0], [4.8, 2.4, 3.6]);
  roof.rotation.y = Math.PI / 4;
  const winMat = new THREE.MeshBasicMaterial({ color: 0xb8ff6b });
  for (const [x, y] of [[-1.3, 2.9], [1.5, 2.9], [-3.2, 5.2]]) {
    const w = add(root, BOX, winMat, [x, y, x < -3 ? 1.65 : 2.28], [0.8, 1.0, 0.06]);
    w.castShadow = false;
    const g = makeGlow(0xb8ff6b, 3);
    g.position.set(x, y, 2.6);
    root.add(g);
  }
  add(root, BOX, 0x2d2147, [0.1, 1.2, 2.28], [1.3, 2.4, 0.08]);
  root.userData.doorPos = new THREE.Vector3(0.1, 0, 3.4);
  return root;
}

export function makePartyHat(color = 0xff5fae) {
  const root = new THREE.Group();
  const cone = add(root, CONE, color, [0, 0.3, 0], [0.22, 0.6, 0.22]);
  add(root, CYL, 0xffe35a, [0, 0.14, 0], [0.225, 0.05, 0.225]);
  add(root, CYL, 0xffe35a, [0, 0.36, 0], [0.14, 0.05, 0.14]);
  add(root, SPHERE, 0xffffff, [0, 0.62, 0], 0.07);
  return root;
}

// ---- pool toys
export function makeDuck() {
  const root = new THREE.Group();
  add(root, SPHERE, 0xffe14d, [0, 0.35, 0], [0.45, 0.35, 0.55]);
  add(root, SPHERE, 0xffe14d, [0, 0.8, 0.3], 0.28);
  add(root, CONE, 0xff8a1f, [0, 0.76, 0.58], [0.1, 0.2, 0.1]).rotation.x = Math.PI / 2;
  add(root, SPHERE, 0x2b2236, [-0.1, 0.88, 0.5], 0.035);
  add(root, SPHERE, 0x2b2236, [0.1, 0.88, 0.5], 0.035);
  add(root, SPHERE, 0xffd21f, [0.3, 0.45, -0.1], [0.12, 0.2, 0.3]);
  add(root, SPHERE, 0xffd21f, [-0.3, 0.45, -0.1], [0.12, 0.2, 0.3]);
  return root;
}

export function makeSwimRing() {
  const root = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const seg = add(root, new THREE.TorusGeometry(0.5, 0.17, 10, 8, Math.PI / 4), i % 2 ? 0xffffff : 0xff4d6d, [0, 0.25, 0]);
    seg.rotation.set(Math.PI / 2, 0, a);
  }
  return root;
}

export function makeBeachBall() {
  const root = new THREE.Group();
  const colors = [0xff4d6d, 0xffe14d, 0x4dc9ff, 0xffffff, 0x7be37a, 0xb48cff];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.SphereGeometry(0.5, 12, 10, (i / 6) * Math.PI * 2, Math.PI / 3);
    const m = add(root, g, new THREE.MeshToonMaterial({ color: colors[i], side: THREE.DoubleSide, gradientMap: gradient }), [0, 0.5, 0]);
  }
  return root;
}

export function makeFlamingo() {
  const root = new THREE.Group();
  add(root, SPHERE, PINK, [0, 0.4, 0], [0.5, 0.38, 0.65]);
  add(root, CYL, PINK, [0, 0.95, 0.35], [0.07, 0.9, 0.07]).rotation.x = -0.3;
  add(root, SPHERE, PINK, [0, 1.4, 0.55], 0.17);
  add(root, CONE, 0x2b2236, [0, 1.38, 0.75], [0.06, 0.18, 0.06]).rotation.x = Math.PI / 2;
  add(root, SPHERE, 0xffffff, [0.08, 1.45, 0.66], 0.03);
  add(root, SPHERE, 0xffffff, [-0.08, 1.45, 0.66], 0.03);
  return root;
}

export function makeUmbrella(color = 0xff5fae) {
  const root = new THREE.Group();
  add(root, CYL, 0xffffff, [0, 1.5, 0], [0.05, 3.0, 0.05]);
  const top = add(root, new THREE.ConeGeometry(1.8, 0.7, 8, 1, true), color, [0, 3.2, 0]);
  top.material = new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide, gradientMap: gradient });
  add(root, SPHERE, 0xffffff, [0, 3.58, 0], 0.1);
  return root;
}

export function makeLounger(color = 0xffffff) {
  const root = new THREE.Group();
  add(root, BOX, color, [0, 0.45, 0], [1.0, 0.18, 2.2]);
  const back = add(root, BOX, color, [0, 0.9, -0.95], [1.0, 0.18, 1.0]);
  back.rotation.x = -0.9;
  for (const x of [-0.4, 0.4]) for (const z of [-0.9, 0.9]) add(root, CYL, 0xcccccc, [x, 0.2, z], [0.04, 0.4, 0.04]);
  return root;
}

// ---- winter
export function makeSnowBall(r = 0.6) {
  const root = new THREE.Group();
  add(root, SPHERE, 0xffffff, [0, r, 0], r);
  return root;
}

export function makeBat() {
  const root = new THREE.Group();
  add(root, SPHERE, 0x2b2236, [0, 0, 0], [0.12, 0.12, 0.16]).castShadow = false;
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    const m = add(w, new THREE.CylinderGeometry(0.0, 0.3, 0.02, 3), 0x2b2236, [s * 0.22, 0, 0]);
    m.rotation.set(0, 0, Math.PI / 2 * s);
    m.scale.set(1, 1, 1.2);
    m.castShadow = false;
    root.add(w);
    wings.push(w);
  }
  root.userData.wings = wings;
  return root;
}

// A cube-style unicorn: white body, golden horn, rainbow mane and tail. Faces +z.
export function makeUnicorn() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const WHITE = 0xfff7fb;
  const RAINBOW = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0xb197fc];
  add(body, SPHERE, WHITE, [0, 1.25, 0], [0.55, 0.6, 1.0]);
  const neck = add(body, CYL, WHITE, [0, 1.75, 0.75], [0.26, 0.9, 0.26]);
  neck.rotation.x = 0.55;
  const head = new THREE.Group();
  head.position.set(0, 2.15, 1.1);
  body.add(head);
  add(head, SPHERE, WHITE, [0, 0, 0], [0.3, 0.3, 0.38]);
  add(head, SPHERE, 0xffd6ea, [0, -0.13, 0.33], [0.2, 0.17, 0.2]);
  add(head, SPHERE, 0x2b2236, [-0.2, 0.07, 0.17], [0.045, 0.06, 0.03]);
  add(head, SPHERE, 0x2b2236, [0.2, 0.07, 0.17], [0.045, 0.06, 0.03]);
  for (const sx of [-1, 1]) add(head, CONE, WHITE, [sx * 0.15, 0.36, -0.05], [0.08, 0.2, 0.06]);
  const horn = add(head, CONE, 0xffe9a8, [0, 0.55, 0.12], [0.1, 0.55, 0.1]);
  horn.rotation.x = 0.25;
  RAINBOW.forEach((c, i) => {
    add(body, SPHERE, c, [0, 2.05 - i * 0.15, 0.55 - i * 0.2], [0.13, 0.2, 0.18]);
    add(body, SPHERE, c, [0, 1.45 - i * 0.12, -1.0 - i * 0.07], [0.15, 0.18, 0.18]);
  });
  const legs = [];
  for (const [x, z] of [[-0.3, 0.6], [0.3, 0.6], [-0.3, -0.6], [0.3, -0.6]]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.95, z);
    add(leg, CYL, WHITE, [0, -0.4, 0], [0.11, 0.85, 0.11]);
    add(leg, SPHERE, 0xffd6ea, [0, -0.85, 0.02], [0.13, 0.08, 0.14]);
    body.add(leg);
    legs.push(leg);
  }
  root.userData.animate = (t, run) => {
    const sw = Math.sin(t * 11) * 0.7 * run;
    legs[0].rotation.x = sw;
    legs[3].rotation.x = sw;
    legs[1].rotation.x = -sw;
    legs[2].rotation.x = -sw;
    body.position.y = Math.abs(Math.sin(t * 11)) * 0.12 * run;
    head.rotation.x = Math.sin(t * 1.6) * 0.06;
  };
  root.scale.setScalar(0.85);
  return root;
}

// ---- ballet bits
export function makeBalletShoes() {
  const root = new THREE.Group();
  for (const sx of [-1, 1]) {
    add(root, SPHERE, 0xffb3d1, [sx * 0.2, 0.1, 0], [0.13, 0.09, 0.28]);
    add(root, SPHERE, 0xffd6e8, [sx * 0.2, 0.14, 0.2], [0.1, 0.07, 0.1]);
    const r = add(root, new THREE.TorusGeometry(0.12, 0.012, 6, 14), 0xff7ab5, [sx * 0.2, 0.18, -0.05]);
    r.rotation.x = Math.PI / 2;
  }
  return root;
}

export function makeTutu() {
  const root = new THREE.Group();
  [[0.5, 0.14, 0xffb3d9], [0.4, 0.2, 0xffffff], [0.3, 0.26, 0xff8fc7]].forEach(([r, y, c], i) => add(root, CYL, c, [0, y + i * 0.05, 0], [r, 0.05, r]));
  add(root, CYL, 0xffd23f, [0, 0.4, 0], [0.18, 0.12, 0.18]);
  return root;
}

export function makeRibbon() {
  const root = new THREE.Group();
  const loop = add(root, new THREE.TorusGeometry(0.2, 0.05, 8, 18), 0xff5fae, [0, 0.3, 0]);
  loop.rotation.x = Math.PI / 2;
  add(root, BOX, 0xff5fae, [-0.08, 0.15, 0.1], [0.07, 0.4, 0.03]).rotation.z = 0.3;
  add(root, BOX, 0xff5fae, [0.08, 0.15, 0.1], [0.07, 0.4, 0.03]).rotation.z = -0.3;
  return root;
}

// ---- circus + camp
export function makeBall(color) {
  const root = new THREE.Group();
  add(root, SPHERE, color, [0, 0.3, 0], 0.3);
  add(root, SPHERE, 0xffffff, [-0.1, 0.42, 0.22], [0.06, 0.08, 0.03]).castShadow = false;
  return root;
}

export function makeTent(color = 0xff8fc7, stripe = 0xffffff) {
  const root = new THREE.Group();
  const body = add(root, new THREE.ConeGeometry(1, 1, 4), color, [0, 1.1, 0], [2.0, 2.2, 1.6]);
  body.rotation.y = Math.PI / 4;
  body.scale.set(2.3, 2.2, 1.7);
  add(root, BOX, 0x2b2236, [0, 0.6, 1.0], [0.8, 1.2, 0.05]);
  add(root, SPHERE, stripe, [0, 2.3, 0], 0.12);
  return root;
}

export function makeLog() {
  const root = new THREE.Group();
  const l = add(root, CYL, 0x8a5a33, [0, 0.12, 0], [0.12, 0.9, 0.12]);
  l.rotation.z = Math.PI / 2;
  add(root, CYL, 0xc99a6b, [0.44, 0.12, 0], [0.12, 0.02, 0.12]).rotation.z = Math.PI / 2;
  return root;
}

export function makeSnowflake() {
  const root = new THREE.Group();
  const m = add(root, new THREE.OctahedronGeometry(0.35), new THREE.MeshBasicMaterial({ color: 0xeaf7ff }), [0, 0, 0]);
  m.scale.set(1, 1.4, 0.45);
  const m2 = add(root, new THREE.OctahedronGeometry(0.35), new THREE.MeshBasicMaterial({ color: 0xbfe3ff }), [0, 0, 0]);
  m2.scale.set(1.4, 1, 0.45);
  const gl = makeGlow(0xcfeaff, 2.4);
  root.add(gl);
  return root;
}

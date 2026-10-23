// Procedural low-poly models built from primitives (placeholder art: swap for glTF later).
import * as THREE from 'three';

export const gradient = (() => {
  const data = new Uint8Array([120, 175, 228, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const mats = new Map();
export function mat(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });
    mats.set(key, m);
  }
  return m;
}

export const SPHERE = new THREE.SphereGeometry(1, 24, 16);
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 24);
const CONE = new THREE.ConeGeometry(1, 1, 16);
const BOX = new THREE.BoxGeometry(1, 1, 1);

// add(parent, geometry, color, [x,y,z], [sx,sy,sz])
export function add(parent, geo, color, pos = [0, 0, 0], scale = [1, 1, 1], extra) {
  const m = new THREE.Mesh(geo, color instanceof THREE.Material ? color : mat(color, extra));
  m.position.set(...pos);
  m.scale.set(...(typeof scale === 'number' ? [scale, scale, scale] : scale));
  m.castShadow = true;
  parent.add(m);
  return m;
}
const ball = (p, c, pos, s) => add(p, SPHERE, c, pos, typeof s === 'number' ? [s, s, s] : s);

export const PINK = 0xff8fc7;
export const DEEP_PINK = 0xff5fae;
const SKIN = 0xffd9bf;
const GOLD = 0xffcf3f;

// ---------------------------------------------------------------- princess
export const DRESSES = [
  { main: 0xff8fc7, deep: 0xff5fae },
  { main: 0xc9a6ff, deep: 0x9a62f5 },
  { main: 0x8fd4ff, deep: 0x3fa9f5 },
  { main: 0xffe08a, deep: 0xffb81c },
  { main: 0x9ceac4, deep: 0x3ccf91 },
  { main: 0xff9a9a, deep: 0xe84545 },
  { main: 0xffb066, deep: 0xf06a14 },
  { main: 0x8a6bd1, deep: 0x4b2f8f },
];
export const CROWN_ICONS = ['👑', '💎', '🌸', '🎀', '🧙', '🐱'];

export function makePrincess(outfit = { dress: 0, crown: 0 }) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // outfit colours get their own materials so changing them never touches the shared cache
  const dressMat = mat(PINK).clone();
  const deepMat = mat(DEEP_PINK).clone();

  // dress
  add(body, new THREE.CylinderGeometry(0.24, 0.6, 0.85, 28), dressMat, [0, 0.78, 0]);
  const trim = add(body, new THREE.TorusGeometry(0.6, 0.045, 10, 36), 0xffffff, [0, 0.37, 0]);
  trim.rotation.x = Math.PI / 2;
  add(body, new THREE.CylinderGeometry(0.2, 0.26, 0.3, 24), deepMat, [0, 1.28, 0]);
  ball(body, GOLD, [0, 1.1, 0.25], 0.045); // belt gem

  // head
  const head = new THREE.Group();
  head.position.set(0, 1.7, 0);
  body.add(head);
  ball(head, SKIN, [0, 0, 0], [0.33, 0.33, 0.31]);
  ball(head, 0xf5b83d, [0, -0.02, -0.1], [0.37, 0.4, 0.34]); // back hair
  ball(head, 0xf5b83d, [0, 0.15, 0.1], [0.33, 0.2, 0.28]); // fringe
  for (const s of [-1, 1]) {
    ball(head, 0xf5b83d, [s * 0.34, -0.15, -0.05], [0.13, 0.22, 0.13]); // pigtails
    ball(head, deepMat, [s * 0.3, 0.0, -0.03], 0.06); // ribbons
    ball(head, 0x2b2236, [s * 0.11, -0.01, 0.29], [0.045, 0.06, 0.03]); // eyes
    ball(head, 0xffffff, [s * 0.1 + 0.015, 0.02, 0.315], 0.014);
    ball(head, 0xff9aa8, [s * 0.2, -0.1, 0.25], [0.07, 0.045, 0.03]); // cheeks
  }
  const smile = add(head, new THREE.TorusGeometry(0.07, 0.012, 8, 16, Math.PI), 0xd9566f, [0, -0.1, 0.3]);
  smile.rotation.z = Math.PI;

  // headwear: four styles, one visible at a time
  const crowns = [];
  const crown = new THREE.Group();
  crown.position.set(0, 0.37, 0.02);
  crown.rotation.x = -0.12;
  add(crown, new THREE.CylinderGeometry(0.2, 0.17, 0.1, 18), GOLD, [0, 0, 0]);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    add(crown, CONE, GOLD, [Math.cos(a) * 0.18, 0.11, Math.sin(a) * 0.18], [0.05, 0.14, 0.05]);
    ball(crown, 0xffffff, [Math.cos(a) * 0.18, 0.2, Math.sin(a) * 0.18], 0.025);
  }
  ball(crown, deepMat, [0, 0, 0.19], 0.04);
  crowns.push(crown);

  const tiara = new THREE.Group();
  tiara.position.set(0, 0.22, 0.12);
  tiara.rotation.x = 0.2;
  const band = add(tiara, new THREE.TorusGeometry(0.27, 0.025, 8, 24, Math.PI), 0xe8eefc, [0, 0, 0]);
  band.rotation.z = 0;
  const gem = add(tiara, new THREE.OctahedronGeometry(0.08), 0x8fe3ff, [0, 0.3, 0]);
  gem.scale.set(1, 1.4, 0.6);
  for (const s of [-1, 1]) ball(tiara, 0xffffff, [s * 0.19, 0.19, 0], 0.035);
  crowns.push(tiara);

  const flowers = new THREE.Group();
  flowers.position.set(0, 0.28, 0);
  const petal = [0xffffff, 0xffc2e0, 0xffe35a, 0xc9a6ff];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const f = new THREE.Group();
    f.position.set(Math.cos(a) * 0.27, 0, Math.sin(a) * 0.27);
    ball(f, petal[i % 4], [0, 0, 0], 0.07);
    ball(f, 0xffe35a, [0, 0.03, 0], 0.03);
    ball(f, 0x5cc45f, [Math.cos(a) * 0.05, -0.04, Math.sin(a) * 0.05], [0.05, 0.02, 0.05]);
    flowers.add(f);
  }
  crowns.push(flowers);

  const bow = new THREE.Group();
  bow.position.set(0.18, 0.34, 0.08);
  bow.rotation.z = -0.3;
  for (const s of [-1, 1]) ball(bow, deepMat, [s * 0.1, 0, 0], [0.11, 0.08, 0.04]);
  ball(bow, 0xffffff, [0, 0, 0.02], 0.045);
  crowns.push(bow);

  // Halloween costume pieces
  const witch = new THREE.Group();
  witch.position.set(0, 0.3, 0);
  add(witch, CYL, 0x3a2a5c, [0, 0, 0], [0.46, 0.04, 0.46]);
  const cone = add(witch, CONE, 0x4b3678, [0, 0.33, 0], [0.27, 0.66, 0.27]);
  cone.rotation.z = -0.12;
  add(witch, CYL, 0xff8a3d, [0, 0.07, 0], [0.275, 0.07, 0.275]);
  add(witch, new THREE.BoxGeometry(0.1, 0.1, 0.03), GOLD, [0, 0.07, 0.275]);
  crowns.push(witch);

  const cat = new THREE.Group();
  cat.position.set(0, 0.3, 0);
  const band2 = add(cat, new THREE.TorusGeometry(0.3, 0.03, 8, 20, Math.PI), 0x2b2236, [0, -0.02, 0]);
  band2.rotation.set(0, 0, 0);
  for (const sx of [-1, 1]) {
    const ear = add(cat, CONE, 0x2b2236, [sx * 0.2, 0.17, 0], [0.11, 0.26, 0.09]);
    ear.rotation.z = -sx * 0.25;
    const inner = add(cat, CONE, 0xff9ac7, [sx * 0.2, 0.15, 0.03], [0.06, 0.16, 0.05]);
    inner.rotation.z = -sx * 0.25;
  }
  crowns.push(cat);
  crowns.forEach((c) => head.add(c));

  // arms + legs pivot from shoulder / hip
  const arms = [];
  const legs = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.27, 1.32, 0);
    body.add(arm);
    ball(arm, dressMat, [0, 0, 0], 0.1);
    add(arm, CYL, SKIN, [0, -0.22, 0], [0.05, 0.4, 0.05]);
    ball(arm, SKIN, [0, -0.45, 0], 0.065);
    arms.push(arm);

    const leg = new THREE.Group();
    leg.position.set(s * 0.1, 0.4, 0);
    body.add(leg);
    add(leg, CYL, 0xffffff, [0, -0.15, 0], [0.045, 0.3, 0.045]);
    ball(leg, deepMat, [0, -0.32, 0.03], [0.07, 0.045, 0.1]);
    legs.push(leg);
  }

  root.scale.setScalar(0.8);

  root.userData.setOutfit = (o) => {
    const d = DRESSES[o.dress % DRESSES.length];
    dressMat.color.set(d.main);
    deepMat.color.set(d.deep);
    crowns.forEach((c, i) => (c.visible = i === o.crown % crowns.length));
  };
  root.userData.setOutfit(outfit);

  let phase = 0;
  root.userData.cheering = false;
  root.userData.animate = (dt, walk, t) => {
    phase += dt * 9 * walk;
    const sw = Math.sin(phase) * 0.7 * walk;
    legs[0].rotation.x = sw;
    legs[1].rotation.x = -sw;
    if (root.userData.cheering) {
      arms[0].rotation.z = -2.5 + Math.sin(t * 12) * 0.25;
      arms[1].rotation.z = 2.5 - Math.sin(t * 12) * 0.25;
      arms[0].rotation.x = arms[1].rotation.x = 0;
      body.position.y = Math.abs(Math.sin(t * 7)) * 0.3;
    } else {
      arms[0].rotation.set(-sw * 0.9, 0, -0.12);
      arms[1].rotation.set(sw * 0.9, 0, 0.12);
      body.position.y = Math.abs(Math.sin(phase)) * 0.06 * walk + Math.sin(t * 2) * 0.008 * (1 - walk);
    }
    body.rotation.z = Math.sin(phase) * 0.04 * walk;
    head.rotation.z = Math.sin(t * 1.3) * 0.04 * (1 - walk);
  };
  return root;
}

// ------------------------------------------------------------------- teddy
export function makeTeddy() {
  const root = new THREE.Group();
  const BROWN = 0xb77a4b;
  const LIGHT = 0xe8c39a;
  ball(root, BROWN, [0, 0.55, 0], [0.5, 0.55, 0.45]);
  ball(root, LIGHT, [0, 0.5, 0.3], [0.33, 0.38, 0.2]);

  const head = new THREE.Group();
  head.position.set(0, 1.3, 0);
  root.add(head);
  ball(head, BROWN, [0, 0, 0], 0.42);
  for (const s of [-1, 1]) {
    ball(head, BROWN, [s * 0.3, 0.34, 0], 0.14);
    ball(head, LIGHT, [s * 0.3, 0.34, 0.05], 0.08);
    ball(head, 0x2b2236, [s * 0.14, 0.06, 0.37], [0.05, 0.065, 0.03]);
    ball(head, 0xff9aa8, [s * 0.26, -0.08, 0.31], [0.07, 0.045, 0.03]);
  }
  ball(head, LIGHT, [0, -0.1, 0.34], [0.2, 0.15, 0.14]);
  ball(head, 0x3b2a22, [0, -0.03, 0.46], [0.06, 0.045, 0.04]);

  // bow tie
  ball(root, DEEP_PINK, [-0.12, 0.98, 0.3], [0.12, 0.08, 0.06]);
  ball(root, DEEP_PINK, [0.12, 0.98, 0.3], [0.12, 0.08, 0.06]);
  ball(root, PINK, [0, 0.98, 0.33], 0.05);

  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.5, 0.85, 0.05);
    root.add(arm);
    ball(arm, BROWN, [0, -0.2, 0], [0.14, 0.3, 0.14]);
    arms.push(arm);
    ball(root, BROWN, [s * 0.25, 0.15, 0.35], [0.18, 0.18, 0.28]);
    ball(root, LIGHT, [s * 0.25, 0.15, 0.6], [0.1, 0.1, 0.03]);
  }

  root.scale.setScalar(0.75);
  root.userData.head = head;
  root.userData.arms = arms;
  root.userData.base = 0;
  return root;
}

// ------------------------------------------------------------------- bunny
export function makeBunny() {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  ball(inner, 0xffffff, [0, 0.3, 0], [0.3, 0.28, 0.4]);
  ball(inner, 0xffffff, [0, 0.5, 0.3], 0.22);
  ball(inner, 0xffffff, [0, 0.28, -0.4], 0.11);
  for (const s of [-1, 1]) {
    const ear = ball(inner, 0xffffff, [s * 0.09, 0.85, 0.27], [0.07, 0.3, 0.05]);
    ear.rotation.z = -s * 0.15;
    const earIn = ball(inner, 0xffb6cf, [s * 0.09, 0.85, 0.3], [0.04, 0.22, 0.03]);
    earIn.rotation.z = -s * 0.15;
    ball(inner, 0x2b2236, [s * 0.09, 0.54, 0.48], [0.03, 0.04, 0.02]);
    ball(inner, 0xffffff, [s * 0.14, 0.06, 0.2], [0.07, 0.05, 0.12]);
  }
  ball(inner, 0xff8fb0, [0, 0.48, 0.51], 0.03);
  root.userData.inner = inner;
  root.scale.setScalar(1.1);
  return root;
}

// ------------------------------------------------------------------ flower
export function makeFlower(color) {
  const root = new THREE.Group();
  add(root, CYL, 0x4caf50, [0, 0.25, 0], [0.025, 0.5, 0.025]);
  const leaf = ball(root, 0x5cc45f, [0.08, 0.2, 0], [0.12, 0.03, 0.06]);
  leaf.rotation.z = 0.4;
  const head = new THREE.Group();
  head.position.set(0, 0.52, 0);
  head.rotation.x = -0.35;
  root.add(head);
  const centre = color === 0xffe35a ? 0xff9f43 : 0xffe35a;
  ball(head, centre, [0, 0.015, 0], [0.08, 0.06, 0.08]);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ball(head, color, [Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13], [0.09, 0.04, 0.09]);
  }
  root.userData.head = head;
  return root;
}

// -------------------------------------------------------------------- tree
export function makeTree(rand = Math.random, blossom = false) {
  const root = new THREE.Group();
  add(root, CYL, 0x9b6b43, [0, 0.8, 0], [0.22, 1.6, 0.22]);
  const greens = [0x6fd06f, 0x7bd96f, 0x62c46a];
  const g = greens[(rand() * greens.length) | 0];
  ball(root, g, [0, 2.2, 0], [1.25, 1.1, 1.25]);
  ball(root, g, [0.65, 1.8, 0.3], 0.85);
  ball(root, g, [-0.55, 2.8, -0.15], 0.85);
  if (blossom) {
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      const b = rand() * 1.2 + 0.2;
      ball(root, 0xffc2e0, [Math.cos(a) * 1.15 * Math.sin(b), 2.2 + Math.cos(b) * 1.0, Math.sin(a) * 1.15 * Math.sin(b)], 0.12);
    }
  }
  return root;
}

// ------------------------------------------------------ tea-party furniture
export function makeChair() {
  const root = new THREE.Group();
  add(root, BOX, 0xffffff, [0, 0.5, 0], [0.56, 0.06, 0.56]);
  ball(root, PINK, [0, 0.56, 0], [0.26, 0.05, 0.26]);
  for (const x of [-1, 1])
    for (const z of [-1, 1]) add(root, CYL, 0xffffff, [x * 0.24, 0.24, z * 0.24], [0.03, 0.48, 0.03]);
  add(root, BOX, 0xffffff, [0, 0.85, -0.26], [0.56, 0.6, 0.05]);
  ball(root, DEEP_PINK, [0, 0.95, -0.22], [0.1, 0.1, 0.02]);
  return root;
}

export function makeTable() {
  const root = new THREE.Group();
  add(root, CYL, 0xffffff, [0, 0.45, 0], [0.18, 0.9, 0.18]);
  add(root, CYL, 0xffffff, [0, 0.04, 0], [0.7, 0.08, 0.7]);
  add(root, CYL, 0xffffff, [0, 0.92, 0], [1.25, 0.07, 1.25]);
  add(root, CYL, PINK, [0, 0.96, 0], [1.3, 0.04, 1.3]);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    ball(root, 0xffffff, [Math.cos(a) * 1.3, 0.94, Math.sin(a) * 1.3], 0.1);
  }
  return root;
}

export function makeTeapot() {
  const root = new THREE.Group();
  ball(root, 0xfff1f7, [0, 0.26, 0], [0.27, 0.23, 0.27]);
  const band = add(root, new THREE.TorusGeometry(0.265, 0.02, 8, 28), GOLD, [0, 0.28, 0]);
  band.rotation.x = Math.PI / 2;
  ball(root, PINK, [0, 0.5, 0], [0.12, 0.07, 0.12]);
  ball(root, GOLD, [0, 0.58, 0], 0.04);
  const spout = add(root, CONE, 0xfff1f7, [0.34, 0.34, 0], [0.07, 0.25, 0.07]);
  spout.rotation.z = -1.0;
  const handle = add(root, new THREE.TorusGeometry(0.12, 0.03, 8, 16), PINK, [-0.3, 0.28, 0]);
  handle.rotation.y = 0;
  return root;
}

export function makeCup() {
  const root = new THREE.Group();
  add(root, CYL, PINK, [0, 0.015, 0], [0.13, 0.03, 0.13]);
  add(root, new THREE.CylinderGeometry(0.08, 0.055, 0.1, 16), 0xffffff, [0, 0.08, 0]);
  return root;
}

export function makeCupcake(frosting = 0xffffff, plain = false) {
  const root = new THREE.Group();
  add(root, new THREE.CylinderGeometry(0.075, 0.055, 0.09, 14), DEEP_PINK, [0, 0.045, 0]);
  ball(root, 0xf3d9a4, [0, 0.1, 0], [0.08, 0.05, 0.08]); // sponge
  if (plain) return root;
  const top = new THREE.Group();
  ball(top, frosting, [0, 0.11, 0], [0.085, 0.065, 0.085]);
  ball(top, 0xff4d6d, [0, 0.18, 0], 0.025);
  root.userData.top = top;
  root.add(top);
  return root;
}

export function makeVase(flowerCount) {
  const root = new THREE.Group();
  add(root, new THREE.CylinderGeometry(0.1, 0.07, 0.24, 16), 0xcdeeff, [0, 0.12, 0]);
  for (let i = 0; i < flowerCount; i++) {
    const f = makeFlower(PINK);
    const a = (i / Math.max(flowerCount, 1)) * Math.PI * 2;
    f.position.set(0, 0.2, 0);
    f.rotation.set(Math.sin(a) * 0.35, 0, Math.cos(a) * 0.35);
    f.scale.setScalar(0.7);
    root.add(f);
  }
  return root;
}

// ---------------------------------------------------------------- scenery
export function makeCloud() {
  const root = new THREE.Group();
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  for (const [x, y, s] of [[0, 0, 2.2], [2, -0.2, 1.7], [-2, -0.3, 1.6], [0.8, 0.8, 1.5]])
    add(root, SPHERE, white, [x, y, 0], [s, s * 0.75, s]).castShadow = false;
  return root;
}

export function makeButterfly(color) {
  const root = new THREE.Group();
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    root.add(w);
    const m = ball(w, color, [s * 0.1, 0, 0], [0.11, 0.015, 0.09]);
    m.castShadow = false;
    wings.push(w);
  }
  ball(root, 0x5b4a6a, [0, 0, 0], [0.025, 0.025, 0.09]).castShadow = false;
  root.userData.wings = wings;
  return root;
}

export function makeCastle() {
  const root = new THREE.Group();
  const WALL = 0xfff0f6;
  add(root, BOX, WALL, [0, 3, 0], [8, 6, 4]);
  for (const [x, h] of [[-5, 9], [5, 9], [0, 11]]) {
    add(root, CYL, WALL, [x, h / 2, 0], [1.6, h, 1.6]);
    add(root, CONE, DEEP_PINK, [x, h + 1.6, 0], [2.1, 3.2, 2.1]);
    ball(root, GOLD, [x, h + 3.4, 0], 0.25);
  }
  add(root, BOX, 0xb77a4b, [0, 1.4, 2.02], [1.8, 2.8, 0.1]);
  return root;
}

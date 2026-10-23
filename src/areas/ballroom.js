import * as THREE from 'three';
import { add, mat, CYL, SPHERE, PINK } from '../models.js';
import { textures } from '../fx.js';
import { buildRoom, checkerMat, put, windowPane } from './room.js';

const GOLD = 0xffcf3f;

function glow(color, size) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: textures.star, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })
  );
  s.scale.set(size, size, 1);
  return s;
}

function makeCandelabra() {
  const root = new THREE.Group();
  add(root, CYL, GOLD, [0, 0.08, 0], [0.55, 0.16, 0.55]);
  add(root, CYL, GOLD, [0, 1.2, 0], [0.09, 2.2, 0.09]);
  const flames = [];
  for (const dx of [-0.55, 0, 0.55]) {
    if (dx !== 0) {
      add(root, CYL, GOLD, [dx * 0.5, 2.0, 0], [0.05, 0.05, 0.05]).scale.set(Math.abs(dx) * 0.5, 0.05, 0.05);
    }
    add(root, new THREE.CylinderGeometry(0.13, 0.13, 0.5, 12), 0xfff6e8, [dx, 2.45 + (dx ? -0.15 : 0.1), 0]);
    const f = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: 0xffb347 }));
    f.scale.set(0.09, 0.16, 0.09);
    f.position.set(dx, 2.85 + (dx ? -0.15 : 0.1), 0);
    f.visible = false;
    root.add(f);
    flames.push(f);
  }
  const halo = glow(0xffd27a, 3.2);
  halo.position.set(0, 2.8, 0);
  halo.visible = false;
  root.add(halo);
  root.userData.lit = false;
  root.userData.light = () => {
    root.userData.lit = true;
    flames.forEach((f) => (f.visible = true));
    halo.visible = true;
  };
  root.userData.update = (t) => {
    if (!root.userData.lit) return;
    flames.forEach((f, i) => f.scale.set(0.09, 0.16 + Math.sin(t * 12 + i * 2) * 0.025, 0.09));
    halo.material.opacity = 0.8 + Math.sin(t * 7) * 0.15;
  };
  return root;
}

function makeThrone(color) {
  const root = new THREE.Group();
  add(root, new THREE.BoxGeometry(2, 0.9, 1.8), color, [0, 0.55, 0]);
  add(root, new THREE.BoxGeometry(2, 3.4, 0.4), color, [0, 2.2, -0.8]);
  add(root, SPHERE, color, [0, 3.9, -0.8], [1.0, 0.7, 0.2]);
  add(root, new THREE.BoxGeometry(0.3, 1.4, 1.8), GOLD, [-1.15, 1.0, 0]);
  add(root, new THREE.BoxGeometry(0.3, 1.4, 1.8), GOLD, [1.15, 1.0, 0]);
  add(root, SPHERE, 0xffffff, [0, 0.95, 0.1], [0.85, 0.18, 0.7]);
  add(root, SPHERE, GOLD, [0, 4.35, -0.8], 0.22);
  return root;
}

export function buildBallroom(game) {
  const W = 30;
  const D = 22;
  const room = buildRoom({
    w: W, d: D, wallH: 9,
    floorMat: checkerMat(0xfff4f9, 0xffd0e6, W / 2, D / 2),
    wallA: 0xfff4d6, wallB: 0xffeab8,
  });
  const g = room.group;
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  // red carpet to the thrones
  const carpet = add(g, new THREE.BoxGeometry(3.4, 0.05, D - 2), 0xff6b8b, [0, 0.03, 1], [1, 1, 1]);
  carpet.castShadow = false;
  carpet.receiveShadow = true;

  // dance floor
  const ring = add(g, CYL, GOLD, [0, 0.07, 0.5], [6.2, 0.06, 6.2]);
  const floorDisc = add(g, CYL, 0xfff8e0, [0, 0.09, 0.5], [5.9, 0.06, 5.9]);
  const pinkRing = add(g, CYL, 0xffd0e6, [0, 0.1, 0.5], [5.2, 0.06, 5.2]);
  const cream = add(g, CYL, 0xfff8e0, [0, 0.11, 0.5], [2.7, 0.06, 2.7]);
  const rose = add(g, CYL, 0xffb3d9, [0, 0.12, 0.5], [1.2, 0.06, 1.2]);
  pinkRing.castShadow = cream.castShadow = rose.castShadow = false;
  ring.castShadow = floorDisc.castShadow = false;
  ring.receiveShadow = floorDisc.receiveShadow = true;

  // tall windows + pillars
  for (const x of [-10, -5, 5, 10]) windowPane(g, x, 5.2, -D / 2 + 0.05, 2.4, 4.4);
  for (const side of [-1, 1]) {
    for (const z of [-7, -1, 5]) {
      const x = side * 12.4;
      add(g, CYL, 0xffffff, [x, 3, z], [0.7, 6, 0.7]);
      add(g, CYL, GOLD, [x, 0.2, z], [0.95, 0.4, 0.95]);
      add(g, CYL, GOLD, [x, 6.1, z], [0.95, 0.4, 0.95]);
      block(x, z, 0.9);
    }
  }

  // thrones
  const t1 = put(g, makeThrone(0xff8fc7), -2.4, -D / 2 + 1.8);
  const t2 = put(g, makeThrone(0xc9a6ff), 2.4, -D / 2 + 1.8);
  block(-2.4, -D / 2 + 1.8, 1.4);
  block(2.4, -D / 2 + 1.8, 1.4);

  // candelabras to light (positions the day script uses)
  const candelabraSpots = [[-8.5, -5], [8.5, -5], [0, -4.8]];
  const candelabras = candelabraSpots.map(([x, z]) => {
    const c = makeCandelabra();
    c.scale.setScalar(1.35);
    put(g, c, x, z);
    block(x, z, 0.5);
    return c;
  });

  // glowing dance tiles (hidden until the dance step)
  const tileColors = [0xff6bb5, 0xffb347, 0xffe66b, 0x7be37a, 0x6ad7ff, 0xb48cff];
  const tiles = tileColors.map((c, i) => {
    const a = (i / tileColors.length) * Math.PI * 2 - Math.PI / 2;
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.05, 20),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5 })
    );
    m.position.set(Math.cos(a) * 3.9, 0.14, 0.5 + Math.sin(a) * 3.9);
    m.visible = false;
    g.add(m);
    return m;
  });

  return {
    name: 'ballroom',
    group: g,
    bg: 0xfff0d9,
    fog: null,
    camScale: 1.0,
    spawn: new THREE.Vector3(0, 0, 8.5),
    heading: Math.PI,
    clamp: room.clamp,
    colliders,
    center: new THREE.Vector3(0, 0, 0.5),
    candelabras,
    candelabraSpots,
    tiles,
    update(dt, t) {
      candelabras.forEach((c) => c.userData.update(t));
    },
  };
}

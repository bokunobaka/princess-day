// Day 10: a sunny pool: toys on the deck, a pool to splash into, friends on loungers to serve drinks.
import * as THREE from 'three';
import { mat, add, makeCloud, SPHERE, CYL, gradient } from '../models.js';
import { Critter } from '../assets.js';
import { makeGlow, makeDuck, makeSwimRing, makeBeachBall, makeFlamingo, makeUmbrella, makeLounger } from '../props.js';
import { rng, place, ground } from './util.js';
import { checkerMat } from './room.js';

const POOL = { x: 0, z: -4, hw: 6.5, hd: 3 };

function waterTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#4fc3f7';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 3;
  for (let y = 10; y < 128; y += 26) {
    g.beginPath();
    for (let x = 0; x <= 128; x += 8) g.lineTo(x, y + Math.sin(x / 128 * Math.PI * 4 + y) * 5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1.5);
  return t;
}

function makePalm() {
  const root = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const seg = add(root, CYL, 0x9b6b43, [i * 0.12, 0.8 + i * 1.2, 0], [0.3 - i * 0.04, 1.3, 0.3 - i * 0.04]);
    seg.rotation.z = -0.1;
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = add(root, new THREE.ConeGeometry(0.35, 2.4, 4), i % 2 ? 0x4cc76e : 0x38b45f, [0.5 + Math.cos(a) * 0.9, 5.2, Math.sin(a) * 0.9]);
    leaf.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2 + 0);
    leaf.scale.set(1, 1, 0.35);
  }
  add(root, SPHERE, 0x8b5a2b, [0.5, 4.9, 0.1], 0.2);
  return root;
}

export function buildPool(game) {
  const g = new THREE.Group();
  const rand = rng(77);
  const colliders = [{ x: POOL.x, z: POOL.z, hw: POOL.hw + 0.15, hd: POOL.hd + 0.15 }];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0x9fe98a, undefined);
  g.children[0].position.y = -0.22; // lawn sits under the deck so the pool hole shows the water

  // the deck, built around a hole for the pool
  const tile = checkerMat(0xfff8ec, 0xdff3ff, 13, 10);
  const deckPiece = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), tile.clone());
    m.material.map = tile.map.clone();
    m.material.map.needsUpdate = true;
    m.material.map.repeat.set(w / 2 / 2, d / 2 / 2);
    m.position.set(x, -0.1, z);
    m.receiveShadow = true;
    g.add(m);
  };
  deckPiece(27, 11, 0, 4.5);
  deckPiece(27, 3, 0, -8.5);
  deckPiece(7, 6, -10.25, -4);
  deckPiece(7, 6, 10.25, -4);
  // pool basin, water and edge
  add(g, new THREE.BoxGeometry(13, 0.05, 6), 0x7fd8ff, [0, -0.2, POOL.z]).castShadow = false;
  const tex = waterTexture();
  const water = new THREE.Mesh(new THREE.PlaneGeometry(13, 6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.12, POOL.z);
  g.add(water);
  for (const [w, d, x, z] of [[13.6, 0.35, 0, POOL.z + 3.1], [13.6, 0.35, 0, POOL.z - 3.1], [0.35, 6.2, -6.65, POOL.z], [0.35, 6.2, 6.65, POOL.z]]) {
    add(g, new THREE.BoxGeometry(w, 0.25, d), 0xffffff, [x, 0.02, z]).castShadow = false;
  }

  // sky
  const sun = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: 0xfff6b0, fog: false }));
  sun.scale.setScalar(4);
  sun.position.set(24, 32, -55);
  g.add(sun);
  const sunGlow = makeGlow(0xfff0a0, 28);
  sunGlow.position.copy(sun.position);
  g.add(sunGlow);
  const clouds = [];
  for (let i = 0; i < 6; i++) {
    const c = makeCloud();
    c.position.set((rand() - 0.5) * 90, 18 + rand() * 8, -20 - rand() * 40);
    c.scale.setScalar(1.2 + rand() * 1.2);
    g.add(c);
    clouds.push(c);
  }

  // palms, bushes round the edge, umbrellas
  [[-12, -9], [12, -9], [-12.2, 4], [12.2, 5], [-8, 9], [8.5, 9.2]].forEach(([x, z]) => {
    place(g, makePalm(), x, z, { rot: rand() * 6 });
    block(x, z, 0.7);
  });
  for (let i = 0; i < 20; i++) {
    const x = -13 + i * 1.37;
    for (const z of [-10.8, 10.9]) {
      const b = add(g, SPHERE, [0x62c46a, 0x75d577][i % 2], [x, 0.5, z], [0.8, 0.6, 0.8]);
      if (i % 4 === 0) add(g, SPHERE, [0xff9ccc, 0xffe35a][(i / 4) % 2], [x + 0.2, 0.95, z + 0.4], 0.14).castShadow = false;
    }
  }
  [[9.2, -6.5, 0xff5fae], [9.2, -0.6, 0x6ad7ff], [-9.5, 2.2, 0xffd23f]].forEach(([x, z, c]) => {
    place(g, makeUmbrella(c), x, z);
    block(x, z, 0.3);
  });
  const loungers = [[8.4, -6.5], [8.4, -3.0], [8.4, 0.5]];
  loungers.forEach(([x, z], i) => place(g, makeLounger([0xffffff, 0xffe3f1, 0xe3f6ff][i]), x, z, { rot: -Math.PI / 2 }));

  // toys on the deck
  const toyDefs = [
    [makeDuck(), -9.5, 3.2], [makeSwimRing(), 9, 5.5], [makeBeachBall(), -3.5, 6.8], [makeFlamingo(), 3.4, -8.6],
  ];
  const toys = toyDefs.map(([m, x, z]) => {
    m.scale.setScalar(1.15);
    place(g, m, x, z, { rot: rand() * 6 });
    const gl = makeGlow(0xffffff, 2.2);
    gl.position.set(x, 1.0, z);
    g.add(gl);
    return { group: m, glow: gl, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  // friends hanging out by the loungers
  const friends = [['bunny', 1.1, 10.8, -6.5], ['elephant', 1.8, 10.8, -3.0], ['panda', 1.5, 10.8, 0.5]].map(([n, h, x, z]) => {
    const c = new Critter(n, h);
    c.root.position.set(x, 0, z);
    c.heading = -Math.PI / 2;
    c.root.rotation.y = c.heading;
    g.add(c.root);
    game.addCritter(c);
    return c;
  });

  // a floaty duck on the water that bobs about
  const floatDuck = makeDuck();
  floatDuck.scale.setScalar(1.3);
  place(g, floatDuck, -3.5, POOL.z + 0.6, { y: -0.12 });

  const update = (dt, t) => {
    tex.offset.x = t * 0.03;
    tex.offset.y = Math.sin(t * 0.5) * 0.02;
    floatDuck.position.y = -0.12 + Math.sin(t * 1.7) * 0.05;
    floatDuck.rotation.y = Math.sin(t * 0.4) * 0.6;
    clouds.forEach((c) => {
      c.position.x += dt * 0.4;
      if (c.position.x > 60) c.position.x = -60;
    });
    toys.forEach((o, i) => {
      if (!o.taken) o.group.position.y = Math.sin(t * 2 + i) * 0.08;
    });
  };

  return {
    name: 'pool',
    group: g,
    bg: 0x8fdcff,
    fog: { color: 0xc5ecff, near: 40, far: 110 },
    light: { hemi: 1.1, sun: 1.7 },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 7.5),
    heading: Math.PI,
    clamp: (p) => {
      p.x = Math.max(-12.3, Math.min(12.3, p.x));
      p.z = Math.max(-9.6, Math.min(9.9, p.z));
    },
    colliders,
    update,
    POOL, toys, friends, water,
    edgePos: new THREE.Vector3(0, 0, POOL.z + POOL.hd + 0.9),
    centerPos: new THREE.Vector3(0, -0.3, POOL.z),
  };
}

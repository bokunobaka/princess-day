// Day 9: a snowy Christmas garden: ornaments to find, a tree to light, a snowman to build, presents to give.
import * as THREE from 'three';
import { mat, add, SPHERE, CYL } from '../models.js';
import { holiday, Critter } from '../assets.js';
import { Particles, textures } from '../fx.js';
import { makeGlow, makeOrnament } from '../props.js';
import { rng, place, ground, circleClamp } from './util.js';

const R = 15.5;
const TREE = new THREE.Vector3(0, 0, -7);

export function buildWinter(game) {
  const g = new THREE.Group();
  const rand = rng(45);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0xdbe7f6, 0xf2f8ff, R + 2);

  // pretty trees all around
  const kinds = ['tree-snow-a', 'tree-snow-b', 'tree-snow-c'];
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2;
    const r = R + 2 + rand() * 20;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r - 4;
    if (z > 4) continue; // nothing between the camera and the princess
    place(g, holiday(kinds[i % 3], { height: 5 + rand() * 4 }), x, z, { rot: rand() * 6 });
  }
  [[-11, 2], [11, 3], [-13, -3], [13, -2]].forEach(([x, z], i) => {
    place(g, holiday(kinds[i % 3], { height: 6 }), x, z, { rot: rand() * 6 });
    block(x, z, 0.9);
  });

  // the big Christmas tree
  const tree = holiday('tree-snow-a', { height: 8 });
  place(g, tree, TREE.x, TREE.z);
  block(TREE.x, TREE.z, 1.4);
  const star = add(g, new THREE.OctahedronGeometry(0.4), new THREE.MeshBasicMaterial({ color: 0xffe066 }), [TREE.x, 8.3, TREE.z]);
  star.scale.set(1, 1.3, 0.5);
  star.visible = false;
  const starGlow = makeGlow(0xffe066, 4);
  starGlow.position.set(TREE.x, 8.3, TREE.z);
  starGlow.visible = false;
  g.add(starGlow);
  // twinkling lights on the tree, off until it is decorated
  const lights = [];
  for (let i = 0; i < 16; i++) {
    const y = 1.2 + (i / 16) * 6;
    const rr = (1 - (y - 0.5) / 8) * 2.4;
    const a = i * 2.4;
    const gl = makeGlow([0xff5fae, 0xffe066, 0x6ad7ff, 0x7be37a][i % 4], 1.1);
    gl.position.set(TREE.x + Math.cos(a) * rr, y, TREE.z + Math.sin(a) * rr + 0.2);
    gl.visible = false;
    g.add(gl);
    lights.push(gl);
  }
  // three places on the tree's sunny side for the ornaments
  const hangSpots = [[-0.9, 2.3], [0.8, 3.6], [-0.3, 5.0]].map(([dx, y]) => new THREE.Vector3(TREE.x + dx, y, TREE.z + (1 - y / 9) * 2.1));

  // ornaments hidden in the snow
  const ornColors = [0xff4d6d, 0x4dc9ff, 0xffd23f];
  const ornSpots = [[-9, 1.5], [9.5, 3.5], [-2.5, 6]];
  const ornaments = ornSpots.map(([x, z], i) => {
    const o = makeOrnament(ornColors[i]);
    o.scale.setScalar(1.6);
    place(g, o, x, z, { y: 0.45 });
    const gl = makeGlow(0xffffff, 2);
    gl.position.set(x, 0.8, z);
    g.add(gl);
    return { group: o, glow: gl, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  // snowman building: three lumps to roll onto the stack
  const SITE = new THREE.Vector3(7, 0, -4);
  const lumpSpots = [[-7.5, 3.5, 0.75], [-10, -5, 0.6], [4.5, 7, 0.45]];
  const lumps = lumpSpots.map(([x, z, r]) => {
    const m = new THREE.Group();
    add(m, SPHERE, 0xffffff, [0, r, 0], r);
    place(g, m, x, z);
    return { group: m, pos: new THREE.Vector3(x, 0, z), r, used: false };
  });
  const stackY = [0.8, 2.0, 2.95];
  const stackR = [0.8, 0.6, 0.45];
  // hat, nose, eyes, scarf appear when the third lump lands
  const extras = new THREE.Group();
  extras.visible = false;
  add(extras, CYL, 0x2b2236, [0, 3.55, 0], [0.4, 0.5, 0.4]);
  add(extras, CYL, 0x2b2236, [0, 3.27, 0], [0.62, 0.05, 0.62]);
  add(extras, new THREE.ConeGeometry(0.08, 0.55, 8), 0xff8a1f, [0, 2.95, 0.5]).rotation.x = Math.PI / 2;
  add(extras, SPHERE, 0x2b2236, [-0.15, 3.1, 0.4], 0.05);
  add(extras, SPHERE, 0x2b2236, [0.15, 3.1, 0.4], 0.05);
  const scarf = add(extras, new THREE.TorusGeometry(0.42, 0.09, 8, 20), 0xff4d6d, [0, 2.55, 0]);
  scarf.rotation.x = Math.PI / 2;
  place(g, extras, SITE.x, SITE.z);
  block(SITE.x, SITE.z, 0.9);

  // presents stacked under the tree + friends waiting for them
  const presentModels = ['present-a-cube', 'present-b-round', 'present-a-round', 'present-b-cube', 'present-a-rectangle'];
  presentModels.forEach((n, i) => {
    place(g, holiday(n, { height: 0.9 + (i % 2) * 0.3 }), -2.2 + i * 1.1, -4.2 + (i % 2) * 0.5, { rot: i * 0.9 });
  });
  const stackPos = new THREE.Vector3(0, 0, -3.9);
  const friends = [['bunny', 1.1, -6.5, -3], ['panda', 1.5, 4.5, -5], ['penguin', 1.3, -8.5, -6.5]].map(([n, h, x, z]) => {
    const c = new Critter(n, h);
    c.root.position.set(x, 0, z);
    c.heading = Math.atan2(TREE.x - x, TREE.z - z + 4);
    c.root.rotation.y = c.heading;
    g.add(c.root);
    game.addCritter(c);
    return c;
  });

  // festive decoration
  place(g, holiday('reindeer', { height: 2.2 }), -13, 2.5, { rot: 1.1 });
  place(g, holiday('reindeer', { height: 2.0 }), 12.5, 0.5, { rot: -1.2 });
  place(g, holiday('nutcracker', { height: 2.1 }), -4.5, 9, { rot: 0.4 });
  place(g, holiday('sled', { height: 1.1 }), 10, 8, { rot: -0.6 });
  const gingers = [place(g, holiday('gingerbread-man', { height: 1.5 }), -3.2, 6.8), place(g, holiday('gingerbread-woman', { height: 1.5 }), 3.5, 3.5)];
  for (let i = 0; i < 12; i++) {
    const x = (i % 2 ? 1 : -1) * 2.2;
    place(g, holiday(i % 3 ? 'candy-cane-red' : 'candy-cane-green', { height: 1.2 }), x, 9 - i * 1.0, { rot: i });
  }
  [[-8, 6.5], [8.5, 8], [-10.5, -9], [11, -9]].forEach(([x, z]) => {
    place(g, holiday('lantern', { height: 1.8 }), x, z);
    const gl = makeGlow(0xffd27a, 3);
    gl.position.set(x, 1.1, z);
    g.add(gl);
  });

  // snowfall around the player
  const snow = new Particles(g, textures.snow, { max: 520, size: 0.28, additive: false });
  let acc = 0;

  const update = (dt, t) => {
    snow.update(dt);
    acc += dt * 55;
    const p = game.player.position;
    while (acc >= 1) {
      acc -= 1;
      snow.emit(p.x + (Math.random() - 0.5) * 36, 15, p.z + (Math.random() - 0.5) * 30, 1, { speed: 0.5, up: -1.8, life: 8, spread: 0.1 });
    }
    lights.forEach((l, i) => l.visible && (l.material.opacity = 0.65 + Math.sin(t * 4 + i) * 0.3));
    ornaments.forEach((o) => !o.taken && (o.group.position.y = 0.45 + Math.sin(t * 2 + o.pos.x) * 0.1));
    gingers.forEach((m, i) => (m.rotation.z = Math.sin(t * 3 + i) * 0.08));
    star.rotation.y = t;
  };

  return {
    name: 'winter',
    group: g,
    bg: 0xcfe8ff,
    fog: { color: 0xdcefff, near: 28, far: 85 },
    light: { hemi: 1.0, hemiColor: 0xeaf3ff, hemiGround: 0xc8d8f0, sun: 1.25, sunColor: 0xfff6e0 },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 8.5),
    heading: Math.PI,
    clamp: circleClamp(R),
    colliders,
    update,
    tree: TREE, star, starGlow, lights, hangSpots, ornaments, lumps, SITE, stackY, stackR, extras, stackPos, friends,
  };
}

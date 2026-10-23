// Day 12: a little farm. Eggs in the straw, a cow to milk, chicks to lead home to the coop.
import * as THREE from 'three';
import { mat, add, SPHERE, CYL, makeTree, makeFlower, PINK } from '../models.js';
import { Critter, graveyard, food } from '../assets.js';
import { makeGlow } from '../props.js';
import { rng, place, ground, circleClamp, fenceRing } from './util.js';

const R = 15.5;
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CONE = new THREE.ConeGeometry(1, 1, 4);

export function buildFarm(game) {
  const g = new THREE.Group();
  const rand = rng(81);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0x9be37a, 0xa9ee86, R + 2);
  fenceRing(g, R + 1, 0xc99a6b, 0xe0b27d);
  // crop rows in the far field
  for (let i = 0; i < 9; i++) {
    const row = add(g, BOX, i % 2 ? 0x7ed36a : 0x6bc25a, [-10 + i * 1.2, 0.05, -12.5], [0.7, 0.1, 5]);
    row.castShadow = false;
  }

  // the red barn
  const barn = new THREE.Group();
  add(barn, BOX, 0xe5484d, [0, 2, 0], [6, 4, 5]);
  const roof = add(barn, CONE, 0x8a2f35, [0, 5.0, 0], [4.6, 2.0, 4.6]);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(4.4, 2.0, 3.4);
  add(barn, BOX, 0xffffff, [0, 1.5, 2.55], [2.2, 3.0, 0.1]);
  const x1 = add(barn, BOX, 0xffffff, [0, 1.5, 2.6], [0.2, 3.2, 0.06]);
  x1.rotation.z = 0.6;
  const x2 = add(barn, BOX, 0xffffff, [0, 1.5, 2.6], [0.2, 3.2, 0.06]);
  x2.rotation.z = -0.6;
  place(g, barn, -8.5, -9.5, { rot: 0.25 });
  block(-8.5, -9.5, 3.2);
  // silo
  const silo = new THREE.Group();
  add(silo, CYL, 0xdfe6ee, [0, 2.6, 0], [1.3, 5.2, 1.3]);
  add(silo, SPHERE, 0xb8c4d2, [0, 5.2, 0], [1.3, 0.9, 1.3]);
  place(g, silo, -3.8, -11.5);
  block(-3.8, -11.5, 1.4);

  // the chicken coop (chicks go in here)
  const coop = new THREE.Group();
  add(coop, BOX, 0xffe0a8, [0, 0.9, 0], [2.4, 1.8, 2.0]);
  add(coop, CONE, 0xff6b6b, [0, 2.2, 0], [2.0, 1.1, 2.0]).rotation.y = Math.PI / 4;
  add(coop, BOX, 0x6b4226, [0, 0.5, 1.02], [0.7, 1.0, 0.05]);
  place(g, coop, 7.5, -7);
  block(7.5, -7, 1.7);
  const coopPos = new THREE.Vector3(7.5, 0, -5.2);

  // hay bales, trees, flowers
  [[3, -9], [4.5, -9.6], [12, 3], [-12, 5], [-13, -3]].forEach(([x, z], i) => {
    place(g, graveyard('hay-bale', { height: 1.2 }), x, z, { rot: rand() * 6 });
    block(x, z, 0.9);
  });
  for (let i = 0; i < 20; i++) {
    const a = rand() * Math.PI * 2;
    const r = R + 3 + rand() * 12;
    const z = Math.sin(a) * r - 3;
    if (z > 4) continue;
    place(g, makeTree(rand, i % 4 === 0), Math.cos(a) * r, z, { scale: 1.3 + rand() * 0.6 });
  }
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = 3 + rand() * 11;
    place(g, makeFlower([PINK, 0xffe35a, 0xffffff][i % 3]), Math.cos(a) * r, Math.sin(a) * r + 1, { scale: 1.1 });
  }

  // egg nests
  const nestSpots = [[-5.5, 3], [6, 3.5], [-8.5, -3], [4, -3.5]];
  const nests = nestSpots.map(([x, z]) => {
    const n = new THREE.Group();
    add(n, CYL, 0xe8c36a, [0, 0.1, 0], [0.9, 0.2, 0.9]);
    const egg = food('egg', { scale: 3.4 });
    egg.position.y = 0.2;
    n.add(egg);
    const gl = makeGlow(0xffffff, 2.2);
    gl.position.y = 0.8;
    n.add(gl);
    place(g, n, x, z);
    return { group: n, egg, glow: gl, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  // animals
  const cows = [[-3, -3.5, 0.5], [3.5, -5.5, -0.6]].map(([x, z, h]) => {
    const c = new Critter('cow', 2.0);
    c.root.position.set(x, 0, z);
    c.heading = h;
    c.root.rotation.y = h;
    g.add(c.root);
    game.addCritter(c);
    return c;
  });
  const pigs = [[8, 4.5], [10, 1.5]].map(([x, z]) => {
    const c = new Critter('pig', 1.1);
    c.root.position.set(x, 0, z);
    c.heading = -1;
    g.add(c.root);
    game.addCritter(c);
    return { c, home: new THREE.Vector3(x, 0, z), wait: 1 };
  });
  const chicks = [[-9.5, 6], [1, 7.5], [10.5, -2]].map(([x, z]) => {
    const c = new Critter('chick', 0.8);
    c.root.position.set(x, 0, z);
    g.add(c.root);
    game.addCritter(c);
    return { c, home: new THREE.Vector3(x, 0, z), wait: 0.5, invited: false };
  });

  // milk bucket by the first cow
  const bucket = new THREE.Group();
  add(bucket, new THREE.CylinderGeometry(0.4, 0.3, 0.55, 14), 0xb8c4d2, [0, 0.28, 0]);
  const milk = add(bucket, CYL, 0xffffff, [0, 0.5, 0], [0.34, 0.02, 0.34]);
  milk.castShadow = false;
  milk.scale.y = 0.01;
  place(g, bucket, -1.2, -2.3);

  const update = (dt, t) => {
    for (const w of [...pigs, ...chicks]) {
      const c = w.c;
      if (w.invited) continue;
      if (!c.dest) {
        w.wait -= dt;
        if (w.wait <= 0) {
          w.wait = 2 + Math.random() * 3;
          c.goTo(w.home.x + (Math.random() - 0.5) * 3.5, w.home.z + (Math.random() - 0.5) * 3.5, { speed: 1.1 });
        }
      }
    }
    nests.forEach((n, i) => !n.taken && (n.glow.material.opacity = 0.5 + Math.sin(t * 3 + i) * 0.25));
  };

  return {
    name: 'farm',
    group: g,
    bg: 0xbfe6ff,
    fog: { color: 0xcdeeff, near: 34, far: 100 },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 9),
    heading: Math.PI,
    clamp: circleClamp(R),
    colliders,
    update,
    nests, cows, chicks, coopPos, coop, bucket, milk,
  };
}

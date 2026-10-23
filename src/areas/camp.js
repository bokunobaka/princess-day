// Day 15: a campsite at dusk. Firewood to find, a fire to light, marshmallows for the friends.
import * as THREE from 'three';
import { add, SPHERE, CYL } from '../models.js';
import { Critter, graveyard } from '../assets.js';
import { Particles, textures } from '../fx.js';
import { makeGlow, makeLog, makeTent } from '../props.js';
import { rng, place, ground, circleClamp, stars } from './util.js';

const R = 15;
const PIT = new THREE.Vector3(0, 0, -3);

export function buildCamp(game) {
  const g = new THREE.Group();
  const rand = rng(29);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0x365743, 0x477150, R + 2);
  stars(g, 150);
  const moon = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false }));
  moon.scale.setScalar(3.4);
  moon.position.set(26, 28, -55);
  g.add(moon);

  const trees = ['pine', 'pine-fall', 'pine-crooked'];
  for (let i = 0; i < 36; i++) {
    const a = rand() * Math.PI * 2;
    const r = R + 2 + rand() * 18;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r - 4;
    if (z > 3) continue;
    place(g, graveyard(trees[i % 3], { height: 6 + rand() * 4 }), x, z, { rot: rand() * 6 });
  }
  [[-12, 3.5], [12.5, 2.5]].forEach(([x, z]) => {
    place(g, graveyard('pine', { height: 6 }), x, z, { rot: rand() * 6 });
    block(x, z, 0.8);
  });

  // tents
  [[-9.5, -5, 0xff8fc7, 0.5], [9.5, -6, 0x6ad7ff, -0.5], [0.5, -12.5, 0xffd23f, 0]].forEach(([x, z, c, r]) => {
    place(g, makeTent(c), x, z, { rot: r, scale: 1.5 });
    block(x, z, 2.2);
  });

  // the fire pit: stones, and logs + flames that appear when it is lit
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    add(g, SPHERE, 0x8a8f99, [PIT.x + Math.cos(a) * 1.15, 0.22, PIT.z + Math.sin(a) * 1.15], [0.36, 0.28, 0.36]);
  }
  block(PIT.x, PIT.z, 1.4);
  const logs = new THREE.Group();
  logs.visible = false;
  for (let i = 0; i < 4; i++) {
    const l = makeLog();
    l.scale.setScalar(1.3);
    l.rotation.y = (i / 4) * Math.PI * 2 + 0.4;
    l.position.y = 0.1 + (i % 2) * 0.12;
    logs.add(l);
  }
  place(g, logs, PIT.x, PIT.z);
  const flames = new THREE.Group();
  flames.visible = false;
  [[0, 0.9, 0xffd23f, 0.55], [-0.2, 0.7, 0xff8a3d, 0.4], [0.2, 0.65, 0xff5f3d, 0.35]].forEach(([x, h, c, w]) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(w, h * 1.8, 8), new THREE.MeshBasicMaterial({ color: c }));
    f.position.set(x, h * 0.9, 0);
    flames.add(f);
  });
  place(g, flames, PIT.x, PIT.z);
  const fireGlow = makeGlow(0xffa347, 9);
  fireGlow.position.set(PIT.x, 1.3, PIT.z);
  fireGlow.visible = false;
  g.add(fireGlow);

  // log seats
  [[-4.2, -3, 0], [4.2, -3, 0], [0, -7, Math.PI / 2]].forEach(([x, z, r]) => place(g, graveyard('bench', { height: 1.1 }), x, z, { rot: r + Math.PI / 2 }));

  // lantern light around camp
  const glows = [];
  [[-6, 4], [6, 4], [-12, -1], [12, -1]].forEach(([x, z]) => {
    place(g, graveyard('lantern-glass', { height: 1.6 }), x, z);
    const gl = makeGlow(0xffb347, 3.4);
    gl.position.set(x, 1.0, z);
    g.add(gl);
    glows.push(gl);
  });

  // firewood to find
  const woodSpots = [[-8, 3.5], [8.5, 2.5], [-5, -9], [6.5, -9.5]];
  const woods = woodSpots.map(([x, z]) => {
    const l = makeLog();
    l.scale.setScalar(1.5);
    place(g, l, x, z, { rot: rand() * 3 });
    const gl = makeGlow(0xfff0a0, 2.4);
    gl.position.set(x, 0.8, z);
    g.add(gl);
    return { group: l, glow: gl, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  // friends around the fire
  const friends = [['bunny', 1.1, -3.3, -1.2], ['panda', 1.5, 3.3, -1.2], ['fox', 1.2, 2.6, -5.8]].map(([n, h, x, z]) => {
    const c = new Critter(n, h);
    c.root.position.set(x, 0, z);
    c.heading = Math.atan2(PIT.x - x, PIT.z - z);
    c.root.rotation.y = c.heading;
    g.add(c.root);
    game.addCritter(c);
    return c;
  });

  // fireflies + sparks
  const flies = new Particles(g, textures.glow, { max: 160, size: 0.35, additive: true });
  const sparks = new Particles(g, textures.star, { max: 160, size: 0.35, additive: true });
  let fireOn = false;
  let flyAcc = 0;

  const update = (dt, t) => {
    flies.update(dt);
    sparks.update(dt);
    flyAcc += dt * 4;
    const p = game.player.position;
    while (flyAcc >= 1) {
      flyAcc -= 1;
      flies.emit(p.x + (Math.random() - 0.5) * 22, 0.6 + Math.random() * 2.2, p.z + (Math.random() - 0.5) * 18, 1, { speed: 0.5, up: 0.2, life: 4, colors: [0xfff0a0, 0xd8ff8a], spread: 0.1 });
    }
    glows.forEach((gl, i) => (gl.material.opacity = 0.7 + Math.sin(t * 5 + i) * 0.15));
    woods.forEach((w, i) => !w.taken && (w.glow.material.opacity = 0.55 + Math.sin(t * 3 + i) * 0.25));
    if (fireOn) {
      flames.children.forEach((f, i) => f.scale.set(1, 1 + Math.sin(t * 11 + i * 2) * 0.18, 1));
      fireGlow.material.opacity = 0.8 + Math.sin(t * 9) * 0.15;
      sparks.emit(PIT.x, 1.2, PIT.z, 1, { speed: 0.7, up: 2.4, life: 1.4, colors: [0xffd23f, 0xff8a3d], gravity: -0.4, spread: 0.3 });
    }
  };

  return {
    name: 'camp',
    group: g,
    bg: 0x1b2547,
    fog: { color: 0x1b2547, near: 24, far: 70 },
    light: { hemi: 0.85, hemiColor: 0x9fb4ff, hemiGround: 0x3a4a3a, sun: 0.75, sunColor: 0xffd7a0 },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 9.5),
    heading: Math.PI,
    clamp: circleClamp(R),
    colliders,
    update,
    pitPos: PIT, woods, friends, logs,
    setFire: (on) => {
      fireOn = on;
      logs.visible = on;
      flames.visible = on;
      fireGlow.visible = on;
    },
  };
}

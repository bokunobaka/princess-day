// Day 11: under the sea. Clams hold pearls, baby fish want to be friends, a treasure chest waits.
import * as THREE from 'three';
import { mat, add, SPHERE, CYL } from '../models.js';
import { Critter, graveyard } from '../assets.js';
import { Particles, textures } from '../fx.js';
import { makeGlow, makeChest } from '../props.js';
import { rng, place, ground, circleClamp } from './util.js';

const R = 15;
const CONE = new THREE.ConeGeometry(1, 1, 10);

export function buildSea(game) {
  const g = new THREE.Group();
  const rand = rng(63);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0xe3c987, 0xf0dca0, R + 2);

  // soft light rays from the surface
  for (let i = 0; i < 7; i++) {
    const ray = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 1.6, 30, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })
    );
    ray.position.set(-14 + i * 4.6, 14, -10 + (i % 3) * 5);
    ray.rotation.z = 0.25;
    g.add(ray);
  }

  // coral
  const coralColors = [0xff7aa8, 0xffa24d, 0xb48cff, 0xff5f6b, 0xffd23f];
  const coral = (x, z, s = 1) => {
    const grp = new THREE.Group();
    const c = coralColors[(rand() * coralColors.length) | 0];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const h = 1.4 + rand() * 1.4;
      add(grp, CONE, c, [Math.cos(a) * 0.45, h / 2, Math.sin(a) * 0.45], [0.28, h, 0.28]);
      add(grp, SPHERE, c, [Math.cos(a) * 0.45, h, Math.sin(a) * 0.45], 0.2);
    }
    add(grp, SPHERE, c, [0, 0.4, 0], [0.7, 0.5, 0.7]);
    place(g, grp, x, z, { scale: s, rot: rand() * 6 });
    block(x, z, 0.9 * s);
  };
  [[-9, -6], [-11.5, 2], [9.5, -4], [11, 4], [-4, -11], [5, -11.5], [-7.5, 8], [7.5, 9]].forEach(([x, z]) => coral(x, z, 1 + rand() * 0.5));
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = R + 2 + rand() * 12;
    const z = Math.sin(a) * r;
    if (z > 4) continue;
    coral(Math.cos(a) * r, z, 1.3 + rand());
  }
  [[-6, -4], [6.5, 1], [-2.5, -9], [3, 6.5]].forEach(([x, z]) => place(g, graveyard('rocks', { height: 1.2 }), x, z, { rot: rand() * 6 }));

  // seaweed that sways
  const weeds = [];
  for (let i = 0; i < 32; i++) {
    const x = (rand() - 0.5) * 30;
    const z = (rand() - 0.5) * 26 - 2;
    if (z > 7) continue;
    const w = new THREE.Group();
    for (let k = 0; k < 4; k++) add(w, CYL, 0x35c46b, [0, 0.5 + k * 0.7, 0], [0.09, 0.8, 0.09]).castShadow = false;
    place(g, w, x, z);
    weeds.push(w);
  }

  // clams with pearls
  const clamSpots = [[-5.5, 3], [6, 4.5], [-1.5, -5.5]];
  const clams = clamSpots.map(([x, z]) => {
    const c = new THREE.Group();
    add(c, new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0xffd1e6, [0, 0.5, 0], [0.9, 0.5, 0.9]);
    const lid = new THREE.Group();
    lid.position.set(0, 0.5, -0.8);
    add(lid, new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xfff0f6, [0, 0, 0.8], [0.9, 0.5, 0.9]);
    c.add(lid);
    const pearl = add(c, SPHERE, 0xffffff, [0, 0.55, 0], 0.28);
    pearl.visible = false;
    const gl = makeGlow(0xffffff, 2.4);
    gl.position.set(x, 1.1, z);
    gl.visible = true;
    g.add(gl);
    place(g, c, x, z, { scale: 1.2 });
    block(x, z, 0.8);
    return { group: c, lid, pearl, glow: gl, pos: new THREE.Vector3(x, 0, z), opened: false };
  });

  // baby fish (to befriend) and big decorative fish
  const babyFish = [[-9, 7, 2.2, 2.5], [8.5, 8.5, 2.0, 3.2], [-3.5, -7.5, 2.4, 2.8]].map(([cx, cz, h, rad], i) => {
    const c = new Critter('fish', 0.95);
    g.add(c.root);
    game.addCritter(c);
    c.play('walk');
    return { c, cx, cz, h, rad, a: i * 2.1, sp: 0.5 + i * 0.1, friend: false };
  });
  const bigFish = [[0, -2, 3.2, 11], [-3, 3, 4.5, 8], [4, -4, 2.8, 9.5]].map(([cx, cz, h, rad], i) => {
    const c = new Critter('fish', 1.6);
    g.add(c.root);
    game.addCritter(c);
    c.play('walk');
    return { c, cx, cz, h, rad, a: i * 2.0, sp: 0.25 + i * 0.07 };
  });
  const crabs = [[-2.5, 8], [4.5, -2.5]].map(([x, z]) => {
    const c = new Critter('crab', 0.75);
    c.root.position.set(x, 0, z);
    g.add(c.root);
    game.addCritter(c);
    return { c, home: new THREE.Vector3(x, 0, z), wait: 1 };
  });

  // the treasure chest
  const chest = makeChest();
  chest.scale.setScalar(1.5);
  place(g, chest, 0, -12.5, { rot: 0 });
  block(0, -12.5, 1.3);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 12, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })
  );
  beam.position.set(0, 6, -12.5);
  beam.visible = false;
  g.add(beam);

  // bubbles
  const bubbles = new Particles(g, textures.glow, { max: 240, size: 0.5, additive: true });
  let acc = 0;

  const update = (dt, t) => {
    bubbles.update(dt);
    acc += dt * 14;
    const p = game.player.position;
    while (acc >= 1) {
      acc -= 1;
      bubbles.emit(p.x + (Math.random() - 0.5) * 26, 0.2, p.z + (Math.random() - 0.5) * 22, 1, { speed: 0.2, up: 1.4, life: 6, colors: [0xbfefff, 0xffffff], spread: 0.1 });
    }
    weeds.forEach((w, i) => (w.rotation.z = Math.sin(t * 1.4 + i) * 0.12));
    for (const f of [...babyFish, ...bigFish]) {
      if (f.friend) continue;
      f.a += dt * f.sp;
      const x = f.cx + Math.cos(f.a) * f.rad;
      const z = f.cz + Math.sin(f.a) * f.rad;
      f.c.root.position.set(x, f.h + Math.sin(t * 1.5 + f.a) * 0.25, z);
      f.c.heading = -f.a + Math.PI;
    }
    for (const cr of crabs) {
      const c = cr.c;
      if (!c.dest) {
        cr.wait -= dt;
        if (cr.wait <= 0) {
          cr.wait = 2 + Math.random() * 3;
          c.goTo(cr.home.x + (Math.random() - 0.5) * 4, cr.home.z + (Math.random() - 0.5) * 4, { speed: 1.2 });
        }
      }
    }
    clams.forEach((c, i) => !c.opened && (c.glow.material.opacity = 0.5 + Math.sin(t * 3 + i) * 0.25));
  };

  return {
    name: 'sea',
    group: g,
    bg: 0x2a9ad4,
    fog: { color: 0x2a9ad4, near: 9, far: 46 },
    light: { hemi: 1.0, hemiColor: 0xbfefff, hemiGround: 0x2a6f9a, sun: 1.2, sunColor: 0xd8f6ff },
    camScale: 0.95,
    spawn: new THREE.Vector3(0, 0, 9),
    heading: Math.PI,
    clamp: circleClamp(R),
    colliders,
    update,
    clams, babyFish, chest, chestPos: new THREE.Vector3(0, 0, -12.5), beam,
  };
}

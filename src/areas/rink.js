// Day 16: an ice rink. Gliding is slippery! Snowflakes to gather, a big star to spin on, friends to skate with.
import * as THREE from 'three';
import { mat, add, SPHERE, CYL } from '../models.js';
import { Critter, holiday } from '../assets.js';
import { Particles, textures } from '../fx.js';
import { makeGlow, makeSnowflake } from '../props.js';
import { rng, place, ground, circleClamp } from './util.js';

const R = 14.5;
export const ICE_R = 10;

export function buildRink(game) {
  const g = new THREE.Group();
  const rand = rng(53);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0xdbe7f6, 0xf2f8ff, R + 2);

  // the ice
  const ice = new THREE.Mesh(
    new THREE.CircleGeometry(ICE_R, 56),
    new THREE.MeshToonMaterial({ color: 0xbfe6ff, emissive: 0x4a90c8, emissiveIntensity: 0.25 })
  );
  ice.rotation.x = -Math.PI / 2;
  ice.position.y = 0.03;
  ice.receiveShadow = true;
  g.add(ice);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(ICE_R + 0.15, 0.22, 8, 64), mat(0x8fc8f0));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.1;
  g.add(rim);
  // skate marks scratched on the ice
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(2 + i * 1.6, 0.025, 4, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    m.rotation.x = Math.PI / 2;
    m.position.set(0.4 * (i - 2), 0.05, 0.3 * (2 - i));
    g.add(m);
  }

  // snowy trees and lanterns around
  const kinds = ['tree-snow-a', 'tree-snow-b', 'tree-snow-c'];
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2;
    const r = R + 1.5 + rand() * 18;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r - 3;
    if (z > 4) continue;
    place(g, holiday(kinds[i % 3], { height: 5 + rand() * 4 }), x, z, { rot: rand() * 6 });
  }
  [[-12, 2], [12, 3], [-12.5, -6], [12.5, -6], [0, -13.5]].forEach(([x, z]) => {
    place(g, holiday('lantern', { height: 2 }), x, z);
    const gl = makeGlow(0xffd27a, 3.4);
    gl.position.set(x, 1.2, z);
    g.add(gl);
  });

  // snowflakes to gather
  const flakeSpots = [[-5, 3], [5.5, 2], [-2, -5.5], [3.5, -6.5], [0, 5.5]];
  const flakes = flakeSpots.map(([x, z]) => {
    const f = makeSnowflake();
    f.scale.setScalar(1.5);
    place(g, f, x, z, { y: 0.9 });
    return { group: f, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  // the big star in the middle, to spin on
  const star = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 28), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.55, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.07;
  star.add(disc);
  const sg = makeGlow(0xfff1a8, 6);
  sg.position.y = 0.6;
  star.add(sg);
  place(g, star, 0, -0.5);
  const starPos = new THREE.Vector3(0, 0, -0.5);
  star.visible = false;

  // skating friends
  const friends = [['penguin', 1.3, -9, -3], ['bunny', 1.1, 0, -9.4], ['panda', 1.5, 9, -3]].map(([n, h, x, z]) => {
    const c = new Critter(n, h);
    c.root.position.set(x, 0.04, z);
    c.heading = Math.atan2(-x, -z);
    c.root.rotation.y = c.heading;
    g.add(c.root);
    game.addCritter(c);
    return c;
  });

  const snow = new Particles(g, textures.snow, { max: 420, size: 0.26, additive: false });
  let acc = 0;
  const update = (dt, t) => {
    snow.update(dt);
    acc += dt * 45;
    const p = game.player.position;
    while (acc >= 1) {
      acc -= 1;
      snow.emit(p.x + (Math.random() - 0.5) * 34, 14, p.z + (Math.random() - 0.5) * 28, 1, { speed: 0.5, up: -1.8, life: 8, spread: 0.1 });
    }
    flakes.forEach((f, i) => {
      if (f.taken) return;
      f.group.position.y = 0.9 + Math.sin(t * 2 + i) * 0.15;
      f.group.rotation.y = t * 1.5;
    });
    star.rotation.y = t * 0.5;
    disc.material.opacity = 0.45 + Math.sin(t * 3) * 0.15;
  };

  return {
    name: 'rink',
    group: g,
    bg: 0xcfe8ff,
    fog: { color: 0xdcefff, near: 30, far: 85 },
    light: { hemi: 1.0, hemiColor: 0xeaf3ff, hemiGround: 0xc8d8f0, sun: 1.25, sunColor: 0xfff6e0 },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 11),
    heading: Math.PI,
    clamp: circleClamp(R),
    colliders,
    update,
    slippery: true,
    iceRadius: ICE_R,
    flakes, star, starPos, friends,
  };
}

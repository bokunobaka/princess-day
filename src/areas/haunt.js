// Day 8: a silly zombie graveyard. Keys to find, a gate to open, a safe glowing circle beyond it.
// The zombies shuffle after the princess but are friendly: a bump only makes them want a hug.
import * as THREE from 'three';
import { mat, add, SPHERE, CYL } from '../models.js';
import { graveyard, Critter } from '../assets.js';
import { makeKey, makeGlow } from '../props.js';
import { rng, place, ground, circleClamp, fenceRing, stars } from './util.js';

const R = 16;

export function buildHaunt(game) {
  const g = new THREE.Group();
  const rand = rng(33);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0x3b5a4c, 0x4a6e5a, R + 1.5);
  fenceRing(g, R + 0.8, 0x2e4036, 0x55715f);
  stars(g, 90);
  const moon = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: 0xe6fff0, fog: false }));
  moon.scale.setScalar(4);
  moon.position.set(22, 26, -50);
  g.add(moon);

  // the gate (lifts up when opened) between two stone columns
  const gate = new THREE.Group();
  gate.add(graveyard('iron-fence-border-gate', { height: 3.2 }));
  place(g, gate, 0, -R - 0.8, { scale: 1.9 });
  for (const sx of [-1, 1]) {
    place(g, graveyard('iron-fence-border-column', { height: 4.2 }), sx * 2.6, -R - 0.8);
    block(sx * 2.6, -R - 0.8, 0.6);
  }
  const gatePos = new THREE.Vector3(0, 0, -R + 1.5);

  // the safe place beyond the gate
  const safe = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  safe.rotation.x = -Math.PI / 2;
  safe.position.set(0, 0.06, -24.5);
  g.add(safe);
  const safeGlow = makeGlow(0xfff1a8, 9);
  safeGlow.position.set(0, 2, -24.5);
  g.add(safeGlow);
  place(g, graveyard('lightpost-single', { height: 4 }), 3.2, -24);
  place(g, graveyard('lightpost-single', { height: 4 }), -3.2, -24);
  const safePos = new THREE.Vector3(0, 0, -24.5);

  // scenery
  const stones = ['gravestone-round', 'gravestone-cross', 'gravestone-bevel', 'gravestone-broken', 'cross-wood'];
  [[-12, 3], [-13, -4], [12.5, 4], [13, -3.5], [-4.5, 8], [5, 8.5], [-8.5, -9.5], [8, -10], [0, 3], [-6.5, 1], [7, -2.5]].forEach(([x, z], i) => {
    place(g, graveyard(stones[i % 5], { scale: 2.1 }), x, z, { rot: rand() * 0.8 - 0.4 });
    block(x, z, 0.8);
  });
  place(g, graveyard('crypt-small', { height: 5.2 }), -12.5, -9, { rot: 0.5 });
  block(-12.5, -9, 2.2);
  place(g, graveyard('crypt', { height: 6 }), 12.5, -10, { rot: -0.5 });
  block(12.5, -10, 2.4);
  place(g, graveyard('coffin', { height: 1.2 }), -9, 6, { rot: 0.7 });
  place(g, graveyard('bench', { height: 1.1 }), 9, 7, { rot: -0.4 });
  place(g, graveyard('hay-bale', { height: 1.3 }), 10.5, 1);
  const trees = ['pine', 'pine-fall', 'pine-crooked'];
  for (let i = 0; i < 28; i++) {
    const a = rand() * Math.PI * 2;
    const r = R + 4 + rand() * 18;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 6 && z < -R) continue; // keep the way beyond the gate clear
    if (z > 3) continue; // nothing between the camera and the princess
    place(g, graveyard(trees[i % 3], { height: 6 + rand() * 4 }), x, z, { rot: rand() * 6 });
  }
  const glows = [];
  [[-5, 5.5], [5, 5.5], [-9, -3], [9, -4], [-3.5, -7], [3.5, -7.5], [-14, 8], [14, 8]].forEach(([x, z]) => {
    place(g, graveyard('fire-basket', { height: 1.2 }), x, z);
    const gl = makeGlow(0x9dff8a, 4.2);
    gl.position.set(x, 1.3, z);
    g.add(gl);
    glows.push(gl);
    block(x, z, 0.55);
  });

  // the three keys
  const keySpots = [[-10.8, 5.2], [10.6, -5.5], [-4.2, -11.5]];
  const keys = keySpots.map(([x, z]) => {
    const k = makeKey();
    k.scale.setScalar(1.5);
    place(g, k, x, z, { y: 0.8 });
    const gl = makeGlow(0xfff1a8, 2.6);
    gl.position.set(x, 1.5, z);
    g.add(gl);
    return { group: k, glow: gl, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  // skeleton + vampire + ghost friends just standing around
  [['character-skeleton', 1.8, -14, 0, 1.2], ['character-vampire', 1.9, 13.6, 0.5, -1.2], ['character-ghost', 1.7, 7, -6.5, 0]].forEach(([n, h, x, z, hd]) => {
    const c = new Critter(n, h, 'graveyard');
    c.root.position.set(x, n === 'character-ghost' ? 0.4 : 0, z);
    c.heading = hd;
    c.root.rotation.y = hd;
    g.add(c.root);
    game.addCritter(c);
  });

  // the friendly zombies
  const zombies = [[-8, -3], [8, 3], [1, -7.5]].map(([x, z], i) => {
    const c = new Critter('character-zombie', 1.9, 'graveyard');
    c.root.position.set(x, 0, z);
    g.add(c.root);
    game.addCritter(c);
    return { c, cool: 1 + i, wait: 1 + i, home: new THREE.Vector3(x, 0, z), speak: 0 };
  });

  const area = {
    name: 'haunt',
    group: g,
    bg: 0x1d3a3a,
    fog: { color: 0x264746, near: 24, far: 70 },
    light: { hemi: 0.85, hemiColor: 0xa8ffe0, hemiGround: 0x2c4a4a, sun: 0.9, sunColor: 0xc8ffd8 },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 10),
    heading: Math.PI,
    colliders,
    open: false,
    onBump: null,
    chasing: true,
    gate, gatePos, safePos, keys, zombies,
  };

  const base = circleClamp(R);
  area.clamp = (p) => {
    if (area.open && Math.abs(p.x) < 2.2 && p.z < -R + 1) {
      p.x = Math.max(-2.2, Math.min(2.2, p.x));
      p.z = Math.max(-27, p.z);
      return;
    }
    base(p);
  };

  area.update = (dt, t) => {
    glows.forEach((gl, i) => (gl.material.opacity = 0.7 + Math.sin(t * 4 + i * 1.3) * 0.2));
    for (const k of keys) {
      if (k.taken) continue;
      k.group.rotation.y = t * 2;
      k.group.position.y = 0.8 + Math.sin(t * 2.5 + k.pos.x) * 0.15;
    }
    safe.material.opacity = 0.45 + Math.sin(t * 3) * 0.12;

    const p = game.player.position;
    for (const z of zombies) {
      const c = z.c;
      if (!area.chasing) {
        if (c.dest) c.dest = null;
        continue;
      }
      if (z.cool > 0) {
        z.cool -= dt;
        if (c.dest) {
          c.dest = null;
          c.play('idle');
        }
        continue;
      }
      const d = Math.hypot(p.x - c.root.position.x, p.z - c.root.position.z);
      if (d < 1.3) {
        z.cool = 3.2;
        c.dest = null;
        c.play('idle');
        area.onBump && area.onBump(z);
      } else if (d < 9.5) {
        c.speed = 1.35;
        c.dest = c.dest || new THREE.Vector3();
        c.dest.set(p.x, 0, p.z);
      } else if (!c.dest) {
        z.wait -= dt;
        if (z.wait <= 0) {
          z.wait = 2 + Math.random() * 3;
          c.goTo(z.home.x + (Math.random() - 0.5) * 6, z.home.z + (Math.random() - 0.5) * 6, { speed: 1.0 });
        }
      }
    }
  };
  return area;
}

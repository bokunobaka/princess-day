// Day 6: a friendly Halloween night: pumpkins to find, a costume chest, three cottages to trick-or-treat at.
import * as THREE from 'three';
import { mat, add, SPHERE } from '../models.js';
import { graveyard, Critter } from '../assets.js';
import { makeGlow, makeHouse, makeHauntedHouse, makeChest, makeBat } from '../props.js';
import { rng, place, ground, circleClamp, fenceRing, stars } from './util.js';

const R = 15.5;

export function buildHalloween(game) {
  const g = new THREE.Group();
  const rand = rng(21);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0x4d3f7a, 0x5f4f92, R + 1.5);
  fenceRing(g, R + 1, 0x3b2f5e, 0x6a56a8);

  // sky: moon + stars
  const moon = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false }));
  moon.scale.setScalar(5);
  moon.position.set(-24, 30, -55);
  g.add(moon);
  const halo = makeGlow(0xfff3c4, 26);
  halo.position.copy(moon.position);
  g.add(halo);
  stars(g, 140);

  // the haunted house far behind, glowing
  const haunted = makeHauntedHouse();
  place(g, haunted, 0, -27, { scale: 1.8 });

  // three cottages to trick-or-treat at
  const houses = [
    { x: -8.5, z: -5.5, wall: 0xffc99b, roof: 0xff6b35 },
    { x: 8.5, z: -5.5, wall: 0xd9c2ff, roof: 0x8a5cf5 },
    { x: 0, z: -12, wall: 0xb9f0c8, roof: 0x2ca58d },
  ].map((h) => {
    const m = makeHouse(h.wall, h.roof);
    place(g, m, h.x, h.z, { scale: 1.25 });
    block(h.x, h.z, 2.5);
    return { pos: new THREE.Vector3(h.x, 0, h.z), door: new THREE.Vector3(h.x + 0.85 * 1.25, 0, h.z + 1.6 * 1.25), stand: new THREE.Vector3(h.x + 1.1, 0, h.z + 3.4) };
  });

  // gravestones, trees, lanterns
  const stones = ['gravestone-round', 'gravestone-cross', 'gravestone-bevel', 'gravestone-broken'];
  const stoneSpots = [[-12, 3], [-13.5, -3], [12, 4], [13.5, -2], [-4, -8.5], [4.5, -8.8], [-11, -9], [11, -9.5]];
  stoneSpots.forEach(([x, z], i) => {
    place(g, graveyard(stones[i % 4], { scale: 2.1 }), x, z, { rot: rand() * 0.6 - 0.3 });
    block(x, z, 0.8);
  });
  const trees = ['pine', 'pine-fall', 'pine-crooked'];
  for (let i = 0; i < 30; i++) {
    const a = rand() * Math.PI * 2;
    const r = R + 4 + rand() * 18;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r - 6;
    if (z > 3) continue; // nothing between the camera and the princess
    place(g, graveyard(trees[i % 3], { height: 6 + rand() * 4 }), x, z, { rot: rand() * 6 });
  }
  [[0, -15]].forEach(([x, z]) => {
    place(g, graveyard('pine-crooked', { height: 5.5 }), x, z, { rot: rand() * 6 });
    block(x, z, 0.8);
  });

  const glows = [];
  const lantern = (x, z, big = false) => {
    const m = graveyard('lantern-glass', { height: big ? 2.4 : 1.4 });
    place(g, m, x, z);
    const gl = makeGlow(0xffb347, big ? 5 : 3.2);
    gl.position.set(x, big ? 1.6 : 0.9, z);
    g.add(gl);
    glows.push(gl);
  };
  [[-3.5, 6], [3.5, 6], [-4, -1], [4, -1], [-10, -2.5], [10, -2.5], [-3, -9], [3, -9]].forEach(([x, z]) => lantern(x, z));
  [[-7, 9], [7, 9]].forEach(([x, z]) => {
    place(g, graveyard('fire-basket', { height: 1.3 }), x, z);
    const gl = makeGlow(0xff8a3d, 4.5);
    gl.position.set(x, 1.4, z);
    g.add(gl);
    glows.push(gl);
    block(x, z, 0.6);
  });

  // glowing carved pumpkins for decoration
  [[-2, 7.5], [2, 8], [-9.5, -0.5], [9.5, 0], [-5.5, -3.2], [5.5, -3.2], [-1.5, -6.5], [1.8, -6.8]].forEach(([x, z], i) => {
    const p = graveyard(i % 2 ? 'pumpkin-carved' : 'pumpkin-tall-carved', { height: 0.9 + rand() * 0.5 });
    place(g, p, x, z, { rot: rand() * 6 });
    const gl = makeGlow(0xffa23a, 2.4);
    gl.position.set(x, 0.55, z);
    g.add(gl);
    glows.push(gl);
  });

  // pumpkins to find (plain orange ones tucked beside gravestones)
  const pumpkinSpots = [[-11.4, 4.5], [10.8, 5.8], [-12.5, -5], [12.5, -4], [-3, -9.8], [5.2, -10.2]];
  const pumpkins = pumpkinSpots.map(([x, z]) => {
    const m = graveyard('pumpkin', { height: 1.1 });
    place(g, m, x, z, { rot: rand() * 6 });
    return { group: m, pos: new THREE.Vector3(x, 0, z), picked: false };
  });

  // costume chest
  const chest = makeChest();
  place(g, chest, 7, 3.5, { rot: -0.5, scale: 1.1 });
  block(7, 3.5, 0.9);
  const chestPos = new THREE.Vector3(7, 0, 3.5);

  // friendly ghosts floating around (they just say boo)
  const ghosts = [[-6, -2], [6, 1.5]].map(([x, z]) => {
    const c = new Critter('character-ghost', 1.6, 'graveyard');
    c.root.position.set(x, 0, z);
    g.add(c.root);
    game.addCritter(c);
    return c;
  });

  // bats
  const bats = [];
  for (let i = 0; i < 6; i++) {
    const b = makeBat();
    g.add(b);
    bats.push({ mesh: b, a: rand() * 6, r: 5 + rand() * 9, h: 5 + rand() * 3, sp: 0.3 + rand() * 0.3, cx: (rand() - 0.5) * 8, cz: -8 + rand() * 4 });
  }

  const update = (dt, t) => {
    glows.forEach((gl, i) => (gl.material.opacity = 0.75 + Math.sin(t * 5 + i * 1.7) * 0.15));
    for (const b of bats) {
      b.a += dt * b.sp;
      b.mesh.position.set(b.cx + Math.cos(b.a) * b.r, b.h + Math.sin(t * 2 + b.a) * 0.6, b.cz + Math.sin(b.a) * b.r * 0.7);
      b.mesh.rotation.y = -b.a + Math.PI;
      const flap = Math.sin(t * 16 + b.a * 3) * 0.7;
      b.mesh.userData.wings[0].rotation.z = flap;
      b.mesh.userData.wings[1].rotation.z = -flap;
    }
    ghosts.forEach((c, i) => {
      c.root.position.y = 0.4 + Math.sin(t * 1.6 + i * 2) * 0.25;
      c.heading = Math.sin(t * 0.5 + i) * 1.5;
    });
  };

  return {
    name: 'halloween',
    group: g,
    bg: 0x2a1f55,
    fog: { color: 0x2f2360, near: 28, far: 80 },
    light: { hemi: 1.0, hemiColor: 0xb7b0ff, hemiGround: 0x4a3a7a, sun: 0.85, sunColor: 0xaebdff },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 9.5),
    heading: Math.PI,
    clamp: circleClamp(R),
    colliders,
    update,
    houses, pumpkins, chestPos, ghosts,
  };
}

// Day 14: the circus ring. Juggling balls to gather, a balance beam, and a lion who jumps through a hoop.
import * as THREE from 'three';
import { add, SPHERE, CYL } from '../models.js';
import { Critter } from '../assets.js';
import { makeGlow, makeBall } from '../props.js';
import { rng, place, ground, circleClamp, stars } from './util.js';

const R = 13;
const BOX = new THREE.BoxGeometry(1, 1, 1);
const BALL_COLORS = [0xff5f6b, 0xffd23f, 0x4dc9ff, 0x7be37a, 0xb48cff];

export function buildCircus(game) {
  const g = new THREE.Group();
  const rand = rng(17);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0xc9a7e8, 0xf2d9a0, R + 1);
  // striped ring edge
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const seg = add(g, BOX, i % 2 ? 0xffffff : 0xe5484d, [Math.cos(a) * (R + 1.2), 0.3, Math.sin(a) * (R + 1.2)], [1.5, 0.6, 0.9]);
    seg.rotation.y = -a + Math.PI / 2;
  }
  // tent wall of coloured panels behind the ring, with flags
  for (let i = 0; i < 30; i++) {
    const a = Math.PI + 0.1 + (i / 29) * (Math.PI * 1.0 - 0.2);
    const r = R + 4.5;
    const panel = add(g, BOX, i % 2 ? 0xffffff : 0xe5484d, [Math.cos(a) * r, 3, Math.sin(a) * r - 2], [2.2, 6, 0.4]);
    panel.rotation.y = -a + Math.PI / 2;
    const flag = add(g, new THREE.ConeGeometry(0.4, 0.9, 3), [0xffd23f, 0x4dc9ff, 0xff5fae][i % 3], [Math.cos(a) * r, 6.7, Math.sin(a) * r - 2]);
    flag.rotation.x = Math.PI;
    flag.castShadow = false;
  }
  stars(g, 80);
  // bleachers
  for (let row = 0; row < 3; row++) {
    for (let i = -4; i <= 4; i++) {
      const seat = add(g, BOX, BALL_COLORS[(i + row + 5) % 5], [i * 2.4, 0.5 + row * 0.8, -12 - row * 1.6], [2.2, 1 + row * 1.6, 1.5]);
    }
  }

  // balls to gather
  const ballSpots = [[-7.5, 3], [7.5, 4.5], [-4.5, -6], [5, -6.5], [0.5, 8]];
  const balls = ballSpots.map(([x, z], i) => {
    const b = makeBall(BALL_COLORS[i]);
    b.scale.setScalar(1.8);
    place(g, b, x, z);
    const gl = makeGlow(0xffffff, 2.2);
    gl.position.set(x, 0.9, z);
    g.add(gl);
    return { group: b, glow: gl, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  // balance beam
  const beam = new THREE.Group();
  add(beam, BOX, 0xd9a66f, [0, 0.62, 0], [11, 0.18, 0.6]);
  for (const x of [-5.2, 5.2]) add(beam, CYL, 0xffd23f, [x, 0.3, 0], [0.18, 0.6, 0.18]);
  place(g, beam, 0, -0.5);
  const beamStart = new THREE.Vector3(-6.4, 0, -0.5);
  const beamEnd = new THREE.Vector3(6.4, 0, -0.5);
  colliders.push({ x: 0, z: -0.5, hw: 5.6, hd: 0.55 });

  // the lion and the hoop
  const lion = new Critter('lion', 1.9);
  lion.root.position.set(-8.5, 0, -8);
  lion.heading = Math.PI / 2;
  lion.root.rotation.y = lion.heading;
  g.add(lion.root);
  game.addCritter(lion);
  const hoop = new THREE.Group();
  const ring = add(hoop, new THREE.TorusGeometry(1.1, 0.12, 10, 28), 0xff8a3d, [0, 1.9, 0]);
  ring.rotation.y = Math.PI / 2;
  add(hoop, CYL, 0xc99a6b, [0, 0.8, 0], [0.1, 1.6, 0.1]);
  const hg = makeGlow(0xffb347, 3.2);
  hg.position.set(0, 1.9, 0);
  hoop.add(hg);
  place(g, hoop, -1, -8);
  block(-1, -8, 0.4);

  // the audience of animals
  [['monkey', 1.2, 7.5, -8.5], ['elephant', 2.0, 9.5, -4]].forEach(([n, h, x, z]) => {
    const c = new Critter(n, h);
    c.root.position.set(x, n === 'monkey' ? 0.55 : 0, z);
    c.heading = -Math.PI / 2;
    c.root.rotation.y = c.heading;
    g.add(c.root);
    game.addCritter(c);
  });
  const bigBall = add(g, SPHERE, 0xff5f6b, [7.5, 0.5, -8.5], 0.55);
  block(7.5, -8.5, 0.7);

  const update = (dt, t) => {
    balls.forEach((b, i) => {
      if (b.taken) return;
      b.group.position.y = Math.abs(Math.sin(t * 2.4 + i)) * 0.25;
      b.glow.material.opacity = 0.55 + Math.sin(t * 3 + i) * 0.25;
    });
  };

  return {
    name: 'circus',
    group: g,
    bg: 0x2f2a66,
    fog: null,
    light: { hemi: 1.0, hemiColor: 0xfff0ff, hemiGround: 0xc8a8e8, sun: 1.5, sunColor: 0xffe9c8 },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 9),
    heading: Math.PI,
    clamp: circleClamp(R),
    colliders,
    update,
    balls, beamStart, beamEnd, lion, hoop, hoopPos: new THREE.Vector3(-1, 0, -8), lionPos: new THREE.Vector3(-8.5, 0, -8),
  };
}

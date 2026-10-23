// Day 7: Mõmmi's birthday party in a bright room: balloons to collect, presents to find, a cake to light.
import * as THREE from 'three';
import { add, makeTeddy, makeChair, makeTable, CYL, SPHERE } from '../models.js';
import { Critter, holiday } from '../assets.js';
import { makeBalloon, makePartyHat, makeGlow } from '../props.js';
import { buildRoom, plankMat, furn, put, rug, windowPane } from './room.js';

const BALLOON_COLORS = [0xff5fae, 0x6ad7ff, 0xffd23f, 0x7be37a, 0xb48cff, 0xff8a3d];

export function buildParty(game) {
  const W = 22;
  const D = 15;
  const room = buildRoom({
    w: W, d: D, wallH: 7.5,
    floorMat: plankMat(0xfdebd0, 0xf6dcb8, W / 2, D / 2),
    wallA: 0xfff0b8, wallB: 0xffd9ec,
  });
  const g = room.group;
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  rug(g, 0, -1.5, 5.2, 0xffc2e0, 0xfff0b8);
  windowPane(g, -6.5, 4.6, -D / 2 + 0.05, 3, 3);
  windowPane(g, 6.5, 4.6, -D / 2 + 0.05, 3, 3);

  // bunting across the back wall
  const flagColors = [0xff5fae, 0xffd23f, 0x6ad7ff, 0x7be37a, 0xb48cff];
  for (let i = 0; i < 17; i++) {
    const x = -8 + i;
    const y = 6.4 - Math.sin((i / 16) * Math.PI) * 0.5;
    const f = add(g, new THREE.ConeGeometry(0.3, 0.55, 3), flagColors[i % 5], [x, y - 0.1, -D / 2 + 0.2]);
    f.rotation.x = Math.PI;
    f.castShadow = false;
  }

  // the party table with the cake
  const table = makeTable();
  put(g, table, 0, -1.8);
  block(0, -1.8, 1.7);
  const cake = new THREE.Group();
  add(cake, CYL, 0xffb3d9, [0, 0.17, 0], [0.62, 0.34, 0.62]);
  add(cake, CYL, 0xffffff, [0, 0.5, 0], [0.42, 0.32, 0.42]);
  const ring = add(cake, new THREE.TorusGeometry(0.62, 0.05, 8, 24), 0xffffff, [0, 0.34, 0]);
  ring.rotation.x = Math.PI / 2;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    add(cake, SPHERE, 0xff4d6d, [Math.cos(a) * 0.4, 0.69, Math.sin(a) * 0.4], 0.055);
  }
  const flames = [];
  [-0.16, 0, 0.16].forEach((dx, i) => {
    add(cake, CYL, [0x6ad7ff, 0xffd23f, 0xff8fc7][i], [dx, 0.82, 0], [0.028, 0.22, 0.028]);
    const f = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: 0xffb347 }));
    f.scale.set(0.04, 0.075, 0.04);
    f.position.set(dx, 0.98, 0);
    f.visible = false;
    cake.add(f);
    flames.push(f);
  });
  const glow = makeGlow(0xffd27a, 1.6);
  glow.position.set(0, 1.0, 0);
  glow.visible = false;
  cake.add(glow);
  put(g, cake, 0, -1.8, 0, 0.98);

  // Mõmmi in the birthday chair, wearing a party hat
  const chair = makeChair();
  put(g, chair, 0, -4.4, 0);
  block(0, -4.4, 0.6);
  const teddy = makeTeddy();
  put(g, teddy, 0, -4.35, 0, 0.52);
  const hat = makePartyHat(0xff5fae);
  hat.position.set(0, 0.36, 0);
  hat.rotation.z = -0.15;
  hat.scale.setScalar(1.5);
  teddy.userData.head.add(hat);

  // guests
  const guests = [['bunny', 1.1, -5.2, -1.2], ['panda', 1.5, 5.4, -1.0], ['elephant', 1.8, -4.4, -5.2]].map(([n, h, x, z]) => {
    const c = new Critter(n, h);
    c.root.position.set(x, 0, z);
    c.heading = Math.atan2(-x, -1.8 - z);
    c.root.rotation.y = c.heading;
    g.add(c.root);
    game.addCritter(c);
    return c;
  });

  // furniture for cosiness (and hiding places)
  furn(g, 'loungeSofa', -8.4, -1.6, { scale: 4.2, rot: Math.PI / 2 });
  block(-8.4, -1.6, 1.6);
  furn(g, 'pottedPlant', 8.8, -5.6, { scale: 4.2 });
  block(8.8, -5.6, 0.7);
  furn(g, 'speaker', -9.2, -5.6, { scale: 4 });
  furn(g, 'speaker', 9.4, 2.4, { scale: 4 });
  furn(g, 'bookcaseOpen', 9.5, -2.2, { scale: 4.4, rot: -Math.PI / 2 });
  block(9.5, -2.2, 1.3);

  // balloons waiting to be gathered
  const balloonSpots = [[-7, 3], [-3.5, 4.4], [4, 4], [7.2, 1.6], [0.5, 2.6]];
  const balloons = balloonSpots.map(([x, z], i) => {
    const b = makeBalloon(BALLOON_COLORS[i % 6]);
    put(g, b, x, z, 0, 0);
    return { group: b, pos: new THREE.Vector3(x, 0, z), phase: i * 1.3, taken: false };
  });
  // where gathered balloons end up (a bunch near the ceiling)
  const anchors = [[-7.5, -6.6], [-3.8, -6.8], [3.8, -6.8], [7.5, -6.6], [0, -6.9]].map(([x, z]) => new THREE.Vector3(x, 3.6, z));

  // presents to find
  const kinds = ['present-a-cube', 'present-b-round', 'present-a-rectangle'];
  const presentSpots = [[-9.4, 0.8], [8.8, -4.0], [-2.6, -6.2]];
  const presents = presentSpots.map(([x, z], i) => {
    const m = holiday(kinds[i], { height: 0.9 });
    put(g, m, x, z, 0, 0);
    m.rotation.y = i * 1.2;
    return { group: m, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  const teddyState = { cheer: 0 };
  const update = (dt, t) => {
    for (const b of balloons) if (!b.taken) b.group.userData.body.position.y = 1.95 + Math.sin(t * 1.6 + b.phase) * 0.12;
    flames.forEach((f, i) => f.visible && f.scale.set(0.04, 0.075 + Math.sin(t * 12 + i * 2) * 0.012, 0.04));
    teddyState.cheer = Math.max(0, teddyState.cheer - dt);
    const arms = teddy.userData.arms;
    if (teddyState.cheer > 0) {
      teddy.position.y = 0.52 + Math.abs(Math.sin(t * 9)) * 0.3;
      arms[0].rotation.z = -2.4 + Math.sin(t * 14) * 0.3;
      arms[1].rotation.z = 2.4 - Math.sin(t * 14) * 0.3;
    } else {
      teddy.position.y = 0.52;
      arms[0].rotation.z = -0.1;
      arms[1].rotation.z = 0.1;
      teddy.userData.head.rotation.z = Math.sin(t * 1.1) * 0.07;
    }
  };

  return {
    name: 'party',
    group: g,
    bg: 0xfff0f6,
    fog: null,
    camScale: 0.85,
    spawn: new THREE.Vector3(0, 0, 5.8),
    heading: Math.PI,
    clamp: room.clamp,
    colliders,
    update,
    tablePos: new THREE.Vector3(0, 0, -1.8),
    cake, flames, glow, teddy, guests, balloons, anchors, presents,
    cheerTeddy: (s = 4) => (teddyState.cheer = s),
  };
}

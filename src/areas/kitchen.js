import * as THREE from 'three';
import { add, CYL, SPHERE } from '../models.js';
import { food } from '../assets.js';
import { buildRoom, checkerMat, furn, put, rug, windowPane } from './room.js';

export function buildKitchen(game) {
  const W = 17;
  const D = 11.5;
  const room = buildRoom({
    w: W, d: D,
    floorMat: checkerMat(0xfff6ea, 0xffd9e8, W / 1.5, D / 1.5),
    wallA: 0xe3fff1, wallB: 0xcdf7e2,
  });
  const g = room.group;
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });
  const S = 3.6; // kit scale
  const step = 0.43 * S;
  const zBack = -D / 2 + 0.62;

  // the counter run along the back wall
  // the oven sits at the right end of the counter, well away from the mixing bowl in the middle
  const run = ['kitchenFridge', 'kitchenCabinet', 'kitchenSink', 'kitchenCabinet', 'kitchenCabinet',
    'kitchenCabinet', 'kitchenCabinet', 'kitchenStove', 'kitchenFridge'];
  let stovePos = null;
  run.forEach((name, i) => {
    const x = (i - 4) * step;
    furn(g, name, x, zBack, { scale: S });
    if (name === 'kitchenStove') stovePos = new THREE.Vector3(x, 0, zBack);
    block(x, zBack, 0.95);
  });
  // uppers + gadgets
  [-3, -2, 2, 3].forEach((i) => furn(g, 'kitchenCabinetUpper', i * step, zBack - 0.1, { scale: S, y: 4.3 }));
  furn(g, 'kitchenCoffeeMachine', 2 * step, zBack, { scale: S, y: 1.62 });
  furn(g, 'toaster', -1 * step, zBack + 0.1, { scale: S, y: 1.62 });
  windowPane(g, -6.2, 5.2, -D / 2 + 0.05, 2.4, 2.4);
  windowPane(g, 6.2, 5.2, -D / 2 + 0.05, 2.4, 2.4);

  rug(g, 0, 1.2, 4.0, 0xffe3ef, 0xfff6fa);

  // the island where the mixing happens
  const island = new THREE.Group();
  add(island, CYL, 0xffffff, [0, 0.5, 0], [0.3, 1, 0.3]);
  add(island, CYL, 0xffffff, [0, 0.05, 0], [1.0, 0.1, 1.0]);
  add(island, CYL, 0xe9b98a, [0, 1.02, 0], [1.9, 0.1, 1.9]);
  add(island, CYL, 0xffc2e0, [0, 1.09, 0], [1.75, 0.05, 1.75]);
  put(g, island, 0, 1.0);
  block(0, 1.0, 1.9);
  const bowl = food('bowl', { scale: 2.6 });
  put(island, bowl, 0, 0, 0, 1.11);
  const whisk = food('whisk', { scale: 3.0 });
  put(island, whisk, 1.1, 0.4, 0.5, 1.11);
  const islandTop = 1.11;

  // stools and a flower pot for cosiness
  furn(g, 'stoolBar', -3.4, 2.4, { scale: 3.4 });
  furn(g, 'stoolBar', 3.4, 2.4, { scale: 3.4 });
  furn(g, 'pottedPlant', 7.3, -3.2, { scale: 4 });
  block(7.3, -3.2, 0.7);

  // ingredient spots (the day script puts the models there)
  const spots = {
    egg: new THREE.Vector3(-3 * step, 1.65, zBack + 0.25),
    flour: new THREE.Vector3(6.6, 0, -1.2),
    strawberry: new THREE.Vector3(-2 * step, 1.65, zBack + 0.25),
  };
  // flour sits on a little crate
  const crate = new THREE.Group();
  add(crate, new THREE.BoxGeometry(1.2, 0.7, 1.2), 0xe0b27d, [0, 0.35, 0]);
  put(g, crate, 6.6, -1.2);
  block(6.6, -1.2, 0.8);
  spots.flour.y = 0.7;

  return {
    name: 'kitchen',
    group: g,
    bg: 0xe3fff1,
    fog: null,
    camScale: 0.72,
    spawn: new THREE.Vector3(0, 0, 5),
    heading: Math.PI,
    clamp: room.clamp,
    colliders,
    spots,
    stovePos,
    island: { pos: new THREE.Vector3(0, 0, 1.0), group: island, top: islandTop },
    bowl,
    whisk,
    update() {},
  };
}

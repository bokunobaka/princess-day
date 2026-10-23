import * as THREE from 'three';
import { add, SPHERE } from '../models.js';
import { Critter } from '../assets.js';
import { buildRoom, plankMat, furn, put, rug, door, windowPane } from './room.js';

export function buildBedroom(game) {
  const W = 18;
  const D = 13;
  const room = buildRoom({ w: W, d: D, floorMat: plankMat(0xf6dcc0, 0xf0cfae, W / 2, D / 2) });
  const g = room.group;
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  rug(g, 0, 0.5, 3.4);
  windowPane(g, -5.5, 3.6, -D / 2 + 0.05);
  windowPane(g, 5.5, 3.6, -D / 2 + 0.05);
  const doorObj = door(g, 0, -D / 2 + 0.1);

  // bed (left), wardrobe (right), bookcase + plant
  furn(g, 'bedSingle', -6.0, -3.2, { scale: 4.6 });
  block(-6.0, -3.2, 2.0);
  furn(g, 'pillow', -6.6, -5.3, { scale: 3.4, y: 1.55 });
  furn(g, 'sideTable', -2.6, -5.6, { scale: 3.6 });
  furn(g, 'lampRoundTable', -2.6, -5.6, { scale: 3.4, y: 1.4 });
  block(-2.6, -5.6, 1.0);

  const wardrobe = furn(g, 'bookcaseClosedDoors', 5.8, -5.3, { scale: 5.2 });
  block(5.8, -5.3, 1.6);
  furn(g, 'bookcaseOpen', 8.1, -2.4, { scale: 4.4, rot: -Math.PI / 2 });
  block(8.1, -2.4, 1.4);
  furn(g, 'pottedPlant', 3.0, -5.6, { scale: 4 });
  furn(g, 'cabinetBed', -7.6, 2.2, { scale: 4, rot: Math.PI / 2 });
  block(-7.4, 2.2, 1.4);
  furn(g, 'bench', 5.6, 3.4, { scale: 4, rot: -Math.PI / 2 });
  block(5.6, 3.4, 1.5);
  furn(g, 'lampRoundFloor', -8, -0.2, { scale: 4 });

  // the sleepy friends to wake up (lying on their sides)
  const sleepers = ['bunny', 'panda', 'cat'].map((name) => {
    const c = new Critter(name, 1.0);
    c.root.rotation.z = 0;
    game.addCritter(c);
    g.add(c.root);
    return c;
  });
  sleepers[0].root.position.set(-5.6, 1.7, -3.0); // on the bed
  sleepers[1].root.position.set(2.2, 0.0, 1.6); // on the rug
  sleepers[2].root.position.set(5.6, 1.35, 3.4); // on the bench
  sleepers.forEach((c, i) => {
    c.model.rotation.z = Math.PI / 2; // lying down
    c.model.position.y = 0.5;
    c.heading = c.root.rotation.y = [0.6, -0.5, -1.4][i];
    c.mixer.stopAllAction();
    c.current = null;
  });

  return {
    name: 'bedroom',
    group: g,
    bg: 0xffe9f3,
    fog: null,
    camScale: 0.72,
    spawn: new THREE.Vector3(0, 0, 3.2),
    heading: Math.PI,
    clamp: room.clamp,
    colliders,
    wardrobePos: new THREE.Vector3(5.8, 0, -3.6),
    doorPos: new THREE.Vector3(0, 0, -D / 2 + 1),
    sleepers,
    update() {},
  };
}

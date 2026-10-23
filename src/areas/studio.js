// Day 13: a ballet studio with a mirror wall, a barre and a little stage with curtains.
import * as THREE from 'three';
import { add, makeTeddy, SPHERE, CYL } from '../models.js';
import { Critter } from '../assets.js';
import { makeGlow, makeBalletShoes, makeTutu, makeRibbon } from '../props.js';
import { buildRoom, plankMat, put, rug, windowPane } from './room.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);

export function buildStudio(game) {
  const W = 20;
  const D = 13;
  const room = buildRoom({
    w: W, d: D, wallH: 7,
    floorMat: plankMat(0xf6e6cf, 0xefd9b8, W / 2, D / 2),
    wallA: 0xf3e6ff, wallB: 0xe6d4ff,
  });
  const g = room.group;
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  // mirror wall
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.8), new THREE.MeshBasicMaterial({ color: 0xe3f4ff }));
  mirror.position.set(-2, 3.4, -D / 2 + 0.08);
  g.add(mirror);
  add(g, BOX, 0xffd23f, [-2, 5.4, -D / 2 + 0.1], [12.4, 0.2, 0.15]);
  add(g, BOX, 0xffd23f, [-2, 1.4, -D / 2 + 0.1], [12.4, 0.2, 0.15]);
  for (const x of [-8.1, 4.1]) add(g, BOX, 0xffd23f, [x, 3.4, -D / 2 + 0.1], [0.2, 4.2, 0.15]);
  // the barre
  const bar = add(g, CYL, 0xffd23f, [-2, 2.1, -D / 2 + 1.0], [0.07, 12, 0.07]);
  bar.rotation.z = Math.PI / 2;
  for (const x of [-7, -2, 3]) add(g, CYL, 0xc99a6b, [x, 1.05, -D / 2 + 1.0], [0.05, 2.1, 0.05]);
  windowPane(g, 7.2, 4.6, -D / 2 + 0.05, 2.6, 3);

  rug(g, 0, 1.5, 4.2, 0xffd9ec, 0xfff0f8);

  // stage with curtains
  const stage = new THREE.Group();
  add(stage, BOX, 0xd9a66f, [0, 0.3, 0], [7, 0.6, 4]);
  add(stage, BOX, 0xff8fc7, [0, 0.62, 1.9], [7, 0.12, 0.2]);
  const curtainL = new THREE.Group();
  const curtainR = new THREE.Group();
  add(curtainL, BOX, 0xe5484d, [0, 1.7, 0], [3.5, 3.0, 0.25]);
  add(curtainR, BOX, 0xe5484d, [0, 1.7, 0], [3.5, 3.0, 0.25]);
  curtainL.position.set(-1.75, 0.6, 1.6);
  curtainR.position.set(1.75, 0.6, 1.6);
  stage.add(curtainL, curtainR);
  add(stage, BOX, 0xffd23f, [0, 3.35, 1.6], [7.4, 0.25, 0.3]);
  put(g, stage, 6.2, -3.6);
  block(6.2, -3.6, 2.8);
  const stageGlow = makeGlow(0xfff1a8, 4.5);
  stageGlow.material.opacity = 0.45;
  stageGlow.position.set(6.2, 3.2, -5.2);
  stageGlow.visible = false;
  g.add(stageGlow);

  // things to find
  const shoes = makeBalletShoes();
  const tutu = makeTutu();
  const ribbon = makeRibbon();
  const spots = [[-7.4, 2.5, shoes], [-2.8, -4.5, tutu], [8, 3.4, ribbon]];
  const finds = spots.map(([x, z, m], i) => {
    m.scale.setScalar(1.7);
    put(g, m, x, z);
    const gl = makeGlow(0xffffff, 2.4);
    gl.position.set(x, 0.9, z);
    g.add(gl);
    return { group: m, glow: gl, pos: new THREE.Vector3(x, 0, z), taken: false };
  });

  // glowing floor marks to dance on
  const marks = [[-4.2, 1.2], [0, -1.6], [4.2, 1.2]].map(([x, z]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.05, 20), new THREE.MeshBasicMaterial({ color: 0xff8fc7, transparent: true, opacity: 0.5 }));
    m.position.set(x, 0.06, z);
    m.visible = false;
    g.add(m);
    return m;
  });

  // friends at the barre
  const friends = [['bunny', 1.1, -6, -4.6], ['cat', 1.2, -3.2, -4.6]].map(([n, h, x, z]) => {
    const c = new Critter(n, h);
    c.root.position.set(x, 0, z);
    c.heading = 0;
    g.add(c.root);
    game.addCritter(c);
    return c;
  });

  const update = (dt, t) => {
    finds.forEach((f, i) => !f.taken && (f.glow.material.opacity = 0.5 + Math.sin(t * 3 + i) * 0.25));
    marks.forEach((m, i) => m.visible && m.material.opacity < 1 && (m.material.opacity = 0.4 + Math.sin(t * 4 + i) * 0.2));
  };

  return {
    name: 'studio',
    group: g,
    bg: 0xf3e6ff,
    fog: null,
    camScale: 0.82,
    spawn: new THREE.Vector3(0, 0, 5),
    heading: Math.PI,
    clamp: room.clamp,
    colliders,
    update,
    finds, marks, friends, curtainL, curtainR, stageGlow,
    stagePos: new THREE.Vector3(6.2, 0, -1.2),
  };
}

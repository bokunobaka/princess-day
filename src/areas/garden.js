// The garden: scenery, flowers, Teddy's tea table, and the little animations that make it feel alive.
import * as THREE from 'three';
import {
  mat, add, SPHERE, CYL, PINK,
  makeFlower, makeTree, makeChair, makeTable, makeTeapot, makeCup, makeCupcake, makeVase,
  makeTeddy, makeCloud, makeButterfly, makeCastle,
} from '../models.js';
import { Critter } from '../assets.js';

export const BOUNDS = 15.5;
export const TABLE_POS = new THREE.Vector3(0, 0, -9);
export const START_POS = new THREE.Vector3(0, 0, 7);

// deterministic scatter so the garden looks the same every time
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

const FLOWER_COLORS = { pink: PINK, yellow: 0xffe35a, white: 0xffffff, purple: 0xb48cff };
const FLOWER_SPOTS = [
  ['pink', -3, 5], ['pink', 4, 3], ['pink', -6, 1], ['pink', 6.5, -2.5],
  ['pink', 2, -3.5], ['pink', -4.5, -5], ['pink', 9, 4.5], ['pink', -8, 6],
  ['yellow', 3, 7], ['yellow', -2, 2.5], ['yellow', 7, 0], ['yellow', -6.5, -4],
  ['white', 1.2, -1], ['white', -10, 2], ['white', 10, -5], ['white', 5, 8.5],
  ['purple', -4, 9], ['purple', 0, 3.5],
];

export function buildGarden(game) {
  const scene = new THREE.Group();
  const rand = rng(7);
  const colliders = [];
  const sway = [];

  // ---- ground
  const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 64), mat(0x9be37a));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(BOUNDS + 1, 64), mat(0xa9ee86));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.01;
  lawn.receiveShadow = true;
  scene.add(lawn);

  // stepping stones to the tea table
  for (let i = 0; i < 9; i++) {
    const s = add(scene, CYL, 0xf6e7c8, [Math.sin(i * 1.3) * 0.5, 0.03, 5.2 - i * 1.3], [0.55, 0.05, 0.42]);
    s.castShadow = false;
    s.receiveShadow = true;
  }

  // grass tufts
  const tuftGeo = new THREE.ConeGeometry(0.07, 0.3, 5);
  const tufts = new THREE.InstancedMesh(tuftGeo, mat(0x7ed36a), 260);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 260; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (BOUNDS + 3);
    m4.makeScale(1, 0.6 + rand() * 0.9, 1).setPosition(Math.cos(a) * r, 0.14, Math.sin(a) * r);
    tufts.setMatrixAt(i, m4);
  }
  scene.add(tufts);

  // ---- fence
  const postGeo = new THREE.BoxGeometry(0.2, 1, 0.2);
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    const p = new THREE.Mesh(postGeo, mat(0xffffff));
    p.position.set(Math.cos(a) * (BOUNDS + 1), 0.5, Math.sin(a) * (BOUNDS + 1));
    p.castShadow = true;
    scene.add(p);
  }
  for (const y of [0.35, 0.75]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(BOUNDS + 1, 0.05, 6, 120), mat(0xffd6ea));
    rail.rotation.x = Math.PI / 2;
    rail.position.y = y;
    scene.add(rail);
  }

  // ---- sky stuff: hills, rainbow, castle, clouds
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI * 1.0 - Math.PI * 0.0;
    const r = 52 + rand() * 8;
    const hill = new THREE.Mesh(SPHERE, mat(i % 2 ? 0x8fdc86 : 0x9be391));
    hill.scale.set(14 + rand() * 6, 6 + rand() * 5, 14);
    hill.position.set(Math.cos(a) * r, -1, Math.sin(a) * r - 6);
    scene.add(hill);
  }
  const rainbowColors = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0xb197fc];
  rainbowColors.forEach((c, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(24 - i * 1.3, 0.7, 8, 64, Math.PI),
      new THREE.MeshBasicMaterial({ color: c, fog: false, transparent: true, opacity: 0.85 })
    );
    arc.position.set(-14, -1, -50);
    scene.add(arc);
  });
  const castle = makeCastle();
  castle.position.set(18, 0, -40);
  castle.scale.setScalar(1.3);
  scene.add(castle);

  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const c = makeCloud();
    c.position.set((rand() - 0.5) * 90, 18 + rand() * 8, -20 - rand() * 40);
    c.scale.setScalar(1.2 + rand() * 1.3);
    scene.add(c);
    clouds.push(c);
  }

  // ---- trees
  const treeSpots = [
    [-9.3, -2.3, 1.15], [8.5, -6.5, 1.0], [-12, 5.5, 1.05], [11, 2.5, 1.1],
    [-5.5, -9, 0.95], [6, -11, 0.9], [-13, -7, 1.0], [13, -9, 1.1],
    
  ];
  treeSpots.forEach(([x, z, s], i) => {
    const t = makeTree(rand, i % 3 === 0);
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    t.rotation.y = rand() * 6;
    scene.add(t);
    colliders.push({ x, z, r: 0.75 * s });
  });
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = 20 + rand() * 18;
    const t = makeTree(rand, rand() < 0.3);
    t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 4);
    t.scale.setScalar(1.3 + rand() * 0.8);
    scene.add(t);
  }

  // bushes
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2;
    const r = 13 + rand() * 2.4;
    const b = new THREE.Group();
    add(b, SPHERE, 0x68c96b, [0, 0.35, 0], [0.7, 0.5, 0.7]);
    add(b, SPHERE, 0x75d577, [0.5, 0.3, 0.1], [0.5, 0.4, 0.5]);
    add(b, SPHERE, 0xff9ccc, [0.1, 0.65, 0.3], 0.1);
    b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    scene.add(b);
  }

  // ---- flowers
  const flowers = FLOWER_SPOTS.map(([name, x, z]) => {
    const group = makeFlower(FLOWER_COLORS[name]);
    group.position.set(x, 0, z);
    group.rotation.y = rand() * 6;
    group.scale.setScalar(1.35);
    scene.add(group);
    const f = { group, name, pink: name === 'pink', picked: false, phase: rand() * 6 };
    sway.push(f);
    return f;
  });

  // ---- tea table + chairs
  const table = makeTable();
  table.position.copy(TABLE_POS);
  scene.add(table);
  colliders.push({ x: TABLE_POS.x, z: TABLE_POS.z, r: 1.55 });

  const seats = {};
  const seatDefs = {
    teddy: [0, -11.5],
    bunny: [2.7, -9],
    princess: [-2.7, -9],
    nw: [-2.0, -11.0],
    ne: [2.0, -11.0],
  };
  for (const [who, [x, z]] of Object.entries(seatDefs)) {
    const chair = makeChair();
    chair.position.set(x, 0, z);
    chair.rotation.y = Math.atan2(TABLE_POS.x - x, TABLE_POS.z - z);
    scene.add(chair);
    seats[who] = new THREE.Vector3(x, 0, z);
    if (who !== 'princess') colliders.push({ x, z, r: 0.45 });
  }

  const teddy = makeTeddy();
  teddy.position.set(seatDefs.teddy[0], 0.52, seatDefs.teddy[1] + 0.05);
  scene.add(teddy);

  // things that appear on the table at the party
  const spread = new THREE.Group();
  spread.visible = false;
  spread.position.copy(TABLE_POS);
  spread.position.y = 0.98;
  const teapotOnTable = makeTeapot();
  teapotOnTable.position.set(-0.1, 0, -0.15);
  spread.add(teapotOnTable);
  [[-0.7, 0.5], [0.7, 0.5], [0, 0.85]].forEach(([x, z]) => {
    const cup = makeCup();
    cup.position.set(x, 0, z);
    spread.add(cup);
  });
  const treats = new THREE.Group();
  [[0.55, -0.35, 0xffffff], [0.8, -0.1, 0xffb3d9], [0.35, -0.6, 0xfff0a0]].forEach(([x, z, c]) => {
    const cc = makeCupcake(c);
    cc.position.set(x, 0, z);
    treats.add(cc);
  });
  spread.add(treats);
  scene.add(spread);
  let vase = null;
  const serve = (flowerCount, withTreats = true) => {
    treats.visible = withTreats;
    if (vase) spread.remove(vase);
    vase = null;
    if (flowerCount > 0) {
      vase = makeVase(Math.min(flowerCount, 5));
      vase.position.set(-0.6, 0, -0.3);
      spread.add(vase);
    }
    spread.visible = true;
  };

  // ---- the hidden teapot (revealed in quest step 2)
  const teapot = new THREE.Group();
  const teapotModel = makeTeapot();
  teapotModel.scale.setScalar(1.6);
  teapot.add(teapotModel);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 9, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff1a8, transparent: true, opacity: 0.28, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    })
  );
  beam.position.y = 4.5;
  teapot.add(beam);
  teapot.position.set(-10.8, 0, -4.4);
  teapot.visible = false;
  scene.add(teapot);

  // ---- bunny (Kenney model, wanders around its patch)
  const bunny = new Critter('bunny', 0.8);
  const bunnyHome = new THREE.Vector3(5, 0, -4);
  bunny.root.position.copy(bunnyHome);
  scene.add(bunny.root);
  game.addCritter(bunny);
  const bunnyAI = { wait: 1, forced: false, joy: 0 };

  // ---- butterflies
  const butterflies = [0xff8fc7, 0xffd166, 0x9bd1ff, 0xc8a6ff, 0xff9f7a].map((c, i) => {
    const b = makeButterfly(c);
    scene.add(b);
    return { mesh: b, a: rand() * 6, r: 4 + rand() * 9, h: 1.2 + rand() * 1.2, sp: 0.18 + rand() * 0.2, i };
  });

  // ------------------------------------------------------------- behaviours
  const teddyState = { cheer: 0, wave: 0 };

  function update(dt, t) {
    for (const f of sway) {
      if (f.picked) continue;
      f.group.userData.head.rotation.z = Math.sin(t * 1.6 + f.phase) * 0.12;
    }
    for (const c of clouds) {
      c.position.x += dt * 0.4;
      if (c.position.x > 60) c.position.x = -60;
    }
    for (const b of butterflies) {
      b.a += dt * b.sp;
      const x = Math.cos(b.a) * b.r + Math.sin(t * 0.7 + b.i) * 1.5;
      const z = Math.sin(b.a * 1.3) * b.r * 0.9 + 1;
      b.mesh.position.set(x, b.h + Math.sin(t * 2 + b.i) * 0.3, z);
      b.mesh.rotation.y = -b.a * 1.3 + Math.PI / 2;
      const flap = Math.sin(t * 22 + b.i) * 0.9;
      b.mesh.userData.wings[0].rotation.z = flap;
      b.mesh.userData.wings[1].rotation.z = -flap;
    }

    // teddy
    const head = teddy.userData.head;
    const arms = teddy.userData.arms;
    teddyState.cheer = Math.max(0, teddyState.cheer - dt);
    teddyState.wave = Math.max(0, teddyState.wave - dt);
    if (teddyState.cheer > 0) {
      teddy.position.y = 0.52 + Math.abs(Math.sin(t * 9)) * 0.3;
      arms[0].rotation.z = -2.4 + Math.sin(t * 14) * 0.3;
      arms[1].rotation.z = 2.4 - Math.sin(t * 14) * 0.3;
      head.rotation.z = Math.sin(t * 9) * 0.15;
    } else {
      teddy.position.y = 0.52;
      head.rotation.z = Math.sin(t * 1.1) * 0.07;
      arms[0].rotation.z = -0.1;
      arms[1].rotation.z = teddyState.wave > 0 ? 2.3 + Math.sin(t * 14) * 0.35 : 0.1;
    }

    // bunny wanders, or goes where it's told
    const ai = bunnyAI;
    if (ai.joy > 0) {
      ai.joy -= dt;
      if (ai.joy <= 0) bunny.play('idle');
    } else if (!bunny.dest && !ai.forced) {
      ai.wait -= dt;
      if (ai.wait <= 0) {
        ai.wait = 1.5 + Math.random() * 2.5;
        const a = Math.random() * Math.PI * 2;
        bunny.goTo(bunnyHome.x + Math.cos(a) * 3, bunnyHome.z + Math.sin(a) * 3, { speed: 1.5 });
      }
    }
  }

  const clamp = (p) => {
    const r = Math.hypot(p.x, p.z);
    if (r > BOUNDS) {
      p.x *= BOUNDS / r;
      p.z *= BOUNDS / r;
    }
  };

  return {
    name: 'garden',
    group: scene,
    bg: 0xbfe6ff,
    fog: { color: 0xcdeeff, near: 32, far: 95 },
    camScale: 1,
    spawn: START_POS.clone(),
    heading: Math.PI,
    clamp,
    colliders, flowers, table: TABLE_POS, seats, spread, serve,
    teddy, teapot, beam, bunny,
    update,
    cheerTeddy: (s = 3) => (teddyState.cheer = s),
    waveTeddy: (s = 1.6) => (teddyState.wave = s),
    bunnyGoTo: (x, z, onArrive) => {
      bunnyAI.forced = true;
      bunny.goTo(x, z, { speed: 2.4, onArrive });
    },
    freezeBunny: () => (bunnyAI.forced = true),
    bunnyJoy: (s = 1.2) => {
      bunnyAI.joy = s;
      bunny.dest = null;
      bunny.play('dance');
    },
  };
}

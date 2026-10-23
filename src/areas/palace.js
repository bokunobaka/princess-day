// The palace garden: home base. Stations for the pet, flower beds, photo booth, stable, dance floor,
// sticker book, day map and wardrobe mirror.
import * as THREE from 'three';
import { mat, add, makeFlower, makeTree, makeCastle, makeButterfly, SPHERE, CYL, PINK } from '../models.js';
import { Critter } from '../assets.js';
import { makeGlow, makeUmbrella, makeUnicorn } from '../props.js';
import { rng, place, ground, circleClamp, fenceRing } from './util.js';

const R = 16.5;
const FLOWER_COLORS = { pink: PINK, yellow: 0xffe35a, white: 0xffffff, purple: 0xb48cff };
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CONE = new THREE.ConeGeometry(1, 1, 16);

function backdropTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 192;
  const g = c.getContext('2d');
  if (kind === 0) {
    // castle on a hill
    const sky = g.createLinearGradient(0, 0, 0, 192);
    sky.addColorStop(0, '#9fdcff');
    sky.addColorStop(1, '#e9f7ff');
    g.fillStyle = sky;
    g.fillRect(0, 0, 256, 192);
    g.fillStyle = '#8fdc86';
    g.beginPath();
    g.ellipse(128, 215, 180, 90, 0, 0, 7);
    g.fill();
    g.fillStyle = '#ffe3f1';
    g.fillRect(90, 80, 76, 60);
    for (const x of [78, 128, 168]) {
      g.fillStyle = '#ff6fb1';
      g.beginPath();
      g.moveTo(x - 14, 82);
      g.lineTo(x + 14, 82);
      g.lineTo(x, 36);
      g.fill();
      g.fillStyle = '#ffe3f1';
      g.fillRect(x - 11, 80, 22, 56);
    }
  } else if (kind === 1) {
    // rainbow and clouds
    g.fillStyle = '#cfeeff';
    g.fillRect(0, 0, 256, 192);
    ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc'].forEach((col, i) => {
      g.strokeStyle = col;
      g.lineWidth = 11;
      g.beginPath();
      g.arc(128, 180, 120 - i * 11, Math.PI, 0);
      g.stroke();
    });
    g.fillStyle = '#fff';
    for (const [x, y] of [[40, 150], [70, 160], [210, 150], [185, 162]]) {
      g.beginPath();
      g.arc(x, y, 22, 0, 7);
      g.fill();
    }
  } else {
    // night sky with stars and a moon
    g.fillStyle = '#2b2a6b';
    g.fillRect(0, 0, 256, 192);
    g.fillStyle = '#fff6c4';
    for (let i = 0; i < 40; i++) {
      g.beginPath();
      g.arc((i * 71) % 256, (i * 37) % 170, 1 + (i % 3), 0, 7);
      g.fill();
    }
    g.beginPath();
    g.arc(190, 50, 26, 0, 7);
    g.fill();
    g.fillStyle = '#2b2a6b';
    g.beginPath();
    g.arc(200, 44, 22, 0, 7);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildPalace(game) {
  const g = new THREE.Group();
  const rand = rng(5);
  const colliders = [];
  const block = (x, z, r) => colliders.push({ x, z, r });

  ground(g, 0x9be37a, 0xa9ee86, R + 1.5);
  fenceRing(g, R + 1);

  const castle = makeCastle();
  place(g, castle, 0, -25, { scale: 1.9 });

  // path of stepping stones from the gate to the fountain
  for (let i = 0; i < 10; i++) {
    const s = add(g, CYL, 0xf6e7c8, [Math.sin(i * 1.3) * 0.5, 0.03, 10 - i * 1.3], [0.6, 0.05, 0.45]);
    s.castShadow = false;
    s.receiveShadow = true;
  }

  // fountain
  const fountain = new THREE.Group();
  add(fountain, CYL, 0xffffff, [0, 0.3, 0], [2.0, 0.6, 2.0]);
  add(fountain, CYL, 0x8fd8ff, [0, 0.55, 0], [1.75, 0.1, 1.75]).castShadow = false;
  add(fountain, CYL, 0xffffff, [0, 1.0, 0], [0.3, 1.0, 0.3]);
  add(fountain, SPHERE, 0xffd6ea, [0, 1.9, 0], 0.42);
  place(g, fountain, 0, -4.5);
  block(0, -4.5, 2.4);

  // scenery: trees and flowers around the edge
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + rand() * 0.2;
    const r = R + 2 + rand() * 12;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r - 3;
    if (z > 6) continue; // keep the camera side clear
    place(g, makeTree(rand, i % 3 === 0), x, z, { scale: 1.2 + rand() * 0.6, rot: rand() * 6 });
  }
  for (let i = 0; i < 40; i++) {
    const a = rand() * Math.PI * 2;
    const r = 4 + rand() * 12;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x - 0, z + 4.5) < 3) continue;
    const f = makeFlower([PINK, 0xffe35a, 0xffffff, 0xb48cff][i % 4]);
    place(g, f, x, z, { scale: 1.1, rot: rand() * 6 });
  }

  const stations = {};

  // ---- stable with the unicorn (west)
  {
    const s = new THREE.Group();
    add(s, BOX, 0xffd6ea, [0, 1.2, -1.6], [5.4, 2.4, 0.3]);
    add(s, BOX, 0xffd6ea, [-2.6, 1.2, 0], [0.3, 2.4, 3.4]);
    add(s, BOX, 0xffd6ea, [2.6, 1.2, 0], [0.3, 2.4, 3.4]);
    const roof = add(s, CONE, 0xff6fb1, [0, 3.0, 0], [4.4, 1.6, 4.4]);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(4.6, 1.5, 3.4);
    place(g, s, -12, -3, { rot: Math.PI / 2 });
    block(-12.9, -3, 2.0);
    const uni = makeUnicorn();
    uni.position.set(-10.2, 0, -3);
    uni.rotation.y = Math.PI / 2;
    g.add(uni);
    stations.stable = { pos: new THREE.Vector3(-8.6, 0, -3), group: uni, unicorn: { root: uni } };
  }

  // ---- dance pavilion (east)
  {
    const d = new THREE.Group();
    add(d, CYL, 0xfff1c9, [0, 0.08, 0], [3.4, 0.16, 3.4]);
    ['#ff6bb5', '#ffb347', '#ffe66b', '#7be37a', '#6ad7ff', '#b48cff'].forEach((c, i) => {
      const a = (i / 6) * Math.PI * 2;
      const tile = add(d, CYL, parseInt(c.slice(1), 16), [Math.cos(a) * 2.0, 0.19, Math.sin(a) * 2.0], [0.7, 0.05, 0.7]);
      tile.castShadow = false;
    });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      add(d, CYL, 0xffffff, [Math.cos(a) * 3.0, 1.6, Math.sin(a) * 3.0], [0.2, 3.2, 0.2]);
    }
    add(d, CONE, 0xb48cff, [0, 4.0, 0], [3.9, 1.6, 3.9]);
    place(g, d, 11.5, -3);
    stations.dance = { pos: new THREE.Vector3(8.2, 0, -3), group: d };
  }

  // ---- flower beds (north-west)
  const plots = [];
  [-9.5, -6.3, -3.1].forEach((x, i) => {
    const bed = new THREE.Group();
    add(bed, BOX, 0x9b6b43, [0, 0.18, 0], [2.4, 0.36, 2.4]);
    add(bed, BOX, 0x6b4a2e, [0, 0.38, 0], [2.0, 0.08, 2.0]);
    place(g, bed, x, -11);
    const holder = new THREE.Group();
    holder.position.set(x, 0.4, -11);
    g.add(holder);
    plots.push({ bed, holder, pos: new THREE.Vector3(x, 0, -9.4), x, z: -11, shown: '' });
    block(x, -11, 1.3);
  });
  const setPlot = (i, state) => {
    const p = plots[i];
    const key = state ? `${state.type}${state.stage}` : '';
    if (p.shown === key) return;
    p.shown = key;
    p.holder.clear();
    if (!state) return;
    const col = FLOWER_COLORS[state.type] || PINK;
    const f = makeFlower(col);
    f.userData.head.visible = state.stage >= 3;
    const sc = [0.35, 0.8, 1.2, 1.9][state.stage];
    f.scale.setScalar(sc);
    if (state.stage === 2) f.userData.head.visible = false;
    p.holder.add(f);
    if (state.stage === 2) {
      const bud = add(p.holder, SPHERE, col, [0, 0.52 * sc, 0], 0.13 * sc);
      bud.castShadow = false;
    }
    p.flower = f;
  };
  stations.plots = plots;

  // ---- photo booth (north-east)
  const booth = new THREE.Group();
  const panelMat = new THREE.MeshBasicMaterial({ map: backdropTexture(0) });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.5), panelMat);
  panel.position.set(0, 2.6, 0);
  booth.add(panel);
  add(booth, BOX, 0xffffff, [-3.1, 2.6, 0], [0.2, 4.7, 0.2]);
  add(booth, BOX, 0xffffff, [3.1, 2.6, 0], [0.2, 4.7, 0.2]);
  add(booth, BOX, 0xff6fb1, [0, 5.0, 0], [6.5, 0.3, 0.3]);
  add(booth, BOX, 0xfff1c9, [0, 0.06, 2.2], [6, 0.12, 4.4]);
  place(g, booth, 7.5, -12.5);
  // the little camera on a tripod
  const cam = new THREE.Group();
  add(cam, CYL, 0x555555, [0, 0.7, 0], [0.05, 1.4, 0.05]);
  add(cam, BOX, 0x2b2236, [0, 1.5, 0], [0.7, 0.5, 0.45]);
  add(cam, SPHERE, 0x9bd1ff, [0, 1.5, 0.3], 0.18);
  place(g, cam, 4.6, -8.2, { rot: -0.5 });
  stations.booth = {
    pos: new THREE.Vector3(7.5, 0, -8.4),
    standAt: new THREE.Vector3(7.5, 0, -10.3),
    camPos: new THREE.Vector3(7.5, 2.6, -4.9),
    camLook: new THREE.Vector3(7.5, 1.6, -10.3),
    group: cam,
    setBackdrop: (i) => {
      panelMat.map = backdropTexture(i);
      panelMat.needsUpdate = true;
    },
  };

  // ---- sticker book lectern (south-west)
  {
    const l = new THREE.Group();
    add(l, CYL, 0xc99a6b, [0, 0.7, 0], [0.22, 1.4, 0.22]);
    const top = add(l, BOX, 0xe0b27d, [0, 1.5, 0], [1.3, 0.12, 0.9]);
    top.rotation.x = -0.35;
    const book = add(l, BOX, 0xff6fb1, [0, 1.62, 0.02], [1.0, 0.14, 0.7]);
    book.rotation.x = -0.35;
    add(l, BOX, 0xffffff, [0, 1.7, 0.02], [0.9, 0.05, 0.62]).rotation.x = -0.35;
    place(g, l, -9, 6, { rot: 0.4 });
    block(-9, 6, 0.8);
    stations.book = { pos: new THREE.Vector3(-9, 0, 6), group: l };
  }

  // ---- day map signpost (south-east)
  {
    const s = new THREE.Group();
    add(s, CYL, 0xc99a6b, [0, 1.6, 0], [0.14, 3.2, 0.14]);
    [[0.0, 2.7, 0.2, 0xff6fb1], [0.0, 2.2, -0.15, 0x6ad7ff], [0.0, 1.7, 0.1, 0xffd23f]].forEach(([x, y, r, c]) => {
      const a = add(s, BOX, c, [0.5, y, 0], [1.0, 0.36, 0.08]);
      a.rotation.y = r;
      add(s, CONE, c, [1.1, y, 0], [0.22, 0.4, 0.08]).rotation.z = -Math.PI / 2;
    });
    place(g, s, 9, 6.5, { rot: -0.4 });
    block(9, 6.5, 0.6);
    stations.map = { pos: new THREE.Vector3(9, 0, 6.5), group: s };
  }

  // ---- pet house (south)
  {
    const k = new THREE.Group();
    add(k, BOX, 0xffe3b3, [0, 0.7, 0], [2.0, 1.4, 1.8]);
    const roof = add(k, CONE, 0xff6fb1, [0, 1.75, 0], [1.9, 0.9, 1.9]);
    roof.rotation.y = Math.PI / 4;
    add(k, SPHERE, 0x6b4a2e, [0, 0.6, 0.92], [0.5, 0.6, 0.1]);
    place(g, k, -4.5, 7);
    block(-4.5, 7, 1.3);
    stations.kennel = { pos: new THREE.Vector3(-4.5, 0, 7), group: k };
  }

  // ---- dress-up mirror (south)
  {
    const m = new THREE.Group();
    add(m, new THREE.TorusGeometry(0.9, 0.1, 10, 28), 0xffd23f, [0, 1.8, 0]).scale.set(0.7, 1, 0.3);
    const glass = add(m, CYL, new THREE.MeshBasicMaterial({ color: 0xcfeeff }), [0, 1.8, 0], [0.9, 0.05, 0.9]);
    glass.rotation.x = Math.PI / 2;
    glass.scale.set(0.62, 0.05, 0.9);
    glass.castShadow = false;
    add(m, BOX, 0xffd23f, [-0.5, 0.45, 0], [0.12, 0.9, 0.12]);
    add(m, BOX, 0xffd23f, [0.5, 0.45, 0], [0.12, 0.9, 0.12]);
    place(g, m, 4, 7.5);
    block(4, 7.5, 0.8);
    stations.mirror = { pos: new THREE.Vector3(4, 0, 7.5), group: m };
  }

  // butterflies for life
  const flies = [0xff8fc7, 0xffd166, 0x9bd1ff, 0xc8a6ff].map((c, i) => {
    const b = makeButterfly(c);
    g.add(b);
    return { mesh: b, a: rand() * 6, r: 5 + rand() * 8, h: 1.3 + rand(), sp: 0.2 + rand() * 0.2, i };
  });

  let fountainClock = 0;
  const update = (dt, t) => {
    for (const b of flies) {
      b.a += dt * b.sp;
      b.mesh.position.set(Math.cos(b.a) * b.r, b.h + Math.sin(t * 2 + b.i) * 0.3, Math.sin(b.a * 1.3) * b.r * 0.8 - 2);
      b.mesh.rotation.y = -b.a * 1.3 + Math.PI / 2;
      const flap = Math.sin(t * 22 + b.i) * 0.9;
      b.mesh.userData.wings[0].rotation.z = flap;
      b.mesh.userData.wings[1].rotation.z = -flap;
    }
    fountainClock -= dt;
    if (fountainClock <= 0) {
      fountainClock = 0.07;
      game.sparkles.emit(0, 2.2, -4.5, 2, { speed: 0.8, up: 3.2, life: 1.0, colors: [0x9be7ff, 0xffffff], gravity: 7, spread: 0.1 });
    }
    stations.stable.unicorn.root.userData.animate(t, 0);
    for (const p of plots) if (p.flower && p.flower.userData.head) p.flower.userData.head.rotation.z = Math.sin(t * 1.6 + p.x) * 0.1;
  };

  return {
    name: 'palace',
    group: g,
    bg: 0xbfe6ff,
    fog: { color: 0xcdeeff, near: 34, far: 100 },
    camScale: 1,
    spawn: new THREE.Vector3(0, 0, 10.5),
    heading: Math.PI,
    clamp: circleClamp(R),
    colliders,
    update,
    stations,
    setPlot,
  };
}

// Mini-game: a rainbow road in the sky for the unicorn ride.
import * as THREE from 'three';
import { mat, add, SPHERE, makeCloud } from '../models.js';
import { makeGlow, makeUnicorn } from '../props.js';
import { rng } from './util.js';

export const LENGTH = 230;
export const pathX = (z) => 5 * Math.sin(z * 0.045) + 2.5 * Math.sin(z * 0.11);
const CONE = new THREE.ConeGeometry(1, 1, 16);
const STRIPES = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0xb197fc, 0xf783ac];

export function buildSky(game) {
  const g = new THREE.Group();
  const rand = rng(91);

  // the rainbow road: seven coloured lanes, each an instanced strip following the curve
  const SEG = 4;
  const n = Math.ceil((LENGTH + 20) / SEG);
  const box = new THREE.BoxGeometry(1, 0.3, SEG + 0.3);
  STRIPES.forEach((c, i) => {
    const mesh = new THREE.InstancedMesh(box, mat(c), n);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let k = 0; k < n; k++) {
      const z = 10 - k * SEG;
      const ang = Math.atan2(pathX(z - 1) - pathX(z + 1), -2);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang);
      const lx = (i - 3) * 1.0;
      m4.compose(
        new THREE.Vector3(pathX(z) + lx * Math.cos(ang), -0.15, z + lx * -Math.sin(ang)),
        q,
        new THREE.Vector3(1, 1, 1)
      );
      mesh.setMatrixAt(k, m4);
    }
    mesh.receiveShadow = true;
    g.add(mesh);
  });

  // fluffy clouds all around, low and high
  for (let i = 0; i < 70; i++) {
    const c = makeCloud();
    const z = 10 - rand() * (LENGTH + 40);
    const side = rand() < 0.5 ? -1 : 1;
    c.position.set(pathX(z) + side * (9 + rand() * 24), -6 + rand() * 18, z);
    c.scale.setScalar(1.4 + rand() * 1.8);
    g.add(c);
  }

  // stars and hearts to gather
  const stars = [];
  for (let i = 0; i < 34; i++) {
    const z = -10 - i * 6.4;
    const off = (rand() - 0.5) * 5.2;
    const heart = i % 7 === 6;
    const m = new THREE.Group();
    const body = add(m, new THREE.OctahedronGeometry(0.45), new THREE.MeshBasicMaterial({ color: heart ? 0xff5fae : 0xffe066 }), [0, 0, 0]);
    body.scale.set(1, 1.25, 0.4);
    const gl = makeGlow(heart ? 0xff9ac7 : 0xfff0a0, 2.6);
    m.add(gl);
    m.position.set(pathX(z) + off, 1.5, z);
    g.add(m);
    stars.push({ group: m, taken: false, heart });
  }

  // the finish: a big arch with the castle behind it
  const arch = new THREE.Group();
  for (const sx of [-1, 1]) add(arch, new THREE.CylinderGeometry(0.5, 0.5, 6, 12), 0xffffff, [sx * 4, 3, 0]);
  const top = add(arch, new THREE.TorusGeometry(4, 0.5, 10, 24, Math.PI), 0xffd23f, [0, 6, 0]);
  top.rotation.z = 0;
  arch.position.set(pathX(-LENGTH + 5), 0, -LENGTH + 5);
  g.add(arch);

  // the unicorn that carries the princess
  const unicorn = { root: makeUnicorn(), heading: 0 };
  g.add(unicorn.root);

  return {
    name: 'sky',
    group: g,
    bg: 0xcfeaff,
    fog: { color: 0xe3f3ff, near: 40, far: 130 },
    light: { hemi: 1.1, sun: 1.6 },
    camScale: 0.95,
    spawn: new THREE.Vector3(pathX(8), 0, 8),
    heading: Math.PI,
    clamp: () => {},
    colliders: [],
    update() {},
    stars, unicorn, finishZ: -LENGTH + 5,
  };
}

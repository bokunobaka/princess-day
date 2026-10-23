import * as THREE from 'three';
import { mat } from '../models.js';

// deterministic scatter so every area looks the same each time
export function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export function place(group, obj, x, z, { rot = 0, scale = 1, y = 0 } = {}) {
  obj.position.set(x, y, z);
  obj.rotation.y = rot;
  obj.scale.setScalar(scale);
  group.add(obj);
  return obj;
}

// big flat ground discs (outer + a slightly different inner lawn)
export function ground(group, outer, inner, innerR) {
  const g = new THREE.Mesh(new THREE.CircleGeometry(80, 64), mat(outer));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  group.add(g);
  if (inner !== undefined) {
    const l = new THREE.Mesh(new THREE.CircleGeometry(innerR, 64), mat(inner));
    l.rotation.x = -Math.PI / 2;
    l.position.y = 0.01;
    l.receiveShadow = true;
    group.add(l);
  }
}

export const circleClamp = (R) => (p) => {
  const r = Math.hypot(p.x, p.z);
  if (r > R) {
    p.x *= R / r;
    p.z *= R / r;
  }
};

// a ring of posts + two rails (low fence marking the play area)
export function fenceRing(group, R, color = 0xffffff, rail = 0xffd6ea) {
  const postGeo = new THREE.BoxGeometry(0.2, 1, 0.2);
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    const p = new THREE.Mesh(postGeo, mat(color));
    p.position.set(Math.cos(a) * R, 0.5, Math.sin(a) * R);
    p.castShadow = true;
    group.add(p);
  }
  for (const y of [0.35, 0.75]) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 6, 120), mat(rail));
    r.rotation.x = Math.PI / 2;
    r.position.y = y;
    group.add(r);
  }
}

export function stars(group, n, radius = 90) {
  const pos = new Float32Array(n * 3);
  const rand = rng(11);
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const e = 0.15 + rand() * 0.8;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * radius;
    pos[i * 3 + 1] = Math.sin(e) * radius;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * radius;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, fog: false, sizeAttenuation: false, transparent: true, opacity: 0.9 }));
  pts.frustumCulled = false;
  group.add(pts);
}

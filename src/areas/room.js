// Shared pieces for the indoor areas: floor, three walls (the fourth side is the camera), helpers.
import * as THREE from 'three';
import { mat, gradient, add, CYL, SPHERE } from '../models.js';
import { furniture } from '../assets.js';

function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.repeat.set(...repeat);
  return t;
}

const css = (n) => '#' + n.toString(16).padStart(6, '0');

export function stripeMat(a, b, repeatX) {
  const map = tex(32, 4, (g, w, h) => {
    g.fillStyle = css(a);
    g.fillRect(0, 0, w, h);
    g.fillStyle = css(b);
    g.fillRect(0, 0, w / 2, h);
  }, [repeatX, 1]);
  return new THREE.MeshToonMaterial({ map, gradientMap: gradient });
}

export function checkerMat(a, b, tilesX, tilesZ) {
  const map = tex(2, 2, (g) => {
    g.fillStyle = css(a);
    g.fillRect(0, 0, 2, 2);
    g.fillStyle = css(b);
    g.fillRect(0, 0, 1, 1);
    g.fillRect(1, 1, 1, 1);
  }, [tilesX / 2, tilesZ / 2]);
  return new THREE.MeshToonMaterial({ map, gradientMap: gradient });
}

export function plankMat(a, b, tilesX, tilesZ) {
  const map = tex(8, 8, (g, w, h) => {
    for (let i = 0; i < 4; i++) {
      g.fillStyle = css(i % 2 ? a : b);
      g.fillRect(0, i * 2, w, 2);
    }
  }, [tilesX, tilesZ]);
  return new THREE.MeshToonMaterial({ map, gradientMap: gradient });
}

export function buildRoom({ w, d, wallH = 6, floorMat, wallA = 0xffe3ef, wallB = 0xffd0e6 }) {
  const group = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.3, d + 1), floorMat);
  floor.position.y = -0.15;
  floor.receiveShadow = true;
  group.add(floor);

  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(w + 1, wallH, 0.4), stripeMat(wallA, wallB, w / 2));
  wallBack.position.set(0, wallH / 2, -d / 2 - 0.2);
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallH, d + 0.4), stripeMat(wallA, wallB, d / 2));
  wallL.position.set(-w / 2 - 0.2, wallH / 2, 0);
  const wallR = wallL.clone();
  wallR.position.x = w / 2 + 0.2;
  for (const m of [wallBack, wallL, wallR]) {
    m.receiveShadow = true;
    group.add(m);
  }
  // baseboards + crown line
  const white = mat(0xffffff);
  for (const [bw, bd, x, z] of [[w, 0.2, 0, -d / 2 + 0.05], [0.2, d, -w / 2 + 0.05, 0], [0.2, d, w / 2 - 0.05, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.5, bd), white);
    b.position.set(x, 0.25, z);
    group.add(b);
  }

  const hw = w / 2 - 0.9;
  const clamp = (p) => {
    p.x = Math.max(-hw, Math.min(hw, p.x));
    p.z = Math.max(-d / 2 + 1.2, Math.min(d / 2 - 0.8, p.z));
  };
  return { group, clamp, w, d };
}

// place an object on the floor
export function put(group, obj, x, z, rot = 0, y = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = rot;
  group.add(obj);
  return obj;
}

// a Kenney furniture piece, scaled up to suit a princess-sized world
export function furn(group, name, x, z, { rot = 0, scale = 2.4, y = 0 } = {}) {
  const o = furniture(name, { scale });
  return put(group, o, x, z, rot, y);
}

export function rug(group, x, z, r, color = 0xf7c6e0, inner = 0xffe3f1) {
  const a = add(group, CYL, color, [x, 0.03, z], [r, 0.04, r]);
  const b = add(group, CYL, inner, [x, 0.05, z], [r * 0.7, 0.04, r * 0.7]);
  a.castShadow = b.castShadow = false;
  a.receiveShadow = b.receiveShadow = true;
}

// a painted wooden door on the back wall
export function door(group, x, z, h = 4) {
  const root = new THREE.Group();
  add(root, new THREE.BoxGeometry(2.8, h + 0.3, 0.2), 0xffffff, [0, (h + 0.3) / 2, 0]);
  add(root, new THREE.BoxGeometry(2.3, h, 0.25), 0xd9a66f, [0, h / 2, 0.02]);
  add(root, new THREE.BoxGeometry(0.9, 1.4, 0.3), 0xe8b985, [-0.5, h * 0.7, 0.02]);
  add(root, new THREE.BoxGeometry(0.9, 1.4, 0.3), 0xe8b985, [0.5, h * 0.7, 0.02]);
  add(root, new THREE.BoxGeometry(0.9, 1.2, 0.3), 0xe8b985, [-0.5, h * 0.25, 0.02]);
  add(root, new THREE.BoxGeometry(0.9, 1.2, 0.3), 0xe8b985, [0.5, h * 0.25, 0.02]);
  add(root, SPHERE, 0xffcf3f, [0.85, h * 0.45, 0.25], 0.12);
  root.position.set(x, 0, z);
  group.add(root);
  return root;
}

export function windowPane(group, x, y, z, w = 3, h = 3) {
  const root = new THREE.Group();
  add(root, new THREE.BoxGeometry(w + 0.4, h + 0.4, 0.15), 0xffffff, [0, 0, 0]);
  const glass = add(root, new THREE.BoxGeometry(w, h, 0.2), new THREE.MeshBasicMaterial({ color: 0xcfeeff }), [0, 0, 0.02]);
  glass.castShadow = false;
  add(root, new THREE.BoxGeometry(0.12, h, 0.25), 0xffffff, [0, 0, 0.03]);
  add(root, new THREE.BoxGeometry(w, 0.12, 0.25), 0xffffff, [0, 0, 0.03]);
  root.position.set(x, y, z);
  group.add(root);
  return root;
}

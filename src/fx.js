import * as THREE from 'three';

function canvasTexture(draw, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const textures = {
  star: canvasTexture((g, s) => {
    const h = s / 2;
    const grad = g.createRadialGradient(h, h, 0, h, h, h);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#fff';
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? h * 0.95 : h * 0.18;
      g.lineTo(h + Math.cos(a) * r, h + Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
  }),
  heart: canvasTexture((g, s) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(s * 0.5, s * 0.85);
    g.bezierCurveTo(s * 0.05, s * 0.55, s * 0.12, s * 0.12, s * 0.5, s * 0.34);
    g.bezierCurveTo(s * 0.88, s * 0.12, s * 0.95, s * 0.55, s * 0.5, s * 0.85);
    g.fill();
  }),
  glow: canvasTexture((g, s) => {
    const h = s / 2;
    const grad = g.createRadialGradient(h, h, 0, h, h, h);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  }),
  snow: canvasTexture((g, s) => {
    const h = s / 2;
    const grad = g.createRadialGradient(h, h, 0, h, h, h);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  }),
  confetti: canvasTexture((g, s) => {
    g.fillStyle = '#fff';
    g.fillRect(s * 0.2, s * 0.3, s * 0.6, s * 0.4);
  }),
};

// One pool of GPU points. Cheap enough to fire bursts for every tap.
export class Particles {
  constructor(scene, map, { max = 300, size = 0.4, additive = true } = {}) {
    this.max = max;
    this.next = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max).fill(1);
    this.grav = new Float32Array(max);
    this.rgb = new Float32Array(max * 3);
    for (let i = 0; i < max; i++) this.pos[i * 3 + 1] = -999;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4));
    const mat = new THREE.PointsMaterial({
      map,
      size,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      alphaTest: 0.01,
    });
    this.geo = geo;
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    scene.add(this.points);
  }

  emit(x, y, z, n, { colors = [0xffffff], speed = 2, up = 1.5, life = 1, gravity = 0, spread = 0.2 } = {}) {
    const c = new THREE.Color();
    for (let k = 0; k < n; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.max;
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed;
      this.pos[i * 3] = x + (Math.random() - 0.5) * spread;
      this.pos[i * 3 + 1] = y + (Math.random() - 0.5) * spread;
      this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * spread;
      this.vel[i * 3] = Math.cos(a) * s;
      this.vel[i * 3 + 1] = up * (0.4 + Math.random() * 0.6);
      this.vel[i * 3 + 2] = Math.sin(a) * s;
      this.life[i] = this.maxLife[i] = life * (0.7 + Math.random() * 0.6);
      this.grav[i] = gravity;
      c.set(colors[(Math.random() * colors.length) | 0]);
      this.rgb[i * 3] = c.r;
      this.rgb[i * 3 + 1] = c.g;
      this.rgb[i * 3 + 2] = c.b;
    }
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) {
        this.col[i * 4 + 3] = 0;
        continue;
      }
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.pos[i * 3 + 1] = -999;
        this.col[i * 4 + 3] = 0;
        continue;
      }
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.col[i * 4] = this.rgb[i * 3];
      this.col[i * 4 + 1] = this.rgb[i * 3 + 1];
      this.col[i * 4 + 2] = this.rgb[i * 3 + 2];
      this.col[i * 4 + 3] = Math.min(1, (this.life[i] / this.maxLife[i]) * 2);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}

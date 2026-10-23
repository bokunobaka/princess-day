// glTF loading (Kenney CC0 packs) + animated critters.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { gradient } from './models.js';

const PETS = ['bunny', 'elephant', 'giraffe', 'panda', 'cat', 'pig', 'fox', 'penguin', 'dog'];
const FOOD = [
  'egg', 'bag', 'strawberry', 'carrot', 'cookie', 'cupcake', 'bowl', 'whisk', 'carton', 'apple',
  'cup-tea', 'cake-birthday', 'muffin', 'cherries', 'whipped-cream', 'rollingPin', 'pie', 'donut-sprinkles',
  'watermelon', 'ice-cream', 'popsicle', 'soda-glass', 'lemon', 'orange',
];
const GRAVEYARD = [
  'character-zombie', 'character-ghost', 'character-skeleton', 'character-vampire', 'pumpkin', 'pumpkin-carved',
  'pumpkin-tall', 'pumpkin-tall-carved', 'lantern-candle', 'lantern-glass', 'candle', 'candle-multiple', 'fence',
  'fence-gate', 'iron-fence', 'iron-fence-border-gate', 'iron-fence-border-column', 'gravestone-round',
  'gravestone-cross', 'gravestone-bevel', 'gravestone-broken', 'crypt-small', 'crypt', 'pine', 'pine-fall',
  'pine-crooked', 'bench', 'coffin', 'hay-bale', 'lightpost-single', 'fire-basket', 'rocks', 'cross-wood',
];
const HOLIDAY = [
  'tree', 'tree-decorated', 'tree-snow-a', 'tree-snow-b', 'tree-snow-c', 'tree-decorated-snow', 'snowman',
  'snowman-hat', 'present-a-cube', 'present-a-rectangle', 'present-a-round', 'present-b-cube', 'present-b-round',
  'present-b-rectangle', 'candy-cane-red', 'candy-cane-green', 'snowflake-a', 'snowflake-b', 'reindeer',
  'gingerbread-man', 'gingerbread-woman', 'nutcracker', 'sled', 'snow-pile', 'snow-flat', 'lantern',
  'lights-colored', 'wreath-decorated', 'sock-red', 'sock-green', 'rocks-small',
];
const FURNITURE = [
  'bedSingle', 'bedDouble', 'bookcaseClosedDoors', 'bookcaseOpen', 'rugRound', 'rugRounded', 'lampRoundTable',
  'lampRoundFloor', 'lampSquareFloor', 'sideTable', 'pillow', 'pillowBlue', 'pottedPlant', 'plantSmall1', 'chair',
  'chairCushion', 'kitchenCabinet', 'kitchenCabinetUpper', 'kitchenStove', 'kitchenFridge', 'kitchenSink',
  'kitchenBar', 'tableRound', 'table', 'tableCloth', 'stoolBar', 'doorway', 'doorwayFront', 'cabinetBed',
  'cabinetBedDrawer', 'bench', 'benchCushion', 'books', 'loungeSofa', 'radio', 'speaker', 'coatRack',
  'kitchenCoffeeMachine', 'toaster', 'kitchenMicrowave', 'kitchenCabinetUpperDouble',
];

const BASE = import.meta.env.BASE_URL;
const store = new Map(); // 'pets/bunny' -> { scene, animations }

function toToon(root) {
  const cache = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    if (o.isSkinnedMesh) o.frustumCulled = false;
    const conv = (m) => {
      if (!cache.has(m)) {
        cache.set(
          m,
          new THREE.MeshToonMaterial({
            map: m.map,
            color: m.color,
            gradientMap: gradient,
            transparent: m.transparent,
            opacity: m.opacity,
            side: m.side,
          })
        );
      }
      return cache.get(m);
    };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  });
}

export async function loadAssets(onProgress = () => {}) {
  const loader = new GLTFLoader();
  const jobs = [
    ...PETS.map((n) => ['pets', n]),
    ...FOOD.map((n) => ['food', n]),
    ...FURNITURE.map((n) => ['furniture', n]),
    ...GRAVEYARD.map((n) => ['graveyard', n]),
    ...HOLIDAY.map((n) => ['holiday', n]),
  ];
  let done = 0;
  await Promise.all(
    jobs.map(async ([kind, name]) => {
      try {
        const gltf = await loader.loadAsync(`${BASE}models/${kind}/${kind === 'pets' ? 'animal-' : ''}${name}.glb`);
        toToon(gltf.scene);
        store.set(`${kind}/${name}`, { scene: gltf.scene, animations: gltf.animations });
      } catch (e) {
        console.warn('asset failed', kind, name, e);
      }
      onProgress(++done / jobs.length);
    })
  );
}

// A fresh copy of a model. `height` rescales it; `center` puts its base at y=0 and
// its middle at x/z=0 (Kenney furniture has its origin in a corner).
export function prop(kind, name, { height, scale = 1, center = true } = {}) {
  const src = store.get(`${kind}/${name}`);
  const root = new THREE.Group();
  if (!src) {
    // asset missing: a visible little placeholder instead of a crash
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshToonMaterial({ color: 0xffb3d9 }));
    m.position.y = 0.3;
    root.add(m);
    return root;
  }
  const model = cloneSkinned(src.scene);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const mid = box.getCenter(new THREE.Vector3());
  const pivot = new THREE.Group();
  pivot.add(model);
  if (center) model.position.set(-mid.x, -box.min.y, -mid.z);
  pivot.scale.setScalar(height ? (height / (size.y || 1)) * scale : scale);
  root.add(pivot);
  return root;
}

export const furniture = (name, opts) => prop('furniture', name, opts);
export const graveyard = (name, opts) => prop('graveyard', name, opts);
export const holiday = (name, opts) => prop('holiday', name, opts);
export const food = (name, opts) => prop('food', name, opts);

// ------------------------------------------------------------------ critters
// An animated animal friend that can walk to places, follow someone, and dance.
// the character models (zombie, ghost...) name their clips differently from the animals
const ALIASES = {
  run: 'sprint',
  dance: 'jump',
  eat: 'pick-up',
  'gesture-positive': 'emote-yes',
  'gesture-negative': 'emote-no',
};

export class Critter {
  constructor(name, height = 1.3, kind = 'pets') {
    this.name = name;
    this.height = height;
    const src = store.get(`${kind}/${name}`);
    this.root = new THREE.Group();
    this.model = prop(kind, name, { height, center: false });
    this.root.add(this.model);
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    if (src) for (const clip of src.animations) this.actions[clip.name] = this.mixer.clipAction(clip, this.model.children[0].children[0]);
    this.current = null;
    this.dest = null;
    this.onArrive = null;
    this.speed = 2.6;
    this.heading = 0;
    this.play('idle');
  }

  play(name, { once = false, fade = 0.2, speed = 1 } = {}) {
    const next = this.actions[name] || this.actions[ALIASES[name]];
    if (!next) return;
    next.timeScale = speed;
    if (this.current === next) return;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    next.fadeIn(fade).play();
    if (this.current) this.current.fadeOut(fade);
    this.current = next;
    this.currentName = name;
  }

  // play a one-shot (e.g. wave) then fall back to idle
  gesture(name, back = 'idle') {
    this.play(name, { once: true });
    const a = this.actions[name] || this.actions[ALIASES[name]];
    if (!a) return;
    const done = (e) => {
      if (e.action !== a) return;
      this.mixer.removeEventListener('finished', done);
      if (!this.dest) this.play(back);
    };
    this.mixer.addEventListener('finished', done);
  }

  goTo(x, z, { speed = 2.6, onArrive = null } = {}) {
    this.dest = new THREE.Vector3(x, 0, z);
    this.speed = speed;
    this.onArrive = onArrive;
  }

  face(x, z) {
    this.heading = Math.atan2(x - this.root.position.x, z - this.root.position.z);
  }

  update(dt, clamp) {
    const p = this.root.position;
    if (this.dest) {
      const dx = this.dest.x - p.x;
      const dz = this.dest.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.08) {
        this.dest = null;
        this.play('idle');
        const cb = this.onArrive;
        this.onArrive = null;
        cb && cb();
      } else {
        const step = Math.min(d, this.speed * dt);
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
        if (clamp) clamp(p);
        this.heading = Math.atan2(dx, dz);
        this.play(this.speed > 3.4 ? 'run' : 'walk', { speed: Math.min(1.6, this.speed / 2.6) });
      }
    }
    let diff = this.heading - this.root.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.root.rotation.y += diff * Math.min(1, dt * 10);
    this.mixer.update(dt);
  }
}

export function bounds(o) {
  const b = new THREE.Box3().setFromObject(o);
  return [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].map((v) => +v.toFixed(2));
}

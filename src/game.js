import * as THREE from 'three';
import { buildGarden } from './areas/garden.js';
import { buildBedroom } from './areas/bedroom.js';
import { buildKitchen } from './areas/kitchen.js';
import { buildBallroom } from './areas/ballroom.js';
import { buildHalloween } from './areas/halloween.js';
import { buildParty } from './areas/party.js';
import { buildHaunt } from './areas/haunt.js';
import { buildWinter } from './areas/winter.js';
import { buildPool } from './areas/pool.js';
import { makePrincess } from './models.js';
import { loadAssets } from './assets.js';
import { Particles, textures } from './fx.js';
import { DAYS } from './days/index.js';
import * as audio from './audio.js';
import { say } from './speech.js';
import { t } from './i18n.js';
import { ui } from './ui.js';
import { load, save } from './save.js';

const AREAS = {
  garden: buildGarden, bedroom: buildBedroom, kitchen: buildKitchen, ballroom: buildBallroom,
  halloween: buildHalloween, party: buildParty, haunt: buildHaunt, winter: buildWinter, pool: buildPool,
};
// default daylight; an area can supply its own `light` (night scenes are dimmer and bluer)
const DAY_LIGHT = { hemi: 0.9, hemiColor: 0xffffff, hemiGround: 0xbfe8a8, sun: 1.5, sunColor: 0xfff3d6 };

const SPEED = 4.2;
const PLAYER_R = 0.4;
const SPARKLE_COLORS = [0xffffff, 0xffe9a8, 0xffc2e0, 0xd9c2ff];
const UP = new THREE.Vector3(0, 1, 0);

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ui = ui;
    this.state = 'loading'; // loading | title | play | party | wardrobe | done
    this.day = null;
    this.stepIndex = 0;
    this.progress = 0;
    this.pending = {};
    this.bag = {};
    this.saved = load();
    if (!this.saved.outfit) this.saved.outfit = { dress: 0, crown: 0 };
    this.t = 0;
    this.idle = 0;
    this.tweens = [];
    this.timers = [];
    this.items = [];
    this.critters = [];
    this.followers = [];
    this.bubbles = [];
    this.area = null;
    this.hintSpots = null;
    this.camZoom = 1;
    this.camZoomTarget = 1;

    const renderer = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(0xbfe6ff);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 250);

    const hemi = (this.hemi = new THREE.HemisphereLight(0xffffff, 0xbfe8a8, 0.9));
    scene.add(hemi);
    const sun = (this.sun = new THREE.DirectionalLight(0xfff3d6, 1.5));
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = sc.bottom = -17;
    sc.right = sc.top = 17;
    sc.near = 1;
    sc.far = 70;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);

    // princess (lives across areas)
    this.player = makePrincess(this.saved.outfit);
    scene.add(this.player);
    this.heading = Math.PI;
    this.walk = 0;
    this.target = null;
    this.stop = 0.05;
    this.targetItem = null;
    this.stuck = 0;

    // fx
    this.sparkles = new Particles(scene, textures.star, { max: 700, size: 0.5 });
    this.hearts = new Particles(scene, textures.heart, { max: 160, size: 0.5, additive: false });
    this.confetti = new Particles(scene, textures.confetti, { max: 400, size: 0.28, additive: false });

    this.marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.07, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0xff5fae, transparent: true, opacity: 0.9 })
    );
    this.marker.rotation.x = Math.PI / 2;
    this.marker.visible = false;
    scene.add(this.marker);

    this.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    this.arrow.rotation.x = Math.PI;
    this.arrow.visible = false;
    scene.add(this.arrow);
    this.arrowTarget = null;

    this.camAngle = 0;
    this.camPos = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(UP.clone(), 0);
    this.hitMat = new THREE.MeshBasicMaterial({ visible: false });

    this.onResize();
    window.addEventListener('resize', () => this.onResize());
    canvas.addEventListener('pointerdown', (e) => this.onPointer(e));
  }

  async init() {
    await loadAssets((p) => ui.setLoading(p));
    this.loadArea('garden');
    this.snapCamera();
    this.state = 'title';
    ui.showTitle(this.saved, DAYS, (id) => this.startDay(id));
  }

  // ------------------------------------------------------------ areas
  loadArea(name, { keep = [], followers = false } = {}) {
    if (this.area) this.scene.remove(this.area.group);
    this.items = [];
    this.critters = [];
    this.followers = [];
    this.tweens = [];
    this.timers = [];
    this.hintSpots = null;
    this.clearBubbles();
    this.setArrow(null);
    this.target = null;

    this.area = AREAS[name](this);
    this.scene.add(this.area.group);
    for (const c of keep) {
      this.area.group.add(c.root);
      this.critters.push(c);
    }
    if (followers) this.followers = keep.slice();

    this.scene.background = new THREE.Color(this.area.bg);
    this.scene.fog = this.area.fog ? new THREE.Fog(this.area.fog.color, this.area.fog.near, this.area.fog.far) : null;
    const L = { ...DAY_LIGHT, ...(this.area.light || {}) };
    this.hemi.intensity = L.hemi;
    this.hemi.color.set(L.hemiColor);
    this.hemi.groundColor.set(L.hemiGround);
    this.sun.intensity = L.sun;
    this.sun.color.set(L.sunColor);
    this.player.position.copy(this.area.spawn);
    this.heading = this.area.heading;
    this.player.rotation.y = this.heading;
    this.camZoom = this.camZoomTarget = 1;
  }

  addCritter(c) {
    this.critters.push(c);
    return c;
  }

  addFollower(c) {
    if (!this.followers.includes(c)) this.followers.push(c);
  }

  clearFollowers() {
    this.followers = [];
  }

  addItem({ pos, track = null, hitRadius = 0.8, reach = 1, hitY = 0.6, run }) {
    const p = track ? track.position : pos;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(hitRadius, 8, 6), this.hitMat);
    hit.position.set(p.x, hitY, p.z);
    this.area.group.add(hit);
    const item = { pos: new THREE.Vector3(p.x, 0, p.z), hit, reach, run, enabled: true, track, hitY };
    hit.userData.item = item;
    this.items.push(item);
    return item;
  }

  // ------------------------------------------------------------ days
  nextDayId() {
    const done = this.saved.stickers;
    const next = DAYS.find((d) => !done.includes(d.id));
    return next ? next.id : 1;
  }

  async startDay(id) {
    const day = DAYS.find((d) => d.id === id);
    if (!day) return;
    audio.unlock();
    audio.startMusic();
    this.state = 'loading';
    ui.hideTitle();
    await ui.fade(true);
    ui.hideEnd();
    ui.hideTray();
    this.day = day;
    this.stepIndex = 0;
    this.progress = 0;
    this.pending = {};
    this.bag = {};
    this.target = null;
    this.player.userData.cheering = false;
    this.camZoomTarget = 1;
    this.loadArea(day.area);
    day.start(this);
    ui.showHud(day);
    this.refreshQuestUi();
    this.snapCamera();
    this.state = 'play';
    this.idle = 0;
    await ui.fade(false);
    say(day.intro);
  }

  async goHome() {
    this.state = 'loading';
    ui.hideEnd();
    ui.hideHud();
    ui.hideTray();
    await ui.fade(true);
    this.day = null;
    this.player.userData.cheering = false;
    this.loadArea('garden');
    this.snapCamera();
    this.state = 'title';
    ui.showTitle(this.saved, DAYS, (id) => this.startDay(id));
    await ui.fade(false);
  }

  // run a scene change behind a quick fade (used for door / location changes mid-day)
  fadeTo(fn) {
    ui.fade(true).then(() => {
      fn();
      this.snapCamera();
      ui.fade(false);
    });
  }

  get step() {
    return this.day ? this.day.steps[this.stepIndex] : null;
  }

  refreshQuestUi() {
    ui.setSteps(this.day.steps, this.stepIndex, this.progress);
    ui.setBag(this.bag);
  }

  addToBag(kind, n = 1) {
    this.bag[kind] = (this.bag[kind] || 0) + n;
    ui.setBag(this.bag);
    ui.bumpBag();
  }

  // Count progress toward a step. Progress made "early" (before its step starts) is remembered.
  addProgress(stepId, n = 1) {
    if (!this.step || this.step.id !== stepId) {
      this.pending[stepId] = (this.pending[stepId] || 0) + n;
      return;
    }
    this.progress = Math.min(this.step.count, this.progress + n);
    this.refreshQuestUi();
    if (this.progress >= this.step.count) this.after(0.9, () => this.advanceStep());
  }

  advanceStep() {
    audio.sfx.chime();
    this.burst(this.player.position, 28, 1.4);
    this.advanceStepSilent();
    const next = this.step;
    if (!next) {
      this.day.onDone && this.day.onDone(this);
      return;
    }
    this.after(1.2, () => say(next.hint));
    // anything already done ahead of time counts now
    const early = this.pending[next.id] || 0;
    if (early) {
      this.progress = Math.min(next.count, early);
      this.refreshQuestUi();
      if (this.progress >= next.count) this.after(1.8, () => this.advanceStep());
    }
  }

  advanceStepSilent() {
    this.stepIndex++;
    this.progress = 0;
    this.refreshQuestUi();
    const s = this.step;
    if (s && this.day.onStep) this.day.onStep(this, s.id);
  }

  finishDay(message) {
    if (this.state === 'done') return;
    this.state = 'done';
    if (!this.saved.stickers.includes(this.day.id)) this.saved.stickers.push(this.day.id);
    save(this.saved);
    const next = DAYS.find((d) => d.id === this.day.id + 1);
    ui.showEnd(this.day, this.saved.stickers.length, !!next, () => (next ? this.startDay(next.id) : this.goHome()), () => this.goHome());
    if (message) say(message);
  }

  // ------------------------------------------------------------ wardrobe
  openWardrobe(onDone) {
    this.state = 'wardrobe';
    this.target = null;
    this.heading = 0; // face the camera
    this.camZoomTarget = 0.5;
    ui.showWardrobe(
      this.saved.outfit,
      (o) => {
        this.saved.outfit = o;
        this.player.userData.setOutfit(o);
        this.burst(this.player.position, 12, 1, 1.4);
        audio.sfx.sparkle();
      },
      () => {
        save(this.saved);
        this.camZoomTarget = 1;
        this.state = 'play';
        this.player.userData.cheering = true;
        this.after(1.4, () => (this.player.userData.cheering = false));
        onDone();
      }
    );
    say(t('wardrobe.pick'));
  }

  // ------------------------------------------------------------ bubbles (emoji over friends)
  addBubble(track, html, yOff = 2) {
    const el = ui.makeBubble(html);
    const b = {
      track,
      yOff,
      el,
      remove: () => {
        el.remove();
        this.bubbles = this.bubbles.filter((x) => x !== b);
      },
    };
    this.bubbles.push(b);
    return b;
  }

  clearBubbles() {
    this.bubbles.forEach((b) => b.el.remove());
    this.bubbles = [];
  }

  updateBubbles() {
    const v = new THREE.Vector3();
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    for (const b of this.bubbles) {
      const p = b.track.position;
      v.set(p.x, p.y + b.yOff, p.z).project(this.camera);
      b.el.style.display = v.z < 1 ? '' : 'none';
      b.el.style.transform = `translate(-50%, -100%) translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
    }
  }

  setArrow(pos, y = 3) {
    this.arrowTarget = pos ? { pos, y } : null;
    this.arrow.visible = !!pos;
  }

  // ------------------------------------------------------------ input
  onPointer(e) {
    audio.unlock();
    if (this.state !== 'play') return;
    this.idle = 0;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);

    const live = this.items.filter((i) => i.enabled);
    const hits = this.raycaster.intersectObjects(live.map((i) => i.hit), false);
    let item = hits.length ? hits[0].object.userData.item : null;

    const point = new THREE.Vector3();
    const onGround = this.raycaster.ray.intersectPlane(this.groundPlane, point);
    if (!item && onGround) {
      let best = 1.3;
      for (const it of live) {
        const d = Math.hypot(it.pos.x - point.x, it.pos.z - point.z);
        if (d < best) {
          best = d;
          item = it;
        }
      }
    }

    if (item) {
      audio.sfx.tap();
      const dist = Math.hypot(item.pos.x - this.player.position.x, item.pos.z - this.player.position.z);
      if (dist <= item.reach) this.arrive(item);
      else this.walkTo(item.pos.x, item.pos.z, item.reach - 0.1, item);
    } else if (onGround) {
      this.area.clamp(point);
      audio.sfx.tap();
      this.showMarker(point);
      this.walkTo(point.x, point.z, 0.05, null);
    }
  }

  walkTo(x, z, stop, item, onArrive) {
    this.target = new THREE.Vector3(x, 0, z);
    this.stop = Math.max(stop, 0.05);
    this.targetItem = item;
    this.onArrive = onArrive || null;
    this.stuck = 0;
  }

  arrive(item) {
    this.target = null;
    if (item) {
      this.heading = Math.atan2(item.pos.x - this.player.position.x, item.pos.z - this.player.position.z);
      item.run();
    } else if (this.onArrive) {
      const cb = this.onArrive;
      this.onArrive = null;
      cb();
    }
  }

  faceToward(p) {
    this.heading = Math.atan2(p.x - this.player.position.x, p.z - this.player.position.z);
  }

  showMarker(p) {
    this.marker.position.set(p.x, 0.08, p.z);
    this.marker.visible = true;
    const m = this.marker;
    this.tween(0.6, (k) => {
      m.scale.setScalar(0.6 + k * 0.9);
      m.material.opacity = 0.9 * (1 - k);
    }, () => (m.visible = false));
    this.sparkles.emit(p.x, 0.2, p.z, 5, { speed: 0.8, up: 1, life: 0.6, colors: SPARKLE_COLORS });
  }

  // ------------------------------------------------------------ helpers
  burst(pos, n, speed = 1.2, y = 1, colors = SPARKLE_COLORS) {
    this.sparkles.emit(pos.x, (pos.y || 0) + y, pos.z, n, { speed, up: speed, life: 1.0, colors, gravity: 0.5, spread: 0.6 });
  }

  confettiAt(pos, y = 3.2) {
    this.confetti.emit(pos.x, y, pos.z, 120, {
      colors: [0xff5fae, 0xffd23f, 0x6ad7ff, 0xb48cff, 0x7be37a],
      speed: 3, up: 3, life: 3, gravity: 3, spread: 3,
    });
  }

  tween(dur, fn, done) {
    this.tweens.push({ t: 0, dur, fn, done });
  }

  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  }

  // an item shrinks away as it goes into the bag
  pickUp(obj, rise = 0.9, dur = 0.4) {
    const y0 = obj.position.y;
    const s0 = obj.scale.x;
    this.tween(dur, (k) => {
      obj.position.y = y0 + k * rise;
      obj.scale.setScalar(Math.max(0.001, s0 * (1 - k * k)));
      obj.rotation.y += 0.3;
    }, () => (obj.visible = false));
  }

  // jump an object to a point along an arc (used for pool jumps, flying balloons...)
  hop(obj, to, dur = 0.8, height = 2, done) {
    const pos = obj.position || obj; // an Object3D or a bare position vector
    const from = pos.clone();
    this.tween(dur, (k) => {
      pos.set(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k + Math.sin(k * Math.PI) * height, from.z + (to.z - from.z) * k);
    }, done);
  }

  wobble(obj) {
    const base = obj.rotation.z;
    this.tween(0.5, (k) => (obj.rotation.z = base + Math.sin(k * 20) * 0.35 * (1 - k)), () => (obj.rotation.z = base));
  }

  // ------------------------------------------------------------ frame
  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  cameraOffset() {
    const aspect = this.camera.aspect;
    const k = (aspect < 1 ? 1 / Math.pow(aspect, 0.55) : 1) * (this.area ? this.area.camScale : 1) * this.camZoom;
    return new THREE.Vector3(0, 8.5 * k, 12 * k);
  }

  snapCamera() {
    this.camZoom = this.camZoomTarget;
    this.updateCamera(1);
    this.camPos.copy(this.camera.position);
  }

  updateCamera(dt) {
    this.camZoom += (this.camZoomTarget - this.camZoom) * Math.min(1, dt * 4);
    const title = this.state === 'title';
    let off;
    let lookY;
    let ahead;
    if (title) {
      this.camAngle = Math.PI + Math.sin(this.t * 0.4) * 0.45;
      off = new THREE.Vector3(0, 2.6, 6.2).applyAxisAngle(UP, this.camAngle);
      lookY = 2.7;
      ahead = new THREE.Vector3();
    } else {
      this.camAngle = THREE.MathUtils.euclideanModulo(this.camAngle + Math.PI, Math.PI * 2) - Math.PI;
      this.camAngle *= Math.max(0, 1 - dt * 2.2);
      off = this.cameraOffset().applyAxisAngle(UP, this.camAngle);
      // zoomed in (wardrobe): aim below her so she sits in the top half, above the panel
      const z = THREE.MathUtils.clamp((1 - this.camZoom) / 0.5, 0, 1);
      lookY = 1.2 - z * 1.0;
      ahead = new THREE.Vector3(0, 0, -2.5 * (1 - z)).applyAxisAngle(UP, this.camAngle);
    }
    const desired = this.player.position.clone().add(off);
    this.camPos.lerp(desired, 1 - Math.exp(-dt * 4));
    this.camera.position.copy(this.camPos);
    const look = this.player.position;
    this.camera.lookAt(look.x + ahead.x, lookY, look.z + ahead.z);
  }

  resolveCollisions() {
    const p = this.player.position;
    for (const c of this.area.colliders) {
      // circles {x,z,r} or axis-aligned boxes {x,z,hw,hd}
      const nx = c.hw ? Math.max(c.x - c.hw, Math.min(c.x + c.hw, p.x)) : c.x;
      const nz = c.hw ? Math.max(c.z - c.hd, Math.min(c.z + c.hd, p.z)) : c.z;
      const dx = p.x - nx;
      const dz = p.z - nz;
      const d = Math.hypot(dx, dz);
      const min = (c.hw ? 0 : c.r) + PLAYER_R;
      if (d < min && d > 0.0001) {
        p.x = nx + (dx / d) * min;
        p.z = nz + (dz / d) * min;
      } else if (c.hw && d <= 0.0001) {
        // centre inside the box: push out along the shallow axis
        const px = c.hw - Math.abs(p.x - c.x);
        const pz = c.hd - Math.abs(p.z - c.z);
        if (px < pz) p.x = c.x + Math.sign(p.x - c.x || 1) * (c.hw + PLAYER_R);
        else p.z = c.z + Math.sign(p.z - c.z || 1) * (c.hd + PLAYER_R);
      }
    }
    this.area.clamp(p);
  }

  updatePlayer(dt) {
    const p = this.player.position;
    let moving = 0;
    if (this.target) {
      const dx = this.target.x - p.x;
      const dz = this.target.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d <= this.stop) {
        this.arrive(this.targetItem);
      } else {
        const step = Math.min(SPEED * dt, d - this.stop + 0.001);
        const bx = p.x;
        const bz = p.z;
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
        this.resolveCollisions();
        const moved = Math.hypot(p.x - bx, p.z - bz);
        moving = Math.min(1, moved / (SPEED * dt));
        this.heading = Math.atan2(dx, dz);
        this.stuck = moved < step * 0.3 ? this.stuck + dt : 0;
        if (this.stuck > 0.5) {
          const item = this.targetItem;
          const near = item && Math.hypot(item.pos.x - p.x, item.pos.z - p.z) < item.reach + 1.5;
          this.target = null;
          if (near) this.arrive(item);
        }
      }
    }
    this.walk += (moving - this.walk) * Math.min(1, dt * 10);
    let diff = this.heading - this.player.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.player.rotation.y += diff * Math.min(1, dt * 12);
    this.player.userData.animate(dt, this.walk, this.t);
  }

  updateFollowers() {
    const p = this.player.position;
    const fx = Math.sin(this.heading);
    const fz = Math.cos(this.heading);
    this.followers.forEach((c, i) => {
      const side = i % 2 ? 1 : -1;
      const back = 1.9 + i * 0.9;
      const tx = p.x - fx * back + fz * side * 0.9;
      const tz = p.z - fz * back - fx * side * 0.9;
      const d = Math.hypot(tx - c.root.position.x, tz - c.root.position.z);
      if (d > 0.7) {
        c.speed = Math.min(5.4, 2.2 + d * 0.9);
        c.dest = c.dest || new THREE.Vector3();
        c.dest.set(tx, 0, tz);
      } else if (c.dest) {
        c.dest = null;
        c.play('idle');
        c.heading = Math.atan2(p.x - c.root.position.x, p.z - c.root.position.z);
      }
    });
  }

  updateHints(dt) {
    if (this.hintSpots && this.state === 'play') {
      this.sparkleClock = (this.sparkleClock || 0) - dt;
      if (this.sparkleClock <= 0) {
        this.sparkleClock = 0.25;
        const spots = this.hintSpots();
        if (spots.length) {
          const s = spots[(Math.random() * spots.length) | 0];
          this.sparkles.emit(s.x, s.y, s.z, 2, { speed: 0.3, up: 0.8, life: 0.9, colors: SPARKLE_COLORS });
        }
      }
    }
    if (this.state === 'play' && this.step) {
      this.idle += dt;
      if (this.idle > 14) {
        this.idle = 0;
        say(this.step.hint);
      }
    }
    if (this.arrowTarget && this.arrow.visible) {
      const { pos, y } = this.arrowTarget;
      this.arrow.position.set(pos.x, y + Math.sin(this.t * 4) * 0.25, pos.z);
      this.arrow.rotation.y = this.t * 2;
    }
    const beam = this.area && this.area.beam;
    if (beam && beam.parent.visible) beam.material.opacity = 0.22 + Math.sin(this.t * 3) * 0.08;
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    this.t += dt;
    if (!this.area) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const due = [];
    this.timers = this.timers.filter((tm) => {
      tm.t -= dt;
      if (tm.t <= 0) {
        due.push(tm.fn);
        return false;
      }
      return true;
    });
    due.forEach((fn) => fn());

    for (const tw of this.tweens.slice()) {
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.fn(k);
      if (k >= 1) {
        this.tweens = this.tweens.filter((x) => x !== tw);
        tw.done && tw.done();
      }
    }

    this.updatePlayer(dt);
    this.updateFollowers();
    this.area.update(dt, this.t);
    for (const c of this.critters) c.update(dt, this.area.clamp);
    if (this.day && this.day.update) this.day.update(this, dt, this.t);
    this.updateHints(dt);
    this.sparkles.update(dt);
    this.hearts.update(dt);
    this.confetti.update(dt);

    for (const it of this.items) {
      if (it.track) {
        it.pos.set(it.track.position.x, 0, it.track.position.z);
        it.hit.position.set(it.track.position.x, it.hitY, it.track.position.z);
      }
    }

    const p = this.player.position;
    this.sun.position.set(p.x + 10, 20, p.z + 8);
    this.sun.target.position.set(p.x, 0, p.z);

    this.updateCamera(dt);
    this.updateBubbles();
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    const timer = new THREE.Timer();
    this.renderer.setAnimationLoop((ts) => {
      timer.update(ts);
      this.update(timer.getDelta());
    });
  }
}

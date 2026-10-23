// Day 3 · Kitchen Day: gather ingredients, stir, bake, decorate cupcakes.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { food } from '../assets.js';
import { makeCupcake } from '../models.js';

const FROSTING = [0xffffff, 0xffb3d9, 0xfff0a0, 0xc9a6ff, 0x9fe3ff, 0xb5f0c0];

export default {
  id: 3,
  name: t('d3.name'),
  sticker: '🧁',
  area: 'kitchen',
  intro: t('d3.intro'),
  steps: [
    { id: 'gather', icon: '🧺', count: 3, hint: t('d3.h.gather') },
    { id: 'mix', icon: '🥣', count: 5, hint: t('d3.h.mix') },
    { id: 'bake', icon: '🔥', count: 1, hint: t('d3.h.bake') },
    { id: 'decorate', icon: '🧁', count: 6, hint: t('d3.h.decorate') },
  ],

  start(game) {
    const a = game.area;
    this.stirs = 0;
    this.cupcakes = [];

    // ingredients
    const defs = [
      { key: 'egg', model: 'egg', scale: 3.4, name: t('d3.i.egg'), spot: a.spots.egg },
      { key: 'flour', model: 'bag', scale: 1.5, name: t('d3.i.flour'), spot: a.spots.flour },
      { key: 'strawberry', model: 'strawberry', scale: 3.4, name: t('d3.i.strawberry'), spot: a.spots.strawberry },
    ];
    this.found = [];
    this.ingredients = defs.map((d) => {
      const m = food(d.model, { scale: d.scale });
      m.position.copy(d.spot);
      a.group.add(m);
      const item = game.addItem({
        pos: d.spot, hitRadius: 0.9, reach: 1.7, hitY: d.spot.y + 0.4,
        run: () => {
          item.enabled = false;
          sfx.pop();
          game.addToBag(d.key);
          game.burst({ x: d.spot.x, y: d.spot.y, z: d.spot.z }, 16, 1, 0.5);
          game.tween(0.4, (k) => {
            m.position.y = d.spot.y + k * 1.2;
            m.scale.setScalar(Math.max(0.01, 1 - k * k));
          }, () => (m.visible = false));
          this.found.push(d);
          say(t('d3.found', { x: d.name }));
          game.addProgress('gather');
        },
      });
      return { m, item, d };
    });
    game.hintSpots = () =>
      game.step && game.step.id === 'gather'
        ? this.ingredients.filter((i) => i.item.enabled).map((i) => ({ x: i.d.spot.x, y: i.d.spot.y + 0.4, z: i.d.spot.z }))
        : [];
    game.setArrow(null);

    // the mixing bowl
    this.bowlItem = game.addItem({
      pos: a.island.pos, hitRadius: 1.3, reach: 2.6, hitY: 1.4,
      run: () => this.stir(game),
    });

    // the oven
    this.oven = game.addItem({
      pos: a.stovePos, hitRadius: 1.2, reach: 2.4, hitY: 0.8,
      run: () => this.bake(game),
    });
  },

  onStep(game, id) {
    const a = game.area;
    if (id === 'mix') {
      this.dropIn(game);
      game.setArrow(a.island.pos, 3.2);
      this.stirs = 0;
    }
    if (id === 'bake') {
      this.bowlItem.enabled = false; // so its big tap area never hides the cupcakes
      game.setArrow(a.stovePos, 3.0);
    }
    if (id === 'decorate') game.setArrow(null);
  },

  // ingredients tumble into the bowl
  dropIn(game) {
    const a = game.area;
    const top = a.island.top + 0.3;
    this.found.forEach((d, i) => {
      const m = food(d.model, { scale: d.scale * 0.9 });
      m.position.set(a.island.pos.x + (i - 1) * 0.25, top + 2.2 + i * 0.6, a.island.pos.z);
      a.group.add(m);
      game.after(i * 0.35, () =>
        game.tween(0.45, (k) => {
          m.position.y = top + 2.2 * (1 - k * k);
        }, () => {
          sfx.pop();
          game.burst({ x: a.island.pos.x, y: top, z: a.island.pos.z }, 8, 0.6, 0.3);
          m.removeFromParent();
        })
      );
    });
  },

  stir(game) {
    const a = game.area;
    if (!game.step) return;
    if (game.step.id === 'gather') {
      sfx.nope();
      say(t('d3.needFirst'));
      return;
    }
    if (game.step.id !== 'mix') return;
    this.stirs++;
    sfx.boing();
    const w = a.whisk;
    const bw = a.bowl;
    w.position.set(a.bowl.position.x + 0.2, a.island.top + 0.45, a.bowl.position.z);
    game.tween(0.4, (k) => {
      w.rotation.y += 0.5;
      w.position.x = a.bowl.position.x + Math.cos(k * 6.28) * 0.28;
      w.position.z = a.bowl.position.z + Math.sin(k * 6.28) * 0.28;
      bw.rotation.z = Math.sin(k * 6.28) * 0.06;
    }, () => (bw.rotation.z = 0));
    game.burst({ x: a.island.pos.x, y: a.island.top, z: a.island.pos.z }, 10, 1, 0.7, [0xffc2e0, 0xfff0a0, 0xffffff]);
    say(t('stirs')[this.stirs - 1] || t('d3.stir'));
    game.addProgress('mix');
  },

  bake(game) {
    const a = game.area;
    if (!game.step || game.step.id !== 'bake') {
      sfx.nope();
      say(game.step && game.step.id === 'decorate' ? t('d3.alreadyBaked') : t('d3.bakeEarly'));
      return;
    }
    this.oven.enabled = false;
    game.setArrow(null);
    game.state = 'party'; // lock input while baking
    say(t('d3.into'));
    const p = a.stovePos;
    for (let i = 0; i < 6; i++)
      game.after(i * 0.5, () => {
        game.sparkles.emit(p.x, 1.4, p.z + 0.8, 6, { speed: 0.6, up: 1.4, life: 1.2, colors: [0xffd27a, 0xffffff] });
        sfx.tap();
      });
    game.after(3.4, () => {
      sfx.chime();
      say(t('d3.ding'));
      game.state = 'play';
      // six plain cupcakes pop out around the bowl
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + 0.3;
        const cx = a.island.pos.x + Math.cos(ang) * 1.15;
        const cz = a.island.pos.z + Math.sin(ang) * 1.15;
        const full = makeCupcake(FROSTING[i]);
        full.userData.top.visible = false;
        const holder = new THREE.Group();
        holder.add(full);
        holder.scale.setScalar(3);
        holder.position.set(cx, a.island.top + 0.02, cz);
        a.group.add(holder);
        game.after(i * 0.15, () => {
          game.tween(0.4, (k) => holder.scale.setScalar(3 * (0.3 + 0.7 * Math.sin(k * Math.PI * 0.5 + 0.0) + Math.sin(k * Math.PI) * 0.2)));
          sfx.pop();
        });
        const item = game.addItem({
          pos: { x: cx, z: cz }, hitRadius: 0.55, reach: 2.8, hitY: a.island.top + 0.3,
          run: () => {
            item.enabled = false;
            full.userData.top.visible = true;
            full.userData.top.children[0].material = full.userData.top.children[0].material.clone();
            full.userData.top.children[0].material.color.set(FROSTING[i]);
            sfx.pop();
            game.burst({ x: cx, y: a.island.top + 0.2, z: cz }, 14, 1, 0.5, [0xffffff, 0xffc2e0, 0xfff0a0, 0xc9a6ff]);
            game.tween(0.35, (k) => (holder.position.y = a.island.top + 0.02 + Math.sin(k * Math.PI) * 0.35));
            game.addProgress('decorate');
          },
        });
        this.cupcakes.push(item);
      }
      game.advanceStepSilent();
      game.after(1.0, () => say(t('d3.tapEach')));
    });
  },

  // after the last cupcake: celebrate
  onDone(game) {
    const a = game.area;
    game.state = 'party';
    game.player.userData.cheering = true;
    sfx.fanfare();
    say(t('d3.yummy'));
    game.confettiAt(a.island.pos, 3.5);
    game.after(5.0, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d3.end'));
    });
  },
};

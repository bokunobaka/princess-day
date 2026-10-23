// Day 10 · Pool Day: find pool toys, splash into the water (friends too), serve everyone a drink.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { food } from '../assets.js';

const DRINKS = [
  { id: 'watermelon', icon: '🍉', word: t('drink.watermelon'), model: 'watermelon' },
  { id: 'icecream', icon: '🍦', word: t('drink.icecream'), model: 'ice-cream' },
  { id: 'juice', icon: '🧃', word: t('drink.juice'), model: 'soda-glass' },
];

export default {
  id: 10,
  name: t('d10.name'),
  sticker: '🏊',
  area: 'pool',
  intro: t('d10.intro'),
  steps: [
    { id: 'toys', icon: '🦆', count: 4, hint: t('d10.h.toys') },
    { id: 'splash', icon: '💦', count: 3, hint: t('d10.h.splash') },
    { id: 'drinks', icon: '🍹', count: 3, hint: t('d10.h.drinks') },
  ],

  start(game) {
    const a = game.area;
    this.rounds = 0;
    this.selected = null;

    a.toys.forEach((o) => {
      o.item = game.addItem({
        pos: o.pos, hitRadius: 1.1, reach: 1.5, hitY: 0.7,
        run: () => {
          if (o.taken) return;
          o.taken = true;
          o.item.enabled = false;
          o.glow.visible = false;
          sfx.pop();
          game.addToBag('toy');
          game.burst({ x: o.pos.x, y: 0.8, z: o.pos.z }, 14, 1.2, 0.4, [0xffffff, 0x9be7ff, 0xfff0a0]);
          game.pickUp(o.group, 1.2);
          say(t('nums')[Math.min(game.progress, 5)]);
          game.addProgress('toys');
        },
      });
    });
    game.hintSpots = () => {
      if (!game.step) return [];
      if (game.step.id === 'toys') return a.toys.filter((o) => !o.taken).map((o) => ({ x: o.pos.x, y: 1.0, z: o.pos.z }));
      if (game.step.id === 'splash') return [{ x: (Math.random() - 0.5) * 8, y: 0.2, z: a.POOL.z + (Math.random() - 0.5) * 3 }];
      return [];
    };

    // tapping anywhere on the water: walk to the edge, then jump in
    this.pool = game.addItem({
      pos: a.edgePos, hitRadius: 6.4, reach: 0.9, hitY: -0.3,
      run: () => this.splash(game),
    });
    this.pool.hit.position.set(a.POOL.x, -0.15, a.POOL.z);
    // a flat slab over the water only, so it never catches taps meant for things beside or behind the pool
    this.pool.hit.scale.set(1, 0.08, 0.52);
  },

  onStep(game, id) {
    if (id === 'splash') game.setArrow(game.area.edgePos, 3);
    if (id === 'drinks') {
      game.setArrow(null);
      this.beginServing(game);
    }
  },

  splash(game) {
    const a = game.area;
    if (game.state !== 'play') return;
    const round = this.rounds++;
    const p = game.player;
    game.setArrow(null);
    game.state = 'party';
    game.target = null;
    const edge = p.position.clone();
    const spot = new THREE.Vector3(a.POOL.x + (round - 1) * 2.4, -0.55, a.POOL.z + (round - 1) * 0.5);
    p.userData.cheering = false;

    const water = (x, z, n = 40) => {
      sfx.splash();
      game.sparkles.emit(x, 0.2, z, n, { speed: 3, up: 4, life: 1.2, colors: [0x9be7ff, 0xffffff, 0x6ad7ff], gravity: 8, spread: 0.6 });
    };

    game.hop(p.position, spot, 0.9, 2.6, () => {
      water(spot.x, spot.z, 60);
      say(t('splashes')[round % 3]);
      // float and bob, while a friend runs over and jumps in too
      game.tween(1.9, (k) => (p.position.y = -0.55 + Math.sin(k * 10) * 0.06));
      const f = a.friends[round % a.friends.length];
      const home = f.root.position.clone();
      const side = new THREE.Vector3(a.POOL.x + a.POOL.hw + 1.0, 0, a.POOL.z + (round - 1) * 1.1);
      f.goTo(side.x, side.z, {
        speed: 4.6,
        onArrive: () => {
          f.heading = -Math.PI / 2;
          f.play('dance');
          const into = new THREE.Vector3(spot.x + 1.8, -0.4, spot.z);
          game.hop(f.root.position, into, 0.8, 2.2, () => {
            water(into.x, into.z, 40);
            game.after(1.0, () => {
              game.hop(f.root.position, side, 0.8, 2, () => {
                f.root.position.y = 0;
                f.goTo(home.x, home.z, { speed: 3.5 });
              });
            });
          });
        },
      });
      game.after(2.1, () => {
        game.hop(p.position, edge, 0.8, 2.2, () => {
          p.position.copy(edge);
          p.position.y = 0;
          game.state = 'play';
          game.hearts.emit(edge.x, 1.6, edge.z, 6, { speed: 0.6, up: 1.2, life: 1.4, colors: [0x6ad7ff, 0xffffff] });
          game.addProgress('splash');
        });
      });
    });
  },

  beginServing(game) {
    const a = game.area;
    const likes = ['watermelon', 'icecream', 'juice'];
    const names = ['bunny', 'elephant', 'panda'];
    this.guests = a.friends.map((c, i) => ({ c, likes: likes[i], name: t('animal.' + names[i]) }));
    // the thirsty friends walk over and line up in front of the pool, where they can be seen and tapped
    a.friends.forEach((c, i) => {
      c.goTo([-5.4, -2.8, 3.0][i], 0.3, {
        speed: 4.4,
        onArrive: () => {
          c.heading = Math.atan2(game.player.position.x - c.root.position.x, game.player.position.z - c.root.position.z);
        },
      });
    });
    say(t('d10.look'));
    game.ui.showTray(DRINKS, (id) => {
      this.selected = id;
      sfx.tap();
    });
    this.guests.forEach((g) => {
      const d = DRINKS.find((x) => x.id === g.likes);
      g.bubble = game.addBubble(g.c.root, d.icon, g.c.height + 0.7);
      g.item = game.addItem({
        track: g.c.root, hitRadius: 1.2, reach: 99, hitY: 0.9,
        run: () => this.serve(game, g),
      });
    });
  },

  serve(game, g) {
    if (g.served) return;
    if (!this.selected) {
      sfx.nope();
      say(t('d4.pickFirst'));
      game.ui.pulseTray();
      return;
    }
    const c = g.c;
    if (this.selected !== g.likes) {
      sfx.nope();
      c.gesture('gesture-negative');
      const want = DRINKS.find((x) => x.id === g.likes);
      say(t('d10.no', { name: g.name, want: want.word }));
      return;
    }
    g.served = true;
    g.item.enabled = false;
    g.bubble.remove();
    const d = DRINKS.find((x) => x.id === g.likes);
    const m = food(d.model, { height: 0.7 });
    m.position.set(c.root.position.x, 1.9, c.root.position.z);
    game.area.group.add(m);
    c.play('eat', { once: true });
    sfx.pop();
    game.tween(0.9, (k) => (m.position.y = 1.9 - k * 0.6), () => m.removeFromParent());
    game.after(1.2, () => {
      sfx.chime();
      game.hearts.emit(c.root.position.x, 2, c.root.position.z, 10, { speed: 0.8, up: 1.4, life: 1.8, colors: [0xff5fae, 0xff8fc7, 0xffffff] });
      say(t('d4.yum', { name: g.name }));
      c.play('gesture-positive', { once: true });
    });
    game.addProgress('drinks');
  },

  onDone(game) {
    const a = game.area;
    game.ui.hideTray();
    game.state = 'party';
    game.target = null;
    game.after(1.8, () => {
      sfx.fanfare();
      say(t('d10.done'));
      game.confettiAt({ x: 0, z: a.POOL.z }, 5);
      const p = game.player;
      p.userData.cheering = true;
      // everyone cannonballs in together
      a.friends.forEach((f, i) => {
        const into = new THREE.Vector3(-3 + i * 3, -0.4, a.POOL.z + (i - 1) * 0.8);
        game.after(0.4 + i * 0.35, () => {
          f.play('dance');
          game.hop(f.root.position, into, 0.9, 3, () => {
            sfx.splash();
            game.sparkles.emit(into.x, 0.2, into.z, 50, { speed: 3.2, up: 4.2, life: 1.3, colors: [0x9be7ff, 0xffffff, 0x6ad7ff], gravity: 8, spread: 0.6 });
          });
        });
      });
      game.after(1.6, () => {
        const into = new THREE.Vector3(0, -0.55, a.POOL.z + 0.6);
        game.hop(p.position, into, 1.0, 3.2, () => {
          sfx.splash();
          game.sparkles.emit(into.x, 0.2, into.z, 70, { speed: 3.5, up: 4.5, life: 1.4, colors: [0x9be7ff, 0xffffff, 0x6ad7ff], gravity: 8, spread: 0.8 });
        });
      });
    });
    game.after(8, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d10.end'));
    });
  },
};

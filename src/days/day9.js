// Day 9 · Christmas: find ornaments for the tree, build a snowman, give presents to friends.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';

export default {
  id: 9,
  name: t('d9.name'),
  sticker: '🎄',
  area: 'winter',
  intro: t('d9.intro'),
  steps: [
    { id: 'ornaments', icon: '🔔', count: 3, hint: t('d9.h.ornaments') },
    { id: 'snowman', icon: '⛄', count: 3, hint: t('d9.h.snowman') },
    { id: 'gifts', icon: '🎁', count: 3, hint: t('d9.h.gifts') },
  ],

  start(game) {
    const a = game.area;
    this.hung = 0;
    this.stacked = 0;
    this.carrying = 0;

    a.ornaments.forEach((o, i) => {
      o.item = game.addItem({
        pos: o.pos, hitRadius: 1.0, reach: 1.4, hitY: 0.6,
        run: () => {
          if (o.taken) return;
          o.taken = true;
          o.item.enabled = false;
          o.glow.visible = false;
          sfx.chime();
          game.addToBag('ornament');
          say(t('d9.foundOrnament'));
          // fly it onto the tree
          const spot = a.hangSpots[this.hung++];
          game.hop(o.group, spot, 1.2, 2.5, () => {
            sfx.sparkle();
            game.burst(spot, 10, 1, 0, [0xffffff, 0xffe066]);
            game.addToBag('ornament', -1);
          });
          if (this.hung === 3) {
            game.after(1.4, () => {
              a.lights.forEach((l) => (l.visible = true));
              a.star.visible = true;
              a.starGlow.visible = true;
              sfx.fanfare();
              say(t('d9.treeLit'));
            });
          }
          game.addProgress('ornaments');
        },
      });
    });
    game.hintSpots = () => {
      if (!game.step) return [];
      if (game.step.id === 'ornaments') return a.ornaments.filter((o) => !o.taken).map((o) => ({ x: o.pos.x, y: 1, z: o.pos.z }));
      if (game.step.id === 'snowman') return a.lumps.filter((l) => !l.used).map((l) => ({ x: l.pos.x, y: 1.4, z: l.pos.z }));
      return [];
    };

    a.lumps.forEach((l) => {
      l.item = game.addItem({
        pos: l.pos, hitRadius: 1.2, reach: 1.6, hitY: 0.7,
        run: () => {
          if (l.used) return;
          l.used = true;
          l.item.enabled = false;
          const idx = this.stacked++;
          sfx.boing();
          say(t('d9.snowball'));
          const from = l.group.position.clone();
          const to = new THREE.Vector3(a.SITE.x, a.stackY[idx] - a.stackR[idx], a.SITE.z);
          const s0 = l.group.scale.x;
          const s1 = a.stackR[idx] / l.r;
          // roll across the snow, growing or shrinking to the right size for its place
          game.tween(1.3, (k) => {
            l.group.position.set(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k + Math.sin(k * Math.PI) * 0.8, from.z + (to.z - from.z) * k);
            l.group.scale.setScalar(s0 + (s1 - s0) * k);
            l.group.rotation.x = k * 6;
          }, () => {
            game.burst({ x: a.SITE.x, y: a.stackY[idx], z: a.SITE.z }, 14, 1, 0, [0xffffff, 0xcfe8ff]);
            if (idx === 2) {
              a.extras.visible = true;
              sfx.chime();
              say(t('d9.snowmanDone'));
            }
          });
          game.addProgress('snowman');
        },
      });
    });

    // the present pile under the tree
    this.sack = game.addItem({
      pos: a.stackPos, hitRadius: 1.9, reach: 2.6, hitY: 0.6,
      run: () => {
        if (this.carrying) return;
        this.carrying = 1;
        sfx.pop();
        game.addToBag('present');
        game.burst({ x: a.stackPos.x, y: 1, z: a.stackPos.z }, 12, 1, 0.4, [0xffe066, 0xffffff, 0xff5fae]);
      },
    });

    a.friends.forEach((c) => {
      const bubble = game.addBubble(c.root, '🎁', c.height + 0.6);
      const item = game.addItem({
        track: c.root, hitRadius: 1.2, reach: 2.2, hitY: 0.9,
        run: () => {
          if (!this.carrying) {
            sfx.nope();
            say(t('d9.takePresent'));
            return;
          }
          this.carrying = 0;
          item.enabled = false;
          bubble.remove();
          game.addToBag('present', -1);
          sfx.chime();
          c.gesture('gesture-positive');
          game.after(1.4, () => c.play('dance'));
          game.hearts.emit(c.root.position.x, 1.8, c.root.position.z, 8, { speed: 0.7, up: 1.4, life: 1.6, colors: [0xff5fae, 0xff8fc7, 0xffffff] });
          say(t('d9.gave'));
          game.addProgress('gifts');
        },
      });
    });
  },

  onStep(game, id) {
    if (id === 'gifts') game.setArrow(game.area.stackPos, 2.2);
  },

  onDone(game) {
    const a = game.area;
    game.state = 'party';
    game.target = null;
    game.setArrow(null);
    sfx.fanfare();
    say(t('d9.done'));
    game.player.userData.cheering = true;
    a.friends.forEach((c) => c.play('dance'));
    game.confettiAt({ x: 0, z: -4 }, 4);
    for (let i = 0; i < 8; i++)
      game.after(0.4 + i * 0.6, () => {
        game.sparkles.emit((Math.random() - 0.5) * 14, 6 + Math.random() * 4, -9 + (Math.random() - 0.5) * 4, 36, {
          speed: 3, up: 2, life: 1.4, colors: [[0xff5fae, 0xffffff], [0xffe066, 0xffffff], [0x6ad7ff, 0xffffff]][i % 3], gravity: 3, spread: 0.3,
        });
        sfx.sparkle();
      });
    game.after(7, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d9.end'));
    });
  },
};

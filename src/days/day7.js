// Day 7 · Birthday: gather balloons, find presents, light the candles, sing happy birthday.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { holiday } from '../assets.js';

export default {
  id: 7,
  name: t('d7.name'),
  sticker: '🎂',
  area: 'party',
  intro: t('d7.intro'),
  steps: [
    { id: 'balloons', icon: '🎈', count: 5, hint: t('d7.h.balloons') },
    { id: 'presents', icon: '🎁', count: 3, hint: t('d7.h.presents') },
    { id: 'candles', icon: '🕯️', count: 3, hint: t('d7.h.candles') },
    { id: 'song', icon: '🎂', count: 1, hint: t('d7.h.song') },
  ],

  start(game) {
    const a = game.area;
    this.lit = 0;

    a.balloons.forEach((b, i) => {
      b.item = game.addItem({
        pos: b.pos, hitRadius: 1.0, reach: 1.6, hitY: 2.2,
        run: () => {
          if (b.taken) return;
          b.taken = true;
          b.item.enabled = false;
          sfx.pop();
          game.addToBag('balloon');
          const target = a.anchors[i].clone();
          game.hop(b.group, target, 1.1, 1.0);
          game.burst({ x: b.pos.x, y: 2, z: b.pos.z }, 12, 1, 0.6, [0xffffff, 0xffc2e0, 0xfff0a0]);
          say(t('nums')[Math.min(game.progress, 5)]);
          game.addProgress('balloons');
        },
      });
    });
    game.hintSpots = () => {
      if (!game.step) return [];
      if (game.step.id === 'balloons') return a.balloons.filter((b) => !b.taken).map((b) => ({ x: b.pos.x, y: 2.4, z: b.pos.z }));
      if (game.step.id === 'presents') return a.presents.filter((p) => !p.taken).map((p) => ({ x: p.pos.x, y: 0.9, z: p.pos.z }));
      return [];
    };

    a.presents.forEach((p) => {
      p.item = game.addItem({
        pos: p.pos, hitRadius: 1.0, reach: 1.5, hitY: 0.5,
        run: () => {
          if (p.taken) return;
          p.taken = true;
          p.item.enabled = false;
          sfx.chime();
          game.addToBag('present');
          game.burst(p.pos, 16, 1.2, 0.6);
          game.pickUp(p.group);
          say(t('d7.foundPresent'));
          game.addProgress('presents');
        },
      });
    });

    // the cake: lights candles, then sings
    this.cakeItem = game.addItem({
      pos: a.tablePos, hitRadius: 1.8, hitY: 1.3, reach: 3.2,
      run: () => this.cake(game),
    });

    game.addItem({
      track: a.teddy, hitRadius: 1.2, reach: 3.0, hitY: 1.2,
      run: () => {
        sfx.boing();
        a.cheerTeddy(game.sillyTap('teddy') ? 3 : 1.2);
        game.hearts.emit(a.teddy.position.x, 2.2, a.teddy.position.z, 6, { speed: 0.6, up: 1.2, life: 1.6, colors: [0xff5fae, 0xff8fc7] });
        say(t('d7.teddy'));
      },
    });
  },

  onStep(game, id) {
    const a = game.area;
    if (id === 'candles') {
      // the presents the princess found are now piled up next to the table
      const kinds = ['present-a-cube', 'present-b-round', 'present-a-rectangle'];
      kinds.forEach((k, i) => {
        const m = holiday(k, { height: 0.9 });
        m.position.set(-2.6 + i * 0.9, 0, -3.4 + (i % 2) * 0.6);
        m.rotation.y = i;
        a.group.add(m);
        m.scale.multiplyScalar(0.01);
        game.after(i * 0.2, () => game.tween(0.4, (kk) => m.scale.setScalar(Math.max(0.01, kk)), null));
      });
      game.setArrow(a.tablePos, 3.2);
    }
    if (id === 'song') game.setArrow(a.tablePos, 3.2);
  },

  cake(game) {
    const a = game.area;
    const id = game.step && game.step.id;
    if (id === 'candles') {
      const i = this.lit++;
      a.flames[i].visible = true;
      a.glow.visible = true;
      sfx.sparkle();
      game.burst({ x: 0, y: 2.1, z: -1.8 }, 12, 1, 0.3, [0xffe066, 0xffffff]);
      say(t('d7.candle'));
      game.addProgress('candles');
    } else if (id === 'song') {
      this.sing(game);
    } else {
      sfx.nope();
      say(t('d7.notYet'));
    }
  },

  sing(game) {
    const a = game.area;
    game.state = 'party';
    game.target = null;
    game.setArrow(null);
    const dur = sfx.birthday() || 12;
    a.guests.forEach((c, i) => game.after(i * 0.3, () => c.play('dance')));
    a.cheerTeddy(dur);
    game.player.userData.cheering = true;
    game.advanceStepSilent();
    game.after(dur + 0.4, () => {
      say(t('d7.wish'));
      game.player.userData.cheering = false;
    });
    game.after(dur + 2.6, () => {
      a.flames.forEach((f) => (f.visible = false));
      a.glow.visible = false;
      sfx.pop();
      sfx.fanfare();
      say(t('d7.done'));
      game.confettiAt({ x: 0, z: -1.8 }, 5);
      game.burst({ x: 0, y: 1.5, z: -1.8 }, 40, 2.4, 1);
      a.cheerTeddy(5);
      game.player.userData.cheering = true;
    });
    game.after(dur + 8.5, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d7.end'));
    });
  },
};

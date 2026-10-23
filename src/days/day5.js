// Day 5 · Royal Ball: light the candles, invite friends, dance on the glowing tiles, fireworks.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { Critter } from '../assets.js';

const FRIENDS = [
  { name: 'bunny', h: 1.1, at: [-10, 4], hello: t('d5.hello.bunny') },
  { name: 'elephant', h: 1.9, at: [10, 4], hello: t('d5.hello.elephant') },
  { name: 'panda', h: 1.5, at: [-10, -2], hello: t('d5.hello.panda') },
  { name: 'giraffe', h: 2.4, at: [10, -2], hello: t('d5.hello.giraffe') },
];

export default {
  id: 5,
  name: t('d5.name'),
  sticker: '👑',
  area: 'ballroom',
  intro: t('d5.intro'),
  steps: [
    { id: 'light', icon: '🕯️', count: 3, hint: t('d5.h.light') },
    { id: 'invite', icon: '💌', count: 4, hint: t('d5.h.invite') },
    { id: 'dance', icon: '💃', count: 6, hint: t('d5.h.dance') },
  ],

  start(game) {
    const a = game.area;
    this.friends = [];

    a.candelabras.forEach((c, i) => {
      const [x, z] = a.candelabraSpots[i];
      const item = game.addItem({
        pos: { x, z }, hitRadius: 1.2, reach: 1.8, hitY: 2.4,
        run: () => {
          if (c.userData.lit) return;
          item.enabled = false;
          c.userData.light();
          sfx.sparkle();
          game.burst({ x, y: 3.7, z }, 20, 1.4, 0, [0xffe9a8, 0xffffff, 0xffb347]);
          game.addProgress('light');
        },
      });
    });
    game.hintSpots = () =>
      game.step && game.step.id === 'light'
        ? a.candelabras.filter((c) => !c.userData.lit).map((c) => ({ x: c.position.x, y: 3.8, z: c.position.z }))
        : [];

    FRIENDS.forEach((f, i) => {
      const c = new Critter(f.name, f.h);
      c.root.position.set(f.at[0], 0, f.at[1]);
      c.heading = f.at[0] < 0 ? 1.2 : -1.2;
      c.root.rotation.y = c.heading;
      a.group.add(c.root);
      game.addCritter(c);
      this.friends.push(c);
      const bubble = game.addBubble(c.root, '💌', f.h + 0.6);
      const item = game.addItem({
        track: c.root, hitRadius: 1.2, reach: 2.0, hitY: 1,
        run: () => {
          item.enabled = false;
          bubble.remove();
          sfx.chime();
          c.gesture('gesture-positive');
          say(f.hello);
          const ang = (i / FRIENDS.length) * Math.PI * 2 + 0.8;
          game.after(1.2, () => c.goTo(a.center.x + Math.cos(ang) * 2.2, a.center.z + Math.sin(ang) * 2.2, {
            speed: 4,
            onArrive: () => {
              c.heading = Math.atan2(a.center.x - c.root.position.x, a.center.z - c.root.position.z);
              c.play('dance');
            },
          }));
          game.addProgress('invite');
        },
      });
    });
  },

  onStep(game, id) {
    if (id === 'dance') this.startDance(game);
  },

  startDance(game) {
    const a = game.area;
    this.stepped = 0;
    a.tiles.forEach((t, i) => {
      t.visible = true;
      const item = game.addItem({
        pos: { x: t.position.x, z: t.position.z }, hitRadius: 1.0, reach: 0.5, hitY: 0.3,
        run: () => {
          if (item.done) return;
          item.done = true;
          item.enabled = false;
          t.material.opacity = 1;
          sfx.note(this.stepped);
          this.stepped++;
          game.burst({ x: t.position.x, y: 0.3, z: t.position.z }, 18, 1.5, 0.4, [t.material.color.getHex(), 0xffffff]);
          game.hearts.emit(t.position.x, 0.6, t.position.z, 3, { speed: 0.5, up: 1.4, life: 1.4, colors: [0xff5fae, 0xffffff] });
          game.addProgress('dance');
        },
      });
    });
    game.hintSpots = () =>
      game.step && game.step.id === 'dance'
        ? a.tiles.filter((t) => t.material.opacity < 1).map((t) => ({ x: t.position.x, y: 0.4, z: t.position.z }))
        : [];
    this.pulse = (t) => a.tiles.forEach((tile, i) => { if (tile.material.opacity < 1) tile.material.opacity = 0.45 + Math.sin(t * 4 + i) * 0.2; });
  },

  update(game, dt, t) {
    if (this.pulse && game.step && game.step.id === 'dance') this.pulse(t);
  },

  onDone(game) {
    const a = game.area;
    game.state = 'party';
    game.target = null;
    sfx.fanfare();
    say(t('d5.done'));
    game.walkTo(a.center.x, a.center.z, 0.1, null, () => (game.player.userData.cheering = true));
    this.friends.forEach((c) => c.play('dance'));
    game.confettiAt(a.center, 4.5);
    for (let i = 0; i < 16; i++)
      game.after(0.5 + i * 0.45, () => {
        const x = (Math.random() - 0.5) * 20;
        const y = 6 + Math.random() * 5;
        const z = -4 + (Math.random() - 0.5) * 8;
        const colors = [[0xff6bb5, 0xffffff], [0xffe66b, 0xffb347], [0x6ad7ff, 0xffffff], [0xb48cff, 0xff6bb5]][i % 4];
        game.sparkles.emit(x, y, z, 50, { speed: 4, up: 3, life: 1.6, colors, gravity: 3, spread: 0.3 });
        sfx.sparkle();
      });
    game.after(9, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d5.end'));
    });
  },
};

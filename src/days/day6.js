// Day 6 · Halloween: find pumpkins, pick a costume, trick-or-treat at three cottages.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { Critter } from '../assets.js';

const FRIENDS = [
  { model: 'character-ghost', line: 'd6.ghost' },
  { model: 'character-skeleton', line: 'd6.skeleton' },
  { model: 'character-vampire', line: 'd6.vampire' },
];

export default {
  id: 6,
  name: t('d6.name'),
  sticker: '🎃',
  area: 'halloween',
  intro: t('d6.intro'),
  steps: [
    { id: 'pumpkins', icon: '🎃', count: 3, hint: t('d6.h.pumpkins') },
    { id: 'costume', icon: '🧙', count: 1, hint: t('d6.h.costume') },
    { id: 'treats', icon: '🍬', count: 3, hint: t('d6.h.treats') },
  ],

  start(game) {
    const a = game.area;
    this.friends = [];
    this.count = 0;

    a.pumpkins.forEach((p) => {
      p.item = game.addItem({
        pos: p.pos, hitRadius: 0.9, reach: 1.3, hitY: 0.6,
        run: () => {
          if (p.picked) return;
          p.picked = true;
          p.item.enabled = false;
          sfx.pop();
          game.addToBag('pumpkin');
          game.burst(p.pos, 14, 1, 0.6, [0xffa23a, 0xffe0a8, 0xffffff]);
          game.pickUp(p.group);
          say(t('nums')[Math.min(game.progress, 5)]);
          game.addProgress('pumpkins');
        },
      });
    });
    game.hintSpots = () =>
      game.step && game.step.id === 'pumpkins'
        ? a.pumpkins.filter((p) => !p.picked).map((p) => ({ x: p.pos.x, y: 1.0, z: p.pos.z }))
        : [];

    this.chest = game.addItem({
      pos: a.chestPos, hitRadius: 1.3, reach: 2.2, hitY: 0.9,
      run: () => {
        game.setArrow(null);
        game.openWardrobe(() => {
          sfx.chime();
          say(t('d6.costume'));
          if (!this.costumed) {
            this.costumed = true;
            game.addProgress('costume');
          }
        });
      },
    });

    a.ghosts.forEach((c) =>
      game.addItem({
        track: c.root, hitRadius: 1.1, reach: 2.2, hitY: 1.0,
        run: () => {
          sfx.boo();
          c.gesture('gesture-positive');
          say(t('d6.boo'));
        },
      })
    );

    a.houses.forEach((h, i) => {
      const item = game.addItem({
        pos: { x: h.door.x, z: h.door.z }, hitRadius: 1.5, reach: 3.0, hitY: 1.3,
        run: () => {
          item.enabled = false;
          game.setArrow(null);
          sfx.tap();
          game.after(0.25, sfx.tap);
          const f = FRIENDS[i];
          game.after(0.7, () => {
            const c = new Critter(f.model, 1.8, 'graveyard');
            c.root.position.set(h.door.x, 0, h.door.z + 0.2);
            c.heading = 0;
            a.group.add(c.root);
            game.addCritter(c);
            this.friends.push(c);
            sfx.boo();
            c.goTo(h.door.x - 0.6, h.door.z + 1.5, {
              speed: 2.2,
              onArrive: () => {
                c.heading = Math.atan2(game.player.position.x - c.root.position.x, game.player.position.z - c.root.position.z);
                c.gesture('gesture-positive');
                sfx.chime();
                say(t(f.line));
                game.addToBag('candy');
                game.burst({ x: c.root.position.x, y: 1.2, z: c.root.position.z }, 20, 1.4, 0.6, [0xff5fae, 0xffe066, 0x6ad7ff, 0xffffff]);
                game.hearts.emit(c.root.position.x, 2.0, c.root.position.z, 6, { speed: 0.6, up: 1.3, life: 1.5, colors: [0xff5fae, 0xff8fc7] });
                game.addProgress('treats');
              },
            });
          });
        },
      });
    });
  },

  onStep(game, id) {
    if (id === 'costume') game.setArrow(game.area.chestPos, 2.8);
  },

  onDone(game) {
    const a = game.area;
    game.state = 'party';
    game.target = null;
    sfx.fanfare();
    say(t('d6.done'));
    game.player.userData.cheering = true;
    this.friends.forEach((c) => c.play('dance'));
    a.ghosts.forEach((c) => c.play('dance'));
    game.confettiAt({ x: 0, z: -2 }, 4);
    for (let i = 0; i < 10; i++)
      game.after(0.4 + i * 0.5, () => {
        const x = (Math.random() - 0.5) * 18;
        game.sparkles.emit(x, 7 + Math.random() * 3, -6 + (Math.random() - 0.5) * 8, 40, {
          speed: 3.5, up: 2.5, life: 1.5, colors: [[0xffa23a, 0xffe066], [0xb48cff, 0xffffff], [0x9dff8a, 0xffffff]][i % 3], gravity: 3, spread: 0.3,
        });
        sfx.sparkle();
      });
    game.after(7, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d6.end'));
    });
  },
};

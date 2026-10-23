// Day 15 · Camping Day: firewood, a campfire, marshmallows for the friends.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { add, SPHERE, CYL } from '../models.js';

export default {
  id: 15,
  name: t('d15.name'),
  sticker: '⛺',
  area: 'camp',
  intro: t('d15.intro'),
  steps: [
    { id: 'wood', icon: '🪵', count: 4, hint: t('d15.h.wood') },
    { id: 'fire', icon: '🔥', count: 1, hint: t('d15.h.fire') },
    { id: 'marsh', icon: '🍡', count: 3, hint: t('d15.h.marsh') },
  ],

  start(game) {
    const a = game.area;

    a.woods.forEach((w) => {
      w.item = game.addItem({
        pos: w.pos, hitRadius: 1.0, reach: 1.4, hitY: 0.5,
        run: () => {
          if (w.taken) return;
          w.taken = true;
          w.item.enabled = false;
          w.glow.visible = false;
          sfx.pop();
          game.addToBag('wood');
          game.burst({ x: w.pos.x, y: 0.6, z: w.pos.z }, 10, 1, 0.3, [0xffe066, 0xffffff]);
          game.pickUp(w.group, 1.0);
          say(t('nums')[Math.min(game.progress, 5)]);
          game.addProgress('wood');
        },
      });
    });
    game.hintSpots = () =>
      game.step && game.step.id === 'wood' ? a.woods.filter((w) => !w.taken).map((w) => ({ x: w.pos.x, y: 0.9, z: w.pos.z })) : [];

    this.fireItem = game.addItem({
      pos: a.pitPos, hitRadius: 1.7, reach: 2.8, hitY: 0.6,
      run: () => {
        if (this.lit) return;
        if ((game.bag.wood || 0) < 4 || !game.step || game.step.id !== 'fire') {
          sfx.nope();
          say(t('d15.needWood'));
          return;
        }
        this.lit = true;
        this.fireItem.enabled = false;
        game.setArrow(null);
        game.addToBag('wood', -4);
        a.setFire(true);
        sfx.fanfare();
        say(t('d15.fire'));
        game.addProgress('fire');
      },
    });

    a.friends.forEach((c) => {
      const bubble = game.addBubble(c.root, '🍡', c.height + 0.7);
      const item = game.addItem({
        track: c.root, hitRadius: 1.2, reach: 2.4, hitY: 0.9,
        run: () => {
          if (!this.lit) {
            sfx.nope();
            say(t('d15.needWood'));
            return;
          }
          item.enabled = false;
          bubble.remove();
          // a marshmallow on a stick appears at the friend's paws
          const stick = new THREE.Group();
          add(stick, CYL, 0xc99a6b, [0, 0.5, 0], [0.02, 1.0, 0.02]);
          add(stick, SPHERE, 0xffffff, [0, 1.0, 0], 0.13);
          stick.position.set(c.root.position.x, 0.5, c.root.position.z + 0.5);
          game.area.group.add(stick);
          game.tween(1.2, (k) => (stick.position.y = 0.5 + Math.sin(k * Math.PI) * 0.4), () => stick.removeFromParent());
          c.play('eat', { once: true });
          sfx.pop();
          game.after(1.2, () => {
            sfx.chime();
            c.play('gesture-positive', { once: true });
            game.hearts.emit(c.root.position.x, 1.8, c.root.position.z, 8, { speed: 0.7, up: 1.4, life: 1.6, colors: [0xff5fae, 0xff8fc7, 0xffffff] });
            say(t('d15.yum'));
          });
          game.addProgress('marsh');
        },
      });
    });
  },

  onStep(game, id) {
    if (id === 'fire') game.setArrow(game.area.pitPos, 3);
  },

  onDone(game) {
    game.state = 'party';
    game.target = null;
    sfx.fanfare();
    say(t('d15.done'));
    game.player.userData.cheering = true;
    game.area.friends.forEach((c) => c.play('dance'));
    for (let i = 0; i < 8; i++)
      game.after(0.4 + i * 0.6, () => {
        game.sparkles.emit((Math.random() - 0.5) * 16, 7 + Math.random() * 4, -8 + (Math.random() - 0.5) * 6, 36, {
          speed: 3, up: 2, life: 1.4, colors: [[0xffe066, 0xffffff], [0xff8a3d, 0xffd23f], [0x6ad7ff, 0xffffff]][i % 3], gravity: 3, spread: 0.3,
        });
        sfx.sparkle();
      });
    game.after(7, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d15.end'));
    });
  },
};

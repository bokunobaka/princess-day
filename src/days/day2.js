// Day 2 · Dress-up Day: choose an outfit, wake the sleepy friends, parade into the garden.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';

export default {
  id: 2,
  name: t('d2.name'),
  sticker: '👗',
  area: 'bedroom',
  intro: t('d2.intro'),
  steps: [
    { id: 'dress', icon: '👗', count: 1, hint: t('d2.h.dress') },
    { id: 'wake', icon: '💤', count: 3, hint: t('d2.h.wake') },
    { id: 'door', icon: '🚪', count: 1, hint: t('d2.h.door') },
  ],

  start(game) {
    const a = game.area;
    this.woken = 0;

    // wardrobe
    this.wardrobe = game.addItem({
      pos: a.wardrobePos, hitRadius: 1.8, hitY: 2, reach: 2.2,
      run: () =>
        game.openWardrobe(() => {
          this.wardrobe.enabled = false;
          game.setArrow(null);
          sfx.chime();
          say(t('d2.looks'));
          game.addProgress('dress');
        }),
    });
    game.setArrow(a.wardrobePos, 5.2);

    // sleepy friends
    a.sleepers.forEach((c) => {
      const bubble = game.addBubble(c.root, '💤', 1.9);
      const item = game.addItem({
        track: c.root, hitRadius: 1.0, reach: 2.6, hitY: 0.8,
        run: () => {
          item.enabled = false;
          bubble.remove();
          sfx.boing();
          game.tween(0.6, (k) => {
            c.model.rotation.z = (Math.PI / 2) * (1 - k);
            c.model.position.y = 0.5 * (1 - k);
          });
          c.root.position.y = 0;
          c.play('gesture-positive');
          game.after(1.2, () => c.play('dance'));
          game.hearts.emit(c.root.position.x, 1.2, c.root.position.z, 8, { speed: 0.6, up: 1.4, life: 1.6, colors: [0xff5fae, 0xff8fc7] });
          say(t('d2.greet.' + c.name));
          game.after(1.8, () => {
            c.play('idle');
            game.addFollower(c);
          });
          game.addProgress('wake');
        },
      });
    });

    // the door
    this.door = game.addItem({
      pos: a.doorPos, hitRadius: 1.8, hitY: 2, reach: 1.8,
      run: () => {
        if (!game.step || game.step.id !== 'door') {
          say(t('d2.notYet'));
          sfx.nope();
          return;
        }
        this.parade(game);
      },
    });
  },

  onStep(game, id) {
    if (id === 'door') game.setArrow(game.area.doorPos, 4.6);
  },

  parade(game) {
    game.state = 'party';
    game.target = null;
    game.setArrow(null);
    game.advanceStepSilent();
    sfx.chime();
    game.fadeTo(() => {
      const friends = game.followers.slice();
      game.loadArea('garden', { keep: friends, followers: true });
      friends.forEach((c, i) => c.root.position.set(-1.5 + i * 1.5, 0, 9));
      game.player.userData.cheering = true;
      say(t('d2.parade'));
      sfx.fanfare();
      game.after(0.8, () => {
        game.confettiAt({ x: 0, z: 5 }, 4);
        friends.forEach((c) => c.play('dance'));
      });
      game.after(6.5, () => {
        game.player.userData.cheering = false;
        game.finishDay(t('d2.end'));
      });
    });
  },
};

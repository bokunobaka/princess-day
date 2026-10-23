// Day 13 · Ballet Day: find the ballet things, dance on the glowing marks, perform on stage.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';

const KINDS = ['shoe', 'tutu', 'ribbon'];

export default {
  id: 13,
  name: t('d13.name'),
  sticker: '🩰',
  area: 'studio',
  intro: t('d13.intro'),
  steps: [
    { id: 'items', icon: '🩰', count: 3, hint: t('d13.h.items') },
    { id: 'poses', icon: '✨', count: 3, hint: t('d13.h.poses') },
    { id: 'show', icon: '🎭', count: 1, hint: t('d13.h.show') },
  ],

  start(game) {
    const a = game.area;
    this.posed = 0;

    a.finds.forEach((f, i) => {
      f.item = game.addItem({
        pos: f.pos, hitRadius: 1.0, reach: 1.5, hitY: 0.6,
        run: () => {
          if (f.taken) return;
          f.taken = true;
          f.item.enabled = false;
          f.glow.visible = false;
          sfx.chime();
          game.addToBag(KINDS[i]);
          game.burst({ x: f.pos.x, y: 0.8, z: f.pos.z }, 14, 1.1, 0.3, [0xffc2e0, 0xffffff]);
          game.pickUp(f.group, 1.2);
          say(t('d13.found'));
          game.addProgress('items');
        },
      });
    });
    game.hintSpots = () =>
      game.step && game.step.id === 'items' ? a.finds.filter((f) => !f.taken).map((f) => ({ x: f.pos.x, y: 1, z: f.pos.z })) : [];

    this.stageItem = game.addItem({
      pos: a.stagePos, hitRadius: 2.2, reach: 2.4, hitY: 1.2,
      run: () => this.show(game),
    });
    this.stageItem.enabled = false;
  },

  onStep(game, id) {
    const a = game.area;
    if (id === 'poses') {
      a.marks.forEach((m, i) => {
        m.visible = true;
        const it = game.addItem({
          pos: { x: m.position.x, z: m.position.z }, hitRadius: 1.0, reach: 0.5, hitY: 0.3,
          run: () => {
            if (it.done) return;
            it.done = true;
            it.enabled = false;
            m.material.opacity = 1;
            sfx.note(this.posed + 1);
            game.player.userData.spin(1.2);
            game.burst({ x: m.position.x, y: 1, z: m.position.z }, 24, 1.8, 0.4, [0xff8fc7, 0xffffff, 0xffe066]);
            a.friends.forEach((c, k) => game.after(k * 0.2, () => c.play('dance')));
            game.after(1.6, () => a.friends.forEach((c) => c.play('idle')));
            say(t('poses')[this.posed % 3]);
            this.posed++;
            game.addProgress('poses');
          },
        });
      });
      game.hintSpots = () =>
        game.step && game.step.id === 'poses' ? a.marks.filter((m) => m.material.opacity < 1).map((m) => ({ x: m.position.x, y: 0.5, z: m.position.z })) : [];
    }
    if (id === 'show') {
      a.stageGlow.visible = true;
      this.stageItem.enabled = true;
      game.setArrow(a.stagePos, 3.2);
    }
  },

  show(game) {
    const a = game.area;
    game.state = 'party';
    game.target = null;
    game.setArrow(null);
    game.hop(game.player.position, new THREE.Vector3(6.2, 0.6, -3.6), 0.8, 1.2, () => {
      game.player.userData.spin(1.6);
      game.player.userData.cheering = false;
    });
    sfx.chime();
    game.tween(2.2, (k) => {
      a.curtainL.position.x = -1.75 - k * 3;
      a.curtainR.position.x = 1.75 + k * 3;
    });
    game.after(1.6, () => {
      sfx.applause();
      say(t('d13.applause'));
      game.confettiAt({ x: 6.2, z: -3.6 }, 4);
      a.friends.forEach((c) => c.play('dance'));
    });
    game.after(5, () => {
      game.player.position.set(6.2, 0, -1.4);
      game.state = 'play';
      game.addProgress('show');
    });
  },

  onDone(game) {
    game.state = 'party';
    game.target = null;
    sfx.fanfare();
    say(t('d13.done'));
    game.player.userData.cheering = true;
    game.area.friends.forEach((c) => c.play('dance'));
    game.after(6, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d13.end'));
    });
  },
};

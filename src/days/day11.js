// Day 11 · Mermaid Day: pearls in clams, baby fish to befriend, a treasure chest.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';

export default {
  id: 11,
  name: t('d11.name'),
  sticker: '🧜‍♀️',
  area: 'sea',
  intro: t('d11.intro'),
  steps: [
    { id: 'pearls', icon: '🦪', count: 3, hint: t('d11.h.pearls') },
    { id: 'fish', icon: '🐟', count: 3, hint: t('d11.h.fish') },
    { id: 'chest', icon: '💎', count: 1, hint: t('d11.h.chest') },
  ],

  start(game) {
    const a = game.area;
    this.friends = [];

    a.clams.forEach((c) => {
      c.item = game.addItem({
        pos: c.pos, hitRadius: 1.1, reach: 1.6, hitY: 0.6,
        run: () => {
          if (c.opened) return;
          c.opened = true;
          c.item.enabled = false;
          c.glow.visible = false;
          sfx.chime();
          game.tween(0.5, (k) => (c.lid.rotation.x = -k * 1.1));
          c.pearl.visible = true;
          game.burst({ x: c.pos.x, y: 0.8, z: c.pos.z }, 18, 1.2, 0.3, [0xffffff, 0xffd1e6, 0xbfefff]);
          game.after(0.7, () => {
            game.pickUp(c.pearl, 1.2);
            game.addToBag('pearl');
            say(t('d11.foundPearl'));
            game.addProgress('pearls');
          });
        },
      });
    });
    game.hintSpots = () =>
      game.step && game.step.id === 'pearls' ? a.clams.filter((c) => !c.opened).map((c) => ({ x: c.pos.x, y: 1.1, z: c.pos.z })) : [];

    a.babyFish.forEach((f) => {
      const bubble = game.addBubble(f.c.root, '🐟', 1.4);
      const item = game.addItem({
        track: f.c.root, hitRadius: 1.2, reach: 2.6, hitY: 2.0,
        run: () => {
          if (f.friend) return;
          f.friend = true;
          item.enabled = false;
          bubble.remove();
          sfx.animal('fish');
          game.hearts.emit(f.c.root.position.x, f.c.root.position.y + 0.8, f.c.root.position.z, 8, { speed: 0.6, up: 1.2, life: 1.5, colors: [0xff5fae, 0x9be7ff, 0xffffff] });
          f.c.root.position.y = 1.2;
          game.addFollower(f.c);
          this.friends.push(f.c);
          say(t('d11.fish'));
          game.addProgress('fish');
        },
      });
    });

    this.chestItem = game.addItem({
      pos: a.chestPos, hitRadius: 1.8, reach: 2.8, hitY: 1.0,
      run: () => {
        if (!game.step || game.step.id !== 'chest') {
          sfx.nope();
          say(t('d11.chestEarly'));
          return;
        }
        this.chestItem.enabled = false;
        game.setArrow(null);
        a.beam.visible = false;
        sfx.fanfare();
        game.burst({ x: a.chestPos.x, y: 1.4, z: a.chestPos.z }, 70, 3, 0.8, [0xffe066, 0xffffff, 0xff9ac7, 0x9be7ff]);
        game.addProgress('chest');
      },
    });
  },

  onStep(game, id) {
    const a = game.area;
    if (id === 'chest') {
      a.beam.visible = true;
      game.setArrow(a.chestPos, 3.4);
    }
  },

  onDone(game) {
    game.state = 'party';
    game.target = null;
    sfx.fanfare();
    say(t('d11.done'));
    game.player.userData.cheering = true;
    game.confettiAt(game.area.chestPos, 4);
    this.friends.forEach((c) => c.play('dance'));
    game.after(7, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d11.end'));
    });
  },
};

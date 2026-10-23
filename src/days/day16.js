// Day 16 · Ice Skating Day: glide (it is slippery!), gather snowflakes, spin on the star, skate with friends.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';

export default {
  id: 16,
  name: t('d16.name'),
  sticker: '⛸️',
  area: 'rink',
  final: true,
  intro: t('d16.intro'),
  steps: [
    { id: 'flakes', icon: '❄️', count: 5, hint: t('d16.h.flakes') },
    { id: 'spin', icon: '⛸️', count: 1, hint: t('d16.h.spin') },
    { id: 'friends', icon: '🐧', count: 3, hint: t('d16.h.friends') },
  ],

  start(game) {
    const a = game.area;
    this.joined = [];

    a.flakes.forEach((f) => {
      f.item = game.addItem({
        pos: f.pos, hitRadius: 1.1, reach: 1.3, hitY: 0.9,
        run: () => {
          if (f.taken) return;
          f.taken = true;
          f.item.enabled = false;
          sfx.chime();
          game.addToBag('snowflake');
          game.burst({ x: f.pos.x, y: 1, z: f.pos.z }, 16, 1.2, 0.2, [0xffffff, 0xbfe3ff]);
          game.pickUp(f.group, 1.2);
          say(t('nums')[Math.min(game.progress, 5)]);
          game.addProgress('flakes');
        },
      });
    });
    game.hintSpots = () =>
      game.step && game.step.id === 'flakes' ? a.flakes.filter((f) => !f.taken).map((f) => ({ x: f.pos.x, y: 1.2, z: f.pos.z })) : [];

    this.spinItem = game.addItem({
      pos: a.starPos, hitRadius: 2.0, reach: 1.0, hitY: 0.3,
      run: () => {
        if (this.spun) return;
        this.spun = true;
        this.spinItem.enabled = false;
        game.setArrow(null);
        game.player.userData.spin(2.2);
        sfx.note(0);
        for (let i = 1; i < 6; i++) game.after(i * 0.3, () => sfx.note(i));
        game.tween(2.2, (k) => {
          const ang = k * Math.PI * 8;
          game.sparkles.emit(game.player.position.x + Math.cos(ang) * 1.1, 0.4, game.player.position.z + Math.sin(ang) * 1.1, 2, { speed: 0.3, up: 0.8, life: 0.8, colors: [0xffffff, 0xbfe3ff, 0xfff1a8] });
        });
        say(t('d16.spin'));
        game.after(2.4, () => game.addProgress('spin'));
      },
    });
    this.spinItem.enabled = false;

    a.friends.forEach((c) => {
      const bubble = game.addBubble(c.root, '⛸️', c.height + 0.6);
      const item = game.addItem({
        track: c.root, hitRadius: 1.2, reach: 2.6, hitY: 0.9,
        run: () => {
          item.enabled = false;
          bubble.remove();
          sfx.animal(c.name === 'penguin' ? 'penguin' : c.name);
          c.gesture('gesture-positive');
          game.hearts.emit(c.root.position.x, 1.6, c.root.position.z, 8, { speed: 0.6, up: 1.3, life: 1.5, colors: [0xff5fae, 0x9be7ff, 0xffffff] });
          game.after(1.0, () => game.addFollower(c));
          this.joined.push(c);
          say(t('d16.friend'));
          game.addProgress('friends');
        },
      });
    });
  },

  onStep(game, id) {
    const a = game.area;
    if (id === 'spin') {
      a.star.visible = true;
      this.spinItem.enabled = true;
      game.setArrow(a.starPos, 2.8);
    }
  },

  onDone(game) {
    const a = game.area;
    game.state = 'party';
    game.target = null;
    game.clearFollowers();
    sfx.fanfare();
    say(t('d16.done'));
    game.player.userData.cheering = true;
    // everyone skates a ring around the star
    this.joined.forEach((c, i) => {
      const ang = (i / this.joined.length) * Math.PI * 2;
      c.goTo(a.starPos.x + Math.cos(ang) * 3, a.starPos.z + Math.sin(ang) * 3, { speed: 4, onArrive: () => c.play('dance') });
    });
    game.confettiAt(a.starPos, 4.5);
    for (let i = 0; i < 8; i++)
      game.after(0.5 + i * 0.6, () => {
        game.sparkles.emit((Math.random() - 0.5) * 14, 6 + Math.random() * 4, -6 + (Math.random() - 0.5) * 6, 36, {
          speed: 3, up: 2, life: 1.4, colors: [[0xbfe3ff, 0xffffff], [0xfff1a8, 0xffffff], [0xff9ac7, 0xffffff]][i % 3], gravity: 3, spread: 0.3,
        });
        sfx.sparkle();
      });
    game.after(8, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d16.end'));
    });
  },
};

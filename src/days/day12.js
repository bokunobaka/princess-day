// Day 12 · Farm Day: collect eggs, milk the cows, lead chicks to the coop.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';

export default {
  id: 12,
  name: t('d12.name'),
  sticker: '🐄',
  area: 'farm',
  intro: t('d12.intro'),
  steps: [
    { id: 'eggs', icon: '🥚', count: 4, hint: t('d12.h.eggs') },
    { id: 'milk', icon: '🥛', count: 3, hint: t('d12.h.milk') },
    { id: 'chicks', icon: '🐥', count: 3, hint: t('d12.h.chicks') },
    { id: 'coop', icon: '🏠', count: 1, hint: t('d12.h.coop') },
  ],

  start(game) {
    const a = game.area;
    this.invited = [];
    this.milked = 0;

    a.nests.forEach((n) => {
      n.item = game.addItem({
        pos: n.pos, hitRadius: 1.0, reach: 1.4, hitY: 0.4,
        run: () => {
          if (n.taken) return;
          n.taken = true;
          n.item.enabled = false;
          n.glow.visible = false;
          sfx.pop();
          game.addToBag('egg');
          game.burst({ x: n.pos.x, y: 0.6, z: n.pos.z }, 12, 1, 0.3, [0xffffff, 0xffe9a8]);
          game.pickUp(n.egg, 1.2);
          say(t('nums')[Math.min(game.progress, 5)]);
          game.addProgress('eggs');
        },
      });
    });
    game.hintSpots = () => {
      if (!game.step) return [];
      if (game.step.id === 'eggs') return a.nests.filter((n) => !n.taken).map((n) => ({ x: n.pos.x, y: 0.9, z: n.pos.z }));
      if (game.step.id === 'chicks') return a.chicks.filter((c) => !c.invited).map((c) => ({ x: c.c.root.position.x, y: 0.9, z: c.c.root.position.z }));
      return [];
    };

    a.cows.forEach((cow) => {
      game.addItem({
        track: cow.root, hitRadius: 1.2, reach: 2.6, hitY: 1.0,
        run: () => {
          sfx.animal('cow');
          cow.gesture('gesture-positive');
          if (this.milked >= 3) return;
          this.milked++;
          a.milk.scale.y = 0.05 + this.milked * 0.12;
          a.milk.position.y = 0.2 + this.milked * 0.06;
          game.sparkles.emit(a.bucket.position.x, 0.9, a.bucket.position.z, 14, { speed: 0.5, up: 1.2, life: 0.8, colors: [0xffffff, 0xe6f4ff], gravity: 3 });
          say(t('d12.milk'));
          game.addProgress('milk');
        },
      });
    });

    a.chicks.forEach((w) => {
      w.item = game.addItem({
        track: w.c.root, hitRadius: 0.9, reach: 1.8, hitY: 0.5,
        run: () => {
          if (w.invited) return;
          w.invited = true;
          w.item.enabled = false;
          w.c.dest = null;
          sfx.animal('chick');
          game.hearts.emit(w.c.root.position.x, 1.2, w.c.root.position.z, 6, { speed: 0.5, up: 1.2, life: 1.4, colors: [0xff5fae, 0xffe066] });
          game.addFollower(w.c);
          this.invited.push(w.c);
          say(t('d12.chick'));
          game.addProgress('chicks');
        },
      });
    });

    this.coopItem = game.addItem({
      pos: a.coopPos, hitRadius: 1.6, reach: 2.8, hitY: 1.0,
      run: () => {
        if (!game.step || game.step.id !== 'coop') {
          sfx.nope();
          say(t('d12.notYet'));
          return;
        }
        this.coopItem.enabled = false;
        game.setArrow(null);
        game.clearFollowers();
        let home = 0;
        this.invited.forEach((c, i) =>
          c.goTo(7.5 + (i - 1) * 0.5, -6.4, {
            speed: 3.5,
            onArrive: () => {
              c.root.visible = false;
              sfx.animal('chick');
              if (++home === this.invited.length) {
                game.hearts.emit(7.5, 2, -6.5, 12, { speed: 0.8, up: 1.4, life: 1.6, colors: [0xff5fae, 0xffe066, 0xffffff] });
                say(t('d12.coop'));
                game.addProgress('coop');
              }
            },
          })
        );
      },
    });
  },

  onStep(game, id) {
    if (id === 'coop') game.setArrow(game.area.coopPos, 3.2);
  },

  onDone(game) {
    game.state = 'party';
    game.target = null;
    sfx.fanfare();
    say(t('d12.done'));
    game.player.userData.cheering = true;
    game.area.cows.forEach((c) => c.play('dance'));
    game.confettiAt({ x: 0, z: -2 }, 4);
    game.after(7, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d12.end'));
    });
  },
};

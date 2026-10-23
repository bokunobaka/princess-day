// Day 1 · Garden Day: pick pink flowers, find the teapot, have tea with Teddy.
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';

const NUMBER_WORDS = t('nums');

export default {
  id: 1,
  name: t('d1.name'),
  sticker: '🧸',
  area: 'garden',
  intro: t('d1.intro'),
  steps: [
    { id: 'flowers', icon: '🌸', count: 3, hint: t('d1.h.flowers') },
    { id: 'teapot', icon: '🫖', count: 1, hint: t('d1.h.teapot') },
    { id: 'party', icon: '🧸', count: 1, hint: t('d1.h.party') },
  ],

  start(game) {
    const a = game.area;
    const bag = game.bag;

    for (const f of a.flowers) {
      f.item = game.addItem({
        pos: f.group.position, hitRadius: 0.8, reach: 0.9,
        run: () => {
          if (f.picked) return;
          if (!f.pink) {
            sfx.nope();
            say(t('d1.other', { color: t('color.' + f.name) }));
            game.wobble(f.group);
            return;
          }
          f.picked = true;
          f.item.enabled = false;
          game.addToBag('flower');
          sfx.pop();
          game.burst(f.group.position, 14, 0.9, 0.6, [0xffc2e0, 0xffffff]);
          const g = f.group;
          game.tween(0.4, (k) => {
            g.position.y = k * 0.8;
            g.scale.setScalar(1.35 * (1 - k * k));
            g.rotation.y += 0.3;
          }, () => (g.visible = false));
          if (game.step && game.step.id === 'flowers') say(NUMBER_WORDS[game.progress]);
          game.addProgress('flowers');
        },
      });
    }
    game.hintSpots = () =>
      game.step && game.step.id === 'flowers'
        ? a.flowers.filter((f) => f.pink && !f.picked).map((f) => ({ x: f.group.position.x, y: 0.9, z: f.group.position.z }))
        : [];

    this.teapotItem = game.addItem({
      pos: a.teapot.position, hitRadius: 1.1, reach: 1.5,
      run: () => {
        if (bag.teapot) return;
        this.teapotItem.enabled = false;
        a.teapot.visible = false;
        game.setArrow(null);
        sfx.chime();
        game.burst(a.teapot.position, 40, 2, 1.4);
        game.addToBag('teapot');
        say(t('d1.foundTeapot'));
        game.addProgress('teapot');
      },
    });
    this.teapotItem.enabled = false;

    game.addItem({
      pos: a.table, hitRadius: 2.4, reach: 3.4, hitY: 1.3,
      run: () => {
        a.waveTeddy(2);
        sfx.boing();
        game.hearts.emit(a.teddy.position.x, 2, a.teddy.position.z, 6, { speed: 0.6, up: 1.2, life: 1.6, colors: [0xff5fae, 0xff8fc7] });
        if (game.state !== 'play') return;
        const id = game.step && game.step.id;
        if (id === 'party') this.party(game);
        else if (id === 'flowers') say(t('d1.teddy.flowers'));
        else if (id === 'teapot') say(t('d1.teddy.teapot'));
      },
    });

    game.addItem({
      track: a.bunny.root, hitRadius: 0.9, reach: 1.4,
      run: () => {
        sfx.boing();
        a.bunnyJoy(1.4);
        const p = a.bunny.root.position;
        game.hearts.emit(p.x, 1.1, p.z, 8, { speed: 0.5, up: 1.4, life: 1.5, colors: [0xff5fae, 0xff8fc7, 0xffffff] });
        if (!this.greeted) {
          this.greeted = true;
          say(t('d1.bunny'));
        }
      },
    });
  },

  onStep(game, id) {
    const a = game.area;
    if (id === 'teapot') {
      game.after(1.0, () => {
        a.teapot.visible = true;
        this.teapotItem.enabled = true;
        game.burst(a.teapot.position, 30, 1.8, 1.2);
        sfx.sparkle();
        game.setArrow(a.teapot.position, 4);
      });
    }
    if (id === 'party') game.setArrow(a.table, 3.4);
  },

  party(game) {
    const a = game.area;
    game.state = 'party';
    game.target = null;
    game.setArrow(null);
    const seat = a.seats.princess;
    game.walkTo(seat.x - 0.2, seat.z, 0.08, null, () => game.faceToward(a.table));
    a.bunnyGoTo(a.seats.bunny.x + 0.2, a.seats.bunny.z);
    game.advanceStepSilent();

    game.after(1.6, () => {
      a.serve(game.bag.flower);
      sfx.fanfare();
      say(t('d1.party'));
      a.cheerTeddy(5);
      game.player.userData.cheering = true;
      game.confettiAt(a.table, 3.2);
      game.burst({ x: a.table.x, y: 1.2, z: a.table.z }, 50, 2.5, 1.5);
    });
    game.after(3.0, () => a.bunnyJoy(2.5));
    game.after(6.5, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d1.end'));
    });
  },
};

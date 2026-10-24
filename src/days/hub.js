// Home: the palace garden. Not a "day" with quests: a place with things to do.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { save } from '../save.js';

const FLOWER_TYPES = ['pink', 'yellow', 'white', 'purple'];

export default {
  id: 0,
  hub: true,
  name: '',
  sticker: '',
  area: 'palace',
  intro: '',
  steps: [],

  start(game) {
    const a = game.area;
    const S = a.stations;
    game.saved.plots.forEach((p, i) => a.setPlot(i, p));

    // `hitAt` puts the invisible tap area on the thing itself (not where she walks to), so it can't block taps on things behind it
    const station = (st, icon, yOff, hitR, reach, run, track = st.group, hitAt = null) => {
      game.addBubble(track, icon, yOff);
      const item = game.addItem({ pos: st.pos, hitRadius: hitR, reach, hitY: 1.2, run });
      if (hitAt) item.hit.position.copy(hitAt);
    };

    station(S.stable, '🦄', 3.2, 1.3, 2.6, () => {
      sfx.animal('horse');
      say(t('hub.stable'));
      game.after(1.6, () => game.startDay(101));
    }, S.stable.unicorn.root, new THREE.Vector3(-10.2, 1.0, -3));

    station(S.dance, '💃', 5.2, 2.0, 3.4, () => {
      sfx.chime();
      say(t('hub.dance'));
      game.after(1.6, () => game.startDay(102));
    }, S.dance.group, new THREE.Vector3(11.5, 0.9, -3));

    // the photo booth is the camera on its tripod: tap it, or just walk up to it
    this.booth = S.booth;
    this.boothArmed = true;
    station({ pos: S.booth.spot, group: S.booth.group }, '📸', 3.2, 1.4, 1.7, () => game.startPhoto(S.booth));

    station(S.book, '📖', 2.8, 1.2, 2.0, () => {
      sfx.chime();
      game.openBook();
    });

    station(S.map, '🗺️', 4.0, 1.3, 2.2, () => {
      sfx.chime();
      say(t('hub.map'));
      game.openDayMap();
    });

    station(S.kennel, '🐾', 3.0, 1.6, 2.4, () => {
      say(t('hub.pets'));
      game.changePet();
    });

    station(S.mirror, '👗', 3.6, 1.4, 2.2, () => {
      say(t('hub.mirror'));
      game.openWardrobe(() => {
        sfx.chime();
        say(t('d2.looks'));
      });
    });

    // flower beds: plant, water, pick
    S.plots.forEach((plot, i) => {
      if (i === 1) game.addBubble(plot.bed, '🌱', 2.0);
      game.addItem({
        pos: plot.pos, hitRadius: 1.2, reach: 1.9, hitY: 0.5,
        run: () => {
          const st = game.saved.plots[i];
          if (!st) {
            game.saved.plots[i] = { type: FLOWER_TYPES[(Math.random() * 4) | 0], stage: 0, watered: false };
            a.setPlot(i, game.saved.plots[i]);
            sfx.pop();
            game.burst({ x: plot.x, y: 0.5, z: plot.z }, 12, 1, 0.2, [0x9b6b43, 0x7be37a, 0xffffff]);
            say(t('hub.plant'));
          } else if (st.stage < 3) {
            st.watered = true;
            sfx.splash();
            game.sparkles.emit(plot.x, 1.8, plot.z, 40, { speed: 1.2, up: -1, life: 0.9, colors: [0x9be7ff, 0xffffff], gravity: 6, spread: 1.2 });
            game.wobble(plot.holder);
            say(t('hub.water'));
          } else {
            game.saved.bouquets++;
            game.saved.plots[i] = null;
            a.setPlot(i, null);
            sfx.chime();
            game.hearts.emit(plot.x, 1.4, plot.z, 10, { speed: 0.8, up: 1.5, life: 1.6, colors: [0xff5fae, 0xff8fc7, 0xffffff] });
            game.confettiAt({ x: plot.x, z: plot.z }, 2.6);
            say(t('hub.pick'));
          }
          save(game.saved);
        },
      });
    });
  },

  // walking up to the camera starts the photo booth; after leaving it, step away again before it can start once more
  update(game) {
    const b = this.booth;
    if (!b || game.state !== 'play') return;
    const p = game.player.position;
    const d = Math.hypot(p.x - b.spot.x, p.z - b.spot.z);
    if (d > 2.8) this.boothArmed = true;
    else if (this.boothArmed && d < 1.5) {
      this.boothArmed = false;
      game.startPhoto(b);
    }
  },
};

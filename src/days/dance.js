// Mini-game · Dance party: watch the glowing tiles, then step on them in the same order.
// A wrong step just replays the tune. Friends dance after every round.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { Critter } from '../assets.js';

const ROUNDS = [2, 3, 4, 5];

export default {
  id: 102,
  minigame: 'dance',
  name: t('mg.dance.name'),
  sticker: '💃',
  area: 'ballroom',
  intro: t('mg.dance.intro'),
  steps: [],

  start(game) {
    const a = game.area;
    this.round = 0;
    this.idx = 0;
    this.seq = [];
    this.listening = false;
    this.score = 0;
    game.score = 0;
    a.tiles.forEach((tile) => (tile.visible = true));
    this.friends = [['bunny', 1.1, -6, 3], ['elephant', 1.9, 6, 3], ['panda', 1.5, -7, -3], ['giraffe', 2.4, 7, -3]].map(([n, h, x, z]) => {
      const c = new Critter(n, h);
      c.root.position.set(x, 0, z);
      c.heading = Math.atan2(-x, -z);
      c.root.rotation.y = c.heading;
      a.group.add(c.root);
      game.addCritter(c);
      return c;
    });
    a.tiles.forEach((tile, i) => {
      const item = game.addItem({
        pos: { x: tile.position.x, z: tile.position.z }, hitRadius: 1.0, reach: 99, hitY: 0.3,
        run: () => this.step(game, i),
      });
    });
    game.player.position.set(0, 0, 0.5);
    game.heading = Math.PI;
    // fixed camera high above the whole floor, so every tile stays on screen however she hops
    game.camOverride = { pos: new THREE.Vector3(0, 13, 11.5), look: new THREE.Vector3(0, 0, 0.6) };
    game.after(3.5, () => this.play(game));
  },

  flash(game, i, ms = 0.45) {
    const tile = game.area.tiles[i];
    tile.material.opacity = 1;
    sfx.note(i);
    game.burst({ x: tile.position.x, y: 0.3, z: tile.position.z }, 10, 1.2, 0.3, [tile.material.color.getHex(), 0xffffff]);
    game.after(ms, () => (tile.material.opacity = 0.5));
  },

  // choose a new tune for this round and play it
  play(game, same = false) {
    this.listening = false;
    this.idx = 0;
    if (!same) {
      const len = ROUNDS[this.round];
      this.seq = [];
      for (let k = 0; k < len; k++) {
        let n;
        do n = (Math.random() * 6) | 0;
        while (n === this.seq[k - 1]);
        this.seq.push(n);
      }
    }
    say(t('mg.dance.watch'));
    this.seq.forEach((n, k) => game.after(1.6 + k * 0.75, () => this.flash(game, n)));
    game.after(1.6 + this.seq.length * 0.75 + 0.3, () => {
      this.listening = true;
      say(t('mg.dance.turn'));
    });
  },

  step(game, i) {
    if (!this.listening) return;
    const tile = game.area.tiles[i];
    game.hop(game.player.position, new THREE.Vector3(tile.position.x, 0, tile.position.z), 0.35, 0.7);
    this.flash(game, i, 0.3);
    if (i !== this.seq[this.idx]) {
      this.listening = false;
      sfx.nope();
      say(t('mg.dance.again'));
      game.wobble(tile);
      game.after(2.6, () => this.play(game, true));
      return;
    }
    this.idx++;
    if (this.idx < this.seq.length) return;
    // round complete
    this.listening = false;
    this.score += this.seq.length;
    game.score = this.score;
    game.ui.setScore(this.score);
    sfx.chime();
    say(t('mg.dance.good'));
    this.friends.forEach((c, k) => game.after(k * 0.2, () => c.play('dance')));
    game.after(2.2, () => this.friends.forEach((c) => c.play('idle')));
    this.round++;
    if (this.round >= ROUNDS.length) return game.after(2.4, () => this.finish(game));
    game.after(3.4, () => this.play(game));
  },

  finish(game) {
    sfx.fanfare();
    say(t('mg.dance.done'));
    game.player.userData.cheering = true;
    this.friends.forEach((c) => c.play('dance'));
    game.confettiAt({ x: 0, z: 0.5 }, 4.5);
    game.after(5.5, () => {
      game.player.userData.cheering = false;
      game.finishDay();
    });
  },
};

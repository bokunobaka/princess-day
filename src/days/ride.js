// Mini-game · Unicorn ride: glide along the rainbow road and gather stars. Tap left/right to steer.
// Nothing can go wrong: the ride always ends at the castle.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { pathX } from '../areas/sky.js';

const SPEED = 6.5;

export default {
  id: 101,
  minigame: 'ride',
  name: t('mg.ride.name'),
  sticker: '🦄',
  area: 'sky',
  intro: t('mg.ride.intro'),
  steps: [],

  start(game) {
    const a = game.area;
    this.z = 8;
    this.offset = 0;
    this.target = 0;
    this.score = 0;
    this.finished = false;
    game.state = 'minigame';
    game.score = 0;
    if (game.pet) game.pet.root.visible = false;
    game.player.userData.cheering = false;
    this.pose(game, 0);
  },

  pose(game, t0) {
    const a = game.area;
    const x = pathX(this.z) + this.offset;
    const ahead = pathX(this.z - 2) + this.offset;
    const heading = Math.atan2(ahead - x, -2);
    a.unicorn.root.position.set(x, 0, this.z);
    a.unicorn.root.rotation.y = heading;
    a.unicorn.root.userData.animate(t0, 1);
    game.player.position.set(x, 1.45 + Math.abs(Math.sin(t0 * 11)) * 0.1, this.z);
    game.heading = heading;
    game.player.rotation.y = heading;
  },

  // tap anywhere: the unicorn leans toward that side of the screen
  onTap(game, ndc) {
    this.target = THREE.MathUtils.clamp(ndc.x * 3.6, -3, 3);
  },

  update(game, dt, time) {
    if (this.finished) return;
    const a = game.area;
    this.z -= SPEED * dt;
    this.offset += (this.target - this.offset) * Math.min(1, dt * 2.6);
    this.pose(game, time);
    const px = game.player.position.x;
    for (const s of a.stars) {
      if (s.taken) continue;
      s.group.rotation.y = time * 2;
      if (Math.abs(s.group.position.z - this.z) < 1.4 && Math.abs(s.group.position.x - px) < 1.7) {
        s.taken = true;
        s.group.visible = false;
        this.score += s.heart ? 2 : 1;
        game.score = this.score;
        sfx.note(this.score);
        game.burst(s.group.position, 14, 1.4, 0, s.heart ? [0xff9ac7, 0xffffff] : [0xffe066, 0xffffff]);
        game.ui.setScore(this.score);
      }
    }
    if (this.z <= a.finishZ) this.finish(game);
  },

  finish(game) {
    this.finished = true;
    game.area.unicorn.root.userData.animate(0, 0);
    sfx.fanfare();
    say(t('mg.ride.done'));
    game.player.userData.cheering = true;
    game.confettiAt(game.player.position, 4);
    game.after(5, () => {
      game.player.userData.cheering = false;
      game.player.position.y = 0;
      game.finishDay();
    });
  },
};

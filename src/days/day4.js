// Day 4 · Tea Party Day: invite friends, seat them, serve each the treat they like.
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { t } from '../i18n.js';
import { Critter, food } from '../assets.js';

const TREATS = [
  { id: 'cupcake', icon: '🧁', word: t('treat.cupcake'), model: 'cupcake', scale: 1.1 },
  { id: 'cookie', icon: '🍪', word: t('treat.cookie'), model: 'cookie', scale: 3.0 },
  { id: 'carrot', icon: '🥕', word: t('treat.carrot'), model: 'carrot', scale: 0.8 },
];

export default {
  id: 4,
  name: t('d4.name'),
  sticker: '🫖',
  area: 'garden',
  intro: t('d4.intro'),
  steps: [
    { id: 'invite', icon: '💌', count: 3, hint: t('d4.h.invite') },
    { id: 'seat', icon: '🪑', count: 1, hint: t('d4.h.seat') },
    { id: 'serve', icon: '🍰', count: 3, hint: t('d4.h.serve') },
  ],

  start(game) {
    const a = game.area;
    this.selected = null;
    this.guests = [];

    // three friends: the garden bunny plus two new arrivals
    const elephant = new Critter('elephant', 1.7);
    elephant.root.position.set(-9.5, 0, 3.5);
    elephant.heading = 1;
    const panda = new Critter('panda', 1.5);
    panda.root.position.set(9.5, 0, 0.5);
    panda.heading = -1;
    [elephant, panda].forEach((c) => {
      a.group.add(c.root);
      game.addCritter(c);
    });

    const slots = [a.seats.bunny, a.seats.princess, a.seats.ne];
    const roster = [
      { c: a.bunny, name: t('animal.bunny'), likes: 'carrot', slot: slots[0], isBunny: true },
      { c: elephant, name: t('animal.elephant'), likes: 'cookie', slot: slots[1] },
      { c: panda, name: t('animal.panda'), likes: 'cupcake', slot: slots[2] },
    ];
    this.guests = roster;

    roster.forEach((g) => {
      const c = g.c;
      g.bubble = game.addBubble(c.root, '💌', c.height + 0.6);
      g.item = game.addItem({
        track: c.root, hitRadius: 1.1, reach: 1.8, hitY: 0.9,
        run: () => {
          if (g.invited) return;
          g.invited = true;
          g.item.enabled = false;
          g.bubble.remove();
          g.bubble = null;
          if (g.isBunny) a.freezeBunny();
          sfx.chime();
          c.gesture('gesture-positive');
          game.hearts.emit(c.root.position.x, 1.6, c.root.position.z, 8, { speed: 0.6, up: 1.4, life: 1.6, colors: [0xff5fae, 0xff8fc7] });
          say(t('d4.yes', { name: g.name }));
          game.after(1.4, () => game.addFollower(c));
          game.addProgress('invite');
        },
      });
    });

    this.table = game.addItem({
      pos: a.table, hitRadius: 2.4, reach: 3.6, hitY: 1.3,
      run: () => {
        a.waveTeddy(2);
        sfx.boing();
        if (game.sillyTap('teddy')) {
          a.cheerTeddy(2.5);
          sfx.chime();
          game.confettiAt(a.teddy.position, 3);
        }
        const id = game.step && game.step.id;
        if (id === 'seat') this.seat(game);
        else if (id === 'invite') say(t('d4.teddy'));
      },
    });
  },

  onStep(game, id) {
    if (id === 'seat') game.setArrow(game.area.table, 3.4);
  },

  seat(game) {
    const a = game.area;
    game.setArrow(null);
    game.state = 'party';
    game.target = null;
    const seat = new THREE.Vector3(0, 0, -6.2);
    game.walkTo(seat.x, seat.z, 0.1, null, () => game.faceToward(a.table));
    game.clearFollowers(); // friends stop following and go to their places
    let seated = 0;
    const arrived = () => {
      if (++seated < this.guests.length) return;
      game.after(0.6, () => {
        this.guests.forEach((g) => (g.c.heading = Math.atan2(a.table.x - g.c.root.position.x, a.table.z - g.c.root.position.z)));
        a.serve(0, false);
        sfx.chime();
        game.state = 'play';
        game.advanceStepSilent();
        this.beginServing(game);
      });
    };
    this.guests.forEach((g, i) => {
      const x = g.slot.x + (g.slot.x > 0 ? 0.9 : -0.9);
      game.after(i * 0.4, () => {
        if (g.isBunny) a.bunnyGoTo(x, g.slot.z, arrived);
        else g.c.goTo(x, g.slot.z, { speed: 4.2, onArrive: arrived });
      });
    });
  },

  beginServing(game) {
    say(t('d4.look'));
    game.ui.showTray(TREATS, (id) => {
      this.selected = id;
      sfx.tap();
    });
    this.guests.forEach((g) => {
      const treat = TREATS.find((t) => t.id === g.likes);
      g.bubble = game.addBubble(g.c.root, treat.icon, 2.4);
      g.item.enabled = true;
      g.item.reach = 99;
      g.served = false;
      g.item.run = () => this.serve(game, g);
    });
  },

  serve(game, g) {
    if (g.served) return;
    const a = game.area;
    if (!this.selected) {
      sfx.nope();
      say(t('d4.pickFirst'));
      game.ui.pulseTray();
      return;
    }
    const c = g.c;
    if (this.selected !== g.likes) {
      sfx.nope();
      c.gesture('gesture-negative');
      const want = TREATS.find((t) => t.id === g.likes);
      say(t('d4.no', { name: g.name, want: want.word }));
      return;
    }
    g.served = true;
    g.item.enabled = false;
    g.bubble.remove();
    const treat = TREATS.find((t) => t.id === g.likes);
    const m = food(treat.model, { scale: treat.scale });
    m.position.set(c.root.position.x, 1.4, c.root.position.z);
    a.group.add(m);
    c.play('eat', { once: true });
    sfx.pop();
    game.tween(0.9, (k) => (m.position.y = 1.6 - k * 0.5), () => m.removeFromParent());
    game.after(1.2, () => {
      sfx.chime();
      game.hearts.emit(c.root.position.x, 1.8, c.root.position.z, 10, { speed: 0.8, up: 1.4, life: 1.8, colors: [0xff5fae, 0xff8fc7, 0xffffff] });
      say(t('d4.yum', { name: g.name }));
      c.play('gesture-positive', { once: true });
    });
    game.addProgress('serve');
  },

  onDone(game) {
    const a = game.area;
    game.ui.hideTray();
    game.state = 'party';
    game.after(1.8, () => {
      sfx.fanfare();
      say(t('d4.cheer'));
      a.cheerTeddy(6);
      game.player.userData.cheering = true;
      this.guests.forEach((g) => g.c.play('dance'));
      game.confettiAt(a.table, 3.4);
      game.burst({ x: a.table.x, y: 1.2, z: a.table.z }, 50, 2.5, 1.5);
    });
    game.after(7.5, () => {
      game.player.userData.cheering = false;
      game.finishDay(t('d4.end'));
    });
  },
};

import * as audio from './audio.js';
import { save, load } from './save.js';
import { DRESSES, CROWN_ICONS } from './models.js';
import { t, applyStatic } from './i18n.js';

const $ = (id) => document.getElementById(id);
const css = (n) => '#' + n.toString(16).padStart(6, '0');

const BAG_ICONS = {
  flower: '🌸', teapot: '🫖', egg: '🥚', flour: '🌾', strawberry: '🍓',
  pumpkin: '🎃', candy: '🍬', balloon: '🎈', present: '🎁', key: '🔑', ornament: '🔔', toy: '🦆',
};

export const ui = {
  onQuestTap: null,

  init() {
    applyStatic();
    $('bagBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      audio.sfx.tap();
      $('bagPanel').hidden = !$('bagPanel').hidden;
    });
    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('#bagPanel, #bagBtn')) $('bagPanel').hidden = true;
    });
    $('muteBtn').addEventListener('click', () => {
      const m = !audio.isMuted();
      audio.setMuted(m);
      $('muteBtn').textContent = m ? '🔇' : '🔊';
      const data = load();
      data.muted = m;
      save(data);
    });
    $('quest').addEventListener('click', () => this.onQuestTap && this.onQuestTap());
    if (load().muted) audio.setMuted(true);
    $('muteBtn').textContent = audio.isMuted() ? '🔇' : '🔊';
  },

  // ------------------------------------------------------------ loading / fade
  setLoading(p) {
    $('barFill').style.width = `${Math.round(p * 100)}%`;
    if (p >= 1) $('loading').hidden = true;
  },

  fade(on) {
    const el = $('fade');
    el.classList.toggle('on', on);
    return new Promise((r) => setTimeout(r, 480));
  },

  // ------------------------------------------------------------ title
  showTitle(saved, days, onPick) {
    const done = saved.stickers;
    const unlockAll = new URLSearchParams(location.search).has('unlock');
    const next = days.find((d) => !done.includes(d.id));
    const nextId = next ? next.id : 1;

    $('playBtn').textContent = done.length ? t('ui.playDay', { n: nextId }) : t('ui.play');
    $('playBtn').onclick = () => onPick(nextId);

    const row = $('dayRow');
    row.innerHTML = '';
    for (const d of days) {
      const isDone = done.includes(d.id);
      const open = unlockAll || d.id === 1 || done.includes(d.id - 1) || isDone;
      const b = document.createElement('button');
      b.className = 'dayBtn' + (isDone ? ' done' : '') + (open ? '' : ' locked');
      b.setAttribute('aria-label', t('ui.day', { n: d.id }));
      const num = document.createElement('b');
      num.textContent = d.id;
      const icon = document.createElement('span');
      icon.textContent = isDone ? d.sticker : open ? '⭐' : '🔒';
      b.append(num, icon);
      if (open) b.onclick = () => onPick(d.id);
      row.appendChild(b);
    }
    $('title').hidden = false;
  },

  hideTitle() {
    $('title').hidden = true;
  },

  // ------------------------------------------------------------ HUD
  showHud(day) {
    $('hud').hidden = false;
    $('dayBadge').textContent = t('ui.day', { n: day.id });
    $('muteBtn').textContent = audio.isMuted() ? '🔇' : '🔊';
    $('steps').innerHTML = '';
    $('bagPanel').hidden = true;
  },

  hideHud() {
    $('hud').hidden = true;
  },

  setSteps(list, current, progress) {
    const box = $('steps');
    if (box.children.length !== list.length) {
      box.innerHTML = '';
      for (const s of list) {
        const chip = document.createElement('div');
        chip.className = 'chip';
        const ic = document.createElement('span');
        ic.className = 'ic';
        ic.textContent = s.icon;
        const pips = document.createElement('span');
        pips.className = 'pips';
        chip.append(ic, pips);
        box.appendChild(chip);
      }
    }
    list.forEach((s, i) => {
      const chip = box.children[i];
      chip.classList.toggle('done', i < current);
      chip.classList.toggle('current', i === current);
      chip.classList.toggle('future', i > current);
      const pips = chip.querySelector('.pips');
      pips.innerHTML = '';
      if (s.count > 1) {
        for (let k = 0; k < s.count; k++) {
          const pip = document.createElement('i');
          if (i < current || (i === current && k < progress)) pip.className = 'on';
          pips.appendChild(pip);
        }
      }
    });
  },

  setBag(bag) {
    const items = Object.entries(bag).filter(([, n]) => n > 0);
    const total = items.reduce((a, [, n]) => a + n, 0);
    $('bagCount').textContent = total;
    $('bagCount').hidden = total === 0;
    const box = $('bagItems');
    box.innerHTML = '';
    if (!items.length) {
      const e = document.createElement('div');
      e.className = 'empty';
      e.textContent = t('ui.empty');
      box.appendChild(e);
    }
    for (const [k, n] of items) {
      const d = document.createElement('div');
      d.className = 'bagItem';
      const s = document.createElement('span');
      s.textContent = BAG_ICONS[k] || '⭐';
      const b = document.createElement('b');
      b.textContent = n;
      d.append(s, b);
      box.appendChild(d);
    }
  },

  bumpBag() {
    const b = $('bagBtn');
    b.classList.remove('bump');
    void b.offsetWidth;
    b.classList.add('bump');
  },

  // ------------------------------------------------------------ end of day
  showEnd(day, stars, hasNext, onNext, onHome) {
    $('hud').hidden = true;
    $('tray').hidden = true;
    $('end').hidden = false;
    $('endSticker').textContent = day.sticker;
    $('endTitle').textContent = day.final ? t('ui.final') : t('ui.complete', { name: day.name });
    $('endStars').textContent = '⭐'.repeat(stars);
    $('nextBtn').hidden = !hasNext;
    $('nextBtn').onclick = onNext;
    $('homeBtn').onclick = onHome;
  },

  hideEnd() {
    $('end').hidden = true;
  },

  // ------------------------------------------------------------ wardrobe
  showWardrobe(outfit, onChange, onDone) {
    const cur = { ...outfit };
    const dressRow = $('dressRow');
    const crownRow = $('crownRow');
    const render = () => {
      dressRow.innerHTML = '';
      DRESSES.forEach((d, i) => {
        const b = document.createElement('button');
        b.className = 'swatch' + (cur.dress === i ? ' on' : '');
        b.style.background = `radial-gradient(circle at 35% 30%, #fff8, transparent 45%), linear-gradient(${css(d.main)}, ${css(d.deep)})`;
        b.textContent = '👗';
        b.setAttribute('aria-label', t('aria.dress'));
        b.onclick = () => {
          cur.dress = i;
          onChange({ ...cur });
          render();
        };
        dressRow.appendChild(b);
      });
      crownRow.innerHTML = '';
      CROWN_ICONS.forEach((icon, i) => {
        const b = document.createElement('button');
        b.className = 'swatch crownBtn' + (cur.crown === i ? ' on' : '');
        b.textContent = icon;
        b.setAttribute('aria-label', t('aria.crown'));
        b.onclick = () => {
          cur.crown = i;
          onChange({ ...cur });
          render();
        };
        crownRow.appendChild(b);
      });
    };
    render();
    $('wardrobeDone').onclick = () => {
      $('wardrobe').hidden = true;
      $('hud').classList.remove('dim');
      document.body.classList.remove('wardrobe-open');
      onDone();
    };
    $('hud').classList.add('dim');
    document.body.classList.add('wardrobe-open');
    $('wardrobe').hidden = false;
  },

  // ------------------------------------------------------------ treat tray
  showTray(treats, onSelect) {
    const tray = $('tray');
    tray.innerHTML = '';
    treats.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'treat';
      b.textContent = t.icon;
      b.setAttribute('aria-label', t.word);
      b.onclick = () => {
        tray.querySelectorAll('.treat').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        onSelect(t.id);
      };
      tray.appendChild(b);
    });
    tray.hidden = false;
  },

  hideTray() {
    $('tray').hidden = true;
  },

  pulseTray() {
    const t = $('tray');
    t.classList.remove('pulse');
    void t.offsetWidth;
    t.classList.add('pulse');
  },

  // ------------------------------------------------------------ bubbles
  makeBubble(html) {
    const el = document.createElement('div');
    el.className = 'bubble';
    const s = document.createElement('span');
    s.textContent = html;
    el.appendChild(s);
    $('bubbles').appendChild(el);
    return el;
  },
};

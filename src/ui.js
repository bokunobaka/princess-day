import * as audio from './audio.js';
import { save, load } from './save.js';
import { DRESSES, CROWN_ICONS } from './models.js';
import { t, applyStatic, lang } from './i18n.js';

const $ = (id) => document.getElementById(id);
const css = (n) => '#' + n.toString(16).padStart(6, '0');
const dressBg = (d) => `radial-gradient(circle at 35% 30%, #fff8, transparent 45%), linear-gradient(${css(d.main)}, ${css(d.deep)})`;

const BAG_ICONS = {
  flower: '🌸', teapot: '🫖', egg: '🥚', flour: '🌾', strawberry: '🍓',
  pumpkin: '🎃', candy: '🍬', balloon: '🎈', present: '🎁', key: '🔑', ornament: '🔔', toy: '🦆',
  pearl: '🦪', tutu: '👗', fish: '🐟', milk: '🥛', ball: '🎾', shoe: '🩰', ribbon: '🎀', wood: '🪵', star: '⭐', snowflake: '❄️', hay: '🌾',
};

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

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
    const saved = load();
    if (saved.muted) audio.setMuted(true);
    audio.setVolume(saved.volume);
    $('muteBtn').textContent = audio.isMuted() ? '🔇' : '🔊';
  },

  // ------------------------------------------------------------ loading / fade
  setLoading(p) {
    $('barFill').style.width = `${Math.round(p * 100)}%`;
    if (p >= 1) $('loading').hidden = true;
  },

  fade(on) {
    $('fade').classList.toggle('on', on);
    return new Promise((r) => setTimeout(r, 480));
  },

  // ------------------------------------------------------------ title + day buttons
  dayButtons(container, saved, days, onPick) {
    const done = saved.stickers;
    const unlockAll = new URLSearchParams(location.search).has('unlock');
    container.innerHTML = '';
    for (const d of days) {
      const isDone = done.includes(d.id);
      const open = unlockAll || d.id === 1 || done.includes(d.id - 1) || isDone;
      const b = el('button', 'dayBtn' + (isDone ? ' done' : '') + (open ? '' : ' locked'));
      b.setAttribute('aria-label', t('ui.day', { n: d.id }));
      b.append(el('b', '', d.id), el('span', '', isDone ? d.sticker : open ? '⭐' : '🔒'));
      if (open) b.onclick = () => onPick(d.id);
      container.appendChild(b);
    }
  },

  showTitle(saved, days, onPlay, onPick) {
    $('playBtn').textContent = t('ui.play');
    $('playBtn').onclick = onPlay;
    this.dayButtons($('dayRow'), saved, days, onPick);
    $('title').hidden = false;
    $('parentBtn').hidden = false;
  },

  hideTitle() {
    $('title').hidden = true;
  },

  // the same day buttons as a pop-up map (opened from the palace signpost)
  showDayMap(saved, days, onPick, onClose) {
    this.dayButtons($('mapRow'), saved, days, (id) => {
      $('map').hidden = true;
      onPick(id);
    });
    $('mapClose').onclick = () => {
      $('map').hidden = true;
      onClose && onClose();
    };
    $('map').hidden = false;
  },

  // ------------------------------------------------------------ HUD
  showHud(day) {
    $('hud').hidden = false;
    const hub = !day.steps.length;
    $('quest').hidden = hub;
    $('dayBadge').textContent = t('ui.day', { n: day.id });
    $('muteBtn').textContent = audio.isMuted() ? '🔇' : '🔊';
    $('steps').innerHTML = '';
    $('bagPanel').hidden = true;
    $('bagBtn').hidden = hub;
    $('parentBtn').hidden = false;
  },

  setScore(n) {
    const sc = $('score');
    sc.hidden = n === null;
    if (n !== null) sc.textContent = `⭐ ${n}`;
  },

  hideHud() {
    $('hud').hidden = true;
  },

  setSteps(list, current, progress) {
    const box = $('steps');
    if (box.children.length !== list.length) {
      box.innerHTML = '';
      for (const s of list) {
        const chip = el('div', 'chip');
        chip.append(el('span', 'ic', s.icon), el('span', 'pips'));
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
    if (!items.length) box.appendChild(el('div', 'empty', t('ui.empty')));
    for (const [k, n] of items) {
      const d = el('div', 'bagItem');
      d.append(el('span', '', BAG_ICONS[k] || '⭐'), el('b', '', n));
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
  showEnd(day, stars, hasNext, onNext, onHome, rewards = []) {
    $('hud').hidden = true;
    $('tray').hidden = true;
    $('end').hidden = false;
    $('endSticker').textContent = day.sticker;
    $('endTitle').textContent = day.final ? t('ui.final') : t('ui.complete', { name: day.name });
    $('endStars').textContent = '⭐'.repeat(Math.min(stars, 16));
    const box = $('endRewards');
    box.innerHTML = '';
    for (const r of rewards) {
      const card = el('div', 'rewardCard');
      const sw = el('div', 'swatch big' + (r.type === 'crown' ? ' crownBtn' : ''));
      if (r.type === 'dress') {
        sw.style.background = dressBg(DRESSES[r.index]);
        sw.textContent = '👗';
      } else sw.textContent = CROWN_ICONS[r.index];
      card.append(sw, el('span', '', t(r.type === 'dress' ? 'ui.newDress' : 'ui.newCrown')));
      box.appendChild(card);
    }
    $('nextBtn').hidden = !hasNext;
    $('nextBtn').onclick = onNext;
    $('homeBtn').onclick = onHome;
  },

  hideEnd() {
    $('end').hidden = true;
  },

  // ------------------------------------------------------------ wardrobe (locked pieces show a padlock)
  showWardrobe(outfit, unlocked, onChange, onDone, onLocked) {
    const cur = { ...outfit };
    const dressRow = $('dressRow');
    const crownRow = $('crownRow');
    const render = () => {
      dressRow.innerHTML = '';
      DRESSES.forEach((d, i) => {
        const open = unlocked.dress.includes(i);
        const b = el('button', 'swatch' + (cur.dress === i ? ' on' : '') + (open ? '' : ' locked'));
        if (open) b.style.background = dressBg(d);
        b.textContent = open ? '👗' : '🔒';
        b.setAttribute('aria-label', t('aria.dress'));
        b.onclick = () => {
          if (!open) return onLocked && onLocked();
          cur.dress = i;
          onChange({ ...cur });
          render();
        };
        dressRow.appendChild(b);
      });
      crownRow.innerHTML = '';
      CROWN_ICONS.forEach((icon, i) => {
        const open = unlocked.crown.includes(i);
        const b = el('button', 'swatch crownBtn' + (cur.crown === i ? ' on' : '') + (open ? '' : ' locked'), open ? icon : '🔒');
        b.setAttribute('aria-label', t('aria.crown'));
        b.onclick = () => {
          if (!open) return onLocked && onLocked();
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
    treats.forEach((item) => {
      const b = el('button', 'treat', item.icon);
      b.setAttribute('aria-label', item.word);
      b.onclick = () => {
        tray.querySelectorAll('.treat').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        onSelect(item.id);
      };
      tray.appendChild(b);
    });
    tray.hidden = false;
  },

  hideTray() {
    $('tray').hidden = true;
  },

  pulseTray() {
    const tray = $('tray');
    tray.classList.remove('pulse');
    void tray.offsetWidth;
    tray.classList.add('pulse');
  },

  // ------------------------------------------------------------ bubbles
  makeBubble(html) {
    const b = el('div', 'bubble');
    b.appendChild(el('span', '', html));
    $('bubbles').appendChild(b);
    return b;
  },

  // ------------------------------------------------------------ pet chooser
  showPetPicker(kinds, names, onDone, onHover) {
    const box = $('petPick');
    const grid = $('petGrid');
    const nameRow = $('petNames');
    let kind = null;
    grid.innerHTML = '';
    nameRow.innerHTML = '';
    nameRow.hidden = true;
    kinds.forEach((k) => {
      const b = el('button', 'petBtn', k.icon);
      b.setAttribute('aria-label', k.id);
      b.onclick = () => {
        kind = k.id;
        grid.querySelectorAll('.petBtn').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        onHover && onHover('kind', k.id);
        nameRow.hidden = false;
      };
      grid.appendChild(b);
    });
    names.forEach((n) => {
      const b = el('button', 'nameBtn', n.name);
      b.onclick = () => {
        if (!kind) return;
        box.hidden = true;
        onDone({ kind, name: n.id });
      };
      nameRow.appendChild(b);
    });
    box.hidden = false;
  },

  // ------------------------------------------------------------ sticker book
  showBook(saved, days, onClose, onOpenPhoto) {
    const body = $('bookBody');
    body.innerHTML = '';
    const section = (title) => {
      const s = el('section', 'bookSec');
      s.appendChild(el('h3', '', title));
      const g = el('div', 'bookGrid');
      s.appendChild(g);
      body.appendChild(s);
      return g;
    };
    const stick = section(t('book.stickers'));
    for (const d of days) {
      const done = saved.stickers.includes(d.id);
      stick.appendChild(el('div', 'sticker-slot' + (done ? ' got' : ''), done ? d.sticker : '❓'));
    }
    const wear = section(t('book.outfits'));
    DRESSES.forEach((d, i) => {
      const open = saved.unlocked.dress.includes(i);
      const sw = el('div', 'swatch mini' + (open ? '' : ' locked'), open ? '👗' : '🔒');
      if (open) sw.style.background = dressBg(d);
      wear.appendChild(sw);
    });
    CROWN_ICONS.forEach((icon, i) => {
      const open = saved.unlocked.crown.includes(i);
      wear.appendChild(el('div', 'swatch mini crownBtn' + (open ? '' : ' locked'), open ? icon : '🔒'));
    });
    const stats = section(t('book.stats'));
    stats.appendChild(el('div', 'stat', `💐 ${saved.bouquets}`));
    stats.appendChild(el('div', 'stat', `🦄 ⭐ ${saved.best.ride}`));
    stats.appendChild(el('div', 'stat', `💃 ⭐ ${saved.best.dance}`));
    const pics = section(t('book.photos'));
    if (!saved.photos.length) pics.appendChild(el('div', 'empty', t('book.noPhotos')));
    saved.photos.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      img.className = 'thumb';
      img.alt = '';
      img.onclick = () => onOpenPhoto(i);
      pics.appendChild(img);
    });
    $('bookClose').onclick = () => {
      $('book').hidden = true;
      onClose && onClose();
    };
    $('book').hidden = false;
  },

  showPhotoView(src, onDelete, onClose) {
    $('photoImg').src = src;
    $('photoDelete').onclick = () => {
      $('photoView').hidden = true;
      onDelete();
    };
    $('photoClose').onclick = () => {
      $('photoView').hidden = true;
      onClose && onClose();
    };
    $('photoView').hidden = false;
  },

  // ------------------------------------------------------------ photo booth controls
  showPhotoUi(backdrops, onBackdrop, onShoot, onClose) {
    const row = $('backdropRow');
    row.innerHTML = '';
    backdrops.forEach((icon, i) => {
      const b = el('button', 'swatch crownBtn' + (i === 0 ? ' on' : ''), icon);
      b.onclick = () => {
        row.querySelectorAll('.swatch').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        onBackdrop(i);
      };
      row.appendChild(b);
    });
    $('shutter').onclick = onShoot;
    $('photoExit').onclick = onClose;
    $('hud').classList.add('dim');
    document.body.classList.add('wardrobe-open');
    $('photoUi').hidden = false;
  },

  hidePhotoUi() {
    $('photoUi').hidden = true;
    document.body.classList.remove('wardrobe-open');
    $('hud').classList.remove('dim');
  },

  flash() {
    const f = $('flash');
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  },

  toast(text) {
    const tt = $('toast');
    tt.textContent = text;
    tt.classList.add('show');
    clearTimeout(this._toast);
    this._toast = setTimeout(() => tt.classList.remove('show'), 2200);
  },

  // ------------------------------------------------------------ parent corner (opened by holding the gear)
  bindHold(btn, fn, ms = 900) {
    let timer = 0;
    const start = (e) => {
      e.preventDefault();
      btn.classList.add('holding');
      timer = setTimeout(() => {
        btn.classList.remove('holding');
        fn();
      }, ms);
    };
    const stop = () => {
      clearTimeout(timer);
      btn.classList.remove('holding');
    };
    btn.addEventListener('pointerdown', start);
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, stop);
  },

  showParent({ volume, controls, onControls, onVolume, onLang, onHome, onReset, onTitle, onClose }) {
    const ctls = [['ctlBoth', 'both'], ['ctlTap', 'tap'], ['ctlStick', 'stick']];
    const ctl = (mode) => ctls.forEach(([id, m]) => $(id).classList.toggle('on', m === mode));
    ctl(controls);
    for (const [id, m] of ctls)
      $(id).onclick = () => {
        ctl(m);
        onControls(m);
      };
    $('volRange').value = Math.round(volume * 100);
    $('volRange').oninput = (e) => onVolume(Number(e.target.value) / 100);
    $('langEt').classList.toggle('on', lang === 'et');
    $('langEn').classList.toggle('on', lang === 'en');
    $('langEt').onclick = () => onLang('et');
    $('langEn').onclick = () => onLang('en');
    $('parentHome').onclick = () => {
      $('parent').hidden = true;
      onHome();
    };
    $('parentTitle').onclick = () => {
      $('parent').hidden = true;
      onTitle();
    };
    const reset = $('parentReset');
    reset.textContent = t('parent.reset');
    reset.classList.remove('armed');
    reset.onclick = () => {
      if (!reset.classList.contains('armed')) {
        reset.classList.add('armed');
        reset.textContent = t('parent.resetSure');
        return;
      }
      onReset();
    };
    $('parentClose').onclick = () => {
      $('parent').hidden = true;
      onClose && onClose();
    };
    $('parent').hidden = false;
  },

  // ------------------------------------------------------------ the floating joystick
  showStick(x, y) {
    const st = $('stick');
    st.style.left = `${x}px`;
    st.style.top = `${y}px`;
    this.moveStick(0, 0);
    st.hidden = false;
  },

  moveStick(x, y) {
    $('stickKnob').style.transform = `translate(${x * 40}px, ${y * 40}px)`;
  },

  hideStick() {
    $('stick').hidden = true;
  },

  // ------------------------------------------------------------ the little pointing hand for the first tap
  showHand(x, y) {
    const h = $('hand');
    h.style.transform = `translate(${x}px, ${y}px)`;
    h.hidden = false;
  },

  hideHand() {
    $('hand').hidden = true;
  },
};

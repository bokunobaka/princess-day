import './style.css';
import { Game } from './game.js';
import { ui } from './ui.js';
import { say } from './speech.js';

ui.init();
const game = new Game(document.getElementById('c'));
ui.onQuestTap = () => game.step && say(game.step.hint);
game.start();

// handy for poking at the game from the dev console
window.__game = game;

game.init().then(() => {
  // dev shortcuts: ?day=3 starts that day straight away, ?area=kitchen previews a room
  const q = new URLSearchParams(location.search);
  if (q.has('day')) game.startDay(Number(q.get('day')));
  else if (q.has('area')) {
    game.loadArea(q.get('area'));
    game.snapCamera();
    ui.hideTitle();
    game.state = 'play';
  }
});

// offline support: only in the built game (the dev server would cache stale code)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

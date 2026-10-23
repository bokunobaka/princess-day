import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Writes dist/sw.js: the service worker with the list of every built file, so the game works offline.
function offlineCache() {
  return {
    name: 'princess-offline-cache',
    apply: 'build',
    closeBundle() {
      const dist = 'dist';
      const files = [];
      (function walk(dir) {
        for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, f.name);
          if (f.isDirectory()) walk(p);
          else files.push(path.relative(dist, p).split(path.sep).join('/'));
        }
      })(dist);
      const list = files.filter((f) => f !== 'sw.js' && !f.endsWith('.txt'));
      const tpl = fs.readFileSync('tools/sw-template.js', 'utf8');
      const hash = crypto.createHash('md5');
      for (const f of list) hash.update(f).update(fs.readFileSync(path.join(dist, f)));
      hash.update(tpl); // a changed worker also gets a new cache name
      fs.writeFileSync(
        path.join(dist, 'sw.js'),
        tpl.replace('%%VERSION%%', hash.digest('hex').slice(0, 10)).replace('%%FILES%%', JSON.stringify(['./', ...list]))
      );
    },
  };
}

// relative base so the built game can be hosted from any folder
export default defineConfig({ base: './', plugins: [offlineCache()] });

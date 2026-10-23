# Princess Day (Printsessi päev)

A gentle 3D browser game for ages 4-6, built with three.js + Vite. No reading needed:
quests are shown as pictures, friends speak their lines, and nothing can be lost or failed.

    npm install
    npm run dev       # open the printed URL (also reachable from a tablet on the same Wi-Fi)
    npm run build     # production build in dist/ (relative paths, host it from any folder)

Tap the ground to walk; tap things to pick them up, talk to them, or use them.
Progress (finished days, outfit, sound setting) is kept in localStorage.

## Language

Estonian by default. Add `?lang=en` for English (the choice is remembered; `?lang=et` switches back).
All words live in `src/i18n.js`. Spoken lines use a device voice for the language, and if the device has
none (many have no Estonian voice) the game shows the subtitle only. Edge and Android ship Estonian voices.

## Voice (recorded Estonian)

Lines are spoken from recorded clips in `public/voice/et/` (voice "Triin" from jutusta.ee), falling back to a
device voice and finally to the subtitle alone. A clip is found by a hash of its exact text, so editing a line
in `src/i18n.js` means re-recording that line.

    node tools/voice-lines.mjs > lines.json      # every spoken line with its id (141 lines)
    # generate each line as <id>.wav with voice Triin, put them in one folder, then:
    node tools/wav-to-mp3.mjs <folder-with-wavs>  # writes public/voice/et/*.mp3 + manifest.json

## The five days

| Day | Place | What happens |
| --- | --- | --- |
| 1 Garden Day | garden | pick 3 pink flowers, find the hidden teapot, tea party with Teddy |
| 2 Dress-up Day | bedroom | choose a dress and crown, wake 3 sleepy friends, parade into the garden |
| 3 Kitchen Day | kitchen | find ingredients, stir, bake, decorate 6 cupcakes |
| 4 Tea Party Day | garden | invite 3 friends, seat them, serve each the treat they like |
| 5 Royal Ball | ballroom | light candles, invite friends, step on glowing tiles to dance, fireworks |
| 6 Halloween | spooky night garden | find 3 pumpkins, pick a witch or cat costume, trick-or-treat at 3 cottages |
| 7 Birthday | party room | gather balloons, find presents, light the candles, sing happy birthday to Mõmmi |
| 8 Zombie Escape | graveyard | find 3 keys, open the gate, run into the light; friendly zombies only want hugs |
| 9 Christmas | snowy garden | hang ornaments on the tree, build a snowman, give presents to friends |
| 10 Pool Day | pool deck | find pool toys, jump in (friends too), serve everyone a drink |

Days unlock in order; finished days can be replayed from the title screen.
Dev shortcuts: `?day=3` starts a day directly, `?unlock` unlocks all days, `?area=kitchen` previews a room.

## Code map

- `src/game.js` core: input, camera, areas, quest progress, followers, wardrobe
- `src/days/` one file per day (steps + behaviour); add a day by adding a file and listing it in `index.js`
- `src/areas/` the garden and indoor rooms
- `src/models.js` procedural princess (dress/crown outfits), Teddy, flowers, tea set
- `src/assets.js` glTF loading + animated animal friends; `src/ui.js` HUD, title, wardrobe, tray
- Spoken lines use the browser's speech synthesis (`src/speech.js`); swap for recorded clips later.

## Credits

3D models by [Kenney](https://kenney.nl) (Cube Pets, Food Kit, Furniture Kit, Graveyard Kit, Holiday Kit), CC0 licensed.
Licence files are in `public/models/*/`.

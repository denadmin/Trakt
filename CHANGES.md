# Changes relative to upstream PTN-Ninja (v3.6.2)

This fork targets a fully **offline, self-hosted** Trakt that can be
installed as a PWA and deployed to GitHub Pages (or any static host).

## Features

- **Topaz (wasm) engine enabled and interactive.**
  - `TopazWasm` is now an interactive engine: it streams live PVs while the
    position changes, like the bundled Tiltak wasm engine.
  - A streaming worker (`public/topaz/topaz.worker.js`) keeps a persistent
    engine + transposition table across depths, posting `info` per depth.
  - "Analyze Position" is single-PV to match Tiltak's behavior (Tiltak's
    `go nodes` only ever emits one line); Multi-PV is available in
    interactive mode and configurable via the `MultiPV` engine option.
- **Play vs Bot.**
  - The setup dialog (`dialogs/BotGame.vue`) now offers engine (with
    descriptions), strength presets (Fast / Normal / Strong / Maximum),
    engine-valid board sizes (Tiltak also plays 4×4), komi presets and a
    White / Random / Black side picker; choices persist between sessions.
    "Play vs Bot" moved to the top of the Add Game dialog's "New Game" tab.
  - A bot status bar (`components/board/BotGameBar.vue`) shows whose turn it
    is and whether the bot is thinking, with Takeback (removes your move and
    the bot's reply), Resign (records an "R" result and stops the bot),
    New Bot Game and Stop Bot actions.
  - Gameplay uses a bounded one-shot search driven by the strength preset
    (`bots/botGame.js`), so the bot always replies promptly regardless of
    analysis settings.
  - Robustness fixes: the bot no longer inserts its reply into a different
    game after the user switches games mid-search; Tiltak re-runs its
    `teinewgame` handshake when a new game uses a different size/komi (the
    wasm build used to panic on mismatched TPS); board sizes are validated
    against the selected engine's supported set.
- **Bundled engines rebuilt.**
  - `public/topaz/*` and `public/tiltak-wasm/*` now ship newer wasm builds
    with the features above.
- **Openings database removed.**
  - The online openings explorer, its settings, database stats and the
    Takexplorer game fetch were removed (they need network + a backend).
  - The "Openings" analysis tab/source is gone; engines are the default.

## Deployment changes

- `publicPath` is configurable via the `DEPLOY_BASE` env var (default `/`),
  so the same source builds for the repo root or a GitHub Pages subpath.
- Router switched from `history` to `hash` mode so deep links work on static
  hosts (GitHub Pages 404s on unknown paths otherwise).
- Worker scripts are loaded with relative URLs so they resolve under any
  `DEPLOY_BASE`.
- The in-app changelog / "Check for updates" UI was removed (it targeted the
  hosted ptn.ninja release pipeline).
- `.github/workflows/deploy.yml` builds the PWA and publishes it to GitHub
  Pages on every push to `master`, and now also runs the Playwright e2e suite
  in a separate `test` job.

## Offline PWA fix

- The Workbox precache skipped any file larger than its 2 MiB default, which
  included the vendor bundle — the app could not start offline at all.
  `quasar.conf.js` now raises `maximumFileSizeToCacheInBytes`; the wasm
  engines copied from `public/` were already precached as webpack assets.
  `offline-pwa-check.js` verifies the full offline path (install SW, go
  offline, reload, play a bot move) against a served `dist/pwa`.

## Offline / local-run cleanup

- **Accounts & online games removed.** The `online` Vuex module, the Firebase
  boot file, the auth dialogs (`LogIn`, `Account`, `JoinGame`, `ShareOnline`),
  `pages/Auth.vue`, the online games table and the `auth`/`account`/`join`/
  `login` routes are gone. No Firebase config is required anywhere.
- **Firebase scaffolding deleted.** `functions/`, `firebase.json`,
  `firestore.rules`, `firestore.indexes.json`, `database.rules.json`,
  `firebase-messaging-sw.js`, `.firebaserc` and the `deploy*`/`emulate`
  scripts were removed, along with the `firebase`/`firebase-admin`/
  `firebase-tools` dependencies.
- **Remote share services removed.** The short-link service
  (`url.ptn.ninja`/`SHORTENER_SERVICE`), the `/s/:id` route and the GIF/PNG
  server endpoints (`tps.ptn.ninja`) are gone; the "Short Link" share action
  and QR-code short option were dropped. GIF/PNG export renders fully in the
  browser.
- **Cross-platform scripts.** `dev`/`build` (and `*:electron`) scripts now use
  `cross-env` to set `NODE_OPTIONS=--openssl-legacy-provider`, so
  `yarn dev`/`yarn build` work on Linux/macOS as well as Windows.
- `readme.md` was rewritten for the offline scenario (no Firebase
  prerequisite, no `yarn emulate`, no `url.ptn.ninja/short` API).

## Local development

```bash
yarn install
yarn dev:pwa       # local dev server on :8081
yarn build         # production PWA build (served from /)
DEPLOY_BASE=/Trakt/ yarn build   # build for a Pages subpath
```

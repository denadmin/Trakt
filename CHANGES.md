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
  - New "Play vs Bot" entry in the Add Game dialog; pick Topaz or Tiltak,
    board size, komi and your color. A dedicated `BotOpponent` component
    searches the engine and auto-plays replies in a local game.
  - Gameplay uses a bounded one-shot search, so the bot always replies
    promptly regardless of analysis settings.
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

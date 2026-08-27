# AGENTS.md — Trakt (offline fork of PTN-Ninja)

Ongoing notes for agent sessions on this fork.

## Repo & deploy
- Source repo: this `ninja-src` directory (git remote `origin` = upstream `gruppler/PTN-Ninja`, `fork` = our `denadmin/Trakt`).
- **GitHub Pages:** https://denadmin.github.io/Trakt/ — published from `master` by `.github/workflows/deploy.yml` (build + deploy on every push).
- CI uses `DEPLOY_BASE=/${{ github.event.repository.name }}/`. So if the repo is renamed, the URL/paths change automatically — no code change needed.

## Build / deploy workflow (local)

1. `yarn install` in `ninja-src`.
2. Build the PWA:
   - For the repo root: `yarn build`
   - For the GitHub Pages subpath: `DEPLOY_BASE=/Trakt/ yarn build`
   (Windows PowerShell: `$env:DEPLOY_BASE="/Trakt/"; yarn build`)
3. The built output lands in `dist/pwa`. CI builds and publishes on every push to `master`; a local build is only needed to sanity-check.
4. For the old local `web/` (port 8000) the steps are documented in `build.ps1`.

## Gotchas

- **Comment corruption:** copy/paste via PowerShell historically mangles comments (mojibake `�?`). Make edits in `ninja-src` and check comments after syncing. Run `npx prettier --write` on changed files.
- **`publicPath`/worker URLs**: Quasar sets a `<base>` and workers are loaded via `new URL("../../topaz/topaz.worker.js", import.meta.url)`. The paths must be relative to `src/bots/` → `../../` (import.meta.url in the bundle resolves to `publicPath/src/bots/`). Never go back to absolute `/topaz/...` or they break on the Pages subpath.
- **Router**: `quasar.conf.js` uses `vueRouterMode: "hash"` (needed for static hosts). Do NOT switch to `history` without also removing the legacy hash-redirect in `src/layouts/Main.vue`/`Embed.vue` `beforeCreate` (it calls `location.reload()` and would infinite-loop in hash mode).
- **PWA caching**: after deploying, the old service worker caches a stale build — the user must hard-refresh (Ctrl+F5) or re-install the PWA on mobile.

## Engines

- Built-in bots: `tiltak` (wasm), `topaz` (wasm), `tinue-solver` (wasm), `tei` (remote). `TopazWasm` is interactive and has a `MultiPV` option; "Analyze Position" is single-PV by design (matches Tiltak's `go nodes` behavior).
- Play vs Bot (`BotOpponent.vue` + `BotGame.vue`) uses its own engine instances and bounded one-shot searches.

## Earlier decisions (context)

- Removed the online Openings explorer/database (network + backend) and all related code (`OPENING_DB_API`, `SELECT_OPENINGS`, `openingStats`, etc.).
- Removed the online account/game store entirely: `store/online`, `boot/firebase.js`, the auth dialogs (`LogIn`, `Account`, `JoinGame`, `ShareOnline`) and `pages/Auth.vue`, plus their routes and Firebase scaffolding (`functions/`, `firebase.json`, Firestore/RTDB rules, `firebase-messaging-sw.js`). The app is fully offline; no Firebase config is needed.
- Removed the in-app changelog / "Check for updates" UI (dialog, `changelog.json`, scripts, route, update-notification button) and dropped `CNAME` (it pointed at upstream's `ptn.ninja`).
- Removed the remote "Short Link" service and the `/s/:id` unshort route; GIF/PNG export renders locally in a worker. `NODE_OPTIONS=--openssl-legacy-provider` is set via `cross-env` in `package.json` scripts so `yarn dev`/`yarn build` work on Linux/macOS too.
- Git identity is `denadmin` / `5859803+denadmin@users.noreply.github.com`; `gh` CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` (login as `denadmin`).
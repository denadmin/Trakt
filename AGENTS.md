# AGENTS.md — Trakt (offline fork of PTN-Ninja)

Ongoing notes for agent sessions on this fork.

## Repo & deploy
- Source repo: `C:\src\tak\bots\topaz_tak\web\ninja-src` (git remote `origin` = upstream `gruppler/PTN-Ninja`, `fork` = our `denadmin/Trakt`).
- **GitHub Pages:** https://denadmin.github.io/Trakt/ — published from `master` by `.github/workflows/deploy.yml` (build + deploy on every push).
- CI uses `DEPLOY_BASE=/${{ github.event.repository.name }}/`. So if the repo is renamed, the URL/paths change automatically — no code change needed.

## Build / deploy workflow (local)

1. Sync source into the build dir that has node_modules (robocopy `/MIR`, excluding `node_modules`, `.git`, `dist`):
   `C:\Users\den\AppData\Local\Temp\opencode\ptn-ninja`
2. Edit files in the real source `ninja-src`, then copy changed files into the build dir (or `/MIR`).
3. Build: `$env:NODE_OPTIONS="--openssl-legacy-provider"; npx quasar build -m pwa` (run in the build dir).
   - For GitHub Pages subpath: also set `$env:DEPLOY_BASE="/Trakt/"` before building.
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
- Removed the in-app changelog/"Check for updates" UI and dropped `CNAME` (it pointed at upstream's `ptn.ninja`).
- Git identity is `denadmin` / `5859803+denadmin@users.noreply.github.com`; `gh` CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` (login as `denadmin`).
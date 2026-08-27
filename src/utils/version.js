// Current app version, injected at build time from package.json via
// quasar.conf.js (buildEnv.APP_VERSION). Falls back to INITIAL_VERSION so the
// app never crashes if the env var is somehow missing.
export const INITIAL_VERSION = "3.5.5";
export const APP_VERSION = process.env.APP_VERSION || INITIAL_VERSION;

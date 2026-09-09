import Vue from "vue";

// Single source of truth for the Play vs Bot feature: which engines can
// play, what board sizes and komi they support, and how the strength
// presets map to each engine's search limits. The setup dialog
// (dialogs/BotGame.vue), the opponent driver (components/BotOpponent.vue)
// and the in-game status bar (components/board/BotGameBar.vue) all read
// from here so their assumptions can't drift apart.

export const STRENGTHS = [
  {
    id: "fast",
    label: "Fast",
    hint: "Brief search — casual play",
  },
  {
    id: "normal",
    label: "Normal",
    hint: "About a second per move",
  },
  {
    id: "strong",
    label: "Strong",
    hint: "Several seconds per move",
  },
  {
    id: "max",
    label: "Maximum",
    hint: "Full strength — slow",
  },
];

// Search limits per strength, shaped for each engine's settings:
// Topaz's worker honors depth + movetime; Tiltak accepts `go nodes`.
export const BOT_ENGINES = {
  topaz: {
    id: "topaz",
    label: "Topaz",
    description: "NNUE evaluation + alpha-beta",
    sizes: [5, 6],
    komiMax: 2,
    strengths: {
      fast: { limitTypes: ["depth", "movetime"], movetime: 300, depth: 5 },
      normal: { limitTypes: ["depth", "movetime"], movetime: 1200, depth: 9 },
      strong: { limitTypes: ["depth", "movetime"], movetime: 5e3, depth: 12 },
      max: { limitTypes: ["depth", "movetime"], movetime: 12e3, depth: 14 },
    },
  },
  tiltak: {
    id: "tiltak",
    label: "Tiltak",
    description: "Monte-Carlo tree search",
    sizes: [4, 5, 6],
    komiMax: 2,
    strengths: {
      fast: { limitTypes: ["nodes"], nodes: 2e3 },
      normal: { limitTypes: ["nodes"], nodes: 3e4 },
      strong: { limitTypes: ["nodes"], nodes: 1e5 },
      max: { limitTypes: ["nodes"], nodes: 6e5 },
    },
  },
};

export const KOMI_CHOICES = [0, 0.5, 1, 1.5, 2];

// Reactive flag shared by the opponent driver and the status bar, so the
// "thinking" indicator doesn't need its own store module.
export const botGameState = Vue.observable({
  thinking: false,
});

export function getEngine(id) {
  return BOT_ENGINES[id] || null;
}

export function supportsSize(id, size) {
  const engine = getEngine(id);
  return !!engine && engine.sizes.includes(Number(size));
}

// Closest supported board size (ties resolved toward the larger board).
export function nearestSize(id, size) {
  const engine = getEngine(id);
  if (!engine) {
    return 6;
  }
  size = Number(size);
  if (engine.sizes.includes(size)) {
    return size;
  }
  return engine.sizes.reduce((prev, curr) =>
    Math.abs(curr - size) <= Math.abs(prev - size) ? curr : prev
  );
}

export function strengthLimits(id, strength) {
  const engine = getEngine(id);
  if (!engine) {
    return null;
  }
  return engine.strengths[strength] || engine.strengths.strong;
}

const SETTINGS_KEY = "botGame";

// Last-used dialog settings, persisted independently of the ui store so the
// feature owns its schema. Saved values are re-validated against current
// engine capabilities (an engine could disappear, or support different
// sizes, in a future version).
export function loadSettings($q, defaults) {
  let saved = {};
  try {
    saved = ($q && $q.localStorage.getItem(SETTINGS_KEY)) || {};
  } catch (error) {
    saved = {};
  }
  const settings = { ...defaults };
  Object.keys(defaults).forEach((key) => {
    if (saved[key] !== undefined && saved[key] !== null) {
      settings[key] = saved[key];
    }
  });
  if (!getEngine(settings.engine)) {
    settings.engine = defaults.engine;
  }
  settings.size = nearestSize(settings.engine, settings.size);
  if (!STRENGTHS.some((s) => s.id === settings.strength)) {
    settings.strength = defaults.strength;
  }
  if (!KOMI_CHOICES.includes(Number(settings.komi))) {
    settings.komi = defaults.komi;
  }
  if (![1, 2, "random"].includes(settings.humanPlayer)) {
    settings.humanPlayer = defaults.humanPlayer;
  }
  return settings;
}

export function saveSettings($q, settings) {
  try {
    if ($q) {
      $q.localStorage.set(SETTINGS_KEY, settings);
    }
  } catch (error) {
    console.warn("Could not save bot game settings:", error);
  }
}

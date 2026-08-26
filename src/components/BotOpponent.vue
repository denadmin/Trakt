<template>
  <div v-show="false" />
</template>

<script>
import TopazWasm from "../bots/topaz-wasm";
import TiltakWasm from "../bots/tiltak-wasm";

// Plays the configured bot's moves in a local game. The game's config carries
// `bot` (engine id) and `botPlayer` (1 = White, 2 = Black). Whenever the
// position changes and it is the bot's turn, the engine is searched and the
// best move is inserted.
export default {
  name: "BotOpponent",
  data() {
    return {
      engines: {},
      busy: false,
    };
  },
  computed: {
    game() {
      return this.$store.state.game;
    },
    config() {
      return this.game.config || {};
    },
    position() {
      return this.game.position;
    },
    bot() {
      return this.config.bot;
    },
    botPlayer() {
      return this.config.botPlayer;
    },
  },
  watch: {
    position: {
      handler() {
        this.scheduleBotMove();
      },
      deep: true,
    },
  },
  methods: {
    // Gameplay uses its own engine instances so it never conflicts with the
    // analysis bot (which may be streaming interactive results).
    getEngine(id) {
      if (!this.engines[id]) {
        if (id === "topaz") {
          this.engines.topaz = new TopazWasm();
        } else if (id === "tiltak") {
          this.engines.tiltak = new TiltakWasm();
        }
      }
      return this.engines[id] || null;
    },
    scheduleBotMove() {
      if (!this.bot || this.busy || !this.position) {
        return;
      }
      if (this.position.isGameEnd) {
        return;
      }
      // Only auto-play when the position is the live tip of the line. When
      // the user is browsing history (navigating to an earlier ply), the
      // position still has a follow-up ply, so `nextPly` is set and the bot
      // must not reply. Once the human plays a move — from the end of the
      // game OR from a point in history (creating a branch) — the position
      // becomes the new tip (`nextPly` is null) and the bot continues.
      if (this.position.nextPly) {
        return;
      }
      if (this.position.turn !== this.botPlayer) {
        return;
      }
      this.$nextTick(() => this.makeBotMove());
    },
    async makeBotMove() {
      if (
        this.busy ||
        !this.position ||
        this.position.turn !== this.botPlayer
      ) {
        return;
      }
      const engine = this.getEngine(this.bot);
      if (!engine) {
        return;
      }
      this.busy = true;
      this.$store.dispatch("ui/SET_UI", ["disableBoard", true]);
      try {
        const size = this.config.size;
        const halfKomi = (this.config.komi || 0) * 2;
        const tps = this.position.tps;
        // Gameplay must use a bounded search regardless of the analysis
        // interactive mode, so the bot always replies promptly.
        const wasInteractive = engine.isInteractiveEnabled;
        engine.isInteractiveEnabled = false;
        let results;
        try {
          // Single-PV only: gameplay just needs the best move.
          results = await engine.searchPosition(size, halfKomi, tps, {
            multipv: 1,
          });
        } finally {
          engine.isInteractiveEnabled = wasInteractive;
        }
        const suggestions = results && results.suggestions;
        const pv = suggestions && suggestions[0] && suggestions[0].pv;
        if (pv && pv.length) {
          await this.$store.dispatch("game/INSERT_PLY", pv[0]);
        }
      } catch (error) {
        console.error("BotOpponent:", error);
      } finally {
        this.busy = false;
        this.$store.dispatch("ui/SET_UI", ["disableBoard", false]);
      }
    },
  },
};
</script>

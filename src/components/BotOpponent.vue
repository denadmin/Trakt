<template>
  <div v-show="false" />
</template>

<script>
import TopazWasm from "../bots/topaz-wasm";
import TiltakWasm from "../bots/tiltak-wasm";
import { botGameState, strengthLimits, supportsSize } from "../bots/botGame";

// Plays the configured bot's moves in a local game. The game's config carries
// `bot` (engine id), `botPlayer` (1 = White, 2 = Black) and `botStrength`
// (search budget preset, resolved via bots/botGame). Whenever the position
// changes and it is the bot's turn, the engine is searched and the best move
// is inserted.
export default {
  name: "BotOpponent",
  data() {
    return {
      engines: {},
      // Per-engine signature of the last Tiltak teinewgame handshake. Tiltak
      // only re-initializes when its JS state says so (see makeBotMove), so
      // size/komi/game changes have to be detected here.
      tiltakInits: {},
      // Tip ply id at the last position change. The bot only replies when the
      // tip moved FORWARD (a freshly inserted move); going backward (undo of
      // the bot's reply, takeback) must not make it replay immediately.
      lastTipPlyID: null,
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
    tipPlyID() {
      const position = this.position;
      return position && position.ply && position.plyIsDone
        ? position.ply.id
        : null;
    },
  },
  watch: {
    position: {
      handler() {
        this.scheduleBotMove();
      },
      deep: true,
    },
    // Tip ids are per-game; a game switch invalidates the forward check.
    "game.name"() {
      this.lastTipPlyID = null;
    },
    config: {
      handler(newConfig, oldConfig) {
        // A bot attached mid-game (via game/SET_BOT) doesn't change the
        // position, so the position watcher alone would never fire. React to
        // config changes too so the bot replies as soon as it is configured.
        // When the bot itself just changed (fresh start / takeover), allow it
        // to move from a mid-line position too — otherwise the bot would sit
        // idle while it is the side to move and the recorded line still has a
        // follow-up ply. Its first move then branches off the recorded line.
        const botChanged =
          !oldConfig ||
          oldConfig.bot !== newConfig.bot ||
          oldConfig.botPlayer !== newConfig.botPlayer;
        this.$nextTick(() => this.scheduleBotMove(botChanged));
      },
      deep: true,
    },
  },
  methods: {
    // Gameplay uses its own engine instances so it never conflicts with the
    // analysis bot (which may be streaming interactive results).
    getEngine(id) {
      if (!this.engines[id]) {
        let engine = null;
        if (id === "topaz") {
          engine = new TopazWasm();
        } else if (id === "tiltak") {
          engine = new TiltakWasm();
        }
        if (engine) {
          // These standalone instances must keep their state on themselves.
          // Bot.setState/setMeta/setPosition route through the analysis
          // store when it exists, and analysis/SET_BOT_STATE writes to the
          // *global* bot object of the same id — never this instance. For
          // Tiltak that leaves isGameInitialized permanently false, so
          // searchPosition re-runs its teinewgame/isready handshake on
          // every readyok and never sends position/go — an infinite loop.
          engine.setState = (state) => Object.assign(engine.state, state);
          engine.setMeta = (meta) => Object.assign(engine.meta, meta);
          engine.setPosition = (tps, suggestions) => {
            engine.positions[tps] = suggestions;
          };
          this.engines[id] = engine;
        }
      }
      return this.engines[id] || null;
    },
    applyStrength(engine, id) {
      const limits = strengthLimits(id, this.config.botStrength);
      if (engine && limits) {
        engine.settings = { ...engine.settings, ...limits };
      }
    },
    scheduleBotMove(force = false) {
      const tipID = this.tipPlyID;
      // Only treat an increased tip id as "the human moved". Undo/redo of the
      // bot's own move, takebacks and plain history navigation restore or
      // revisit existing plies; replying to those would undo the point of the
      // undo. A forced move (fresh attach / takeover) always goes through.
      const movedForward =
        force ||
        (tipID !== null &&
          (this.lastTipPlyID === null || tipID > this.lastTipPlyID));
      this.lastTipPlyID = tipID;
      if (!this.bot || this.busy || !this.position) {
        return;
      }
      if (this.position.isGameEnd) {
        return;
      }
      // An undo (or trim) that removed the bot's reply leaves the game at the
      // bot's own turn, where the human cannot interact — the position would
      // be stuck with a bot that intentionally stays quiet. Remove the
      // human's move underneath as well, handing the turn back to them at
      // their previous decision point.
      const atBotTurn =
        !this.position.nextPly && this.position.turn === this.botPlayer;
      if (!movedForward && atBotTurn) {
        if (!this.position.ply) {
          // Empty board: the bot's forced opening move was undone. Its first
          // move is the only sensible continuation, so let it play.
          this.$nextTick(() => {
            if (
              !this.busy &&
              !this.position.ply &&
              this.position.turn === this.botPlayer
            ) {
              this.makeBotMove();
            }
          });
          return;
        }
        if (this.position.plyIsDone) {
          const plyID = this.position.ply.id;
          this.$nextTick(() => {
            const position = this.position;
            if (
              !this.busy &&
              position &&
              !position.nextPly &&
              position.plyIsDone &&
              position.ply &&
              position.ply.id === plyID &&
              position.turn === this.botPlayer
            ) {
              this.$store.dispatch("game/DELETE_PLY", plyID);
            }
          });
          return;
        }
      }
      if (!movedForward) {
        return;
      }
      // Only auto-play when the position is the live tip of the line. When
      // the user is browsing history (navigating to an earlier ply), the
      // position still has a follow-up ply, so `nextPly` is set and the bot
      // must not reply. Once the human plays a move — from the end of the
      // game OR from a point in history (creating a branch) — the position
      // becomes the new tip (`nextPly` is null) and the bot continues.
      // `force` is set for an explicit bot takeover (game/SET_BOT): the bot
      // replies even mid-line, branching off the recorded line.
      if (this.position.nextPly && !force) {
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
        !this.bot ||
        !this.position ||
        this.position.turn !== this.botPlayer
      ) {
        return;
      }
      const engine = this.getEngine(this.bot);
      if (!engine) {
        return;
      }
      const gameName = this.game.name;
      const wasAtTip = !this.position.nextPly;
      this.busy = true;
      botGameState.thinking = true;
      this.$store.dispatch("ui/SET_UI", ["disableBoard", true]);
      try {
        const size = this.config.size;
        const halfKomi = (this.config.komi || 0) * 2;
        const tps = this.position.tps;
        // A search on an unsupported board would kill the engine's worker
        // (topaz traps outside 5/6, tiltak outside 4/5/6) and leave the bot
        // "thinking" forever — detach it with a visible reason instead.
        if (!supportsSize(this.bot, size)) {
          this.$store.dispatch("game/STOP_BOT");
          this.notifyError(
            this.$t("botGame.unsupportedSize", {
              engine: this.bot === "tiltak" ? "Tiltak" : "Topaz",
              size,
            })
          );
          return;
        }
        // Gameplay must use a bounded search regardless of the analysis
        // interactive mode, so the bot always replies promptly. Limits come
        // from the game's strength preset (bots/botGame).
        this.applyStrength(engine, this.bot);
        if (this.bot === "tiltak") {
          // TeiBot only re-runs its teinewgame handshake when
          // isGameInitialized is false. Its wasm build panics on a TPS whose
          // size doesn't match the initialized game, so force a fresh
          // handshake whenever the game, size or komi changed since the last
          // one (the decision is made synchronously inside searchPosition).
          const init = this.tiltakInits[this.bot];
          if (
            engine.state.isGameInitialized &&
            (!init ||
              init.gameName !== gameName ||
              init.size !== size ||
              init.halfKomi !== halfKomi)
          ) {
            engine.setState({ isGameInitialized: false });
          }
        }
        const wasInteractive = engine.isInteractiveEnabled;
        engine.isInteractiveEnabled = false;
        let results;
        try {
          // Single-PV only: gameplay just needs the best move. TopazWasm
          // takes an options object; Tiltak's TEI signature wants a plyID,
          // which it doesn't need here.
          results = await engine.searchPosition(
            size,
            halfKomi,
            tps,
            this.bot === "topaz" ? { multipv: 1 } : null
          );
        } finally {
          engine.isInteractiveEnabled = wasInteractive;
          if (this.bot === "tiltak") {
            this.tiltakInits[this.bot] = { gameName, size, halfKomi };
          }
        }
        // The user may have switched to a different game (or detached the
        // bot / changed its side / browsed into history) while the search
        // was running; the result belongs to the position it was requested
        // for, so drop it instead of corrupting what is on screen now. A
        // takeover request (forced move mid-line) is exempt: it was never
        // at the tip to begin with.
        if (
          this.game.name !== gameName ||
          !this.bot ||
          this.position.turn !== this.botPlayer ||
          this.position.isGameEnd ||
          (wasAtTip && this.position.nextPly)
        ) {
          return;
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
        botGameState.thinking = false;
        this.$store.dispatch("ui/SET_UI", ["disableBoard", false]);
      }
    },
  },
};
</script>

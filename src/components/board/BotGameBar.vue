<template>
  <div
    v-if="visible"
    class="bot-game-bar row items-center justify-between no-wrap q-px-sm"
  >
    <div class="row items-center no-wrap overflow-hidden">
      <q-icon
        :name="gameEnded ? 'bot_off' : 'bot_on'"
        :color="thinking ? 'primary' : textColor"
        size="xs"
        class="q-mr-xs"
      />
      <div class="text-caption text-no-wrap ellipsis">
        <template v-if="thinking">
          {{ $t("botGame.thinking", { bot: botName }) }}
          <q-spinner-dots size="0.8em" class="q-ml-none" />
        </template>
        <template v-else-if="gameEnded">{{ $t("analysis.gameOver") }}</template>
        <template v-else>{{ $t("botGame.yourMove") }}</template>
      </div>
    </div>

    <div class="row items-center no-wrap">
      <q-btn
        :disable="!canTakeback"
        @click="takeback"
        icon="undo"
        :color="btnColor"
        dense
        flat
        size="sm"
      >
        <hint>{{ $t("botGame.takebackHint") }}</hint>
      </q-btn>
      <q-btn
        v-if="!gameEnded"
        :disable="thinking"
        @click="resign"
        icon="flag"
        :color="btnColor"
        dense
        flat
        size="sm"
      >
        <hint>{{ $t("botGame.resign") }}</hint>
      </q-btn>
      <q-btn
        @click="newGame"
        icon="refresh"
        :color="btnColor"
        dense
        flat
        size="sm"
      >
        <hint>{{ $t("botGame.newGame") }}</hint>
      </q-btn>
      <q-btn
        @click="stopBot"
        icon="bot_off"
        :color="btnColor"
        dense
        flat
        size="sm"
      >
        <hint>{{ $t("Stop Bot") }}</hint>
      </q-btn>
    </div>
  </div>
</template>

<script>
import { botGameState } from "../../bots/botGame";

// Status bar for games with a bot opponent (game.config.bot): shows whether
// the bot is thinking and offers the actions that only make sense against a
// bot — takeback, resign, rematch, stop. Rendered above the analysis toolbar
// in the Main layout's footer.
export default {
  name: "BotGameBar",
  computed: {
    visible() {
      return !this.$store.state.ui.embed && !!this.config.bot;
    },
    config() {
      return this.$store.state.game.config || {};
    },
    game() {
      return this.$store.state.game;
    },
    position() {
      return this.game.position;
    },
    thinking() {
      return botGameState.thinking;
    },
    humanPlayer() {
      return this.config.player;
    },
    botName() {
      return this.config.bot === "tiltak" ? "Tiltak" : "Topaz";
    },
    textColor() {
      return this.$store.state.ui.theme.secondaryDark
        ? "textLight"
        : "textDark";
    },
    btnColor() {
      return this.textColor;
    },
    isGameEnd() {
      return (
        this.position &&
        this.position.isGameEnd &&
        !this.position.isGameEndDefault
      );
    },
    gameEnded() {
      return this.isGameEnd || this.hasResultTag;
    },
    hasResultTag() {
      const result = this.game.ptn.tags.result;
      return !!result && result.text !== "0-0";
    },
    // A takeback restores the human's last decision point. Normally that is
    // the bot's reply plus the human's move before it; when the game ended on
    // the human's own move (their winning road), only that final move needs
    // to go. Takeback stays available after a rules-based game end so the
    // finish can be rolled back and play continued.
    canTakeback() {
      if (this.thinking || !this.position || this.position.nextPly) {
        return false;
      }
      if (!this.position.plyIsDone || ![1, 2].includes(this.humanPlayer)) {
        return false;
      }
      if (this.position.turn === this.humanPlayer) {
        return !!this.position.prevPly;
      }
      // Bot to move at the tip: only a human move sitting there finished the
      // game (otherwise the bot would be replying right now).
      return this.isGameEnd;
    },
  },
  methods: {
    takeback() {
      if (!this.canTakeback) {
        return;
      }
      // Deleting the tip flips the turn back to its mover. When that is the
      // bot, the human's move underneath must go too — otherwise the bot
      // would instantly reply again.
      const plyIDs = [this.position.ply.id];
      if (this.position.turn === this.humanPlayer && this.position.prevPly) {
        plyIDs.push(this.position.prevPly.id);
      }
      this.$store.dispatch("game/CANCEL_MOVE");
      // Both deletions land in the same tick, so the bot's move watcher
      // fires once, on the restored position — where it is the human's turn
      // and the bot stays idle.
      plyIDs.forEach((plyID) => {
        this.$store.dispatch("game/DELETE_PLY", plyID);
      });
    },
    resign() {
      const humanPlayer = this.humanPlayer;
      if (![1, 2].includes(humanPlayer)) {
        return;
      }
      this.$q
        .dialog({
          title: this.$t("botGame.resign"),
          message: this.$t("botGame.resignConfirm"),
          cancel: true,
          ok: this.$t("botGame.resign"),
          noBackdropDismiss: true,
        })
        .onOk(() => {
          // PTN result: the opponent wins by resignation ("R").
          const result = this.humanPlayer === 1 ? "0-R" : "R-0";
          this.$store.dispatch("game/SET_TAGS", { result });
          this.$store.dispatch("game/STOP_BOT");
          this.notify({
            message: this.$t("botGame.youResigned"),
            icon: "flag",
          });
        });
    },
    newGame() {
      this.$router.push({ name: "add", params: { tab: "vsbot" } });
    },
    stopBot() {
      this.$store.dispatch("game/STOP_BOT");
    },
  },
};
</script>

<style lang="scss">
.bot-game-bar {
  min-height: 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  body.body--dark & {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}
</style>

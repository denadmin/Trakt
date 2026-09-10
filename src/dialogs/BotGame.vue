<template>
  <small-dialog
    ref="dialog"
    :value="true"
    content-class="non-selectable"
    no-backdrop-dismiss
    v-bind="$attrs"
  >
    <template v-slot:header>
      <div class="text-subtitle1 q-px-md q-py-sm">{{ $t("Play vs Bot") }}</div>
    </template>

    <q-card>
      <bot-game-form
        ref="form"
        :continue-mode="continueMode"
        @can-start="canStart = $event"
        @started="onStarted"
      />
      <q-card-actions align="right">
        <q-btn
          v-if="continueMode && hasBot"
          :label="$t('Stop Bot')"
          color="negative"
          flat
          @click="stopBot"
        />
        <div class="col-grow" />
        <q-btn :label="$t('Cancel')" color="primary" flat @click="cancel" />
        <q-btn
          :label="$t('Start')"
          color="primary"
          flat
          :disable="!canStart"
          @click="start"
        />
      </q-card-actions>
    </q-card>
  </small-dialog>
</template>

<script>
import BotGameForm from "../components/controls/BotGameForm";

// Standalone "Play vs Bot" dialog, opened from the analysis toolbar to
// attach a bot to the current game (continue mode). Starting a fresh bot
// game lives in the Add Game dialog's "vs Bot" tab (same form component).
export default {
  name: "BotGame",
  components: { BotGameForm },
  data() {
    return {
      canStart: true,
    };
  },
  computed: {
    continueMode() {
      return this.$route.query.continue === "1";
    },
    hasBot() {
      return !!(this.$store.state.game.config || {}).bot;
    },
  },
  methods: {
    start() {
      this.$refs.form.start();
    },
    onStarted() {
      // Navigating away closes this route-driven dialog.
      this.$router.replace({ name: "local" });
    },
    stopBot() {
      this.$store.dispatch("game/STOP_BOT");
      this.$router.replace({ name: "local" });
    },
    cancel() {
      this.$router.replace({ name: "local" });
    },
  },
};
</script>

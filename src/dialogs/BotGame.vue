<template>
  <small-dialog
    ref="dialog"
    :value="true"
    content-class="non-selectable"
    no-backdrop-dismiss
    v-bind="$attrs"
  >
    <template v-slot:header>
      <div class="text-subtitle1 q-px-md q-py-sm">Play vs Bot</div>
    </template>

    <q-card>
      <q-card-section class="q-gutter-sm">
        <q-select
          v-model="engine"
          :options="engines"
          :label="$t('Engine')"
          emit-value
          map-options
          dense
          options-dense
        />
        <q-select
          v-model="size"
          :options="sizes"
          :label="$t('Size')"
          emit-value
          map-options
          dense
          options-dense
        />
        <q-input
          v-model.number="komi"
          type="number"
          :label="$t('Komi')"
          dense
        />
        <q-select
          v-model="humanPlayer"
          :options="sides"
          :label="$t('Play as')"
          emit-value
          map-options
          dense
          options-dense
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn :label="$t('Cancel')" color="primary" flat @click="cancel" />
        <q-btn :label="$t('Start')" color="primary" flat @click="start" />
      </q-card-actions>
    </q-card>
  </small-dialog>
</template>

<script>
import Game from "../Game";
import { uniqueName } from "../store/game/getters";

export default {
  name: "BotGame",
  components: {},
  data() {
    return {
      engine: "topaz",
      engines: [
        { label: "Topaz", value: "topaz" },
        { label: "Tiltak", value: "tiltak" },
      ],
      size: Number(this.$store.state.ui.size) || 6,
      sizes: [
        { label: "5 × 5", value: 5 },
        { label: "6 × 6", value: 6 },
      ],
      komi: Number(this.$store.state.ui.komi) || 0,
      humanPlayer: 1,
      sides: [
        { label: "White", value: 1 },
        { label: "Black", value: 2 },
      ],
    };
  },
  methods: {
    cancel() {
      this.$router.replace({ name: "local" });
    },
    start() {
      const size = Number(this.size) || 6;
      const komi = Number(this.komi) || 0;
      const bot = this.engine;
      const humanPlayer = Number(this.humanPlayer) || 1;
      const botPlayer = humanPlayer === 1 ? 2 : 1;
      const botLabel = bot === "topaz" ? "Topaz" : "Tiltak";
      const humanLabel = humanPlayer === 1 ? "White" : "Black";

      const name = uniqueName(this.$store.state.game)(`${botLabel} vs You`);
      const game = new Game({
        name,
        tags: {
          player1: humanPlayer === 1 ? "You" : botLabel,
          player2: humanPlayer === 1 ? botLabel : "You",
          size: String(size),
          komi: Number(komi),
          site: this.$t("site_name"),
        },
        config: { bot, botPlayer },
      });

      this.$store.dispatch("game/ADD_GAME", game).then(() => {
        this.$store.dispatch("ui/SET_UI", [
          "player1",
          humanPlayer === 1 ? "You" : botLabel,
        ]);
        this.$store.dispatch("ui/SET_UI", [
          "player2",
          humanPlayer === 1 ? botLabel : "You",
        ]);
        // Navigating away closes this route-driven dialog.
        this.$router.replace({ name: "local" });
      });
    },
  },
};
</script>

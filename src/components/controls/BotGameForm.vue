<template>
  <q-card-section class="q-gutter-sm">
    <q-banner v-if="continueMode" rounded dense class="bg-primary text-white">
      <template v-slot:avatar>
        <q-icon name="bot_on" />
      </template>
      {{ $t("Continue from current position") }}
    </q-banner>

    <q-select
      v-model="engine"
      :options="engineOptions"
      :label="$tc('Engine', 1)"
      emit-value
      map-options
      dense
      options-dense
    >
      <template v-slot:selected-item="scope">
        {{ scope.opt.label }}
      </template>
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label caption>{{ scope.opt.description }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-banner
      v-if="engineUnsupported"
      rounded
      dense
      class="bg-negative text-white"
    >
      {{
        $t("botGame.unsupportedSize", {
          engine: getEngine(engine).label,
          size: continueMode ? configSize : size,
        })
      }}
    </q-banner>

    <q-select
      v-model="strength"
      :options="strengthOptions"
      :label="$t('botGame.strength')"
      :hint="strengthHint"
      emit-value
      map-options
      dense
      options-dense
    />

    <template v-if="!continueMode">
      <q-select
        v-model="size"
        :options="sizeOptions"
        :label="$t('Size')"
        emit-value
        map-options
        dense
        options-dense
      />
      <q-select
        v-model="komi"
        :options="komiOptions"
        :label="$t('Komi')"
        emit-value
        map-options
        dense
        options-dense
      />
    </template>

    <q-field
      :label="$t('botGame.botPlays')"
      stack-label
      dense
      borderless
      class="q-pt-none"
    >
      <template v-slot:control>
        <div>
          <q-btn-toggle
            v-model="botPlayer"
            :options="sideOptions"
            no-caps
            dense
            unelevated
            toggle-color="primary"
            class="q-mt-xs"
          />
          <div v-if="continueHint" class="text-caption q-mt-xs">
            {{ continueHint }}
          </div>
        </div>
      </template>
    </q-field>
  </q-card-section>
</template>

<script>
import Game from "../../Game";
import { uniqueName } from "../../store/game/getters";
import {
  BOT_ENGINES,
  STRENGTHS,
  KOMI_CHOICES,
  getEngine,
  nearestSize,
  supportsSize,
  loadSettings,
  saveSettings,
} from "../../bots/botGame";

// The Play vs Bot setup fields, shared by the Add Game dialog's "vs Bot" tab
// and the standalone BotGame route dialog (continue mode). The side toggle
// selects which color the BOT plays.
export default {
  name: "BotGameForm",
  props: {
    continueMode: { type: Boolean, default: false },
  },
  data() {
    const settings = loadSettings(this.$q, {
      engine: "topaz",
      strength: "strong",
      size: Number(this.$store.state.ui.size) || 6,
      komi: Number(this.$store.state.ui.komi) || 0,
      botPlayer: 2,
    });
    // In continue mode the bot takes the waiting side by default, so the
    // human keeps playing the side to move; picking the side to move makes
    // the bot take that side over immediately.
    if (this.continueMode) {
      settings.botPlayer =
        3 - (Number(this.$store.state.game.position.turn) || 1);
    }
    return {
      engine: settings.engine,
      strength: settings.strength,
      size: nearestSize(settings.engine, settings.size),
      komi: Number(settings.komi) || 0,
      botPlayer: settings.botPlayer,
    };
  },
  computed: {
    engineOptions() {
      const options = Object.values(BOT_ENGINES).map((engine) => ({
        label: engine.label,
        value: engine.id,
        description: engine.description,
      }));
      if (!this.continueMode) {
        return options;
      }
      // Only offer engines that can actually play the open game's board.
      return options.filter((option) =>
        supportsSize(option.value, this.configSize)
      );
    },
    configSize() {
      return Number((this.$store.state.game.config || {}).size) || 6;
    },
    engineUnsupported() {
      return this.continueMode && !supportsSize(this.engine, this.configSize);
    },
    canStart() {
      return !this.engineUnsupported;
    },
    strengthOptions() {
      return STRENGTHS.map((strength) => ({
        label: this.$t("botGame.strengths." + strength.id),
        value: strength.id,
      }));
    },
    strengthHint() {
      const strength = STRENGTHS.find((s) => s.id === this.strength);
      return strength ? this.$t("botGame.strengthHints." + strength.id) : "";
    },
    sizeOptions() {
      const engine = getEngine(this.engine);
      return engine
        ? engine.sizes.map((size) => ({
            label: `${size} × ${size}`,
            value: size,
          }))
        : [];
    },
    komiOptions() {
      const engine = getEngine(this.engine);
      const komiMax = engine ? engine.komiMax : 2;
      return KOMI_CHOICES.filter((komi) => komi <= komiMax).map((komi) => ({
        label: String(komi),
        value: komi,
      }));
    },
    sideOptions() {
      return [
        { label: this.$t("White"), value: 1 },
        { label: this.$t("Random"), value: "random" },
        { label: this.$t("Black"), value: 2 },
      ];
    },
    continueHint() {
      if (!this.continueMode || this.botPlayer === "random") {
        return "";
      }
      const botLabel = getEngine(this.engine)
        ? getEngine(this.engine).label
        : "";
      const turn = Number(this.$store.state.game.position.turn) || 1;
      return this.botPlayer === turn
        ? this.$t("botGame.movesNow", { bot: botLabel })
        : this.$t("botGame.waitsForYou", { bot: botLabel });
    },
  },
  watch: {
    // Engines only support some board sizes; keep the selection valid when
    // the engine changes (e.g. Tiltak offers 4×4, Topaz doesn't).
    engine(engine) {
      if (!this.continueMode) {
        this.size = nearestSize(engine, this.size);
      }
    },
    // Let wrapper dialogs disable their Start button while invalid.
    canStart: {
      immediate: true,
      handler(value) {
        this.$emit("can-start", value);
      },
    },
  },
  methods: {
    getEngine,
    persistSettings() {
      saveSettings(this.$q, {
        engine: this.engine,
        strength: this.strength,
        size: this.size,
        komi: this.komi,
        botPlayer: this.botPlayer,
      });
    },
    resolveBotPlayer() {
      if (this.botPlayer !== "random") {
        return this.botPlayer;
      }
      return Math.random() < 0.5 ? 1 : 2;
    },
    // Starts (or continues, in continue mode) the game. Resolves once the
    // game is added / the bot attached; the caller closes the surrounding
    // dialog. Emits "started" so parents can also react without a ref.
    async start() {
      if (this.engineUnsupported) {
        return;
      }
      const botPlayer = this.resolveBotPlayer();
      if (this.continueMode) {
        this.persistSettings();
        await this.$store.dispatch("game/SET_BOT", {
          bot: this.engine,
          botPlayer,
          player: 3 - botPlayer,
          botStrength: this.strength,
        });
      } else {
        const engine = this.engine;
        const botLabel = getEngine(engine).label;
        const size = nearestSize(engine, this.size);
        const komi = Number(this.komi) || 0;
        const strength = this.strength;
        const humanPlayer = 3 - botPlayer;

        const name = uniqueName(this.$store.state.game)(
          humanPlayer === 1 ? `You vs ${botLabel}` : `${botLabel} vs You`
        );
        const game = new Game({
          name,
          tags: {
            player1: humanPlayer === 1 ? "You" : botLabel,
            player2: humanPlayer === 1 ? botLabel : "You",
            size: String(size),
            komi,
            site: this.$t("site_name"),
          },
          config: {
            bot: engine,
            botPlayer,
            player: humanPlayer,
            botStrength: strength,
          },
        });

        this.persistSettings();
        await this.$store.dispatch("game/ADD_GAME", game);
        this.$store.dispatch("ui/SET_UI", [
          "player1",
          humanPlayer === 1 ? "You" : botLabel,
        ]);
        this.$store.dispatch("ui/SET_UI", [
          "player2",
          humanPlayer === 1 ? botLabel : "You",
        ]);
        this.$store.dispatch("ui/SET_UI", ["size", String(size)]);
        this.$store.dispatch("ui/SET_UI", ["komi", komi]);
      }
      this.$emit("started");
    },
  },
};
</script>

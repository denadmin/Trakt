import Bot from "./bot";

const url = new URL("../topaz/topaz.worker.js", import.meta.url);

export default class TopazWasm extends Bot {
  constructor(options = {}) {
    super({
      id: "topaz",
      icon: "local",
      label: "analysis.engines.topaz",
      description: "analysis.engines_description.topaz",
      isInteractive: true,
      sizeHalfKomis: { 5: [0, 4], 6: [0, 4] },
      options: {
        MultiPV: { type: "spin", default: 5, min: 1, max: 8 },
      },
      settings: {
        limitTypes: ["depth", "movetime"],
        movetime: 5e3,
        depth: 12,
      },
      limitTypes: {
        movetime: {},
        depth: {},
      },
      ...options,
    });

    this.ready = false;
    this.readyWaiters = [];
    this.worker = null;

    this.init();
  }

  //#region send/receive
  send(message) {
    if (this.worker) {
      this.onSend(message);
      this.worker.postMessage(message);
    }
  }
  receive(message) {
    this.onReceive(message);
    if (message && message.ready) {
      this.ready = true;
      this.setState({ isReady: true });
      this.readyWaiters.forEach((resolve) => resolve());
      this.readyWaiters = [];
      return;
    }
    this.handleResponse(message);
  }

  // Resolves once the worker has finished loading the wasm engine.
  whenReady() {
    if (this.ready) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.readyWaiters.push(resolve));
  }

  //#region init
  init(force = false) {
    if (force || !this.worker) {
      try {
        this.worker = new Worker(url);
        this.ready = false;
        this.worker.onmessage = ({ data }) => {
          this.receive(data);
        };
        return true;
      } catch (error) {
        console.error("Failed to load Topaz (wasm):", error);
        return false;
      }
    }
  }

  //#region reset
  reset() {
    this.setState({ isReady: false });
    super.reset();
  }

  //#region searchPosition
  async searchPosition(size, halfKomi, tps, options) {
    // The generic Bot base forwards `(size, halfKomi, tps, plyID, isNewGame)`;
    // only the gameplay opponent passes a real options object here.
    options = options && typeof options === "object" ? options : {};
    await this.whenReady();
    return new Promise((resolve, reject) => {
      this.searchID = (this.searchID || 0) + 1;
      const query = {
        tps,
        size,
        komi: halfKomi / 2,
        movetime: 1e8,
        depth: 100,
        hash: this.getSettingsHash(),
        stream: this.isInteractiveEnabled,
        // One-shot analysis matches Tiltak, which only outputs a single PV
        // for "Analyze Position" (`go nodes` never emits multipv lines).
        // Multi-PV stays available in interactive mode.
        multipv:
          options.multipv != null
            ? options.multipv
            : this.isInteractiveEnabled
            ? this.getConfiguredMultiPvCount() || 1
            : 1,
        id: this.searchID,
      };
      // Set search limits
      this.settings.limitTypes.forEach((type) => {
        query[type] = this.settings[type];
      });

      this.onComplete = (results) => {
        // In interactive mode only "bestmove" finishes the search; "info"
        // messages stream live results instead.
        if (!this.isInteractiveEnabled || results.type === "bestmove") {
          this.onComplete = null;
          resolve(results);
        }
      };

      try {
        if (this.isInteractiveEnabled) {
          this.send({ stop: true });
        }
        this.send(query);
      } catch (error) {
        reject(error);
      }
    });
  }

  //#region handleResponse
  handleResponse(response) {
    if (response.error) {
      this.onError(response.error);
      return false;
    }

    // Ignore messages from a superseded search (e.g. a previous interactive
    // run that was stopped when the position changed).
    if (response.id !== undefined && response.id !== this.searchID) {
      return false;
    }

    if (response.type === "bestmove") {
      // Resolve with the most recent streamed result (with suggestions), like
      // a TEI engine's final info line, so callers can read suggestions/pv.
      const final = this._lastInteractiveResults || {
        hash: response.hash,
        tps: response.tps,
        suggestions: [],
      };
      this._lastInteractiveResults = null;
      if (this.isInteractiveEnabled) {
        // The interactive stream has no onSearchEnd (unlike one-shot
        // analyzePosition), so clear the running state here, matching the
        // TEI bot's bestmove handling.
        this.setState({ isRunning: false });
      }
      if (this.onComplete) {
        const cb = this.onComplete;
        this.onComplete = null;
        cb(final);
      }
      return true;
    }

    const { tps, depth, lines, hash, time } = response;
    if (!tps || !Array.isArray(lines)) return false;

    // Get player to move from TPS - score is from their perspective
    const initialPlayer = Number(tps.split(" ")[1]);
    const suggestions = lines.map((line) => {
      const rawEvaluation = Number(line.score);
      const hasScore = Number.isFinite(rawEvaluation);
      // Store the raw centipawn evaluation from player 1's perspective so the
      // full-game analyzer can compute per-move eval marks (like Tiltak does).
      const rawCp = hasScore
        ? rawEvaluation * (initialPlayer === 1 ? 1 : -1)
        : null;
      const evaluation = rawCp !== null ? rawCp : 0;
      return {
        pv: Array.isArray(line.pv) ? line.pv : [],
        depth: line.depth != null ? line.depth : depth,
        nodes: line.nodes,
        time,
        evaluation,
        rawCp,
      };
    });

    const results = {
      hash,
      tps,
      suggestions,
    };

    if (this.isInteractiveEnabled) {
      if (suggestions.some((s) => s.pv.length > 0)) {
        this._lastInteractiveResults = results;
        // Stream the live result to the analysis display.
        this.storeResults(results);
      }
    } else if (this.onComplete) {
      const cb = this.onComplete;
      this.onComplete = null;
      cb(results);
    }
    return results;
  }

  //#region terminate
  async terminate(state) {
    if (this.worker && this.state.isRunning) {
      try {
        await this.worker.terminate();
        this.onTerminate(state);
        this.worker = null;
        this.init();
      } catch (error) {
        this.onError(error);
      }
    }
  }
}

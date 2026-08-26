importScripts("./topaz_web.js");

const { evaluate, evaluate_multi } = wasm_bindgen;

async function init_wasm_in_worker() {
  await wasm_bindgen({ module_or_path: "./topaz_web_bg.wasm" });

  const { TopazEngine } = wasm_bindgen;

  let engine = null;
  let lastSize = null;
  let lastKomi = null;
  let stopRequested = false;
  let running = false;

  const getEngine = (size, komi) => {
    if (!engine || lastSize !== size || lastKomi !== komi) {
      if (engine) engine.free();
      engine = new TopazEngine(size, komi, 32);
      lastSize = size;
      lastKomi = komi;
    }
    return engine;
  };

  const parseInfoLine = (line) => {
    const m = String(line).match(
      /^info depth (\d+)(?: multipv (\d+))? score cp (-?\d+) nodes (\d+) pv (.+)/
    );
    if (!m) return null;
    return {
      score: Number(m[3]),
      depth: Number(m[1]),
      nodes: Number(m[4]),
      pv: m[5].trim().split(/\s+/),
    };
  };

  // Lightweight streaming search: persistent engine, one depth at a time with
  // a modest node budget, posting an "info" message (with wall time) per depth
  // and yielding between depths so new messages can interrupt promptly.
  const streamSearch = async (options) => {
    while (running) {
      stopRequested = true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    stopRequested = false;
    running = true;
    try {
      const eng = getEngine(options.size, Math.round(options.komi || 0));
      eng.set_position_tps(options.tps);
      // Interactive streaming must stay responsive: cap both the depth and the
      // per-depth node budget so a full sweep stays in a few seconds. The
      // engine keeps a persistent TT across depths, so results are still
      // progressively deeper and better than a single shallow search.
      const maxDepth = Math.min(options.depth || 12, 14);
      const multipv = Math.max(1, options.multipv || 1);
      const nodeBudget = BigInt(Math.max(1000, 20000 * multipv));
      for (let d = 1; d <= maxDepth; d++) {
        const t0 = performance.now();
        let json;
        if (multipv > 1) {
          json = eng.search_multi(d, nodeBudget, multipv);
        } else {
          json = eng.search(d, nodeBudget);
        }
        const time = Math.max(1, Math.round(performance.now() - t0));
        let r = {};
        try {
          r = JSON.parse(json);
        } catch (_) {}
        let lines;
        if (multipv > 1) {
          lines = Array.isArray(r) && r.length ? r : null;
        } else {
          lines =
            r && (r.best || Array.isArray(r.pv))
              ? [{ score: r.score, depth: r.depth, nodes: r.nodes, pv: Array.isArray(r.pv) ? r.pv : [] }]
              : null;
        }
        if (!lines) {
          break;
        }
        self.postMessage({
          type: "info",
          id: options.id,
          tps: options.tps,
          size: options.size,
          depth: lines[0].depth != null ? lines[0].depth : d,
          nodes: lines[0].nodes,
          time,
          lines,
          hash: options.hash,
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (stopRequested) break;
      }
    } finally {
      running = false;
      self.postMessage({
        type: "bestmove",
        id: options.id,
        tps: options.tps,
        size: options.size,
        hash: options.hash,
      });
    }
  };

  self.onmessage = async ({ data: options }) => {
    try {
      if (!options) return;
      if (options.stop) {
        stopRequested = true;
        return;
      }
      if (options.stream) {
        await streamSearch(options);
        return;
      }
      // Interrupt any running stream before a one-shot evaluation.
      stopRequested = true;
      // Give the stream's current depth a moment to finish so messages don't
      // interleave while we block on the synchronous evaluation.
      await new Promise((resolve) => setTimeout(resolve, 60));
      const t0 = performance.now();
      const multipv = Math.max(1, options.multipv || 1);
      let lines;
      if (multipv > 1) {
        const result = evaluate_multi(
          options.depth,
          options.movetime / 1e3,
          options.size,
          options.komi,
          options.tps,
          multipv
        );
        lines = String(result)
          .split("\n")
          .map(parseInfoLine)
          .filter(Boolean);
        if (!lines.length) throw result;
      } else {
        const result = evaluate(
          options.depth,
          options.movetime / 1e3,
          options.size,
          options.komi,
          options.tps
        );
        lines = [parseInfoLine(result)].filter(Boolean);
        if (!lines.length) throw result;
      }
      const time = Math.max(1, Math.round(performance.now() - t0));
      self.postMessage({
        ...options,
        depth: lines[0].depth,
        nodes: lines[0].nodes,
        time,
        lines,
      });
    } catch (error) {
      self.postMessage({ error });
    }
  };

  self.postMessage({ ready: true });
}

init_wasm_in_worker();

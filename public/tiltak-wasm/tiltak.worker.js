importScripts("./tiltak_wasm.js");

const { start_engine } = wasm_bindgen;

// The wasm engine loads asynchronously; commands posted before it is ready
// used to be dropped because `onmessage` was only installed inside
// init_wasm_in_worker()'s .then(). Dropping `teinewgame` left the engine in
// its outer loop, where a later `position`/`go` hit the "Unknown command"
// arm and process::exit(1) — a wasm trap that killed the worker. Buffer
// commands here and flush them once the engine is up (like Topaz's
// `whenReady()` does on the JS side).
let send = null;
const pending = [];

self.onmessage = ({ data }) => {
  if (send) {
    send(data);
  } else {
    pending.push(data);
  }
};

function init_wasm_in_worker() {
  // Object form, not a bare path: wasm-bindgen deprecated positional args
  // to the init function and warns on every load otherwise.
  return wasm_bindgen({ module_or_path: "./tiltak_wasm_bg.wasm" }).then(() => {
    const callback = start_engine((result) => {
      self.postMessage(result);
    });

    callback("tei");

    send = callback;
    pending.splice(0).forEach((data) => callback(data));
  });
}

init_wasm_in_worker();

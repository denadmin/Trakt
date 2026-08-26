declare namespace wasm_bindgen {
    /* tslint:disable */
    /* eslint-disable */

    /**
     * Starts the TEI engine.
     *
     * `callback` is invoked with each output line (e.g. `info ...`, `bestmove ...`,
     * `readyok`). The returned function accepts TEI command strings.
     */
    export function start_engine(callback: Function): Function;

}
declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly start_engine: (a: any) => any;
    readonly wasm_bindgen_2f31660b723adcb7___convert__closures_____invoke___wasm_bindgen_2f31660b723adcb7___JsValue__core_f0fd674eaa06beef___result__Result_____wasm_bindgen_2f31660b723adcb7___JsError___true_: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen_2f31660b723adcb7___convert__closures_____invoke___wasm_bindgen_2f31660b723adcb7___JsValue______true_: (a: number, b: number, c: any) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
declare function wasm_bindgen (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

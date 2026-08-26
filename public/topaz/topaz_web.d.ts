declare namespace wasm_bindgen {
    /* tslint:disable */
    /* eslint-disable */

    export class TopazEngine {
        free(): void;
        [Symbol.dispose](): void;
        /**
         * Applies a legal move directly. The caller must guarantee it is legal.
         */
        apply_move(ptn: string): void;
        /**
         * Applies a PTN move. Returns `false` if the move is illegal or unparseable.
         */
        apply_ptn(ptn: string): boolean;
        /**
         * `none` while the game continues, else the winner: `white` / `black` / `draw`.
         */
        game_over(): string;
        /**
         * All legal moves as space-separated PTN.
         */
        legal_moves(): string;
        move_num(): number;
        /**
         * Creates a new engine for a 5x5 or 6x6 board.
         *
         * `komi` is expressed in half-flat units (0 = none). `hash_mb` is the
         * transposition table size in megabytes.
         */
        constructor(size: number, komi: number, hash_mb: number);
        /**
         * Starts a fresh game on the configured board size.
         */
        reset(): void;
        /**
         * Runs a search to the given depth and returns JSON with the result:
         * `{"best","score","depth","nodes","pv":[...]}`. Score is from the
         * side-to-move's perspective in centipawns.
         */
        search(depth: number, max_nodes: bigint): string;
        /**
         * Replaces the position from a TPS string (e.g. `x6/... 1 1`).
         * Clears the transposition table.
         */
        set_position_tps(tps: string): void;
        side_to_move(): string;
        size(): number;
        /**
         * Board in TPS notation.
         */
        tps(): string;
    }

    /**
     * One-shot analysis helper matching the interface expected by PTN Ninja's
     * worker: search a TPS position for `depth` plies within `movetime_secs`
     * seconds and return a single line in TEI-ish format:
     * `info depth {d} score cp {cp} nodes {n} pv {moves...}`.
     */
    export function evaluate(depth: number, movetime_secs: number, size: number, komi: number, tps: string): string;

}
declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_topazengine_free: (a: number, b: number) => void;
    readonly evaluate: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly topazengine_apply_move: (a: number, b: number, c: number) => void;
    readonly topazengine_apply_ptn: (a: number, b: number, c: number) => number;
    readonly topazengine_game_over: (a: number) => [number, number];
    readonly topazengine_legal_moves: (a: number) => [number, number];
    readonly topazengine_move_num: (a: number) => number;
    readonly topazengine_new: (a: number, b: number, c: number) => [number, number, number];
    readonly topazengine_reset: (a: number) => void;
    readonly topazengine_search: (a: number, b: number, c: bigint) => [number, number];
    readonly topazengine_set_position_tps: (a: number, b: number, c: number) => [number, number];
    readonly topazengine_side_to_move: (a: number) => [number, number];
    readonly topazengine_size: (a: number) => number;
    readonly topazengine_tps: (a: number) => [number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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

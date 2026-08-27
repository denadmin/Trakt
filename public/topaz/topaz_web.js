let wasm_bindgen = (function(exports) {
    let script_src;
    if (typeof document !== 'undefined' && document.currentScript !== null) {
        script_src = new URL(document.currentScript.src, location.href).toString();
    }

    class TopazEngine {
        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            TopazEngineFinalization.unregister(this);
            return ptr;
        }
        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_topazengine_free(ptr, 0);
        }
        /**
         * Applies a legal move directly. The caller must guarantee it is legal.
         * @param {string} ptn
         */
        apply_move(ptn) {
            const ptr0 = passStringToWasm0(ptn, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.topazengine_apply_move(this.__wbg_ptr, ptr0, len0);
        }
        /**
         * Applies a PTN move. Returns `false` if the move is illegal or unparseable.
         * @param {string} ptn
         * @returns {boolean}
         */
        apply_ptn(ptn) {
            const ptr0 = passStringToWasm0(ptn, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.topazengine_apply_ptn(this.__wbg_ptr, ptr0, len0);
            return ret !== 0;
        }
        /**
         * `none` while the game continues, else the winner: `white` / `black` / `draw`.
         * @returns {string}
         */
        game_over() {
            let deferred1_0;
            let deferred1_1;
            try {
                const ret = wasm.topazengine_game_over(this.__wbg_ptr);
                deferred1_0 = ret[0];
                deferred1_1 = ret[1];
                return getStringFromWasm0(ret[0], ret[1]);
            } finally {
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        }
        /**
         * All legal moves as space-separated PTN.
         * @returns {string}
         */
        legal_moves() {
            let deferred1_0;
            let deferred1_1;
            try {
                const ret = wasm.topazengine_legal_moves(this.__wbg_ptr);
                deferred1_0 = ret[0];
                deferred1_1 = ret[1];
                return getStringFromWasm0(ret[0], ret[1]);
            } finally {
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        }
        /**
         * @returns {number}
         */
        move_num() {
            const ret = wasm.topazengine_move_num(this.__wbg_ptr);
            return ret >>> 0;
        }
        /**
         * Creates a new engine for a 5x5 or 6x6 board.
         *
         * `komi` is expressed in half-flat units (0 = none). `hash_mb` is the
         * transposition table size in megabytes.
         * @param {number} size
         * @param {number} komi
         * @param {number} hash_mb
         */
        constructor(size, komi, hash_mb) {
            const ret = wasm.topazengine_new(size, komi, hash_mb);
            if (ret[2]) {
                throw takeFromExternrefTable0(ret[1]);
            }
            this.__wbg_ptr = ret[0];
            TopazEngineFinalization.register(this, this.__wbg_ptr, this);
            return this;
        }
        /**
         * Starts a fresh game on the configured board size.
         */
        reset() {
            wasm.topazengine_reset(this.__wbg_ptr);
        }
        /**
         * Runs a search to the given depth and returns JSON with the result:
         * `{"best","score","depth","nodes","pv":[...]}`. Score is from the
         * side-to-move's perspective in centipawns.
         * @param {number} depth
         * @param {bigint} max_nodes
         * @returns {string}
         */
        search(depth, max_nodes) {
            let deferred1_0;
            let deferred1_1;
            try {
                const ret = wasm.topazengine_search(this.__wbg_ptr, depth, max_nodes);
                deferred1_0 = ret[0];
                deferred1_1 = ret[1];
                return getStringFromWasm0(ret[0], ret[1]);
            } finally {
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        }
        /**
         * Runs a multi-PV search and returns a JSON array of the top `num_pvs`
         * principal variations (best first):
         * `[{"score":S,"depth":D,"nodes":N,"pv":[...]}, ...]`. Scores are from
         * the side-to-move's perspective in centipawns.
         * @param {number} depth
         * @param {bigint} max_nodes
         * @param {number} num_pvs
         * @returns {string}
         */
        search_multi(depth, max_nodes, num_pvs) {
            let deferred1_0;
            let deferred1_1;
            try {
                const ret = wasm.topazengine_search_multi(this.__wbg_ptr, depth, max_nodes, num_pvs);
                deferred1_0 = ret[0];
                deferred1_1 = ret[1];
                return getStringFromWasm0(ret[0], ret[1]);
            } finally {
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        }
        /**
         * Replaces the position from a TPS string (e.g. `x6/... 1 1`).
         * Clears the transposition table.
         * @param {string} tps
         */
        set_position_tps(tps) {
            const ptr0 = passStringToWasm0(tps, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.topazengine_set_position_tps(this.__wbg_ptr, ptr0, len0);
            if (ret[1]) {
                throw takeFromExternrefTable0(ret[0]);
            }
        }
        /**
         * @returns {string}
         */
        side_to_move() {
            let deferred1_0;
            let deferred1_1;
            try {
                const ret = wasm.topazengine_side_to_move(this.__wbg_ptr);
                deferred1_0 = ret[0];
                deferred1_1 = ret[1];
                return getStringFromWasm0(ret[0], ret[1]);
            } finally {
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        }
        /**
         * @returns {number}
         */
        size() {
            const ret = wasm.topazengine_size(this.__wbg_ptr);
            return ret >>> 0;
        }
        /**
         * Board in TPS notation.
         * @returns {string}
         */
        tps() {
            let deferred1_0;
            let deferred1_1;
            try {
                const ret = wasm.topazengine_tps(this.__wbg_ptr);
                deferred1_0 = ret[0];
                deferred1_1 = ret[1];
                return getStringFromWasm0(ret[0], ret[1]);
            } finally {
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        }
    }
    if (Symbol.dispose) TopazEngine.prototype[Symbol.dispose] = TopazEngine.prototype.free;
    exports.TopazEngine = TopazEngine;

    /**
     * One-shot analysis helper matching the interface expected by Trakt's
     * worker: search a TPS position for `depth` plies within `movetime_secs`
     * seconds and return a single line in TEI-ish format:
     * `info depth {d} score cp {cp} nodes {n} pv {moves...}`.
     * @param {number} depth
     * @param {number} movetime_secs
     * @param {number} size
     * @param {number} komi
     * @param {string} tps
     * @returns {string}
     */
    function evaluate(depth, movetime_secs, size, komi, tps) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(tps, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.evaluate(depth, movetime_secs, size, komi, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    exports.evaluate = evaluate;

    /**
     * One-shot multi-PV analysis matching the interface expected by Trakt's
     * worker: search a TPS position for `depth` plies within `movetime_secs`
     * seconds and return up to `num_pvs` lines, one per `info` line:
     * `info depth {d} multipv {i} score cp {cp} nodes {n} pv {moves...}`.
     * @param {number} depth
     * @param {number} movetime_secs
     * @param {number} size
     * @param {number} komi
     * @param {string} tps
     * @param {number} num_pvs
     * @returns {string}
     */
    function evaluate_multi(depth, movetime_secs, size, komi, tps, num_pvs) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(tps, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.evaluate_multi(depth, movetime_secs, size, komi, ptr0, len0, num_pvs);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    exports.evaluate_multi = evaluate_multi;
    function __wbg_get_imports() {
        const import0 = {
            __proto__: null,
            __wbg___wbindgen_debug_string_a57024b9c6e4a48b: function(arg0, arg1) {
                const ret = debugString(arg1);
                const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
                const len1 = WASM_VECTOR_LEN;
                getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
                getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
            },
            __wbg___wbindgen_is_undefined_6cff064c44e0d823: function(arg0) {
                const ret = arg0 === undefined;
                return ret;
            },
            __wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
                throw new Error(getStringFromWasm0(arg0, arg1));
            },
            __wbg_get_971a0c45d172643f: function() { return handleError(function (arg0, arg1) {
                const ret = Reflect.get(arg0, arg1);
                return ret;
            }, arguments); },
            __wbg_now_2283802bfbda617e: function(arg0) {
                const ret = arg0.now();
                return ret;
            },
            __wbg_static_accessor_GLOBAL_THIS_466428f93b4eaa76: function() {
                const ret = typeof globalThis === 'undefined' ? null : globalThis;
                return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
            },
            __wbg_static_accessor_GLOBAL_c7aea38d4de089bc: function() {
                const ret = typeof global === 'undefined' ? null : global;
                return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
            },
            __wbg_static_accessor_SELF_42d4fae05e59267a: function() {
                const ret = typeof self === 'undefined' ? null : self;
                return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
            },
            __wbg_static_accessor_WINDOW_e0db14a0eba6a812: function() {
                const ret = typeof window === 'undefined' ? null : window;
                return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
            },
            __wbindgen_cast_0000000000000001: function(arg0, arg1) {
                // Cast intrinsic for `Ref(String) -> Externref`.
                const ret = getStringFromWasm0(arg0, arg1);
                return ret;
            },
            __wbindgen_init_externref_table: function() {
                const table = wasm.__wbindgen_externrefs;
                const offset = table.grow(4);
                table.set(0, undefined);
                table.set(offset + 0, undefined);
                table.set(offset + 1, null);
                table.set(offset + 2, true);
                table.set(offset + 3, false);
            },
        };
        return {
            __proto__: null,
            "./topaz_wasm_bg.js": import0,
        };
    }

    const TopazEngineFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_topazengine_free(ptr, 1));

    function addToExternrefTable0(obj) {
        const idx = wasm.__externref_table_alloc();
        wasm.__wbindgen_externrefs.set(idx, obj);
        return idx;
    }

    function debugString(val) {
        // primitive types
        const type = typeof val;
        if (type == 'number' || type == 'boolean' || val == null) {
            return  `${val}`;
        }
        if (type == 'string') {
            return `"${val}"`;
        }
        if (type == 'symbol') {
            const description = val.description;
            if (description == null) {
                return 'Symbol';
            } else {
                return `Symbol(${description})`;
            }
        }
        if (type == 'function') {
            const name = val.name;
            if (typeof name == 'string' && name.length > 0) {
                return `Function(${name})`;
            } else {
                return 'Function';
            }
        }
        // objects
        if (Array.isArray(val)) {
            const length = val.length;
            let debug = '[';
            if (length > 0) {
                debug += debugString(val[0]);
            }
            for(let i = 1; i < length; i++) {
                debug += ', ' + debugString(val[i]);
            }
            debug += ']';
            return debug;
        }
        // Test for built-in
        const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
        let className;
        if (builtInMatches && builtInMatches.length > 1) {
            className = builtInMatches[1];
        } else {
            // Failed to match the standard '[object ClassName]'
            return toString.call(val);
        }
        if (className == 'Object') {
            // we're a user defined class or Object
            // JSON.stringify avoids problems with cycles, and is generally much
            // easier than looping through ownProperties of `val`.
            try {
                return 'Object(' + JSON.stringify(val) + ')';
            } catch (_) {
                return 'Object';
            }
        }
        // errors
        if (val instanceof Error) {
            return `${val.name}: ${val.message}\n${val.stack}`;
        }
        // TODO we could test for more things here, like `Set`s and `Map`s.
        return className;
    }

    let cachedDataViewMemory0 = null;
    function getDataViewMemory0() {
        if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
            cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
        }
        return cachedDataViewMemory0;
    }

    function getStringFromWasm0(ptr, len) {
        return decodeText(ptr >>> 0, len);
    }

    let cachedUint8ArrayMemory0 = null;
    function getUint8ArrayMemory0() {
        if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
            cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8ArrayMemory0;
    }

    function handleError(f, args) {
        try {
            return f.apply(this, args);
        } catch (e) {
            const idx = addToExternrefTable0(e);
            wasm.__wbindgen_exn_store(idx);
        }
    }

    function isLikeNone(x) {
        return x === undefined || x === null;
    }

    function passStringToWasm0(arg, malloc, realloc) {
        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length, 1) >>> 0;
            getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len, 1) >>> 0;

        const mem = getUint8ArrayMemory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }
        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
            const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
            const ret = cachedTextEncoder.encodeInto(arg, view);

            offset += ret.written;
            ptr = realloc(ptr, len, offset, 1) >>> 0;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    function takeFromExternrefTable0(idx) {
        const value = wasm.__wbindgen_externrefs.get(idx);
        wasm.__externref_table_dealloc(idx);
        return value;
    }

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    function decodeText(ptr, len) {
        return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
    }

    const cachedTextEncoder = new TextEncoder();

    if (!('encodeInto' in cachedTextEncoder)) {
        cachedTextEncoder.encodeInto = function (arg, view) {
            const buf = cachedTextEncoder.encode(arg);
            view.set(buf);
            return {
                read: arg.length,
                written: buf.length
            };
        };
    }

    let WASM_VECTOR_LEN = 0;

    let wasmModule, wasmInstance, wasm;
    function __wbg_finalize_init(instance, module) {
        wasmInstance = instance;
        wasm = instance.exports;
        wasmModule = module;
        cachedDataViewMemory0 = null;
        cachedUint8ArrayMemory0 = null;
        wasm.__wbindgen_start();
        return wasm;
    }

    async function __wbg_load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (!module.ok) {
                throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
            }

            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);
                } catch (e) {
                    const validResponse = expectedResponseType(module.type);

                    if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else { throw e; }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);
        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };
            } else {
                return instance;
            }
        }

        function expectedResponseType(type) {
            switch (type) {
                case 'basic': case 'cors': case 'default': return true;
            }
            return false;
        }
    }

    function initSync(module) {
        if (wasm !== undefined) return wasm;


        if (module !== undefined) {
            if (Object.getPrototypeOf(module) === Object.prototype) {
                ({module} = module)
            } else {
                console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
            }
        }

        const imports = __wbg_get_imports();
        if (!(module instanceof WebAssembly.Module)) {
            module = new WebAssembly.Module(module);
        }
        const instance = new WebAssembly.Instance(module, imports);
        return __wbg_finalize_init(instance, module);
    }

    async function __wbg_init(module_or_path) {
        if (wasm !== undefined) return wasm;


        if (module_or_path !== undefined) {
            if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
                ({module_or_path} = module_or_path)
            } else {
                console.warn('using deprecated parameters for the initialization function; pass a single object instead')
            }
        }

        if (module_or_path === undefined && script_src !== undefined) {
            module_or_path = script_src.replace(/\.js$/, "_bg.wasm");
        }
        const imports = __wbg_get_imports();

        if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
            module_or_path = fetch(module_or_path);
        }

        const { instance, module } = await __wbg_load(await module_or_path, imports);

        return __wbg_finalize_init(instance, module);
    }

    return Object.assign(__wbg_init, { initSync }, exports);
})({ __proto__: null });

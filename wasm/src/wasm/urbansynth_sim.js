let wasm;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

function logError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        let error = (function () {
            try {
                return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
            } catch(_) {
                return "<failed to stringify thrown value>";
            }
        }());
        console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
        throw e;
    }
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function _assertBoolean(n) {
    if (typeof(n) !== 'boolean') {
        throw new Error(`expected a boolean argument, found ${typeof(n)}`);
    }
}

function _assertNum(n) {
    if (typeof(n) !== 'number') throw new Error(`expected a number argument, found ${typeof(n)}`);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (typeof(arg) !== 'string') throw new Error(`expected a string argument, found ${typeof(arg)}`);

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
        const ret = encodeString(arg, view);
        if (ret.read !== arg.length) throw new Error('failed to pass whole string');
        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
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

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

export function main() {
    wasm.main();
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * @param {any} config
 */
export function init(config) {
    const ret = wasm.init(config);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function _assertBigInt(n) {
    if (typeof(n) !== 'bigint') throw new Error(`expected a bigint argument, found ${typeof(n)}`);
}
/**
 * @param {any} config
 * @param {bigint} seed
 */
export function init_with_seed(config, seed) {
    _assertBigInt(seed);
    const ret = wasm.init_with_seed(config, seed);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

export function tick() {
    wasm.tick();
}

/**
 * @returns {any}
 */
export function getAgentStates() {
    const ret = wasm.getAgentStates();
    return ret;
}

/**
 * @returns {any}
 */
export function getTrafficData() {
    const ret = wasm.getTrafficData();
    return ret;
}

export function start() {
    wasm.start();
}

export function pause() {
    wasm.pause();
}

/**
 * @param {number} multiplier
 */
export function setSpeed(multiplier) {
    wasm.setSpeed(multiplier);
}

/**
 * @returns {boolean}
 */
export function isRunning() {
    const ret = wasm.isRunning();
    return ret !== 0;
}

/**
 * @returns {number}
 */
export function getSimulationTime() {
    const ret = wasm.getSimulationTime();
    return ret;
}

/**
 * @returns {number}
 */
export function getAgentCount() {
    const ret = wasm.getAgentCount();
    return ret >>> 0;
}

/**
 * @returns {bigint}
 */
export function getSeed() {
    const ret = wasm.getSeed();
    return BigInt.asUintN(64, ret);
}

const AdaptiveScalerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_adaptivescaler_free(ptr >>> 0, 1));

export class AdaptiveScaler {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AdaptiveScaler.prototype);
        obj.__wbg_ptr = ptr;
        AdaptiveScalerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AdaptiveScalerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_adaptivescaler_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.adaptivescaler_new();
        this.__wbg_ptr = ret >>> 0;
        AdaptiveScalerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {PerformanceProfile} profile
     * @returns {AdaptiveScaler}
     */
    static new_with_profile(profile) {
        _assertClass(profile, PerformanceProfile);
        if (profile.__wbg_ptr === 0) {
            throw new Error('Attempt to use a moved value');
        }
        var ptr0 = profile.__destroy_into_raw();
        const ret = wasm.adaptivescaler_new_with_profile(ptr0);
        return AdaptiveScaler.__wrap(ret);
    }
    /**
     * @param {number} fps
     * @param {number} delta_time
     */
    update_fps(fps, delta_time) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.adaptivescaler_update_fps(this.__wbg_ptr, fps, delta_time);
    }
    /**
     * @param {boolean} enabled
     */
    set_scaling_enabled(enabled) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBoolean(enabled);
        wasm.adaptivescaler_set_scaling_enabled(this.__wbg_ptr, enabled);
    }
    /**
     * @param {number} max_agents
     */
    force_profile_update(max_agents) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(max_agents);
        wasm.adaptivescaler_force_profile_update(this.__wbg_ptr, max_agents);
    }
    /**
     * @returns {PerformanceProfile}
     */
    get_current_profile() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_get_current_profile(this.__wbg_ptr);
        return PerformanceProfile.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    get current_max_agents() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_current_max_agents(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get current_fps() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_current_fps(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get target_fps() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_target_fps(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get fps_stability() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_fps_stability(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get render_distance() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_render_distance(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    get scaling_enabled() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_scaling_enabled(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {number} fps
     */
    set_target_fps(fps) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.adaptivescaler_set_target_fps(this.__wbg_ptr, fps);
    }
    /**
     * @param {number} current_fps
     */
    update_fps_simple(current_fps) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.adaptivescaler_update_fps_simple(this.__wbg_ptr, current_fps);
    }
    /**
     * @returns {boolean}
     */
    should_adapt() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_should_adapt(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get_adaptation_direction() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.adaptivescaler_get_adaptation_direction(this.__wbg_ptr);
        return ret;
    }
}

const DeviceBenchmarkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_devicebenchmark_free(ptr >>> 0, 1));

export class DeviceBenchmark {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DeviceBenchmarkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_devicebenchmark_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.devicebenchmark_new();
        this.__wbg_ptr = ret >>> 0;
        DeviceBenchmarkFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    run_cpu_benchmark() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.devicebenchmark_run_cpu_benchmark(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} refresh_rate
     * @param {boolean} is_mobile
     * @param {number} memory_mb
     * @param {string} gpu_tier
     */
    set_device_info(refresh_rate, is_mobile, memory_mb, gpu_tier) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(refresh_rate);
        _assertBoolean(is_mobile);
        const ptr0 = passStringToWasm0(gpu_tier, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.devicebenchmark_set_device_info(this.__wbg_ptr, refresh_rate, is_mobile, memory_mb, ptr0, len0);
    }
    /**
     * @returns {PerformanceProfile}
     */
    generate_profile() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.devicebenchmark_generate_profile(this.__wbg_ptr);
        return PerformanceProfile.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    get cpu_score() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.devicebenchmark_cpu_score(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get refresh_rate() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.devicebenchmark_refresh_rate(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {boolean}
     */
    get is_mobile() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.devicebenchmark_is_mobile(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get memory_mb() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.devicebenchmark_memory_mb(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    get gpu_tier() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.devicebenchmark_gpu_tier(this.__wbg_ptr);
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
    run_cpu_test() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.devicebenchmark_run_cpu_test(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    test_memory_bandwidth() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.devicebenchmark_test_memory_bandwidth(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} cpu_score
     * @param {number} memory_mb
     * @param {number} refresh_rate
     * @returns {PerformanceProfile}
     */
    get_recommended_profile(cpu_score, memory_mb, refresh_rate) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(refresh_rate);
        const ret = wasm.devicebenchmark_get_recommended_profile(this.__wbg_ptr, cpu_score, memory_mb, refresh_rate);
        return PerformanceProfile.__wrap(ret);
    }
}

const PerformanceProfileFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_performanceprofile_free(ptr >>> 0, 1));

export class PerformanceProfile {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PerformanceProfile.prototype);
        obj.__wbg_ptr = ptr;
        PerformanceProfileFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PerformanceProfileFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_performanceprofile_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.performanceprofile_new();
        this.__wbg_ptr = ret >>> 0;
        PerformanceProfileFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {PerformanceProfile}
     */
    static auto_detect() {
        const ret = wasm.performanceprofile_auto_detect();
        return PerformanceProfile.__wrap(ret);
    }
    /**
     * @returns {PerformanceProfile}
     */
    static for_ultra_gaming() {
        const ret = wasm.performanceprofile_for_ultra_gaming();
        return PerformanceProfile.__wrap(ret);
    }
    /**
     * @returns {PerformanceProfile}
     */
    static for_high_end() {
        const ret = wasm.performanceprofile_for_high_end();
        return PerformanceProfile.__wrap(ret);
    }
    /**
     * @returns {PerformanceProfile}
     */
    static for_standard() {
        const ret = wasm.performanceprofile_for_standard();
        return PerformanceProfile.__wrap(ret);
    }
    /**
     * @returns {PerformanceProfile}
     */
    static for_mobile() {
        const ret = wasm.performanceprofile_for_mobile();
        return PerformanceProfile.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    get target_fps() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.performanceprofile_target_fps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get max_agents() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.performanceprofile_max_agents(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get render_distance() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.performanceprofile_render_distance(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get update_frequency() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.performanceprofile_update_frequency(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get lod_levels() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.performanceprofile_lod_levels(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {boolean}
     */
    get culling_enabled() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.performanceprofile_culling_enabled(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {number} value
     */
    set target_fps(value) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(value);
        wasm.performanceprofile_set_target_fps(this.__wbg_ptr, value);
    }
    /**
     * @param {number} value
     */
    set max_agents(value) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(value);
        wasm.performanceprofile_set_max_agents(this.__wbg_ptr, value);
    }
    /**
     * @param {number} value
     */
    set render_distance(value) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.performanceprofile_set_render_distance(this.__wbg_ptr, value);
    }
    /**
     * @param {number} value
     */
    set update_frequency(value) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(value);
        wasm.performanceprofile_set_update_frequency(this.__wbg_ptr, value);
    }
    /**
     * @param {number} value
     */
    set lod_levels(value) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(value);
        wasm.performanceprofile_set_lod_levels(this.__wbg_ptr, value);
    }
    /**
     * @param {boolean} value
     */
    set culling_enabled(value) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertBoolean(value);
        wasm.performanceprofile_set_culling_enabled(this.__wbg_ptr, value);
    }
}

const WasmAdaptiveScalerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmadaptivescaler_free(ptr >>> 0, 1));

export class WasmAdaptiveScaler {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAdaptiveScalerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmadaptivescaler_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.wasmadaptivescaler_new();
        this.__wbg_ptr = ret >>> 0;
        WasmAdaptiveScalerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} fps
     */
    set_target_fps(fps) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.wasmadaptivescaler_set_target_fps(this.__wbg_ptr, fps);
    }
    /**
     * @param {number} current_fps
     */
    update_fps(current_fps) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.wasmadaptivescaler_update_fps(this.__wbg_ptr, current_fps);
    }
    /**
     * @returns {boolean}
     */
    should_adapt() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.wasmadaptivescaler_should_adapt(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get_adaptation_direction() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.wasmadaptivescaler_get_adaptation_direction(this.__wbg_ptr);
        return ret;
    }
}

const WasmDeviceBenchmarkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmdevicebenchmark_free(ptr >>> 0, 1));

export class WasmDeviceBenchmark {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmDeviceBenchmarkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmdevicebenchmark_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.wasmdevicebenchmark_new();
        this.__wbg_ptr = ret >>> 0;
        WasmDeviceBenchmarkFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    run_cpu_test() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.wasmdevicebenchmark_run_cpu_test(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    test_memory_bandwidth() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.wasmdevicebenchmark_test_memory_bandwidth(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} cpu_score
     * @param {number} memory_mb
     * @param {number} refresh_rate
     * @returns {WasmPerformanceProfile}
     */
    get_recommended_profile(cpu_score, memory_mb, refresh_rate) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        _assertNum(refresh_rate);
        const ret = wasm.wasmdevicebenchmark_get_recommended_profile(this.__wbg_ptr, cpu_score, memory_mb, refresh_rate);
        return WasmPerformanceProfile.__wrap(ret);
    }
}

const WasmPerformanceProfileFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmperformanceprofile_free(ptr >>> 0, 1));

export class WasmPerformanceProfile {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPerformanceProfile.prototype);
        obj.__wbg_ptr = ptr;
        WasmPerformanceProfileFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPerformanceProfileFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmperformanceprofile_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.wasmperformanceprofile_new();
        this.__wbg_ptr = ret >>> 0;
        WasmPerformanceProfileFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    get target_fps() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.wasmperformanceprofile_target_fps(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get max_agents() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.wasmperformanceprofile_max_agents(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get render_distance() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.wasmperformanceprofile_render_distance(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get update_frequency() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.wasmperformanceprofile_update_frequency(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
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
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_Error_1f3748b298f99708 = function() { return logError(function (arg0, arg1) {
        const ret = Error(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_Number_577a493fc95ea223 = function() { return logError(function (arg0) {
        const ret = Number(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_2f8d426a20a307fe = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_f53f0647ceb9c567 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_crypto_574e78ad8b13b65f = function() { return logError(function (arg0) {
        const ret = arg0.crypto;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_done_4a7743b6f942c9f3 = function() { return logError(function (arg0) {
        const ret = arg0.done;
        _assertBoolean(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function() { return logError(function (arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_get_27b4bcbec57323ca = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_59c6316d15f9f1d0 = function() { return logError(function (arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getwithrefkey_1dc361bd10053bfe = function() { return logError(function (arg0, arg1) {
        const ret = arg0[arg1];
        return ret;
    }, arguments) };
    imports.wbg.__wbg_instanceof_ArrayBuffer_59339a3a6f0c10ea = function() { return logError(function (arg0) {
        let result;
        try {
            result = arg0 instanceof ArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        _assertBoolean(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_instanceof_Uint8Array_91f3c5adee7e6672 = function() { return logError(function (arg0) {
        let result;
        try {
            result = arg0 instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        _assertBoolean(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_isArray_bc2498eba6fcb71f = function() { return logError(function (arg0) {
        const ret = Array.isArray(arg0);
        _assertBoolean(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_isSafeInteger_6091d6e3ee1b65fd = function() { return logError(function (arg0) {
        const ret = Number.isSafeInteger(arg0);
        _assertBoolean(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_iterator_96378c3c9a17347c = function() { return logError(function () {
        const ret = Symbol.iterator;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_length_246fa1f85a0dea5b = function() { return logError(function (arg0) {
        const ret = arg0.length;
        _assertNum(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_length_904c0910ed998bf3 = function() { return logError(function (arg0) {
        const ret = arg0.length;
        _assertNum(ret);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_log_0b77512bbea53cbb = function() { return logError(function (arg0, arg1) {
        console.log(arg0, arg1);
    }, arguments) };
    imports.wbg.__wbg_log_60b4f64beafc1d37 = function() { return logError(function (arg0, arg1, arg2) {
        console.log(arg0, arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_log_f3c04200b995730f = function() { return logError(function (arg0) {
        console.log(arg0);
    }, arguments) };
    imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function() { return logError(function (arg0) {
        const ret = arg0.msCrypto;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_1930cbb8d9ffc31b = function() { return logError(function () {
        const ret = new Object();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_56407f99198feff7 = function() { return logError(function () {
        const ret = new Map();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() { return logError(function () {
        const ret = new Error();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_9190433fb67ed635 = function() { return logError(function (arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_e969dc3f68d25093 = function() { return logError(function () {
        const ret = new Array();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newnoargs_a81330f6e05d8aca = function() { return logError(function (arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithlength_ed0ee6c1edca86fc = function() { return logError(function (arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_next_2e6b37020ac5fe58 = function() { return handleError(function (arg0) {
        const ret = arg0.next();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_next_3de8f2669431a3ff = function() { return logError(function (arg0) {
        const ret = arg0.next;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_node_905d3e251edff8a2 = function() { return logError(function (arg0) {
        const ret = arg0.node;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_now_e3057dd824ca0191 = function() { return logError(function () {
        const ret = Date.now();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_process_dc0fbacc7c1c06f7 = function() { return logError(function (arg0) {
        const ret = arg0.process;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_prototypesetcall_c5f74efd31aea86b = function() { return logError(function (arg0, arg1, arg2) {
        Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
    }, arguments) };
    imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() { return handleError(function (arg0, arg1) {
        arg0.randomFillSync(arg1);
    }, arguments) };
    imports.wbg.__wbg_require_60cc747a6bc5215a = function() { return handleError(function () {
        const ret = module.require;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_31197016f65a6a19 = function() { return logError(function (arg0, arg1, arg2) {
        const ret = arg0.set(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_3f1d0b984ed272ed = function() { return logError(function (arg0, arg1, arg2) {
        arg0[arg1] = arg2;
    }, arguments) };
    imports.wbg.__wbg_set_d636a0463acf1dbc = function() { return logError(function (arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    }, arguments) };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function() { return logError(function (arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_static_accessor_GLOBAL_1f13249cc3acc96d = function() { return logError(function () {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_df7ae94b1e0ed6a3 = function() { return logError(function () {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_static_accessor_SELF_6265471db3b3c228 = function() { return logError(function () {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_static_accessor_WINDOW_16fb482f8ec52863 = function() { return logError(function () {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_subarray_a219824899e59712 = function() { return logError(function (arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_value_09d0b4eaab48b91d = function() { return logError(function (arg0) {
        const ret = arg0.value;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_versions_c01dfd4722a88165 = function() { return logError(function (arg0) {
        const ret = arg0.versions;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wbindgenbooleanget_59f830b1a70d2530 = function(arg0) {
        const v = arg0;
        const ret = typeof(v) === 'boolean' ? v : undefined;
        if (!isLikeNone(ret)) {
            _assertBoolean(ret);
        }
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_wbindgendebugstring_bb652b1bc2061b6d = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgenin_192b210aa1c401e9 = function(arg0, arg1) {
        const ret = arg0 in arg1;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbg_wbindgenisfunction_ea72b9d66a0e1705 = function(arg0) {
        const ret = typeof(arg0) === 'function';
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbg_wbindgenisobject_dfe064a121d87553 = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbg_wbindgenisstring_4b74e4111ba029e6 = function(arg0) {
        const ret = typeof(arg0) === 'string';
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbg_wbindgenisundefined_71f08a6ade4354e7 = function(arg0) {
        const ret = arg0 === undefined;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbg_wbindgenjsvallooseeq_9dd7bb4b95ac195c = function(arg0, arg1) {
        const ret = arg0 == arg1;
        _assertBoolean(ret);
        return ret;
    };
    imports.wbg.__wbg_wbindgennumberget_d855f947247a3fbc = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'number' ? obj : undefined;
        if (!isLikeNone(ret)) {
            _assertNum(ret);
        }
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_wbindgenstringget_43fe05afe34b0cb1 = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_wbindgenthrow_4c11a24fca429ccf = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function() { return logError(function (arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function() { return logError(function (arg0) {
        // Cast intrinsic for `U64 -> Externref`.
        const ret = BigInt.asUintN(64, arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_cast_cb9088102bce6b30 = function() { return logError(function (arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
        const ret = getArrayU8FromWasm0(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function() { return logError(function (arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('urbansynth_sim_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;

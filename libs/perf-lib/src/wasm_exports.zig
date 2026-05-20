// perf-lib/src/wasm_exports.zig
// WASM module: exported functions callable from JavaScript/Node.js
const std = @import("std");
const perf = @import("main.zig");

/// Hash a UTF-8 string in WASM (called from JS typed array)
export fn hash(ptr: [*]const u8, len: usize, seed: u32) u32 {
    return perf.xxhash32(ptr[0..len], seed);
}

/// Simple price scoring for ranking — combines recency and price signals.
/// score = (1.0 / (age_seconds / 3600 + 1)) * 1000 + (1.0 / (price + 1)) * 100
export fn score_listing(price_cents: u32, age_seconds: u32) f32 {
    const recency: f32 = 1000.0 / (@as(f32, @floatFromInt(age_seconds)) / 3600.0 + 1.0);
    const price_score: f32 = 100.0 / (@as(f32, @floatFromInt(price_cents)) / 100.0 + 1.0);
    return recency + price_score;
}

/// Levenshtein distance (typo tolerance for search)
export fn levenshtein(a_ptr: [*]const u8, a_len: usize,
                      b_ptr: [*]const u8, b_len: usize) u32 {
    // Static buffers — safe for WASM freestanding (no heap allocator)
    var dp0: [512]u32 = undefined;
    var dp1: [512]u32 = undefined;

    const a = a_ptr[0..@min(a_len, 511)];
    const b = b_ptr[0..@min(b_len, 511)];

    for (0..b.len + 1) |j| dp0[j] = @intCast(j);

    for (a, 0..) |ca, i| {
        dp1[0] = @intCast(i + 1);
        for (b, 0..) |cb, j| {
            const cost: u32 = if (ca == cb) 0 else 1;
            dp1[j + 1] = @min(dp1[j] + 1, @min(dp0[j + 1] + 1, dp0[j] + cost));
        }
        @memcpy(dp0[0..b.len+1], dp1[0..b.len+1]);
    }

    return dp0[b.len];
}

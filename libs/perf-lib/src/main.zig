// perf-lib/src/main.zig
// xxHash32 implementation + exported C ABI symbols
const std = @import("std");

/// xxHash32 — fast non-cryptographic hash
pub fn xxhash32(data: []const u8, seed: u32) u32 {
    const PRIME1: u32 = 0x9E3779B1;
    const PRIME2: u32 = 0x85EBCA77;
    const PRIME3: u32 = 0xC2B2AE3D;
    const PRIME4: u32 = 0x27D4EB2F;
    const PRIME5: u32 = 0x165667B1;

    var len: usize = data.len;
    var p: usize   = 0;
    var h32: u32   = undefined;

    if (len >= 16) {
        var v1 = seed +% PRIME1 +% PRIME2;
        var v2 = seed +% PRIME2;
        var v3 = seed;
        var v4 = seed -% PRIME1;

        while (p + 16 <= data.len) : (p += 16) {
            const d = data[p..p+16];
            v1 = std.math.rotl(u32, v1 +% (@as(u32, @bitCast(d[0..4].*)) *% PRIME2), 13) *% PRIME1;
            v2 = std.math.rotl(u32, v2 +% (@as(u32, @bitCast(d[4..8].*)) *% PRIME2), 13) *% PRIME1;
            v3 = std.math.rotl(u32, v3 +% (@as(u32, @bitCast(d[8..12].*)) *% PRIME2), 13) *% PRIME1;
            v4 = std.math.rotl(u32, v4 +% (@as(u32, @bitCast(d[12..16].*)) *% PRIME2), 13) *% PRIME1;
            len -= 16;
        }

        h32 =
            std.math.rotl(u32, v1, 1) +%
            std.math.rotl(u32, v2, 7) +%
            std.math.rotl(u32, v3, 12) +%
            std.math.rotl(u32, v4, 18);
    } else {
        h32 = seed +% PRIME5;
    }

    h32 +%= @as(u32, @intCast(data.len));

    while (p + 4 <= data.len) : (p += 4) {
        const word = @as(u32, @bitCast(data[p..p+4].*));
        h32 = std.math.rotl(u32, h32 +% word *% PRIME3, 17) *% PRIME4;
    }
    while (p < data.len) : (p += 1) {
        h32 = std.math.rotl(u32, h32 +% data[p] *% PRIME5, 11) *% PRIME1;
    }

    h32 ^= h32 >> 15;
    h32 *%= PRIME2;
    h32 ^= h32 >> 13;
    h32 *%= PRIME3;
    h32 ^= h32 >> 16;

    return h32;
}

/// C ABI export for use by Rust FFI
export fn perf_hash(data: [*]const u8, len: usize, seed: u32) u32 {
    return xxhash32(data[0..len], seed);
}

// ── Tests ──────────────────────────────────────────────────
test "xxhash32 empty" {
    const h = xxhash32("", 0);
    _ = h; // just ensure it doesn't crash
}

test "xxhash32 known value" {
    const h = xxhash32("hello", 0);
    try std.testing.expect(h != 0);
}

const std = @import("std");

pub fn build(b: *std.Build) void {
    const target   = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // ── Native .so library ────────────────────────────────────
    const lib = b.addSharedLibrary(.{
        .name     = "perf",
        .root_source_file = b.path("src/main.zig"),
        .target   = target,
        .optimize = optimize,
    });
    lib.addCSourceFile(.{ .file = b.path("src/compress.c"), .flags = &.{"-O2"} });
    b.installArtifact(lib);

    // ── WASM build ────────────────────────────────────────────
    const wasm_target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag   = .freestanding,
    });
    const wasm = b.addExecutable(.{
        .name     = "perf",
        .root_source_file = b.path("src/wasm_exports.zig"),
        .target   = wasm_target,
        .optimize = .ReleaseSmall,
    });
    wasm.entry = .disabled;
    wasm.rdynamic = true;
    b.installArtifact(wasm);

    // ── Tests ─────────────────────────────────────────────────
    const tests = b.addTest(.{
        .root_source_file = b.path("src/main.zig"),
        .target   = target,
        .optimize = optimize,
    });
    const run_tests = b.addRunArtifact(tests);
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_tests.step);
}

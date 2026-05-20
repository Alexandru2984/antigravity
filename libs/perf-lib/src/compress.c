// C helper for SIMD-accelerated gzip header check
#include <string.h>
#include <stdint.h>

/// Returns 1 if buffer starts with gzip magic bytes
int is_gzip(const unsigned char *buf, size_t len) {
    if (len < 2) return 0;
    return buf[0] == 0x1f && buf[1] == 0x8b;
}

/// Fast memcpy alias (linker-level, wraps built-in)
void *perf_memcpy(void *dst, const void *src, size_t n) {
    return memcpy(dst, src, n);
}

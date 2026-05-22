#include <drogon/drogon.h>
#include "ImageController.h"
#include <cstdlib>

namespace {
constexpr size_t kMaxRequestBodyBytes = 10 * 1024 * 1024;
constexpr int kDefaultHttpPort = 4004;
constexpr const char *kUploadTempPath = "/tmp/drogon-uploads";

int configuredHttpPort() {
    const char *raw = std::getenv("HTTP_PORT");
    if (raw == nullptr || raw[0] == '\0') {
        return kDefaultHttpPort;
    }

    char *end = nullptr;
    const long port = std::strtol(raw, &end, 10);
    if (*end != '\0' || port < 1 || port > 65535) {
        LOG_WARN << "Invalid HTTP_PORT=" << raw
                 << ", falling back to " << kDefaultHttpPort;
        return kDefaultHttpPort;
    }

    return static_cast<int>(port);
}
}

int main() {
    const auto port = configuredHttpPort();
    LOG_INFO << "Starting image-service on port " << port;
    drogon::app()
        .setClientMaxBodySize(kMaxRequestBodyBytes)
        .setClientMaxMemoryBodySize(kMaxRequestBodyBytes)
        .setUploadPath(kUploadTempPath)
        .addListener("0.0.0.0", port)
        .run();
    return 0;
}

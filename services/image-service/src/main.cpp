#include <drogon/drogon.h>
#include "ImageController.h"
#include <cstdlib>

namespace {
constexpr long kDefaultMaxUploadMb = 10;
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

size_t configuredMaxRequestBodyBytes() {
    const char *raw = std::getenv("MAX_UPLOAD_SIZE_MB");
    if (raw == nullptr || raw[0] == '\0') {
        return kDefaultMaxUploadMb * 1024 * 1024;
    }

    char *end = nullptr;
    const long megabytes = std::strtol(raw, &end, 10);
    if (*end != '\0' || megabytes < 1 || megabytes > 50) {
        LOG_WARN << "Invalid MAX_UPLOAD_SIZE_MB=" << raw
                 << ", falling back to " << kDefaultMaxUploadMb << " MB";
        return kDefaultMaxUploadMb * 1024 * 1024;
    }

    return static_cast<size_t>(megabytes) * 1024 * 1024;
}
}

int main() {
    const auto port = configuredHttpPort();
    const auto maxRequestBodyBytes = configuredMaxRequestBodyBytes();
    LOG_INFO << "Starting image-service on port " << port;
    drogon::app()
        .setClientMaxBodySize(maxRequestBodyBytes)
        .setClientMaxMemoryBodySize(maxRequestBodyBytes)
        .setUploadPath(kUploadTempPath)
        .addListener("0.0.0.0", port)
        .run();
    return 0;
}

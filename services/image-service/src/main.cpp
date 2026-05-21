#include <drogon/drogon.h>
#include "ImageController.h"

namespace {
constexpr size_t kMaxRequestBodyBytes = 10 * 1024 * 1024;
}

int main() {
    auto port = 4024;
    LOG_INFO << "Starting image-service on port " << port;
    drogon::app()
        .setClientMaxBodySize(kMaxRequestBodyBytes)
        .setClientMaxMemoryBodySize(kMaxRequestBodyBytes)
        .addListener("0.0.0.0", port)
        .run();
    return 0;
}

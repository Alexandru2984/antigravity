#include <drogon/drogon.h>
#include "ImageController.h"

int main() {
    // Load config from environment
    auto port = std::stoi(drogon::utils::getEnvOrDefault("PORT", "4024"));

    drogon::app()
        .addListener("0.0.0.0", port)
        .setThreadNum(8)
        .setLogLevel(trantor::Logger::kInfo)
        .setLogPath("./")
        .registerController<ImageController>()
        .run();

    return 0;
}

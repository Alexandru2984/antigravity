#include <drogon/drogon.h>
#include "ImageController.h"

int main() {
    auto port = 4024;
    LOG_INFO << "Starting image-service on port " << port;
    drogon::app()
        .addListener("0.0.0.0", port)
        .run();
    return 0;
}

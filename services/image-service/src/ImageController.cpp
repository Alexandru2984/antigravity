#include "ImageController.h"
#include "MinioClient.h"
#include "KafkaProducer.h"

#include <drogon/HttpController.h>
#include <drogon/utils/Utilities.h>
#include <vips/vips8>
#include <uuid/uuid.h>
#include <cstdlib>
#include <sstream>
#include <set>

static const std::set<std::string> ALLOWED_MIME = {
    "image/jpeg", "image/png", "image/webp"
};
static const size_t MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

static std::string generateUuid() {
    uuid_t uu;
    uuid_generate_random(uu);
    char buf[37];
    uuid_unparse_lower(uu, buf);
    return std::string(buf);
}

void ImageController::health(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    auto resp = drogon::HttpResponse::newHttpJsonResponse(
        Json::Value(R"({"status":"ok","service":"image-service"})"_json));
    callback(resp);
}

void ImageController::upload(
    const drogon::HttpRequestPtr &req,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback)
{
    auto files = req->getUploadFiles();
    if (files.empty()) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::HttpStatusCode::k400BadRequest);
        resp->setBody(R"({"error":"No file uploaded"})");
        callback(resp);
        return;
    }

    auto &file = files[0];

    // ── MIME type check ───────────────────────────────────────
    std::string mime = file.getContentType();
    if (ALLOWED_MIME.find(mime) == ALLOWED_MIME.end()) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::HttpStatusCode::k415UnsupportedMediaType);
        resp->setBody(R"({"error":"Only JPEG, PNG, WebP allowed"})");
        callback(resp);
        return;
    }

    // ── Size check ────────────────────────────────────────────
    if (file.fileContent().size() > MAX_SIZE_BYTES) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::HttpStatusCode::k413RequestEntityTooLarge);
        resp->setBody(R"({"error":"File exceeds 10MB limit"})");
        callback(resp);
        return;
    }

    auto uuid = generateUuid();

    // ── Resize with libvips ───────────────────────────────────
    // Save original bytes to a temp buffer and resize to 3 sizes
    const auto &data = file.fileContent();

    struct ResizeConfig { std::string suffix; int width; };
    static const std::vector<ResizeConfig> sizes = {
        {"thumb",  200},
        {"medium", 800},
        {"full",   1920},
    };

    MinioClient minio;
    Json::Value urls;

    for (auto &cfg : sizes) {
        try {
            VImage img = VImage::new_from_buffer(
                (void *)data.data(), data.size(),
                "",   // option string
                VImage::option()->set("access", VIPS_ACCESS_SEQUENTIAL)
            );

            int origWidth = img.width();
            int targetWidth = std::min(cfg.width, origWidth);
            double scale = (double)targetWidth / origWidth;

            VImage resized = img.resize(scale);

            void *outBuf = nullptr;
            size_t outSize = 0;
            resized.write_to_buffer(".webp", &outBuf, &outSize);

            std::string key = uuid + "/" + cfg.suffix + ".webp";
            minio.putObject("listings-images", key,
                            static_cast<const char *>(outBuf), outSize,
                            "image/webp");
            g_free(outBuf);

            auto minioUrl = minio.getPublicUrl("listings-images", key);
            urls[cfg.suffix] = minioUrl;
        } catch (VError &e) {
            LOG_ERROR << "libvips error: " << e.what();
        }
    }

    // ── Kafka event ───────────────────────────────────────────
    KafkaProducer kafka;
    kafka.publish("images.uploaded",
        R"({"image_id":")" + uuid + R"(","status":"uploaded"})");

    Json::Value resp;
    resp["image_id"] = uuid;
    resp["urls"]     = urls;

    callback(drogon::HttpResponse::newHttpJsonResponse(resp));
}

void ImageController::getImage(
    const drogon::HttpRequestPtr &,
    std::function<void(const drogon::HttpResponsePtr &)> &&callback,
    std::string uuid)
{
    MinioClient minio;
    auto url = minio.getPublicUrl("listings-images", uuid + "/full.webp");
    auto resp = drogon::HttpResponse::newRedirectionResponse(url);
    callback(resp);
}

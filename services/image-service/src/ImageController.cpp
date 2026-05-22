#include "ImageController.h"
#include "MinioClient.h"
#include <vips/vips8>
#include <algorithm>
#include <cstdint>
#include <cstdlib>
#include <string>
#include <uuid/uuid.h>

using namespace vips;

namespace {
constexpr size_t kMaxUploadBytes = 10 * 1024 * 1024;
constexpr int64_t kMaxImagePixels = 40'000'000;
constexpr int kTargetWidth = 800;
constexpr const char *kInternalServiceTokenHeader = "x-internal-service-token";

std::string imageBucket() {
    const char *bucket = std::getenv("IMAGE_BUCKET");
    return bucket != nullptr && std::string(bucket).length() > 0 ? bucket : "listings-images";
}

std::string publicPathPrefix() {
    const char *prefix = std::getenv("IMAGE_PUBLIC_PATH_PREFIX");
    return prefix != nullptr && std::string(prefix).length() > 0 ? prefix : "/api/v1/images";
}

std::string newImageKey() {
    uuid_t uuid;
    char out[37];
    uuid_generate_random(uuid);
    uuid_unparse_lower(uuid, out);
    return std::string(out) + ".webp";
}

drogon::HttpResponsePtr jsonError(const std::string &message, drogon::HttpStatusCode status) {
    Json::Value ret;
    ret["error"] = message;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
    resp->setStatusCode(status);
    return resp;
}

bool isAllowedImageContentType(drogon::ContentType contentType) {
    return contentType == drogon::CT_IMAGE_JPG ||
           contentType == drogon::CT_IMAGE_PNG ||
           contentType == drogon::CT_IMAGE_WEBP ||
           contentType == drogon::CT_IMAGE_AVIF;
}

bool hasAllowedImageSignature(std::string_view content) {
    const auto size = content.size();
    const auto *data = reinterpret_cast<const unsigned char *>(content.data());

    if (size >= 3 && data[0] == 0xff && data[1] == 0xd8 && data[2] == 0xff) {
        return true;
    }

    if (size >= 8 &&
        data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4e && data[3] == 0x47 &&
        data[4] == 0x0d && data[5] == 0x0a && data[6] == 0x1a && data[7] == 0x0a) {
        return true;
    }

    if (size >= 12 &&
        content.substr(0, 4) == "RIFF" &&
        content.substr(8, 4) == "WEBP") {
        return true;
    }

    if (size >= 12 &&
        content.substr(4, 4) == "ftyp" &&
        (content.substr(8, 4) == "avif" || content.substr(8, 4) == "avis")) {
        return true;
    }

    return false;
}

bool constantTimeEquals(std::string_view left, std::string_view right) {
    size_t diff = left.size() ^ right.size();
    const size_t maxLen = std::max(left.size(), right.size());

    for (size_t index = 0; index < maxLen; ++index) {
        const unsigned char leftChar = index < left.size() ? static_cast<unsigned char>(left[index]) : 0;
        const unsigned char rightChar = index < right.size() ? static_cast<unsigned char>(right[index]) : 0;
        diff |= leftChar ^ rightChar;
    }

    return diff == 0;
}

drogon::HttpResponsePtr validateInternalServiceToken(const drogon::HttpRequestPtr &req) {
    const char *expected = std::getenv("INTERNAL_SERVICE_TOKEN");
    if (expected == nullptr || std::string_view(expected).empty()) {
        return jsonError("INTERNAL_SERVICE_TOKEN is not configured", drogon::k500InternalServerError);
    }

    const auto provided = req->getHeader(kInternalServiceTokenHeader);
    if (provided.empty() || !constantTimeEquals(provided, expected)) {
        return jsonError("Unauthorized", drogon::k401Unauthorized);
    }

    return nullptr;
}
}

void ImageController::health(const drogon::HttpRequestPtr& req,
                            std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    Json::Value ret;
    ret["status"] = "ok";
    ret["service"] = "image-service";
    auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
    callback(resp);
}

void ImageController::upload(const drogon::HttpRequestPtr& req,
                            std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    if (auto authError = validateInternalServiceToken(req)) {
        callback(authError);
        return;
    }

    drogon::MultiPartParser fileUpload;
    if (fileUpload.parse(req) != 0 || fileUpload.getFiles().empty()) {
        callback(jsonError("No files uploaded", drogon::k400BadRequest));
        return;
    }

    auto &file = fileUpload.getFiles()[0];
    const auto content = file.fileContent();

    if (file.fileLength() == 0) {
        callback(jsonError("Uploaded file is empty", drogon::k400BadRequest));
        return;
    }

    if (file.fileLength() > kMaxUploadBytes) {
        callback(jsonError("Uploaded file exceeds 10 MB limit", drogon::k413RequestEntityTooLarge));
        return;
    }

    if (!isAllowedImageContentType(file.getContentType()) || !hasAllowedImageSignature(content)) {
        callback(jsonError("Only JPEG, PNG, WebP, and AVIF images are allowed", drogon::k415UnsupportedMediaType));
        return;
    }

    try {
        VImage img = VImage::new_from_buffer(
            content.data(),
            content.size(),
            "",
            VImage::option()
                ->set("access", VIPS_ACCESS_SEQUENTIAL)
                ->set("fail_on", VIPS_FAIL_ON_WARNING));

        const int width = img.width();
        const int height = img.height();
        if (width <= 0 || height <= 0) {
            callback(jsonError("Invalid image dimensions", drogon::k400BadRequest));
            return;
        }

        const int64_t pixels = static_cast<int64_t>(width) * static_cast<int64_t>(height);
        if (pixels > kMaxImagePixels) {
            callback(jsonError("Image dimensions exceed 40 megapixel limit", drogon::k413RequestEntityTooLarge));
            return;
        }

        double scale = std::min(1.0, static_cast<double>(kTargetWidth) / static_cast<double>(width));
        VImage resized = img.resize(scale, NULL);

        void *outBuf;
        size_t outSize;
        resized.write_to_buffer(".webp", &outBuf, &outSize, NULL);

        const std::string key = newImageKey();
        MinioClient minio;
        minio.putObject(imageBucket(), key, static_cast<const char *>(outBuf), outSize, "image/webp");
        g_free(outBuf);

        Json::Value ret;
        ret["id"] = key;
        ret["key"] = key;
        ret["url"] = publicPathPrefix() + "/" + key;
        ret["thumbnail"] = ret["url"];
        ret["medium"] = ret["url"];
        ret["width"] = resized.width();
        ret["height"] = resized.height();
        ret["size"] = Json::UInt64(outSize);
        ret["content_type"] = "image/webp";

        auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
        callback(resp);
    } catch (const std::exception &e) {
        callback(jsonError("Invalid or unsupported image", drogon::k400BadRequest));
    }
}

void ImageController::getImage(const drogon::HttpRequestPtr& req,
                              std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                              std::string uuid) {
    try {
        MinioClient minio;
        auto body = minio.getObject(imageBucket(), uuid);

        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setBody(std::string(body.data(), body.size()));
        resp->setContentTypeCode(drogon::CT_IMAGE_WEBP);
        resp->addHeader("Cache-Control", "public, max-age=31536000, immutable");
        callback(resp);
    } catch (const std::exception &e) {
        callback(jsonError("Image not found", drogon::k404NotFound));
    }
}

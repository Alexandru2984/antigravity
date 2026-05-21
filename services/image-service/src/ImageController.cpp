#include "ImageController.h"
#include <vips/vips8>
#include <algorithm>
#include <cstdint>
#include <string>

using namespace vips;

namespace {
constexpr size_t kMaxUploadBytes = 10 * 1024 * 1024;
constexpr int64_t kMaxImagePixels = 40'000'000;
constexpr int kTargetWidth = 800;

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

        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setBody(std::string((char*)outBuf, outSize));
        resp->setContentTypeCode(drogon::CT_IMAGE_WEBP);
        g_free(outBuf);
        callback(resp);
    } catch (const std::exception &e) {
        callback(jsonError("Invalid or unsupported image", drogon::k400BadRequest));
    }
}

void ImageController::getImage(const drogon::HttpRequestPtr& req,
                              std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                              std::string uuid) {
    Json::Value ret;
    ret["uuid"] = uuid;
    ret["message"] = "Image retrieval not yet implemented in storage";
    auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
    resp->setStatusCode(drogon::k501NotImplemented);
    callback(resp);
}

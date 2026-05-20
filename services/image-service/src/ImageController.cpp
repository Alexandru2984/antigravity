#include "ImageController.h"
#include <vips/vips8>
#include <fstream>

using namespace vips;

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
        Json::Value ret;
        ret["error"] = "No files uploaded";
        auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
        resp->setStatusCode(drogon::k400BadRequest);
        callback(resp);
        return;
    }

    auto &file = fileUpload.getFiles()[0];
    try {
        VImage img = VImage::new_from_buffer(file.fileContent().data(), file.fileContent().size(), NULL);
        
        int targetWidth = 800;
        double scale = (double)targetWidth / img.width();
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
        Json::Value ret;
        ret["error"] = e.what();
        auto resp = drogon::HttpResponse::newHttpJsonResponse(ret);
        resp->setStatusCode(drogon::k500InternalServerError);
        callback(resp);
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

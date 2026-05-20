#pragma once

#include <drogon/HttpController.h>
#include <string>

class ImageController : public drogon::HttpController<ImageController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ImageController::health,   "/health",         drogon::Get);
    ADD_METHOD_TO(ImageController::upload,   "/images/upload",  drogon::Post);
    ADD_METHOD_TO(ImageController::getImage, "/images/{uuid}",  drogon::Get);
    METHOD_LIST_END

    void health(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void upload(const drogon::HttpRequestPtr &req,
                std::function<void(const drogon::HttpResponsePtr &)> &&callback);

    void getImage(const drogon::HttpRequestPtr &req,
                  std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                  std::string uuid);
};

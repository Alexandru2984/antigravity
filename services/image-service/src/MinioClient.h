#pragma once
#include <string>

class MinioClient {
public:
    MinioClient();
    void putObject(const std::string &bucket, const std::string &key,
                   const char *data, size_t size, const std::string &contentType);
    std::string getPublicUrl(const std::string &bucket, const std::string &key);
private:
    std::string _endpoint;
    std::string _accessKey;
    std::string _secretKey;
};

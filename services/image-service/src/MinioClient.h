#pragma once
#include <string>
#include <vector>

class MinioClient {
public:
    MinioClient();
    void putObject(const std::string &bucket, const std::string &key,
                   const char *data, size_t size, const std::string &contentType);
    std::vector<char> getObject(const std::string &bucket, const std::string &key);
    std::string getPublicUrl(const std::string &bucket, const std::string &key);
private:
    std::string _endpoint;
    std::string _accessKey;
    std::string _secretKey;
};

#include "MinioClient.h"
#include <curl/curl.h>
#include <cstdlib>
#include <sstream>
#include <stdexcept>
#include <cstring>

MinioClient::MinioClient() {
    _endpoint  = std::getenv("MINIO_ENDPOINT")   ? std::getenv("MINIO_ENDPOINT")   : "http://minio:9000";
    _accessKey = std::getenv("MINIO_ACCESS_KEY")  ? std::getenv("MINIO_ACCESS_KEY") : "minioadmin";
    _secretKey = std::getenv("MINIO_SECRET_KEY")  ? std::getenv("MINIO_SECRET_KEY") : "minioadmin";
}

void MinioClient::putObject(const std::string &bucket, const std::string &key,
                             const char *data, size_t size, const std::string &contentType) {
    CURL *curl = curl_easy_init();
    if (!curl) throw std::runtime_error("curl_easy_init failed");

    std::string url = _endpoint + "/" + bucket + "/" + key;

    struct curl_slist *headers = nullptr;
    headers = curl_slist_append(headers, ("Content-Type: " + contentType).c_str());

    curl_easy_setopt(curl, CURLOPT_URL,            url.c_str());
    curl_easy_setopt(curl, CURLOPT_UPLOAD,         1L);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER,     headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE,  (long)size);
    curl_easy_setopt(curl, CURLOPT_READDATA,       data);
    curl_easy_setopt(curl, CURLOPT_USERNAME,       _accessKey.c_str());
    curl_easy_setopt(curl, CURLOPT_PASSWORD,       _secretKey.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPAUTH,       CURLAUTH_AWS_SIGV4);
    curl_easy_setopt(curl, CURLOPT_AWS_SIGV4,      "aws:amz:us-east-1:s3");

    CURLcode res = curl_easy_perform(curl);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        throw std::runtime_error(std::string("MinioClient upload failed: ") + curl_easy_strerror(res));
    }
}

std::string MinioClient::getPublicUrl(const std::string &bucket, const std::string &key) {
    return _endpoint + "/" + bucket + "/" + key;
}

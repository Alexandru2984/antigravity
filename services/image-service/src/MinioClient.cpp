#include "MinioClient.h"
#include <curl/curl.h>
#include <cstdlib>
#include <algorithm>
#include <sstream>
#include <stdexcept>
#include <cstring>
#include <vector>

namespace {
struct UploadBuffer {
    const char *data;
    size_t size;
    size_t offset;
};

size_t readUpload(char *buffer, size_t size, size_t nitems, void *userdata) {
    auto *upload = static_cast<UploadBuffer *>(userdata);
    const size_t capacity = size * nitems;
    const size_t remaining = upload->size - upload->offset;
    const size_t bytesToCopy = std::min(capacity, remaining);

    if (bytesToCopy > 0) {
        std::memcpy(buffer, upload->data + upload->offset, bytesToCopy);
        upload->offset += bytesToCopy;
    }

    return bytesToCopy;
}

size_t writeDownload(char *ptr, size_t size, size_t nmemb, void *userdata) {
    auto *out = static_cast<std::vector<char> *>(userdata);
    const size_t bytes = size * nmemb;
    out->insert(out->end(), ptr, ptr + bytes);
    return bytes;
}

std::string requireEnv(const char *name) {
    const char *value = std::getenv(name);
    if (value == nullptr || std::strlen(value) == 0) {
        throw std::runtime_error(std::string(name) + " is required");
    }
    return value;
}
}

MinioClient::MinioClient() {
    _endpoint = std::getenv("MINIO_ENDPOINT") ? std::getenv("MINIO_ENDPOINT") : "http://minio:9000";
    _accessKey = requireEnv("MINIO_ACCESS_KEY");
    _secretKey = requireEnv("MINIO_SECRET_KEY");
}

void MinioClient::putObject(const std::string &bucket, const std::string &key,
                             const char *data, size_t size, const std::string &contentType) {
    CURL *curl = curl_easy_init();
    if (!curl) throw std::runtime_error("curl_easy_init failed");

    std::string url = _endpoint + "/" + bucket + "/" + key;
    UploadBuffer upload{data, size, 0};

    struct curl_slist *headers = nullptr;
    headers = curl_slist_append(headers, ("Content-Type: " + contentType).c_str());

    curl_easy_setopt(curl, CURLOPT_URL,            url.c_str());
    curl_easy_setopt(curl, CURLOPT_UPLOAD,         1L);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER,     headers);
    curl_easy_setopt(curl, CURLOPT_INFILESIZE_LARGE, (curl_off_t)size);
    curl_easy_setopt(curl, CURLOPT_READFUNCTION,   readUpload);
    curl_easy_setopt(curl, CURLOPT_READDATA,       &upload);
    curl_easy_setopt(curl, CURLOPT_USERNAME,       _accessKey.c_str());
    curl_easy_setopt(curl, CURLOPT_PASSWORD,       _secretKey.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPAUTH,       CURLAUTH_AWS_SIGV4);
    curl_easy_setopt(curl, CURLOPT_AWS_SIGV4,      "aws:amz:us-east-1:s3");

    CURLcode res = curl_easy_perform(curl);
    long status = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &status);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        throw std::runtime_error(std::string("MinioClient upload failed: ") + curl_easy_strerror(res));
    }

    if (status < 200 || status >= 300) {
        throw std::runtime_error("MinioClient upload returned HTTP " + std::to_string(status));
    }
}

std::vector<char> MinioClient::getObject(const std::string &bucket, const std::string &key) {
    CURL *curl = curl_easy_init();
    if (!curl) throw std::runtime_error("curl_easy_init failed");

    std::vector<char> body;
    std::string url = _endpoint + "/" + bucket + "/" + key;

    curl_easy_setopt(curl, CURLOPT_URL,            url.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION,  writeDownload);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA,      &body);
    curl_easy_setopt(curl, CURLOPT_USERNAME,       _accessKey.c_str());
    curl_easy_setopt(curl, CURLOPT_PASSWORD,       _secretKey.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPAUTH,       CURLAUTH_AWS_SIGV4);
    curl_easy_setopt(curl, CURLOPT_AWS_SIGV4,      "aws:amz:us-east-1:s3");

    CURLcode res = curl_easy_perform(curl);
    long status = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &status);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        throw std::runtime_error(std::string("MinioClient download failed: ") + curl_easy_strerror(res));
    }

    if (status < 200 || status >= 300) {
        throw std::runtime_error("MinioClient download returned HTTP " + std::to_string(status));
    }

    return body;
}

std::string MinioClient::getPublicUrl(const std::string &bucket, const std::string &key) {
    return _endpoint + "/" + bucket + "/" + key;
}

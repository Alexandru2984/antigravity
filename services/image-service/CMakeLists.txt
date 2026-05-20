cmake_minimum_required(VERSION 3.16)
project(image-service)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon REQUIRED)
find_package(PkgConfig REQUIRED)

pkg_check_modules(VIPS REQUIRED vips-cpp)
pkg_check_modules(UUID REQUIRED uuid)

add_executable(image-service
    src/main.cpp
    src/ImageController.cpp
    src/MinioClient.cpp
    src/KafkaProducer.cpp
)

target_include_directories(image-service PRIVATE
    ${VIPS_INCLUDE_DIRS}
    src/
)

target_link_libraries(image-service PRIVATE
    Drogon::Drogon
    ${VIPS_LIBRARIES}
    ${UUID_LIBRARIES}
    rdkafka
    rdkafka++
    curl
)

target_compile_options(image-service PRIVATE ${VIPS_CFLAGS_OTHER})

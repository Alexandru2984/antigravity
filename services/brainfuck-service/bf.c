#include <arpa/inet.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define MAX_REQUEST_BYTES 16384
#define MAX_BODY_BYTES 8192
#define CELL_COUNT 30000

static char *read_program(const char *path) {
    FILE *file = fopen(path, "r");
    if (file == NULL) {
        return NULL;
    }

    fseek(file, 0, SEEK_END);
    long size = ftell(file);
    fseek(file, 0, SEEK_SET);

    char *code = calloc((size_t)size + 1, 1);
    if (code == NULL) {
        fclose(file);
        return NULL;
    }

    size_t read = fread(code, 1, (size_t)size, file);
    fclose(file);
    if (read != (size_t)size) {
        free(code);
        return NULL;
    }
    return code;
}

static int run_brainfuck(
    const char *code,
    const unsigned char *input,
    size_t input_len,
    unsigned char *output,
    size_t output_cap,
    size_t *output_len) {
    unsigned char cells[CELL_COUNT] = {0};
    size_t ptr = 0;
    size_t in_pos = 0;
    size_t out_pos = 0;

    for (size_t pc = 0; code[pc] != '\0'; pc++) {
        switch (code[pc]) {
            case '>':
                if (ptr + 1 >= CELL_COUNT) return -1;
                ptr++;
                break;
            case '<':
                if (ptr == 0) return -1;
                ptr--;
                break;
            case '+':
                cells[ptr]++;
                break;
            case '-':
                cells[ptr]--;
                break;
            case '.':
                if (out_pos >= output_cap) return -1;
                output[out_pos++] = cells[ptr];
                break;
            case ',':
                cells[ptr] = in_pos < input_len ? input[in_pos++] : 0;
                break;
            case '[':
                if (cells[ptr] == 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc++;
                        if (code[pc] == '\0') return -1;
                        if (code[pc] == '[') depth++;
                        if (code[pc] == ']') depth--;
                    }
                }
                break;
            case ']':
                if (cells[ptr] != 0) {
                    int depth = 1;
                    while (depth > 0) {
                        if (pc == 0) return -1;
                        pc--;
                        if (code[pc] == ']') depth++;
                        if (code[pc] == '[') depth--;
                    }
                }
                break;
        }
    }

    *output_len = out_pos;
    return 0;
}

static uint32_t fnv1a(const unsigned char *body, size_t body_len) {
    uint32_t hash = 2166136261u;
    for (size_t i = 0; i < body_len; i++) {
        hash ^= body[i];
        hash *= 16777619u;
    }
    return hash;
}

static void hex_encode(const unsigned char *bytes, size_t len, char *out) {
    static const char hex[] = "0123456789abcdef";
    for (size_t i = 0; i < len; i++) {
        out[i * 2] = hex[(bytes[i] >> 4) & 0x0f];
        out[i * 2 + 1] = hex[bytes[i] & 0x0f];
    }
    out[len * 2] = '\0';
}

static void send_json(int socket_fd, int status, const char *reason, const char *body) {
    char response[1024];
    int written = snprintf(
        response,
        sizeof(response),
        "HTTP/1.1 %d %s\r\nContent-Type: application/json\r\nContent-Length: %zu\r\nConnection: close\r\n\r\n%s",
        status,
        reason,
        strlen(body),
        body);

    if (written > 0) {
        send(socket_fd, response, (size_t)written, 0);
    }
}

static void handle_request(int socket_fd, const char *program) {
    unsigned char request[MAX_REQUEST_BYTES + 1] = {0};
    ssize_t bytes_read = recv(socket_fd, request, MAX_REQUEST_BYTES, 0);
    if (bytes_read <= 0) {
        return;
    }

    const char *header_end = strstr((const char *)request, "\r\n\r\n");
    if (header_end == NULL) {
        send_json(socket_fd, 400, "Bad Request", "{\"error\":\"malformed request\"}");
        return;
    }

    char request_line[256] = {0};
    sscanf((const char *)request, "%255[^\r\n]", request_line);

    if (strncmp(request_line, "GET /health ", 12) == 0) {
        send_json(socket_fd, 200, "OK", "{\"status\":\"ok\",\"service\":\"brainfuck-crypt\"}");
        return;
    }

    if (strncmp(request_line, "POST /obfuscate ", 16) != 0) {
        send_json(socket_fd, 404, "Not Found", "{\"error\":\"not found\"}");
        return;
    }

    const unsigned char *body = (const unsigned char *)(header_end + 4);
    size_t body_len = (size_t)((const unsigned char *)request + bytes_read - body);
    if (body_len > MAX_BODY_BYTES) {
        send_json(socket_fd, 413, "Payload Too Large", "{\"error\":\"payload too large\"}");
        return;
    }

    uint32_t hash = fnv1a(body, body_len);
    unsigned char hash_bytes[4] = {
        (unsigned char)((hash >> 24) & 0xff),
        (unsigned char)((hash >> 16) & 0xff),
        (unsigned char)((hash >> 8) & 0xff),
        (unsigned char)(hash & 0xff),
    };

    unsigned char obfuscated[8] = {0};
    size_t obfuscated_len = 0;
    if (run_brainfuck(program, hash_bytes, sizeof(hash_bytes), obfuscated, sizeof(obfuscated), &obfuscated_len) != 0) {
        send_json(socket_fd, 500, "Internal Server Error", "{\"error\":\"brainfuck execution failed\"}");
        return;
    }

    char signature[17];
    hex_encode(obfuscated, obfuscated_len, signature);

    char response_body[256];
    snprintf(
        response_body,
        sizeof(response_body),
        "{\"service\":\"brainfuck-crypt\",\"algorithm\":\"fnv1a-bf-obfuscation\",\"signature\":\"%s\",\"bytes\":%zu}",
        signature,
        body_len);
    send_json(socket_fd, 200, "OK", response_body);
}

int main(int argc, char **argv) {
    const char *program_path = argc > 1 ? argv[1] : "service.bf";
    char *program = read_program(program_path);
    if (program == NULL) {
        fprintf(stderr, "failed to load Brainfuck program: %s\n", program_path);
        return 1;
    }

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        free(program);
        return 1;
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in address;
    memset(&address, 0, sizeof(address));
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(4020);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind");
        close(server_fd);
        free(program);
        return 1;
    }

    if (listen(server_fd, 16) < 0) {
        perror("listen");
        close(server_fd);
        free(program);
        return 1;
    }

    while (1) {
        struct sockaddr_in client_address;
        socklen_t addrlen = sizeof(client_address);
        int client_fd = accept(server_fd, (struct sockaddr *)&client_address, &addrlen);
        if (client_fd < 0) {
            continue;
        }

        handle_request(client_fd, program);
        close(client_fd);
    }

    free(program);
    close(server_fd);
    return 0;
}

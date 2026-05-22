#include <arpa/inet.h>
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

extern long fib(long n);

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

static long parse_n(const char *request_line) {
    const char *query = strstr(request_line, "n=");
    if (query == NULL) {
        return 10;
    }

    query += 2;
    if (!isdigit((unsigned char)*query)) {
        return 10;
    }

    long value = strtol(query, NULL, 10);
    if (value < 0) {
        return 0;
    }
    if (value > 45) {
        return 45;
    }
    return value;
}

static void handle_request(int socket_fd, const char *request) {
    char request_line[256] = {0};
    sscanf(request, "%255[^\r\n]", request_line);

    if (strncmp(request_line, "GET /health ", 12) == 0) {
        send_json(socket_fd, 200, "OK", "{\"status\":\"ok\",\"service\":\"assembly-fibo\"}");
        return;
    }

    if (strncmp(request_line, "GET /verify", 11) != 0) {
        send_json(socket_fd, 404, "Not Found", "{\"error\":\"not found\"}");
        return;
    }

    long n = parse_n(request_line);
    long result = fib(n);

    char body[256];
    snprintf(
        body,
        sizeof(body),
        "{\"service\":\"assembly-fibo\",\"algorithm\":\"fibonacci\",\"input\":%ld,\"result\":%ld}",
        n,
        result);
    send_json(socket_fd, 200, "OK", body);
}

int main() {
    int server_fd;
    struct sockaddr_in address;
    int opt = 1;

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        return 1;
    }

    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(4021);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind");
        close(server_fd);
        return 1;
    }

    if (listen(server_fd, 16) < 0) {
        perror("listen");
        close(server_fd);
        return 1;
    }

    while (1) {
        struct sockaddr_in client_address;
        socklen_t addrlen = sizeof(client_address);
        int client_fd = accept(server_fd, (struct sockaddr *)&client_address, &addrlen);
        if (client_fd < 0) {
            continue;
        }

        char buffer[2048] = {0};
        ssize_t bytes_read = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
        if (bytes_read > 0) {
            handle_request(client_fd, buffer);
        }
        close(client_fd);
    }

    close(server_fd);
    return 0;
}

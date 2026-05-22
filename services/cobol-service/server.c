#include <arpa/inet.h>
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define MAX_REQUEST_BYTES 2048
#define MAX_BODY_BYTES 1024

static void send_json(int socket_fd, int status, const char *reason, const char *body) {
    char response[2048];
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

static long parse_amount_cents(const char *request_line) {
    const char *query = strstr(request_line, "amount_cents=");
    if (query == NULL) {
        return 0;
    }

    query += strlen("amount_cents=");
    if (!isdigit((unsigned char)*query)) {
        return 0;
    }

    long value = strtol(query, NULL, 10);
    if (value < 0) {
        return 0;
    }
    if (value > 999999999) {
        return 999999999;
    }
    return value;
}

static int run_billing(long amount_cents, char *output, size_t output_size) {
    char command[128];
    snprintf(command, sizeof(command), "./billing %ld", amount_cents);

    FILE *process = popen(command, "r");
    if (process == NULL) {
        return -1;
    }

    if (fgets(output, (int)output_size, process) == NULL) {
        pclose(process);
        return -1;
    }

    int status = pclose(process);
    if (status != 0) {
        return -1;
    }

    output[strcspn(output, "\r\n")] = '\0';
    return 0;
}

static void handle_request(int socket_fd, const char *request) {
    char request_line[256] = {0};
    sscanf(request, "%255[^\r\n]", request_line);

    if (strncmp(request_line, "GET /health ", 12) == 0) {
        send_json(socket_fd, 200, "OK", "{\"status\":\"ok\",\"service\":\"cobol-ledger\"}");
        return;
    }

    if (strncmp(request_line, "GET /ledger", 11) != 0) {
        send_json(socket_fd, 404, "Not Found", "{\"error\":\"not found\"}");
        return;
    }

    long amount_cents = parse_amount_cents(request_line);
    char body[MAX_BODY_BYTES] = {0};
    if (run_billing(amount_cents, body, sizeof(body)) != 0) {
        send_json(socket_fd, 500, "Internal Server Error", "{\"error\":\"billing failed\"}");
        return;
    }

    send_json(socket_fd, 200, "OK", body);
}

int main() {
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        return 1;
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in address;
    memset(&address, 0, sizeof(address));
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(4022);

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

        char buffer[MAX_REQUEST_BYTES + 1] = {0};
        ssize_t bytes_read = recv(client_fd, buffer, MAX_REQUEST_BYTES, 0);
        if (bytes_read > 0) {
            handle_request(client_fd, buffer);
        }
        close(client_fd);
    }

    close(server_fd);
    return 0;
}

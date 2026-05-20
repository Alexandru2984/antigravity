#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

extern long fib(long n);

int main() {
    int server_fd, new_socket;
    struct sockaddr_in address;
    int opt = 1;
    int addrlen = sizeof(address);
    
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(4021);
    
    bind(server_fd, (struct sockaddr *)&address, sizeof(address));
    listen(server_fd, 3);
    
    while(1) {
        new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen);
        long result = fib(10); // Calculate 10th Fib
        char buffer[1024];
        sprintf(buffer, "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nAssembly Fibonacci(10): %ld\n", result);
        send(new_socket, buffer, strlen(buffer), 0);
        close(new_socket);
    }
    return 0;
}

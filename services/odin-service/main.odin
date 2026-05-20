package main
import "core:net"
import "core:fmt"

main :: proc() {
    listen_socket, err := net.listen_tcp({net.IP4_Address{0,0,0,0}, 4065})
    fmt.println("Odin Service listening on 4065")
    for {
        client_socket, client_addr, accept_err := net.accept_tcp(listen_socket)
        net.send_tcp(client_socket, transmute([]byte)string("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOdin Game-Engine Speed: Active\n"))
        net.close(client_socket)
    }
}

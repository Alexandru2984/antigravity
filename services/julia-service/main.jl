using Sockets

server = listen(4024)
println("Julia Mathematical Service running on :4024")

while true
    sock = accept(server)
    write(sock, "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nJulia Math Result: PI is $(pi), 2^10 is $(2^10)\n")
    close(sock)
end

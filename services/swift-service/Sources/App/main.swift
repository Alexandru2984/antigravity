import Glibc

let port = configuredPort()
let serverSocket = socket(AF_INET, Int32(SOCK_STREAM.rawValue), 0)
if serverSocket < 0 {
    fatalError("socket failed")
}

signal(SIGPIPE, SIG_IGN)

var reuseAddress: Int32 = 1
setsockopt(
    serverSocket,
    SOL_SOCKET,
    SO_REUSEADDR,
    &reuseAddress,
    socklen_t(MemoryLayout<Int32>.size)
)

var address = sockaddr_in()
address.sin_family = sa_family_t(AF_INET)
address.sin_port = in_port_t(port).bigEndian
address.sin_addr = in_addr(s_addr: in_addr_t(0))

let bindResult = withUnsafePointer(to: &address) { pointer in
    pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPointer in
        bind(serverSocket, sockaddrPointer, socklen_t(MemoryLayout<sockaddr_in>.size))
    }
}
if bindResult < 0 {
    fatalError("bind failed")
}

if listen(serverSocket, 128) < 0 {
    fatalError("listen failed")
}

print("swift-service listening on \(port)")

while true {
    let clientSocket = accept(serverSocket, nil, nil)
    if clientSocket < 0 {
        continue
    }

    handle(clientSocket)
    close(clientSocket)
}

func handle(_ clientSocket: Int32) {
    var buffer = [UInt8](repeating: 0, count: 2048)
    let bytesRead = read(clientSocket, &buffer, buffer.count)
    let request = bytesRead > 0
        ? String(decoding: buffer.prefix(bytesRead), as: UTF8.self)
        : ""
    let path = requestPath(from: request)

    if path == "/" || path == "/health" {
        writeResponse(
            clientSocket,
            status: "200 OK",
            body: #"{"status":"ok","service":"swift-stdlib-http"}"#
        )
        return
    }

    writeResponse(
        clientSocket,
        status: "404 Not Found",
        body: #"{"error":"not found"}"#
    )
}

func writeResponse(_ clientSocket: Int32, status: String, body: String) {
    let response = """
    HTTP/1.1 \(status)\r
    Content-Type: application/json\r
    Content-Length: \(body.utf8.count)\r
    Connection: close\r
    \r
    \(body)
    """

    _ = response.withCString { pointer in
        write(clientSocket, pointer, strlen(pointer))
    }
}

func requestPath(from request: String) -> String {
    let firstLine = request.split(separator: "\r\n", maxSplits: 1).first ?? ""
    let parts = firstLine.split(separator: " ", maxSplits: 2)
    if parts.count >= 2 {
        return String(parts[1])
    }

    return "/"
}

func configuredPort() -> UInt16 {
    guard
        let rawPort = getenv("PORT"),
        let parsed = UInt16(String(cString: rawPort))
    else {
        return 4063
    }

    return parsed
}

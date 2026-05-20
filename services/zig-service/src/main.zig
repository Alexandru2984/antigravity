const std = @import("std");
const net = std.net;

pub fn main() !void {
    const address = try net.Address.parseIp("0.0.0.0", 4062);
    var server = try address.listen(.{ .reuse_address = true });
    defer server.deinit();

    while (true) {
        var connection = try server.accept();
        defer connection.stream.close();
        _ = try connection.stream.write("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nZig High-Performance Engine: Active\n");
    }
}

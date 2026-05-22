const std = @import("std");

const max_request_bytes = 16 * 1024;
const max_body_bytes = 8 * 1024;

pub fn main() !void {
    const address = try std.net.Address.parseIp("0.0.0.0", 4062);
    var server = try address.listen(.{ .reuse_address = true });
    defer server.deinit();

    while (true) {
        var connection = try server.accept();
        defer connection.stream.close();
        handleConnection(connection.stream) catch |err| {
            std.debug.print("zig-service request failed: {}\n", .{err});
        };
    }
}

fn handleConnection(stream: std.net.Stream) !void {
    var buffer: [max_request_bytes]u8 = undefined;
    const bytes_read = try stream.read(&buffer);
    if (bytes_read == 0) return;

    const request = buffer[0..bytes_read];
    const header_end = std.mem.indexOf(u8, request, "\r\n\r\n") orelse {
        try sendJson(stream, 400, "{\"error\":\"malformed request\"}");
        return;
    };

    const headers = request[0..header_end];
    const body = request[(header_end + 4)..];
    const request_line_end = std.mem.indexOfScalar(u8, headers, '\r') orelse headers.len;
    const request_line = headers[0..request_line_end];

    if (std.mem.startsWith(u8, request_line, "GET /health ")) {
        try sendJson(stream, 200, "{\"status\":\"ok\",\"service\":\"zig-crypto\"}");
        return;
    }

    if (!std.mem.startsWith(u8, request_line, "POST /sign ")) {
        try sendJson(stream, 404, "{\"error\":\"not found\"}");
        return;
    }

    if (body.len > max_body_bytes) {
        try sendJson(stream, 413, "{\"error\":\"payload too large\"}");
        return;
    }

    var digest: [32]u8 = undefined;
    std.crypto.hash.sha2.Sha256.hash(body, &digest, .{});
    const hex = std.fmt.bytesToHex(digest, .lower);

    var json_buffer: [192]u8 = undefined;
    const json = try std.fmt.bufPrint(
        &json_buffer,
        "{{\"algorithm\":\"sha256\",\"digest\":\"{s}\",\"bytes\":{d},\"service\":\"zig-crypto\"}}",
        .{ hex, body.len },
    );

    try sendJson(stream, 200, json);
}

fn sendJson(stream: std.net.Stream, status_code: u16, body: []const u8) !void {
    const reason = switch (status_code) {
        200 => "OK",
        400 => "Bad Request",
        404 => "Not Found",
        413 => "Payload Too Large",
        else => "Internal Server Error",
    };

    var header_buffer: [256]u8 = undefined;
    const header = try std.fmt.bufPrint(
        &header_buffer,
        "HTTP/1.1 {d} {s}\r\nContent-Type: application/json\r\nContent-Length: {d}\r\nConnection: close\r\n\r\n",
        .{ status_code, reason, body.len },
    );

    try stream.writeAll(header);
    try stream.writeAll(body);
}

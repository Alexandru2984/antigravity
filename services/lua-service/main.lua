local socket = require("socket")
local server = assert(socket.bind("*", 4059))
print("Lua Service running on port 4059")

while true do
    local client = server:accept()
    client:send("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nLua Scripting Engine: Active\n")
    client:close()
end

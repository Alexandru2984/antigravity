local socket = require("socket")

local server = assert(socket.bind("*", 4059))
print("Lua UI rules service running on port 4059")

local function escape_json(value)
    value = tostring(value or "")
    value = value:gsub("\\", "\\\\")
    value = value:gsub('"', '\\"')
    value = value:gsub("\n", "\\n")
    value = value:gsub("\r", "\\r")
    return value
end

local function is_array(value)
    if type(value) ~= "table" then
        return false
    end
    local count = 0
    for key, _ in pairs(value) do
        if type(key) ~= "number" then
            return false
        end
        count = count + 1
    end
    return count == #value
end

local function encode_json(value)
    local value_type = type(value)
    if value_type == "string" then
        return '"' .. escape_json(value) .. '"'
    end
    if value_type == "number" or value_type == "boolean" then
        return tostring(value)
    end
    if value_type ~= "table" then
        return "null"
    end

    local parts = {}
    if is_array(value) then
        for _, item in ipairs(value) do
            parts[#parts + 1] = encode_json(item)
        end
        return "[" .. table.concat(parts, ",") .. "]"
    end

    for key, item in pairs(value) do
        parts[#parts + 1] = '"' .. escape_json(key) .. '":' .. encode_json(item)
    end
    return "{" .. table.concat(parts, ",") .. "}"
end

local function json_string(body, key, fallback)
    local pattern = '"' .. key .. '"%s*:%s*"([^"]*)"'
    local value = body:match(pattern)
    return value or fallback
end

local function json_number(body, key, fallback)
    local pattern = '"' .. key .. '"%s*:%s*(-?%d+%.?%d*)'
    local value = tonumber(body:match(pattern))
    return value or fallback
end

local function price_band(price)
    if price >= 5000 then
        return "luxury"
    end
    if price >= 1000 then
        return "premium"
    end
    if price >= 250 then
        return "standard"
    end
    return "budget"
end

local function build_ui_rules(body)
    local title = json_string(body, "title", "Listing")
    local category = json_string(body, "category", "general")
    local price = json_number(body, "price", 0)
    local risk_score = json_number(body, "risk_score", 0)
    local quality_score = json_number(body, "quality_score", 100)
    local image_count = json_number(body, "image_count", 0)
    local band = price_band(price)

    local badge = "verified"
    local accent = "teal"
    if risk_score >= 0.6 then
        badge = "manual_review"
        accent = "red"
    elseif quality_score < 60 then
        badge = "needs_details"
        accent = "amber"
    elseif band == "premium" or band == "luxury" then
        badge = "premium"
        accent = "indigo"
    end

    local components = {"price", "seller_cta", "trust_badge"}
    if image_count > 0 then
        components[#components + 1] = "image_gallery"
    end
    if category == "electronics" or category == "vehicles" then
        components[#components + 1] = "specs_panel"
    end

    return {
        service = "lua-customizer",
        status = "ok",
        card_theme = accent,
        trust_badge = badge,
        price_band = band,
        title_hint = title,
        layout_density = image_count > 0 and "media-rich" or "compact",
        visible_components = components,
        sort_boost = math.max(0, math.floor(quality_score - (risk_score * 40)))
    }
end

local function read_request(client)
    local request_line = client:receive("*l")
    if not request_line then
        return nil
    end

    local method, path = request_line:match("^(%S+)%s+(%S+)")
    local content_length = 0
    while true do
        local line = client:receive("*l")
        if not line or line == "" then
            break
        end
        local name, value = line:match("^([^:]+):%s*(.*)$")
        if name and name:lower() == "content-length" then
            content_length = tonumber(value) or 0
        end
    end

    local body = ""
    if content_length > 0 then
        body = client:receive(content_length) or ""
    end
    return method, path, body
end

local function send_json(client, status, body)
    local status_text = status == 200 and "OK" or status == 404 and "Not Found" or "Bad Request"
    local response_body = encode_json(body)
    client:send(
        "HTTP/1.1 " .. status .. " " .. status_text .. "\r\n" ..
        "Content-Type: application/json\r\n" ..
        "Content-Length: " .. #response_body .. "\r\n" ..
        "Connection: close\r\n\r\n" ..
        response_body
    )
end

while true do
    local client = server:accept()
    client:settimeout(5)
    local method, path, body = read_request(client)

    if method == "GET" and path == "/" then
        send_json(client, 200, {status = "ok", service = "lua-customizer"})
    elseif method == "POST" and path == "/ui-rules" then
        send_json(client, 200, build_ui_rules(body or ""))
    else
        send_json(client, 404, {status = "error", error = "not_found"})
    end
    client:close()
end

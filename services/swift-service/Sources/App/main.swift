import Vapor
let app = try Application()
app.http.server.configuration.port = 4063
app.get { req in
    ["status": "ok", "service": "swift-vapor-ios-legacy"]
}
try app.run()

import asynchttpserver, asyncdispatch

var server = newAsyncHttpServer()
proc cb(req: Request) {.async.} =
  await req.respond(Http200, "{\"status\":\"ok\", \"service\":\"nim-compiled-performance\"}", {"Content-Type": "application/json"}.newHttpHeaders())

asyncCheck server.serve(Port(4064), cb)
runForever()

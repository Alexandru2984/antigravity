import asynchttpserver, asyncdispatch, json, sequtils, strutils

var server = newAsyncHttpServer()

const stopWords = ["the", "and", "with", "for", "din", "cu", "de", "si", "sau", "la"]

proc jsonHeaders(): HttpHeaders =
  newHttpHeaders({"Content-Type": "application/json"})

proc readString(payload: JsonNode, key: string, fallback = ""): string =
  if payload.hasKey(key) and payload[key].kind == JString:
    payload[key].getStr()
  else:
    fallback

proc compactText(value: string): string =
  value.strip().splitWhitespace().join(" ")

proc titleCase(value: string): string =
  let words = compactText(value).toLowerAscii().splitWhitespace()
  result = words.mapIt(if it.len > 0: it.capitalizeAscii() else: it).join(" ")

proc slugify(value: string): string =
  var pendingDash = false
  for ch in value.toLowerAscii():
    if ch.isAlphaNumeric():
      if pendingDash and result.len > 0:
        result.add('-')
      result.add(ch)
      pendingDash = false
    elif result.len > 0:
      pendingDash = true
  result = result.strip(chars = {'-'})
  if result.len == 0:
    result = "listing"

proc searchTokens(title, description, category: string): seq[string] =
  for word in (title & " " & description & " " & category).toLowerAscii().splitWhitespace():
    let token = word.strip(chars = {' ', '.', ',', ':', ';', '!', '?', '/', '\\', '-', '_', '"', '\''})
    if token.len >= 3 and token notin stopWords and token notin result:
      result.add(token)
    if result.len >= 12:
      break

proc optimizeListing(payload: JsonNode): JsonNode =
  let rawTitle = readString(payload, "title", "Listing")
  let rawDescription = readString(payload, "description", "")
  let rawCategory = readString(payload, "category", "general")
  let normalizedTitle = titleCase(rawTitle)
  let normalizedDescription = compactText(rawDescription)
  let descriptionLength = normalizedDescription.len
  let descriptionQuality =
    if descriptionLength >= 120: "rich"
    elif descriptionLength >= 40: "usable"
    elif descriptionLength > 0: "thin"
    else: "missing"

  %* {
    "service": "nim-optimizer",
    "status": "ok",
    "normalized_title": normalizedTitle,
    "normalized_description": normalizedDescription,
    "slug": slugify(normalizedTitle),
    "search_tokens": searchTokens(normalizedTitle, normalizedDescription, rawCategory),
    "description_quality": descriptionQuality,
    "description_length": descriptionLength
  }

proc cb(req: Request) {.async, gcsafe.} =
  if req.reqMethod == HttpGet and req.url.path == "/":
    await req.respond(
      Http200,
      $(%* {"status": "ok", "service": "nim-compiled-performance"}),
      jsonHeaders(),
    )
  elif req.reqMethod == HttpPost and req.url.path == "/optimize":
    if req.body.len > 8192:
      await req.respond(Http413, $(%* {"status": "error", "error": "payload_too_large"}), jsonHeaders())
      return
    try:
      let payload = parseJson(req.body)
      await req.respond(Http200, $optimizeListing(payload), jsonHeaders())
    except JsonParsingError:
      await req.respond(Http400, $(%* {"status": "error", "error": "invalid_json"}), jsonHeaders())
  else:
    await req.respond(Http404, $(%* {"status": "error", "error": "not_found"}), jsonHeaders())

let callback = proc (req: Request): Future[void] {.closure, gcsafe.} =
  cb(req)

asyncCheck server.serve(Port(4064), callback)
runForever()

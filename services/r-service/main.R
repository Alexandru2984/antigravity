port <- 4060

send_json <- function(con, status, reason, body) {
  response <- paste0(
    "HTTP/1.1 ", status, " ", reason, "\r\n",
    "Content-Type: application/json\r\n",
    "Content-Length: ", nchar(body, type = "bytes"), "\r\n",
    "Connection: close\r\n\r\n",
    body
  )
  writeChar(response, con, eos = NULL)
}

query_param <- function(request_line, name, default) {
  pattern <- paste0(name, "=([0-9]+(\\.[0-9]+)?)")
  match <- regexec(pattern, request_line)
  parts <- regmatches(request_line, match)
  if (length(parts) == 0 || length(parts[[1]]) < 2) {
    return(default)
  }
  value <- suppressWarnings(as.numeric(parts[[1]][2]))
  if (is.na(value) || !is.finite(value)) {
    return(default)
  }
  value
}

forecast_response <- function(price) {
  bounded_price <- min(max(price, 1), 1000000)
  days <- c(1, 7, 14, 21, 30)
  observations <- bounded_price * c(1.04, 1.02, 1.00, 0.985, 0.97)
  model <- lm(observations ~ days)
  prediction <- predict(model, newdata = data.frame(days = 45))
  fit <- summary(model)

  paste0(
    "{",
    '"status":"ok",',
    '"service":"r-regression",',
    '"engine":"R-Stats-Regression",',
    '"input_price":', round(bounded_price, 2), ",",
    '"forecast_price_45_days":', round(as.numeric(prediction), 2), ",",
    '"regression":{',
    '"slope":', round(unname(coef(model)[2]), 6), ",",
    '"intercept":', round(unname(coef(model)[1]), 6), ",",
    '"r_squared":', round(fit$r.squared, 6),
    "}",
    "}"
  )
}

handle_request <- function(con, request_line) {
  if (startsWith(request_line, "GET /health ")) {
    send_json(con, 200, "OK", '{"status":"ok","service":"r-regression"}')
    return()
  }

  if (!startsWith(request_line, "GET /forecast")) {
    send_json(con, 404, "Not Found", '{"error":"not found"}')
    return()
  }

  price <- query_param(request_line, "price", 250)
  send_json(con, 200, "OK", forecast_response(price))
}

cat("R regression node active on port", port, "\n")

while (TRUE) {
  con <- NULL
  tryCatch({
    con <- socketConnection(
      port = port,
      server = TRUE,
      blocking = TRUE,
      open = "r+",
      timeout = 2
    )

    request_line <- readLines(con, n = 1, warn = FALSE)
    if (length(request_line) > 0) {
      handle_request(con, request_line[[1]])
    }
  }, error = function(e) {
    cat("Connection error:", conditionMessage(e), "\n")
    Sys.sleep(0.1)
  }, finally = {
    if (!is.null(con)) {
      try(close(con), silent = TRUE)
    }
  })
}

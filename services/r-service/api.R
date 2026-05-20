library(plumber)

#* @get /
function() {
  list(status = "ok", service = "R-statistical-analysis", version = R.version.string)
}

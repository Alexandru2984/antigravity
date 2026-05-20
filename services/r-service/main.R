library(plumber)
pr <- pr("api.R")
pr$run(host = "0.0.0.0", port = 4060)

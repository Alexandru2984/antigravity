(ns polyglot.core
  (:require [ring.adapter.jetty :refer [run-jetty]]
            [clojure.data.json :as json])
  (:gen-class))

(defn handler [request]
  {:status 200
   :headers {"Content-Type" "application/json"}
   :body (json/write-str {:status "ok" :service "clojure-functional-logic" :message "Lisp lives on JVM"})})

(defn -main [& args]
  (run-jetty handler {:port 4023}))

(defproject clojure-service "0.1.0-SNAPSHOT"
  :dependencies [[org.clojure/clojure "1.11.1"]
                 [ring/ring-core "1.9.6"]
                 [ring/ring-jetty-adapter "1.9.6"]
                 [org.clojure/data.json "2.4.0"]]
  :main ^:skip-aot polyglot.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})

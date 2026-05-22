(ns polyglot.core
  (:require [ring.adapter.jetty :refer [run-jetty]]
            [clojure.data.json :as json]
            [clojure.string :as str])
  (:gen-class))

(def category-rules
  {"electronics" {:tags ["warranty" "condition" "model"]
                  :priority "high"
                  :requires ["serial_number" "condition"]}
   "vehicles" {:tags ["vin" "mileage" "inspection"]
               :priority "high"
               :requires ["mileage" "year"]}
   "real-estate" {:tags ["surface" "rooms" "utilities"]
                  :priority "high"
                  :requires ["surface_m2" "rooms"]}
   "jobs" {:tags ["salary" "contract" "remote"]
           :priority "normal"
           :requires ["salary_range" "contract_type"]}
   "general" {:tags ["local" "verified"]
              :priority "normal"
              :requires []}})

(defn lower [value]
  (str/lower-case (str (or value ""))))

(defn parse-body [request]
  (try
    (if-let [body (:body request)]
      (json/read-str (slurp body) :key-fn keyword)
      {})
    (catch Exception _
      nil)))

(defn listing-rules [payload]
  (let [title (lower (:title payload))
        category (lower (or (:category payload) "general"))
        description (lower (:description payload))
        price (double (or (:price payload) 0))
        rule (get category-rules category (get category-rules "general"))
        title-words (->> (str/split title #"\s+")
                         (remove str/blank?)
                         (take 8))
        premium? (or (> price 1000)
                     (str/includes? title "pro")
                     (str/includes? title "premium"))
        sparse? (< (+ (count title) (count description)) 30)
        fired (cond-> []
                premium? (conj "premium-listing")
                sparse? (conj "needs-description")
                (= "high" (:priority rule)) (conj "manual-review-candidate"))
        quality-score (cond-> 100
                        sparse? (- 25)
                        (empty? title-words) (- 20)
                        premium? (- 5))]
    {:service "clojure-rules"
     :status "ok"
     :category category
     :campaign_tags (vec (distinct (concat (:tags rule) title-words)))
     :required_attributes (:requires rule)
     :publish_priority (:priority rule)
     :quality_score (max 0 quality-score)
     :rules_fired fired}))

(defn json-response
  ([status body]
   {:status status
    :headers {"Content-Type" "application/json"}
    :body (json/write-str body)})
  ([body] (json-response 200 body)))

(defn handler [request]
  (case [(:request-method request) (:uri request)]
    [:get "/"] (json-response {:status "ok"
                               :service "clojure-functional-logic"
                               :message "Listing rules engine ready"})
    [:post "/rules"] (if-let [payload (parse-body request)]
                       (json-response (listing-rules payload))
                       (json-response 400 {:status "error"
                                           :error "invalid_json"}))
    (json-response 404 {:status "error" :error "not_found"})))

(defn -main [& args]
  (run-jetty handler {:port 4023}))

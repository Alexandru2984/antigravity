package main
import (
	"encoding/json"
	"net/http"
)

func main() {
	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"query": query,
			"results": []string{"Product A", "Product B"},
			"engine": "Go-Elastic-Search-Mock",
		})
	})
	http.ListenAndServe(":4003", nil) # Portul din docker-compose pentru search
}

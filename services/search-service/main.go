package main
import (
	"encoding/json"
	"net/http"
	"sync"
)

type Index struct {
	mu    sync.RWMutex
	items []string
}

func main() {
	idx := &Index{items: []string{"iPhone", "Samsung", "Tesla"}}
	
	http.HandleFunc("/search", func(w http.ResponseWriter, r *http.Request) {
		idx.mu.RLock()
		defer idx.mu.RUnlock()
		json.NewEncoder(w).Encode(idx.items)
	})
	
	http.ListenAndServe(":4003", nil)
}

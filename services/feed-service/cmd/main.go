package main

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// ── Types ─────────────────────────────────────────────────────

type FeedItem struct {
	ListingID    string    `json:"listing_id"`
	Title        string    `json:"title"`
	Price        float64   `json:"price"`
	Category     string    `json:"category"`
	SellerID     string    `json:"seller_id"`
	ThumbnailURL string    `json:"thumbnail_url"`
	CreatedAt    time.Time `json:"created_at"`
	Score        float64   `json:"score"`
}

type FeedResponse struct {
	Items []FeedItem `json:"items"`
	Total int        `json:"total"`
	Page  int        `json:"page"`
	Limit int        `json:"limit"`
}

// ── App ───────────────────────────────────────────────────────

type App struct {
	redis *redis.Client
}

func NewApp() *App {
	rdb := redis.NewClient(redisOptions())
	return &App{redis: rdb}
}

func redisOptions() *redis.Options {
	redisURL := getEnv("REDIS_URL", "redis:6379")
	if strings.Contains(redisURL, "://") {
		if options, err := redis.ParseURL(redisURL); err == nil {
			return options
		}
	}

	return &redis.Options{Addr: redisURL}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// ── Handlers ──────────────────────────────────────────────────

func (a *App) health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "feed-service"})
}

func (a *App) getFeed(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := r.Header.Get("X-User-Id")
	if userID == "" {
		userID = uuid.NewString() // anonymous feed
	}

	page, limit := normalizePagination(r.URL.Query().Get("page"), r.URL.Query().Get("limit"))
	// Try personalized feed from Redis sorted set first
	cacheKey := "feed:user:" + userID
	items := a.fetchFromCache(ctx, cacheKey, page, limit)
	if len(items) == 0 {
		// Fallback: global recency feed
		cacheKey = "feed:global"
		items = a.fetchFromCache(ctx, cacheKey, page, limit)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(FeedResponse{
		Items: items,
		Total: len(items),
		Page:  page,
		Limit: limit,
	})
}

func normalizePagination(pageValue, limitValue string) (int, int) {
	page, _ := strconv.Atoi(pageValue)
	limit, _ := strconv.Atoi(limitValue)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	return page, limit
}

func (a *App) fetchFromCache(ctx context.Context, key string, page, limit int) []FeedItem {
	offset := int64((page - 1) * limit)
	results, err := a.redis.ZRevRangeByScoreWithScores(ctx, key, &redis.ZRangeBy{
		Min:    "-inf",
		Max:    "+inf",
		Offset: offset,
		Count:  int64(limit),
	}).Result()
	if err != nil {
		return nil
	}

	items := make([]FeedItem, 0, len(results))
	for _, z := range results {
		var item FeedItem
		if err := json.Unmarshal([]byte(z.Member.(string)), &item); err == nil {
			item.Score = z.Score
			items = append(items, item)
		}
	}
	return items
}

func (a *App) followSeller(w http.ResponseWriter, r *http.Request) {
	sellerID := chi.URLParam(r, "sellerID")
	userID, ok := requireGatewayUser(w, r)
	if !ok {
		return
	}

	ctx := r.Context()
	// Store follow relationship in Redis Set
	key := "follows:" + userID
	a.redis.SAdd(ctx, key, sellerID)
	a.redis.Expire(ctx, key, 90*24*time.Hour)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"followed": true})
}

func (a *App) unfollowSeller(w http.ResponseWriter, r *http.Request) {
	sellerID := chi.URLParam(r, "sellerID")
	userID, ok := requireGatewayUser(w, r)
	if !ok {
		return
	}

	ctx := r.Context()
	key := "follows:" + userID
	a.redis.SRem(ctx, key, sellerID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"followed": false})
}

func requireGatewayUser(w http.ResponseWriter, r *http.Request) (string, bool) {
	expectedToken := os.Getenv("INTERNAL_SERVICE_TOKEN")
	if expectedToken == "" {
		http.Error(w, "INTERNAL_SERVICE_TOKEN is not configured", http.StatusInternalServerError)
		return "", false
	}

	expectedSum := sha256.Sum256([]byte(expectedToken))
	actualSum := sha256.Sum256([]byte(r.Header.Get("X-Internal-Service-Token")))
	if subtle.ConstantTimeCompare(expectedSum[:], actualSum[:]) != 1 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return "", false
	}

	userID := r.Header.Get("X-User-Id")
	if userID == "" {
		http.Error(w, "missing user context", http.StatusUnauthorized)
		return "", false
	}

	return userID, true
}

// ── Main ──────────────────────────────────────────────────────

func main() {
	healthCheck := flag.Bool("health", false, "check local HTTP health endpoint")
	flag.Parse()

	if *healthCheck {
		runHealthCheck()
		return
	}

	app := NewApp()
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	r.Get("/health", app.health)
	r.Get("/ready", app.health)

	r.Route("/feed", func(r chi.Router) {
		r.Get("/", app.getFeed)
		r.Post("/follow/{sellerID}", app.followSeller)
		r.Delete("/follow/{sellerID}", app.unfollowSeller)
	})

	port := getEnv("PORT", "4008")
	log.Printf("🚀 feed-service running on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func runHealthCheck() {
	port := getEnv("PORT", "4008")
	client := http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + "/health")
	if err != nil {
		os.Exit(1)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		os.Exit(1)
	}
}

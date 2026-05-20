package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// ── Types ─────────────────────────────────────────────────────

type FeedItem struct {
	ListingID   string    `json:"listing_id"`
	Title       string    `json:"title"`
	Price       float64   `json:"price"`
	Category    string    `json:"category"`
	SellerID    string    `json:"seller_id"`
	ThumbnailURL string   `json:"thumbnail_url"`
	CreatedAt   time.Time `json:"created_at"`
	Score       float64   `json:"score"`
}

type FeedResponse struct {
	Items  []FeedItem `json:"items"`
	Total  int        `json:"total"`
	Page   int        `json:"page"`
	Limit  int        `json:"limit"`
}

// ── App ───────────────────────────────────────────────────────

type App struct {
	redis *redis.Client
}

func NewApp() *App {
	rdb := redis.NewClient(&redis.Options{
		Addr: getEnv("REDIS_URL", "redis:6379"),
	})
	return &App{redis: rdb}
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

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 20 }

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
	userID   := r.Header.Get("X-User-Id")
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
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
	userID   := r.Header.Get("X-User-Id")
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	key := "follows:" + userID
	a.redis.SRem(ctx, key, sellerID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"followed": false})
}

// ── Main ──────────────────────────────────────────────────────

func main() {
	app := NewApp()
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	r.Get("/health", app.health)
	r.Get("/ready",  app.health)

	r.Route("/feed", func(r chi.Router) {
		r.Get("/",                       app.getFeed)
		r.Post("/follow/{sellerID}",     app.followSeller)
		r.Delete("/follow/{sellerID}",   app.unfollowSeller)
	})

	port := getEnv("PORT", "4028")
	log.Printf("🚀 feed-service running on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

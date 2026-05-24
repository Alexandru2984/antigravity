package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestRedisOptionsParsesRedisURL(t *testing.T) {
	t.Setenv("REDIS_URL", "redis://:secret@redis:6379/2")

	options := redisOptions()

	if options.Addr != "redis:6379" {
		t.Fatalf("Addr = %q, want redis:6379", options.Addr)
	}
	if options.Password != "secret" {
		t.Fatalf("Password = %q, want secret", options.Password)
	}
	if options.DB != 2 {
		t.Fatalf("DB = %d, want 2", options.DB)
	}
}

func TestRedisOptionsFallsBackToAddr(t *testing.T) {
	t.Setenv("REDIS_URL", "redis:6379")

	options := redisOptions()

	if options.Addr != "redis:6379" {
		t.Fatalf("Addr = %q, want redis:6379", options.Addr)
	}
}

func TestRequireGatewayUserRequiresConfiguredToken(t *testing.T) {
	os.Unsetenv("INTERNAL_SERVICE_TOKEN")

	req := httptest.NewRequest(http.MethodPost, "/feed/follow/seller-1", nil)
	res := httptest.NewRecorder()

	_, ok := requireGatewayUser(res, req)

	if ok {
		t.Fatal("expected request to be rejected")
	}
	if res.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", res.Code)
	}
}

func TestRequireGatewayUserRejectsBadToken(t *testing.T) {
	t.Setenv("INTERNAL_SERVICE_TOKEN", "expected-token")

	req := httptest.NewRequest(http.MethodPost, "/feed/follow/seller-1", nil)
	req.Header.Set("X-Internal-Service-Token", "wrong-token")
	req.Header.Set("X-User-Id", "user-123")
	res := httptest.NewRecorder()

	_, ok := requireGatewayUser(res, req)

	if ok {
		t.Fatal("expected request to be rejected")
	}
	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.Code)
	}
}

func TestRequireGatewayUserRejectsMissingUserContext(t *testing.T) {
	t.Setenv("INTERNAL_SERVICE_TOKEN", "expected-token")

	req := httptest.NewRequest(http.MethodPost, "/feed/follow/seller-1", nil)
	req.Header.Set("X-Internal-Service-Token", "expected-token")
	res := httptest.NewRecorder()

	_, ok := requireGatewayUser(res, req)

	if ok {
		t.Fatal("expected request to be rejected")
	}
	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", res.Code)
	}
}

func TestRequireGatewayUserAcceptsGatewayContext(t *testing.T) {
	t.Setenv("INTERNAL_SERVICE_TOKEN", "expected-token")

	req := httptest.NewRequest(http.MethodPost, "/feed/follow/seller-1", nil)
	req.Header.Set("X-Internal-Service-Token", "expected-token")
	req.Header.Set("X-User-Id", "user-123")
	res := httptest.NewRecorder()

	userID, ok := requireGatewayUser(res, req)

	if !ok {
		t.Fatal("expected request to be accepted")
	}
	if userID != "user-123" {
		t.Fatalf("userID = %q, want user-123", userID)
	}
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_is_public(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
                'service' => 'review-service',
            ]);
    }

    public function test_creating_review_requires_internal_token(): void
    {
        $this->postJson('/api/reviews', $this->validPayload())
            ->assertUnauthorized();
    }

    public function test_creating_review_requires_user_context(): void
    {
        $this->withHeader('X-Internal-Service-Token', 'test-internal-token')
            ->postJson('/api/reviews', $this->validPayload())
            ->assertUnauthorized();
    }

    public function test_authenticated_gateway_request_can_create_review(): void
    {
        $this->withHeaders([
            'X-Internal-Service-Token' => 'test-internal-token',
            'X-User-Id' => 'user-123',
        ])
            ->postJson('/api/reviews', $this->validPayload())
            ->assertCreated()
            ->assertJson([
                'listing_id' => 'listing-1',
                'reviewer_id' => 'user-123',
                'rating' => 5,
                'body' => 'This review body is long enough.',
            ]);

        $this->assertDatabaseHas('reviews', [
            'listing_id' => 'listing-1',
            'reviewer_id' => 'user-123',
        ]);
    }

    private function validPayload(): array
    {
        return [
            'listing_id' => 'listing-1',
            'rating' => 5,
            'body' => 'This review body is long enough.',
        ];
    }
}

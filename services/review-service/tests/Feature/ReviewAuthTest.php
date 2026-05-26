<?php

namespace Tests\Feature;

use App\Models\Review;
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

    public function test_reviewer_can_update_own_review(): void
    {
        $review = Review::create([
            'id' => 'review-1',
            'listing_id' => 'listing-1',
            'reviewer_id' => 'user-123',
            'rating' => 4,
            'body' => 'Original review body is long enough.',
        ]);

        $this->withHeaders([
            'X-Internal-Service-Token' => 'test-internal-token',
            'X-User-Id' => 'user-123',
        ])
            ->putJson('/api/reviews/'.$review->id, [
                'rating' => 5,
                'body' => 'Updated review body is long enough.',
            ])
            ->assertOk()
            ->assertJson([
                'id' => 'review-1',
                'rating' => 5,
                'body' => 'Updated review body is long enough.',
            ]);

        $this->assertDatabaseHas('reviews', [
            'id' => 'review-1',
            'rating' => 5,
            'body' => 'Updated review body is long enough.',
        ]);
    }

    public function test_user_cannot_update_someone_elses_review(): void
    {
        $review = Review::create([
            'id' => 'review-2',
            'listing_id' => 'listing-1',
            'reviewer_id' => 'owner-user',
            'rating' => 4,
            'body' => 'Original review body is long enough.',
        ]);

        $this->withHeaders([
            'X-Internal-Service-Token' => 'test-internal-token',
            'X-User-Id' => 'other-user',
        ])
            ->putJson('/api/reviews/'.$review->id, [
                'rating' => 1,
                'body' => 'Malicious update body is long enough.',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('reviews', [
            'id' => 'review-2',
            'rating' => 4,
            'body' => 'Original review body is long enough.',
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

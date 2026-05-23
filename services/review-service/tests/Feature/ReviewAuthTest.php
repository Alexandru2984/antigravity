<?php

namespace Tests\Feature;

use Tests\TestCase;

class ReviewAuthTest extends TestCase
{
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

    private function validPayload(): array
    {
        return [
            'listing_id' => 'listing-1',
            'rating' => 5,
            'body' => 'This review body is long enough.',
        ];
    }
}

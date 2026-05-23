<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use RdKafka\Producer;

class ReviewController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Review::latest()->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $this->requireGatewayUser($request);

        $validated = $request->validate([
            'listing_id' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'body' => 'required|string|min:10|max:2000',
        ]);

        $review = Review::create([
            'id' => Str::uuid(),
            'listing_id' => $validated['listing_id'],
            'reviewer_id' => $userId,
            'rating' => $validated['rating'],
            'body' => $validated['body'],
        ]);

        // Kafka event: reviews.created
        try {
            $kafka = new Producer;
            $kafka->addBrokers(env('KAFKA_BROKERS', 'kafka:9092'));
            $topic = $kafka->newTopic('reviews.created');
            $topic->produce(RD_KAFKA_PARTITION_UA, 0, json_encode([
                'review_id' => $review->id,
                'listing_id' => $review->listing_id,
                'rating' => $review->rating,
                'reviewer_id' => $userId,
            ]));
            $kafka->flush(3000);
        } catch (\Exception $e) {
            \Log::warning('Kafka publish failed: '.$e->getMessage());
        }

        return response()->json($review, 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Review::findOrFail($id));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->requireGatewayUser($request);

        $review = Review::findOrFail($id);
        $this->authorize($request, $review);

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'body' => 'sometimes|string|min:10|max:2000',
        ]);

        $review->update($validated);

        return response()->json($review);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->requireGatewayUser($request);

        $review = Review::findOrFail($id);
        $this->authorize($request, $review);
        $review->delete();

        return response()->json(['deleted' => true]);
    }

    public function byListing(string $listingId): JsonResponse
    {
        $reviews = Review::where('listing_id', $listingId)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $avg = Review::where('listing_id', $listingId)->avg('rating');

        return response()->json([
            'reviews' => $reviews,
            'average_rating' => round((float) $avg, 2),
        ]);
    }

    private function authorize(Request $request, Review $review): void
    {
        $userId = $request->header('X-User-Id');
        if ($userId !== $review->reviewer_id) {
            abort(403, 'Forbidden');
        }
    }

    private function requireGatewayUser(Request $request): string
    {
        $expectedToken = (string) Config::get('services.internal.token', env('INTERNAL_SERVICE_TOKEN', ''));
        $actualToken = (string) $request->header('X-Internal-Service-Token', '');

        if ($expectedToken === '' || ! hash_equals($expectedToken, $actualToken)) {
            abort(401, 'Missing or invalid internal service token');
        }

        $userId = (string) $request->header('X-User-Id', '');
        if ($userId === '') {
            abort(401, 'Missing user context');
        }

        return $userId;
    }
}

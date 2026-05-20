<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $table = 'reviews';

    protected $fillable = [
        'id', 'listing_id', 'reviewer_id', 'rating', 'body',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public $incrementing = false;
    protected $keyType   = 'string';
}

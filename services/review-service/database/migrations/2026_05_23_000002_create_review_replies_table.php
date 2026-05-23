<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_replies', function (Blueprint $table): void {
            $table->id();
            $table->string('review_id', 36);
            $table->string('seller_id', 36);
            $table->text('body');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('review_id')
                ->references('id')
                ->on('reviews')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_replies');
    }
};

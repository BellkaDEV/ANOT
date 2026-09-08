<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->string('name');
            $table->integer('capacity');
            $table->foreignId('leader_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('activity_group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_group_id')->constrained('activity_groups')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['activity_group_id', 'user_id']);
        });

        Schema::create('activity_group_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_group_id')->constrained('activity_groups')->onDelete('cascade');
            $table->foreignId('invited_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('invited_by_user_id')->constrained('users')->onDelete('cascade');
            $table->string('status')->default('pending'); // 'pending', 'accepted', 'declined', 'cancelled'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_group_invitations');
        Schema::dropIfExists('activity_group_members');
        Schema::dropIfExists('activity_groups');
    }
};

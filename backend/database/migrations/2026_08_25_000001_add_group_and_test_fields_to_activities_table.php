<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('work_mode')->nullable()->after('type'); // 'individual', 'groups'
            $table->integer('group_size')->nullable()->after('work_mode');
            $table->string('assessment_format')->nullable()->after('group_size'); // 'fechada', 'aberta', 'mista', 'nao_informado'
            $table->decimal('points_value', 8, 2)->nullable()->after('assessment_format');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['work_mode', 'group_size', 'assessment_format', 'points_value']);
        });
    }
};

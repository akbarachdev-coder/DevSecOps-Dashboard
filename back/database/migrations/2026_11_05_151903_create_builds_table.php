<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('builds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('commit_hash', 40);
            $table->string('branch', 100);
            $table->string('app_version', 50);
            $table->string('scanner_tool', 50); // e.g., 'trivy', 'npm-audit', 'semgrep'
            $table->enum('status', ['passed', 'failed', 'action_required']);
            $table->integer('total_critical')->default(0);
            $table->integer('total_high')->default(0);
            $table->integer('total_medium')->default(0);
            $table->integer('total_low')->default(0);
            $table->integer('duration_seconds')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('builds');
    }
};

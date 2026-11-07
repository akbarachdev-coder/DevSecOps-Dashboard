<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::create('vulnerabilities', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('vulnerability_id', 100); // CVE-2023-xxxx / Rule ID
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->enum('severity', ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);
            $table->string('package_name', 255)->nullable();
            $table->string('installed_version', 100)->nullable();
            $table->string('fixed_version', 100)->nullable();
            $table->string('file_path', 500)->nullable();
            $table->integer('line_number')->nullable();
            $table->enum('status', ['open', 'resolved', 'ignored_false_positive'])->default('open');
            $table->foreignId('first_seen_build_id')->constrained('builds')->cascadeOnDelete();
            $table->foreignId('last_seen_build_id')->constrained('builds')->cascadeOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            if ($driver !== 'mysql') {
                $table->unique(
                    ['project_id', 'vulnerability_id', 'package_name', 'file_path'],
                    'project_vuln_unique'
                );
            }
        });

        if ($driver === 'mysql') {
            // utf8mb4 index limit: 8 + 400 + 1020 + (400 x 4) = 3028 bytes <= 3072 bytes
            DB::statement(
                'ALTER TABLE `vulnerabilities` ADD UNIQUE `project_vuln_unique` '.
                '(`project_id`, `vulnerability_id`, `package_name`, `file_path`(400))'
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vulnerabilities');
    }
};

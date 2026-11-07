<?php

namespace Database\Factories;

use App\Enums\BuildStatus;
use App\Models\Build;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Build>
 */
class BuildFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'commit_hash' => fake()->sha1(),
            'branch' => fake()->randomElement(['main', 'develop', 'feature/security-scan']),
            'app_version' => fake()->semver(),
            'scanner_tool' => fake()->randomElement(['trivy', 'npm-audit', 'semgrep']),
            'status' => BuildStatus::Passed,
            'total_critical' => 0,
            'total_high' => 0,
            'total_medium' => 0,
            'total_low' => 0,
            'duration_seconds' => fake()->numberBetween(5, 300),
        ];
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => BuildStatus::Failed,
            'total_critical' => fake()->numberBetween(1, 5),
        ]);
    }

    public function actionRequired(): static
    {
        return $this->state(fn () => [
            'status' => BuildStatus::ActionRequired,
            'total_high' => fake()->numberBetween(1, 3),
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Enums\BuildStatus;
use App\Models\Build;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BuildApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_builds(): void
    {
        $this->getJson('/api/builds')->assertUnauthorized();
    }

    public function test_user_can_list_build_history(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        Build::factory()->count(3)->create(['project_id' => $project->id]);

        $this->actingAs($user)
            ->getJson('/api/builds')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_build_list_filters_by_project_and_status(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        Build::factory()->failed()->create(['project_id' => $project->id]);
        Build::factory()->create(['project_id' => $project->id, 'status' => BuildStatus::Passed]);

        $this->actingAs($user)
            ->getJson("/api/builds?project_id={$project->id}&status=failed")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', BuildStatus::Failed->value);
    }

    public function test_user_can_show_single_build(): void
    {
        $user = User::factory()->create();
        $build = Build::factory()->create(['branch' => 'release/1.0']);

        $this->actingAs($user)
            ->getJson("/api/builds/{$build->id}")
            ->assertOk()
            ->assertJsonPath('data.branch', 'release/1.0')
            ->assertJsonPath('data.commit_hash', $build->commit_hash);
    }

    public function test_show_missing_build_returns_not_found(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/builds/999999')
            ->assertNotFound();
    }
}

<?php

namespace Tests\Feature;

use App\Enums\BuildStatus;
use App\Models\Build;
use App\Models\Project;
use App\Models\User;
use App\Models\Vulnerability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_dashboard(): void
    {
        $this->getJson('/api/dashboard/summary')->assertUnauthorized();
    }

    public function test_summary_returns_severity_breakdown_and_recent_builds(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $build = Build::factory()->failed()->create([
            'project_id' => $project->id,
            'total_critical' => 1,
            'total_high' => 2,
        ]);

        Vulnerability::factory()->critical()->create([
            'project_id' => $project->id,
            'first_seen_build_id' => $build->id,
            'last_seen_build_id' => $build->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/summary');

        $response->assertOk()
            ->assertJsonPath('open_findings.by_severity.CRITICAL', 1)
            ->assertJsonPath('open_findings.total', 1)
            ->assertJsonPath('recent_builds.0.status', BuildStatus::Failed->value)
            ->assertJsonPath('recent_builds.0.id', $build->id)
            ->assertJsonStructure([
                'total_projects',
                'total_builds',
                'open_findings' => ['by_severity', 'total'],
                'unread_notifications',
                'recent_builds',
            ]);
    }

    public function test_trends_group_latest_build_per_app_version(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        Build::factory()->create([
            'project_id' => $project->id,
            'app_version' => '1.0.0',
            'total_critical' => 3,
            'total_high' => 1,
            'status' => BuildStatus::Failed,
        ]);

        Build::factory()->create([
            'project_id' => $project->id,
            'app_version' => '1.1.0',
            'total_critical' => 0,
            'total_high' => 1,
            'status' => BuildStatus::ActionRequired,
        ]);

        Build::factory()->create([
            'project_id' => $project->id,
            'app_version' => '1.1.0',
            'total_critical' => 0,
            'total_high' => 0,
            'status' => BuildStatus::Passed,
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/trends');

        $response->assertOk();

        $trends = $response->json('trends');

        $this->assertCount(2, $trends);
        $this->assertSame('1.0.0', $trends[0]['app_version']);
        $this->assertSame(3, $trends[0]['total_critical']);
        $this->assertSame('1.1.0', $trends[1]['app_version']);
        $this->assertSame(BuildStatus::Passed->value, $trends[1]['status']);
    }

    public function test_version_history_groups_builds_by_version(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        Build::factory()->count(2)->create([
            'project_id' => $project->id,
            'app_version' => '2.0.0',
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/version-history?project_id='.$project->id);

        $response->assertOk()
            ->assertJsonCount(1, 'versions')
            ->assertJsonPath('versions.0.app_version', '2.0.0')
            ->assertJsonPath('versions.0.build_count', 2);
    }

    public function test_version_history_requires_project_id(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/dashboard/version-history')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['project_id']);
    }
}

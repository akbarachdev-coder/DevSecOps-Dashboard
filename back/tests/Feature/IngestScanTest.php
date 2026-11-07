<?php

namespace Tests\Feature;

use App\Enums\BuildStatus;
use App\Enums\Severity;
use App\Enums\VulnerabilityStatus;
use App\Models\Project;
use App\Models\Vulnerability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IngestScanTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'commit_hash' => str_repeat('a', 40),
            'branch' => 'main',
            'app_version' => '1.2.0',
            'scanner_tool' => 'trivy',
            'duration_seconds' => 42,
            'findings' => [
                [
                    'vulnerability_id' => 'CVE-2024-1234',
                    'title' => 'Prototype pollution in lodash',
                    'description' => 'Allows remote attackers to execute arbitrary code.',
                    'severity' => 'CRITICAL',
                    'package_name' => 'lodash',
                    'installed_version' => '4.17.15',
                    'fixed_version' => '4.17.21',
                    'file_path' => 'package-lock.json',
                ],
                [
                    'vulnerability_id' => 'CVE-2024-5678',
                    'title' => 'ReDoS in minimatch',
                    'severity' => 'MEDIUM',
                    'package_name' => 'minimatch',
                    'installed_version' => '3.0.4',
                    'fixed_version' => '3.0.5',
                ],
            ],
        ], $overrides);
    }

    public function test_ingest_requires_valid_api_token(): void
    {
        $this->postJson('/api/ingest/scans', $this->payload())
            ->assertUnauthorized();

        $this->postJson('/api/ingest/scans', $this->payload(), [
            'X-API-Token' => 'invalid-token',
        ])->assertUnauthorized();
    }

    public function test_ingest_creates_build_with_severity_totals(): void
    {
        $project = Project::factory()->create();

        $response = $this->postJson('/api/ingest/scans', $this->payload(), [
            'X-API-Token' => $project->api_token,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', BuildStatus::Failed->value)
            ->assertJsonPath('data.total_critical', 1)
            ->assertJsonPath('data.total_medium', 1)
            ->assertJsonPath('data.total_high', 0)
            ->assertJsonPath('data.app_version', '1.2.0');

        $this->assertDatabaseCount('builds', 1);
        $this->assertDatabaseHas('builds', [
            'project_id' => $project->id,
            'scanner_tool' => 'trivy',
            'total_critical' => 1,
            'total_medium' => 1,
        ]);
    }

    public function test_ingest_creates_findings_and_notifications_for_new_issues(): void
    {
        $project = Project::factory()->create();

        $this->postJson('/api/ingest/scans', $this->payload(), [
            'X-API-Token' => $project->api_token,
        ])->assertCreated();

        $this->assertDatabaseCount('vulnerabilities', 2);
        $this->assertDatabaseCount('security_notifications', 2);

        $this->assertDatabaseHas('vulnerabilities', [
            'project_id' => $project->id,
            'vulnerability_id' => 'CVE-2024-1234',
            'severity' => Severity::Critical->value,
            'status' => VulnerabilityStatus::Open->value,
        ]);

        $this->assertDatabaseHas('security_notifications', [
            'project_id' => $project->id,
            'type' => 'new_finding',
            'severity' => Severity::Critical->value,
            'read_at' => null,
        ]);
    }

    public function test_reingest_updates_existing_finding_without_duplicate_notification(): void
    {
        $project = Project::factory()->create();

        $this->postJson('/api/ingest/scans', $this->payload(), [
            'X-API-Token' => $project->api_token,
        ])->assertCreated();

        $this->postJson('/api/ingest/scans', $this->payload([
            'commit_hash' => str_repeat('b', 40),
        ]), [
            'X-API-Token' => $project->api_token,
        ])->assertCreated();

        $this->assertDatabaseCount('builds', 2);
        $this->assertDatabaseCount('vulnerabilities', 2);
        $this->assertDatabaseCount('security_notifications', 2);
    }

    public function test_missing_findings_are_marked_resolved_on_new_scan(): void
    {
        $project = Project::factory()->create();

        $this->postJson('/api/ingest/scans', $this->payload(), [
            'X-API-Token' => $project->api_token,
        ])->assertCreated();

        $this->postJson('/api/ingest/scans', $this->payload([
            'commit_hash' => str_repeat('c', 40),
            'findings' => [],
        ]), [
            'X-API-Token' => $project->api_token,
        ])->assertCreated();

        $this->assertSame(
            2,
            Vulnerability::where('status', VulnerabilityStatus::Resolved)->count(),
        );
    }

    public function test_critical_findings_mark_build_failed(): void
    {
        $project = Project::factory()->create();

        $this->postJson('/api/ingest/scans', $this->payload([
            'findings' => [
                [
                    'vulnerability_id' => 'CVE-2024-9999',
                    'title' => 'Critical RCE',
                    'severity' => 'CRITICAL',
                ],
            ],
        ]), [
            'X-API-Token' => $project->api_token,
        ])->assertCreated()
            ->assertJsonPath('data.status', BuildStatus::Failed->value);
    }

    public function test_clean_scan_marks_build_passed(): void
    {
        $project = Project::factory()->create();

        $this->postJson('/api/ingest/scans', $this->payload(['findings' => []]), [
            'X-API-Token' => $project->api_token,
        ])->assertCreated()
            ->assertJsonPath('data.status', BuildStatus::Passed->value);
    }

    public function test_ingest_validates_findings_payload(): void
    {
        $project = Project::factory()->create();

        $this->postJson('/api/ingest/scans', [
            'branch' => 'main',
        ], [
            'X-API-Token' => $project->api_token,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['commit_hash', 'app_version', 'scanner_tool']);
    }

    public function test_project_cannot_use_another_projects_token_scope(): void
    {
        $projectA = Project::factory()->create();
        $projectB = Project::factory()->create();

        $this->postJson('/api/ingest/scans', $this->payload(), [
            'X-API-Token' => $projectA->api_token,
        ])->assertCreated();

        $this->assertDatabaseMissing('builds', ['project_id' => $projectB->id]);
        $this->assertDatabaseHas('builds', ['project_id' => $projectA->id]);
    }
}

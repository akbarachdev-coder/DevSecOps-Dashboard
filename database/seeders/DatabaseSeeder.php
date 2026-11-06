<?php

namespace Database\Seeders;

use App\Enums\BuildStatus;
use App\Enums\Severity;
use App\Enums\VulnerabilityStatus;
use App\Models\Build;
use App\Models\Project;
use App\Models\SecurityNotification;
use App\Models\User;
use App\Models\Vulnerability;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $project = Project::factory()->create([
            'name' => 'SecureCI Demo',
            'repository_url' => 'https://github.com/example/secureci-demo',
        ]);

        $versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0'];

        foreach ($versions as $index => $version) {
            $hasFindings = $index < 3;

            $build = Build::factory()->create([
                'project_id' => $project->id,
                'app_version' => $version,
                'branch' => 'main',
                'scanner_tool' => 'trivy',
                'status' => $hasFindings
                    ? ($index === 0 ? BuildStatus::Failed : BuildStatus::ActionRequired)
                    : BuildStatus::Passed,
                'total_critical' => $index === 0 ? 2 : 0,
                'total_high' => $hasFindings ? 1 + $index : 0,
                'total_medium' => $hasFindings ? 3 : 0,
                'total_low' => $hasFindings ? 5 : 0,
            ]);

            if (! $hasFindings) {
                continue;
            }

            $severity = $index === 0 ? Severity::Critical : Severity::High;

            $vulnerability = Vulnerability::factory()->create([
                'project_id' => $project->id,
                'first_seen_build_id' => $build->id,
                'last_seen_build_id' => $build->id,
                'severity' => $severity,
                'status' => VulnerabilityStatus::Open,
                'vulnerability_id' => 'CVE-2024-000'.$index,
                'title' => 'Demo vulnerability in release '.$version,
                'package_name' => 'demo-package',
                'installed_version' => '1.0.'.$index,
                'fixed_version' => '1.0.'.($index + 1),
            ]);

            SecurityNotification::factory()->create([
                'project_id' => $project->id,
                'vulnerability_id' => $vulnerability->id,
                'severity' => $severity,
                'title' => sprintf('New %s finding: %s', $severity->value, $vulnerability->title),
                'read_at' => $index === 0 ? now() : null,
            ]);
        }
    }
}

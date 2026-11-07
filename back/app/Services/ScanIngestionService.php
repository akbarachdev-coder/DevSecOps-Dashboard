<?php

namespace App\Services;

use App\Enums\BuildStatus;
use App\Enums\Severity;
use App\Enums\VulnerabilityStatus;
use App\Models\Build;
use App\Models\Project;
use App\Models\SecurityNotification;
use App\Models\Vulnerability;
use Illuminate\Support\Facades\DB;

class ScanIngestionService
{
    /**
     * Ingest a dependency scan report: create a build, upsert findings,
     * resolve findings that disappeared, and notify on new findings.
     *
     * @param  array{
     *     commit_hash: string,
     *     branch: string,
     *     app_version: string,
     *     scanner_tool: string,
     *     duration_seconds?: int,
     *     findings?: list<array{
     *         vulnerability_id: string,
     *         title: string,
     *         description?: ?string,
     *         severity: Severity|value-of<Severity::cases>,
     *         package_name?: ?string,
     *         installed_version?: ?string,
     *         fixed_version?: ?string,
     *         file_path?: ?string,
     *         line_number?: ?int,
     *     }>,
     * }  $payload
     */
    public function ingest(Project $project, array $payload): Build
    {
        return DB::transaction(function () use ($project, $payload): Build {
            $findings = $payload['findings'] ?? [];

            $build = $project->builds()->create([
                'commit_hash' => $payload['commit_hash'],
                'branch' => $payload['branch'],
                'app_version' => $payload['app_version'],
                'scanner_tool' => $payload['scanner_tool'],
                'duration_seconds' => $payload['duration_seconds'] ?? 0,
                'status' => BuildStatus::Passed,
                'total_critical' => 0,
                'total_high' => 0,
                'total_medium' => 0,
                'total_low' => 0,
            ]);

            $counts = [
                Severity::Critical->value => 0,
                Severity::High->value => 0,
                Severity::Medium->value => 0,
                Severity::Low->value => 0,
                Severity::Info->value => 0,
            ];

            $seenVulnerabilityIds = [];

            foreach ($findings as $finding) {
                $severity = $finding['severity'] instanceof Severity
                    ? $finding['severity']
                    : Severity::from($finding['severity']);

                $vulnerability = $this->upsertFinding($project, $build, $finding, $severity);
                $seenVulnerabilityIds[] = $vulnerability->id;

                if ($severity !== Severity::Info) {
                    $counts[$severity->value]++;
                }
            }

            $this->resolveMissingFindings($project, $build, $seenVulnerabilityIds);

            $build->update([
                'total_critical' => $counts[Severity::Critical->value],
                'total_high' => $counts[Severity::High->value],
                'total_medium' => $counts[Severity::Medium->value],
                'total_low' => $counts[Severity::Low->value],
                'status' => $this->resolveBuildStatus($counts),
            ]);

            return $build->refresh();
        });
    }

    /**
     * @param  array{
     *         vulnerability_id: string,
     *         title: string,
     *         description?: ?string,
     *         severity: Severity|value-of<Severity::cases>,
     *         package_name?: ?string,
     *         installed_version?: ?string,
     *         fixed_version?: ?string,
     *         file_path?: ?string,
     *         line_number?: ?int,
     *     }  $finding
     */
    private function upsertFinding(
        Project $project,
        Build $build,
        array $finding,
        Severity $severity,
    ): Vulnerability {
        $attributes = [
            'vulnerability_id' => $finding['vulnerability_id'],
            'package_name' => $finding['package_name'] ?? null,
            'file_path' => $finding['file_path'] ?? null,
        ];

        $vulnerability = Vulnerability::query()
            ->whereBelongsTo($project)
            ->where('vulnerability_id', $attributes['vulnerability_id'])
            ->where('package_name', $attributes['package_name'])
            ->where('file_path', $attributes['file_path'])
            ->first();

        if ($vulnerability === null) {
            $vulnerability = Vulnerability::create([
                ...$attributes,
                'project_id' => $project->id,
                'title' => $finding['title'],
                'description' => $finding['description'] ?? null,
                'severity' => $severity,
                'installed_version' => $finding['installed_version'] ?? null,
                'fixed_version' => $finding['fixed_version'] ?? null,
                'line_number' => $finding['line_number'] ?? null,
                'status' => VulnerabilityStatus::Open,
                'first_seen_build_id' => $build->id,
                'last_seen_build_id' => $build->id,
            ]);

            $this->createNotification($project, $vulnerability);

            return $vulnerability;
        }

        $vulnerability->update([
            'title' => $finding['title'],
            'description' => $finding['description'] ?? $vulnerability->description,
            'severity' => $severity,
            'installed_version' => $finding['installed_version'] ?? $vulnerability->installed_version,
            'fixed_version' => $finding['fixed_version'] ?? $vulnerability->fixed_version,
            'line_number' => $finding['line_number'] ?? $vulnerability->line_number,
            'last_seen_build_id' => $build->id,
            'resolved_at' => null,
            ...($vulnerability->status === VulnerabilityStatus::Resolved
                ? ['status' => VulnerabilityStatus::Open]
                : []),
        ]);

        return $vulnerability;
    }

    /**
     * Mark open findings that were not reported in this scan as resolved.
     *
     * @param  list<int>  $seenVulnerabilityIds
     */
    private function resolveMissingFindings(
        Project $project,
        Build $build,
        array $seenVulnerabilityIds,
    ): void {
        $query = $project->vulnerabilities()->open();

        if ($seenVulnerabilityIds !== []) {
            $query->whereNotIn('id', $seenVulnerabilityIds);
        }

        $query->update([
            'status' => VulnerabilityStatus::Resolved,
            'resolved_at' => now(),
            'last_seen_build_id' => $build->id,
        ]);
    }

    private function createNotification(Project $project, Vulnerability $vulnerability): void
    {
        SecurityNotification::create([
            'project_id' => $project->id,
            'vulnerability_id' => $vulnerability->id,
            'type' => 'new_finding',
            'title' => sprintf('New %s finding: %s', $vulnerability->severity->value, $vulnerability->title),
            'message' => sprintf(
                '%s detected in %s%s.',
                $vulnerability->vulnerability_id,
                $vulnerability->package_name ?? 'the codebase',
                $vulnerability->fixed_version !== null
                    ? sprintf(' (fix available: %s)', $vulnerability->fixed_version)
                    : '',
            ),
            'severity' => $vulnerability->severity,
        ]);
    }

    /**
     * @param  array<string, int>  $counts
     */
    private function resolveBuildStatus(array $counts): BuildStatus
    {
        if ($counts[Severity::Critical->value] > 0) {
            return BuildStatus::Failed;
        }

        if ($counts[Severity::High->value] > 0 || $counts[Severity::Medium->value] > 0) {
            return BuildStatus::ActionRequired;
        }

        return BuildStatus::Passed;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Build;
use App\Models\Project;
use App\Models\SecurityNotification;
use App\Models\Vulnerability;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * High-level dashboard summary.
     *
     * @return array<string, mixed>
     */
    public function summary(Request $request): array
    {
        $projectId = $request->integer('project_id');

        $openVulnerabilities = Vulnerability::query()
            ->open()
            ->when($projectId > 0, fn ($query) => $query->where('project_id', $projectId));

        $severityCounts = [
            'CRITICAL' => 0,
            'HIGH' => 0,
            'MEDIUM' => 0,
            'LOW' => 0,
            'INFO' => 0,
        ];

        foreach ($openVulnerabilities->clone()->get(['severity']) as $vulnerability) {
            $severityCounts[$vulnerability->severity->value]++;
        }

        $recentBuilds = Build::query()
            ->when($projectId > 0, fn ($query) => $query->where('project_id', $projectId))
            ->with('project:id,name')
            ->latest()
            ->limit(5)
            ->get();

        return [
            'total_projects' => Project::count(),
            'total_builds' => Build::when($projectId > 0, fn ($query) => $query->where('project_id', $projectId))->count(),
            'open_findings' => [
                'by_severity' => $severityCounts,
                'total' => array_sum($severityCounts),
            ],
            'unread_notifications' => SecurityNotification::query()
                ->whereNull('read_at')
                ->when($projectId > 0, fn ($query) => $query->where('project_id', $projectId))
                ->count(),
            'recent_builds' => $recentBuilds->map(fn (Build $build) => [
                'id' => $build->id,
                'project_id' => $build->project_id,
                'project_name' => $build->project?->name,
                'branch' => $build->branch,
                'app_version' => $build->app_version,
                'status' => $build->status->value,
                'total_critical' => $build->total_critical,
                'total_high' => $build->total_high,
                'created_at' => $build->created_at,
            ]),
        ];
    }

    /**
     * Security trend per application version (severity totals from latest build per version).
     *
     * @return array<string, mixed>
     */
    public function trends(Request $request): array
    {
        $projectId = $request->integer('project_id');

        $builds = Build::query()
            ->when($projectId > 0, fn ($query) => $query->where('project_id', $projectId))
            ->orderBy('app_version')
            ->orderBy('created_at')
            ->get(['id', 'project_id', 'app_version', 'status', 'total_critical', 'total_high', 'total_medium', 'total_low', 'created_at']);

        $latestByVersion = $builds->groupBy('app_version')->map(
            fn ($versionBuilds) => $versionBuilds->last(),
        )->values();

        $trends = $latestByVersion->map(fn (Build $build) => [
            'app_version' => $build->app_version,
            'status' => $build->status->value,
            'total_critical' => $build->total_critical,
            'total_high' => $build->total_high,
            'total_medium' => $build->total_medium,
            'total_low' => $build->total_low,
            'total_findings' => $build->total_critical + $build->total_high + $build->total_medium + $build->total_low,
            'scanned_at' => $build->created_at,
        ])->values();

        return [
            'project_id' => $projectId ?: null,
            'trends' => $trends,
        ];
    }

    /**
     * Per-version build history for a project (security timeline).
     *
     * @return array<string, mixed>
     */
    public function versionHistory(Request $request): array
    {
        $request->validate([
            'project_id' => ['required', 'integer', 'exists:projects,id'],
        ]);

        $builds = Build::query()
            ->where('project_id', $request->integer('project_id'))
            ->orderByDesc('created_at')
            ->get();

        $grouped = $builds->groupBy('app_version')->map(fn ($versionBuilds) => [
            'app_version' => $versionBuilds->first()->app_version,
            'build_count' => $versionBuilds->count(),
            'latest_status' => $versionBuilds->first()->status->value,
            'latest_build_id' => $versionBuilds->first()->id,
            'builds' => $versionBuilds->map(fn (Build $build) => [
                'id' => $build->id,
                'branch' => $build->branch,
                'commit_hash' => $build->commit_hash,
                'status' => $build->status->value,
                'total_critical' => $build->total_critical,
                'total_high' => $build->total_high,
                'total_medium' => $build->total_medium,
                'total_low' => $build->total_low,
                'created_at' => $build->created_at,
            ]),
        ])->values();

        return [
            'project_id' => $request->integer('project_id'),
            'versions' => $grouped,
        ];
    }
}

<?php

namespace App\Models;

use App\Enums\BuildStatus;
use Database\Factories\BuildFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'project_id',
    'commit_hash',
    'branch',
    'app_version',
    'scanner_tool',
    'status',
    'total_critical',
    'total_high',
    'total_medium',
    'total_low',
    'duration_seconds',
])]
class Build extends Model
{
    /** @use HasFactory<BuildFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => BuildStatus::class,
            'total_critical' => 'integer',
            'total_high' => 'integer',
            'total_medium' => 'integer',
            'total_low' => 'integer',
            'duration_seconds' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return HasMany<Vulnerability, $this>
     */
    public function firstSeenVulnerabilities(): HasMany
    {
        return $this->hasMany(Vulnerability::class, 'first_seen_build_id');
    }

    /**
     * @return HasMany<Vulnerability, $this>
     */
    public function lastSeenVulnerabilities(): HasMany
    {
        return $this->hasMany(Vulnerability::class, 'last_seen_build_id');
    }
}

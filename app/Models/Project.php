<?php

namespace App\Models;

use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'repository_url', 'api_token'])]
#[Hidden(['api_token'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Project $project): void {
            $project->api_token ??= Str::random(64);
        });
    }

    /**
     * @return HasMany<Build, $this>
     */
    public function builds(): HasMany
    {
        return $this->hasMany(Build::class);
    }

    /**
     * @return HasMany<Vulnerability, $this>
     */
    public function vulnerabilities(): HasMany
    {
        return $this->hasMany(Vulnerability::class);
    }

    /**
     * @return HasMany<SecurityNotification, $this>
     */
    public function securityNotifications(): HasMany
    {
        return $this->hasMany(SecurityNotification::class);
    }
}

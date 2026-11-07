<?php

namespace App\Models;

use App\Enums\Severity;
use Database\Factories\SecurityNotificationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'project_id',
    'vulnerability_id',
    'type',
    'title',
    'message',
    'severity',
    'read_at',
])]
class SecurityNotification extends Model
{
    /** @use HasFactory<SecurityNotificationFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'severity' => Severity::class,
            'read_at' => 'datetime',
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
     * @return BelongsTo<Vulnerability, $this>
     */
    public function vulnerability(): BelongsTo
    {
        return $this->belongsTo(Vulnerability::class);
    }
}

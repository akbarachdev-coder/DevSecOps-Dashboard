<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BuildResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'commit_hash' => $this->commit_hash,
            'branch' => $this->branch,
            'app_version' => $this->app_version,
            'scanner_tool' => $this->scanner_tool,
            'status' => $this->status->value,
            'total_critical' => $this->total_critical,
            'total_high' => $this->total_high,
            'total_medium' => $this->total_medium,
            'total_low' => $this->total_low,
            'duration_seconds' => $this->duration_seconds,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Enums\Severity;
use App\Models\SecurityNotification;
use App\Models\Vulnerability;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SecurityNotification>
 */
class SecurityNotificationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $vulnerability = Vulnerability::factory()->create();

        return [
            'project_id' => $vulnerability->project_id,
            'vulnerability_id' => $vulnerability->id,
            'type' => 'new_finding',
            'title' => 'New '.Severity::High->value.' finding: '.$vulnerability->title,
            'message' => 'A new finding was detected during the latest scan.',
            'severity' => $vulnerability->severity,
            'read_at' => null,
        ];
    }

    public function read(): static
    {
        return $this->state(fn () => ['read_at' => now()]);
    }
}

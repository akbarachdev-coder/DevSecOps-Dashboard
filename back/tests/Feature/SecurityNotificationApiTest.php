<?php

namespace Tests\Feature;

use App\Enums\Severity;
use App\Models\Project;
use App\Models\SecurityNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityNotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_notifications(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
    }

    public function test_user_can_list_notifications(): void
    {
        $user = User::factory()->create();
        SecurityNotification::factory()->count(3)->create();

        $this->actingAs($user)
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_notifications_filter_unread_only(): void
    {
        $user = User::factory()->create();
        SecurityNotification::factory()->read()->create();
        SecurityNotification::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/notifications?unread_only=1')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_user_can_mark_notification_read(): void
    {
        $user = User::factory()->create();
        $notification = SecurityNotification::factory()->create(['read_at' => null]);

        $this->actingAs($user)
            ->postJson("/api/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('data.read_at', fn ($value) => $value !== null);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_read(): void
    {
        $user = User::factory()->create();
        SecurityNotification::factory()->count(4)->create(['read_at' => null]);
        SecurityNotification::factory()->read()->create();

        $this->actingAs($user)
            ->postJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('updated', 4);

        $this->assertSame(0, SecurityNotification::whereNull('read_at')->count());
    }

    public function test_notifications_filter_by_severity(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        SecurityNotification::factory()->create([
            'project_id' => $project->id,
            'severity' => Severity::Critical,
        ]);
        SecurityNotification::factory()->create([
            'project_id' => $project->id,
            'severity' => Severity::Low,
        ]);

        $this->actingAs($user)
            ->getJson('/api/notifications?severity=CRITICAL')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.severity', Severity::Critical->value);
    }
}

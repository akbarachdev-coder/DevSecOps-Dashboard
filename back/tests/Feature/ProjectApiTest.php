<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_projects(): void
    {
        $this->getJson('/api/projects')->assertUnauthorized();
    }

    public function test_user_can_list_projects(): void
    {
        $user = User::factory()->create();
        Project::factory()->count(2)->create();

        $this->actingAs($user)
            ->getJson('/api/projects')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_user_can_create_project(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/projects', [
            'name' => 'My App',
            'repository_url' => 'https://github.com/example/my-app',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'My App')
            ->assertJsonStructure(['data' => ['id', 'name', 'repository_url', 'api_token']]);

        $this->assertDatabaseHas('projects', [
            'name' => 'My App',
            'repository_url' => 'https://github.com/example/my-app',
        ]);

        $this->assertNotEmpty($response->json('data.api_token'));
    }

    public function test_create_project_requires_name_and_repository_url(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/projects', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'repository_url']);
    }

    public function test_user_can_show_project_without_token_by_default(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['name' => 'Visible Project']);

        $this->actingAs($user)
            ->getJson("/api/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Visible Project')
            ->assertJsonMissingPath('data.api_token');
    }

    public function test_user_can_update_project(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($user)
            ->putJson("/api/projects/{$project->id}", [
                'name' => 'Renamed',
                'repository_url' => $project->repository_url,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed');
    }

    public function test_user_can_delete_project(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($user)
            ->deleteJson("/api/projects/{$project->id}")
            ->assertOk();

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_user_can_rotate_api_token(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $original = $project->api_token;

        $this->actingAs($user)
            ->postJson("/api/projects/{$project->id}/rotate-token")
            ->assertOk()
            ->assertJsonStructure(['api_token']);

        $this->assertNotSame($original, $project->fresh()->api_token);
    }
}

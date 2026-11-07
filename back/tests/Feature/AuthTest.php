<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login_from_protected_pages(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/vulnerabilities')->assertRedirect('/login');
        $this->get('/api/projects')->assertUnauthorized();
    }

    public function test_login_screen_renders(): void
    {
        $this->get('/login')->assertOk();
    }

    public function test_user_can_log_in_and_access_dashboard(): void
    {
        $user = User::factory()->create();

        $this->from('/dashboard')
            ->post('/login', [
                'email' => $user->email,
                'password' => 'password',
            ])
            ->assertRedirect('/dashboard');

        $this->assertAuthenticatedAs($user);

        $this->get('/dashboard')->assertOk();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->post('/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_session_authenticates_api_requests_from_the_browser(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('ui.dashboard'));

        $this->getJson('/api/dashboard/summary')->assertOk();
        $this->getJson('/api/projects')->assertOk();
    }

    public function test_user_can_log_out(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/logout')
            ->assertRedirect('/login');

        $this->assertGuest();

        $this->get('/dashboard')->assertRedirect('/login');
    }
}

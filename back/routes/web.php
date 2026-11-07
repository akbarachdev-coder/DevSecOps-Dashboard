<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->name('login.attempt');
});

Route::post('/logout', [AuthController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', fn () => redirect()->route('ui.dashboard'))->name('home');

    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('ui.dashboard');
    Route::get('/builds', fn () => Inertia::render('Builds'))->name('ui.builds');
    Route::get('/vulnerabilities', fn () => Inertia::render('Vulnerabilities'))->name('ui.vulnerabilities');
    Route::get('/trends', fn () => Inertia::render('Trends'))->name('ui.trends');
    Route::get('/projects', fn () => Inertia::render('Projects'))->name('ui.projects');
    Route::get('/notifications', fn () => Inertia::render('Notifications'))->name('ui.notifications');
});

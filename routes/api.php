<?php

use App\Http\Controllers\Api\BuildController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\IngestController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SecurityNotificationController;
use App\Http\Controllers\Api\VulnerabilityController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::apiResource('projects', ProjectController::class);
    Route::post('projects/{project}/rotate-token', [ProjectController::class, 'rotateToken'])
        ->name('projects.rotate-token');

    Route::get('builds', [BuildController::class, 'index'])->name('builds.index');
    Route::get('builds/{build}', [BuildController::class, 'show'])->name('builds.show');

    Route::get('vulnerabilities', [VulnerabilityController::class, 'index'])->name('vulnerabilities.index');
    Route::get('vulnerabilities/summary/severity', [VulnerabilityController::class, 'severitySummary'])->name('vulnerabilities.severity-summary');
    Route::get('vulnerabilities/{vulnerability}', [VulnerabilityController::class, 'show'])->name('vulnerabilities.show');
    Route::patch('vulnerabilities/{vulnerability}', [VulnerabilityController::class, 'update'])->name('vulnerabilities.update');

    Route::get('dashboard/summary', [DashboardController::class, 'summary'])->name('dashboard.summary');
    Route::get('dashboard/trends', [DashboardController::class, 'trends'])->name('dashboard.trends');
    Route::get('dashboard/version-history', [DashboardController::class, 'versionHistory'])->name('dashboard.version-history');

    Route::get('notifications', [SecurityNotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/read-all', [SecurityNotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::post('notifications/{notification}/read', [SecurityNotificationController::class, 'markRead'])->name('notifications.read');
});

Route::post('ingest/scans', [IngestController::class, 'store'])
    ->middleware('project.api')
    ->name('ingest.scans');

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BuildResource;
use App\Models\Build;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BuildController extends Controller
{
    /**
     * Build history with optional filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $builds = Build::query()
            ->when($request->filled('project_id'), fn ($query) => $query->where('project_id', $request->integer('project_id')))
            ->when($request->filled('branch'), fn ($query) => $query->where('branch', $request->string('branch')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('app_version'), fn ($query) => $query->where('app_version', $request->string('app_version')))
            ->when($request->filled('scanner_tool'), fn ($query) => $query->where('scanner_tool', $request->string('scanner_tool')))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return BuildResource::collection($builds);
    }

    /**
     * Display a single build.
     */
    public function show(Build $build): BuildResource
    {
        return new BuildResource($build);
    }
}

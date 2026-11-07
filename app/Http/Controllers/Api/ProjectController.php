<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * List all projects.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $projects = Project::query()
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return ProjectResource::collection($projects);
    }

    /**
     * Store a newly created project.
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = Project::create($request->validated());

        return (new ProjectResource($project))
            ->additional(['message' => 'Project created. Store the api_token for CI ingestion.'])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified project.
     */
    public function show(Request $request, Project $project): ProjectResource
    {
        return new ProjectResource($project);
    }

    /**
     * Update the specified project.
     */
    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        $project->update($request->validated());

        return new ProjectResource($project->refresh());
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json(['message' => 'Project deleted.'], 200);
    }

    /**
     * Rotate the project API token (for CI reconfiguration).
     */
    public function rotateToken(Project $project): JsonResponse
    {
        $project->update(['api_token' => Str::random(64)]);

        return response()->json([
            'message' => 'API token rotated.',
            'api_token' => $project->fresh()->api_token,
        ]);
    }
}

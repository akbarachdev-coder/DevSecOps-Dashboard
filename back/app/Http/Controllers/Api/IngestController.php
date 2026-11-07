<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IngestScanRequest;
use App\Http\Resources\BuildResource;
use App\Models\Project;
use App\Services\ScanIngestionService;
use Illuminate\Http\JsonResponse;

class IngestController extends Controller
{
    public function __construct(
        private ScanIngestionService $scanIngestion,
    ) {}

    /**
     * Ingest a dependency scan report from CI using the project API token.
     */
    public function store(IngestScanRequest $request): JsonResponse
    {
        /** @var Project $project */
        $project = $request->attributes->get('project');

        $build = $this->scanIngestion->ingest($project, $request->validated());

        return (new BuildResource($build->load('project:id,name')))
            ->additional([
                'message' => 'Scan ingested.',
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                ],
            ])
            ->response()
            ->setStatusCode(201);
    }
}

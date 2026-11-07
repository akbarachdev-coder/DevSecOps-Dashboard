<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateProjectApi
{
    /**
     * Authenticate CI/CD ingestion requests via the project API token.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-API-Token') ?? $request->bearerToken();

        $project = filled($token)
            ? Project::where('api_token', $token)->first()
            : null;

        if ($project === null) {
            return response()->json([
                'message' => 'Unauthenticated. Provide a valid project API token.',
            ], 401);
        }

        $request->attributes->set('project', $project);

        return $next($request);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SecurityNotificationResource;
use App\Models\SecurityNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SecurityNotificationController extends Controller
{
    /**
     * List security notifications (new findings).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $notifications = SecurityNotification::query()
            ->when($request->filled('project_id'), fn ($query) => $query->where('project_id', $request->integer('project_id')))
            ->when($request->boolean('unread_only'), fn ($query) => $query->whereNull('read_at'))
            ->when($request->filled('severity'), fn ($query) => $query->where('severity', $request->string('severity')))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return SecurityNotificationResource::collection($notifications);
    }

    /**
     * Mark a notification as read.
     */
    public function markRead(SecurityNotification $notification): SecurityNotificationResource
    {
        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return new SecurityNotificationResource($notification->refresh());
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $updated = SecurityNotification::query()
            ->whereNull('read_at')
            ->when($request->filled('project_id'), fn ($query) => $query->where('project_id', $request->integer('project_id')))
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marked as read.',
            'updated' => $updated,
        ]);
    }
}

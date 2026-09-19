<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityGroupInvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'activity_group_id' => $this->activity_group_id,
            'invited_user_id' => $this->invited_user_id,
            'invited_by_user_id' => $this->invited_by_user_id,
            'status' => $this->status,
            'invited_user' => UserResource::make($this->whenLoaded('invitedUser')),
            'invited_by' => UserResource::make($this->whenLoaded('invitedBy')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'activity_id' => $this->activity_id,
            'name' => $this->name,
            'capacity' => $this->capacity,
            'leader_user_id' => $this->leader_user_id,
            'leader' => UserResource::make($this->whenLoaded('leader')),
            'description' => $this->description,
            'members' => ActivityGroupMemberResource::collection($this->whenLoaded('members')),
            'invitations' => ActivityGroupInvitationResource::collection($this->whenLoaded('invitations')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolClassResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'course' => $this->course,
            'institution' => $this->institution,
            'period' => $this->period,
            'modality' => $this->modality,
            'is_open' => $this->is_open,
            'owner_id' => $this->owner_id,
            'owner' => UserResource::make($this->whenLoaded('owner')),
            'members' => ClassMemberResource::collection($this->whenLoaded('members')),
            'announcements' => AnnouncementResource::collection($this->whenLoaded('announcements')),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'events' => EventResource::collection($this->whenLoaded('events')),
            'members_count' => $this->when(isset($this->members_count), $this->members_count),
            'my_role' => $this->when(isset($this->my_role), $this->my_role),
            'qr_code_payload' => $this->when(isset($this->qr_code_payload), $this->qr_code_payload),
        ];
    }
}

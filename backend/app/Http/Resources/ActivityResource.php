<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'class_id' => $this->class_id,
            'title' => $this->title,
            'type' => $this->type,
            'work_mode' => $this->work_mode,
            'group_size' => $this->group_size,
            'assessment_format' => $this->assessment_format,
            'points_value' => $this->points_value,
            'subject' => $this->subject,
            'due_date' => $this->due_date,
            'due_time' => $this->due_time,
            'description' => $this->description,
            'created_by' => $this->created_by,
            'creator' => UserResource::make($this->whenLoaded('creator')),
            'user_progress' => $this->user_progress
                ? UserActivityProgressResource::make($this->user_progress)
                : null,
            'groups' => ActivityGroupResource::collection($this->whenLoaded('groups')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

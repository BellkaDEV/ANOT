<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassMemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'class_id' => $this->class_id,
            'user_id' => $this->user_id,
            'role' => $this->role,
            'joined_at' => $this->joined_at,
            'user' => UserResource::make($this->whenLoaded('user')),
        ];
    }
}

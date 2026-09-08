<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityGroupMember extends Model
{
    protected $fillable = [
        'activity_group_id',
        'user_id',
        'joined_at',
    ];

    public function group()
    {
        return $this->belongsTo(ActivityGroup::class, 'activity_group_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

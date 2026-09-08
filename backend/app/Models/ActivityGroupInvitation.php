<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityGroupInvitation extends Model
{
    protected $fillable = [
        'activity_group_id',
        'invited_user_id',
        'invited_by_user_id',
        'status',
    ];

    public function group()
    {
        return $this->belongsTo(ActivityGroup::class, 'activity_group_id');
    }

    public function invitedUser()
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }

    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }
}

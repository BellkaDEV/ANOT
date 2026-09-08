<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityGroup extends Model
{
    protected $fillable = [
        'activity_id',
        'name',
        'capacity',
        'leader_user_id',
        'description',
    ];

    public function activity()
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_user_id');
    }

    public function members()
    {
        return $this->hasMany(ActivityGroupMember::class, 'activity_group_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'activity_group_members', 'activity_group_id', 'user_id')
                    ->withPivot('joined_at')
                    ->withTimestamps();
    }

    public function invitations()
    {
        return $this->hasMany(ActivityGroupInvitation::class, 'activity_group_id');
    }
}

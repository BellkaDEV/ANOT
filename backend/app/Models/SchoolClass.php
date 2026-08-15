<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    protected $fillable = [
        'code',
        'name',
        'course',
        'institution',
        'period',
        'modality',
        'is_open',
        'owner_id',
    ];

    protected $casts = [
        'is_open' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->hasMany(ClassMember::class, 'class_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'class_members', 'class_id', 'user_id')
                    ->withPivot('role', 'joined_at')
                    ->withTimestamps();
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'class_id');
    }

    public function activities()
    {
        return $this->hasMany(Activity::class, 'class_id');
    }

    public function events()
    {
        return $this->hasMany(Event::class, 'class_id');
    }
}

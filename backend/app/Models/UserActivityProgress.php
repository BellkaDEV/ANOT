<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivityProgress extends Model
{
    protected $table = 'user_activity_progress';

    protected $fillable = [
        'user_id',
        'activity_id',
        'status',
        'personal_notes',
        'score',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function activity()
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }
}

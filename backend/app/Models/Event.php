<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'class_id',
        'title',
        'description',
        'event_date',
        'event_time',
        'type',
        'subject',
        'room',
        'activity_id',
        'created_by',
    ];
}

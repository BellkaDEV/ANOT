<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = [
        'class_id',
        'title',
        'type',
        'subject',
        'due_date',
        'due_time',
        'description',
        'created_by',
    ];

    protected static function booted()
    {
        // Sincronização automática com a tabela events ao criar/editar atividade
        static::saved(function ($activity) {
            Event::updateOrCreate(
                ['activity_id' => $activity->id],
                [
                    'class_id' => $activity->class_id,
                    'title' => $activity->title,
                    'description' => $activity->description,
                    'event_date' => $activity->due_date,
                    'event_time' => $activity->due_time,
                    'type' => ($activity->type === 'teste' ? 'prova' : 'entrega'),
                    'subject' => $activity->subject,
                    'created_by' => $activity->created_by,
                ]
            );
        });

        // Remover evento vinculado ao excluir atividade
        static::deleted(function ($activity) {
            Event::where('activity_id', $activity->id)->delete();
        });
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function progresses()
    {
        return $this->hasMany(UserActivityProgress::class, 'activity_id');
    }

    public function linkedEvent()
    {
        return $this->hasOne(Event::class, 'activity_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'class_id',
        'title',
        'content',
        'priority',
        'author_id',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    protected static function booted()
    {
        // Regra de Negócio: Todo aviso criado calcula automaticamente 21 dias para expiração (expires_at)
        static::creating(function ($announcement) {
            if (!$announcement->expires_at) {
                $announcement->expires_at = now()->addDays(21);
            }
        });
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}

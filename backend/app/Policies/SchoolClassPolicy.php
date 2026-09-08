<?php

namespace App\Policies;

use App\Models\User;
use App\Models\SchoolClass;
use App\Models\ClassMember;

class SchoolClassPolicy
{
    public function view(User $user, SchoolClass $schoolClass): bool
    {
        if ($schoolClass->owner_id === $user->id) {
            return true;
        }

        return ClassMember::where('class_id', $schoolClass->id)
            ->where('user_id', $user->id)
            ->exists();
    }

    public function manage(User $user, SchoolClass $schoolClass): bool
    {
        if ($schoolClass->owner_id === $user->id) {
            return true;
        }

        $membership = ClassMember::where('class_id', $schoolClass->id)
            ->where('user_id', $user->id)
            ->first();

        return $membership && in_array($membership->role, ['owner', 'rep']);
    }

    public function delete(User $user, SchoolClass $schoolClass): bool
    {
        return $schoolClass->owner_id === $user->id;
    }
}

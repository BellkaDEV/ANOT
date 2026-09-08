<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Activity;
use App\Models\SchoolClass;
use App\Models\ClassMember;

class ActivityPolicy
{
    private function getMembership($classId, User $user): ?string
    {
        $schoolClass = SchoolClass::find($classId);
        if (!$schoolClass) {
            return null;
        }

        if ($schoolClass->owner_id === $user->id) {
            return 'owner';
        }

        $membership = ClassMember::where('class_id', $classId)
            ->where('user_id', $user->id)
            ->first();

        return $membership ? $membership->role : null;
    }

    public function view(User $user, Activity $activity): bool
    {
        $role = $this->getMembership($activity->class_id, $user);
        return !is_null($role);
    }

    public function manage(User $user, Activity $activity): bool
    {
        $role = $this->getMembership($activity->class_id, $user);
        return in_array($role, ['owner', 'rep']);
    }
}

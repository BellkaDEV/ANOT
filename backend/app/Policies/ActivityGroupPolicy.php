<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ActivityGroup;
use App\Models\SchoolClass;
use App\Models\ClassMember;

class ActivityGroupPolicy
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

    public function view(User $user, ActivityGroup $group): bool
    {
        $role = $this->getMembership($group->activity->class_id, $user);
        return !is_null($role);
    }

    public function join(User $user, ActivityGroup $group): bool
    {
        $schoolClass = $group->activity->schoolClass;
        // Owner não pode participar como aluno em grupos
        if ($schoolClass->owner_id === $user->id) {
            return false;
        }

        $role = $this->getMembership($schoolClass->id, $user);
        return !is_null($role);
    }

    public function manage(User $user, ActivityGroup $group): bool
    {
        // Líder do grupo pode gerenciar
        if ($group->leader_user_id === $user->id) {
            return true;
        }

        // Criador/Owner ou Representante da turma podem moderar grupos
        $role = $this->getMembership($group->activity->class_id, $user);
        return in_array($role, ['owner', 'rep']);
    }
}

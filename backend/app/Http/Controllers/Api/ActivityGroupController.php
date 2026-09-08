<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Activity;
use App\Models\ActivityGroup;
use App\Models\ActivityGroupMember;
use App\Models\ActivityGroupInvitation;

class ActivityGroupController extends Controller
{
    private function getMembership($classId, $user)
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

    public function index(Request $request, $activityId)
    {
        $user = $request->user();
        $activity = Activity::find($activityId);
        if (!$activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        $groups = ActivityGroup::where('activity_id', $activityId)
            ->with(['members.user:id,name,email,avatar_url', 'leader:id,name,email,avatar_url', 'invitations'])
            ->get();

        return response()->json([
            'groups' => $groups
        ]);
    }

    public function show(Request $request, $groupId)
    {
        $user = $request->user();
        $group = ActivityGroup::with(['activity', 'members.user:id,name,email,avatar_url', 'leader:id,name,email,avatar_url', 'invitations'])->find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Grupo não encontrado.'], 404);
        }

        $role = $this->getMembership($group->activity->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        return response()->json([
            'group' => $group
        ]);
    }

    public function join(Request $request, $groupId)
    {
        $user = $request->user();
        $group = ActivityGroup::with('activity.schoolClass')->find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Grupo não encontrado.'], 404);
        }

        $schoolClass = $group->activity->schoolClass;
        $role = $this->getMembership($schoolClass->id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if ($schoolClass->owner_id === $user->id) {
            return response()->json(['message' => 'O Criador/Dono da turma é o coordenador e não pode participar de grupos.'], 403);
        }

        return DB::transaction(function () use ($groupId, $group, $user) {
            // Trava todos os grupos da atividade para serializar entradas concorrentes.
            $activityGroupIds = ActivityGroup::where('activity_id', $group->activity_id)
                ->orderBy('id')
                ->lockForUpdate()
                ->pluck('id');
            $lockedGroup = ActivityGroup::where('id', $groupId)->first();

            // Verificar se o usuário já pertence a um grupo nesta atividade
            $alreadyInGroup = ActivityGroupMember::whereIn('activity_group_id', $activityGroupIds)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->exists();

            if ($alreadyInGroup) {
                return response()->json(['message' => 'Você já pertence a um grupo nesta atividade.'], 409);
            }

            // Verificar capacidade
            $currentCount = ActivityGroupMember::where('activity_group_id', $groupId)->count();
            if ($currentCount >= $lockedGroup->capacity) {
                return response()->json(['message' => 'Este grupo já atingiu a capacidade máxima.'], 422);
            }

            ActivityGroupMember::create([
                'activity_group_id' => $groupId,
                'user_id' => $user->id,
                'joined_at' => now(),
            ]);

            // Se o grupo não possui líder, o primeiro membro torna-se líder automaticamente
            if (is_null($lockedGroup->leader_user_id)) {
                $lockedGroup->leader_user_id = $user->id;
                $lockedGroup->save();
            }

            // Marcar convites pendentes deste usuário para este grupo como aceitos
            ActivityGroupInvitation::where('activity_group_id', $groupId)
                ->where('invited_user_id', $user->id)
                ->where('status', 'pending')
                ->update(['status' => 'accepted']);

            return response()->json([
                'message' => 'Você entrou no grupo com sucesso.',
                'group' => $lockedGroup->fresh(['members.user', 'leader', 'invitations'])
            ]);
        });
    }

    public function leave(Request $request, $groupId)
    {
        $user = $request->user();
        $group = ActivityGroup::find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Grupo não encontrado.'], 404);
        }

        return DB::transaction(function () use ($groupId, $group, $user) {
            $lockedGroup = ActivityGroup::where('id', $groupId)->lockForUpdate()->first();

            $member = ActivityGroupMember::where('activity_group_id', $groupId)
                ->where('user_id', $user->id)
                ->first();

            if (!$member) {
                return response()->json(['message' => 'Você não é membro deste grupo.'], 422);
            }

            $member->delete();

            // Se o líder sair, re-eleger o membro mais antigo
            if ($lockedGroup->leader_user_id === $user->id) {
                $oldest = ActivityGroupMember::where('activity_group_id', $groupId)
                    ->orderBy('joined_at', 'asc')
                    ->orderBy('id', 'asc')
                    ->first();

                $lockedGroup->leader_user_id = $oldest ? $oldest->user_id : null;
                $lockedGroup->save();
            }

            return response()->json([
                'message' => 'Você saiu do grupo.',
                'group' => $lockedGroup->fresh(['members.user', 'leader', 'invitations'])
            ]);
        });
    }

    public function updateDescription(Request $request, $groupId)
    {
        $user = $request->user();
        $group = ActivityGroup::find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Grupo não encontrado.'], 404);
        }

        if ($group->leader_user_id !== $user->id) {
            return response()->json(['message' => 'Apenas o líder do grupo pode editar a descrição/tema.'], 403);
        }

        $validated = $request->validate([
            'description' => 'nullable|string',
        ]);

        $group->update($validated);

        return response()->json([
            'message' => 'Descrição do grupo atualizada com sucesso.',
            'group' => $group
        ]);
    }

    public function invite(Request $request, $groupId)
    {
        $user = $request->user();
        $group = ActivityGroup::with('activity.schoolClass')->find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Grupo não encontrado.'], 404);
        }

        if ($group->leader_user_id !== $user->id) {
            return response()->json(['message' => 'Apenas o líder do grupo pode enviar convites.'], 403);
        }

        $validated = $request->validate([
            'invited_user_id' => 'required|integer|exists:users,id',
        ]);

        $invitedUserId = (int)$validated['invited_user_id'];
        $schoolClass = $group->activity->schoolClass;

        if ($schoolClass->owner_id === $invitedUserId) {
            return response()->json(['message' => 'O Criador/Dono da turma não pode ser convidado para grupos.'], 403);
        }

        $isMember = ClassMember::where('class_id', $schoolClass->id)
            ->where('user_id', $invitedUserId)
            ->exists();

        if (!$isMember) {
            return response()->json(['message' => 'O usuário convidado não pertence a esta turma.'], 404);
        }

        // Checar capacidade
        $currentCount = ActivityGroupMember::where('activity_group_id', $groupId)->count();
        if ($currentCount >= $group->capacity) {
            return response()->json(['message' => 'O grupo está cheio.'], 422);
        }

        // Checar se o convidado já está em um grupo desta atividade
        $alreadyInGroup = ActivityGroupMember::whereHas('group', function ($q) use ($group) {
            $q->where('activity_id', $group->activity_id);
        })->where('user_id', $invitedUserId)->exists();

        if ($alreadyInGroup) {
            return response()->json(['message' => 'O aluno já está em um grupo nesta atividade.'], 422);
        }

        // Checar convites pendentes
        $existingInvitation = ActivityGroupInvitation::where('activity_group_id', $groupId)
            ->where('invited_user_id', $invitedUserId)
            ->where('status', 'pending')
            ->first();

        if ($existingInvitation) {
            return response()->json(['message' => 'Já existe um convite pendente para este usuário neste grupo.'], 422);
        }

        $invitation = ActivityGroupInvitation::create([
            'activity_group_id' => $groupId,
            'invited_user_id' => $invitedUserId,
            'invited_by_user_id' => $user->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Convite enviado com sucesso.',
            'invitation' => $invitation->load(['invitedUser:id,name,email', 'invitedBy:id,name,email'])
        ], 201);
    }

    public function respondInvitation(Request $request, $invitationId)
    {
        $user = $request->user();
        $invitation = ActivityGroupInvitation::with('group.activity')->find($invitationId);
        if (!$invitation) {
            return response()->json(['message' => 'Convite não encontrado.'], 404);
        }

        if ($invitation->invited_user_id !== $user->id) {
            return response()->json(['message' => 'Você não tem permissão para responder a este convite.'], 403);
        }

        if ($invitation->status !== 'pending') {
            return response()->json(['message' => 'Este convite já foi processado.'], 422);
        }

        $validated = $request->validate([
            'action' => 'required|string|in:accept,decline',
        ]);

        if ($validated['action'] === 'decline') {
            $invitation->status = 'declined';
            $invitation->save();

            return response()->json([
                'message' => 'Convite recusado.',
                'invitation' => $invitation
            ]);
        }

        $groupId = $invitation->activity_group_id;
        $group = $invitation->group;

        return DB::transaction(function () use ($invitation, $groupId, $group, $user) {
            $lockedGroup = ActivityGroup::where('id', $groupId)->lockForUpdate()->first();

            // Checar se já pertence a um grupo nesta atividade
            $alreadyInGroup = ActivityGroupMember::whereHas('group', function ($q) use ($group) {
                $q->where('activity_id', $group->activity_id);
            })->where('user_id', $user->id)->exists();

            if ($alreadyInGroup) {
                $invitation->status = 'cancelled';
                $invitation->save();
                return response()->json(['message' => 'Você já pertence a um grupo nesta atividade.'], 422);
            }

            // Checar capacidade
            $currentCount = ActivityGroupMember::where('activity_group_id', $groupId)->count();
            if ($currentCount >= $lockedGroup->capacity) {
                return response()->json(['message' => 'O grupo já atingiu a capacidade máxima.'], 422);
            }

            ActivityGroupMember::create([
                'activity_group_id' => $groupId,
                'user_id' => $user->id,
                'joined_at' => now(),
            ]);

            if (is_null($lockedGroup->leader_user_id)) {
                $lockedGroup->leader_user_id = $user->id;
                $lockedGroup->save();
            }

            $invitation->status = 'accepted';
            $invitation->save();

            return response()->json([
                'message' => 'Convite aceito com sucesso.',
                'invitation' => $invitation,
                'group' => $lockedGroup->fresh(['members.user', 'leader', 'invitations'])
            ]);
        });
    }

    public function removeMember(Request $request, $groupId, $targetUserId)
    {
        $user = $request->user();
        $group = ActivityGroup::with('activity.schoolClass')->find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Grupo não encontrado.'], 404);
        }

        $schoolClass = $group->activity->schoolClass;
        $myRole = $this->getMembership($schoolClass->id, $user);

        $isLeader = $group->leader_user_id === $user->id;
        $isOwnerOrRep = in_array($myRole, ['owner', 'rep']);

        if (!$isLeader && !$isOwnerOrRep) {
            return response()->json(['message' => 'Sem permissão para remover membros do grupo.'], 403);
        }

        return DB::transaction(function () use ($groupId, $group, $targetUserId) {
            $targetUserId = (int)$targetUserId;
            $lockedGroup = ActivityGroup::where('id', $groupId)->lockForUpdate()->first();

            $member = ActivityGroupMember::where('activity_group_id', $groupId)
                ->where('user_id', $targetUserId)
                ->first();

            if (!$member) {
                return response()->json(['message' => 'Membro não encontrado neste grupo.'], 404);
            }

            $member->delete();

            if ($lockedGroup->leader_user_id === $targetUserId) {
                $oldest = ActivityGroupMember::where('activity_group_id', $groupId)
                    ->orderBy('joined_at', 'asc')
                    ->orderBy('id', 'asc')
                    ->first();

                $lockedGroup->leader_user_id = $oldest ? $oldest->user_id : null;
                $lockedGroup->save();
            }

            return response()->json([
                'message' => 'Membro removido do grupo com sucesso.',
                'group' => $lockedGroup->fresh(['members.user', 'leader', 'invitations'])
            ]);
        });
    }
}

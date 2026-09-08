<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Activity;
use App\Models\ActivityGroup;
use App\Models\UserActivityProgress;

class ActivityController extends Controller
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

    public function index(Request $request, $classId)
    {
        $user = $request->user();
        $role = $this->getMembership($classId, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        $activities = Activity::where('class_id', $classId)
            ->with(['groups.members.user', 'groups.leader', 'groups.invitations'])
            ->get();

        $activities->each(function ($activity) use ($user) {
            $progress = UserActivityProgress::where('activity_id', $activity->id)
                ->where('user_id', $user->id)
                ->first();
            $activity->user_progress = $progress;
        });

        return response()->json([
            'activities' => $activities
        ]);
    }

    public function store(Request $request, $classId)
    {
        $user = $request->user();
        $schoolClass = SchoolClass::find($classId);
        if (!$schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        $role = $this->getMembership($classId, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (!in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem criar atividades.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string|in:dever,trabalho,teste,outros',
            'subject' => 'nullable|string|max:255',
            'due_date' => 'required|date',
            'due_time' => 'nullable|string|max:10',
            'description' => 'nullable|string',
            'work_mode' => 'nullable|string|in:individual,groups',
            'group_size' => 'nullable|required_if:work_mode,groups|integer|min:2',
            'assessment_format' => 'nullable|string|in:fechada,aberta,mista,nao_informado',
            'points_value' => 'nullable|numeric|min:0|max:1000',
        ]);

        // Regras estritas por tipo
        if ($validated['type'] === 'trabalho') {
            $validated['work_mode'] = $validated['work_mode'] ?? 'individual';
        } else {
            $validated['work_mode'] = null;
            $validated['group_size'] = null;
        }

        if ($validated['type'] === 'teste') {
            $validated['assessment_format'] = $validated['assessment_format'] ?? 'nao_informado';
        } else {
            $validated['assessment_format'] = null;
            $validated['points_value'] = null;
        }

        $validated['class_id'] = $classId;
        $validated['created_by'] = $user->id;

        $activity = Activity::create($validated);

        // Criação automática de grupos vazios se trabalho em grupos
        if ($activity->type === 'trabalho' && $activity->work_mode === 'groups' && $activity->group_size > 0) {
            $eligibleMembersCount = ClassMember::where('class_id', $classId)
                ->where('user_id', '!=', $schoolClass->owner_id)
                ->count();

            $groupCount = max(1, (int) ceil($eligibleMembersCount / $activity->group_size));

            for ($i = 1; $i <= $groupCount; $i++) {
                ActivityGroup::create([
                    'activity_id' => $activity->id,
                    'name' => "Grupo {$i}",
                    'capacity' => $activity->group_size,
                    'leader_user_id' => null,
                    'description' => null,
                ]);
            }
        }

        return response()->json([
            'message' => 'Atividade criada com sucesso.',
            'activity' => $activity->load(['groups.members.user', 'groups.leader', 'groups.invitations'])
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::with(['groups.members.user', 'groups.leader', 'groups.invitations'])->find($id);
        if (!$activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        $progress = UserActivityProgress::where('activity_id', $activity->id)
            ->where('user_id', $user->id)
            ->first();
        $activity->user_progress = $progress;

        return response()->json([
            'activity' => $activity
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::find($id);
        if (!$activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (!in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem editar atividades.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|in:dever,trabalho,teste,outros',
            'subject' => 'nullable|string|max:255',
            'due_date' => 'sometimes|required|date',
            'due_time' => 'nullable|string|max:10',
            'description' => 'nullable|string',
            'work_mode' => 'nullable|string|in:individual,groups',
            'group_size' => 'nullable|integer|min:2',
            'assessment_format' => 'nullable|string|in:fechada,aberta,mista,nao_informado',
            'points_value' => 'nullable|numeric|min:0|max:1000',
        ]);

        $newType = $validated['type'] ?? $activity->type;

        // Impedir alteração incoerente de modalidade ou tamanho de grupo se já houver alunos nos grupos
        if ($activity->type === 'trabalho' && $activity->work_mode === 'groups') {
            $hasGroupMembers = \App\Models\ActivityGroupMember::whereHas('group', function ($q) use ($activity) {
                $q->where('activity_id', $activity->id);
            })->exists();

            if ($hasGroupMembers) {
                if (isset($validated['work_mode']) && $validated['work_mode'] !== $activity->work_mode) {
                    return response()->json(['message' => 'Não é possível alterar a modalidade do trabalho pois já existem alunos cadastrados nos grupos desta atividade.'], 422);
                }
                if (isset($validated['group_size']) && (int)$validated['group_size'] !== (int)$activity->group_size) {
                    return response()->json(['message' => 'Não é possível alterar o tamanho máximo dos grupos pois já existem alunos cadastrados nos grupos desta atividade.'], 422);
                }
            }
        }

        if ($newType !== 'trabalho') {
            $validated['work_mode'] = null;
            $validated['group_size'] = null;
        }

        if ($newType !== 'teste') {
            $validated['assessment_format'] = null;
            $validated['points_value'] = null;
        }

        $activity->update($validated);

        return response()->json([
            'message' => 'Atividade atualizada com sucesso.',
            'activity' => $activity->load(['groups.members.user', 'groups.leader', 'groups.invitations'])
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::find($id);
        if (!$activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (!in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem excluir atividades.'], 403);
        }

        $activity->delete();

        return response()->json([
            'message' => 'Atividade excluída com sucesso.'
        ]);
    }

    public function updateProgress(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::find($id);
        if (!$activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:todo,in_progress,done',
            'personal_notes' => 'nullable|string',
            'score' => 'nullable|numeric|min:0|max:100',
        ]);

        $progress = UserActivityProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'activity_id' => $activity->id,
            ],
            $validated
        );

        return response()->json([
            'message' => 'Progresso atualizado com sucesso.',
            'progress' => $progress
        ]);
    }
}

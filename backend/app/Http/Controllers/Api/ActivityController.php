<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Activity;
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

        $activities = Activity::where('class_id', $classId)->get();

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
        ]);

        $validated['class_id'] = $classId;
        $validated['created_by'] = $user->id;

        $activity = Activity::create($validated);

        return response()->json([
            'message' => 'Atividade criada com sucesso.',
            'activity' => $activity
        ], 201);
    }

    public function show(Request $request, $id)
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
        ]);

        $activity->update($validated);

        return response()->json([
            'message' => 'Atividade atualizada com sucesso.',
            'activity' => $activity
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

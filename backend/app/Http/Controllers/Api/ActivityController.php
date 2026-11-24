<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\UserActivityProgressResource;
use App\Models\Activity;
use App\Models\ClassMember;
use App\Models\SchoolClass;
use App\Models\UserActivityProgress;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    private function getMembership($classId, $user)
    {
        $schoolClass = SchoolClass::find($classId);
        if (! $schoolClass) {
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
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        $query = Activity::where('class_id', $classId)->with('creator:id,name,avatar_url');

        if ($request->filled('type') && is_string($request->input('type'))) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('subject') && is_string($request->input('subject'))) {
            $query->where('subject', 'like', "%{$request->input('subject')}%");
        }

        if ($request->filled('from_date') && is_string($request->input('from_date'))) {
            $query->where('due_date', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date') && is_string($request->input('to_date'))) {
            $query->where('due_date', '<=', $request->input('to_date'));
        }

        if ($request->filled('status') && is_string($request->input('status'))) {
            $status = $request->input('status');
            if ($status === 'todo') {
                $query->where(function ($q) use ($user): void {
                    $q->whereHas('progresses', function ($pq) use ($user): void {
                        $pq->where('user_id', $user->id)->where('status', 'todo');
                    })->orWhereDoesntHave('progresses', function ($pq) use ($user): void {
                        $pq->where('user_id', $user->id);
                    });
                });
            } else {
                $query->whereHas('progresses', function ($pq) use ($user, $status): void {
                    $pq->where('user_id', $user->id)->where('status', $status);
                });
            }
        }

        if ($request->filled('search') && is_string($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        $rawSortBy = $request->input('sort_by', 'due_date');
        $sortBy = is_string($rawSortBy) ? $rawSortBy : 'due_date';
        $allowedSorts = ['due_date', 'created_at', 'title', 'points_value'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'due_date';
        }

        $rawDirection = $request->input('direction', $request->input('order', 'asc'));
        $direction = is_string($rawDirection) ? strtolower($rawDirection) : 'asc';
        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        $query->orderBy($sortBy, $direction);
        if ($sortBy === 'due_date') {
            $query->orderBy('due_time', $direction);
        }
        $query->orderBy('id', 'asc');

        if ($request->has('per_page') || $request->has('page')) {
            $perPage = max(1, min((int) $request->input('per_page', 15), 100));
            $paginator = $query->paginate($perPage);
            $activities = collect($paginator->items());
            $meta = [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'has_more' => $paginator->hasMorePages(),
            ];
        } else {
            $activities = $query->get();
            $meta = [
                'total' => $activities->count(),
                'per_page' => $activities->count(),
                'current_page' => 1,
                'last_page' => 1,
                'has_more' => false,
            ];
        }

        $progressByActivity = UserActivityProgress::whereIn('activity_id', $activities->pluck('id'))
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('activity_id');

        $activities->each(function ($activity) use ($progressByActivity) {
            $activity->setAttribute('user_progress', $progressByActivity->get($activity->id));
        });

        return response()->json([
            'activities' => ActivityResource::collection($activities),
            'meta' => $meta,
        ]);
    }

    public function store(Request $request, $classId)
    {
        $user = $request->user();
        $schoolClass = SchoolClass::find($classId);
        if (! $schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        $role = $this->getMembership($classId, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (! in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem criar atividades.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string|in:dever,trabalho,teste,outros',
            'subject' => 'nullable|string|max:255',
            'due_date' => 'required|date',
            'due_time' => 'nullable|string|max:10',
            'description' => 'nullable|string',
            'assessment_format' => 'nullable|string|in:fechada,aberta,mista,nao_informado',
            'points_value' => 'nullable|numeric|min:0|max:1000',
        ]);

        // Regras estritas por tipo
        if ($validated['type'] === 'teste') {
            $validated['assessment_format'] = $validated['assessment_format'] ?? 'nao_informado';
        } else {
            $validated['assessment_format'] = null;
            $validated['points_value'] = null;
        }

        $validated['class_id'] = $classId;
        $validated['created_by'] = $user->id;

        $activity = Activity::create($validated);

        return response()->json([
            'message' => 'Atividade criada com sucesso.',
            'activity' => ActivityResource::make($activity),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::find($id);
        if (! $activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        $progress = UserActivityProgress::where('activity_id', $activity->id)
            ->where('user_id', $user->id)
            ->first();
        $activity->user_progress = $progress;

        return response()->json([
            'activity' => ActivityResource::make($activity),
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::find($id);
        if (! $activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (! in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem editar atividades.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|in:dever,trabalho,teste,outros',
            'subject' => 'nullable|string|max:255',
            'due_date' => 'sometimes|required|date',
            'due_time' => 'nullable|string|max:10',
            'description' => 'nullable|string',
            'assessment_format' => 'nullable|string|in:fechada,aberta,mista,nao_informado',
            'points_value' => 'nullable|numeric|min:0|max:1000',
        ]);

        $newType = $validated['type'] ?? $activity->type;

        if ($newType !== 'teste') {
            $validated['assessment_format'] = null;
            $validated['points_value'] = null;
        }

        $activity->update($validated);

        return response()->json([
            'message' => 'Atividade atualizada com sucesso.',
            'activity' => ActivityResource::make($activity),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::find($id);
        if (! $activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (! in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem excluir atividades.'], 403);
        }

        $activity->delete();

        return response()->json([
            'message' => 'Atividade excluída com sucesso.',
        ]);
    }

    public function updateProgress(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::find($id);
        if (! $activity) {
            return response()->json(['message' => 'Atividade não encontrada.'], 404);
        }

        $role = $this->getMembership($activity->class_id, $user);
        if (! $role) {
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
            'progress' => UserActivityProgressResource::make($progress),
        ]);
    }
}

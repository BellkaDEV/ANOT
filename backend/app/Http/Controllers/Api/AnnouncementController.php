<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Models\ClassMember;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
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
        $request->validate([
            'active_only' => 'sometimes|boolean',
            'include_expired' => 'sometimes|boolean',
            'priority' => 'sometimes|string|in:baixa,media,alta',
            'search' => 'sometimes|string|max:255',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'page' => 'sometimes|integer|min:1',
        ]);

        $user = $request->user();
        $role = $this->getMembership($classId, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        $query = Announcement::where('class_id', $classId)->with('author:id,name,avatar_url');

        $activeOnly = ! $request->has('active_only') || filter_var($request->input('active_only'), FILTER_VALIDATE_BOOLEAN);
        if ($activeOnly && ! filter_var($request->input('include_expired', false), FILTER_VALIDATE_BOOLEAN)) {
            $query->where(function ($q) {
                $q->where('expires_at', '>', now())
                    ->orWhereNull('expires_at');
            });
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc')->orderBy('id', 'desc');

        if ($request->has('per_page') || $request->has('page')) {
            $perPage = max(1, min((int) $request->input('per_page', 15), 100));
            $paginator = $query->paginate($perPage);
            $announcements = collect($paginator->items());
            $meta = [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'has_more' => $paginator->hasMorePages(),
            ];
        } else {
            $announcements = $query->get();
            $meta = [
                'total' => $announcements->count(),
                'per_page' => $announcements->count(),
                'current_page' => 1,
                'last_page' => 1,
                'has_more' => false,
            ];
        }

        return response()->json([
            'announcements' => AnnouncementResource::collection($announcements),
            'meta' => $meta,
        ]);
    }

    public function store(Request $request, $classId)
    {
        $user = $request->user();
        $role = $this->getMembership($classId, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (! in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem criar avisos.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|string|in:baixa,media,alta',
            'expires_at' => 'nullable|date',
        ]);

        $validated['class_id'] = $classId;
        $validated['author_id'] = $user->id;

        $announcement = Announcement::create($validated);

        return response()->json([
            'message' => 'Aviso criado com sucesso.',
            'announcement' => AnnouncementResource::make($announcement),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::find($id);
        if (! $announcement) {
            return response()->json(['message' => 'Aviso não encontrado.'], 404);
        }

        $role = $this->getMembership($announcement->class_id, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        return response()->json([
            'announcement' => AnnouncementResource::make($announcement->load('author:id,name,avatar_url')),
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::find($id);
        if (! $announcement) {
            return response()->json(['message' => 'Aviso não encontrado.'], 404);
        }

        $role = $this->getMembership($announcement->class_id, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (! in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem editar avisos.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'priority' => 'sometimes|required|string|in:baixa,media,alta',
            'expires_at' => 'nullable|date',
        ]);

        $announcement->update($validated);

        return response()->json([
            'message' => 'Aviso atualizado com sucesso.',
            'announcement' => AnnouncementResource::make($announcement),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::find($id);
        if (! $announcement) {
            return response()->json(['message' => 'Aviso não encontrado.'], 404);
        }

        $role = $this->getMembership($announcement->class_id, $user);
        if (! $role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (! in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem excluir avisos.'], 403);
        }

        $announcement->delete();

        return response()->json([
            'message' => 'Aviso excluído com sucesso.',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Announcement;

class AnnouncementController extends Controller
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

        // Listar avisos ativos (expires_at > now)
        $announcements = Announcement::where('class_id', $classId)
            ->where(function ($query) {
                $query->where('expires_at', '>', now())
                      ->orWhereNull('expires_at');
            })
            ->with('author:id,name,avatar_url')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'announcements' => $announcements
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
            'announcement' => $announcement
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::find($id);
        if (!$announcement) {
            return response()->json(['message' => 'Aviso não encontrado.'], 404);
        }

        $role = $this->getMembership($announcement->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        return response()->json([
            'announcement' => $announcement->load('author:id,name,avatar_url')
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::find($id);
        if (!$announcement) {
            return response()->json(['message' => 'Aviso não encontrado.'], 404);
        }

        $role = $this->getMembership($announcement->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (!in_array($role, ['owner', 'rep'])) {
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
            'announcement' => $announcement
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::find($id);
        if (!$announcement) {
            return response()->json(['message' => 'Aviso não encontrado.'], 404);
        }

        $role = $this->getMembership($announcement->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (!in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem excluir avisos.'], 403);
        }

        $announcement->delete();

        return response()->json([
            'message' => 'Aviso excluído com sucesso.'
        ]);
    }
}

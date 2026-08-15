<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Event;

class EventController extends Controller
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

        $events = Event::where('class_id', $classId)
            ->orderBy('event_date', 'asc')
            ->orderBy('event_time', 'asc')
            ->get();

        return response()->json([
            'events' => $events
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
            return response()->json(['message' => 'Apenas o criador ou representantes podem criar eventos.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_date' => 'required|date',
            'event_time' => 'nullable|string|max:10',
            'type' => 'required|string|in:prova,entrega,evento,periodo',
            'subject' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:255',
        ]);

        $validated['class_id'] = $classId;
        $validated['created_by'] = $user->id;
        $validated['activity_id'] = null; // Evento avulso

        $event = Event::create($validated);

        return response()->json([
            'message' => 'Evento criado com sucesso.',
            'event' => $event
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::find($id);
        if (!$event) {
            return response()->json(['message' => 'Evento não encontrado.'], 404);
        }

        $role = $this->getMembership($event->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        return response()->json([
            'event' => $event
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::find($id);
        if (!$event) {
            return response()->json(['message' => 'Evento não encontrado.'], 404);
        }

        $role = $this->getMembership($event->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (!in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem editar eventos.'], 403);
        }

        // Se o evento estiver vinculado a uma atividade, ele deve ser editado via atividade.
        if ($event->activity_id !== null) {
            return response()->json([
                'message' => 'Este evento está vinculado a uma atividade e deve ser atualizado através dela.'
            ], 422);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'event_date' => 'sometimes|required|date',
            'event_time' => 'nullable|string|max:10',
            'type' => 'sometimes|required|string|in:prova,entrega,evento,periodo',
            'subject' => 'nullable|string|max:255',
            'room' => 'nullable|string|max:255',
        ]);

        $event->update($validated);

        return response()->json([
            'message' => 'Evento atualizado com sucesso.',
            'event' => $event
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::find($id);
        if (!$event) {
            return response()->json(['message' => 'Evento não encontrado.'], 404);
        }

        $role = $this->getMembership($event->class_id, $user);
        if (!$role) {
            return response()->json(['message' => 'Você não tem permissão para acessar esta turma.'], 403);
        }

        if (!in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o criador ou representantes podem excluir eventos.'], 403);
        }

        // Se o evento estiver vinculado a uma atividade, ele deve ser excluído via atividade.
        if ($event->activity_id !== null) {
            return response()->json([
                'message' => 'Este evento está vinculado a uma atividade e deve ser excluído através dela.'
            ], 422);
        }

        $event->delete();

        return response()->json([
            'message' => 'Evento excluído com sucesso.'
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SchoolClass;
use App\Models\ClassMember;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $classes = SchoolClass::where('owner_id', $user->id)
            ->orWhereHas('members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['owner:id,name,email,avatar_url'])
            ->withCount('members')
            ->get()
            ->map(function ($class) use ($user) {
                $membership = ClassMember::where('class_id', $class->id)
                    ->where('user_id', $user->id)
                    ->first();
                $class->my_role = $membership ? $membership->role : ($class->owner_id === $user->id ? 'owner' : null);
                $class->qr_code_payload = 'anot://join?code=' . $class->code;
                return $class;
            });

        return response()->json([
            'classes' => $classes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'course' => 'nullable|string|max:255',
            'institution' => 'nullable|string|max:255',
            'period' => 'nullable|string|max:100',
            'modality' => 'nullable|string|in:presencial,ead,hibrido',
        ]);

        $user = $request->user();

        // Gerar código único de 6 caracteres alfanuméricos com prefixo ANOT-
        do {
            $code = 'ANOT-' . strtoupper(Str::random(5));
        } while (SchoolClass::where('code', $code)->exists());

        $schoolClass = SchoolClass::create([
            'code' => $code,
            'name' => $validated['name'],
            'course' => $validated['course'] ?? null,
            'institution' => $validated['institution'] ?? null,
            'period' => $validated['period'] ?? null,
            'modality' => $validated['modality'] ?? 'presencial',
            'owner_id' => $user->id,
        ]);

        // Registrar o criador como 'owner' na tabela pivot
        ClassMember::create([
            'class_id' => $schoolClass->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        $schoolClass->my_role = 'owner';
        $schoolClass->qr_code_payload = 'anot://join?code=' . $schoolClass->code;

        return response()->json([
            'message' => 'Turma criada com sucesso!',
            'class' => $schoolClass,
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $schoolClass = SchoolClass::with(['owner:id,name,email,avatar_url', 'members.user:id,name,email,avatar_url'])->find($id);

        if (!$schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        $membership = ClassMember::where('class_id', $schoolClass->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership && $schoolClass->owner_id !== $user->id) {
            return response()->json(['message' => 'Acesso negado. Você não é membro desta turma.'], 403);
        }

        $schoolClass->my_role = $membership ? $membership->role : 'owner';
        $schoolClass->qr_code_payload = 'anot://join?code=' . $schoolClass->code;

        return response()->json([
            'class' => $schoolClass,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $schoolClass = SchoolClass::find($id);

        if (!$schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        $membership = ClassMember::where('class_id', $schoolClass->id)
            ->where('user_id', $user->id)
            ->first();

        $role = $membership ? $membership->role : ($schoolClass->owner_id === $user->id ? 'owner' : null);

        if (!in_array($role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Apenas o Criador ou Representante podem editar a turma.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'course' => 'nullable|string|max:255',
            'institution' => 'nullable|string|max:255',
            'period' => 'nullable|string|max:100',
            'modality' => 'nullable|string|in:presencial,ead,hibrido',
        ]);

        $schoolClass->update($validated);

        return response()->json([
            'message' => 'Turma atualizada com sucesso.',
            'class' => $schoolClass,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $schoolClass = SchoolClass::find($id);

        if (!$schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        if ($schoolClass->owner_id !== $user->id) {
            return response()->json(['message' => 'Apenas o Criador da turma tem permissão para excluí-la.'], 403);
        }

        $schoolClass->delete();

        return response()->json([
            'message' => 'Turma excluída com sucesso.',
        ]);
    }

    public function join(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
        ]);

        $code = strtoupper(trim($validated['code']));
        $schoolClass = SchoolClass::where('code', $code)->first();

        if (!$schoolClass) {
            return response()->json(['message' => 'Código de turma inválido ou inexistente.'], 404);
        }

        $user = $request->user();

        $existingMember = ClassMember::where('class_id', $schoolClass->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingMember) {
            return response()->json([
                'message' => 'Você já faz parte desta turma.',
                'class' => $schoolClass,
                'role' => $existingMember->role,
            ]);
        }

        $role = ($schoolClass->owner_id === $user->id) ? 'owner' : 'student';

        ClassMember::create([
            'class_id' => $schoolClass->id,
            'user_id' => $user->id,
            'role' => $role,
            'joined_at' => now(),
        ]);

        $schoolClass->my_role = $role;
        $schoolClass->qr_code_payload = 'anot://join?code=' . $schoolClass->code;

        return response()->json([
            'message' => 'Entrada na turma realizada com sucesso!',
            'class' => $schoolClass,
            'role' => $role,
        ], 201);
    }
}

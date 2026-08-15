<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SchoolClass;
use App\Models\ClassMember;

class MemberController extends Controller
{
    public function index(Request $request, $classId)
    {
        $schoolClass = SchoolClass::find($classId);
        if (!$schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        $members = ClassMember::where('class_id', $classId)
            ->with(['user:id,name,email,avatar_url'])
            ->get();

        return response()->json([
            'members' => $members,
        ]);
    }

    public function promote(Request $request, $classId, $userId)
    {
        $currentUser = $request->user();
        $schoolClass = SchoolClass::find($classId);

        if (!$schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        // Verificar permissão do usuário atual
        $myMembership = ClassMember::where('class_id', $classId)
            ->where('user_id', $currentUser->id)
            ->first();

        $myRole = $myMembership ? $myMembership->role : ($schoolClass->owner_id === $currentUser->id ? 'owner' : null);

        if (!in_array($myRole, ['owner', 'rep'])) {
            return response()->json(['message' => 'Sem permissão para promover membros nesta turma.'], 403);
        }

        $targetMembership = ClassMember::where('class_id', $classId)
            ->where('user_id', $userId)
            ->first();

        if (!$targetMembership) {
            return response()->json(['message' => 'Membro não encontrado na turma.'], 404);
        }

        if ($targetMembership->role === 'owner') {
            return response()->json(['message' => 'O Criador da turma já possui o nível máximo.'], 422);
        }

        $targetMembership->role = 'rep';
        $targetMembership->save();

        return response()->json([
            'message' => 'Membro promovido a Representante com sucesso.',
            'member' => $targetMembership->load('user:id,name,email,avatar_url'),
        ]);
    }

    public function demote(Request $request, $classId, $userId)
    {
        $currentUser = $request->user();
        $schoolClass = SchoolClass::find($classId);

        if (!$schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        // Trava 2: Apenas o Criador (Owner) pode rebaixar um Representante
        if ($schoolClass->owner_id !== $currentUser->id) {
            return response()->json([
                'message' => 'Ação negada. Apenas o Criador da turma tem permissão para rebaixar representantes.'
            ], 403);
        }

        $targetMembership = ClassMember::where('class_id', $classId)
            ->where('user_id', $userId)
            ->first();

        if (!$targetMembership) {
            return response()->json(['message' => 'Membro não encontrado na turma.'], 404);
        }

        // Trava 1: Dono nunca pode ser rebaixado
        if ($targetMembership->user_id === $schoolClass->owner_id || $targetMembership->role === 'owner') {
            return response()->json(['message' => 'O Criador da turma nunca pode ser rebaixado.'], 403);
        }

        $targetMembership->role = 'student';
        $targetMembership->save();

        return response()->json([
            'message' => 'Membro rebaixado a Aluno com sucesso.',
            'member' => $targetMembership->load('user:id,name,email,avatar_url'),
        ]);
    }

    public function kick(Request $request, $classId, $userId)
    {
        $currentUser = $request->user();
        $schoolClass = SchoolClass::find($classId);

        if (!$schoolClass) {
            return response()->json(['message' => 'Turma não encontrada.'], 404);
        }

        $myMembership = ClassMember::where('class_id', $classId)
            ->where('user_id', $currentUser->id)
            ->first();

        $myRole = $myMembership ? $myMembership->role : ($schoolClass->owner_id === $currentUser->id ? 'owner' : null);

        if (!in_array($myRole, ['owner', 'rep'])) {
            return response()->json(['message' => 'Sem permissão para expulsar membros nesta turma.'], 403);
        }

        // Trava 1: O Criador da turma NUNCA pode ser expulso
        if ((int)$userId === (int)$schoolClass->owner_id) {
            return response()->json([
                'message' => 'Trava de segurança: O Criador da turma NUNCA pode ser expulso.'
            ], 403);
        }

        $targetMembership = ClassMember::where('class_id', $classId)
            ->where('user_id', $userId)
            ->first();

        if (!$targetMembership) {
            return response()->json(['message' => 'Membro não encontrado na turma.'], 404);
        }

        // Representante não pode expulsar outro Representante ou Criador
        if ($myRole === 'rep' && in_array($targetMembership->role, ['owner', 'rep'])) {
            return response()->json(['message' => 'Representantes não podem expulsar outros Representantes ou o Criador.'], 403);
        }

        $targetMembership->delete();

        return response()->json([
            'message' => 'Membro removido da turma com sucesso.',
        ]);
    }
}

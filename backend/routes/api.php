<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\EventController;

use App\Http\Controllers\Api\ActivityGroupController;

// Rotas públicas (sem autenticação)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Rotas protegidas (com autenticação via Sanctum e rate limit de 60 req/min)
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    Route::get('/me', [AuthController::class, 'me']);

    // Turmas (Classes)
    Route::get('/classes', [ClassController::class, 'index']);
    Route::post('/classes', [ClassController::class, 'store']);
    Route::post('/classes/join', [ClassController::class, 'join'])->middleware('throttle:join-class');
    Route::get('/classes/{id}', [ClassController::class, 'show']);
    Route::put('/classes/{id}', [ClassController::class, 'update']);
    Route::put('/classes/{id}/toggle-open', [ClassController::class, 'toggleOpen']);
    Route::put('/classes/{id}/regenerate-code', [ClassController::class, 'regenerateCode']);
    Route::delete('/classes/{id}', [ClassController::class, 'destroy']);

    // Membros & Permissões
    Route::get('/classes/{id}/members', [MemberController::class, 'index']);
    Route::put('/classes/{classId}/members/{userId}/promote', [MemberController::class, 'promote']);
    Route::put('/classes/{classId}/members/{userId}/demote', [MemberController::class, 'demote']);
    Route::delete('/classes/{classId}/members/{userId}', [MemberController::class, 'kick']);

    // Atividades (Activities)
    Route::get('/classes/{classId}/activities', [ActivityController::class, 'index']);
    Route::post('/classes/{classId}/activities', [ActivityController::class, 'store']);
    Route::get('/activities/{id}', [ActivityController::class, 'show']);
    Route::put('/activities/{id}', [ActivityController::class, 'update']);
    Route::delete('/activities/{id}', [ActivityController::class, 'destroy']);
    Route::put('/activities/{id}/progress', [ActivityController::class, 'updateProgress']);

    // Grupos de Trabalho (Activity Groups)
    Route::get('/activities/{activityId}/groups', [ActivityGroupController::class, 'index']);
    Route::get('/activity-groups/{groupId}', [ActivityGroupController::class, 'show']);
    Route::post('/activity-groups/{groupId}/join', [ActivityGroupController::class, 'join']);
    Route::post('/activity-groups/{groupId}/leave', [ActivityGroupController::class, 'leave']);
    Route::put('/activity-groups/{groupId}/description', [ActivityGroupController::class, 'updateDescription']);
    Route::post('/activity-groups/{groupId}/invite', [ActivityGroupController::class, 'invite']);
    Route::post('/group-invitations/{invitationId}/respond', [ActivityGroupController::class, 'respondInvitation']);
    Route::delete('/activity-groups/{groupId}/members/{userId}', [ActivityGroupController::class, 'removeMember']);

    // Avisos (Announcements)
    Route::get('/classes/{classId}/announcements', [AnnouncementController::class, 'index']);
    Route::post('/classes/{classId}/announcements', [AnnouncementController::class, 'store']);
    Route::get('/announcements/{id}', [AnnouncementController::class, 'show']);
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Eventos (Events)
    Route::get('/classes/{classId}/events', [EventController::class, 'index']);
    Route::post('/classes/{classId}/events', [EventController::class, 'store']);
    Route::get('/events/{id}', [EventController::class, 'show']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
});

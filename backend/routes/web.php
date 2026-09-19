<?php

use App\Http\Controllers\AdminWebController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\LegalController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HealthController::class, 'index']);
Route::get('/health', [HealthController::class, 'health']);
Route::get('/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('/terms', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('/support', [LegalController::class, 'support'])->name('legal.support');
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware('signed')
    ->name('verification.verify');

Route::get('/admin/login', [AdminWebController::class, 'loginForm'])->name('admin.login');
Route::post('/admin/login', [AdminWebController::class, 'login'])->name('admin.login.submit')->middleware('throttle:login');
Route::middleware(['auth', 'platform.admin'])->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/', [AdminWebController::class, 'dashboard'])->name('dashboard');
    Route::post('/logout', [AdminWebController::class, 'logout'])->name('logout');
    Route::post('/users/{user}/suspend', [AdminWebController::class, 'suspend'])->name('users.suspend');
    Route::post('/users/{user}/unsuspend', [AdminWebController::class, 'unsuspend'])->name('users.unsuspend');
});

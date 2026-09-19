<?php

namespace App\Providers;

use App\Mail\BrevoApiTransport;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Mail::extend('brevo', fn (array $config) => new BrevoApiTransport($config['api_key']));

        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            return config('app.mobile_reset_url').'?token='.urlencode($token).'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            $email = strtolower(trim((string) $request->input('email')));

            return [
                Limit::perMinute(5)->by($request->ip()),
                Limit::perMinute(3)->by($email.'|'.$request->ip()),
            ];
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('join-class', function (Request $request) {
            $userId = $request->user()?->id ?: $request->ip();

            return Limit::perMinute(5)->by($userId);
        });
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Arr;

class ValidateProductionConfig extends Command
{
    protected $signature = 'app:validate-production {--json : Imprime o resultado em JSON}';

    protected $description = 'Valida configurações obrigatórias antes de um deploy de produção';

    public function handle(): int
    {
        $checks = [
            'APP_ENV' => [
                'ok' => (string) config('app.env') === 'production',
                'message' => 'APP_ENV deve ser production.',
            ],
            'APP_DEBUG' => [
                'ok' => config('app.debug') === false,
                'message' => 'APP_DEBUG deve estar desativado.',
            ],
            'APP_URL' => [
                'ok' => filter_var((string) config('app.url'), FILTER_VALIDATE_URL) !== false && str_starts_with((string) config('app.url'), 'https://'),
                'message' => 'APP_URL deve ser uma URL válida com HTTPS.',
            ],
            'MOBILE_RESET_URL' => [
                'ok' => $this->isValidMobileResetUrl((string) config('app.mobile_reset_url')),
                'message' => 'MOBILE_RESET_URL deve ser uma URL HTTPS ou esquema móvel anot válido.',
            ],
            'APP_KEY' => [
                'ok' => $this->hasRealValue((string) config('app.key'), 'base64:GERE_COM_php_artisan_key:generate'),
                'message' => 'APP_KEY deve ser uma chave real.',
            ],
            'DB_CONNECTION' => [
                'ok' => (string) config('database.default') === 'pgsql',
                'message' => 'DB_CONNECTION deve ser pgsql em produção.',
            ],
            'DB_HOST' => [
                'ok' => (string) Arr::get(config('database.connections'), 'pgsql.host') !== '',
                'message' => 'DB_HOST deve ser configurado.',
            ],
            'DB_PORT' => [
                'ok' => (int) Arr::get(config('database.connections'), 'pgsql.port') > 0,
                'message' => 'DB_PORT deve ser configurado com uma porta válida.',
            ],
            'DB_DATABASE' => [
                'ok' => (string) Arr::get(config('database.connections'), 'pgsql.database') !== '',
                'message' => 'DB_DATABASE deve ser configurado.',
            ],
            'DB_USERNAME' => [
                'ok' => (string) Arr::get(config('database.connections'), 'pgsql.username') !== '',
                'message' => 'DB_USERNAME deve ser configurado.',
            ],
            'DB_PASSWORD' => [
                'ok' => $this->hasRealValue((string) Arr::get(config('database.connections'), 'pgsql.password'), 'troque-por-uma-senha-forte'),
                'message' => 'DB_PASSWORD deve ser definido fora do repositório.',
            ],
            'MAIL' => [
                'ok' => $this->hasProductionMailer(),
                'message' => 'MAIL_MAILER deve apontar para um transporte de produção com credencial válida.',
            ],
            'QUEUE_CONNECTION' => [
                'ok' => in_array((string) config('queue.default'), ['database', 'redis'], true),
                'message' => 'QUEUE_CONNECTION deve ser database ou redis.',
            ],
            'SESSION_DRIVER' => [
                'ok' => in_array((string) config('session.driver'), ['database', 'redis'], true),
                'message' => 'SESSION_DRIVER deve ser database ou redis.',
            ],
            'CACHE_STORE' => [
                'ok' => in_array((string) config('cache.default'), ['database', 'redis'], true),
                'message' => 'CACHE_STORE deve ser database ou redis.',
            ],
            'SUPPORT_EMAIL' => [
                'ok' => filter_var((string) config('app.support_email'), FILTER_VALIDATE_EMAIL) !== false
                    && ! str_ends_with((string) config('app.support_email'), '@example.com')
                    && ! str_ends_with((string) config('app.support_email'), '@example.org'),
                'message' => 'SUPPORT_EMAIL deve ser um endereço válido.',
            ],
        ];

        $failed = collect($checks)->filter(fn (array $check): bool => ! $check['ok']);

        if ($this->option('json')) {
            $this->line((string) json_encode([
                'status' => $failed->isEmpty() ? 'ok' : 'failed',
                'checks' => $checks,
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        } else {
            foreach ($checks as $name => $check) {
                $check['ok'] ? $this->info("OK   {$name}") : $this->error("FAIL {$name}: {$check['message']}");
            }
        }

        if ($failed->isNotEmpty()) {
            $this->newLine();
            $this->error('Configuração de produção inválida. Corrija os itens acima antes do deploy.');

            return self::FAILURE;
        }

        $this->info('Configuração de produção validada.');

        return self::SUCCESS;
    }

    private function hasRealValue(string $value, string $placeholder): bool
    {
        return $value !== '' && $value !== $placeholder && ! str_contains($value, 'GERE_COM');
    }

    private function isValidMobileResetUrl(string $url): bool
    {
        $parts = parse_url($url);

        if ($parts === false || ! isset($parts['scheme']) || isset($parts['user']) || isset($parts['pass'])) {
            return false;
        }

        $scheme = strtolower($parts['scheme']);

        if ($scheme === 'anot') {
            return isset($parts['host']) && $parts['host'] !== '';
        }

        return $scheme === 'https' && filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    private function hasProductionMailer(): bool
    {
        $mailer = (string) config('mail.default');

        if ($mailer === 'brevo') {
            return $this->hasRealValue(
                (string) config('mail.mailers.brevo.api_key'),
                'sua-chave-api-da-brevo',
            );
        }

        if ($mailer === 'smtp') {
            $host = (string) config('mail.mailers.smtp.host');
            $user = (string) config('mail.mailers.smtp.username');
            $pass = (string) config('mail.mailers.smtp.password');

            return $host !== '' && $user !== '' && $pass !== '';
        }

        return in_array($mailer, ['ses', 'mailgun', 'postmark'], true);
    }
}

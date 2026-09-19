<?php

namespace Tests\Feature;

use Tests\TestCase;

class ValidateProductionConfigTest extends TestCase
{
    public function test_command_reports_invalid_production_configuration(): void
    {
        config([
            'app.env' => 'production',
            'app.debug' => true,
            'app.url' => 'http://localhost',
            'app.key' => 'base64:GERE_COM_php_artisan_key:generate',
            'app.support_email' => 'invalid',
            'database.default' => 'sqlite',
            'queue.default' => 'sync',
            'session.driver' => 'file',
            'cache.default' => 'array',
            'mail.default' => 'log',
        ]);

        $this->artisan('app:validate-production')
            ->expectsOutputToContain('Configuração de produção inválida.')
            ->assertFailed();
    }

    public function test_command_accepts_a_complete_production_configuration(): void
    {
        config([
            'app.env' => 'production',
            'app.debug' => false,
            'app.url' => 'https://api.anot.app',
            'app.key' => 'base64:'.base64_encode(random_bytes(32)),
            'app.support_email' => 'suporte@anot.app',
            'database.default' => 'pgsql',
            'database.connections.pgsql.password' => 'strong-secret',
            'queue.default' => 'database',
            'session.driver' => 'database',
            'cache.default' => 'database',
            'mail.default' => 'smtp',
        ]);

        $this->artisan('app:validate-production', ['--json' => true])
            ->expectsOutputToContain('"status": "ok"')
            ->assertSuccessful();
    }
}

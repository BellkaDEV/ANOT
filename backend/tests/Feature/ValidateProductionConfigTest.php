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
            'app.mobile_reset_url' => 'https://api.anot.app/reset-password',
            'app.key' => 'base64:'.base64_encode(random_bytes(32)),
            'app.support_email' => 'suporte@anot.app',
            'database.default' => 'pgsql',
            'database.connections.pgsql.password' => 'strong-secret',
            'queue.default' => 'database',
            'session.driver' => 'database',
            'cache.default' => 'database',
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.anot.app',
            'mail.mailers.smtp.username' => 'anot',
            'mail.mailers.smtp.password' => 'strong-secret',
        ]);

        $this->artisan('app:validate-production', ['--json' => true])
            ->expectsOutputToContain('"status": "ok"')
            ->assertSuccessful();
    }

    public function test_command_accepts_brevo_with_a_real_api_key(): void
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
            'mail.default' => 'brevo',
            'mail.mailers.brevo.api_key' => 'brevo-secret',
        ]);

        $this->artisan('app:validate-production')->assertSuccessful();
    }

    public function test_command_rejects_malformed_app_url(): void
    {
        config([
            'app.env' => 'production',
            'app.debug' => false,
            'app.url' => 'https://',
            'app.mobile_reset_url' => 'anot://reset-password',
            'app.key' => 'base64:'.base64_encode(random_bytes(32)),
            'app.support_email' => 'suporte@anot.app',
            'database.default' => 'pgsql',
            'database.connections.pgsql.password' => 'strong-secret',
            'queue.default' => 'database',
            'session.driver' => 'database',
            'cache.default' => 'database',
            'mail.default' => 'smtp',
        ]);

        $this->artisan('app:validate-production')
            ->expectsOutputToContain('FAIL APP_URL')
            ->assertFailed();
    }

    public function test_command_rejects_empty_mobile_reset_url(): void
    {
        config([
            'app.env' => 'production',
            'app.debug' => false,
            'app.url' => 'https://api.anot.app',
            'app.mobile_reset_url' => '',
            'app.key' => 'base64:'.base64_encode(random_bytes(32)),
            'app.support_email' => 'suporte@anot.app',
            'database.default' => 'pgsql',
            'database.connections.pgsql.password' => 'strong-secret',
            'queue.default' => 'database',
            'session.driver' => 'database',
            'cache.default' => 'database',
            'mail.default' => 'smtp',
        ]);

        $this->artisan('app:validate-production')
            ->expectsOutputToContain('FAIL MOBILE_RESET_URL')
            ->assertFailed();
    }

    public function test_command_rejects_missing_postgres_connection_fields_and_smtp_credentials(): void
    {
        config([
            'app.env' => 'production',
            'app.debug' => false,
            'app.url' => 'https://api.anot.app',
            'app.mobile_reset_url' => 'anot://reset-password',
            'app.key' => 'base64:'.base64_encode(random_bytes(32)),
            'app.support_email' => 'suporte@anot.app',
            'database.default' => 'pgsql',
            'database.connections.pgsql.host' => '',
            'database.connections.pgsql.port' => 0,
            'database.connections.pgsql.database' => '',
            'database.connections.pgsql.username' => '',
            'database.connections.pgsql.password' => 'strong-secret',
            'queue.default' => 'database',
            'session.driver' => 'database',
            'cache.default' => 'database',
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => '',
            'mail.mailers.smtp.username' => '',
            'mail.mailers.smtp.password' => '',
        ]);

        $this->artisan('app:validate-production')
            ->expectsOutputToContain('FAIL DB_HOST')
            ->expectsOutputToContain('FAIL DB_PORT')
            ->expectsOutputToContain('FAIL DB_DATABASE')
            ->expectsOutputToContain('FAIL DB_USERNAME')
            ->expectsOutputToContain('FAIL MAIL')
            ->assertFailed();
    }

    public function test_command_rejects_placeholder_support_email(): void
    {
        config([
            'app.env' => 'production',
            'app.debug' => false,
            'app.url' => 'https://api.anot.app',
            'app.mobile_reset_url' => 'anot://reset-password',
            'app.key' => 'base64:'.base64_encode(random_bytes(32)),
            'app.support_email' => 'support@example.com',
            'database.default' => 'pgsql',
            'database.connections.pgsql.password' => 'strong-secret',
            'queue.default' => 'database',
            'session.driver' => 'database',
            'cache.default' => 'database',
            'mail.default' => 'brevo',
            'mail.mailers.brevo.api_key' => 'brevo-secret',
        ]);

        $this->artisan('app:validate-production')
            ->expectsOutputToContain('FAIL SUPPORT_EMAIL')
            ->assertFailed();
    }

    public function test_command_rejects_insecure_mobile_reset_url(): void
    {
        config([
            'app.env' => 'production',
            'app.debug' => false,
            'app.url' => 'https://api.anot.app',
            'app.mobile_reset_url' => 'http://api.anot.app/reset-password',
            'app.key' => 'base64:'.base64_encode(random_bytes(32)),
            'app.support_email' => 'suporte@anot.app',
            'database.default' => 'pgsql',
            'database.connections.pgsql.password' => 'strong-secret',
            'queue.default' => 'database',
            'session.driver' => 'database',
            'cache.default' => 'database',
            'mail.default' => 'smtp',
        ]);

        $this->artisan('app:validate-production')
            ->expectsOutputToContain('FAIL MOBILE_RESET_URL')
            ->assertFailed();
    }
}

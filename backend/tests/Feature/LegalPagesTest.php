<?php

namespace Tests\Feature;

use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    public function test_public_legal_pages_are_available(): void
    {
        $this->get('/privacy')->assertOk()->assertSee('Política de Privacidade');
        $this->get('/terms')->assertOk()->assertSee('Termos de Uso');
        $this->get('/support')->assertOk()->assertSee('Suporte ANOT');
    }
}

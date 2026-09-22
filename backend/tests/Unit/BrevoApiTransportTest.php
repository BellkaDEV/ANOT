<?php

namespace Tests\Unit;

use App\Mail\BrevoApiTransport;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class BrevoApiTransportTest extends TestCase
{
    public function test_it_sends_a_laravel_email_through_the_brevo_api(): void
    {
        Http::fake(['https://api.brevo.com/v3/smtp/email' => Http::response(['messageId' => 'brevo-id'], 201)]);

        $transport = new BrevoApiTransport('test-key');
        $transport->send((new Email)
            ->from(new Address('no-reply@anot.test', 'ANOT'))
            ->to(new Address('student@anot.test', 'Student'))
            ->subject('Teste')
            ->text('Mensagem de teste'));

        Http::assertSent(fn ($request) => $request->url() === 'https://api.brevo.com/v3/smtp/email'
            && $request['sender']['email'] === 'no-reply@anot.test'
            && $request['to'][0]['email'] === 'student@anot.test'
            && $request->hasHeader('api-key', 'test-key'));
    }
}

<?php

namespace App\Mail;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Email;

class BrevoApiTransport extends AbstractTransport
{
    public function __construct(private readonly string $apiKey)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $sentMessage): void
    {
        $message = $sentMessage->getOriginalMessage();

        if (! $message instanceof Email || count($message->getFrom()) === 0 || count($message->getTo()) === 0) {
            throw new TransportException('A mensagem Brevo precisa de remetente e destinatário.');
        }

        $from = $message->getFrom()[0];
        $response = Http::acceptJson()
            ->withHeader('api-key', $this->apiKey)
            ->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => [
                    'email' => $from->getAddress(),
                    'name' => $from->getName(),
                ],
                'to' => collect($message->getTo())->map(fn ($address) => [
                    'email' => $address->getAddress(),
                    'name' => $address->getName(),
                ])->values()->all(),
                'subject' => $message->getSubject(),
                'htmlContent' => $message->getHtmlBody(),
                'textContent' => $message->getTextBody(),
            ]);

        if ($response->failed()) {
            throw new TransportException('Brevo recusou o envio: HTTP '.$response->status().'.');
        }

        $sentMessage->setMessageId($response->json('messageId'));
    }

    public function __toString(): string
    {
        return 'brevo+api';
    }
}

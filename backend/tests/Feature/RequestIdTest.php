<?php

namespace Tests\Feature;

use Illuminate\Support\Str;
use Tests\TestCase;

class RequestIdTest extends TestCase
{
    public function test_valid_request_id_is_preserved_in_the_response(): void
    {
        $requestId = (string) Str::uuid();

        $this->get('/health', ['X-Request-ID' => $requestId])
            ->assertOk()
            ->assertHeader('X-Request-ID', $requestId);
    }

    public function test_invalid_request_id_is_replaced_with_a_uuid(): void
    {
        $response = $this->get('/health', ['X-Request-ID' => 'client-value']);

        $response->assertOk();
        $this->assertTrue(Str::isUuid((string) $response->headers->get('X-Request-ID')));
        $this->assertNotSame('client-value', $response->headers->get('X-Request-ID'));
    }
}

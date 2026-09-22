<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromotePlatformAdmin extends Command
{
    protected $signature = 'admin:promote {email : E-mail da conta existente} {--yes : Confirma a alteração sem prompt}';

    protected $description = 'Concede acesso de administrador global a uma conta existente';

    public function handle(): int
    {
        $user = User::where('email', strtolower(trim((string) $this->argument('email'))))->first();

        if (! $user) {
            $this->error('Nenhuma conta encontrada com esse e-mail.');

            return self::FAILURE;
        }

        if (! $this->option('yes') && ! $this->confirm("Conceder administração global a {$user->email}?")) {
            $this->comment('Operação cancelada.');

            return self::SUCCESS;
        }

        $user->forceFill(['is_platform_admin' => true, 'is_suspended' => false])->save();
        $this->info("{$user->email} agora é administrador global.");

        return self::SUCCESS;
    }
}

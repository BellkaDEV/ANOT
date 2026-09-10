# ANOT

Aplicativo mobile de gestão acadêmica para turmas, avisos, atividades, grupos de trabalho e calendário.

O projeto é dividido em:

- `mobile/`: aplicativo React Native + Expo + TypeScript para Android e iOS.
- `backend/`: API REST Laravel 13 + Sanctum.
- `docs/`: documentação operacional e de deploy.

## Stack

- React Native, Expo SDK 57 e TypeScript
- Laravel 13, PHP e Sanctum
- SQLite para desenvolvimento e PostgreSQL para produção
- Axios no mobile
- SecureStore para tokens em Android/iOS

## Pré-requisitos

- Node.js 20+
- PHP 8.3+
- Composer
- Android Studio/Expo Go para testar em dispositivo
- Um computador e o celular na mesma rede Wi-Fi para desenvolvimento mobile

## Instalação

### Backend

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

### Mobile

```powershell
cd mobile
npm ci
```

Configure `mobile/.env` com o IP acessível pelo celular:

```text
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

Não use `localhost` para o celular físico.

## Inicialização no Windows

Na raiz do projeto, execute:

```text
iniciar-anot-completo.bat
```

O launcher seleciona a interface LAN, inicia a API em `8000`, verifica `/health` e inicia o Expo em `8081`. Se o celular não alcançar a API, verifique a rede e permita as portas 8000/8081 no firewall da rede privada.

## Inicialização manual

```powershell
# Terminal 1
cd backend
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2
cd mobile
npx.cmd expo start --lan --port 8081 --clear
```

Verifique a API em `http://<IP-DO-PC>:8000/health`.

## Contas locais de teste

Após `php artisan db:seed`:

| E-mail | Senha |
|---|---|
| `lucas@univ.edu.br` | `password123` |
| `ana@univ.edu.br` | `password123` |

Essas credenciais são apenas para desenvolvimento local.

## Testes e verificações

```powershell
cd backend
php vendor/bin/phpunit --testdox
composer audit --locked
php artisan migrate:status

cd ..\mobile
npx tsc --noEmit
npx expo-doctor
```

## Estado atual

O fluxo principal de autenticação, turmas, atividades, avisos, grupos, calendário, QR Code e deep links está implementado. A validação em dispositivo físico e a configuração de produção ainda devem ser realizadas antes de um deploy público.

## Segurança

- Nunca versione `.env`, tokens, chaves ou senhas reais.
- Use HTTPS em produção.
- Não exponha o banco PostgreSQL diretamente à internet.
- Rotacione qualquer credencial que tenha sido exposta.

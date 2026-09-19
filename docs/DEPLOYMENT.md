# 🚀 Guia de Deploy, Staging e Nuvem — ANOT

Este documento estabelece o procedimento operacional padrão (SOP) para implantação do backend **ANOT** em ambientes de Staging e Produção.

---

## 🔑 1. Variáveis de Ambiente Obrigatórias de Produção

As variáveis de ambiente devem ser injetadas pelo cofre de segredos do seu provedor de nuvem (AWS Secrets Manager, Supabase, Render, Heroku ou Docker Swarm/K8s Secrets). **Nunca versione o arquivo `.env` de produção.**

| Variável | Descrição / Requisito | Exemplo |
| :--- | :--- | :--- |
| `APP_NAME` | Nome da aplicação | `ANOT` |
| `APP_ENV` | Ambiente de execução (`staging` ou `production`) | `production` |
| `APP_KEY` | Chave de criptografia de 32 bytes (Gere via `php artisan key:generate --show`) | `base64:...` |
| `APP_DEBUG` | **DEVE ser `false` em produção** | `false` |
| `APP_URL` | URL HTTPS canônica do backend | `https://api.anot.app` |
| `DB_CONNECTION` | Driver de banco de dados | `pgsql` |
| `DB_HOST` | Endpoint do banco PostgreSQL gerenciado | `db.internal` / RDS Host |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_DATABASE` | Nome do banco de dados | `anot_prod` |
| `DB_USERNAME` | Usuário do banco de dados | `anot_user` |
| `DB_PASSWORD` | Senha forte do banco de dados | `*(Segredo gerado)*` |
| `SANCTUM_EXPIRATION` | Duração do token em minutos (padrão: 30 dias = 43200 min) | `43200` |
| `EXPO_PUBLIC_API_URL` | URL apontada no app mobile (HTTPS) | `https://api.anot.app/api` |

> ⚠️ **ATENÇÃO — Rotação de Segredos**: Qualquer chave (`APP_KEY` ou `DB_PASSWORD`) que tenha sido previamente exposta em commits legados deve ser rotacionada imediatamente no ambiente de nuvem.

---

## 🐳 2. Configuração Docker & Imagem Imutável

1. **Compilação da Imagem de Produção**:
   ```bash
   docker build -t anot-backend:v2.0.0 ./backend
   ```
   O Dockerfile usa build multi-stage: compila os assets do console administrativo com Node 20 e entrega apenas o resultado junto da imagem PHP final.
2. **Execução de Containers**:
   - Utilize a configuração [docker-compose.yml](file:///C:/Users/User/ANOT/backend/docker-compose.yml) limpa.
   - O banco PostgreSQL opera isolado dentro da rede Docker fechada (sem bind port `5432:5432` externa).
   - O container da aplicação responde ao healthcheck no endpoint `GET /health`.

---

## 🗄️ 3. Procedimento de Migration de Release

**NUNCA** execute `php artisan migrate` dentro do script de subida concorrente dos containers (ex: `entrypoint.sh`). As migrações devem ser rodadas uma única vez como tarefa de release antes de direcionar o tráfego HTTP:

```bash
docker exec -it anot_app_container php artisan migrate --force
```

---

## 💾 4. Backup & Restore (PostgreSQL)

### Backup Diário Automatizado:
```bash
pg_dump -h <DB_HOST> -U anot_user -d anot_prod -F c -b -v -f /backups/anot_$(date +%Y%m%d_%H%M%S).dump
```

### Procedimento de Restore:
```bash
pg_restore -h <DB_HOST> -U anot_user -d anot_prod -v /backups/anot_20260905_120000.dump
```

---

## 🔄 5. Plano de Rollback

Em caso de falha crítica durante o deploy:
1. Reverter o tráfego para a versão anterior da imagem Docker: `anot-backend:v1.9.0`.
2. Caso a migration de release tenha alterado esquemas sem breaking changes (ex: adição de tabelas/colunas nulas), os containers anteriores continuarão operantes.
3. Se necessário restaurar estado de dados pré-release, execute o procedimento de restore utilizando o último backup realizado imediatamente antes do deploy.

### Checklist mínimo antes de promover uma release

- [ ] CI verde: PHPUnit, Pint, Composer audit, TypeScript, Expo Doctor, bundle Android, assets web e Docker build.
- [ ] `APP_DEBUG=false`, `APP_URL` HTTPS e `MOBILE_RESET_URL` apontando para o domínio/scheme aprovado.
- [ ] Migration executada uma única vez como etapa controlada.
- [ ] Primeiro administrador configurado com `php artisan admin:promote <email> --yes`.
- [ ] SMTP testado para recuperação de senha e verificação de e-mail.
- [ ] Healthcheck `/health` validado externamente após o deploy.
- [ ] Backup anterior e imagem anterior identificados antes da promoção.

### Build Android

O APK interno e o AAB de produção são gerados pelo EAS, fora do runner de deploy do backend:

```bash
cd mobile
npx eas build --profile preview --platform android
npx eas build --profile production --platform android
```

O `EXPO_TOKEN` deve existir somente nos secrets do provedor/EAS. Keystore de distribuição nunca deve ser versionado.

---

## 🔒 6. Recomendações de HTTPS & Edge Security

- **SSL/TLS**: Exigir HTTPS com certificado válido (Let's Encrypt / Cloudflare SSL).
- **HSTS**: Ativar cabeçalho `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- **WAF / Rate Limiting Edge**: Configurar Cloudflare ou Nginx com limite de 60 req/min por IP.

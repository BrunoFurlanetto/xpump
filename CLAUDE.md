# CLAUDE.md — Xpump

> Configurações do projeto para o time de agentes.
> Complementa e sobrescreve o CLAUDE.md global quando necessário.

---

## Projeto

**Nome:** Xpump
**Descrição:** Plataforma gamificada de fitness e nutrição com backend Django para privados
**Stack:** Django 5.2.3 · DRF · PostgreSQL · JWT (SimpleJWT) · Cloudflare R2 · APScheduler
**Repositório:** https://github.com/BrunoFurlanetto/xpump.git
**Ambiente local:** `cd backend && python manage.py runserver`

---

## Vault (Obsidian)

**Path do projeto:** Dev projects/Xpump
**Memory:** Dev projects/Xpump/Memory.md
**Session Log:** Dev projects/Xpump/session-log.md
**Planejamentos:** Dev projects/Xpump/features/

### Abertura de sessão

Ler em paralelo antes de qualquer task:

```
mcp_obsidian: read_note
path: Dev projects/Xpump/Memory.md
```

```
mcp_obsidian: read_note
path: Dev projects/Xpump/session-log.md
```

Priorizar na leitura:
- `session-log.md` — última entrada: o que estava em andamento e o que está pendente
- `memory.md` — ADRs relevantes à task atual, problemas conhecidos, padrões estabelecidos

Se a task envolve um planejamento de feature, ler também:
```
mcp_obsidian: read_note
path: Dev projects/Xpump/features/<nome-da-feature>.md
```

Ler a nota do módulo afetado antes de implementar:
```
mcp_obsidian: read_note
path: Dev projects/Xpump/modules/{app}/{app}.md
```

### Fechamento de sessão

Seguir o protocolo condicional do CLAUDE.md global. Quando registrar:

```
mcp_obsidian: update_note
path: Dev projects/Xpump/session-log.md
```

Se tomou decisão de design, registrar ADR no `memory.md` antes de fechar:

```
mcp_obsidian: update_note
path: Dev projects/Xpump/Memory.md
```

---

## Branches protegidas

Nunca commitar diretamente ou criar branches a partir de:
- `main`

O orchestrator sempre pergunta a branch base antes de criar qualquer branch nova.

---

## Como rodar os testes

```bash
cd backend && python manage.py test
```

---

## Ownership dos agentes

| Agente | Pode criar/editar | Somente leitura |
|--------|------------------|-----------------|
| `dev` | `{app}/views.py`, `{app}/urls.py`, `{app}/serializer.py`, `{app}/services.py`, `{app}/signals.py`, `{app}/pagination.py`, `{app}/permissions.py`, `{app}/exceptions.py`, `{app}/scheduler.py`, `{app}/management/`, `core/urls.py`, `core/settings.py` | models, migrations, testes |
| `dba` | `{app}/models.py`, `{app}/migrations/`, `{app}/admin.py`, `{app}/fixtures/` | todo o resto |
| `qa` | `{app}/test/`, `{app}/tests.py` | todo o código de produção |
| `security` | `docs/security/` | todo o codebase |
| `reviewer` | — | todo o codebase |

---

## Convenções

### Commits

```
tipo(escopo): mensagem imperativa curta

Task: T-xxx
```

Tipos válidos: feat, fix, refactor, test, docs, chore, perf, style

### Estrutura de cada app Django

```
{app}/
├── models.py           # dba
├── migrations/         # dba
├── admin.py            # dba
├── serializer.py       # dev — sempre singular, sem "s"
├── views.py            # dev
├── urls.py             # dev
├── services.py         # dev (quando necessário)
├── permissions.py      # dev (quando necessário)
├── exceptions.py       # dev (quando necessário)
├── signals.py          # dev (quando necessário)
├── pagination.py       # dev (quando necessário)
└── test/               # qa
    ├── test_models.py
    ├── test_serializers.py
    ├── test_views.py
    └── test_urls.py
```

> `profiles/serializers.py` e `social_feed/serializers.py` usam plural por engano histórico.
> Padrão correto é singular. Novos arquivos sempre com `serializer.py`.

### Apps e responsabilidades

| App | Responsabilidade |
|-----|-----------------|
| `core` | Settings, URLs raiz, storage backends, WSGI/ASGI |
| `authentication` | Login, JWT tokens, criação de usuários |
| `profiles` | Perfis de usuário, atividades, scores |
| `clients` | Clientes/academias que usam a plataforma |
| `groups` | Grupos e desafios entre usuários |
| `workouts` | Cadastro e registro de treinos |
| `nutrition` | Cadastro e registro de refeições |
| `gamification` | XP, níveis, seasons, badges |
| `social_feed` | Posts, feed social, curtidas |
| `analytics` | Dados analíticos e relatórios |
| `notifications` | Push notifications via APScheduler |
| `status` | Statuses configuráveis do sistema |

### URLs

Todas as rotas seguem prefixo `api/v1/`. Exemplo: `api/v1/profiles/`, `api/v1/groups/`.

### Variáveis de ambiente obrigatórias

```
SECRET_KEY
DB_NAME · DB_USER · DB_PASSWORD · DB_HOST · DB_PORT
AWS_ACCESS_KEY_ID · AWS_SECRET_ACCESS_KEY · AWS_STORAGE_BUCKET_NAME
AWS_S3_ENDPOINT_URL · AWS_S3_CUSTOM_DOMAIN (opcional)
VAPID_PRIVATE_KEY · VAPID_PUBLIC_KEY · VAPID_ADMIN_EMAIL
```

Em desenvolvimento usar `backend/core/local_settings.py` (não versionado).

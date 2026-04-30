# AGENTS.md — Xpump

> Configurações do projeto para o time de agentes.
> Complementa e sobrescreve o AGENTS.md global quando necessário.

---

## Projeto

**Nome:** Xpump  
**Descrição:** plataforma gamificada de fitness e nutrição com backend Django para grupos privados  
**Stack:** Monorepo com backend Django/DRF e frontend Next.js; este AGENTS.md cobre operacionalmente apenas o `backend/`  
**Repositório:** https://github.com/BrunoFurlanetto/xpump.git  
**Ambiente local:** `cd backend && python manage.py runserver`

---

## Escopo deste AGENTS

Este projeto é um monorepo, mas o escopo de atuação configurado aqui é **somente o backend**.

Tudo em `frontend/` deve ser tratado como fora de ownership deste setup, exceto leitura quando necessário para entender integração.

---

## Vault (Obsidian)

**Path do projeto:** `Dev projects/Xpump`  
**Memory:** `Dev projects/Xpump/Memory.md`  
**Session Log:** `Dev projects/Xpump/session-log.md`  
**Planejamentos:** `Dev projects/Xpump/features/`

### Abertura de sessão

Ler em paralelo antes de qualquer task:

```text
mcp_obsidian: view
path: Dev projects/Xpump/Memory.md
```

```text
mcp_obsidian: view
path: Dev projects/Xpump/session-log.md
```

Priorizar na leitura:
- `session-log.md` — última entrada, pendências e bloqueios
- `Memory.md` — ADRs, problemas conhecidos e padrões do projeto

Se a task envolve uma feature planejada no vault, ler também:

```text
mcp_obsidian: view
path: Dev projects/Xpump/features/<nome-da-feature>.md
```

### Declaração obrigatória antes de agir

Após a leitura, declarar:

```text
Contexto da última sessão: [feature], status [✅/🔄/🔴], pendente: [o quê].
Minha task agora: [o que vou fazer].
```

### Fechamento de sessão

Seguir o protocolo condicional do AGENTS global. Quando houver registro, adicionar ao final de `Dev projects/Xpump/session-log.md`.

Se houver decisão de design relevante, registrar primeiro no `Dev projects/Xpump/Memory.md` e só depois fechar a sessão.

---

## Branches protegidas

Nunca commitar diretamente ou criar branches a partir de:
- `main`
- `master`

O orchestrator sempre pergunta a branch base antes de criar qualquer branch nova.

---

## Como rodar os testes

```bash
cd backend && python manage.py test
```

---

## Ownership dos agentes

| Agente | Pode criar/editar | Somente leitura |
|--------|-------------------|-----------------|
| `dev` | `backend/<app>/views.py`, `backend/<app>/urls.py`, `backend/<app>/serializer.py`, `backend/<app>/serializers.py`, `backend/<app>/services.py`, `backend/<app>/permissions.py`, `backend/<app>/exceptions.py`, `backend/<app>/pagination.py`, `backend/<app>/management/commands/`, `backend/core/urls.py`, `backend/core/storage_backends.py` | `backend/<app>/models.py`, `backend/<app>/migrations/`, `frontend/` |
| `dba` | `backend/<app>/models.py`, `backend/<app>/migrations/`, `backend/fixtures/` | todo o restante |
| `qa` | `backend/**/tests.py`, `backend/**/test/`, testes de integração do backend | código de produção |
| `security` | `docs/security/` e relatórios de segurança do backend | todo o codebase |
| `reviewer` | — | todo o codebase |

Apps backend atualmente detectados:
- `authentication`
- `profiles`
- `groups`
- `workouts`
- `nutrition`
- `gamification`
- `clients`
- `social_feed`
- `analytics`
- `notifications`
- `status`

---

## Convenções

### Commits

```text
tipo(escopo): mensagem imperativa curta

Task: T-xxx
```

Tipos válidos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`

### Backend Django

- Estrutura principal em `backend/`, com projeto Django em `backend/core/`
- APIs expostas sob prefixo `api/v1/` em `backend/core/urls.py`
- Documentação OpenAPI via `drf-spectacular`
- Autenticação com `JWTAuthentication` e `SessionAuthentication`
- Banco configurado para PostgreSQL por variáveis de ambiente
- Uploads e storage configurados para Cloudflare R2 em produção
- Há comandos de gerenciamento por app em `management/commands/`
- Os testes estão distribuídos entre `tests.py` e pastas `test/` por app

### Variáveis e integrações relevantes

Detectadas em `backend/core/settings.py`:
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `SECRET_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_STORAGE_BUCKET_NAME`
- `AWS_S3_ENDPOINT_URL`
- `AWS_S3_CUSTOM_DOMAIN`
- `VAPID_PRIVATE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_ADMIN_EMAIL`

### Convenções de sessão no vault

- O projeto já usa `Memory.md` com `M` maiúsculo; manter esse nome até eventual padronização explícita
- O `session-log.md` já existe e deve receber apenas append no final
- Agentes não devem sobrescrever entradas anteriores no vault

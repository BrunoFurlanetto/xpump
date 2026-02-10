# Sistema de Notificações Xpump

Sistema completo de notificações para o Xpump, incluindo notificações in-app, Web Push para PWA e entrega em tempo real via WebSocket.

## Features

- ✅ Notificações in-app armazenadas no banco
- ✅ Web Push notifications para PWA (padrão W3C)
- ✅ WebSocket para notificações em tempo real
- ✅ Processamento assíncrono com Celery
- ✅ Lembretes agendados (treinos, refeições)
- ✅ Notificações automáticas para eventos:
  - Interações sociais (likes, comentários)
  - Atividades em grupos
  - Marcos de streak (7, 14, 30, 60, 100 dias)
  - Level ups
  - Mudanças de ranking
- ✅ Preferências granulares por tipo
- ✅ Quiet hours (horário de silêncio)
- ✅ API REST completa com documentação OpenAPI
- ✅ Suporte a múltiplos dispositivos

## Arquitetura

```
┌──────────────┐
│   Frontend   │
│   (PWA)      │
└──────┬───────┘
       │
       ├─────► WebSocket (tempo real)
       ├─────► REST API (histórico)
       └─────► Web Push (background)
              
┌──────────────────────────────────────┐
│           Backend (Django)           │
├──────────────────────────────────────┤
│                                      │
│  Signals ──► Services ──► Models    │
│     │           │           │        │
│     │           └──► Tasks ─┴── DB  │
│     │               (Celery)        │
│     │                               │
│     └──► WebSocket Consumer         │
│     └──► Web Push (pywebpush)      │
│                                      │
└──────────────────────────────────────┘
       │              │
       ▼              ▼
   [Redis]     [PostgreSQL]
```

## Setup

### 1. Instalar Dependências

Já foram adicionadas ao `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Redis (para Celery e Channels)
REDIS_URL=redis://localhost:6379/0

# VAPID Keys (gerar com o comando abaixo)
VAPID_PRIVATE_KEY=sua_chave_privada_aqui
VAPID_PUBLIC_KEY=sua_chave_publica_aqui
VAPID_ADMIN_EMAIL=admin@xpump.com
```

### 3. Gerar VAPID Keys

```bash
python manage.py generate_vapid_keys
```

Copie as chaves geradas para o `.env`.

### 4. Executar Migrações

```bash
python manage.py migrate
```

### 5. Criar Preferências para Usuários Existentes

```bash
python manage.py sync_notification_preferences
```

### 6. Iniciar Serviços

#### Opção 1: Com Docker Compose (Recomendado)

```bash
docker-compose up
```

Isso iniciará:
- Backend Django/Daphne
- PostgreSQL
- Redis
- Celery Worker
- Celery Beat

#### Opção 2: Manual (Desenvolvimento)

Terminal 1 - Redis:
```bash
redis-server
```

Terminal 2 - Django com Daphne (ASGI):
```bash
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

Terminal 3 - Celery Worker:
```bash
celery -A core worker -l info
```

Terminal 4 - Celery Beat (tarefas agendadas):
```bash
celery -A core beat -l info
```

## Uso

### API Endpoints

Todos os endpoints estão documentados no Swagger:
```
http://localhost:8000/api/v1/schema/swagger-ui/
```

Principais endpoints:

- `GET /api/v1/notifications/` - Listar notificações
- `GET /api/v1/notifications/unread_count/` - Contador de não lidas
- `POST /api/v1/notifications/mark_as_read/` - Marcar como lida
- `POST /api/v1/notifications/mark_all_as_read/` - Marcar todas
- `GET /api/v1/notifications/vapid-key/` - Obter chave VAPID pública
- `POST /api/v1/notifications/subscriptions/` - Registrar push subscription
- `GET /api/v1/notifications/preferences/` - Obter preferências
- `PATCH /api/v1/notifications/preferences/` - Atualizar preferências

WebSocket:
```
ws://localhost:8000/ws/notifications/?token=<JWT_TOKEN>
```

### Management Commands

```bash
# Gerar VAPID keys
python manage.py generate_vapid_keys

# Sincronizar preferências de usuários
python manage.py sync_notification_preferences

# Enviar notificação de teste
python manage.py send_test_notification <user_id> [--type social]
```

### Testar Notificações

1. **Criar Like em Post** (via API):
   ```bash
   curl -X POST http://localhost:8000/api/v1/social-feed/posts/123/like/ \
        -H "Authorization: Bearer <token>"
   ```
   → Autor do post recebe notificação

2. **Completar Workout** (para streak):
   ```bash
   curl -X POST http://localhost:8000/api/v1/workouts/checkins/ \
        -H "Authorization: Bearer <token>" \
        -d '{"workout_id": 1, "workout_date": "2026-02-10"}'
   ```
   → Ao atingir 7 dias, recebe notificação de milestone

3. **Enviar Teste Manual**:
   ```bash
   python manage.py send_test_notification 1 --type social
   ```

## Integração Frontend

Consulte o guia detalhado em:
```
backend/notifications/INTEGRATION_GUIDE.md
```

### Quick Start Frontend

```typescript
// 1. Obter VAPID key
const response = await fetch('http://localhost:8000/api/v1/notifications/vapid-key/');
const { public_key } = await response.json();

// 2. Criar push subscription
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(public_key)
});

// 3. Registrar no backend
await fetch('http://localhost:8000/api/v1/notifications/subscriptions/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    p256dh_key: subscription.toJSON().keys.p256dh,
    auth_key: subscription.toJSON().keys.auth
  })
});

// 4. Conectar WebSocket
const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Nova notificação:', message.data);
};
```

## Tipos de Notificações

| Tipo | Descrição | Triggers |
|------|-----------|----------|
| `social` | Interações sociais | Like em post, comentário, like em comentário |
| `group` | Atividades de grupo | Convite, aceite, promoção admin |
| `streak` | Marcos de sequência | 7, 14, 30, 60, 100 dias |
| `level_up` | Subida de nível | Ganho de XP suficiente |
| `rank_change` | Mudança de ranking | Alteração significativa no grupo |
| `reminder` | Lembretes | Treino ou refeição (agendado) |
| `achievement` | Conquistas | Futuro |

## Tarefas Agendadas (Celery Beat)

- **8:00** - Lembretes de treino
- **12:00** - Lembretes de almoço
- **18:00** - Lembretes de jantar
- **21:00** - Verificação de mudanças de ranking
- **Segunda 3:00** - Limpeza de notificações antigas (30+ dias)

## Estrutura de Arquivos

```
notifications/
├── __init__.py
├── admin.py              # Admin Django
├── apps.py               # App config
├── models.py             # Notification, PushSubscription, NotificationPreference
├── serializers.py        # DRF serializers com docs OpenAPI
├── views.py              # ViewSets REST
├── urls.py               # URL routing
├── permissions.py        # Custom permissions
├── services.py           # NotificationService, NotificationTemplates
├── signals.py            # Signal receivers
├── tasks.py              # Celery tasks
├── consumers.py          # WebSocket consumer
├── routing.py            # WebSocket routing
├── pagination.py         # Pagination config
├── INTEGRATION_GUIDE.md  # Guia detalhado para frontend
├── management/
│   └── commands/
│       ├── generate_vapid_keys.py
│       ├── send_test_notification.py
│       └── sync_notification_preferences.py
└── migrations/
```

## Troubleshooting

### WebSocket não conecta

1. Verificar que Daphne está rodando (não runserver)
2. Verificar token JWT na query string
3. Verificar se Redis está rodando

### Push notifications não funcionam

1. Verificar VAPID keys configuradas
2. Verificar permissões do browser
3. Verificar HTTPS (obrigatório em produção)
4. Checar logs do Celery worker

### Notificações não são criadas

1. Verificar signals importados em `apps.py ready()`
2. Verificar preferências do usuário
3. Checar logs do Django

### Celery tasks não executam

1. Verificar Redis conectado
2. Verificar worker Celery rodando
3. Verificar beat schedule em `celery.py`

## Produção

### Checklist

- [ ] VAPID keys geradas e seguras
- [ ] HTTPS configurado (obrigatório para Web Push)
- [ ] Redis com persistência
- [ ] Daphne/Uvicorn com supervisor/systemd
- [ ] Celery com supervisor/systemd
- [ ] Logs configurados
- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente
- [ ] WebSocket reverse proxy (nginx)

### Exemplo Nginx para WebSocket

```nginx
location /ws/ {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Licença

Parte do projeto Xpump.

## Suporte

Para dúvidas ou problemas:
1. Consultar [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
2. Ver documentação Swagger
3. Verificar logs do Django/Celery

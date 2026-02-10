# Guia de Integração - Sistema de Notificações Xpump

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Obter VAPID Public Key](#1-obter-vapid-public-key)
3. [Configurar Service Worker](#2-configurar-service-worker-no-pwa)
4. [Registrar Subscription](#3-registrar-subscription-no-backend)
5. [Conectar WebSocket](#4-conectar-websocket-para-notificações-em-tempo-real)
6. [Listar Notificações](#5-listar-notificações)
7. [Marcar como Lida](#6-marcar-notificações-como-lidas)
8. [Contador de Não Lidas](#7-obter-contador-de-não-lidas)
9. [Estrutura de Metadata](#8-estrutura-de-metadata-por-tipo)
10. [Preferências do Usuário](#9-gerenciar-preferências-de-notificações)
11. [Exemplos Completos](#10-exemplos-completos-de-código)
12. [Tratamento de Erros](#11-tratamento-de-erros)

---

## Visão Geral

O sistema de notificações do Xpump oferece três canais de entrega:

- **In-App Notifications**: Armazenadas no banco, consultadas via API REST
- **WebSocket**: Delivery em tempo real para usuários conectados
- **Web Push**: Push notifications nativas do browser para PWA

### Base URL
```
API REST: https://seu-dominio.com/api/v1/notifications/
WebSocket: wss://seu-dominio.com/ws/notifications/
```

### Autenticação
Todas as rotas (exceto VAPID key) requerem **JWT Bearer Token** no header:
```
Authorization: Bearer <seu_token_jwt>
```

---

## 1. Obter VAPID Public Key

Antes de configurar Web Push, obtenha a chave pública VAPID do servidor.

### Endpoint
```
GET /api/v1/notifications/vapid-key/
```

### Request
```bash
curl https://seu-dominio.com/api/v1/notifications/vapid-key/
```

### Response
```json
{
  "public_key": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQJo4-BaL..."
}
```

**Nota**: Esta chave é pública e será usada no `applicationServerKey` do Service Worker.

---

## 2. Configurar Service Worker no PWA

Crie ou atualize seu Service Worker para suportar Push Notifications.

### 2.1. Registrar Service Worker

```javascript
// Em seu arquivo principal (ex: app.tsx, main.tsx)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registered:', registration);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}
```

### 2.2. Criar Service Worker (sw.js)

```javascript
// sw.js
self.addEventListener('push', function(event) {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  
  const options = {
    body: data.body || data.message,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data, // Notification metadata
    actions: [
      { action: 'view', title: 'Ver' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    // Abrir aplicação e navegar para notificação
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
```

### 2.3. Solicitar Permissão e Criar Subscription

```typescript
// notifications.service.ts
export async function setupPushNotifications(vapidPublicKey: string): Promise<void> {
  // 1. Verificar se browser suporta
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications não suportadas neste browser');
    return;
  }

  // 2. Solicitar permissão
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Permissão de notificações negada');
    return;
  }

  // 3. Obter Service Worker registration
  const registration = await navigator.serviceWorker.ready;

  // 4. Criar subscription
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  // 5. Enviar subscription para o backend
  await sendSubscriptionToBackend(subscription);
}

// Função auxiliar para converter VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

---

## 3. Registrar Subscription no Backend

Após criar a subscription no browser, envie para o backend.

### Endpoint
```
POST /api/v1/notifications/subscriptions/
```

### Request
```typescript
async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  const subscriptionJson = subscription.toJSON();
  
  const response = await fetch('https://seu-dominio.com/api/v1/notifications/subscriptions/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourJwtToken}`
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh_key: subscriptionJson.keys.p256dh,
      auth_key: subscriptionJson.keys.auth,
      user_agent: navigator.userAgent
    })
  });

  if (!response.ok) {
    throw new Error('Failed to register push subscription');
  }

  console.log('Push subscription registered successfully');
}
```

### Response (201 Created)
```json
{
  "id": 123,
  "endpoint": "https://fcm.googleapis.com/fcm/send/abc123...",
  "p256dh_key": "BNcRdreALRFXTkOO...",
  "auth_key": "tBHItJI5svbpez7KI==",
  "user_agent": "Mozilla/5.0...",
  "active": true,
  "created_at": "2026-02-10T14:30:00Z",
  "last_used": null
}
```

### Remover Subscription
```
DELETE /api/v1/notifications/subscriptions/{id}/
```

---

## 4. Conectar WebSocket para Notificações em Tempo Real

### 4.1. Estabelecer Conexão

```typescript
// websocket.service.ts
class NotificationWebSocket {
  private ws: WebSocket | null = null;
  
  connect(jwtToken: string): void {
    const wsUrl = `wss://seu-dominio.com/ws/notifications/?token=${jwtToken}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'notification') {
        this.handleNotification(message.data);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(jwtToken), 5000);
    };
  }
  
  handleNotification(notification: Notification): void {
    // Atualizar UI, mostrar toast, incrementar contador, etc.
    console.log('New notification received:', notification);
    
    // Exemplo: Mostrar toast notification
    showToast(notification.title, notification.message);
    
    // Exemplo: Atualizar contador de não lidas
    updateUnreadCount();
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const notificationWS = new NotificationWebSocket();
```

### 4.2. Formato de Mensagem WebSocket

```typescript
interface WebSocketMessage {
  type: 'notification';
  data: {
    id: number;
    type: 'social' | 'group' | 'achievement' | 'streak' | 'reminder' | 'level_up' | 'rank_change';
    title: string;
    message: string;
    metadata: Record<string, any>;
    read: boolean;
    created_at: string;
  };
}
```

---

## 5. Listar Notificações

### Endpoint
```
GET /api/v1/notifications/
```

### Query Parameters
- `page` (optional): Número da página (default: 1)
- `page_size` (optional): Itens por página (default: 20, max: 100)

### Request
```typescript
async function fetchNotifications(page = 1, pageSize = 20): Promise<NotificationList> {
  const response = await fetch(
    `https://seu-dominio.com/api/v1/notifications/?page=${page}&page_size=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${yourJwtToken}`
      }
    }
  );

  return await response.json();
}
```

### Response (200 OK)
```json
{
  "count": 156,
  "next": "https://seu-dominio.com/api/v1/notifications/?page=2",
  "previous": null,
  "results": [
    {
      "id": 789,
      "type": "social",
      "title": "Nova curtida no seu post",
      "message": "João curtiu seu post de treino",
      "metadata": {
        "post_id": 123,
        "liker_id": 45,
        "liker_name": "João Silva"
      },
      "read": false,
      "read_at": null,
      "sent_push": true,
      "created_at": "2026-02-10T14:30:00Z"
    },
    {
      "id": 788,
      "type": "streak",
      "title": "Marco de 7 dias!",
      "message": "Parabéns! Você completou 7 dias consecutivos de treino",
      "metadata": {
        "streak_days": 7,
        "streak_type": "workout"
      },
      "read": true,
      "read_at": "2026-02-10T15:00:00Z",
      "sent_push": true,
      "created_at": "2026-02-09T18:00:00Z"
    }
  ]
}
```

---

## 6. Marcar Notificações como Lidas

### 6.1. Marcar Específicas

```
POST /api/v1/notifications/mark_as_read/
```

#### Request
```typescript
async function markAsRead(notificationIds: number[]): Promise<void> {
  const response = await fetch('https://seu-dominio.com/api/v1/notifications/mark_as_read/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourJwtToken}`
    },
    body: JSON.stringify({
      notification_ids: notificationIds
    })
  });

  const data = await response.json();
  console.log(`Marked ${data.marked} notifications as read`);
}
```

#### Response (200 OK)
```json
{
  "marked": 3
}
```

### 6.2. Marcar Todas

```
POST /api/v1/notifications/mark_all_as_read/
```

#### Request
```typescript
async function markAllAsRead(): Promise<void> {
  const response = await fetch('https://seu-dominio.com/api/v1/notifications/mark_all_as_read/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${yourJwtToken}`
    }
  });

  const data = await response.json();
  console.log(`Marked ${data.marked} notifications as read`);
}
```

---

## 7. Obter Contador de Não Lidas

```
GET /api/v1/notifications/unread_count/
```

### Request
```typescript
async function getUnreadCount(): Promise<number> {
  const response = await fetch('https://seu-dominio.com/api/v1/notifications/unread_count/', {
    headers: {
      'Authorization': `Bearer ${yourJwtToken}`
    }
  });

  const data = await response.json();
  return data.count;
}
```

### Response (200 OK)
```json
{
  "count": 12
}
```

---

## 8. Estrutura de Metadata por Tipo

Cada tipo de notificação tem uma estrutura específica de `metadata`:

### Social Interaction (type: "social")

#### Like em Post
```json
{
  "post_id": 123,
  "liker_id": 45,
  "liker_name": "João Silva"
}
```

#### Comentário em Post
```json
{
  "post_id": 123,
  "commenter_id": 67,
  "commenter_name": "Maria Santos"
}
```

#### Like em Comentário
```json
{
  "comment_id": 456,
  "liker_id": 89,
  "liker_name": "Pedro Costa"
}
```

### Group Activity (type: "group")

#### Convite para Grupo
```json
{
  "group_id": 78,
  "group_name": "Treino Pesado",
  "inviter_id": 23,
  "inviter_name": "Ana Silva"
}
```

#### Convite Aceito
```json
{
  "group_id": 78,
  "group_name": "Treino Pesado",
  "user_id": 45,
  "user_name": "Carlos Souza"
}
```

#### Promoção a Admin
```json
{
  "group_id": 78,
  "group_name": "Treino Pesado"
}
```

### Streak Milestone (type: "streak")
```json
{
  "streak_days": 7,
  "streak_type": "workout" | "meal"
}
```

### Level Up (type: "level_up")
```json
{
  "new_level": 12,
  "points_earned": 150
}
```

### Rank Change (type: "rank_change")
```json
{
  "group_id": 78,
  "group_name": "Treino Pesado",
  "old_rank": 5,
  "new_rank": 3
}
```

### Reminder (type: "reminder")
```json
{}  // Empty metadata
```

---

## 9. Gerenciar Preferências de Notificações

### 9.1. Obter Preferências

```
GET /api/v1/notifications/preferences/
```

#### Response (200 OK)
```json
{
  "enable_push": true,
  "enable_social": true,
  "enable_groups": true,
  "enable_achievements": true,
  "enable_reminders": true,
  "enable_streaks": true,
  "enable_level_ups": true,
  "quiet_hours_start": "22:00:00",
  "quiet_hours_end": "08:00:00"
}
```

### 9.2. Atualizar Preferências

```
PATCH /api/v1/notifications/preferences/
```

#### Request
```typescript
async function updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
  const response = await fetch('https://seu-dominio.com/api/v1/notifications/preferences/', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourJwtToken}`
    },
    body: JSON.stringify(preferences)
  });

  return await response.json();
}

// Exemplo: Desabilitar notificações sociais
await updatePreferences({ enable_social: false });

// Exemplo: Definir horário de silêncio
await updatePreferences({
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00"
});
```

---

## 10. Exemplos Completos de Código

### 10.1. Hook React para Notificações

```typescript
// useNotifications.ts
import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  // Setup WebSocket
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    const websocket = new WebSocket(`wss://seu-dominio.com/ws/notifications/?token=${token}`);

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'notification') {
        setNotifications(prev => [message.data, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

    setWs(websocket);

    return () => websocket.close();
  }, []);

  async function fetchNotifications() {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch('https://seu-dominio.com/api/v1/notifications/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setNotifications(data.results);
  }

  async function fetchUnreadCount() {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch('https://seu-dominio.com/api/v1/notifications/unread_count/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUnreadCount(data.count);
  }

  async function markAsRead(ids: number[]) {
    const token = localStorage.getItem('jwt_token');
    await fetch('https://seu-dominio.com/api/v1/notifications/mark_as_read/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ notification_ids: ids })
    });

    setNotifications(prev =>
      prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - ids.length));
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    refresh: fetchNotifications
  };
}
```

### 10.2. Componente de Notificações

```typescript
// NotificationBell.tsx
import { useNotifications } from './useNotifications';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={notification.read ? 'read' : 'unread'}
              onClick={() => markAsRead([notification.id])}
            >
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <small>{new Date(notification.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 11. Tratamento de Erros

### Códigos de Status HTTP

- `200 OK`: Sucesso
- `201 Created`: Subscription criada
- `204 No Content`: Subscription removida
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Sem permissão para acessar recurso
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

### Exemplo de Tratamento

```typescript
async function makeRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);

    if (response.status === 401) {
      // Token expirado - redirecionar para login
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## 📚 Recursos Adicionais

### Documentação Interativa (Swagger)
```
https://seu-dominio.com/api/v1/schema/swagger-ui/
```

### Fluxo Completo

```
1. Frontend solicita VAPID key
2. Frontend cria Push Subscription no browser
3. Frontend envia subscription para backend
4. Backend armazena subscription
5. Evento ocorre (like, comment, etc.)
6. Backend cria notificação
7. Backend envia via WebSocket (usuário online)
8. Backend envia Web Push (background)
9. Frontend recebe e atualiza UI
```

### Suporte

Para dúvidas ou problemas, consulte:
- Swagger UI: `/api/v1/schema/swagger-ui/`
- Logs do backend: verificar erros de conexão WebSocket ou push
- Browser console: verificar permissões e Service Worker

---

**Última atualização**: 10/02/2026
**Versão da API**: 1.0.0

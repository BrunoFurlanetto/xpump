# Especificação de APIs - Dashboard Administrativo

## Visão Geral

Este documento especifica as rotas necessárias para implementar o dashboard administrativo do sistema, onde o Personal Trainer (usuário com role `admin`) pode visualizar estatísticas gerais do sistema, incluindo clientes, grupos, treinos e refeições.

## Autenticação e Permissões

Todas as rotas devem:

- Requerer autenticação via JWT token
- Verificar se o usuário possui role `admin` ou `Admin` (Django groups)
- Retornar `403 Forbidden` se o usuário não tiver permissões adequadas

## Endpoints Necessários

### 1. Estatísticas Gerais do Sistema

**Endpoint:** `GET /api/admin/system/stats`

**Descrição:** Retorna estatísticas agregadas de todo o sistema

**Resposta:**

```json
{
  "total_clients": 150,
  "active_clients": 120,
  "inactive_clients": 30,
  "total_groups": 15,
  "total_workouts": 3450,
  "total_meals": 8920,
  "workouts_today": 45,
  "workouts_this_week": 320,
  "workouts_this_month": 1200,
  "meals_today": 180,
  "meals_this_week": 890,
  "meals_this_month": 3400,
  "new_clients_this_month": 12,
  "pending_validations": 23
}
```

**Lógica:**

- `total_clients`: COUNT de todos os usuários (excluindo admins)
- `active_clients`: Clientes que tiveram atividade nos últimos 7 dias
- `inactive_clients`: total_clients - active_clients
- `total_groups`: COUNT de todos os grupos
- `total_workouts`: COUNT de todos os treinos
- `total_meals`: COUNT de todas as refeições
- `workouts_today`: Treinos com workout_date = hoje
- `workouts_this_week`: Treinos dos últimos 7 dias
- `workouts_this_month`: Treinos do mês atual
- `meals_today`: Refeições com meal_time = hoje
- `meals_this_week`: Refeições dos últimos 7 dias
- `meals_this_month`: Refeições do mês atual
- `new_clients_this_month`: Usuários com date_joined no mês atual
- `pending_validations`: Soma de treinos + refeições com validation_status = PENDING

---

### 2. Lista de Todos os Clientes

**Endpoint:** `GET /api/admin/system/clients`

**Descrição:** Retorna lista paginada de clientes com suas estatísticas

**Parâmetros de Query:**

- `page` (int, default=1): Número da página
- `page_size` (int, default=10): Itens por página
- `ordering` (string, default="-last_activity"): Campo para ordenação
  - Opções: `username`, `-username`, `last_activity`, `-last_activity`, `workout_count`, `-workout_count`, `profile_score`, `-profile_score`
- `is_active` (boolean, optional): Filtrar por clientes ativos/inativos
- `search` (string, optional): Buscar por username, first_name, last_name ou email

**Resposta:**

```json
{
  "count": 150,
  "next": "http://api/admin/system/clients?page=2",
  "previous": null,
  "results": [
    {
      "id": 5,
      "username": "joaosilva",
      "first_name": "João",
      "last_name": "Silva",
      "email": "joao@example.com",
      "workout_count": 45,
      "meal_count": 120,
      "current_workout_streak": 7,
      "current_meal_streak": 5,
      "last_activity": "2025-12-04T10:30:00Z",
      "profile_score": 1250,
      "profile_level": 8,
      "is_active": true,
      "date_joined": "2025-06-15T08:00:00Z"
    }
  ]
}
```

**Lógica:**

- Buscar todos os usuários (exceto admins)
- Para cada usuário, agregar:
  - `workout_count`: COUNT de workouts do usuário
  - `meal_count`: COUNT de meals do usuário
  - `current_workout_streak`: Do modelo Profile relacionado
  - `current_meal_streak`: Do modelo Profile relacionado
  - `last_activity`: MAX(workout_date, meal_time) mais recente
  - `profile_score`: Score do Profile
  - `profile_level`: Level do Profile
  - `is_active`: True se last_activity nos últimos 7 dias
- Aplicar filtros e ordenação
- Retornar com paginação

---

### 3. Lista de Todos os Grupos

**Endpoint:** `GET /api/admin/system/groups`

**Descrição:** Retorna lista paginada de grupos com estatísticas

**Parâmetros de Query:**

- `page` (int, default=1): Número da página
- `page_size` (int, default=10): Itens por página

**Resposta:**

```json
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 3,
      "name": "Crossfit Matinal",
      "description": "Grupo de treinos matinais de crossfit",
      "member_count": 25,
      "total_workouts": 450,
      "total_meals": 890,
      "created_at": "2025-01-10T08:00:00Z",
      "active_members_today": 18
    }
  ]
}
```

**Lógica:**

- Buscar todos os grupos
- Para cada grupo, agregar:
  - `member_count`: COUNT de membros do grupo
  - `total_workouts`: COUNT de workouts dos membros do grupo
  - `total_meals`: COUNT de meals dos membros do grupo
  - `active_members_today`: COUNT de membros únicos com workout ou meal hoje
- Retornar com paginação

---

### 4. Atividades Recentes do Sistema

**Endpoint:** `GET /api/admin/system/activities`

**Descrição:** Retorna atividades recentes de todos os usuários

**Parâmetros de Query:**

- `limit` (int, default=20): Número máximo de atividades
- `type` (string, optional): Filtrar por tipo de atividade
  - Opções: `workout`, `meal`, `client_join`, `group_created`

**Resposta:**

```json
[
  {
    "id": 1234,
    "type": "workout",
    "user_id": 5,
    "user_name": "João Silva",
    "description": "Registrou um treino de 45 minutos",
    "timestamp": "2025-12-04T10:30:00Z",
    "related_id": 567
  },
  {
    "id": 1235,
    "type": "meal",
    "user_id": 8,
    "user_name": "Maria Santos",
    "description": "Registrou café da manhã",
    "timestamp": "2025-12-04T09:15:00Z",
    "related_id": 890
  },
  {
    "id": 1236,
    "type": "client_join",
    "user_id": 15,
    "user_name": "Carlos Oliveira",
    "description": "Novo cliente cadastrado",
    "timestamp": "2025-12-04T08:00:00Z",
    "related_id": 15
  }
]
```

**Lógica:**

- Combinar dados de múltiplas fontes:
  - Workouts recentes (type="workout", related_id=workout.id)
  - Meals recentes (type="meal", related_id=meal.id)
  - Novos usuários (type="client_join", related_id=user.id)
  - Novos grupos (type="group_created", related_id=group.id)
- Ordenar por timestamp DESC
- Limitar ao número especificado
- Aplicar filtro de tipo se fornecido

---

### 5. Detalhes de Cliente Específico

**Endpoint:** `GET /api/admin/system/clients/{client_id}`

**Descrição:** Retorna informações detalhadas de um cliente específico

**Resposta:**

```json
{
  "id": 5,
  "username": "joaosilva",
  "first_name": "João",
  "last_name": "Silva",
  "email": "joao@example.com",
  "workout_count": 45,
  "meal_count": 120,
  "current_workout_streak": 7,
  "current_meal_streak": 5,
  "last_activity": "2025-12-04T10:30:00Z",
  "profile_score": 1250,
  "profile_level": 8,
  "is_active": true,
  "date_joined": "2025-06-15T08:00:00Z"
}
```

**Lógica:**

- Mesma estrutura da lista de clientes, mas para um cliente específico
- Retornar 404 se cliente não existir

---

## Considerações de Implementação

### Performance

1. **Queries Otimizadas:**

   - Usar `select_related()` e `prefetch_related()` para evitar N+1 queries
   - Usar `annotate()` do Django ORM para agregações
   - Considerar cache para estatísticas que não mudam frequentemente

2. **Índices de Banco de Dados:**
   - Criar índices em campos frequentemente filtrados:
     - `workout_date` na tabela de workouts
     - `meal_time` na tabela de meals
     - `date_joined` na tabela de usuários
     - `created_at` em grupos

### Segurança

1. **Verificação de Permissões:**

```python
from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='admin').exists() or \
               request.user.groups.filter(name='Admin').exists()
```

2. **Rate Limiting:**
   - Implementar throttling para evitar sobrecarga
   - Sugestão: 100 requisições por minuto por usuário admin

### Paginação

Usar a paginação padrão do Django REST Framework:

```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}
```

### Exemplo de View (Django REST Framework)

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Max
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def system_stats(request):
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_start = today.replace(day=1)

    # Total clients (excluding admins)
    total_clients = User.objects.exclude(
        groups__name__in=['admin', 'Admin']
    ).count()

    # Active clients (activity in last 7 days)
    active_clients = User.objects.exclude(
        groups__name__in=['admin', 'Admin']
    ).filter(
        Q(workouts__workout_date__gte=week_ago) |
        Q(meals__meal_time__gte=week_ago)
    ).distinct().count()

    # ... resto das agregações

    return Response({
        'total_clients': total_clients,
        'active_clients': active_clients,
        'inactive_clients': total_clients - active_clients,
        # ... resto dos dados
    })
```

---

## Testes Recomendados

1. **Testes de Permissão:**

   - Verificar que usuários não-admin recebem 403
   - Verificar que usuários não autenticados recebem 401

2. **Testes de Dados:**

   - Verificar cálculos de estatísticas com dados conhecidos
   - Testar filtros e ordenação
   - Testar paginação

3. **Testes de Performance:**
   - Verificar número de queries executadas (usar django-debug-toolbar)
   - Testar com volume grande de dados

---

## Ordem de Implementação Sugerida

1. Criar permissão `IsAdminUser`
2. Implementar endpoint de estatísticas gerais (`/api/admin/system/stats`)
3. Implementar lista de clientes (`/api/admin/system/clients`)
4. Implementar lista de grupos (`/api/admin/system/groups`)
5. Implementar atividades recentes (`/api/admin/system/activities`)
6. Implementar detalhes de cliente (`/api/admin/system/clients/{id}`)
7. Adicionar testes unitários
8. Otimizar queries baseado em profiling

---

## Integração com Frontend

O frontend já está preparado com:

- ✅ Interfaces TypeScript em `/lib/api/admin.ts`
- ✅ Hooks React Query em `/hooks/useAdminQuery.ts`
- ✅ Componente de dashboard em `/components/admin/admin-dashboard-view.tsx`
- ✅ Detecção automática de role admin no dashboard principal

Após implementar as rotas backend, o sistema funcionará automaticamente!

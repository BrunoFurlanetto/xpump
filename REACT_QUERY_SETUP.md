# Implementação do React Query (TanStack Query)

## O que foi implementado

Configuramos o **React Query v5** no projeto para otimizar o gerenciamento de cache e requisições da API.

## Benefícios

### 1. **Cache Inteligente**

- Dados permanecem em cache por **5 minutos**
- Considerados "frescos" por **2 minutos** (não refaz requisição)
- Quando você volta da página `/groups/[id]` para `/groups`, os dados já estão em cache
- **Não precisa esperar nova requisição!**

### 2. **Deduplicate de Requisições**

- Se múltiplos componentes solicitam os mesmos dados simultaneamente
- React Query faz apenas **1 requisição** e compartilha o resultado

### 3. **Background Refetch**

- Atualização automática em background quando dados ficam stale
- Usuário vê dados em cache enquanto atualização ocorre

### 4. **Invalidação Inteligente**

- Quando você cria/edita/deleta um grupo, apenas as queries relacionadas são invalidadas
- Cache de outras páginas permanece intacto

### 5. **DevTools**

- Painel de debug (canto inferior direito em dev mode)
- Visualize cache, status das queries, refetch, invalidações

## Estrutura Criada

### Provider (`src/lib/react-query-provider.tsx`)

```typescript
// Configuração global do React Query
- staleTime: 2 minutos (dados "frescos")
- gcTime: 5 minutos (garbage collection - tempo em cache)
- retry: 1 (tentativa em caso de erro)
```

### Hooks Customizados (`src/hooks/useGroupsQuery.ts`)

#### Queries (buscar dados)

- `useGroupsQuery()` - Lista todos os grupos
- `useGroupQuery(id, period)` - Busca um grupo específico

#### Mutations (modificar dados)

- `useCreateGroup()` - Criar grupo
- `useUpdateGroup()` - Atualizar grupo
- `useDeleteGroup()` - Deletar grupo
- `useInviteUser()` - Convidar usuário
- `useRespondToInvite()` - Aceitar/rejeitar convite
- `useUpdateMember()` - Atualizar membro
- `useRemoveMember()` - Remover membro
- `useLeaveGroup()` - Sair do grupo

## Como Usar

### Em uma página/componente:

```typescript
import { useGroupsQuery } from "@/hooks/useGroupsQuery";

function MyComponent() {
  const { data: groups = [], isLoading, error } = useGroupsQuery();

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return <div>{/* render groups */}</div>;
}
```

### Para mutações:

```typescript
import { useCreateGroup } from "@/hooks/useGroupsQuery";

function CreateButton() {
  const createGroup = useCreateGroup();

  const handleCreate = async () => {
    await createGroup.mutateAsync({
      name: "Novo Grupo",
      description: "Descrição",
    });
  };

  return (
    <button onClick={handleCreate} disabled={createGroup.isPending}>
      {createGroup.isPending ? "Criando..." : "Criar Grupo"}
    </button>
  );
}
```

## Próximos Passos

Para migrar completamente para React Query:

1. **Atualizar componentes que usam `GroupsContext`**

   - Substituir `useGroupsContext()` por `useGroupsQuery()`
   - Atualizar mutações para usar os hooks apropriados

2. **Migrar outras áreas da aplicação**

   - Workouts
   - Meals
   - Profile
   - Status

3. **Otimizações adicionais**
   - Prefetch de dados ao hover em links
   - Optimistic updates para melhor UX
   - Infinite scroll com `useInfiniteQuery`

## Configurações Recomendadas por Tipo de Dado

### Dados que mudam raramente (perfil, configurações)

```typescript
staleTime: 10 * 60 * 1000, // 10 minutos
gcTime: 30 * 60 * 1000,    // 30 minutos
```

### Dados dinâmicos (ranking, pontos)

```typescript
staleTime: 30 * 1000,      // 30 segundos
gcTime: 2 * 60 * 1000,     // 2 minutos
refetchOnWindowFocus: true, // Atualizar ao focar janela
```

### Dados em tempo real (notificações)

```typescript
staleTime: 0,              // Sempre stale
refetchInterval: 30000,    // Refetch a cada 30s
```

## DevTools

Em desenvolvimento, você verá um ícone no canto inferior direito da tela. Clique para:

- Ver todas as queries ativas
- Verificar status do cache
- Forçar refetch manual
- Limpar cache
- Ver timing de requisições

## Documentação

- [React Query Docs](https://tanstack.com/query/latest)
- [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

---

**Última atualização:** 27 de Novembro de 2025

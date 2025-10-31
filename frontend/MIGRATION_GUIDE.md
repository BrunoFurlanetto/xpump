# 🔄 Guia de Migração - Nova Arquitetura de API

## 📋 Checklist de Migração

### ✅ Já Implementado

- [x] WorkoutsAPI + useWorkouts
- [x] NutritionAPI + useMeals
- [x] GroupsAPI + useGroups
- [x] ProfilesAPI + useProfiles
- [x] Todas as rotas API Next.js

### 🔄 Arquivos que Precisam ser Migrados

#### 1. **Groups - Server Actions** ❌

**Arquivo**: `src/app/(app)/_actions/groups.ts`
**Status**: Usar hooks do lado do cliente

**Antes**:

```typescript
"use server";
const response = await authFetch(`${BACKEND_URL}/groups/me`);
```

**Depois**:

```typescript
"use client";
import { useGroups } from "@/hooks/useGroups";

const { groups, fetchGroups } = useGroups();
```

#### 2. **Profiles - Server Actions** ❌

**Arquivo**: `src/app/(app)/_actions/getProfileById.ts`
**Status**: Usar hooks do lado do cliente

**Antes**:

```typescript
const response = await authFetch(`${BACKEND_URL}/profiles/${profileId}/`);
```

**Depois**:

```typescript
import { useProfiles } from "@/hooks/useProfiles";

const { profile, fetchProfile } = useProfiles();
await fetchProfile(profileId);
```

#### 3. **Auth Actions** ⚠️

**Arquivos**:

- `src/app/(auth)/login/actions.ts`
- `src/app/(auth)/register/actions.ts`
- `src/app/(auth)/forgot-password/actions.ts`

**Status**: Manter como Server Actions (necessário para autenticação inicial)
**Ação**: Nenhuma mudança necessária

---

## 📖 Guia Prático de Migração

### Passo 1: Identificar Uso de `authFetch`

Busque por:

```bash
grep -r "authFetch" src/
```

### Passo 2: Substituir por Hook Apropriado

#### **Para Groups**:

```typescript
// ❌ ANTES
import { groupsApi } from "@/app/(app)/_actions/groups";

const handleCreateGroup = async () => {
  const api = await groupsApi();
  const result = await api.create({ name, description });
};

// ✅ DEPOIS
import { useGroups } from "@/hooks/useGroups";

const { createGroup, isSubmitting } = useGroups();

const handleCreateGroup = async () => {
  const result = await createGroup({ name, description });
};
```

#### **Para Profiles**:

```typescript
// ❌ ANTES
import { getProfileById } from "@/app/(app)/_actions/getProfileById";

const profile = await getProfileById(profileId);

// ✅ DEPOIS
import { useProfiles } from "@/hooks/useProfiles";

const { profile, fetchProfile, isLoading } = useProfiles();

useEffect(() => {
  fetchProfile(profileId);
}, [profileId]);
```

### Passo 3: Atualizar Componentes

#### **Exemplo Completo - Groups**:

**ANTES** (Server Action):

```typescript
"use client";
import { groupsApi } from "@/app/(app)/_actions/groups";

export function GroupsList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      setLoading(true);
      const api = await groupsApi();
      const result = await api.list();
      if (result.groups) {
        setGroups(result.groups);
      }
      setLoading(false);
    }
    loadGroups();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      {groups.map((group) => (
        <div key={group.id}>{group.name}</div>
      ))}
    </div>
  );
}
```

**DEPOIS** (Hook):

```typescript
"use client";
import { useGroups } from "@/hooks/useGroups";

export function GroupsList() {
  const { groups, isLoading } = useGroups();

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {groups.map((group) => (
        <div key={group.id}>{group.name}</div>
      ))}
    </div>
  );
}
```

---

## 🎯 Benefícios da Migração

### **Antes** (authFetch direto):

❌ Código duplicado em vários lugares
❌ Tratamento de erros inconsistente
❌ Sem cache ou gerenciamento de estado
❌ Difícil de testar
❌ Sem loading states consistentes

### **Depois** (Hooks + API Classes):

✅ Código centralizado e reutilizável
✅ Tratamento de erros padronizado com toast
✅ Estado gerenciado automaticamente
✅ Fácil de testar e mockar
✅ Loading e submitting states automáticos
✅ Cache e otimizações futuras possíveis

---

## 🔍 Checklist de Arquivos a Migrar

### Prioridade Alta 🔴

- [ ] `src/app/(app)/groups/page.tsx` - Lista de grupos
- [ ] `src/app/(app)/groups/[id]/page.tsx` - Detalhes do grupo
- [ ] `src/app/(app)/profile/page.tsx` - Perfil do usuário
- [ ] Qualquer componente usando `groupsApi()`
- [ ] Qualquer componente usando `getProfileById()`

### Prioridade Média 🟡

- [ ] Modais e dialogs de grupos
- [ ] Componentes de membros
- [ ] Convites de grupos

### Prioridade Baixa 🟢

- [ ] Páginas estáticas ou de documentação
- [ ] Componentes que não fazem chamadas à API

---

## 📝 Template para Migração

```typescript
// 1. Importar hook
import { useGroups } from "@/hooks/useGroups";
// ou
import { useProfiles } from "@/hooks/useProfiles";

// 2. Usar no componente
const {
  // Estados
  groups, // ou profile
  isLoading,
  isSubmitting,

  // Métodos
  fetchGroups, // ou fetchProfile
  createGroup, // ou updateProfile
  updateGroup,
  deleteGroup,
  // ... outros métodos
} = useGroups(); // ou useProfiles(profileId)

// 3. Usar métodos em handlers
const handleAction = async () => {
  const result = await createGroup(data);
  if (result) {
    // Sucesso - toast já foi mostrado
  }
};

// 4. Mostrar loading states
if (isLoading) return <LoadingSkeleton />;
```

---

## 🚨 Avisos Importantes

1. **Não migrar**: Actions de autenticação (`login`, `register`, `forgot-password`)
2. **Server Components**: Se usar Server Components, continue usando Server Actions
3. **Client Components**: Use os novos hooks
4. **Testes**: Atualizar testes após migração

---

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique os exemplos em `useWorkouts` e `useMeals`
2. Consulte `API_ARCHITECTURE.md`
3. Veja os tipos em `/src/lib/api/*.ts`

---

**Última atualização**: Outubro 2025

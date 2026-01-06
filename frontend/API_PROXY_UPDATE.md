# Atualização de API - Uso do Proxy /api/v1/

## Mudanças Implementadas

### ❌ Antes (Rotas Intermediárias Customizadas)
```typescript
// Usava rotas intermediárias específicas
const response = await fetch(`/api/profiles/${profileId}`, {
  method: "PATCH",
  body: formData,
});
```

### ✅ Agora (Proxy Universal /api/v1/)
```typescript
// Usa diretamente o proxy universal
const response = await fetch(`/api/v1/profiles/${profileId}`, {
  method: "PUT",
  body: formData,
});
```

## Benefícios

1. **Simplicidade**: Não precisa criar rotas intermediárias para cada endpoint
2. **Consistência**: Todas as requisições passam pelo mesmo proxy
3. **Manutenção**: Menos código para manter
4. **Método Correto**: Usa PUT ao invés de PATCH (como o backend espera)

## Arquivos Atualizados

### 1. ProfilesAPI (`src/lib/api/profiles.ts`)
- ✅ `updateProfile()` agora usa `/api/v1/profiles/{id}` com **PUT**

### 2. GroupsAPI (`src/lib/api/groups.ts`)
- ✅ `updateGroup()` agora usa `/api/v1/groups/{id}` com **PUT**

## Como o Proxy /api/v1/ Funciona

O proxy em `src/app/api/v1/[...path]/route.ts`:

1. **Captura todas as rotas**: `/api/v1/*` → `${BACKEND_URL}/*`
2. **Adiciona autenticação**: Injeta o token Bearer automaticamente
3. **Refresh de token**: Renova token expirado automaticamente
4. **Suporta todos os métodos**: GET, POST, PUT, PATCH, DELETE
5. **Suporta FormData**: Para upload de arquivos
6. **Adiciona trailing slash**: Para evitar problemas com APPEND_SLASH do Django

## Exemplo de Uso

### Upload de Foto de Perfil
```typescript
const formData = new FormData();
formData.append("photo", file);
formData.append("height", "175");
formData.append("weight", "70");

// Vai para: /api/v1/profiles/123/ → http://backend/api/v1/profiles/123/
const response = await fetch('/api/v1/profiles/123', {
  method: 'PUT',
  body: formData
});
```

### Upload de Foto de Grupo
```typescript
const formData = new FormData();
formData.append("photo", file);
formData.append("name", "Novo Nome");

// Vai para: /api/v1/groups/456/ → http://backend/api/v1/groups/456/
const response = await fetch('/api/v1/groups/456', {
  method: 'PUT',
  body: formData
});
```

## Rotas Antigas que Podem ser Removidas

Agora que estamos usando o proxy `/api/v1/`, estas rotas intermediárias **não são mais necessárias**:

- ❌ `src/app/api/profiles/[id]/route.ts` - Pode ser deletada
- Outras rotas específicas que só fazem proxy podem ser removidas

## Vantagens do Proxy Universal

### Antes (Múltiplas Rotas)
```
/api/profiles/[id]/route.ts
/api/groups/[id]/route.ts
/api/workouts/[id]/route.ts
/api/meals/[id]/route.ts
... (muitas rotas)
```

### Agora (Uma Rota)
```
/api/v1/[...path]/route.ts → Captura TUDO
```

## Fluxo de Requisição

```
Frontend Component
    ↓
ProfilesAPI.updateProfile()
    ↓
fetch('/api/v1/profiles/123', { method: 'PUT', body: formData })
    ↓
Proxy /api/v1/[...path]/route.ts
    ↓
- Adiciona token Bearer
- Adiciona trailing slash
- Trata refresh de token
    ↓
http://backend/api/v1/profiles/123/
    ↓
Django Backend
```

## Métodos HTTP Usados

- **GET**: Buscar dados
- **POST**: Criar novos recursos
- **PUT**: Atualizar completamente um recurso (usado para profile e groups)
- **PATCH**: Atualizar parcialmente (usado em outros endpoints)
- **DELETE**: Remover recursos

## Tratamento de Erros

O proxy trata automaticamente:
- ✅ Token expirado (401) → Refresh automático
- ✅ Erros do backend → Retorna JSON com mensagem
- ✅ Erros de rede → Mensagem amigável

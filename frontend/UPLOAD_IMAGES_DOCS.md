# Upload de Imagens - Perfil e Grupos

## Funcionalidades Implementadas

### ✅ Upload de Foto de Perfil

- Upload de imagem do perfil (avatar)
- Edição de altura e peso
- Preview da imagem antes de salvar
- Validação de tipo e tamanho de arquivo (máx 5MB)
- Disponível apenas para o próprio usuário

**Localização:**

- Componente: `src/components/profile/edit-profile-modal.tsx`
- Integrado em: `src/app/(app)/profile/_components/profile-card-header.tsx`

### ✅ Upload de Foto de Grupo

- Upload de imagem do grupo
- Edição de nome e descrição
- Preview da imagem antes de salvar
- Validação de tipo e tamanho de arquivo (máx 5MB)
- Disponível **apenas para admins e donos** do grupo

**Localização:**

- Componente: `src/components/groups/edit-group-modal.tsx`
- Integrado em: `src/app/(app)/groups/_components/group-card-header.tsx`

## Como Funciona

### Perfil de Usuário

1. **Acesso**: No seu próprio perfil, clique no botão "Editar Perfil"
2. **Upload**:
   - Clique em "Adicionar Foto" ou "Alterar Foto"
   - Selecione uma imagem (PNG, JPG, etc)
   - Preview aparece instantaneamente
3. **Dados adicionais**:
   - Altura (em cm)
   - Peso (em kg)
4. **Salvar**: Clique em "Salvar Alterações"

### Grupo

1. **Acesso**: Somente se você for **admin** ou **dono** do grupo
2. **Botão**: Aparece "Editar Grupo" no header do grupo
3. **Upload**:
   - Clique em "Adicionar Foto" ou "Alterar Foto"
   - Selecione uma imagem
   - Preview aparece instantaneamente
4. **Dados adicionais**:
   - Nome do grupo (mínimo 3 caracteres)
   - Descrição (máximo 500 caracteres)
5. **Salvar**: Clique em "Salvar Alterações"

## Validações

### Imagens

- ✅ Tipo: Apenas imagens (image/\*)
- ✅ Tamanho: Máximo 5MB
- ✅ Preview em tempo real
- ✅ Possibilidade de remover antes de salvar

### Perfil

- Altura: Valor numérico positivo em cm
- Peso: Valor numérico positivo em kg
- Todos os campos são opcionais (só atualiza o que mudar)

### Grupo

- Nome: Mínimo 3 caracteres
- Descrição: Máximo 500 caracteres com contador
- Todos os campos são opcionais (só atualiza o que mudar)

## Permissões

### Perfil

- ✅ Usuário pode editar **apenas seu próprio perfil**
- ❌ Não pode editar perfis de outros usuários

### Grupo

- ✅ **Dono** do grupo: Acesso total
- ✅ **Admin** do grupo: Acesso total
- ❌ **Membro** comum: Sem acesso ao botão de edição

## API Integration

### Perfil

```typescript
ProfilesAPI.updateProfile(profileId, {
  photo: File,
  height: number,
  weight: number,
});
```

### Grupo

```typescript
GroupsAPI.updateGroup(groupId, {
  photo: File,
  name: string,
  description: string,
});
```

Ambas as APIs usam **FormData** para enviar arquivos corretamente ao backend.

## Estado e Cache

- Utiliza React Query para gerenciamento de estado
- Invalidação automática de cache após atualização
- Feedback visual com toast notifications
- Loading states durante o upload

## UI/UX

- Modal responsivo (mobile e desktop)
- Preview de imagem em tempo real
- Botão de remover imagem (X vermelho)
- Indicadores de carregamento
- Mensagens de erro claras
- Botões adaptativos (desktop no header, mobile no footer)

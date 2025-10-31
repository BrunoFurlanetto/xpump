# Integração da API de Treinos e Refeições

## 📋 Resumo

Os mocks das páginas de treinos (`/workouts`) e refeições (`/meals`) foram removidos e as páginas agora estão integradas com os endpoints reais da API backend.

## 🔄 Mudanças Realizadas

### 1. Serviços de API Criados

#### **`src/lib/api/workouts.ts`**
- ✅ `getWorkouts(userId)` - Busca treinos do usuário
- ✅ `createWorkout(data)` - Cria novo treino
- ✅ `updateWorkout(id, comments)` - Atualiza comentários
- ✅ `deleteWorkout(id)` - Remove treino
- ✅ `calculateStats(workouts)` - Calcula estatísticas

**Endpoints utilizados:**
- `GET /workouts/user/:userId/` - Lista treinos
- `POST /workouts/` - Cria treino
- `PATCH /workouts/:id/` - Atualiza treino
- `DELETE /workouts/:id/` - Remove treino

#### **`src/lib/api/nutrition.ts`**
- ✅ `getMealConfigs()` - Busca tipos de refeição configurados
- ✅ `getMealChoices()` - Busca opções de refeição
- ✅ `getMeals(userId)` - Busca refeições do usuário
- ✅ `getMealsByDateRange(userId, start, end)` - Busca por período
- ✅ `createMeal(data)` - Cria nova refeição
- ✅ `updateMeal(id, comments)` - Atualiza comentários
- ✅ `deleteMeal(id)` - Remove refeição
- ✅ `groupMealsByDay(meals, configs)` - Agrupa refeições por dia
- ✅ `calculateStats(meals)` - Calcula estatísticas

**Endpoints utilizados:**
- `GET /nutrition/meal-type/` - Lista tipos de refeição
- `GET /nutrition/meal-choices/` - Lista opções de refeição
- `GET /nutrition/user/:userId/` - Lista refeições
- `GET /nutrition/user/:userId/:start/:end` - Lista por período
- `POST /nutrition/` - Cria refeição
- `PATCH /nutrition/:id/` - Atualiza refeição
- `DELETE /nutrition/:id/` - Remove refeição

### 2. Hooks Atualizados

#### **`src/hooks/useWorkouts.ts`**
- ❌ Removidos dados mock
- ✅ Integrado com `WorkoutsAPI`
- ✅ Utiliza `useUserAuth` para obter ID do usuário
- ✅ Calcula estatísticas a partir dos dados reais
- ✅ Suporte a upload de imagens (proof_files)
- ✅ Gestão de streak atualizada

#### **`src/hooks/useMeals.ts`**
- ❌ Removidos dados mock
- ✅ Integrado com `NutritionAPI`
- ✅ Carrega tipos de refeição dinâmicos da API
- ✅ Utiliza `useUserAuth` para obter ID do usuário
- ✅ Agrupa refeições por dia automaticamente
- ✅ Calcula estatísticas a partir dos dados reais
- ✅ Suporte a upload de fotos (proof_files)

### 3. Componentes Ajustados

#### **`src/components/meals/meal-log-modal.tsx`**
- ✅ Ajustado para usar IDs numéricos (`meal_type: number`)
- ✅ Campo `meal_date` renomeado para `meal_time`
- ✅ Suporte a upload de fotos

#### **`src/components/meals/meal-card.tsx`**
- ✅ Atualizado para usar tipo `Meal` da API
- ✅ Cálculo de pontos: `base_points * multiplier`
- ✅ Campo `meal_date` substituído por `meal_time`
- ✅ Exibição de imagens via `proofs` array

## 🔑 Estrutura de Dados

### Workout (Treino)

```typescript
interface WorkoutCheckin {
  id: number;
  user: number;
  location?: string;
  comments: string;
  workout_date: string;           // ISO datetime
  duration: string;                // "HH:MM:SS"
  validation_status: number;
  base_points: number;
  multiplier: number;
  proofs?: Array<{
    id: number;
    file: string;
  }>;
  current_streak: number;
  longest_streak: number;
}
```

### Meal (Refeição)

```typescript
interface Meal {
  id: number;
  user: number;
  meal_type: number;              // ID do MealConfig
  meal_time: string;              // ISO datetime
  comments?: string;
  validation_status: number;
  base_points: number;
  multiplier: number;
  proofs?: Array<{
    id: number;
    file: string;
  }>;
  current_streak: number;
  longest_streak: number;
}
```

### MealConfig (Tipo de Refeição)

```typescript
interface MealConfig {
  id: number;
  meal_name: string;              // "breakfast", "lunch", etc
  interval_start: string;         // "HH:MM:SS"
  interval_end: string;           // "HH:MM:SS"
  description?: string;
}
```

## 📤 Upload de Arquivos

Ambos os endpoints suportam upload de imagens/vídeos como prova:

```typescript
// Workout
const formData = new FormData();
formData.append('comments', 'Treino intenso!');
formData.append('workout_date', '2025-10-30T07:00:00Z');
formData.append('duration', '01:15:00');
formData.append('proof_files', file1);
formData.append('proof_files', file2);

// Meal
const formData = new FormData();
formData.append('meal_type', '1');
formData.append('meal_time', '2025-10-30T12:00:00Z');
formData.append('comments', 'Almoço saudável');
formData.append('proof_files', file);
```

**Formatos aceitos:** JPG, JPEG, PNG, MP4

## 🎯 Funcionalidades

### Treinos
- ✅ Listagem de treinos do usuário
- ✅ Criação com upload de fotos/vídeos
- ✅ Edição de comentários
- ✅ Exclusão de treinos
- ✅ Cálculo automático de pontos
- ✅ Sistema de streak (sequência)
- ✅ Estatísticas (total, semanal, mensal)
- ⏳ Compartilhamento no feed (TODO)

### Refeições
- ✅ Listagem de refeições do usuário
- ✅ Tipos de refeição dinâmicos (da API)
- ✅ Criação com upload de fotos
- ✅ Edição de comentários
- ✅ Exclusão de refeições
- ✅ Cálculo automático de pontos
- ✅ Sistema de streak (sequência)
- ✅ Agrupamento por dia
- ✅ % de completude diária
- ✅ Estatísticas (total, semanal, mensal)
- ⏳ Compartilhamento no feed (TODO)

## 🔐 Autenticação

Ambos os serviços utilizam o token JWT armazenado nos cookies:

```typescript
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('session='))
  ?.split('=')[1];

const sessionData = JSON.parse(decodeURIComponent(token));
headers: {
  'Authorization': `Bearer ${sessionData.access}`
}
```

## ⚠️ Validações da API

### Treinos
- Data do treino não pode ser no futuro
- Duração deve ser positiva
- Não pode haver treinos sobrepostos
- Pelo menos 1 arquivo de prova é obrigatório (proof_files)

### Refeições
- Horário deve estar dentro do intervalo do tipo de refeição
- Não pode registrar a mesma refeição duas vezes no mesmo dia
- Apenas comentários podem ser editados após criação

## 🎨 UI/UX

### Estados de Loading
- ✅ Skeleton loaders durante carregamento inicial
- ✅ Indicadores de submissão em formulários
- ✅ Estados de loading em botões de ação

### Feedback
- ✅ Toasts de sucesso/erro
- ✅ Confirmação antes de excluir
- ✅ Validação de formulários

## 🐛 Tratamento de Erros

Todos os métodos da API tratam erros e exibem mensagens apropriadas:

```typescript
try {
  await WorkoutsAPI.createWorkout(data);
  toast.success('Treino registrado! 🎉');
} catch (error) {
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Erro ao registrar treino';
  toast.error(errorMessage);
}
```

## 📝 Próximos Passos (TODO)

- [ ] Implementar compartilhamento no feed
- [ ] Adicionar filtros por período
- [ ] Implementar paginação
- [ ] Cache de requisições
- [ ] Modo offline (PWA)
- [ ] Edição de treinos/refeições (não só comentários)

## 🧪 Como Testar

1. **Certifique-se que o backend está rodando:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Inicie o frontend:**
   ```bash
   cd frontend
   pnpm dev
   ```

3. **Faça login na aplicação**

4. **Navegue para:**
   - `/workouts` - Página de treinos
   - `/meals` - Página de refeições

5. **Teste as funcionalidades:**
   - Criar novo treino/refeição
   - Upload de imagens
   - Editar comentários
   - Excluir registros
   - Verificar estatísticas

## 📊 Endpoints Backend

Base URL: `http://localhost:3001/api/v1` (configurável via `BACKEND_URL`)

### Workouts
- `GET /workouts/` - Lista todos
- `POST /workouts/` - Cria novo
- `GET /workouts/:id/` - Detalhes
- `PATCH /workouts/:id/` - Atualiza
- `DELETE /workouts/:id/` - Remove
- `GET /workouts/user/:userId/` - Por usuário

### Nutrition
- `GET /nutrition/` - Lista todos
- `POST /nutrition/` - Cria novo
- `GET /nutrition/:id/` - Detalhes
- `PATCH /nutrition/:id/` - Atualiza
- `DELETE /nutrition/:id/` - Remove
- `GET /nutrition/user/:userId/` - Por usuário
- `GET /nutrition/user/:userId/:start/:end` - Por período
- `GET /nutrition/meal-type/` - Tipos de refeição
- `GET /nutrition/meal-choices/` - Opções de refeição

---

**Data:** 30 de Outubro de 2025  
**Status:** ✅ Concluído e testado

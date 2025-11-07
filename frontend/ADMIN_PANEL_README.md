# Painel Administrativo XPump

O Painel Administrativo do XPump é uma interface completa para gerenciar múltiplas empresas/grupos e acompanhar as atividades de treino e alimentação dos membros.

## 🎯 Funcionalidades

### 1. **Seleção de Empresa**
- Troca fácil entre diferentes empresas/grupos
- Dropdown com busca integrada
- Persistência da seleção entre sessões

### 2. **Dashboard Principal** (`/panel`)
- **Métricas Gerais:**
  - Total de membros e membros ativos hoje
  - Total de treinos e refeições registrados
  - Taxa média de conclusão do grupo
  - Alertas de validações pendentes

- **Atividades Recentes:**
  - Últimos treinos registrados
  - Últimas refeições registradas
  - Top membros da semana com ranking

### 3. **Gestão de Treinos** (`/panel/workouts`)
- Visualização de todos os check-ins de treino
- Filtros por status (aprovados, pendentes, rejeitados)
- Estatísticas de treinos
- Moderação de conteúdo:
  - Visualização detalhada de cada treino
  - Comprovantes fotográficos
  - Aprovação/rejeição de treinos
  - Histórico de pontuação

### 4. **Gestão de Alimentação** (`/panel/nutrition`)
- Visualização de todos os registros de refeições
- Filtros por status
- Estatísticas de alimentação
- Moderação de conteúdo:
  - Visualização detalhada de cada refeição
  - Tipo de refeição com ícones visuais
  - Comprovantes fotográficos
  - Aprovação/rejeição de refeições

### 5. **Membros da Equipe** (`/panel/members`)
- Lista completa de membros do grupo
- Busca por nome ou email
- Estatísticas individuais:
  - Total de pontos
  - Sequência (streak) atual
  - Total de treinos e refeições
  - Última atividade
- Indicadores de atividade do dia
- Ranking automático

### 6. **Configurações** (`/panel/settings`)
- Página em desenvolvimento para:
  - Notificações
  - Relatórios
  - Permissões
  - Configurações gerais

## 🏗️ Estrutura de Arquivos

```
frontend/src/
├── app/(admin)/panel/
│   ├── layout.tsx              # Layout comum do painel
│   ├── page.tsx                # Dashboard principal
│   ├── workouts/
│   │   └── page.tsx           # Gestão de treinos
│   ├── nutrition/
│   │   └── page.tsx           # Gestão de alimentação
│   ├── members/
│   │   └── page.tsx           # Listagem de membros
│   └── settings/
│       └── page.tsx           # Configurações
│
├── components/admin/
│   ├── admin-layout.tsx       # Layout principal com sidebar
│   └── group-selector.tsx     # Componente de seleção de grupo
│
└── lib/api/
    └── admin.ts               # API client para endpoints admin
```

## 📡 API Endpoints (Backend Necessário)

O painel frontend espera os seguintes endpoints no backend:

### Dashboard
```
GET /api/admin/dashboard?groupId={id}
```

### Treinos
```
GET /api/admin/workouts?groupId={id}&startDate={date}&endDate={date}&userId={id}&status={status}
PATCH /api/admin/workouts/{id}/validate
```

### Refeições
```
GET /api/admin/meals?groupId={id}&startDate={date}&endDate={date}&userId={id}&status={status}
PATCH /api/admin/meals/{id}/validate
```

### Membros
```
GET /api/admin/members?groupId={id}
```

### Estatísticas
```
GET /api/admin/stats?groupId={id}&startDate={date}&endDate={date}
```

## 🎨 Componentes UI Utilizados

- **shadcn/ui**: Biblioteca de componentes
  - Card, Button, Badge, Avatar
  - Dialog, Select, Input
  - Skeleton (loading states)
  - Command (busca de grupos)
  - Popover

## 💡 Recursos Implementados

✅ **Responsividade Completa**
- Mobile-first design
- Sidebar colapsável em mobile
- Grid adaptativo

✅ **UX Aprimorada**
- Loading states com skeletons
- Feedback visual de ações
- Filtros e busca em tempo real
- Persistência de estado (grupo selecionado)

✅ **Moderação de Conteúdo**
- Visualização completa de detalhes
- Aprovação/rejeição com um clique
- Visualização de comprovantes

✅ **Estatísticas em Tempo Real**
- Métricas agregadas por grupo
- Rankings automáticos
- Indicadores de atividade

## 🚀 Próximos Passos

### Backend
1. Implementar os endpoints da API admin
2. Adicionar autenticação e autorização (middleware admin)
3. Criar queries otimizadas para estatísticas
4. Implementar sistema de validação de status

### Frontend
1. Adicionar filtros avançados (período de datas)
2. Implementar exportação de relatórios (PDF/Excel)
3. Sistema de notificações push para admins
4. Gráficos e visualizações de dados
5. Histórico de moderação (log de ações)
6. Upload de documentos (PDFs de treino/cardápio)

## 📝 Notas de Desenvolvimento

### Gerenciamento de Estado
- Utiliza `localStorage` para persistir o grupo selecionado
- Polling a cada 500ms para detectar mudanças de grupo
- Estados de loading individual por página

### Navegação
- Layout compartilhado com sidebar fixa
- Rotas protegidas em grupo `(admin)`
- Breadcrumbs visuais por ícones

### Performance
- Carregamento lazy de imagens
- Skeletons para estados de loading
- Filtros client-side quando possível

## 🎓 Como Usar

1. **Acessar o painel:**
   ```
   http://localhost:3000/panel
   ```

2. **Selecionar uma empresa:**
   - Clique no seletor de grupo no topo
   - Busque ou selecione a empresa desejada

3. **Navegar entre seções:**
   - Use a sidebar para alternar entre dashboard, treinos, alimentação, membros e configurações

4. **Moderar conteúdo:**
   - Acesse Treinos ou Alimentação
   - Clique em "Detalhes" em qualquer item
   - Aprove ou rejeite conforme necessário

## 🔐 Segurança

⚠️ **Importante:** O painel admin deve ter:
- Autenticação obrigatória
- Verificação de permissões admin no backend
- Rate limiting nos endpoints
- Logs de auditoria de ações administrativas

---

**Desenvolvido com ❤️ para o XPump**

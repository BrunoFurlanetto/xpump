# 📚 Arquitetura de API Padronizada - XPump

## 🎯 Objetivo

Padronizar todas as chamadas de API do projeto seguindo uma arquitetura consistente, organizada e de fácil manutenção.

## 🏗️ Estrutura Geral

### 1. **Camada de API Client** (`/src/lib/api/`)

Cada módulo possui sua própria classe API que encapsula todas as operações.

```typescript
/src/lib/api/
├── workouts.ts      // WorkoutsAPI
├── nutrition.ts     // NutritionAPI
├── groups.ts        // GroupsAPI
├── profiles.ts      // ProfilesAPI
└── [outros].ts      // Futuros módulos
```

### 2. **Camada de Rotas Next.js** (`/src/app/api/`)

Rotas da API que fazem proxy para o backend Django, gerenciando autenticação e refresh de tokens.

```typescript
/src/app/api/
├── workouts/
│   ├── route.ts           // GET (list) e POST (create)
│   └── [id]/
│       └── route.ts       // GET, PATCH, DELETE (operações específicas)
├── nutrition/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── groups/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       ├── invite/
│       │   └── route.ts
│       ├── respond/
│       │   └── route.ts
│       ├── leave/
│       │   └── route.ts
│       └── members/
│           └── [memberId]/
│               └── route.ts
└── profiles/
    ├── route.ts
    └── [id]/
        └── route.ts
```

## 📋 Padrão de Implementação

### **Classe API Client**

```typescript
// /src/lib/api/exemplo.ts

// 1. Definir Types/Interfaces
export interface ExemploData {
  id: number;
  name: string;
  // ... outros campos
}

export interface CreateExemploData {
  name: string;
  // ... campos necessários
}

// 2. Classe API com métodos estáticos
export class ExemploAPI {
  /**
   * Lista todos os exemplos
   */
  static async list(): Promise<ExemploData[]> {
    const response = await fetch(`/api/exemplo`);

    if (!response.ok) {
      throw new Error("Erro ao buscar exemplos");
    }

    return response.json();
  }

  /**
   * Busca um exemplo por ID
   */
  static async get(id: number): Promise<ExemploData> {
    const response = await fetch(`/api/exemplo/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao buscar exemplo" }));
      throw new Error(error.detail || "Erro ao buscar exemplo");
    }

    return response.json();
  }

  /**
   * Cria um novo exemplo
   */
  static async create(data: CreateExemploData): Promise<ExemploData> {
    const response = await fetch(`/api/exemplo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao criar exemplo" }));
      throw new Error(error.detail || "Erro ao criar exemplo");
    }

    return response.json();
  }

  /**
   * Atualiza um exemplo
   */
  static async update(id: number, data: Partial<CreateExemploData>): Promise<ExemploData> {
    const response = await fetch(`/api/exemplo/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao atualizar exemplo" }));
      throw new Error(error.detail || "Erro ao atualizar exemplo");
    }

    return response.json();
  }

  /**
   * Deleta um exemplo
   */
  static async delete(id: number): Promise<void> {
    const response = await fetch(`/api/exemplo/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Erro ao deletar exemplo" }));
      throw new Error(error.detail || "Erro ao deletar exemplo");
    }
  }
}
```

### **Rota Next.js (route.ts)**

```typescript
// /src/app/api/exemplo/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/constants";
import { verifySession } from "@/lib/session";
import { updateTokenInCookies } from "@/app/(auth)/login/refresh-token-action";

// Função helper para refresh de token (copiar em todas as rotas)
async function fetchWithTokenRefresh(url: string, options: RequestInit, session: any) {
  let response = await fetch(url, options);

  if (response.status === 401 && session.refresh) {
    console.log("🔄 Token expired, attempting refresh...");

    const refreshResponse = await fetch(`${BACKEND_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: session.refresh }),
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      if (data.access) {
        console.log("✅ Token refreshed successfully");
        await updateTokenInCookies(data.access, session.refresh);

        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${data.access}`,
          },
        };
        response = await fetch(url, newOptions);
      }
    }
  }

  return response;
}

// GET - Listar todos
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const endpoint = request.nextUrl.searchParams.get("endpoint") || "";

    console.log("📥 GET Exemplo request:", {
      endpoint,
      fullUrl: `${BACKEND_URL}/exemplo/${endpoint}`,
    });

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/exemplo/${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      },
      session
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Backend error response:", errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { detail: errorText || "Error fetching data" };
      }

      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ Data fetched successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("💥 Error fetching data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Criar novo
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    console.log("📤 Creating exemplo with data:", body);

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/exemplo/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      session
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Backend error response:", errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { detail: errorText || "Error creating data" };
      }

      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ Created successfully:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("💥 Error creating data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### **Rota com [id] (route.ts)**

```typescript
// /src/app/api/exemplo/[id]/route.ts

// ... (mesmo fetchWithTokenRefresh)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Similar ao GET acima, mas usando params.id
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // Update parcial
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Deletar
}
```

## ✅ Vantagens desta Arquitetura

1. **🔒 Segurança**: Tokens nunca expostos no cliente
2. **♻️ DRY**: Refresh de token centralizado
3. **📝 Logs**: Rastreamento detalhado de todas as requisições
4. **🎯 Tipagem**: TypeScript forte em toda a aplicação
5. **🧹 Organização**: Cada módulo tem sua própria API isolada
6. **🚀 Manutenibilidade**: Fácil adicionar novos endpoints
7. **🔄 Consistência**: Mesmo padrão em todo o projeto

## 📦 Módulos Implementados

- ✅ **Workouts** (`/api/workouts`)
- ✅ **Nutrition/Meals** (`/api/nutrition`)
- ✅ **Groups** (`/api/groups`)
- ✅ **Profiles** (`/api/profiles`)

## 🔄 Próximos Passos

- [ ] Migrar código antigo que ainda usa `authFetch` direto
- [ ] Adicionar mais rotas específicas conforme necessário
- [ ] Criar testes para as APIs
- [ ] Documentar endpoints específicos do Django

## 💡 Exemplo de Uso

```typescript
// No componente ou hook
import { WorkoutsAPI } from "@/lib/api/workouts";
import { GroupsAPI } from "@/lib/api/groups";

// Usar a API
const workouts = await WorkoutsAPI.list(userId);
const groups = await GroupsAPI.listMyGroups();
const group = await GroupsAPI.getGroup(groupId);
await GroupsAPI.inviteUser(groupId, username);
```

## 🎨 Convenções de Nomes

- **Classes API**: `NomeAPI` (PascalCase)
- **Métodos**: `verbAction()` (camelCase) - ex: `listMyGroups`, `createWorkout`
- **Interfaces**: `NomeData`, `CreateNomeData`, `UpdateNomeData`
- **Rotas**: Seguir estrutura RESTful do Django

---

**Última atualização**: Outubro 2025

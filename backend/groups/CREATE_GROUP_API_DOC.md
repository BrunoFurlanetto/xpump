# API Endpoint: Criar Grupo a partir de Grupo Principal

## Descrição
Este endpoint permite criar um novo grupo (subgrupo) a partir de um grupo principal existente. O novo grupo será automaticamente associado ao mesmo cliente do grupo principal através da relação Many-to-Many.

## Endpoint
```
POST /api/v1/groups/{group_id}/create-group/
```

## Parâmetros
- `group_id`: ID do grupo principal a partir do qual o novo grupo será criado

## Corpo da Requisição
```json
{
    "name": "Nome do Novo Grupo",
    "description": "Descrição do novo grupo",
    "photo": "arquivo_de_imagem.jpg" // opcional
}
```

## Permissões
- Usuário deve estar autenticado
- Apenas o proprietário (owner) do grupo principal pode criar subgrupos
- Superusers também podem criar subgrupos de qualquer grupo principal

## Validações
1. O grupo deve existir e ser um grupo principal (main=True)
2. Deve existir um cliente associado ao grupo principal
3. O usuário deve ter permissão (ser owner ou superuser)
4. Nome do grupo é obrigatório

## Resposta de Sucesso (201 Created)
```json
{
    "id": 123,
    "name": "Nome do Novo Grupo",
    "photo": null,
    "description": "Descrição do novo grupo",
    "created_by": "Nome do Usuário",
    "owner": 456,
    "created_at": "2024-12-17T10:00:00Z",
    "members": [],
    "stats": {
        "total_members": 1,
        "total_points": 0,
        "total_workouts": 0,
        "total_meals": 0,
        "mean_streak": null,
        "mean_workout_streak": null,
        "mean_meal_streak": null
    },
    "other_groups": null,
    "main": false
}
```

## Possíveis Erros

### 400 Bad Request - Grupo não é principal
```json
{
    "detail": "Apenas grupos principais podem ter subgrupos criados."
}
```

### 403 Forbidden - Sem permissão
```json
{
    "detail": "Apenas o proprietário do grupo principal ou superuser pode criar subgrupos."
}
```

### 404 Not Found - Grupo não encontrado
```json
{
    "detail": "Grupo principal não encontrado."
}
```

### 404 Not Found - Cliente não encontrado
```json
{
    "detail": "Cliente não encontrado para este grupo principal."
}
```

### 400 Bad Request - Validação de dados
```json
{
    "name": ["Nome do grupo é obrigatório."]
}
```

## Exemplo de Uso com cURL
```bash
curl -X POST \
  http://localhost:8000/api/v1/groups/1/create-group/ \
  -H 'Authorization: Bearer {seu_token_jwt}' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Equipe Marketing",
    "description": "Subgrupo da equipe de marketing"
  }'
```

## Fluxo de Funcionamento
1. Recebe o ID do grupo principal na URL
2. Valida se o grupo existe e é principal (main=True)
3. Verifica se o usuário tem permissão (owner ou superuser)
4. Busca o cliente associado ao grupo principal
5. Valida os dados do novo grupo
6. Cria o novo grupo com main=False
7. Associa o novo grupo ao cliente via relação M2M
8. Retorna o grupo criado serializado

## Notas Importantes
- O novo grupo sempre será criado com `main=False` (é um subgrupo)
- O usuário que criar o grupo se tornará automaticamente owner e admin do novo grupo
- O grupo será automaticamente associado ao mesmo cliente do grupo principal
- A associação é feita através da relação Many-to-Many `Client.groups`

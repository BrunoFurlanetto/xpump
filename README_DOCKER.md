# Docker Setup - Xpump

## Configuração Rápida

### 1. Subir apenas o PostgreSQL

```powershell
docker-compose up -d postgres
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```powershell
Copy-Item .env.example .env
```

Edite o arquivo `.env` se necessário e certifique-se de que o Django está carregando essas variáveis.

### 3. Rodar as migrations

```powershell
cd backend
python manage.py migrate
```

### 4. Criar superusuário (opcional)

```powershell
python manage.py createsuperuser
```

### 5. Iniciar o servidor Django

```powershell
python manage.py runserver
```

---

## Subir Backend + PostgreSQL com Docker (Opcional)

Se preferir subir tudo via Docker, descomente a seção `backend` no `docker-compose.yml` e execute:

```powershell
docker-compose up -d
```

Isso irá:

- Subir o PostgreSQL
- Subir o Django
- Rodar as migrations automaticamente
- Disponibilizar a API em `http://localhost:8000`

---

## Comandos Úteis

### Ver logs do PostgreSQL

```powershell
docker-compose logs -f postgres
```

### Ver logs do backend (se estiver usando Docker)

```powershell
docker-compose logs -f backend
```

### Parar os containers

```powershell
docker-compose down
```

### Parar e remover volumes (limpa o banco)

```powershell
docker-compose down -v
```

### Acessar o PostgreSQL diretamente

```powershell
docker exec -it xpump_postgres psql -U xpump_user -d xpump_db
```

### Verificar status dos containers

```powershell
docker-compose ps
```

---

## Configuração do Banco de Dados

As credenciais padrão são:

- **Database:** xpump_db
- **User:** xpump_user
- **Password:** xpump_password
- **Host:** localhost
- **Port:** 5432

Você pode alterar essas configurações no arquivo `docker-compose.yml` e no `.env`.

---

## Troubleshooting

### Porta 5432 já está em uso

Se você já tiver um PostgreSQL instalado localmente, altere a porta no `docker-compose.yml`:

```yaml
ports:
  - "5433:5432" # Usa porta 5433 externamente
```

E atualize o `.env`:

```
DB_PORT=5433
```

### Erro de conexão com o banco

Certifique-se de que o container está rodando:

```powershell
docker-compose ps
```

E verifique os logs:

```powershell
docker-compose logs postgres
```

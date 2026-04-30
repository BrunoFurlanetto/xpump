> Configurações do projeto para o time de agentes. Complementa e sobrescreve o copilot-instructions.md global quando necessário.

# Projeto: Xpump

- Nome: Xpump
- Descrição: Plataforma web gamificada de acompanhamento de fitness e nutrição para grupos privados (B2B). PWA.
- Stack: Frontend: Next.js. Backend: Django + DRF (backend/).
- Repositório: C:\Users\bruno\Desktop\Projetos\Xpump

## Ambiente local (sugestões)
- Backend: cd backend && python manage.py runserver 0.0.0.0:8000

## Vault (Obsidian)
- Path do projeto: Dev projects/Xpump
- Memory: Dev projects/Xpump/memory.md
- Planejamentos: Dev projects/Xpump/features/ (se existir)

## Branches protegidas
- Nunca commitar diretamente em: main (principal), master (secundária)

## Como rodar os testes
- Backend: cd backend && python manage.py test

## Ownership dos agentes
- backend/: views.py, api/, serializers.py, services.py, management/, templates/, static/
- dba: backend/: models.py, migrations/, fixtures/, db_schema/
- qa: tests/: backend/tests/
- security: docs/security/, backend/authentication/
- reviewer: Revisão de PRs, comentários, qualidade do código

## Convenções
- Commits: tipo(escopo): mensagem imperativa curta (feat, fix, refactor, test, docs, chore, perf, style)
- Leia Dev projects/_memory.md e Dev projects/Xpump/memory.md antes de iniciar tarefas.
- Não sobrescrever ADRs existentes; adicione novos ADRs quando necessário.

---

> Observação: este ficheiro é um rascunho de instruções para agentes. Edite conforme necessário antes de torná-lo padrão para o repositório.

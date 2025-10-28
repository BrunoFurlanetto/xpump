# ✅ PWA Testing Checklist - X-Pump

Use este checklist para validar todas as funcionalidades do PWA antes do deploy em produção.

## 📱 Instalação

### Android (Chrome/Edge)

- [ ] Banner de instalação aparece automaticamente após critérios atendidos
- [ ] Possível instalar via menu "Adicionar à tela inicial"
- [ ] Ícone aparece na tela inicial/drawer de apps
- [ ] App abre em modo standalone (sem barra de endereço)
- [ ] Splash screen aparece ao abrir o app
- [ ] App aparece na lista de apps instalados do Android

### iOS (Safari)

- [ ] Instruções de instalação aparecem para usuários iOS
- [ ] Possível adicionar via "Adicionar à Tela Inicial"
- [ ] Ícone aparece na tela inicial
- [ ] App abre em modo standalone
- [ ] Status bar configurada corretamente

### Desktop (Chrome/Edge)

- [ ] Ícone de instalação aparece na barra de endereço
- [ ] App pode ser instalado como aplicativo
- [ ] App aparece na barra de tarefas/dock
- [ ] Janela abre em modo standalone

---

## 🔄 Service Worker

### Registro e Ativação

- [ ] Service Worker registra corretamente no primeiro carregamento
- [ ] Console mostra logs de instalação do SW
- [ ] Cache inicial é criado com arquivos essenciais
- [ ] SW ativa sem erros

### Estratégias de Cache

- [ ] Imagens são carregadas do cache (verificar Network tab)
- [ ] Arquivos estáticos (\_next/static) vêm do cache
- [ ] API faz requisições de rede primeiro
- [ ] Páginas HTML tentam rede primeiro
- [ ] Cache é atualizado em background

### Limpeza de Cache

- [ ] Caches antigos são removidos na ativação
- [ ] Múltiplos caches funcionam (images, api, static)
- [ ] Limite de entradas é respeitado
- [ ] Cache expira após tempo configurado

---

## 📴 Modo Offline

### Funcionalidades Offline

- [ ] Página offline é exibida ao navegar sem internet
- [ ] Imagens em cache continuam visíveis
- [ ] Dados em cache (perfil, grupos) ainda funcionam
- [ ] Mensagem clara de "offline" é exibida
- [ ] Botão "Tentar Novamente" funciona

### Transição Online/Offline

- [ ] App detecta quando fica offline
- [ ] App detecta quando volta a ficar online
- [ ] Dados são sincronizados ao voltar online
- [ ] Não há perda de estado ao alternar entre modos

---

## 🔔 Notificações Push

### Permissões

- [ ] Prompt de permissão aparece no momento certo
- [ ] Permissão é salva corretamente
- [ ] Possível revogar permissão nas configurações
- [ ] App respeita recusa de permissão

### Notificações

- [ ] Notificações aparecem quando app está fechado
- [ ] Notificações aparecem quando app está em background
- [ ] Notificações têm ícone e badge corretos
- [ ] Clicar na notificação abre o app na página correta
- [ ] Múltiplas notificações funcionam
- [ ] Ações da notificação funcionam (se implementadas)

---

## 🔄 Atualizações do App

### Detecção de Atualização

- [ ] Prompt de atualização aparece quando nova versão disponível
- [ ] Botão "Atualizar Agora" funciona corretamente
- [ ] Botão "Depois" permite continuar usando versão antiga
- [ ] Atualização não interrompe uso do app

### Processo de Atualização

- [ ] SW atualiza corretamente
- [ ] Novo cache é criado
- [ ] Cache antigo é removido
- [ ] Página recarrega após atualização
- [ ] Dados do usuário são preservados
- [ ] Sessão não é perdida

---

## 🎨 Manifest e Metadados

### Manifest.json

- [ ] Manifest é acessível em `/manifest.webmanifest`
- [ ] Todos os campos obrigatórios estão presentes
- [ ] Ícones 192x192 e 512x512 funcionam
- [ ] Icons purpose "any" e "maskable" definidos
- [ ] Theme color e background color corretos
- [ ] Display mode "standalone" funciona

### Shortcuts

- [ ] Shortcuts aparecem ao pressionar longo no ícone (Android)
- [ ] "Registrar Treino" abre página correta
- [ ] "Ver Ranking" abre página correta
- [ ] "Perfil" abre página correta
- [ ] Ícones dos shortcuts aparecem

### Share Target

- [ ] App aparece como opção de compartilhamento
- [ ] Compartilhamento de texto funciona
- [ ] Compartilhamento de URL funciona
- [ ] Dados compartilhados são recebidos corretamente

---

## 🎯 Performance

### Carregamento

- [ ] First Load < 3s
- [ ] Time to Interactive < 5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

### Cache

- [ ] Assets estáticos carregam < 200ms
- [ ] Imagens em cache carregam instantaneamente
- [ ] Navegação é fluida
- [ ] Não há travamentos

### Lighthouse Score

- [ ] Performance > 90
- [ ] PWA Score = 100
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

---

## 🔐 Segurança

### HTTPS

- [ ] App funciona apenas em HTTPS
- [ ] Certificado SSL válido
- [ ] Redirecionamento HTTP → HTTPS funciona
- [ ] Service Worker só registra em HTTPS

### Permissões

- [ ] App solicita permissões apenas quando necessário
- [ ] Permissões são explicadas antes de solicitar
- [ ] App funciona sem permissões opcionais
- [ ] Dados do usuário são criptografados

---

## 📱 Responsividade

### Mobile

- [ ] Layout funciona em telas pequenas (320px+)
- [ ] Touch targets têm tamanho adequado (44x44px+)
- [ ] Gestos touch funcionam corretamente
- [ ] Teclado virtual não quebra layout
- [ ] Orientação portrait e landscape funcionam

### Tablet

- [ ] Layout se adapta para tablets
- [ ] Espaço é bem utilizado
- [ ] Navegação é intuitiva

### Desktop

- [ ] Layout funciona em telas grandes
- [ ] Atalhos de teclado funcionam
- [ ] Mouse hover tem feedback visual
- [ ] Janela é redimensionável

---

## 🧪 Testes em Dispositivos Reais

### Testado em:

- [ ] Android (Chrome) - Versão **\_**
- [ ] Android (Samsung Internet) - Versão **\_**
- [ ] iOS (Safari) - Versão **\_**
- [ ] Windows (Chrome) - Versão **\_**
- [ ] Windows (Edge) - Versão **\_**
- [ ] macOS (Safari) - Versão **\_**
- [ ] Linux (Chrome) - Versão **\_**

### Problemas Encontrados:

```
# Liste aqui qualquer problema encontrado durante os testes
# Formato: [Dispositivo] - [Problema] - [Status]

Exemplo:
- [iOS Safari 17] - Ícone não aparece na tela inicial - ✅ RESOLVIDO
```

---

## 🚀 Deploy e Produção

### Pré-Deploy

- [ ] Todos os testes acima passaram
- [ ] Manifest está correto
- [ ] Service Worker está funcionando
- [ ] Cache strategies estão corretas
- [ ] Notificações funcionam
- [ ] HTTPS configurado

### Pós-Deploy

- [ ] App é instalável em produção
- [ ] Service Worker registra em produção
- [ ] Cache funciona em produção
- [ ] Notificações funcionam em produção
- [ ] Analytics está rastreando instalações
- [ ] Erros são monitorados

### Monitoramento

- [ ] Taxa de instalação está sendo rastreada
- [ ] Erros de SW são logados
- [ ] Performance é monitorada
- [ ] Push notifications são entregues
- [ ] Usuários recebem atualizações

---

## 📊 Métricas Alvo

- **Lighthouse PWA Score**: 100/100 ✅
- **Instalação**: > 30% dos usuários ativos
- **Retenção**: > 60% após 30 dias
- **Tempo de carregamento offline**: < 2s
- **Taxa de sucesso de notificações**: > 95%

---

## 🆘 Troubleshooting

### Service Worker não registra

1. Verificar HTTPS
2. Verificar console para erros
3. Limpar cache e recarregar
4. Verificar scope do SW

### Cache não funciona

1. Verificar estratégia de cache no SW
2. Verificar network tab
3. Limpar cache antigo
4. Atualizar versão do cache

### Notificações não funcionam

1. Verificar permissões
2. Verificar chaves VAPID
3. Testar em dispositivo real
4. Verificar subscription no backend

### App não instala

1. Verificar manifest
2. Verificar service worker
3. Verificar HTTPS
4. Verificar ícones
5. Limpar cache e tentar novamente

---

**Data do Teste**: ****\_\_\_****
**Testado por**: ****\_\_\_****
**Versão**: ****\_\_\_****
**Status Geral**: [ ] ✅ Aprovado | [ ] ⚠️ Com Ressalvas | [ ] ❌ Reprovado

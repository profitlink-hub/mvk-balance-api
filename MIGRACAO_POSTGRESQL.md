# Migração para PostgreSQL

## Resumo das Alterações

Este documento descreve as alterações realizadas para migrar a estrutura de conexão do Supabase para PostgreSQL puro.

## Configurações de Conexão

### Novas Credenciais PostgreSQL
- **Usuário**: mvk
- **Senha**: profitlink
- **Host**: mvk-mvkbalanca-ffzgfq
- **Porta**: 5432
- **Database**: mvk

### Variáveis de Ambiente
As seguintes variáveis de ambiente podem ser configuradas (valores padrão definidos no código):

```env
DB_USER=mvk
DB_PASSWORD=profitlink
DB_HOST=mvk-mvkbalanca-ffzgfq
DB_PORT=5432
DB_NAME=mvk
DB_SSL=false  # true para habilitar SSL, false para desabilitar
```

## Arquivos Alterados

### 1. Configuração do Banco (`src/infra/database/database.config.js`)
- **Antes**: `supabase.config.js` - Configuração para Supabase
- **Depois**: `database.config.js` - Configuração PostgreSQL pura
- **Alterações**:
  - Removido cliente Supabase REST API
  - Simplificada configuração para PostgreSQL direto
  - Adicionado suporte a variáveis de ambiente
  - Renomeada classe de `SupabaseConfig` para `DatabaseConfig`

### 2. Repositórios Atualizados
- `src/infra/repositories/WeightReadingRepository.js`
- `src/infra/repositories/ProductRepository.js`
- `src/infra/repositories/ClientRepository.js`
- `src/infra/repositories/ShelfRepository.js` (comentário atualizado)

**Alterações nos repositórios**:
- Import atualizado para o novo arquivo de configuração
- Todas as referências de `supabaseConfig` alteradas para `databaseConfig`

### 3. Outros Arquivos
- `src/server.js` - Import e inicialização atualizados
- `check_table.js` - Script de verificação atualizado

## Funcionalidades Mantidas

✅ **Conexão com PostgreSQL** - Funciona com as novas credenciais
✅ **Queries SQL diretas** - Método `query()` mantido
✅ **Criação de tabelas** - Método `createTables()` mantido
✅ **Teste de conexão** - Método `testConnection()` mantido
✅ **Utilitários** - Conversões camelCase/snake_case mantidas
✅ **Fallback de desenvolvimento** - Modo sem banco mantido

## Funcionalidades Removidas

❌ **Cliente Supabase REST** - Removido suporte à API REST do Supabase
❌ **RPC Supabase** - Removidas chamadas de funções remotas
❌ **Autenticação Supabase** - Removida configuração de auth

## Como Usar

### Inicialização
```javascript
const databaseConfig = require('./src/infra/database/database.config')

// Conectar
await databaseConfig.initialize()

// Executar query
const result = await databaseConfig.query('SELECT * FROM products')

// Fechar conexão
await databaseConfig.close()
```

### Verificação da Conexão
```javascript
const info = databaseConfig.getConnectionInfo()
console.log('Conectado:', info.isConnected)
```

## Testes

### Teste Rápido de Conexão
```bash
node test-connection.js
```

### Teste Completo com Verificação de Tabelas
```bash
node check_table.js
```

## Troubleshooting

### Erro: "The server does not support SSL connections"
**Solução**: O servidor PostgreSQL não suporta SSL. Já foi configurado por padrão para desabilitar SSL.

### Erro: "Connection refused" ou "timeout"
- Verifique se o host e porta estão corretos
- Confirme se o servidor PostgreSQL está rodando
- Verifique se não há firewall bloqueando a conexão

### Erro: "authentication failed"
- Confirme o usuário e senha
- Verifique se o usuário tem permissões no banco de dados

### Para habilitar SSL (se necessário)
```env
DB_SSL=true
```

### Debug de Conexão
A aplicação agora mostra informações detalhadas de conexão e troubleshooting no console.

## Próximos Passos

1. Configurar variáveis de ambiente em produção
2. Testar todas as operações CRUD
3. Verificar performance das queries
4. Implementar pool de conexões se necessário 
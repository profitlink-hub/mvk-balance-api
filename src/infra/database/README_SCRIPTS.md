# 📊 Scripts de Banco de Dados - MVK Balance

## 📋 Visão Geral

Esta pasta contém os scripts SQL para criação e migração do banco de dados PostgreSQL do sistema MVK Balance, **incluindo o novo sistema de Prateleiras**.

## 📁 Arquivos Disponíveis

### **1. `create_tables.sql` (ORIGINAL)**
- ✅ Script original com tabelas básicas
- 📦 Inclui: `clients`, `products`, `weight_readings`
- ❌ **NÃO inclui Prateleiras**

### **2. `create_tables_complete.sql` (NOVO - COMPLETO)**
- ✅ Script completo com **TODAS** as tabelas
- 📦 Inclui: `clients`, `products`, `weight_readings`, **`shelfs`**, **`shelf_items`**
- ⚡ Triggers automáticos para sincronização
- 📈 Views avançadas
- 🎯 **RECOMENDADO para novas instalações**

### **3. `migrate_add_shelfs.sql` (NOVO - MIGRAÇÃO)**
- ✅ Script de migração para bancos existentes
- 🔄 Adiciona apenas tabelas de Prateleiras
- 🛡️ Seguro para executar em produção
- 🎯 **RECOMENDADO para bancos já existentes**

### **4. `database.config.js`**
- ⚙️ Configuração de conexão PostgreSQL
- 🔄 Atualizado para usar script completo automaticamente

## 🚀 Como Usar

### **📦 Para Nova Instalação (Banco Vazio)**

```bash
# 1. Execute o backend
cd mvk-balance-api
npm run dev

# O sistema automaticamente executará create_tables_complete.sql
# ✅ Todas as tabelas serão criadas, incluindo Prateleiras
```

### **🔄 Para Banco Existente (Adicionar Prateleiras)**

#### **Opção 1: Via PostgreSQL CLI**
```bash
# 1. Conectar ao banco
psql -h localhost -U mvk -d mvk

# 2. Executar migração
\i src/infra/database/migrate_add_shelfs.sql

# 3. Verificar tabelas criadas
\dt
```

#### **Opção 2: Via Backend**
```bash
# 1. Renomear script atual
mv src/infra/database/create_tables.sql src/infra/database/create_tables_backup.sql

# 2. Usar script de migração
cp src/infra/database/migrate_add_shelfs.sql src/infra/database/create_tables.sql

# 3. Executar backend
npm run dev
```

#### **Opção 3: Via Script Node.js**
```javascript
// test-migration.js
const databaseConfig = require('./src/infra/database/database.config.js');
const fs = require('fs');

async function runMigration() {
  await databaseConfig.initialize();
  const sql = fs.readFileSync('./src/infra/database/migrate_add_shelfs.sql', 'utf8');
  await databaseConfig.query(sql);
  console.log('Migração concluída!');
}

runMigration();
```

## 🗂️ Estrutura do Banco Completo

### **📊 Tabelas Principais**

```sql
clients           -- Autenticação (Arduino + Web)
├── id (UUID)
├── client_id
├── client_secret
└── name

products          -- Produtos do sistema
├── id (UUID)
├── name
├── weight
├── expected_weight
└── source

shelfs            -- 🆕 PrateleiraS
├── id (UUID)
├── name
├── description
├── products (JSONB)      -- ⚡ Auto-sincronizado
├── total_weight          -- ⚡ Auto-calculado
├── max_capacity
└── location

shelf_items       -- 🆕 PRODUTOS NAS PrateleiraS
├── id (UUID)
├── shelf_id → shelfs(id)
├── product_id → products(id)
├── quantity
├── unit_weight
└── total_item_weight     -- ⚡ Auto-calculado

weight_readings   -- Leituras do Arduino
├── id (UUID)
├── product_name
├── weight
├── shelf_id → shelfs(id) -- 🆕 NOVA COLUNA
└── timestamp
```

### **📈 Views Disponíveis**

```sql
v_weight_summary      -- Resumo de leituras por produto
v_recent_readings     -- Leituras recentes
v_shelfs_detailed     -- 🆕 Prateleiras com estatísticas
v_shelf_products      -- 🆕 Produtos nas Prateleiras
v_popular_products    -- 🆕 Produtos mais utilizados
```

### **⚡ Triggers Automáticos**

- **Peso Total**: Recalculado automaticamente quando produtos são adicionados/removidos
- **JSON Sync**: Campo `products` da Prateleira sincronizado automaticamente
- **Updated At**: Campos `updated_at` atualizados automaticamente

## 🧪 Testando a Integração

### **1. Verificar Tabelas Criadas**
```sql
-- Listar todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Verificar se Prateleiras existem
SELECT COUNT(*) as Prateleiras FROM shelfs;
SELECT COUNT(*) as itens FROM shelf_items;
```

### **2. Testar Funcionalidade Básica**
```sql
-- Criar Prateleira de teste
INSERT INTO shelfs (name, description) VALUES 
('Teste API', 'Prateleira criada via SQL');

-- Verificar se foi criada
SELECT * FROM v_shelfs_detailed WHERE name = 'Teste API';
```

### **3. Testar Endpoints via cURL**
```bash
# Listar Prateleiras
curl -X GET http://localhost:3000/shelfs \
  -H "x-client-id: web_client_001" \
  -H "x-client-secret: secret_web_2025"

# Criar nova Prateleira
curl -X POST http://localhost:3000/shelfs \
  -H "x-client-id: web_client_001" \
  -H "x-client-secret: secret_web_2025" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prateleira via API","description":"Teste"}'
```

## 🔧 Configurações

### **Variáveis de Ambiente**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mvk
DB_USER=mvk
DB_PASSWORD=profitlink
DB_SSL=false  # true para produção
```

### **Credenciais de Cliente**
```bash
# Automaticamente inseridas:
arduino_client_001 / secret_arduino_2025
web_client_001 / secret_web_2025
```

## 🛠️ Troubleshooting

### **Erro: "Tabela shelfs já existe"**
```sql
-- Verificar se tabela existe
SELECT * FROM information_schema.tables WHERE table_name = 'shelfs';

-- Se existir, pular criação ou fazer backup
```

### **Erro: "Função update_updated_at_column não existe"**
```sql
-- A função deve estar no script original
-- Se não estiver, copie do create_tables_complete.sql
```

### **Triggers não funcionando**
```sql
-- Verificar triggers criados
SELECT tgname FROM pg_trigger WHERE tgrelid = 'shelfs'::regclass;

-- Recriar triggers se necessário
\i src/infra/database/migrate_add_shelfs.sql
```

## 📞 Status e Monitoramento

### **Verificar Status do Sistema**
```bash
# Backend health check
curl http://localhost:3000/health

# Conexão com banco
curl http://localhost:3000/health | jq '.database'
```

### **Logs Úteis**
```bash
# No console do backend, você verá:
# ✅ PostgreSQL Client conectado com sucesso!
# ✅ Tabelas criadas/verificadas com sucesso
# 📄 Script usado: create_tables_complete.sql
```

## 🎯 Próximos Passos

1. ✅ **Scripts criados e testados**
2. 🔄 **Executar migração em desenvolvimento**
3. 🧪 **Testar endpoints de Prateleiras**
4. 🚀 **Deploy em produção**
5. 📊 **Monitorar performance**

---

## 📝 Resumo Executivo

**✅ SISTEMA COMPLETO DE PrateleiraS IMPLEMENTADO**

- 📁 **3 scripts** SQL criados
- 🏗️ **Estrutura completa** de banco
- ⚡ **Sincronização automática** via triggers
- 🔄 **Migração segura** para bancos existentes
- 📈 **Views avançadas** para relatórios
- 🛡️ **Compatibilidade total** com código existente

**🚀 O sistema MVK Balance agora possui funcionalidade completa de Prateleiras integrada ao banco de dados PostgreSQL!** 
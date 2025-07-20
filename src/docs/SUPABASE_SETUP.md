# Configuração do Supabase

## ✅ Configuração Atualizada

A integração com Supabase foi atualizada para usar **conexão direta PostgreSQL**! A API agora suporta:

- ✅ Conexão PostgreSQL direta via string de conexão
- ✅ Fallback para modo de desenvolvimento (arrays em memória)
- ✅ Criação automática das tabelas
- ✅ Migração completa dos repositories

## 🔧 Como Configurar

### 1. Variáveis de Ambiente

Para conectar ao Supabase, configure uma das seguintes opções:

#### **Opção 1: String de Conexão Completa (Recomendado)**
```bash
DATABASE_URL="postgresql://postgres:[SUA-SENHA]@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres"
```

#### **Opção 2: URL Específica do Supabase**
```bash
SUPABASE_DATABASE_URL="postgresql://postgres:[SUA-SENHA]@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres"
```

#### **Opção 3: Apenas a Senha (Fallback)**
```bash
SUPABASE_PASSWORD="sua_senha_aqui"
```

#### **Opcional: Supabase REST API**
```bash
SUPABASE_ANON_KEY="sua_chave_anonima_supabase"
```

### 2. String de Conexão Fornecida

A string de conexão configurada é:
```
postgresql://postgres:[YOUR-PASSWORD]@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres
```

### 3. Como Executar

```bash
# Opção 1: Definir DATABASE_URL e executar
export DATABASE_URL="postgresql://postgres:minhasenha@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres"
npm start

# Opção 2: Definir apenas a senha
export SUPABASE_PASSWORD="minhasenha"
npm start

# Opção 3: Executar sem Supabase (modo desenvolvimento)
npm start
```

### 4. Exemplo com .env (se configurado)

Se você usar um arquivo `.env`, adicione:
```env
DATABASE_URL=postgresql://postgres:suasenha123@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Tabelas Criadas

O sistema criará automaticamente as seguintes tabelas:

### `clients`
- `id` (UUID, Primary Key)
- `client_id` (VARCHAR, Unique)
- `client_secret` (VARCHAR)
- `name` (VARCHAR)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### `products`
- `id` (UUID, Primary Key)
- `name` (VARCHAR, Unique)
- `weight` (DECIMAL)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### `weight_readings`
- `id` (UUID, Primary Key)
- `product_name` (VARCHAR)
- `weight` (DECIMAL)
- `timestamp` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

## 🎯 Como Funciona

1. **Com Supabase**: Todos os dados são persistidos no PostgreSQL via conexão direta
2. **Sem Supabase**: Os dados ficam em memória (desenvolvimento)

A API detecta automaticamente se o banco está configurado e escolhe o modo apropriado.

## 🔍 Logs de Inicialização

### **Com conexão configurada:**
```
🔌 Inicializando conexão com Supabase...
✅ PostgreSQL Client conectado via string de conexão
🔗 Conexão: postgresql://postgres:****@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres
✅ Tabelas criadas/verificadas com sucesso
```

### **Sem conexão configurada:**
```
🔌 Inicializando conexão com Supabase...
⚠️  Iniciando em modo de desenvolvimento (sem Supabase)
💡 Para conectar ao Supabase, configure as variáveis:
   - DATABASE_URL: String de conexão completa (recomendado)
   - SUPABASE_PASSWORD: Apenas a senha do banco
   - SUPABASE_ANON_KEY: Chave anônima (opcional)
```

## 📝 Dados Padrão

Os clientes padrão são inseridos automaticamente:

- **Arduino**: `arduino_client_001` / `secret_arduino_2023`
- **Web**: `web_client_001` / `secret_web_2023`

## 🔧 Prioridade das Variáveis

A API verifica as variáveis na seguinte ordem:

1. `DATABASE_URL` (prioridade máxima)
2. `SUPABASE_DATABASE_URL` 
3. `SUPABASE_PASSWORD` (construção automática da string)

## 🚀 Exemplo Completo

```bash
# 1. Definir a variável de ambiente
export DATABASE_URL="postgresql://postgres:suasenha123@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres"

# 2. Iniciar a API
npm start

# 3. Verificar nos logs:
# ✅ PostgreSQL Client conectado via string de conexão
# 🔗 Conexão: postgresql://postgres:****@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres
# ✅ Tabelas criadas/verificadas com sucesso
```

## 🔍 Teste de Conexão

A API agora inclui um método para testar a conexão:

```bash
curl http://localhost:3000/health
```

O health check mostra informações da conexão com o banco.

## ⚡ Vantagens da Conexão Direta

- ✅ **Mais simples**: Uma única string de conexão
- ✅ **Padrão**: Formato PostgreSQL universal
- ✅ **Flexível**: Funciona com qualquer provedor PostgreSQL
- ✅ **Seguro**: SSL configurado automaticamente

## 🚀 Pronto para Uso!

A API está completamente funcional com a nova configuração de conexão direta PostgreSQL! 🎯 
# MVK Balance API - Documentação

## Visão Geral

A MVK Balance API é um sistema completo para gerenciamento de balança com Arduino, oferecendo funcionalidades para:

- ✅ **Autenticação** com CLIENT_ID e CLIENT_SECRET
- 📦 **Gerenciamento de Produtos**
- ⚖️ **Registro de Leituras de Peso**
- 🤖 **Recebimento de Dados do Arduino**
- 📊 **Estatísticas e Relatórios**
- 🛡️ **Segurança e Rate Limiting**

## Autenticação

Todas as rotas (exceto `/auth/login`) requerem autenticação via headers:

```http
x-client-id: seu_client_id
x-client-secret: seu_client_secret
Content-Type: application/json
```

### Credenciais Padrão

- **Arduino**: `arduino_client_001` / `secret_arduino_2023`
- **Web**: `web_client_001` / `secret_web_2023`

## Endpoints Principais

### 🔐 Autenticação

#### POST /auth/login
Autenticar cliente e validar credenciais.

```json
{
  "clientId": "arduino_client_001",
  "clientSecret": "secret_arduino_2023"
}
```

#### GET /auth/me
Obter informações do cliente autenticado.

#### POST /auth/clients
Criar novo cliente.

```json
{
  "name": "Novo Cliente",
  "clientId": "opcional",
  "clientSecret": "opcional",
  "isActive": true
}
```

### 📦 Produtos

#### GET /products
Listar todos os produtos.

#### POST /products
Criar novo produto.

```json
{
  "name": "Arduino Uno",
  "weight": 25.0
}
```

#### GET /products/:id
Buscar produto por ID.

#### PUT /products/:id
Atualizar produto.

#### DELETE /products/:id
Deletar produto.

#### GET /products/search/:name
Buscar produto por nome.

### ⚖️ Leituras de Peso

#### POST /weight/readings
Registrar nova leitura de peso (usado pelo Arduino).

```json
{
  "productName": "Arduino Uno",
  "weight": 25.5,
  "timestamp": "2023-12-01T10:30:00.000Z"
}
```

#### GET /weight/readings
Listar leituras com filtros opcionais:
- `?productName=Arduino`
- `?startDate=2023-12-01`
- `?endDate=2023-12-31`
- `?limit=50&offset=0`

#### GET /weight/statistics
Obter estatísticas de peso:
- `?productName=Arduino` (opcional)
- `?days=7` (padrão: 7 dias)

#### GET /weight/summary
Resumo geral das leituras.

#### GET /weight/latest
Últimas leituras (`?limit=20`).

### 🤖 Arduino

#### POST /arduino/weight-movement
Receber movimentações de peso do Arduino (único ou múltiplo).

**Movimento Único:**
```json
{
  "nome": "cerveja",
  "peso": 335.1,
  "acao": "RETIRADO",
  "ts": 214022
}
```

**Movimento Múltiplo:**
```json
{
  "acao": "COLOCADOS",
  "quantidade": 3,
  "produtos": [
    { "nome": "cerveja", "peso": 347.0, "id": 0 },
    { "nome": "cerveja", "peso": 347.3, "id": 1 },
    { "nome": "2MA", "peso": 90.5, "id": 3 }
  ],
  "ts": 188787
}
```

#### GET /arduino/status
Obter status do Arduino.

#### GET /arduino/info
Informações de comunicação com Arduino.

## Códigos de Status HTTP

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Dados inválidos
- **401** - Não autenticado
- **403** - Acesso negado
- **404** - Não encontrado
- **409** - Conflito (já existe)
- **413** - Payload muito grande
- **415** - Content-Type não suportado
- **429** - Rate limit excedido
- **500** - Erro interno do servidor

## Formato de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true|false,
  "data": {},
  "message": "string",
  "error": "string (apenas em caso de erro)",
  "system": {
    "timestamp": "ISO string",
    "version": "1.0.0",
    "service": "mvk-balance-api"
  }
}
```

## Rate Limiting

- **Geral**: 1000 requisições por IP a cada 15 minutos
- **Por Cliente**: 100 requisições por cliente a cada 15 minutos

## Ações Suportadas pelo Arduino

- `RETIRADO` - Produto removido da balança (único)
- `COLOCADO` - Produto colocado na balança (único)
- `RETIRADOS` - Produtos removidos da balança (múltiplo)
- `COLOCADOS` - Produtos colocados na balança (múltiplo)

## Exemplos de Uso

### 1. Autenticação (Arduino)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"clientId":"arduino_client_001","clientSecret":"secret_arduino_2023"}'
```

### 2. Criar Produto (Web)
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "x-client-id: web_client_001" \
  -H "x-client-secret: secret_web_2023" \
  -d '{"name":"Novo Produto","weight":50.0}'
```

### 3. Enviar Movimento Único (Arduino)
```bash
curl -X POST http://localhost:3000/arduino/weight-movement \
  -H "Content-Type: application/json" \
  -H "x-client-id: arduino_client_001" \
  -H "x-client-secret: secret_arduino_2023" \
  -d '{"nome":"cerveja","peso":335.1,"acao":"RETIRADO","ts":214022}'
```

### 4. Enviar Movimento Múltiplo (Arduino)
```bash
curl -X POST http://localhost:3000/arduino/weight-movement \
  -H "Content-Type: application/json" \
  -H "x-client-id: arduino_client_001" \
  -H "x-client-secret: secret_arduino_2023" \
  -d '{
    "acao": "COLOCADOS",
    "quantidade": 3,
    "produtos": [
      {"nome": "cerveja", "peso": 347.0, "id": 0},
      {"nome": "cerveja", "peso": 347.3, "id": 1},
      {"nome": "2MA", "peso": 90.5, "id": 3}
    ],
    "ts": 188787
  }'
```

## Health Check

```bash
curl http://localhost:3000/health
```

Retorna informações sobre o status da API, uptime, memória, etc.

## Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── services/        # Lógica de negócio
├── routes/          # Definição de rotas
├── middlewares/     # Middlewares personalizados
├── validators/      # Validadores de dados
├── infra/
│   ├── models/      # Modelos de dados
│   └── repositories/ # Acesso aos dados
├── docs/            # Documentação
└── server.js        # Arquivo principal
```

## Fluxo de Comunicação

1. **Arduino → API**: O Arduino envia dados de movimentação de produtos
2. **API → Banco**: A API processa e armazena os dados
3. **Web → API**: A aplicação web consulta dados e estatísticas
4. **API → Web**: A API retorna informações processadas

## Segurança

- Headers de segurança (Helmet)
- CORS configurado
- Rate limiting por IP e cliente
- Validação rigorosa de entrada
- Sanitização de dados
- Logs de auditoria completos
- Autenticação obrigatória em todas as rotas

## Monitoramento

- Health check endpoint
- Logs detalhados de todas as operações
- Métricas de performance e uso
- Alertas de erro e falhas

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

## Notas Importantes

1. **Arduino**: As rotas de `/arduino/*` simulam comunicação HTTP com o Arduino
2. **Dados**: Atualmente usando armazenamento em memória (desenvolvimento)
3. **Logs**: Todos os acessos e erros são logados no console
4. **Timeout**: Requisições têm timeout de 30 segundos
5. **Payload**: Máximo de 5MB por requisição

## Suporte

Para dúvidas ou problemas, consulte os logs da aplicação ou verifique:
- Status da API: `GET /health`
- Informações: `GET /api/info`
- Documentação: Esta documentação 
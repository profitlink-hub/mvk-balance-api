# MVK Balance API

Sistema completo para gerenciamento de balança com Arduino, desenvolvido em Node.js seguindo arquitetura em camadas.

## 🚀 Funcionalidades

- ✅ **Autenticação** com CLIENT_ID e CLIENT_SECRET
- 📦 **Gerenciamento de Produtos** (CRUD completo)
- ⚖️ **Registro de Leituras de Peso** enviadas pelo Arduino
- 🤖 **Comunicação Bidirecional com Arduino**
- 📊 **Estatísticas e Relatórios** de peso
- 🛡️ **Segurança** com rate limiting e validações
- 📝 **Logs Detalhados** e monitoring
- 🔄 **Health Check** e status da API

## 🏗️ Arquitetura

O projeto segue uma **arquitetura em camadas bem estruturada**:

```
src/
├── controllers/     # Recebem requisições HTTP e orquestram o fluxo
├── services/        # Lógica de negócio da aplicação
├── routes/          # Definição dos endpoints da API
├── middlewares/     # Processamento intermediário (auth, logs, etc.)
├── validators/      # Validação e sanitização de dados
├── infra/
│   ├── models/      # Estruturas de dados
│   └── repositories/ # Acesso e manipulação dos dados
├── docs/            # Documentação da API
└── server.js        # Arquivo principal da aplicação
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js v14+ 
- npm ou yarn

### Instalação

```bash
# Clonar o repositório
git clone <url-do-repositório>
cd mvk-balance-api

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

## 🔑 Autenticação

### Credenciais Padrão
- **Arduino**: `arduino_client_001` / `secret_arduino_2023`
- **Web**: `web_client_001` / `secret_web_2023`

### Headers Obrigatórios
```http
x-client-id: seu_client_id
x-client-secret: seu_client_secret
Content-Type: application/json
```

## 📡 Endpoints Principais

### Autenticação
- `POST /auth/login` - Autenticar cliente
- `GET /auth/me` - Informações do cliente autenticado
- `POST /auth/clients` - Criar novo cliente

### Produtos
- `GET /products` - Listar produtos
- `POST /products` - Criar produto
- `PUT /products/:id` - Atualizar produto
- `DELETE /products/:id` - Deletar produto

### Leituras de Peso
- `POST /weight/readings` - Registrar peso (Arduino)
- `GET /weight/readings` - Listar leituras
- `GET /weight/statistics` - Estatísticas
- `GET /weight/summary` - Resumo geral

### Arduino
- `POST /arduino/weight-movement` - Receber movimentações de peso do Arduino
- `GET /arduino/status` - Obter status do Arduino  
- `GET /arduino/info` - Informações de comunicação

## 🔒 Segurança

- Headers de segurança (Helmet)
- CORS configurado
- Rate limiting (1000 req/15min por IP)
- Validação rigorosa de entrada
- Sanitização de dados
- Logs de auditoria completos

## 📊 Exemplo de Uso

### 1. Autenticação
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"clientId":"arduino_client_001","clientSecret":"secret_arduino_2023"}'
```

### 2. Registrar Peso (Arduino)
```bash
curl -X POST http://localhost:3000/weight/readings \
  -H "Content-Type: application/json" \
  -H "x-client-id: arduino_client_001" \
  -H "x-client-secret: secret_arduino_2023" \
  -d '{"productName":"Arduino Uno","weight":25.5}'
```

### 3. Enviar Produto para Arduino
```bash
curl -X POST http://localhost:3000/arduino/send-product \
  -H "Content-Type: application/json" \
  -H "x-client-id: web_client_001" \
  -H "x-client-secret: secret_web_2023" \
  -d '{"product":{"name":"Novo Sensor","weight":12.3}}'
```

## 🛠️ Tecnologias Utilizadas

- **Express.js** - Framework web
- **Node.js** - Runtime JavaScript
- **Helmet** - Segurança
- **CORS** - Cross-Origin Resource Sharing
- **Express Rate Limit** - Rate limiting
- **UUID** - Geração de IDs únicos
- **ESLint** - Linting e padronização de código

## Fluxo de trabalho
graph TD
    A[Arduino] -->|POST /arduino/weight-movement| B[ArduinoController]
    B -->|Processa e valida| C[ArduinoService]
    C -->|Registra leitura| D[WeightService]
    
    E[Interface Web] -->|GET /weight/readings| F[WeightController]
    F -->|Consulta dados| D
    
    G[API Client] -->|POST /weight/readings| F

## 📝 Scripts Disponíveis

```bash
npm start        # Executar em produção
npm run dev      # Executar em desenvolvimento (nodemon)
npm test         # Executar testes (quando implementados)
```

## 🔍 Health Check

Verificar status da API:
```bash
curl http://localhost:3000/health
```

## 📖 Documentação

- **Documentação Completa**: `src/docs/API_Documentation.md`
- **Info da API**: `GET /api/info`
- **Documentação Online**: `GET /` (endpoint raiz)

## 🎯 Casos de Uso

### Para Arduino
1. Autenticar com credenciais do Arduino
2. Enviar movimentações de peso em tempo real (única ou múltipla)
3. Informar sobre produtos retirados ou colocados na balança
4. Transmitir dados com timestamp para controle temporal

### Para Aplicação Web
1. Gerenciar produtos cadastrados
2. Visualizar histórico de leituras e movimentações
3. Gerar relatórios e estatísticas
4. Monitorar status do Arduino

## 🚦 Status do Projeto

✅ Autenticação implementada  
✅ CRUD de produtos completo  
✅ Sistema de leituras de peso  
✅ Recebimento de dados do Arduino  
✅ Processamento de movimentações únicas/múltiplas  
✅ Validação e segurança  
✅ Documentação completa  
🔄 Testes automatizados (em desenvolvimento)  
🔄 Interface web (planejada)  

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs da aplicação
- Consulte `GET /health` para status da API
- Consulte a documentação em `src/docs/API_Documentation.md`
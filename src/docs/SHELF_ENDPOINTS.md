# 📦 Endpoints de Prateleiras - MVK Balance API

Documentação completa dos endpoints criados para gerenciamento de Prateleiras.

## 🌐 Base URL
```
http://localhost:3000/shelfs
```

## 🔐 Autenticação
Todos os endpoints requerem headers de autenticação:
```http
x-client-id: web_client_001
x-client-secret: secret_web_2023
Content-Type: application/json
```

## 📋 Endpoints Implementados

### **1. Listar Todas as Prateleiras**
```http
GET /shelfs
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-Prateleira",
      "name": "Prateleira A",
      "products": [
        {
          "productId": "uuid-produto",
          "product": {
            "id": "uuid-produto",
            "name": "Arduino Uno",
            "weight": 25
          },
          "quantity": 5,
          "totalWeight": 125
        }
      ],
      "totalWeight": 125,
      "statistics": {
        "totalItems": 5,
        "uniqueProducts": 1,
        "isEmpty": false,
        "averageWeightPerProduct": 125
      },
      "createdAt": "2025-01-17T00:00:00.000Z",
      "updatedAt": "2025-01-17T00:00:00.000Z"
    }
  ],
  "count": 1,
  "message": "Prateleiras encontradas"
}
```

### **2. Buscar Prateleira por ID**
```http
GET /shelfs/{id}
```

**Parâmetros:**
- `id` (path): ID da Prateleira

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-Prateleira",
    "name": "Prateleira A",
    "products": [...],
    "totalWeight": 125,
    "statistics": {...},
    "createdAt": "2025-01-17T00:00:00.000Z",
    "updatedAt": "2025-01-17T00:00:00.000Z"
  },
  "message": "Prateleira encontrada"
}
```

### **3. Criar Nova Prateleira**
```http
POST /shelfs
```

**Body:**
```json
{
  "name": "Prateleira Nova",
  "products": [
    {
      "productId": "uuid-produto",
      "quantity": 3
    }
  ]
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "name": "Prateleira Nova",
    "products": [...],
    "totalWeight": 75,
    "statistics": {...}
  },
  "message": "Prateleira criada com sucesso"
}
```

### **4. Atualizar Prateleira**
```http
PUT /shelfs/{id}
```

**Body:**
```json
{
  "name": "Prateleira Atualizada",
  "products": [
    {
      "productId": "uuid-produto",
      "quantity": 10
    }
  ]
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-Prateleira",
    "name": "Prateleira Atualizada",
    "products": [...],
    "totalWeight": 250
  },
  "message": "Prateleira atualizada com sucesso"
}
```

### **5. Deletar Prateleira**
```http
DELETE /shelfs/{id}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Prateleira deletada com sucesso"
}
```

### **6. Buscar Prateleira por Nome**
```http
GET /shelfs/search/{name}
```

**Parâmetros:**
- `name` (path): Nome da Prateleira

### **7. Buscar com Filtros**
```http
GET /shelfs/search?name=Prateleira&minWeight=100&maxWeight=500
```

**Query Parameters:**
- `name` (opcional): Filtrar por nome (busca parcial)
- `minWeight` (opcional): Peso mínimo em gramas
- `maxWeight` (opcional): Peso máximo em gramas

### **8. Adicionar Produto à Prateleira**
```http
POST /shelfs/{id}/products
```

**Body:**
```json
{
  "productId": "uuid-produto",
  "quantity": 2
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-Prateleira",
    "products": [...],
    "totalWeight": 175
  },
  "message": "Produto adicionado à Prateleira com sucesso"
}
```

### **9. Remover Produto da Prateleira**
```http
DELETE /shelfs/{id}/products/{productId}
```

### **10. Estatísticas das Prateleiras**
```http
GET /shelfs/statistics
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "totalShelfs": 5,
    "totalWeight": 1250,
    "averageWeight": 250,
    "totalProducts": 15
  },
  "message": "Estatísticas obtidas com sucesso"
}
```

## 🔧 Funcionalidades Especiais

### **Cálculo Automático de Peso**
- ✅ Peso total calculado automaticamente baseado nos produtos
- ✅ Validação de existência de produtos
- ✅ Atualização em tempo real

### **Validações Implementadas**
- ✅ Nome obrigatório (mín. 2 caracteres)
- ✅ Produtos existentes no sistema
- ✅ Quantidades positivas
- ✅ IDs válidos
- ✅ Nomes únicos para Prateleiras

### **Integração com Produtos**
- ✅ Busca automática de dados do produto
- ✅ Cálculo de peso: `quantidade × peso_produto`
- ✅ Validação de existência do produto

## 📊 Exemplo de Fluxo Completo

### **1. Criar Prateleira Vazia**
```bash
curl -X POST http://localhost:3000/shelfs \
  -H "x-client-id: web_client_001" \
  -H "x-client-secret: secret_web_2023" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prateleira Teste"}'
```

### **2. Adicionar Produto**
```bash
curl -X POST http://localhost:3000/shelfs/{shelf-id}/products \
  -H "x-client-id: web_client_001" \
  -H "x-client-secret: secret_web_2023" \
  -H "Content-Type: application/json" \
  -d '{"productId":"{product-id}","quantity":5}'
```

### **3. Verificar Peso Total**
```bash
curl -X GET http://localhost:3000/shelfs/{shelf-id} \
  -H "x-client-id: web_client_001" \
  -H "x-client-secret: secret_web_2023"
```

## 🚨 Códigos de Erro Comuns

- **400**: Dados inválidos (validação falhou)
- **404**: Prateleira ou produto não encontrado
- **409**: Prateleira com nome já existente
- **401**: Não autenticado (credenciais inválidas)
- **500**: Erro interno do servidor

## 🔗 Integração com Frontend

Os endpoints são totalmente compatíveis com o frontend híbrido criado. O sistema irá:

1. **Detectar disponibilidade** do backend
2. **Usar endpoints** quando online
3. **Fallback para localStorage** quando offline
4. **Sincronização automática** quando backend fica disponível

## 📋 Próximos Passos

### **Implementado ✅**
- CRUD completo de Prateleiras
- Integração com produtos existentes
- Cálculo automático de peso
- Validações completas
- Documentação Swagger
- Endpoints RESTful

### **Futuro 🔄**
- Tabelas no banco de dados
- Logs de auditoria
- Notificações push
- Backup automático
- Métricas de performance

## 📞 Suporte

Para testar os endpoints:
1. Executar backend: `npm run dev`
2. Acessar documentação: `http://localhost:3000/api-docs`
3. Testar endpoints com Postman ou curl
4. Verificar logs no console do servidor 
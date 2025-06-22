class Client {
  constructor({ id, clientId, clientSecret, name, isActive = true, createdAt = new Date() }) {
    this.id = id
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.name = name
    this.isActive = isActive
    this.createdAt = createdAt
  }

  // Validar se o cliente tem dados válidos
  isValid() {
    return this.clientId && 
           typeof this.clientId === 'string' && 
           this.clientId.trim().length > 0 &&
           this.clientSecret && 
           typeof this.clientSecret === 'string' && 
           this.clientSecret.trim().length > 0 &&
           this.name &&
           typeof this.name === 'string' &&
           this.name.trim().length > 0
  }

  // Verificar credenciais
  validateCredentials(clientId, clientSecret) {
    return this.clientId === clientId && 
           this.clientSecret === clientSecret && 
           this.isActive
  }

  // Converter para objeto simples (sem expor o secret)
  toJSON() {
    return {
      id: this.id,
      clientId: this.clientId,
      name: this.name,
      isActive: this.isActive,
      createdAt: this.createdAt
    }
  }
}

module.exports = Client 
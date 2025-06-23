class Product {
  constructor({ 
    id, 
    name, 
    weight, 
    expectedWeight, 
    arduinoId, 
    arduinoTimestamp, 
    registeredAt, 
    source, 
    createdAt = new Date(), 
    updatedAt = new Date() 
  }) {
    this.id = id
    this.name = name
    this.weight = weight
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    
    // Campos opcionais do Arduino
    if (expectedWeight !== undefined) this.expectedWeight = expectedWeight
    if (arduinoId !== undefined) this.arduinoId = arduinoId
    if (arduinoTimestamp !== undefined) this.arduinoTimestamp = arduinoTimestamp
    if (registeredAt !== undefined) this.registeredAt = registeredAt
    if (source !== undefined) this.source = source
  }

  // Validar se o produto tem dados válidos
  isValid() {
    return this.name && 
           typeof this.name === 'string' && 
           this.name.trim().length > 0 &&
           this.weight !== undefined && 
           typeof this.weight === 'number' && 
           this.weight >= 0
  }

  // Converter para objeto simples
  toJSON() {
    const json = {
      id: this.id,
      name: this.name,
      weight: this.weight,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    // Adicionar campos opcionais se existirem
    if (this.expectedWeight !== undefined) json.expectedWeight = this.expectedWeight
    if (this.arduinoId !== undefined) json.arduinoId = this.arduinoId
    if (this.arduinoTimestamp !== undefined) json.arduinoTimestamp = this.arduinoTimestamp
    if (this.registeredAt !== undefined) json.registeredAt = this.registeredAt
    if (this.source !== undefined) json.source = this.source

    return json
  }
}

module.exports = Product 
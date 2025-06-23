class WeightReading {
  constructor({ id, productName, weight, action, arduinoId, timestamp = new Date(), createdAt = new Date() }) {
    this.id = id
    this.productName = productName
    this.weight = weight
    this.timestamp = timestamp
    this.createdAt = createdAt
    
    // Campos opcionais do Arduino
    if (action !== undefined) this.action = action
    if (arduinoId !== undefined) this.arduinoId = arduinoId
  }

  // Validar se a leitura tem dados válidos
  isValid() {
    return this.productName && 
           typeof this.productName === 'string' && 
           this.productName.trim().length > 0 &&
           this.weight !== undefined && 
           typeof this.weight === 'number' && 
           this.weight >= 0 &&
           this.timestamp instanceof Date
  }

  // Converter para objeto simples
  toJSON() {
    const json = {
      id: this.id,
      productName: this.productName,
      weight: this.weight,
      timestamp: this.timestamp,
      createdAt: this.createdAt
    }

    // Adicionar campos opcionais se existirem
    if (this.action !== undefined) json.action = this.action
    if (this.arduinoId !== undefined) json.arduinoId = this.arduinoId

    return json
  }
}

module.exports = WeightReading 
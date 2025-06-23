class WeightReading {
  constructor({ id, productName, weight, action, arduinoId, dayOfWeek, timestamp = new Date(), createdAt = new Date() }) {
    this.id = id
    this.productName = productName
    this.weight = weight
    this.timestamp = timestamp
    this.createdAt = createdAt
    
    // Campos opcionais do Arduino
    if (action !== undefined) this.action = action
    if (arduinoId !== undefined) this.arduinoId = arduinoId
    if (dayOfWeek !== undefined) this.dayOfWeek = dayOfWeek
  }

  // Validar se a leitura tem dados válidos
  isValid() {
    const validDaysOfWeek = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
    
    return this.productName && 
           typeof this.productName === 'string' && 
           this.productName.trim().length > 0 &&
           this.weight !== undefined && 
           typeof this.weight === 'number' && 
           this.weight >= 0 &&
           this.timestamp instanceof Date &&
           (this.dayOfWeek === undefined || validDaysOfWeek.includes(this.dayOfWeek))
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
    if (this.dayOfWeek !== undefined) json.dayOfWeek = this.dayOfWeek

    return json
  }
}

module.exports = WeightReading 
class WeightReading {
  constructor({ id, productName, weight, timestamp = new Date(), createdAt = new Date() }) {
    this.id = id
    this.productName = productName
    this.weight = weight
    this.timestamp = timestamp
    this.createdAt = createdAt
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
    return {
      id: this.id,
      productName: this.productName,
      weight: this.weight,
      timestamp: this.timestamp,
      createdAt: this.createdAt
    }
  }
}

module.exports = WeightReading 
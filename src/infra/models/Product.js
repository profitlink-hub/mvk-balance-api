class Product {
  constructor({ id, name, weight, createdAt = new Date(), updatedAt = new Date() }) {
    this.id = id
    this.name = name
    this.weight = weight
    this.createdAt = createdAt
    this.updatedAt = updatedAt
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
    return {
      id: this.id,
      name: this.name,
      weight: this.weight,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

module.exports = Product 
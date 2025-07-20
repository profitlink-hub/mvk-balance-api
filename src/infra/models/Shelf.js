class Shelf {
  constructor({ 
    id, 
    name, 
    description,
    products = [],
    totalWeight = 0,
    maxCapacity,
    location,
    isActive = true,
    createdAt = new Date(), 
    updatedAt = new Date() 
  }) {
    this.id = id
    this.name = name
    this.description = description
    this.products = products
    this.totalWeight = totalWeight
    this.maxCapacity = maxCapacity
    this.location = location
    this.isActive = isActive
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  // Validar se a pratileira tem dados válidos
  isValid() {
    return this.name && 
           typeof this.name === 'string' && 
           this.name.trim().length > 0 &&
           Array.isArray(this.products) &&
           typeof this.totalWeight === 'number' && 
           this.totalWeight >= 0
  }

  // Calcular peso total baseado nos produtos
  calculateTotalWeight() {
    if (!Array.isArray(this.products)) {
      return 0
    }

    return this.products.reduce((total, product) => {
      return total + (product.totalWeight || 0)
    }, 0)
  }

  // Atualizar peso total
  updateTotalWeight() {
    this.totalWeight = this.calculateTotalWeight()
    this.updatedAt = new Date()
  }

  // Adicionar produto à pratileira
  addProduct(productData) {
    if (!this.products) {
      this.products = []
    }

    // Verificar se produto já existe
    const existingIndex = this.products.findIndex(p => p.productId === productData.productId)
    
    if (existingIndex >= 0) {
      // Atualizar quantidade existente
      this.products[existingIndex].quantity += productData.quantity
      this.products[existingIndex].totalWeight = 
        this.products[existingIndex].quantity * (productData.product?.weight || 0)
    } else {
      // Adicionar novo produto
      this.products.push({
        productId: productData.productId,
        product: productData.product,
        quantity: productData.quantity,
        totalWeight: productData.quantity * (productData.product?.weight || 0)
      })
    }

    this.updateTotalWeight()
  }

  // Remover produto da pratileira
  removeProduct(productId) {
    if (!this.products) {
      return false
    }

    const initialLength = this.products.length
    this.products = this.products.filter(p => p.productId !== productId)
    
    if (this.products.length < initialLength) {
      this.updateTotalWeight()
      return true
    }
    
    return false
  }

  // Atualizar quantidade de um produto
  updateProductQuantity(productId, newQuantity) {
    if (!this.products) {
      return false
    }

    const productIndex = this.products.findIndex(p => p.productId === productId)
    
    if (productIndex >= 0) {
      if (newQuantity <= 0) {
        // Remover produto se quantidade for zero ou negativa
        return this.removeProduct(productId)
      } else {
        // Atualizar quantidade
        this.products[productIndex].quantity = newQuantity
        this.products[productIndex].totalWeight = 
          newQuantity * (this.products[productIndex].product?.weight || 0)
        this.updateTotalWeight()
        return true
      }
    }
    
    return false
  }

  // Obter produto específico na pratileira
  getProduct(productId) {
    if (!this.products) {
      return null
    }

    return this.products.find(p => p.productId === productId) || null
  }

  // Contar total de itens na pratileira
  getTotalItems() {
    if (!this.products) {
      return 0
    }

    return this.products.reduce((total, product) => total + product.quantity, 0)
  }

  // Verificar se a pratileira está vazia
  isEmpty() {
    return !this.products || this.products.length === 0
  }

  // Converter para objeto simples
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      products: this.products || [],
      totalWeight: this.totalWeight,
      maxCapacity: this.maxCapacity,
      location: this.location,
      isActive: this.isActive,
      totalItems: this.getTotalItems(),
      isEmpty: this.isEmpty(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  // Converter para resposta da API
  toApiResponse() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      products: this.products || [],
      totalWeight: this.totalWeight,
      maxCapacity: this.maxCapacity,
      location: this.location,
      isActive: this.isActive,
      statistics: {
        totalItems: this.getTotalItems(),
        uniqueProducts: this.products ? this.products.length : 0,
        isEmpty: this.isEmpty(),
        averageWeightPerProduct: this.products && this.products.length > 0 ? 
          this.totalWeight / this.products.length : 0
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  // Método para debug
  toString() {
    return `Shelf(id=${this.id}, name=${this.name}, location=${this.location || 'N/A'}, products=${this.products?.length || 0}, weight=${this.totalWeight}g, active=${this.isActive})`
  }
}

module.exports = Shelf 
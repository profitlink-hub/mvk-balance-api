const Product = require('../models/Product')
const { v4: uuidv4 } = require('uuid')

class ProductRepository {
  constructor() {
    // Simulando base de dados em memória
    this.products = new Map()
    this.initializeDefaultProducts()
  }

  // Inicializar alguns produtos padrão
  initializeDefaultProducts() {
    const defaultProducts = [
      { name: 'Arduino Uno', weight: 25.0 },
      { name: 'Sensor de Peso', weight: 15.5 }
    ]

    defaultProducts.forEach(productData => {
      const product = new Product({
        id: uuidv4(),
        ...productData
      })
      this.products.set(product.id, product)
    })
  }

  // Criar produto
  async create(productData) {
    const id = uuidv4()
    const product = new Product({
      id,
      ...productData
    })

    if (!product.isValid()) {
      throw new Error('Dados do produto inválidos')
    }

    this.products.set(id, product)
    return product
  }

  // Buscar produto por ID
  async findById(id) {
    return this.products.get(id) || null
  }

  // Buscar produto por nome
  async findByName(name) {
    for (const product of this.products.values()) {
      if (product.name.toLowerCase() === name.toLowerCase()) {
        return product
      }
    }
    return null
  }

  // Listar todos os produtos
  async findAll() {
    return Array.from(this.products.values())
  }

  // Atualizar produto
  async update(id, updateData) {
    const product = this.products.get(id)
    if (!product) {
      return null
    }

    const updatedProduct = new Product({
      ...product,
      ...updateData,
      id,
      updatedAt: new Date()
    })

    if (!updatedProduct.isValid()) {
      throw new Error('Dados do produto inválidos')
    }

    this.products.set(id, updatedProduct)
    return updatedProduct
  }

  // Deletar produto
  async delete(id) {
    const deleted = this.products.delete(id)
    return deleted
  }
}

module.exports = ProductRepository 
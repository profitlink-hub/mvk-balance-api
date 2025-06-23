const Product = require('../models/Product')
const { v4: uuidv4 } = require('uuid')
const supabaseConfig = require('../database/supabase.config')

class ProductRepository {
  constructor() {
    this.tableName = 'products'
    
    // Fallback para desenvolvimento sem Supabase (inicialização lazy)
    this.products = new Map() // Sempre inicializar para fallback
  }

  // Verificar se deve usar memória (lazy check)
  _shouldUseMemory() {
    return !supabaseConfig.isConnected()
  }

  // Converter dados do banco para modelo
  _mapToModel(dbData) {
    if (!dbData) return null

    const productData = {
      id: dbData.id,
      name: dbData.name,
      weight: parseFloat(dbData.weight),
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at)
    }

    // Adicionar campos opcionais se existirem
    if (dbData.expected_weight !== null && dbData.expected_weight !== undefined) {
      productData.expectedWeight = parseFloat(dbData.expected_weight)
    }
    if (dbData.arduino_id !== null && dbData.arduino_id !== undefined) {
      productData.arduinoId = dbData.arduino_id
    }
    if (dbData.arduino_timestamp !== null && dbData.arduino_timestamp !== undefined) {
      productData.arduinoTimestamp = dbData.arduino_timestamp
    }
    if (dbData.registered_at !== null && dbData.registered_at !== undefined) {
      productData.registeredAt = new Date(dbData.registered_at)
    }
    if (dbData.source) {
      productData.source = dbData.source
    }

    return new Product(productData)
  }

  // Converter modelo para dados do banco
  _mapToDb(product) {
    const dbData = {
      id: product.id,
      name: product.name,
      weight: product.weight,
      created_at: product.createdAt,
      updated_at: product.updatedAt || new Date()
    }

    // Adicionar campos opcionais se existirem
    if (product.expectedWeight !== undefined) {
      dbData.expected_weight = product.expectedWeight
    }
    if (product.arduinoId !== undefined) {
      dbData.arduino_id = product.arduinoId
    }
    if (product.arduinoTimestamp !== undefined) {
      dbData.arduino_timestamp = product.arduinoTimestamp
    }
    if (product.registeredAt !== undefined) {
      dbData.registered_at = product.registeredAt
    }
    if (product.source !== undefined) {
      dbData.source = product.source
    }

    return dbData
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

    // Verificar se já existe um produto com o mesmo nome
    const existingProduct = await this.findByName(product.name)
    if (existingProduct) {
      throw new Error('Produto com este nome já existe')
    }

    if (this._shouldUseMemory()) {
      this.products.set(id, product)
      return product
    }

    try {
      const dbData = this._mapToDb(product)
      const result = await supabaseConfig.query(
        `INSERT INTO ${this.tableName} (id, name, weight, expected_weight, arduino_id, arduino_timestamp, registered_at, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          dbData.id, 
          dbData.name, 
          dbData.weight, 
          dbData.expected_weight || null,
          dbData.arduino_id || null,
          dbData.arduino_timestamp || null,
          dbData.registered_at || null,
          dbData.source || 'api',
          dbData.created_at, 
          dbData.updated_at
        ]
      )

      return this._mapToModel(result.rows[0])
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Produto com este nome já existe')
      }
      throw error
    }
  }

  // Buscar produto por ID
  async findById(id) {
    if (this._shouldUseMemory()) {
      return this.products.get(id) || null
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      console.error('Erro ao buscar produto por ID:', error)
      return null
    }
  }

  // Buscar produto por nome
  async findByName(name) {
    if (this._shouldUseMemory()) {
      for (const product of this.products.values()) {
        if (product.name.toLowerCase() === name.toLowerCase()) {
          return product
        }
      }
      return null
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER($1)`,
        [name]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      console.error('Erro ao buscar produto por nome:', error)
      return null
    }
  }

  // Buscar produtos por nome (busca parcial)
  async searchByName(searchTerm) {
    if (this._shouldUseMemory()) {
      const results = []
      for (const product of this.products.values()) {
        if (product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(product)
        }
      }
      return results
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} 
         WHERE LOWER(name) LIKE LOWER($1)
         ORDER BY name`,
        [`%${searchTerm}%`]
      )

      return result.rows.map(row => this._mapToModel(row))
    } catch (error) {
      console.error('Erro ao buscar produtos por nome:', error)
      return []
    }
  }

  // Listar todos os produtos
  async findAll() {
    if (this._shouldUseMemory()) {
      return Array.from(this.products.values())
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} ORDER BY name`
      )

      return result.rows.map(row => this._mapToModel(row))
    } catch (error) {
      console.error('Erro ao listar produtos:', error)
      return []
    }
  }

  // Atualizar produto
  async update(id, updateData) {
    if (this._shouldUseMemory()) {
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

      // Verificar conflito de nome apenas se o nome foi alterado
      if (updateData.name && updateData.name !== product.name) {
        const existingProduct = await this.findByName(updateData.name)
        if (existingProduct && existingProduct.id !== id) {
          throw new Error('Produto com este nome já existe')
        }
      }

      this.products.set(id, updatedProduct)
      return updatedProduct
    }

    try {
      const existingProduct = await this.findById(id)
      if (!existingProduct) {
        return null
      }

      const updatedProduct = new Product({
        ...existingProduct,
        ...updateData,
        id,
        updatedAt: new Date()
      })

      if (!updatedProduct.isValid()) {
        throw new Error('Dados do produto inválidos')
      }

      const dbData = this._mapToDb(updatedProduct)
      const result = await supabaseConfig.query(
        `UPDATE ${this.tableName} 
         SET name = $2, weight = $3, expected_weight = $4, arduino_id = $5, arduino_timestamp = $6, registered_at = $7, source = $8, updated_at = $9
         WHERE id = $1
         RETURNING *`,
        [
          id, 
          dbData.name, 
          dbData.weight, 
          dbData.expected_weight || null,
          dbData.arduino_id || null,
          dbData.arduino_timestamp || null,
          dbData.registered_at || null,
          dbData.source || 'api',
          dbData.updated_at
        ]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Produto com este nome já existe')
      }
      throw error
    }
  }

  // Deletar produto
  async delete(id) {
    if (this._shouldUseMemory()) {
      return this.products.delete(id)
    }

    try {
      const result = await supabaseConfig.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      )

      return result.rowCount > 0
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
      return false
    }
  }

  // Obter estatísticas de produtos
  async getStats() {
    if (this._shouldUseMemory()) {
      const products = Array.from(this.products.values())
      const weights = products.map(p => p.weight)
      return {
        total: products.length,
        averageWeight: weights.length > 0 ? weights.reduce((sum, w) => sum + w, 0) / weights.length : 0,
        minWeight: weights.length > 0 ? Math.min(...weights) : 0,
        maxWeight: weights.length > 0 ? Math.max(...weights) : 0
      }
    }

    try {
      const result = await supabaseConfig.query(`
        SELECT 
          COUNT(*) as total,
          AVG(weight) as average_weight,
          MIN(weight) as min_weight,
          MAX(weight) as max_weight
        FROM ${this.tableName}
      `)

      const row = result.rows[0]
      return {
        total: parseInt(row.total),
        averageWeight: parseFloat(row.average_weight) || 0,
        minWeight: parseFloat(row.min_weight) || 0,
        maxWeight: parseFloat(row.max_weight) || 0
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas de produtos:', error)
      return { total: 0, averageWeight: 0, minWeight: 0, maxWeight: 0 }
    }
  }

  // Criar múltiplos produtos em lote
  async createBulk(productsData) {
    if (this._shouldUseMemory()) {
      const createdProducts = []
      for (const productData of productsData) {
        try {
          const product = await this.create(productData)
          createdProducts.push(product)
        } catch (error) {
          console.error(`Erro ao criar produto ${productData.name}:`, error.message)
        }
      }
      return createdProducts
    }

    try {
      const createdProducts = []
      
      // Usar transação para inserção em lote
      await supabaseConfig.query('BEGIN')
      
      for (const productData of productsData) {
        try {
          const product = await this.create(productData)
          createdProducts.push(product)
        } catch (error) {
          console.error(`Erro ao criar produto ${productData.name}:`, error.message)
        }
      }
      
      await supabaseConfig.query('COMMIT')
      return createdProducts
    } catch (error) {
      await supabaseConfig.query('ROLLBACK')
      console.error('Erro na criação em lote de produtos:', error)
      return []
    }
  }
}

module.exports = ProductRepository 
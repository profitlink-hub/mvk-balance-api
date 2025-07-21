const Shelf = require('../models/Shelf')
const { v4: uuidv4 } = require('uuid')
const databaseConfig = require('../database/database.config')

class ShelfRepository {
  constructor() {
    this.tableName = 'shelfs'
    
    // Fallback para desenvolvimento sem Supabase (inicialização lazy)
    this.shelfs = new Map() // Sempre inicializar para fallback
  }

  // Verificar se deve usar memória (lazy check)
  _shouldUseMemory() {
    return !databaseConfig.isConnected()
  }

  // Converter dados do banco para modelo
  _mapToModel(dbData) {
    if (!dbData) return null

    // Processar produtos para garantir estrutura correta
    let products = []
    if (dbData.products) {
      const rawProducts = Array.isArray(dbData.products) ? dbData.products : JSON.parse(dbData.products)
      products = rawProducts.map(prod => {
        // Se o produto já tem a estrutura correta, manter
        if (prod.product && prod.product.name) {
          return prod
        }
        
        // Se o produto tem productName diretamente, converter para estrutura correta
        if (prod.productName) {
          return {
            productId: prod.productId,
            product: {
              id: prod.productId,
              name: prod.productName,
              weight: prod.unitWeight || 0,
              createdAt: new Date()
            },
            quantity: prod.quantity,
            totalWeight: prod.totalWeight
          }
        }
        
        // Fallback: retornar como está
        return prod
      })
    }

    const shelfData = {
      id: dbData.id,
      name: dbData.name,
      products: products,
      totalWeight: parseFloat(dbData.total_weight) || 0,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at)
    }

    // Adicionar campos opcionais se existirem
    if (dbData.description) {
      shelfData.description = dbData.description
    }
    if (dbData.max_capacity !== null && dbData.max_capacity !== undefined) {
      shelfData.maxCapacity = parseFloat(dbData.max_capacity)
    }
    if (dbData.location) {
      shelfData.location = dbData.location
    }
    if (dbData.is_active !== null && dbData.is_active !== undefined) {
      shelfData.isActive = dbData.is_active
    }

    return new Shelf(shelfData)
  }

  // Buscar produtos completos da pratileira via shelf_items (para debug/verificação)
  async _getShelfItemsWithProducts(shelfId) {
    if (this._shouldUseMemory()) {
      return []
    }

    try {
      const result = await databaseConfig.query(`
        SELECT 
          si.*,
          p.name as product_name,
          p.weight as product_weight
        FROM shelf_items si
        JOIN products p ON p.id = si.product_id
        WHERE si.shelf_id = $1
        ORDER BY si.position NULLS LAST, p.name
      `, [shelfId])

      return result.rows.map(row => ({
        productId: row.product_id,
        product: {
          id: row.product_id,
          name: row.product_name,
          weight: parseFloat(row.product_weight)
        },
        quantity: row.quantity,
        unitWeight: parseFloat(row.unit_weight),
        totalWeight: parseFloat(row.total_item_weight),
        position: row.position,
        addedAt: row.added_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Erro ao buscar shelf_items:', error)
      return []
    }
  }

  // Converter modelo para dados do banco
  _mapToDatabase(shelf) {
    const dbData = {
      id: shelf.id,
      name: shelf.name,
      products: JSON.stringify(shelf.products || []),
      total_weight: shelf.totalWeight || 0,
      created_at: shelf.createdAt,
      updated_at: shelf.updatedAt || new Date()
    }

    // Adicionar campos opcionais se existirem
    if (shelf.description !== undefined) {
      dbData.description = shelf.description
    }
    if (shelf.maxCapacity !== undefined) {
      dbData.max_capacity = shelf.maxCapacity
    }
    if (shelf.location !== undefined) {
      dbData.location = shelf.location
    }
    if (shelf.isActive !== undefined) {
      dbData.is_active = shelf.isActive
    }

    return dbData
  }

  // Criar pratileira
  async create(shelfData) {
    const id = uuidv4()
    const now = new Date()
    
    const shelf = new Shelf({
      id,
      name: shelfData.name,
      products: [], // Sempre iniciar vazio, será preenchido pelos triggers
      totalWeight: 0, // Será calculado pelos triggers
      createdAt: now,
      updatedAt: now,
      description: shelfData.description,
      maxCapacity: shelfData.maxCapacity,
      location: shelfData.location,
      isActive: shelfData.isActive !== undefined ? shelfData.isActive : true
    })

    // Verificar se já existe uma pratileira com o mesmo nome
    const existingShelf = await this.findByName(shelf.name)
    if (existingShelf) {
      throw new Error('Pratileira com este nome já existe')
    }

    if (this._shouldUseMemory()) {
      // Para memória, manter comportamento original
      shelf.products = shelfData.products || []
      shelf.totalWeight = shelfData.totalWeight || 0
      this.shelfs.set(id, shelf)
      return shelf
    }

    try {
      // 1. Criar pratileira primeiro (sem produtos no JSON, serão sincronizados pelos triggers)
      const result = await databaseConfig.query(
        `INSERT INTO ${this.tableName} (id, name, description, products, total_weight, max_capacity, location, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          shelf.id,
          shelf.name,
          shelf.description || null,
          '[]', // Começar com array vazio, será preenchido pelos triggers
          0, // Peso será calculado pelos triggers
          shelf.maxCapacity || null,
          shelf.location || null,
          shelf.isActive,
          shelf.createdAt,
          shelf.updatedAt
        ]
      )

      // 2. Se há produtos, inserir na tabela shelf_items
      if (shelfData.products && Array.isArray(shelfData.products) && shelfData.products.length > 0) {
        for (const productData of shelfData.products) {
          await databaseConfig.query(
            `INSERT INTO shelf_items (shelf_id, product_id, quantity, unit_weight, position)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              shelf.id,
              productData.productId,
              productData.quantity,
              productData.product?.weight || 0,
              null // position pode ser null por enquanto
            ]
          )
        }

        // 3. Buscar pratileira atualizada com dados sincronizados pelos triggers
        const updatedResult = await databaseConfig.query(
          `SELECT * FROM ${this.tableName} WHERE id = $1`,
          [shelf.id]
        )
        
        return this._mapToModel(updatedResult.rows[0])
      }

      return this._mapToModel(result.rows[0])
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Pratileira com este nome já existe')
      }
      console.error('Erro ao criar pratileira no banco:', error)
      throw error
    }
  }

  // Buscar pratileira por ID
  async findById(id) {
    if (this._shouldUseMemory()) {
      return this.shelfs.get(id) || null
    }

    try {
      const result = await databaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      console.error('Erro ao buscar pratileira por ID:', error)
      return null
    }
  }

  // Buscar pratileira por nome
  async findByName(name) {
    if (this._shouldUseMemory()) {
      for (const shelf of this.shelfs.values()) {
        if (shelf.name.toLowerCase() === name.toLowerCase()) {
          return shelf
        }
      }
      return null
    }

    try {
      const result = await databaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER($1)`,
        [name]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      console.error('Erro ao buscar pratileira por nome:', error)
      return null
    }
  }

  // Buscar todas as pratileiras
  async findAll(filters = {}) {
    if (this._shouldUseMemory()) {
      let shelfs = Array.from(this.shelfs.values())
      
      // Aplicar filtro de status se fornecido
      if (filters.status !== undefined) {
        if (filters.status === 'active') {
          shelfs = shelfs.filter(shelf => shelf.isActive === true)
        } else if (filters.status === 'inactive') {
          shelfs = shelfs.filter(shelf => shelf.isActive === false)
        }
        // Se status = 'all' ou qualquer outro valor, retorna todos
      }
      
      return shelfs
    }

    try {
      let whereClause = '1=1' // Sempre verdadeiro por padrão
      
      // Aplicar filtro de status se fornecido
      if (filters.status === 'active') {
        whereClause = 'is_active = true'
      } else if (filters.status === 'inactive') {
        whereClause = 'is_active = false'
      }
      // Se status = 'all' ou não fornecido, busca todas
      
      const result = await databaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY created_at DESC`
      )

      return result.rows.map(row => this._mapToModel(row))
    } catch (error) {
      console.error('Erro ao buscar pratileiras:', error)
      return []
    }
  }

  // Atualizar pratileira
  async update(id, updateData) {
    if (this._shouldUseMemory()) {
      const shelf = this.shelfs.get(id)
      if (!shelf) {
        return null
      }

      // Atualizar apenas os campos fornecidos
      if (updateData.name !== undefined) {
        shelf.name = updateData.name
      }
      if (updateData.products !== undefined) {
        shelf.products = updateData.products
      }
      if (updateData.totalWeight !== undefined) {
        shelf.totalWeight = updateData.totalWeight
      }
      if (updateData.description !== undefined) {
        shelf.description = updateData.description
      }
      if (updateData.maxCapacity !== undefined) {
        shelf.maxCapacity = updateData.maxCapacity
      }
      if (updateData.location !== undefined) {
        shelf.location = updateData.location
      }
      if (updateData.isActive !== undefined) {
        shelf.isActive = updateData.isActive
      }
      
      shelf.updatedAt = new Date()
      
      this.shelfs.set(id, shelf)
      return shelf
    }

    try {
      // Buscar pratileira atual
      const currentShelf = await this.findById(id)
      if (!currentShelf) {
        return null
      }

      // Construir query dinâmica baseada nos campos a atualizar
      const updateFields = []
      const values = []
      let paramCount = 1

      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramCount}`)
        values.push(updateData.name)
        paramCount++
      }

      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramCount}`)
        values.push(updateData.description)
        paramCount++
      }

      // Para produtos, vamos gerenciar via shelf_items, não diretamente no JSON
      let shouldUpdateProducts = false
      if (updateData.products !== undefined) {
        shouldUpdateProducts = true
      }

      if (updateData.totalWeight !== undefined) {
        updateFields.push(`total_weight = $${paramCount}`)
        values.push(updateData.totalWeight)
        paramCount++
      }

      if (updateData.maxCapacity !== undefined) {
        updateFields.push(`max_capacity = $${paramCount}`)
        values.push(updateData.maxCapacity)
        paramCount++
      }

      if (updateData.location !== undefined) {
        updateFields.push(`location = $${paramCount}`)
        values.push(updateData.location)
        paramCount++
      }

      if (updateData.isActive !== undefined) {
        updateFields.push(`is_active = $${paramCount}`)
        values.push(updateData.isActive)
        paramCount++
      }

      // Sempre atualizar updated_at
      updateFields.push(`updated_at = $${paramCount}`)
      values.push(new Date())
      paramCount++

      // Adicionar ID como último parâmetro
      values.push(id)

      if (updateFields.length === 1) { // Apenas updated_at
        throw new Error('Nenhum campo para atualizar')
      }

      // Atualizar campos básicos primeiro (se houver)
      let updatedShelf = currentShelf
      if (updateFields.length > 1) { // Mais que apenas updated_at
        const query = `
          UPDATE ${this.tableName} 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `

        const result = await databaseConfig.query(query, values)
        updatedShelf = this._mapToModel(result.rows[0])
      }

      // Gerenciar produtos via shelf_items se necessário
      if (shouldUpdateProducts) {
        // 1. Remover todos os produtos existentes da pratileira
        await databaseConfig.query(
          `DELETE FROM shelf_items WHERE shelf_id = $1`,
          [id]
        )

        // 2. Inserir novos produtos na tabela shelf_items
        if (updateData.products && Array.isArray(updateData.products) && updateData.products.length > 0) {
          for (const productData of updateData.products) {
            await databaseConfig.query(
              `INSERT INTO shelf_items (shelf_id, product_id, quantity, unit_weight, position)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                id,
                productData.productId,
                productData.quantity,
                productData.product?.weight || 0,
                null // position pode ser null por enquanto
              ]
            )
          }
        }

        // 3. Buscar pratileira atualizada com dados sincronizados pelos triggers
        const finalResult = await databaseConfig.query(
          `SELECT * FROM ${this.tableName} WHERE id = $1`,
          [id]
        )
        
        return this._mapToModel(finalResult.rows[0])
      }

      return updatedShelf
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Já existe uma pratileira com este nome')
      }
      console.error('Erro ao atualizar pratileira:', error)
      throw error
    }
  }

  // Deletar pratileira
  async delete(id) {
    if (this._shouldUseMemory()) {
      const existed = this.shelfs.has(id)
      this.shelfs.delete(id)
      return existed
    }

    try {
      const result = await databaseConfig.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      )

      return result.rowCount > 0
    } catch (error) {
      console.error('Erro ao deletar pratileira:', error)
      throw error
    }
  }

  // Buscar pratileiras por filtros
  async findByFilters(filters) {
    if (this._shouldUseMemory()) {
      let results = Array.from(this.shelfs.values())

      if (filters.name) {
        results = results.filter(shelf => 
          shelf.name.toLowerCase().includes(filters.name.toLowerCase())
        )
      }

      if (filters.minWeight !== undefined) {
        results = results.filter(shelf => shelf.totalWeight >= filters.minWeight)
      }

      if (filters.maxWeight !== undefined) {
        results = results.filter(shelf => shelf.totalWeight <= filters.maxWeight)
      }

      if (filters.location) {
        results = results.filter(shelf => 
          shelf.location && shelf.location.toLowerCase().includes(filters.location.toLowerCase())
        )
      }

      return results
    }

    try {
      const conditions = ['is_active = true']
      const values = []
      let paramCount = 1

      if (filters.name) {
        conditions.push(`LOWER(name) LIKE LOWER($${paramCount})`)
        values.push(`%${filters.name}%`)
        paramCount++
      }

      if (filters.minWeight !== undefined) {
        conditions.push(`total_weight >= $${paramCount}`)
        values.push(filters.minWeight)
        paramCount++
      }

      if (filters.maxWeight !== undefined) {
        conditions.push(`total_weight <= $${paramCount}`)
        values.push(filters.maxWeight)
        paramCount++
      }

      if (filters.location) {
        conditions.push(`LOWER(location) LIKE LOWER($${paramCount})`)
        values.push(`%${filters.location}%`)
        paramCount++
      }

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
      `

      const result = await databaseConfig.query(query, values)
      return result.rows.map(row => this._mapToModel(row))
    } catch (error) {
      console.error('Erro ao buscar pratileiras com filtros:', error)
      return []
    }
  }

  // Adicionar produto à pratileira
  async addProduct(shelfId, productData) {
    if (this._shouldUseMemory()) {
      const shelf = this.shelfs.get(shelfId)
      if (!shelf) {
        return null
      }

      // Verificar se produto já existe na pratileira
      const existingIndex = shelf.products.findIndex(p => p.productId === productData.productId)
      
      if (existingIndex >= 0) {
        // Atualizar quantidade se produto já existe
        shelf.products[existingIndex].quantity += productData.quantity
        shelf.products[existingIndex].totalWeight = 
          shelf.products[existingIndex].quantity * (productData.product?.weight || 0)
      } else {
        // Adicionar novo produto
        shelf.products.push({
          productId: productData.productId,
          product: productData.product,
          quantity: productData.quantity,
          totalWeight: productData.quantity * (productData.product?.weight || 0)
        })
      }

      // Recalcular peso total
      shelf.totalWeight = shelf.products.reduce((total, p) => total + p.totalWeight, 0)
      shelf.updatedAt = new Date()
      
      this.shelfs.set(shelfId, shelf)
      return shelf
    }

    try {
      // Buscar pratileira atual
      const currentShelf = await this.findById(shelfId)
      if (!currentShelf) {
        return null
      }

      // Verificar se produto já existe na pratileira
      const existingItem = await databaseConfig.query(
        `SELECT * FROM shelf_items WHERE shelf_id = $1 AND product_id = $2`,
        [shelfId, productData.productId]
      )

      if (existingItem.rows.length > 0) {
        // Atualizar quantidade se produto já existe
        const currentQuantity = existingItem.rows[0].quantity
        const newQuantity = currentQuantity + productData.quantity

        await databaseConfig.query(
          `UPDATE shelf_items 
           SET quantity = $1, updated_at = NOW()
           WHERE shelf_id = $2 AND product_id = $3`,
          [newQuantity, shelfId, productData.productId]
        )
      } else {
        // Adicionar novo produto
        await databaseConfig.query(
          `INSERT INTO shelf_items (shelf_id, product_id, quantity, unit_weight, position)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            shelfId,
            productData.productId,
            productData.quantity,
            productData.product?.weight || 0,
            null
          ]
        )
      }

      // Buscar pratileira atualizada (triggers atualizarão JSON e peso automaticamente)
      const updatedResult = await databaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [shelfId]
      )

      return this._mapToModel(updatedResult.rows[0])
    } catch (error) {
      console.error('Erro ao adicionar produto à pratileira:', error)
      throw error
    }
  }

  // Remover produto da pratileira
  async removeProduct(shelfId, productId) {
    if (this._shouldUseMemory()) {
      const shelf = this.shelfs.get(shelfId)
      if (!shelf) {
        return null
      }

      shelf.products = shelf.products.filter(p => p.productId !== productId)
      
      // Recalcular peso total
      shelf.totalWeight = shelf.products.reduce((total, p) => total + p.totalWeight, 0)
      shelf.updatedAt = new Date()
      
      this.shelfs.set(shelfId, shelf)
      return shelf
    }

    try {
      // Buscar pratileira atual
      const currentShelf = await this.findById(shelfId)
      if (!currentShelf) {
        return null
      }

      // Remover produto da tabela shelf_items
      const deleteResult = await databaseConfig.query(
        `DELETE FROM shelf_items WHERE shelf_id = $1 AND product_id = $2`,
        [shelfId, productId]
      )

      // Verificar se algum registro foi removido
      if (deleteResult.rowCount === 0) {
        console.warn(`Produto ${productId} não encontrado na pratileira ${shelfId}`)
      }

      // Buscar pratileira atualizada (triggers atualizarão JSON e peso automaticamente)
      const updatedResult = await databaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [shelfId]
      )

      return this._mapToModel(updatedResult.rows[0])
    } catch (error) {
      console.error('Erro ao remover produto da pratileira:', error)
      throw error
    }
  }

  // Estatísticas das pratileiras
  async getStatistics() {
    if (this._shouldUseMemory()) {
      const shelfs = Array.from(this.shelfs.values())
      
      return {
        totalShelfs: shelfs.length,
        totalWeight: shelfs.reduce((sum, shelf) => sum + shelf.totalWeight, 0),
        averageWeight: shelfs.length > 0 ? 
          shelfs.reduce((sum, shelf) => sum + shelf.totalWeight, 0) / shelfs.length : 0,
        totalProducts: shelfs.reduce((sum, shelf) => sum + shelf.products.length, 0)
      }
    }

    try {
      const result = await databaseConfig.query(`
        SELECT 
          COUNT(*) as total_shelfs,
          COALESCE(SUM(total_weight), 0) as total_weight,
          COALESCE(AVG(total_weight), 0) as average_weight,
          COALESCE(SUM(jsonb_array_length(products)), 0) as total_products
        FROM ${this.tableName}
        WHERE is_active = true
      `)

      const stats = result.rows[0]
      return {
        totalShelfs: parseInt(stats.total_shelfs),
        totalWeight: parseFloat(stats.total_weight),
        averageWeight: parseFloat(stats.average_weight),
        totalProducts: parseInt(stats.total_products)
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return {
        totalShelfs: 0,
        totalWeight: 0,
        averageWeight: 0,
        totalProducts: 0
      }
    }
  }

  // Método de debug para verificar consistência entre shelf_items e campo JSON
  async debugShelfConsistency(shelfId) {
    if (this._shouldUseMemory()) {
      return { message: 'Debug disponível apenas para banco de dados' }
    }

    try {
      // Buscar dados da pratileira
      const shelf = await this.findById(shelfId)
      if (!shelf) {
        return { error: 'Pratileira não encontrada' }
      }

      // Buscar dados dos shelf_items
      const shelfItems = await this._getShelfItemsWithProducts(shelfId)

      // Calcular peso total via shelf_items
      const calculatedWeight = shelfItems.reduce((total, item) => total + item.totalWeight, 0)

      return {
        shelfId: shelfId,
        shelfName: shelf.name,
        databaseTotalWeight: shelf.totalWeight,
        calculatedTotalWeight: calculatedWeight,
        weightConsistent: Math.abs(shelf.totalWeight - calculatedWeight) < 0.01,
        productsInJson: shelf.products.length,
        productsInShelfItems: shelfItems.length,
        productsConsistent: shelf.products.length === shelfItems.length,
        jsonProducts: shelf.products,
        shelfItemsProducts: shelfItems
      }
    } catch (error) {
      console.error('Erro no debug de consistência:', error)
      return { error: error.message }
    }
  }
}

module.exports = ShelfRepository 
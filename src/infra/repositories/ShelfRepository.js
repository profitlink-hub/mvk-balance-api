const Shelf = require('../models/Shelf')
const { v4: uuidv4 } = require('uuid')
// const databaseConfig = require('../database/database.config') // TODO: Usar quando implementar banco

class ShelfRepository {
  constructor() {
    this.tableName = 'shelfs'
    
    // Por enquanto usar memória - futuro: implementar tabela no banco
    this.shelfs = new Map()
  }

  // Verificar se deve usar memória (sempre true por enquanto)
  _shouldUseMemory() {
    return true // TODO: Implementar tabela no banco de dados
  }

  // Converter dados do banco para modelo (futuro)
  _mapToModel(dbData) {
    if (!dbData) return null

    const shelfData = {
      id: dbData.id,
      name: dbData.name,
      products: dbData.products || [],
      totalWeight: parseFloat(dbData.total_weight) || 0,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at)
    }

    return new Shelf(shelfData)
  }

  // Converter modelo para dados do banco (futuro)
  _mapToDatabase(shelf) {
    return {
      id: shelf.id,
      name: shelf.name,
      products: JSON.stringify(shelf.products),
      total_weight: shelf.totalWeight,
      created_at: shelf.createdAt.toISOString(),
      updated_at: shelf.updatedAt.toISOString()
    }
  }

  // Criar pratileira
  async create(shelfData) {
    try {
      if (this._shouldUseMemory()) {
        const id = uuidv4()
        const now = new Date()
        
        const shelf = new Shelf({
          id,
          name: shelfData.name,
          products: shelfData.products || [],
          totalWeight: shelfData.totalWeight || 0,
          createdAt: now,
          updatedAt: now
        })

        this.shelfs.set(id, shelf)
        return shelf
      }

      // TODO: Implementar criação no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao criar pratileira:', error)
      throw error
    }
  }

  // Buscar pratileira por ID
  async findById(id) {
    try {
      if (this._shouldUseMemory()) {
        return this.shelfs.get(id) || null
      }

      // TODO: Implementar busca no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao buscar pratileira por ID:', error)
      throw error
    }
  }

  // Buscar pratileira por nome
  async findByName(name) {
    try {
      if (this._shouldUseMemory()) {
        for (const shelf of this.shelfs.values()) {
          if (shelf.name.toLowerCase() === name.toLowerCase()) {
            return shelf
          }
        }
        return null
      }

      // TODO: Implementar busca no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao buscar pratileira por nome:', error)
      throw error
    }
  }

  // Buscar todas as pratileiras
  async findAll() {
    try {
      if (this._shouldUseMemory()) {
        return Array.from(this.shelfs.values())
      }

      // TODO: Implementar busca no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao buscar pratileiras:', error)
      throw error
    }
  }

  // Atualizar pratileira
  async update(id, updateData) {
    try {
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
        
        shelf.updatedAt = new Date()
        
        this.shelfs.set(id, shelf)
        return shelf
      }

      // TODO: Implementar atualização no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao atualizar pratileira:', error)
      throw error
    }
  }

  // Deletar pratileira
  async delete(id) {
    try {
      if (this._shouldUseMemory()) {
        const existed = this.shelfs.has(id)
        this.shelfs.delete(id)
        return existed
      }

      // TODO: Implementar deleção no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao deletar pratileira:', error)
      throw error
    }
  }

  // Buscar pratileiras por filtros (futuro)
  async findByFilters(filters) {
    try {
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

        return results
      }

      // TODO: Implementar busca com filtros no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao buscar pratileiras com filtros:', error)
      throw error
    }
  }

  // Adicionar produto à pratileira
  async addProduct(shelfId, productData) {
    try {
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

      // TODO: Implementar no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao adicionar produto à pratileira:', error)
      throw error
    }
  }

  // Remover produto da pratileira
  async removeProduct(shelfId, productId) {
    try {
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

      // TODO: Implementar no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao remover produto da pratileira:', error)
      throw error
    }
  }

  // Estatísticas das pratileiras
  async getStatistics() {
    try {
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

      // TODO: Implementar no banco de dados
      throw new Error('Database storage not implemented yet')
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }
}

module.exports = ShelfRepository 
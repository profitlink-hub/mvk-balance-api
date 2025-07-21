const ShelfRepository = require('../infra/repositories/ShelfRepository')
const ProductRepository = require('../infra/repositories/ProductRepository')

class ShelfService {
  constructor() {
    this.shelfRepository = new ShelfRepository()
    this.productRepository = new ProductRepository()
  }

  // Criar pratileira
  async createShelf(shelfData) {
    try {
      // Validações de negócio
      if (!shelfData.name || shelfData.name.trim().length < 2) {
        throw new Error('Nome da pratileira deve ter pelo menos 2 caracteres')
      }

      // Verificar se já existe pratileira com o mesmo nome
      const existingShelf = await this.shelfRepository.findByName(shelfData.name)
      if (existingShelf) {
        throw new Error('Já existe uma pratileira com este nome')
      }

      // Preparar dados para criação
      const createData = {
        name: shelfData.name.trim(),
        products: shelfData.products || [],
        totalWeight: 0
      }

      // Se produtos foram fornecidos, validar e calcular peso
      if (shelfData.products && Array.isArray(shelfData.products)) {
        const validatedProducts = []
        let totalWeight = 0

        for (const productData of shelfData.products) {
          // Buscar produto no banco para obter dados completos
          const product = await this.productRepository.findById(productData.productId)
          if (!product) {
            throw new Error(`Produto com ID ${productData.productId} não encontrado`)
          }

          const productWeight = productData.quantity * product.weight
          validatedProducts.push({
            productId: productData.productId,
            product: product.toJSON(),
            quantity: productData.quantity,
            totalWeight: productWeight
          })

          totalWeight += productWeight
        }

        createData.products = validatedProducts
        createData.totalWeight = totalWeight
      }

      // Criar pratileira
      const shelf = await this.shelfRepository.create(createData)

      return {
        success: true,
        data: shelf.toApiResponse(),
        message: 'Pratileira criada com sucesso'
      }
    } catch (error) {
      console.error('Erro no ShelfService.createShelf:', error)
      return {
        success: false,
        error: error.message || 'Erro ao criar pratileira'
      }
    }
  }

  // Buscar todas as pratileiras
  async getAllShelfs(filters = {}) {
    try {
      const shelfs = await this.shelfRepository.findAll(filters)
      
      // Preparar mensagem baseada no filtro
      let message = 'Pratileiras encontradas'
      if (shelfs.length === 0) {
        if (filters.status === 'active') {
          message = 'Nenhuma pratileira ativa encontrada'
        } else if (filters.status === 'inactive') {
          message = 'Nenhuma pratileira inativa encontrada'
        } else {
          message = 'Nenhuma pratileira encontrada'
        }
      } else {
        if (filters.status === 'active') {
          message = 'Pratileiras ativas encontradas'
        } else if (filters.status === 'inactive') {
          message = 'Pratileiras inativas encontradas'
        }
      }
      
      return {
        success: true,
        data: shelfs.map(shelf => shelf.toBasicApiResponse()),
        count: shelfs.length,
        filters: filters,
        message: message
      }
    } catch (error) {
      console.error('Erro no ShelfService.getAllShelfs:', error)
      return {
        success: false,
        error: error.message || 'Erro ao buscar pratileiras'
      }
    }
  }

  // Buscar produtos de uma pratileira específica
  async getShelfProducts(shelfId) {
    try {
      const shelf = await this.shelfRepository.findById(shelfId)
      
      if (!shelf) {
        return {
          success: false,
          error: 'Pratileira não encontrada'
        }
      }

      return {
        success: true,
        data: {
          shelfId: shelf.id,
          shelfName: shelf.name,
          products: shelf.products || [],
          totalItems: shelf.getTotalItems(),
          totalWeight: shelf.totalWeight
        },
        message: 'Produtos da pratileira encontrados'
      }
    } catch (error) {
      console.error('Erro no ShelfService.getShelfProducts:', error)
      return {
        success: false,
        error: error.message || 'Erro ao buscar produtos da pratileira'
      }
    }
  }

  // Buscar pratileira por ID
  async getShelfById(id) {
    try {
      const shelf = await this.shelfRepository.findById(id)
      
      if (!shelf) {
        return {
          success: false,
          error: 'Pratileira não encontrada'
        }
      }

      return {
        success: true,
        data: shelf.toApiResponse(),
        message: 'Pratileira encontrada'
      }
    } catch (error) {
      console.error('Erro no ShelfService.getShelfById:', error)
      return {
        success: false,
        error: error.message || 'Erro ao buscar pratileira'
      }
    }
  }

  // Buscar pratileira por nome
  async getShelfByName(name) {
    try {
      const shelf = await this.shelfRepository.findByName(name)
      
      if (!shelf) {
        return {
          success: false,
          error: 'Pratileira não encontrada'
        }
      }

      return {
        success: true,
        data: shelf.toApiResponse(),
        message: 'Pratileira encontrada'
      }
    } catch (error) {
      console.error('Erro no ShelfService.getShelfByName:', error)
      return {
        success: false,
        error: error.message || 'Erro ao buscar pratileira'
      }
    }
  }

  // Atualizar pratileira
  async updateShelf(id, updateData) {
    try {
      // Verificar se pratileira existe
      const existingShelf = await this.shelfRepository.findById(id)
      if (!existingShelf) {
        return {
          success: false,
          error: 'Pratileira não encontrada'
        }
      }

      // Validar nome se fornecido
      if (updateData.name) {
        if (updateData.name.trim().length < 2) {
          throw new Error('Nome da pratileira deve ter pelo menos 2 caracteres')
        }

        // Verificar se já existe outra pratileira com o mesmo nome
        const shelfWithSameName = await this.shelfRepository.findByName(updateData.name)
        if (shelfWithSameName && shelfWithSameName.id !== id) {
          throw new Error('Já existe uma pratileira com este nome')
        }
      }

      // Preparar dados de atualização
      const updatePayload = {}
      
      if (updateData.name !== undefined) {
        updatePayload.name = updateData.name.trim()
      }

      if (updateData.isActive !== undefined) {
        updatePayload.isActive = updateData.isActive
      }

      // Se produtos foram fornecidos, validar e recalcular peso
      if (updateData.products !== undefined) {
        const validatedProducts = []
        let totalWeight = 0

        for (const productData of updateData.products) {
          // Buscar produto no banco para obter dados completos
          const product = await this.productRepository.findById(productData.productId)
          if (!product) {
            throw new Error(`Produto com ID ${productData.productId} não encontrado`)
          }

          const productWeight = productData.quantity * product.weight
          validatedProducts.push({
            productId: productData.productId,
            product: product.toJSON(),
            quantity: productData.quantity,
            totalWeight: productWeight
          })

          totalWeight += productWeight
        }

        updatePayload.products = validatedProducts
        updatePayload.totalWeight = totalWeight
      }

      // Atualizar pratileira
      const updatedShelf = await this.shelfRepository.update(id, updatePayload)

      return {
        success: true,
        data: updatedShelf.toApiResponse(),
        message: 'Pratileira atualizada com sucesso'
      }
    } catch (error) {
      console.error('Erro no ShelfService.updateShelf:', error)
      return {
        success: false,
        error: error.message || 'Erro ao atualizar pratileira'
      }
    }
  }

  // Deletar pratileira
  async deleteShelf(id) {
    try {
      const deleted = await this.shelfRepository.delete(id)
      
      if (!deleted) {
        return {
          success: false,
          error: 'Pratileira não encontrada'
        }
      }

      return {
        success: true,
        message: 'Pratileira deletada com sucesso'
      }
    } catch (error) {
      console.error('Erro no ShelfService.deleteShelf:', error)
      return {
        success: false,
        error: error.message || 'Erro ao deletar pratileira'
      }
    }
  }

  // Adicionar produto à pratileira
  async addProductToShelf(shelfId, productData) {
    try {
      // Verificar se pratileira existe
      const shelf = await this.shelfRepository.findById(shelfId)
      if (!shelf) {
        return {
          success: false,
          error: 'Pratileira não encontrada'
        }
      }

      // Verificar se produto existe
      const product = await this.productRepository.findById(productData.productId)
      if (!product) {
        return {
          success: false,
          error: 'Produto não encontrado'
        }
      }

      // Preparar dados do produto
      const productPayload = {
        productId: productData.productId,
        product: product.toJSON(),
        quantity: productData.quantity
      }

      // Adicionar produto à pratileira
      const updatedShelf = await this.shelfRepository.addProduct(shelfId, productPayload)

      return {
        success: true,
        data: updatedShelf.toApiResponse(),
        message: 'Produto adicionado à pratileira com sucesso'
      }
    } catch (error) {
      console.error('Erro no ShelfService.addProductToShelf:', error)
      return {
        success: false,
        error: error.message || 'Erro ao adicionar produto à pratileira'
      }
    }
  }

  // Remover produto da pratileira
  async removeProductFromShelf(shelfId, productId) {
    try {
      // Verificar se pratileira existe
      const shelf = await this.shelfRepository.findById(shelfId)
      if (!shelf) {
        return {
          success: false,
          error: 'Pratileira não encontrada'
        }
      }

      // Remover produto da pratileira
      const updatedShelf = await this.shelfRepository.removeProduct(shelfId, productId)

      return {
        success: true,
        data: updatedShelf.toApiResponse(),
        message: 'Produto removido da pratileira com sucesso'
      }
    } catch (error) {
      console.error('Erro no ShelfService.removeProductFromShelf:', error)
      return {
        success: false,
        error: error.message || 'Erro ao remover produto da pratileira'
      }
    }
  }

  // Buscar pratileiras com filtros
  async searchShelfs(filters) {
    try {
      const shelfs = await this.shelfRepository.findByFilters(filters)
      
      return {
        success: true,
        data: shelfs.map(shelf => shelf.toApiResponse()),
        count: shelfs.length,
        filters: filters,
        message: shelfs.length > 0 ? 'Pratileiras encontradas' : 'Nenhuma pratileira encontrada com os filtros aplicados'
      }
    } catch (error) {
      console.error('Erro no ShelfService.searchShelfs:', error)
      return {
        success: false,
        error: error.message || 'Erro ao buscar pratileiras'
      }
    }
  }

  // Estatísticas das pratileiras
  async getStatistics() {
    try {
      const statistics = await this.shelfRepository.getStatistics()
      
      return {
        success: true,
        data: statistics,
        message: 'Estatísticas obtidas com sucesso'
      }
    } catch (error) {
      console.error('Erro no ShelfService.getStatistics:', error)
      return {
        success: false,
        error: error.message || 'Erro ao obter estatísticas'
      }
    }
  }
}

module.exports = ShelfService 
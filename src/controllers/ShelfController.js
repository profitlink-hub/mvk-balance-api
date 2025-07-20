const ShelfService = require('../services/ShelfService')
const ShelfValidator = require('../validators/ShelfValidator')

class ShelfController {
  constructor() {
    this.shelfService = new ShelfService()
  }

  // GET /shelfs - Listar todas as pratileiras
  async getAllShelfs(req, res) {
    try {
      const result = await this.shelfService.getAllShelfs()
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em getAllShelfs:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /shelfs/:id - Buscar pratileira por ID
  async getShelfById(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = ShelfValidator.validateId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      const result = await this.shelfService.getShelfById(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Pratileira não encontrada' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getShelfById:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /shelfs/search/:name - Buscar pratileira por nome
  async getShelfByName(req, res) {
    try {
      const { name } = req.params

      // Validar nome
      const validation = ShelfValidator.validateSearchName(name)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      const result = await this.shelfService.getShelfByName(decodeURIComponent(name))
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Pratileira não encontrada' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getShelfByName:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /shelfs - Criar nova pratileira
  async createShelf(req, res) {
    try {
      console.log('📥 Dados recebidos:', JSON.stringify(req.body, null, 2))
      
      // Validar dados de entrada
      const validation = ShelfValidator.validateCreate(req.body)
      console.log('✅ Validação:', validation)
      
      if (!validation.valid) {
        console.log('❌ Dados inválidos:', validation.errors)
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      // Sanitizar dados
      const sanitizedData = ShelfValidator.sanitize(req.body)
      console.log('🧹 Dados sanitizados:', JSON.stringify(sanitizedData, null, 2))

      const result = await this.shelfService.createShelf(sanitizedData)
      console.log('📊 Resultado do service:', JSON.stringify(result, null, 2))
      
      if (result.success) {
        res.status(201).json(result)
      } else {
        const statusCode = result.error.includes('já existe') ? 409 : 400
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('❌ Erro em createShelf:', error)
      console.error('📍 Stack trace:', error.stack)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  // PUT /shelfs/:id - Atualizar pratileira
  async updateShelf(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const idValidation = ShelfValidator.validateId(id)
      if (!idValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: idValidation.errors
        })
      }

      // Validar dados de atualização
      const validation = ShelfValidator.validateUpdate(req.body)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      // Sanitizar dados
      const sanitizedData = ShelfValidator.sanitize(req.body)

      const result = await this.shelfService.updateShelf(id, sanitizedData)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        let statusCode = 500
        if (result.error === 'Pratileira não encontrada') {
          statusCode = 404
        } else if (result.error.includes('já existe')) {
          statusCode = 409
        } else if (result.error.includes('inválido')) {
          statusCode = 400
        }
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em updateShelf:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // DELETE /shelfs/:id - Deletar pratileira
  async deleteShelf(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = ShelfValidator.validateId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: validation.errors
        })
      }

      const result = await this.shelfService.deleteShelf(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Pratileira não encontrada' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em deleteShelf:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /shelfs/:id/products - Adicionar produto à pratileira
  async addProduct(req, res) {
    try {
      const { id } = req.params

      // Validar ID da pratileira
      const idValidation = ShelfValidator.validateId(id)
      if (!idValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID da pratileira inválido',
          details: idValidation.errors
        })
      }

      // Validar dados do produto
      const validation = ShelfValidator.validateAddProduct(req.body)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados do produto inválidos',
          details: validation.errors
        })
      }

      const result = await this.shelfService.addProductToShelf(id, req.body)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        let statusCode = 500
        if (result.error === 'Pratileira não encontrada' || result.error === 'Produto não encontrado') {
          statusCode = 404
        } else if (result.error.includes('inválido')) {
          statusCode = 400
        }
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em addProduct:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // DELETE /shelfs/:id/products/:productId - Remover produto da pratileira
  async removeProduct(req, res) {
    try {
      const { id, productId } = req.params

      // Validar IDs
      const shelfIdValidation = ShelfValidator.validateId(id)
      const productIdValidation = ShelfValidator.validateId(productId)
      
      if (!shelfIdValidation.valid || !productIdValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'IDs inválidos',
          details: [...shelfIdValidation.errors, ...productIdValidation.errors]
        })
      }

      const result = await this.shelfService.removeProductFromShelf(id, productId)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Pratileira não encontrada' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em removeProduct:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /shelfs/search - Buscar pratileiras com filtros
  async searchShelfs(req, res) {
    try {
      const filters = {}

      // Extrair filtros da query string
      if (req.query.name) {
        filters.name = req.query.name
      }
      if (req.query.minWeight) {
        filters.minWeight = parseFloat(req.query.minWeight)
      }
      if (req.query.maxWeight) {
        filters.maxWeight = parseFloat(req.query.maxWeight)
      }

      const result = await this.shelfService.searchShelfs(filters)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em searchShelfs:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /shelfs/statistics - Obter estatísticas das pratileiras
  async getStatistics(req, res) {
    try {
      const result = await this.shelfService.getStatistics()
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em getStatistics:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // DEBUG: Verificar consistência entre shelf_items e campo JSON
  async debugShelfConsistency(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = ShelfValidator.validateId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      const result = await this.shelfService.shelfRepository.debugShelfConsistency(id)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Debug de consistência executado'
      })
    } catch (error) {
      console.error('Erro em debugShelfConsistency:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = ShelfController 
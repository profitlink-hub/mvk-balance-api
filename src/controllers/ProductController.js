const ProductService = require('../services/ProductService')
const ProductValidator = require('../validators/ProductValidator')

class ProductController {
  constructor() {
    this.productService = new ProductService()
  }

  // GET /products - Listar todos os produtos
  async getAllProducts(req, res) {
    try {
      const result = await this.productService.getAllProducts()
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em getAllProducts:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /products/:id - Buscar produto por ID
  async getProductById(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = ProductValidator.validateId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      const result = await this.productService.getProductById(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Produto não encontrado' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getProductById:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /products/search/:name - Buscar produto por nome
  async getProductByName(req, res) {
    try {
      const { name } = req.params

      // Validar nome
      const validation = ProductValidator.validateName(name)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      const result = await this.productService.getProductByName(decodeURIComponent(name))
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Produto não encontrado' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getProductByName:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /products - Criar novo produto
  async createProduct(req, res) {
    try {
      // Validar dados de entrada
      const validation = ProductValidator.validateCreate(req.body)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      // Sanitizar dados
      const sanitizedData = ProductValidator.sanitize(req.body)

      const result = await this.productService.createProduct(sanitizedData)
      
      if (result.success) {
        res.status(201).json(result)
      } else {
        const statusCode = result.error.includes('já existe') ? 409 : 400
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em createProduct:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // PUT /products/:id - Atualizar produto
  async updateProduct(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const idValidation = ProductValidator.validateId(id)
      if (!idValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: idValidation.errors
        })
      }

      // Validar dados de atualização
      const validation = ProductValidator.validateUpdate(req.body)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      // Sanitizar dados
      const sanitizedData = ProductValidator.sanitize(req.body)

      const result = await this.productService.updateProduct(id, sanitizedData)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        let statusCode = 500
        if (result.error === 'Produto não encontrado') {
          statusCode = 404
        } else if (result.error.includes('já existe')) {
          statusCode = 409
        } else {
          statusCode = 400
        }
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em updateProduct:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // DELETE /products/:id - Deletar produto
  async deleteProduct(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = ProductValidator.validateId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: validation.errors
        })
      }

      const result = await this.productService.deleteProduct(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Produto não encontrado' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em deleteProduct:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /products/bulk - Criar múltiplos produtos
  async createBulkProducts(req, res) {
    try {
      const { products } = req.body

      if (!products) {
        return res.status(400).json({
          success: false,
          error: 'Campo products é obrigatório'
        })
      }

      // Validar dados em lote
      const validation = ProductValidator.validateBulk(products)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      // Criar produtos
      const results = []
      const errors = []

      for (let i = 0; i < validation.validProducts.length; i++) {
        const productData = validation.validProducts[i]
        const result = await this.productService.createProduct(productData)
        
        if (result.success) {
          results.push(result.data)
        } else {
          errors.push({
            index: i + 1,
            product: productData,
            error: result.error
          })
        }
      }

      res.status(201).json({
        success: true,
        data: {
          created: results,
          errors: errors,
          totalCreated: results.length,
          totalErrors: errors.length
        },
        message: `${results.length} produtos criados com sucesso`
      })
    } catch (error) {
      console.error('Erro em createBulkProducts:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = ProductController 
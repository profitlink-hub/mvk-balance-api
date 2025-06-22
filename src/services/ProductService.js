const ProductRepository = require('../infra/repositories/ProductRepository')

class ProductService {
  constructor() {
    this.productRepository = new ProductRepository()
  }

  // Criar produto
  async createProduct(productData) {
    try {
      // Validações de negócio
      if (!productData.name || productData.name.trim().length < 2) {
        throw new Error('Nome do produto deve ter pelo menos 2 caracteres')
      }

      if (productData.weight === undefined || productData.weight < 0) {
        throw new Error('Peso do produto deve ser um número positivo')
      }

      // Verificar se já existe produto com o mesmo nome
      const existingProduct = await this.productRepository.findByName(productData.name)
      if (existingProduct) {
        throw new Error('Já existe um produto com este nome')
      }

      const product = await this.productRepository.create({
        name: productData.name.trim(),
        weight: parseFloat(productData.weight)
      })

      return {
        success: true,
        data: product.toJSON(),
        message: 'Produto criado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Buscar produto por ID
  async getProductById(id) {
    try {
      const product = await this.productRepository.findById(id)
      
      if (!product) {
        return {
          success: false,
          error: 'Produto não encontrado'
        }
      }

      return {
        success: true,
        data: product.toJSON()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Buscar produto por nome
  async getProductByName(name) {
    try {
      const product = await this.productRepository.findByName(name)
      
      if (!product) {
        return {
          success: false,
          error: 'Produto não encontrado'
        }
      }

      return {
        success: true,
        data: product.toJSON()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Listar todos os produtos
  async getAllProducts() {
    try {
      const products = await this.productRepository.findAll()
      
      return {
        success: true,
        data: products.map(product => product.toJSON()),
        total: products.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Atualizar produto
  async updateProduct(id, updateData) {
    try {
      // Validações de negócio
      if (updateData.name && updateData.name.trim().length < 2) {
        throw new Error('Nome do produto deve ter pelo menos 2 caracteres')
      }

      if (updateData.weight !== undefined && updateData.weight < 0) {
        throw new Error('Peso do produto deve ser um número positivo')
      }

      // Se está alterando o nome, verificar se não existe outro produto com o mesmo nome
      if (updateData.name) {
        const existingProduct = await this.productRepository.findByName(updateData.name)
        if (existingProduct && existingProduct.id !== id) {
          throw new Error('Já existe um produto com este nome')
        }
      }

      const updatedProduct = await this.productRepository.update(id, {
        name: updateData.name ? updateData.name.trim() : undefined,
        weight: updateData.weight !== undefined ? parseFloat(updateData.weight) : undefined
      })

      if (!updatedProduct) {
        return {
          success: false,
          error: 'Produto não encontrado'
        }
      }

      return {
        success: true,
        data: updatedProduct.toJSON(),
        message: 'Produto atualizado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Deletar produto
  async deleteProduct(id) {
    try {
      const deleted = await this.productRepository.delete(id)
      
      if (!deleted) {
        return {
          success: false,
          error: 'Produto não encontrado'
        }
      }

      return {
        success: true,
        message: 'Produto deletado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

module.exports = ProductService 
class ShelfValidator {
  // Validar dados para criação de pratileira
  static validateCreate(data) {
    const errors = []

    // Validar nome
    if (!data.name) {
      errors.push('Nome da pratileira é obrigatório')
    } else if (typeof data.name !== 'string') {
      errors.push('Nome da pratileira deve ser uma string')
    } else if (data.name.trim().length < 2) {
      errors.push('Nome da pratileira deve ter pelo menos 2 caracteres')
    } else if (data.name.trim().length > 100) {
      errors.push('Nome da pratileira deve ter no máximo 100 caracteres')
    }

    // Validar produtos (opcional na criação)
    if (data.products !== undefined) {
      if (!Array.isArray(data.products)) {
        errors.push('Produtos deve ser um array')
      } else {
        data.products.forEach((product, index) => {
          if (!product.productId) {
            errors.push(`Produto ${index + 1}: ID do produto é obrigatório`)
          }
          if (!product.quantity || typeof product.quantity !== 'number' || product.quantity <= 0) {
            errors.push(`Produto ${index + 1}: Quantidade deve ser um número maior que zero`)
          }
          if (product.totalWeight !== undefined && 
              (typeof product.totalWeight !== 'number' || product.totalWeight < 0)) {
            errors.push(`Produto ${index + 1}: Peso total deve ser um número positivo`)
          }
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validar dados para atualização de pratileira
  static validateUpdate(data) {
    const errors = []

    // Nome é opcional na atualização, mas deve ser válido se fornecido
    if (data.name !== undefined) {
      if (!data.name) {
        errors.push('Nome da pratileira não pode ser vazio')
      } else if (typeof data.name !== 'string') {
        errors.push('Nome da pratileira deve ser uma string')
      } else if (data.name.trim().length < 2) {
        errors.push('Nome da pratileira deve ter pelo menos 2 caracteres')
      } else if (data.name.trim().length > 100) {
        errors.push('Nome da pratileira deve ter no máximo 100 caracteres')
      }
    }

    // Validar produtos se fornecido
    if (data.products !== undefined) {
      if (!Array.isArray(data.products)) {
        errors.push('Produtos deve ser um array')
      } else {
        data.products.forEach((product, index) => {
          if (!product.productId) {
            errors.push(`Produto ${index + 1}: ID do produto é obrigatório`)
          }
          if (!product.quantity || typeof product.quantity !== 'number' || product.quantity <= 0) {
            errors.push(`Produto ${index + 1}: Quantidade deve ser um número maior que zero`)
          }
          if (product.totalWeight !== undefined && 
              (typeof product.totalWeight !== 'number' || product.totalWeight < 0)) {
            errors.push(`Produto ${index + 1}: Peso total deve ser um número positivo`)
          }
        })
      }
    }

    // Validar peso total se fornecido
    if (data.totalWeight !== undefined) {
      if (typeof data.totalWeight !== 'number' || data.totalWeight < 0) {
        errors.push('Peso total deve ser um número positivo')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validar ID de pratileira
  static validateId(id) {
    const errors = []

    if (!id) {
      errors.push('ID da pratileira é obrigatório')
    } else if (typeof id !== 'string') {
      errors.push('ID da pratileira deve ser uma string')
    } else if (id.trim().length === 0) {
      errors.push('ID da pratileira não pode ser vazio')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validar dados para adição de produto à pratileira
  static validateAddProduct(data) {
    const errors = []

    if (!data.productId) {
      errors.push('ID do produto é obrigatório')
    } else if (typeof data.productId !== 'string') {
      errors.push('ID do produto deve ser uma string')
    }

    if (!data.quantity) {
      errors.push('Quantidade é obrigatória')
    } else if (typeof data.quantity !== 'number' || data.quantity <= 0) {
      errors.push('Quantidade deve ser um número maior que zero')
    } else if (data.quantity > 1000) {
      errors.push('Quantidade não pode ser maior que 1000')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Sanitizar dados de entrada
  static sanitize(data) {
    const sanitized = {}

    if (data.name !== undefined) {
      sanitized.name = data.name.toString().trim()
    }

    if (data.description !== undefined) {
      sanitized.description = data.description ? data.description.toString().trim() : null
    }

    if (data.location !== undefined) {
      sanitized.location = data.location ? data.location.toString().trim() : null
    }

    if (data.maxCapacity !== undefined) {
      sanitized.maxCapacity = data.maxCapacity ? parseFloat(data.maxCapacity) : null
    }

    if (data.isActive !== undefined) {
      sanitized.isActive = Boolean(data.isActive)
    }

    if (data.products !== undefined && Array.isArray(data.products)) {
      sanitized.products = data.products.map(product => {
        const sanitizedProduct = {}
        
        if (product.productId !== undefined) {
          sanitizedProduct.productId = product.productId.toString().trim()
        }
        
        if (product.quantity !== undefined) {
          sanitizedProduct.quantity = parseInt(product.quantity)
        }
        
        if (product.totalWeight !== undefined) {
          sanitizedProduct.totalWeight = parseFloat(product.totalWeight)
        }
        
        if (product.product !== undefined) {
          sanitizedProduct.product = product.product
        }
        
        return sanitizedProduct
      })
    }

    if (data.totalWeight !== undefined) {
      sanitized.totalWeight = parseFloat(data.totalWeight)
    }

    return sanitized
  }

  // Calcular peso total da pratileira
  static calculateTotalWeight(products) {
    if (!Array.isArray(products) || products.length === 0) {
      return 0
    }

    return products.reduce((total, product) => {
      return total + (product.totalWeight || 0)
    }, 0)
  }

  // Validar busca por nome
  static validateSearchName(name) {
    const errors = []

    if (!name) {
      errors.push('Nome da pratileira para busca é obrigatório')
    } else if (typeof name !== 'string') {
      errors.push('Nome da pratileira deve ser uma string')
    } else if (name.trim().length === 0) {
      errors.push('Nome da pratileira não pode ser vazio')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

module.exports = ShelfValidator 
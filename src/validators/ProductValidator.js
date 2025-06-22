class ProductValidator {
  // Validar dados para criação de produto
  validateCreate(data) {
    const errors = []

    // Validar nome
    if (!data.name) {
      errors.push('Nome do produto é obrigatório')
    } else if (typeof data.name !== 'string') {
      errors.push('Nome do produto deve ser uma string')
    } else if (data.name.trim().length < 2) {
      errors.push('Nome do produto deve ter pelo menos 2 caracteres')
    } else if (data.name.trim().length > 100) {
      errors.push('Nome do produto deve ter no máximo 100 caracteres')
    }

    // Validar peso
    if (data.weight === undefined || data.weight === null) {
      errors.push('Peso do produto é obrigatório')
    } else if (typeof data.weight !== 'number' && typeof data.weight !== 'string') {
      errors.push('Peso do produto deve ser um número')
    } else {
      const weight = parseFloat(data.weight)
      if (isNaN(weight)) {
        errors.push('Peso do produto deve ser um número válido')
      } else if (weight < 0) {
        errors.push('Peso do produto deve ser positivo')
      } else if (weight > 10000) {
        errors.push('Peso do produto deve ser menor que 10000g')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar dados para atualização de produto
  validateUpdate(data) {
    const errors = []

    // Validar nome (opcional na atualização)
    if (data.name !== undefined) {
      if (data.name === null || data.name === '') {
        errors.push('Nome do produto não pode ser vazio')
      } else if (typeof data.name !== 'string') {
        errors.push('Nome do produto deve ser uma string')
      } else if (data.name.trim().length < 2) {
        errors.push('Nome do produto deve ter pelo menos 2 caracteres')
      } else if (data.name.trim().length > 100) {
        errors.push('Nome do produto deve ter no máximo 100 caracteres')
      }
    }

    // Validar peso (opcional na atualização)
    if (data.weight !== undefined) {
      if (data.weight === null) {
        errors.push('Peso do produto não pode ser nulo')
      } else if (typeof data.weight !== 'number' && typeof data.weight !== 'string') {
        errors.push('Peso do produto deve ser um número')
      } else {
        const weight = parseFloat(data.weight)
        if (isNaN(weight)) {
          errors.push('Peso do produto deve ser um número válido')
        } else if (weight < 0) {
          errors.push('Peso do produto deve ser positivo')
        } else if (weight > 10000) {
          errors.push('Peso do produto deve ser menor que 10000g')
        }
      }
    }

    // Verificar se pelo menos um campo foi fornecido
    if (data.name === undefined && data.weight === undefined) {
      errors.push('Pelo menos um campo deve ser fornecido para atualização')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar ID do produto
  validateId(id) {
    const errors = []

    if (!id) {
      errors.push('ID do produto é obrigatório')
    } else if (typeof id !== 'string') {
      errors.push('ID do produto deve ser uma string')
    } else if (id.trim().length === 0) {
      errors.push('ID do produto não pode ser vazio')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar nome do produto para busca
  validateName(name) {
    const errors = []

    if (!name) {
      errors.push('Nome do produto é obrigatório')
    } else if (typeof name !== 'string') {
      errors.push('Nome do produto deve ser uma string')
    } else if (name.trim().length === 0) {
      errors.push('Nome do produto não pode ser vazio')
    } else if (name.trim().length < 2) {
      errors.push('Nome do produto deve ter pelo menos 2 caracteres')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Sanitizar dados de entrada
  sanitize(data) {
    const sanitized = {}

    if (data.name) {
      sanitized.name = data.name.toString().trim()
    }

    if (data.weight !== undefined) {
      sanitized.weight = parseFloat(data.weight)
    }

    return sanitized
  }

  // Validar múltiplos produtos (para bulk operations)
  validateBulk(products) {
    const errors = []
    const validProducts = []

    if (!Array.isArray(products)) {
      return {
        valid: false,
        errors: ['Dados devem ser um array de produtos']
      }
    }

    if (products.length === 0) {
      return {
        valid: false,
        errors: ['Array de produtos não pode ser vazio']
      }
    }

    if (products.length > 100) {
      return {
        valid: false,
        errors: ['Máximo de 100 produtos por operação']
      }
    }

    products.forEach((product, index) => {
      const validation = this.validateCreate(product)
      
      if (!validation.valid) {
        errors.push(`Produto ${index + 1}: ${validation.errors.join(', ')}`)
      } else {
        validProducts.push(this.sanitize(product))
      }
    })

    return {
      valid: errors.length === 0,
      errors: errors,
      validProducts: validProducts
    }
  }
}

module.exports = new ProductValidator() 
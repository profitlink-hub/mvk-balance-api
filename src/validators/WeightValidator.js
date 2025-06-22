class WeightValidator {
  // Validar dados de leitura de peso do Arduino
  validateWeightReading(data) {
    const errors = []

    // Validar nome do produto
    if (!data.productName) {
      errors.push('Nome do produto é obrigatório')
    } else if (typeof data.productName !== 'string') {
      errors.push('Nome do produto deve ser uma string')
    } else if (data.productName.trim().length < 2) {
      errors.push('Nome do produto deve ter pelo menos 2 caracteres')
    } else if (data.productName.trim().length > 100) {
      errors.push('Nome do produto deve ter no máximo 100 caracteres')
    }

    // Validar peso
    if (data.weight === undefined || data.weight === null) {
      errors.push('Peso é obrigatório')
    } else if (typeof data.weight !== 'number' && typeof data.weight !== 'string') {
      errors.push('Peso deve ser um número')
    } else {
      const weight = parseFloat(data.weight)
      if (isNaN(weight)) {
        errors.push('Peso deve ser um número válido')
      } else if (weight < 0) {
        errors.push('Peso deve ser positivo')
      } else if (weight > 50000) {
        errors.push('Peso deve ser menor que 50000g (limite da balança)')
      }
    }

    // Validar timestamp (opcional)
    if (data.timestamp !== undefined) {
      if (data.timestamp === null) {
        errors.push('Timestamp não pode ser nulo')
      } else {
        const timestamp = new Date(data.timestamp)
        if (isNaN(timestamp.getTime())) {
          errors.push('Timestamp deve ser uma data válida')
        } else {
          // Verificar se a data não é muito antiga ou futura
          const now = new Date()
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
          const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
          
          if (timestamp < oneHourAgo) {
            errors.push('Timestamp não pode ser anterior a 1 hora atrás')
          } else if (timestamp > oneHourFromNow) {
            errors.push('Timestamp não pode ser posterior a 1 hora no futuro')
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar filtros para busca de leituras
  validateFilters(filters) {
    const errors = []

    // Validar nome do produto (opcional)
    if (filters.productName !== undefined) {
      if (typeof filters.productName !== 'string') {
        errors.push('Nome do produto deve ser uma string')
      } else if (filters.productName.trim().length === 0) {
        errors.push('Nome do produto não pode ser vazio')
      }
    }

    // Validar datas (opcionais)
    if (filters.startDate !== undefined) {
      const startDate = new Date(filters.startDate)
      if (isNaN(startDate.getTime())) {
        errors.push('Data inicial deve ser uma data válida')
      }
    }

    if (filters.endDate !== undefined) {
      const endDate = new Date(filters.endDate)
      if (isNaN(endDate.getTime())) {
        errors.push('Data final deve ser uma data válida')
      }
    }

    // Validar se data inicial é anterior à final
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      
      if (startDate >= endDate) {
        errors.push('Data inicial deve ser anterior à data final')
      }

      // Verificar se o período não é muito longo (máximo 30 dias)
      const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24)
      if (diffDays > 30) {
        errors.push('Período máximo de consulta é de 30 dias')
      }
    }

    // Validar paginação
    if (filters.limit !== undefined) {
      const limit = parseInt(filters.limit)
      if (isNaN(limit)) {
        errors.push('Limit deve ser um número')
      } else if (limit < 1) {
        errors.push('Limit deve ser maior que 0')
      } else if (limit > 1000) {
        errors.push('Limit máximo é 1000')
      }
    }

    if (filters.offset !== undefined) {
      const offset = parseInt(filters.offset)
      if (isNaN(offset)) {
        errors.push('Offset deve ser um número')
      } else if (offset < 0) {
        errors.push('Offset deve ser maior ou igual a 0')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar parâmetros para busca por período
  validateDateRange(startDate, endDate) {
    const errors = []

    if (!startDate) {
      errors.push('Data inicial é obrigatória')
    } else {
      const start = new Date(startDate)
      if (isNaN(start.getTime())) {
        errors.push('Data inicial deve ser uma data válida')
      }
    }

    if (!endDate) {
      errors.push('Data final é obrigatória')
    } else {
      const end = new Date(endDate)
      if (isNaN(end.getTime())) {
        errors.push('Data final deve ser uma data válida')
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start >= end) {
        errors.push('Data inicial deve ser anterior à data final')
      }

      // Verificar se o período não é muito longo
      const diffDays = (end - start) / (1000 * 60 * 60 * 24)
      if (diffDays > 30) {
        errors.push('Período máximo de consulta é de 30 dias')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar parâmetros para estatísticas
  validateStatisticsParams(productName, days) {
    const errors = []

    // Validar nome do produto (opcional)
    if (productName !== undefined && productName !== null) {
      if (typeof productName !== 'string') {
        errors.push('Nome do produto deve ser uma string')
      } else if (productName.trim().length === 0) {
        errors.push('Nome do produto não pode ser vazio')
      }
    }

    // Validar dias
    if (days !== undefined) {
      if (typeof days !== 'number' && typeof days !== 'string') {
        errors.push('Dias deve ser um número')
      } else {
        const daysNum = parseInt(days)
        if (isNaN(daysNum)) {
          errors.push('Dias deve ser um número válido')
        } else if (daysNum < 1) {
          errors.push('Dias deve ser maior que 0')
        } else if (daysNum > 365) {
          errors.push('Dias deve ser menor ou igual a 365')
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Sanitizar dados de leitura de peso
  sanitizeWeightReading(data) {
    const sanitized = {
      productName: data.productName ? data.productName.toString().trim() : '',
      weight: data.weight !== undefined ? parseFloat(data.weight) : 0
    }

    if (data.timestamp) {
      sanitized.timestamp = new Date(data.timestamp)
    }

    return sanitized
  }

  // Sanitizar filtros
  sanitizeFilters(filters) {
    const sanitized = {}

    if (filters.productName) {
      sanitized.productName = filters.productName.toString().trim()
    }

    if (filters.startDate) {
      sanitized.startDate = new Date(filters.startDate)
    }

    if (filters.endDate) {
      sanitized.endDate = new Date(filters.endDate)
    }

    if (filters.limit) {
      sanitized.limit = parseInt(filters.limit)
    }

    if (filters.offset) {
      sanitized.offset = parseInt(filters.offset)
    }

    return sanitized
  }

  // Validar ID de leitura
  validateReadingId(id) {
    const errors = []

    if (!id) {
      errors.push('ID da leitura é obrigatório')
    } else if (typeof id !== 'string') {
      errors.push('ID da leitura deve ser uma string')
    } else if (id.trim().length === 0) {
      errors.push('ID da leitura não pode ser vazio')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar dados para limpeza de leituras antigas
  validateCleanupParams(keepCount) {
    const errors = []

    if (keepCount !== undefined) {
      if (typeof keepCount !== 'number' && typeof keepCount !== 'string') {
        errors.push('Quantidade a manter deve ser um número')
      } else {
        const count = parseInt(keepCount)
        if (isNaN(count)) {
          errors.push('Quantidade a manter deve ser um número válido')
        } else if (count < 100) {
          errors.push('Quantidade mínima a manter é 100')
        } else if (count > 10000) {
          errors.push('Quantidade máxima a manter é 10000')
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }
}

module.exports = new WeightValidator() 
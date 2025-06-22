class AuthValidator {
  // Validar credenciais de autenticação
  validateCredentials(clientId, clientSecret) {
    const errors = []

    // Validar CLIENT_ID
    if (!clientId) {
      errors.push('CLIENT_ID é obrigatório')
    } else if (typeof clientId !== 'string') {
      errors.push('CLIENT_ID deve ser uma string')
    } else if (clientId.trim().length === 0) {
      errors.push('CLIENT_ID não pode ser vazio')
    } else if (clientId.trim().length < 3) {
      errors.push('CLIENT_ID deve ter pelo menos 3 caracteres')
    } else if (clientId.trim().length > 100) {
      errors.push('CLIENT_ID deve ter no máximo 100 caracteres')
    }

    // Validar CLIENT_SECRET
    if (!clientSecret) {
      errors.push('CLIENT_SECRET é obrigatório')
    } else if (typeof clientSecret !== 'string') {
      errors.push('CLIENT_SECRET deve ser uma string')
    } else if (clientSecret.trim().length === 0) {
      errors.push('CLIENT_SECRET não pode ser vazio')
    } else if (clientSecret.trim().length < 8) {
      errors.push('CLIENT_SECRET deve ter pelo menos 8 caracteres')
    } else if (clientSecret.trim().length > 200) {
      errors.push('CLIENT_SECRET deve ter no máximo 200 caracteres')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar dados para criação de cliente
  validateClientCreation(data) {
    const errors = []

    // Validar nome do cliente
    if (!data.name) {
      errors.push('Nome do cliente é obrigatório')
    } else if (typeof data.name !== 'string') {
      errors.push('Nome do cliente deve ser uma string')
    } else if (data.name.trim().length < 2) {
      errors.push('Nome do cliente deve ter pelo menos 2 caracteres')
    } else if (data.name.trim().length > 100) {
      errors.push('Nome do cliente deve ter no máximo 100 caracteres')
    }

    // Validar CLIENT_ID (opcional - será gerado se não fornecido)
    if (data.clientId !== undefined) {
      if (typeof data.clientId !== 'string') {
        errors.push('CLIENT_ID deve ser uma string')
      } else if (data.clientId.trim().length < 3) {
        errors.push('CLIENT_ID deve ter pelo menos 3 caracteres')
      } else if (data.clientId.trim().length > 100) {
        errors.push('CLIENT_ID deve ter no máximo 100 caracteres')
      } else if (!/^[a-zA-Z0-9_-]+$/.test(data.clientId.trim())) {
        errors.push('CLIENT_ID deve conter apenas letras, números, _ e -')
      }
    }

    // Validar CLIENT_SECRET (opcional - será gerado se não fornecido)
    if (data.clientSecret !== undefined) {
      if (typeof data.clientSecret !== 'string') {
        errors.push('CLIENT_SECRET deve ser uma string')
      } else if (data.clientSecret.trim().length < 8) {
        errors.push('CLIENT_SECRET deve ter pelo menos 8 caracteres')
      } else if (data.clientSecret.trim().length > 200) {
        errors.push('CLIENT_SECRET deve ter no máximo 200 caracteres')
      }
    }

    // Validar isActive (opcional)
    if (data.isActive !== undefined) {
      if (typeof data.isActive !== 'boolean') {
        errors.push('isActive deve ser um valor booleano')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar dados para atualização de cliente
  validateClientUpdate(data) {
    const errors = []

    // Validar nome (opcional na atualização)
    if (data.name !== undefined) {
      if (data.name === null || data.name === '') {
        errors.push('Nome do cliente não pode ser vazio')
      } else if (typeof data.name !== 'string') {
        errors.push('Nome do cliente deve ser uma string')
      } else if (data.name.trim().length < 2) {
        errors.push('Nome do cliente deve ter pelo menos 2 caracteres')
      } else if (data.name.trim().length > 100) {
        errors.push('Nome do cliente deve ter no máximo 100 caracteres')
      }
    }

    // Validar CLIENT_SECRET (opcional na atualização)
    if (data.clientSecret !== undefined) {
      if (data.clientSecret === null || data.clientSecret === '') {
        errors.push('CLIENT_SECRET não pode ser vazio')
      } else if (typeof data.clientSecret !== 'string') {
        errors.push('CLIENT_SECRET deve ser uma string')
      } else if (data.clientSecret.trim().length < 8) {
        errors.push('CLIENT_SECRET deve ter pelo menos 8 caracteres')
      } else if (data.clientSecret.trim().length > 200) {
        errors.push('CLIENT_SECRET deve ter no máximo 200 caracteres')
      }
    }

    // Validar isActive (opcional na atualização)
    if (data.isActive !== undefined) {
      if (typeof data.isActive !== 'boolean') {
        errors.push('isActive deve ser um valor booleano')
      }
    }

    // Verificar se pelo menos um campo foi fornecido
    if (data.name === undefined && 
        data.clientSecret === undefined && 
        data.isActive === undefined) {
      errors.push('Pelo menos um campo deve ser fornecido para atualização')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar ID do cliente
  validateClientId(id) {
    const errors = []

    if (!id) {
      errors.push('ID do cliente é obrigatório')
    } else if (typeof id !== 'string') {
      errors.push('ID do cliente deve ser uma string')
    } else if (id.trim().length === 0) {
      errors.push('ID do cliente não pode ser vazio')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar CLIENT_ID para busca
  validateClientIdForSearch(clientId) {
    const errors = []

    if (!clientId) {
      errors.push('CLIENT_ID é obrigatório')
    } else if (typeof clientId !== 'string') {
      errors.push('CLIENT_ID deve ser uma string')
    } else if (clientId.trim().length === 0) {
      errors.push('CLIENT_ID não pode ser vazio')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Sanitizar dados de criação de cliente
  sanitizeClientCreation(data) {
    const sanitized = {}

    if (data.name) {
      sanitized.name = data.name.toString().trim()
    }

    if (data.clientId) {
      sanitized.clientId = data.clientId.toString().trim()
    }

    if (data.clientSecret) {
      sanitized.clientSecret = data.clientSecret.toString().trim()
    }

    if (data.isActive !== undefined) {
      sanitized.isActive = Boolean(data.isActive)
    }

    return sanitized
  }

  // Sanitizar dados de atualização de cliente
  sanitizeClientUpdate(data) {
    const sanitized = {}

    if (data.name !== undefined) {
      sanitized.name = data.name ? data.name.toString().trim() : null
    }

    if (data.clientSecret !== undefined) {
      sanitized.clientSecret = data.clientSecret ? data.clientSecret.toString().trim() : null
    }

    if (data.isActive !== undefined) {
      sanitized.isActive = Boolean(data.isActive)
    }

    return sanitized
  }

  // Validar nome de cliente para geração de CLIENT_ID
  validateClientNameForId(name) {
    const errors = []

    if (!name) {
      errors.push('Nome é obrigatório para gerar CLIENT_ID')
    } else if (typeof name !== 'string') {
      errors.push('Nome deve ser uma string')
    } else if (name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar força do CLIENT_SECRET
  validateSecretStrength(secret) {
    const errors = []
    const warnings = []

    if (!secret || typeof secret !== 'string') {
      errors.push('CLIENT_SECRET inválido')
      return { valid: false, errors, warnings }
    }

    const trimmedSecret = secret.trim()

    // Verificações de segurança
    if (trimmedSecret.length < 12) {
      warnings.push('CLIENT_SECRET recomendado ter pelo menos 12 caracteres')
    }

    if (!/[a-z]/.test(trimmedSecret)) {
      warnings.push('CLIENT_SECRET recomendado ter pelo menos uma letra minúscula')
    }

    if (!/[A-Z]/.test(trimmedSecret)) {
      warnings.push('CLIENT_SECRET recomendado ter pelo menos uma letra maiúscula')
    }

    if (!/[0-9]/.test(trimmedSecret)) {
      warnings.push('CLIENT_SECRET recomendado ter pelo menos um número')
    }

    if (!/[^a-zA-Z0-9]/.test(trimmedSecret)) {
      warnings.push('CLIENT_SECRET recomendado ter pelo menos um caractere especial')
    }

    // Verificar padrões fracos
    const weakPatterns = [
      /123456/,
      /password/i,
      /secret/i,
      /admin/i,
      /qwerty/i
    ]

    weakPatterns.forEach(pattern => {
      if (pattern.test(trimmedSecret)) {
        warnings.push('CLIENT_SECRET contém padrão fraco')
      }
    })

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      strength: this.calculateSecretStrength(trimmedSecret)
    }
  }

  // Calcular força do CLIENT_SECRET
  calculateSecretStrength(secret) {
    let score = 0

    // Comprimento
    if (secret.length >= 8) score += 1
    if (secret.length >= 12) score += 1
    if (secret.length >= 16) score += 1

    // Complexidade
    if (/[a-z]/.test(secret)) score += 1
    if (/[A-Z]/.test(secret)) score += 1
    if (/[0-9]/.test(secret)) score += 1
    if (/[^a-zA-Z0-9]/.test(secret)) score += 1

    // Variedade
    const uniqueChars = new Set(secret.split('')).size
    if (uniqueChars >= secret.length * 0.7) score += 1

    if (score <= 2) return 'fraco'
    if (score <= 4) return 'médio'
    if (score <= 6) return 'forte'
    return 'muito_forte'
  }
}

module.exports = new AuthValidator() 
const ProductService = require('./ProductService')

class ArduinoService {
  constructor() {
    this.productService = new ProductService()
  }

  // Validar dados de movimentação de peso recebidos do Arduino
  validateWeightMovementData(data) {
    try {
      // Verificar se é formato único ou múltiplo
      if (this.isSingleMovement(data)) {
        return this.validateSingleMovement(data)
      } else if (this.isMultipleMovement(data)) {
        return this.validateMultipleMovement(data)
      } else {
        return {
          valid: false,
          errors: ['Formato de dados não reconhecido. Deve ser movimento único ou múltiplo.']
        }
      }
    } catch (error) {
      return {
        valid: false,
        errors: ['Erro ao validar dados: ' + error.message]
      }
    }
  }

  // Verificar se é movimento único
  isSingleMovement(data) {
    return data.nome && data.peso && data.acao && data.ts && !data.produtos
  }

  // Verificar se é movimento múltiplo
  isMultipleMovement(data) {
    return data.acao && data.quantidade && Array.isArray(data.produtos) && data.ts
  }

  // Validar movimento único
  validateSingleMovement(data) {
    const errors = []

    if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
      errors.push('Nome do produto é obrigatório e deve ser uma string válida')
    }

    if (data.peso === undefined || data.peso === null || isNaN(parseFloat(data.peso))) {
      errors.push('Peso é obrigatório e deve ser um número válido')
    }

    if (!data.acao || typeof data.acao !== 'string') {
      errors.push('Ação é obrigatória')
    } else if (!['RETIRADO', 'COLOCADO'].includes(data.acao.toUpperCase())) {
      errors.push('Ação deve ser "RETIRADO" ou "COLOCADO"')
    }

    if (!data.ts || isNaN(parseInt(data.ts))) {
      errors.push('Timestamp (ts) é obrigatório e deve ser um número válido')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Validar movimento múltiplo
  validateMultipleMovement(data) {
    const errors = []

    if (!data.acao || typeof data.acao !== 'string') {
      errors.push('Ação é obrigatória')
    } else if (!['RETIRADOS', 'COLOCADOS'].includes(data.acao.toUpperCase())) {
      errors.push('Ação deve ser "RETIRADOS" ou "COLOCADOS"')
    }

    if (!data.quantidade || isNaN(parseInt(data.quantidade)) || parseInt(data.quantidade) <= 0) {
      errors.push('Quantidade deve ser um número positivo')
    }

    if (!Array.isArray(data.produtos) || data.produtos.length === 0) {
      errors.push('Lista de produtos é obrigatória e não pode estar vazia')
    } else {
      // Validar quantidade vs array de produtos
      if (parseInt(data.quantidade) !== data.produtos.length) {
        errors.push('Quantidade informada não confere com o número de produtos na lista')
      }

      // Validar cada produto
      data.produtos.forEach((produto, index) => {
        if (!produto.nome || typeof produto.nome !== 'string' || produto.nome.trim().length === 0) {
          errors.push(`Produto ${index + 1}: Nome é obrigatório e deve ser uma string válida`)
        }

        if (produto.peso === undefined || produto.peso === null || isNaN(parseFloat(produto.peso))) {
          errors.push(`Produto ${index + 1}: Peso é obrigatório e deve ser um número válido`)
        }

        if (produto.id === undefined || produto.id === null || isNaN(parseInt(produto.id))) {
          errors.push(`Produto ${index + 1}: ID é obrigatório e deve ser um número válido`)
        }
      })
    }

    if (!data.ts || isNaN(parseInt(data.ts))) {
      errors.push('Timestamp (ts) é obrigatório e deve ser um número válido')
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }

  // Processar movimentação de peso
  async processWeightMovement(data) {
    try {
      let movements = []

      if (this.isSingleMovement(data)) {
        // Movimento único
        movements.push({
          productName: data.nome.trim(),
          weight: parseFloat(data.peso),
          action: data.acao.toUpperCase(),
          timestamp: new Date(parseInt(data.ts)),
          arduinoId: null
        })
      } else {
        // Movimento múltiplo
        const action = data.acao.toUpperCase() === 'COLOCADOS' ? 'COLOCADO' : 'RETIRADO'
        
        movements = data.produtos.map(produto => ({
          productName: produto.nome.trim(),
          weight: parseFloat(produto.peso),
          action: action,
          timestamp: new Date(parseInt(data.ts)),
          arduinoId: parseInt(produto.id)
        }))
      }

      return {
        success: true,
        data: {
          type: this.isSingleMovement(data) ? 'single' : 'multiple',
          totalItems: movements.length,
          movements: movements
        },
        message: `${movements.length} movimentação(ões) processada(s) com sucesso`
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao processar movimentação: ' + error.message
      }
    }
  }

  // Obter status simulado do Arduino
  getArduinoStatus() {
    return {
      success: true,
      data: {
        status: 'connected',
        lastPing: new Date().toISOString(),
        uptime: Math.floor(Math.random() * 86400), // segundos aleatórios
        memoryUsage: Math.floor(Math.random() * 100), // porcentagem
        scale: {
          calibrated: true,
          reading: true,
          lastReading: {
            weight: Math.random() * 1000,
            timestamp: new Date().toISOString()
          }
        }
      }
    }
  }

  // Obter informações de comunicação com Arduino
  getArduinoCommunicationInfo() {
    return {
      success: true,
      data: {
        communication: {
          direction: 'Arduino → API',
          description: 'O Arduino envia dados de movimentação para a API'
        },
        supportedActions: [
          'RETIRADO',
          'COLOCADO', 
          'RETIRADOS',
          'COLOCADOS'
        ],
        dataFormats: {
          single: {
            description: 'Movimento único de produto',
            example: {
              nome: 'cerveja',
              peso: 335.1,
              acao: 'RETIRADO',
              ts: 214022
            }
          },
          multiple: {
            description: 'Movimento múltiplo de produtos',
            example: {
              acao: 'COLOCADOS',
              quantidade: 3,
              produtos: [
                { nome: 'cerveja', peso: 347.0, id: 0 },
                { nome: 'cerveja', peso: 347.3, id: 1 },
                { nome: '2MA', peso: 90.5, id: 3 }
              ],
              ts: 188787
            }
          }
        },
        endpoint: 'POST /arduino/weight-movement'
      }
    }
  }
}

module.exports = ArduinoService 
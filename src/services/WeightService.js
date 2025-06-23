const WeightReadingRepository = require('../infra/repositories/WeightReadingRepository')
const ProductService = require('./ProductService')

class WeightService {
  constructor() {
    this.weightReadingRepository = new WeightReadingRepository()
    this.productService = new ProductService()
  }

  // Registrar leitura de peso (enviada pelo Arduino)
  async recordWeightReading(readingData) {
    try {
      // Validações de negócio
      if (!readingData.productName || readingData.productName.trim().length < 2) {
        throw new Error('Nome do produto deve ter pelo menos 2 caracteres')
      }

      if (readingData.weight === undefined || readingData.weight < 0) {
        throw new Error('Peso deve ser um número positivo')
      }

      // Verificar se o produto existe
      const productResult = await this.productService.getProductByName(readingData.productName)
      if (!productResult.success) {
        // Se o produto não existe, criar automaticamente
        const newProductResult = await this.productService.createProduct({
          name: readingData.productName,
          weight: readingData.weight
        })

        if (!newProductResult.success) {
          throw new Error(`Erro ao criar produto automaticamente: ${newProductResult.error}`)
        }
      }

      // Criar leitura de peso
      const createData = {
        productName: readingData.productName.trim(),
        weight: parseFloat(readingData.weight),
        timestamp: readingData.timestamp ? new Date(readingData.timestamp) : new Date()
      }

      // Adicionar campos opcionais do Arduino se presentes
      if (readingData.action !== undefined) {
        createData.action = readingData.action
      }
      if (readingData.arduinoId !== undefined) {
        createData.arduinoId = readingData.arduinoId
      }
      if (readingData.dayOfWeek !== undefined) {
        createData.dayOfWeek = readingData.dayOfWeek
      }

      const reading = await this.weightReadingRepository.create(createData)

      return {
        success: true,
        data: reading.toJSON(),
        message: 'Leitura de peso registrada com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Buscar leitura por ID
  async getReadingById(id) {
    try {
      const reading = await this.weightReadingRepository.findById(id)
      
      if (!reading) {
        return {
          success: false,
          error: 'Leitura não encontrada'
        }
      }

      return {
        success: true,
        data: reading.toJSON()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Listar todas as leituras com filtros
  async getAllReadings(filters = {}) {
    try {
      const options = {}

      // Aplicar filtros
      if (filters.productName) {
        options.productName = filters.productName
      }

      if (filters.startDate && filters.endDate) {
        options.startDate = filters.startDate
        options.endDate = filters.endDate
      }

      // Aplicar paginação
      if (filters.limit) {
        options.limit = parseInt(filters.limit)
        options.offset = filters.offset ? parseInt(filters.offset) : 0
      }

      const readings = await this.weightReadingRepository.findAll(options)
      
      return {
        success: true,
        data: readings.map(reading => reading.toJSON()),
        total: readings.length,
        filters: filters
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Buscar últimas leituras por produto
  async getLatestReadingsByProduct(productName, limit = 10) {
    try {
      if (!productName || productName.trim().length < 2) {
        throw new Error('Nome do produto deve ter pelo menos 2 caracteres')
      }

      const readings = await this.weightReadingRepository.findLatestByProduct(
        productName.trim(), 
        parseInt(limit)
      )
      
      return {
        success: true,
        data: readings.map(reading => reading.toJSON()),
        productName: productName.trim(),
        total: readings.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Buscar leituras por período
  async getReadingsByDateRange(startDate, endDate) {
    try {
      if (!startDate || !endDate) {
        throw new Error('Data inicial e final são obrigatórias')
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Datas devem estar em formato válido')
      }

      if (start > end) {
        throw new Error('Data inicial deve ser anterior à data final')
      }

      const readings = await this.weightReadingRepository.findByDateRange(start, end)
      
      return {
        success: true,
        data: readings.map(reading => reading.toJSON()),
        period: {
          startDate: start,
          endDate: end
        },
        total: readings.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Obter estatísticas de peso
  async getWeightStatistics(productName = null, days = 7) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const options = {
        startDate,
        endDate
      }

      if (productName) {
        options.productName = productName
      }

      const readings = await this.weightReadingRepository.findAll(options)

      if (readings.length === 0) {
        return {
          success: true,
          data: {
            totalReadings: 0,
            averageWeight: 0,
            minWeight: 0,
            maxWeight: 0,
            productName: productName || 'Todos os produtos',
            period: { startDate, endDate, days }
          }
        }
      }

      const weights = readings.map(r => r.weight)
      const averageWeight = weights.reduce((sum, weight) => sum + weight, 0) / weights.length
      const minWeight = Math.min(...weights)
      const maxWeight = Math.max(...weights)

      return {
        success: true,
        data: {
          totalReadings: readings.length,
          averageWeight: parseFloat(averageWeight.toFixed(2)),
          minWeight,
          maxWeight,
          productName: productName || 'Todos os produtos',
          period: { startDate, endDate, days }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Registrar movimentações de peso recebidas do Arduino
  async registerArduinoMovements(movements) {
    try {
      if (!Array.isArray(movements) || movements.length === 0) {
        throw new Error('Lista de movimentações é obrigatória')
      }

      const results = []
      const errors = []

      // Obter timestamp atual e dia da semana
      const currentTimestamp = new Date()
      const daysOfWeek = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
      const dayOfWeek = daysOfWeek[currentTimestamp.getDay()]

      for (let i = 0; i < movements.length; i++) {
        const movement = movements[i]
        
        try {
          // Registrar cada movimentação como uma leitura de peso
          const readingResult = await this.recordWeightReading({
            productName: movement.productName,
            weight: movement.weight,
            timestamp: currentTimestamp,
            action: movement.action,
            arduinoId: movement.arduinoId,
            dayOfWeek: dayOfWeek
          })

          if (readingResult.success) {
            results.push({
              ...readingResult.data,
              action: movement.action,
              arduinoId: movement.arduinoId,
              dayOfWeek: dayOfWeek
            })
          } else {
            errors.push({
              movement: movement,
              error: readingResult.error
            })
          }
        } catch (error) {
          errors.push({
            movement: movement,
            error: error.message
          })
        }
      }

      return {
        success: true,
        data: {
          registered: results,
          errors: errors,
          totalMovements: movements.length,
          successCount: results.length,
          errorCount: errors.length
        },
        message: `${results.length} de ${movements.length} movimentações registradas com sucesso`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Limpar leituras antigas
  async cleanupOldReadings(keepCount = 1000) {
    try {
      const removedCount = await this.weightReadingRepository.cleanup(keepCount)
      
      return {
        success: true,
        message: `${removedCount} leituras antigas foram removidas`,
        removedCount,
        keepCount
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

module.exports = WeightService 
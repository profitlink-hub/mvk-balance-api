const WeightService = require('../services/WeightService')
const WeightValidator = require('../validators/WeightValidator')

class WeightController {
  constructor() {
    this.weightService = new WeightService()
  }

  // POST /weight/readings - Registrar leitura de peso (usado pelo Arduino)
  async recordWeightReading(req, res) {
    try {
      // Validar dados de entrada
      const validation = WeightValidator.validateWeightReading(req.body)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      // Sanitizar dados
      const sanitizedData = WeightValidator.sanitizeWeightReading(req.body)

      const result = await this.weightService.recordWeightReading(sanitizedData)
      
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Erro em recordWeightReading:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /weight/readings - Listar leituras com filtros
  async getAllReadings(req, res) {
    try {
      // Validar filtros
      const validation = WeightValidator.validateFilters(req.query)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Filtros inválidos',
          details: validation.errors
        })
      }

      // Sanitizar filtros
      const sanitizedFilters = WeightValidator.sanitizeFilters(req.query)

      const result = await this.weightService.getAllReadings(sanitizedFilters)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em getAllReadings:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /weight/readings/:id - Buscar leitura por ID
  async getReadingById(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = WeightValidator.validateReadingId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: validation.errors
        })
      }

      const result = await this.weightService.getReadingById(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Leitura não encontrada' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getReadingById:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /weight/readings/product/:productName - Buscar leituras por produto
  async getLatestReadingsByProduct(req, res) {
    try {
      const { productName } = req.params
      const limit = req.query.limit || 10

      // Decodificar nome do produto
      const decodedProductName = decodeURIComponent(productName)

      // Validar nome do produto
      if (!decodedProductName || decodedProductName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Nome do produto deve ter pelo menos 2 caracteres'
        })
      }

      const result = await this.weightService.getLatestReadingsByProduct(decodedProductName, limit)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Erro em getLatestReadingsByProduct:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /weight/readings/period - Buscar leituras por período
  async getReadingsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query

      // Validar período
      const validation = WeightValidator.validateDateRange(startDate, endDate)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Período inválido',
          details: validation.errors
        })
      }

      const result = await this.weightService.getReadingsByDateRange(startDate, endDate)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Erro em getReadingsByDateRange:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /weight/statistics - Obter estatísticas de peso
  async getWeightStatistics(req, res) {
    try {
      const { productName, days } = req.query

      // Validar parâmetros
      const validation = WeightValidator.validateStatisticsParams(productName, days)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros inválidos',
          details: validation.errors
        })
      }

      const result = await this.weightService.getWeightStatistics(
        productName, 
        days ? parseInt(days) : 7
      )
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em getWeightStatistics:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // DELETE /weight/readings/cleanup - Limpar leituras antigas
  async cleanupOldReadings(req, res) {
    try {
      const { keepCount } = req.body

      // Validar parâmetros
      const validation = WeightValidator.validateCleanupParams(keepCount)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros inválidos',
          details: validation.errors
        })
      }

      const result = await this.weightService.cleanupOldReadings(
        keepCount ? parseInt(keepCount) : 1000
      )
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em cleanupOldReadings:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /weight/latest - Buscar últimas leituras gerais
  async getLatestReadings(req, res) {
    try {
      const limit = req.query.limit || 20

      const result = await this.weightService.getAllReadings({ 
        limit: parseInt(limit) 
      })
      
      if (result.success) {
        res.status(200).json({
          ...result,
          message: `Últimas ${result.data.length} leituras`
        })
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em getLatestReadings:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /weight/summary - Resumo geral das leituras
  async getReadingsSummary(req, res) {
    try {
      // Buscar estatísticas gerais
      const statsResult = await this.weightService.getWeightStatistics(null, 7)
      
      // Buscar últimas leituras
      const latestResult = await this.weightService.getAllReadings({ limit: 5 })

      if (statsResult.success && latestResult.success) {
        res.status(200).json({
          success: true,
          data: {
            statistics: statsResult.data,
            latestReadings: latestResult.data,
            summary: {
              totalReadingsLast7Days: statsResult.data.totalReadings,
              averageWeight: statsResult.data.averageWeight,
              latestReadingsCount: latestResult.data.length
            }
          },
          message: 'Resumo das leituras obtido com sucesso'
        })
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao obter resumo das leituras'
        })
      }
    } catch (error) {
      console.error('Erro em getReadingsSummary:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = WeightController 
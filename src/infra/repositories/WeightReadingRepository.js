const WeightReading = require('../models/WeightReading')
const { v4: uuidv4 } = require('uuid')

class WeightReadingRepository {
  constructor() {
    // Simulando base de dados em memória
    this.readings = new Map()
  }

  // Criar leitura de peso
  async create(readingData) {
    const id = uuidv4()
    const reading = new WeightReading({
      id,
      ...readingData,
      timestamp: readingData.timestamp || new Date()
    })

    if (!reading.isValid()) {
      throw new Error('Dados da leitura inválidos')
    }

    this.readings.set(id, reading)
    return reading
  }

  // Buscar leitura por ID
  async findById(id) {
    return this.readings.get(id) || null
  }

  // Listar todas as leituras
  async findAll(options = {}) {
    let readings = Array.from(this.readings.values())
    
    // Filtrar por produto se especificado
    if (options.productName) {
      readings = readings.filter(reading => 
        reading.productName.toLowerCase().includes(options.productName.toLowerCase())
      )
    }

    // Filtrar por data se especificado
    if (options.startDate && options.endDate) {
      const start = new Date(options.startDate)
      const end = new Date(options.endDate)
      readings = readings.filter(reading => 
        reading.timestamp >= start && reading.timestamp <= end
      )
    }

    // Ordenar por timestamp (mais recente primeiro)
    readings.sort((a, b) => b.timestamp - a.timestamp)

    // Aplicar paginação se especificado
    if (options.limit) {
      const offset = options.offset || 0
      readings = readings.slice(offset, offset + options.limit)
    }

    return readings
  }

  // Buscar últimas leituras por produto
  async findLatestByProduct(productName, limit = 10) {
    const readings = Array.from(this.readings.values())
      .filter(reading => reading.productName.toLowerCase() === productName.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
    
    return readings
  }

  // Buscar leituras por período
  async findByDateRange(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return Array.from(this.readings.values())
      .filter(reading => reading.timestamp >= start && reading.timestamp <= end)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // Deletar leitura
  async delete(id) {
    return this.readings.delete(id)
  }

  // Limpar leituras antigas (manter apenas as N mais recentes)
  async cleanup(keepCount = 1000) {
    const readings = Array.from(this.readings.values())
      .sort((a, b) => b.timestamp - a.timestamp)
    
    if (readings.length > keepCount) {
      const toRemove = readings.slice(keepCount)
      toRemove.forEach(reading => {
        this.readings.delete(reading.id)
      })
      return toRemove.length
    }
    
    return 0
  }
}

module.exports = WeightReadingRepository 
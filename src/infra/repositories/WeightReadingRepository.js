const WeightReading = require('../models/WeightReading')
const { v4: uuidv4 } = require('uuid')
const supabaseConfig = require('../database/supabase.config')

class WeightReadingRepository {
  constructor() {
    this.tableName = 'weight_readings'
    
    // Fallback para desenvolvimento sem Supabase (inicialização lazy)
    this.readings = new Map() // Sempre inicializar para fallback
  }

  // Verificar se deve usar memória (lazy check)
  _shouldUseMemory() {
    return !supabaseConfig.isConnected()
  }

  // Converter dados do banco para modelo
  _mapToModel(dbData) {
    if (!dbData) return null

    const readingData = {
      id: dbData.id,
      productName: dbData.product_name,
      weight: parseFloat(dbData.weight),
      timestamp: new Date(dbData.timestamp),
      createdAt: new Date(dbData.created_at)
    }

    // Adicionar campos opcionais se existirem
    if (dbData.action !== null && dbData.action !== undefined) {
      readingData.action = dbData.action
    }
    if (dbData.arduino_id !== null && dbData.arduino_id !== undefined) {
      readingData.arduinoId = dbData.arduino_id
    }

    return new WeightReading(readingData)
  }

  // Converter modelo para dados do banco
  _mapToDb(reading) {
    const dbData = {
      id: reading.id,
      product_name: reading.productName,
      weight: reading.weight,
      timestamp: reading.timestamp,
      created_at: reading.createdAt || new Date()
    }

    // Adicionar campos opcionais se existirem
    if (reading.action !== undefined) {
      dbData.action = reading.action
    }
    if (reading.arduinoId !== undefined) {
      dbData.arduino_id = reading.arduinoId
    }

    return dbData
  }

  // Criar leitura de peso
  async create(readingData) {
    const id = uuidv4()
    const reading = new WeightReading({
      id,
      ...readingData
    })

    if (!reading.isValid()) {
      throw new Error('Dados da leitura inválidos')
    }

    if (this._shouldUseMemory()) {
      this.readings.set(id, reading)
      return reading
    }

    try {
      const dbData = this._mapToDb(reading)
      const result = await supabaseConfig.query(
        `INSERT INTO ${this.tableName} (id, product_name, weight, action, arduino_id, timestamp, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          dbData.id, 
          dbData.product_name, 
          dbData.weight, 
          dbData.action || null,
          dbData.arduino_id || null,
          dbData.timestamp, 
          dbData.created_at
        ]
      )

      return this._mapToModel(result.rows[0])
    } catch (error) {
      console.error('Erro ao criar leitura de peso:', error)
      throw error
    }
  }

  // Buscar leitura por ID
  async findById(id) {
    if (this._shouldUseMemory()) {
      return this.readings.get(id) || null
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      console.error('Erro ao buscar leitura por ID:', error)
      return null
    }
  }

  // Listar todas as leituras com filtros opcionais
  async findAll(options = {}) {
    if (this._shouldUseMemory()) {
      let readings = Array.from(this.readings.values())

      // Aplicar filtros
      if (options.productName) {
        readings = readings.filter(r => 
          r.productName.toLowerCase().includes(options.productName.toLowerCase())
        )
      }

      if (options.startDate && options.endDate) {
        const start = new Date(options.startDate)
        const end = new Date(options.endDate)
        readings = readings.filter(r => r.timestamp >= start && r.timestamp <= end)
      }

      // Ordenar por timestamp decrescente
      readings.sort((a, b) => b.timestamp - a.timestamp)

      // Aplicar paginação
      if (options.limit) {
        const offset = options.offset || 0
        readings = readings.slice(offset, offset + options.limit)
      }

      return readings
    }

    try {
      let query = `SELECT * FROM ${this.tableName} WHERE 1=1`
      const params = []
      let paramIndex = 1

      // Aplicar filtros
      if (options.productName) {
        query += ` AND LOWER(product_name) LIKE LOWER($${paramIndex})`
        params.push(`%${options.productName}%`)
        paramIndex++
      }

      if (options.startDate && options.endDate) {
        query += ` AND timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`
        params.push(options.startDate, options.endDate)
        paramIndex += 2
      }

      query += ` ORDER BY timestamp DESC`

      // Aplicar paginação
      if (options.limit) {
        query += ` LIMIT $${paramIndex}`
        params.push(options.limit)
        paramIndex++

        if (options.offset) {
          query += ` OFFSET $${paramIndex}`
          params.push(options.offset)
        }
      }

      const result = await supabaseConfig.query(query, params)
      return result.rows.map(row => this._mapToModel(row))
    } catch (error) {
      console.error('Erro ao listar leituras:', error)
      return []
    }
  }

  // Buscar últimas leituras por produto
  async findLatestByProduct(productName, limit = 10) {
    if (this._shouldUseMemory()) {
      const readings = Array.from(this.readings.values())
        .filter(r => r.productName.toLowerCase() === productName.toLowerCase())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
      
      return readings
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName}
         WHERE LOWER(product_name) = LOWER($1)
         ORDER BY timestamp DESC
         LIMIT $2`,
        [productName, limit]
      )

      return result.rows.map(row => this._mapToModel(row))
    } catch (error) {
      console.error('Erro ao buscar últimas leituras por produto:', error)
      return []
    }
  }

  // Buscar leituras por período
  async findByDateRange(startDate, endDate) {
    if (this._shouldUseMemory()) {
      const readings = Array.from(this.readings.values())
        .filter(r => r.timestamp >= startDate && r.timestamp <= endDate)
        .sort((a, b) => b.timestamp - a.timestamp)
      
      return readings
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName}
         WHERE timestamp BETWEEN $1 AND $2
         ORDER BY timestamp DESC`,
        [startDate, endDate]
      )

      return result.rows.map(row => this._mapToModel(row))
    } catch (error) {
      console.error('Erro ao buscar leituras por período:', error)
      return []
    }
  }

  // Obter estatísticas de leituras
  async getStatistics(options = {}) {
    if (this._shouldUseMemory()) {
      let readings = Array.from(this.readings.values())

      // Aplicar filtros
      if (options.productName) {
        readings = readings.filter(r => 
          r.productName.toLowerCase().includes(options.productName.toLowerCase())
        )
      }

      if (options.startDate && options.endDate) {
        readings = readings.filter(r => 
          r.timestamp >= options.startDate && r.timestamp <= options.endDate
        )
      }

      if (readings.length === 0) {
        return {
          total: 0,
          averageWeight: 0,
          minWeight: 0,
          maxWeight: 0,
          firstReading: null,
          lastReading: null
        }
      }

      const weights = readings.map(r => r.weight)
      const sortedByDate = readings.sort((a, b) => a.timestamp - b.timestamp)

      return {
        total: readings.length,
        averageWeight: weights.reduce((sum, w) => sum + w, 0) / weights.length,
        minWeight: Math.min(...weights),
        maxWeight: Math.max(...weights),
        firstReading: sortedByDate[0].timestamp,
        lastReading: sortedByDate[sortedByDate.length - 1].timestamp
      }
    }

    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          AVG(weight) as average_weight,
          MIN(weight) as min_weight,
          MAX(weight) as max_weight,
          MIN(timestamp) as first_reading,
          MAX(timestamp) as last_reading
        FROM ${this.tableName}
        WHERE 1=1
      `
      const params = []
      let paramIndex = 1

      // Aplicar filtros
      if (options.productName) {
        query += ` AND LOWER(product_name) LIKE LOWER($${paramIndex})`
        params.push(`%${options.productName}%`)
        paramIndex++
      }

      if (options.startDate && options.endDate) {
        query += ` AND timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`
        params.push(options.startDate, options.endDate)
      }

      const result = await supabaseConfig.query(query, params)
      const row = result.rows[0]

      return {
        total: parseInt(row.total),
        averageWeight: parseFloat(row.average_weight) || 0,
        minWeight: parseFloat(row.min_weight) || 0,
        maxWeight: parseFloat(row.max_weight) || 0,
        firstReading: row.first_reading ? new Date(row.first_reading) : null,
        lastReading: row.last_reading ? new Date(row.last_reading) : null
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return {
        total: 0,
        averageWeight: 0,
        minWeight: 0,
        maxWeight: 0,
        firstReading: null,
        lastReading: null
      }
    }
  }

  // Obter resumo por produto
  async getSummaryByProduct() {
    if (this._shouldUseMemory()) {
      const summary = new Map()
      
      for (const reading of this.readings.values()) {
        const productName = reading.productName
        
        if (!summary.has(productName)) {
          summary.set(productName, {
            productName,
            totalReadings: 0,
            weights: [],
            firstReading: reading.timestamp,
            lastReading: reading.timestamp
          })
        }
        
        const productSummary = summary.get(productName)
        productSummary.totalReadings++
        productSummary.weights.push(reading.weight)
        
        if (reading.timestamp < productSummary.firstReading) {
          productSummary.firstReading = reading.timestamp
        }
        if (reading.timestamp > productSummary.lastReading) {
          productSummary.lastReading = reading.timestamp
        }
      }
      
      return Array.from(summary.values()).map(item => ({
        productName: item.productName,
        totalReadings: item.totalReadings,
        averageWeight: item.weights.reduce((sum, w) => sum + w, 0) / item.weights.length,
        minWeight: Math.min(...item.weights),
        maxWeight: Math.max(...item.weights),
        firstReading: item.firstReading,
        lastReading: item.lastReading
      }))
    }

    try {
      const result = await supabaseConfig.query(`
        SELECT 
          product_name,
          COUNT(*) as total_readings,
          AVG(weight) as average_weight,
          MIN(weight) as min_weight,
          MAX(weight) as max_weight,
          MIN(timestamp) as first_reading,
          MAX(timestamp) as last_reading
        FROM ${this.tableName}
        GROUP BY product_name
        ORDER BY total_readings DESC
      `)

      return result.rows.map(row => ({
        productName: row.product_name,
        totalReadings: parseInt(row.total_readings),
        averageWeight: parseFloat(row.average_weight),
        minWeight: parseFloat(row.min_weight),
        maxWeight: parseFloat(row.max_weight),
        firstReading: new Date(row.first_reading),
        lastReading: new Date(row.last_reading)
      }))
    } catch (error) {
      console.error('Erro ao obter resumo por produto:', error)
      return []
    }
  }

  // Limpeza de leituras antigas (manter apenas as mais recentes)
  async cleanup(keepCount = 1000) {
    if (this._shouldUseMemory()) {
      const readings = Array.from(this.readings.values())
        .sort((a, b) => b.timestamp - a.timestamp)
      
      if (readings.length <= keepCount) {
        return 0
      }
      
      const toRemove = readings.slice(keepCount)
      let removedCount = 0
      
      for (const reading of toRemove) {
        if (this.readings.delete(reading.id)) {
          removedCount++
        }
      }
      
      return removedCount
    }

    try {
      const result = await supabaseConfig.query(`
        DELETE FROM ${this.tableName}
        WHERE id NOT IN (
          SELECT id FROM ${this.tableName}
          ORDER BY timestamp DESC
          LIMIT $1
        )
      `, [keepCount])

      return result.rowCount
    } catch (error) {
      console.error('Erro na limpeza de leituras antigas:', error)
      return 0
    }
  }

  // Deletar leituras por produto
  async deleteByProduct(productName) {
    if (this._shouldUseMemory()) {
      let deletedCount = 0
      for (const [id, reading] of this.readings.entries()) {
        if (reading.productName.toLowerCase() === productName.toLowerCase()) {
          this.readings.delete(id)
          deletedCount++
        }
      }
      return deletedCount
    }

    try {
      const result = await supabaseConfig.query(
        `DELETE FROM ${this.tableName} WHERE LOWER(product_name) = LOWER($1)`,
        [productName]
      )

      return result.rowCount
    } catch (error) {
      console.error('Erro ao deletar leituras por produto:', error)
      return 0
    }
  }
}

module.exports = WeightReadingRepository 

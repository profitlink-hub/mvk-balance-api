const NetworkConfig = require('../models/NetworkConfig')
const { v4: uuidv4 } = require('uuid')
const databaseConfig = require('../database/database.config')

class NetworkRepository {
  constructor() {
    this.tableName = 'network_config'
    
    // Fallback para desenvolvimento sem Supabase (inicialização lazy)
    this.configs = new Map() // Sempre inicializar para fallback
  }

  // Verificar se deve usar memória (lazy check)
  _shouldUseMemory() {
    return !databaseConfig.isConnected()
  }

  // Converter dados do banco para modelo
  _mapToModel(dbData) {
    if (!dbData) return null

    return new NetworkConfig({
      id: dbData.id,
      ip: dbData.ip,
      gateway: dbData.gateway,
      dns: dbData.dns,
      createdAt: new Date(dbData.created_at)
    })
  }

  // Converter modelo para dados do banco
  _mapToDb(config) {
    return {
      id: config.id,
      ip: config.ip,
      gateway: config.gateway,
      dns: config.dns,
      created_at: config.createdAt,
      updated_at: new Date()
    }
  }

  // Criar configuração de rede
  async create(configData) {
    const id = uuidv4()
    const config = new NetworkConfig({
      id,
      ...configData
    })

    if (!config.isValid()) {
      throw new Error('Dados de configuração de rede inválidos')
    }

    if (this._shouldUseMemory()) {
      // Modo em memória - armazenar apenas a configuração mais recente
      this.configs.clear() // Limpar configurações anteriores
      this.configs.set(config.id, config)
      return config
    }

    try {
      const dbData = this._mapToDb(config)
      const result = await databaseConfig.query(
        `INSERT INTO ${this.tableName} (id, ip, gateway, dns, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [dbData.id, dbData.ip, dbData.gateway, dbData.dns, dbData.created_at, dbData.updated_at]
      )

      return this._mapToModel(result.rows[0])
    } catch (error) {
      throw new Error(`Erro ao criar configuração de rede: ${error.message}`)
    }
  }

  // Buscar configuração mais recente
  async findLatest() {
    if (this._shouldUseMemory()) {
      // Modo em memória - retornar a única configuração
      const configs = Array.from(this.configs.values())
      return configs.length > 0 ? configs[0] : null
    }

    try {
      const result = await databaseConfig.query(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT 1`
      )

      if (result.rows.length === 0) {
        return null
      }

      return this._mapToModel(result.rows[0])
    } catch (error) {
      throw new Error(`Erro ao buscar configuração de rede: ${error.message}`)
    }
  }

  // Buscar todas as configurações
  async findAll() {
    if (this._shouldUseMemory()) {
      return Array.from(this.configs.values())
    }

    try {
      const result = await databaseConfig.query(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
      )

      return result.rows.map(item => this._mapToModel(item))
    } catch (error) {
      throw new Error(`Erro ao buscar configurações de rede: ${error.message}`)
    }
  }

  // Buscar por ID
  async findById(id) {
    if (this._shouldUseMemory()) {
      return this.configs.get(id) || null
    }

    try {
      const result = await databaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return null
      }

      return this._mapToModel(result.rows[0])
    } catch (error) {
      throw new Error(`Erro ao buscar configuração de rede: ${error.message}`)
    }
  }
}

module.exports = NetworkRepository
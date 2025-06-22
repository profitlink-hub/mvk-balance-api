const Client = require('../models/Client')
const { v4: uuidv4 } = require('uuid')
const supabaseConfig = require('../database/supabase.config')

class ClientRepository {
  constructor() {
    this.tableName = 'clients'
    
    // Fallback para desenvolvimento sem Supabase
    this.useMemory = !supabaseConfig.isConnected()
    if (this.useMemory) {
      this.clients = new Map()
      this.initializeDefaultClients()
    }
  }

  // Inicializar clientes padrão (apenas para modo de desenvolvimento)
  initializeDefaultClients() {
    if (!this.useMemory) return

    const defaultClients = [
      {
        clientId: 'arduino_client_001',
        clientSecret: 'secret_arduino_2023',
        name: 'Arduino Balança Principal'
      },
      {
        clientId: 'web_client_001',
        clientSecret: 'secret_web_2023',
        name: 'Aplicação Web'
      }
    ]

    defaultClients.forEach(clientData => {
      const client = new Client({
        id: uuidv4(),
        ...clientData
      })
      this.clients.set(client.id, client)
    })
  }

  // Converter dados do banco para modelo
  _mapToModel(dbData) {
    if (!dbData) return null

    return new Client({
      id: dbData.id,
      clientId: dbData.client_id,
      clientSecret: dbData.client_secret,
      name: dbData.name,
      isActive: dbData.is_active,
      createdAt: new Date(dbData.created_at)
    })
  }

  // Converter modelo para dados do banco
  _mapToDb(client) {
    return {
      id: client.id,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      name: client.name,
      is_active: client.isActive,
      created_at: client.createdAt,
      updated_at: new Date()
    }
  }

  // Criar cliente
  async create(clientData) {
    const id = uuidv4()
    const client = new Client({
      id,
      ...clientData
    })

    if (!client.isValid()) {
      throw new Error('Dados do cliente inválidos')
    }

    // Verificar se já existe um cliente com o mesmo clientId
    const existingClient = await this.findByClientId(client.clientId)
    if (existingClient) {
      throw new Error('Cliente com este CLIENT_ID já existe')
    }

    if (this.useMemory) {
      this.clients.set(id, client)
      return client
    }

    try {
      const dbData = this._mapToDb(client)
      const result = await supabaseConfig.query(
        `INSERT INTO ${this.tableName} (id, client_id, client_secret, name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [dbData.id, dbData.client_id, dbData.client_secret, dbData.name, dbData.is_active, dbData.created_at, dbData.updated_at]
      )

      return this._mapToModel(result.rows[0])
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Cliente com este CLIENT_ID já existe')
      }
      throw error
    }
  }

  // Buscar cliente por ID
  async findById(id) {
    if (this.useMemory) {
      return this.clients.get(id) || null
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      console.error('Erro ao buscar cliente por ID:', error)
      return null
    }
  }

  // Buscar cliente por CLIENT_ID
  async findByClientId(clientId) {
    if (this.useMemory) {
      for (const client of this.clients.values()) {
        if (client.clientId === clientId) {
          return client
        }
      }
      return null
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} WHERE client_id = $1`,
        [clientId]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      console.error('Erro ao buscar cliente por CLIENT_ID:', error)
      return null
    }
  }

  // Autenticar cliente com CLIENT_ID e CLIENT_SECRET
  async authenticate(clientId, clientSecret) {
    if (this.useMemory) {
      const client = await this.findByClientId(clientId)
      if (!client) {
        return null
      }
      return client.validateCredentials(clientId, clientSecret) ? client : null
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} 
         WHERE client_id = $1 AND client_secret = $2 AND is_active = true`,
        [clientId, clientSecret]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      console.error('Erro ao autenticar cliente:', error)
      return null
    }
  }

  // Listar todos os clientes
  async findAll() {
    if (this.useMemory) {
      return Array.from(this.clients.values())
    }

    try {
      const result = await supabaseConfig.query(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
      )

      return result.rows.map(row => this._mapToModel(row))
    } catch (error) {
      console.error('Erro ao listar clientes:', error)
      return []
    }
  }

  // Atualizar cliente
  async update(id, updateData) {
    if (this.useMemory) {
      const client = this.clients.get(id)
      if (!client) {
        return null
      }

      const updatedClient = new Client({
        ...client,
        ...updateData,
        id
      })

      if (!updatedClient.isValid()) {
        throw new Error('Dados do cliente inválidos')
      }

      this.clients.set(id, updatedClient)
      return updatedClient
    }

    try {
      const existingClient = await this.findById(id)
      if (!existingClient) {
        return null
      }

      const updatedClient = new Client({
        ...existingClient,
        ...updateData,
        id
      })

      if (!updatedClient.isValid()) {
        throw new Error('Dados do cliente inválidos')
      }

      const dbData = this._mapToDb(updatedClient)
      const result = await supabaseConfig.query(
        `UPDATE ${this.tableName} 
         SET client_id = $2, client_secret = $3, name = $4, is_active = $5, updated_at = $6
         WHERE id = $1
         RETURNING *`,
        [id, dbData.client_id, dbData.client_secret, dbData.name, dbData.is_active, dbData.updated_at]
      )

      return result.rows.length > 0 ? this._mapToModel(result.rows[0]) : null
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Cliente com este CLIENT_ID já existe')
      }
      throw error
    }
  }

  // Desativar cliente
  async deactivate(id) {
    return await this.update(id, { isActive: false })
  }

  // Deletar cliente
  async delete(id) {
    if (this.useMemory) {
      return this.clients.delete(id)
    }

    try {
      const result = await supabaseConfig.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      )

      return result.rowCount > 0
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
      return false
    }
  }

  // Obter estatísticas de clientes
  async getStats() {
    if (this.useMemory) {
      const clients = Array.from(this.clients.values())
      return {
        total: clients.length,
        active: clients.filter(c => c.isActive).length,
        inactive: clients.filter(c => !c.isActive).length
      }
    }

    try {
      const result = await supabaseConfig.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE is_active = false) as inactive
        FROM ${this.tableName}
      `)

      const row = result.rows[0]
      return {
        total: parseInt(row.total),
        active: parseInt(row.active),
        inactive: parseInt(row.inactive)
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas de clientes:', error)
      return { total: 0, active: 0, inactive: 0 }
    }
  }
}

module.exports = ClientRepository 
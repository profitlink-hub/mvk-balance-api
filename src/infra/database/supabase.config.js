const { createClient } = require('@supabase/supabase-js')

class SupabaseConfig {
  constructor() {
    // String de conexão direta PostgreSQL
    this.connectionString = 'postgresql://postgres:mvk2025@db.gvdmggfzmgsvgebnuzcx.supabase.co:5432/postgres'

    // URL do Supabase (construída a partir do projeto)
    this.supabaseUrl = 'https://gvdmggfzmgsvgebnuzcx.supabase.co'
    
    // Anon key (deve ser fornecida via variável de ambiente)
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

    // Client do Supabase
    this.client = null
    this.pgClient = null
  }

  // Inicializar conexão com Supabase
  async initialize() {
    try {
      // Client do Supabase para operações REST
      if (this.supabaseAnonKey) {
        this.client = createClient(this.supabaseUrl, this.supabaseAnonKey)
        console.log('✅ Supabase Client inicializado')
      }

      // Client PostgreSQL direto usando string de conexão
      if (this.connectionString && this.connectionString.includes('postgresql://')) {
        const { Client } = require('pg')
        this.pgClient = new Client({
          connectionString: this.connectionString,
          ssl: {
            rejectUnauthorized: false
          }
        })

        await this.pgClient.connect()
        console.log('✅ PostgreSQL Client conectado via string de conexão')
        console.log(`🔗 Conexão: ${this.connectionString.replace(/:[^:]*@/, ':****@')}`) // Mascarar senha nos logs
      }

      return this.pgClient !== null || this.client !== null
    } catch (error) {
      console.error('❌ Erro ao conectar com Supabase:', error.message)
      
      // Fallback para modo de desenvolvimento sem Supabase
      console.log('⚠️  Iniciando em modo de desenvolvimento (sem Supabase)')
      return false
    }
  }

  // Obter client do Supabase
  getClient() {
    return this.client
  }

  // Obter client PostgreSQL
  getPgClient() {
    return this.pgClient
  }

  // Verificar se a conexão está ativa
  isConnected() {
    return this.client !== null || this.pgClient !== null
  }

  // Executar query SQL direta
  async query(sql, params = []) {
    if (!this.pgClient) {
      throw new Error('PostgreSQL client não está conectado')
    }

    try {
      const result = await this.pgClient.query(sql, params)
      return result
    } catch (error) {
      console.error('❌ Erro na query SQL:', error.message)
      throw error
    }
  }

  // Executar query via Supabase REST API
  async rpc(functionName, params = {}) {
    if (!this.client) {
      throw new Error('Supabase client não está conectado')
    }

    try {
      const { data, error } = await this.client.rpc(functionName, params)
      
      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('❌ Erro no RPC Supabase:', error.message)
      throw error
    }
  }

  // Fechar conexões
  async close() {
    try {
      if (this.pgClient) {
        await this.pgClient.end()
        console.log('✅ Conexão PostgreSQL fechada')
      }
    } catch (error) {
      console.error('❌ Erro ao fechar conexão:', error.message)
    }
  }

  // Criar tabelas usando o SQL definido
  async createTables() {
    if (!this.pgClient) {
      console.log('⚠️  PostgreSQL não conectado. Pulando criação de tabelas.')
      return false
    }

    try {
      const fs = require('fs')
      const path = require('path')
      const sqlPath = path.join(__dirname, 'create_tables.sql')
      
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8')
        await this.pgClient.query(sql)
        console.log('✅ Tabelas criadas/verificadas com sucesso')
        return true
      } else {
        console.log('⚠️  Arquivo create_tables.sql não encontrado')
        return false
      }
    } catch (error) {
      console.error('❌ Erro ao criar tabelas:', error.message)
      return false
    }
  }

  // Testar conexão
  async testConnection() {
    if (!this.pgClient) {
      return { success: false, error: 'Cliente PostgreSQL não está conectado' }
    }

    try {
      const result = await this.pgClient.query('SELECT NOW() as current_time, version() as db_version')
      return {
        success: true,
        data: {
          timestamp: result.rows[0].current_time,
          version: result.rows[0].db_version,
          connected: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Obter informações da conexão
  getConnectionInfo() {
    return {
      connectionString: this.connectionString ? this.connectionString.replace(/:[^:]*@/, ':****@') : null,
      supabaseUrl: this.supabaseUrl,
      hasSupabaseClient: this.client !== null,
      hasPostgresClient: this.pgClient !== null,
      isConnected: this.isConnected()
    }
  }

  // Utilitário para converter snake_case para camelCase
  toCamelCase(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item))
    }

    if (obj !== null && typeof obj === 'object') {
      const newObj = {}
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        newObj[camelKey] = this.toCamelCase(value)
      }
      return newObj
    }

    return obj
  }

  // Utilitário para converter camelCase para snake_case
  toSnakeCase(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item))
    }

    if (obj !== null && typeof obj === 'object') {
      const newObj = {}
      for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        newObj[snakeKey] = this.toSnakeCase(value)
      }
      return newObj
    }

    return obj
  }
}

// Instância singleton
const supabaseConfig = new SupabaseConfig()

module.exports = supabaseConfig 
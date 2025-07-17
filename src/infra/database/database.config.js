const { Client } = require('pg')

class DatabaseConfig {
  constructor() {
    // Configuração de conexão PostgreSQL
    this.config = {
      user: process.env.DB_USER || 'mvk',
      password: process.env.DB_PASSWORD || 'profitlink',
      host: process.env.DB_HOST || 'mvk-mvkbalanca-ffzgfq',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'mvk',
      // SSL configurável via variável de ambiente (padrão: desabilitado)
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }

    // String de conexão PostgreSQL
    this.connectionString = `postgresql://${this.config.user}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`

    // Client do PostgreSQL
    this.pgClient = null
  }

  // Inicializar conexão com PostgreSQL
  async initialize() {
    try {
      console.log('🔗 Tentando conectar com as seguintes configurações:')
      console.log(`   Host: ${this.config.host}`)
      console.log(`   Porta: ${this.config.port}`)
      console.log(`   Database: ${this.config.database}`)
      console.log(`   Usuário: ${this.config.user}`)
      console.log(`   SSL: ${this.config.ssl ? 'habilitado' : 'desabilitado'}`)
      
      // Client PostgreSQL direto
      this.pgClient = new Client(this.config)

      await this.pgClient.connect()
      console.log('✅ PostgreSQL Client conectado com sucesso!')
      
      return true
    } catch (error) {
      console.error('❌ Erro ao conectar com PostgreSQL:', error.message)
      console.log('🔍 Detalhes do erro:')
      console.log('   - Verifique se o servidor PostgreSQL está rodando')
      console.log('   - Confirme as credenciais de acesso')
      console.log('   - Verifique se a porta está acessível')
      console.log('   - Para SSL, defina DB_SSL=true se necessário')
      
      // Fallback para modo de desenvolvimento
      console.log('⚠️  Iniciando em modo de desenvolvimento (sem PostgreSQL)')
      return false
    }
  }

  // Obter client PostgreSQL
  getPgClient() {
    return this.pgClient
  }

  // Verificar se a conexão está ativa
  isConnected() {
    return this.pgClient !== null
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
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
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
const databaseConfig = new DatabaseConfig()

module.exports = databaseConfig 
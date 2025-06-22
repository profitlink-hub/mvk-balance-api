const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

// Importar middlewares
const GeneralMiddleware = require('./middlewares/GeneralMiddleware')

// Importar rotas
const ProductRoutes = require('./routes/ProductRoutes')
const WeightRoutes = require('./routes/WeightRoutes')
const AuthRoutes = require('./routes/AuthRoutes')
const ArduinoRoutes = require('./routes/ArduinoRoutes')

class Server {
  constructor() {
    this.app = express()
    this.port = process.env.PORT || 3000
    this.setupMiddlewares()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  setupMiddlewares() {
    // Middlewares de segurança
    this.app.use(helmet())
    this.app.use(cors())

    // Rate limiting geral
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000, // máximo 1000 requisições por IP por janela
      message: {
        success: false,
        error: 'Muitas requisições. Tente novamente em 15 minutos.',
        retryAfter: 900
      },
      standardHeaders: true,
      legacyHeaders: false
    })
    this.app.use(limiter)

    // Middlewares de parsing
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Middlewares customizados
    this.app.use(GeneralMiddleware.requestLogger())
    this.app.use(GeneralMiddleware.cors())
    this.app.use(GeneralMiddleware.securityHeaders())
    this.app.use(GeneralMiddleware.validateContentType(['application/json', 'application/x-www-form-urlencoded']))
    this.app.use(GeneralMiddleware.validateBodySize(5120)) // 5MB
    this.app.use(GeneralMiddleware.timeout(30)) // 30 segundos
    this.app.use(GeneralMiddleware.addSystemInfo())
    this.app.use(GeneralMiddleware.healthCheck())
  }

  setupRoutes() {
    // Rota raiz
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'MVK Balance API - Sistema de Gerenciamento de Balança com Arduino',
        version: '1.0.0',
        endpoints: {
          auth: '/auth',
          products: '/products',
          weight: '/weight',
          arduino: '/arduino',
          health: '/health'
        },
        documentation: {
          message: 'Use os endpoints acima para interagir com a API',
          authentication: 'Todas as rotas (exceto /auth/login) requerem CLIENT_ID e CLIENT_SECRET',
          headers: {
            'x-client-id': 'Seu CLIENT_ID',
            'x-client-secret': 'Seu CLIENT_SECRET',
            'Content-Type': 'application/json'
          }
        },
        timestamp: new Date().toISOString()
      })
    })

    // Rotas da API
    this.app.use('/auth', AuthRoutes)
    this.app.use('/products', ProductRoutes)
    this.app.use('/weight', WeightRoutes)
    this.app.use('/arduino', ArduinoRoutes)

    // Rota para informações da API
    this.app.get('/api/info', (req, res) => {
      res.json({
        success: true,
        data: {
          name: 'MVK Balance API',
          version: '1.0.0',
          description: 'API para gerenciamento de balança com Arduino',
          author: 'MVK Team',
          features: [
            'Autenticação com CLIENT_ID e CLIENT_SECRET',
            'Gerenciamento de produtos',
            'Registro de leituras de peso',
            'Recebimento de dados do Arduino',
            'Estatísticas e relatórios',
            'Rate limiting e segurança'
          ],
          endpoints: {
            authentication: [
              'POST /auth/login',
              'GET /auth/me',
              'POST /auth/clients'
            ],
            products: [
              'GET /products',
              'POST /products',
              'PUT /products/:id',
              'DELETE /products/:id'
            ],
            weight: [
              'POST /weight/readings',
              'GET /weight/readings',
              'GET /weight/statistics',
              'GET /weight/summary'
            ],
            arduino: [
              'POST /arduino/weight-movement',
              'GET /arduino/status',
              'GET /arduino/info'
            ]
          }
        },
        timestamp: new Date().toISOString()
      })
    })

    // Rota 404 para endpoints não encontrados
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        message: `Rota ${req.method} ${req.originalUrl} não existe`,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /api/info',
          'POST /auth/login',
          'GET /products',
          'POST /weight/readings',
          'GET /arduino/info'
        ],
        timestamp: new Date().toISOString()
      })
    })
  }

  setupErrorHandling() {
    // Middleware de tratamento de erros (deve ser o último)
    this.app.use(GeneralMiddleware.errorHandler())
  }

  start() {
    this.app.listen(this.port, () => {
      console.log('🚀 ==========================================')
      console.log('🚀  MVK BALANCE API INICIADA COM SUCESSO!')
      console.log('🚀 ==========================================')
      console.log(`📡 Servidor rodando na porta: ${this.port}`)
      console.log(`🌐 URL: http://localhost:${this.port}`)
      console.log(`📚 Documentação: http://localhost:${this.port}/api/info`)
      console.log(`❤️  Health Check: http://localhost:${this.port}/health`)
      console.log('🚀 ==========================================')
      console.log('')
      console.log('📋 Credenciais padrão:')
      console.log('🔑 Arduino: arduino_client_001 / secret_arduino_2023')
      console.log('🔑 Web: web_client_001 / secret_web_2023')
      console.log('')
      console.log('🛠️  Endpoints principais:')
      console.log('🔐 POST /auth/login - Autenticação')
      console.log('📦 GET /products - Listar produtos')
      console.log('⚖️  POST /weight/readings - Registrar peso')
      console.log('🤖 POST /arduino/command - Enviar comando')
      console.log('')
      console.log('✅ API pronta para receber requisições!')
    })

    // Tratamento de erros não capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Erro não capturado:', error)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promise rejeitada não tratada:', reason)
      console.error('❌ Promise:', promise)
      process.exit(1)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Recebido SIGTERM. Iniciando shutdown graceful...')
      process.exit(0)
    })

    process.on('SIGINT', () => {
      console.log('🛑 Recebido SIGINT (Ctrl+C). Iniciando shutdown graceful...')
      process.exit(0)
    })
  }
}

// Inicializar servidor
const server = new Server()
server.start()

module.exports = server.app 
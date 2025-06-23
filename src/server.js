// Carregar variáveis de ambiente primeiro
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./swagger/swagger.config')
const path = require('path')

// Importar middlewares
const GeneralMiddleware = require('./middlewares/GeneralMiddleware')

// Importar configuração do banco
const supabaseConfig = require('./infra/database/supabase.config')

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

  // Inicializar banco de dados
  async initializeDatabase() {
    try {
      console.log('🔌 Inicializando conexão com Supabase...')
      const connected = await supabaseConfig.initialize()
      
      if (connected) {
        console.log('✅ Conectado ao Supabase')
        
        // Criar tabelas se necessário
        const tablesCreated = await supabaseConfig.createTables()
        if (tablesCreated) {
          console.log('✅ Tabelas verificadas/criadas com sucesso')
        }
      } else {
        console.log('⚠️  Continuando em modo de desenvolvimento (sem Supabase)')
        console.log('💡 Para conectar ao Supabase, configure as variáveis:')
        console.log('   - SUPABASE_PASSWORD: Senha do banco')
        console.log('   - SUPABASE_ANON_KEY: Chave anônima (opcional)')
      }
      
      return connected
    } catch (error) {
      console.error('❌ Erro ao inicializar banco de dados:', error.message)
      console.log('⚠️  Continuando em modo de desenvolvimento...')
      return false
    }
  }

  setupMiddlewares() {
    // Forçar HTTP apenas - desabilitar HTTPS completamente
    this.app.use((req, res, next) => {
      // Remove headers que forçam HTTPS
      res.removeHeader('Strict-Transport-Security');
      res.removeHeader('upgrade-insecure-requests');
      
      // Não redirecionar para HTTPS
      if (req.header('x-forwarded-proto') !== 'http') {
        // Continua normalmente sem redirecionamento
      }
      next();
    });

    // Middlewares de segurança
    this.app.use(helmet({
      hsts: false, // Desabilita HTTP Strict Transport Security
      contentSecurityPolicy: false // Desabilita CSP que pode forçar HTTPS
    }))
    this.app.use(cors())

    // Servir arquivos estáticos da raiz do projeto
    this.app.use('/static', express.static(path.join(__dirname, '..')))

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
    
    /**
     * @swagger
     * /health:
     *   get:
     *     tags: [System]
     *     summary: Health Check
     *     description: Verifica o status de saúde da API e retorna informações do sistema
     *     security: []
     *     responses:
     *       200:
     *         description: API funcionando corretamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 status:
     *                   type: string
     *                   example: healthy
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                 uptime:
     *                   type: number
     *                   description: Tempo ativo do processo em segundos
     *                   example: 3600.5
     *                 memory:
     *                   type: object
     *                   properties:
     *                     rss:
     *                       type: integer
     *                       description: Memória residente em bytes
     *                     heapTotal:
     *                       type: integer
     *                       description: Total de heap em bytes
     *                     heapUsed:
     *                       type: integer
     *                       description: Heap usado em bytes
     *                     external:
     *                       type: integer
     *                       description: Memória externa em bytes
     *                     arrayBuffers:
     *                       type: integer
     *                       description: Array buffers em bytes
     *                 version:
     *                   type: string
     *                   example: 1.0.0
     *                 service:
     *                   type: string
     *                   example: mvk-balance-api
     */
    this.app.use(GeneralMiddleware.healthCheck())
  }

  setupRoutes() {
    // Swagger Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'MVK Balance API - Documentação',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true
      }
    }))

    // Rota para JSON do Swagger
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.send(swaggerSpec)
    })

    /**
     * @swagger
     * /dashboard:
     *   get:
     *     tags: [System]
     *     summary: Dashboard de Vendas
     *     description: Acessa o dashboard HTML para visualização de dados de vendas
     *     security: []
     *     responses:
     *       200:
     *         description: Página HTML do dashboard
     *         content:
     *           text/html:
     *             schema:
     *               type: string
     */
    // Rota para o Dashboard HTML
    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'index.html'))
    })

    /**
     * @swagger
     * /:
     *   get:
     *     tags: [System]
     *     summary: Informações da API
     *     description: Retorna informações gerais sobre a API e endpoints disponíveis
     *     security: []
     *     responses:
     *       200:
     *         description: Informações da API
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: MVK Balance API - Sistema de Gerenciamento de Balança com Arduino
     *                 version:
     *                   type: string
     *                   example: 1.0.0
     *                 endpoints:
     *                   type: object
     *                   properties:
     *                     auth:
     *                       type: string
     *                       example: /auth
     *                     products:
     *                       type: string
     *                       example: /products
     *                     weight:
     *                       type: string
     *                       example: /weight
     *                     arduino:
     *                       type: string
     *                       example: /arduino
     *                     health:
     *                       type: string
     *                       example: /health
     *                     documentation:
     *                       type: string
     *                       example: /api-docs
     *                 documentation:
     *                   type: object
     *                   properties:
     *                     message:
     *                       type: string
     *                     swagger:
     *                       type: string
     *                     authentication:
     *                       type: string
     *                     headers:
     *                       type: object
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
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
          health: '/health (GET - status da API)',
          healthCheck: 'POST /health (Arduino test)',
          documentation: '/api-docs',
          dashboard: '/dashboard (Dashboard de Vendas)'
        },
        documentation: {
          message: 'Use os endpoints acima para interagir com a API',
          swagger: 'Acesse /api-docs para documentação interativa',
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

    // Rota de health check do Arduino (diretamente em /health)
    const ArduinoController = require('./controllers/ArduinoController')
    const arduinoController = new ArduinoController()
    
    /**
     * @swagger
     * /health:
     *   post:
     *     tags: [Arduino]
     *     summary: Health check do Arduino
     *     description: Endpoint para receber teste de conectividade do Arduino
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               teste:
     *                 type: boolean
     *                 example: true
     *               timestamp:
     *                 type: integer
     *                 example: 5859217
     *           example:
     *             teste: true
     *             timestamp: 5859217
     *     responses:
     *       200:
     *         description: Health check recebido com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     received:
     *                       type: object
     *                       description: Dados recebidos do Arduino
     *                     status:
     *                       type: string
     *                       example: Arduino conectado
     *                     serverTimestamp:
     *                       type: integer
     *                       description: Timestamp do servidor
     *                 message:
     *                   type: string
     *                   example: Health check do Arduino recebido com sucesso
     *       400:
     *         description: Payload de teste inválido
     */
    this.app.post('/health', (req, res) => {
      arduinoController.receiveHealthCheck(req, res)
    })

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
          'POST /health',
          'GET /api/info',
          'GET /dashboard',
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

  async start() {
    // Inicializar banco de dados primeiro
    await this.initializeDatabase()

    this.app.listen(this.port, () => {
      console.log('🚀 ==========================================')
      console.log('🚀  MVK BALANCE API INICIADA COM SUCESSO!')
      console.log('🚀 ==========================================')
      console.log(`📡 Servidor rodando na porta: ${this.port}`)
      console.log(`🌐 URL: http://localhost:${this.port}`)
      console.log(`📚 Documentação: http://localhost:${this.port}/api-docs`)
      console.log(`📖 API Info: http://localhost:${this.port}/api/info`)
      console.log(`❤️  Health Check: http://localhost:${this.port}/health`)
      console.log('🚀 ==========================================')
      console.log('')
      console.log('📋 Credenciais padrão:')
      console.log('🔑 Arduino: arduino_client_001 / secret_arduino_2023')
      console.log('🔑 Web: web_client_001 / secret_web_2023')
      console.log('')
      console.log('🛠️  Endpoints principais:')
      console.log('📊 GET /dashboard - Dashboard de Vendas')
      console.log('🔐 POST /auth/login - Autenticação')
      console.log('📦 GET /products - Listar produtos')
      console.log('⚖️  POST /weight/readings - Registrar peso')
      console.log('🤖 POST /arduino/weight-movement - Arduino enviar dados')
      console.log('💓 POST /health - Health check do Arduino')
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

// Função async para inicializar
async function initializeServer() {
  try {
    await server.start()
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error)
    process.exit(1)
  }
}

initializeServer()

module.exports = server.app 
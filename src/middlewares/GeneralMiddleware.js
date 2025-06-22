class GeneralMiddleware {
  // Middleware de logging de requisições
  requestLogger() {
    return (req, res, next) => {
      const timestamp = new Date().toISOString()
      const method = req.method
      const url = req.originalUrl
      const ip = req.ip || req.connection.remoteAddress
      const userAgent = req.get('User-Agent') || 'Unknown'

      console.log(`[REQUEST] ${timestamp} - ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`)

      // Log do body para POST/PUT/PATCH (sem dados sensíveis)
      if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
        const sanitizedBody = this.sanitizeLogData(req.body)
        console.log(`[REQUEST BODY] ${JSON.stringify(sanitizedBody)}`)
      }

      // Interceptar resposta para logging
      const originalSend = res.send
      res.send = function(data) {
        const duration = Date.now() - req.startTime
        console.log(`[RESPONSE] ${timestamp} - ${method} ${url} - Status: ${res.statusCode} - Duration: ${duration}ms`)
        return originalSend.call(this, data)
      }

      req.startTime = Date.now()
      next()
    }
  }

  // Middleware para sanitizar dados sensíveis nos logs
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') return data

    const sensitiveFields = ['password', 'secret', 'token', 'clientSecret', 'key']
    const sanitized = { ...data }

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***HIDDEN***'
      }
    })

    return sanitized
  }

  // Middleware de CORS customizado
  cors() {
    return (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-client-id, x-client-secret')
      res.header('Access-Control-Allow-Credentials', true)

      if (req.method === 'OPTIONS') {
        res.sendStatus(200)
      } else {
        next()
      }
    }
  }

  // Middleware de tratamento de erros
  errorHandler() {
    return (error, req, res) => {
      console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`, error)

      // Erro de validação
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Erro de validação',
          details: error.message
        })
      }

      // Erro de sintaxe JSON
      if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
          success: false,
          error: 'JSON inválido',
          message: 'Verifique a sintaxe do JSON enviado'
        })
      }

      // Erro genérico
      const statusCode = error.statusCode || error.status || 500
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? 'Erro interno do servidor' : error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Middleware para adicionar informações de sistema na resposta
  addSystemInfo() {
    return (req, res, next) => {
      const originalJson = res.json
      
      res.json = function(data) {
        if (data && typeof data === 'object') {
          data.system = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            service: 'mvk-balance-api'
          }
        }
        
        return originalJson.call(this, data)
      }
      
      next()
    }
  }

  // Middleware para validar Content-Type
  validateContentType(allowedTypes = ['application/json']) {
    return (req, res, next) => {
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type')
        
        if (!contentType) {
          return res.status(400).json({
            success: false,
            error: 'Content-Type é obrigatório',
            allowedTypes: allowedTypes
          })
        }

        const isValidType = allowedTypes.some(type => 
          contentType.toLowerCase().includes(type.toLowerCase())
        )

        if (!isValidType) {
          return res.status(415).json({
            success: false,
            error: 'Content-Type não suportado',
            received: contentType,
            allowedTypes: allowedTypes
          })
        }
      }
      
      next()
    }
  }

  // Middleware para timeout de requisições
  timeout(seconds = 30) {
    return (req, res, next) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({
            success: false,
            error: 'Timeout da requisição',
            message: `Requisição excedeu o limite de ${seconds} segundos`
          })
        }
      }, seconds * 1000)

      res.on('finish', () => {
        clearTimeout(timeout)
      })

      res.on('close', () => {
        clearTimeout(timeout)
      })

      next()
    }
  }

  // Middleware para adicionar headers de segurança
  securityHeaders() {
    return (req, res, next) => {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      })
      next()
    }
  }

  // Middleware para validar tamanho do body
  validateBodySize(maxSizeKB = 1024) {
    return (req, res, next) => {
      const contentLength = req.get('Content-Length')
      
      if (contentLength && parseInt(contentLength) > maxSizeKB * 1024) {
        return res.status(413).json({
          success: false,
          error: 'Payload muito grande',
          maxSize: `${maxSizeKB}KB`,
          received: `${Math.round(parseInt(contentLength) / 1024)}KB`
        })
      }
      
      next()
    }
  }

  // Middleware para adicionar informações de health check
  healthCheck() {
    return (req, res, next) => {
      if (req.path === '/health' || req.path === '/health/') {
        return res.json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: '1.0.0',
          service: 'mvk-balance-api'
        })
      }
      next()
    }
  }
}

module.exports = new GeneralMiddleware() 
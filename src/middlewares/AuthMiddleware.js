const AuthService = require('../services/AuthService')

class AuthMiddleware {
  constructor() {
    this.authService = new AuthService()
  }

  // Middleware principal de autenticação
  authenticate() {
    return async (req, res, next) => {
      try {
        // Extrair credenciais do header Authorization ou body
        const clientId = req.headers['x-client-id'] || req.body.clientId
        const clientSecret = req.headers['x-client-secret'] || req.body.clientSecret

        if (!clientId || !clientSecret) {
          return res.status(401).json({
            success: false,
            error: 'CLIENT_ID e CLIENT_SECRET são obrigatórios',
            message: 'Forneça CLIENT_ID no header x-client-id e CLIENT_SECRET no header x-client-secret'
          })
        }

        // Autenticar cliente
        const authResult = await this.authService.authenticate(clientId, clientSecret)

        if (!authResult.success) {
          return res.status(401).json({
            success: false,
            error: authResult.error,
            message: 'Falha na autenticação'
          })
        }

        // Adicionar dados do cliente autenticado à requisição
        req.client = authResult.data.client
        req.authenticated = true

        next()
      } catch (error) {
        console.error('Erro no middleware de autenticação:', error)
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          message: 'Erro ao processar autenticação'
        })
      }
    }
  }

  // Middleware opcional de autenticação (não bloqueia se não autenticado)
  optionalAuthenticate() {
    return async (req, res, next) => {
      try {
        const clientId = req.headers['x-client-id'] || req.body.clientId
        const clientSecret = req.headers['x-client-secret'] || req.body.clientSecret

        if (clientId && clientSecret) {
          const authResult = await this.authService.authenticate(clientId, clientSecret)
          
          if (authResult.success) {
            req.client = authResult.data.client
            req.authenticated = true
          }
        }

        // Continuar mesmo sem autenticação
        next()
      } catch (error) {
        console.error('Erro no middleware de autenticação opcional:', error)
        // Continuar mesmo com erro
        next()
      }
    }
  }

  // Middleware para verificar se o cliente é ativo
  requireActiveClient() {
    return (req, res, next) => {
      if (!req.authenticated || !req.client) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária',
          message: 'Cliente deve estar autenticado'
        })
      }

      if (!req.client.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Cliente desativado',
          message: 'Cliente não está ativo no sistema'
        })
      }

      next()
    }
  }

  // Middleware para verificar se o cliente é específico (ex: apenas Arduino)
  requireSpecificClient(allowedClientNames = []) {
    return (req, res, next) => {
      if (!req.authenticated || !req.client) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        })
      }

      if (allowedClientNames.length > 0) {
        const clientName = req.client.name.toLowerCase()
        const isAllowed = allowedClientNames.some(allowedName => 
          clientName.includes(allowedName.toLowerCase())
        )

        if (!isAllowed) {
          return res.status(403).json({
            success: false,
            error: 'Acesso negado',
            message: `Cliente '${req.client.name}' não tem permissão para esta operação`
          })
        }
      }

      next()
    }
  }

  // Middleware para log de autenticação
  logAuthentication() {
    return (req, res, next) => {
      const timestamp = new Date().toISOString()
      const clientInfo = req.authenticated ? 
        `Cliente: ${req.client.name} (${req.client.clientId})` : 
        'Não autenticado'
      
      console.log(`[AUTH] ${timestamp} - ${req.method} ${req.path} - ${clientInfo}`)
      next()
    }
  }

  // Middleware para adicionar informações de autenticação na resposta
  addAuthInfo() {
    return (req, res, next) => {
      // Interceptar o método json para adicionar informações de auth
      const originalJson = res.json
      
      res.json = function(data) {
        if (data && typeof data === 'object') {
          data.auth = {
            authenticated: req.authenticated || false,
            client: req.authenticated ? {
              id: req.client.id,
              name: req.client.name,
              clientId: req.client.clientId
            } : null,
            timestamp: new Date().toISOString()
          }
        }
        
        return originalJson.call(this, data)
      }
      
      next()
    }
  }

  // Middleware para rate limiting por cliente
  rateLimitByClient(maxRequests = 100, windowMinutes = 15) {
    const clientRequests = new Map()
    
    return (req, res, next) => {
      if (!req.authenticated) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária para rate limiting'
        })
      }

      const clientId = req.client.clientId
      const now = Date.now()
      const windowMs = windowMinutes * 60 * 1000

      if (!clientRequests.has(clientId)) {
        clientRequests.set(clientId, [])
      }

      const requests = clientRequests.get(clientId)
      
      // Remover requisições antigas
      const validRequests = requests.filter(timestamp => now - timestamp < windowMs)
      
      if (validRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit excedido',
          message: `Máximo de ${maxRequests} requisições por ${windowMinutes} minutos`,
          retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
        })
      }

      // Adicionar requisição atual
      validRequests.push(now)
      clientRequests.set(clientId, validRequests)

      next()
    }
  }
}

module.exports = new AuthMiddleware() 
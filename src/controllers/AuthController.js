const AuthService = require('../services/AuthService')
const AuthValidator = require('../validators/AuthValidator')

class AuthController {
  constructor() {
    this.authService = new AuthService()
  }

  // POST /auth/login - Autenticar cliente
  async login(req, res) {
    try {
      const { clientId, clientSecret } = req.body

      // Validar credenciais
      const validation = AuthValidator.validateCredentials(clientId, clientSecret)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Credenciais inválidas',
          details: validation.errors
        })
      }

      const result = await this.authService.authenticate(clientId, clientSecret)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(401).json(result)
      }
    } catch (error) {
      console.error('Erro em login:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /auth/clients - Criar novo cliente
  async createClient(req, res) {
    try {
      // Validar dados de entrada
      const validation = AuthValidator.validateClientCreation(req.body)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      // Sanitizar dados
      const sanitizedData = AuthValidator.sanitizeClientCreation(req.body)

      const result = await this.authService.createClient(sanitizedData)
      
      if (result.success) {
        res.status(201).json(result)
      } else {
        const statusCode = result.error.includes('já existe') ? 409 : 400
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em createClient:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /auth/clients - Listar todos os clientes
  async getAllClients(req, res) {
    try {
      const result = await this.authService.getAllClients()
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em getAllClients:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /auth/clients/:id - Buscar cliente por ID
  async getClientById(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = AuthValidator.validateClientId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: validation.errors
        })
      }

      const result = await this.authService.getClientById(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Cliente não encontrado' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getClientById:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /auth/clients/search/:clientId - Buscar cliente por CLIENT_ID
  async getClientByClientId(req, res) {
    try {
      const { clientId } = req.params

      // Validar CLIENT_ID
      const validation = AuthValidator.validateClientIdForSearch(decodeURIComponent(clientId))
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'CLIENT_ID inválido',
          details: validation.errors
        })
      }

      const result = await this.authService.getClientByClientId(decodeURIComponent(clientId))
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Cliente não encontrado' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getClientByClientId:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // PUT /auth/clients/:id - Atualizar cliente
  async updateClient(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const idValidation = AuthValidator.validateClientId(id)
      if (!idValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: idValidation.errors
        })
      }

      // Validar dados de atualização
      const validation = AuthValidator.validateClientUpdate(req.body)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        })
      }

      // Sanitizar dados
      const sanitizedData = AuthValidator.sanitizeClientUpdate(req.body)

      const result = await this.authService.updateClient(id, sanitizedData)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Cliente não encontrado' ? 404 : 400
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em updateClient:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // PUT /auth/clients/:id/deactivate - Desativar cliente
  async deactivateClient(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = AuthValidator.validateClientId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: validation.errors
        })
      }

      const result = await this.authService.deactivateClient(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Cliente não encontrado' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em deactivateClient:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // PUT /auth/clients/:id/regenerate-secret - Regenerar CLIENT_SECRET
  async regenerateClientSecret(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = AuthValidator.validateClientId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: validation.errors
        })
      }

      const result = await this.authService.regenerateClientSecret(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Cliente não encontrado' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em regenerateClientSecret:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // DELETE /auth/clients/:id - Deletar cliente
  async deleteClient(req, res) {
    try {
      const { id } = req.params

      // Validar ID
      const validation = AuthValidator.validateClientId(id)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
          details: validation.errors
        })
      }

      const result = await this.authService.deleteClient(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Cliente não encontrado' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em deleteClient:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /auth/validate - Validar token/credenciais atual
  async validateAuth(req, res) {
    try {
      // Este endpoint assume que o middleware de auth já foi executado
      if (req.authenticated && req.client) {
        res.status(200).json({
          success: true,
          data: {
            client: req.client,
            authenticated: true,
            validatedAt: new Date().toISOString()
          },
          message: 'Autenticação válida'
        })
      } else {
        res.status(401).json({
          success: false,
          error: 'Não autenticado',
          message: 'Cliente não está autenticado'
        })
      }
    } catch (error) {
      console.error('Erro em validateAuth:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /auth/validate-secret - Validar força do CLIENT_SECRET
  async validateSecretStrength(req, res) {
    try {
      const { clientSecret } = req.body

      if (!clientSecret) {
        return res.status(400).json({
          success: false,
          error: 'CLIENT_SECRET é obrigatório'
        })
      }

      const result = AuthValidator.validateSecretStrength(clientSecret)
      
      res.status(200).json({
        success: result.valid,
        data: {
          strength: result.strength,
          warnings: result.warnings || [],
          errors: result.errors || []
        },
        message: result.valid ? 'CLIENT_SECRET validado' : 'CLIENT_SECRET inválido'
      })
    } catch (error) {
      console.error('Erro em validateSecretStrength:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /auth/me - Obter informações do cliente autenticado
  async getMe(req, res) {
    try {
      if (req.authenticated && req.client) {
        res.status(200).json({
          success: true,
          data: {
            client: req.client,
            authenticatedAt: new Date().toISOString()
          },
          message: 'Informações do cliente obtidas com sucesso'
        })
      } else {
        res.status(401).json({
          success: false,
          error: 'Não autenticado',
          message: 'Cliente deve estar autenticado'
        })
      }
    } catch (error) {
      console.error('Erro em getMe:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = AuthController 
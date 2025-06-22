const ClientRepository = require('../infra/repositories/ClientRepository')
const { v4: uuidv4 } = require('uuid')

class AuthService {
  constructor() {
    this.clientRepository = new ClientRepository()
  }

  // Autenticar cliente
  async authenticate(clientId, clientSecret) {
    try {
      if (!clientId || !clientSecret) {
        return {
          success: false,
          error: 'CLIENT_ID e CLIENT_SECRET são obrigatórios'
        }
      }

      const client = await this.clientRepository.authenticate(clientId, clientSecret)
      
      if (!client) {
        return {
          success: false,
          error: 'Credenciais inválidas'
        }
      }

      if (!client.isActive) {
        return {
          success: false,
          error: 'Cliente desativado'
        }
      }

      return {
        success: true,
        data: {
          client: client.toJSON(),
          authenticated: true
        },
        message: 'Autenticação realizada com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Criar novo cliente
  async createClient(clientData) {
    try {
      // Validações de negócio
      if (!clientData.name || clientData.name.trim().length < 2) {
        throw new Error('Nome do cliente deve ter pelo menos 2 caracteres')
      }

      // Gerar CLIENT_ID e CLIENT_SECRET automaticamente se não fornecidos
      const clientId = clientData.clientId || this.generateClientId(clientData.name)
      const clientSecret = clientData.clientSecret || this.generateClientSecret()

      const client = await this.clientRepository.create({
        clientId,
        clientSecret,
        name: clientData.name.trim(),
        isActive: clientData.isActive !== undefined ? clientData.isActive : true
      })

      return {
        success: true,
        data: {
          ...client.toJSON(),
          clientSecret: client.clientSecret // Incluir secret apenas na criação
        },
        message: 'Cliente criado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Listar todos os clientes
  async getAllClients() {
    try {
      const clients = await this.clientRepository.findAll()
      
      return {
        success: true,
        data: clients.map(client => client.toJSON()),
        total: clients.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Buscar cliente por ID
  async getClientById(id) {
    try {
      const client = await this.clientRepository.findById(id)
      
      if (!client) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        }
      }

      return {
        success: true,
        data: client.toJSON()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Buscar cliente por CLIENT_ID
  async getClientByClientId(clientId) {
    try {
      const client = await this.clientRepository.findByClientId(clientId)
      
      if (!client) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        }
      }

      return {
        success: true,
        data: client.toJSON()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Atualizar cliente
  async updateClient(id, updateData) {
    try {
      if (updateData.name && updateData.name.trim().length < 2) {
        throw new Error('Nome do cliente deve ter pelo menos 2 caracteres')
      }

      const updatedClient = await this.clientRepository.update(id, {
        name: updateData.name ? updateData.name.trim() : undefined,
        isActive: updateData.isActive,
        clientSecret: updateData.clientSecret
      })

      if (!updatedClient) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        }
      }

      return {
        success: true,
        data: updatedClient.toJSON(),
        message: 'Cliente atualizado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Desativar cliente
  async deactivateClient(id) {
    try {
      const deactivatedClient = await this.clientRepository.deactivate(id)
      
      if (!deactivatedClient) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        }
      }

      return {
        success: true,
        data: deactivatedClient.toJSON(),
        message: 'Cliente desativado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Gerar novo CLIENT_SECRET para um cliente
  async regenerateClientSecret(id) {
    try {
      const newSecret = this.generateClientSecret()
      
      const updatedClient = await this.clientRepository.update(id, {
        clientSecret: newSecret
      })

      if (!updatedClient) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        }
      }

      return {
        success: true,
        data: {
          ...updatedClient.toJSON(),
          clientSecret: newSecret // Incluir novo secret na resposta
        },
        message: 'CLIENT_SECRET regenerado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Gerar CLIENT_ID baseado no nome
  generateClientId(name) {
    const cleanName = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    
    const timestamp = Date.now().toString().slice(-6)
    return `${cleanName}_${timestamp}`
  }

  // Gerar CLIENT_SECRET aleatório
  generateClientSecret() {
    return `secret_${uuidv4().replace(/-/g, '')}`
  }

  // Deletar cliente
  async deleteClient(id) {
    try {
      const deleted = await this.clientRepository.delete(id)
      
      if (!deleted) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        }
      }

      return {
        success: true,
        message: 'Cliente deletado com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

module.exports = AuthService 
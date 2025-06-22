const Client = require('../models/Client')
const { v4: uuidv4 } = require('uuid')

class ClientRepository {
  constructor() {
    // Simulando base de dados em memória
    this.clients = new Map()
    this.initializeDefaultClients()
  }

  // Inicializar clientes padrão
  initializeDefaultClients() {
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

    this.clients.set(id, client)
    return client
  }

  // Buscar cliente por ID
  async findById(id) {
    return this.clients.get(id) || null
  }

  // Buscar cliente por CLIENT_ID
  async findByClientId(clientId) {
    for (const client of this.clients.values()) {
      if (client.clientId === clientId) {
        return client
      }
    }
    return null
  }

  // Autenticar cliente com CLIENT_ID e CLIENT_SECRET
  async authenticate(clientId, clientSecret) {
    const client = await this.findByClientId(clientId)
    if (!client) {
      return null
    }

    if (client.validateCredentials(clientId, clientSecret)) {
      return client
    }

    return null
  }

  // Listar todos os clientes
  async findAll() {
    return Array.from(this.clients.values())
  }

  // Atualizar cliente
  async update(id, updateData) {
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

  // Desativar cliente
  async deactivate(id) {
    const client = this.clients.get(id)
    if (!client) {
      return null
    }

    const deactivatedClient = new Client({
      ...client,
      isActive: false
    })

    this.clients.set(id, deactivatedClient)
    return deactivatedClient
  }

  // Deletar cliente
  async delete(id) {
    return this.clients.delete(id)
  }
}

module.exports = ClientRepository 
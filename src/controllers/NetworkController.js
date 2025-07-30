const NetworkService = require('../services/NetworkService')

class NetworkController {
  constructor() {
    this.networkService = new NetworkService()
  }

  // POST /network/config - Salvar configuração de rede
  async saveConfig(req, res) {
    try {
      const { ip, gateway, dns } = req.body

      // Validação básica
      if (!ip || !gateway || !dns) {
        return res.status(400).json({
          success: false,
          error: 'IP, Gateway e DNS são obrigatórios'
        })
      }

      // Validação de formato de IP
      const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      
      if (!ipRegex.test(ip.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Formato de IP inválido'
        })
      }

      if (!ipRegex.test(gateway.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Formato de Gateway inválido'
        })
      }

      if (!ipRegex.test(dns.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Formato de DNS inválido'
        })
      }

      const result = await this.networkService.saveNetworkConfig({
        ip: ip.trim(),
        gateway: gateway.trim(),
        dns: dns.trim()
      })
      
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Erro em saveConfig:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /network/config/latest - Obter configuração mais recente
  async getLatestConfig(req, res) {
    try {
      const result = await this.networkService.getLatestNetworkConfig()
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Nenhuma configuração de rede encontrada' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getLatestConfig:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /network/config - Obter todas as configurações
  async getAllConfigs(req, res) {
    try {
      const result = await this.networkService.getAllNetworkConfigs()
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        res.status(500).json(result)
      }
    } catch (error) {
      console.error('Erro em getAllConfigs:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /network/config/:id - Obter configuração por ID
  async getConfigById(req, res) {
    try {
      const { id } = req.params

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID é obrigatório'
        })
      }

      const result = await this.networkService.getNetworkConfigById(id)
      
      if (result.success) {
        res.status(200).json(result)
      } else {
        const statusCode = result.error === 'Configuração de rede não encontrada' ? 404 : 500
        res.status(statusCode).json(result)
      }
    } catch (error) {
      console.error('Erro em getConfigById:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = NetworkController
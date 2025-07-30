const NetworkRepository = require('../infra/repositories/NetworkRepository')

class NetworkService {
  constructor() {
    this.networkRepository = new NetworkRepository()
  }

  // Salvar configuração de rede
  async saveNetworkConfig(configData) {
    try {
      if (!configData || typeof configData !== 'object') {
        return {
          success: false,
          error: 'Dados de configuração são obrigatórios'
        }
      }

      const { ip, gateway, dns } = configData

      if (!ip || !gateway || !dns) {
        return {
          success: false,
          error: 'IP, Gateway e DNS são obrigatórios'
        }
      }

      const networkConfig = await this.networkRepository.create({
        ip: ip.trim(),
        gateway: gateway.trim(),
        dns: dns.trim()
      })

      return {
        success: true,
        data: networkConfig.toJSON(),
        message: 'Configuração de rede salva com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Obter configuração de rede mais recente
  async getLatestNetworkConfig() {
    try {
      const config = await this.networkRepository.findLatest()
      
      if (!config) {
        return {
          success: false,
          error: 'Nenhuma configuração de rede encontrada',
          data: null
        }
      }

      return {
        success: true,
        data: config.toJSON(),
        message: 'Configuração de rede obtida com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Obter todas as configurações de rede
  async getAllNetworkConfigs() {
    try {
      const configs = await this.networkRepository.findAll()

      return {
        success: true,
        data: configs.map(config => config.toJSON()),
        total: configs.length,
        message: 'Configurações de rede obtidas com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Obter configuração por ID
  async getNetworkConfigById(id) {
    try {
      if (!id) {
        return {
          success: false,
          error: 'ID é obrigatório'
        }
      }

      const config = await this.networkRepository.findById(id)
      
      if (!config) {
        return {
          success: false,
          error: 'Configuração de rede não encontrada'
        }
      }

      return {
        success: true,
        data: config.toJSON(),
        message: 'Configuração de rede obtida com sucesso'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

module.exports = NetworkService
const ArduinoService = require('../services/ArduinoService')
const WeightService = require('../services/WeightService')

class ArduinoController {
  constructor() {
    this.arduinoService = new ArduinoService()
    this.weightService = new WeightService()
  }

  // GET /arduino/status - Obter status do Arduino
  async getArduinoStatus(req, res) {
    try {
      const result = this.arduinoService.getArduinoStatus()
      
      res.status(200).json({
        ...result,
        message: 'Status do Arduino obtido com sucesso'
      })
    } catch (error) {
      console.error('Erro em getArduinoStatus:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // GET /arduino/info - Obter informações de comunicação
  async getArduinoCommunicationInfo(req, res) {
    try {
      const result = this.arduinoService.getArduinoCommunicationInfo()
      
      res.status(200).json({
        ...result,
        message: 'Informações de comunicação com Arduino'
      })
    } catch (error) {
      console.error('Erro em getArduinoCommunicationInfo:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /health - Receber teste de conectividade do Arduino
  async receiveHealthCheck(req, res) {
    try {
      const data = req.body

      // Validar se é um payload de teste válido
      if (data && typeof data.teste === 'boolean' && data.teste === true) {
        console.log(`🤖 Health check recebido do Arduino: timestamp=${data.timestamp}`)
        
        res.status(200).json({
          success: true,
        })
      } else {
        res.status(400).json({
          success: false,
          error: 'Payload de teste inválido',
          expected: { teste: true, timestamp: 'number' }
        })
      }
    } catch (error) {
      console.error('Erro em receiveHealthCheck:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }

  // POST /arduino/weight-movement - Receber movimentações de peso do Arduino
  async receiveWeightMovement(req, res) {
    try {
      const data = req.body

      // Validar estrutura dos dados
      const validation = this.arduinoService.validateWeightMovementData(data)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos recebidos do Arduino',
          details: validation.errors
        })
      }

      // Processar os dados (único ou múltiplo)
      const result = await this.arduinoService.processWeightMovement(data)
      
      if (result.success) {
        // Registrar as leituras no sistema de peso
        const weightResult = await this.weightService.registerArduinoMovements(result.data.movements)
        
        res.status(200).json({
          success: true,
          data: {
            received: data,
            processed: result.data,
            registered: weightResult.success ? weightResult.data : null
          },
          message: result.message
        })
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Erro em receiveWeightMovement:', error)
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = ArduinoController 
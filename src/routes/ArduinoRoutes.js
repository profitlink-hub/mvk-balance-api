const express = require('express')
const ArduinoController = require('../controllers/ArduinoController')
const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const arduinoController = new ArduinoController()

// Aplicar autenticação em todas as rotas do Arduino
router.use(AuthMiddleware.authenticate())
router.use(AuthMiddleware.requireActiveClient())

// GET /arduino/info - Obter informações de comunicação (não requer Arduino específico)
router.get('/info', (req, res) => {
  arduinoController.getArduinoCommunicationInfo(req, res)
})

// GET /arduino/status - Obter status do Arduino
router.get('/status', (req, res) => {
  arduinoController.getArduinoStatus(req, res)
})

// POST /arduino/weight-movement - Receber movimentações de peso do Arduino (único/múltiplo)
router.post('/weight-movement', (req, res) => {
  arduinoController.receiveWeightMovement(req, res)
})

module.exports = router 
const express = require('express')
const WeightController = require('../controllers/WeightController')
const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const weightController = new WeightController()

// POST /weight/readings - Registrar leitura de peso (usado pelo Arduino)
// Esta rota deve permitir acesso do Arduino
router.post('/readings', 
  AuthMiddleware.authenticate(),
  AuthMiddleware.requireActiveClient(),
  (req, res) => {
    weightController.recordWeightReading(req, res)
  }
)

// Aplicar autenticação em todas as outras rotas de peso
router.use(AuthMiddleware.authenticate())
router.use(AuthMiddleware.requireActiveClient())

// GET /weight/readings - Listar leituras com filtros
router.get('/readings', (req, res) => {
  weightController.getAllReadings(req, res)
})

// GET /weight/readings/:id - Buscar leitura por ID
router.get('/readings/:id', (req, res) => {
  weightController.getReadingById(req, res)
})

// GET /weight/readings/product/:productName - Buscar leituras por produto
router.get('/readings/product/:productName', (req, res) => {
  weightController.getLatestReadingsByProduct(req, res)
})

// GET /weight/readings/period - Buscar leituras por período
router.get('/readings/period', (req, res) => {
  weightController.getReadingsByDateRange(req, res)
})

// GET /weight/latest - Buscar últimas leituras gerais
router.get('/latest', (req, res) => {
  weightController.getLatestReadings(req, res)
})

// GET /weight/summary - Resumo geral das leituras
router.get('/summary', (req, res) => {
  weightController.getReadingsSummary(req, res)
})

// GET /weight/statistics - Obter estatísticas de peso
router.get('/statistics', (req, res) => {
  weightController.getWeightStatistics(req, res)
})

// DELETE /weight/readings/cleanup - Limpar leituras antigas
router.delete('/readings/cleanup', (req, res) => {
  weightController.cleanupOldReadings(req, res)
})

module.exports = router 
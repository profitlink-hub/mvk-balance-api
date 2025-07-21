const express = require('express')
const WeightController = require('../controllers/WeightController')

const router = express.Router()
const weightController = new WeightController()

// POST /weight/readings - Registrar leitura de peso (usado pelo Arduino)
// Esta rota deve permitir acesso do Arduino
/**
 * @swagger
 * /weight/readings:
 *   post:
 *     tags: [Weight]
 *     summary: Registrar leitura de peso
 *     description: Registra uma nova leitura de peso enviada pelo Arduino
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - weight
 *             properties:
 *               productName:
 *                 type: string
 *                 description: Nome do produto
 *                 example: Arduino Uno
 *               weight:
 *                 type: number
 *                 format: float
 *                 description: Peso lido em gramas
 *                 example: 25.5
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp da leitura (opcional, usará horário atual se não fornecido)
 *                 example: 2023-12-01T10:30:00.000Z
 *     responses:
 *       201:
 *         description: Leitura registrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WeightReading'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/readings', 
  // AuthMiddleware.authenticate(),
  // AuthMiddleware.requireActiveClient(),
  (req, res) => {
    weightController.recordWeightReading(req, res)
  }
)

// Aplicar autenticação em todas as outras rotas de peso
// router.use(AuthMiddleware.authenticate())
// router.use(AuthMiddleware.requireActiveClient())

// GET /weight/readings - Listar leituras com filtros
/**
 * @swagger
 * /weight/readings:
 *   get:
 *     tags: [Weight]
 *     summary: Listar leituras de peso
 *     description: Retorna lista de leituras de peso com filtros opcionais
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *         description: Filtrar por nome do produto
 *         example: Arduino
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *         example: 2023-12-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *         example: 2023-12-31
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Limite de resultados
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Deslocamento para paginação
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de leituras obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WeightReading'
 *                     total:
 *                       type: integer
 *                       description: Total de leituras
 *                     filters:
 *                       type: object
 *                       description: Filtros aplicados
 */
router.get('/readings', (req, res) => {
  weightController.getAllReadings(req, res)
})

// GET /weight/readings/:id - Buscar leitura por ID
/**
 * @swagger
 * /weight/readings/{id}:
 *   get:
 *     tags: [Weight]
 *     summary: Buscar leitura por ID
 *     description: Retorna uma leitura específica pelo seu ID
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID único da leitura
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Leitura encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WeightReading'
 *       404:
 *         description: Leitura não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
/**
 * @swagger
 * /weight/latest:
 *   get:
 *     tags: [Weight]
 *     summary: Últimas leituras
 *     description: Retorna as leituras mais recentes
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número de leituras a retornar
 *         example: 20
 *     responses:
 *       200:
 *         description: Últimas leituras obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WeightReading'
 *                     limit:
 *                       type: integer
 *                       description: Limite aplicado
 */
router.get('/latest', (req, res) => {
  weightController.getLatestReadings(req, res)
})

// GET /weight/summary - Resumo geral das leituras
/**
 * @swagger
 * /weight/summary:
 *   get:
 *     tags: [Weight]
 *     summary: Resumo geral das leituras
 *     description: Retorna um resumo geral das leituras de peso
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     responses:
 *       200:
 *         description: Resumo obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalReadings:
 *                           type: integer
 *                           description: Total de leituras registradas
 *                         uniqueProducts:
 *                           type: integer
 *                           description: Número de produtos únicos
 *                         lastReading:
 *                           $ref: '#/components/schemas/WeightReading'
 *                         readingsToday:
 *                           type: integer
 *                           description: Leituras registradas hoje
 *                         readingsThisWeek:
 *                           type: integer
 *                           description: Leituras da semana atual
 */
router.get('/summary', (req, res) => {
  weightController.getReadingsSummary(req, res)
})

// GET /weight/statistics - Obter estatísticas de peso
/**
 * @swagger
 * /weight/statistics:
 *   get:
 *     tags: [Weight]
 *     summary: Obter estatísticas de peso
 *     description: Retorna estatísticas calculadas das leituras de peso
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *         description: Filtrar estatísticas por produto específico
 *         example: Arduino
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 7
 *         description: Número de dias para calcular estatísticas
 *         example: 7
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalReadings:
 *                           type: integer
 *                           description: Total de leituras
 *                         averageWeight:
 *                           type: number
 *                           format: float
 *                           description: Peso médio
 *                         minWeight:
 *                           type: number
 *                           format: float
 *                           description: Peso mínimo
 *                         maxWeight:
 *                           type: number
 *                           format: float
 *                           description: Peso máximo
 *                         productName:
 *                           type: string
 *                           description: Nome do produto (ou 'Todos os produtos')
 *                         period:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                             days:
 *                               type: integer
 */
router.get('/statistics', (req, res) => {
  weightController.getWeightStatistics(req, res)
})

// DELETE /weight/readings/cleanup - Limpar leituras antigas
router.delete('/readings/cleanup', (req, res) => {
  weightController.cleanupOldReadings(req, res)
})

module.exports = router 
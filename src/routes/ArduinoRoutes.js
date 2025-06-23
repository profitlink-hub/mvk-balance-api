const express = require('express')
const ArduinoController = require('../controllers/ArduinoController')
// const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const arduinoController = new ArduinoController()

// Aplicar autenticação em todas as rotas do Arduino
// router.use(AuthMiddleware.authenticate())
// router.use(AuthMiddleware.requireActiveClient())

/**
 * @swagger
 * /arduino/info:
 *   get:
 *     tags: [Arduino]
 *     summary: Obter informações de comunicação
 *     description: Retorna informações sobre como comunicar com o Arduino e formatos de dados aceitos
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     responses:
 *       200:
 *         description: Informações obtidas com sucesso
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
 *                         communication:
 *                           type: object
 *                           properties:
 *                             direction:
 *                               type: string
 *                               example: Arduino → API
 *                             description:
 *                               type: string
 *                               example: O Arduino envia dados de movimentação para a API
 *                         supportedActions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: [RETIRADO, COLOCADO, RETIRADOS, COLOCADOS]
 *                         dataFormats:
 *                           type: object
 *                           properties:
 *                             single:
 *                               type: object
 *                               properties:
 *                                 description:
 *                                   type: string
 *                                 example:
 *                                   $ref: '#/components/schemas/WeightMovementSingle'
 *                             multiple:
 *                               type: object
 *                               properties:
 *                                 description:
 *                                   type: string
 *                                 example:
 *                                   $ref: '#/components/schemas/WeightMovementMultiple'
 *                         endpoint:
 *                           type: string
 *                           example: POST /arduino/weight-movement
 */
router.get('/info', (req, res) => {
  arduinoController.getArduinoCommunicationInfo(req, res)
})

/**
 * @swagger
 * /arduino/status:
 *   get:
 *     tags: [Arduino]
 *     summary: Obter status do Arduino
 *     description: Retorna o status atual do Arduino (simulado)
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     responses:
 *       200:
 *         description: Status obtido com sucesso
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
 *                         status:
 *                           type: string
 *                           example: connected
 *                         lastPing:
 *                           type: string
 *                           format: date-time
 *                         uptime:
 *                           type: integer
 *                           description: Tempo ativo em segundos
 *                         memoryUsage:
 *                           type: integer
 *                           description: Uso de memória em porcentagem
 *                         scale:
 *                           type: object
 *                           properties:
 *                             calibrated:
 *                               type: boolean
 *                             reading:
 *                               type: boolean
 *                             lastReading:
 *                               type: object
 *                               properties:
 *                                 weight:
 *                                   type: number
 *                                   format: float
 *                                 timestamp:
 *                                   type: string
 *                                   format: date-time
 */
router.get('/status', (req, res) => {
  arduinoController.getArduinoStatus(req, res)
})

/**
 * @swagger
 * /arduino/weight-movement:
 *   post:
 *     tags: [Arduino]
 *     summary: Receber movimentações de peso do Arduino
 *     description: Endpoint para o Arduino enviar dados de movimentação de produtos na balança (único ou múltiplo)
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/WeightMovementSingle'
 *               - $ref: '#/components/schemas/WeightMovementMultiple'
 *           examples:
 *             single:
 *               summary: Movimento único
 *               description: Um produto retirado ou colocado
 *               value:
 *                 nome: cerveja
 *                 peso: 335.1
 *                 acao: RETIRADO
 *                 ts: 214022
 *             multiple:
 *               summary: Movimento múltiplo
 *               description: Múltiplos produtos colocados ou retirados
 *               value:
 *                 acao: COLOCADOS
 *                 quantidade: 3
 *                 produtos:
 *                   - nome: cerveja
 *                     peso: 347.0
 *                     id: 0
 *                   - nome: cerveja
 *                     peso: 347.3
 *                     id: 1
 *                   - nome: 2MA
 *                     peso: 90.5
 *                     id: 3
 *                 ts: 188787
 *     responses:
 *       200:
 *         description: Movimentação processada com sucesso
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
 *                         received:
 *                           type: object
 *                           description: Dados recebidos originalmente
 *                         processed:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               enum: [single, multiple]
 *                             totalItems:
 *                               type: integer
 *                             movements:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   productName:
 *                                     type: string
 *                                   weight:
 *                                     type: number
 *                                     format: float
 *                                   action:
 *                                     type: string
 *                                     enum: [RETIRADO, COLOCADO]
 *                                   timestamp:
 *                                     type: string
 *                                     format: date-time
 *                                   arduinoId:
 *                                     type: integer
 *                                     nullable: true
 *                         registered:
 *                           type: object
 *                           description: Resultado do registro no sistema de peso
 *                           nullable: true
 *       400:
 *         description: Dados inválidos recebidos do Arduino
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     details:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Lista de erros de validação
 */
router.post('/weight-movement', (req, res) => {
  arduinoController.receiveWeightMovement(req, res)
})

/**
 * @swagger
 * /health:
 *   post:
 *     tags: [Arduino]
 *     summary: Health check do Arduino
 *     description: Endpoint para receber teste de conectividade do Arduino
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teste:
 *                 type: boolean
 *                 example: true
 *               timestamp:
 *                 type: integer
 *                 example: 5859217
 *           example:
 *             teste: true
 *             timestamp: 5859217
 *     responses:
 *       200:
 *         description: Health check recebido com sucesso
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
 *                         received:
 *                           type: object
 *                           description: Dados recebidos do Arduino
 *                         status:
 *                           type: string
 *                           example: Arduino conectado
 *                         serverTimestamp:
 *                           type: integer
 *                           description: Timestamp do servidor
 *       400:
 *         description: Payload de teste inválido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     expected:
 *                       type: object
 *                       properties:
 *                         teste:
 *                           type: boolean
 *                         timestamp:
 *                           type: string
 */
router.post('/health', (req, res) => {
  arduinoController.receiveHealthCheck(req, res)
})

module.exports = router 
const express = require('express')
const NetworkController = require('../controllers/NetworkController')

const router = express.Router()
const networkController = new NetworkController()

/**
 * @swagger
 * /network/config:
 *   post:
 *     tags: [Network]
 *     summary: Salvar configuração de rede
 *     description: Salva as configurações de rede (IP, Gateway, DNS) sem necessidade de autenticação
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *               - gateway
 *               - dns
 *             properties:
 *               ip:
 *                 type: string
 *                 description: Endereço IP
 *                 example: 192.168.1.100
 *               gateway:
 *                 type: string
 *                 description: Gateway padrão
 *                 example: 192.168.1.1
 *               dns:
 *                 type: string
 *                 description: Servidor DNS
 *                 example: 8.8.8.8
 *     responses:
 *       201:
 *         description: Configuração de rede salva com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     ip:
 *                       type: string
 *                       example: "192.168.1.100"
 *                     gateway:
 *                       type: string
 *                       example: "192.168.1.1"
 *                     dns:
 *                       type: string
 *                       example: "8.8.8.8"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Configuração de rede salva com sucesso"
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "IP, Gateway e DNS são obrigatórios"
 */
router.post('/config', (req, res) => {
  networkController.saveConfig(req, res)
})

/**
 * @swagger
 * /network/config/latest:
 *   get:
 *     tags: [Network]
 *     summary: Obter configuração de rede mais recente
 *     description: Retorna a configuração de rede mais recente salva
 *     security: []
 *     responses:
 *       200:
 *         description: Configuração obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     ip:
 *                       type: string
 *                     gateway:
 *                       type: string
 *                     dns:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       404:
 *         description: Nenhuma configuração encontrada
 */
router.get('/config/latest', (req, res) => {
  networkController.getLatestConfig(req, res)
})

/**
 * @swagger
 * /network/config:
 *   get:
 *     tags: [Network]
 *     summary: Obter todas as configurações de rede
 *     description: Retorna lista de todas as configurações de rede salvas
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de configurações obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       ip:
 *                         type: string
 *                       gateway:
 *                         type: string
 *                       dns:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 message:
 *                   type: string
 */
router.get('/config', (req, res) => {
  networkController.getAllConfigs(req, res)
})

/**
 * @swagger
 * /network/config/{id}:
 *   get:
 *     tags: [Network]
 *     summary: Obter configuração de rede por ID
 *     description: Retorna uma configuração específica pelo ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da configuração
 *     responses:
 *       200:
 *         description: Configuração obtida com sucesso
 *       404:
 *         description: Configuração não encontrada
 */
router.get('/config/:id', (req, res) => {
  networkController.getConfigById(req, res)
})

module.exports = router
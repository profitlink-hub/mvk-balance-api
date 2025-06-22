const express = require('express')
const AuthController = require('../controllers/AuthController')
const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const authController = new AuthController()

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Autenticar cliente
 *     description: Autentica um cliente usando CLIENT_ID e CLIENT_SECRET
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - clientSecret
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: ID do cliente
 *                 example: arduino_client_001
 *               clientSecret:
 *                 type: string
 *                 description: Segredo do cliente
 *                 example: secret_arduino_2023
 *     responses:
 *       200:
 *         description: Autenticação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Client'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', (req, res) => {
  authController.login(req, res)
})

// POST /auth/validate-secret - Validar força do CLIENT_SECRET (não requer auth prévia)
router.post('/validate-secret', (req, res) => {
  authController.validateSecretStrength(req, res)
})

// Aplicar autenticação nas rotas que precisam de auth
router.use(AuthMiddleware.authenticate())
router.use(AuthMiddleware.requireActiveClient())

// POST /auth/validate - Validar token/credenciais atual
router.post('/validate', (req, res) => {
  authController.validateAuth(req, res)
})

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obter informações do cliente autenticado
 *     description: Retorna informações do cliente atualmente autenticado
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     responses:
 *       200:
 *         description: Informações do cliente obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Client'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', (req, res) => {
  authController.getCurrentClient(req, res)
})

// Rotas de gerenciamento de clientes (podem requerer privilégios especiais)

/**
 * @swagger
 * /auth/clients:
 *   post:
 *     tags: [Auth]
 *     summary: Criar novo cliente
 *     description: Cria um novo cliente no sistema
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do cliente
 *                 example: Novo Cliente
 *               clientId:
 *                 type: string
 *                 description: ID personalizado (opcional, será gerado se não fornecido)
 *                 example: custom_client_001
 *               clientSecret:
 *                 type: string
 *                 description: Segredo personalizado (opcional, será gerado se não fornecido)
 *                 example: custom_secret_2023
 *               isActive:
 *                 type: boolean
 *                 description: Status ativo do cliente
 *                 default: true
 *                 example: true
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Client'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cliente já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/clients', (req, res) => {
  authController.createClient(req, res)
})

/**
 * @swagger
 * /auth/clients:
 *   get:
 *     tags: [Auth]
 *     summary: Listar todos os clientes
 *     description: Retorna lista de todos os clientes cadastrados
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     responses:
 *       200:
 *         description: Lista de clientes obtida com sucesso
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
 *                         $ref: '#/components/schemas/Client'
 *                     total:
 *                       type: integer
 *                       description: Total de clientes
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/clients', (req, res) => {
  authController.getAllClients(req, res)
})

// GET /auth/clients/search/:clientId - Buscar cliente por CLIENT_ID
router.get('/clients/search/:clientId', (req, res) => {
  authController.getClientByClientId(req, res)
})

// GET /auth/clients/:id - Buscar cliente por ID
router.get('/clients/:id', (req, res) => {
  authController.getClientById(req, res)
})

// PUT /auth/clients/:id - Atualizar cliente
router.put('/clients/:id', (req, res) => {
  authController.updateClient(req, res)
})

// PUT /auth/clients/:id/deactivate - Desativar cliente
router.put('/clients/:id/deactivate', (req, res) => {
  authController.deactivateClient(req, res)
})

// PUT /auth/clients/:id/regenerate-secret - Regenerar CLIENT_SECRET
router.put('/clients/:id/regenerate-secret', (req, res) => {
  authController.regenerateClientSecret(req, res)
})

// DELETE /auth/clients/:id - Deletar cliente
router.delete('/clients/:id', (req, res) => {
  authController.deleteClient(req, res)
})

module.exports = router 
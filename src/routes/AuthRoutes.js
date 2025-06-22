const express = require('express')
const AuthController = require('../controllers/AuthController')
const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const authController = new AuthController()

// POST /auth/login - Autenticar cliente (não requer auth prévia)
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

// GET /auth/me - Obter informações do cliente autenticado
router.get('/me', (req, res) => {
  authController.getMe(req, res)
})

// Rotas de gerenciamento de clientes (podem requerer privilégios especiais)

// POST /auth/clients - Criar novo cliente
router.post('/clients', (req, res) => {
  authController.createClient(req, res)
})

// GET /auth/clients - Listar todos os clientes
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
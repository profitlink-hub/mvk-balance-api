const express = require('express')
const ShelfController = require('../controllers/ShelfController')
// const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const shelfController = new ShelfController()

// Aplicar autenticação em todas as rotas de pratileiras
// router.use(AuthMiddleware.authenticate())
// router.use(AuthMiddleware.requireActiveClient())

/**
 * @swagger
 * /shelfs:
 *   get:
 *     tags: [Shelfs]
 *     summary: Listar todas as pratileiras
 *     description: Retorna lista de todas as pratileiras cadastradas
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     responses:
 *       200:
 *         description: Lista de pratileiras obtida com sucesso
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
 *                         $ref: '#/components/schemas/Shelf'
 *                     count:
 *                       type: integer
 *                       description: Total de pratileiras
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', (req, res) => {
  shelfController.getAllShelfs(req, res)
})

/**
 * @swagger
 * /shelfs/{id}:
 *   get:
 *     tags: [Shelfs]
 *     summary: Buscar pratileira por ID
 *     description: Retorna uma pratileira específica pelo ID
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da pratileira
 *     responses:
 *       200:
 *         description: Pratileira encontrada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Shelf'
 *       404:
 *         description: Pratileira não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', (req, res) => {
  shelfController.getShelfById(req, res)
})

/**
 * @swagger
 * /shelfs:
 *   post:
 *     tags: [Shelfs]
 *     summary: Criar nova pratileira
 *     description: Cria uma nova pratileira no sistema
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
 *                 description: Nome da pratileira
 *                 example: "Pratileira A"
 *               products:
 *                 type: array
 *                 description: Lista de produtos (opcional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: ID do produto
 *                     quantity:
 *                       type: integer
 *                       description: Quantidade do produto
 *     responses:
 *       201:
 *         description: Pratileira criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Shelf'
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Pratileira já existe
 */
router.post('/', (req, res) => {
  shelfController.createShelf(req, res)
})

/**
 * @swagger
 * /shelfs/{id}:
 *   put:
 *     tags: [Shelfs]
 *     summary: Atualizar pratileira
 *     description: Atualiza dados de uma pratileira existente
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da pratileira
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da pratileira
 *               products:
 *                 type: array
 *                 description: Lista de produtos
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Pratileira atualizada com sucesso
 *       404:
 *         description: Pratileira não encontrada
 *       409:
 *         description: Nome já em uso
 */
router.put('/:id', (req, res) => {
  shelfController.updateShelf(req, res)
})

/**
 * @swagger
 * /shelfs/{id}:
 *   delete:
 *     tags: [Shelfs]
 *     summary: Deletar pratileira
 *     description: Remove uma pratileira do sistema
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da pratileira
 *     responses:
 *       200:
 *         description: Pratileira deletada com sucesso
 *       404:
 *         description: Pratileira não encontrada
 */
router.delete('/:id', (req, res) => {
  shelfController.deleteShelf(req, res)
})

/**
 * @swagger
 * /shelfs/search/{name}:
 *   get:
 *     tags: [Shelfs]
 *     summary: Buscar pratileira por nome
 *     description: Busca uma pratileira específica pelo nome
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da pratileira
 *     responses:
 *       200:
 *         description: Pratileira encontrada
 *       404:
 *         description: Pratileira não encontrada
 */
router.get('/search/:name', (req, res) => {
  shelfController.getShelfByName(req, res)
})

/**
 * @swagger
 * /shelfs/search:
 *   get:
 *     tags: [Shelfs]
 *     summary: Buscar pratileiras com filtros
 *     description: Busca pratileiras aplicando filtros opcionais
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nome (busca parcial)
 *       - in: query
 *         name: minWeight
 *         schema:
 *           type: number
 *         description: Peso mínimo
 *       - in: query
 *         name: maxWeight
 *         schema:
 *           type: number
 *         description: Peso máximo
 *     responses:
 *       200:
 *         description: Pratileiras encontradas
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
 *                         $ref: '#/components/schemas/Shelf'
 *                     count:
 *                       type: integer
 *                     filters:
 *                       type: object
 */
router.get('/search', (req, res) => {
  shelfController.searchShelfs(req, res)
})

/**
 * @swagger
 * /shelfs/{id}/products:
 *   post:
 *     tags: [Shelfs]
 *     summary: Adicionar produto à pratileira
 *     description: Adiciona um produto a uma pratileira específica
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da pratileira
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID do produto
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantidade do produto
 *     responses:
 *       200:
 *         description: Produto adicionado com sucesso
 *       404:
 *         description: Pratileira ou produto não encontrado
 */
router.post('/:id/products', (req, res) => {
  shelfController.addProduct(req, res)
})

/**
 * @swagger
 * /shelfs/{id}/products/{productId}:
 *   delete:
 *     tags: [Shelfs]
 *     summary: Remover produto da pratileira
 *     description: Remove um produto de uma pratileira específica
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da pratileira
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto removido com sucesso
 *       404:
 *         description: Pratileira não encontrada
 */
router.delete('/:id/products/:productId', (req, res) => {
  shelfController.removeProduct(req, res)
})

/**
 * @swagger
 * /shelfs/statistics:
 *   get:
 *     tags: [Shelfs]
 *     summary: Obter estatísticas das pratileiras
 *     description: Retorna estatísticas gerais das pratileiras
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
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
 *                         totalShelfs:
 *                           type: integer
 *                           description: Total de pratileiras
 *                         totalWeight:
 *                           type: number
 *                           description: Peso total de todas as pratileiras
 *                         averageWeight:
 *                           type: number
 *                           description: Peso médio por pratileira
 *                         totalProducts:
 *                           type: integer
 *                           description: Total de produtos em todas as pratileiras
 */
router.get('/statistics', (req, res) => {
  shelfController.getStatistics(req, res)
})

module.exports = router 
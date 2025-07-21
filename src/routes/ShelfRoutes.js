const express = require('express')
const ShelfController = require('../controllers/ShelfController')
// const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const shelfController = new ShelfController()

// Aplicar autenticação em todas as rotas de Prateleiras
// router.use(AuthMiddleware.authenticate())
// router.use(AuthMiddleware.requireActiveClient())

/**
 * @swagger
 * /shelfs:
 *   get:
 *     tags: [Shelfs]
 *     summary: Listar todas as Prateleiras (sem produtos)
 *     description: Retorna lista básica de todas as Prateleiras cadastradas sem incluir os produtos
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *         description: Filtrar Prateleiras por status (padrão é 'all')
 *         example: all
 *     responses:
 *       200:
 *         description: Lista de Prateleiras obtida com sucesso
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           totalWeight:
 *                             type: number
 *                           maxCapacity:
 *                             type: number
 *                           location:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           statistics:
 *                             type: object
 *                             properties:
 *                               totalItems:
 *                                 type: integer
 *                               uniqueProducts:
 *                                 type: integer
 *                               isEmpty:
 *                                 type: boolean
 *                               averageWeightPerProduct:
 *                                 type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *                       description: Total de Prateleiras
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
 *     summary: Buscar Prateleira por ID
 *     description: Retorna uma Prateleira específica pelo ID
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da Prateleira
 *     responses:
 *       200:
 *         description: Prateleira encontrada
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
 *         description: Prateleira não encontrada
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
 * /shelf/{id}/products:
 *   get:
 *     tags: [Shelfs]
 *     summary: Buscar produtos de uma Prateleira
 *     description: Retorna todos os produtos de uma Prateleira específica
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da Prateleira
 *     responses:
 *       200:
 *         description: Produtos da Prateleira encontrados
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
 *                         shelfId:
 *                           type: string
 *                           description: ID da Prateleira
 *                         shelfName:
 *                           type: string
 *                           description: Nome da Prateleira
 *                         products:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               productId:
 *                                 type: string
 *                               product:
 *                                 $ref: '#/components/schemas/Product'
 *                               quantity:
 *                                 type: integer
 *                               totalWeight:
 *                                 type: number
 *                         totalItems:
 *                           type: integer
 *                           description: Total de itens na Prateleira
 *                         totalWeight:
 *                           type: number
 *                           description: Peso total da Prateleira
 *       404:
 *         description: Prateleira não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/products', (req, res) => {
  shelfController.getShelfProducts(req, res)
})

/**
 * @swagger
 * /shelfs:
 *   post:
 *     tags: [Shelfs]
 *     summary: Criar nova Prateleira
 *     description: Cria uma nova Prateleira no sistema
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
 *                 description: Nome da Prateleira
 *                 example: "Prateleira A"
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
 *         description: Prateleira criada com sucesso
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
 *         description: Prateleira já existe
 */
router.post('/', (req, res) => {
  shelfController.createShelf(req, res)
})

/**
 * @swagger
 * /shelfs/{id}:
 *   put:
 *     tags: [Shelfs]
 *     summary: Atualizar Prateleira
 *     description: Atualiza dados de uma Prateleira existente
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da Prateleira
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da Prateleira
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
 *         description: Prateleira atualizada com sucesso
 *       404:
 *         description: Prateleira não encontrada
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
 *     summary: Deletar Prateleira
 *     description: Remove uma Prateleira do sistema
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da Prateleira
 *     responses:
 *       200:
 *         description: Prateleira deletada com sucesso
 *       404:
 *         description: Prateleira não encontrada
 */
router.delete('/:id', (req, res) => {
  shelfController.deleteShelf(req, res)
})

/**
 * @swagger
 * /shelfs/search/{name}:
 *   get:
 *     tags: [Shelfs]
 *     summary: Buscar Prateleira por nome
 *     description: Busca uma Prateleira específica pelo nome
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da Prateleira
 *     responses:
 *       200:
 *         description: Prateleira encontrada
 *       404:
 *         description: Prateleira não encontrada
 */
router.get('/search/:name', (req, res) => {
  shelfController.getShelfByName(req, res)
})

/**
 * @swagger
 * /shelfs/search:
 *   get:
 *     tags: [Shelfs]
 *     summary: Buscar Prateleiras com filtros
 *     description: Busca Prateleiras aplicando filtros opcionais
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
 *         description: Prateleiras encontradas
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
 *     summary: Adicionar produto à Prateleira
 *     description: Adiciona um produto a uma Prateleira específica
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da Prateleira
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
 *         description: Prateleira ou produto não encontrado
 */
router.post('/:id/products', (req, res) => {
  shelfController.addProduct(req, res)
})

/**
 * @swagger
 * /shelfs/{id}/products/{productId}:
 *   delete:
 *     tags: [Shelfs]
 *     summary: Remover produto da Prateleira
 *     description: Remove um produto de uma Prateleira específica
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da Prateleira
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
 *         description: Prateleira não encontrada
 */
router.delete('/:id/products/:productId', (req, res) => {
  shelfController.removeProduct(req, res)
})

/**
 * @swagger
 * /shelfs/statistics:
 *   get:
 *     tags: [Shelfs]
 *     summary: Obter estatísticas das Prateleiras
 *     description: Retorna estatísticas gerais das Prateleiras
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
 *                           description: Total de Prateleiras
 *                         totalWeight:
 *                           type: number
 *                           description: Peso total de todas as Prateleiras
 *                         averageWeight:
 *                           type: number
 *                           description: Peso médio por Prateleira
 *                         totalProducts:
 *                           type: integer
 *                           description: Total de produtos em todas as Prateleiras
 */
router.get('/statistics', (req, res) => {
  shelfController.getStatistics(req, res)
})

// DEBUG: Verificar consistência de dados
router.get('/:id/debug', (req, res) => {
  shelfController.debugShelfConsistency(req, res)
})

module.exports = router 
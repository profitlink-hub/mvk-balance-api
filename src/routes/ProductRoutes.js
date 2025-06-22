const express = require('express')
const ProductController = require('../controllers/ProductController')
const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const productController = new ProductController()

// Aplicar autenticação em todas as rotas de produtos
router.use(AuthMiddleware.authenticate())
router.use(AuthMiddleware.requireActiveClient())

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Listar todos os produtos
 *     description: Retorna lista de todos os produtos cadastrados
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     responses:
 *       200:
 *         description: Lista de produtos obtida com sucesso
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
 *                         $ref: '#/components/schemas/Product'
 *                     total:
 *                       type: integer
 *                       description: Total de produtos
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', (req, res) => {
  productController.getAllProducts(req, res)
})

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Criar novo produto
 *     description: Cria um novo produto no sistema
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
 *               - weight
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do produto
 *                 example: Arduino Uno
 *               weight:
 *                 type: number
 *                 format: float
 *                 description: Peso do produto em gramas
 *                 example: 25.5
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Produto já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', (req, res) => {
  productController.createProduct(req, res)
})

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Buscar produto por ID
 *     description: Retorna um produto específico pelo seu ID
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID único do produto
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Produto encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', (req, res) => {
  productController.getProductById(req, res)
})

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Atualizar produto
 *     description: Atualiza um produto existente
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID único do produto
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do produto
 *                 example: Arduino Uno R3
 *               weight:
 *                 type: number
 *                 format: float
 *                 description: Peso do produto em gramas
 *                 example: 30.5
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', (req, res) => {
  productController.updateProduct(req, res)
})

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Deletar produto
 *     description: Remove um produto do sistema
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID único do produto
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Produto deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', (req, res) => {
  productController.deleteProduct(req, res)
})

/**
 * @swagger
 * /products/search/{name}:
 *   get:
 *     tags: [Products]
 *     summary: Buscar produto por nome
 *     description: Busca produtos que contenham o nome especificado
 *     security:
 *       - ClientAuth: []
 *         ClientSecret: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Nome ou parte do nome do produto para busca
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Busca realizada com sucesso
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
 *                         $ref: '#/components/schemas/Product'
 *                     searchTerm:
 *                       type: string
 *                       description: Termo de busca utilizado
 *                     total:
 *                       type: integer
 *                       description: Total de produtos encontrados
 *       400:
 *         description: Parâmetro de busca inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search/:name', (req, res) => {
  productController.searchProductsByName(req, res)
})

module.exports = router 
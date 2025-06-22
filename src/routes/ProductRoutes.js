const express = require('express')
const ProductController = require('../controllers/ProductController')
const AuthMiddleware = require('../middlewares/AuthMiddleware')

const router = express.Router()
const productController = new ProductController()

// Aplicar autenticação em todas as rotas de produtos
router.use(AuthMiddleware.authenticate())
router.use(AuthMiddleware.requireActiveClient())

// GET /products - Listar todos os produtos
router.get('/', (req, res) => {
  productController.getAllProducts(req, res)
})

// GET /products/search/:name - Buscar produto por nome
router.get('/search/:name', (req, res) => {
  productController.getProductByName(req, res)
})

// GET /products/:id - Buscar produto por ID
router.get('/:id', (req, res) => {
  productController.getProductById(req, res)
})

// POST /products - Criar novo produto
router.post('/', (req, res) => {
  productController.createProduct(req, res)
})

// POST /products/bulk - Criar múltiplos produtos
router.post('/bulk', (req, res) => {
  productController.createBulkProducts(req, res)
})

// PUT /products/:id - Atualizar produto
router.put('/:id', (req, res) => {
  productController.updateProduct(req, res)
})

// DELETE /products/:id - Deletar produto
router.delete('/:id', (req, res) => {
  productController.deleteProduct(req, res)
})

module.exports = router 
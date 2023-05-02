const express = require('express')
const productController = require('./../controller/productController')
const router = express.Router()

router
    .route('/filterProducts')
    .get(productController.filterProducts)
router
    .get('/getCategories', productController.getCategories)

router
    .get('/getColors', productController.getColors)
router
    .get('/getTypesByCategory', productController.getTypesByCategory)
router
    .get('/getProductsByCategory', productController.getProductsByCategory)
router
    .route('/')
    .get(productController.getAllProducts)
    .post(productController.createProduct)
router
    .get('/getProductById/:ID', productController.getProductById)

router
    .route('/:slug')
    .get(productController.getProduct)

router
    .route('/:idProduct')
    .patch(productController.uploadImageMainProduct, productController.getImageProduct, productController.updateProduct)

module.exports = router
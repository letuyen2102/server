const express = require('express')
const productController = require('./../controller/productController');
const authController = require('../controller/authController')
const { uploadTest ,uploadImagesToCloudinary } = require('../controller/test');
const router = express.Router()
router.post('/upload', uploadTest ,  uploadImagesToCloudinary);
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
    .get('/getProductById/:ID', productController.getProductById)
router
    .post('/search', productController.searchProducts);
router
    .route('/:slug')
    .get(productController.getProduct)
router
    .route('/')
    .get(productController.getAllProducts)
    .post(productController.uploadImageToCreateProduct , productController.getImageProduct,productController.createProduct)
router
    .route('/:idProduct')
    .patch(productController.uploadImageToCreateProduct, productController.getImageProduct, productController.updateProduct)
    .delete(authController.protect , authController.restrictTo('admin') ,productController.deleteProduct)

module.exports = router
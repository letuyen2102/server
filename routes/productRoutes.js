const express = require('express')
const productController = require('./../controller/productController');
const { uploadImage } = require('../controller/test');
const multer = require('multer');
const storage = multer.diskStorage({});

const upload = multer({ storage }).any();
const router = express.Router()
router.post('/upload',  uploadImage);
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
    .route('/:slug')
    .get(productController.getProduct)
router
    .route('/')
    .get(productController.getAllProducts)
    .post(productController.uploadImageToCreateProduct , productController.getImageProduct,productController.createProduct)
router
    .route('/:idProduct')
    .patch(productController.uploadImageToCreateProduct, productController.getImageProduct, productController.updateProduct)

module.exports = router
const express = require('express')
const cartController = require('../controller/cartController')

const authController = require('../controller/authController')

const router = express.Router()



router
    .route('/createCart')
    .post(authController.protect, cartController.createCart)

router
    .route('/createManyCart')
    .post(authController.protect , cartController.createManyCart)
router
    .route('/getAllCarts')
    .get(cartController.getAllCarts)

router
    .route('/cartMe')
    .get(authController.protect, cartController.getCartMe)
router
    .route('/decCart')
    .post(authController.protect, cartController.decCart)
router
    .route('/incCart')
    .post(authController.protect, cartController.incCart)
router
    .route('/clearAllCart')
    .delete(authController.protect, cartController.clearAllCart)
router
    .route('/clearEachCart')
    .post(authController.protect, cartController.clearEachCart)
module.exports = router




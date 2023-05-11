const express = require("express")
const router = express.Router()
const categoryController = require('../controller/categoryController')


router.get('/' , categoryController.getCategorys)
router.get('/statsCategory', categoryController.getCategoryStats)
router.get('/:cate' , categoryController.getCategoryById)
router.post('/' , categoryController.createCategory)

module.exports = router
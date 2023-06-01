const express = require('express')
const reviewController = require('../controller/reviewController')
const authController = require('../controller/authController')

const router = express.Router()

router
    .post('/comments/:idComment' , authController.protect , reviewController.replyComment)

router
    .get('/' , reviewController.getAllReviews)
    .post('/' , authController.protect , reviewController.createReview)
router
    .delete('/:idComment/:idResponse' , authController.protect , reviewController.deleteResponse)
router
    .delete('/:idComment' , authController.protect , reviewController.deleteComment)


module.exports = router
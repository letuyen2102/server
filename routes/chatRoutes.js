const express = require('express')
const authController = require('../controller/authController')
const chatController = require('../controller/chatController')
const router = express.Router()

router
    .post('/createChat' , authController.protect , chatController.createChat)
router
    .get('/getConversation/:room' , authController.protect , chatController.getConversation)

module.exports = router
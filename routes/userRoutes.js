const express = require('express')

const authController = require('../controller/authController')
const userController = require('../controller/userController')
const router = express.Router()

router
    .route('/signup')
    .post(authController.signup)
router
    .post('/signupAdmin' , authController.signupAdmin)
router
    .route('/signup/googleAccount')
    .post(authController.signupAsGoogle)
router
    .route('/login')
    .post(authController.login)
router
    .route('/loginAsAdmin')
    .post(authController.loginAsAdmin)
router.get('/logout', authController.logout)

router.post('/forgotPassword', authController.forgotPassword)

router.patch('/resetPassword/:token', authController.resetPassword)

router.patch('/updateMyPassword', authController.protect, authController.updatePassword);
router.post('/sendOtp' , authController.protect , authController.sendOtp)
router.patch('/updatePhone' , authController.protect , authController.resetPhone)
router.patch('/resetPasswordPhone' , authController.resetPasswordPhone)
router.get('/me', authController.protect, userController.getMe, userController.getUser);
router.patch('/updateMe', authController.protect, userController.uploadUserPhoto, userController.getImageUser, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);


router
    .route('/')
    .get(authController.protect ,authController.restrictTo('admin'), userController.getAllUser)
    .post(authController.protect, authController.restrictTo('admin'), userController.createUser)
router
    .route('/:id')
    .get(authController.protect, authController.restrictTo('admin'), userController.getUser)
    .patch(authController.protect, authController.restrictTo('admin'), userController.updateUser)
    .delete(authController.protect, authController.restrictTo('admin'), userController.deleteUser)

module.exports = router
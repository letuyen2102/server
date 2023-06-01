const multer = require('multer');
const path = require('path')
const appRoot = require('app-root-path')

const APIFeatures = require('./query');
const User = require('../models/User');
const Booking = require('../models/Booking');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({
    path : './../config.env'
  })
const storage = multer.memoryStorage()

const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|avif|AVIF|webp|WEBP)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter });


exports.uploadUserPhoto = upload.any()


exports.getImageUser = async (req, res, next) => {

    if (req.fileValidationError) {
        return res.send(req.fileValidationError);
    }
    next()
};

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};
exports.getAllUser = async (req, res, next) => {
    try {
        const users = await User.find({role : 'user'})

        res.status(200).json({
            status: 'success',
            data: {
                users
            }
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.createUser = async (req, res, next) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        })

        await user.save({ validateBeforeSave: false })

        res.status(201).json({
            status: 'success',
            data: {
                user
            }
        })

    } catch (err) {
        res.status(400).json({
            status: 'error',
            message: err
        })
    }
}
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.updateMe = async (req, res, next) => {

    try {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_CLOUD_KEY,
            api_secret: process.env.API_CLOUD_SECRET,
        });
        if (req.body.password || req.body.passwordConfirm) {
            throw new Error('Đây không phải đường dẫn thay đổi mật khẩu')
        }
        const filteredBody = filterObj(req.body, 'name', 'email', 'phone', 'birthday', 'gender', 'address');

        if (req.files) {
            
            const uploadPromises = req.files.map((file) => {
                return new Promise((resolve, reject) => {
                  const { originalname, buffer , fieldname} = file;
                    if (fieldname === 'users') {
                        cloudinary.uploader.upload_stream(
                            {
                              folder: 'my_image_user',
                              public_id: originalname.split('.')[0],
                              resource_type: 'image',
                            },
                            (error, result) => {
                              if (error) {
                                console.error(error);
                                reject(error);
                              } else {
                                filteredBody.photo = result.url
                                resolve(result);
                              }
                            }
                          ).end(buffer);
                    }
                });
              });
    
              const cloudinaryResults = await Promise.all(uploadPromises);


        }
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });
        updatedUser.passwordResetExpires = undefined
        updatedUser.passwordResetToken = undefined
        updatedUser.passwordConfirm = undefined
        updatedUser.passwordChangedAt = undefined
        updatedUser.active = undefined
        updatedUser.__v = undefined
        res.status(200).json({
            status: 'success',
            user: updatedUser
        });
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
};

exports.deleteMe = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { active: false });

        res.status(204).json({
            status: 'success',
            data: null
        });
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const newUser = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
        if (!newUser) {
            throw new Error('không thấy người dùng này')
        }
        res.status(200).json({
            status: 'success',
            data: {
                newUser
            }
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.deleteUser = async (req, res, next) => {
    try {
        const newUser = await User.findOne({_id : req.params.id , role: 'user'})
        if (!newUser) {
            throw new Error('không thấy người dùng này')
        }
        else {
            const bookingFilter = await Booking.find({user : newUser , status : 'processing'})
            if (bookingFilter.length > 0) {
                throw new Error('Người dùng còn đơn hàng chưa xử lý')
            }

            await User.deleteOne({_id : newUser._id})
        }
        res.status(204).json({
            status: 'success',
            data: null
        })

    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}


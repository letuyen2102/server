const multer = require('multer');
const path = require('path')
const appRoot = require('app-root-path')

const APIFeatures = require('./query');
const User = require('../models/User')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, appRoot + "/public/image/users");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter });


exports.uploadUserPhoto = upload.single('users')


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
        const feature = new APIFeatures(User.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate()

        const users = await feature.query

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
        if (req.body.password || req.body.passwordConfirm) {
            throw new Error('Đây không phải đường dẫn thay đổi mật khẩu')
        }
        const filteredBody = filterObj(req.body, 'name', 'email', 'phone', 'birthday', 'gender', 'address');

        if (req.file) {
            filteredBody.photo = req.file.filename
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
        const newUser = await User.findByIdAndDelete(req.params.id)

        if (!newUser) {
            throw new Error('không thấy người dùng này')
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


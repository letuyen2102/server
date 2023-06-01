const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
    },
    name: {
        type: String,
        required: [true, 'Nhập tên']
    },
    gender: {
        type: String,
        default: "Khác",
        enum: ["Nam", "Nữ", "Khác"]
    },
    birthday: {
        type: Date,
        default: Date.now()
    },
    email: {
        type: String,
        trim: true,
        required: [true, 'Cung cấp email'],
        unique: [true, 'Email này đã tồn tại'],
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email']
    },
    phone: {
        type: String,
        match: [/^\d{10}$/]
    },
    address: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Nhập mật khẩu '],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Xác nhận mật khẩu'],
        validate: {
            validator: function (el) {
                return el === this.password
            },
            message: 'Xác nhận mật khẩu'
        }
    },
    photo: {
        type: String,
        default: 'https://res.cloudinary.com/dalz888e7/image/upload/v1684910195/my_image_user/default-user.jpg.jpg'
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
    },
    otp: String,
    otpExpires: {
        type: Date,
    }

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


userSchema.pre('save', async function (next) {

    if (!this.isModified('password')) return next()

    this.password = await bcrypt.hash(this.password, 12)
    this.passwordConfirm = undefined

    next()
})
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});



userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});


userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }

    return false;
};
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');


    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema)

module.exports = User
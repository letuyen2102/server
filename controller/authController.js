const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const Mailjet = require('node-mailjet');
const twilio = require('twilio');
const User = require('../models/User')
const { promisify } = require('util')
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        // secure: true
    };
    // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined;
    user.active = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    user.__v = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        timeExpire: cookieOptions.expires.getTime(),
        data: {
            user
        }
    });
};


exports.signup = async (req, res, next) => {
    try {
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm
        })

        const mailjet = Mailjet.apiConnect(
            process.env.API_MAILJET_KEY,
            process.env.API_MAILJET_SECRET,
        );
        await mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: process.env.EMAIL_FROM,
                            Name: "MYWAYMYFASHION"
                        },
                        To: [
                            {
                                Email: user.email,
                                Name: user.name
                            }
                        ],
                        Subject: "Welcome to MYWAYMYFASHION",
                        TextPart: `Xin chào ${user.name},\n\n Chào mừng đến với MYWAYMYFASHION`,
                        HTMLPart: `<h3>Xin chào ${user.name},</h3><p>Chào mừng đến với MYWAYMYFASHION</p><p>Trân trọng,</p><p>MYWAYMYFASHION</p>`
                    }
                ]
            })


        user.password = undefined
        res.status(201).json({
            status: 'success',
            data: {
                user
            }
        })
    }
    catch (err) {
        if (err.code === 11000) {
            res.status(400).json({
                status: 'error',
                message: 'Email đã tồn tại'
            })
        } else {
            res.status(400).json({
                status: 'error',
                message: err.message || 'Đã có lỗi xảy ra'
            })
        }
    }
}
exports.signupAdmin = async (req, res, next) => {
    try {
        const admin = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            role: 'admin'
        })

        await admin.save({validateBeforeSave : false})

        admin.password = undefined
        
        res.status(201).json({
            status: 'success',
            admin
        })
    }
    catch (err) {
        if (err.code === 11000) {
            res.status(400).json({
                status: 'error',
                message: 'Email đã tồn tại'
            })
        } else {
            res.status(400).json({
                status: 'error',
                message: err.message || 'Đã có lỗi xảy ra'
            })
        }
    }
}
exports.signupAsGoogle = async (req, res, next) => {
    try {
        const { googleId, email, name } = req.body

        const checkUser = await User.findOne({ email: email })

        if (!checkUser) {
            const UserAsGoogle = new User({
                email: email,
                name: name,
                googleId: googleId
            })

            await UserAsGoogle.save({ validateBeforeSave: false })
            const mailjet = Mailjet.apiConnect(
                process.env.API_MAILJET_KEY,
                process.env.API_MAILJET_SECRET,
            );
            await mailjet
                .post('send', { version: 'v3.1' })
                .request({
                    Messages: [
                        {
                            From: {
                                Email: process.env.EMAIL_FROM,
                                Name: "MYWAYMYFASHION"
                            },
                            To: [
                                {
                                    Email: UserAsGoogle.email,
                                    Name: UserAsGoogle.name
                                }
                            ],
                            Subject: "Welcome to MYWAYMYFASHION",
                            TextPart: `Xin chào ${UserAsGoogle.name},\n\n Chào mừng đến với MYWAYMYFASHION`,
                            HTMLPart: `<h3>Xin chào ${UserAsGoogle.name},</h3><p>Chào mừng đến với MYWAYMYFASHION</p><p>Trân trọng,</p><p>MYWAYMYFASHION</p>`
                        }
                    ]
                })
            createSendToken(UserAsGoogle, 201, res)
        }
        else {
            createSendToken(checkUser, 200, res)
        }
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.login = async (req, res, next) => {
    try {
        if (!req.body.email || !req.body.password) {
            throw new Error('Cung cấp tài khoản và mật khẩu !')
        }


        const user = await User.findOne({ $or: [{ email: req.body.email }, { phone: req.body.email }] }).select('+password');


        if (!user || !(await user.correctPassword(req.body.password, user.password))) {
            throw new Error('Tài khoản hoặc mật khẩu sai')
        }

        createSendToken(user, 200, res)
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.loginAsAdmin = async (req , res) => {
    try {
        if (!req.body.email || !req.body.password) {
            throw new Error('Cung cấp tài khoản và mật khẩu !')
        }
        const user = await User.findOne({ $or: [{ email: req.body.email }, { phone: req.body.email }] }).select('+password');


        if (!user || !(await user.correctPassword(req.body.password, user.password)) || user.role === 'user') {
            throw new Error('Thông tin admin không chính xác')
        }

        createSendToken(user, 200, res)
    }
    catch(err){
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            throw new Error('bạn chưa đăng nhập , làm ơn đăng nhập để truy cập');
        }
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            throw new Error('Người dùng không tồn tại')
        }
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            throw new Error('Bạn đã thay đổi mật khẩu , hãy đăng nhập lại');
        }
        req.user = currentUser;
        next();
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.logout = (req, res, next) => {
    res.cookie('jwt', 'tuyendeptrai', {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        status: 'success'
    })
}
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new Error('Bạn không có quyền truy cập')
            );
        }

        next();
    };
};

exports.forgotPassword = async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });
    try {
        if (!user) {
            throw new Error(`Không tìm thấy email ${req.body.email}`);
        }
        if (user.googleId) {
            throw new Error(`Email ${user.email} dùng đăng nhập thông qua google , bạn hãy đăng nhập lại theo tài khoản google của bạn`)
        }
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });


        const mailjet = Mailjet.apiConnect(
            process.env.API_MAILJET_KEY,
            process.env.API_MAILJET_SECRET,
        );
        await mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: process.env.EMAIL_FROM,
                            Name: "MYWAYMYFASHION"
                        },
                        To: [
                            {
                                Email: user.email,
                                Name: user.name
                            }
                        ],
                        Subject: "Quên mật khẩu ",
                        TextPart: `Xin chào ${user.name},\n\nBạn đã yêu cầu thay đổi mật khẩu trên MYWAYMYFASHION. Vui lòng truy cập trang đổi mật khẩu và thực hiện theo hướng dẫn để hoàn tất quá trình.\n\nTrân trọng,\nMYWAYMYFASHION`,
                        HTMLPart: `<h3>Xin chào ${user.name},</h3><p>Bạn đã yêu cầu thay đổi mật khẩu trên MYWAYMYFASHION. Vui lòng truy cập trang đổi mật khẩu và thực hiện theo hướng dẫn để hoàn tất quá trình.<br /> <a href="http://localhost:3000/account/user/resetPassword/${resetToken}">Tại đây !</a> </p><p>Trân trọng,</p><p>MYWAYMYFASHION</p>`
                    }
                ]
            })
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw new Error('Sử dụng mã mới , mã này đã  hết hạn để reset lại mật khẩu');
        }
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.status(200).json({
            status : 'success',
            message : "Đặt lại mật khẩu thành công"
        })
    } catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }

};

exports.updatePassword = async (req, res, next) => {
    try {

        const user = await User.findById(req.user.id).select('+password');
        if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
            throw new Error('Mật khẩu hiện tại không đúng');
        }

        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save();
        res.cookie('jwt', 'tuyendeptrai', {
            expires: new Date(Date.now()),
            httpOnly: true
        })
        res.status(200).json({
            status: 'success'
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
};
exports.sendOtp = async (req, res, next) => {
    const phone = req.body.phone;
    const userId = req.user._id
    const user = await User.findOne({ _id: userId });
    try {

        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        if (!user) {
            throw new Error('Bạn chưa đăng nhập , làm lơn đăng nhập để thay đổi sdt');
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.otp = otp;
        user.otpExpires = otpExpires
        await user.save({ validateBeforeSave: false });
        const accountSid = 'AC0c8e9ccb0de3f134033fd46c862a91a1';
        const authToken = 'e06178139543b8b4b0904adbcb1386af';
        const client = twilio(accountSid, authToken);
        await client.messages.create({
            to: `+84${parseInt(phone)}`,
            from: '+14344426635',
            body: `Mã OTP của bạn là ${otp}`
        })
        res.status(200).json({
            status: 'success',
            message: 'OTP is sent'
        })
    }
    catch (err) {
        user.otp = undefined;
        user.otpExpires = undefined
        await user.save({ validateBeforeSave: false });
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
};

exports.resetPhone = async (req, res, next) => {

    try {
        const phone = req.body.phone;
        const otp = req.body.otp;
        const userId = req.user._id
        const user = await User.findOne({ _id: userId });
        if (!user) {
            throw new Error('Bạn chưa đăng nhập')
        }
        if (user.otp === otp && user.otpExpires > Date.now()) {
            user.otp = undefined;
            user.otpExpires = undefined;
            user.phone = phone;
            await user.save({ validateBeforeSave: false });

            res.status(200).json({
                status: 'success',
                message: 'thay đổi sdt thành công'
            })
        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: 'Đã có lỗi khi gửi OTP , thử lại nhé !'
        })
    }

}

exports.resetPasswordPhone = async (req , res) => {
    try {
        const phone = req.body.phone;
        const account = await User.findOne({phone: phone})
        if (!phone) {
            throw new Error("Không tìm thấy người dùng này")
        }
        const randomString = Math.random().toString(36).substring(2, 10);

        account.password = randomString

        await account.save({ validateBeforeSave: false });

        const accountSid = 'AC0c8e9ccb0de3f134033fd46c862a91a1';
        const authToken = 'e06178139543b8b4b0904adbcb1386af';
        const client = twilio(accountSid, authToken);
        await client.messages.create({
            to: `+84${parseInt(phone)}`,
            from: '+14344426635',
            body: `Mật khẩu mới của bạn là: ${randomString}`
        })
        res.status(200).json({
            status: 'success',
            message: 'Đã gửi mật khẩu mới'
        })
    }
    catch(err){
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
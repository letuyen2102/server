const express = require('express')
const moment = require('moment')
const authController = require('../controller/authController')
const bookingController = require('../controller/bookingController')
const Booking = require('../models/Booking')
const Cart = require('../models/Cart')
const router = express.Router()

router
    .get('/getAllBookings' , authController.protect , authController.restrictTo('admin') , bookingController.getAllBookings)
router
    .route('/createBooking')
    .post(authController.protect, bookingController.createBooking)
router
    .route('/getBookingsMe')
    .get(authController.protect, bookingController.getBookingsMe)
router
    .route('/getBooking/:idBooking')
    .get(bookingController.getBooking)
router
    .get('/getBookingBaseOnUser/:idUser' , authController.protect , bookingController.getBookingBaseOnUser)
router
    .patch('/userCancelBooking/:idBooking' , authController.protect , bookingController.userCancelBooking)
router
    .patch('/acceptOrder/:idBooking' , authController.protect , authController.restrictTo('admin') , bookingController.acceptOrder)
router
    .patch('/refuseOrder/:idBooking' , authController.protect , authController.restrictTo('admin') , bookingController.refuseOrder)

router.post('/create_payment_url', authController.protect, async function (req, res, next) {
    console.log("HUHUUHUUHU")
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');

    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let tmnCode = 'N5NB4BEP';
    let secretKey = 'XAZEKIGDWWWTXVRLSCZGEJBFGMLKCDUL';
    let vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    let returnUrl = 'http://localhost:3000/success';
    let orderId = moment(date).format('DDHHmmss');
    let amount = req.body.amount;

    let locale = req.body.language;
    if (locale === null || locale === '') {
        locale = 'vn';
    }
    let currCode = 'VND';
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    vnp_Params = sortObject(vnp_Params);

    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    const { products, image, name, email, address, phone, note } = req.body

    const newBooking = new Booking({
        user: req.user._id,
        products: products,
        status: "cancel",
        orderId: orderId.toString(),
        image,
        name,
        email,
        address,
        phone,
        note
    })

    await newBooking.save()

    // res.redirect(vnpUrl)
    res.status(200).json({
        status: "00",
        data: vnpUrl
    })
});

router.get('/vnpay_return', authController.protect, async function (req, res, next) {
    try {
        console.log('hiiiihihihi')
        let vnp_Params = req.query;
        console.log(vnp_Params)
        console.log(req.body)
        let secureHash = vnp_Params['vnp_SecureHash'];
        let rspCode = vnp_Params['vnp_ResponseCode'];
        let bankcode = vnp_Params['vnp_BankCode']
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        let tmnCode = 'N5NB4BEP';
        let secretKey = 'XAZEKIGDWWWTXVRLSCZGEJBFGMLKCDUL';
        let orderId = vnp_Params['vnp_TxnRef'].toString();
        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require("crypto");
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

        if (secureHash === signed && rspCode === "00") {
            const checkOrderId = await Booking.findOne({ orderId: orderId })

            if (!checkOrderId) {
                res.status(400).json({
                    status: 'error',
                    message: 'some thing went wrong , please try payment again'
                })
            }

            checkOrderId.status = "processing"
            checkOrderId.paymentCardName = bankcode
            await checkOrderId.save()
            const checkCart = await Cart.findOne({ user: req.user._id })

            if (checkCart) {
                await Cart.findByIdAndDelete(checkCart._id)
            }

            res.render('success', { code: vnp_Params['vnp_ResponseCode'] })
        } else {
            const checkOrderId = await Booking.findOne({ orderId: orderId })

            if (!checkOrderId) {
                res.status(400).json({
                    status: 'error',
                    message: 'some thing went wrong , please try payment again'
                })
            }
            checkOrderId.paymentCardName = bankcode
            await checkOrderId.save()
            res.render('success', { code: '97' })
        }
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
});

router.get('/vnpay_ipn', authController.protect, function (req, res, next) {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];
    console.log(vnp_Params)
    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    let secretKey = 'XAZEKIGDWWWTXVRLSCZGEJBFGMLKCDUL';
    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

    let paymentStatus = '0';
    let checkOrderId = true;
    let checkAmount = true;
    if (secureHash === signed) {
        if (checkOrderId) {
            if (checkAmount) {
                if (paymentStatus == "0") {
                    if (rspCode == "00") {
                        //thanh cong

                        res.status(200).json({ RspCode: '00', Message: 'Success' })
                    }
                    else {
                        //that bai

                        res.status(200).json({ RspCode: '00', Message: 'Success' })
                    }
                }
                else {
                    res.status(200).json({ RspCode: '02', Message: 'This order has been updated to the payment status' })
                }
            }
            else {
                res.status(200).json({ RspCode: '04', Message: 'Amount invalid' })
            }
        }
        else {
            res.status(200).json({ RspCode: '01', Message: 'Order not found' })
        }
    }
    else {
        res.status(200).json({ RspCode: '97', Message: 'Checksum failed' })
    }
});

router.post('/querydr', function (req, res, next) {

    process.env.TZ = 'Asia/Ho_Chi_Minh';

    let crypto = require("crypto");

    let vnp_TmnCode = 'N5NB4BEP';
    let secretKey = 'XAZEKIGDWWWTXVRLSCZGEJBFGMLKCDUL';
    let vnp_Api = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

    let vnp_TxnRef = req.body.orderId;
    let vnp_TransactionDate = req.body.transDate;

    let vnp_RequestId = dateFormat(date, 'HHmmss');
    let vnp_Version = '2.1.0';
    let vnp_Command = 'querydr';
    let vnp_OrderInfo = 'Truy van GD ma:' + vnp_TxnRef;

    let vnp_IpAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let currCode = 'VND';
    let date = new Date();
    let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

    let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TxnRef + "|" + vnp_TransactionDate + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;

    let hmac = crypto.createHmac("sha512", secretKey);
    let vnp_SecureHash = hmac.update(new Buffer(data, 'utf-8')).digest("hex");

    let dataObj = {
        'vnp_RequestId': vnp_RequestId,
        'vnp_Version': vnp_Version,
        'vnp_Command': vnp_Command,
        'vnp_TmnCode': vnp_TmnCode,
        'vnp_TxnRef': vnp_TxnRef,
        'vnp_OrderInfo': vnp_OrderInfo,
        'vnp_TransactionDate': vnp_TransactionDate,
        'vnp_CreateDate': vnp_CreateDate,
        'vnp_IpAddr': vnp_IpAddr,
        'vnp_SecureHash': vnp_SecureHash
    };
    // /merchant_webapi/api/transaction
    request({
        url: vnp_Api,
        method: "POST",
        json: true,
        body: dataObj
    }, function (error, response, body) {
        console.log(response);
    });

});

router.post('/refund', function (req, res, next) {

    process.env.TZ = 'Asia/Ho_Chi_Minh';

    let config = require('config');
    let crypto = require("crypto");

    let vnp_TmnCode = 'N5NB4BEP';
    let secretKey = 'XAZEKIGDWWWTXVRLSCZGEJBFGMLKCDUL';
    let vnp_Api = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

    let vnp_TxnRef = req.body.orderId;
    let vnp_TransactionDate = req.body.transDate;
    let vnp_Amount = req.body.amount * 100;
    let vnp_TransactionType = req.body.transType;
    let vnp_CreateBy = req.body.user;

    let currCode = 'VND';

    let vnp_RequestId = dateFormat(date, 'HHmmss');
    let vnp_Version = '2.1.0';
    let vnp_Command = 'refund';
    let vnp_OrderInfo = 'Hoan tien GD ma:' + vnp_TxnRef;

    let vnp_IpAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let date = new Date();
    let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

    let vnp_TransactionNo = '0';

    let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TransactionType + "|" + vnp_TxnRef + "|" + vnp_Amount + "|" + vnp_TransactionNo + "|" + vnp_TransactionDate + "|" + vnp_CreateBy + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;
    let hmac = crypto.createHmac("sha512", secretKey);
    let vnp_SecureHash = hmac.update(new Buffer(data, 'utf-8')).digest("hex");

    let dataObj = {
        'vnp_RequestId': vnp_RequestId,
        'vnp_Version': vnp_Version,
        'vnp_Command': vnp_Command,
        'vnp_TmnCode': vnp_TmnCode,
        'vnp_TransactionType': vnp_TransactionType,
        'vnp_TxnRef': vnp_TxnRef,
        'vnp_Amount': vnp_Amount,
        'vnp_TransactionNo': vnp_TransactionNo,
        'vnp_CreateBy': vnp_CreateBy,
        'vnp_OrderInfo': vnp_OrderInfo,
        'vnp_TransactionDate': vnp_TransactionDate,
        'vnp_CreateDate': vnp_CreateDate,
        'vnp_IpAddr': vnp_IpAddr,
        'vnp_SecureHash': vnp_SecureHash
    };

    request({
        url: vnp_Api,
        method: "POST",
        json: true,
        body: dataObj
    }, function (error, response, body) {
        console.log(response);
    });

});

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
module.exports = router


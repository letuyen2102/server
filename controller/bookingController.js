const mongoose = require('mongoose')
const crypto = require('crypto');
const https = require('https')
const Booking = require('../models/Booking')
const Cart = require('../models/Cart')
const VnPay = require('vn-payments');
const Product = require('../models/Product');

exports.createBooking = async (req, res) => {
    try {
        const { products, status, name, email, address, phone, note } = req.body
        const userId = req.user._id
        const newBooking = new Booking({
            user: userId,
            products: [...products],
            status,
            name,
            email,
            address,
            phone,
            note
        })

        await newBooking.save()
        await Cart.findOneAndDelete({ user: userId })
        res.status(200).json({
            status: 'success',
            newBooking
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.getBookingsMe = async (req, res) => {
    try {
        const userID = req.user._id;
        let status = req.query.status;
        if (!status) {
            status = ['success', 'processing', 'cancel' , 'required'];
        } else {
            status = Array.isArray(status) ? status : [status];
        }
        const bookings = await Booking.find({ user: userID, status: { $in: status } })

        res.status(200).json({
            status: 'success',
            bookings,
        });
    } catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message,
        });
    }
};

exports.getBooking = async (req, res) => {
    try {
        
        const booking = await Booking.findOne({ _id: req.params.idBooking })

        if (!booking) {
            throw new Error('Không tìm thấy order này')
        }
        res.status(200).json({
            status: 'success',
            booking
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.getAllBookings = async (req , res) => {
    try {
        let status = req.query.status;
        if (!status) {
            status = ['success', 'processing', 'cancel' , 'required'];
        } else {
            status = Array.isArray(status) ? status : [status];
        }
        const bookings = await Booking.find({status: { $in: status }})

        res.status(200).json({
            status : "success",
            bookings
        })
    }
    catch(err){
        res.status(500).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.userCancelBooking = async (req , res) => {
    try {
        const userID = req.user._id
        const idBooking = req.params.idBooking

        const required = await Booking.findOne({user : userID , _id : idBooking})

        required.status = 'required'

        await required.save()

        res.status(200).json({
            status : 'success',
            booking : required
        })
        
    }
    catch(err){
        res.status(500).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.acceptOrder = async (req, res) => {
    try {
        const idBooking = req.params.idBooking
        const searchBooking = await Booking.findById(idBooking)
        
        await Promise.all(searchBooking.products.map(async (each, idx) => {
            const result = await Product.findById(each.product._id)
            await Promise.all(result.quantity.map(async (mm, nn) => {
                if (mm.color === each.color && mm.colorName === each.colorName) {
                    mm.size.forEach((hh, kk) => {
                        if (hh.size === each.size && (hh.quantity - each.quantity) >= 0) {
                            hh.quantity = hh.quantity - each.quantity
                        }
                    })
                }
            }))
            
            await result.save()
        }))

        searchBooking.status = 'success'

        await searchBooking.save()

        res.status(200).json({
            status: 'success',
            message: 'Order accepted and saved successfully.'
        })
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.refuseOrder = async (req , res) => {
    try {
        const idBooking = req.params.idBooking

        const refuseOrder = await Booking.findById(idBooking)
        refuseOrder.status = 'cancel'

        await refuseOrder.save()

        res.status(200).json({
            status : 'success',
            booking : refuseOrder
        })
        
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.createPayment = (req, res) => {
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const requestId = partnerCode + new Date().getTime();
    const orderId = requestId;
    const orderInfo = "pay with MoMo";
    const redirectUrl = "https://momo.vn/return";
    const ipnUrl = "https://callback.url/notify";
    const amount = "50000";
    const requestType = "captureWallet"
    const extraData = "";

    const rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;

    const signature = crypto.createHmac('sha256', secretkey)
        .update(rawSignature)
        .digest('hex');

    const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'en'
    });

    const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    }

    req = https.request(options, response => {
        let data = '';

        response.on('data', chunk => {
            data += chunk;
        });

        response.on('end', () => {
            const responseData = JSON.parse(data);

            res.json({
                success: true,
                message: 'Payment created successfully.',
                data: {
                    paymentUrl: responseData.payUrl
                }
            });
        });
    });

    req.on('error', error => {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating payment.'
        });
    });

    req.write(requestBody);
    req.end();
};



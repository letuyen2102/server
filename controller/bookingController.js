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
                if (mm.color === each.color) {
                    mm.size.forEach((hh, kk) => {
                        if (hh.size === each.size) {
                            if (each.quantity > hh.quantity){
                                throw new Error(`Sản phẩm ${each.product._id} chỉ còn ${hh.quantity} loại màu ${mm.color} size ${hh.size}`)

                            }
                            else {
                                hh.quantity = hh.quantity - each.quantity
                            }
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

exports.getBookingBaseOnUser = async (req , res ) => {
    try {
        const idUser = req.params.idUser 
        // const idBooking = req.params.idBooking
        let status = req.query.status;
        if (!status) {
            status = ['success', 'processing', 'cancel' , 'required'];
        } else {
            status = Array.isArray(status) ? status : [status];
        }
        const bookings = await Booking.find({user : idUser , status: { $in: status }})

        res.status(200).json({
            status : 'success',
            bookings
        })
    }
    catch(err){
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}




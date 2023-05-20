const mongoose = require('mongoose')
const Product = require('./Product')

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            quantity: {
                type: Number
            },
            color: String,
            colorName: String,
            size: String,
            image: String,
            total: Number
        }
    ],
    paymentCardName: String,
    orderId: String,
    status: {
        type: String,
        enum: [
            "success",
            "processing",
            "cancel",
            "required"
        ]
    },
    name: String,
    phone: String,
    address: String,
    email: String,
    note: String,
    subTotal: Number,
    createAt: {
        type: Date,
        default: Date.now()
    }

})
bookingSchema.pre("save", async function (next) {
    const booking = this

    await booking.populate('user')
    await booking.populate('products.product')
    booking.products.forEach((el, idx) => {
        el.total = el.quantity * el.product.newPrice
    })
    booking.subTotal = booking.products.reduce(
        (total, product) => total + product.total,
        0
    );
    next()
})
bookingSchema.pre(/^find/, async function (next) {
    console.log("HIIHIHHNSNM")
    const booking = this
    booking.populate('user')
    booking.populate('products.product')
    next()
})

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking
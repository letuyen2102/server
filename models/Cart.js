const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
        },
        color : {
            type: String ,
            required : true
        },
        colorName : {
            type: String ,
        },
        size : {
            type : String ,
            required: true
        },
        image : String
    }],
    subTotal: Number
});


cartSchema.pre(/^find/ , function(next) {
    this.populate('items.product')
    next()
})



cartSchema.pre("save", async function (next) {
    let cart = this;
    await cart.populate('user')
    await cart.populate('items.product')

    const subTotal = cart.items.reduce((total, item) => {
        return total + (item.product.newPrice * item.quantity);
    }, 0);

    cart.subTotal = subTotal;
    next()
})

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;

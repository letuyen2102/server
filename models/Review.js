const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    text: {
        type: String
    },
    response : [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            text: {
                type: String
            },
            createAt: {
                type : Date,
                default : Date.now()
            }
        }
    ],
    createAt: {
        type : Date,
        default : Date.now()
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

reviewSchema.pre('save' , async function(next) {
    const review = this
    await review.populate('user')
    await review.populate('product')
    await review.populate('response.user')

    next()
})

const Review = mongoose.model('Review' , reviewSchema)

module.exports = Review
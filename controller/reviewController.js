const Review = require('../models/Review')
exports.createReview = async (req , res) => {
    try {
        const {product , text} = req.body
        const review = await Review.create({
            user : req.user._id,
            product :  product,
            text : text
        })
        res.status(200).json({
            status : 'success',
            review
        })
    }
    catch(err){
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.replyComment = async (req , res) => {
    try{
        const {idComment} = req.params
        const {text} = req.body
        const getComment = await Review.findById(idComment).populate('user').populate('product').populate('response.user')
        if (!getComment) {
            throw new Error('Không có comment này')
        }
        getComment.response = [...getComment.response , {user: req.user._id , text}]

        await getComment.save()

        res.status(201).json({
            status : 'success',
            newResponse : getComment.response[getComment.response.length-1]
        })
    }
    catch(err){
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.getAllReviews = async (req , res) => {
    try {
        const reviews = await Review.find().populate('user').populate('product').populate('response.user')
        res.status(200).json({
            status : 'success',
            reviews
        })
    }
    catch(err){
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.deleteResponse = async (req, res) => {
    try {
        const {idComment , idResponse} = req.params
        const review = await Review.findById(idComment).populate('user').populate('product').populate('response.user')

        review.response = review.response.filter(el => {
            return el._id.toString() !== idResponse.toString()
        })
        await review.save()
        res.status(204).json({
            status : 'success'
        })
    }
    catch(err){
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.deleteComment = async (req , res) => {
    try {
        const {idComment} = req.params
        const deleteComment = await Review.findByIdAndDelete(idComment)

        if (!deleteComment) {
            throw new Error("Không tồn tại comment này")
        }

        res.status(204).json({
            data: null
        })
    }
    catch(err){
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
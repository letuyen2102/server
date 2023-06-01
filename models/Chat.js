const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    room: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    message: String,
    time: Date
})



const Chat = mongoose.model('Chat' , chatSchema)

module.exports = Chat
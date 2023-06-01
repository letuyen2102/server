const Chat = require('../models/Chat')

exports.createChat = async (req , res) => {
    try{
        const {room ,message , time} = req.body
        const [hours, minutes] = time.split(':'); // Tách giờ và phút từ chuỗi thời gian

        // Tạo đối tượng Date mới với ngày hiện tại và giờ/phút tương ứng
        const currentTime = new Date();
        currentTime.setHours(parseInt(hours, 10)); // parseInt để chuyển giờ sang số nguyên
        currentTime.setMinutes(parseInt(minutes, 10)); // parseInt để chuyển phút sang số nguyên
        const createChat = new Chat({
            room,
            author: req.user._id,
            message,
            time : currentTime
        })

        await createChat.save()

        res.status(201).json({
            status : 'success',
            createChat
        })
    }
    catch(err){
        res.status(400).json({
            status : 'error',
            message : err.message
        })
    }
}

exports.getConversation = async (req, res) => {
    try {
        const {room} = req.params
        const chats = await Chat.find({room : room}).populate('author')
        const results = chats.map(each => {
            return {
                room: each.room,
                author: each.author,
                message: each.message,
                time: new Date(each.time).getHours() +
                ":" +
                new Date(each.time).getMinutes()
            }
        })
        res.status(200).json({
            status : 'success',
            chats : results
        })

    }
    catch(err){
        res.status(400).json({
            status : 'error',
            message : err.message
        })
    }
}
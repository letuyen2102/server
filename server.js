const dotenv = require('dotenv')
const app = require('./app')
const mongoose = require('mongoose')
const http = require('http')
const {Server} = require('socket.io')
dotenv.config({path : './config.env'})

const server = http.createServer(app)
const DB = process.env.DATABASE

mongoose.connect(DB , {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((doc)=>{
    console.log('Connect DB successfull')
})

const io = new Server(server , {
    cors: {
        origin : 'http://localhost:3000'
    }
})

io.on("connection" , (socket) => {
    console.log(`user connected ${socket.id}`)
    socket.on("join_room" , (data) => {
        socket.join(data)
        console.log(`user join ${data}`)
    })
    socket.on("send_message" , (data) => {
        console.log(data)
        socket.to(data.room).emit("receive_message" , data)
    })
    socket.on("disconnect" , () => {
        console.log("user disconnected" , socket.id)
    })
})



const port = process.env.PORT
server.listen(port , ()=> {
    console.log(`app is running on port ${port}`)
})
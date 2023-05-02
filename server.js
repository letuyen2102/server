const dotenv = require('dotenv')
const app = require('./app')
const mongoose = require('mongoose')
const http = require('http')
dotenv.config({path : './config.env'})

const server = http.createServer(app)
const DB = process.env.DATABASE.replace('<PASSWORD>' , process.env.DATABASE_PASSWORD)

mongoose.connect(DB , {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((doc)=>{
    console.log('Connect DB successfull')
})

const port = process.env.PORT
server.listen(port , ()=> {
    console.log(`app is running on port ${port}`)
})
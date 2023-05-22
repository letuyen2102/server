const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const productRouter = require('./routes/productRoutes')
const userRouter = require('./routes/userRoutes')
const cartRouter = require('./routes/cartRoutes')
const bookingRouter = require('./routes/bookingRoutes')

const app = express()

app.use(cors())
app.use(express.static('./public/image'));

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/myway/api/products', productRouter)
app.use('/myway/api/users' , userRouter)

app.use('/myway/api/carts' , cartRouter)
app.use('/myway/api/bookings' , bookingRouter)
module.exports = app
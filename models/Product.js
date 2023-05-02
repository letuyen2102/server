const mongoose = require('mongoose')
const slugify = require('slugify')
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'sản phẩm phải có tên '],
        unique : true
    },
    description: {
        type: String,
        required: [true, 'sản phẩm phải có mô tả chi tiết']
    },
    oldPrice: {
        type: Number,
        required: [true, 'sản phẩm phải có giá']
    },
    sale: {
        type: Number
    },
    quantity: [
        {
            color: {
                type: String,
                required: [true, 'sản phẩm phải có màu']
            },
            size: [
                {
                    size: String,
                    quantity: Number
                }
            ],
            imageSlideShows: [String]
        }
    ],
    image: {
        type: String,
        required: [true, 'sản phẩm phải có ảnh']
    },
    category: {
        type: String,
        required: [true, 'sản phẩm thuộc loại ?']
    },
    type: {
        type: String,
        required: true
    },
    slug: String,
    subQuantity : Number,
    newPrice : Number
})

productSchema.pre("save", function (next) {
    this.slug = slugify(this.name, {locale: 'vi',lower: true});
    next()
})

productSchema.pre("save" , function(next) {
    let sub = 0 
    this.quantity.forEach((each , index) => {
        each.size.forEach((el , idx) => {
            sub = sub + el.quantity
        })
    })
    this.subQuantity = sub
    next()
})

productSchema.pre("save" , function(next) {
    if (this.sale) {
        this.newPrice = this.oldPrice * this.sale
    }
    else {
        this.newPrice = this.oldPrice
    }
    next()
})
const Product = mongoose.model('Product', productSchema)

module.exports = Product
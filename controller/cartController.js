const Cart = require('../models/Cart')
const Product = require('../models/Product')

exports.getAllCarts = async (req, res) => {
    try {
        const carts = await Cart.find()

        res.status(200).json(
            {
                status: 'success',
                carts
            }
        )
    }
    catch (err) {
        console.log(err)
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}


exports.clearAllCart = async (req, res) => {
    try {
        const checkCart = await Cart.findOne({ user: req.user._id })

        if (checkCart) {


            await Cart.findByIdAndDelete(checkCart._id)


            res.status(204).json({
                status: 'success',
                data: null
            })
        }

        else {
            res.status(404).json({
                message: 'Giỏ hàng của bạn trống !'
            })
        }


    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.getCartMe = async (req, res) => {

    try {
        const cartMe = await Cart.find({ user: req.user._id })
        res.status(200).json({
            status: 'success',
            cartMe
        })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.createCart = async (req, res) => {
    try {
        const { productId, quantity, color, size, image , colorName} = req.body;
        const userId = req.user._id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }
        let item = cart.items.find(item => item.product.equals(product._id) && item.color === color && item.size === size && item.colorName === colorName);
        if (item) {
            item.quantity += parseInt(quantity);
        } else {
            cart.items.push({ product: product._id, quantity: parseInt(quantity), color, size, image ,colorName});
        }
        await cart.save();

        res.status(200).json({ status: 'success', message: 'Thêm sản phẩm vào giỏ hàng thành công' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra', error: error });
    }
}

exports.decCart = async (req, res) => {
    try {
        const { productId, color, size , colorName} = req.body;
        const userId = req.user._id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
        }

        let item = cart.items.find(item => item.product.equals(product._id) && item.color === color && item.size === size  && item.colorName === colorName);
        if (!item) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
        }

        if (item.quantity > 1) {
            item.quantity--;
        } else {
            cart.items = cart.items.filter(item => !item.product.equals(product._id) || item.color !== color || item.size !== size  || item.colorName !== colorName);
        }

        await cart.save();

        res.status(200).json({ status: 'success', message: 'Giảm sản phẩm trong giỏ hàng thành công', cartMe: cart });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: 'Đã có lỗi xảy ra', error: error.message });
    }
};

exports.incCart = async (req, res) => {
    try {
        const { productId, color, size , colorName} = req.body;
        const userId = req.user._id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }
        let item = cart.items.find(item => item.product.equals(product._id) && item.color === color && item.size === size  && item.colorName === colorName);
        if (item) {
            item.quantity += 1;
        } else {
            cart.items.push({ product: product._id, quantity: 1, color, size , colorName});
        }

        await cart.save();

        res.status(200).json({ status: 'success', message: 'Tăng số lượng sản phẩm trong giỏ hàng thành công', cartMe: cart });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra', error: error.message });
    }
}


exports.clearEachCart = async (req, res) => {
    try {
        const { productId, color, size , colorName} = req.body
        const userId = req.user._id
        const checkProduct = await Product.findById(productId)

        if (!checkProduct) {
            re.status(404).json({
                status: 'notFound',
                message: 'Sản phẩm này không có ở cửa hàng'
            })
        }
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }
        let item = cart.items.findIndex(item => item.product.equals(checkProduct._id) && item.color === color && item.size === size  && item.colorName === colorName);
        console.log(item)

        cart.items.splice(item, 1)

        await cart.save()
        res.status(200).json({ status: 'success', message: 'Xóa sản phẩm này thành công', cartMe: cart });
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}



exports.createManyCart = async (req, res) => {
    try {
        const { items } = req.body;
        const userId = req.user._id;
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }
        for (let i = 0; i < items.length; i++) {
            const { productId, quantity, color, size, image , colorName} = items[i];
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: `Sản phẩm ${productId} không tồn tại` });
            }
            let item = cart.items.find(item => item.product.equals(product._id) && item.color === color && item.size === size  && item.colorName === colorName);
            if (item) {
                item.quantity += parseInt(quantity);
                item.product.quantity.forEach(el => {
                    if (el.color === item.color) {
                        el.size.forEach(el2 => {
                            if (el2.size === item.size) {
                                if (item.quantity >= el2.quantity) {
                                    item.quantity = el2.quantity
                                }
                            }
                        })
                    }
                })
            } else {
                product.quantity.forEach(el => {
                    if (el.color === color) {
                        el.size.forEach(el2 => {
                            if (el2.size === size) {
                                if (quantity >= el2.quantity) {
                                    cart.items.push({ product: product._id, quantity: el2.quantity, color, size, image , colorName});
                                }
                                else {
                                    cart.items.push({ product: product._id, quantity: quantity, color, size, image , colorName});
                                }
                            }
                        })
                    }
                })
            }
            console.log(`step ${i}`)
        }
        await cart.save();

        res.status(200).json({ status: 'success', message: 'Thêm sản phẩm vào giỏ hàng thành công' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra', error: error });
    }
}







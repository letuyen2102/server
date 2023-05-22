const Product = require('./../models/Product')
const APIFeatures = require('./query')
// const upload = require('../middleware/uploadImage')
const multer = require('multer');
const path = require('path')
const appRoot = require('app-root-path');
const { default: slugify } = require('slugify');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, appRoot + "/public/image/products");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});

const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|avif|AVIF|webp|WEBP)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter });

const formatImageUpload = async () => {
    const colors = await Product.aggregate([
        {
            $unwind: '$quantity'
        },
        {
            $unwind: '$quantity.size'
        },
        {
            $group: {
                _id: '$quantity.color'
            }
        }
    ]);

    const colorList = colors.map(color => color._id);
    // console.log(colorList)
    const imageFormatUpload = colorList.map((each, idx) => {
        return {
            name: `imageSlideShow${each}`,
            maxCount: 20
        }
    })
    imageFormatUpload.push({ name: 'imageMainProduct', maxCount: 1 })
    return imageFormatUpload
}

exports.uploadImageMainProduct = async (req, res, next) => {
    const uploadFields = await formatImageUpload();
    upload.fields(uploadFields)(req, res, err => {
        if (err) {
            res.status(400).json({
                status: 'error',
                message: err.message
            })
        } else {
            next();
        }
    });
}


exports.getImageProduct = async (req, res, next) => {
    if (req.fileValidationError) {
        return res.send(req.fileValidationError);
    }
    next()
};
exports.uploadImageToCreateProduct = upload.any()
exports.createProduct = async (req, res) => {
    try {
        const { 
            name,
            description,
            oldPrice,
            sale,
            quantity,
            categoryName
        } = req.body

        let fixQuantity = JSON.parse(quantity)
        const createProd = new Product({
            name ,
            description ,
            oldPrice ,
            sale ,
            quantity : fixQuantity ,
            categoryName
        })
        if (req.files) {
            req.files.forEach((each,idx) => {
                if (each.fieldname === 'imageMainProduct') {
                    createProd.image = each.filename
                }
            })
            createProd.quantity.forEach((each, idx) => {
                const arrayImage = req.files.filter((mm,nn) => {
                    return mm.fieldname === `imageSlideShow${slugify(each.colorName, { locale: 'vi', lower: true })}`
                }).map((hh,jj) => {
                    return hh.filename
                })
                console.log(arrayImage)
                each.imageSlideShows = [...arrayImage]
            })
        }
        await createProd.save()
        res.status(201).json({
            status: 'success',
            product : createProd
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.getAllProducts = async (req, res, next) => {
    try {
        const feature = new APIFeatures(Product.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate()
        const products = await feature.query

        res.status(200).json({
            status: 'success',
            length: products.length,
            products
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })

        if (!product) {
            throw new Error('Không có sản phẩm này')
        }
        res.status(200).json({
            status: 'success',
            product
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}
exports.getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.ID)

        if (!product) {
            throw new Error('Không có sản phẩm này')
        }
        res.status(200).json({
            status: 'success',
            product
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.filterProducts = async (req, res, next) => {
    try {
        const filter = {};
        const sortObj = {};
        let result;
        if (req.query.sort) {
            const sortFields = req.query.sort.split(',');
            sortFields.forEach(sortField => {
                let sortOrder = 1;
                if (sortField.startsWith('-')) {
                    sortOrder = -1;
                    sortField = sortField.substring(1);
                }
                sortObj[sortField] = sortOrder;
            });
        }
        if (req.query.color) {
            filter['quantity.color'] = {
                $in: [req.query.color]
            }
        }

        if (req.query.type) {
            filter.type = req.query.type;
        }
        if (!req.query.category) {
            const products = await Product.find({});
            const categories = new Set(products.map(product => product.category));
            result = Array.from(categories);
        } else {
            filter.category = req.query.category
            const products = await Product.find(filter);
            const types = new Set(products.map(product => product.type));
            result = Array.from(types);
        }

        if (req.query.minPrice && req.query.maxPrice) {
            filter.newPrice = {
                $gte: Number(req.query.minPrice),
                $lt: Number(req.query.maxPrice)
            };
        } else if (req.query.minPrice) {
            filter.newPrice = {
                $gte: Number(req.query.minPrice)
            };
        } else if (req.query.maxPrice) {
            filter.newPrice = {
                $lt: Number(req.query.maxPrice)
            };
        }
        const products = await Product.find(filter).sort(sortObj);
        console.log(filter)
        res.status(200).json({
            status: 'success',
            length: products.length,
            products,
            result
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}


exports.updateProduct = async (req, res) => {
    try {
        let {
            name,
            description,
            oldPrice,
            sale,
            quantity,
            categoryName,
        } = req.body
        console.log('helooooooo')
        const updateProduct = await Product.findById(req.params.idProduct)
        let fixQuantity = JSON.parse(quantity)
        updateProduct.name = name
        updateProduct.description = description
        updateProduct.oldPrice = +oldPrice
        updateProduct.sale = +sale
        updateProduct.quantity = [...fixQuantity]
        updateProduct.categoryName = categoryName
        if (req.files) {
            req.files.forEach((each,idx) => {
                if (each.fieldname === 'imageMainProduct') {
                    updateProduct.image = each.filename
                }
            })
            updateProduct.quantity.forEach((each, idx) => {
                const arrayImage = req.files.filter((mm,nn) => {
                    return mm.fieldname === `imageSlideShow${slugify(each.colorName, { locale: 'vi', lower: true })}`
                }).map((hh,jj) => {
                    return hh.filename
                })
                console.log(arrayImage)
                each.imageSlideShows = [...each.imageSlideShows,...arrayImage]
            })
        }
        await updateProduct.save({ validateBeforeSave: 'false' })

        res.status(200).json({
            status: 'success',
            newProduct: updateProduct
        })
    }
    catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        })
    }
}

exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('categoryName');

        res.status(200).json({
            status: 'success',
            categories
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};
// exports.getCategories = async (req, res, next) => {
//     try {
//         const categories = await await Product.aggregate([
//             { $group: {
//               _id: { category: "$category", categoryName: "$categoryName" }
//             }},
//             { $project: {
//               category: "$_id.category",
//               categoryName: "$_id.categoryName",
//               _id: 0
//             }}
//           ]);
//         res.status(200).json({
//             status: 'success',
//             categories
//         });
//     } catch (err) {
//         res.status(500).json({
//             status: 'error',
//             message: err.message
//         });
//     }
// };
exports.getColors = async (req, res) => {
    try {
        const colors = await Product.aggregate([
            {
                $unwind: '$quantity'
            },
            {
                $unwind: '$quantity.size'
            },
            {
                $group: {
                    _id: '$quantity.colorName'
                }
            }
        ]);

        const colorList = colors.map(color => color._id);

        res.status(200).json({
            status: 'success',
            colors: colorList
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};
exports.getTypesByCategory = async (req, res) => {
    try {
        const result = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    types: { $addToSet: "$type" }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    types: 1
                }
            }
        ]);
        res.status(200).json({
            status: "success",
            result
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Đã có lỗi xảy ra' });
    }
};

exports.getProductsByCategory = async (req, res, next) => {
    try {
        const { category } = req.query;
        let result;

        if (!category) {
            const products = await Product.find({});
            const categories = new Set(products.map(product => product.category));
            result = Array.from(categories);
        } else {
            const products = await Product.find({ category });
            const types = new Set(products.map(product => product.type));
            result = Array.from(types);
        }

        res.status(200).json({
            status: 'success',
            result
        });
    } catch (error) {
        console.log(err);
        res.status(500).json({ error: 'Đã có lỗi xảy ra' });
    }
}

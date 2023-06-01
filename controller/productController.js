const Product = require('./../models/Product')
const APIFeatures = require('./query')
// const upload = require('../middleware/uploadImage')
const multer = require('multer');
const path = require('path')
const {CloudinaryStorage} = require('multer-storage-cloudinary')
const appRoot = require('app-root-path');
const { default: slugify } = require('slugify');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_CLOUD_KEY,
    api_secret: process.env.API_CLOUD_SECRET,
});
require('dotenv').config({
    path : './../config.env'
  })
const storage = multer.memoryStorage()
const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|avif|AVIF|webp|WEBP)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage});

exports.getImageProduct = async (req, res, next) => {
    if (req.fileValidationError) {
        return res.send(req.fileValidationError);
    }
    next()
};
exports.uploadImageToCreateProduct = upload.any()
exports.createProduct = async (req, res) => {

    try {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_CLOUD_KEY,
            api_secret: process.env.API_CLOUD_SECRET,
        });
      const { 
        name,
        description,
        oldPrice,
        sale,
        quantity,
        categoryName
      } = req.body;
  
      let fixQuantity = JSON.parse(quantity);
      const createProd = new Product({
        name ,
        description ,
        oldPrice ,
        sale ,
        quantity : fixQuantity ,
        categoryName
      });
      if (req.files) {
        const uploadPromises = req.files.map((file) => {
            return new Promise((resolve, reject) => {
              const { originalname, buffer , fieldname} = file;
                if (fieldname === 'imageMainProduct') {
                    cloudinary.uploader.upload_stream(
                        {
                          folder: 'my_image_product',
                          public_id: originalname.split('.')[0],
                          resource_type: 'image',
                        },
                        (error, result) => {
                          if (error) {
                            console.error(error);
                            reject(error);
                          } else {
                            createProd.image = result.url
                            resolve(result);
                          }
                        }
                      ).end(buffer);
                }
                for (let i = 0; i < createProd.quantity.length; i++) {
                    const each = createProd.quantity[i];
                    if (fieldname === `imageSlideShow${slugify(each.colorName, { locale: 'vi', lower: true })}`) {
                        cloudinary.uploader.upload_stream(
                            {
                              folder: 'my_image_product',
                              public_id: originalname.split('.')[0],
                              resource_type: 'image',
                            },
                            (error, result) => {
                              if (error) {
                                console.error(error);
                                reject(error);
                              } else {
                                each.imageSlideShows = [...each.imageSlideShows ,result.url ] 
                                resolve(result);
                              }
                            }
                          ).end(buffer);
                    }
                }
            });
          });

          const cloudinaryResults = await Promise.all(uploadPromises);
      }
  
      await createProd.save();
      res.status(201).json({
        status: 'success',
        product : createProd
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  };
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
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_CLOUD_KEY,
            api_secret: process.env.API_CLOUD_SECRET,
        });
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
            const uploadPromises = req.files.map((file) => {
                return new Promise((resolve, reject) => {
                  const { originalname, buffer , fieldname} = file;
                    if (fieldname === 'imageMainProduct') {
                        cloudinary.uploader.upload_stream(
                            {
                              folder: 'my_image_product',
                              public_id: originalname.split('.')[0],
                              resource_type: 'image',
                            },
                            (error, result) => {
                              if (error) {
                                console.error(error);
                                reject(error);
                              } else {
                                updateProduct.image = result.url
                                resolve(result);
                              }
                            }
                          ).end(buffer);
                    }
                    for (let i = 0; i < updateProduct.quantity.length; i++) {
                        const each = updateProduct.quantity[i];
                        if (fieldname === `imageSlideShow${slugify(each.colorName, { locale: 'vi', lower: true })}`) {
                            cloudinary.uploader.upload_stream(
                                {
                                  folder: 'my_image_product',
                                  public_id: originalname.split('.')[0],
                                  resource_type: 'image',
                                },
                                (error, result) => {
                                  if (error) {
                                    console.error(error);
                                    reject(error);
                                  } else {
                                    each.imageSlideShows = [...each.imageSlideShows ,result.url ] 
                                    resolve(result);
                                  }
                                }
                              ).end(buffer);
                        }
                    }
                });
              });
    
              const cloudinaryResults = await Promise.all(uploadPromises);
              console.log(cloudinaryResults)
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
            message: err
        })
    }
}
exports.deleteProduct = async (req , res) => {
    try {
        const { idProduct } = req.params

        const filterProd = await Product.findByIdAndDelete(idProduct)

        if (!filterProd) {
            throw new Error('Không có sản phẩm này trong kho')
        }

        res.status(200).json({
            status : 'success',
            message : 'Xóa sản phẩm thành công'
        })
    }
    catch(err){
        res.status(400).json({
            status : 'error',
            message : err.message
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
exports.searchProducts = async (req, res) => {
    try {
      const { query } = req.body;
        console.log(query)

        if (query.trim().length === 0 || !query) {
            res.status(200).json({
                status : 'success',
                products : []
              })
        }
      // Tìm kiếm sản phẩm dựa trên tên hoặc mô tả
      else {
        const products = await Product.find({
            $or: [
              { name: { $regex: query, $options: 'i' } }, // Tìm kiếm theo tên (không phân biệt chữ hoa/chữ thường)
              { description: { $regex: query, $options: 'i' } }, // Tìm kiếm theo mô tả (không phân biệt chữ hoa/chữ thường)
            ],
          });
      
          res.status(200).json({
            status : 'success',
            products
          })
      }
    } catch (error) {
      res.status(500).json({ error: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm' });
    }
  };
const Category = require("../models/Category")
exports.getCategorys = async (req,res) => {
    try {
        const categories = await Category.find()
        res.status(200).json({
            status : "success",
            categories
        })
    }
    catch(err){
        res.status(400).json({
            status : "error",
            message : err.message
        })
    }
}
// exports.getCategory = async (req , res) => {
//   try {
//     const category = await 
//   }
//   catch(err){
//     res.status(400).json({
//       status : "error",
//       message : err.message
//   })
//   }
// }
exports.getCategoryStats = async (req, res) => {
    try {
      const stats = await Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'name',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $project: {
            _id: 0,
            name: 1,
            displayName: 1,
            productCount: { $size: '$products' }
          }
        }
      ]);
      res.status(200).json({
        status: 'success',
        stats
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err.message
      });
    }
  };
exports.getCategoryById = async (req,res) => {
    try {
        const cate = req.params.cate
        const categories = await Category.find({name : cate})
        const products = categories.map((each , idx) => {
            return each.products
        })
        console.log(products)
        res.status(200).json({
            status : "success",
            products: products[0]
        })
    }
    catch(err){
        res.status(400).json({
            status : "error",
            message : err.message
        })
    }
}
exports.createCategory = async (req , res) => {
    try{
        const {name , displayName} = req.body
        const category = await Category.create({name , displayName})
        res.status(201).json({
            status : 'success',
            category
        })
    }
    catch(err){
        res.status(400).json({
            status : "error",
            message : err.message
        })
    }
}
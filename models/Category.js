const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    unique : true
  }
} , {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

categorySchema.virtual('products', {
    ref: 'Product',
    foreignField: 'category',
    localField: 'name'
  });

categorySchema.pre(/^find/ , async function(next) {
    this.populate('products')
    next()
})

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

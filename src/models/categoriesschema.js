const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  staytype : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "stay",
    required: true,
  },
  category_name : {
    type: String,
    unique: true,
  }
}, {timestamps: true});

CategorySchema.index({ staytype: 1 })

module.exports = mongoose.model('categories', CategorySchema);
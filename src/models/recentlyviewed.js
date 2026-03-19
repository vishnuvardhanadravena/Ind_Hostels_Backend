const mongoose = require('mongoose');

const RecentlyViewedSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'products'
  },
  viewAt: {
    type: Date,
    default: Date.now()
  }
},{timestamps: true})

module.exports = mongoose.model('recentlyviewed', RecentlyViewedSchema);
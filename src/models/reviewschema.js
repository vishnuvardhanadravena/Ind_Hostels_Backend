const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  propertyid: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'products',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  aboutstay : {
    type: String,
    required: true
  },
  rating : {
    type: Number,
    required: true
  },
  helpful: {
    type: Number,
    default: 0
  },
  nothelpful: {
    type: Number,
    default: 0
  },
  verifiedstay: {
    type: Boolean,
    default: false
  },
  stayeddate: {
    type: String
  },
  roomtype: {
    type: String
  },
  usersids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    }
  ]
  // reviewimage: {
  //    type: String,
  //    required: true
  // }
},
{ timestamps: true }
);

reviewSchema.index({ rating: 1 })
reviewSchema.index({ propertyid: 1 })
module.exports = mongoose.model('reviews', reviewSchema);

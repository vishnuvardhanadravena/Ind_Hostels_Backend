const mongoose = require('mongoose');

const PricingMatrixSchema = new mongoose.Schema({
   accommodation_id : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'accommodations'
   },
   room_id : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'rooms'
   },
   pricing: [
     {
       price : {
         type : Number,
         required : true
       },
       price_type : {
         type : String,
         required : true
       }
     }
   ]
} ,{ timestamps : true });

PricingMatrixSchema.index({ 'pricing.price': 1 })
PricingMatrixSchema.index({ room_id: 1 })

module.exports = mongoose.model('PricingMatrix', PricingMatrixSchema);

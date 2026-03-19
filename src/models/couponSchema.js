const mongoose = require("mongoose"); 


const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    discounttype:{
        type: String,
        enum: ['percentage','fixed'],
        default: 'percentage'
    },
    discountpercentage:{
        type: Number,
        default: 0
    },
    discountamount:{
         type:Number,
         default: 0
    },
    expireDate:{
        type:Date
    },
    minimumamount:{
        type: Number,
        default: 0
    },
    status:{
        type: String,
        enum: ['active','inactive'],
        default: 'active'
    },
    targetedAccommodations:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'accommodations'
        }
    ],
    usedBy:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    ],
    Id:{
        type: mongoose.Schema.Types.ObjectId
    }
},{timestamps:true})

couponSchema.index({ couponCode: 1, couponCode: 'text'})
module.exports = mongoose.model('coupon',couponSchema)
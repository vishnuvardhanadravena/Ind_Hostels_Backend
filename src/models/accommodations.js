const mongoose = require("mongoose");

const accommodationschema = new mongoose.Schema(
  {
    property_name: {
      type: String,
      required: [true, "Property name is required"],
    },
    property_description: {
      type: String,
      required: [true, "Property description is required"],
    },
    property_type: {
      type: String,
      required: [true, "Property type is required"],
    },
    category_name:{
      type: String,
      required: [true, "Category name is required"]
    },
    location: {
      city:{
         type: String,
         required: [true, "City is required"]
      },
      area:{
         type: String,
         required: [true, "area is required"]
      },
      address:{
         type: String,
         required: [true, "address is required"]
      },
      locationurl:{
         type: String
      },
      lat:{
        type: Number
      },
      lont:{
        type: Number
      }
    },
    amenities:{
      type: Array,
      required: [true, "Amenities is required"]
    },
    room_types:{
      type: Array,
      required: [true, "Room types is required"]
    },
    check_in_time:{
      type: String
    },
    check_out_time:{
      type: String
    },
    cancellation_policy:{
      type: String,
      enum: ['before24hrs','before48hrs','nocancellation'],
      required: [true, "Cancellation policy is required"]
    },
    host_details:{
      host_contact:{
        type: String,
        required: [true, "Host contact is required"]
      },
      host_name:{
        type: String,
        required: [true, "Host name is required"]
      }
   },
    images_url: [{ type: String }],
    room_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'rooms'
      }
    ],
    deal_of_the_day:{
      type: Boolean,
      default: false
    }, 
    deal_offer_percent:{
      type: Number,
      default: 0
    },
    tax: {
       type: Boolean,
       default: false
    },
    tax_amount: {
       type: Number
    },
    pricing_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PricingMatrix'
      }
    ],
    isverified:{
      type: Boolean,
      default: false,
      required: [true, 'Is verified is required']
    },
    reasonfornotverified:{
      type: String,
      default: undefined
    },
    vendor_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendors'
    },
    bookingcount:{
       type: Number,
       default: 0
    },
    isbestfor:{
       type: String,
       enum: ['students','professionals','travellers','families']
    },
    nearby:{
      type: [String],
      enum: ["universities","cochingcenters","itparks","offices","busstands","shoppingmalls","airports","railwaystations","hospitals","banks","supermarkets"]
    }
  },
  { timestamps: true }
);

accommodationschema.index({ category: 1 });
accommodationschema.index({ 'location.city': 1 ,property_type: 1 })
accommodationschema.index({ room_types: 1})
accommodationschema.index({ isverified: 1, category_name: 1 })
accommodationschema.index({ isverified: 1, 'location.city': 1 })


module.exports = mongoose.model("accommodations", accommodationschema);

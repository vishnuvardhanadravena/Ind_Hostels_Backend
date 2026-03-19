const mongoose = require("mongoose");
const sitename = process.env.SITE_NAME;
const {confirmbookingmail} = require("../utils/emailTemplates.js");
const {sendEmail} = require("../utils/sendEmail.js");



const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    accommodationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accommodations",
      required: true
    },
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "rooms",
      required: true
    },
    price_type:{
      type: String,
      required: true
    },
    room_price:{
      type: Number,
      required: true
    },
    check_in_date: {
      type: Date,
      required: true
    },
    check_out_date: {
      type: Date,
      required: true
    },    
    bookingId: {
      type: String
    },
    days: {
      type: String,
      required: true
    },
    guests: {
      type: Number,
      required: true
    },
    roomtype: {
      type: String,
      required: true
    },
    guestdetails:{
      fullname: {
        type: String
      },
      mobilenumber: {
        type: Number,
      },
      emailAddress: {
        type: String,
      },
      stayinfo:{
        check_in: {
          type: Date,
          required: true
        },
        check_out: {
          type: Date,
          required: true
        },
        roomtype: {
          type: String,
          required: true
        }
      },
        agreed: {
          type: Boolean,
          required: true
        },
        noofadults: {
          type: Number,
          required: true
        },
        noofchildrens: {
          type: Number,
          required: true
        },
        gender: {
          type: String,
          required: true
        }
    },
    status: {
      type: String,
      enum: [
        "confirmed",
        "checkin",
        "checkout",
        "requested_for_cancel",
        "cancelled",
        "pending"
      ],
      default: "pending"
    },
    bookedAt: {
      type: Date,
      default: Date.now()
    },
    bookingamount: {
      type: Number,
      required: true
    },
    couponCode: {
      type: String
    },
    discountamount: {
      type: Number
    },
    paymentid:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "userpayments"
    },
    vendorId:{
      type: mongoose.Schema.Types.ObjectId
    }
  },
  { timestamps: true }
);
orderSchema.index({ accommodationId: 1});
orderSchema.index({ status: 1});
orderSchema.index({ userId: 1})

function generateBookingId() {
  const prefix = `BOK${sitename}`;
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

orderSchema.pre("save", function (next) {
  if (!this.bookingId) {
    this.bookingId = generateBookingId();
  }
  next();
});

// orderSchema.pre("save", async function (order,next){
//   if(order.status === "confirmed"){
//      await sendEmail({
//         to: this.email,
//         subject: "Account verification",
//         text: confirmbookingmail(),
//       }); 
    
//   }
//   next();
// })

module.exports = mongoose.models.orders || mongoose.model("orders", orderSchema);

const mongoose = require("mongoose");

const userpaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    bookingid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orders",
        required: true
    },
    BookingId: {
        type: String,
        required: true
    },
    bookingamount: {
        type: Number,
        required: true
    },
    payment_mode: {
      type: String,
      enum: ["online", "coc"],
      default: "coc"
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "cancelled"],
      default: "unpaid"
    },
    paymentInfo: {
      razorpay_payment_id: String,
      razorpay_order_id: String,
      razorpay_signature: String
    },
    invoice: {
      type: String
    },
    invoiceurl: {
      type: String
    },
    tax: {
      type: Number
    }

},{timestamps:true}) 
userpaymentSchema.index({ payment_status: 1})

module.exports = mongoose.model("userpayments", userpaymentSchema);

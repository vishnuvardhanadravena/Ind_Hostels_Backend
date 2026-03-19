const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true,"User id is required"]
    },
    bookingId: {
        type: String,
        required: [true,"Booking id is required"]
    },
    category: {
        type: String,
        enum: ["Booking Issue", "Payment Help", "Room Issue", "General Question"],
        required: [true,'Category is required']
    },
    subject: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Open", "In Progress", "Resolved"],
        default: "Open"
    }
}, {
    timestamps: true
}) 

ticketSchema.index({ userId: 1 })

module.exports = mongoose.model("tickets", ticketSchema);
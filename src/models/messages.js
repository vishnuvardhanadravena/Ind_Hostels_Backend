const mongoose = require("mongoose"); 

const messageSchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tickets",
        required: true
    },
    sender:{
        type: String,
        enum: ['user','admin'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    attachment: {
        type: String
    },
    
},{
    timestamps: true
})

messageSchema.index({ ticketId: 1 })

module.exports = mongoose.model("messages", messageSchema);
const mongoose = require("mongoose");

const recentlyviewsSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    accommodation_ids: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Accommodation"
        }
    ]
}, { timestamps: true })

module.exports = mongoose.model("recentlyviews", recentlyviewsSchema);
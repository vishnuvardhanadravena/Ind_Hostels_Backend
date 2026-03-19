const mongoose = require("mongoose"); 

const staySchema = new mongoose.Schema({
    staytype: {
        type: String,
        required: [true, "Stay name is required"],
    }
})

module.exports = mongoose.model("stay", staySchema);

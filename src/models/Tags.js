const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
    tagname:{
        type:String,
        required:true
    }
},{timestamps:true})

module.exports = mongoose.model("Tags",tagSchema)
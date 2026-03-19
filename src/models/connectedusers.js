const mongoose = require("mongoose"); 
const { default: isEmail } = require("validator/lib/isEmail");


const connectedusersSchema = new mongoose.Schema({
    email:{
         type: String,
         required: true
    },
    name:{
         type: String
    }
    
},{timestamps: true})


module.exports = mongoose.model("connectedusers", connectedusersSchema)

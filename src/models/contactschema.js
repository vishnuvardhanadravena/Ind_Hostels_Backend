const mongoose = require('mongoose');


const contactSchema = new mongoose.Schema({
  userId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'users',
  },
  fullname : {
    type : String,
    required : [true , 'fullname is required']
  },
  email :{
    type : String,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    trim: true,
    ref : 'users',
    required : [true , 'email is required']
  },
  phone: {
    type : Number,
    required : [true , 'phone is required']
  },
  subject: {
     type: String,
     required : [true , 'subject is required']
  },
  message : {
    type : String,
    required : [true , 'message is required']
  }
},
{ timestamps: true }
);

module.exports = mongoose.model('queryForm', contactSchema);
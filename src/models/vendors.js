const mongoose = require('mongoose')
const bcrypt = require('bcrypt'); 

const vendorschema = new mongoose.Schema({
     full_name: {
        type: String,
        required: true
     },
     email: {
        type: String,
        required: true,
        validator: {
          function(value){
             return  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          },
          message: "Invalid email format"
        }
     },
    phone : {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return /^\d{10}$/.test(value);
        },
        message: "Phone number must be a 10-digit number",
      unique : true
      },
    },
     address: {
        city:{
            type: String
        },
        state:{
           type: String
        },
        address:{
            type: String
        }
     },
     password:{
        type: String,
        required: true
      //   validate: {
      //      validator: function (value){
      //        return /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[A-Za-z\d@#$%^&+=!]{8,}$/.test(value)
      //      },
      //      message: "Password must contain at least 8 characters, including one uppercase letter, one number, and one special character."
      //   }
     },
    account_type:{
       type: String,
       enum: ['vendor'],
       default: 'vendor'
    },
     status: {
      type: String,
      enum: ["inactive", "active", "Blocked"],
      default: "inactive"
    },
    verify_expiry: {
       type: Date,
      default: undefined
    },
   otp: {
      type: Number,
      default: undefined
    },
    otp_expiry: {
      type: Date,
      default: undefined
    },
    profileimage:{
      type: String,
      default: undefined
    },
    documents:{
      type: [String]
    },
    isVerified:{
      type: Boolean,
      default: false
    },
    bankdetails: [
       {
        account_holder_name: {
           type: String,
           //required: true
        },
        account_number: {
           type: String,
           //required: true,
           unique: true
        },
        ifsc_code: {
          type: String,
          //required: true
        },
        bank_name: {
          type: String,
          //required: true
        },
        isActive:{
          type: Boolean,
          default: false
        }
       }
    ]
},{timestamps: true})


vendorschema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

//compare the password  :
vendorschema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('vendors', vendorschema)

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/sendEmail.js");
const { conformSignup } = require('../utils/emailTemplates.js');

const userschema = new mongoose.Schema(
  {
    googleId: {
      type: String,
    },
    profileUrl: { 
      type: String, 
    },
    fullname: {
      type: String,
      required: true
    },
    gender:{
      type: String
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    phone : {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^\d{10}$/.test(value);
        },
        message: "Phone number must be a 10-digit number",
      },
    },
    status: {
      type: String,
      enum: ["inactive", "active", "Blocked"],
      default: "inactive"
    },
    accountType: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    istermsandConditions: {
      type: Boolean,
      default: true
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
    location: {
       state: {
         type: String,
         default: ""
       },
       city: {
         type: String,
         default: ""
       }
    },
    wishlist: [
      {
        accommodationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "accommodations"
        },
        AddedOn: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);
//userschema.index({ firstname: "text", lastname: "text", email: "text", phone: "text" })
//compare the password  :
userschema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

//send the verification mail every time when email get updated :
// userschema.pre("save", async function (next) {
//   if(this.googleId === undefined){
//     if (this.isModified("email")) {
//       const encodedId = Buffer.from(this._id.toString(), "utf-8").toString("base64");
//       this.verify_expiry = Date.now() + 2 * 60 *  1000;
//       this.status = 'inactive';
//       const fullname = this.fullname
//       await sendEmail({
//         to: this.email,
//         subject: "Account verification",
//         text: conformSignup(fullname, encodedId),
//       });
//       console.log(encodedId);
//     }
//   }
//   next();
// });

//hash all in comming password Strings :
userschema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("users", userschema);

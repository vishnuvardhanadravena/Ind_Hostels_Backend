const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/sendEmail.js");
const { conformSignup } = require('../utils/emailTemplates.js');

const adminSchema = new mongoose.Schema(
  {
    // googleId: {
    //   type: String,
    // },
    profileUrl: { 
      type: String, 
    },
    firstname: {
      type: String,
      required: [true, "firstname is Mandatory"],
      trim: true,
    },
    lastname: {
      type: String,
      required: [true, "lastname is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      unique: [true, "email is already taken"],
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
      minlength: [8, "Password should be at least 8 characters long"],
      trim: true,
      validate: {
        validator: function (value) {
          // Skip validation if password is already hashed
          if (value.startsWith("$2b$")) return true;
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value
          );
        },
        message:
          "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.",
      },
    },
    phone : {
      type: Number,
    },
    status: {
      type: String,
      enum: ["inactive", "active", "terminate"],
      default: "inactive",
      trim: true,
    },
    verify_expiry: {
      type: Date,
    },
    accountType: {
      type: String,
      enum: ['admin','superadmin'],
      default: 'admin'
    }
  },
  { timestamps: true }
);

//compare the password  :
adminSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

//hash all in comming password Strings :
adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("admins", adminSchema);

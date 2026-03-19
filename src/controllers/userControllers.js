const users = require("../models/userschema.js");
const accommodations = require("../models/accommodations.js");
const queryForm = require("../models/contactschema.js");
const { sendEmail } = require("../utils/sendEmail.js");
const authUser = require("../middlewares/authUser.js");
const { generateUserToken } = authUser;
const {ForgetPassword,SetNewPassword,conformSignup} = require("../utils/emailTemplates.js");
const { default: mongoose, mongo } = require("mongoose");
const orders = require("../models/ordersSchema.js");
const { deleteOldImages } = require("../middlewares/S3_bucket.js");
const bcrypt = require('bcrypt'); 
const { json } = require("body-parser");
const notifi = require("../models/notificationsSchema.js");
const pricing = require("../models/PricingSchema.js");
const payments = require("../models/userpayments.js");
const connectedusers = require("../models/connectedusers.js");
const messages = require("../models/messages.js")
const tickets = require("../models/tickets.js")


//set password after google oauth signup :
exports.setNewPassword = async (req, res, next) => {
  try{
     const {googleId} = req.params
     const {newpassword} = req.body
     if(!googleId || !newpassword){
        const error = new Error("All fields are required")
        error.statuscode = 400;
        error.status = 'Bad Request'
        return next(error)
     }
     const decodedId = Buffer.from(googleId, "base64").toString("utf-8");
     //console.log(decodedId)
     if(!decodedId){
       const error = new Error("Invalid authentication code")
       error.statuscode = 400;
       error.status = 'Bad Request'
       return next(error)
     }
     const user_response = await users
     .findOne({googleId: decodedId})
     .select("firstname lastname email googleId set_password_expiry") 
     //console.log(user_response)
     if(!user_response){
        const error = new Error("User not found")
        error.statuscode = 404;
        error.status = 'Not Found'
        return next(error)
     }
     if(Date.now() > user_response.set_password_expiry){
        const error = new Error("Time expired, Try again")
        error.statuscode = 401;
        error.status = 'Bad Request'
        return next(error)
     }
     user_response.password = newpassword
     await user_response.save()
     return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Password set successfully, please login",
     })
  }catch(error){
    console.log(error.message)
     const err = new Error('Internal Server Error')
     err.statuscode = 500;
     err.status = 'Internal Server Error'
     return next(err)
  }
};

//account signup for user :
exports.signUp = async (req, res, next) => {
  try{
       const { fullname, email, phone,password,confirmpassword,istermsandConditions} = req.body;
        if(!fullname || !email || !phone || !password || !confirmpassword || !istermsandConditions){
          const error = new Error("All fields are required")
          error.statuscode = 400;
          error.status = 'Bad Request'
          return next(error)
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            const error = new Error("Invalid email format")
            error.statuscode = 400;
            error.status = 'Bad Request'
            return next(error)
        }
         const phoneRegex = /^\d{10}$/;
        if(!phoneRegex.test(phone)){
            const error = new Error("Invalid phone number format")
            error.statuscode = 400;
            error.status = 'Bad Request'
            return next(error)
        }
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[A-Za-z\d@#$%^&+=!]{8,}$/;
        if(!passwordRegex.test(password)) {
          const error = new Error('Password must contain at least 8 characters, including one uppercase letter, one number, and one special character.')
          error.statuscode = 400;
          error.status = 'Bad Request';
          return next(error);
        }
        if(password !== confirmpassword){
            const error = new Error("Passwords not match")
            error.statuscode = 400;
            error.status = 'Bad Request'
            return next(error)
        }
        const existed_user = await users.findOne({phone : phone})
        if(existed_user){
          if(existed_user.status === 'inactive'){
           if(Date.now() > existed_user.otp_expiry){
            const otp_responsee = authUser.genrateotp()
            existed_user.otp = otp_responsee.otp
            existed_user.otp_expiry = otp_responsee.otp_expiry
            await existed_user.save()
            return res.status(200).json({
              success: true,
              statuscode: 200,
              message: "Account not verified. A new OTP has been sent,pls verify",
              otp: otp_responsee?.otp,
              otp_expiry: otp_responsee?.otp_expiry,
            });
           }
         }
          const error = new Error("User already exists")
          error.statuscode = 400;
          error.status = 'Bad Request'
          return next(error)
        }


        const otp_response = authUser.genrateotp()
        const newuser = await users.create({
           fullname: fullname,
           email: email,
           phone: phone,
           password: password,
           istermsandConditions: istermsandConditions,
           otp: otp_response.otp,
           otp_expiry: otp_response.otp_expiry,
        })
       return res.status(200).json({
         success: true,
         message: "You have successfully signup,pls verify your account",
         otp: otp_response?.otp,
         otp_expiry: otp_response?.otp_expiry,
         statuscode: 200,
       });

  }catch (error) {
     console.log(error.message)
     const err = new Error('Internal Server Error')
     err.statuscode = 500;
     err.status = 'Internal Server Error';
     return next(err);
  }
};


exports.verifiotp = async(req,res,next) => {
   try{
      const {otp,phone}= req.query
      if(!otp){
         const error = new Error("OTP is required")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      const user_response = await users.findOne({ phone: phone })
      // .explain("executionStats")
      // console.log(JSON.stringify(user_response,null,2))
      if(!user_response){
         const error= new Error("user not found")
         error.statuscode = 404;
         error.status = 'Not Found'
         return next(error)
      }

      if(user_response.otp != otp){
         return res.status(400).json({
            success: false,
            statuscode: 400,
            message: "otp is wrong check your otp"
         })
      }
      if(user_response.status === 'inactive'){
        // if(Date.now() > user_response.otp_expiry){
        //   otp_response = authUser.genrateotp()
        //   user_response.otp = otp_response.otp
        //     user_response.otp_expiry = otp_response.otp_expiry
        //     await user_response.save()
        //     return res.status(200).json({
        //       success: true,
        //       statuscode: 200,
        //       message: "Account not verified. A new OTP has been sent,pls verify",
        //       otp: otp_response?.otp,
        //       otp_expiry: otp_response?.otp_expiry,
        //     });
        // }
        user_response.status = "active"
        user_response.otp = undefined
        user_response.otp_expiry = undefined
        await user_response.save()
        res.status(200).json({
          success: true,
          message: "Account verified successfully",
          statuscode: 200,
        });
    }
    else {
      if (Date.now() > user_response.otp_expiry) {
        const error = new Error("Time expired, Please login again");
        error.statuscode = 401;
        error.status = "Bad Request";
        return next(error);
      }
      const token = authUser.generateUserToken(user_response);
      res.status(200).json({
        success: true,
        message: "Login successfully",
        statuscode: 200,
        JWTtoken: token,
        userID: user_response._id,
        role: user_response.accountType,
        phone: user_response.phone,
      });
    }
   }catch(error){
     return res.status(500).json({
        success: false,
        statuscode: 500,
        error: error.message,
        message: "Internal Server Error"
     })
   }
};

//user sign in
exports.signIn = async (req, res, next) => {
  const { email, password, phone } = req.body;
  // Check if either (email and password) or (just phone) is provided
  if (!((phone && password) || phone)) {
     const error = new Error("Either email & password or phone number is required");
     error.statuscode = 400;
     error.status = 'Bad Request';
     return next(error);
  }
  // If email is provided, it must be valid
  // if (email) {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(email)) {
  //     const error = new Error('Invalid email address format');
  //     error.statuscode = 400; 
  //     error.status = 'Bad Request';
  //     return next(error);
  //   }
  // }
  try {
     if(phone && password){
      const user_respose = await users.findOne({phone: phone})
    .select("password fullname accountType status phone email googleId")
    // .explain("executionStats")
    // console.log(JSON.stringify(user_respose,null,2))
    if (!user_respose) {
       const error = new Error('User Not Found')
       error.statuscode = 404;
       error.status = 'Not Found';
       return next(error)
    }
    if (user_respose.accountType !== "user") {
        const error = new Error('You are not Authorized')
        error.statuscode = 401; 
        error.status = 'Not Authorized';
        return next(error)
    }

    if(user_respose.status !== "active") {
      const error = new Error('Account is Inactive please verify')
      error.statuscode = 402;
      error.status = 'Bad Request';
      return next(error)
    }  

    if (user_respose.password === undefined || !user_respose.password) {
        if(user_respose.googleId !== undefined){
            const decodedGoogleId = Buffer.from(
              user_respose.googleId.toString(),
              "utf-8").toString("base64")
              await sendEmail({
                 to: user_respose.email,
                 subject: "Create New Password",
                 text: SetNewPassword(decodedGoogleId, user_respose.fullname)
              });
              user_respose.set_password_expiry = Date.now() + 30 * 60 * 1000;
              await user_respose.save();
              console.log(decodedGoogleId)
              const error = new Error('Password not set for the user, please check the inbox')
              error.statuscode = 400;
              error.status = 'Bad Request';
              return next(error)
           }
        }

    const isValidPassword = await user_respose.comparePassword(password);
    if (!isValidPassword) {
       const error = new Error('Password does not match')
       error.statuscode = 401;
       error.status = 'Bad Request';
       return next(error)
    }

    const token = generateUserToken(user_respose);
    user_respose.verify_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    await user_respose.save();
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "login successfully",
      JWTtoken: token,
      username: user_respose.fullname,
      userID: user_respose._id,
      role: user_respose.accountType,
      email: user_respose.email,
      phone: user_respose.phone,
    });
     }else if(phone){
        const user_response = await users.findOne({phone: phone})
        let otp_response = await authUser.genrateotp()
        if(!user_response){
           const error = new Error('User Not Found')
           error.statuscode = 404;
           error.status = 'Not Found';
           return next(error)
        }
        if(user_response.status === "inactive"){
            const error = new Error("Account is Inactive please verify")
            error.statuscode = 402;
            error.status = 'Bad Request';
            return next(error)
        }
        user_response.otp = otp_response.otp
        user_response.otp_expiry = otp_response.otp_expiry
        await user_response.save()
        return res.status(200).json({
          success: true,
          statuscode: 200,
          message: "Otp sent successfully,pls verify for login",
          otp: otp_response?.otp,
          otp_expiry: otp_response?.otp_expiry,
        });
     }else{
      const error = new Error('Something went wrong')
      error.statuscode = 400;
      error.status = 'Bad Request'
      return next(error)
     }
  } catch (error) {
     console.log(error.message)
     const err = new Error('Internal Server Error')
     err.statuscode = 500;
     err.status = 'Server Error';
     return next(err)
  }
};





//ressnd verification link to the user :
exports.resendotp = async (req, res,next) => {
  const { phone } = req.body;
  if (!phone) {
     const error = new Error('Phone is required')
     error.statuscode = 400;
     error.status = 'Bad Request'
     return next(error);
  }
  try {
    const user_response = await users.findOne({ phone: phone });
    if (!user_response) {
       const error = new Error("User not found")
       error.statuscode = 404;
       error.status = 'Not Found'
       return next(error)
    }
    let resend_otp;
    if(user_response.status === "inactive"){
        resend_otp = await authUser.genrateotp()
       user_response.otp = resend_otp.otp
       user_response.otp_expiry = resend_otp.otp_expiry
       await user_response.save()
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "link send to the email successfully",
      otp: resend_otp?.otp,
      otp_expiry: resend_otp?.otp_expiry,
    });
  } catch (error) {
    //console.log(error.message)
    const err = new Error('Internal Server Error') 
    err.statuscode = 500;
    error.status = 'server Error';
    return next(err);
  }
};

//user account verification :
exports.verifyaccount = async (req, res, next) => {
  const { verifykey } = req.query;
  //console.log(otp)
  if(!verifykey){
     const error = new Error('Verification key is required')
     error.statuscode = 400;
     error.status = 'Bad Request';
     return next(error);
  }
  try {
    const decodedId = Buffer.from(verifykey, "base64").toString("utf-8");
    if (!decodedId) {
       const error = new Error("Authentication code not found");
       error.statuscode = 404;
       error.status = 'Not found';
       return next(error);
    }
    const User_respose = await users.findById(decodedId)
    
    if (!User_respose) {
      const error = new Error("User not found");
      error.statuscode = 404;
      error.status = 'Not found';
      return next(error)
    }
    //timer for the account activation
    if (
      Date.now() > User_respose.verify_expiry ||
      User_respose.verify_expiry === undefined
    ) {
         const encodedId = Buffer.from(User_respose._id, "utf-8").toString(
      "base64"
    );
    const fullname = User_respose.fullname;
    await sendEmail({
      to: User_respose.email,
      subject: "Account verification",
      text: conformSignup(fullname, encodedId),
    });
    User_respose.verify_expiry = Date.now() + 30 * 60 * 1000;
    await User_respose.save();
   //console.log("Encoded ID:", encodedId);
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "time expired, verification link send to the email successfully",
      });
    }
    User_respose.status = "active";
    User_respose.verify_expiry = undefined;
    await User_respose.save(); 
    // console.log("Verification key from frontend:", req.query.verificationKey); 
    // console.log("Decoded ID:", decodedId);

    res.status(200).json({
      success: true,
      message: "Mail verified successfully",
      statuscode: 200,
    });
  } catch (error) {
     console.log(error.message)
     const err = new Error('Internal Server Error')
     err.statuscode = 500;
     err.status = 'Server Error';
     return next(err);
  }
};








//get user by ID :
exports.getById = async (req, res,next) => {
  try {
    const id = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
       const error = new Error('Invalid user ID format')
       error.statuscode = 400;
       error.status = 'Bad Request';
       return next(error)
    }
    // const explain = await users.findById(id).explain("executionStats");
    // console.log(JSON.stringify(explain, null, 2));
    const user_response = await users
      .findById(id).select('fullname email gender phone profileUrl location')
    if (!user_response) {
       const error = new Error('User not found')
       error.statuscode = 404;
       error.status = 'Not Found';
       return next(error);
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      user_response,
    });
  } catch (error) {
    const err = new Error('Internal Server Error')
    err.statuscode = 500; 
    err.status = 'Server Error';
    return next(err)
  }
};

//forget password :
exports.forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {  
       const error = new Error('Email is required')
       error.statuscode = 400; 
       error.status = 'Bad Request'; 
       return next(error)
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
       const error = new Error('Invalid or missing email address')
       error.statuscode = 400; 
       error.status = 'Bad Request'; 
       return next(error)
    }
    const user_response = await users.findOne({ email: email})
    // .explain("executionStats");
    // console.log(JSON.stringify(user_response, null, 2));
    if (!user_response) { 
       const error = new Error('Invalid mail ID, Please check')  
       error.statuscode = 404;
       error.status = 'Not Found';
       return next(error);
    }
    if(user_response.status !== "active") {
      const error = new Error("Account is Inactive please verify")
      error.statuscode = 402;
      error.status = 'Bad Request';
      return next(error)
    }
    // const securedEmail = await doubleEncrypt(user.email);
    await sendEmail({
      to: email,
      subject: "forget password link",
      text: ForgetPassword(user_response.fullname,email,user_response.accountType),
    });
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "A password reset link has been sent to your email.",
    });
  } catch (error) {
    //console.log(error.message)
    const err = new Error('Internal Server')
    err.statuscode = 500;
    err.status = 'Server Error';
    return next(err);
  }
};

//set a new password after forget password link :
exports.setPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const error = new Error("All Fields Are Required"); 
      error.statuscode = 400; 
      error.status = 'Bad Request'; 
      return next(error);
    }
    const user_response = await users
      .findOne({ email })
    if (!user_response) { 
      const error = new Error("Email not found or user not found") 
      error.statuscode = 404; 
      error.status = 'Not Found'; 
      return next(error);
    }
    if(user_response.status !== "active") {
      const error = new Error("Account is Inactive please verify")
      error.statuscode = 402;
      error.status = 'Bad Request';
      return next(error)
    }
    user_response.password = password;
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Your password has been updated",
    });  
  } catch (error) {
    const err = new Error('Internal Server Error')
    err.statuscode = 500 
    err.status('server error')
    return next(err)
  }
};

// reset the password using old password :
exports.changePassword = async (req, res,next) => {

   const {oldpassword, newpassword,confirmpassword} = req.body;
   if(!oldpassword || !newpassword || !confirmpassword) {
      const error = new Error('All fields are required')
      error.statuscode = 400; 
      error.status = 'Bad Request';
      return next(error);
   }
   try{
     const user = await users.findById(req.user._id).select('password');
     if(!user){
       const error = new Error('User does not exist')
       error.statuscode = 404;
       error.status = 'Not Found';
       return next(error);
     }
     const isPassword = await bcrypt.compare(oldpassword, user.password)
     if(!isPassword){
       const error = new Error('Incorrrect password')
       error.statuscode = 401;
       error.status = 'Bad Request';
       return next(error)
     }
     const isSamePassword = await bcrypt.compare(newpassword, user.password);
     if(isSamePassword){
        const error = new Error('New password should not be same as old password')
        error.statuscode = 400;
        error.status = 'Bad Request';
        return next(error);
     }
     if(newpassword !== confirmpassword){
        const error = new Error('New password and confirm password should be same')
        error.statuscode = 400;
        error.status = 'Bad Request';
        return next(error);
     }
     user.password = newpassword; 
     await user.save(); 
     return res.status(200).json({
       success: true,
       statuscode: 200,
       message: "Password updated successfully, Please log in."
     }) 
   }catch(error){
      //console.log(error.message);
      const err = new Error('Internal Server Error')
      err.statuscode = 500;
      err.status = 'Server Error';
      return next(err);
   }
};

//update user profile using ID :
exports.update = async (req, res,next) => {
  try {
    const allowed = ["fullname","state","city","gender","email"];
    const updatedData = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) { 
          if(field === 'state'){
            updatedData['location.state'] = req.body[field];
          }else if(field === 'city'){
            updatedData['location.city'] = req.body[field];
          }else{
            updatedData[field] = req.body[field];
          }
      }
    });
    const updatedUser_response = await users.findByIdAndUpdate(req.user._id, { $set: updatedData }, { new: true, runValidators: true });

    if (!updatedUser_response) { 
       const error = new Error('user not found or not updated')
       error.statuscode = 404; 
       error.status = 'Not Found';
       return next(error);
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Profile updated successfully",
    });
  } catch (error) { 
    //console.log(error.message)
     const err = new Error('Internal Server Error')
     err.statuscode = 500; 
     err.status = error.message;
     return next(err)
  }
};

//upload user profile :
exports.uploadUserProfilePic = async (req, res) => {
  try {
    console.log("File:", req.file);
    if (!req.file) {
      return res.status(401).json({
        success: false,
        statuscode: 401,
        message: "profile image is required",
        error: "Bad Request",
      });
    }
    const profilePic = req.file.location;
    const user_response = await users.findById(req.user._id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "User not Found",
        error: "Not Found",
      });
    }
    if (user_response.profileUrl) {
       const key = decodeURIComponent(new URL(user_response.profileUrl).pathname
      ).substring(1); 
      await deleteOldImages(key);
    }
    user_response.profileUrl = profilePic;
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "User profile updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// user sign out :
exports.signOut = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "user logged out successfully",
    });
  } catch (error) { 
    const err = new Error('Internal Server Error')
    err.statuscode = 500;
    err.status = 'Server Error';
    return next(err)
  } 
};

exports.deleteaccount = async(req,res) => {
   try{
     const user_response = await users.findByIdAndDelete(req.user._id);
     if(!user_response){
       return res.status(404).json({
         success: false,
         statuscode: 404,
         message: "User not Found",
         error: "Not Found",
       });
     }
     Promise.all([
         await userAddresses.deleteMany({userId: req.user._id}),
         await carts.deleteMany({userId: req.user._id}),
         await orders.deleteMany({userId: req.user._id}),
         await payments.deleteMany({userId: req.user._id}),
         await coupons.deleteMany({userId: req.user._id}),
         await reviews.deleteMany({userId: req.user._id}),
         await wishlists.deleteMany({userId: req.user._id})
     ])
     return res.status(200).json({
       success: true,
       statuscode: 200,
       message: "User details and all related data deleted successfully",
     });

   }catch(error){
     return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
   }
};

exports.deactivateaccount = async(req,res) => {
   try{
      const deactivateaccount = await users.findByIdAndUpdate(req.user._id,{
         status: "Blocked"
      })
      if(!deactivateaccount){
        return res.status(404).json({
          success: false,
          statuscode: 404,
          message: "User not Found",
          error: "Not Found",
        });
      }
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "Account deactivated successfully",
      })

   }catch(error){
     return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
   }
};

exports.connectwithus = async( req,res,next) => {
   try{
     const {email} = req.body 
     if(!email){
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Email is required",
        error: "Bad Request",
      });
     }
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const error = new Error('Invalid or missing email address')
        error.statuscode = 400; 
        error.status = 'Bad Request'; 
        return next(error)
      }
      const use_res = await connectedusers.findOne({email:email})
      if(use_res){
        const error = new Error('User already connected')
        error.statuscode = 400; 
        error.message = "User already connected"
        error.status = 'Bad Request'; 
        return next(error)
      }
     const user_response = await users.findOne({email:email})
     if(user_response){
        const createdetails = await connectedusers.create({
           email:email,
           name:user_response.firstname + user_response.lastname
        })
        return res.status(200).json({
          success: true,
          statuscode: 200,
          message: "User connected successfully",
        })
     }else if(!user_response){
        await connectedusers.create({
           email: email,
           name: ""
        })
        return res.status(200).json({
          success: true,
          statuscode: 200,
          message: "User connected successfully",
        })
     }else{
        const error = new Error('User not found')
        error.statuscode = 404; 
        error.message = "User not found"
        error.status = 'Not Found'; 
        return next(error)
     }
   }catch(error){
     const err = new Error('Internal Server Error')
     err.statuscode = 500; 
     err.message = "Internal Server Error"
     err.status = 'Server Error';
     return next(err)
   }
};

//*********************   Submitting Contact Form :  ***********************/
exports.contactUs = async (req, res) => {
  try {
    const { fullname, email, phone, message,subject} = req.body;
    if (!req.user) {
      if (!fullname|| !email || !phone || !message || !subject) {
        return res.status(400).json({
          success: false,
          statuscode: 400,
          message: "all fields are required",
          error: "Bad Request",
        });
      }
      const userContactForm_response = await queryForm.create({
        fullname: fullname,
        email: email,
        phone: phone,
        message: message,
        subject: subject,
      });
      if (!userContactForm_response) {
        return res.status(401).json({
          success: false,
          statuscode: 401,
          message: "unable to send message, please try after sometime",
        });
      }
    } else if (req.user) {
      if (!message || message === null) {
        return res.status(400).json({
          success: false,
          statuscode: 400,
          error: "message is required",
        });
      }
      const userContactForm_response = await queryForm.create({
        userId: req.user._id,
        fullname:  req.user.fullname || fullname,
        email: req.user.email || email,
        phone: req.user.phone || phone,
        message: message,
        subject: subject,
      });
      if (!userContactForm_response) {
        return res.status(401).json({
          success: false,
          statuscode: 401,
          message: "Unable send message, please try after sometime",
        });
      }
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "query submitted successfully, we will get back to you soon.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getnotificationsbyid = async (req, res) => {
  try {
    // If user is not authenticated, return empty notifications instead of crashing
    if (!req.user) {
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: 'No notifications for guest user',
        data: [],
        notificationscount: 0
      });
    }
    const Notifications = await notifi.find({
      targetedusers: req.user._id,  
      sendnow: true
    }).select('notificationtitle _id createdAt updatedAt');

    //console.log('Found notifications:', Notifications); 

    // Format dates to normal date strings
    const formattedNotifications = Notifications.map(noti => ({
      _id: noti._id,
      notificationtitle: noti.notificationtitle,
      createdAt: noti.createdAt ? new Date(noti.createdAt).toLocaleDateString() : null,
      updatedAt: noti.updatedAt ? new Date(noti.updatedAt).toLocaleDateString() : null
    })); 

    // if (!Notifications || Notifications.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     statuscode: 404,
    //     message: 'No notifications found for this user',
    //     error: 'Not Found'
    //   });
    // }

    // Unread notifications count for this user
    const unreadCount = await notifi.countDocuments({
      targetedusers: req.user._id,
      sendnow: true,
      notification_deliverd_to: { $not: { $elemMatch: { userid: req.user._id, read: true } } }
    });

    // Update notification status
    // for (const noti of Notifications) {
    //     noti.notification_deliverd_to = [req.user._id];
    //     noti.notificationread = true;
    //     await noti.save();
    // }

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Notifications fetched successfully',
      data: formattedNotifications,
      notificationscount: unreadCount
    });

  } catch (error) {
    console.error('Error in getnotificationsbyid:', error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
}; 
exports.getnotificationbyid = async(req,res) =>{
   try{
     const notificationid = req.params.notificationid;
     if(!notificationid){
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Notification ID is required',
        error: 'Bad Request'
      })
     }
     // Validate ObjectId format
     if (!mongoose.Types.ObjectId.isValid(notificationid)) {
       return res.status(400).json({
         success: false,
         statuscode: 400,
         message: 'Invalid notification ID format',
         error: 'Bad Request'
       })
     }

     // Ensure the notification exists
     const exists = await notifi.findById(notificationid).select('_id');
     if(!exists){
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'Notification not found',
        error: 'Not Found'
      })
     }
     // If user is not authenticated, return the notification without user-specific state
     if (!req.user) {
       const responseDoc = await notifi.findById(notificationid).select(' -targetedusers -notificationstatus -scheduletime');
       return res.status(200).json({
         success: true,
         statuscode: 200,
         message: 'Notification fetched successfully',
         data: responseDoc,
         notificationscount: 0
       });
     }
     // Mark as read for this user: if entry exists, set read=true; otherwise push a new entry
    const updateExisting = await notifi.updateOne(
      { _id: notificationid, 'notification_deliverd_to.userid': req.user._id },
      { $set: { 'notification_deliverd_to.$.read': true } }
    );
    if (updateExisting.modifiedCount === 0) {
      await notifi.updateOne(
        { _id: notificationid, 'notification_deliverd_to.userid': { $ne: req.user._id } },
        { $push: { notification_deliverd_to: { userid: req.user._id, read: true } } }
      );
    }

     // Fetch the notification details for response, excluding sensitive arrays
     const responseDoc = await notifi.findById(notificationid).select(' -targetedusers');

     // Calculate updated unread count for this user
     const unreadCount = await notifi.countDocuments({
       targetedusers: req.user._id,
       sendnow: true,
       notification_deliverd_to: { $not: { $elemMatch: { userid: req.user._id, read: true } } }
     });

     return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Notification fetched successfully',
      data: responseDoc,
      notificationscount: unreadCount
     })

   }catch(error){
    return res.status(500).json({
       success: false,
       statuscode: 500,
       message: 'Internal Server Error',
       error: error.message
    })
   }
};


//✅ user wishlist ✅

// Add to wishlist :
exports.addtowishlist = async(req, res) => {
  try{
    const {accommodationid} = req.body;
    if(!accommodationid){
       return res.status(400).json({
         success: false,
         statuscode: 400,
         message: 'Product ID is required',
         error: 'Bad Request'
       })
    }
    if(!req.user){
      return res.status(401).json({
        success: false,
        statuscode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      })
    }
    const product = await accommodations.findById(accommodationid).select('_id');
    if(!product){
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: 'Product not found',
        error: 'Not Found'
      })
    }
    const wishlist = req.user.wishlist;
    if(wishlist.some(wishlistItem => wishlistItem.accommodationId.toString() === accommodationid)){
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Product already in wishlist',
        error: 'Bad Request'
      })
    }
    wishlist.push({accommodationId: accommodationid});
    await req.user.save();
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Product added to wishlist',
      data: req.user.wishlist
    })
  }catch(error){
    return res.status(200).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
};

//Get wishlist :
exports.getwishlist = async(req,res) => {
     try{
        if(!req.user){
          return res.status(401).json({
            success: false,
            statuscode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized'
          })
        }
        const wishlist = await users.findById(req.user._id).select('wishlist')
        .populate({
          path: 'wishlist.accommodationId',
          select:"-__v -createdAt -updatedAt -property_description -check_in_time -cancellation_policy -host_contact -room_id",
          populate:{
             path: "pricing_ids",
             select:"-__v -createdAt -updatedAt"
          }
        });
        if(!wishlist){
          return res.status(404).json({
            success: false,
            statuscode: 404,
            message: 'Wishlist not found',
            error: 'Not Found'
          })
        }
        return res.status(200).json({
          success: true,
          statuscode: 200,
          message: 'Wishlist fetched successfully',
          data: wishlist
        })
      }catch(error){
        return res.status(200).json({
          success: false,
          statuscode: 500,
          message: 'Internal Server Error',
          error: error.message
        })
      }
};

//Delete perticular wishlist :

exports.deletewishlist = async(req,res) => {
   try{
     const {wishlistid} = req.query;
     if(!wishlistid){
       return res.status(400).json({
         success: false,
         statuscode: 400,
         message: 'Wishlist ID is required',
         error: 'Bad Request'
       })
     }
     const wishlist = req.user.wishlist;
     if(!wishlist.some(wishlistItem => wishlistItem._id.toString() === wishlistid)){
       return res.status(400).json({
         success: false,
         statuscode: 400,
         message: 'Accommodation not found in wishlist',
         error: 'Bad Request'
       })
     }
     const deleteWishlist = await users.updateOne(
       { _id: req.user._id },
       { $pull: { wishlist: { _id: wishlistid } } }
     );
     if(!deleteWishlist){
       return res.status(404).json({
         success: false,
         statuscode: 404,
         message: 'Wishlist not found',
         error: 'Not Found'
       })
     }
     return res.status(200).json({
       success: true,
       statuscode: 200,
       message: 'Accommodation deleted from wishlist'
     })
   }
   catch(error){
    return res.status(200).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
   }
};


//User Dashboard :
exports.userdashboard = async(req,res) => {
  try{
  //    const activebookings = await orders.countDocuments({
  // userId: req.user._id,
  // check_in_date: { $gte: new Date() }
  // });

  //   const pastbookings =await orders.countDocuments({
  //       userId: req.user._id,
  //       check_in_date: { $lte: new Date() }
  //     });

    const [activebookings, pastbookings] = await Promise.all([
      orders.countDocuments({
        userId: req.user._id,
        check_in_date: { $gte: new Date() }
      }),
      orders.countDocuments({
        userId: req.user._id,
        check_in_date: { $lte: new Date() }
      })
    ])

    const unreadmessages = await tickets.aggregate([
       {
         $match: {
           userId: req.user._id,
         }
       },
       {
         $lookup: {
            from: 'messages',
            localField: '_id',
            foreignField: 'ticketId',
            as: 'messages'
         }
       },
      {
        $group: {
          _id: null,
          count: { 
            $sum: {
              $cond: {
                if: { $gte: ["$messages.createdAt", new Date()] },
                then: 1,
                else: 0
              }
            }
          }
        }
      }
    ])

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day
    
    const currentstaying = await orders.findOne({
      userId: req.user._id,
      //status: "checkin",
      check_in_date: { $lte: currentDate },
      check_out_date: { $gte: currentDate },
    })
     .populate({
        path: 'userId',
        select: '-__v -createdAt -updatedAt -wishlist -password -otp -otp_expiry -verify_expiry',
        model: 'users'
      })
      .populate({
        path: 'accommodationId',
        select: '-__v -createdAt -updatedAt -room_id -pricing_ids',
        model: 'accommodations'
      })
      .populate({
        path: 'room_id',
        select: "-__v -createdAt -updatedAt -accommodation_id -pricing_id -rooms_avilable -beds_available -no_of_guests"
      })
      .populate('paymentid')
      .lean();


    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'User dashboard fetched successfully',
      data: {
        activebookings,
        pastbookings,
        unreadmessages,
        currentstaying: currentstaying ? currentstaying : null
      }
    })

  }catch(error){
     return res.status(200).json({
       success: false,
       statuscode: 500,
       message: 'Internal Server Error',
       error: error.message
     })
  }
};

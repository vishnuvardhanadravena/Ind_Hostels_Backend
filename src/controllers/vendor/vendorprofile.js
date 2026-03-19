const vendors = require("../../models/vendors") 
const auth = require("../../middlewares/authUser")
const bcrypt = require('bcrypt'); 
const {deleteOldImages} = require("../../middlewares/S3_bucket")
const {sendEmail} = require("../../utils/sendEmail")
const {VendorForgetPassword} = require("../../utils/emailTemplates");
const { json } = require("body-parser");

exports.vendorsignup = async(req,res,next) => {
   try{
      const {full_name,email,phone,city,state,address,password,documents,bankdetails} = req.body 
      if(!full_name || !email || !phone || !city || !state || !address || !password){
         const error = new Error("All fields are required")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      let bankDetailsObj = bankdetails;

      if (typeof bankdetails === "string") {
         try {
         bankDetailsObj = JSON.parse(bankdetails);
         } catch (e) {
         return next({
            message: "Invalid bank details format. Must be JSON array.",
            statuscode: 400
         });
         }
      }

      const [firstBankDetail] = Array.isArray(bankDetailsObj) ? bankDetailsObj : [bankDetailsObj];
      const { account_holder_name, account_number, ifsc_code, bank_name } = firstBankDetail || {};

    if (!account_holder_name || !account_number || !ifsc_code || !bank_name) {
      return next({
        message: "All bank fields are required",
        statuscode: 400
      });
    }

      const vendor_response = await vendors.findOne({phone: phone})
      if(vendor_response){
         // if(vendor_response.status === 'inactive'){
         //    if(Date.now() > vendor_response.otp_expiry){
         //       const otp_responsee = auth.genrateotp()
         //       vendor_response.otp = otp_responsee.otp
         //       vendor_response.otp_expiry = otp_responsee.otp_expiry
         //       await vendor_response.save()
         //       return res.status(200).json({
         //         success: true,
         //         statuscode: 200,
         //         message: "Account not verified. A new OTP has been sent,pls verify",
         //         otp: otp_responsee?.otp,
         //         otp_expiry: otp_responsee?.otp_expiry,
         //       });
         //    }
         // }
         const error = new Error("User already exists")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      // let bank_dts = Array.isArray(bankdetails)
      // ? bankdetails
      // : String(bankdetails).split(",").map(x => x.trim());
      
      // if(!Array.isArray(bank_dts)){
      //    return res.status(400).json({
      //        success: false,
      //        statuscode: 400,
      //        message: "Bank details is not an array",
      //        error: "Bad Request"
      //    })
      // }
      if(!req.files || req.files.length === 0){
         const error = new Error("Please upload a required documents")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      const accountnumbers = bankDetailsObj.map((bankDetail) => bankDetail.account_number)
      //console.log(new Set(accountnumbers))
      //console.log(new Set(accountnumbers).size)
      //console.log(accountnumbers.length)
      const hasduplicate = new Set(accountnumbers).size !== accountnumbers.length 
      if (hasduplicate) {
            return res.status(400).json({
               success: false,
               message: "Duplicate account numbers are not allowed for the same vendor"
            });
      }
      const repeatedAccount = await vendors.findOne({
          "bankdetails.account_number": { $in: accountnumbers }
      });
         if (repeatedAccount) {
         return res.status(400).json({
            success: false,
            message: "Bank account number already exists"
         });
         }

      const documet = req.files.map((file) => file.location)
      const otp_response = auth.genrateotp()
      const vendor = await vendors.create({
         full_name,
         email,
         phone,
         address:{
            city,
            state,
            address,
         },
         documents:documet,
         bankdetails: bankDetailsObj,
         password,
         status: 'active'
         // otp: otp_response.otp,
         // otp_expiry: otp_response.otp_expiry,
      })
      if(!vendor){
         const error = new Error("Vendor registration failed")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      return res.status(201).json({
         success: true,
         statuscode: 201,
         message: "Vendor registered successfully,Please login and wait for the approval",
         vendor: vendor,
         // otp: otp_response?.otp,
         // otp_expiry: otp_response?.otp_expiry,
      })
   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         message: "Internal Server Error",
         error: error.message
      })
   }
}

exports.vendorlogin = async(req,res,next) => {
    const { password, phone } = req.body;
  // Check if either (email and password) or (just phone) is provided
  if (!((phone && password) || phone)) {
     const error = new Error("Either email & password or phone number is required");
     error.statuscode = 400;
     error.status = 'Bad Request';
     return next(error);
  }
     try {
         if(phone && password){
          const vendor_response = await vendors.findOne({phone: phone})
        .select("password full_name account_type status phone email googleId isVerified")
        if (!vendor_response) {
           const error = new Error('User Not Found')
           error.statuscode = 404;
           error.status = 'Not Found';
           return next(error)
        }
        if (vendor_response.account_type !== "vendor") {
            const error = new Error('You are not Authorized')
            error.statuscode = 401; 
            error.status = 'Not Authorized';
            return next(error)
        }
    
        if(vendor_response.status !== "active") {
          const error = new Error('Account is Inactive please verify')
          error.statuscode = 402;
          error.status = 'Bad Request';
          return next(error)
        }  
     
        // if (vendor_response.password === undefined || !vendor_response.password) {
        //     if(vendor_response.googleId !== undefined){
        //         const decodedGoogleId = Buffer.from(
        //           user_respose.googleId.toString(),
        //           "utf-8").toString("base64")
        //           await sendEmail({
        //              to: user_respose.email,
        //              subject: "Create New Password",
        //              text: SetNewPassword(decodedGoogleId, vendor_response.fullname)
        //           });
        //           user_respose.set_password_expiry = Date.now() + 30 * 60 * 1000;
        //           await user_respose.save();
        //           console.log(decodedGoogleId)
        //           const error = new Error('Password not set for the user, please check the inbox')
        //           error.statuscode = 400;
        //           error.status = 'Bad Request';
        //           return next(error)
        //        }
        //     }

        const isValidPassword = await vendor_response.comparePassword(password);
        //console.log(isValidPassword)
        if (!isValidPassword) { 
           const error = new Error('Password does not match')
           error.statuscode = 401;
           error.status = 'Bad Request';
           return next(error)
        }
    
        const token = auth.genrateVendorToken(vendor_response);

        vendor_response.verify_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
        await vendor_response.save();
        return res.status(200).json({
          success: true,
          statuscode: 200,
          message: "login successfully",
          JWTtoken: token,
         isVerified: vendor_response.isVerified,
         vendorID: vendor_response._id,
        });
         }else if(phone){
            const vendor_response = await vendors.findOne({phone: phone})
            let otp_response = await auth.genrateotp()
            if(!vendor_response){
               const error = new Error('User Not Found')
               error.statuscode = 404;
               error.status = 'Not Found';
               return next(error)
            }
            if(vendor_response.status === "inactive"){
                const error = new Error("Account is Inactive please verify")
                error.statuscode = 402;
                error.status = 'Bad Request';
                return next(error)
            }
            vendor_response.otp = otp_response.otp
            vendor_response.otp_expiry = otp_response.otp_expiry
            await vendor_response.save()
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
      } catch(error){
    console.log(error.message)
     const err = new Error('Internal Server Error')
     err.statuscode = 500;
     err.status = 'Internal Server Error'
     return next(err)
    }
}

exports.vendorverifiotp = async(req,res,next) => {
   try{
      const {otp,phone}= req.query
      if(!otp){
         const error = new Error("OTP is required")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      const vendor_response = await vendors.findOne({ phone: phone });
      if(!vendor_response){
         const error= new Error("User not found")
         error.statuscode = 404;
         error.status = 'Not Found'
         return next(error)
      }
      if(vendor_response.otp != otp){
          const error = new Error("Otp is wrong")
          error.statuscode = 400
          error.status = 'Not Found' 
          return next(error)
      }
      if(vendor_response.status === 'inactive'){
        if(Date.now() > vendor_response.otp_expiry){
            return res.status(200).json({
              success: true,
              statuscode: 200,
              message: "Otp expired,Please Signup again with same details",
            });
        }
        vendor_response.status = "active"
        vendor_response.otp = undefined
        vendor_response.otp_expiry = undefined
        await vendor_response.save()
        res.status(200).json({
          success: true,
          message: "Account verified successfully",
          statuscode: 200,
        });
    }
    else {
      if (Date.now() > vendor_response.otp_expiry) {
        const error = new Error("Time expired, Please login again");
        error.statuscode = 401;
        error.status = "Bad Request";
        return next(error);
      }
      const token = auth.genrateVendorToken(vendor_response);
      res.status(200).json({
        success: true,
        message: "Login successfully",
        statuscode: 200,
        JWTtoken: token,
        vendorID: vendor_response._id,
        role: vendor_response.account_type,
        phone: vendor_response.phone,
        isVerified: vendor_response.isVerified
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
} 

exports.getvendorprofile = async(req,res,next) => {
   try{
     const vendor_response = await vendors.findById(req.vendor._id)
     if(!vendor_response){
        const error = new Error("User not found")
        error.statuscode = 404;
        error.status = 'Not Found'
        return next(error)
     }
     return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "User found",
        vendor_response
     })
   }catch(error){
     return res.status(500).json({
        success: false,
        statuscode: 500,
        error: error.message,
        message: "Internal Server Error"
     })
   }
} 

exports.updatevendor = async(req,res,next) => {
   try{
      const vendor_response = await vendors.findById(req.vendor._id)
      if(!vendor_response){
         const error = new Error("User not found")
         error.statuscode = 404;
         error.status = 'Not Found'
         return next(error)
      }
      const {full_name,location,bankdetails} = req.body
      const updatevendor = await vendors.findByIdAndUpdate(req.vendor._id,{
         full_name:full_name,
         location: location,
         bankdetails: bankdetails
      },
      {
        new: true,
        runValidators: true,
      }
   )
   if(!updatevendor){
       return res.status(400).json({
          success: false,
          statuscode: 400,
          message: "profile not updated"
       })
   }
      return res.status(200).json({
         success: true,
         statuscode: 200,
         message: "User updated successfully",
      })
     
   }catch(err){
     const error = new Error(err.message)
     error.statuscode = 500;
     error.status = 'Internal Server Error'
     return next(error)
   }
}

exports.uploadprofileimage = async(req,res) => {
   try{
      if(!req.file){
         const error = new Error("Image is required")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      const profilePic = req.file.location; 
      const vendor_response = await vendors.findById(req.vendor._id)
      if(!vendor_response){
         return res.status(404).json({
            success: false,
            statuscode: 404,
            message: "User not found"
         })
      }
      if(vendor_response.profileimage){
         const key = decodeURIComponent(new URL(vendor_response.profileimage).pathname
        ).substring(1)
        await deleteOldImages(key)
      }
      vendor_response.profileimage = profilePic
      await vendor_response.save()
      return res.status(200).json({
         success: true,
         statuscode: 200,
         message: "Profile image updated successfully",
         vendor_response
      })
   }catch(error){
     return res.status(500).json({
        success: false,
        statuscode: 500,
        error: error.message,
        message: "Internal Server Error"
     })
   }
}

exports.changepassword = async(req,res,next) => {
   try{
      const {oldpassword,newpassword,confirmpassword} = req.body
      if(!oldpassword || !newpassword || !confirmpassword){
         const error = new Error("All fields are required")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      const vendor_response = await vendors.findById(req.vendor._id)
      if(!vendor_response){
         const error = new Error("User not found")
         error.statuscode = 404;
         error.status = 'Not Found'
         return next(error)
      }
      const isMatch = await vendor_response.comparePassword(oldpassword)
      if(!isMatch){
         const error = new Error("Old Password is incorrect")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      if(newpassword !== confirmpassword){
         const error = new Error("confirm password does not match")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      vendor_response.password = newpassword
      await vendor_response.save()
      return res.status(200).json({
         success: true,
         statuscode: 200,
         message: "Password changed successfully",
         vendor_response
      })
   }catch(error){
      return res.status(500).json({
          success: false,
          statuscode: 500,
          error: error.message,
          message: "Internal Server Error"
      })
   }
}

exports.vendorforgetpassword = async(req,res,next) => {
   try{
      const {email} = req.body;
      if(!email){
         const error = new Error("Email is required")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      const vendor_response = await vendors.findOne({email}) 
      if(!vendor_response){
         const error = new Error("User not found")
         error.statuscode = 404;
         error.status = 'Not Found'
         return next(error)
      }
      if(vendor_response.status !== "active"){
         const error = new Error("User is not active,please verify your account")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }

      await sendEmail({
         to: email,
         subject: "forget password link",
         text: VendorForgetPassword(vendor_response.full_name,email,vendor_response.account_type)
      }) 

      return res.status(200).json({
         success: true,
         statuscode: 200,
         message: "Password reset link sent successfully"
      })

   }catch(error){
       return res.status(500).json({
          success: false,
          statuscode: 500,
          error: error.message,
          message: "Internal Server Error"
       })
   }
}

exports.resetpassword = async(req,res,next) => {
   try{
      const {email,password} = req.body;
      if(!email || !password){
         const error = new Error("Email and password are required")
         error.statuscode = 400;
         error.status = 'Bad Request'
         return next(error)
      }
      const vendor_response = await vendors.findOne({email}) 
      if(!vendor_response){
         const error = new Error("User not found")
         error.statuscode = 404;
         error.status = 'Not Found'
         return next(error)
      }
      vendor_response.password = password
      await vendor_response.save()
      return res.status(200).json({
         success: true,
         statuscode: 200,
         message: "Password reset successfully"
      })

   }catch(error){
       return res.status(500).json({
          success: false,
          statuscode: 500,
          error: error.message,
          message: "Internal Server Error"
       })
   }
} 

exports.updatebankdetails = async(req,res) => {
   try{
      const {id} = req.params
      const{isActive} = req.body 
      if(!isActive){
         return res.stauts(400).json({
            success: false,
            stautscode: 400,
            message: 'isAactive is required',
            error: 'Bad Request'
         })
      }
      const bankupdated =await vendors.updateOne(
               { _id: req.vendor._id },
               { $set: { 'bankdetails.$[elem].isActive': isActive } },
               { arrayFilters: [{ 'elem._id': id }] }
         )    
      return res.status(200).json({
         success: true,
         statuscode: 200,
         message: 'Bank details updated successfully'
      });

   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 500,
         error:error.message,
         message: 'Internal Server Error'
      })
   }
}
const { default: mongoose } = require("mongoose");
const { ObjectId } = mongoose.Types;
const users = require("../models/userschema");
const products = require("../models/accommodations.js");
//const pots = require("../models/potsschema.js");
const orders = require("../models/ordersSchema.js");
const admins = require("../models/adminSchema.js");
const queryForm = require("../models/contactschema.js");
const { generateUserToken } = require("../middlewares/authUser.js");
const { deleteOldImages } = require("../middlewares/S3_bucket.js");
const coupon = require('../models/couponSchema.js');
const { sendEmail } = require("../utils/sendEmail.js");
const { AadminForgetPassword, newProductEmailTemplate, contactFormResponse } = require("../utils/emailTemplates.js");
const notifi = require('../models/notificationsSchema.js');
const payments = require('../models/userpayments.js');
const connectedusers = require('../models/connectedusers.js');
const staymodel = require("../models/stay.js");
const vendors = require("../models/vendors.js");
const accommodations = require("../models/accommodations.js");
const rooms = require("../models/rooms.js")
//✅Admin Calls ✅

exports.adminSignup = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    if (!firstname || !lastname || !email || !password) {
      const error = new Error("All fields are required");
      error.statuscode = 401
      error.status = 'Bad Request'
      return next(error);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const error = new Error('Invalid or missing email address');
      error.statuscode = 402;
      error.status = 'Bad Request';
      return next(error);
    }

    const all_admins = await admins.find({accountType: 'admin'})
    if(all_admins.length >= 1){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: "you can add only one admin only"
        })
    }else{
      const existed_response = await admins.findOne({ email: email,accountType: 'admin' });
      if (existed_response) {
        const error = new Error('Email already exists, try another');
        error.statuscode = 403;
        error.status = 'Bad Request';
        return next(error);
      } 
    }
    const User_response = await admins.create({
      firstname,
      lastname,
      email,
      password,
      status: "active",
    });
    if (!User_response) {
      const error = new Error('unable to create account, please contact patiofy Team')
      error.statuscode = 404;
      error.status = 'Database error';
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Admin account created successfully",
    });
  } catch (error) {
    const err = new Error('Internal Server Error')
    err.statuscode = 500;
    err.status = error.message
    return next(err)
  }
};

exports.superadminsignup = async( req,res,next) => {
   try{
    const {firstname, lastname, email, password} = req.body 
    if (!firstname || !lastname || !email || !password) {
      const error = new Error("All fields are required");
      error.statuscode = 401
      error.status = 'Bad Request'
      return next(error);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const error = new Error('Invalid or missing email address');
      error.statuscode = 402;
      error.status = 'Bad Request';
      return next(error);
    }
    const existed_response = await admins.findOne({ email: email });
    if (existed_response) {
      const error = new Error('Email already exists, try another');
      error.statuscode = 403;
      error.status = 'Bad Request';
      return next(error);
    }
    const User_response = await admins.create({
      firstname,
      lastname,
      email,
      password,
      status: "active",
      accountType: "superadmin"
    });
    if (!User_response) {
      const error = new Error('unable to create account, please contact patiofy Team')
      error.statuscode = 404;
      error.status = 'Database error';
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Admin account created successfully",
    });

   }catch(error){
     return res.status(500).json({
        success: false,
        statuscode: 500,
        message: 'Internla Server Error',
        error: error.message
     })
   }
}

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const error = new Error("All fields are required");
      error.statuscode = 400;
      error.status = 'Bad Request';
      return next(error);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const error = new Error('Invalid or missing email address');
      error.statuscode = 401;
      error.status = 'Invalid or missing email address';
      return next(error);
    }
    const user_response = await admins
      .findOne({
        email: email,
      })
      .select("password firstname lastname accountType")
    //   .explain("executionStats")
    //  console.log(JSON.stringify(user_response,null,2))
    if (!user_response) {
      const error = new Error('Incorrect Email');
      error.statuscode = 402;
      error.status = 'Bad Request';
      return next(error);
    }
    if (user_response.accountType !== "admin" && user_response.accountType !== "superadmin") {
      const error = new Error('You are not Authorized to access this resource');
      error.statuscode = 403;
      error.status = 'Unauthorized';
      return next(error);
    }
    if (user_response.password === undefined || !user_response.password) {
      const error = new Error('Password not set');
      error.statuscode = 404;
      error.status = 'Bad Request';
      return next(error);
    }
    const isValidPassword = await user_response.comparePassword(password);
    if (!isValidPassword) {
      const error = new Error('Incorrect Password');
      error.statuscode = 402;
      error.status = 'UnAuthorized';
      return next(error);
    }

    if (user_response.status === "inactive") {
      const error = new Error('Account is Inactive please verify');
      error.statuscode = 402;
      error.status = 'Bad Request';
      return next(error);
    }

    const token = generateUserToken(user_response);
    user_response.verify_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "login successfully",
      JWTtoken: token,
      username: user_response.firstname + " " + user_response.lastname,
      userID: user_response._id,
      role: user_response.accountType,
    });
  } catch (error) {
    const err = new Error('Internal Server Error');
    err.statuscode = 500;
    err.status = 'Internal Server Error';
    return next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldpassword, newpassword } = req.body;
    if (!oldpassword || !newpassword) {
      return res.status(400).json({
        error: "all fields are required",
      });
    }
    const user_response = await admins.findById(req.user._id).select("password");
    if (!user_response) {
      return res.status(404).json({
        success: false,
        message: "user does not exist",
      });
    }
    const ispassword = await user_response.comparePassword(oldpassword, user_response.password)
    if (!ispassword) {
      const error = new Error('Incorrect old password');
      error.statuscode = 401;
      error.status = 'Bad Request'
      return next(error);
    }
    const Ispassword = await user_response.comparePassword(newpassword, user_response.password)
    if (Ispassword) {
      const error = new Error('New password is same as old password');
      error.statuscode = 401;
      error.status = 'Bad Request'
      return next(error);
    }
    user_response.password = newpassword;
    await user_response.save();
    return res.status(200).json({
      success: true,
      message: "password updated successfully, Please Login",
    });
  } catch (error) {
    const err = new Error('Internal Server Error');
    err.statuscode = 500;
    err.status = error.message
    return next(err);
  }
};

exports.adminProfileUpdate = async (req, res, next) => {
  try {
    const allowed = ["firstname", "lastname", "phone", "Address"];
    const updatedData = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    });
    const updatedUser_response = await admins.findByIdAndUpdate(
      req.user._id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    )
    if (!updatedUser_response) {
      const error = new Error('User not found')
      error.statuscode = 404
      error.status = 'Not found'
      return next(error)
    }
    return res.status(200).json({
      success: true,
      statuscode: 2,
      message: "Profile updated successfully",
    });
  } catch (error) {
    const err = new Error('Internal Server Error')
    err.statuscode = 500;
    err.status = error.message
    return next(err)
  }
};

exports.getadmindata = async (req, res, next) => {
  try {
    const id = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid user ID format')
      error.statuscode = 400;
      error.status = 'Bad Request';
      return next(error)
    }
    const user = await admins.findById(id).select('-verify_expiry -createdAt -updatedAt -password_attempts -isTermsAndConditions -__v')
    // .explain("executionStats")
    // console.log(JSON.stringify(user,null,2))
    if (!user) {
      const error = new Error('User not found')
      error.statuscode = 404;
      error.status = 'Not Found';
      return next(error);
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Admin data retrieved successfully",
      data: user

    })
  }
  catch (error) {
    const err = new Error('Internal Server Error');
    err.statuscode = 500;
    err.status = 'Server Error';
    return next(err);
  }
};

exports.uploadadminProfilePic = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('profile image is required')
      error.statuscode = 401;
      error.status = 'Bad Request'
      return next(error)
    }
    const profilePic = req.file.location;
    const user_response = await admins.findById(req.user._id);
    if (!user_response) {
      const error = new Error('User not found')
      error.statuscode = 404;
      error.status = 'Not Found'
      return next(error)
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
      message: 'Profile image updated successfully'
    })
  } catch (error) {
    const err = new Error('Internal Server Error')
    err.statuscode = 500;
    err.status = 'Server Error';
    return next(err)
  }
};

exports.adminforgetpassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      const error = new Error('Email is required')
      error.statuscode = 400;
      error.status = 'Bad Request'
      return next(error)
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error('Invalid or missing email address')
      error.statuscode = 400;
      error.status = 'Bad Request'
      return next(error)
    }
    const user = await admins.findOne({ email })
    if (!user) {
      const error = new Error('User not found')
      error.statuscode = 404;
      error.status = 'Not Found'
      return next(error)
    }
    const fullname = user.firstname + ' ' + user.lastname;
    const role = user.accountType;
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: AadminForgetPassword(fullname, email, role)
    })
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Passowrd reset link sent successfully',
    })
  } catch (error) {
    const err = new Error('Internal Server Error')
    err.statuscode = 500;
    err.status = 'Server Error';
    return next(err);
  }
};

exports.adminsetnewpassword = async (req, res, next) => {
  try {
    //console.log('Request body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      //console.log('Missing email or password');
      const error = new Error('Email and password are required');
      error.statuscode = 400;
      error.status = 'Bad Request';
      return next(error);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      //console.log('Invalid email format:', email);
      const error = new Error('Invalid or missing email address');
      error.statuscode = 400;
      error.status = 'Bad Request';
      return next(error);
    }

    //console.log('Looking for user with email:', email);
    const user = await admins.findOne({ email });
    if (!user) {
      //console.log('User not found with email:', email);
      const error = new Error('User not found');
      error.statuscode = 404;
      error.status = 'Not Found';
      return next(error);
    }

    //console.log('Updating password for user:', email);
    user.password = password;
    await user.save();

    //console.log('Password updated successfully for user:', email);
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Password updated successfully, Please Login',
    });

  } catch (error) {
    //console.error('Error in adminsetnewpassword:', error);
    const err = new Error(error.message || 'Internal Server Error');
    err.statuscode = error.statuscode || 500;
    err.status = error.status || 'Server Error';
    return next(err);
  }
};

// ✅Action on  User ✅

//set a user account inactive : 
exports.setUserInactive = async (req, res) => {
  try {
    const { id } = req.params;
    const { Blocked, Unblock } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        statuscode: 1,
        message: "Invalid Id",
        error: "Bad Request"
      });
    }
    if (req.user._id === id) {
      return res.status(401).json({
        success: false,
        statuscode: 2,
        message: "you are not permitted",
        error: "Unauthorized",
      });
    }
    const user_response = await users.findById(id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "user not found",
        error: "Not Found"
      });
    }
    if (Blocked === true) {
      user_response.status = "Blocked";
      await user_response.save();
      return res.status(200).json({
        success: true,
        statuscode: 5,
        message: "user account set Blocked successfully",
      });
    }
    if (Unblock === true) {
      user_response.status = "active";
      await user_response.save();
      return res.status(200).json({
        success: true,
        statuscode: 5,
        message: "user account set active successfully",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all users : 
exports.viewAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;
    const status = req.query.status 
    //console.log(status)
    let allusers
    let total
    if(status){
      allusers = await users.find({status: status})
      .select("firstname lastname email phone status _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    total = await users.countDocuments({status: status})
      if(!allusers || allusers.length === 0){
        return res.status(404).json({
          success: false,
          message: "users not found",
        });
      }
    }else{
       allusers = await users.find()
      .select("firstname lastname email phone status _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
     total = await users.countDocuments()
    if (!allusers || allusers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "users not found",
      });
    }
    }
    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      success: true,
      message: "users retrieved successfully",
      data: allusers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// view a single user
exports.viewUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid ID",
      });
    }
    const user = await users
      .findById(id)
      .select("firstname lastname email -_id");
    if (!user) {
      return res.status(404).json({
        succecss: false,
        message: "user not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "user retrieved successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.searchuser = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "search is required",
      })
    }
    const searchusers = await users.aggregate([
      {
        $addFields: {
          phoneString: { $toString: "$phone" }
        }
      },
      { 
        $match: {
          $or: [
            { fullname: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phoneString: { $regex: search, $options: "i" } },
            { 'location.state': { $regex: search, $options: "i" } },
            { 'location.city': { $regex: search, $options: "i" } },
          ]
        }
      },
      {
        $project: {
          fullname: 1,
          email: 1,
          phone: 1,
          status: 1,
          _id: 1,
          location: 1
        }
      }
    ])
    // .explain("executionStats")
    // console.log(JSON.stringify(searchusers,null,2))
    if (!searchusers || searchusers.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "user not found",
      })
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "user retrieved successfully",
      data: searchusers,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}
// ✅ Products  ✅
//get all products fro the admin :
exports.getAllAccommodationForAdmim = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let allaccommodations
    const isverified = req.query.isverified
    if(isverified){
        allaccommodations = await products
      .find({isverified: isverified})
      .populate({ path: "pricing_ids", select: "-__v -createdAt -updatedAt" })
      .select("-__v -createdAt -updatedAt")
      .skip(skip)
      .limit(limit)
      .lean();
    if (allaccommodations.length === 0 || !allaccommodations) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "products not found",
      });
    }
    }else{
        allaccommodations = await products
      .find()
      .populate({ path: "pricing_ids", select: "-__v -createdAt -updatedAt" })
      .select("-__v -createdAt -updatedAt")
      .skip(skip)
      .limit(limit)
      .lean();
    if (allaccommodations.length === 0 || !allaccommodations) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "products not found",
      });
    }
    }
    const total = await allaccommodations.length;
    return res.status(200).json({
      success: true,
      statuscode: 200,
      page,
      data: allaccommodations,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
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

exports.getAccommodationByIdForAdmin = async (req, res) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: 'Bad Request'
      })
    }
    const accommodation_response = await products
      .findById(id)
      .select('-__v -createdAt -updatedAt -pricing_ids')
      .populate({
        path: 'room_id',
        select: '-__v -createdAt -updatedAt ',
        populate: {
          path: 'pricing_id',
          select: '-__v -createdAt -updatedAt'
        }
      })
      .exec();
    if (!accommodation_response) {
      return res.status(404).json({
        success: false,
        message: 'Accommodation not found',
        error: 'Not Found'
      })
    }
    return res.status(200).json({
      success: true,
      message: 'Accommodation retrived successfully',
      data: accommodation_response
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }

};


exports.getallconnectedusers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const allusers = await connectedusers.find()
      .skip(skip)
      .limit(limit)
      .lean()
    if (!allusers) {
      return res.status(404).json({
        success: false,
        message: 'No users found',
        error: 'Not Found'
      })
    }
    const total = await connectedusers.countDocuments()
    return res.status(200).json({
      success: true,
      message: 'All users retrived successfully',
      data: allusers,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}
// ✅ Action on Orders ✅

//view all inprogess orders :
exports.viewAllRecentOrders = async (req, res) => {
  try {
    const { accomid } = req.params
    // if(!accomid){
    //    return res.status(400).json({
    //       success: false,
    //       statuscode: 400,
    //       message: "accomid is required"
    //    })
    // }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (accomid && mongoose.isValidObjectId(accomid)) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // get total count first for pagination
      const totalCount = await orders.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      const allorders = await orders
        .find({ createdAt: { $gte: thirtyDaysAgo }, accommodationId: accomid })
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
        .populate("paymentid")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      if (!allorders || allorders.length === 0) {
        return res.status(404).json({
          success: true,
          message: "No recent orders found",
        });
      }
      res.status(200).json({
        success: true,
        page,
        total_pages: Math.ceil(totalCount / limit),
        total_items: totalCount,
        message: "Recent orders are retrieved",
        data: allorders,
      });
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // get total count first for pagination
      const totalCount = await orders.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      const allorders = await orders
        .find({ createdAt: { $gte: thirtyDaysAgo } })
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
        .populate("paymentid")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      if (!allorders || allorders.length === 0) {
        return res.status(404).json({
          success: true,
          message: "No recent orders found",
        });
      }
      res.status(200).json({
        success: true,
        page,
        total_pages: Math.ceil(totalCount / limit),
        total_items: totalCount,
        message: "Recent orders are retrieved",
        data: allorders,
      });
    }


  } catch (error) {
    console.error("Error in viewAllRecentOrders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all users orders :
exports.viewAllUsersOrders = async (req, res) => {
  try {
    const { accomid } = req.params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (accomid && mongoose.isValidObjectId(accomid)) {
      // total count first

      const allorders = await orders.find({ accommodationId: accomid })
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
        .populate("paymentid")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // .lean();
      // const explain = await orders.find({ accommodationId: accomid }).explain("executionStats")
      // console.log(JSON.stringify(explain,null,2))

      if (!allorders || allorders.length === 0) {
        return res.status(404).json({
          success: true,
          message: "No active orders found",
        });
      }
      const totalCount = await orders.find({accommodationId: accomid}).countDocuments()
      //console.log(totalCount)
      res.status(200).json({
        success: true,
        page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        message: "All users orders retrieved successfully",
        data: allorders,
      });
    } else {
      // total count first
      const allorders = await orders.find({})
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
        .populate("paymentid")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      if (!allorders || allorders.length === 0) {
        return res.status(404).json({
          success: true,
          message: "No active orders found",
        });
      }
      const totalCount = await orders.countDocuments({});
      res.status(200).json({
        success: true,
        page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        message: "All users orders retrieved successfully",
        data: allorders,
      });

    }

  } catch (error) {
    //console.error("Error in viewAllUsersOrders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all cancel request :
exports.viewAllCancelRequestedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Fetch only cancel requested orders
    const allorders = await orders
      .find({
        status: { $in: ["requested_for_cancel"] },
      })
      .populate("userId")
      .skip(skip)
      .limit(limit)
      .lean();
      // const explain = await orders.find({ status: "requested_for_cancel" }).explain("executionStats")
      // console.log(JSON.stringify(explain,null,2))
    res.status(200).json({
      success: true,
      page: page,
      total_pages: Math.ceil(
        (await orders.countDocuments({ status: "requested_for_cancel" })) /
        limit
      ),
      message: "Cancel request orders are retrieved",
      data: allorders,
    });
  } catch (error) {
    //console.error("Error in viewAllCancelRequestedOrders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.searchOrders = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "Search parameter is required",
        error: "Bad Request"
      });
    }

    // Check if search term is a valid ObjectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
    const allResults = [];

    // Search in orders collection
    let orderQuery = {
      $or: [
        { 'guestdetails.emailAddress': { $regex: search, $options: "i" } },
        //{ 'guestdetails.mobilenumber': { $regex: search, $options: "i" }},
        { 'bookingId': { $regex: search.toString(), $options: "i" } },
      ]
    };

    if (isObjectId) {
      orderQuery.$or.push({ _id: new mongoose.Types.ObjectId(search) });
    }
    const users_details = await users.find({
        $or: [
          { fullname: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          // { phone: { $regex: search.toString() , $options: "i" } }
        ]
   });
   const accos_details = await products.find({
        $or: [
          { 'location.city': { $regex: search, $options: "i" } },
          { 'location.area': { $regex: search, $options: "i" } }
        ]
   })
   
    if(users_details.length > 0){
    const userIds = users_details.map(u => u._id);

    const bookingResults = await orders.find({
        userId: { $in: userIds }
    });

    allResults.push(...bookingResults);
  }else if(accos_details.length > 0){
     const accosIds = accos_details.map(c => c._id)

     const bookingResults = await orders.find({
         accommodationId: {$in: accosIds}
     })

     allResults.push(...bookingResults)
  }
  

  const orderResults = await orders.find(orderQuery).lean();
  allResults.push(...orderResults);

    // Search in payments by invoice number
    const invoiceResults = await payments.find({
      invoice: { $regex: search.toString(), $options: "i" }
    }).lean();

    // If we found payments, get their associated orders
    if (invoiceResults && invoiceResults.length > 0) {
      const orderIds = invoiceResults
        .filter(p => p.bookingid) // Only include payments with bookingid
        .map(p => p.bookingid)
        .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

      if (orderIds.length > 0) {
        const ordersFromPayments = await orders.find({
          _id: { $in: orderIds }
        }).lean();

        // Add orders that aren't already in the results
        const existingOrderIds = new Set(allResults.map(o => o._id.toString()));
        const newOrders = ordersFromPayments.filter(
          order => !existingOrderIds.has(order._id.toString())
        );
        allResults.push(...newOrders);
      }

      // If no orders found but we have payments, return the payment info
      if (allResults.length === 0) {
        return res.status(200).json({
          success: true,
          statuscode: 200,
          message: "Payment found but no associated order",
          paymentDetails: invoiceResults,
          hasOrder: false
        });
      }
    }

    if (allResults.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "No orders found matching your search",
        error: "Not Found"
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: allResults.length > 1 ? "Orders found successfully" : "Order found successfully",
      data: allResults,
      hasOrder: true
    });

  } catch (error) {
    console.error("Error in searchOrders:", error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.updateUserOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        statuscode: 401,
        message: "Invalid Object ID",
        error: "Not Found",
      });
    }

    const { accept, CancelOrder } = req.body;

    const order_response = await orders.findById(id);
    if (!order_response) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Order not Found",
        error: "Not Found",
      });
    }
    const room = await rooms.findById(order_response.room_id);
    if (!room) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "Room not Found",
        error: "Not Found",
      });
    }

    if (order_response.status !== "requested_for_cancel") {
      return res.status(402).json({
        success: false,
        statuscode: 402,
        message: "user doesnot requested for cancel",
        error: "Not Authorized"
      });
    }
    if (accept === true || CancelOrder === true) {
      order_response.status = "cancelled";
      await order_response.save();
      //update accomidation 
      const guestCount = Number(order_response.guests) || 0;
      if (room.no_of_guests === guestCount) {
        room.beds_available = (Number(room.beds_available) || 0) + guestCount;
        room.rooms_available = (Number(room.rooms_available) || 0) + 1;
        await room.save();
      } else if (room.no_of_guests >= 1) {
        room.beds_available = (Number(room.beds_available) || 0) + guestCount;
        await room.save();
      }
      return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "order cancelled successfully",
      });
    }
    order_response.status = "confirmed";
    await order_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "order confirmed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      succcess: false,
      statuscode: 500,
      message: "Internal Server",
      error: error.message,
    });
  }
};





//view all completed orders:
exports.viewAllPendingOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        status: { $in: ["pending"] },
      })
      .populate("userId")
      .populate({
        path: "productId",
        populate: {
          path: "attributesid"
        }
      })
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No completed  orders",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "completed orders are retrieved ",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all refunded orders:
exports.viewAllRefundedOrders = async (req, res) => {
  try {
    const allorders = await orders
      .find({
        status: { $in: ["refunded"] },
      })
      .populate("userId")
      .populate({
        path: "productId",
        populate: {
          path: "attributesid"
        }
      })
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No refunded orders ",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "refunded orders are retrieved successfully ",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


// ✅Contact Us ✅

exports.viewallContactUsRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const contactUsRequests_response = await queryForm
      .find()
      .select("name email phone message _id subject")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    if (
      !contactUsRequests_response ||
      contactUsRequests_response.length === 0
    ) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "Requests are empty",
        error: "Not Found",
      });
    }
    const total = await queryForm.countDocuments();
    return res.status(200).json({
      succcess: true,
      statuscode: 2,
      page,
      data: contactUsRequests_response,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    })
  }
};

exports.replytomessage = async(req, res) => {
   try{
     const {id} = req.params;
     if(!id){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: "message id is required",
           error: "Not Found",
        })
     }
     const {reply} = req.body;
     if(!reply){
        return res.status(400).json({
           success: false,
           statuscode: 400,
           message: "reply is required",
           error: "Not Found",
        })
     }
     const findmessage = await queryForm.findById(id)
     if(!findmessage){
        return res.status(404).json({
           success: false,
           statuscode: 404,
           message: "message not found",
           error: "Not Found",
        })
     }
     await sendEmail({
           to: findmessage.email,
           subject: "Re: " + findmessage.subject ,
           text: contactFormResponse(findmessage.email,findmessage.subject,findmessage.message,reply),

     })
     return res.status(200).json({
        success: true,
        statuscode: 200,
        message: "message sent successfully",
     })

   }catch(error){
      return res.status(500).json({
         success: false,
         statuscode: 400,
         message: "Internal Server Error",
         error: error.message,
      })
   }
}


// ✅Admin Dashbord✅

exports.adminDashbord = async (req, res) => {
  try {
    //const totalCustomers = await users.countDocuments();
    const [totalCustomers,totalBookings,totalAccomodations,totalvendors] = await Promise.all([
        users.countDocuments(),
        orders.countDocuments(),
        accommodations.countDocuments(),
        vendors.countDocuments()
    ])
    const totalRevenue = await payments.aggregate([
      {
        $match: {
          payment_status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$bookingamount' }
        }
      }
    ])
    //const totalBookings = await orders.countDocuments();
    //const totalAccomodations = await products.countDocuments();
    //const totalvendors = await vendors.countDocuments();
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Admin Dashbord Data Fetched Successfully',
      data: {
        totalCustomers,
        totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        totalBookings,
        totalAccomodations,
        totalvendors,
      }
    })
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

exports.salesanalysis = async (req, res) => {
  try {
    const { type } = req.query;
    const {accommodationId} = req.query; 
    const {Users} = req.query;
    const {accomodations} = req.query;
    let groupId, format;
    
    if (type === "daily") {
      const now = new Date();
      startDate = new Date(now.setHours(0, 0, 0, 0));
      groupId = {
        $dateToString: { format: "%H:00", date: "$createdAt", timezone: "Asia/Kolkata" }
      };
      format = "%H:00";
    } else if (type === "weekly") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      groupId = {
        $dateToString: { format: "%w", date: "$createdAt", timezone: "Asia/Kolkata" }
      };
      format = "%w";
    } else if (type === "monthly") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      groupId = {
        $dateToString: { format: "%d-%b", date: "$createdAt", timezone: "Asia/Kolkata" }
      };
      format = "%d-%b";
    } else if (type === "yearly") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);
      groupId = {
        $dateToString: { format: "%b", date: "$createdAt", timezone: "Asia/Kolkata" }
      };
      format = "%b";
    }
    else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
     let data
     let unpaidData

    if(accommodationId){
      // console.log("Processing accommodation-specific sales for ID:", accommodationId);
      // console.log("Start date:", startDate);
      // console.log("Group ID:", groupId);
      
      // // First check if accommodation exists
      // const accommodationExists = await products.findById(accommodationId);
      // if (!accommodationExists) {
      //   console.log("Accommodation not found");
      //   return res.status(404).json({ success: false, message: "Accommodation not found" });
      // }

      // // Debug: Check if orders exist for this accommodation
      // const ordersForAccommodation = await orders.find({ accommodationId: accommodationId });
      // console.log("Orders found for accommodation:", ordersForAccommodation.length);

      // // Debug: Check each step of the aggregation
      // const step1 = await orders.aggregate([
      //     { $match: { accommodationId: new ObjectId(accommodationId) } }
      // ]);
      // console.log("Step 1 - Orders after match:", step1.length);

      // const step2 = await orders.aggregate([
      //     { $match: { accommodationId: new ObjectId(accommodationId) } },
      //     {
      //       $lookup: {
      //          from: "userpayments",
      //          localField: "paymentid",
      //          foreignField: "_id",
      //          as: "payment"
      //       }
      //     }
      // ]);
      // console.log("Step 2 - After lookup:", step2.length);
      // if (step2.length > 0) {
      //   console.log("Sample order with payment:", JSON.stringify(step2[0], null, 2));
      // }

      // const step3 = await orders.aggregate([
      //     { $match: { accommodationId: new ObjectId(accommodationId) } },
      //     {
      //       $lookup: {
      //          from: "userpayments",
      //          localField: "paymentid",
      //          foreignField: "_id",
      //          as: "payment"
      //       }
      //     },
      //     { $unwind: "$payment" }
      // ]);
      // console.log("Step 3 - After unwind:", step3.length);

      // const step4 = await orders.aggregate([
      //     { $match: { accommodationId: new ObjectId(accommodationId) } },
      //     {
      //       $lookup: {
      //          from: "userpayments",
      //          localField: "paymentid",
      //          foreignField: "_id",
      //          as: "payment"
      //       }
      //     },
      //     { $unwind: "$payment" },
      //     {
      //       $match: {
      //         "payment.createdAt": { $gte: startDate },
      //         "payment.payment_status": 'paid'
      //       }
      //     }
      // ]);
      // console.log("Step 4 - After payment filter:", step4.length);

      const all_orders = await orders.aggregate([
          {
            $match: {
              accommodationId: new ObjectId(accommodationId)
            }
          },
          {
            $lookup: {
               from: "userpayments",
               localField: "paymentid",
               foreignField: "_id",
               as: "payment"
            }
          },
          {
            $unwind: "$payment"
          },
          {
            $match: {
              "payment.createdAt": { $gte: startDate },
              "payment.payment_status": 'paid'
            }
          },
          {
            $group: {
               _id: groupId,
               totalRevenue: {$sum: "$payment.bookingamount"},
               count: {$sum: 1}
            }
          },
          {
            $project: {
              label: "$_id",
              totalRevenue: 1,
              count: 1
            }
          },
          { $sort: { label: 1 } }
      ])

      //console.log("Aggregation result:", all_orders);

      // const unpaidOrders = await orders.aggregate([
      //     {
      //       $match: {
      //          accommodation_id: new ObjectId(accommodationId)
      //       }
      //     },
      //     {
      //       $lookup: {
      //          from: "payments",
      //          localField: "payment_id",
      //          foreignField: "_id",
      //          as: "payment"
      //       }
      //     },
      //     {
      //       $unwind: "$payment"
      //     },
      //     {
      //       $match: {
      //         "payment.createdAt": { $gte: startDate },
      //         "payment.payment_status": 'unpaid'
      //       }
      //     },
      //     {
      //       $group: {
      //          _id: groupId,
      //          totalRevenue: {$sum: "$payment.orderamount"},
      //          count: {$sum: 1}
      //       }
      //     },
      //     {
      //       $project: {
      //         label: "$_id",
      //         totalRevenue: 1,
      //         count: 1
      //       }
      //     },
      //     { $sort: { label: 1 } }
      // ])

      data = all_orders
      //unpaidData = unpaidOrders
    }else if(Users === 'true'){
      const users_data = await users.aggregate([
            {
              $match: {
                 createdAt: { $gte: startDate }
              }
            },
            {
              $group: {
                 _id: groupId,
                 totalCustomers: { $sum: 1 }
              }
            },
            {
              $project: {
                label: "$_id",
                totalCustomers: 1
              }
            },
            { $sort: { label: 1 } }
      ])
      data = users_data
    }
    else if(accomodations === 'true'){
       const acoos_data = await products.aggregate([
             {
               $match: {
                 createdAt: {$gte: startDate},
               }
             },
             {
               $group: {
                  _id: groupId,
                  totalAccomodations: {$sum: 1}
               }
             },
             {
              $project: {
                 label: "$_id",
                 totalAccomodations: 1,

              }
             },
             { $sort: { label: 1 } }
       ])
       data = acoos_data
    }
    else{
        data = await payments.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              payment_status: 'paid'
            }
          },
          {
            $group: {
              _id: groupId,
              totalRevenue: { $sum: "$bookingamount" },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              label: "$_id",
              totalRevenue: 1,
              count: 1
            }
          },
          { $sort: { label: 1 } }
        ]);
        // unpaidData = await payments.aggregate([
        //   {
        //     $match: {
        //       createdAt: { $gte: startDate },
        //       payment_status: 'unpaid'
        //     }
        //   },
        //   {
        //     $group: {
        //       _id: groupId,
        //       totalRevenue: { $sum: "$orderamount" },
        //       count: { $sum: 1 }
        //     }
        //   },
        //   {
        //     $project: {
        //       label: "$_id",
        //       totalRevenue: 1,
        //       count: 1
        //     }
        //   },
        //   { $sort: { label: 1 } }
        // ]);
    }


    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Analysis Data Fetched Successfully',
      data: data,
      //unpaidData: unpaidData
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

//vendors related apis 
exports.getallvendors = async (req, res) => {
  try {
     const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;
    let { isVerified } = req.query
    if (isVerified === "true") isVerified = true;
    else if (isVerified === "false") isVerified = false;
    
    let query = {};
    if (isVerified === true) {
      query.isVerified = true;
    } else if (isVerified === false) {
      query.isVerified = false;
    }
    
    const total = await vendors.countDocuments(query);
    const allvendors = await vendors.find(query)
      .select("-password -otp -__v -otp_expiry -verify_expiry")
      .skip(skip)
      .limit(limit)
      .lean();
      
    if (!allvendors || allvendors.length === 0) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'No vendors found',
        error: 'Bad Request'
      })
    }
    
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: isVerified === true ? 'Verified Vendors fetched successfully' : 
                isVerified === false ? 'Unverified Vendors fetched successfully' : 
                'Vendors fetched successfully',
      data: allvendors,
      totalpages: Math.ceil(total/limit),
      total,
      currentpage: page
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}
exports.getvendorbyid = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Vendor id is required',
        error: 'Bad Request'
      })
    }
    const vendor = await vendors.findById(id)
      .lean()
    if (!vendor) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'No vendor found',
        error: 'Bad Request'
      })
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Vendor fetched successfully',
      data: vendor
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}
exports.updatevendor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Vendor id is required',
        error: 'Bad Request'
      })
    }
    const vendor = await vendors.findById(id)
      .lean()
    if (!vendor) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'No vendor found',
        error: 'Bad Request'
      })
    }
    const { status, isVerified } = req.body;
    let update 
    if(status || isVerified){
      update = await vendors.findByIdAndUpdate(id, { status, isVerified}, { new: true })
    }
    if (!update) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'No vendor found',
        error: 'Bad Request'
      })
    }
    //console.log(update)
    if (update.status === 'inactive') {
      //update the vendor's all hostels status to inactive
      const updateaccos = await accommodations.updateMany({ vendor_id: id }, { isverified: false })
      if (!updateaccos) {
        return res.status(400).json({
          success: false,
          statuscode: 400,
          message: 'No hostels found',
          error: 'Bad Request'
        })
      }
    } else if (update.status === 'active') {
      //update the vendor's all hostels status to active
      const updateaccos = await accommodations.updateMany({ vendor_id: id }, { isverified: true })
      if (!updateaccos) {
        return res.status(400).json({
          success: false,
          statuscode: 400,
          message: 'No hostels found',
          error: 'Bad Request'
        })
      }
    } 
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Vendor updated successfully',
      data: update
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}
exports.deletevendor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false, statuscode: 400,
        message: 'Vendor id is required'
      });
    }

    const vendor = await vendors.findByIdAndDelete(id);
    if (!vendor) {
      return res.status(400).json({
        success: false, statuscode: 400,
        message: 'No vendor found'
      });
    }

    // 1. Get all accommodations of vendor
    const accos = await accommodations.find({ vendor_id: id });

    // 2. Delete accommodations
    await accommodations.deleteMany({ vendor_id: id });

    // 3. Delete rooms + pricing only if accommodations exist
    if (accos.length > 0) {
      await rooms.deleteMany({ accommodation_id: { $in: accos.map(a => a._id) } });
      await pricings.deleteMany({ accommodation_id: { $in: accos.map(a => a._id) } });
    }

    // 4. Delete bookings
    await orders.deleteMany({ vendor_id: id });

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Vendor and all related records deleted successfully",
      vendor
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
exports.searchvendor = async (req, res) => {
  //console.log("=== SEARCH VENDOR FUNCTION CALLED ===");
  try {
    const { search } = req.query;
    //console.log("Search query:", search);
    
    if (!search) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: "search is required",
      })
    }
    
    const searchusers = await vendors.aggregate([
      {
        $addFields: {
          phoneString: { $toString: "$phone" }
        }
      },
      { 
        $match: {
          $or: [
            { full_name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phoneString: { $regex: search, $options: "i" } },
            { 'address.state': { $regex: search, $options: "i" } },
            { 'address.city': { $regex: search, $options: "i" } },
          ]
        }
      },
      {
        $project: {
          full_name: 1,
          email: 1,
          phone: 1,
          status: 1,
          _id: 1,
          address: 1
        }
      }
    ]);
    
    //console.log("Search results:", searchusers);
    
    if (!searchusers || searchusers.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 404,
        message: "user not found",
      })
    }
    
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "user retrieved successfully",
      data: searchusers,
    })
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

exports.addstay = async (req, res) => {
  try {
    const { staytype } = req.body;
    if (!staytype) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'Stay type is required',
        error: 'Bad Request'
      })
    }
    const stay = await staymodel.create({
      staytype,
    })
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Stay added successfully',
      data: stay
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

exports.getallstays = async (req, res) => {
  try {
    const allstays = await staymodel.find().lean()
    if (!allstays || allstays.length === 0) {
      return res.status(400).json({
        success: false,
        statuscode: 400,
        message: 'No stays found',
        error: 'Bad Request'
      })
    }
    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: 'Stays fetched successfully',
      data: allstays
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

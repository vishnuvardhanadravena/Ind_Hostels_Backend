const jwt = require("jsonwebtoken");
require("dotenv").config();
const users = require("../models/userschema.js");
const admins = require('../models/adminSchema.js')
const crypto = require('crypto');
const { error } = require("console");
const sitename = process.env.SITE_NAME;
const vendors = require('../models/vendors.js')
const { confirmbookingmail, invoiceTemplate } = require("../utils/emailTemplates.js");
const { sendEmail } = require("../utils/sendEmail.js");
const orders = require("../models/ordersSchema.js")
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});
//const pdf = require("html-pdf-node");





//generate a JsonWebToken for the user for the authentiction : 
exports.generateUserToken = (user) => {
  const data = {
    id: user._id,
    status: user.status,
  };
  const key = process.env.JWT_SECRET;
  const expiryOptions = { expiresIn: "1d" };
  // const expiryOptions = { expiresIn: "5m" };
  const token = jwt.sign(data, key, expiryOptions,{algorithm: "HS256"});
  return token;
};

exports.genrateVendorToken = (vendor) => {
  const data = {
    id: vendor._id,
    status: vendor.status
  };
  const key = process.env.JWT_SECRET
  const expiryOptions = { expiresIn: "1d" };

  const token = jwt.sign(data, key, expiryOptions,{algorithm: "HS256"});
  return token;
};

exports.vendorauthenticate = async (req, res, next) => {
  try {
    const bearerKey = req.headers["authorization"];

    if (!bearerKey) {
      return res.status(401).json({ erro: "please login" })
    }

    const token = bearerKey.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET,{algorithms: ["HS256"]})
    if (!decode) {
      return res.sstatus(401).json({ error: "Invalid token" })
    }
    const vendor = await vendors.findById(decode.id)

    if (vendor.status === 'Blocked') {
      return res.status(402).json({
        success: false,
        message: `Your account is Blocked, please Contact ${sitename} team`,
        error: "UnAuthorized"
      })
    }
    if (vendor.status !== "active") {
      return res
        .status(403)
        .json({ error: "Account is inactive. Please verify." });
    }
    req.vendor = vendor;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'session expired. Please login again.',
        expiredAt: error.expiredAt,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: error.message,
    });
  }
};

exports.isVendor = async (req, res, next) => {
  try {
    if (!(req.vendor.account_type === "vendor")) {
      return res.status(401).json({
        success: false,
        message: "you are not authorized",
        error: "Unauthorized"
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    })
  }
};

exports.isVendorVerifired = async (req, res, next) => {
  try {
    if (req.vendor.isVerified === false) {
      return res.status(401).json({
        success: false,
        message: "you are not verified, please contact to the admin",
        error: "Unauthorized"
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    })
  }
};



//authenticate user before every route  :
exports.authenticate = async (req, res, next) => {
  try {
    const bearerKey = req.headers["authorization"];
    //let user
    if (!bearerKey) {
      return res.status(401).json({ error: "please login" });
    }
    // Verify the token
    const token = bearerKey.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET,{algorithms: ["HS256"]});
    
    if (!decode) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    // Try to find user first, then vendor
    let user = await users.findById(decode.id);
    if (!user) {
      user = await vendors.findById(decode.id);
    }
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    // Check account status :
    if (user.status === 'Blocked') {
      return res.status(402).json({
        success: false,
        message: `Your account is Blocked, please Contact ${sitename} team`,
        error: "UnAuthorized"
      })
    }
    if (user.status !== "active") {
      return res
        .status(403)
        .json({ error: "Account is inactive. Please verify." });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'session expired. Please login again.',
        expiredAt: error.expiredAt,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: error.message,
    });
  }
};

exports.genrateotp = () => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  const otp_expiry = new Date(Date.now() + 1 * 60 * 1000);
  return { otp, otp_expiry };
};


exports.adminAuthenticate = async (req, res, next) => {
  try {
    const bearerKey = req.headers["authorization"];

    if (!bearerKey) {
      return res.status(401).json({ error: "please login" });
    }
    // Verify the token
    const token = bearerKey.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET,{algorithms: ["HS256"]});
    if (!decode) {
      return res.status(401).json({ error: "Invalid token" });
    }
    // Fetch user from DB
    const user = await admins.findById(decode.id);
    // Check account status :
    if (user.status !== "active") {
      return res
        .status(403)
        .json({ error: "Account is inactive. Please verify." });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        expiredAt: error.expiredAt,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: error.message,
    });
  }
};

//optional authentication if neede in the for the contact US : 
exports.authenticateifNeeded = async (req, res, next) => {

  const bearerKey = req.headers["authorization"];
  if (bearerKey && bearerKey.startsWith("Bearer ")) {
    const token = bearerKey.split(" ")[1];
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET,{algorithms: ["HS256"]});
      req.user = await users.findById(decode.id);
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();

};

//generate token for the user for the google authentication :
exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.emails[0].value },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

//verification for the google authenticated users :
exports.verifyGoogleUser = async (req, res, next) => {
  const bearerKey = req.headers["authorization"];
  if (!bearerKey) {
    return res.status(401).json({ error: "Login is required" });
  }
  //verify the bearer token
  const decode = jwt.verify(token, process.env.JWT_SECRET);
  const user = await users.findById(decode.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  req.user = user;
  next();
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (!(req.user.accountType === "admin" || req.user.accountType === "superadmin")) {
      return res.status(401).json({
        success: false,
        message: "you are not Authorized",
        error: "Unauthorized"
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    })
  }
};
exports.issuperadmin = async( req,res,next) => {
   try{
    if(!(req.user.accountType === "superadmin")){
      return res.status(401).json({
        success: false,
        message: "you are not Authorized,To access this module you need to be superadmin",
        error: "Unauthorized"
      })
    }
    next();
   }catch(error){
     return res.status(401).json({
       success: false,
       message: "Authentication failed",
       error: error.message,
     })
   }
}

// const key1 = Buffer.from(process.env.KEY1, 'utf8');
// const iv1 = Buffer.from(process.env.IV1, 'utf8');
// const key2 = Buffer.from(process.env.KEY2, 'utf8');
// const iv2 = Buffer.from(process.env.IV2, 'utf8');

function encryptLayer(text, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

exports.doubleEncrypt = async (plainText) => {
  const firstLayer = encryptLayer(plainText, key1, iv1);
};

exports.isVendorVerifired = async (req, res, next) => {
  try {
    if (req.vendor.isVerified === false) {
      return res.status(401).json({
        success: false,
        message: "you are not verified, please contact to the admin",
        error: "Unauthorized"
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    })
  }
};

exports.sendconformationmail = async (Order) => {
  try {
    const order = await orders.findOne({
      bookingId: Order.bookingId
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
    if (!order) {
      console.error("Order not found for bookingId:", Order.bookingId);
      return;
    }

    if (!order.userId || !order.userId.email) {
      console.error("User email not found for order:", order.bookingId);
      return;
    }
    const paymenthistory = await razorpay.payments.fetch(order.paymentid.paymentInfo.razorpay_payment_id);
    //console.log("Payment status:", payment.status);
    const invoice = invoiceTemplate(order, paymenthistory);

    const options = { format: "A4" };
    const file = { content: invoice };

    const pdfbufferdata = await pdf.generatePdf(file, options);

    await sendEmail({
      to: order.guestdetails.emailAddress,
      subject: "Booking Confirmation",
      text: confirmbookingmail(order),
      attachments: [
        {
          filename: "invoice.pdf",
          content: pdfbufferdata,
          contentType: "application/pdf"
        }
      ]
    });


    console.log("Booking confirmation email sent successfully to:", order.userId.email);

  } catch (error) {
    console.error("Failed to send confirmation email:", error.message);
  }
};

exports.normalizeDate = function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}






























// //authenticate user before every route  :
// exports.authenticate = async (req, res, next) => {
//   try {
//     const bearerKey = req.headers["authorization"];

//     if (!bearerKey) {
//       return res.status(401).json({ error: "please login" });
//     }
//     // Verify the token
//     const token = bearerKey.split(" ")[1];
//     const decode = jwt.verify(token, process.env.JWT_SECRET,{algorithms: ["HS256"]});
//     if (!decode) {
//       return res.status(401).json({ error: "Invalid token" });
//     }
//     // Fetch user from DB
//     const user = await users.findById(decode.id);
//     // Check account status :
//     if (user.status === 'Blocked') {
//       return res.status(402).json({
//         success: false,
//         message: `Your account is Blocked, please Contact ${sitename} team`,
//         error: "UnAuthorized"
//       })
//     }
//     if (user.status !== "active") {
//       return res
//         .status(403)
//         .json({ error: "Account is inactive. Please verify." });
//     }
//     req.user = user;
//     next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({
//         success: false,
//         message: 'session expired. Please login again.',
//         expiredAt: error.expiredAt,
//       });
//     }

//     return res.status(401).json({
//       success: false,
//       message: 'Invalid token.',
//       error: error.message,
//     });
//   }
// }

// exports.genrateotp = () => {
//   const otp = Math.floor(1000 + Math.random() * 9000);
//   const otp_expiry = new Date(Date.now() + 1 * 60 * 1000);
//   return { otp, otp_expiry };
// }


// exports.adminAuthenticate = async (req, res, next) => {
//   try {
//     const bearerKey = req.headers["authorization"];

//     if (!bearerKey) {
//       return res.status(401).json({ error: "please login" });
//     }
//     // Verify the token
//     const token = bearerKey.split(" ")[1];
//     const decode = jwt.verify(token, process.env.JWT_SECRET,{algorithms: ["HS256"]});
//     if (!decode) {
//       return res.status(401).json({ error: "Invalid token" });
//     }
//     // Fetch user from DB
//     const user = await admins.findById(decode.id);
//     // Check account status :
//     if (user.status !== "active") {
//       return res
//         .status(403)
//         .json({ error: "Account is inactive. Please verify." });
//     }
//     req.user = user;
//     next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({
//         success: false,
//         message: 'Token has expired. Please login again.',
//         expiredAt: error.expiredAt,
//       });
//     }
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid token.',
//       error: error.message,
//     });
//   }
// };

// //optional authentication if neede in the for the contact US : 
// exports.authenticateifNeeded = async (req, res, next) => {

//   const bearerKey = req.headers["authorization"];
//   if (bearerKey && bearerKey.startsWith("Bearer ")) {
//     const token = bearerKey.split(" ")[1];
//     try {
//       const decode = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await users.findById(decode.id);
//     } catch (error) {
//       req.user = null;
//     }
//   } else {
//     req.user = null;
//   }
//   next();

// };

// //generate token for the user for the google authentication :
// exports.generateToken = (user) => {
//   return jwt.sign(
//     { id: user.id, email: user.emails[0].value },
//     process.env.JWT_SECRET,
//     { expiresIn: "1d" }
//   );
// };

// //verification for the google authenticated users :
// exports.verifyGoogleUser = async (req, res, next) => {
//   const bearerKey = req.headers["authorization"];
//   if (!bearerKey) {
//     return res.status(401).json({ error: "Login is required" });
//   }
//   //verify the bearer token
//   const decode = jwt.verify(token, process.env.JWT_SECRET);
//   const user = await users.findById(decode.id);
//   if (!user) {
//     return res.status(404).json({ error: "User not found" });
//   }
//   req.user = user;
//   next();
// };

// exports.isAdmin = async (req, res, next) => {
//   try {
//     if (!(req.user.accountType === "admin")) {
//       return res.status(401).json({
//         success: false,
//         message: "you are not Authorized",
//         error: "Unauthorized"
//       });
//     }
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Authentication failed",
//       error: error.message,
//     })
//   }
// };


// // const key1 = Buffer.from(process.env.KEY1, 'utf8');
// // const iv1 = Buffer.from(process.env.IV1, 'utf8');
// // const key2 = Buffer.from(process.env.KEY2, 'utf8');
// // const iv2 = Buffer.from(process.env.IV2, 'utf8');

// function encryptLayer(text, key, iv) {
//   const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
//   let encrypted = cipher.update(text, 'utf8', 'base64');
//   encrypted += cipher.final('base64');
//   return encrypted;
// }

// exports.doubleEncrypt = async (plainText) => {
//   const firstLayer = encryptLayer(plainText, key1, iv1);
//   const secondLayer = encryptLayer(firstLayer, key2, iv2);
//   return secondLayer;
// };

// // exports.comparepassword =
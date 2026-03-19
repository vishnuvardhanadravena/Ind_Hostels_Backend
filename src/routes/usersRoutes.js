const express = require("express");
const router = express.Router();
const users = require("../models/userschema.js");
const jwt = require('jsonwebtoken');
const {profileImages} = require("../middlewares/multer.js"); 
const userImage = profileImages.single('image');
const User= require("../controllers/userControllers.js");
// const { ratingProduct } = require("../controllers/productsAuth.js");
const {authenticate,authenticateifNeeded} = require("../middlewares/authUser.js");
const passport = require("passport");
const catchAsync = require('../utils/catchAsync.js')
const orders = require("../controllers/ordersControllers.js")








//  Step 1: Google OAuth Login Route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

//  Step 2: Google OAuth Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/indhostels/auth/user/failed",
  }),
  async (req, res) => {
    if (!req.user) {
      return res.redirect("/indhostels/auth/user/google");
    }
    //extract token and user from the req.user
    const { user, token } = req.user;
    // If password is not set (new user via Google), redirect to set password
    const newUser = await users.findById(user._id);
    if (!newUser) {
      return res.status(404).json({
        success: false,
        message: "User not Found",
        error: "Not Found",
      });
    }
    res.redirect(
      `https://indhostel.com/?token=${token}&firstname=${newUser.firstname}&lastname=${newUser.lastname}&role=${newUser.accountType}&userId=${newUser._id}`
    );
  }
);

//  Step 4: Failure Route
router.get("/failed", (req, res) => {
  return res.status(401).json({ error: "Authentication Failed" });
});

// exports.getUserCredentials = async(req, res) => {
// try {
//   const {token, firstname, lastname, role, userId} = req.query;
//   if(!token || !firstname || !lastname || !role || !userId){
//     return res.status(401).json({
//       success: false,
//       message: "Data not found",
//       error: "Bad Request"
//     })
//   }

//   return res.status(200).json({
//     success: true
//   })
// } catch (error) {
  
// }
// }
router.post("/connect", User.connectwithus);
router.put("/google/:googleId", User.setNewPassword);
router.post("/signup", User.signUp);
router.post("/verify", User.verifiotp);
router.post("/verifyaccount", User.verifyaccount);
router.post("/resend", User.resendotp);
router.post("/signin", User.signIn);
router.put("/update", authenticate, User.update);
router.post("/profilepic", authenticate, userImage,User.uploadUserProfilePic);
router.get("/me", authenticate, User.getById);
router.post("/password/forget", User.forgetPassword);
router.post("/password/change", authenticate, User.changePassword);
router.put("/password/setnew", User.setPassword);
// router.delete("/delete", authenticate, deleteUser);
router.put("/logout", authenticate, User.signOut);
router.delete("/deleteaccount", authenticate, User.deleteaccount);
router.put("/deactivateaccount", authenticate, User.deactivateaccount);



//Contact_Us :
router.post("/query", authenticateifNeeded, User.contactUs);
//Notifications :
router.get("/notification", authenticateifNeeded, User.getnotificationsbyid);
router.get("/notification/:notificationid", authenticateifNeeded, User.getnotificationbyid);

// router.post("/skinquiz", authenticateifNeeded, skinquize);

router.post("/wishlist", authenticate, User.addtowishlist);
router.get("/getwishlist", authenticate, User.getwishlist);
router.delete("/deletewishlist", authenticate, User.deletewishlist);

router.get("/tackorder",authenticate,orders.trackorder) 

router.get("/dashboard", authenticate, User.userdashboard);
router.get('/allids',orders.getallids);
module.exports = router;

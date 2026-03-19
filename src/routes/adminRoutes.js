const express = require('express');
const router = express.Router();
// const upload = require('../middlewares/multer.js');
// const productmages = upload.array('images', 10);
const { accommodationImages, profileImages, blogImages, potImages, subcategoryImages, categoryImages, roomImages, documents, uploadAccom } = require('../middlewares/multer.js');
const productimages = accommodationImages.array('images', 10);
const profileimage = profileImages.single('image');
const roomimages = roomImages.array('images', 10);
const roomSingleImage = roomImages.single('image');
const document = documents.array('docs', 10);
const uploadAccomFiles = uploadAccom.fields([
  { name: "images", maxCount: 10 },
  { name: "docs", maxCount: 10 },
]);

const admin = require('../controllers/adminControllers.js')
const { authenticate, isAdmin, adminAuthenticate, isVendor, issuperadmin} = require('../middlewares/authUser.js');
const accommodations = require('../controllers/Accomodations.js');
const categories = require('../controllers/categoryControllers.js');
const subcategories = require('../controllers/subcategoryControllers.js')
const coupons = require('../controllers/coupons.js')
const orders = require('../controllers/ordersControllers.js')
const rooms = require('../controllers/Rooms.js')
const pricings = require('../controllers/PricingMatrix.js')
const amenities = require('../controllers/amenities.js')
const notifications = require('../controllers/notifications.js')
const tickets = require('../controllers/helpandsupport.js')





// users 
router.get('/users', adminAuthenticate, isAdmin, admin.viewAllUsers);
router.put('/user/:id', adminAuthenticate, isAdmin, admin.setUserInactive);
router.get('/user/:id', adminAuthenticate, isAdmin, admin.viewUser);
router.get('/searchuser', adminAuthenticate, isAdmin, admin.searchuser);
router.get('/connectedusers', adminAuthenticate, isAdmin, admin.getallconnectedusers)

// accommodations 

router.post('/accommodation', adminAuthenticate, isAdmin, uploadAccomFiles, accommodations.createAccommodation);
router.post('/accommodation/images/:id', adminAuthenticate, isAdmin, productimages, accommodations.addaccommodationimages)
router.delete('/accommodation/singleimage/:id', adminAuthenticate, isAdmin, accommodations.deletesingleimage)
router.patch('/accommodation/replaceproductimage/:id', adminAuthenticate, isAdmin, productimages, accommodations.replaceaccommodationimages)
router.get('/allaccommodations', adminAuthenticate, isAdmin, admin.getAllAccommodationForAdmim);
router.get('/accommodation/:id', adminAuthenticate, isAdmin, admin.getAccommodationByIdForAdmin);
router.patch('/accommodation/:id', adminAuthenticate, isAdmin, accommodations.updateAccommodation);
router.put('/accommodation/:id', adminAuthenticate, isAdmin, accommodations.updateImages);
router.delete('/accommodation/:id', adminAuthenticate, isAdmin, accommodations.deleteAccommodation);
//router.post('/accommodation/sendmail/:productname', adminAuthenticate, isAdmin, admin.sendnewProductMail)

// rooms 
router.post('/room/:id', adminAuthenticate, isAdmin, roomimages, rooms.createRoom);
router.put('/room/:id', adminAuthenticate, isAdmin, rooms.updateRoom);
router.delete('/room/:id', adminAuthenticate, isAdmin, rooms.deleteRoom)
router.get('/room/:id', adminAuthenticate, isAdmin, rooms.getallrooms)
router.patch('/room/singleimage/:id', adminAuthenticate, isAdmin, roomSingleImage, rooms.replacesingleimage)
router.delete('/room/singleimage/:id', adminAuthenticate, isAdmin, rooms.deletesingleimage)
router.post('/room/images/:id', adminAuthenticate, isAdmin, roomimages, rooms.addimagetoroom)


// contact us requests        
router.get('/contactus/requests', adminAuthenticate, isAdmin, admin.viewallContactUsRequests);
router.post('/contactus/reply/:id', adminAuthenticate, isAdmin, admin.replytomessage);
// orders 

//router.post('/bookings/invoice', adminAuthenticate, isAdmin, admin.searchUsingInvoiceNumber);
router.get('/bookings/recent/:accomid?', adminAuthenticate, isAdmin, admin.viewAllRecentOrders);
router.get('/bookings/refund', adminAuthenticate, isAdmin, admin.viewAllRefundedOrders);
router.get('/bookings/all/:accomid', adminAuthenticate, isAdmin, admin.viewAllUsersOrders);
router.get('/bookings/requested/cancel', adminAuthenticate, isAdmin, admin.viewAllCancelRequestedOrders);
router.get('/bookings/pending', adminAuthenticate, isAdmin, admin.viewAllPendingOrders);
router.put('/bookings/requested/confirm/:id', adminAuthenticate, isAdmin, admin.updateUserOrderById)
router.get('/bookings/search', adminAuthenticate, isAdmin, admin.searchOrders)
router.get('/bookings/:id', adminAuthenticate, isAdmin, orders.getBookingById)
//router.put('/bookings/:id', adminAuthenticate, isAdmin, admin.canceltheOrderById)
router.patch('/bookings/status/:id/:orderstatus?/:paymentstatus?', adminAuthenticate, isAdmin, orders.updateOrderStatus);

// payments 

// router.get('/payment/success', adminAuthenticate, isAdmin, viewAllSuccessPaymentOrders);
// router.get('/payment/pending', adminAuthenticate, isAdmin, viewAllUnSuccessPaymentOrders);

// Admin useres 

//router.get('/myProducts',adminAuthenticate, isAdmin, myProducts);
router.post('/signup', adminAuthenticate,issuperadmin,admin.adminSignup);
router.post('/superadminsignup', admin.superadminsignup);
router.post('/login', admin.adminLogin);
router.patch('/update', adminAuthenticate, isAdmin, admin.adminProfileUpdate);
router.post('/adminprofilepic', adminAuthenticate, isAdmin, profileimage, admin.uploadadminProfilePic)
router.patch('/password/update', adminAuthenticate, isAdmin, admin.changePassword);
// router.get('/admindata',  adminAuthenticate, isAdmin, getadmindata);
router.get('/admindata/:id', adminAuthenticate, isAdmin, admin.getadmindata)
router.post('/adminforgetpassword', admin.adminforgetpassword)
router.put('/adminsetnewpassword', admin.adminsetnewpassword)

// categories 

//router.post('/category',adminAuthenticate, isAdmin, categoryImages.single('image'),categories.createCategory);
router.post('/category', adminAuthenticate, isAdmin, categories.createCategory);
router.get('/category', adminAuthenticate, isAdmin, categories.getAllCategories);
//router.put('/updatecategory/:id', adminAuthenticate, isAdmin, categoryImages.single('image'),categories.updatecategory)
router.put('/updatecategory/:id', adminAuthenticate, isAdmin, categories.updatecategory)
router.delete('/deletecategory/:id', adminAuthenticate, isAdmin, categories.deletecategory)
// subcategories 
router.post('/createsubcategory', adminAuthenticate, isAdmin, subcategoryImages.single('image'), subcategories.createsubcategory)
router.get('/getsubcategories/:category', adminAuthenticate, isAdmin, subcategories.getsubcategoriesbycategory)
router.put('/updatesubcategory/:id', adminAuthenticate, isAdmin, subcategoryImages.single('image'), subcategories.updatesubcategory)
router.delete('/deletesubcategory/:id', adminAuthenticate, isAdmin, subcategories.deletesubcategory)
// coupon
router.post('/coupon', adminAuthenticate, isAdmin, coupons.addcoupon)
router.patch('/updatecoupon/:id', adminAuthenticate, isAdmin, coupons.updatecoupon)
router.get('/allcoupons', adminAuthenticate, isAdmin, coupons.viewallcoupons)
router.delete('/deletecoupon/:couponid', adminAuthenticate, isAdmin, coupons.deletecoupon)


// Admin Dashbord 
router.get('/dashboard', adminAuthenticate, isAdmin, admin.adminDashbord);
router.get('/salesanalytics', adminAuthenticate, isAdmin, admin.salesanalysis);

// Product Matrix 
router.post('/matrix/:accommodationid/:roomid', adminAuthenticate, isAdmin, pricings.createPricingMatrix);
router.patch('/matrix/:id', adminAuthenticate, isAdmin, pricings.updatePricingMatrix);
router.delete('/matrix/deleteprice/:id/:priceid', adminAuthenticate, isAdmin, pricings.deletePricingMatrix);
router.get('/matrix/:id', adminAuthenticate, isAdmin, pricings.getPricingMatrixById);

// Notification 
router.post('/notification', adminAuthenticate, isAdmin, notifications.createNotification);
router.put('/notification/:notid', adminAuthenticate, isAdmin, notifications.updateNotification);
router.delete('/notification/:notid', adminAuthenticate, isAdmin, notifications.deletenotification);
router.get('/notification', adminAuthenticate, isAdmin, notifications.getallnotifications);

// Stay 
router.post('/stay', adminAuthenticate, isAdmin, admin.addstay);
router.get('/allstays', adminAuthenticate, isAdmin, admin.getallstays);

// Amenities 
router.get('/amenities/accommodation', adminAuthenticate, isAdmin, amenities.getaccommodationamenities);
router.get('/amenities/room', adminAuthenticate, isAdmin, amenities.getroomamenities);
router.post('/amenities', adminAuthenticate, isAdmin, amenities.createAmenities);
router.put('/amenities/:id', adminAuthenticate, isAdmin, amenities.updateAmenities);
router.delete('/amenities/:id', adminAuthenticate, isAdmin, amenities.deleteAmenities);

// Vendor 
router.get('/vendors', adminAuthenticate, isAdmin, admin.getallvendors);
router.get('/vendor/search',adminAuthenticate, isAdmin,admin.searchvendor)
router.get('/vendor/:id', adminAuthenticate, isAdmin, admin.getvendorbyid);
router.put('/vendor/update/:id', adminAuthenticate, isAdmin, admin.updatevendor);
router.delete('/vendor/delete/:id', adminAuthenticate, isAdmin, admin.deletevendor); 

//help and support 
router.get("/helpandsupport/get-all-tickets-and-messages", adminAuthenticate, isAdmin, tickets.getAllTicketsandmessages);
router.get("/helpandsupport/get-messages/:ticketId", adminAuthenticate, isAdmin, tickets.getmessagesofTicket);
router.post("/helpandsupport/reply-message/:ticketId", adminAuthenticate, isAdmin, tickets.replymessage);
module.exports = router;
const express = require('express');
const router = express.Router() 
const vendorpro = require('../controllers/vendor/vendorprofile') 
const auth = require('../middlewares/authUser')
const { profileImages,documents} = require('../middlewares/multer') 
const profile = profileImages.single('profileimage')
const {isVendor} = require('../middlewares/authUser')
const properties = require('../controllers/vendor/properties')
const admin = require('../controllers/adminControllers.js')
const { accommodationImages, roomImages } = require('../middlewares/multer.js');
const productimages = accommodationImages.array('images', 10);
const roomimages = roomImages.array('images', 10);
const roomSingleImage = roomImages.single('image');
const accommodations = require('../controllers/Accomodations.js');
const rooms = require('../controllers/Rooms.js')
const pricings = require('../controllers/PricingMatrix.js');
const orders = require('../controllers/ordersControllers.js')
const Documents = documents.array('docs', 5);
const coupons = require('../controllers/coupons.js'); 
const amenities = require('../controllers/amenities.js')
const categories = require('../controllers/categoryControllers.js')

router.post('/vendorregister',Documents,vendorpro.vendorsignup);
router.post('/vendorlogin',vendorpro.vendorlogin);
router.post('/verifi',vendorpro.vendorverifiotp);
router.get('/profile',auth.vendorauthenticate,vendorpro.getvendorprofile);
router.post('/profileimage',auth.vendorauthenticate,profile,vendorpro.uploadprofileimage);
router.post('/changepassword',auth.vendorauthenticate,vendorpro.changepassword);
router.post('/forgetpassword',vendorpro.vendorforgetpassword);
router.post('/resetpassword',vendorpro.resetpassword);
router.patch('/updateprofile',auth.vendorauthenticate,vendorpro.updatevendor);
router.patch('/updatebankdetails/:id',auth.vendorauthenticate,vendorpro.updatebankdetails);

router.post('/createproperty', auth.vendorauthenticate, isVendor, auth.isVendorVerifired, productimages, properties.createAccommodation);
router.get('/allproperties',auth.vendorauthenticate,isVendor,properties.getvendorsproperties);
router.get('/property/:id', auth.vendorauthenticate, isVendor, admin.getAccommodationByIdForAdmin);
router.post('/property/images/:id', auth.vendorauthenticate, isVendor, productimages, accommodations.addaccommodationimages);
router.delete('/property/singleimage/:id', auth.vendorauthenticate, isVendor, accommodations.deletesingleimage);
router.patch('/property/replaceproductimage/:id', auth.vendorauthenticate, isVendor, productimages, accommodations.replaceaccommodationimages);
router.patch('/updateproperty/:id', auth.vendorauthenticate, isVendor, properties.updateAccommodation);
router.delete('/deleteproperty/:id', auth.vendorauthenticate, isVendor, accommodations.deleteAccommodation);

router.post('/propertyrooms/:id', auth.vendorauthenticate, isVendor, roomimages, rooms.createRoom);
router.put('/room/:id', auth.vendorauthenticate, isVendor, rooms.updateRoom);
router.delete('/room/:id', auth.vendorauthenticate, isVendor, rooms.deleteRoom);
router.patch('/room/singleimage/:id', auth.vendorauthenticate, isVendor, roomSingleImage, rooms.replacesingleimage);
router.delete('/room/singleimage/:id', auth.vendorauthenticate, isVendor, rooms.deletesingleimage);
router.post('/room/images/:id', auth.vendorauthenticate, isVendor, roomimages, rooms.addimagetoroom);


router.post('/matrix/:accommodationid/:roomid', auth.vendorauthenticate, isVendor, pricings.createPricingMatrix);
router.patch('/matrix/:id', auth.vendorauthenticate, isVendor, pricings.updatePricingMatrix);
router.get('/matrix/:id', auth.vendorauthenticate, isVendor, pricings.getPricingMatrixById); 
router.delete('/matrix/deleteprice/:id/:priceid', auth.vendorauthenticate, isVendor, pricings.deletePricingMatrix);

router.get('/bookings', auth.vendorauthenticate, isVendor, properties.getvendorbookings);
router.get('/cancelbookings', auth.vendorauthenticate, isVendor, properties.getcancelrequestbookings);
router.put('/bookings/requested/confirm/:id', auth.vendorauthenticate, isVendor, admin.updateUserOrderById);
router.get('/bookings/:id', auth.vendorauthenticate, isVendor, properties.getBookingById);
router.patch('/bookings/status/:id/:orderstatus?/:paymentstatus?', auth.vendorauthenticate, isVendor, orders.updateOrderStatus);
router.get('/vendordashbord', auth.vendorauthenticate, isVendor, properties.vendordashbord);
router.get('/salesanalysis',auth.vendorauthenticate,isVendor,properties.salesanalysis);

router.post('/add-coupon',auth.vendorauthenticate,isVendor,coupons.addcoupon);
router.get('/all-coupons',auth.vendorauthenticate,isVendor,coupons.viewallcoupons); 
router.patch('/update-coupon/:id',auth.vendorauthenticate,isVendor,coupons.updatecoupon); 
router.delete('/delete-coupon/:couponid',auth.vendorauthenticate,isVendor,coupons.deletecoupon);

router.get('/get-all-tickets',auth.vendorauthenticate,isVendor,properties.gettickets);
router.get('/get-messages-of-ticket/:ticketId',auth.vendorauthenticate,isVendor,properties.getmessagesofTicket);
router.post('/reply-message/:ticketId',auth.vendorauthenticate,isVendor,properties.replymessage);
//router.delete('delete-ticket/:ticketId',auth.vendorauthenticate,isVendor,properties.deleteticket);


router.get('/allstays', admin.getallstays);
router.get('/amenities/accommodation', amenities.getaccommodationamenities);
router.get('/amenities/room', amenities.getroomamenities);

router.get('/category',  categories.getAllCategories);
 module.exports = router;
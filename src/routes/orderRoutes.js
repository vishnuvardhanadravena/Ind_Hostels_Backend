const express= require('express');
const { authenticate } = require('../middlewares/authUser');
const router = express.Router();
const orders = require('../controllers/ordersControllers.js');

router.post('/verify-payment', authenticate, orders.verifyPayment);
router.put('/cancel/:id', authenticate, orders.cancelOrder);
router.get('/mybookings', authenticate, orders.viewAllOrders); 
//router.get('/lastaddress', authenticate, orders.getLastAddress);

router.post('/generate-invoice/:id', authenticate, orders.genrateInvoice);
router.post('/:id', authenticate, orders.makeOrder);
router.get('/:id', authenticate, orders.getBookingById);
router.post('/:accoid/:roomid', authenticate, orders.makebooking);

// payment routes : 
module.exports = router;
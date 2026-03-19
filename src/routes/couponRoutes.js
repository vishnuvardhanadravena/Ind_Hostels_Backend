const express = require('express');
const { authenticate } = require('../middlewares/authUser');
const coupons = require('../controllers/ordersControllers');

const router = express.Router();

// Apply coupon route
router.post('/apply', authenticate, coupons.ApplyCoupon);
router.get('/all', authenticate, coupons.GetAllCoupons);
router.get('/search', authenticate, coupons.searchcoupon);
module.exports = router;
